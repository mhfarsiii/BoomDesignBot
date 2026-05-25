import fs from "fs";
import { buildContext } from "../context/context-manager";
import { scanProjectStructure } from "../scanners/project-structure.scanner";
import type {
  AiConfig,
  BuildPromptInput,
  GetSystemPromptConfig,
} from "../types/prompt-engine.types";
import { promptEnginePath } from "../paths/resolve-paths";

function loadConfig(): AiConfig {
  return JSON.parse(
    fs.readFileSync(promptEnginePath("config", "ai.config.json"), "utf-8"),
  ) as AiConfig;
}

function applyStaticPlaceholders(
  template: string,
  config: Omit<AiConfig, "folderStructure">,
): string {
  return template
    .replace(/\{\{STATE_MANAGEMENT\}\}/g, config.stateManagement)
    .replace(/\{\{ROUTING_STRATEGY\}\}/g, config.routingStrategy)
    .replace(/\{\{FORM_STRATEGY\}\}/g, config.formStrategy)
    .replace(/\{\{AUTH_STRATEGY\}\}/g, config.authStrategy)
    .replace(/\{\{GIT_RULES\}\}/g, config.gitRules);
}

/**
 * Loads system.txt, scans the target Vue project tree, and injects all placeholders.
 */
export async function getSystemPrompt(
  config: GetSystemPromptConfig,
): Promise<string> {
  const template = fs.readFileSync(
    promptEnginePath("prompts", "system.txt"),
    "utf-8",
  );
  const { targetProjectPath, ...staticConfig } = config;

  const folderStructure = await scanProjectStructure(targetProjectPath);

  return applyStaticPlaceholders(template, staticConfig).replace(
    /\{\{FOLDER_STRUCTURE\}\}/g,
    folderStructure,
  );
}

export async function getSystemPromptFromFile(
  targetProjectPath: string,
): Promise<string> {
  const { folderStructure: _ignored, ...staticConfig } = loadConfig();
  return getSystemPrompt({ targetProjectPath, ...staticConfig });
}

export async function buildPrompt(input: BuildPromptInput): Promise<string> {
  const { designerPrompt, history = [], filePath, targetProjectPath } = input;

  const systemPrompt = await getSystemPromptFromFile(targetProjectPath);
  const context = await buildContext(designerPrompt, history, filePath);

  return `${systemPrompt}

--- Context ---
${context}

--- Designer Request ---
${designerPrompt}`;
}

/** @deprecated Use buildPrompt({ designerPrompt, history, filePath, targetProjectPath }) */
export async function buildPromptLegacy(
  designerPrompt: string,
  history: string[],
  filePath: string,
  targetProjectPath: string,
): Promise<string> {
  return buildPrompt({ designerPrompt, history, filePath, targetProjectPath });
}
