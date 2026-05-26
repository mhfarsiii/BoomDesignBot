/**
 * Entry point: Telegram bot receives messages, forwards to Claude + GitHub, replies with PR link.
 */

import "dotenv/config";
import { createAuthService } from "./application/auth/create-auth-service";
import { loadAppConfig } from "./app/config/load-app-config";
import { startTelegramBot } from "./app/bootstrap/start-telegram-bot";
import { getErrorMessage } from "./shared/errors/get-error-message";

async function main(): Promise<void> {
  try {
    const config = loadAppConfig();
    const authService = createAuthService();
    await startTelegramBot(config, authService);
  } catch (error: unknown) {
    console.error(getErrorMessage(error));
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error("Fatal startup error:", getErrorMessage(error));
  process.exit(1);
});
