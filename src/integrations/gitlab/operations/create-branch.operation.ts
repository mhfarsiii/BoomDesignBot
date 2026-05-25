import type { AppConfig } from "../../../shared/config/app-config";
import {
  createGitLabClient,
  gitlabProjectPath,
  parseGitLabError,
} from "../client/gitlab-http-client";
import type {
  GitLabBranchResponse,
  GitLabCreateBranchPayload,
} from "../types/gitlab-api.types";
import type {
  CreateBranchToolInput,
  ToolExecutionResult,
} from "../types/gitlab-tool.types";
import { toolFailure, toolSuccess } from "../tools/tool-result-helpers";

export async function createBranch(
  config: AppConfig,
  input: CreateBranchToolInput,
): Promise<ToolExecutionResult> {
  const client = createGitLabClient(config);
  const payload: GitLabCreateBranchPayload = {
    branch: input.branch_name,
    ref: input.ref ?? config.gitlabDefaultBranch,
  };

  try {
    const { data } = await client.post<GitLabBranchResponse>(
      `${gitlabProjectPath(config)}/repository/branches`,
      payload,
    );
    return toolSuccess("create_branch", data);
  } catch (error: unknown) {
    return toolFailure("create_branch", parseGitLabError(error));
  }
}
