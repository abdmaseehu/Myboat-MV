"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  Landmark,
  Loader2,
  Ship,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { formatMoney } from "@/lib/currency";
import { useAuth } from "@/store/use-auth";

const fmtDate = (d) => {
  if (!d) return "—";
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

function CharterBooking() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();

  const trip = {
    from: params.get("from") || "",
    to: params.get("to") || "",
    date: params.get("date") || "",
    passengers: Number(params.get("passengers")) || 1,
    vesselId: params.get("vessel") || "",
  };

  const [vessel, setVessel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currency, setCurrency] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [form, setForm] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    specialRequirements: "",
  });

  // Re-fetch through the same search the customer came from, so the price shown
  // here is the operator's current one rather than whatever was in the URL.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/public/charter-search", {
          params: {
            from: trip.from,
            to: trip.to,
            passengers: trip.passengers,
          },
        });
        const match = (res.data?.data?.vessels || []).find(
          (v) => v.id === trip.vesselId
        );
        if (cancelled) return;
        setVessel(match || null);
        if (match?.pricing?.mode === "LIVE") {
          setCurrency(match.pricing.priceMvr != null ? "MVR" : "USD");
        }
      } catch {
        if (!cancelled) setVessel(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trip.from, trip.to, trip.passengers, trip.vesselId]);

  // Prefill contact details from the signed-in account.
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      guestName:
        f.guestName ||
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        "",
      guestEmail: f.guestEmail || user.email || "",
      guestPhone: f.guestPhone || user.mobile || "",
    }));
  }, [user]);

  const price =
    vessel?.pricing?.mode === "LIVE"
      ? currency === "USD"
        ? vessel.pricing.priceUsd
        : vessel.pricing.priceMvr
      : null;

  const bothCurrencies =
    vessel?.pricing?.mode === "LIVE" &&
    vessel.pricing.priceMvr != null &&
    vessel.pricing.priceUsd != null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!user) {
      localStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);
      router.push("/auth/login");
      return;
    }
    if (!form.guestName.trim() || !form.guestEmail.trim() || !form.guestPhone.trim()) {
      toast.error("Please fill in your name, email and phone");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/charter-requests/instant", {
        vesselId: trip.vesselId,
        origin: trip.from,
        destination: trip.to,
        tripDate: trip.date,
        passengers: trip.passengers,
        currency,
        paymentMethod,
        ...form,
      });
      toast.success("Charter booked! The operator has been notified.");
      router.push("/users/my-requests");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Could not complete the booking"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-lagoon" />
      </div>
    );
  }

  // The trip lost its price (rate withdrawn, or the link was hand-edited).
  if (!vessel || vessel.pricing?.mode !== "LIVE") {
    const q = new URLSearchParams({
      from: trip.from,
      to: trip.to,
      date: trip.date,
      passengers: String(trip.passengers),
    });
    return (
      <div className="container-x py-16">
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>This trip needs a quote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              The operator hasn&apos;t published a price for this route, so it
              can&apos;t be booked instantly. Send them a request and they&apos;ll
              come back with a price.
            </p>
            <Button asChild className="rounded-full">
              <Link href={`/charter?${q.toString()}`}>
                Request a quote <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foam/30">
      <div className="container-x py-6 md:py-10">
        <Button asChild variant="ghost" className="mb-4 -ml-2">
          <Link
            href={`/charter/search?from=${encodeURIComponent(
              trip.from
            )}&to=${encodeURIComponent(trip.to)}&date=${trip.date}&passengers=${
              trip.passengers
            }`}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to results
          </Link>
        </Button>

        <h1 className="mb-6 text-2xl font-semibold text-ocean-deep">
          Confirm your charter
        </h1>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* --------------------------- contact --------------------------- */}
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="guestName">
                    Full name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="guestName"
                    value={form.guestName}
                    onChange={set("guestName")}
                    placeholder="Who should the operator ask for?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestEmail">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    value={form.guestEmail}
                    onChange={set("guestEmail")}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestPhone">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="guestPhone"
                    type="tel"
                    value={form.guestPhone}
                    onChange={set("guestPhone")}
                    placeholder="+960 XXX XXXX"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">Anything the operator should know</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={form.specialRequirements}
                    onChange={set("specialRequirements")}
                    placeholder="Luggage, dive gear, pickup time, accessibility needs…"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bothCurrencies && (
                  <div className="space-y-2">
                    <Label>Pay in</Label>
                    <RadioGroup
                      value={currency}
                      onValueChange={setCurrency}
                      className="flex gap-4"
                    >
                      <Label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 has-[:checked]:border-sky-500">
                        <RadioGroupItem value="MVR" id="cur-mvr" />
                        {formatMoney(vessel.pricing.priceMvr, "MVR")}
                      </Label>
                      <Label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 has-[:checked]:border-sky-500">
                        <RadioGroupItem value="USD" id="cur-usd" />
                        {formatMoney(vessel.pricing.priceUsd, "USD")}
                      </Label>
                    </RadioGroup>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>How you&apos;ll pay</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-sky-500">
                      <RadioGroupItem value="CASH" id="pay-cash" />
                      <span className="space-y-0.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Banknote className="h-4 w-4 text-sky-500" /> Cash
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Pay the operator on the day
                        </span>
                      </span>
                    </Label>
                    <Label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-sky-500">
                      <RadioGroupItem value="BANK_TRANSFER" id="pay-bank" />
                      <span className="space-y-0.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Landmark className="h-4 w-4 text-sky-500" /> Bank
                          transfer
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Operator sends their {currency || "MVR"} account details
                        </span>
                      </span>
                    </Label>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    Card payment for charters isn&apos;t available yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* --------------------------- summary --------------------------- */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Your charter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100">
                  <Ship className="h-5 w-5 text-sky-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{vessel.vehicleName}</p>
                  {vessel.vendor?.businessName && (
                    <p className="text-xs text-muted-foreground">
                      {vessel.vendor.businessName}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Route</span>
                  <span className="text-right font-medium">
                    {trip.from} → {trip.to}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" /> Date
                  </span>
                  <span className="font-medium">{fmtDate(trip.date)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> Passengers
                  </span>
                  <span className="font-medium">{trip.passengers}</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">
                  Whole boat, one way
                </span>
                <span
                  className={
                    currency === "USD"
                      ? "text-2xl font-bold text-sky-600"
                      : "text-2xl font-bold text-emerald-600"
                  }
                >
                  {formatMoney(price, currency || "MVR")}
                </span>
              </div>

              {vessel.pricing.instantBooking ? (
                <Badge className="w-full justify-center bg-emerald-500 hover:bg-emerald-600">
                  Confirmed instantly
                </Badge>
              ) : (
                <p className="text-xs text-muted-foreground">
                  The operator will confirm this booking shortly.
                </p>
              )}

              <Button
                onClick={submit}
                disabled={submitting}
                className="h-12 w-full rounded-full bg-coral text-white hover:bg-coral-soft"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking…
                  </>
                ) : (
                  <>
                    Confirm booking <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CharterBookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-lagoon" />
        </div>
      }
    >
      <CharterBooking />
    </Suspense>
  );
}
