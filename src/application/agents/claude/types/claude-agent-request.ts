import type { FeatureHistoryEntry } from "../../../../prompt-engine/types/prompt-engine.types";

export interface ClaudeAgentRequest {
  /** Designer message from Telegram. */
  userText: string;
  /** Prior requests in this chat (feeds prompt-context module). */
  history?: FeatureHistoryEntry[];
  /** Optional override for file-context module. */
  filePath?: string;
}
