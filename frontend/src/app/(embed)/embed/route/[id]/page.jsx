import { notFound } from "next/navigation";
import { Ship, Clock, ArrowRight, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/currency";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://myboat-mv.vercel.app";

async function fetchRoute(id) {
  try {
    const res = await fetch(
      `${API_URL}/vendors/public/route/${encodeURIComponent(id)}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.success) return null;
    return json.data;
  } catch {
    return null;
  }
}

// Schedule times are timestamps that mean a time of day, so read them in UTC.
const fmtTime = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
  } catch {
    return null;
  }
};

/** Cheapest published fare, shown as a "from" price per currency. */
const fareFrom = (schedule) => {
  const mvr = [schedule.priceLocalMvr, schedule.priceExpatMvr]
    .map((v) => (v == null ? null : Number(v)))
    .filter((v) => v != null && !Number.isNaN(v));
  const usd = schedule.priceTouristUsd == null ? null : Number(schedule.priceTouristUsd);
  return {
    mvr: mvr.length ? Math.min(...mvr) : null,
    usd: usd != null && !Number.isNaN(usd) ? usd : null,
  };
};

/**
 * Route embed: /embed/route/<routeId>
 *
 * Lists every active departure on a route with its vessel and fares, so a
 * partner site can show a live timetable that links straight into booking.
 */
export default async function EmbedRoutePage({ params }) {
  const data = await fetchRoute(params.id);
  if (!data?.route) return notFound();

  const { route, schedules = [] } = data;

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-4">
        <h1 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
          {route.sourceCity}
          <ArrowRight className="h-4 w-4 text-sky-500" />
          {route.destinationCity}
        </h1>
        <p className="text-xs text-muted-foreground">
          {schedules.length}{" "}
          {schedules.length === 1 ? "departure" : "departures"}
          {route.distance ? ` · ${route.distance} NM` : ""}
        </p>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No departures scheduled on this route right now.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => {
            const vessel = s.vehicles?.[0];
            const { mvr, usd } = fareFrom(s);
            return (
              <Card key={s.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Clock className="h-4 w-4 text-sky-500" />
                      {fmtTime(s.departureTime)}
                      {fmtTime(s.arrivalTime) && (
                        <span className="font-normal text-muted-foreground">
                          → {fmtTime(s.arrivalTime)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {vessel?.vehicleName && (
                        <span className="flex items-center gap-1">
                          <Ship className="h-3 w-3" />
                          {vessel.vehicleName}
                        </span>
                      )}
                      {s.availableSeats != null && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {s.availableSeats} seats
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* MVR and USD are independent fares, never combined. */}
                    <div className="text-right text-sm leading-tight">
                      {mvr != null && (
                        <div className="font-semibold text-emerald-600">
                          {formatMoney(mvr, "MVR")}
                        </div>
                      )}
                      {usd != null && (
                        <div className="font-semibold text-sky-600">
                          {formatMoney(usd, "USD")}
                        </div>
                      )}
                      {mvr == null && usd == null && (
                        <Badge variant="outline" className="text-xs">
                          Ask operator
                        </Badge>
                      )}
                    </div>

                    <Button
                      asChild
                      size="sm"
                      className="bg-sky-500 text-white hover:bg-sky-600"
                    >
                      <a
                        href={`${APP_URL}/ferry?from=${encodeURIComponent(
                          route.sourceCity
                        )}&to=${encodeURIComponent(route.destinationCity)}`}
                        target="_top"
                        rel="noopener noreferrer"
                      >
                        Book
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Powered by{" "}
        <a
          href={APP_URL}
          target="_top"
          rel="noopener noreferrer"
          className="text-sky-500 hover:underline"
        >
          MyBoat
        </a>
      </p>
    </div>
  );
}
