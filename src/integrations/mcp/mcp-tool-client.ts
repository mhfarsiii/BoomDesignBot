import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages.mjs";

/**
 * Minimal contract for an MCP-backed tool execution provider.
 *
 * For now, Claude uses the returned `ToolExecutionResult` shape from the GitHub integration.
 * Later, additional MCP servers can be added by implementing this interface and registering
 * the provider in a registry.
 */
export interface McpToolClient<TResult> {
  /**
   * Returns tool definitions in Anthropic format to be passed to `messages.create({ tools })`.
   * The tool definitions are typically derived from `listTools()` on the MCP server.
   */
  getAnthropicTools(): Promise<Tool[]>;

  /**
   * Executes a tool by name with JSON arguments.
   * The result should match the calling convention used by the Claude orchestration loop
   * for building `tool_result` blocks.
   */
  executeTool(toolName: string, input: unknown): Promise<TResult>;
}

