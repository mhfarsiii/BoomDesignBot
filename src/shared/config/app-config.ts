/**
 * Application configuration loaded from environment variables.
 */

export interface AppConfig {
  telegramBotToken: string;
  anthropicApiKey: string;
  claudeModel: string;
  gitlabToken: string;
  gitlabBaseUrl: string;
  gitlabProjectId: string;
  gitlabDefaultBranch: string;
}
