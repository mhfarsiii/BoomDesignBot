import type { AppConfig } from "../../../shared/config/app-config";
import {
  createGitLabClient,
  gitlabProjectPath,
  parseGitLabError,
} from "../client/gitlab-http-client";
import type {
  GitLabCommitResponse,
  GitLabCreateCommitPayload,
} from "../types/gitlab-api.types";
import type {
  CommitCodeToolInput,
  ToolExecutionResult,
} from "../types/gitlab-tool.types";
import { toolFailure, toolSuccess } from "../tools/tool-result-helpers";

export async function commitCode(
  config: AppConfig,
  input: CommitCodeToolInput,
): Promise<ToolExecutionResult> {
  const client = createGitLabClient(config);

  const createPayload: GitLabCreateCommitPayload = {
    branch: input.branch_name,
    commit_message: input.commit_message,
    actions: [
      {
        action: "create",
        file_path: input.file_path,
        content: input.file_content,
        encoding: "text",
      },
    ],
  };

  try {
    const { data } = await client.post<GitLabCommitResponse>(
      `${gitlabProjectPath(config)}/repository/commits`,
      createPayload,
    );
    return toolSuccess("commit_code", data);
  } catch (error: unknown) {
    const message = parseGitLabError(error);
    if (!message.toLowerCase().includes("exists")) {
      return toolFailure("commit_code", message);
    }

    const updatePayload: GitLabCreateCommitPayload = {
      branch: input.branch_name,
      commit_message: input.commit_message,
      actions: [
        {
          action: "update",
          file_path: input.file_path,
          content: input.file_content,
          encoding: "text",
        },
      ],
    };

    try {
      const { data } = await client.post<GitLabCommitResponse>(
        `${gitlabProjectPath(config)}/repository/commits`,
        updatePayload,
      );
      return toolSuccess("commit_code", data);
    } catch (retryError: unknown) {
      return toolFailure("commit_code", parseGitLabError(retryError));
    }
  }
}
