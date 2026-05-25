export interface GitLabCreateBranchPayload {
  branch: string;
  ref: string;
}

export interface GitLabCommitAction {
  action: "create" | "delete" | "move" | "update" | "chmod";
  file_path: string;
  content?: string;
  encoding?: "text" | "base64";
  previous_path?: string;
  last_commit_id?: string;
}

export interface GitLabCreateCommitPayload {
  branch: string;
  commit_message: string;
  actions: GitLabCommitAction[];
  author_email?: string;
  author_name?: string;
}

export interface GitLabCreateMergeRequestPayload {
  source_branch: string;
  target_branch: string;
  title: string;
  description: string;
  remove_source_branch?: boolean;
}

export interface GitLabBranchResponse {
  name: string;
  commit: {
    id: string;
    short_id: string;
    title: string;
    created_at: string;
  };
  merged: boolean;
  protected: boolean;
  default: boolean;
  can_push: boolean;
  web_url: string;
}

export interface GitLabCommitResponse {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committer_name: string;
  committer_email: string;
  committed_date: string;
  created_at: string;
  web_url: string;
}

export interface GitLabMergeRequestResponse {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  source_branch: string;
  target_branch: string;
  web_url: string;
  created_at: string;
  updated_at: string;
}

export interface GitLabApiErrorBody {
  message?: string | Record<string, string[]>;
  error?: string;
}
