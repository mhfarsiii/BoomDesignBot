import type {
  GitHubBranchToolData,
  GitHubCommitToolData,
  GitHubPullRequestToolData,
  GitHubToolName,
  ToolExecutionFailure,
  ToolExecutionResult,
  ToolExecutionSuccess,
} from "../types/github-tool.types";

export function toolSuccess(
  tool: GitHubToolName,
  data:
    | GitHubBranchToolData
    | GitHubCommitToolData
    | GitHubPullRequestToolData,
): ToolExecutionSuccess {
  return { ok: true, tool, data };
}

export function toolFailure(
  tool: GitHubToolName,
  error: string,
): ToolExecutionFailure {
  return { ok: false, tool, error };
}

export function formatToolResultForClaude(result: ToolExecutionResult): string {
  return JSON.stringify(result, null, 2);
}
