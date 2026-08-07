import { Suspense } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogisticsBrowser from "@/components/web/logistics/logistics-browser";

/**
 * Cargo and logistics: search, fleet, and editorial copy.
 *
 * The same shape as /charter — a server component so the vessels and the prose
 * are both in the first response, with the query-reading browser suspended on
 * its own so its bail-out from static rendering stays local.
 *
 * The copy comes from the CMS under the reserved slug below, so it can be
 * rewritten from Admin -> Content -> Pages without a deploy. That matters more
 * here than anywhere else: no operator has listed a cargo vessel yet, so words
 * are the only thing this page has to offer until they do.
 */

const API = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://myboat.mv").replace(/\/$/, "");

/** Create a page at this path in the CMS and its body appears below. */
export const CMS_SLUG = "logistics";

const DEFAULTS = {
  title: "Cargo & Logistics Boats in the Maldives | Myboat MV",
  description:
    "Move cargo between Maldivian islands by sea. Compare vessels by capacity and cargo type, or tell us what needs shifting and get a quote.",
};

async function fetchCmsPage() {
  try {
    const res = await fetch(`${API}/pages/${CMS_SLUG}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json())?.data || null;
  } catch {
    return null;
  }
}

/**
 * Every cargo vessel, for the first paint.
 *
 * No route and no weight, so nothing is priced — a cargo price needs both a
 * trip and a load. Narrowing happens on the client once someone supplies them.
 */
async function fetchVessels() {
  try {
    const res = await fetch(`${API}/public/logistics-search`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json())?.data?.vessels || [];
  } catch {
    return [];
  }
}

export async function generateMetadata() {
  const page = await fetchCmsPage();
  const title = page?.metaTitle || page?.title || DEFAULTS.title;
  const description = page?.metaDescription || DEFAULTS.description;

  return {
    title,
    description,
    alternates: { canonical: "/logistics" },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/logistics`,
      ...(page?.featuredImageUrl ? { images: [page.featuredImageUrl] } : {}),
    },
  };
}

export default async function LogisticsPage() {
  const [page, vessels] = await Promise.all([fetchCmsPage(), fetchVessels()]);

  return (
    <div className="min-h-screen bg-sand-gradient">
      <div className="container-x py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-ocean-deep md:text-5xl">
            {page?.title || "Move cargo between the islands"}
          </h1>
          <p className="mt-3 text-muted-foreground md:text-lg">
            Building materials, produce, machinery, household moves. Priced per
            ton or per boat, by operators who run the route.
          </p>
        </div>

        {/* Reads the query string, so it bails out of static rendering.
            Suspended alone to keep the heading and the copy server rendered. */}
        <div className="mt-8 md:mt-10">
          <Suspense
            fallback={
              <div className="glass-white shadow-premium mx-auto h-48 max-w-5xl animate-pulse rounded-3xl" />
            }
          >
            <LogisticsBrowser initialVessels={vessels} />
          </Suspense>
        </div>

        {page?.htmlContent ? (
          <article
            className="cms-page mx-auto mt-14 w-full max-w-4xl md:mt-20"
            dangerouslySetInnerHTML={{ __html: page.htmlContent }}
          />
        ) : null}

        {page?.schemaJson ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: String(page.schemaJson).replace(/</g, "\\u003c"),
            }}
          />
        ) : null}

        <div className="mx-auto mt-14 max-w-3xl rounded-2xl border bg-white/70 p-6 text-center md:mt-20">
          <h2 className="text-xl font-semibold text-ocean-deep">
            Shifting something unusual?
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Oversized loads, refrigerated goods, a full household to another
            atoll — describe it and we will find the right boat.
          </p>
          <Button asChild className="mt-4 bg-coral text-white hover:bg-coral-soft">
            <Link href="/logistics/request">
              <Package className="mr-1.5 h-4 w-4" /> Request a cargo quote
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
