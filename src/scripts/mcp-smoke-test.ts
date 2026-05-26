/**
 * MCP-only smoke test (no Telegram, no Claude).
 * Verifies: spawn GitHub MCP server → listTools → map tools for Anthropic.
 *
 * Usage:
 *   MCP_DEBUG=1 npm run smoke:mcp
 */

import "dotenv/config";
import { loadAppConfig } from "../app/config/load-app-config";
import { GitHubMcpToolClient } from "../integrations/github/mcp-client";

async function main(): Promise<void> {
  const config = loadAppConfig();
  const client = new GitHubMcpToolClient(config);

  console.error("[smoke] Connecting to GitHub MCP server and calling listTools…");
  const tools = await client.getAnthropicTools();

  console.error("[smoke] Anthropic tools discovered:");
  for (const tool of tools) {
    console.error(`  - ${tool.name}: ${tool.description ?? "(no description)"}`);
  }

  if (tools.length === 0) {
    console.error("[smoke] FAIL: no tools returned.");
    process.exit(1);
  }

  const expected = ["create_branch", "commit_code", "create_pull_request"];
  const names = tools.map((t) => t.name);
  const missing = expected.filter((n) => !names.includes(n));
  if (missing.length > 0) {
    console.error(`[smoke] FAIL: missing tools: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.error("[smoke] PASS: all expected GitHub MCP tools are discoverable.");
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error("[smoke] ERROR:", error);
  process.exit(1);
});
