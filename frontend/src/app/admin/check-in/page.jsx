"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, QrCode, ScanLine, XCircle } from "lucide-react";
import api from "@/lib/axios";

const extractBookingRef = (raw) => {
  if (!raw) return "";
  const s = String(raw).trim();
  // Support raw ids, URLs (?booking=...), or JSON payloads
  try {
    const parsed = JSON.parse(s);
    if (parsed && (parsed.bookingId || parsed.id || parsed.ref)) {
      return parsed.bookingId || parsed.id || parsed.ref;
    }
  } catch (_) {
    /* not JSON */
  }
  try {
    if (s.startsWith("http")) {
      const u = new URL(s);
      const q = u.searchParams.get("booking") || u.searchParams.get("ref");
      if (q) return q;
      // Fall back to last path segment
      const parts = u.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || s;
    }
  } catch (_) {
    /* not a URL */
  }
  return s;
};

export default function CheckInPage() {
  const [scanning, setScanning] = useState(false);
  const [manualRef, setManualRef] = useState("");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const scannerRef = useRef(null);
  const containerId = "qr-scanner-video";

  const loadRecent = useCallback(async () => {
    try {
      const { data } = await api.get("/checkins", { params: { today: 1 } });
      setRecentCheckins(data?.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const lookup = useCallback(async (ref) => {
    const cleaned = extractBookingRef(ref);
    if (!cleaned) return;
    setLoading(true);
    setManualRef(cleaned);
    try {
      const { data } = await api.get(
        `/checkins/lookup/${encodeURIComponent(cleaned)}`
      );
      setBooking(data?.data);
    } catch (err) {
      toast.error(err.message || "Booking not found");
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (scannerRef.current) return;
    try {
      const mod = await import("html5-qrcode");
      const { Html5QrcodeScanner } = mod;
      const scanner = new Html5QrcodeScanner(
        containerId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose */ false
      );
      scanner.render(
        async (decodedText) => {
          await stopScanner();
          await lookup(decodedText);
        },
        () => {
          /* ignore per-frame decode errors */
        }
      );
      scannerRef.current = scanner;
      setScanning(true);
    } catch (err) {
      console.error(err);
      toast.error("Camera scanner failed to start. Use manual entry instead.");
    }
  }, [lookup, stopScanner]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (_) {}
      }
    };
  }, []);

  const confirm = async () => {
    if (!booking) return;
    setConfirming(true);
    try {
      const { data } = await api.post("/checkins", { bookingId: booking.id });
      const customer =
        data?.data?.booking?.user?.firstName || booking.user?.firstName || "guest";
      toast.success(`Checked in — ${customer}`);
      setBooking(null);
      setManualRef("");
      loadRecent();
    } catch (err) {
      toast.error(err.message || "Failed to check in");
    } finally {
      setConfirming(false);
    }
  };

  const cancel = () => {
    setBooking(null);
    setManualRef("");
  };

  const alreadyCheckedIn = !!booking?.checkedInAt || !!booking?.checkin;
  const seatCount = Array.isArray(booking?.seatNumbers)
    ? booking.seatNumbers.filter((s) => s?.key !== "_meta").length
    : 0;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <QrCode className="h-6 w-6 text-sky-500" /> QR Check-in
        </h1>
        <p className="text-sm text-muted-foreground">
          Scan passenger tickets to check them in
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scanner column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-sky-500" /> Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              id={containerId}
              className="rounded-lg border overflow-hidden min-h-[260px] bg-muted/30 flex items-center justify-center"
            >
              {!scanning && (
                <div className="text-sm text-muted-foreground py-6 text-center px-4">
                  Press <b>Start Scanner</b> to activate the camera and scan a
                  ticket QR code.
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {!scanning ? (
                <Button
                  onClick={startScanner}
                  className="bg-sky-500 hover:bg-sky-600 text-white"
                >
                  Start Scanner
                </Button>
              ) : (
                <Button variant="outline" onClick={stopScanner}>
                  Stop Scanner
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details column */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Booking code</Label>
              <div className="flex gap-2">
                <Input
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  placeholder="Enter booking ID / ref"
                />
                <Button
                  variant="outline"
                  onClick={() => lookup(manualRef)}
                  disabled={loading || !manualRef}
                >
                  {loading ? "Looking up..." : "Look up"}
                </Button>
              </div>
            </div>

            {booking ? (
              <div className="rounded-lg border p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    {booking.user?.firstName} {booking.user?.lastName}
                  </div>
                  <Badge
                    className={
                      alreadyCheckedIn
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-sky-100 text-sky-700 border border-sky-200"
                    }
                  >
                    {alreadyCheckedIn ? "Checked in" : booking.status}
                  </Badge>
                </div>
                <div className="text-muted-foreground text-xs">
                  {booking.user?.email || booking.user?.mobile}
                </div>
                <div>
                  Route:{" "}
                  <span className="font-medium">
                    {booking.route?.sourceCity} → {booking.route?.destinationCity}
                  </span>
                </div>
                <div>
                  Date:{" "}
                  <span className="font-medium">
                    {booking.bookingDate
                      ? new Date(booking.bookingDate).toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div>
                  Seats: <span className="font-medium">{seatCount || "—"}</span>
                </div>
                <div>
                  Payment:{" "}
                  <span className="font-medium">
                    {(booking.currency || "MVR") === "USD" ? "$" : "MVR"}{" "}
                    {Number(booking.finalAmount || 0).toFixed(2)} —{" "}
                    {booking.paymentStatus}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                    onClick={confirm}
                    disabled={confirming || alreadyCheckedIn}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />{" "}
                    {alreadyCheckedIn
                      ? "Already Checked In"
                      : confirming
                      ? "Confirming..."
                      : "Confirm Check-in"}
                  </Button>
                  <Button variant="outline" onClick={cancel}>
                    <XCircle className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-6 text-center border rounded-lg">
                Scan a ticket or enter a booking code to see details.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Check-ins today</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCheckins.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No check-ins recorded yet today.
            </p>
          ) : (
            <ul className="divide-y">
              {recentCheckins.map((c) => (
                <li
                  key={c.id}
                  className="py-2 flex items-center justify-between text-sm"
                >
                  <div>
                    <div className="font-medium">
                      {c.booking?.user?.firstName}{" "}
                      {c.booking?.user?.lastName || ""}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.booking?.route?.sourceCity} →{" "}
                      {c.booking?.route?.destinationCity}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(c.scannedAt).toLocaleTimeString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
