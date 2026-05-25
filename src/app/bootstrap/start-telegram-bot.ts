import { Telegraf } from "telegraf";
import { registerTelegramHandlers } from "../../delivery/telegram/handlers/register-handlers";
import type { BotContext } from "../../delivery/telegram/types/bot-context";
import type { AppConfig } from "../../shared/config/app-config";
import { getErrorMessage } from "../../shared/errors/get-error-message";

export async function startTelegramBot(config: AppConfig): Promise<void> {
  const bot = new Telegraf<BotContext>(config.telegramBotToken);
  registerTelegramHandlers(bot, config);

  process.once("SIGINT", () => {
    void bot.stop("SIGINT");
  });
  process.once("SIGTERM", () => {
    void bot.stop("SIGTERM");
  });

  try {
    await bot.launch();
    console.log("Telegram bot is running. Press Ctrl+C to stop.");
  } catch (error: unknown) {
    console.error("Failed to launch bot:", getErrorMessage(error));
    process.exit(1);
  }
}
