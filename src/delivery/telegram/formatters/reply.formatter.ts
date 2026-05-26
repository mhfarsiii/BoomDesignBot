export function formatReply(
  assistantMessage: string,
  pullRequestUrl: string | null,
): string {
  const parts: string[] = [assistantMessage.trim()];

  if (pullRequestUrl) {
    parts.push("");
    parts.push("---");
    parts.push(`Pull Request: ${pullRequestUrl}`);
  }

  const full = parts.join("\n");
  if (full.length <= 4096) {
    return full;
  }
  return `${full.slice(0, 4090)}…`;
}
