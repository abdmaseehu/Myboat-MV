/**
 * /sitemap.xml — built fresh on every request.
 *
 * The point of the CMS is that publishing a page needs no deploy, so the
 * sitemap cannot be a build-time artifact: a page written on Tuesday would sit
 * unlisted until someone shipped code. `force-dynamic` costs one query per
 * crawl, which is a handful a day.
 *
 * Static routes are listed by hand rather than discovered. Next can enumerate
 * the file system, but that would also list /admin, /agent and every checkout
 * step — the pages a crawler has no business in. A short explicit list is the
 * safer default.
 */

const API = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://myboat.mv').replace(/\/$/, '');

export const dynamic = 'force-dynamic';

/**
 * The marketing surface, with the priorities a search engine treats as
 * relative rather than absolute: what matters is the ordering between them.
 */
const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: '/ferry', priority: 0.9, changeFrequency: 'daily' },
  { path: '/charter', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/logistics', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/services', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
];

/** Published custom pages, or nothing at all if the API cannot be reached. */
async function fetchPages() {
  try {
    const res = await fetch(`${API}/pages`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    // A sitemap missing its custom pages is worth serving; a 500 is not,
    // because a crawler treats that as the whole file being broken.
    return [];
  }
}

export default async function sitemap() {
  const now = new Date();

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const pages = await fetchPages();
  const pageEntries = pages.map((page) => ({
    url: `${SITE_URL}/pages/${page.slug}`,
    // When the page was last edited, which is what a crawler uses to decide
    // whether re-reading it is worth the request.
    lastModified: page.updatedAt ? new Date(page.updatedAt) : now,
    changeFrequency: 'weekly',
    // Above the thin marketing pages: an island guide is the reason these
    // exist, and it is the page with something to say.
    priority: 0.7,
  }));

  return [...staticEntries, ...pageEntries];
}
