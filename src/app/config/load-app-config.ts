import path from "path";
import type { AppConfig } from "../../shared/config/app-config";
import { PROJECT_ROOT } from "../../prompt-engine/paths/resolve-paths";

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
    "Missing GitHub repository config. Set GITHUB_REPOSITORY=owner/repo or both GITHUB_OWNER and GITHUB_REPO.",
  );
}

export function loadAppConfig(): AppConfig {
  const { owner, repo } = parseGithubRepository();

  const required: Array<[keyof AppConfig, string | undefined]> = [
    ["telegramBotToken", process.env.TELEGRAM_BOT_TOKEN],
    ["anthropicApiKey", process.env.ANTHROPIC_API_KEY],
    ["githubToken", process.env.GITHUB_TOKEN],
    ["githubOwner", owner],
    ["githubRepo", repo],
  ];

  const missing = required
    .filter(([, value]) => !value || value.trim() === "")
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Copy .env.example to .env and fill values.`,
    );
  }

  return {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    claudeModel: process.env.CLAUDE_MODEL ?? "claude-haiku-4-5",
    githubToken: process.env.GITHUB_TOKEN!,
    githubOwner: owner,
    githubRepo: repo,
    githubApiBaseUrl:
      process.env.GITHUB_API_BASE_URL ?? "https://api.github.com",
    githubDefaultBranch: process.env.GITHUB_DEFAULT_BRANCH ?? "main",
    targetProjectPath: path.resolve(
      process.env.TARGET_PROJECT_PATH ?? PROJECT_ROOT,
    ),
  };
}
