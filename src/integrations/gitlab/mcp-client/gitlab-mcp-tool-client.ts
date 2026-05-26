import fs from "fs";
import path from "path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import type { AppConfig } from "../../../shared/config/app-config";
import type {
  GitLabToolName,
  ToolExecutionResult,
} from "../types/gitlab-tool.types";
import type {
  ToolExecutionFailure,
} from "../types/gitlab-tool.types";
import { toolFailure } from "../tools/tool-result-helpers";
import { PROJECT_ROOT } from "../../../prompt-engine/paths/resolve-paths";
import type { McpToolClient } from "../../mcp/mcp-tool-client";

const SUPPORTED_GITLAB_TOOLS: GitLabToolName[] = [
  "create_branch",
  "commit_code",
  "create_merge_request",
];

function isGitLabToolName(toolName: string): toolName is GitLabToolName {
  return SUPPORTED_GITLAB_TOOLS.includes(toolName as GitLabToolName);
}

function mcpDebug(message: string, details?: unknown): void {
  if (process.env.MCP_DEBUG !== "1") {
    return;
  }
  const suffix =
    details === undefined ? "" : ` ${JSON.stringify(details)}`;
  console.error(`[mcp:gitlab] ${message}${suffix}`);
}

function pickStringEnv(env: NodeJS.ProcessEnv, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const v = env[key];
    if (typeof v === "string" && v.length > 0) {
      out[key] = v;
    }
  }
  return out;
}

function resolveGitLabMcpServerSpawn(): { command: string; args: string[] } {
  const srcEntry = path.join(
    PROJECT_ROOT,
    "src",
    "integrations",
    "gitlab",
    "mcp-server",
    "index.ts",
  );
  const tsxBin = path.join(PROJECT_ROOT, "node_modules", ".bin", "tsx");

  // Prefer tsx + source: Node ESM `dist/` output currently omits `.js` extensions on relative imports.
  if (fs.existsSync(tsxBin) && fs.existsSync(srcEntry)) {
    return { command: tsxBin, args: [srcEntry] };
  }

  const distEntry = path.join(
    PROJECT_ROOT,
    "dist",
    "integrations",
    "gitlab",
    "mcp-server",
    "index.js",
  );

  if (fs.existsSync(distEntry)) {
    return { command: "node", args: [distEntry] };
  }

  throw new Error(
    "GitLab MCP server entry not found. Run `npm run build` or ensure src/integrations/gitlab/mcp-server exists.",
  );
}

export class GitLabMcpToolClient implements McpToolClient<ToolExecutionResult> {
  private mcpClient: Client | null = null;
  private anthropicToolsCache: Tool[] | null = null;
  private mcpToolNameSet = new Set<string>();

  constructor(private readonly config: AppConfig) {}

  async getAnthropicTools(): Promise<Tool[]> {
    if (this.anthropicToolsCache) {
      return this.anthropicToolsCache;
    }

    await this.ensureConnected();

    // `listTools()` is already used in ensureConnected() to fill `mcpToolNameSet`.
    // We call it again to get tool definitions for mapping.
    const { tools } = await this.mcpClient!.listTools();
    const mapped: Tool[] = tools.map((tool): Tool => {
      return {
        name: tool.name,
        description: tool.description,
        // MCP tool inputSchema maps directly to Anthropic's `input_schema`.
        input_schema: tool.inputSchema as any,
      };
    });

    // Filter to only the tools we know how to interpret into GitLab ToolExecutionResult.
    this.anthropicToolsCache = mapped.filter((t) =>
      isGitLabToolName(t.name),
    );

    mcpDebug("listTools mapped for Claude", {
      discovered: tools.map((t) => t.name),
      exposed: this.anthropicToolsCache.map((t) => t.name),
    });

    return this.anthropicToolsCache;
  }

  async executeTool(toolName: string, input: unknown): Promise<ToolExecutionResult> {
    try {
      await this.ensureConnected();

      if (!this.mcpToolNameSet.has(toolName)) {
        return toolFailure("create_branch", `Unknown MCP tool: ${toolName}`);
      }

      mcpDebug("callTool", { name: toolName, arguments: input });

      const response = await this.mcpClient!.callTool({
        name: toolName,
        arguments: (input ?? {}) as Record<string, unknown>,
      });

      if ((response as any).isError) {
        const message =
          (response as any).content?.find((b: any) => b.type === "text")
            ?.text ?? "unknown error";
        return toolFailure("create_branch", `MCP callTool error: ${message}`);
      }

      // Most common case: a single text block containing JSON.
      const anyResponse = response as any;
      const text = Array.isArray(anyResponse.content)
        ? anyResponse.content.find((b: any) => b.type === "text")?.text
        : undefined;

      if (typeof text === "string") {
        const parsed = JSON.parse(text) as ToolExecutionResult;
        // Basic sanity-check so Claude always receives a well-formed ToolExecutionResult.
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "ok" in parsed &&
          "tool" in parsed
        ) {
          mcpDebug("callTool result", {
            tool: parsed.tool,
            ok: parsed.ok,
            web_url:
              parsed.ok && "data" in parsed && parsed.data && "web_url" in parsed.data
                ? (parsed.data as { web_url?: string }).web_url
                : undefined,
          });
          return parsed;
        }
        return this.makeParseFailure(toolName, "Invalid JSON result from MCP tool.");
      }

      if ("toolResult" in anyResponse) {
        // SDK sometimes returns raw toolResult for structured output.
        return anyResponse.toolResult as ToolExecutionResult;
      }

      return this.makeParseFailure(
        toolName,
        `MCP tool result for "${toolName}" contained no parseable content.`,
      );
    } catch (error: unknown) {
      return this.makeParseFailure(
        toolName,
        `MCP callTool crashed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.mcpClient) {
      return;
    }

    const transportParams = resolveGitLabMcpServerSpawn();
    mcpDebug("spawning GitLab MCP server", transportParams);

    const env = pickStringEnv(process.env, [
      "GITLAB_TOKEN",
      "GITLAB_BASE_URL",
      "GITLAB_PROJECT_ID",
      "GITLAB_DEFAULT_BRANCH",
      "TARGET_PROJECT_PATH",
      "TELEGRAM_BOT_TOKEN",
      "ANTHROPIC_API_KEY",
      "CLAUDE_MODEL",
    ]);

    // Override with runtime config values to make it explicit.
    env.GITLAB_TOKEN = this.config.gitlabToken;
    env.GITLAB_BASE_URL = this.config.gitlabBaseUrl;
    env.GITLAB_PROJECT_ID = this.config.gitlabProjectId;
    env.GITLAB_DEFAULT_BRANCH = this.config.gitlabDefaultBranch;
    env.TARGET_PROJECT_PATH = this.config.targetProjectPath;
    env.CLAUDE_MODEL = this.config.claudeModel;

    const transport = new StdioClientTransport({
      command: transportParams.command,
      args: transportParams.args,
      env,
      stderr: "inherit",
    });

    this.mcpClient = new Client(
      { name: "claude-gitlab-mcp-client", version: "1.0.0" },
      { capabilities: {} },
    );

    await this.mcpClient.connect(transport);
    const { tools } = await this.mcpClient.listTools();
    this.mcpToolNameSet = new Set(tools.map((t: any) => t.name));
    mcpDebug("listTools on connect", { tools: [...this.mcpToolNameSet] });
  }

  private makeParseFailure(toolName: string, message: string): ToolExecutionResult {
    if (isGitLabToolName(toolName)) {
      return toolFailure(toolName, message);
    }
    // Fallback shape for unexpected tool names.
    const failure: ToolExecutionFailure = {
      ok: false,
      tool: "create_branch",
      error: message,
    };
    return failure;
  }
}

