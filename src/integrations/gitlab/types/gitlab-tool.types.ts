import type {
  GitLabBranchResponse,
  GitLabCommitResponse,
  GitLabMergeRequestResponse,
} from "./gitlab-api.types";

export interface CreateBranchToolInput {
  branch_name: string;
  ref?: string;
}

export interface CommitCodeToolInput {
  branch_name: string;
  file_path: string;
  file_content: string;
  commit_message: string;
}

export interface CreateMergeRequestToolInput {
  source_branch: string;
  target_branch: string;
  title: string;
  description: string;
}

export type GitLabToolName =
  | "create_branch"
  | "commit_code"
  | "create_merge_request";

export type GitLabToolInput =
  | CreateBranchToolInput
  | CommitCodeToolInput
  | CreateMergeRequestToolInput;

export interface ToolExecutionSuccess {
  ok: true;
  tool: GitLabToolName;
  data: GitLabBranchResponse | GitLabCommitResponse | GitLabMergeRequestResponse;
}

export interface ToolExecutionFailure {
  ok: false;
  tool: GitLabToolName;
  error: string;
}

export type ToolExecutionResult = ToolExecutionSuccess | ToolExecutionFailure;
