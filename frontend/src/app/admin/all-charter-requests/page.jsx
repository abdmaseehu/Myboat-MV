"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Anchor, Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/currency";

const STATUSES = [
  "PENDING",
  "QUOTED",
  "ACCEPTED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
];

function statusColor(status) {
  switch (status) {
    case "ACCEPTED":
    case "COMPLETED":
      return "border-green-500 text-green-600";
    case "PENDING":
      return "border-sky-500 text-sky-600";
    case "QUOTED":
      return "border-amber-500 text-amber-600";
    case "REJECTED":
    case "CANCELLED":
      return "border-red-500 text-red-600";
    default:
      return "border-gray-500 text-gray-600";
  }
}

export default function AllCharterRequestsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [operator, setOperator] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const params = {};
      if (status !== "all") params.status = status;
      if (currency !== "all") params.currency = currency;
      if (search) params.search = search;
      const res = await api.get("/charter-requests/all", { params });
      setItems(res?.data?.data || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, currency, search]);

  const operators = useMemo(() => {
    const map = new Map();
    items.forEach((r) => {
      if (r.vendor?.id) map.set(r.vendor.id, r.vendor.businessName);
    });
    return Array.from(map.entries());
  }, [items]);

  const filtered = useMemo(() => {
    if (operator === "all") return items;
    return items.filter((r) => r.vendor?.id === operator);
  }, [items, operator]);

  // MVR and USD are tallied strictly independently — never combined.
  const totals = useMemo(() => {
    const acc = { MVR: { count: 0, sum: 0 }, USD: { count: 0, sum: 0 } };
    filtered.forEach((r) => {
      if (!r.quotedPrice) return;
      const cur = (r.quotedCurrency || "MVR").toUpperCase();
      if (!acc[cur]) return;
      acc[cur].count += 1;
      acc[cur].sum += Number(r.quotedPrice) || 0;
    });
    return acc;
  }, [filtered]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "All Charter Requests" },
          ]}
        />
        <div className="flex items-center gap-2 mt-2">
          <Anchor className="h-6 w-6 text-sky-500" />
          <h2 className="text-2xl font-bold tracking-tight">
            All Charter Requests (Platform-wide)
          </h2>
        </div>
        <p className="text-muted-foreground mt-1">
          Read-only view of every charter request across all operators.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Search origin, destination, guest..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All currencies</SelectItem>
              <SelectItem value="MVR">MVR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
          <Select value={operator} onValueChange={setOperator}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All operators</SelectItem>
              {operators.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Quoted value — MVR and USD reported separately, never summed */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-emerald-500/30">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              Quoted in MVR ({totals.MVR.count})
            </div>
            <div className="text-xl font-bold text-emerald-600">
              {formatMoney(totals.MVR.sum, "MVR")}
            </div>
          </CardContent>
        </Card>
        <Card className="border-sky-500/30">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              Quoted in USD ({totals.USD.count})
            </div>
            <div className="text-xl font-bold text-sky-600">
              {formatMoney(totals.USD.sum, "USD")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No charter requests found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Trip Date</TableHead>
                  <TableHead>Pax</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Quoted</TableHead>
                  <TableHead className="text-right">Quoted On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(r)}
                  >
                    <TableCell className="font-mono text-xs">
                      {r.id.slice(0, 8)}…
                    </TableCell>
                    <TableCell>{r.vendor?.businessName || "—"}</TableCell>
                    <TableCell>
                      {r.origin} → {r.destination}
                    </TableCell>
                    <TableCell>
                      {r.tripDate
                        ? new Date(r.tripDate).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>{r.passengers}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColor(r.status)}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.quotedPrice ? (
                        <span
                          className={
                            (r.quotedCurrency || "MVR") === "USD"
                              ? "text-sky-600 font-medium"
                              : "text-emerald-600 font-medium"
                          }
                        >
                          {formatMoney(r.quotedPrice, r.quotedCurrency || "MVR")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {r.quotedAt
                        ? new Date(r.quotedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Charter Request Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Operator</p>
                  <p className="font-medium">
                    {selected.vendor?.businessName || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={statusColor(selected.status)}
                  >
                    {selected.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Origin</p>
                  <p>{selected.origin}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Destination</p>
                  <p>{selected.destination}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trip Date</p>
                  <p>
                    {selected.tripDate
                      ? new Date(selected.tripDate).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Passengers</p>
                  <p>{selected.passengers}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Guest</p>
                  <p>
                    {selected.guestName || "—"}{" "}
                    {selected.guestEmail && `(${selected.guestEmail})`}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quoted</p>
                  <p>
                    {selected.quotedPrice
                      ? formatMoney(
                          selected.quotedPrice,
                          selected.quotedCurrency || "MVR"
                        )
                      : "—"}
                  </p>
                </div>
              </div>
              {selected.specialRequirements && (
                <div>
                  <p className="text-muted-foreground mt-2">
                    Special Requirements
                  </p>
                  <p>{selected.specialRequirements}</p>
                </div>
              )}
              {selected.operatorNotes && (
                <div>
                  <p className="text-muted-foreground mt-2">Operator Notes</p>
                  <p>{selected.operatorNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
