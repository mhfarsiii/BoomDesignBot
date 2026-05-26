import type { AppConfig } from "../../../shared/config/app-config";
import {
  createGitHubClient,
  githubBranchTreeUrl,
  githubRepoPath,
  parseGitHubError,
} from "../client/github-http-client";
import type { GitHubRefResponse } from "../types/github-api.types";
import type {
  CreateBranchToolInput,
  ToolExecutionResult,
} from "../types/github-tool.types";
import { toolFailure, toolSuccess } from "../tools/tool-result-helpers";

export async function createBranch(
  config: AppConfig,
  input: CreateBranchToolInput,
): Promise<ToolExecutionResult> {
  const client = createGitHubClient(config);
  const baseBranch = input.ref ?? config.githubDefaultBranch;

  try {
    const { data: baseRef } = await client.get<GitHubRefResponse>(
      `${githubRepoPath(config)}/git/ref/heads/${encodeURIComponent(baseBranch)}`,
    );

    const { data } = await client.post<GitHubRefResponse>(
      `${githubRepoPath(config)}/git/refs`,
      {
        ref: `refs/heads/${input.branch_name}`,
        sha: baseRef.object.sha,
      },
    );

    return toolSuccess("create_branch", {
      name: input.branch_name,
      ref: data.ref,
      sha: data.object.sha,
      web_url: githubBranchTreeUrl(config, input.branch_name),
    });
  } catch (error: unknown) {
    return toolFailure("create_branch", parseGitHubError(error));
  }
}
