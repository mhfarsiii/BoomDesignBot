import fs from "fs";
import { resolveProjectPath } from "../../paths/resolve-paths";

const MAX_SNIPPET_LINES = 50;
const SNIPPET_WINDOW = 25;

function extractSnippet(
  content: string,
  keywords: string[],
): { snippet: string; truncated: boolean } {
  const lines = content.split("\n");
  if (lines.length <= MAX_SNIPPET_LINES) {
    return { snippet: content, truncated: false };
  }

  const lowerKeywords = keywords.filter(Boolean).map((k) => k.toLowerCase());
  let anchor = 0;

  if (lowerKeywords.length) {
    const idx = lines.findIndex((line) =>
      lowerKeywords.some((kw) => line.toLowerCase().includes(kw)),
    );
    if (idx >= 0) anchor = Math.max(0, idx - SNIPPET_WINDOW);
  }

  const end = Math.min(lines.length, anchor + MAX_SNIPPET_LINES);
  const snippet = lines.slice(anchor, end).join("\n");
  const truncated = anchor > 0 || end < lines.length;

  return { snippet, truncated };
}

export function getFileContext(
  filePath: string,
  keywords: string[] = [],
  targetProjectPath: string,
): string {
  if (!filePath) {
    return "File Context:\nNo target file specified. Resolve path in Analyze phase.";
  }

  const absolutePath = resolveProjectPath(targetProjectPath, filePath);

  if (!fs.existsSync(absolutePath)) {
    return `File Context:
Target: ${filePath}
Status: file not found on disk — use memory index and route map to locate implementation.`;
  }

  const content = fs.readFileSync(absolutePath, "utf-8");
  const { snippet, truncated } = extractSnippet(content, keywords);

  return `File Context:
Target: ${filePath}
${truncated ? "Note: snippet only (full file omitted for token efficiency)\n" : ""}
${snippet}`;
}
