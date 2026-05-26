import type {
  GitHubContentsCommitResponse,
  GitHubPullRequestResponse,
  GitHubRefResponse,
} from "./github-api.types";

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

export interface CreatePullRequestToolInput {
  source_branch: string;
  target_branch: string;
  title: string;
  description: string;
}

export type GitHubToolName =
  | "create_branch"
  | "commit_code"
  | "create_pull_request";

export type GitHubToolInput =
  | CreateBranchToolInput
  | CommitCodeToolInput
  | CreatePullRequestToolInput;

export interface GitHubBranchToolData {
  name: string;
  ref: string;
  sha: string;
  web_url: string;
}

export interface GitHubCommitToolData {
  sha: string;
  message: string;
  web_url: string;
  path: string;
}

export interface GitHubPullRequestToolData {
  number: number;
  title: string;
  state: string;
  source_branch: string;
  target_branch: string;
  html_url: string;
  web_url: string;
}

export interface ToolExecutionSuccess {
  ok: true;
  tool: GitHubToolName;
  data:
    | GitHubBranchToolData
    | GitHubCommitToolData
    | GitHubPullRequestToolData
    | GitHubRefResponse
    | GitHubContentsCommitResponse
    | GitHubPullRequestResponse;
}

export interface ToolExecutionFailure {
  ok: false;
  tool: GitHubToolName;
  error: string;
}

export type ToolExecutionResult = ToolExecutionSuccess | ToolExecutionFailure;
