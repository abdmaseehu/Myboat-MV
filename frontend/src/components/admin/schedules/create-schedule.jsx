"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Form validation schema
const formSchema = z
  .object({
    routeId: z.string().min(1, "Route is required"),
    vehicleId: z.string().min(1, "Vehicle is required"),
    departureTime: z.string().min(1, "Departure time is required"),
    arrivalTime: z.string().min(1, "Arrival time is required"),
    busType: z.enum(["AC_SLEEPER", "NON_AC_SLEEPER", "AC_SEATER"]),
    departureDate: z.string().min(1, "Start date is required"),
    arrivalDate: z.string().optional().or(z.literal("")),
    availableSeats: z.coerce.number().int().min(0).default(0),
    blockedSeats: z.coerce.number().int().min(0).default(0),
    priceLocalMvr: z.coerce.number().nonnegative().optional().or(z.nan()),
    priceExpatMvr: z.coerce.number().nonnegative().optional().or(z.nan()),
    priceTouristUsd: z.coerce.number().nonnegative().optional().or(z.nan()),
    status: z.enum(["ACTIVE", "CANCELLED", "COMPLETED"]).default("ACTIVE"),
    isActive: z.boolean().default(true),
    isRecurring: z.boolean().default(false),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
    recurrenceEndDate: z.string().optional().or(z.literal("")),
    daySpecificTiming: z.record(z.any()).optional(),
  })
  .refine(
    (data) => {
      if (data.isRecurring) return data.daysOfWeek.length > 0;
      return true;
    },
    { message: "Select at least one day of the week", path: ["daysOfWeek"] }
  )
  .refine(
    (data) => {
      if (data.isRecurring) return true;
      if (!data.arrivalDate) return false;
      const dep = new Date(`${data.departureDate}T${data.departureTime}`);
      const arr = new Date(`${data.arrivalDate}T${data.arrivalTime}`);
      return arr > dep;
    },
    { message: "Arrival must be after departure", path: ["arrivalTime"] }
  );

export default function CreateSchedule({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [daySpecificTiming, setDaySpecificTiming] = useState({}); // { [dayNum]: { enabled, departure, arrival } }

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      routeId: "",
      vehicleId: "",
      departureTime: "08:00",
      arrivalTime: "08:15",
      busType: "AC_SLEEPER",
      departureDate: "",
      arrivalDate: "",
      availableSeats: 0,
      blockedSeats: 0,
      priceLocalMvr: undefined,
      priceExpatMvr: undefined,
      priceTouristUsd: undefined,
      status: "ACTIVE",
      isActive: true,
      isRecurring: false,
      daysOfWeek: [],
      recurrenceEndDate: "",
    },
  });

  const isRecurring = form.watch("isRecurring");
  const selectedDays = form.watch("daysOfWeek") || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [routesRes, vehiclesRes] = await Promise.all([
          api.get("/routes"),
          api.get("/vehicles"),
        ]);
        setRoutes(routesRes.data.data.routes);
        setVehicles(vehiclesRes.data.data.vehicles);
      } catch (error) {
        toast.error("Failed to fetch data");
      }
    };
    if (open) fetchData();
  }, [open]);

  const toggleDay = (day) => {
    const cur = form.getValues("daysOfWeek") || [];
    const next = cur.includes(day)
      ? cur.filter((d) => d !== day)
      : [...cur, day].sort();
    form.setValue("daysOfWeek", next, { shouldValidate: true });
  };

  const updateDayTiming = (day, field, value) => {
    setDaySpecificTiming((prev) => ({
      ...prev,
      [day]: {
        enabled: prev[day]?.enabled ?? false,
        departure: prev[day]?.departure ?? form.getValues("departureTime"),
        arrival: prev[day]?.arrival ?? form.getValues("arrivalTime"),
        [field]: value,
      },
    }));
  };

  const onSubmit = async (values) => {
    try {
      setLoading(true);

      const dep = new Date(`${values.departureDate}T${values.departureTime}`);
      const arr = values.isRecurring
        ? new Date(`${values.departureDate}T${values.arrivalTime}`)
        : new Date(`${values.arrivalDate}T${values.arrivalTime}`);

      // Build daySpecificTiming JSON: only include enabled overrides for selected days
      const dst = {};
      if (values.isRecurring) {
        Object.entries(daySpecificTiming).forEach(([d, cfg]) => {
          if (
            cfg?.enabled &&
            values.daysOfWeek.includes(Number(d)) &&
            cfg.departure &&
            cfg.arrival
          ) {
            dst[d] = { departure: cfg.departure, arrival: cfg.arrival };
          }
        });
      }

      const cleanNumber = (v) =>
        v === undefined || v === null || Number.isNaN(v) || v === ""
          ? undefined
          : Number(v);

      const payload = {
        routeId: values.routeId,
        vehicleId: values.vehicleId,
        busType: values.busType,
        status: values.status,
        isActive: values.isActive,
        availableSeats: Number(values.availableSeats) || 0,
        blockedSeats: Number(values.blockedSeats) || 0,
        priceLocalMvr: cleanNumber(values.priceLocalMvr),
        priceExpatMvr: cleanNumber(values.priceExpatMvr),
        priceTouristUsd: cleanNumber(values.priceTouristUsd),
        departureTime: dep.toISOString(),
        arrivalTime: arr.toISOString(),
        departureDate: dep.toISOString(),
        arrivalDate: arr.toISOString(),
        isRecurring: values.isRecurring,
        daysOfWeek: values.isRecurring ? values.daysOfWeek : [],
        recurrenceEndDate:
          values.isRecurring && values.recurrenceEndDate
            ? new Date(values.recurrenceEndDate).toISOString()
            : null,
        daySpecificTiming: Object.keys(dst).length ? dst : null,
      };

      const response = await api.post("/bus-schedules", payload);

      if (response.data.success) {
        toast.success("Schedule created successfully");
        form.reset();
        setDaySpecificTiming({});
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create schedule"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Schedule</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="timing">Timing</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
              </TabsList>

              {/* BASIC INFO */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="routeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Route</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select route" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {routes.map((route) => (
                            <SelectItem key={route.id} value={route.id}>
                              {route.sourceCity} to {route.destinationCity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.vehicleName} ({v.vehicleNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="busType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vessel Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select vessel type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AC_SLEEPER">
                            Speedboat (AC Sleeper)
                          </SelectItem>
                          <SelectItem value="NON_AC_SLEEPER">
                            Ferry (Non-AC)
                          </SelectItem>
                          <SelectItem value="AC_SEATER">
                            Speedboat (AC Seater)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* TIMING */}
              <TabsContent value="timing" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="departureTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departure Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="arrivalTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arrival Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Recurring Schedule
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Automatically repeat this schedule on selected days
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isRecurring ? (
                  <>
                    <FormField
                      control={form.control}
                      name="daysOfWeek"
                      render={() => (
                        <FormItem>
                          <FormLabel>Days of Week</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {DAY_LABELS.map((label, idx) => {
                              const active = selectedDays.includes(idx);
                              return (
                                <button
                                  type="button"
                                  key={idx}
                                  onClick={() => toggleDay(idx)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-full text-sm border transition",
                                    active
                                      ? "bg-sky-500 text-white border-sky-500"
                                      : "bg-background border-input hover:bg-accent"
                                  )}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedDays.length > 0 && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <p className="font-medium text-sm">
                          Day-Specific Timing (Optional)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Override default times for individual days.
                        </p>
                        {selectedDays.map((day) => {
                          const cfg = daySpecificTiming[day] || {};
                          return (
                            <div
                              key={day}
                              className="flex items-center gap-3 flex-wrap"
                            >
                              <div className="w-14 text-sm">
                                {DAY_LABELS[day]}
                              </div>
                              <Switch
                                checked={!!cfg.enabled}
                                onCheckedChange={(v) =>
                                  updateDayTiming(day, "enabled", v)
                                }
                              />
                              <Input
                                type="time"
                                disabled={!cfg.enabled}
                                value={
                                  cfg.departure ||
                                  form.getValues("departureTime")
                                }
                                onChange={(e) =>
                                  updateDayTiming(
                                    day,
                                    "departure",
                                    e.target.value
                                  )
                                }
                                className="w-32"
                              />
                              <Input
                                type="time"
                                disabled={!cfg.enabled}
                                value={
                                  cfg.arrival || form.getValues("arrivalTime")
                                }
                                onChange={(e) =>
                                  updateDayTiming(
                                    day,
                                    "arrival",
                                    e.target.value
                                  )
                                }
                                className="w-32"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="departureDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="recurrenceEndDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date (optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="departureDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departure Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="arrivalDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Arrival Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </TabsContent>

              {/* PRICING */}
              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="border rounded-lg p-4 space-y-4">
                  <div>
                    <h3 className="font-medium">Tiered Pricing</h3>
                    <p className="text-sm text-muted-foreground">
                      Set different prices for Local (Maldivian), Expat, and
                      Tourist passengers
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="priceLocalMvr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                            Local (MVR)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="50"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priceExpatMvr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                            Expat (MVR)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="60"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priceTouristUsd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                            Tourist (USD)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="10"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* AVAILABILITY */}
              <TabsContent value="availability" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="availableSeats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Seats</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="blockedSeats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blocked Seats (for crew/VIP)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        These seats won&apos;t be available for customer
                        bookings
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-sky-500 text-sky-500 hover:bg-sky-500/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-sky-500 text-white hover:bg-sky-600"
              >
                {loading ? "Creating..." : "Create Schedule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
