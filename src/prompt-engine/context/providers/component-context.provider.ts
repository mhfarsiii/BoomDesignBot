export function getComponentContext(): string {
  return `Shared Components (Base):
- BaseButton, BaseInput, BaseCheckbox, BaseCard

Marketing / Landing:
- LandingNavbar, LandingHero, LandingFooter
- LandingSectionFeatures, LandingFeatureCard
- LandingPricingTable, LandingPricingCard
- LandingTestimonials, LandingTestimonialCard
- LandingCtaBanner, LandingFaq, ContactForm

In-App:
- AppShell, AppSidebar, AppNavItem, AppHeader
- AppUserMenu, AppNotificationBell
- AppStatCard, AppWidgetGrid, AppDataTable, AppEmptyState
- AppProfileForm, AppSettingsPanel, AppModal, AppDrawer

Layouts:
- MarketingLayout — public landing/marketing pages
- AppLayout — authenticated in-app shell (sidebar + header)
- AuthLayout — login/signup
- DashboardLayout — legacy dashboard wrapper

Prefer project components; fall back to PrimeVue only when no match exists.`;
}
