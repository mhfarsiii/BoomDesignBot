/**
 * Anthropic Messages API handler with full tool-calling loop:
 * Claude requests tool -> GitLab executes -> tool_result fed back -> repeat until end_turn.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  ContentBlockParam,
  MessageParam,
  ToolResultBlockParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import {
  executeGitLabTool,
  formatToolResultForClaude,
  GITLAB_TOOLS,
  type GitLabMergeRequestResponse,
  type ToolExecutionResult,
} from "../../../integrations/gitlab/index";
import { getSystemPromptFromFile } from "../../../prompt-engine/builders/prompt-builder";
import { PROJECT_ROOT } from "../../../prompt-engine/paths/resolve-paths";
import type { AppConfig } from "../../../shared/config/app-config";
import { getErrorMessage } from "../../../shared/errors/get-error-message";
import type { ClaudeAgentResult } from "./types/claude-agent-result";

const MAX_TOOL_ITERATIONS = 12;

export class ClaudeAgent {
  private readonly client: Anthropic;
  private readonly config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.client = new Anthropic({ apiKey: config.anthropicApiKey });
  }

  /**
   * Process a user message through Claude with GitLab tool execution until completion.
   */
  async processUserMessage(userText: string): Promise<ClaudeAgentResult> {
    const dynamicSystemPrompt = await getSystemPromptFromFile(PROJECT_ROOT);

    const messages: MessageParam[] = [{ role: "user", content: userText }];

    const toolResults: ToolExecutionResult[] = [];
    let mergeRequestUrl: string | null = null;
    let assistantMessage = "";

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const response = await this.client.messages.create({
        model: this.config.claudeModel,
        max_tokens: 16_384,
        system: dynamicSystemPrompt,
        tools: GITLAB_TOOLS,
        messages,
      });

      const textParts = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text);

      if (textParts.length > 0) {
        assistantMessage = textParts.join("\n");
      }

      if (response.stop_reason === "end_turn") {
        break;
      }

      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (block): block is ToolUseBlock => block.type === "tool_use",
        );

        if (toolUseBlocks.length === 0) {
          assistantMessage =
            "Claude returned stop_reason tool_use but no tool_use blocks.";
          break;
        }

        messages.push({
          role: "assistant",
          content: response.content as ContentBlockParam[],
        });

        const toolResultBlocks: ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          let result: ToolExecutionResult;

          try {
            result = await executeGitLabTool(
              this.config,
              toolUse.name,
              toolUse.input,
            );
          } catch (error: unknown) {
            result = {
              ok: false,
              tool: "create_branch",
              error: `Tool executor crashed: ${getErrorMessage(error)}`,
            };
          }

          toolResults.push(result);

          if (
            result.ok &&
            result.tool === "create_merge_request" &&
            "web_url" in result.data
          ) {
            mergeRequestUrl = (result.data as GitLabMergeRequestResponse)
              .web_url;
          }

          toolResultBlocks.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: formatToolResultForClaude(result),
            is_error: !result.ok,
          });
        }

        messages.push({
          role: "user",
          content: toolResultBlocks,
        });

        continue;
      }

      assistantMessage =
        assistantMessage ||
        `Claude stopped with reason: ${response.stop_reason ?? "unknown"}`;
      break;
    }

    return {
      assistantMessage: assistantMessage || "No response from Claude.",
      mergeRequestUrl,
      toolResults,
    };
  }
}
