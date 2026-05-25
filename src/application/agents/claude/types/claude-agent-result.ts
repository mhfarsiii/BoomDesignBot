import type { ToolExecutionResult } from "../../../../integrations/gitlab/index";

/** Final outcome of a full Claude conversation turn. */
export interface ClaudeAgentResult {
  /** Assistant text (Vue code explanation, status, etc.). */
  assistantMessage: string;
  /** Populated when create_merge_request succeeds. */
  mergeRequestUrl: string | null;
  /** All tool runs performed in this turn. */
  toolResults: ToolExecutionResult[];
}
