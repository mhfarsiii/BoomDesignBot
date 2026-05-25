import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".output",
  ".nuxt",
  "coverage",
]);

const IGNORED_FILES = new Set(["package-lock.json", ".env"]);

const DEFAULT_MAX_DEPTH = 5;

function shouldIgnore(name: string, isDirectory: boolean): boolean {
  if (isDirectory) {
    return IGNORED_DIRS.has(name);
  }
  return IGNORED_FILES.has(name);
}

async function appendTreeLevel(
  dirPath: string,
  prefix: string,
  lines: string[],
  depth: number,
  maxDepth: number,
): Promise<void> {
  if (depth >= maxDepth) {
    return;
  }

  let entries: fs.Dirent[];
  try {
    entries = await fsPromises.readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    lines.push(`${prefix}└── [Error reading directory: ${message}]`);
    return;
  }

  const visible = entries
    .filter((entry) => !shouldIgnore(entry.name, entry.isDirectory()))
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) {
        return a.isDirectory() ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

  for (let i = 0; i < visible.length; i++) {
    const entry = visible[i]!;
    const isLast = i === visible.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const displayName = entry.isDirectory() ? `${entry.name}/` : entry.name;

    lines.push(`${prefix}${connector}${displayName}`);

    if (entry.isDirectory()) {
      const childPrefix = prefix + (isLast ? "    " : "│   ");
      await appendTreeLevel(
        path.join(dirPath, entry.name),
        childPrefix,
        lines,
        depth + 1,
        maxDepth,
      );
    }
  }
}

/**
 * Recursively scans `rootDir` and returns a tree-formatted directory listing.
 * Ignores heavy or irrelevant paths to conserve LLM context tokens.
 */
export async function scanProjectStructure(
  rootDir: string,
  maxDepth: number = DEFAULT_MAX_DEPTH,
): Promise<string> {
  const resolved = path.resolve(rootDir);

  try {
    const stat = await fsPromises.stat(resolved);

    if (!stat.isDirectory()) {
      return `[Warning] Path is not a directory: ${resolved}`;
    }

    const lines: string[] = [`${path.basename(resolved)}/`];
    await appendTreeLevel(resolved, "", lines, 0, maxDepth);
    return lines.join("\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `[Warning] Unable to scan project structure at "${resolved}": ${message}`;
  }
}
