"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Handshake,
  Loader2,
  MapPin,
  Percent,
  Search,
  Ship,
  Tag,
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || "";

const logoUrl = (src) =>
  !src ? null : src.startsWith("http") ? src : `${ROOT_URL}${src}`;

const STATUS = {
  ACTIVE: { label: "Active", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  PENDING: { label: "Awaiting approval", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  REJECTED: { label: "Declined", cls: "bg-red-100 text-red-700 border-red-200" },
  SUSPENDED: { label: "Suspended", cls: "bg-zinc-200 text-zinc-700 border-zinc-300" },
};

export default function AgentPartnersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/operator-agents/my-partnerships");
        setRows(res.data?.data || []);
      } catch {
        toast.error("Could not load your partnerships");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const active = rows.filter((r) => r.status === "ACTIVE");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ocean-deep">
            <Handshake className="h-6 w-6 text-sky-500" />
            My Partnerships
          </h1>
          <p className="text-sm text-muted-foreground">
            Operators you sell for. Your discount is applied automatically at
            checkout.
          </p>
        </div>
        <Button asChild className="rounded-full bg-coral text-white hover:bg-coral-soft">
          <Link href="/agent/operators">
            <Search className="mr-1.5 h-4 w-4" /> Find operators
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Ship className="mx-auto h-10 w-10 text-sky-300" />
            <p className="mt-3 font-medium">No partnerships yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Apply to the speedboat lines you work with — once they approve
              you, their fares drop to your net rate.
            </p>
            <Button asChild className="mt-4 rounded-full">
              <Link href="/agent/operators">Browse operators</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {active.length} active {active.length === 1 ? "partner" : "partners"} —
              book through <Link href="/ferry" className="text-sky-600 underline">Book a Trip</Link> to
              get your rate.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((r) => {
              const s = STATUS[r.status] || STATUS.PENDING;
              const logo = logoUrl(r.vendor?.businessLogo);
              return (
                <Card key={r.id}>
                  <CardContent className="flex items-start gap-3 p-4">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo}
                        alt={r.vendor?.businessName || "Operator"}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100">
                        <Ship className="h-5 w-5 text-sky-500" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {r.vendor?.businessName || "Operator"}
                        </span>
                        <Badge variant="outline" className={s.cls}>
                          {s.label}
                        </Badge>
                      </div>

                      {r.vendor?.baseIsland && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {r.vendor.baseIsland}
                        </p>
                      )}

                      {r.status === "ACTIVE" ? (
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          <Badge variant="outline" className="gap-1">
                            <Tag className="h-3 w-3" /> {Number(r.discountPercent)}% off fares
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Percent className="h-3 w-3" /> {Number(r.commissionPercent)}% commission
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {r.status === "PENDING"
                            ? "The operator sets your rates when they approve."
                            : r.status === "SUSPENDED"
                            ? "Contact Myboat support."
                            : "You can apply again from Find Operators."}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
