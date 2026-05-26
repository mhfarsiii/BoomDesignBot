import { startGitHubMcpServer } from "./github-mcp-server.js";

async function main(): Promise<void> {
  await startGitHubMcpServer();
}

main().catch((error: unknown) => {
  console.error("GitHub MCP server crashed:", error);
  process.exit(1);
});
