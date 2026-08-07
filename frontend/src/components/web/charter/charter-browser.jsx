"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Anchor, Loader2, Ship, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SearchForm from "@/components/web/bus-tickets/search-form";
import api from "@/lib/axios";

/**
 * Browse charter vessels, and narrow them by route.
 *
 * The fleet is on the page before anything is searched, so there is something
 * to read on arrival and something for a crawler to index — a page that is
 * only a search box has neither. Searching filters what is already here rather
 * than navigating to a separate results page, and the criteria go into the URL
 * so a filtered view can still be shared.
 */

const money = (amount, currency) =>
  `${currency} ${Number(amount).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

/**
 * What a vessel costs for the searched trip.
 *
 * A vessel with no published rate for these islands is not a failure to show —
 * it is a vessel you ask for a price. Saying so keeps it on the page instead
 * of quietly dropping it and leaving a shorter list with no explanation.
 */
function PriceLine({ pricing }) {
  if (pricing?.mode !== "LIVE") {
    return (
      <span className="text-sm text-muted-foreground">Price on request</span>
    );
  }
  const parts = [];
  if (pricing.priceMvr != null) parts.push(money(pricing.priceMvr, "MVR"));
  if (pricing.priceUsd != null) parts.push(money(pricing.priceUsd, "USD"));
  return (
    <span className="text-sm font-semibold text-ocean-deep">
      {parts.join(" / ")}
      <span className="ml-1 font-normal text-muted-foreground">per trip</span>
    </span>
  );
}

function VesselCard({ vessel, searched, trip }) {
  const image = vessel.vehicleImage
    ? `${process.env.NEXT_PUBLIC_ROOT_URL}/uploads/${vessel.vehicleImage}`
    : null;
  const live = vessel.pricing?.mode === "LIVE";

  return (
    <article className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-premium">
      <div className="relative h-44 w-full bg-foam">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={vessel.vehicleName}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Ship className="h-10 w-10 text-lagoon/40" />
          </div>
        )}
        {live && vessel.pricing?.instantBooking && (
          <Badge className="absolute left-3 top-3 bg-emerald-500 text-white">
            Instant booking
          </Badge>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-semibold text-ocean-deep">{vessel.vehicleName}</h3>
          <p className="text-xs text-muted-foreground">
            {vessel.vehicleType}
            {vessel.baseIsland ? ` · based at ${vessel.baseIsland}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> up to {vessel.totalSeats}
          </span>
          {vessel.hasAc && <span>Air conditioned</span>}
          {vessel.vendor?.businessName && <span>{vessel.vendor.businessName}</span>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <PriceLine pricing={vessel.pricing} />
          <Button
            asChild
            size="sm"
            className={
              live
                ? "bg-coral text-white hover:bg-coral-soft"
                : "bg-lagoon text-white hover:bg-lagoon/90"
            }
          >
            {/* Carry the searched trip through, so the booking page opens
                with the route and date already answered. */}
            {/* The vessel goes with the trip either way. Without it the quote
                form opens asking which operator to send to, having just been
                told — and the customer answers a question they already
                answered by clicking this card. */}
            <Link
              href={
                live
                  ? `/charter/book?vessel=${vessel.id}${trip ? `&${trip}` : ""}`
                  : `/charter/request?vessel=${vessel.id}${trip ? `&${trip}` : ""}`
              }
            >
              {live ? "Book" : "Request a quote"}
            </Link>
          </Button>
        </div>

        {/* Only meaningful once a route has been named. */}
        {searched && !live && (
          <p className="text-[11px] text-muted-foreground">
            No published price for this route — the operator will quote it.
          </p>
        )}
      </div>
    </article>
  );
}

export default function CharterBrowser({ initialVessels = [] }) {
  const router = useRouter();
  const params = useSearchParams();

  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const date = params.get("date") || "";
  const passengers = params.get("passengers") || "";
  const searched = !!(from && to);

  const [vessels, setVessels] = useState(initialVessels);
  const [loading, setLoading] = useState(false);

  const fetchVessels = useCallback(async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      if (passengers) qs.set("passengers", passengers);
      const res = await api.get(`/public/charter-search?${qs.toString()}`);
      setVessels(res?.data?.data?.vessels || []);
    } catch {
      // Keep whatever is already on screen; an empty grid helps nobody.
    } finally {
      setLoading(false);
    }
  }, [from, to, passengers]);

  // Only refetch once a search has actually been made — the first render
  // already has the full fleet from the server.
  useEffect(() => {
    if (searched) fetchVessels();
  }, [searched, fetchVessels]);

  const onSearch = ({ from: f, to: t, date: d, passengers: p }) => {
    const qs = new URLSearchParams();
    if (f) qs.set("from", f);
    if (t) qs.set("to", t);
    if (d) qs.set("date", d);
    if (p) qs.set("passengers", String(p));
    // scroll: false — the results are already in view; jumping to the top
    // would hide the thing that just changed.
    router.push(`/charter?${qs.toString()}`, { scroll: false });
  };

  const clear = () => router.push("/charter", { scroll: false });

  // The current criteria, ready to append to a booking or quote link.
  const tripQuery = (() => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    if (date) qs.set("date", date);
    if (passengers) qs.set("passengers", passengers);
    return qs.toString();
  })();

  return (
    <>
      <div className="glass-white shadow-premium mx-auto max-w-5xl rounded-3xl p-5 md:p-8">
        <SearchForm
          only={["charter"]}
          onSearch={onSearch}
          defaultValues={{ from, to, date }}
        />
      </div>

      <div className="mt-10 md:mt-14">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-ocean-deep md:text-3xl">
            {searched ? `Vessels for ${from} → ${to}` : "Our charter fleet"}
          </h2>
          <div className="flex items-center gap-3">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-lagoon" />}
            <span className="text-sm text-muted-foreground">
              {vessels.length} vessel{vessels.length === 1 ? "" : "s"}
            </span>
            {searched && (
              <Button variant="ghost" size="sm" onClick={clear}>
                Show all
              </Button>
            )}
          </div>
        </div>

        {vessels.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <Anchor className="mx-auto h-10 w-10 text-lagoon/40" />
            <p className="mt-3 font-medium text-ocean-deep">
              {searched
                ? "No vessel is listed for that trip yet"
                : "No charter vessels listed yet"}
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Tell us where you are going and we will find a boat and come back
              with a price.
            </p>
            <Button asChild className="mt-5 bg-coral text-white hover:bg-coral-soft">
              <Link href="/charter/request">
                <Sparkles className="mr-1.5 h-4 w-4" /> Request a charter
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vessels.map((v) => (
              <VesselCard key={v.id} vessel={v} searched={searched} trip={tripQuery} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
