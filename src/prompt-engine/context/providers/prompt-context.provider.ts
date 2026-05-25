import type { FeatureHistoryEntry, Intent } from "../../types/prompt-engine.types";

function isFeatureEntry(
  entry: string | FeatureHistoryEntry,
): entry is FeatureHistoryEntry {
  return typeof entry === "object" && "request" in entry;
}

export function getPromptContext(
  history: string[] | FeatureHistoryEntry[],
  currentFeature?: string,
): string {
  if (!history.length) {
    return "Conversation Context:\nNo prior feature history.";
  }

  const entries = history.map((item) =>
    isFeatureEntry(item)
      ? item
      : ({ feature: "unknown", intent: "general" as Intent, request: item }),
  );

  const sameFeature = currentFeature
    ? entries.filter((e) => e.feature === currentFeature)
    : [];

  const recent =
    sameFeature.length >= 2
      ? sameFeature.slice(-2)
      : entries.slice(-2);

  const formatted = recent
    .map(
      (e) =>
        `- [${e.feature}] (${e.intent}): ${e.request}${e.timestamp ? ` @ ${e.timestamp}` : ""}`,
    )
    .join("\n");

  return `Conversation Context:
Recent feature history (same feature prioritized):
${formatted}`;
}
