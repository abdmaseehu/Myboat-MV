"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Toaster } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Receipt,
  CheckCircle2,
  Clock,
  DollarSign,
  Coins,
  Hourglass,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import { formatMoney } from "@/lib/currency";
import CreateManualBooking from "@/components/admin/bookings/create-manual-booking";

const BookingListFactory = dynamic(
  () => import("@/components/admin/bookings/booking-list-factory"),
  { ssr: false }
);

function StatCard({ icon: Icon, label, value, tone = "sky", children }) {
  const tones = {
    sky: "bg-sky-100 text-sky-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    violet: "bg-violet-100 text-violet-600",
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          {value !== undefined && (
            <p className="text-xl font-semibold">{value}</p>
          )}
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BookingsPage() {
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    revenueByCurrency: {},
    countByCurrency: {},
  });
  const [showModal, setShowModal] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  // When set, the list only fetches PENDING bookings.
  const [statusFilter, setStatusFilter] = useState("");

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get("/bookings", { params: { stats: 1 } });
      const data = res?.data?.data;
      if (data && typeof data === "object" && "revenueByCurrency" in data) {
        setStats(data);
        return;
      }
      // Fallback: compute from list
      const listRes = await api.get("/bookings", { params: { limit: 500 } });
      const bookings =
        listRes?.data?.data?.bookings || listRes?.data?.data || [];
      const agg = bookings.reduce(
        (acc, b) => {
          acc.total += 1;
          if (b.status === "CONFIRMED") acc.confirmed += 1;
          if (b.status === "PENDING") acc.pending += 1;
          const cur = (b.currency || "MVR").toUpperCase();
          acc.countByCurrency[cur] = (acc.countByCurrency[cur] || 0) + 1;
          if (b.paymentStatus === "PAID") {
            acc.revenueByCurrency[cur] =
              (acc.revenueByCurrency[cur] || 0) + Number(b.finalAmount || 0);
          }
          return acc;
        },
        {
          total: 0,
          confirmed: 0,
          pending: 0,
          revenueByCurrency: {},
          countByCurrency: {},
        }
      );
      setStats(agg);
    } catch (err) {
      console.error("Failed to load booking stats", err);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats, reloadKey]);

  const onBookingCreated = () => {
    setReloadKey((k) => k + 1);
  };

  const revenue = stats.revenueByCurrency || {};
  const counts = stats.countByCurrency || {};
  const mvr = Number(revenue.MVR || 0);
  const usd = Number(revenue.USD || 0);
  const mvrCount = Number(counts.MVR || 0);
  const usdCount = Number(counts.USD || 0);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowModal(true)}
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Manual Booking
          </Button>
        </div>
      </div>

      {/* MVR and USD bookings are counted INDEPENDENTLY. Never summed together. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Coins} label="MVR Bookings" tone="green">
          <div className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
            {formatMoney(mvr, "MVR")}
          </div>
          <p className="text-xs text-muted-foreground">
            {mvrCount} booking{mvrCount === 1 ? "" : "s"}
          </p>
        </StatCard>
        <StatCard icon={DollarSign} label="USD Bookings" tone="sky">
          <div className="text-xl font-semibold text-sky-600 dark:text-sky-400">
            {formatMoney(usd, "USD")}
          </div>
          <p className="text-xs text-muted-foreground">
            {usdCount} booking{usdCount === 1 ? "" : "s"}
          </p>
        </StatCard>
        <StatCard
          icon={CheckCircle2}
          label="Confirmed"
          value={stats.confirmed}
          tone="green"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={stats.pending}
          tone="orange"
        />
      </div>

      {/* Awaiting-confirmation banner: customer cash bookings land as PENDING
          and stay there until the operator confirms them. */}
      {stats.pending > 0 && !bannerDismissed && (
        <div className="relative flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-premium sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/40 dark:bg-amber-500/10">
          <div className="flex items-start gap-3 pr-8">
            <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                {stats.pending} booking{stats.pending === 1 ? "" : "s"} awaiting
                confirmation
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                These customers chose to pay at the counter. Confirm them once
                payment is collected.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setStatusFilter((prev) => (prev === "PENDING" ? "" : "PENDING"))
              }
              className="border-amber-500 text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-500/20"
            >
              {statusFilter === "PENDING" ? "Show all" : "Show pending only"}
            </Button>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setBannerDismissed(true)}
            className="absolute right-3 top-3 rounded-md p-1 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-500/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <BookingListFactory
        key={reloadKey}
        extraParams={statusFilter ? { status: statusFilter } : undefined}
        onStatusChange={loadStats}
      />

      <CreateManualBooking
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={onBookingCreated}
      />
    </div>
  );
}
