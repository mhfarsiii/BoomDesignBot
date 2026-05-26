import { AuthService } from "./auth.service";
import { ConfigJsonAuthorizedUserIdsProvider } from "./adapters/config-json-authorized-user-ids.provider";

export function createAuthService(configPath?: string): AuthService {
  const provider = new ConfigJsonAuthorizedUserIdsProvider(configPath);
  const authService = new AuthService(provider);

  if (provider.getAllowedUserIds().length === 0) {
    console.warn(
      'config.json has no "allowedUserIds" yet — all users will be denied. ' +
        "Message the bot once; your numeric Telegram user id will appear in this log.",
    );
  }

  return authService;
}
