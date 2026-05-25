import type { Context } from "telegraf";

/** Standard Telegraf context (compatible with all update handlers). */
export type BotContext = Context;

export interface TelegramUserInfo {
  id: number;
  username?: string;
  firstName?: string;
}
