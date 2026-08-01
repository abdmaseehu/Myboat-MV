"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Landmark,
  Copy,
  Check,
  CheckCircle2,
  Loader2,
  CreditCard,
  Info,
  Ship,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");

const fmtMoney = (amount, currency = "MVR") => {
  if (amount === null || typeof amount === "undefined" || amount === "")
    return "-";
  const n = Number(amount);
  if (Number.isNaN(n)) return String(amount);
  return `${currency} ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// MVR = emerald, USD = sky. Strictly independent — never summed together.
const currencyTheme = (currency) =>
  String(currency).toUpperCase() === "USD"
    ? {
        text: "text-sky-600 dark:text-sky-400",
        bg: "bg-sky-50 dark:bg-sky-950/30",
        border: "border-sky-500/20",
        badge:
          "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
      }
    : {
        text: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        border: "border-emerald-500/20",
        badge:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
      };

export default function RequestPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const type = params?.type === "logistics" ? "logistics" : "charter";
  const id = params?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const [copied, setCopied] = useState(null);

  const base = type === "charter" ? "/charter-requests" : "/logistics-requests";

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${base}/${id}/payment-info`);
      setData(res.data?.data || null);
      setError(null);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e.message ||
          "Could not load payment details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type]);

  const copy = async (label, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(label);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      toast.error("Could not copy — please copy manually");
    }
  };

  const confirmPaid = async () => {
    try {
      setMarking(true);
      await api.post(`${base}/${id}/mark-paid`);
      toast.success("Thanks — the operator has been notified to verify it");
      setConfirmOpen(false);
      load();
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e.message || "Could not record payment"
      );
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-lagoon" />
        Loading payment details...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <p className="text-sm text-muted-foreground">{error || "Not found"}</p>
        <Button variant="outline" onClick={() => router.push("/users/my-requests")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to My Requests
        </Button>
      </div>
    );
  }

  const { request, operator, bank, reference, cardPaymentAvailable } = data;
  const currency = (request.quotedCurrency || "MVR").toUpperCase();
  const theme = currencyTheme(currency);
  const alreadyDeclared = request.paymentMethod === "BANK_TRANSFER";
  const bankReady = bank?.bankName || bank?.accountNumber;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2 text-muted-foreground"
          onClick={() => router.push("/users/my-requests")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> My Requests
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
          Complete your payment
        </h1>
        <p className="text-sm text-muted-foreground">
          {type === "charter" ? "Charter" : "Logistics"} booking with{" "}
          {operator?.businessName || "your operator"}.
        </p>
      </div>

      {/* Quote summary */}
      <Card className={`rounded-2xl ${theme.border}`}>
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-lg">
                {request.origin} → {request.destination}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {fmtDate(request.tripDate)}
                {type === "charter" && request.passengers
                  ? ` · ${request.passengers} passenger(s)`
                  : ""}
                {type === "logistics" && request.cargoType
                  ? ` · ${request.cargoType}`
                  : ""}
              </div>
              {request.vessel?.vehicleName && (
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Ship className="h-3.5 w-3.5" /> {request.vessel.vehicleName}
                </div>
              )}
            </div>
            <Badge className={theme.badge}>{currency}</Badge>
          </div>

          <div
            className={`rounded-xl ${theme.bg} border ${theme.border} p-4 flex items-baseline justify-between`}
          >
            <span className="text-sm text-muted-foreground">Total payable</span>
            <span className={`text-2xl font-bold ${theme.text}`}>
              {fmtMoney(request.quotedPrice, currency)}
            </span>
          </div>

          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
            {type === "logistics" && request.pricePerTon && (
              <Row label="Price per ton" value={fmtMoney(request.pricePerTon, currency)} />
            )}
            {request.pricePerNm && (
              <Row label="Price per NM" value={fmtMoney(request.pricePerNm, currency)} />
            )}
            {request.estimatedDistanceNm && (
              <Row
                label="Estimated distance"
                value={`${Number(request.estimatedDistanceNm)} NM`}
              />
            )}
            {request.waitingCharges && (
              <Row label="Waiting charges" value={request.waitingCharges} />
            )}
          </dl>

          {request.priceIncludes && (
            <div className="text-xs">
              <div className="text-muted-foreground">Price includes</div>
              <div className="whitespace-pre-wrap">{request.priceIncludes}</div>
            </div>
          )}
          {request.quoteNotes && (
            <div className="text-xs">
              <div className="text-muted-foreground">Operator notes</div>
              <div className="whitespace-pre-wrap">{request.quoteNotes}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank transfer */}
      <Card className="rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-lagoon" />
            <h2 className="font-semibold">Bank Transfer</h2>
            <Badge className={theme.badge}>{currency} account</Badge>
          </div>

          {bankReady ? (
            <div className="space-y-2">
              <CopyRow
                label="Bank name"
                value={bank.bankName}
                copied={copied === "bank"}
                onCopy={() => copy("bank", bank.bankName)}
              />
              <CopyRow
                label="Account name"
                value={bank.accountName}
                copied={copied === "holder"}
                onCopy={() => copy("holder", bank.accountName)}
              />
              <CopyRow
                label="Account number"
                value={bank.accountNumber}
                copied={copied === "account"}
                onCopy={() => copy("account", bank.accountNumber)}
                mono
              />
              <CopyRow
                label="Amount"
                value={fmtMoney(request.quotedPrice, currency)}
                copied={copied === "amount"}
                onCopy={() => copy("amount", Number(request.quotedPrice))}
              />
              <CopyRow
                label="Reference"
                value={reference}
                copied={copied === "ref"}
                onCopy={() => copy("ref", reference)}
                mono
              />
              <p className="text-[11px] text-muted-foreground pt-1">
                Please include the reference so the operator can match your
                transfer.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              This operator hasn&apos;t published their {currency} bank account
              yet. Contact them directly
              {operator?.contactPhone ? ` on ${operator.contactPhone}` : ""} to
              arrange payment.
            </div>
          )}

          {/* Card payment */}
          <div className="rounded-xl border border-dashed p-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              {currency === "MVR" ? (
                <>
                  <span className="font-medium text-foreground">
                    Card payment is not available for MVR.
                  </span>{" "}
                  MVR bookings are bank transfer only.
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    Card payment for USD is coming soon.
                  </span>{" "}
                  Please use bank transfer for now.
                </>
              )}
              {/* TODO(stripe): Card checkout is NOT implemented. When it lands it
                  applies to USD only — MVR stays bank-transfer only. Do not
                  enable this button until a real Stripe PaymentIntent flow and
                  webhook confirmation exist server-side. */}
              <div className="mt-2">
                <Button size="sm" variant="outline" disabled>
                  <CreditCard className="h-4 w-4 mr-1" /> Pay by card
                  {cardPaymentAvailable ? "" : " (unavailable)"}
                </Button>
              </div>
            </div>
          </div>

          {alreadyDeclared ? (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 p-4 text-sm text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                You&apos;ve marked this as paid. The operator is verifying your
                transfer and will confirm shortly.
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!bankReady}
              className="w-full h-12 rounded-full bg-coral hover:bg-coral-soft text-white shadow-coral"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" /> I&apos;ve made the
              payment
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm your transfer</DialogTitle>
            <DialogDescription>
              Only confirm once you&apos;ve actually sent{" "}
              <span className="font-semibold">
                {fmtMoney(request.quotedPrice, currency)}
              </span>{" "}
              with reference{" "}
              <span className="font-mono font-semibold">{reference}</span>. The
              operator will verify it before your booking is finalised.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Not yet
            </Button>
            <Button
              onClick={confirmPaid}
              disabled={marking}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {marking && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Yes, I&apos;ve paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        Questions about this booking?{" "}
        <Link href="/users/my-requests" className="underline">
          Back to My Requests
        </Link>
      </p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}

function CopyRow({ label, value, onCopy, copied, mono }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div
          className={`text-sm font-medium truncate ${mono ? "font-mono" : ""}`}
        >
          {value || "—"}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCopy}
        disabled={!value}
        aria-label={`Copy ${label}`}
        className="shrink-0"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
