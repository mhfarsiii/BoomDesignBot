/**
 * Application configuration loaded from environment variables.
 */

export interface AppConfig {
  telegramBotToken: string;
  anthropicApiKey: string;
  claudeModel: string;
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  githubApiBaseUrl: string;
  githubDefaultBranch: string;
  /** Absolute path to the target Vue repo (cloned on VPS). */
  targetProjectPath: string;
}
