"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Ship,
  Users,
  MapPin,
  Star,
  Snowflake,
  Zap,
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

/**
 * One charter vessel. Shows a live price when the operator published one for
 * this exact island pair, otherwise routes the customer to a quote request
 * with the operator and trip already filled in.
 */
export default function CharterResultCard({ vessel, trip }) {
  const img = resolveImg(vessel);
  const live = vessel.pricing?.mode === "LIVE";
  const instant = live && vessel.pricing.instantBooking;

  const query = new URLSearchParams({
    from: trip.from || "",
    to: trip.to || "",
    date: trip.date || "",
    passengers: String(trip.passengers || 1),
    vessel: vessel.id,
  });
  if (vessel.vendor?.id) query.set("vendor", vessel.vendor.id);

  const quoteHref = `/charter?${query.toString()}`;
  // No price in the link: the booking page re-reads it from the operator's rate
  // table, so a hand-edited URL can't buy a charter at the wrong price.
  const bookHref = `/charter/book?${query.toString()}`;

  return (
    <Card className="overflow-hidden hover-lift">
      <div className="flex flex-col sm:flex-row">
        {/* ------------------------------- image ------------------------- */}
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
          {vessel.hasAc && (
            <Badge className="absolute right-2 top-2 gap-1 bg-sky-500 hover:bg-sky-600">
              <Snowflake className="h-3 w-3" /> AC
            </Badge>
          )}
        </div>

        {/* ------------------------------ details ------------------------ */}
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
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" /> Up to {vessel.totalSeats}
              </Badge>
              {vessel.baseIsland && (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" /> {vessel.baseIsland}
                </Badge>
              )}
              {instant && (
                <Badge className="gap-1 bg-emerald-500 hover:bg-emerald-600">
                  <Zap className="h-3 w-3" /> Instant booking
                </Badge>
              )}
            </div>
          </div>

          {/* ------------------------- price + action ---------------------- */}
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            {live ? (
              <>
                <div className="text-right">
                  {/* MVR and USD are independent prices, never added together. */}
                  {vessel.pricing.priceMvr != null && (
                    <div className="text-xl font-bold text-emerald-600">
                      {formatMoney(vessel.pricing.priceMvr, "MVR")}
                    </div>
                  )}
                  {vessel.pricing.priceUsd != null && (
                    <div className="text-xl font-bold text-sky-600">
                      {formatMoney(vessel.pricing.priceUsd, "USD")}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    whole boat, one way
                  </p>
                </div>
                <Button
                  asChild
                  className="bg-coral hover:bg-coral-soft text-white rounded-full"
                >
                  <Link href={bookHref}>
                    {instant ? "Book now" : "Book this boat"}
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
                  <Link href={quoteHref}>
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
 * Always-present final result: when nothing on the list fits, the customer
 * asks Myboat to find a boat. It creates an ordinary charter request with no
 * operator attached, which is what the admin oversight list already treats as
 * "needs a boat".
 */
export function RequestBoatCard({ trip }) {
  const query = new URLSearchParams({
    from: trip.from || "",
    to: trip.to || "",
    date: trip.date || "",
    passengers: String(trip.passengers || 1),
  });

  return (
    <Card className="overflow-hidden border-dashed border-2 border-lagoon/40 bg-foam/40">
      <div className="flex flex-col sm:flex-row">
        <div className="relative flex sm:w-56 shrink-0 items-center justify-center bg-gradient-to-br from-lagoon/10 to-sky-50 py-10">
          <Search className="h-12 w-12 text-lagoon" />
        </div>

        <CardContent className="flex flex-1 flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 space-y-2">
            <h3 className="text-lg font-semibold leading-tight">
              Request Boat MV
            </h3>
            <p className="text-sm text-muted-foreground">
              Nothing above suits your trip? Tell us what you need and our team
              will find you a boat from across the Maldives.
            </p>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Badge variant="outline">Handled by Myboat</Badge>
              <Badge variant="outline">All operators considered</Badge>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <Button
              asChild
              className="bg-lagoon hover:bg-lagoon/90 text-white rounded-full"
            >
              <Link href={`/charter?${query.toString()}`}>
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
