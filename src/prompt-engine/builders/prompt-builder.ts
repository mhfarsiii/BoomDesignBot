import fs from "fs";
import { classifyIntent } from "../classifiers/intent-classifier";
import { buildContext } from "../context/context-manager";
import { scanProjectStructure } from "../scanners/project-structure.scanner";
import type {
  AiConfig,
  AssembledPrompt,
  BuildPromptInput,
  GetSystemPromptConfig,
} from "../types/prompt-engine.types";
import { resolveTargetFilePath } from "../utils/resolve-target-file-path";
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

/**
 * Full prompt-engine assembly: system prompt + intent-driven context modules + designer request.
 * Returns separated system/user payloads for the Claude Messages API.
 */
export async function assemblePrompt(
  input: BuildPromptInput,
): Promise<AssembledPrompt> {
  const {
    designerPrompt,
    history = [],
    targetProjectPath,
    filePath: explicitFilePath = "",
  } = input;

  const filePath = resolveTargetFilePath(designerPrompt, explicitFilePath);
  const intentResult = classifyIntent(designerPrompt, filePath);

  const [system, context] = await Promise.all([
    getSystemPromptFromFile(targetProjectPath),
    buildContext(designerPrompt, history, filePath, targetProjectPath),
  ]);

  const userMessage = `--- Context ---
${context}

--- Designer Request ---
${designerPrompt}`;

  return {
    system,
    userMessage,
    context,
    designerPrompt,
    filePath,
    targetProjectPath,
    intents: intentResult.intents,
    feature: intentResult.feature,
  };
}

export async function buildPrompt(input: BuildPromptInput): Promise<string> {
  const assembled = await assemblePrompt(input);
  return `${assembled.system}

${assembled.userMessage}`;
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
