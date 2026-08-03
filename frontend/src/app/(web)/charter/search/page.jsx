"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Ship, Users, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";
import SearchForm from "@/components/web/bus-tickets/search-form";
import CharterResultCard, {
  RequestBoatCard,
} from "@/components/web/charter/charter-result-card";

const fmtDate = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

function CharterSearchResults() {
  const params = useSearchParams();
  const trip = {
    from: params.get("from") || "",
    to: params.get("to") || "",
    date: params.get("date") || "",
    passengers: Number(params.get("passengers")) || 1,
  };

  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/public/charter-search", {
          params: {
            from: trip.from,
            to: trip.to,
            date: trip.date,
            passengers: trip.passengers,
          },
        });
        if (!cancelled) setVessels(res.data?.data?.vessels || []);
      } catch (err) {
        if (!cancelled) {
          setError("We couldn't load charter boats just now. Please try again.");
          setVessels([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Re-run whenever the trip changes.
  }, [trip.from, trip.to, trip.date, trip.passengers]);

  const priced = vessels.filter((v) => v.pricing?.mode === "LIVE").length;

  return (
    <div className="min-h-screen bg-foam/30">
      <div className="container-x py-6 md:py-10">
        {/* -------------------------- search bar ------------------------- */}
        <div className="rounded-3xl bg-white shadow-premium p-4 md:p-6 mb-6">
          <SearchForm
            defaultValues={{
              from: trip.from,
              to: trip.to,
              date: trip.date,
            }}
          />
        </div>

        {/* --------------------------- heading --------------------------- */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold text-ocean-deep">
              {trip.from || "Anywhere"}
              <ArrowRight className="h-5 w-5 text-lagoon" />
              {trip.to || "Anywhere"}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {trip.date && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  {fmtDate(trip.date)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {trip.passengers}{" "}
                {trip.passengers === 1 ? "passenger" : "passengers"}
              </span>
            </div>
          </div>

          {!loading && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {vessels.length} {vessels.length === 1 ? "boat" : "boats"}
              </Badge>
              {priced > 0 && (
                <Badge className="bg-emerald-500 hover:bg-emerald-600">
                  {priced} with live pricing
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* --------------------------- results --------------------------- */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-lagoon" />
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </p>
            )}

            {!error && vessels.length === 0 && (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <Ship className="mx-auto h-10 w-10 text-lagoon/60" />
                <p className="mt-3 font-medium text-ocean-deep">
                  No charter boats listed for {trip.passengers}{" "}
                  {trip.passengers === 1 ? "passenger" : "passengers"} yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Our team can still find one for you — use the request below.
                </p>
              </div>
            )}

            {vessels.map((v) => (
              <CharterResultCard key={v.id} vessel={v} trip={trip} />
            ))}

            {/* Always offered, whether or not anything matched. */}
            <RequestBoatCard trip={trip} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function CharterSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-lagoon" />
        </div>
      }
    >
      <CharterSearchResults />
    </Suspense>
  );
}
