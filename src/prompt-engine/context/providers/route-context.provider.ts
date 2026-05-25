export function getRouteContext(): string {
  return `Route Context:
- Vue Router with lazy-loaded routes

Marketing (MarketingLayout, public):
  /, /features, /pricing, /about, /contact, /faq

Auth (AuthLayout, guest-only):
  /login, /signup, /forgot-password

In-App (AppLayout, auth-required):
  /app, /app/dashboard, /app/notifications, /app/profile, /app/settings

Legacy:
  /dashboard, /settings (DashboardLayout)

Reuse existing layouts; landing sections compose into LandingView, in-app pages use AppShell.`;
}
