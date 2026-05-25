import type { AppConfig } from "../../../shared/config/app-config";
import {
  createGitLabClient,
  gitlabProjectPath,
  parseGitLabError,
} from "../client/gitlab-http-client";
import type {
  GitLabCreateMergeRequestPayload,
  GitLabMergeRequestResponse,
} from "../types/gitlab-api.types";
import type {
  CreateMergeRequestToolInput,
  ToolExecutionResult,
} from "../types/gitlab-tool.types";
import { toolFailure, toolSuccess } from "../tools/tool-result-helpers";

export async function createMergeRequest(
  config: AppConfig,
  input: CreateMergeRequestToolInput,
): Promise<ToolExecutionResult> {
  const client = createGitLabClient(config);
  const payload: GitLabCreateMergeRequestPayload = {
    source_branch: input.source_branch,
    target_branch: input.target_branch,
    title: input.title,
    description: input.description,
    remove_source_branch: false,
  };

  try {
    const { data } = await client.post<GitLabMergeRequestResponse>(
      `${gitlabProjectPath(config)}/merge_requests`,
      payload,
    );
    return toolSuccess("create_merge_request", data);
  } catch (error: unknown) {
    return toolFailure("create_merge_request", parseGitLabError(error));
  }
}
