import type { FeatureHistoryEntry } from "../../prompt-engine/types/prompt-engine.types";

const MAX_ENTRIES_PER_CHAT = 20;

/**
 * In-memory per-chat history for prompt-context injection.
 * Resets when the bot process restarts.
 */
export class ConversationHistoryStore {
  private readonly byChatId = new Map<number, FeatureHistoryEntry[]>();

  getHistory(chatId: number): FeatureHistoryEntry[] {
    return [...(this.byChatId.get(chatId) ?? [])];
  }

  append(chatId: number, entry: FeatureHistoryEntry): void {
    const existing = this.byChatId.get(chatId) ?? [];
    const next = [...existing, entry].slice(-MAX_ENTRIES_PER_CHAT);
    this.byChatId.set(chatId, next);
  }

  clear(chatId: number): void {
    this.byChatId.delete(chatId);
  }
}

export const conversationHistoryStore = new ConversationHistoryStore();
