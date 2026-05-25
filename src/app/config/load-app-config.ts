import type { AppConfig } from "../../shared/config/app-config";

export function loadAppConfig(): AppConfig {
  const required: Array<[keyof AppConfig, string | undefined]> = [
    ["telegramBotToken", process.env.TELEGRAM_BOT_TOKEN],
    ["anthropicApiKey", process.env.ANTHROPIC_API_KEY],
    ["gitlabToken", process.env.GITLAB_TOKEN],
    ["gitlabProjectId", process.env.GITLAB_PROJECT_ID],
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
    claudeModel: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514",
    gitlabToken: process.env.GITLAB_TOKEN!,
    gitlabBaseUrl:
      process.env.GITLAB_BASE_URL ?? "https://gitlab.com/api/v4",
    gitlabProjectId: process.env.GITLAB_PROJECT_ID!,
    gitlabDefaultBranch: process.env.GITLAB_DEFAULT_BRANCH ?? "main",
  };
}
