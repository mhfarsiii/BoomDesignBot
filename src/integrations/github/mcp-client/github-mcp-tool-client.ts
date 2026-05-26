import fs from "fs";
import path from "path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import type { AppConfig } from "../../../shared/config/app-config";
import type {
  GitHubToolName,
  ToolExecutionFailure,
  ToolExecutionResult,
} from "../types/github-tool.types";
import { toolFailure } from "../tools/tool-result-helpers";
import { extractChangeRequestUrl } from "../../vcs/extract-change-request-url";
import { PROJECT_ROOT } from "../../../prompt-engine/paths/resolve-paths";
import type { McpToolClient } from "../../mcp/mcp-tool-client";

const SUPPORTED_GITHUB_TOOLS: GitHubToolName[] = [
  "create_branch",
  "commit_code",
  "create_pull_request",
];

function isGitHubToolName(toolName: string): toolName is GitHubToolName {
  return SUPPORTED_GITHUB_TOOLS.includes(toolName as GitHubToolName);
}

function mcpDebug(message: string, details?: unknown): void {
  if (process.env.MCP_DEBUG !== "1") {
    return;
  }
  const suffix =
    details === undefined ? "" : ` ${JSON.stringify(details)}`;
  console.error(`[mcp:github] ${message}${suffix}`);
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

function resolveGitHubMcpServerSpawn(): { command: string; args: string[] } {
  const srcEntry = path.join(
    PROJECT_ROOT,
    "src",
    "integrations",
    "github",
    "mcp-server",
    "index.ts",
  );
  const tsxBin = path.join(PROJECT_ROOT, "node_modules", ".bin", "tsx");

  if (fs.existsSync(tsxBin) && fs.existsSync(srcEntry)) {
    return { command: tsxBin, args: [srcEntry] };
  }

  const distEntry = path.join(
    PROJECT_ROOT,
    "dist",
    "integrations",
    "github",
    "mcp-server",
    "index.js",
  );

  if (fs.existsSync(distEntry)) {
    return { command: "node", args: [distEntry] };
  }

  throw new Error(
    "GitHub MCP server entry not found. Run `npm run build` or ensure src/integrations/github/mcp-server exists.",
  );
}

export class GitHubMcpToolClient implements McpToolClient<ToolExecutionResult> {
  private mcpClient: Client | null = null;
  private anthropicToolsCache: Tool[] | null = null;
  private mcpToolNameSet = new Set<string>();

  constructor(private readonly config: AppConfig) {}

  async getAnthropicTools(): Promise<Tool[]> {
    if (this.anthropicToolsCache) {
      return this.anthropicToolsCache;
    }

    await this.ensureConnected();

    const { tools } = await this.mcpClient!.listTools();
    const mapped: Tool[] = tools.map((tool): Tool => {
      return {
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema as Tool["input_schema"],
      };
    });

    this.anthropicToolsCache = mapped.filter((t) => isGitHubToolName(t.name));

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

      if ((response as { isError?: boolean }).isError) {
        const message =
          (response as { content?: Array<{ type?: string; text?: string }> })
            .content?.find((block) => block.type === "text")?.text ??
          "unknown error";
        return toolFailure(
          isGitHubToolName(toolName) ? toolName : "create_branch",
          `MCP callTool error: ${message}`,
        );
      }

      const anyResponse = response as {
        content?: Array<{ type?: string; text?: string }>;
        toolResult?: ToolExecutionResult;
      };
      const text = Array.isArray(anyResponse.content)
        ? anyResponse.content.find((block) => block.type === "text")?.text
        : undefined;

      if (typeof text === "string") {
        const parsed = JSON.parse(text) as ToolExecutionResult;
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
              parsed.ok && "data" in parsed
                ? extractChangeRequestUrl(parsed.data)
                : undefined,
          });
          return parsed;
        }
        return this.makeParseFailure(toolName, "Invalid JSON result from MCP tool.");
      }

      if ("toolResult" in anyResponse && anyResponse.toolResult) {
        return anyResponse.toolResult;
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

    const transportParams = resolveGitHubMcpServerSpawn();
    mcpDebug("spawning GitHub MCP server", transportParams);

    const env = pickStringEnv(process.env, [
      "GITHUB_TOKEN",
      "GITHUB_OWNER",
      "GITHUB_REPO",
      "GITHUB_REPOSITORY",
      "GITHUB_API_BASE_URL",
      "GITHUB_DEFAULT_BRANCH",
      "TARGET_PROJECT_PATH",
      "TELEGRAM_BOT_TOKEN",
      "ANTHROPIC_API_KEY",
      "CLAUDE_MODEL",
    ]);

    env.GITHUB_TOKEN = this.config.githubToken;
    env.GITHUB_OWNER = this.config.githubOwner;
    env.GITHUB_REPO = this.config.githubRepo;
    env.GITHUB_API_BASE_URL = this.config.githubApiBaseUrl;
    env.GITHUB_DEFAULT_BRANCH = this.config.githubDefaultBranch;
    env.TARGET_PROJECT_PATH = this.config.targetProjectPath;
    env.CLAUDE_MODEL = this.config.claudeModel;
    env.GITHUB_REPOSITORY = `${this.config.githubOwner}/${this.config.githubRepo}`;

    const transport = new StdioClientTransport({
      command: transportParams.command,
      args: transportParams.args,
      env,
      stderr: "inherit",
    });

    this.mcpClient = new Client(
      { name: "claude-github-mcp-client", version: "1.0.0" },
      { capabilities: {} },
    );

    await this.mcpClient.connect(transport);
    const { tools } = await this.mcpClient.listTools();
    this.mcpToolNameSet = new Set(tools.map((tool) => tool.name));
    mcpDebug("listTools on connect", { tools: [...this.mcpToolNameSet] });
  }

  private makeParseFailure(toolName: string, message: string): ToolExecutionResult {
    if (isGitHubToolName(toolName)) {
      return toolFailure(toolName, message);
    }

    const failure: ToolExecutionFailure = {
      ok: false,
      tool: "create_branch",
      error: message,
    };
    return failure;
  }
}
