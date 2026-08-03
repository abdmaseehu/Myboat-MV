"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IslandSingleSelect, useAtolls } from "@/components/common/island-select";
import { Anchor, Package, Plus, Ship, X } from "lucide-react";
import { CARGO_TYPES } from "@/lib/cargo-types";

export const SERVICE_OPTIONS = [
  {
    value: "FERRY",
    label: "Ferry",
    hint: "Scheduled departures with per-seat tickets",
    icon: Ship,
  },
  {
    value: "PRIVATE_CHARTER",
    label: "Private Charter",
    hint: "Whole boat hired by one customer",
    icon: Anchor,
  },
  {
    value: "LOGISTICS",
    label: "Logistics",
    hint: "Cargo and freight between islands",
    icon: Package,
  },
];

// Single source of truth, shared with the customer logistics search.
export { CARGO_TYPES };

export const emptyCharterRate = () => ({
  fromIsland: "",
  toIsland: "",
  priceMvr: "",
  priceUsd: "",
  quoteOnly: false,
});

export const emptyLogisticsRate = () => ({
  coverage: "ROUTE",
  fromIsland: "",
  toIsland: "",
  atollCode: "",
  basis: "PER_TON",
  priceMvr: "",
  priceUsd: "",
  quoteOnly: false,
});

/**
 * Service configuration shared by the create and edit vessel forms.
 *
 * A vessel can serve more than one category — a ferry that is also available
 * for charter is ticked twice rather than added to the system twice.
 *
 * All state lives in the parent so the forms keep a single submit payload;
 * this component is presentational plus a few small list helpers.
 */
export default function VesselServicesFields({
  serviceTypes = [],
  onServiceTypesChange,
  charterPricingMode = "QUOTE",
  onCharterPricingModeChange,
  charterInstantBooking = false,
  onCharterInstantBookingChange,
  charterRates = [],
  onCharterRatesChange,
  capacityTons = "",
  onCapacityTonsChange,
  cargoTypes = [],
  onCargoTypesChange,
  logisticsRates = [],
  onLogisticsRatesChange,
  disabled = false,
}) {
  const { atolls } = useAtolls();

  const has = (t) => serviceTypes.includes(t);
  const toggleService = (t) =>
    onServiceTypesChange(
      has(t) ? serviceTypes.filter((x) => x !== t) : [...serviceTypes, t]
    );

  const patchRow = (list, onChange) => (i, patch) =>
    onChange(list.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const dropRow = (list, onChange) => (i) =>
    onChange(list.filter((_, idx) => idx !== i));

  const patchCharter = patchRow(charterRates, onCharterRatesChange);
  const dropCharter = dropRow(charterRates, onCharterRatesChange);
  const patchLogistics = patchRow(logisticsRates, onLogisticsRatesChange);
  const dropLogistics = dropRow(logisticsRates, onLogisticsRatesChange);

  const priceInputs = (row, patch, i, perTonSuffix = false) => (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs">
          Price MVR{perTonSuffix ? " / ton" : ""}
        </Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="—"
          value={row.priceMvr}
          disabled={disabled || row.quoteOnly}
          onChange={(e) => patch(i, { priceMvr: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">
          Price USD{perTonSuffix ? " / ton" : ""}
        </Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="—"
          value={row.priceUsd}
          disabled={disabled || row.quoteOnly}
          onChange={(e) => patch(i, { priceUsd: e.target.value })}
        />
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      {/* -------------------------- service types ------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Services Offered</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {SERVICE_OPTIONS.map(({ value, label, hint, icon: Icon }) => (
            <Label
              key={value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50/50 dark:has-[:checked]:bg-sky-900/10"
            >
              <Checkbox
                checked={has(value)}
                disabled={disabled}
                onCheckedChange={() => toggleService(value)}
              />
              <span className="space-y-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Icon className="h-4 w-4 text-sky-500" />
                  {label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {hint}
                </span>
              </span>
            </Label>
          ))}
          {serviceTypes.length === 0 && (
            <p className="sm:col-span-3 text-sm text-destructive">
              Pick at least one service, or the vessel won&apos;t appear in any
              search.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ------------------------- private charter ------------------------ */}
      {has("PRIVATE_CHARTER") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Anchor className="h-4 w-4 text-sky-500" />
              Private Charter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Pricing</Label>
                <Select
                  value={charterPricingMode}
                  onValueChange={onCharterPricingModeChange}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LIVE">
                      Show live prices from my rate table
                    </SelectItem>
                    <SelectItem value="QUOTE">
                      Quote on request only
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Live prices let customers book instantly. Quote-only sends you
                  a request first.
                </p>
              </div>

              {charterPricingMode === "LIVE" && (
                <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-base">Instant booking</Label>
                    <p className="text-xs text-muted-foreground">
                      Customers pay and confirm without waiting for you to
                      approve.
                    </p>
                  </div>
                  <Switch
                    checked={charterInstantBooking}
                    disabled={disabled}
                    onCheckedChange={onCharterInstantBookingChange}
                    className="data-[state=checked]:bg-sky-500"
                  />
                </div>
              )}
            </div>

            {charterPricingMode === "LIVE" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Charter Routes &amp; Prices</Label>
                    <p className="text-xs text-muted-foreground">
                      One flat price for the whole boat. Fill MVR, USD, or both.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() =>
                      onCharterRatesChange([...charterRates, emptyCharterRate()])
                    }
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> Add Route
                  </Button>
                </div>

                {charterRates.length === 0 ? (
                  <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                    No routes yet. Without at least one, this vessel falls back
                    to quote requests.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {charterRates.map((row, i) => (
                      <div key={i} className="rounded-lg border p-3 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline">Route {i + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                            disabled={disabled}
                            onClick={() => dropCharter(i)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <IslandSingleSelect
                            label="From"
                            value={row.fromIsland}
                            onChange={(v) => patchCharter(i, { fromIsland: v })}
                            disabled={disabled}
                          />
                          <IslandSingleSelect
                            label="To"
                            value={row.toIsland}
                            onChange={(v) => patchCharter(i, { toIsland: v })}
                            disabled={disabled}
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {priceInputs(row, patchCharter, i)}
                        </div>

                        <Label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={row.quoteOnly}
                            disabled={disabled}
                            onCheckedChange={(c) =>
                              patchCharter(i, { quoteOnly: !!c })
                            }
                          />
                          Quote on request for this route
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------------------------- logistics --------------------------- */}
      {has("LOGISTICS") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-sky-500" />
              Logistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2 sm:max-w-xs">
              <Label>Cargo Capacity (tons)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="e.g. 12"
                value={capacityTons}
                disabled={disabled}
                onChange={(e) => onCapacityTonsChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Cargo Types Accepted</Label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {CARGO_TYPES.map((c) => (
                  <Label
                    key={c}
                    className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={cargoTypes.includes(c)}
                      disabled={disabled}
                      onCheckedChange={() =>
                        onCargoTypesChange(
                          cargoTypes.includes(c)
                            ? cargoTypes.filter((x) => x !== c)
                            : [...cargoTypes, c]
                        )
                      }
                    />
                    {c}
                  </Label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Coverage &amp; Rates</Label>
                  <p className="text-xs text-muted-foreground">
                    Price a specific route, a whole atoll, or anywhere in the
                    Maldives.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() =>
                    onLogisticsRatesChange([
                      ...logisticsRates,
                      emptyLogisticsRate(),
                    ])
                  }
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Add Rate
                </Button>
              </div>

              {logisticsRates.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No rates yet. Without one, this vessel falls back to quote
                  requests.
                </p>
              ) : (
                <div className="space-y-3">
                  {logisticsRates.map((row, i) => (
                    <div key={i} className="rounded-lg border p-3 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline">Rate {i + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                          disabled={disabled}
                          onClick={() => dropLogistics(i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Applies to</Label>
                          <Select
                            value={row.coverage}
                            disabled={disabled}
                            onValueChange={(v) =>
                              patchLogistics(i, { coverage: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ROUTE">
                                A specific route
                              </SelectItem>
                              <SelectItem value="ATOLL">
                                Anywhere in one atoll
                              </SelectItem>
                              <SelectItem value="NATIONWIDE">
                                Anywhere in the Maldives
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Charged</Label>
                          <Select
                            value={row.basis}
                            disabled={disabled}
                            onValueChange={(v) => patchLogistics(i, { basis: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PER_TON">Per ton</SelectItem>
                              <SelectItem value="FLAT">
                                Flat price for the boat
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {row.coverage === "ROUTE" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <IslandSingleSelect
                            label="From"
                            value={row.fromIsland}
                            onChange={(v) =>
                              patchLogistics(i, { fromIsland: v })
                            }
                            disabled={disabled}
                          />
                          <IslandSingleSelect
                            label="To"
                            value={row.toIsland}
                            onChange={(v) => patchLogistics(i, { toIsland: v })}
                            disabled={disabled}
                          />
                        </div>
                      )}

                      {row.coverage === "ATOLL" && (
                        <div className="space-y-1.5 sm:max-w-xs">
                          <Label className="text-xs">Atoll</Label>
                          <Select
                            value={row.atollCode || undefined}
                            disabled={disabled}
                            onValueChange={(v) =>
                              patchLogistics(i, { atollCode: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select atoll" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              {atolls.map((a) => (
                                <SelectItem key={a.code} value={a.code}>
                                  {a.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2">
                        {priceInputs(
                          row,
                          patchLogistics,
                          i,
                          row.basis === "PER_TON"
                        )}
                      </div>

                      <Label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={row.quoteOnly}
                          disabled={disabled}
                          onCheckedChange={(c) =>
                            patchLogistics(i, { quoteOnly: !!c })
                          }
                        />
                        Quote on request for this rate
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
