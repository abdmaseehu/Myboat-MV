"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/use-auth";
import {
  Ship,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  Building,
  Receipt,
  Timer,
  AlertTriangle,
  RotateCcw,
  Banknote,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  BookingStatusActionButtons,
  BookingStatusRows,
  CancelBookingDialog,
  needsCashConfirmation,
  statusBadgeClass,
} from "./booking-status-actions";

export default function BookingDetails({ booking, onUpdated }) {
  const router = useRouter();
  const { user } = useAuth();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    return new Date(time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = statusBadgeClass;

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case "PAID":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "PENDING":
        return <AlertCircle className="h-4 w-4 text-sky-500" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Only ADMIN, or the VENDOR that owns the booking, may change its status.
  // Booking.vendorId references User.id, so it is compared against user.id.
  const canUpdateStatus = () =>
    user?.role === "ADMIN" ||
    (user?.role === "VENDOR" &&
      (user?.id === booking.vendorId || user?.id === booking.route?.userId));

  // The PATCH response returns the booking with the same include shape as the
  // detail fetch, so we can swap it in place instead of reloading the page.
  const handleUpdated = (updated) => {
    if (onUpdated) onUpdated(updated);
    else window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header Section with Enhanced Status Display */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Receipt className="h-6 w-6 text-sky-500" />
            <h2 className="text-2xl font-bold">
              Booking #{booking.id.slice(-8)}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Created on {formatDate(booking.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-sm py-1 px-4 border shadow-sm",
              getStatusColor(booking.status)
            )}
          >
            {booking.status}
          </Badge>
        </div>
      </div>

      {/* Status Management Panel */}
      {canUpdateStatus() && (
        <Card className="rounded-2xl shadow-premium border-sky-200 dark:border-sky-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">
              Booking Status
            </CardTitle>
            <ShieldCheck className="h-5 w-5 text-lagoon" />
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <BookingStatusRows booking={booking} />

            {booking.status === "CANCELLED" && booking.cancellationReason && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Reason: </span>
                {booking.cancellationReason}
              </p>
            )}

            {needsCashConfirmation(booking) && (
              <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
                <Banknote className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  This customer chose to pay cash. Confirm the booking once
                  payment is collected.
                </p>
              </div>
            )}

            <Separator />

            <BookingStatusActionButtons
              booking={booking}
              onUpdated={handleUpdated}
              onCancelRequest={() => setShowCancelDialog(true)}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">
              Customer Information
            </CardTitle>
            <User className="h-5 w-5 text-sky-500" />
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
                <span className="text-sm font-medium text-sky-700">
                  {booking.user?.firstName?.[0]}
                  {booking.user?.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium">
                  {booking.user?.firstName} {booking.user?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">Customer</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-sky-500" />
                <span>{booking.user?.email}</span>
              </div>
              {booking.user?.mobile && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-sky-500" />
                  <span>{booking.user?.mobile}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Journey Details */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">
              Journey Details
            </CardTitle>
            <Ship className="h-5 w-5 text-sky-500" />
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Route</p>
                <p className="font-medium">
                  {booking.route?.sourceCity} → {booking.route?.destinationCity}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Vehicle</div>
                <div className="flex items-center gap-2">
                  <Ship className="h-4 w-4 text-sky-500" />
                  <span className="font-medium">
                    {booking.vehicle?.vehicleName}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {booking.vehicle?.vehicleNumber}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Travel Date</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-sky-500" />
                  <span className="font-medium">
                    {formatDate(booking.bookingDate)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Boarding & Dropping Points */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">
              Boarding & Dropping Points
            </CardTitle>
            <Building className="h-5 w-5 text-sky-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="relative pb-8">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-sky-200" />
              <div className="relative space-y-8">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center z-10">
                    <MapPin className="h-4 w-4 text-sky-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Boarding Point
                    </p>
                    <p className="font-medium">
                      {booking.boardingPoint?.locationName}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-sky-500" />
                      <span>
                        {formatTime(booking.boardingPoint?.arrivalTime)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center z-10">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Dropping Point
                    </p>
                    <p className="font-medium">
                      {booking.droppingPoint?.locationName}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span>
                        {formatTime(booking.droppingPoint?.arrivalTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment & Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">
              Payment Details
            </CardTitle>
            <CreditCard className="h-5 w-5 text-sky-500" />
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <Badge variant="outline" className="font-medium">
                  {booking.paymentMethod}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment Status</span>
                <div className="flex items-center gap-2">
                  {getPaymentStatusIcon(booking.paymentStatus)}
                  <span className="font-medium">{booking.paymentStatus}</span>
                </div>
              </div>
              {booking.paymentIntentId && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">
                    {booking.paymentIntentId}
                  </span>
                </div>
              )}
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Amount
                </span>
                <span className="font-medium">${booking.totalAmount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Discount</span>
                <span className="font-medium text-green-500">
                  -${booking.discountAmount}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-medium">Final Amount</span>
                <span className="text-lg font-bold text-sky-500">
                  ${booking.finalAmount}
                </span>
              </div>
            </div>
            {(booking.cancellationCharge || booking.refundAmount) && (
              <>
                <Separator />
                <div className="space-y-2">
                  {booking.cancellationCharge && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Cancellation Charge
                      </span>
                      <span className="font-medium text-red-500">
                        ${booking.cancellationCharge}
                      </span>
                    </div>
                  )}
                  {booking.refundAmount && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Refund Amount
                      </span>
                      <span className="font-medium text-green-500">
                        ${booking.refundAmount}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seat Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">
            Selected Seats
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Total Seats: {booking.seatNumbers?.length || 0}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {booking.seatNumbers?.map((seat, index) => (
              <div
                key={`${booking.id}-seat-${index}`}
                className="flex flex-col p-4 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="text-lg font-semibold">
                  {seat?.key?.split("-").slice(-2).join("-") ||
                    `Seat ${index + 1}`}
                </div>
                <div className="text-sm text-muted-foreground">
                  {seat?.key?.split("-")[0]?.toUpperCase() || "DECK"} •{" "}
                  {seat?.type || "SEAT"}
                </div>
                <div className="mt-2 text-sky-500 font-semibold">
                  ${seat?.price || 0}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Booking Dialog (asks for an optional reason) */}
      <CancelBookingDialog
        booking={booking}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onDone={handleUpdated}
      />
    </div>
  );
}
