import type { AppConfig } from "../../../shared/config/app-config";
import { getErrorMessage } from "../../../shared/errors/get-error-message";
import { ClaudeAgent } from "./claude-agent";
import type { ClaudeAgentRequest } from "./types/claude-agent-request";
import type { ClaudeAgentResult } from "./types/claude-agent-result";
import { McpToolRegistry } from "../../../integrations/mcp/mcp-tool-registry";
import { GitLabMcpToolClient } from "../../../integrations/gitlab/mcp-client";
import type { ToolExecutionResult } from "../../../integrations/gitlab/types/gitlab-tool.types";

let toolRegistrySingleton:
  | McpToolRegistry<ToolExecutionResult>
  | null = null;

/**
 * Convenience wrapper for delivery layer — catches top-level errors so the process stays alive.
 */
export async function runClaudeAgent(
  config: AppConfig,
  request: ClaudeAgentRequest,
): Promise<ClaudeAgentResult> {
  try {
    if (!toolRegistrySingleton) {
      toolRegistrySingleton = new McpToolRegistry<ToolExecutionResult>([
        new GitLabMcpToolClient(config),
      ]);
      if (process.env.MCP_DEBUG === "1") {
        console.error(
          "[mcp] Initialized singleton McpToolRegistry with GitLabMcpToolClient",
        );
      }
    }

    const agent = new ClaudeAgent(config, toolRegistrySingleton);
    return await agent.processUserMessage(request);
  } catch (error: unknown) {
    return {
      assistantMessage: `Claude agent error: ${getErrorMessage(error)}`,
      mergeRequestUrl: null,
      toolResults: [],
      feature: "general",
      intents: ["general"],
      committedFilePaths: [],
    };
  }
}
