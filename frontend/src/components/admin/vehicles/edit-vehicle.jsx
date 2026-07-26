"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";

const vehicleSchema = z.object({
  vehicleName: z.string().min(1, "Vessel name is required"),
  vehicleNumber: z.string().min(1, "Vessel number is required"),
  vehicleType: z.enum(["AC", "NON_AC"]),
  vehicleStatus: z.enum(["AVAILABLE", "MAINTENANCE", "OUT_OF_SERVICE"]),
  vehicleRating: z.string().transform(Number),
  layoutId: z.string().min(1, "Layout is required"),
  routeId: z.string().min(1, "Route is required"),
  vehicleImage: z.any().optional(),
  baseIsland: z.string().optional(),
  specLength: z.string().optional(),
  specEnginePower: z.string().optional(),
  specTopSpeed: z.string().optional(),
  specYearBuilt: z.string().optional(),
  description: z.string().optional(),
  termsConditions: z.string().optional(),
  seatSelectionEnabled: z.boolean().optional().default(true),
  cancellationPolicy: z.string().optional(),
});

export default function EditVehicle({ open, onClose, vehicle, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  const form = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicleName: vehicle?.vehicleName || "",
      vehicleNumber: vehicle?.vehicleNumber || "",
      vehicleType: vehicle?.vehicleType || "AC",
      vehicleStatus: vehicle?.vehicleStatus || "AVAILABLE",
      vehicleRating: vehicle?.vehicleRating?.toString() || "5",
      layoutId: vehicle?.layoutId || "",
      routeId: vehicle?.routeId || "",
      vehicleImage: null,
      baseIsland: vehicle?.baseIsland || "",
      specLength: vehicle?.specification?.length?.toString() || "",
      specEnginePower: vehicle?.specification?.enginePower?.toString() || "",
      specTopSpeed: vehicle?.specification?.topSpeed?.toString() || "",
      specYearBuilt: vehicle?.specification?.yearBuilt?.toString() || "",
      description: vehicle?.specification?.description || "",
      termsConditions: vehicle?.termsConditions || "",
      seatSelectionEnabled: vehicle?.seatSelectionEnabled !== false,
      cancellationPolicy: vehicle?.cancellationPolicy || "",
    },
  });

  // Reset form when vehicle changes
  useEffect(() => {
    if (vehicle) {
      form.reset({
        vehicleName: vehicle.vehicleName,
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        vehicleStatus: vehicle.vehicleStatus,
        vehicleRating: vehicle.vehicleRating?.toString() ?? "5",
        layoutId: vehicle.layoutId,
        routeId: vehicle.routeId,
        vehicleImage: null,
        baseIsland: vehicle.baseIsland || "",
        specLength: vehicle.specification?.length?.toString() || "",
        specEnginePower: vehicle.specification?.enginePower?.toString() || "",
        specTopSpeed: vehicle.specification?.topSpeed?.toString() || "",
        specYearBuilt: vehicle.specification?.yearBuilt?.toString() || "",
        description: vehicle.specification?.description || "",
        termsConditions: vehicle.termsConditions || "",
        seatSelectionEnabled: vehicle.seatSelectionEnabled !== false,
        cancellationPolicy: vehicle.cancellationPolicy || "",
      });
    }
  }, [vehicle, form]);

  // Fetch routes and layouts for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const [routesResponse, layoutsResponse] = await Promise.all([
          api.get("/vehicles/routes/list"),
          api.get("/vehicles/layouts/list"),
        ]);
        setRoutes(routesResponse.data.data);
        setLayouts(layoutsResponse.data.data);
      } catch (error) {
        toast.error("Error loading dropdown data");
      } finally {
        setLoadingDropdowns(false);
      }
    };

    if (open) {
      fetchDropdownData();
    }
  }, [open]);

  const onSubmit = async (data) => {
    if (!vehicle?.id) return;

    try {
      setLoading(true);
      const formData = new FormData();

      const specification = {};
      if (data.specLength) specification.length = data.specLength;
      if (data.specEnginePower) specification.enginePower = data.specEnginePower;
      if (data.specTopSpeed) specification.topSpeed = data.specTopSpeed;
      if (data.specYearBuilt) specification.yearBuilt = data.specYearBuilt;
      if (data.description) specification.description = data.description;

      const skipKeys = new Set([
        "specLength",
        "specEnginePower",
        "specTopSpeed",
        "specYearBuilt",
        "description",
      ]);

      Object.keys(data).forEach((key) => {
        if (skipKeys.has(key)) return;
        if (key === "vehicleImage" && data[key]) {
          formData.append(key, data[key][0]);
        } else if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
          formData.append(key, data[key]);
        }
      });

      formData.append("specification", JSON.stringify(specification));

      await api.put(`/vehicles/${vehicle.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Vessel updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating vessel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Vessel</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Vessel Name */}
            <FormField
              control={form.control}
              name="vehicleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vessel Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter vessel name"
                      {...field}
                      className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vessel Number */}
            <FormField
              control={form.control}
              name="vehicleNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vessel Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter vessel number"
                      {...field}
                      className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vessel Type */}
            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vessel Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500">
                        <SelectValue placeholder="Select vessel type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AC">AC</SelectItem>
                      <SelectItem value="NON_AC">NON AC</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vessel Status */}
            <FormField
              control={form.control}
              name="vehicleStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vessel Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500">
                        <SelectValue placeholder="Select vessel status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="OUT_OF_SERVICE">
                        Out of Service
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vessel Rating */}
            <FormField
              control={form.control}
              name="vehicleRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vessel Rating</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500">
                        <SelectValue placeholder="Select vessel rating" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <SelectItem key={rating} value={rating.toString()}>
                          {rating} Star{rating > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Layout */}
            <FormField
              control={form.control}
              name="layoutId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seat Layout</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500">
                        <SelectValue placeholder="Select seat layout" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingDropdowns ? (
                        <SelectItem value="" disabled>
                          Loading layouts...
                        </SelectItem>
                      ) : (
                        layouts.map((layout) => (
                          <SelectItem key={layout.id} value={layout.id}>
                            {layout.layoutName} ({layout.totalSeats} seats)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Route */}
            <FormField
              control={form.control}
              name="routeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Route</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500">
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingDropdowns ? (
                        <SelectItem value="" disabled>
                          Loading routes...
                        </SelectItem>
                      ) : (
                        routes.map((route) => (
                          <SelectItem key={route.id} value={route.id}>
                            {route.sourceCity} - {route.destinationCity}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vessel Image */}
            <FormField
              control={form.control}
              name="vehicleImage"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Vessel Image</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onChange(e.target.files)}
                      {...field}
                      className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Base Location */}
            <FormField
              control={form.control}
              name="baseIsland"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Dhangethi"
                      {...field}
                      className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vessel Specification */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="specLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (m)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 12.5"
                        {...field}
                        className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specEnginePower"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Engine Power (HP)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 300"
                        {...field}
                        className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specTopSpeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Top Speed (knots)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 25"
                        {...field}
                        className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specYearBuilt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Built</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 2020"
                        {...field}
                        className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Describe the vessel"
                      {...field}
                      className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termsConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Enter terms and conditions"
                      {...field}
                      className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cancellationPolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation Policy</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Enter cancellation policy"
                      {...field}
                      className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seatSelectionEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-sky-200 dark:border-sky-800 p-4 bg-sky-50/50 dark:bg-sky-900/10">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable Seat Selection
                    </FormLabel>
                    <FormDescription>
                      When ON, customers pick specific seats. When OFF, customers
                      only enter a passenger count — best for speedboats without
                      assigned seating.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-sky-500"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || loadingDropdowns}
              className="w-full bg-sky-500 hover:bg-sky-600 text-black"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating Vessel...
                </>
              ) : (
                "Update Vessel"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
