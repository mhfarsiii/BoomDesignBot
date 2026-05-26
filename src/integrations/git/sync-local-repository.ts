import { spawn } from "node:child_process";

function runGitCommand(
  targetProjectPath: string,
  args: string[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd: targetProjectPath,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `git ${args.join(" ")} exited with ${code ?? "unknown"}: ${stderr.trim()}`,
        ),
      );
    });
  });
}

/**
 * Updates the read-only local clone to match the remote feature branch after
 * GitLab commits / MR creation. Failures are logged only — never thrown.
 */
export async function syncLocalRepository(
  targetProjectPath: string,
  branchName: string,
): Promise<void> {
  const branch = branchName.trim();
  if (!branch) {
    console.error(
      "[syncLocalRepository] Skipped: branch_name is empty.",
    );
    return;
  }

  try {
    await runGitCommand(targetProjectPath, ["fetch", "origin"]);
    await runGitCommand(targetProjectPath, ["reset", "--hard"]);
    await runGitCommand(targetProjectPath, ["checkout", branch]);
    await runGitCommand(targetProjectPath, ["pull", "origin", branch]);
  } catch (error) {
    console.error(
      `[syncLocalRepository] Failed to sync ${targetProjectPath} @ ${branch}:`,
      error,
    );
  }
}
