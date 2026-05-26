import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AuthConfigError } from "../errors/auth-config.error";
import type {
  AuthConfig,
  AuthorizedUserIdsProvider,
} from "../types/auth-config.types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONFIG_PATH = path.resolve(__dirname, "..", "..", "..", "..", "config.json");

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isAuthConfig(value: unknown): value is AuthConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.allowedUserIds)) {
    return false;
  }

  return record.allowedUserIds.every(isPositiveInteger);
}

function parseAuthConfig(raw: string, configPath: string): AuthConfig {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error: unknown) {
    throw new AuthConfigError(
      `Authorization config at "${configPath}" contains invalid JSON.`,
      { cause: error },
    );
  }

  if (!isAuthConfig(parsed)) {
    throw new AuthConfigError(
      `Authorization config at "${configPath}" must be an object with a "allowedUserIds" array of positive integers, e.g. {"allowedUserIds": [123456789]}.`,
    );
  }

  return { allowedUserIds: parsed.allowedUserIds };
}

/**
 * Loads allowed Telegram user IDs from config.json at the project root.
 * Replace this provider with a Prisma-backed implementation without changing AuthService or handlers.
 */
export class ConfigJsonAuthorizedUserIdsProvider implements AuthorizedUserIdsProvider {
  private readonly allowedUserIds: number[];

  constructor(configPath: string = DEFAULT_CONFIG_PATH) {
    this.allowedUserIds = ConfigJsonAuthorizedUserIdsProvider.load(configPath);
  }

  getAllowedUserIds(): number[] {
    return [...this.allowedUserIds];
  }

  private static load(configPath: string): number[] {
    if (!fs.existsSync(configPath)) {
      throw new AuthConfigError(
        `Authorization config not found at "${configPath}". Create config.json in the project root with {"allowedUserIds": [123456789]}.`,
      );
    }

    let raw: string;
    try {
      raw = fs.readFileSync(configPath, "utf-8");
    } catch (error: unknown) {
      throw new AuthConfigError(
        `Unable to read authorization config at "${configPath}".`,
        { cause: error },
      );
    }

    return parseAuthConfig(raw, configPath).allowedUserIds;
  }
}
