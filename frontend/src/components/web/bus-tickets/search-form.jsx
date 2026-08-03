"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarIcon,
  Loader2,
  MapPin,
  Ship,
  ArrowRight,
  Users,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { IslandSingleSelect } from "@/components/common/island-select";
import { toast } from "sonner";

const TABS = [
  { id: "ferry", label: "Ferry", href: "/bus-tickets" },
  { id: "charter", label: "Private Charter", href: "/charter" },
  { id: "logistics", label: "Logistics", href: "/logistics" },
];

export default function SearchForm({
  isDialog = false,
  defaultValues = {},
  onClose,
  className,
  variant = "light", // "light" = for placement on hero (glass card); "solid" = for dialogs
}) {
  const router = useRouter();
  const [tab, setTab] = useState("ferry");
  const [date, setDate] = useState(
    defaultValues.date ? new Date(defaultValues.date) : new Date()
  );
  const [passengers, setPassengers] = useState(1);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [formData, setFormData] = useState({
    sourceCity: defaultValues.from || "",
    destinationCity: defaultValues.to || "",
    routeId: defaultValues.routeId || "",
  });
  // Charter and logistics aren't limited to islands that already have a ferry
  // route, so they keep their own free island selection.
  const [charterFrom, setCharterFrom] = useState(defaultValues.from || "");
  const [charterTo, setCharterTo] = useState(defaultValues.to || "");

  const sourceCities = [...new Set(routes.map((r) => r.sourceCity))].sort();
  const destinationCities = routes
    .filter((r) => r.sourceCity === formData.sourceCity)
    .map((r) => r.destinationCity)
    .sort();

  useEffect(() => {
    const fetchCities = async () => {
      try {
        setIsLoadingCities(true);
        const response = await api.get("/public/cities");
        if (response.data.success) setRoutes(response.data.data);
      } catch {
        toast.error("Failed to load islands. Please try again.");
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  const swap = () => {
    setFormData((p) => ({
      ...p,
      sourceCity: p.destinationCity,
      destinationCity: p.sourceCity,
    }));
  };

  const handleSearch = async () => {
    if (tab === "charter") {
      if (!charterFrom || !charterTo || !date) {
        toast.error("Please choose where you're sailing from, to, and when");
        return;
      }
      const url =
        `/charter/search?from=${encodeURIComponent(charterFrom)}` +
        `&to=${encodeURIComponent(charterTo)}` +
        `&date=${format(date, "yyyy-MM-dd")}&passengers=${passengers}`;
      router.push(url);
      if (onClose) onClose();
      return;
    }
    if (tab !== "ferry") {
      router.push(TABS.find((t) => t.id === tab).href);
      return;
    }
    if (!formData.sourceCity || !formData.destinationCity || !date) {
      toast.error("Please select all required fields");
      return;
    }
    try {
      setLoading(true);
      const selectedRoute = routes.find(
        (r) =>
          r.sourceCity === formData.sourceCity &&
          r.destinationCity === formData.destinationCity
      );
      if (selectedRoute) {
        await new Promise((r) => setTimeout(r, 500));
        const url = `/bus-tickets?route-id=${selectedRoute.id}&from=${encodeURIComponent(
          formData.sourceCity
        )}&to=${encodeURIComponent(formData.destinationCity)}&date=${format(date, "yyyy-MM-dd")}`;
        router.push(url);
        if (onClose) onClose();
      } else {
        toast.error("No routes available for selected islands");
        setLoading(false);
      }
    } catch {
      toast.error("Failed to search routes. Please try again.");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-14 rounded-2xl border border-border/60 bg-white hover:bg-foam focus:bg-white transition-colors px-4 text-ocean-deep font-medium data-[placeholder]:text-muted-foreground";

  const FormContent = () => (
    <div className={cn("w-full", className)}>
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-full bg-foam/80 border border-border/50 w-fit mx-auto md:mx-0 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 md:px-5 h-10 rounded-full text-sm font-medium tracking-wide transition-all",
              tab === t.id
                ? "bg-coral text-white shadow-coral"
                : "text-ocean/70 hover:text-ocean-deep"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ferry" ? (
        <>
          {/* Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-3 items-end">
            {/* From */}
            <FieldWrap label="From" icon={MapPin}>
              <Select
                value={formData.sourceCity}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, sourceCity: v, destinationCity: "" }))
                }
                disabled={isLoadingCities}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder={isLoadingCities ? "Loading..." : "Departure island"} />
                </SelectTrigger>
                <SelectContent>
                  {sourceCities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={swap}
                aria-label="Swap"
                className="hidden md:flex absolute -right-2 top-9 h-9 w-9 items-center justify-center rounded-full bg-white border border-border shadow-sm z-10 hover:border-lagoon hover:text-lagoon text-ocean"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>
            </FieldWrap>

            {/* To */}
            <FieldWrap label="To" icon={MapPin}>
              <Select
                value={formData.destinationCity}
                onValueChange={(v) => setFormData((p) => ({ ...p, destinationCity: v }))}
                disabled={isLoadingCities || !formData.sourceCity}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue
                    placeholder={
                      !formData.sourceCity ? "Select departure first" : "Destination island"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {destinationCities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrap>

            {/* Date */}
            <FieldWrap label="Date" icon={CalendarIcon}>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(inputClass, "flex items-center justify-between text-left")}
                  >
                    <span className={date ? "text-ocean-deep" : "text-muted-foreground"}>
                      {date ? format(date, "MMM d, yyyy") : "Pick a date"}
                    </span>
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </FieldWrap>

            {/* Passengers */}
            <FieldWrap label="Passengers" icon={Users}>
              <div className={cn(inputClass, "flex items-center justify-between")}>
                <button
                  type="button"
                  onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                  className="h-8 w-8 rounded-full bg-foam text-ocean-deep hover:bg-lagoon/10 flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-ocean-deep font-medium">{passengers}</span>
                <button
                  type="button"
                  onClick={() => setPassengers((p) => p + 1)}
                  className="h-8 w-8 rounded-full bg-foam text-ocean-deep hover:bg-lagoon/10 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </FieldWrap>
          </div>

          {/* Submit */}
          <div className="mt-5 md:mt-6 flex md:justify-end">
            <Button
              onClick={handleSearch}
              disabled={loading || isLoadingCities}
              className="w-full md:w-auto md:min-w-[220px] h-14 bg-coral hover:bg-coral-soft text-white rounded-full shadow-coral text-base font-medium tracking-wide"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Searching...
                </>
              ) : (
                <>
                  Search boats <ArrowRight className="h-4 w-4 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </>
      ) : tab === "charter" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <FieldWrap label="From" icon={MapPin}>
              <IslandSingleSelect
                value={charterFrom}
                onChange={setCharterFrom}
                placeholder="Departure island"
              />
            </FieldWrap>

            <FieldWrap label="To" icon={MapPin}>
              <IslandSingleSelect
                value={charterTo}
                onChange={setCharterTo}
                placeholder="Destination island"
              />
            </FieldWrap>

            <FieldWrap label="Date" icon={CalendarIcon}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(inputClass, "justify-start font-medium")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-lagoon" />
                    {date ? format(date, "dd MMM yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) =>
                      d < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FieldWrap>

            <FieldWrap label="Passengers" icon={Users}>
              <Select
                value={String(passengers)}
                onValueChange={(v) => setPassengers(Number(v))}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? "passenger" : "passengers"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrap>
          </div>

          <div className="mt-5 md:mt-6 flex md:justify-end">
            <Button
              onClick={handleSearch}
              className="w-full md:w-auto md:min-w-[220px] h-14 bg-coral hover:bg-coral-soft text-white rounded-full shadow-coral text-base font-medium tracking-wide"
            >
              Search charters <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-8 md:py-12 space-y-4">
          <Ship className="h-10 w-10 text-lagoon mx-auto" />
          <p className="text-ocean-deep text-lg font-medium">
            Ship cargo across atolls
          </p>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Bulk goods, supplies, and equipment delivered to any inhabited
            island.
          </p>
          <Button
            onClick={handleSearch}
            className="bg-coral hover:bg-coral-soft text-white rounded-full h-12 px-8 shadow-coral"
          >
            Continue <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      )}
    </div>
  );

  if (isDialog) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[720px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-ocean-deep">Modify Search</DialogTitle>
          </DialogHeader>
          <FormContent />
        </DialogContent>
      </Dialog>
    );
  }

  return <FormContent />;
}

function FieldWrap({ label, icon: Icon, children }) {
  return (
    <div className="relative">
      <label className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5 pl-1">
        {label}
      </label>
      {children}
    </div>
  );
}
