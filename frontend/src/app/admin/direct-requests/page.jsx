"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { toast } from "sonner";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Anchor,
  ExternalLink,
  Loader2,
  Package,
  Search,
  Users,
  Weight,
} from "lucide-react";
import { useAuth } from "@/store/use-auth";

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

const statusColor = (s) =>
  ({
    ACCEPTED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    QUOTED: "bg-sky-100 text-sky-700 border-sky-200",
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
    CANCELLED: "bg-zinc-100 text-zinc-600 border-zinc-200",
    COMPLETED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  }[s] || "bg-zinc-100 text-zinc-600 border-zinc-200");

/**
 * Requests raised through "Request Boat MV", where the customer asked Myboat to
 * find a boat rather than picking an operator. Operators never see these, so
 * they only get actioned if someone here does it.
 */
export default function DirectRequestsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [charter, setCharter] = useState([]);
  const [logistics, setLogistics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        setLoading(true);
        const [c, l] = await Promise.allSettled([
          api.get("/charter-requests/all"),
          api.get("/logistics-requests/all"),
        ]);
        const pick = (r) => {
          const d = r.status === "fulfilled" ? r.value?.data?.data : [];
          return (Array.isArray(d) ? d : []).filter((x) => x.adminDirect);
        };
        setCharter(pick(c));
        setLogistics(pick(l));
      } catch {
        toast.error("Could not load direct requests");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin]);

  const openCount = useMemo(
    () =>
      [...charter, ...logistics].filter((r) =>
        ["PENDING", "QUOTED"].includes(r.status)
      ).length,
    [charter, logistics]
  );

  if (!isAdmin) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Administrators only</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            These are requests customers sent directly to the Myboat team.
          </CardContent>
        </Card>
      </div>
    );
  }

  const Empty = ({ what }) => (
    <div className="py-16 text-center">
      <Search className="mx-auto h-10 w-10 text-sky-300" />
      <p className="mt-3 font-medium">No direct {what} requests yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        These arrive when a customer picks &ldquo;Request Boat MV&rdquo; instead
        of an operator.
      </p>
    </div>
  );

  const Contact = ({ r }) => (
    <div className="text-sm">
      <div className="font-medium">{r.guestName || "—"}</div>
      <div className="text-xs text-muted-foreground">
        {r.guestEmail || r.guestPhone || "—"}
      </div>
    </div>
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Direct Requests" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Search className="h-7 w-7 text-sky-500" />
            Direct Requests
          </h2>
          <p className="text-muted-foreground">
            Customers who asked Myboat to find them a boat. Operators do not see
            these — your team sources the vessel.
          </p>
        </div>
        {!loading && openCount > 0 && (
          <Badge className="bg-amber-500 hover:bg-amber-600">
            {openCount} needing attention
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      ) : (
        <Tabs defaultValue="charter">
          <TabsList>
            <TabsTrigger value="charter" className="gap-1.5">
              <Anchor className="h-4 w-4" /> Charter ({charter.length})
            </TabsTrigger>
            <TabsTrigger value="logistics" className="gap-1.5">
              <Package className="h-4 w-4" /> Logistics ({logistics.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charter">
            <Card>
              <CardContent className="p-0">
                {charter.length === 0 ? (
                  <Empty what="charter" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead>Trip date</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {charter.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            {r.origin} → {r.destination}
                          </TableCell>
                          <TableCell>{fmtDate(r.tripDate)}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5 text-sm">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              {r.passengers}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Contact r={r} />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColor(r.status)}>
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild size="sm" variant="outline">
                              <Link href="/admin/all-charter-requests">
                                Open <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logistics">
            <Card>
              <CardContent className="p-0">
                {logistics.length === 0 ? (
                  <Empty what="logistics" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead>Trip date</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logistics.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            {r.origin} → {r.destination}
                          </TableCell>
                          <TableCell>{fmtDate(r.tripDate)}</TableCell>
                          <TableCell>
                            <div className="text-sm">{r.cargoType || "—"}</div>
                            {r.weightKg != null && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Weight className="h-3 w-3" />
                                {Number(r.weightKg) / 1000} t
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Contact r={r} />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColor(r.status)}>
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild size="sm" variant="outline">
                              <Link href="/admin/all-logistics-requests">
                                Open <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
