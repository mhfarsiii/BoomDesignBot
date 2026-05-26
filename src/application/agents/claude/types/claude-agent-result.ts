import type { ToolExecutionResult } from "../../../../integrations/gitlab/index";
import type {
  Intent,
} from "../../../../prompt-engine/types/prompt-engine.types";

/** Final outcome of a full Claude conversation turn. */
export interface ClaudeAgentResult {
  /** Assistant text (Vue code explanation, status, etc.). */
  assistantMessage: string;
  /** Populated when create_merge_request succeeds. */
  mergeRequestUrl: string | null;
  /** All tool runs performed in this turn. */
  toolResults: ToolExecutionResult[];
  /** Resolved feature slug from intent classifier (for history + memory). */
  feature: string;
  /** Resolved intents from prompt-engine. */
  intents: Intent[];
  /** Repository-relative paths successfully committed this turn. */
  committedFilePaths: string[];
}
