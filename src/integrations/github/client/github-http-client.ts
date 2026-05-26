import axios, { type AxiosError, type AxiosInstance } from "axios";
import type { AppConfig } from "../../../shared/config/app-config";
import { getErrorMessage } from "../../../shared/errors/get-error-message";
import type { GitHubApiErrorBody } from "../types/github-api.types";

export function createGitHubClient(config: AppConfig): AxiosInstance {
  return axios.create({
    baseURL: config.githubApiBaseUrl,
    headers: {
      Authorization: `Bearer ${config.githubToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    timeout: 60_000,
  });
}

export function githubRepoPath(config: AppConfig): string {
  return `/repos/${config.githubOwner}/${config.githubRepo}`;
}

export function githubBranchTreeUrl(config: AppConfig, branchName: string): string {
  return `https://github.com/${config.githubOwner}/${config.githubRepo}/tree/${encodeURIComponent(branchName)}`;
}

export function parseGitHubError(error: unknown): string {
  const axiosErr = error as AxiosError<GitHubApiErrorBody>;
  if (axios.isAxiosError(axiosErr)) {
    const body = axiosErr.response?.data;
    if (body?.message) {
      if (body.errors?.length) {
        const details = body.errors
          .map((entry) => entry.message ?? entry.field)
          .filter(Boolean)
          .join("; ");
        return details ? `${body.message}: ${details}` : body.message;
      }
      return body.message;
    }
    if (axiosErr.response?.status) {
      return `GitHub HTTP ${axiosErr.response.status}: ${axiosErr.message}`;
    }
  }
  return getErrorMessage(error);
}
