import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PROMPT_ENGINE_ROOT = path.resolve(__dirname, "..");
export const PROJECT_ROOT = path.resolve(PROMPT_ENGINE_ROOT, "..", "..");

export function promptEnginePath(...segments: string[]) {
  return path.join(PROMPT_ENGINE_ROOT, ...segments);
}

export function memoryPath(...segments: string[]) {
  return path.join(PROMPT_ENGINE_ROOT, "memory", "data", ...segments);
}

export function projectPath(...segments: string[]) {
  return path.join(PROJECT_ROOT, ...segments);
}

/** Resolve a path inside an arbitrary target Vue project root. */
export function resolveProjectPath(
  targetProjectRoot: string,
  ...segments: string[]
): string {
  return path.join(path.resolve(targetProjectRoot), ...segments);
}
