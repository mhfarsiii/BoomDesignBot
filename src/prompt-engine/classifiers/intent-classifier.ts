import type { Intent, IntentResult } from "../types/prompt-engine.types";

const INTENT_KEYWORDS: Record<Exclude<Intent, "general">, string[]> = {
  auth_ui: [
    "login",
    "log in",
    "sign in",
    "signin",
    "signup",
    "sign up",
    "register",
    "remember me",
    "remember-me",
    "session",
    "logout",
    "password",
    "forgot password",
    "auth",
    "jwt",
  ],
  form_field: [
    "checkbox",
    "input",
    "field",
    "validation",
    "validate",
    "form",
    "vee-validate",
    "required",
    "label",
  ],
  route: ["route", "page", "navigate", "router", "redirect", "guard", "layout"],
  component: ["component", "button", "modal", "dialog", "card", "table", "list"],
  style: [
    "color",
    "spacing",
    "tailwind",
    "style",
    "margin",
    "padding",
    "font",
    "responsive",
    "mobile",
  ],
  api: [
    "api",
    "composable",
    "axios",
    "fetch",
    "endpoint",
    "interceptor",
    "service",
    "store",
    "pinia",
  ],
  landing: [
    "landing",
    "landing page",
    "homepage",
    "marketing",
    "hero",
    "pricing",
    "testimonial",
    "faq",
    "footer",
    "navbar",
    "cta",
    "features section",
    "about page",
    "contact page",
    "website",
    "public page",
  ],
  in_app: [
    "in-app",
    "inapp",
    "dashboard",
    "sidebar",
    "app header",
    "notification",
    "profile",
    "settings panel",
    "data table",
    "empty state",
    "widget",
    "drawer",
    "modal",
    "app shell",
    "authenticated",
  ],
};

const FILE_PATH_BOOSTS: Record<string, Intent[]> = {
  login: ["auth_ui", "form_field"],
  signup: ["auth_ui", "form_field"],
  auth: ["auth_ui", "api"],
  router: ["route"],
  routes: ["route"],
  component: ["component"],
  composable: ["api"],
  store: ["api"],
  marketing: ["landing"],
  landing: ["landing"],
  app: ["in_app"],
  dashboard: ["in_app"],
  sidebar: ["in_app"],
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function extractFeatureName(prompt: string): string {
  const cleaned = prompt
    .toLowerCase()
    .replace(/^(add|create|update|fix|implement|remove)\s+/i, "")
    .trim();

  const rememberMatch = cleaned.match(/remember\s*[- ]?me/);
  if (rememberMatch) return "remember-me";

  const featureAliases: [RegExp, string][] = [
    [/hero|headline|banner/, "landing-hero"],
    [/pricing|price plan|subscription/, "landing-pricing"],
    [/testimonial|social proof|review/, "landing-testimonials"],
    [/\bfaq\b|frequently asked/, "landing-faq"],
    [/footer/, "landing-footer"],
    [/navbar|nav bar|navigation menu/, "landing-navbar"],
    [/\bcta\b|call to action/, "landing-cta"],
    [/feature section|features grid/, "landing-features"],
    [/contact form|contact page/, "contact-form"],
    [/landing page|homepage|home page/, "landing-page"],
    [/sidebar|side nav/, "app-sidebar"],
    [/app header|top bar/, "app-header"],
    [/data table|datatable/, "app-data-table"],
    [/empty state|no data/, "app-empty-state"],
    [/notification|bell icon/, "app-notifications"],
    [/profile page|user profile/, "app-profile"],
    [/settings panel|preferences/, "app-settings"],
    [/\bmodal\b|\bdrawer\b/, "app-modal-drawer"],
    [/dashboard widget|stat card/, "app-dashboard"],
    [/in-app|inapp|app shell/, "app-shell"],
  ];

  for (const [pattern, slug] of featureAliases) {
    if (pattern.test(cleaned)) return slug;
  }

  const words = cleaned.split(/\s+/).slice(0, 4).join(" ");
  return slugify(words) || "general";
}

function scoreIntent(
  intent: Exclude<Intent, "general">,
  prompt: string,
  filePath: string,
): number {
  const lower = prompt.toLowerCase();
  const pathLower = filePath.toLowerCase();
  let score = 0;

  for (const keyword of INTENT_KEYWORDS[intent]) {
    if (lower.includes(keyword)) score += 1;
  }

  for (const [fragment, boosts] of Object.entries(FILE_PATH_BOOSTS)) {
    if (pathLower.includes(fragment) && boosts.includes(intent)) {
      score += 2;
    }
  }

  return score;
}

export function classifyIntent(
  designerPrompt: string,
  filePath = "",
): IntentResult {
  const scores = (
    Object.keys(INTENT_KEYWORDS) as Exclude<Intent, "general">[]
  ).map((intent) => ({
    intent,
    score: scoreIntent(intent, designerPrompt, filePath),
  }));

  scores.sort((a, b) => b.score - a.score);

  const top = scores[0];
  const threshold = 1;

  if (!top || top.score < threshold) {
    return {
      intents: ["general"],
      feature: extractFeatureName(designerPrompt),
      confidence: 0.4,
    };
  }

  const intents: Intent[] = [top.intent];
  const second = scores[1];
  if (second && second.score >= threshold && second.score >= top.score * 0.7) {
    intents.push(second.intent);
  }

  const maxScore = Math.max(...scores.map((s) => s.score), 1);
  const confidence = Math.min(top.score / maxScore, 1);

  return {
    intents,
    feature: extractFeatureName(designerPrompt),
    confidence,
  };
}

export const CONTEXT_BLOCKS: Record<Intent, string[]> = {
  auth_ui: ["auth", "route", "component", "memory", "file", "prompt"],
  form_field: ["component", "memory", "file", "prompt"],
  route: ["route", "memory", "file", "prompt"],
  component: ["component", "memory", "file", "prompt"],
  style: ["file", "prompt"],
  api: ["auth", "dependency", "memory", "file", "prompt"],
  landing: ["route", "component", "memory", "file", "prompt"],
  in_app: ["route", "component", "memory", "file", "prompt", "auth"],
  general: ["project", "dependency", "prompt"],
};

export function resolveContextBlocks(intents: Intent[]): Set<string> {
  const blocks = new Set<string>();

  for (const intent of intents) {
    for (const block of CONTEXT_BLOCKS[intent]) {
      blocks.add(block);
    }
  }

  return blocks;
}
