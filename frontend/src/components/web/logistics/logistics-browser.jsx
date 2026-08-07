"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Boxes, Loader2, Ship, Weight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SearchForm from "@/components/web/bus-tickets/search-form";
import { RequestCargoBoatCard } from "@/components/web/logistics/logistics-result-card";
import api from "@/lib/axios";

/**
 * Browse cargo vessels, and narrow them by trip.
 *
 * Same shape as the charter page, different matching. A charter is priced
 * point to point; cargo is priced by what a vessel covers — a named island
 * pair, a whole atoll, or nationwide — and charged either per ton or as one
 * flat boat price. So the filters are route, cargo type and weight, and a
 * card has to say which of those a price depends on.
 */

const money = (amount, currency) =>
  `${currency} ${Number(amount).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

const COVERAGE_LABEL = {
  ROUTE: "this route",
  ATOLL: "this atoll",
  NATIONWIDE: "nationwide",
};

/**
 * What a vessel costs for the searched load.
 *
 * A per-ton rate is not a price until there is a weight, so without one the
 * unit rate is shown and labelled as such rather than multiplied by an assumed
 * tonnage.
 */
function PriceLine({ pricing }) {
  if (pricing?.mode !== "LIVE") {
    return <span className="text-sm text-muted-foreground">Price on request</span>;
  }

  const perTon = pricing.basis === "PER_TON";
  const haveTotal = pricing.totalMvr != null || pricing.totalUsd != null;
  const useTotal = haveTotal && (!perTon || pricing.tons);

  const parts = [];
  if (useTotal) {
    if (pricing.totalMvr != null) parts.push(money(pricing.totalMvr, "MVR"));
    if (pricing.totalUsd != null) parts.push(money(pricing.totalUsd, "USD"));
  } else {
    if (pricing.unitMvr != null) parts.push(money(pricing.unitMvr, "MVR"));
    if (pricing.unitUsd != null) parts.push(money(pricing.unitUsd, "USD"));
  }

  return (
    <span className="text-sm font-semibold text-ocean-deep">
      {parts.join(" / ")}
      <span className="ml-1 font-normal text-muted-foreground">
        {useTotal
          ? perTon
            ? `for ${pricing.tons} t`
            : "per trip"
          : perTon
          ? "per ton"
          : "per trip"}
      </span>
    </span>
  );
}

function VesselCard({ vessel, searched, trip }) {
  const image = vessel.vehicleImage
    ? `${process.env.NEXT_PUBLIC_ROOT_URL}/uploads/${vessel.vehicleImage}`
    : null;
  const live = vessel.pricing?.mode === "LIVE";
  const cargo = Array.isArray(vessel.cargoTypes) ? vessel.cargoTypes : [];

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
        {live && vessel.pricing?.coverage && (
          <Badge className="absolute left-3 top-3 bg-emerald-500 text-white">
            Rate for {COVERAGE_LABEL[vessel.pricing.coverage] || "this trip"}
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
          {vessel.capacityTons != null && (
            <span className="inline-flex items-center gap-1">
              <Weight className="h-3.5 w-3.5" /> up to {Number(vessel.capacityTons)} t
            </span>
          )}
          {vessel.vendor?.businessName && <span>{vessel.vendor.businessName}</span>}
        </div>

        {/* An empty list means the operator stated no restriction, which is
            not the same as carrying nothing. */}
        {cargo.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cargo.slice(0, 4).map((c) => (
              <Badge key={c} variant="outline" className="text-[10px] font-normal">
                {c}
              </Badge>
            ))}
            {cargo.length > 4 && (
              <Badge variant="outline" className="text-[10px] font-normal">
                +{cargo.length - 4}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <PriceLine pricing={vessel.pricing} />
          <Button asChild size="sm" className="bg-lagoon text-white hover:bg-lagoon/90">
            <Link href={`/logistics/request${trip ? `?${trip}` : ""}`}>
              Request a quote
            </Link>
          </Button>
        </div>

        {searched && !live && (
          <p className="text-[11px] text-muted-foreground">
            No published rate for this trip — the operator will quote it.
          </p>
        )}
      </div>
    </article>
  );
}

export default function LogisticsBrowser({ initialVessels = [] }) {
  const router = useRouter();
  const params = useSearchParams();

  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const date = params.get("date") || "";
  const cargoType = params.get("cargoType") || "";
  const tons = params.get("tons") || "";
  const searched = !!(from && to);

  const [vessels, setVessels] = useState(initialVessels);
  const [loading, setLoading] = useState(false);

  const fetchVessels = useCallback(async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      if (cargoType) qs.set("cargoType", cargoType);
      if (tons) qs.set("tons", tons);
      const res = await api.get(`/public/logistics-search?${qs.toString()}`);
      setVessels(res?.data?.data?.vessels || []);
    } catch {
      // Leave what is on screen rather than blanking the grid.
    } finally {
      setLoading(false);
    }
  }, [from, to, cargoType, tons]);

  useEffect(() => {
    if (searched) fetchVessels();
  }, [searched, fetchVessels]);

  const onSearch = ({ from: f, to: t, date: d, cargoType: c, tons: w }) => {
    const qs = new URLSearchParams();
    if (f) qs.set("from", f);
    if (t) qs.set("to", t);
    if (d) qs.set("date", d);
    if (c) qs.set("cargoType", c);
    if (w) qs.set("tons", String(w));
    router.push(`/logistics?${qs.toString()}`, { scroll: false });
  };

  const clear = () => router.push("/logistics", { scroll: false });

  const tripQuery = (() => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    if (date) qs.set("date", date);
    if (cargoType) qs.set("cargoType", cargoType);
    if (tons) qs.set("tons", tons);
    return qs.toString();
  })();

  return (
    <>
      <div className="glass-white shadow-premium mx-auto max-w-5xl rounded-3xl p-5 md:p-8">
        <SearchForm
          only={["logistics"]}
          onSearch={onSearch}
          defaultValues={{ from, to, date, cargoType, tons }}
        />
      </div>

      <div className="mt-10 md:mt-14">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-ocean-deep md:text-3xl">
            {searched ? `Cargo vessels for ${from} → ${to}` : "Cargo vessels"}
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
          /*
            This is the state the page will be in until operators list cargo
            boats, so it has to be useful rather than apologetic: the quote
            route works whether or not anything is listed, because Myboat
            sources the boat.
          */
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <Boxes className="mx-auto h-10 w-10 text-lagoon/40" />
            <p className="mt-3 font-medium text-ocean-deep">
              {searched
                ? "No vessel is listed for that load yet"
                : "No cargo vessels listed yet"}
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Tell us what needs moving and where, and we will find a boat and
              come back with a price. Most quotes land the same day.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vessels.map((v) => (
              <VesselCard key={v.id} vessel={v} searched={searched} trip={tripQuery} />
            ))}
          </div>
        )}

        {/* Below whatever the grid showed. With no cargo vessels listed at
            all, this is the only route a visitor has — and it reaches Myboat
            rather than broadcasting to operators who are not there. */}
        <div className="mt-6">
          <RequestCargoBoatCard trip={{ from, to, date, cargoType, tons }} />
        </div>
      </div>
    </>
  );
}
