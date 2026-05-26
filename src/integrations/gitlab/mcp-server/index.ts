import { startGitLabMcpServer } from "./gitlab-mcp-server.js";

async function main(): Promise<void> {
  await startGitLabMcpServer();
}

main().catch((error: unknown) => {
  console.error("GitLab MCP server crashed:", error);
  process.exit(1);
});

