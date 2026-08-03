"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import {
  MapPin,
  Calendar,
  Package,
  Truck,
  Lock,
  Eye,
  Send,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/store/use-auth";

const STATUS_TABS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "QUOTED", label: "Quoted" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "REJECTED", label: "Rejected" },
];

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  QUOTED: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  ACCEPTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
  CANCELLED: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");

export default function LogisticsRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("ALL");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRequest, setViewRequest] = useState(null);

  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteRequest, setQuoteRequest] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    vesselId: "",
    quotedPrice: "",
    quotedCurrency: "MVR",
    pricePerTon: "",
    pricePerNm: "",
    estimatedDistanceNm: "",
    waitingCharges: "",
    priceIncludes: "",
    quoteNotes: "",
    quoteValidUntil: "",
    operatorNotes: "",
  });
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [vessels, setVessels] = useState([]);
  const [createForm, setCreateForm] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    origin: "",
    destination: "",
    tripDate: "",
    cargoType: "",
    weightKg: "",
    volumeM3: "",
    cargoDescription: "",
    vesselId: "",
    specialRequirements: "",
    quotedPrice: "",
    quotedCurrency: "MVR",
    paymentMethod: "PAY_AT_COUNTER",
    operatorNotes: "",
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Customer contact details belong to Myboat, not the operators quoting on
  // the trip. The API redacts them for anyone who isn't an admin; this only
  // decides what the dialog says.
  const canSeeContact = user?.role === "ADMIN";

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/logistics-requests");
      setRequests(res.data?.data || []);
    } catch (e) {
      toast.error(e.message || "Failed to load logistics requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchVessels = async () => {
    try {
      const res = await api.get("/vehicles");
      const list = res.data?.data || res.data?.vehicles || res.data || [];
      setVessels(Array.isArray(list) ? list : []);
    } catch {
      setVessels([]);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchVessels();
  }, []);

  const counts = useMemo(() => {
    const c = { ALL: requests.length };
    for (const t of STATUS_TABS) {
      if (t.key === "ALL") continue;
      c[t.key] = requests.filter((r) => r.status === t.key).length;
    }
    return c;
  }, [requests]);

  const filtered = useMemo(
    () => (tab === "ALL" ? requests : requests.filter((r) => r.status === tab)),
    [requests, tab]
  );

  const openView = (req) => {
    setViewRequest(req);
    setViewOpen(true);
  };

  const openQuote = (req) => {
    setQuoteRequest(req);
    setQuoteForm({
      vesselId: req.vesselId || "",
      quotedPrice: req.quotedPrice || "",
      quotedCurrency: req.quotedCurrency || "MVR",
      pricePerTon: req.pricePerTon || "",
      pricePerNm: req.pricePerNm || "",
      estimatedDistanceNm: req.estimatedDistanceNm || "",
      waitingCharges: req.waitingCharges || "",
      priceIncludes: req.priceIncludes || "",
      quoteNotes: req.quoteNotes || "",
      quoteValidUntil: req.quoteValidUntil
        ? String(req.quoteValidUntil).slice(0, 10)
        : "",
      operatorNotes: req.operatorNotes || "",
    });
    if (!vessels.length) fetchVessels();
    setQuoteOpen(true);
  };

  const submitQuote = async () => {
    if (!quoteForm.quotedPrice) {
      toast.error("Total price is required");
      return;
    }
    try {
      setQuoteSubmitting(true);
      await api.patch(`/logistics-requests/${quoteRequest.id}/quote`, {
        vesselId: quoteForm.vesselId || null,
        quotedPrice: Number(quoteForm.quotedPrice),
        quotedCurrency: quoteForm.quotedCurrency,
        pricePerTon: quoteForm.pricePerTon || null,
        pricePerNm: quoteForm.pricePerNm || null,
        estimatedDistanceNm: quoteForm.estimatedDistanceNm || null,
        waitingCharges: quoteForm.waitingCharges || null,
        priceIncludes: quoteForm.priceIncludes || null,
        quoteNotes: quoteForm.quoteNotes || null,
        quoteValidUntil: quoteForm.quoteValidUntil || null,
        operatorNotes: quoteForm.operatorNotes || null,
      });
      toast.success("Quote sent to guest");
      setQuoteOpen(false);
      fetchRequests();
    } catch (e) {
      toast.error(e.message || "Failed to send quote");
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const submitCreate = async () => {
    const required = ["guestName", "guestEmail", "origin", "destination", "tripDate", "quotedPrice"];
    for (const k of required) {
      if (!createForm[k]) {
        toast.error(`${k} is required`);
        return;
      }
    }
    try {
      setCreateSubmitting(true);
      const payload = {
        ...createForm,
        isManual: true,
        status: "ACCEPTED",
        vesselId: createForm.vesselId || null,
        weightKg: createForm.weightKg || null,
        volumeM3: createForm.volumeM3 || null,
      };
      await api.post("/logistics-requests", payload);
      toast.success("Manual logistics request created & confirmation queued");
      setCreateOpen(false);
      fetchRequests();
    } catch (e) {
      toast.error(e.message || "Failed to create request");
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Logistics Requests
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and send quotations for cargo/logistics requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> New Manual Request
          </Button>
          <Button variant="outline" onClick={fetchRequests}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap gap-1">
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}{" "}
              <span className="ml-1 text-xs opacity-70">({counts[t.key] || 0})</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="text-center text-sm text-muted-foreground py-10">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <Truck className="h-8 w-8 mx-auto mb-2 text-sky-500/70" />
            No logistics requests here yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="border-sky-500/10">
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
                    <Package className="h-4 w-4 text-sky-500" />
                    <span className="truncate">
                      {r.origin} → {r.destination}
                    </span>
                    {r.isManual && (
                      <Badge variant="outline" className="border-sky-500/30 text-sky-600">
                        Manual
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {fmtDate(r.tripDate)}
                    </span>
                    {r.cargoType && (
                      <span className="inline-flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" /> {r.cargoType}
                      </span>
                    )}
                    {r.weightKg && (
                      <span>Weight: {r.weightKg} kg</span>
                    )}
                    {r.volumeM3 && (
                      <span>Volume: {r.volumeM3} m³</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">From:</span>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    <Badge className={STATUS_STYLES[r.status] || ""}>{r.status}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => openView(r)}>
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                  <Button
                    onClick={() => openQuote(r)}
                    disabled={r.status !== "PENDING"}
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    <Send className="h-4 w-4 mr-1" /> Quote
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Logistics Request Details</DialogTitle>
          </DialogHeader>
          {viewRequest && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-muted-foreground text-xs">From</div>
                  <div className="font-medium">{viewRequest.origin}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">To</div>
                  <div className="font-medium">{viewRequest.destination}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Date</div>
                  <div className="font-medium">{fmtDate(viewRequest.tripDate)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Cargo Type</div>
                  <div className="font-medium">{viewRequest.cargoType || "-"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Weight (kg)</div>
                  <div className="font-medium">{viewRequest.weightKg || "-"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Volume (m³)</div>
                  <div className="font-medium">{viewRequest.volumeM3 || "-"}</div>
                </div>
              </div>
              {viewRequest.cargoDescription && (
                <div>
                  <div className="text-muted-foreground text-xs">Cargo description</div>
                  <div className="font-medium whitespace-pre-wrap">
                    {viewRequest.cargoDescription}
                  </div>
                </div>
              )}
              {viewRequest.specialRequirements && (
                <div>
                  <div className="text-muted-foreground text-xs">Special requirements</div>
                  <div className="font-medium whitespace-pre-wrap">
                    {viewRequest.specialRequirements}
                  </div>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="text-sm font-semibold mb-2">Contact Information</div>
                {canSeeContact ? (
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name: </span>
                      {viewRequest.guestName || "-"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email: </span>
                      {viewRequest.guestEmail || "-"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone: </span>
                      {viewRequest.guestPhone || "-"}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-center space-y-2">
                    <Lock className="h-5 w-5 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Customer contact details are held by Myboat. Send your
                      quote and we&apos;ll put the customer in touch.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quote Modal */}
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Quotation</DialogTitle>
            <DialogDescription>
              {quoteRequest ? (
                <span className="block space-y-0.5">
                  <span className="block font-medium text-foreground">
                    {quoteRequest.origin} → {quoteRequest.destination}
                  </span>
                  <span className="block">
                    {quoteRequest.tripDate
                      ? new Date(quoteRequest.tripDate).toLocaleDateString()
                      : "—"}
                    {quoteRequest.weightKg
                      ? ` · ${(Number(quoteRequest.weightKg) / 1000).toFixed(2)} tonnes`
                      : ""}
                    {quoteRequest.cargoType ? ` · ${quoteRequest.cargoType}` : ""}
                  </span>
                </span>
              ) : (
                "Provide a quoted price for this logistics request."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Vessel</Label>
              <Select
                value={quoteForm.vesselId || "NONE"}
                onValueChange={(v) =>
                  setQuoteForm((s) => ({ ...s, vesselId: v === "NONE" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vessel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Not assigned yet</SelectItem>
                  {vessels.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.vehicleName}
                      {v.vehicleNumber ? ` (${v.vehicleNumber})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>
                  Total Price ({quoteForm.quotedCurrency}){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quoteForm.quotedPrice}
                  onChange={(e) =>
                    setQuoteForm((s) => ({ ...s, quotedPrice: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={quoteForm.quotedCurrency}
                  onValueChange={(v) =>
                    setQuoteForm((s) => ({ ...s, quotedCurrency: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MVR">MVR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  MVR and USD are quoted independently — never combined.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Price per Ton ({quoteForm.quotedCurrency})</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  value={quoteForm.pricePerTon}
                  onChange={(e) =>
                    setQuoteForm((s) => ({ ...s, pricePerTon: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Price per NM ({quoteForm.quotedCurrency})</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  value={quoteForm.pricePerNm}
                  onChange={(e) =>
                    setQuoteForm((s) => ({ ...s, pricePerNm: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Est. Distance (NM)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  value={quoteForm.estimatedDistanceNm}
                  onChange={(e) =>
                    setQuoteForm((s) => ({
                      ...s,
                      estimatedDistanceNm: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label>Waiting Charges</Label>
              <Input
                placeholder="Free first 24 hours, then MVR 500/hour"
                value={quoteForm.waitingCharges}
                onChange={(e) =>
                  setQuoteForm((s) => ({ ...s, waitingCharges: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Price Includes</Label>
              <Textarea
                rows={3}
                placeholder="Loading & unloading, fuel, crew, basic insurance..."
                value={quoteForm.priceIncludes}
                onChange={(e) =>
                  setQuoteForm((s) => ({ ...s, priceIncludes: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={quoteForm.quoteNotes}
                onChange={(e) =>
                  setQuoteForm((s) => ({ ...s, quoteNotes: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Quote valid until</Label>
              <Input
                type="date"
                value={quoteForm.quoteValidUntil}
                onChange={(e) =>
                  setQuoteForm((s) => ({
                    ...s,
                    quoteValidUntil: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitQuote}
              disabled={quoteSubmitting}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              <Send className="h-4 w-4 mr-1" /> Send Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Manual Request Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Manual Logistics Request</DialogTitle>
            <DialogDescription>
              Create a confirmed cargo booking on behalf of a customer. A confirmation
              email will be sent to the customer and to your operator inbox.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Section title="Customer Details">
              <Field label="Guest Name" required>
                <Input
                  value={createForm.guestName}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, guestName: e.target.value }))
                  }
                />
              </Field>
              <Field label="Guest Email" required>
                <Input
                  type="email"
                  value={createForm.guestEmail}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, guestEmail: e.target.value }))
                  }
                />
              </Field>
              <Field label="Guest Phone">
                <Input
                  value={createForm.guestPhone}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, guestPhone: e.target.value }))
                  }
                />
              </Field>
            </Section>

            <Section title="Trip Details">
              <Field label="From" required>
                <Input
                  value={createForm.origin}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, origin: e.target.value }))
                  }
                />
              </Field>
              <Field label="To" required>
                <Input
                  value={createForm.destination}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, destination: e.target.value }))
                  }
                />
              </Field>
              <Field label="Date" required>
                <Input
                  type="date"
                  value={createForm.tripDate}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, tripDate: e.target.value }))
                  }
                />
              </Field>
              <Field label="Vessel">
                <Select
                  value={createForm.vesselId}
                  onValueChange={(v) =>
                    setCreateForm((s) => ({ ...s, vesselId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vessel" />
                  </SelectTrigger>
                  <SelectContent>
                    {vessels.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name || v.registrationNumber || v.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </Section>

            <Section title="Cargo Details">
              <Field label="Cargo Type">
                <Input
                  value={createForm.cargoType}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, cargoType: e.target.value }))
                  }
                />
              </Field>
              <Field label="Weight (kg)">
                <Input
                  type="number"
                  step="0.01"
                  value={createForm.weightKg}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, weightKg: e.target.value }))
                  }
                />
              </Field>
              <Field label="Volume (m³)">
                <Input
                  type="number"
                  step="0.01"
                  value={createForm.volumeM3}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, volumeM3: e.target.value }))
                  }
                />
              </Field>
              <Field label="Cargo Description" full>
                <Textarea
                  rows={3}
                  value={createForm.cargoDescription}
                  onChange={(e) =>
                    setCreateForm((s) => ({
                      ...s,
                      cargoDescription: e.target.value,
                    }))
                  }
                />
              </Field>
            </Section>

            <Section title="Special Requirements">
              <Field label="Notes" full>
                <Textarea
                  rows={3}
                  value={createForm.specialRequirements}
                  onChange={(e) =>
                    setCreateForm((s) => ({
                      ...s,
                      specialRequirements: e.target.value,
                    }))
                  }
                />
              </Field>
            </Section>

            <Section title="Pricing & Payment">
              <Field label="Agreed Price" required>
                <Input
                  type="number"
                  min="0"
                  value={createForm.quotedPrice}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, quotedPrice: e.target.value }))
                  }
                />
              </Field>
              <Field label="Currency">
                <Select
                  value={createForm.quotedCurrency}
                  onValueChange={(v) =>
                    setCreateForm((s) => ({ ...s, quotedCurrency: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MVR">MVR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Payment Method">
                <Select
                  value={createForm.paymentMethod}
                  onValueChange={(v) =>
                    setCreateForm((s) => ({ ...s, paymentMethod: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAY_AT_COUNTER">Pay at Counter</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CARD_LINK">Card via link</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <p className="col-span-full text-xs text-muted-foreground">
                MVR amounts cannot be paid online via card. The customer will receive
                a confirmation email; collect payment via the selected method.
              </p>
            </Section>

            <Section title="Operator Notes">
              <Field label="Internal Notes" full>
                <Textarea
                  rows={3}
                  value={createForm.operatorNotes}
                  onChange={(e) =>
                    setCreateForm((s) => ({ ...s, operatorNotes: e.target.value }))
                  }
                />
              </Field>
            </Section>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitCreate}
              disabled={createSubmitting}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              Create & Send Confirmation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-sky-700 dark:text-sky-300 mb-2">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, required, hint, full, children }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="text-xs">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
