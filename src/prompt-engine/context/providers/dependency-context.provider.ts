import fs from "fs";
import { resolveProjectPath } from "../../paths/resolve-paths";

export function getDependencies(targetProjectPath: string): string {
  const pkgPath = resolveProjectPath(targetProjectPath, "package.json");

  if (!fs.existsSync(pkgPath)) {
    return "Dependencies:\npackage.json not found.";
  }

  const packageJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as {
    dependencies?: Record<string, string>;
  };

  const deps = Object.entries(packageJson.dependencies ?? {})
    .map(([name, version]) => `${name}@${version}`)
    .join(", ");

  return `Dependencies:\n${deps || "none"}`;
}
