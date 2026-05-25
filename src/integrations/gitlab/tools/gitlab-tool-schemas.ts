import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages.mjs";

export const GITLAB_TOOLS: Tool[] = [
  {
    name: "create_branch",
    description:
      "Create a new Git branch in the configured GitLab project from the default branch (or optional ref).",
    input_schema: {
      type: "object",
      properties: {
        branch_name: {
          type: "string",
          description: "Name of the new branch (e.g. feature/add-widget).",
        },
        ref: {
          type: "string",
          description:
            "Optional source ref (branch name or commit SHA). Defaults to the project default branch.",
        },
      },
      required: ["branch_name"],
      additionalProperties: false,
    },
  },
  {
    name: "commit_code",
    description:
      "Create or update a single file on a branch via a GitLab repository commit.",
    input_schema: {
      type: "object",
      properties: {
        branch_name: {
          type: "string",
          description: "Target branch for the commit.",
        },
        file_path: {
          type: "string",
          description: "Repository-relative path (e.g. src/components/MyWidget.vue).",
        },
        file_content: {
          type: "string",
          description: "Full file contents to commit.",
        },
        commit_message: {
          type: "string",
          description: "Git commit message.",
        },
      },
      required: ["branch_name", "file_path", "file_content", "commit_message"],
      additionalProperties: false,
    },
  },
  {
    name: "create_merge_request",
    description:
      "Open a GitLab merge request from a feature branch into a target branch.",
    input_schema: {
      type: "object",
      properties: {
        source_branch: {
          type: "string",
          description: "Branch containing your changes.",
        },
        target_branch: {
          type: "string",
          description: "Branch to merge into (e.g. main).",
        },
        title: {
          type: "string",
          description: "Merge request title.",
        },
        description: {
          type: "string",
          description: "Merge request description (markdown).",
        },
      },
      required: ["source_branch", "target_branch", "title", "description"],
      additionalProperties: false,
    },
  },
];

/** @deprecated Use GITLAB_TOOLS — kept for importers expecting the old export name. */
export const GITLAB_TOOL_DEFINITIONS = GITLAB_TOOLS;
