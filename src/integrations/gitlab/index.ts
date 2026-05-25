export {
  createGitLabClient,
  gitlabProjectPath,
  parseGitLabError,
} from "./client/gitlab-http-client";
export { createBranch } from "./operations/create-branch.operation";
export { commitCode } from "./operations/commit-code.operation";
export { createMergeRequest } from "./operations/create-merge-request.operation";
export { GITLAB_TOOLS, GITLAB_TOOL_DEFINITIONS } from "./tools/gitlab-tool-schemas";
export { executeGitLabTool } from "./tools/gitlab-tool-dispatcher";
export {
  formatToolResultForClaude,
  toolFailure,
  toolSuccess,
} from "./tools/tool-result-helpers";
export type {
  GitLabApiErrorBody,
  GitLabBranchResponse,
  GitLabCommitAction,
  GitLabCommitResponse,
  GitLabCreateBranchPayload,
  GitLabCreateCommitPayload,
  GitLabCreateMergeRequestPayload,
  GitLabMergeRequestResponse,
} from "./types/gitlab-api.types";
export type {
  CommitCodeToolInput,
  CreateBranchToolInput,
  CreateMergeRequestToolInput,
  GitLabToolInput,
  GitLabToolName,
  ToolExecutionFailure,
  ToolExecutionResult,
  ToolExecutionSuccess,
} from "./types/gitlab-tool.types";
