import fs from "fs";
import type { FeatureIndexEntry, MemoryUpdateInput } from "../types/prompt-engine.types";
import { memoryPath } from "../paths/resolve-paths";

export function updateFeatureIndex(input: MemoryUpdateInput): void {
  const file = memoryPath("feature-index.json");
  const index = JSON.parse(
    fs.readFileSync(file, "utf-8"),
  ) as Record<string, FeatureIndexEntry>;

  const existing = index[input.feature] ?? {
    files: [],
    components: [],
    routes: [],
  };

  index[input.feature] = {
    ...existing,
    files: [...new Set([...existing.files, ...input.files])],
    components: [
      ...new Set([...(existing.components ?? []), ...(input.components ?? [])]),
    ],
    routes: [...new Set([...(existing.routes ?? []), ...(input.routes ?? [])])],
    pattern: input.pattern ?? existing.pattern,
    lastModified: new Date().toISOString().slice(0, 10),
  };

  fs.writeFileSync(file, `${JSON.stringify(index, null, 2)}\n`, "utf-8");
}
