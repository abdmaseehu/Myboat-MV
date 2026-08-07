/**
 * CMS slugs that belong to a real route.
 *
 * A page written at one of these paths supplies the copy for the route named
 * here — /charter reads the page whose slug is "charter". Both URLs would
 * otherwise serve the same words, which splits the ranking between them and
 * leaves a crawler to guess which is canonical.
 *
 * So the catch-all redirects these to their route, and the sitemap lists the
 * route rather than the page. One address, one copy of the content.
 */
export const RESERVED_SLUGS = {
  charter: "/charter",
  logistics: "/logistics",
  ferry: "/ferry",
};

export const routeForSlug = (slug) => RESERVED_SLUGS[String(slug || "").toLowerCase()] || null;
