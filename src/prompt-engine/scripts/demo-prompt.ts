import { buildPrompt } from "../index";
import { PROJECT_ROOT } from "../paths/resolve-paths";

const prompt = await buildPrompt({
  designerPrompt: "add remember me checkbox to login",
  history: [
    {
      feature: "remember-me",
      intent: "auth_ui",
      request: "discussed remember me persistence",
      timestamp: "2026-05-20",
    },
  ],
  filePath: "src/views/LoginView.vue",
  targetProjectPath: PROJECT_ROOT,
});

console.log(prompt);
console.log("\n--- stats ---");
console.log(`chars: ${prompt.length} | ~tokens: ${Math.ceil(prompt.length / 4)}`);
