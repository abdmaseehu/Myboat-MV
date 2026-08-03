"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, MapPin, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";

/* -------------------------------------------------------------------------- */
/*  Shared island data                                                        */
/* -------------------------------------------------------------------------- */

// Module-level cache so multiple selects on the same screen (From, To, and any
// boarding/dropping point rows) share a single network request.
let islandsCache = null;
let islandsPromise = null;

function fetchIslands() {
  if (islandsCache) return Promise.resolve(islandsCache);
  if (!islandsPromise) {
    islandsPromise = api
      .get("/islands", { params: { limit: 500 } })
      .then((res) => {
        const list = res?.data?.data?.islands || [];
        islandsCache = list;
        return list;
      })
      .catch((error) => {
        // Allow a later mount to retry
        islandsPromise = null;
        throw error;
      });
  }
  return islandsPromise;
}

function useIslands() {
  const [islands, setIslands] = useState(islandsCache || []);
  const [loading, setLoading] = useState(!islandsCache);

  useEffect(() => {
    if (islandsCache) return undefined;

    let cancelled = false;
    setLoading(true);

    fetchIslands()
      .then((list) => {
        if (!cancelled) {
          setIslands(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIslands([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { islands, loading };
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const TYPE_CHIPS = {
  RESORT: { text: "Resort", className: "bg-teal-500/15 text-teal-700 dark:text-teal-300" },
  AIRPORT: { text: "Airport", className: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  INDUSTRIAL: { text: "Industrial", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
};

function TypeChip({ type }) {
  // No chip for ordinary inhabited islands - it would be noise on ~200 rows
  const chip = TYPE_CHIPS[type];
  if (!chip) return null;
  return (
    <span
      className={cn(
        "ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        chip.className
      )}
    >
      {chip.text}
    </span>
  );
}

// Group an already-sorted island list by atoll, preserving order.
function groupByAtoll(islands) {
  const groups = [];
  const index = new Map();

  islands.forEach((island) => {
    const key = island.atollName || "Other";
    if (!index.has(key)) {
      const group = { atollName: key, items: [] };
      index.set(key, group);
      groups.push(group);
    }
    index.get(key).items.push(island);
  });

  return groups;
}

function filterIslands(islands, query) {
  const q = query.trim().toLowerCase();
  if (!q) return islands;
  return islands.filter(
    (island) =>
      island.name?.toLowerCase().includes(q) ||
      island.label?.toLowerCase().includes(q) ||
      island.atollName?.toLowerCase().includes(q)
  );
}

// Shared popover panel sizing: matches the trigger width, full-width friendly
// down to 375px viewports.
const POPOVER_CLASS =
  "w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0 rounded-2xl shadow-premium";

const TRIGGER_CLASS =
  "w-full justify-between rounded-2xl bg-background font-normal h-11";

// Sticky atoll headers inside the scrolling list
const GROUP_CLASS = cn(
  "[&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:z-10",
  "[&_[cmdk-group-heading]]:bg-popover [&_[cmdk-group-heading]]:uppercase",
  "[&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-lagoon"
);

const ITEM_CLASS =
  "cursor-pointer rounded-xl px-2 py-3 text-sm aria-selected:bg-teal-500/10";

/* -------------------------------------------------------------------------- */
/*  IslandMultiSelect                                                         */
/* -------------------------------------------------------------------------- */

export function IslandMultiSelect({
  value = [],
  onChange,
  placeholder = "Select locations",
  label,
  disabled = false,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { islands, loading } = useIslands();

  const selected = Array.isArray(value) ? value : [];

  const groups = useMemo(
    () => groupByAtoll(filterIslands(islands, query)),
    [islands, query]
  );

  const toggle = (islandLabel) => {
    if (selected.includes(islandLabel)) {
      onChange?.(selected.filter((item) => item !== islandLabel));
    } else {
      onChange?.([...selected, islandLabel]);
    }
  };

  const remove = (islandLabel) => {
    onChange?.(selected.filter((item) => item !== islandLabel));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className={TRIGGER_CLASS}
          >
            <span className="flex items-center gap-2 truncate">
              <MapPin className="h-4 w-4 shrink-0 text-lagoon" />
              <span className="truncate">
                {loading
                  ? "Loading locations..."
                  : selected.length > 0
                  ? `${selected.length} location${
                      selected.length === 1 ? "" : "s"
                    } selected`
                  : placeholder}
              </span>
            </span>
            {loading ? (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className={POPOVER_CLASS}>
          {/* shouldFilter={false} - we filter ourselves so we can group by atoll */}
          <Command shouldFilter={false} className="rounded-2xl">
            <CommandInput
              placeholder="Search island or atoll..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="max-h-[45vh] md:max-h-[320px]">
              <CommandEmpty>No location found.</CommandEmpty>
              {groups.map((group) => (
                <CommandGroup
                  key={group.atollName}
                  heading={group.atollName}
                  className={GROUP_CLASS}
                >
                  {group.items.map((island) => {
                    const isSelected = selected.includes(island.label);
                    return (
                      <CommandItem
                        key={island.id}
                        value={island.label}
                        onSelect={() => toggle(island.label)}
                        className={ITEM_CLASS}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0 text-lagoon",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{island.name}</span>
                        <TypeChip type={island.type} />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected items as removable lagoon chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-700 dark:text-teal-300"
            >
              <span className="truncate">{item}</span>
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => remove(item)}
                disabled={disabled}
                className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-teal-500/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  IslandSingleSelect                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Distinct atolls, derived from the same cached island list so picking an
 * atoll costs no extra request.
 * @returns {{atolls: {code: string, name: string}[], loading: boolean}}
 */
export function useAtolls() {
  const { islands, loading } = useIslands();
  const atolls = useMemo(() => {
    const seen = new Map();
    islands.forEach((i) => {
      if (i.atollCode && !seen.has(i.atollCode)) {
        seen.set(i.atollCode, { code: i.atollCode, name: i.atollName || i.atollCode });
      }
    });
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [islands]);
  return { atolls, loading };
}

export function IslandSingleSelect({
  value = "",
  onChange,
  placeholder = "Select a location",
  label,
  disabled = false,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { islands, loading } = useIslands();

  const groups = useMemo(
    () => groupByAtoll(filterIslands(islands, query)),
    [islands, query]
  );

  const select = (islandLabel) => {
    onChange?.(islandLabel);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className={TRIGGER_CLASS}
          >
            <span className="flex items-center gap-2 truncate">
              <MapPin className="h-4 w-4 shrink-0 text-lagoon" />
              <span className={cn("truncate", !value && "text-muted-foreground")}>
                {loading ? "Loading locations..." : value || placeholder}
              </span>
            </span>
            {loading ? (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className={POPOVER_CLASS}>
          <Command shouldFilter={false} className="rounded-2xl">
            <CommandInput
              placeholder="Search island or atoll..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="max-h-[45vh] md:max-h-[320px]">
              <CommandEmpty>No location found.</CommandEmpty>
              {groups.map((group) => (
                <CommandGroup
                  key={group.atollName}
                  heading={group.atollName}
                  className={GROUP_CLASS}
                >
                  {group.items.map((island) => (
                    <CommandItem
                      key={island.id}
                      value={island.label}
                      onSelect={() => select(island.label)}
                      className={ITEM_CLASS}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0 text-lagoon",
                          value === island.label ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{island.name}</span>
                      <TypeChip type={island.type} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default IslandMultiSelect;
