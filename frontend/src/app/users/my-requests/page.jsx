"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/store/use-auth";
import {
  Anchor,
  Truck,
  MapPin,
  Calendar,
  Clock,
  Users,
  Package,
  Phone,
  Mail,
  Lock,
  CheckCircle2,
  Ship,
  ArrowRight,
  Eye,
  Loader2,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_STYLES = {
  PENDING:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  QUOTED: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  ACCEPTED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  REJECTED:
    "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
  CANCELLED:
    "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
  COMPLETED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");
const fmtMoney = (amount, currency = "MVR") => {
  if (amount === null || typeof amount === "undefined" || amount === "") return "-";
  const n = Number(amount);
  if (Number.isNaN(n)) return String(amount);
  return `${currency} ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// MVR = emerald, USD = sky/blue. The two are never mixed or summed.
const currencyClasses = (currency) =>
  String(currency).toUpperCase() === "USD"
    ? "text-sky-600 dark:text-sky-400"
    : "text-emerald-600 dark:text-emerald-400";

const isQuoteExpired = (req) => {
  if (!req?.quoteValidUntil) return false;
  const until = new Date(req.quoteValidUntil);
  if (Number.isNaN(until.getTime())) return false;
  until.setHours(23, 59, 59, 999);
  return until.getTime() < Date.now();
};

export default function MyRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [charter, setCharter] = useState([]);
  const [logistics, setLogistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("charter");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewReq, setViewReq] = useState(null);
  const [viewKind, setViewKind] = useState("charter");

  const [acceptOpen, setAcceptOpen] = useState(false);
  const [acceptReq, setAcceptReq] = useState(null);
  const [acceptKind, setAcceptKind] = useState("charter");
  const [accepting, setAccepting] = useState(false);

  const hasCharterPro =
    user?.charterProSubscribedUntil &&
    new Date(user.charterProSubscribedUntil) > new Date();

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [c, l] = await Promise.all([
        api.get("/charter-requests/requested-by-me"),
        api.get("/logistics-requests/requested-by-me"),
      ]);
      setCharter(c.data?.data || []);
      setLogistics(l.data?.data || []);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e.message || "Failed to load requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openView = (req, kind) => {
    setViewReq(req);
    setViewKind(kind);
    setViewOpen(true);
  };

  const openAccept = (req, kind) => {
    setAcceptReq(req);
    setAcceptKind(kind);
    setAcceptOpen(true);
  };

  const confirmAccept = async () => {
    if (!acceptReq) return;
    try {
      setAccepting(true);
      const url =
        acceptKind === "charter"
          ? `/charter-requests/${acceptReq.id}`
          : `/logistics-requests/${acceptReq.id}`;
      await api.patch(url, { status: "ACCEPTED" });
      toast.success("Quote accepted — let's get you paid up");
      setAcceptOpen(false);
      // Straight to payment: bank transfer instructions for the quoted currency.
      router.push(`/users/requests/${acceptKind}/${acceptReq.id}/pay`);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e.message || "Failed to accept quote"
      );
    } finally {
      setAccepting(false);
    }
  };

  const counts = useMemo(
    () => ({ charter: charter.length, logistics: logistics.length }),
    [charter, logistics]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
            My Requests
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your charter and logistics quote requests and accept the best
            offers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/charter">
              <Anchor className="h-4 w-4 mr-1" /> New Charter
            </Link>
          </Button>
          <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
            <Link href="/logistics">
              <Truck className="h-4 w-4 mr-1" /> New Logistics
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="charter">
            <Anchor className="h-4 w-4 mr-1.5" /> Charter
            <Badge variant="secondary" className="ml-2">
              {counts.charter}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="logistics">
            <Truck className="h-4 w-4 mr-1.5" /> Logistics
            <Badge variant="secondary" className="ml-2">
              {counts.logistics}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charter" className="mt-4">
          <RequestList
            kind="charter"
            requests={charter}
            loading={loading}
            hasCharterPro={hasCharterPro}
            onView={(r) => openView(r, "charter")}
            onAccept={(r) => openAccept(r, "charter")}
          />
        </TabsContent>
        <TabsContent value="logistics" className="mt-4">
          <RequestList
            kind="logistics"
            requests={logistics}
            loading={loading}
            hasCharterPro={hasCharterPro}
            onView={(r) => openView(r, "logistics")}
            onAccept={(r) => openAccept(r, "logistics")}
          />
        </TabsContent>
      </Tabs>

      {/* View dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {viewKind === "charter" ? "Charter" : "Logistics"} request
            </DialogTitle>
          </DialogHeader>
          {viewReq && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Info label="From" value={viewReq.origin} />
                <Info label="To" value={viewReq.destination} />
                <Info label="Date" value={fmtDate(viewReq.tripDate)} />
                {viewKind === "charter" ? (
                  <Info
                    label="Passengers"
                    value={viewReq.passengers?.toString() || "-"}
                  />
                ) : (
                  <Info label="Cargo" value={viewReq.cargoType || "-"} />
                )}
              </div>
              {viewKind === "logistics" && (
                <div className="grid grid-cols-2 gap-3">
                  <Info
                    label="Weight (kg)"
                    value={viewReq.weightKg ? String(viewReq.weightKg) : "-"}
                  />
                  <Info
                    label="Volume (m³)"
                    value={viewReq.volumeM3 ? String(viewReq.volumeM3) : "-"}
                  />
                </div>
              )}
              {viewReq.specialRequirements && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Special requirements
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {viewReq.specialRequirements}
                  </div>
                </div>
              )}
              {viewReq.operatorNotes && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Operator notes
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {viewReq.operatorNotes}
                  </div>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <Badge className={STATUS_STYLES[viewReq.status]}>
                  {viewReq.status}
                </Badge>
                {viewReq.quotedPrice && (
                  <div className="mt-3 text-sm">
                    <span className="text-muted-foreground">Quoted price: </span>
                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                      {fmtMoney(viewReq.quotedPrice, viewReq.quotedCurrency)}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t pt-3">
                <div className="text-sm font-semibold mb-2">
                  Operator contact
                </div>
                {viewReq.vendor?.businessName ? (
                  hasCharterPro ? (
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Business:{" "}
                        </span>
                        {viewReq.vendor.businessName}
                      </div>
                      {viewReq.vendor.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {viewReq.vendor.phone}
                        </div>
                      )}
                      {viewReq.vendor.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {viewReq.vendor.email}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Operator: </span>
                        {viewReq.vendor.businessName}
                      </div>
                      <div className="rounded-md border border-dashed p-3 text-center space-y-2">
                        <Lock className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-[11px] text-muted-foreground">
                          Subscribe to Charter Pro to see operator contact
                          details
                        </p>
                        <Button
                          size="sm"
                          asChild
                          className="bg-sky-500 hover:bg-sky-600 text-white"
                        >
                          <Link href="/users/checkout">Subscribe Now</Link>
                        </Button>
                      </div>
                    </div>
                  )
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No operator has quoted yet.
                  </p>
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

      {/* Accept dialog */}
      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Accept this quote and pay?</DialogTitle>
            <DialogDescription>
              Accepting locks in this quote with the operator. You&apos;ll go
              straight to the payment page next.
            </DialogDescription>
          </DialogHeader>
          {acceptReq && (
            <div className="space-y-3 text-sm">
              <div className="rounded-2xl border p-4 space-y-2">
                <div className="font-medium">
                  {acceptReq.origin} → {acceptReq.destination}
                </div>
                <div className="text-xs text-muted-foreground">
                  {fmtDate(acceptReq.tripDate)} ·{" "}
                  {acceptReq.vendor?.businessName || "Operator"}
                </div>
                <div className="flex items-baseline justify-between border-t pt-2">
                  <span className="text-xs text-muted-foreground">
                    Total payable
                  </span>
                  <span
                    className={`text-xl font-bold ${currencyClasses(
                      acceptReq.quotedCurrency
                    )}`}
                  >
                    {fmtMoney(
                      acceptReq.quotedPrice,
                      acceptReq.quotedCurrency
                    )}
                  </span>
                </div>
              </div>
              <QuoteBreakdown req={acceptReq} kind={acceptKind} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAccept}
              disabled={accepting}
              className="bg-coral hover:bg-coral-soft text-white"
            >
              {accepting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              <CreditCard className="h-4 w-4 mr-1" /> Accept &amp; Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function RequestList({
  kind,
  requests,
  loading,
  hasCharterPro,
  onView,
  onAccept,
}) {
  if (loading) {
    return (
      <div className="text-center text-sm text-muted-foreground py-16">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-sky-500" />
        Loading your requests...
      </div>
    );
  }
  if (!requests.length) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-3">
          {kind === "charter" ? (
            <Anchor className="h-10 w-10 mx-auto text-sky-500/60" />
          ) : (
            <Truck className="h-10 w-10 mx-auto text-sky-500/60" />
          )}
          <div className="text-sm text-muted-foreground">
            No {kind === "charter" ? "charter" : "logistics"} requests yet.
          </div>
          <Button
            asChild
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            <Link href={kind === "charter" ? "/charter" : "/logistics"}>
              Request quotes now <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <RequestCard
          key={r.id}
          req={r}
          kind={kind}
          hasCharterPro={hasCharterPro}
          onView={() => onView(r)}
          onAccept={() => onAccept(r)}
        />
      ))}
    </div>
  );
}

function QuoteBreakdown({ req, kind }) {
  const cur = req.quotedCurrency || "MVR";
  const rows = [
    kind === "logistics" && req.pricePerTon
      ? ["Price per ton", fmtMoney(req.pricePerTon, cur)]
      : null,
    req.pricePerNm ? ["Price per NM", fmtMoney(req.pricePerNm, cur)] : null,
    req.estimatedDistanceNm
      ? ["Estimated distance", `${Number(req.estimatedDistanceNm)} NM`]
      : null,
    req.waitingCharges ? ["Waiting charges", req.waitingCharges] : null,
  ].filter(Boolean);

  const expired = isQuoteExpired(req);

  if (
    !rows.length &&
    !req.priceIncludes &&
    !req.quoteNotes &&
    !req.quoteValidUntil
  ) {
    return null;
  }

  return (
    <div className="rounded-xl bg-white/70 dark:bg-zinc-900/40 border border-sky-500/10 p-3 space-y-2 text-xs">
      {rows.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium text-right">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {req.priceIncludes && (
        <div>
          <div className="text-muted-foreground">Price includes</div>
          <div className="whitespace-pre-wrap">{req.priceIncludes}</div>
        </div>
      )}
      {req.quoteNotes && (
        <div>
          <div className="text-muted-foreground">Notes</div>
          <div className="whitespace-pre-wrap">{req.quoteNotes}</div>
        </div>
      )}
      {req.quoteValidUntil && (
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
            expired
              ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {expired && <AlertTriangle className="h-3 w-3" />}
          {expired ? "Quote expired on " : "Valid until "}
          {fmtDate(req.quoteValidUntil)}
        </div>
      )}
    </div>
  );
}

function RequestCard({ req, kind, hasCharterPro, onView, onAccept }) {
  const status = req.status;
  const expired = isQuoteExpired(req);
  const dimmed =
    status === "REJECTED" || status === "CANCELLED"
      ? "opacity-70"
      : "";
  return (
    <Card className={`border-sky-500/10 ${dimmed}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
              <MapPin className="h-4 w-4 text-sky-500" />
              <span className="truncate">
                {req.origin} → {req.destination}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {fmtDate(req.tripDate)}
              </span>
              {kind === "charter" ? (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {req.passengers}{" "}
                  passengers
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  {req.cargoType || "Cargo"}
                  {req.weightKg ? ` · ${req.weightKg} kg` : ""}
                </span>
              )}
              {req.returnTrip && (
                <Badge variant="secondary" className="text-[10px]">
                  🔁 Return trip
                </Badge>
              )}
            </div>
          </div>
          <Badge className={STATUS_STYLES[status] || ""}>{status}</Badge>
        </div>

        {/* Status-specific message */}
        {status === "PENDING" && (
          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" /> Waiting for operator quotes...
          </div>
        )}

        {status === "QUOTED" && (
          <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-500/20 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-muted-foreground">
                  Quoted price
                </div>
                <div
                  className={`text-lg font-bold ${currencyClasses(
                    req.quotedCurrency
                  )}`}
                >
                  {fmtMoney(req.quotedPrice, req.quotedCurrency)}
                </div>
              </div>
              {req.vendor?.businessName && (
                <div className="text-sm text-right">
                  <div className="text-xs text-muted-foreground">Operator</div>
                  <div className="font-medium flex items-center gap-1">
                    <Ship className="h-3.5 w-3.5 text-sky-500" />
                    {req.vendor.businessName}
                  </div>
                </div>
              )}
            </div>
            <QuoteBreakdown req={req} kind={kind} />

            {!hasCharterPro && (
              <div className="rounded-md border border-dashed p-2.5 flex items-start gap-2 text-[11px] text-muted-foreground">
                <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div className="flex-1">
                  Subscribe to Charter Pro to see the operator&apos;s contact
                  details.{" "}
                  <Link
                    href="/users/checkout"
                    className="text-sky-600 dark:text-sky-400 underline"
                  >
                    Subscribe Now
                  </Link>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onView}>
                <Eye className="h-4 w-4 mr-1" /> View Details
              </Button>
              <Button
                size="sm"
                onClick={onAccept}
                disabled={expired}
                className="bg-coral hover:bg-coral-soft text-white"
              >
                <CreditCard className="h-4 w-4 mr-1" /> Accept &amp; Pay
              </Button>
            </div>
            {expired && (
              <p className="text-[11px] text-muted-foreground">
                Ask the operator to re-issue the quote to continue.
              </p>
            )}
          </div>
        )}

        {status === "ACCEPTED" && (
          <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 p-3 space-y-2">
            <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Booked with{" "}
              {req.vendor?.businessName || "the operator"}
            </div>
            {req.quotedPrice && (
              <div className="text-xs text-muted-foreground">
                Confirmed at{" "}
                <span
                  className={`font-semibold ${currencyClasses(
                    req.quotedCurrency
                  )}`}
                >
                  {fmtMoney(req.quotedPrice, req.quotedCurrency)}
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onView}>
                <Eye className="h-4 w-4 mr-1" /> View Booking
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-coral hover:bg-coral-soft text-white"
              >
                <Link href={`/users/requests/${kind}/${req.id}/pay`}>
                  <CreditCard className="h-4 w-4 mr-1" />
                  {req.paymentMethod === "BANK_TRANSFER"
                    ? "Payment Details"
                    : "Complete Payment"}
                </Link>
              </Button>
            </div>
          </div>
        )}

        {(status === "REJECTED" || status === "CANCELLED") && (
          <div className="text-xs text-muted-foreground italic">
            This request was {status.toLowerCase()}.
          </div>
        )}

        {status === "COMPLETED" && (
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Trip completed. Thanks for choosing Myboat!
          </div>
        )}

        {status !== "QUOTED" && status !== "ACCEPTED" && (
          <div>
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="h-4 w-4 mr-1" /> View Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
