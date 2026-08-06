"use client";

import { useEffect, useState } from "react";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Percent,
  Route as RouteIcon,
  Save,
  Trash2,
  Wallet,
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAuth } from "@/store/use-auth";

const BLANK_MARKUP = { routeId: "", markupLocal: "", markupExpat: "", markupTourist: "" };

/**
 * Platform economics: the global cut, the ceilings an operator may grant an
 * agent, and per-route markups.
 *
 * Markups are flat amounts per passenger tier, in that tier's own currency —
 * local and expat are billed in MVR, tourists in USD, and the two never mix,
 * so a single percentage could not express either correctly.
 */
export default function CommissionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingMarkup, setSavingMarkup] = useState(false);
  const [clearing, setClearing] = useState(null);

  const [globals, setGlobals] = useState({
    globalPlatformPercentage: "",
    globalPlatformFlatFee: "",
    globalPlatformFlatFeeUsd: "",
    agentMaxCommissionPercent: "",
    agentMaxDiscountPercent: "",
  });
  const [markups, setMarkups] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [draft, setDraft] = useState(BLANK_MARKUP);

  const load = async () => {
    const [cfg, rts] = await Promise.allSettled([
      api.get("/commissions"),
      api.get("/routes?limit=200"),
    ]);
    if (cfg.status === "fulfilled") {
      const d = cfg.value?.data?.data;
      setGlobals({
        globalPlatformPercentage: String(d?.global?.globalPlatformPercentage ?? 0),
        globalPlatformFlatFee: String(d?.global?.globalPlatformFlatFee ?? 0),
        globalPlatformFlatFeeUsd: String(d?.global?.globalPlatformFlatFeeUsd ?? 0),
        agentMaxCommissionPercent: String(d?.global?.agentMaxCommissionPercent ?? 25),
        agentMaxDiscountPercent: String(d?.global?.agentMaxDiscountPercent ?? 25),
      });
      setMarkups(d?.markups || []);
    }
    if (rts.status === "fulfilled") {
      const d = rts.value?.data?.data;
      setRoutes(Array.isArray(d?.routes) ? d.routes : Array.isArray(d) ? d : []);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        await load();
      } catch {
        toast.error("Could not load commission settings");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin]);

  // Every route is selectable: the API upserts, so picking one that already has
  // a markup edits it. Forcing clear-then-re-add would lose the current values.
  const availableRoutes = routes;

  const pickRoute = (routeId) => {
    const existing = markups.find((m) => m.routeId === routeId);
    setDraft({
      routeId,
      markupLocal: existing ? String(existing.markupLocal) : "",
      markupExpat: existing ? String(existing.markupExpat) : "",
      markupTourist: existing ? String(existing.markupTourist) : "",
    });
  };

  const editingExisting = markups.some((m) => m.routeId === draft.routeId);

  const saveGlobals = async () => {
    try {
      setSavingGlobal(true);
      await api.post("/commissions/global", {
        globalPlatformPercentage: Number(globals.globalPlatformPercentage || 0),
        globalPlatformFlatFee: Number(globals.globalPlatformFlatFee || 0),
        globalPlatformFlatFeeUsd: Number(globals.globalPlatformFlatFeeUsd || 0),
        agentMaxCommissionPercent: Number(globals.agentMaxCommissionPercent || 0),
        agentMaxDiscountPercent: Number(globals.agentMaxDiscountPercent || 0),
      });
      toast.success("Platform settings saved");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save settings");
    } finally {
      setSavingGlobal(false);
    }
  };

  const saveMarkup = async (row) => {
    if (!row.routeId) {
      toast.error("Choose a route first");
      return;
    }
    try {
      setSavingMarkup(true);
      await api.post("/commissions/route", {
        routeId: row.routeId,
        markupLocal: Number(row.markupLocal || 0),
        markupExpat: Number(row.markupExpat || 0),
        markupTourist: Number(row.markupTourist || 0),
      });
      toast.success("Route markup saved");
      setDraft(BLANK_MARKUP);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save the markup");
    } finally {
      setSavingMarkup(false);
    }
  };

  const clearMarkup = async (routeId) => {
    try {
      setClearing(routeId);
      await api.delete(`/commissions/route/${routeId}`);
      toast.success("Markup cleared — this route is back to 0.00");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not clear the markup");
    } finally {
      setClearing(null);
    }
  };

  const setG = (k) => (e) => setGlobals((g) => ({ ...g, [k]: e.target.value }));
  const setD = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  const routeLabel = (r) => `${r.sourceCity} → ${r.destinationCity}`;

  if (!isAdmin) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Administrators only</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Platform commission is set by Myboat, not by operators.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Commissions" },
        ]}
      />

      <div>
        <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Wallet className="h-7 w-7 text-sky-500" />
          Commissions &amp; Markups
        </h2>
        <p className="text-muted-foreground">
          What Myboat takes from each booking, and the limits operators work
          within.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ------------------------------ globals ------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Cut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pct">Percentage of each booking</Label>
              <div className="relative">
                <Input
                  id="pct"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={globals.globalPlatformPercentage}
                  onChange={setG("globalPlatformPercentage")}
                />
                <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Taken from the public price — the operator&apos;s fare plus the
                route markup.
              </p>
            </div>

            {/* Two fees, not one. A single number would charge the same figure
                on an MVR fare and a USD fare — a silent 1:1 conversion. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="flat">Flat fee per MVR booking</Label>
                <Input
                  id="flat"
                  type="number"
                  min={0}
                  step="0.01"
                  value={globals.globalPlatformFlatFee}
                  onChange={setG("globalPlatformFlatFee")}
                />
                <p className="text-xs text-muted-foreground">Local and expat fares.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="flatUsd">Flat fee per USD booking</Label>
                <Input
                  id="flatUsd"
                  type="number"
                  min={0}
                  step="0.01"
                  value={globals.globalPlatformFlatFeeUsd}
                  onChange={setG("globalPlatformFlatFeeUsd")}
                />
                <p className="text-xs text-muted-foreground">Tourist fares.</p>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-base">Agent Limits</Label>
              <p className="mb-3 text-xs text-muted-foreground">
                The most an operator may grant a guesthouse. Enforced on every
                approval and edit.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxc">Max commission %</Label>
                  <Input
                    id="maxc"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={globals.agentMaxCommissionPercent}
                    onChange={setG("agentMaxCommissionPercent")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxd">Max discount %</Label>
                  <Input
                    id="maxd"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={globals.agentMaxDiscountPercent}
                    onChange={setG("agentMaxDiscountPercent")}
                  />
                </div>
              </div>
            </div>

            <Button onClick={saveGlobals} disabled={savingGlobal} className="gap-2">
              {savingGlobal ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save platform settings
            </Button>
          </CardContent>
        </Card>

        {/* --------------------------- add a markup ----------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingExisting ? "Update Route Markup" : "Add a Route Markup"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Route</Label>
              <Select
                value={draft.routeId || undefined}
                onValueChange={pickRoute}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a route" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {availableRoutes.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No routes yet
                    </div>
                  ) : (
                    availableRoutes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {routeLabel(r)}
                        {markups.some((m) => m.routeId === r.id) ? "  (has markup)" : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Local (MVR)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={draft.markupLocal}
                  onChange={setD("markupLocal")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expat (MVR)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={draft.markupExpat}
                  onChange={setD("markupExpat")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tourist (USD)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={draft.markupTourist}
                  onChange={setD("markupTourist")}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Flat amounts added on top of the operator&apos;s fare, each in its
              own tier&apos;s currency. A route with no row simply has no markup.
            </p>

            <Button
              onClick={() => saveMarkup(draft)}
              disabled={savingMarkup || !draft.routeId}
              className="gap-2"
            >
              {savingMarkup ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingExisting ? "Update markup" : "Save markup"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* --------------------------- existing rows ------------------------ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <RouteIcon className="h-4 w-4 text-sky-500" />
            Configured Markups
          </CardTitle>
          <Badge variant="outline">
            {markups.length} of {routes.length} routes
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {markups.length === 0 ? (
            <div className="py-14 text-center">
              <RouteIcon className="mx-auto h-10 w-10 text-sky-300" />
              <p className="mt-3 font-medium">No route markups configured</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Every route currently sells at the operator&apos;s own fare.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead className="text-right">Local (MVR)</TableHead>
                  <TableHead className="text-right">Expat (MVR)</TableHead>
                  <TableHead className="text-right">Tourist (USD)</TableHead>
                  <TableHead className="text-right">Clear</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {markups.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {m.route
                        ? routeLabel(m.route)
                        : m.routeId.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {Number(m.markupLocal).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {Number(m.markupExpat).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-sky-600">
                      {Number(m.markupTourist).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        disabled={clearing === m.routeId}
                        onClick={() => clearMarkup(m.routeId)}
                      >
                        {clearing === m.routeId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
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
