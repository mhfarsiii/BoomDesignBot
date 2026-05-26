/**
 * Anthropic Messages API handler with full tool-calling loop:
 * Claude requests tool -> GitHub MCP executes -> tool_result fed back -> repeat until end_turn.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  ContentBlockParam,
  MessageParam,
  ToolResultBlockParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import {
  formatToolResultForClaude,
  type ToolExecutionResult,
} from "../../../integrations/github/index";
import type {
  CommitCodeToolInput,
  CreatePullRequestToolInput,
  GitHubToolName,
} from "../../../integrations/github/types/github-tool.types";
import { extractChangeRequestUrl } from "../../../integrations/vcs/extract-change-request-url";
import { syncLocalRepository } from "../../../integrations/git/sync-local-repository";
import { assemblePrompt } from "../../../prompt-engine/builders/prompt-builder";
import { syncMemoryFromCommits } from "./sync-memory-from-tool-results";
import type { AppConfig } from "../../../shared/config/app-config";
import { getErrorMessage } from "../../../shared/errors/get-error-message";
import type { ClaudeAgentRequest } from "./types/claude-agent-request";
import type { ClaudeAgentResult } from "./types/claude-agent-result";
import type { McpToolRegistry } from "../../../integrations/mcp/mcp-tool-registry";

const MAX_TOOL_ITERATIONS = 12;
const GITHUB_TOOL_NAMES = new Set<GitHubToolName>([
  "create_branch",
  "commit_code",
  "create_pull_request",
]);

function isGitHubToolName(name: string): name is GitHubToolName {
  return GITHUB_TOOL_NAMES.has(name as GitHubToolName);
}

export class ClaudeAgent {
  private readonly client: Anthropic;
  private readonly config: AppConfig;
  private readonly toolRegistry: McpToolRegistry<ToolExecutionResult>;

  constructor(config: AppConfig, toolRegistry: McpToolRegistry<ToolExecutionResult>) {
    this.config = config;
    this.client = new Anthropic({ apiKey: config.anthropicApiKey });
    this.toolRegistry = toolRegistry;
  }

  /**
   * Process a designer request with full prompt-engine assembly and GitHub tools.
   */
  async processUserMessage(
    request: ClaudeAgentRequest,
  ): Promise<ClaudeAgentResult> {
    const assembled = await assemblePrompt({
      designerPrompt: request.userText,
      history: request.history ?? [],
      filePath: request.filePath,
      targetProjectPath: this.config.targetProjectPath,
    });

    const messages: MessageParam[] = [
      { role: "user", content: assembled.userMessage },
    ];

    const toolResults: ToolExecutionResult[] = [];
    const committedFilePaths: string[] = [];
    let pullRequestUrl: string | null = null;
    let assistantMessage = "";

    const tools = await this.toolRegistry.getAnthropicTools();
    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const response = await this.client.messages.create({
        model: this.config.claudeModel,
        max_tokens: 16_384,
        system: assembled.system,
        tools,
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
            result = await this.toolRegistry.executeTool(
              toolUse.name,
              toolUse.input,
            );
          } catch (error: unknown) {
            result = {
              ok: false,
              tool: isGitHubToolName(toolUse.name)
                ? toolUse.name
                : "create_branch",
              error: `Tool executor crashed: ${getErrorMessage(error)}`,
            };
          }

          toolResults.push(result);

          if (
            result.ok &&
            toolUse.name === "commit_code" &&
            toolUse.input &&
            typeof toolUse.input === "object" &&
            "file_path" in toolUse.input
          ) {
            const filePath = (toolUse.input as CommitCodeToolInput).file_path;
            if (filePath) {
              committedFilePaths.push(filePath);
            }
          }

          if (
            result.ok &&
            result.tool === "create_pull_request" &&
            "data" in result
          ) {
            pullRequestUrl = extractChangeRequestUrl(result.data);

            const sourceBranch = (
              toolUse.input as CreatePullRequestToolInput
            ).source_branch;
            if (sourceBranch) {
              await syncLocalRepository(
                this.config.targetProjectPath,
                sourceBranch,
              );
            }
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

    if (committedFilePaths.length > 0) {
      syncMemoryFromCommits(
        assembled.feature,
        assembled.intents,
        committedFilePaths,
      );
    }

    return {
      assistantMessage: assistantMessage || "No response from Claude.",
      pullRequestUrl,
      toolResults,
      feature: assembled.feature,
      intents: assembled.intents,
      committedFilePaths,
    };
  }
}
