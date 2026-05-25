import type { AppConfig } from "../../../shared/config/app-config";
import { getErrorMessage } from "../../../shared/errors/get-error-message";
import { ClaudeAgent } from "./claude-agent";
import type { ClaudeAgentResult } from "./types/claude-agent-result";

/**
 * Convenience wrapper for delivery layer — catches top-level errors so the process stays alive.
 */
export async function runClaudeAgent(
  config: AppConfig,
  userText: string,
): Promise<ClaudeAgentResult> {
  try {
    const agent = new ClaudeAgent(config);
    return await agent.processUserMessage(userText);
  } catch (error: unknown) {
    return {
      assistantMessage: `Claude agent error: ${getErrorMessage(error)}`,
      mergeRequestUrl: null,
      toolResults: [],
    };
  }
}
