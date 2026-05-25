export function formatReply(
  assistantMessage: string,
  mergeRequestUrl: string | null,
): string {
  const parts: string[] = [assistantMessage.trim()];

  if (mergeRequestUrl) {
    parts.push("");
    parts.push("---");
    parts.push(`Merge Request: ${mergeRequestUrl}`);
  }

  const full = parts.join("\n");
  if (full.length <= 4096) {
    return full;
  }
  return `${full.slice(0, 4090)}…`;
}
