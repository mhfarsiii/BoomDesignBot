import {
  classifyIntent,
  resolveContextBlocks,
} from "../classifiers/intent-classifier";
import { formatMemoryContext } from "../memory/memory-retriever";
import type { FeatureHistoryEntry } from "../types/prompt-engine.types";
import { getAuthContext } from "./providers/auth-context.provider";
import { getComponentContext } from "./providers/component-context.provider";
import { getDependencies } from "./providers/dependency-context.provider";
import { getFileContext } from "./providers/file-context.provider";
import { getPromptContext } from "./providers/prompt-context.provider";
import { getRouteContext } from "./providers/route-context.provider";
import { getScopeContext } from "./providers/scope-context.provider";
import { scanPackageJson } from "../scanners/package-json.scanner";

function snippetKeywords(designerPrompt: string): string[] {
  return designerPrompt
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3)
    .slice(0, 8);
}

export async function buildContext(
  designerPrompt: string,
  history: string[] | FeatureHistoryEntry[],
  filePath: string,
  targetProjectPath: string,
): Promise<string> {
  const intentResult = classifyIntent(designerPrompt, filePath);
  const blocks = resolveContextBlocks(intentResult.intents);
  const sections: string[] = [];

  sections.push(getScopeContext(designerPrompt, intentResult, filePath));

  if (blocks.has("project")) {
    sections.push(scanPackageJson(targetProjectPath));
  }
  if (blocks.has("dependency")) {
    sections.push(getDependencies(targetProjectPath));
  }
  if (blocks.has("auth")) sections.push(getAuthContext());
  if (blocks.has("route")) sections.push(getRouteContext());
  if (blocks.has("component")) sections.push(getComponentContext());
  if (blocks.has("memory")) {
    sections.push(formatMemoryContext(intentResult.feature, designerPrompt));
  }
  if (blocks.has("prompt")) {
    sections.push(getPromptContext(history, intentResult.feature));
  }
  if (blocks.has("file")) {
    sections.push(
      getFileContext(
        filePath,
        snippetKeywords(designerPrompt),
        targetProjectPath,
      ),
    );
  }

  return sections.filter(Boolean).join("\n\n");
}

export { classifyIntent };
