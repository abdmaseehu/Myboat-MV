import { Suspense } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import CharterBrowser from "@/components/web/charter/charter-browser";

/**
 * Private charter: search, fleet, and editorial copy.
 *
 * A server component, so the vessels and the prose are both in the first
 * response. A crawler that runs no JavaScript still sees the fleet and the
 * words — which is the entire point of putting them on this page rather than
 * behind a search box.
 *
 * The copy comes from the CMS under the reserved slug below, so it can be
 * rewritten from Admin -> Content -> Pages without a deploy, while the widget
 * and the live vessel data stay in code where they belong.
 */

const API = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://myboat.mv").replace(/\/$/, "");

/** Create a page at this path in the CMS and its body appears below. */
export const CMS_SLUG = "charter";

const DEFAULTS = {
  title: "Private Boat Charter in the Maldives | Myboat MV",
  description:
    "Charter a speedboat or dhoni anywhere in the Maldives. Compare vessels, see published prices, or request a quote from verified operators.",
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
 * The whole charter fleet, for the first paint.
 *
 * No island pair, so every vessel comes back unpriced — a price needs a route.
 * Narrowing happens on the client once someone names one.
 */
async function fetchVessels() {
  try {
    const res = await fetch(`${API}/public/charter-search`, { cache: "no-store" });
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
    alternates: { canonical: "/charter" },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/charter`,
      ...(page?.featuredImageUrl ? { images: [page.featuredImageUrl] } : {}),
    },
  };
}

export default async function CharterPage() {
  const [page, vessels] = await Promise.all([fetchCmsPage(), fetchVessels()]);

  return (
    <div className="min-h-screen bg-sand-gradient">
      <div className="container-x py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-ocean-deep md:text-5xl">
            {page?.title || "Charter a boat, anywhere in the Maldives"}
          </h1>
          <p className="mt-3 text-muted-foreground md:text-lg">
            Speedboats and dhonis from verified operators. Published prices
            where we have them, a quote within hours where we do not.
          </p>
        </div>

        {/*
          The browser reads the query string, which forces it out of static
          rendering. Suspended on its own so that bail-out stays local: the
          heading, the fleet and the CMS copy around it are still server
          rendered, which is the whole reason they are on this page.
        */}
        <div className="mt-8 md:mt-10">
          <Suspense
            fallback={
              <div className="glass-white shadow-premium mx-auto h-48 max-w-5xl animate-pulse rounded-3xl" />
            }
          >
            <CharterBrowser initialVessels={vessels} />
          </Suspense>
        </div>

        {/* Editorial copy, written in the CMS. Absent until someone writes it,
            rather than a placeholder pretending to be content. */}
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
            Something more specific in mind?
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Overnight trips, island hopping, airport transfers at odd hours —
            tell us the plan and we will find the boat.
          </p>
          <Button asChild className="mt-4 bg-coral text-white hover:bg-coral-soft">
            <Link href="/charter/request">
              <Sparkles className="mr-1.5 h-4 w-4" /> Request a charter
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
