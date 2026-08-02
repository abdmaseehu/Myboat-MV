"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QrCode, Printer, Download, Ship, MapPin, Calendar } from "lucide-react";
import { formatMoney } from "@/lib/currency";

/** Short, human-quotable reference. The full id still lives in the QR. */
export function bookingRef(id) {
  return id ? id.slice(-8).toUpperCase() : "—";
}

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const seatLabel = (seat, index) =>
  seat?.seatNumber ||
  seat?.key?.split("-").slice(-2).join("-") ||
  `Seat ${index + 1}`;

export default function ETicketDialog({ booking, trigger }) {
  const printRef = useRef(null);

  // The check-in scanner looks the booking up by id, so that is all the code
  // needs to carry - keeping it short also keeps the QR easy to scan.
  const qrValue = booking?.id ?? "";
  const currency = booking?.currency || "MVR";
  const seats = (booking?.seatNumbers || []).filter(Boolean);
  const passengers = booking?.passengers || [];

  const handlePrint = () => {
    const node = printRef.current;
    if (!node) return;
    const w = window.open("", "_blank", "width=800,height=1000");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Myboat MV e-ticket ${bookingRef(
      booking?.id
    )}</title>
      <style>
        body{font-family:ui-sans-serif,system-ui,sans-serif;padding:32px;color:#0f172a}
        h1{font-size:20px;margin:0 0 4px}
        .muted{color:#64748b;font-size:12px}
        .row{display:flex;justify-content:space-between;gap:16px;margin:6px 0;font-size:14px}
        .box{border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-top:16px}
        canvas{display:block;margin:16px auto}
      </style></head><body>${node.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    // Give the cloned canvas a tick to paint before the print dialog opens.
    setTimeout(() => w.print(), 250);
  };

  const handleDownloadQr = () => {
    const canvas = printRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `myboat-ticket-${bookingRef(booking?.id)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            <QrCode className="h-4 w-4" />
            View E-Ticket
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-sky-500" />
            Your E-Ticket
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div ref={printRef} className="px-6 pb-2">
            <h1 className="text-lg font-semibold">Myboat MV</h1>
            <p className="muted text-xs text-muted-foreground">
              Booking reference {bookingRef(booking?.id)}
            </p>

            {/* ------------------------------ QR ------------------------- */}
            <div className="flex flex-col items-center my-5">
              <div className="rounded-2xl bg-white p-4 shadow-sm border">
                <QRCodeCanvas
                  value={qrValue}
                  size={190}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Show this code at the jetty for boarding
              </p>
            </div>

            <Separator />

            {/* ---------------------------- trip ------------------------- */}
            <div className="box space-y-2 py-4">
              <div className="row flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Route
                </span>
                <span className="font-medium text-right">
                  {booking?.route?.sourceCity ?? "—"} →{" "}
                  {booking?.route?.destinationCity ?? "—"}
                </span>
              </div>
              <div className="row flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Travel date
                </span>
                <span className="font-medium">{fmtDate(booking?.bookingDate)}</span>
              </div>
              <div className="row flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Ship className="h-3.5 w-3.5" /> Vessel
                </span>
                <span className="font-medium text-right">
                  {booking?.vehicle?.vehicleName ?? "—"}
                </span>
              </div>
              {booking?.boardingPoint?.locationName && (
                <div className="row flex justify-between text-sm">
                  <span className="text-muted-foreground">Boarding point</span>
                  <span className="font-medium text-right">
                    {booking.boardingPoint.locationName}
                  </span>
                </div>
              )}
              <div className="row flex justify-between text-sm">
                <span className="text-muted-foreground">Seats</span>
                <span className="font-medium text-right">
                  {seats.length
                    ? seats.map(seatLabel).join(", ")
                    : `${passengers.length || 1}`}
                </span>
              </div>
              <div className="row flex justify-between text-sm">
                <span className="text-muted-foreground">Total paid</span>
                <span className="font-semibold text-sky-600">
                  {formatMoney(booking?.finalAmount ?? booking?.totalAmount, currency)}
                </span>
              </div>
            </div>

            {/* -------------------------- passengers --------------------- */}
            {passengers.length > 0 && (
              <div className="box py-4">
                <p className="text-sm font-medium mb-2">Passengers</p>
                <div className="space-y-2">
                  {passengers.map((p, i) => (
                    <div
                      key={i}
                      className="text-sm flex justify-between gap-3 border-b last:border-0 pb-2 last:pb-0"
                    >
                      <span className="font-medium">{p.fullName}</span>
                      <span className="text-muted-foreground text-right shrink-0">
                        {p.country}
                        {p.seatNumber ? ` • Seat ${p.seatNumber}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 px-6 pb-6 pt-2">
          <Button onClick={handlePrint} className="flex-1 gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={handleDownloadQr}
            variant="outline"
            className="flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            Save QR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
