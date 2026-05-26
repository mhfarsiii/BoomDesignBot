/**
 * Extract a browser URL from VCS tool success payloads (GitHub PR, GitLab MR, etc.).
 */
export function extractChangeRequestUrl(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  if (typeof record.web_url === "string" && record.web_url.length > 0) {
    return record.web_url;
  }
  if (typeof record.html_url === "string" && record.html_url.length > 0) {
    return record.html_url;
  }

  return null;
}
