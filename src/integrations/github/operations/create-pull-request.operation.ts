import type { AppConfig } from "../../../shared/config/app-config";
import {
  createGitHubClient,
  githubRepoPath,
  parseGitHubError,
} from "../client/github-http-client";
import type {
  GitHubCreatePullRequestPayload,
  GitHubPullRequestResponse,
} from "../types/github-api.types";
import type {
  CreatePullRequestToolInput,
  ToolExecutionResult,
} from "../types/github-tool.types";
import { toolFailure, toolSuccess } from "../tools/tool-result-helpers";

export async function createPullRequest(
  config: AppConfig,
  input: CreatePullRequestToolInput,
): Promise<ToolExecutionResult> {
  const client = createGitHubClient(config);
  const payload: GitHubCreatePullRequestPayload = {
    title: input.title,
    body: input.description,
    head: input.source_branch,
    base: input.target_branch,
  };

  try {
    const { data } = await client.post<GitHubPullRequestResponse>(
      `${githubRepoPath(config)}/pulls`,
      payload,
    );

    return toolSuccess("create_pull_request", {
      number: data.number,
      title: data.title,
      state: data.state,
      source_branch: data.head.ref,
      target_branch: data.base.ref,
      html_url: data.html_url,
      web_url: data.html_url,
    });
  } catch (error: unknown) {
    return toolFailure("create_pull_request", parseGitHubError(error));
  }
}
