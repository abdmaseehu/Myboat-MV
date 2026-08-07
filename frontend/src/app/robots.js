/**
 * /robots.txt
 *
 * A sitemap nothing points at is a file nobody fetches — this is the line that
 * tells a crawler it exists.
 *
 * The disallow list is the other half of the job. Everything behind a login
 * either 404s or redirects for a crawler, so indexing it wastes crawl budget
 * on the marketing pages that actually need it; and a URL like
 * /users/requests/<id>/pay has no business in a search result even as a
 * redirect.
 */

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://myboat.mv').replace(/\/$/, '');

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/agent/',
          '/users/',
          '/auth/',
          '/dashboard',
          // Rendered for embedding inside someone else's page, not to be
          // found on their own.
          '/embed/',
          // Search results with query strings: infinite, and thin.
          '/bus-tickets?',
          '/charter/search',
          '/logistics/search',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
