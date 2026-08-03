"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Ship,
  Package,
  MapPin,
  Star,
  Weight,
  MessageSquareQuote,
  ArrowRight,
  Search,
} from "lucide-react";
import { formatMoney } from "@/lib/currency";

const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || "";

const resolveImg = (vessel) => {
  const src =
    vessel?.vehicleImage ||
    (Array.isArray(vessel?.images) ? vessel.images[0] : null);
  if (!src) return null;
  return src.startsWith("http") ? src : `${ROOT_URL}/uploads/${src}`;
};

const COVERAGE_LABEL = {
  ROUTE: "Route rate",
  ATOLL: "Atoll rate",
  NATIONWIDE: "Nationwide rate",
};

/** Builds the query the logistics quote form understands. */
const tripQuery = (trip, extra = {}) => {
  const q = new URLSearchParams({
    from: trip.from || "",
    to: trip.to || "",
    date: trip.date || "",
  });
  if (trip.cargoType) q.set("cargoType", trip.cargoType);
  if (trip.tons) q.set("tons", String(trip.tons));
  Object.entries(extra).forEach(([k, v]) => v && q.set(k, String(v)));
  return q;
};

export default function LogisticsResultCard({ vessel, trip }) {
  const img = resolveImg(vessel);
  const p = vessel.pricing || {};
  const live = p.mode === "LIVE";
  const perTon = p.basis === "PER_TON";
  // A per-ton rate can only become a total once we know the weight.
  const hasTotal = live && (p.totalMvr != null || p.totalUsd != null);

  const query = tripQuery(trip, { vessel: vessel.id, vendor: vessel.vendor?.id });

  return (
    <Card className="overflow-hidden hover-lift">
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-56 shrink-0 aspect-[16/10] sm:aspect-auto bg-gradient-to-br from-sky-100 to-sky-50">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={vessel.vehicleName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center py-10">
              <Ship className="h-12 w-12 text-sky-400" />
            </div>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 space-y-2">
            <div className="flex items-start gap-2">
              <h3 className="text-lg font-semibold leading-tight">
                {vessel.vehicleName}
              </h3>
              {vessel.vehicleRating != null && (
                <span className="mt-1 flex shrink-0 items-center gap-0.5 text-xs">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {Number(vessel.vehicleRating).toFixed(1)}
                </span>
              )}
            </div>

            {vessel.vendor?.businessName && (
              <p className="text-sm text-muted-foreground">
                Operated by <b>{vessel.vendor.businessName}</b>
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 text-xs">
              {vessel.capacityTons != null && (
                <Badge variant="outline" className="gap-1">
                  <Weight className="h-3 w-3" /> {Number(vessel.capacityTons)} t
                  capacity
                </Badge>
              )}
              {vessel.baseIsland && (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" /> {vessel.baseIsland}
                </Badge>
              )}
              {live && p.coverage && (
                <Badge variant="outline" className="gap-1">
                  <Package className="h-3 w-3" /> {COVERAGE_LABEL[p.coverage]}
                </Badge>
              )}
            </div>

            {Array.isArray(vessel.cargoTypes) && vessel.cargoTypes.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Carries: {vessel.cargoTypes.slice(0, 4).join(", ")}
                {vessel.cargoTypes.length > 4
                  ? ` +${vessel.cargoTypes.length - 4} more`
                  : ""}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            {live ? (
              <>
                <div className="text-right">
                  {/* MVR and USD are independent prices, never added together. */}
                  {hasTotal ? (
                    <>
                      {p.totalMvr != null && (
                        <div className="text-xl font-bold text-emerald-600">
                          {formatMoney(p.totalMvr, "MVR")}
                        </div>
                      )}
                      {p.totalUsd != null && (
                        <div className="text-xl font-bold text-sky-600">
                          {formatMoney(p.totalUsd, "USD")}
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        {perTon
                          ? `${p.tons} t at ${
                              p.unitMvr != null
                                ? formatMoney(p.unitMvr, "MVR")
                                : formatMoney(p.unitUsd, "USD")
                            } per ton`
                          : "flat price, one way"}
                      </p>
                    </>
                  ) : (
                    <>
                      {p.unitMvr != null && (
                        <div className="text-lg font-bold text-emerald-600">
                          {formatMoney(p.unitMvr, "MVR")}
                          <span className="text-xs font-normal"> / ton</span>
                        </div>
                      )}
                      {p.unitUsd != null && (
                        <div className="text-lg font-bold text-sky-600">
                          {formatMoney(p.unitUsd, "USD")}
                          <span className="text-xs font-normal"> / ton</span>
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        enter tons for a total
                      </p>
                    </>
                  )}
                </div>
                <Button
                  asChild
                  className="rounded-full bg-coral text-white hover:bg-coral-soft"
                >
                  <Link href={`/logistics?${query.toString()}`}>
                    Book this boat
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-right text-sm text-muted-foreground">
                  Price on request
                </p>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/logistics?${query.toString()}`}>
                    <MessageSquareQuote className="mr-1.5 h-4 w-4" />
                    Request a quote
                  </Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

/**
 * Same escape hatch as the charter search: a request with no operator attached,
 * which the admin oversight list already treats as "needs a boat".
 */
export function RequestCargoBoatCard({ trip }) {
  return (
    <Card className="overflow-hidden border-2 border-dashed border-lagoon/40 bg-foam/40">
      <div className="flex flex-col sm:flex-row">
        <div className="relative flex shrink-0 items-center justify-center bg-gradient-to-br from-lagoon/10 to-sky-50 py-10 sm:w-56">
          <Search className="h-12 w-12 text-lagoon" />
        </div>

        <CardContent className="flex flex-1 flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 space-y-2">
            <h3 className="text-lg font-semibold leading-tight">
              Request Boat MV
            </h3>
            <p className="text-sm text-muted-foreground">
              Oversized, unusual or urgent cargo? Tell us what you need moving
              and our team will find a boat for it.
            </p>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Badge variant="outline">Handled by Myboat</Badge>
              <Badge variant="outline">All operators considered</Badge>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <Button
              asChild
              className="rounded-full bg-lagoon text-white hover:bg-lagoon/90"
            >
              <Link
                href={`/logistics?${tripQuery(trip, {
                  // Routes to Myboat staff rather than the operator broadcast.
                  adminDirect: "1",
                }).toString()}`}
              >
                Request a boat
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
