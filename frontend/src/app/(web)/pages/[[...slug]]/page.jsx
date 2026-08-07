import { notFound } from "next/navigation";

/**
 * Custom pages, written in Admin → Pages and served from any depth of path.
 *
 * One optional catch-all covers /pages, /pages/maldives and
 * /pages/maldives/kaafu-atoll/huraa-guide alike: the segments are joined back
 * into the single string the database indexes, so nesting needs no extra
 * routes and no extra tables.
 *
 * A server component, so the HTML and the JSON-LD are in the first response —
 * which is the point of the module. A crawler that does not run JavaScript
 * still sees the whole page.
 */

const API = process.env.NEXT_PUBLIC_API_URL;

const DEFAULT_DESCRIPTION =
  "Ferry seats, private charters and cargo across the Maldives — book with Myboat MV.";

/** Shown when a page has no featured image of its own. */
const DEFAULT_OG_IMAGE = "https://myboat.mv/default-og.jpg";

/** Where a relative image path is resolved from, for absolute social URLs. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://myboat.mv";

/**
 * Social crawlers do not resolve relative URLs — WhatsApp and Facebook fetch
 * og:image on their own servers, where "/uploads/huraa.jpg" means nothing. A
 * path stored against this site is made absolute; a full address is left alone.
 */
const absoluteUrl = (url) => {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${SITE_URL.replace(/\/$/, "")}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
};

/**
 * Fetch the page behind a path, or null.
 *
 * Uncached: an administrator who publishes an edit expects to see it on
 * refresh, and these pages are read far more often than a stale one would be
 * forgiven.
 */
async function fetchPage(slugSegments) {
  const slug = (slugSegments || []).filter(Boolean).join("/");
  if (!slug) return null;

  try {
    const res = await fetch(`${API}/pages/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    // The API being unreachable is not the same as the page not existing, but
    // from the visitor's side there is nothing to render either way.
    return null;
  }
}

export async function generateMetadata({ params }) {
  const page = await fetchPage(params?.slug);
  if (!page) {
    return { title: "Page not found — Myboat MV" };
  }

  const title = page.metaTitle || page.title;
  const description = page.metaDescription || DEFAULT_DESCRIPTION;
  const image = absoluteUrl(page.featuredImageUrl) || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    // The page is its own canonical home, wherever it was linked from.
    alternates: { canonical: `/pages/${page.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE_URL.replace(/\/$/, "")}/pages/${page.slug}`,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/**
 * JSON-LD goes inside a <script>, where the parser ends the block at the first
 * `</script` — inside a string literal or not. Escaping the `<` keeps the JSON
 * identical to a parser and unable to close the tag early.
 */
const safeJsonLd = (raw) => String(raw).replace(/</g, "\\u003c");

export default async function CustomPage({ params }) {
  const page = await fetchPage(params?.slug);

  // Unpublished and non-existent are the same 404 here; the API already
  // decided which pages exist for the public.
  if (!page) notFound();

  return (
    <>
      {page.schemaJson ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(page.schemaJson) }}
        />
      ) : null}

      {/*
        The banner, when there is one. Above the body rather than inside it, so
        an author gets a hero without having to write the markup for one — and
        so the same image serves the page and its share card.

        A plain <img>: the URL can point anywhere, and next/image would need
        every possible host declared in next.config before it would load one.
        eager, because it is the first thing on the page and lazy-loading what
        is already in view only delays it.
      */}
      {page.featuredImageUrl ? (
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 md:pt-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.featuredImageUrl}
            alt={page.title}
            loading="eager"
            className="h-[220px] w-full rounded-2xl object-cover shadow-sm md:h-[380px]"
          />
        </div>
      ) : null}

      {/*
        Raw HTML, rendered as written. Only administrators can author it — the
        write endpoints are behind isAdmin — because anything here executes in
        every visitor's browser.

        `cms-page` scopes the prose defaults so a pasted layout that brings its
        own styles is not fighting ours.
      */}
      <article
        className="cms-page mx-auto w-full max-w-5xl px-4 py-10 md:py-14"
        dangerouslySetInnerHTML={{ __html: page.htmlContent || "" }}
      />
    </>
  );
}
