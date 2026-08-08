"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Users, Plane, Mail } from "lucide-react";
import { COUNTRIES, PRIORITY_COUNT } from "@/lib/countries";
import { seatedBand } from "@/lib/age-bands";

// Required fields, in the order they appear. Used for the "incomplete" check
// so the rule lives in one place.
const REQUIRED = ["fullName", "country", "dateOfBirth"];

export function makeEmptyPassenger(seat, index) {
  return {
    seatKey: seat?.key ?? null,
    seatNumber: seat?.seatNumber ?? String(index + 1),
    fullName: "",
    country: "",
    dateOfBirth: "",
    flightType: "",
    flightDate: "",
    flightNumber: "",
    flightTime: "",
  };
}

/** True when every passenger has the three mandatory fields filled in. */
export function passengersComplete(passengers) {
  if (!passengers?.length) return false;
  return passengers.every((p) =>
    REQUIRED.every((f) => String(p?.[f] ?? "").trim().length > 0)
  );
}

/** Strips empty optional fields so we don't persist a wall of "" values. */
export function cleanPassengers(passengers) {
  return passengers.map((p) => {
    const out = {
      seatKey: p.seatKey,
      seatNumber: p.seatNumber,
      fullName: p.fullName.trim(),
      country: p.country,
      dateOfBirth: p.dateOfBirth,
    };
    if (p.flightType) out.flightType = p.flightType;
    if (p.flightDate) out.flightDate = p.flightDate;
    if (p.flightNumber?.trim()) out.flightNumber = p.flightNumber.trim();
    if (p.flightTime) out.flightTime = p.flightTime;
    return out;
  });
}

export default function PassengerDetailsForm({
  passengers,
  onChange,
  contactEmail,
  contactPhone,
  onContactChange,
  // The day they travel, which is what decides an age.
  travelDate,
  // Whether this departure actually charges a child less. An operator can
  // switch the discount off, and badging a full-price seat "Child fare" would
  // be a lie.
  childDiscounted = true,
  // Set once the customer tries to pay, so errors aren't shouted at them
  // while the form is still untouched.
  showErrors = false,
}) {
  const update = (index, field, value) => {
    onChange(
      passengers.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const missing = (p, field) =>
    showErrors && !String(p?.[field] ?? "").trim().length;

  const errorRing = "border-destructive focus-visible:ring-destructive";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-sky-500" />
          Passenger Details
          <span className="text-sm font-normal text-muted-foreground">
            ({passengers.length}{" "}
            {passengers.length === 1 ? "passenger" : "passengers"})
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ------------------------------ contact ------------------------- */}
        <div className="rounded-2xl border bg-muted/30 p-4 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-sky-500" />
            Main Contact Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-email"
                type="email"
                inputMode="email"
                placeholder="your@email.com"
                value={contactEmail}
                onChange={(e) => onContactChange("contactEmail", e.target.value)}
                className={
                  showErrors && !contactEmail?.trim() ? errorRing : undefined
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-phone"
                type="tel"
                inputMode="tel"
                placeholder="+960 XXX XXXX"
                value={contactPhone}
                onChange={(e) => onContactChange("contactPhone", e.target.value)}
                className={
                  showErrors && !contactPhone?.trim() ? errorRing : undefined
                }
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Your e-ticket and any schedule changes are sent here.
          </p>
        </div>

        {/* ---------------------------- passengers ------------------------ */}
        {passengers.map((p, i) => (
          <div
            key={p.seatKey ?? i}
            className="rounded-2xl border p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Passenger {i + 1}
                {i === 0 && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    (Lead Passenger)
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {/*
                  The fare band, derived from the date of birth rather than
                  asked for separately. It appears as soon as there is a date to
                  read, so a customer sees the child fare applied instead of
                  wondering whether it will be.
                */}
                {p.dateOfBirth &&
                  childDiscounted &&
                  seatedBand(p.dateOfBirth, travelDate) === "CHILD" && (
                    <span className="text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1">
                      Child fare
                    </span>
                  )}
                {p.seatNumber && (
                  <span className="text-xs rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 px-2.5 py-1">
                    Seat {p.seatNumber}
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`name-${i}`}>
                  Full Name (as in passport){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`name-${i}`}
                  placeholder="Enter full name"
                  value={p.fullName}
                  onChange={(e) => update(i, "fullName", e.target.value)}
                  className={missing(p, "fullName") ? errorRing : undefined}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`country-${i}`}>
                  Country <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={p.country || undefined}
                  onValueChange={(v) => update(i, "country", v)}
                >
                  <SelectTrigger
                    id={`country-${i}`}
                    className={missing(p, "country") ? errorRing : undefined}
                  >
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {COUNTRIES.map((c, idx) => (
                      <div key={c}>
                        {idx === PRIORITY_COUNT && <Separator className="my-1" />}
                        <SelectItem value={c}>{c}</SelectItem>
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`dob-${i}`}>
                  Date of Birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`dob-${i}`}
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={p.dateOfBirth}
                  onChange={(e) => update(i, "dateOfBirth", e.target.value)}
                  className={missing(p, "dateOfBirth") ? errorRing : undefined}
                />
              </div>
            </div>

            {/* ------------------------ flight (optional) ------------------ */}
            <div className="rounded-xl bg-muted/30 p-4 space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Plane className="h-4 w-4 text-sky-500" />
                Flight Details
                <span className="text-xs font-normal">
                  — optional, helps us time your transfer
                </span>
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`ftype-${i}`}>Flight Type</Label>
                  <Select
                    value={p.flightType || undefined}
                    onValueChange={(v) => update(i, "flightType", v)}
                  >
                    <SelectTrigger id={`ftype-${i}`}>
                      <SelectValue placeholder="Not applicable" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARRIVAL">Arrival Flight</SelectItem>
                      <SelectItem value="DEPARTURE">Departure Flight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`fdate-${i}`}>Flight Date</Label>
                  <Input
                    id={`fdate-${i}`}
                    type="date"
                    value={p.flightDate}
                    onChange={(e) => update(i, "flightDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`fnum-${i}`}>Flight Number</Label>
                  <Input
                    id={`fnum-${i}`}
                    placeholder="e.g. QR 674"
                    value={p.flightNumber}
                    onChange={(e) => update(i, "flightNumber", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`ftime-${i}`}>Flight Time</Label>
                  <Input
                    id={`ftime-${i}`}
                    type="time"
                    value={p.flightTime}
                    onChange={(e) => update(i, "flightTime", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {showErrors && !passengersComplete(passengers) && (
          <p className="text-sm text-destructive">
            Please fill in the name, country and date of birth for every
            passenger.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
