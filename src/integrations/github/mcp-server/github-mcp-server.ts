import path from "path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { AppConfig } from "../../../shared/config/app-config";
import { createBranch } from "../operations/create-branch.operation";
import { commitCode } from "../operations/commit-code.operation";
import { createPullRequest } from "../operations/create-pull-request.operation";

function parseGithubRepository(): { owner: string; repo: string } {
  const combined = process.env.GITHUB_REPOSITORY?.trim();
  if (combined?.includes("/")) {
    const [owner, repo] = combined.split("/", 2);
    if (owner && repo) {
      return { owner, repo };
    }
  }

  const owner = process.env.GITHUB_OWNER?.trim();
  const repo = process.env.GITHUB_REPO?.trim();
  if (owner && repo) {
    return { owner, repo };
  }

  throw new Error(
    "Missing GitHub repo config. Set GITHUB_REPOSITORY=owner/repo or GITHUB_OWNER + GITHUB_REPO.",
  );
}

function loadGitHubServerConfig(): AppConfig {
  const projectRoot = path.resolve(process.cwd());
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error("Missing required env for GitHub MCP server: GITHUB_TOKEN");
  }

  const { owner, repo } = parseGithubRepository();

  return {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
    claudeModel: process.env.CLAUDE_MODEL ?? "claude-haiku-4-5",
    githubToken,
    githubOwner: owner,
    githubRepo: repo,
    githubApiBaseUrl:
      process.env.GITHUB_API_BASE_URL ?? "https://api.github.com",
    githubDefaultBranch: process.env.GITHUB_DEFAULT_BRANCH ?? "main",
    targetProjectPath: process.env.TARGET_PROJECT_PATH ?? projectRoot,
  };
}

export async function startGitHubMcpServer(): Promise<void> {
  const config = loadGitHubServerConfig();

  const server = new McpServer(
    { name: "github-mcp-server", version: "1.0.0" },
    { capabilities: { tools: { listChanged: true } } },
  );

  server.registerTool(
    "create_branch",
    {
      description:
        "Create a new Git branch in the configured GitHub repository.",
      inputSchema: z
        .object({
          branch_name: z
            .string()
            .describe("Name of the new branch (e.g. feature/add-widget)."),
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
        "Create or update a single file on a branch via the GitHub Contents API.",
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
    "create_pull_request",
    {
      description:
        "Open a GitHub pull request from a feature branch into a target branch.",
      inputSchema: z
        .object({
          source_branch: z.string().describe("Branch containing your changes."),
          target_branch: z.string().describe("Branch to merge into (e.g. main)."),
          title: z.string().describe("Pull request title."),
          description: z.string().describe("Pull request description (markdown)."),
        })
        .strict(),
    },
    async (args) => {
      const result = await createPullRequest(config, args);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

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
