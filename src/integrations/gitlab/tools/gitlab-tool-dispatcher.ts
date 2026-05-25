import type { AppConfig } from "../../../shared/config/app-config";
import { createBranch } from "../operations/create-branch.operation";
import { commitCode } from "../operations/commit-code.operation";
import { createMergeRequest } from "../operations/create-merge-request.operation";
import type {
  CommitCodeToolInput,
  CreateBranchToolInput,
  CreateMergeRequestToolInput,
  ToolExecutionResult,
} from "../types/gitlab-tool.types";

export async function executeGitLabTool(
  config: AppConfig,
  toolName: string,
  rawInput: unknown,
): Promise<ToolExecutionResult> {
  switch (toolName) {
    case "create_branch":
      return createBranch(config, rawInput as CreateBranchToolInput);
    case "commit_code":
      return commitCode(config, rawInput as CommitCodeToolInput);
    case "create_merge_request":
      return createMergeRequest(
        config,
        rawInput as CreateMergeRequestToolInput,
      );
    default:
      return {
        ok: false,
        tool: "create_branch",
        error: `Unknown tool: ${toolName}. Allowed: create_branch, commit_code, create_merge_request.`,
      };
  }
}
