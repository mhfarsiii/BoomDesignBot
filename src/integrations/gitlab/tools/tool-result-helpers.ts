import type {
  GitLabBranchResponse,
  GitLabCommitResponse,
  GitLabMergeRequestResponse,
} from "../types/gitlab-api.types";
import type {
  GitLabToolName,
  ToolExecutionFailure,
  ToolExecutionResult,
  ToolExecutionSuccess,
} from "../types/gitlab-tool.types";

export function toolSuccess(
  tool: GitLabToolName,
  data: GitLabBranchResponse | GitLabCommitResponse | GitLabMergeRequestResponse,
): ToolExecutionSuccess {
  return { ok: true, tool, data };
}

export function toolFailure(
  tool: GitLabToolName,
  error: string,
): ToolExecutionFailure {
  return { ok: false, tool, error };
}

export function formatToolResultForClaude(result: ToolExecutionResult): string {
  return JSON.stringify(result, null, 2);
}
