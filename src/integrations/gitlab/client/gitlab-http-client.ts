import axios, { type AxiosError, type AxiosInstance } from "axios";
import type { AppConfig } from "../../../shared/config/app-config";
import { getErrorMessage } from "../../../shared/errors/get-error-message";
import type { GitLabApiErrorBody } from "../types/gitlab-api.types";

export function createGitLabClient(config: AppConfig): AxiosInstance {
  return axios.create({
    baseURL: config.gitlabBaseUrl,
    headers: {
      "PRIVATE-TOKEN": config.gitlabToken,
      "Content-Type": "application/json",
    },
    timeout: 60_000,
  });
}

export function gitlabProjectPath(config: AppConfig): string {
  return `/projects/${encodeURIComponent(config.gitlabProjectId)}`;
}

export function parseGitLabError(error: unknown): string {
  const axiosErr = error as AxiosError<GitLabApiErrorBody>;
  if (axios.isAxiosError(axiosErr)) {
    const body = axiosErr.response?.data;
    if (body?.message) {
      return typeof body.message === "string"
        ? body.message
        : JSON.stringify(body.message);
    }
    if (body?.error) {
      return body.error;
    }
    if (axiosErr.response?.status) {
      return `GitLab HTTP ${axiosErr.response.status}: ${axiosErr.message}`;
    }
  }
  return getErrorMessage(error);
}
