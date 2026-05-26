import { runClaudeAgent } from "../../../application/agents/claude/run-claude-agent";
import { conversationHistoryStore } from "../../../application/conversation/conversation-history.store";
import type { AppConfig } from "../../../shared/config/app-config";
import { getErrorMessage } from "../../../shared/errors/get-error-message";
import { formatReply } from "../formatters/reply.formatter";
import type { BotContext } from "../types/bot-context";

export async function handleTextMessage(
  ctx: BotContext,
  config: AppConfig,
): Promise<void> {
  const msg = ctx.message;
  if (!msg || !("text" in msg) || typeof msg.text !== "string") {
    await ctx.reply("Please send a text message.");
    return;
  }

  const text = msg.text.trim();
  if (!text) {
    await ctx.reply(
      "Please send a non-empty message describing the Vue component or change you need.",
    );
    return;
  }

  const chatId = ctx.chat?.id;
  const history =
    chatId !== undefined
      ? conversationHistoryStore.getHistory(chatId)
      : [];

  await ctx.reply("Working on your request (Claude + GitLab)…");

  try {
    const result = await runClaudeAgent(config, {
      userText: text,
      history,
    });

    if (chatId !== undefined) {
      const primaryIntent = result.intents[0] ?? "general";
      conversationHistoryStore.append(chatId, {
        feature: result.feature,
        intent: primaryIntent,
        request: text,
        timestamp: new Date().toISOString().slice(0, 10),
      });
    }

    await ctx.reply(
      formatReply(result.assistantMessage, result.mergeRequestUrl),
    );
  } catch (error: unknown) {
    await ctx.reply(`Unexpected error: ${getErrorMessage(error)}`);
  }
}
