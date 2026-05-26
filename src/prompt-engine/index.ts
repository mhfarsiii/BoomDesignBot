export {
  assemblePrompt,
  buildPrompt,
  buildPromptLegacy,
  getSystemPrompt,
  getSystemPromptFromFile,
} from "./builders/prompt-builder";
export { resolveTargetFilePath } from "./utils/resolve-target-file-path";
export { scanProjectStructure } from "./scanners/project-structure.scanner";
export { buildContext, classifyIntent } from "./context/context-manager";
export { classifyIntent as classifyDesignerIntent } from "./classifiers/intent-classifier";
export { updateFeatureIndex } from "./memory/memory-updater";
export type {
  AiConfig,
  AssembledPrompt,
  BuildPromptInput,
  FeatureHistoryEntry,
  GetSystemPromptConfig,
  Intent,
  IntentResult,
  MemoryUpdateInput,
} from "./types/prompt-engine.types";
