"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import { useAuth } from "@/store/use-auth";

const CATEGORY_OPTIONS = [
  { value: "LOCAL", label: "Local", currency: "MVR" },
  { value: "EXPAT", label: "Expat", currency: "MVR" },
  { value: "TOURIST", label: "Tourist", currency: "USD" },
];

const priceForCategory = (schedule, category) => {
  if (!schedule) return 0;
  if (category === "TOURIST") return Number(schedule.priceTouristUsd || 0);
  if (category === "EXPAT") return Number(schedule.priceExpatMvr || 0);
  return Number(schedule.priceLocalMvr || 0);
};

const currencyFor = (category) => (category === "TOURIST" ? "USD" : "MVR");

const formatMoney = (currency, amount) =>
  `${currency === "USD" ? "$" : "MVR"} ${Number(amount || 0).toFixed(2)}`;

export default function CreateManualBooking({ open, onClose, onSuccess }) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    scheduleId: "",
    bookingDate: new Date().toISOString().slice(0, 10),
    seats: 1,
    passengerCategory: "LOCAL",
    agentId: "",
    paymentMethod: "CASH",
    paymentStatus: "PAID",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [schedRes, agentsRes] = await Promise.all([
          api.get("/bus-schedules", { params: { limit: 100 } }),
          api.get("/operator-agents", { params: { status: "ACTIVE" } }),
        ]);
        if (cancelled) return;
        const schedList =
          schedRes?.data?.data?.busSchedules ||
          schedRes?.data?.data?.schedules ||
          schedRes?.data?.data ||
          [];
        setSchedules(Array.isArray(schedList) ? schedList : []);
        setAgents(agentsRes?.data?.data || []);
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Failed to load form data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedSchedule = useMemo(
    () => schedules.find((s) => s.id === form.scheduleId),
    [schedules, form.scheduleId]
  );
  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === form.agentId),
    [agents, form.agentId]
  );

  const unitPrice = priceForCategory(selectedSchedule, form.passengerCategory);
  const seats = Math.max(1, Number(form.seats) || 1);
  const subtotal = unitPrice * seats;
  const discountPct = selectedAgent ? Number(selectedAgent.discountPercent || 0) : 0;
  const commissionPct = selectedAgent
    ? Number(selectedAgent.commissionPercent || 0)
    : 0;
  const agentDiscount = subtotal * (discountPct / 100);
  const agentCommission = subtotal * (commissionPct / 100);
  const total = Math.max(0, subtotal - agentDiscount);
  const currency = currencyFor(form.passengerCategory);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.customerEmail || !form.customerPhone) {
      toast.error("Customer name, email and phone are required");
      return;
    }
    if (!form.scheduleId) {
      toast.error("Please select a schedule");
      return;
    }
    if (!selectedSchedule) {
      toast.error("Selected schedule not found");
      return;
    }

    const seatNumbers = Array.from({ length: seats }).map((_, i) => ({
      key: `MAN-${i + 1}`,
      seatNumber: `GUEST-${i + 1}`,
      deck: "LOWER",
      type: "SEAT",
      price: unitPrice,
    }));

    const payload = {
      isManual: true,
      vendorId: user?.id, // Booking.vendorId references User.id
      vehicleId: selectedSchedule.vehicleId || null,
      routeId: selectedSchedule.routeId || null,
      boardingPointId: null,
      droppingPointId: null,
      bookingDate: new Date(`${form.bookingDate}T12:00:00.000Z`).toISOString(),
      seatNumbers,
      totalAmount: subtotal,
      discountAmount: agentDiscount,
      finalAmount: total,
      paymentMethod: form.paymentMethod,
      paymentStatus: form.paymentStatus,
      passengerCategory: form.passengerCategory,
      currency,
      agentId: form.agentId || null,
      agentDiscount,
      agentCommission,
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      customerPhone: form.customerPhone,
      notes: form.notes || undefined,
    };

    setSaving(true);
    try {
      await api.post("/bookings", payload);
      toast.success("Manual booking created");
      onSuccess?.();
      onClose?.();
      setForm((f) => ({
        ...f,
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        notes: "",
      }));
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create booking");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Manual Booking</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Full Name *</Label>
              <Input
                value={form.customerName}
                onChange={(e) => set("customerName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.customerEmail}
                onChange={(e) => set("customerEmail", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Phone *</Label>
              <Input
                value={form.customerPhone}
                onChange={(e) => set("customerPhone", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1 md:col-span-2">
              <Label>Schedule *</Label>
              <Select
                value={form.scheduleId}
                onValueChange={(v) => set("scheduleId", v)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loading ? "Loading schedules..." : "Select a schedule"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.route
                        ? `${s.route.sourceCity} → ${s.route.destinationCity}`
                        : "Route"}
                      {" · "}
                      {s.departureDate
                        ? new Date(s.departureDate).toLocaleDateString()
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Booking Date</Label>
              <Input
                type="date"
                value={form.bookingDate}
                onChange={(e) => set("bookingDate", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Seats</Label>
              <Input
                type="number"
                min={1}
                value={form.seats}
                onChange={(e) => set("seats", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Passenger Category</Label>
              <Select
                value={form.passengerCategory}
                onValueChange={(v) => set("passengerCategory", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label} ({c.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Agent (optional)</Label>
              <Select
                value={form.agentId || "none"}
                onValueChange={(v) => set("agentId", v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.user?.firstName} {a.user?.lastName} ({a.user?.email})
                      {" — "}
                      {Number(a.discountPercent || 0)}% off
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Payment Method</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(v) => set("paymentMethod", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Payment Status</Label>
              <Select
                value={form.paymentStatus}
                onValueChange={(v) => set("paymentStatus", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
            />
          </div>

          <div className="rounded-lg border p-3 bg-muted/30 text-sm space-y-1">
            <div className="flex justify-between">
              <span>Unit price</span>
              <span>{formatMoney(currency, unitPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>
                Subtotal ({seats} × {formatMoney(currency, unitPrice)})
              </span>
              <span>{formatMoney(currency, subtotal)}</span>
            </div>
            {selectedAgent && (
              <>
                <div className="flex justify-between text-red-600">
                  <span>Agent discount ({discountPct}%)</span>
                  <span>-{formatMoney(currency, agentDiscount)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Agent commission ({commissionPct}%)</span>
                  <span>{formatMoney(currency, agentCommission)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-semibold text-base pt-1 border-t">
              <span>Total</span>
              <span>{formatMoney(currency, total)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              {saving ? "Creating..." : "Create Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
