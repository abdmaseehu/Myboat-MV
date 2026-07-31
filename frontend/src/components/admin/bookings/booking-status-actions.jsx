"use client";

/**
 * Shared booking status-management helpers.
 *
 * Booking status and payment status are INDEPENDENT fields:
 *  - Confirming a booking does not mark it paid.
 *  - Marking it paid does not confirm it.
 * Customer cash bookings are created as PENDING / PENDING and the operator
 * confirms them once the money is collected at the counter.
 */

import { useState } from "react";
import {
  CheckCircle2,
  CheckCheck,
  Banknote,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

/** Short human-friendly reference for a booking. */
export const bookingRef = (booking) =>
  booking?.id ? `#${String(booking.id).slice(-8)}` : "";

export const isUnpaid = (booking) => booking?.paymentStatus !== "PAID";
export const isPending = (booking) => booking?.status === "PENDING";
export const isCancelled = (booking) => booking?.status === "CANCELLED";

/** A cash booking that still needs the operator to collect + confirm. */
export const needsCashConfirmation = (booking) =>
  booking?.paymentMethod === "CASH" && isPending(booking) && isUnpaid(booking);

export const statusBadgeClass = (status) => {
  switch (status) {
    case "CONFIRMED":
      return "border-emerald-500/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
    case "PENDING":
      return "border-amber-500/60 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
    case "CANCELLED":
      return "border-red-500/60 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
    default:
      return "border-zinc-300 text-zinc-600 dark:text-zinc-400";
  }
};

export const paymentBadgeClass = (status) => {
  switch (status) {
    case "PAID":
      return "border-emerald-500/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
    case "FAILED":
      return "border-red-500/60 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
    case "REFUNDED":
      return "border-violet-500/60 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400";
    default:
      // PENDING / PROCESSING / AWAITING_PAYMENT — all "not yet money in hand"
      return "border-amber-500/60 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
  }
};

/**
 * PATCH a booking's status fields.
 * Toasts on success/failure and resolves with the updated booking (or null).
 */
export async function patchBookingStatus(booking, payload, successMessage) {
  try {
    const res = await api.patch(`/bookings/${booking.id}`, payload);
    if (res?.data?.success === false) {
      toast.error(res.data.message || "Failed to update booking");
      return null;
    }
    toast.success(successMessage);
    return res?.data?.data || null;
  } catch (error) {
    toast.error(
      error?.response?.data?.message || "Failed to update booking status"
    );
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Action definitions (shared by the list dropdown and the detail page) */
/* ------------------------------------------------------------------ */

export const CONFIRM_ACTION = {
  key: "confirm",
  label: "Confirm Booking",
  Icon: CheckCircle2,
  show: (b) => isPending(b),
  payload: { status: "CONFIRMED" },
  message: (b) => `Booking ${bookingRef(b)} confirmed`,
  listClassName:
    "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer",
  buttonClassName:
    "bg-emerald-600 hover:bg-emerald-700 text-white shadow-premium",
};

export const MARK_PAID_ACTION = {
  key: "paid",
  label: "Mark as Paid",
  Icon: Banknote,
  show: (b) => isUnpaid(b),
  payload: { paymentStatus: "PAID" },
  message: (b) => `Booking ${bookingRef(b)} marked as paid`,
  listClassName:
    "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer",
  buttonClassName:
    "border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
  buttonVariant: "outline",
};

export const CONFIRM_AND_PAY_ACTION = {
  key: "confirm-paid",
  label: "Confirm & Mark Paid",
  Icon: CheckCheck,
  show: (b) => isPending(b) && isUnpaid(b),
  payload: { status: "CONFIRMED", paymentStatus: "PAID" },
  message: (b) => `Booking ${bookingRef(b)} confirmed and marked paid`,
  listClassName:
    "text-lagoon hover:text-lagoon hover:bg-sky-50 dark:hover:bg-sky-500/10 cursor-pointer font-medium",
  buttonClassName: "bg-lagoon hover:bg-lagoon-dark text-white shadow-lagoon",
};

/** Every non-destructive one-click action, in display order. */
export const QUICK_ACTIONS = [
  CONFIRM_AND_PAY_ACTION,
  CONFIRM_ACTION,
  MARK_PAID_ACTION,
];

/**
 * Build the `customActions` array for the bookings dynamic list.
 * `onCancelRequest(booking, refresh)` is invoked for the destructive action so
 * the caller can open its own reason dialog.
 */
export function buildBookingStatusActions({ onCancelRequest, onChanged }) {
  const quick = QUICK_ACTIONS.map((action) => ({
    label: action.label,
    icon: <action.Icon className="h-4 w-4" />,
    className: action.listClassName,
    show: action.show,
    onClick: async (booking, refresh) => {
      const updated = await patchBookingStatus(
        booking,
        action.payload,
        action.message(booking)
      );
      if (updated) {
        refresh?.();
        onChanged?.();
      }
    },
  }));

  return [
    ...quick,
    {
      label: "Cancel Booking",
      icon: <XCircle className="h-4 w-4" />,
      className: "text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer",
      show: (booking) => !isCancelled(booking),
      onClick: (booking, refresh) => onCancelRequest?.(booking, refresh),
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Cancel dialog                                                       */
/* ------------------------------------------------------------------ */

export function CancelBookingDialog({ booking, open, onOpenChange, onDone }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!booking) return;
    setLoading(true);
    const updated = await patchBookingStatus(
      booking,
      {
        status: "CANCELLED",
        ...(reason.trim() ? { cancellationReason: reason.trim() } : {}),
      },
      `Booking ${bookingRef(booking)} cancelled`
    );
    setLoading(false);
    if (updated) {
      setReason("");
      onOpenChange?.(false);
      onDone?.(updated);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("");
        onOpenChange?.(next);
      }}
    >
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Cancel booking {bookingRef(booking)}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            The seats will be released and the customer will see this booking as
            cancelled.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cancellation-reason">Reason (optional)</Label>
          <Textarea
            id="cancellation-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer did not show up at the counter"
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Keep booking</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Cancel booking
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ------------------------------------------------------------------ */
/* Button row (detail page)                                            */
/* ------------------------------------------------------------------ */

export function BookingStatusActionButtons({
  booking,
  onUpdated,
  onCancelRequest,
  size = "lg",
  className,
}) {
  const [busyKey, setBusyKey] = useState(null);

  const run = async (action) => {
    setBusyKey(action.key);
    const updated = await patchBookingStatus(
      booking,
      action.payload,
      action.message(booking)
    );
    setBusyKey(null);
    if (updated) onUpdated?.(updated);
  };

  const visible = QUICK_ACTIONS.filter((action) => action.show(booking));
  const showCancel = !isCancelled(booking);

  if (visible.length === 0 && !showCancel) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        No status changes available for this booking.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col sm:flex-row sm:flex-wrap gap-3", className)}>
      {visible.map((action) => (
        <Button
          key={action.key}
          size={size}
          variant={action.buttonVariant}
          disabled={busyKey !== null}
          onClick={() => run(action)}
          className={cn("w-full sm:w-auto", action.buttonClassName)}
        >
          {busyKey === action.key ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <action.Icon className="mr-2 h-4 w-4" />
          )}
          {action.label}
        </Button>
      ))}

      {showCancel && (
        <Button
          size={size}
          variant="outline"
          disabled={busyKey !== null}
          onClick={() => onCancelRequest?.(booking)}
          className="w-full sm:w-auto border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Cancel Booking
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Full status panel (detail page)                                     */
/* ------------------------------------------------------------------ */

export function BookingStatusRows({ booking }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">Booking Status</span>
        <Badge
          variant="outline"
          className={cn(
            "px-3 py-1 text-sm border shadow-sm",
            statusBadgeClass(booking.status)
          )}
        >
          {booking.status}
        </Badge>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">Payment Status</span>
        <Badge
          variant="outline"
          className={cn(
            "px-3 py-1 text-sm border shadow-sm",
            paymentBadgeClass(booking.paymentStatus)
          )}
        >
          {booking.paymentStatus}
        </Badge>
      </div>
    </div>
  );
}
