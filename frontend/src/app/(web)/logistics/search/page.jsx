"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Ship, CalendarDays, Package, Weight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";
import SearchForm from "@/components/web/bus-tickets/search-form";
import LogisticsResultCard, {
  RequestCargoBoatCard,
} from "@/components/web/logistics/logistics-result-card";

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

function LogisticsSearchResults() {
  const params = useSearchParams();
  const trip = {
    from: params.get("from") || "",
    to: params.get("to") || "",
    date: params.get("date") || "",
    cargoType: params.get("cargoType") || "",
    tons: params.get("tons") || "",
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
        const res = await api.get("/public/logistics-search", {
          params: {
            from: trip.from,
            to: trip.to,
            date: trip.date,
            cargoType: trip.cargoType,
            tons: trip.tons,
          },
        });
        if (!cancelled) setVessels(res.data?.data?.vessels || []);
      } catch {
        if (!cancelled) {
          setError("We couldn't load cargo boats just now. Please try again.");
          setVessels([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trip.from, trip.to, trip.date, trip.cargoType, trip.tons]);

  const priced = vessels.filter((v) => v.pricing?.mode === "LIVE").length;

  return (
    <div className="min-h-screen bg-foam/30">
      <div className="container-x py-6 md:py-10">
        <div className="mb-6 rounded-3xl bg-white p-4 shadow-premium md:p-6">
          <SearchForm
            defaultValues={{
              from: trip.from,
              to: trip.to,
              date: trip.date,
              cargoType: trip.cargoType,
              tons: trip.tons,
            }}
          />
        </div>

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
              {trip.cargoType && (
                <span className="flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  {trip.cargoType}
                </span>
              )}
              {trip.tons && (
                <span className="flex items-center gap-1.5">
                  <Weight className="h-4 w-4" />
                  {trip.tons} tons
                </span>
              )}
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
                  No cargo boats match this load yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {trip.tons || trip.cargoType
                    ? "Try relaxing the tonnage or cargo type — or let our team find one for you."
                    : "Our team can still find one for you — use the request below."}
                </p>
              </div>
            )}

            {vessels.map((v) => (
              <LogisticsResultCard key={v.id} vessel={v} trip={trip} />
            ))}

            <RequestCargoBoatCard trip={trip} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function LogisticsSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-lagoon" />
        </div>
      }
    >
      <LogisticsSearchResults />
    </Suspense>
  );
}
