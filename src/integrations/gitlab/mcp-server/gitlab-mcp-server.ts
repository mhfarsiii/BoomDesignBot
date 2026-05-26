import path from "path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { AppConfig } from "../../../shared/config/app-config";
import { createBranch } from "../operations/create-branch.operation";
import { commitCode } from "../operations/commit-code.operation";
import { createMergeRequest } from "../operations/create-merge-request.operation";

function loadGitLabServerConfig(): AppConfig {
  // The MCP server only needs GitLab settings + target path.
  // We still populate the full AppConfig shape to keep existing operations unchanged.
  const projectRoot = path.resolve(process.cwd());

  const gitlabToken = process.env.GITLAB_TOKEN;
  const gitlabProjectId = process.env.GITLAB_PROJECT_ID;
  if (!gitlabToken || !gitlabProjectId) {
    throw new Error(
      "Missing required env for GitLab MCP server: GITLAB_TOKEN, GITLAB_PROJECT_ID",
    );
  }

  return {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
    claudeModel: process.env.CLAUDE_MODEL ?? "claude-haiku-4-5",
    gitlabToken,
    gitlabBaseUrl: process.env.GITLAB_BASE_URL ?? "https://gitlab.com/api/v4",
    gitlabProjectId,
    gitlabDefaultBranch: process.env.GITLAB_DEFAULT_BRANCH ?? "main",
    targetProjectPath: process.env.TARGET_PROJECT_PATH ?? projectRoot,
  };
}

export async function startGitLabMcpServer(): Promise<void> {
  const config = loadGitLabServerConfig();

  const server = new McpServer(
    { name: "gitlab-mcp-server", version: "1.0.0" },
    // Capabilities are declared by McpServer internally; this option is still forwarded.
    { capabilities: { tools: { listChanged: true } } },
  );

  server.registerTool(
    "create_branch",
    {
      description: "Create a new Git branch in the configured GitLab project.",
      inputSchema: z
        .object({
          branch_name: z.string().describe("Name of the new branch (e.g. feature/add-widget)."),
          ref: z
            .string()
            .describe("Optional source ref (branch name or commit SHA).")
            .optional(),
        })
        .strict(),
    },
    async (args) => {
      const result = await createBranch(config, args);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "commit_code",
    {
      description:
        "Create or update a single file on a branch via a GitLab repository commit.",
      inputSchema: z
        .object({
          branch_name: z.string().describe("Target branch for the commit."),
          file_path: z.string().describe("Repository-relative file path."),
          file_content: z.string().describe("Full file contents to commit."),
          commit_message: z.string().describe("Git commit message."),
        })
        .strict(),
    },
    async (args) => {
      const result = await commitCode(config, args);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "create_merge_request",
    {
      description:
        "Open a GitLab merge request from a feature branch into a target branch.",
      inputSchema: z
        .object({
          source_branch: z.string().describe("Branch containing your changes."),
          target_branch: z.string().describe("Branch to merge into (e.g. main)."),
          title: z.string().describe("Merge request title."),
          description: z.string().describe("Merge request description (markdown)."),
        })
        .strict(),
    },
    async (args) => {
      const result = await createMergeRequest(config, args);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Keep the process alive while the stdio transport is active.
  // The transport listeners are attached to stdin/stdout; this ensures Node won't exit.
  const shutdown = async () => {
    try {
      await server.close();
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await new Promise(() => undefined);
}

