import type { IntentResult } from "../../types/prompt-engine.types";
import { getFeatureEntry } from "../../memory/memory-retriever";

export function getScopeContext(
  _designerPrompt: string,
  intentResult: IntentResult,
  filePath: string,
): string {
  const featureEntry = getFeatureEntry(intentResult.feature);
  const files = featureEntry?.files ?? (filePath ? [filePath] : []);

  const filesToModify = files.length ? files.join(", ") : "(resolve in Analyze)";
  const patterns = featureEntry?.pattern ?? "match existing project patterns";
  const components = featureEntry?.components?.join(", ") ?? "shared Base* components";
  const routes = featureEntry?.routes?.join(", ") ?? "—";

  return `Scope Manifest (pre-resolved):
Intent: ${intentResult.intents.join(", ")} | Feature: ${intentResult.feature} | Confidence: ${intentResult.confidence.toFixed(2)}
Files to modify: ${filesToModify}
Patterns to reuse: ${patterns}
Components: ${components}
Routes: ${routes}
Files NOT to touch: unrelated views, layouts, stores unless listed above`;
}
