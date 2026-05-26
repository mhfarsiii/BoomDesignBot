export type Intent =
  | "auth_ui"
  | "form_field"
  | "route"
  | "component"
  | "style"
  | "api"
  | "landing"
  | "in_app"
  | "general";

export interface IntentResult {
  intents: Intent[];
  feature: string;
  confidence: number;
}

export interface FeatureHistoryEntry {
  feature: string;
  intent: Intent;
  request: string;
  timestamp?: string;
}

export interface FeatureIndexEntry {
  files: string[];
  components: string[];
  routes: string[];
  lastModified?: string;
  pattern?: string;
  tags?: string[];
}

export interface ComponentRegistryEntry {
  path: string;
  props?: string[];
  usedIn?: string[];
}

export interface RouteMapEntry {
  component: string;
  layout: string;
  guard?: string;
  relatedFeatures?: string[];
}

export interface AiConfig {
  stateManagement: string;
  formStrategy: string;
  authStrategy: string;
  routingStrategy: string;
  folderStructure: string;
  gitRules: string;
}

/** Config for building the system prompt with a live project tree scan. */
export type GetSystemPromptConfig = Omit<AiConfig, "folderStructure"> & {
  targetProjectPath: string;
};

export interface BuildPromptInput {
  designerPrompt: string;
  history?: string[] | FeatureHistoryEntry[];
  filePath?: string;
  /** Absolute path to the target Vue project (e.g. on the VPS). */
  targetProjectPath: string;
}

/** Structured prompt parts for Claude Messages API (system vs user separation). */
export interface AssembledPrompt {
  system: string;
  userMessage: string;
  context: string;
  designerPrompt: string;
  filePath: string;
  targetProjectPath: string;
  intents: Intent[];
  feature: string;
}

export interface MemoryUpdateInput {
  feature: string;
  files: string[];
  components?: string[];
  routes?: string[];
  pattern?: string;
}
