"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
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
import {
  QrCode,
  FileDown,
  Download,
  Loader2,
  Ship,
  MapPin,
  Calendar,
} from "lucide-react";
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

/**
 * Seat keys are internal ("virtual-1", "lower-0-2"), so never show them raw.
 * Prefer a real seat number, else the trailing number of the key, else the
 * passenger's position in the booking.
 */
const seatLabel = (seat, index) => {
  if (seat?.seatNumber) return String(seat.seatNumber);
  const trailing = String(seat?.key ?? "").match(/(\d+)$/);
  return trailing ? trailing[1] : String(index + 1);
};

export default function ETicketDialog({ booking, trigger }) {
  const printRef = useRef(null);
  const [busy, setBusy] = useState(false);

  // The check-in scanner looks the booking up by id, so that is all the code
  // needs to carry - keeping it short also keeps the QR easy to scan.
  const qrValue = booking?.id ?? "";
  const currency = booking?.currency || "MVR";
  // The API appends a "_meta" entry to seatNumbers; it is not a seat.
  const seats = (booking?.seatNumbers || []).filter(
    (s) => s && s.key !== "_meta"
  );
  const passengers = booking?.passengers || [];

  const handleDownloadPdf = async () => {
    const canvas = printRef.current?.querySelector("canvas");
    const ref = bookingRef(booking?.id);
    try {
      setBusy(true);
      // Loaded on demand — jsPDF is heavy and most visits never download.
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const pageW = doc.internal.pageSize.getWidth();
      const margin = 48;
      let y = margin;

      const line = (label, value, gap = 20) => {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(String(label), margin, y);
        doc.setFontSize(11);
        doc.setTextColor(15);
        doc.text(String(value ?? "—"), pageW - margin, y, { align: "right" });
        y += gap;
      };

      doc.setFontSize(20);
      doc.setTextColor(15);
      doc.text("Myboat MV", margin, y);
      y += 18;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Maldives Ferry & Speedboat E-Ticket", margin, y);
      y += 26;

      doc.setDrawColor(226);
      doc.line(margin, y, pageW - margin, y);
      y += 26;

      // QR, centred
      if (canvas) {
        const size = 170;
        doc.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          (pageW - size) / 2,
          y,
          size,
          size
        );
        y += size + 16;
      }
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("Show this code at the jetty for boarding", pageW / 2, y, {
        align: "center",
      });
      y += 12;
      doc.setFontSize(13);
      doc.setTextColor(15);
      doc.text(`Booking reference: ${ref}`, pageW / 2, y + 14, {
        align: "center",
      });
      y += 44;

      doc.line(margin, y, pageW - margin, y);
      y += 26;

      line("Route", `${booking?.route?.sourceCity ?? "—"} to ${booking?.route?.destinationCity ?? "—"}`);
      line("Travel date", fmtDate(booking?.bookingDate));
      line("Vessel", booking?.vehicle?.vehicleName ?? "—");
      if (booking?.boardingPoint?.locationName) {
        line("Boarding point", booking.boardingPoint.locationName);
      }
      line("Seats", seats.length ? seats.map(seatLabel).join(", ") : "—");
      line(
        "Total paid",
        formatMoney(booking?.finalAmount ?? booking?.totalAmount, currency)
      );

      if (passengers.length) {
        y += 10;
        doc.line(margin, y, pageW - margin, y);
        y += 24;
        doc.setFontSize(12);
        doc.setTextColor(15);
        doc.text("Passengers", margin, y);
        y += 20;
        passengers.forEach((p) => {
          if (y > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
          }
          line(
            p.fullName,
            `${p.country ?? ""}${p.seatNumber ? ` • Seat ${p.seatNumber}` : ""}`,
            18
          );
        });
      }

      doc.save(`myboat-eticket-${ref}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Could not generate the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
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
          <Button
            onClick={handleDownloadPdf}
            disabled={busy}
            className="flex-1 gap-2"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {busy ? "Preparing..." : "Download PDF"}
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
