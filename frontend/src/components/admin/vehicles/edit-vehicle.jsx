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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";

const vehicleSchema = z.object({
  vehicleName: z.string().min(1, "Vehicle name is required"),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  vehicleType: z.enum(["AC", "NON_AC"]),
  vehicleStatus: z.enum(["AVAILABLE", "MAINTENANCE", "OUT_OF_SERVICE"]),
  vehicleRating: z.string().transform(Number),
  layoutId: z.string().min(1, "Layout is required"),
  routeId: z.string().min(1, "Route is required"),
  vehicleImage: z.any().optional(),
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
        vehicleRating: vehicle.vehicleRating.toString(),
        layoutId: vehicle.layoutId,
        routeId: vehicle.routeId,
        vehicleImage: null,
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
      Object.keys(data).forEach((key) => {
        if (key === "vehicleImage" && data[key]) {
          formData.append(key, data[key][0]);
        } else {
          formData.append(key, data[key]);
        }
      });

      await api.put(`/vehicles/${vehicle.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Vehicle updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating vehicle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Vehicle Name */}
            <FormField
              control={form.control}
              name="vehicleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter vehicle name"
                      {...field}
                      className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vehicle Number */}
            <FormField
              control={form.control}
              name="vehicleNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter vehicle number"
                      {...field}
                      className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vehicle Type */}
            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500">
                        <SelectValue placeholder="Select vehicle type" />
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

            {/* Vehicle Status */}
            <FormField
              control={form.control}
              name="vehicleStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500">
                        <SelectValue placeholder="Select vehicle status" />
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

            {/* Vehicle Rating */}
            <FormField
              control={form.control}
              name="vehicleRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Rating</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-sky-500">
                        <SelectValue placeholder="Select vehicle rating" />
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

            {/* Vehicle Image */}
            <FormField
              control={form.control}
              name="vehicleImage"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Vehicle Image</FormLabel>
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || loadingDropdowns}
              className="w-full bg-sky-500 hover:bg-sky-600 text-black"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating Vehicle...
                </>
              ) : (
                "Update Vehicle"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
