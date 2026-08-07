import { permanentRedirect, notFound } from "next/navigation";

/**
 * The old home of custom pages, kept only to forward.
 *
 * Pages used to live at /pages/<slug>. That prefix said nothing about the
 * content and pushed the words that matter a segment further from the root, so
 * they now sit at /<slug>.
 *
 * A permanent redirect rather than a deletion, because those URLs have been
 * live: anything already linked, shared or indexed still lands on the page it
 * was meant to, and search engines are told the address moved for good rather
 * than finding two copies or a 404.
 */
export default function LegacyPagesRedirect({ params }) {
  const slug = (params?.slug || []).filter(Boolean).join("/");

  // /pages by itself was never a page — it was the prefix.
  if (!slug) notFound();

  permanentRedirect(`/${slug}`);
}
