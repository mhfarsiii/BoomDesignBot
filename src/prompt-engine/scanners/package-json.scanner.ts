import fs from "fs";
import { projectPath } from "../paths/resolve-paths";

export function scanPackageJson(): string {
  const pkgPath = projectPath("package.json");

  if (!fs.existsSync(pkgPath)) {
    return "Project Context:\npackage.json not found.";
  }

  const packageJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const deps = Object.keys(packageJson.dependencies ?? {});
  const flags = [
    deps.includes("pinia") ? "pinia" : null,
    deps.includes("primevue") ? "primevue" : null,
    deps.includes("vue") ? "vue" : null,
    deps.includes("vue-router") ? "vue-router" : null,
    deps.includes("axios") ? "axios" : null,
  ].filter(Boolean);

  return `Project Context:
Detected stack flags: ${flags.join(", ") || "none"}
Dependency count: ${deps.length}`;
}
