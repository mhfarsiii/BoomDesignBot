/**
 * Entry point: Telegram bot receives messages, forwards to Claude + GitLab, replies with MR link.
 */

import "dotenv/config";
import { loadAppConfig } from "./app/config/load-app-config";
import { startTelegramBot } from "./app/bootstrap/start-telegram-bot";
import { getErrorMessage } from "./shared/errors/get-error-message";

async function main(): Promise<void> {
  try {
    const config = loadAppConfig();
    await startTelegramBot(config);
  } catch (error: unknown) {
    console.error(getErrorMessage(error));
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error("Fatal startup error:", getErrorMessage(error));
  process.exit(1);
});
