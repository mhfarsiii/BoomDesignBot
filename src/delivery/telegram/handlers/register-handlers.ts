import { message } from "telegraf/filters";
import type { Telegraf } from "telegraf";
import type { AppConfig } from "../../../shared/config/app-config";
import { getErrorMessage } from "../../../shared/errors/get-error-message";
import type { BotContext } from "../types/bot-context";
import { handleTextMessage } from "./text-message.handler";

export function registerTelegramHandlers(
  bot: Telegraf<BotContext>,
  config: AppConfig,
): void {
  bot.start(async (ctx) => {
    await ctx.reply(
      "Vue 3 + GitHub bot ready.\n\n" +
        "Send a message describing the component or feature you want. " +
        "I will generate Vue 3 Composition API code and push it to GitHub via a pull request.",
    );
  });

  bot.on(message("text"), async (ctx) => {
    await handleTextMessage(ctx, config);
  });

  bot.catch(async (error, ctx) => {
    console.error("Telegraf error:", error);
    try {
      await ctx.reply(`Bot error: ${getErrorMessage(error)}`);
    } catch {
      // ignore secondary failures (e.g. user blocked the bot)
    }
  });
}
