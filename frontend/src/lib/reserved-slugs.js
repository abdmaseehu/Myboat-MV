/**
 * Slugs that a real route already answers.
 *
 * Custom pages live at the site root, so a page whose slug matches a route is
 * simply never reached — Next matches the more specific route first. The page
 * would sit in the dashboard looking published and be invisible to everyone.
 *
 * Two kinds:
 *
 *   ATTACHED  the route reads this page and renders its copy. Creating one is
 *             the intended way to edit that page's words.
 *
 *   TAKEN     the route ignores the CMS entirely. A page here is unreachable,
 *             so the API refuses the slug rather than letting someone write a
 *             guide nobody can open.
 */

/** Routes that render CMS copy, keyed by the slug that feeds them. */
export const ATTACHED_SLUGS = {
  charter: "/charter",
  logistics: "/logistics",
};

/** Everything else at the top level, which would shadow a page silently. */
export const TAKEN_SLUGS = [
  "admin",
  "agent",
  "api",
  "auth",
  "contact",
  "dashboard",
  "embed",
  "favicon.ico",
  "ferry",
  "health",
  "o",
  "pages",
  "robots.txt",
  "services",
  "sitemap.xml",
  "uploads",
  "users",
  "_next",
];

export const routeForSlug = (slug) =>
  ATTACHED_SLUGS[String(slug || "").toLowerCase()] || null;

/** Kept for the sitemap: a page feeding a route is listed as that route. */
export const RESERVED_SLUGS = ATTACHED_SLUGS;
