"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Code2,
  Copy,
  ExternalLink,
  Loader2,
  Route as RouteIcon,
  Ship,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuth } from "@/store/use-auth";

const PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://myboat-mv.vercel.app";

// Unwrap the various list shapes the API returns depending on endpoint.
const asList = (res, ...keys) => {
  const d = res?.data?.data ?? res?.data;
  for (const k of keys) {
    if (Array.isArray(d?.[k])) return d[k];
  }
  return Array.isArray(d) ? d : [];
};

export default function EmbedBuilderPage() {
  // Operators share from Company Profile; this cross-operator builder is the
  // site administrator's tool.
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [vessels, setVessels] = useState([]);

  const [mode, setMode] = useState("route"); // "route" | "vessels"
  const [routeIds, setRouteIds] = useState([]);
  const [selectedVessels, setSelectedVessels] = useState([]);
  const [vesselQuery, setVesselQuery] = useState("");
  const [height, setHeight] = useState(600);

  useEffect(() => {
    (async () => {
      try {
        const [r, v] = await Promise.allSettled([
          api.get("/routes?limit=200"),
          api.get("/vehicles?limit=200"),
        ]);
        if (r.status === "fulfilled") {
          setRoutes(asList(r.value, "routes"));
        }
        if (v.status === "fulfilled") {
          setVessels(asList(v.value, "vehicles"));
        }
      } catch (err) {
        toast.error("Could not load routes and vessels");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleVessel = (id) =>
    setSelectedVessels((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const filteredVessels = useMemo(() => {
    const q = vesselQuery.trim().toLowerCase();
    if (!q) return vessels;
    return vessels.filter((v) =>
      [v.vehicleName, v.vehicleNumber, v.baseIsland]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q))
    );
  }, [vessels, vesselQuery]);

  const embedUrl = useMemo(() => {
    if (mode === "route") {
      if (!routeIds.length) return "";
      // One route gets the dedicated page (nicer header); several get the
      // combined timetable.
      return routeIds.length === 1
        ? `${PUBLIC_APP_URL}/embed/route/${routeIds[0]}`
        : `${PUBLIC_APP_URL}/embed/routes?ids=${routeIds.join(",")}`;
    }
    return selectedVessels.length
      ? `${PUBLIC_APP_URL}/embed/vessels?ids=${selectedVessels.join(",")}`
      : "";
  }, [mode, routeIds, selectedVessels]);

  const snippet = embedUrl
    ? `<iframe src="${embedUrl}" width="100%" height="${
        Number(height) || 600
      }" frameborder="0" style="border:0" loading="lazy"></iframe>`
    : "";

  const copy = async (text, what) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied`);
    } catch {
      toast.error("Could not copy — select the text and copy manually");
    }
  };

  const routeLabel = (r) =>
    `${r.sourceCity} → ${r.destinationCity}${
      r.serviceType && r.serviceType !== "SCHEDULED_FERRY"
        ? ` (${r.serviceType.replace("_", " ").toLowerCase()})`
        : ""
    }`;

  if (!isAdmin) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Administrators only</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Operators can share their own vessels from{" "}
            <b>Settings → Company Profile</b>.
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Code2 className="h-7 w-7 text-sky-500" />
          Embed Builder
        </h2>
        <p className="text-muted-foreground">
          Generate embed code for a route timetable or a hand-picked set of
          vessels, then paste it into any partner website.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ------------------------------ picker ------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>What do you want to embed?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <RadioGroup
              value={mode}
              onValueChange={setMode}
              className="grid gap-3 sm:grid-cols-2"
            >
              <Label
                htmlFor="mode-route"
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 has-[:checked]:border-sky-500"
              >
                <RadioGroupItem value="route" id="mode-route" />
                <span className="space-y-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <RouteIcon className="h-4 w-4 text-sky-500" /> Routes
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Live timetable of every departure, with fares
                  </span>
                </span>
              </Label>

              <Label
                htmlFor="mode-vessels"
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 has-[:checked]:border-sky-500"
              >
                <RadioGroupItem value="vessels" id="mode-vessels" />
                <span className="space-y-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Ship className="h-4 w-4 text-sky-500" /> Selected vessels
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    One or many vessels, in the order you pick them
                  </span>
                </span>
              </Label>
            </RadioGroup>

            {mode === "route" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Routes</Label>
                  <div className="flex items-center gap-2">
                    {routeIds.length > 0 && (
                      <Badge variant="outline">{routeIds.length} selected</Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={routes.length === 0}
                      onClick={() =>
                        setRouteIds(
                          routeIds.length === routes.length
                            ? []
                            : routes.map((r) => r.id)
                        )
                      }
                    >
                      {routeIds.length === routes.length && routes.length
                        ? "Clear all"
                        : "Select all"}
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-64 rounded-md border">
                  <div className="space-y-1 p-2">
                    {routes.length === 0 ? (
                      <p className="p-4 text-center text-sm text-muted-foreground">
                        No routes found.
                      </p>
                    ) : (
                      routes.map((r) => (
                        <Label
                          key={r.id}
                          className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted/60"
                        >
                          <Checkbox
                            checked={routeIds.includes(r.id)}
                            onCheckedChange={() =>
                              setRouteIds((prev) =>
                                prev.includes(r.id)
                                  ? prev.filter((x) => x !== r.id)
                                  : [...prev, r.id]
                              )
                            }
                          />
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {routeLabel(r)}
                          </span>
                        </Label>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Vessels</Label>
                  {selectedVessels.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {selectedVessels.length} selected
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVessels([])}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={vesselQuery}
                    onChange={(e) => setVesselQuery(e.target.value)}
                    placeholder="Search by name, number or island"
                    className="pl-8"
                  />
                </div>

                <ScrollArea className="h-64 rounded-md border">
                  <div className="p-2 space-y-1">
                    {filteredVessels.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">
                        No vessels match that search.
                      </p>
                    ) : (
                      filteredVessels.map((v) => (
                        <Label
                          key={v.id}
                          className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted/60"
                        >
                          <Checkbox
                            checked={selectedVessels.includes(v.id)}
                            onCheckedChange={() => toggleVessel(v.id)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {v.vehicleName}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {[v.vehicleNumber, v.baseIsland]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                        </Label>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="embed-height">Widget height (px)</Label>
              <Input
                id="embed-height"
                type="number"
                min={200}
                step={20}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="max-w-[160px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* ------------------------------ output ------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Embed code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Direct link</Label>
              <div className="flex gap-2">
                <Input readOnly value={embedUrl} placeholder="—" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={!embedUrl}
                  onClick={() => copy(embedUrl, "Link")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={!embedUrl}
                  asChild={!!embedUrl}
                >
                  {embedUrl ? (
                    <a href={embedUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span>
                      <ExternalLink className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Paste this into the partner site</Label>
              <textarea
                readOnly
                rows={4}
                value={snippet}
                placeholder={
                  mode === "route"
                    ? "Select at least one route to generate the code"
                    : "Select at least one vessel to generate the code"
                }
                className="w-full rounded-md border bg-muted/40 p-3 font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={!snippet}
                onClick={() => copy(snippet, "Embed code")}
              >
                <Copy className="h-4 w-4" /> Copy Embed Code
              </Button>
            </div>

            {embedUrl && (
              <div className="space-y-2">
                <Label>Live preview</Label>
                <div className="overflow-hidden rounded-md border">
                  <iframe
                    key={embedUrl}
                    src={embedUrl}
                    width="100%"
                    height={Math.min(Number(height) || 600, 420)}
                    style={{ border: 0 }}
                    loading="lazy"
                    title="Embed preview"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
