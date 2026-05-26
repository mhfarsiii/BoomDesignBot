import type { MiddlewareFn } from "telegraf";
import type { AuthService } from "../../../application/auth/auth.service";
import type { BotContext } from "../types/bot-context";

const ACCESS_DENIED_MESSAGE = "Access Denied";

/**
 * Intercepts every update before handlers run. Unauthorized users never reach Claude/GitLab logic.
 */
export function createAuthorizationMiddleware(
  authService: AuthService,
): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    const userId = ctx.from?.id;

    if (userId !== undefined) {
      console.log(`Telegram user id: ${userId}`);
    }

    if (userId === undefined || !authService.isAuthorized(userId)) {
      if (ctx.chat) {
        await ctx.reply(ACCESS_DENIED_MESSAGE);
      }
      return;
    }

    await next();
  };
}
