import type { Intent } from "../../../prompt-engine/types/prompt-engine.types";
import { updateFeatureIndex } from "../../../prompt-engine/memory/memory-updater";

/**
 * Best-effort memory index update after successful GitHub commits.
 */
export function syncMemoryFromCommits(
  feature: string,
  intents: Intent[],
  committedFilePaths: string[],
): void {
  if (committedFilePaths.length === 0) {
    return;
  }

  updateFeatureIndex({
    feature,
    files: committedFilePaths,
    pattern: intents[0] ?? "general",
  });
}
