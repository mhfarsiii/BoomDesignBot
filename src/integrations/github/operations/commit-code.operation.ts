import axios from "axios";
import type { AppConfig } from "../../../shared/config/app-config";
import {
  createGitHubClient,
  githubRepoPath,
  parseGitHubError,
} from "../client/github-http-client";
import type {
  GitHubContentsCommitResponse,
  GitHubContentsResponse,
} from "../types/github-api.types";
import type {
  CommitCodeToolInput,
  ToolExecutionResult,
} from "../types/github-tool.types";
import { toolFailure, toolSuccess } from "../tools/tool-result-helpers";

export async function commitCode(
  config: AppConfig,
  input: CommitCodeToolInput,
): Promise<ToolExecutionResult> {
  const client = createGitHubClient(config);
  const encodedPath = input.file_path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  let existingSha: string | undefined;

  try {
    const { data } = await client.get<GitHubContentsResponse>(
      `${githubRepoPath(config)}/contents/${encodedPath}`,
      { params: { ref: input.branch_name } },
    );
    existingSha = data.sha;
  } catch (error: unknown) {
    if (!axios.isAxiosError(error) || error.response?.status !== 404) {
      return toolFailure("commit_code", parseGitHubError(error));
    }
  }

  const payload = {
    message: input.commit_message,
    content: Buffer.from(input.file_content, "utf8").toString("base64"),
    branch: input.branch_name,
    ...(existingSha ? { sha: existingSha } : {}),
  };

  try {
    const { data } = await client.put<GitHubContentsCommitResponse>(
      `${githubRepoPath(config)}/contents/${encodedPath}`,
      payload,
    );

    return toolSuccess("commit_code", {
      sha: data.commit.sha,
      message: data.commit.message,
      web_url: data.commit.html_url,
      path: input.file_path,
    });
  } catch (error: unknown) {
    return toolFailure("commit_code", parseGitHubError(error));
  }
}
