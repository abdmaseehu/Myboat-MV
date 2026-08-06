"use client";

import { useEffect, useMemo, useState } from "react";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Package,
  Ship,
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAuth } from "@/store/use-auth";

/**
 * What operators owe Myboat.
 *
 * Logistics customers pay the operator's own account, so Myboat's share — the
 * markup the customer paid, plus the commission out of the operator's quote —
 * lands in the operator's hands and is invoiced back when the order completes.
 *
 * One page, two readings. An administrator sees every invoice and marks them
 * received; an operator sees only their own and cannot mark anything, since a
 * debtor confirming their own payment records nothing.
 */

const fmtMoney = (amount, currency = "MVR") =>
  `${currency} ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

// MVR emerald, USD sky — the same pairing used everywhere else. Never summed.
const currencyBadge = (currency) =>
  String(currency).toUpperCase() === "USD"
    ? "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300"
    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300";

export default function PlatformInvoicesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [totals, setTotals] = useState([]);
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState(null);
  const [marking, setMarking] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/platform-invoices");
      const d = res?.data?.data;
      setInvoices(d?.invoices || []);
      setTotals(d?.totals || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markReceived = async () => {
    if (!confirming) return;
    try {
      setMarking(true);
      await api.post(`/platform-invoices/${confirming.id}/mark-received`);
      toast.success(`${confirming.invoiceNumber} marked received`);
      setConfirming(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update the invoice");
    } finally {
      setMarking(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((i) =>
      [
        i.invoiceNumber,
        i.vendor?.businessName,
        i.order?.origin,
        i.order?.destination,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [invoices, search]);

  const outstanding = filtered.filter((i) => i.status !== "PAID");
  const settled = filtered.filter((i) => i.status === "PAID");

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Myboat Invoices" },
        ]}
      />

      <div>
        <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <FileText className="h-7 w-7 text-sky-500" />
          Myboat Invoices
        </h2>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Myboat's share of completed logistics orders, collected by the operator and owed back."
            : "Myboat's share of your completed logistics orders. You collected the full amount from the customer; this is the part payable to Myboat."}
        </p>
      </div>

      {/* Per currency, never combined: MVR and USD settle into different
          accounts, so one total across both would mean nothing. */}
      {totals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {totals.map((t) => (
            <Card key={t.currency}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {isAdmin ? "Receivable" : "Payable"} · {t.currency}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {fmtMoney(t.outstanding, t.currency)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {fmtMoney(t.received, t.currency)} already settled ·{" "}
                  {t.count} invoice{t.count === 1 ? "" : "s"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
          <CardTitle className="text-base">
            {outstanding.length} outstanding
          </CardTitle>
          <Input
            placeholder="Search invoice, operator or route"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-14 text-center">
              <FileText className="mx-auto h-10 w-10 text-sky-300" />
              <p className="mt-3 font-medium">Nothing invoiced yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                An invoice is raised when a logistics order is marked complete.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  {isAdmin && <TableHead>Operator</TableHead>}
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Order total</TableHead>
                  <TableHead className="text-right">Markup</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...outstanding, ...settled].map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div className="font-mono text-xs font-medium">
                        {i.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Issued {fmtDate(i.issuedAt)}
                      </div>
                    </TableCell>

                    {isAdmin && (
                      <TableCell className="font-medium">
                        {i.vendor?.businessName || "—"}
                      </TableCell>
                    )}

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        {i.requestType === "LOGISTICS" ? (
                          <Package className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                        ) : (
                          <Ship className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                        )}
                        {i.order
                          ? `${i.order.origin} → ${i.order.destination}`
                          : "Order removed"}
                      </div>
                      {i.order?.tripDate && (
                        <div className="text-[11px] text-muted-foreground">
                          {fmtDate(i.order.tripDate)}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-right text-sm text-muted-foreground">
                      {i.orderTotal ? fmtMoney(i.orderTotal, i.currency) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {fmtMoney(i.markupAmount, i.currency)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {fmtMoney(i.commissionAmount, i.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={currencyBadge(i.currency)}>
                        {fmtMoney(i.amount, i.currency)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {i.status === "PAID" ? (
                        <div>
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                            Received
                          </Badge>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            {fmtDate(i.paidAt)}
                            {i.markedBy?.firstName
                              ? ` · ${i.markedBy.firstName}`
                              : ""}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="border-amber-400 text-amber-700">
                          Pending
                        </Badge>
                      )}
                    </TableCell>

                    {isAdmin && (
                      <TableCell className="text-right">
                        {i.status === "PAID" ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => setConfirming(i)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark received
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark this invoice received?</DialogTitle>
            <DialogDescription>
              Confirm only once{" "}
              <span className="font-semibold">
                {fmtMoney(confirming?.amount, confirming?.currency)}
              </span>{" "}
              from{" "}
              <span className="font-semibold">
                {confirming?.vendor?.businessName}
              </span>{" "}
              has actually landed in the Myboat {confirming?.currency} account.
              This is recorded against your name and the operator is told the
              invoice is settled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Not yet
            </Button>
            <Button
              onClick={markReceived}
              disabled={marking}
              className="bg-emerald-500 text-white hover:bg-emerald-600"
            >
              {marking && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Yes, it&apos;s received
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
