export interface GitHubRefResponse {
  ref: string;
  object: {
    sha: string;
    type: string;
    url: string;
  };
}

export interface GitHubCreateRefPayload {
  ref: string;
  sha: string;
}

export interface GitHubContentsResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: "file" | "dir" | "submodule" | "symlink";
  content?: string;
  encoding?: string;
}

export interface GitHubContentsUpdatePayload {
  message: string;
  content: string;
  branch: string;
  sha?: string;
}

export interface GitHubContentsCommitResponse {
  content: GitHubContentsResponse | null;
  commit: {
    sha: string;
    html_url: string;
    message: string;
  };
}

export interface GitHubCreatePullRequestPayload {
  title: string;
  body: string;
  head: string;
  base: string;
}

export interface GitHubPullRequestResponse {
  number: number;
  html_url: string;
  title: string;
  body: string;
  state: string;
  head: { ref: string };
  base: { ref: string };
}

export interface GitHubApiErrorBody {
  message?: string;
  documentation_url?: string;
  errors?: Array<{ message?: string; resource?: string; field?: string }>;
}
