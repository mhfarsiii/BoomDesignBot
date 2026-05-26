import { classifyIntent } from "../classifiers/intent-classifier";
import { getFeatureEntry } from "../memory/memory-retriever";

/**
 * Picks the primary file path for file-context injection.
 * Uses explicit path, then memory index, then empty (Analyze phase resolves).
 */
export function resolveTargetFilePath(
  designerPrompt: string,
  explicitFilePath = "",
): string {
  const trimmed = explicitFilePath.trim();
  if (trimmed) {
    return trimmed;
  }

  const intentResult = classifyIntent(designerPrompt);
  const featureEntry = getFeatureEntry(intentResult.feature);

  if (featureEntry?.files?.length) {
    return featureEntry.files[0]!;
  }

  return "";
}
