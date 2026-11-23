/**
 * Auto-synced registry of publicly-crawlable routes. Consumed by the
 * /sitemap.xml handler in src/server/entry.ts.
 *
 * DO NOT add or remove paths by hand. Static paths are mirrored here from
 * src/routes.tsx automatically whenever that file is edited (any manual
 * path edit would be overwritten on the next routes.tsx change). For sync
 * to pick up a route, its `path` must be a literal string starting with "/";
 * template literals and identifier refs are skipped, and dynamic-param routes
 * like "/products/:id" are excluded. The legal pages "/privacy" and "/terms"
 * are never listed here.
 *
 * The only fields safe to hand-edit are the per-entry metadata below, after a
 * sync:
 * - `priority` (0.0–1.0): Home = 1.0, main sections = 0.8, deep pages = 0.5.
 * - `changefreq` and `lastmod`.
 */

export interface SeoRoute {
  path: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
  lastmod?: string;
}

export const seoRoutes: SeoRoute[] = [
  { path: "/login", changefreq: "monthly", priority: 0.5 },
  { path: "/signup", changefreq: "monthly", priority: 0.6 },
  { path: "/forgot-password", changefreq: "monthly", priority: 0.8 },
  { path: "/account", changefreq: "monthly", priority: 0.8 },
  { path: "/account/profile", changefreq: "monthly", priority: 0.5 },
  { path: "/sanctuary", changefreq: "monthly", priority: 0.8 },
  { path: "/spells", changefreq: "weekly", priority: 0.8, lastmod: "2026-11-19" },
  { path: "/spells/submit", changefreq: "monthly", priority: 0.5 },
  { path: "/admin/dashboard", changefreq: "monthly", priority: 0.5 },
  { path: "/admin/applications", changefreq: "monthly", priority: 0.5 },
  { path: "/admin/moderator", changefreq: "monthly", priority: 0.5 },
  { path: "/admin/community-admin", changefreq: "monthly", priority: 0.5 },
  { path: "/account/applications", changefreq: "monthly", priority: 0.5 },
  { path: "/plus", changefreq: "monthly", priority: 0.8 },
  { path: "/admin/spells", changefreq: "monthly", priority: 0.5 },
  { path: "/admin/community", changefreq: "monthly", priority: 0.5 },
  { path: "/admin/roles", changefreq: "monthly", priority: 0.5 },
  { path: "/creator-application", changefreq: "monthly", priority: 0.8 },
  { path: "/grimoire", changefreq: "monthly", priority: 0.8 },
  { path: "/explore", changefreq: "monthly", priority: 0.8 },
  { path: "/tarot", changefreq: "monthly", priority: 0.9, lastmod: "2026-11-19" },
  { path: "/moon-ritual", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-19" },
  { path: "/dashboard", changefreq: "monthly", priority: 0.8 },
  { path: "/timeline", changefreq: "monthly", priority: 0.8 },
  { path: "/calendar", changefreq: "weekly", priority: 0.7 },
  { path: "/dream-journal", changefreq: "monthly", priority: 0.8 },
  { path: "/resources", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-19" },
  { path: "/moon-calendar", changefreq: "weekly", priority: 0.8, lastmod: "2026-11-19" },
  { path: "/birth-chart", changefreq: "monthly", priority: 0.9, lastmod: "2026-11-19" },
  { path: "/about", changefreq: "monthly", priority: 0.7, lastmod: "2026-11-19" },
  { path: "/herbs", changefreq: "weekly", priority: 0.8, lastmod: "2026-11-19" },
  { path: "/", changefreq: "daily", priority: 1.0, lastmod: "2026-11-19" },
  { path: "/numerology", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-19" },
  { path: "/runes", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-19" },
  { path: "/compatibility", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-19" },
  { path: "/messages", changefreq: "monthly", priority: 0.8 },
  { path: "/community", changefreq: "daily", priority: 0.8, lastmod: "2026-11-19" },
  { path: "/community/new", changefreq: "monthly", priority: 0.5 },
  { path: "/community/bookmarks", changefreq: "monthly", priority: 0.5 },
  { path: "/community/notifications", changefreq: "monthly", priority: 0.5 },
  { path: "/community/discover", changefreq: "monthly", priority: 0.5 },
  { path: "/creators", changefreq: "monthly", priority: 0.8 },
  { path: "/organizations", changefreq: "monthly", priority: 0.8 },
  { path: "/circles", changefreq: "monthly", priority: 0.8 },
  { path: "/astronomical-accuracy", changefreq: "monthly", priority: 0.6, lastmod: "2026-11-19" },
  { path: "/moon/phases", changefreq: "monthly", priority: 0.7, lastmod: "2026-11-19" },
  { path: "/astrology", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-19" },
  { path: "/astrology/planets", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-20" },
  { path: "/astrology/houses", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-20" },
  { path: "/astrology/aspects", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-20" },
  { path: "/astrology/live-sky", changefreq: "monthly", priority: 0.5 },
  { path: "/astrology/cosmic-connections", changefreq: "monthly", priority: 0.5 },
  { path: "/astrology/celestial-time-machine", changefreq: "monthly", priority: 0.5 },
  { path: "/reminders", changefreq: "monthly", priority: 0.8 },
  { path: "/app-store-submission", changefreq: "monthly", priority: 0.8 },
  { path: "/app-store-screenshots", changefreq: "monthly", priority: 0.8 },
  { path: "/app-launch-kit", changefreq: "monthly", priority: 0.8 },
  { path: "/horoscope", changefreq: "daily", priority: 0.9, lastmod: "2026-11-19" },
  { path: "/learn", changefreq: "weekly", priority: 0.9, lastmod: "2026-11-19" },
  { path: "/seo-guides/how-to-read-your-birth-chart", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-20" },
  { path: "/seo-guides/sun-moon-rising-signs-explained", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-20" },
  { path: "/seo-guides/twelve-astrological-houses", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-20" },
  { path: "/seo-guides/moon-sign-meaning", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-20" },
  { path: "/seo-guides/how-to-read-tarot-for-beginners", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-20" },
  { path: "/seo-guides/three-card-tarot-spreads", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-20" },
  { path: "/seo-guides/major-vs-minor-arcana", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-20" },
  { path: "/seo-guides/eight-moon-phases-meaning", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-20" },
  { path: "/seo-guides/new-moon-vs-full-moon-rituals", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-20" },
  { path: "/seo-guides/how-to-use-a-moon-calendar", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-20" },
  { path: "/seo-guides/witchcraft-for-beginners", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-20" },
  { path: "/seo-guides/how-to-create-a-grimoire", changefreq: "monthly", priority: 0.8, lastmod: "2026-11-20" },
];
