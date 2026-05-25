export {
  buildPrompt,
  buildPromptLegacy,
  getSystemPrompt,
  getSystemPromptFromFile,
} from "./builders/prompt-builder";
export { scanProjectStructure } from "./scanners/project-structure.scanner";
export { buildContext, classifyIntent } from "./context/context-manager";
export { classifyIntent as classifyDesignerIntent } from "./classifiers/intent-classifier";
export { updateFeatureIndex } from "./memory/memory-updater";
export type {
  AiConfig,
  BuildPromptInput,
  FeatureHistoryEntry,
  GetSystemPromptConfig,
  Intent,
  IntentResult,
  MemoryUpdateInput,
} from "./types/prompt-engine.types";
