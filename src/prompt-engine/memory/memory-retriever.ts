import fs from "fs";
import type {
  ComponentRegistryEntry,
  FeatureIndexEntry,
  RouteMapEntry,
} from "../types/prompt-engine.types";
import { memoryPath } from "../paths/resolve-paths";

function readJson<T>(file: string): T {
  const raw = fs.readFileSync(memoryPath(file), "utf-8");
  return JSON.parse(raw) as T;
}

export function getFeatureEntry(
  feature: string,
): FeatureIndexEntry | undefined {
  const index = readJson<Record<string, FeatureIndexEntry>>(
    "feature-index.json",
  );
  return index[feature];
}

export function searchFeaturesByPrompt(prompt: string): string[] {
  const index = readJson<Record<string, FeatureIndexEntry>>(
    "feature-index.json",
  );
  const lower = prompt.toLowerCase();
  const matches: string[] = [];

  for (const [key, entry] of Object.entries(index)) {
    const keyMatch = lower.includes(key.replace(/-/g, " "));
    const routeMatch = entry.routes?.some((r: string) => lower.includes(r));
    const componentMatch = entry.components?.some((c: string) =>
      lower.includes(c.toLowerCase()),
    );
    const tagMatch = entry.tags?.some((tag: string) =>
      lower.includes(tag.toLowerCase()),
    );

    if (keyMatch || routeMatch || componentMatch || tagMatch) {
      matches.push(key);
    }
  }

  return matches;
}

export function getComponentEntries(
  names: string[],
): Record<string, ComponentRegistryEntry> {
  const registry = readJson<Record<string, ComponentRegistryEntry>>(
    "component-registry.json",
  );
  const result: Record<string, ComponentRegistryEntry> = {};

  for (const name of names) {
    if (registry[name]) result[name] = registry[name];
  }

  return result;
}

export function getRouteEntries(
  paths: string[],
): Record<string, RouteMapEntry> {
  const map = readJson<Record<string, RouteMapEntry>>("route-map.json");
  const result: Record<string, RouteMapEntry> = {};

  for (const routePath of paths) {
    if (map[routePath]) result[routePath] = map[routePath];
  }

  return result;
}

export function formatMemoryContext(
  feature: string,
  prompt: string,
): string {
  const lines: string[] = ["Memory Context:"];
  const relatedFeatures = searchFeaturesByPrompt(prompt);
  const featureKeys = [...new Set([feature, ...relatedFeatures])].slice(0, 5);

  for (const key of featureKeys) {
    const entry = getFeatureEntry(key);
    if (!entry) continue;

    lines.push(`\nFeature: ${key}`);
    if (entry.pattern) lines.push(`Pattern: ${entry.pattern}`);
    if (entry.files?.length) lines.push(`Files: ${entry.files.join(", ")}`);
    if (entry.components?.length) {
      lines.push(`Components: ${entry.components.join(", ")}`);
    }
    if (entry.routes?.length) lines.push(`Routes: ${entry.routes.join(", ")}`);

    const components = getComponentEntries(entry.components ?? []);
    for (const [name, meta] of Object.entries(components)) {
      lines.push(`  ${name} → ${meta.path}`);
    }

    const routes = getRouteEntries(entry.routes ?? []);
    for (const [path, meta] of Object.entries(routes)) {
      lines.push(`  ${path} → ${meta.component} (${meta.layout})`);
    }
  }

  if (lines.length === 1) {
    lines.push("No indexed features matched. Use Analyze phase to define scope.");
  }

  return lines.join("\n");
}
