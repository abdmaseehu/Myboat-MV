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
import { UserPlus, Loader2 } from "lucide-react";

function statusColor(status) {
  switch (status) {
    case "ACTIVE":
      return "border-green-500 text-green-600";
    case "PENDING":
      return "border-sky-500 text-sky-600";
    case "SUSPENDED":
      return "border-amber-500 text-amber-600";
    case "REJECTED":
      return "border-red-500 text-red-600";
    default:
      return "border-gray-500 text-gray-600";
  }
}

export default function AllAgentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [operator, setOperator] = useState("all");

  const load = async () => {
    try {
      setLoading(true);
      const params = {};
      if (status !== "all") params.status = status;
      const res = await api.get("/operator-agents/all", { params });
      setItems(res?.data?.data || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const operators = useMemo(() => {
    const map = new Map();
    items.forEach((a) => {
      if (a.vendor?.id) map.set(a.vendor.id, a.vendor.businessName);
    });
    return Array.from(map.entries());
  }, [items]);

  const filtered = useMemo(() => {
    if (operator === "all") return items;
    return items.filter((a) => a.vendor?.id === operator);
  }, [items, operator]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "All Agents" },
          ]}
        />
        <div className="flex items-center gap-2 mt-2">
          <UserPlus className="h-6 w-6 text-sky-500" />
          <h2 className="text-2xl font-bold tracking-tight">
            All Agents (Platform-wide)
          </h2>
        </div>
        <p className="text-muted-foreground mt-1">
          All operator agents across every operator on the platform.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
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
              No agents found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Discount %</TableHead>
                  <TableHead>Commission %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.vendor?.businessName || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {a.user?.firstName} {a.user?.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {a.user?.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{a.agentType || "AGENT"}</TableCell>
                    <TableCell>{Number(a.discountPercent || 0)}%</TableCell>
                    <TableCell>{Number(a.commissionPercent || 0)}%</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColor(a.status)}
                      >
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {a.createdAt
                        ? new Date(a.createdAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
