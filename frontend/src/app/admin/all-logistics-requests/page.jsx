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
import { Truck, Loader2 } from "lucide-react";
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

export default function AllLogisticsRequestsPage() {
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
      const res = await api.get("/logistics-requests/all", { params });
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

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "All Logistics Requests" },
          ]}
        />
        <div className="flex items-center gap-2 mt-2">
          <Truck className="h-6 w-6 text-sky-500" />
          <h2 className="text-2xl font-bold tracking-tight">
            All Logistics Requests (Platform-wide)
          </h2>
        </div>
        <p className="text-muted-foreground mt-1">
          Read-only view of every logistics request across all operators.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Search origin, destination, cargo..."
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

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No logistics requests found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Trip Date</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Quoted</TableHead>
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
                    <TableCell>{r.cargoType || "—"}</TableCell>
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
            <DialogTitle>Logistics Request Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-3 text-sm">
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
                <p className="text-muted-foreground">Cargo</p>
                <p>
                  {selected.cargoType || "—"}
                  {selected.weightKg ? ` • ${selected.weightKg} kg` : ""}
                  {selected.volumeM3 ? ` • ${selected.volumeM3} m³` : ""}
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
              {selected.cargoDescription && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Description</p>
                  <p>{selected.cargoDescription}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
