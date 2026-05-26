import type { McpToolClient } from "./mcp-tool-client";
import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages.mjs";

/**
 * Simple registry for future multi-server scaling.
 * Today it routes to a single provider, but the structure supports adding more providers.
 */
export class McpToolRegistry<TResult> {
  private anthropicToolsCache: Tool[] | null = null;
  private toolNameToClient = new Map<string, McpToolClient<TResult>>();

  constructor(private readonly clients: McpToolClient<TResult>[]) {}

  async getAnthropicTools(): Promise<Tool[]> {
    if (this.anthropicToolsCache) {
      return this.anthropicToolsCache;
    }

    const toolsByClient = await Promise.all(
      this.clients.map((client) => client.getAnthropicTools()),
    );

    const allTools = toolsByClient.flat();
    this.anthropicToolsCache = allTools;

    // Route tool execution requests to the provider that advertised each tool.
    for (let i = 0; i < toolsByClient.length; i++) {
      const client = this.clients[i];
      const clientTools = toolsByClient[i];
      for (const tool of clientTools) {
        // The registry assumes non-colliding tool names.
        this.toolNameToClient.set(tool.name, client);
      }
    }

    return allTools;
  }

  async executeTool(toolName: string, input: unknown): Promise<TResult> {
    // Ensure the tool map is populated.
    if (!this.anthropicToolsCache) {
      await this.getAnthropicTools();
    }

    const client = this.toolNameToClient.get(toolName);
    if (!client) {
      throw new Error(
        `No MCP tool provider registered for tool "${toolName}".`,
      );
    }

    return client.executeTool(toolName, input);
  }
}

