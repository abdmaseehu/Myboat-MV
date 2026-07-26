"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Loader2,
  Ship,
  User,
  Phone,
  MapPin,
  Calendar,
  Settings,
  Fuel,
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";
import api from "@/lib/axios";
import SelectAmenitiesDialog from "./select-amenities-dialog";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";

const vehicleSchema = z.object({
  vehicleName: z.string().min(2, "Vehicle name must be at least 2 characters"),
  vehicleNumber: z
    .string()
    .min(2, "Vehicle number must be at least 2 characters"),
  vehicleType: z.enum(["AC", "NON_AC"]),
  vehicleStatus: z.enum(["AVAILABLE", "MAINTENANCE", "OUT_OF_SERVICE"]),
  totalSeats: z.string().transform((val) => Number(val)),
  startDate: z.string().optional(),
  driverName: z.string().optional(),
  driverMobile: z.string().optional(),
  gearSystem: z.enum(["MANUAL", "AUTOMATIC", "SEMI_AUTOMATIC"]).optional(),
  amenities: z.array(z.string()).optional(),
  availableCity: z.string().optional(),
  fuelType: z
    .enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "CNG"])
    .optional(),
  layoutId: z.string().min(1, "Layout is required"),
  routeId: z.string().min(1, "Route is required"),
  vehicleImage: z.any().optional(),
});

export default function CreateVehicleForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [preview, setPreview] = useState(null);
  const [amenitiesDialogOpen, setAmenitiesDialogOpen] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const form = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicleName: "",
      vehicleNumber: "",
      vehicleType: "AC",
      vehicleStatus: "AVAILABLE",
      totalSeats: "",
      startDate: "",
      driverName: "",
      driverMobile: "",
      gearSystem: "MANUAL",
      amenities: [],
      availableCity: "",
      fuelType: "DIESEL",
      layoutId: "",
      routeId: "",
      vehicleImage: null,
    },
  });

  // Watch layoutId to update total seats
  const selectedLayoutId = form.watch("layoutId");

  // Update total seats when layout changes
  useEffect(() => {
    if (selectedLayoutId && layouts.length > 0) {
      const selectedLayout = layouts.find(
        (layout) => layout.id === selectedLayoutId
      );
      if (selectedLayout) {
        form.setValue("totalSeats", selectedLayout.totalSeats.toString());
      }
    }
  }, [selectedLayoutId, layouts, form]);

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

    fetchDropdownData();
  }, []);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();

      // Append basic fields
      Object.keys(data).forEach((key) => {
        if (key === "vehicleImage" && data[key]) {
          formData.append(key, data[key][0]);
        } else if (key !== "amenities") {
          formData.append(key, data[key]);
        }
      });

      // Format amenities data
      const formattedAmenities = selectedAmenities.map((amenity) => ({
        id: amenity.id,
        icon: amenity.icon,
        name: amenity.name,
      }));

      // Append formatted amenities
      formData.append("amenities", JSON.stringify(formattedAmenities));

      await api.post("/vehicles", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Vehicle created successfully");
      router.push("/admin/vehicles");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating vehicle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-5xl mx-auto border-none bg-gradient-to-b from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-900/50 shadow-xl shadow-zinc-200/30 dark:shadow-zinc-950/50">
      <CardHeader className="space-y-2 pb-8 border-b">
        <div className="space-y-2">
          <BreadcrumbNav
            items={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Vessels", href: "/admin/vehicles" },
              { label: "Create Vehicle" },
            ]}
            className="mb-2"
          />
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                Create New Vehicle
              </CardTitle>
              <CardDescription>
                Add a new vehicle to your fleet with complete details.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="gap-2 border-sky-500 text-sky-600 hover:bg-sky-50 hover:text-sky-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-sky-500">
                <Ship className="h-5 w-5" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <SelectTrigger className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500">
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
                          <SelectTrigger className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500">
                            <SelectValue placeholder="Select vehicle status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AVAILABLE">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="border-green-500 text-green-500"
                              >
                                Available
                              </Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="MAINTENANCE">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="border-sky-500 text-sky-500"
                              >
                                Maintenance
                              </Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="OUT_OF_SERVICE">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="border-red-500 text-red-500"
                              >
                                Out of Service
                              </Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Layout and Route */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-sky-500">
                <Settings className="h-5 w-5" />
                Layout and Route Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="layoutId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seat Layout</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500">
                            <SelectValue placeholder="Select seat layout" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingDropdowns ? (
                            <SelectItem value="loading" disabled>
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

                <FormField
                  control={form.control}
                  name="totalSeats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Seats</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Total seats from layout"
                          {...field}
                          disabled
                          className="bg-muted/50 dark:bg-muted/50 text-muted-foreground cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <SelectTrigger className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500">
                            <SelectValue placeholder="Select route" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingDropdowns ? (
                            <SelectItem value="loading" disabled>
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

                <FormField
                  control={form.control}
                  name="vehicleImage"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Vehicle Image</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => onChange(e.target.files)}
                            {...field}
                            className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500 file:bg-sky-500 file:text-white file:border-0 file:mr-2"
                          />
                          <ImageIcon className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Driver Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-sky-500">
                <User className="h-5 w-5" />
                Driver Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="driverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter driver name"
                          {...field}
                          className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driverMobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Mobile</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter driver mobile"
                            {...field}
                            className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500 pl-10"
                          />
                          <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Technical Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-sky-500">
                <Settings className="h-5 w-5" />
                Technical Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="gearSystem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gear System</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500">
                            <SelectValue placeholder="Select gear system" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MANUAL">Manual</SelectItem>
                          <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                          <SelectItem value="SEMI_AUTOMATIC">
                            Semi-Automatic
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fuelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500">
                            <SelectValue placeholder="Select fuel type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PETROL">
                            <div className="flex items-center gap-2">
                              <Fuel className="h-4 w-4" />
                              Petrol
                            </div>
                          </SelectItem>
                          <SelectItem value="DIESEL">
                            <div className="flex items-center gap-2">
                              <Fuel className="h-4 w-4" />
                              Diesel
                            </div>
                          </SelectItem>
                          <SelectItem value="ELECTRIC">
                            <div className="flex items-center gap-2">
                              <Fuel className="h-4 w-4" />
                              Electric
                            </div>
                          </SelectItem>
                          <SelectItem value="HYBRID">
                            <div className="flex items-center gap-2">
                              <Fuel className="h-4 w-4" />
                              Hybrid
                            </div>
                          </SelectItem>
                          <SelectItem value="CNG">
                            <div className="flex items-center gap-2">
                              <Fuel className="h-4 w-4" />
                              CNG
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="date"
                            {...field}
                            className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500 pl-10"
                          />
                          <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availableCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available City</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter available city"
                            {...field}
                            className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500 pl-10"
                          />
                          <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Amenities Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-sky-500">
                <Settings className="h-5 w-5" />
                Amenities
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Select the amenities available in this vehicle
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAmenitiesDialogOpen(true)}
                  className="border-sky-500 text-sky-500 hover:bg-sky-500/10"
                >
                  Select Amenities
                </Button>
              </div>

              {selectedAmenities.length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-white/50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  {selectedAmenities.map((amenity) => (
                    <Badge
                      key={amenity.id}
                      variant="secondary"
                      className="pl-2 pr-1 py-1 flex items-center gap-1 bg-sky-500/10 text-sky-500 hover:bg-sky-500/20"
                    >
                      <div className="relative h-4 w-4">
                        <img
                          src={`${process.env.NEXT_PUBLIC_ROOT_URL}${amenity.icon}`}
                          alt={amenity.name}
                          className="rounded object-cover"
                          width={16}
                          height={16}
                        />
                      </div>
                      {amenity.name}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => {
                          setSelectedAmenities(
                            selectedAmenities.filter((a) => a.id !== amenity.id)
                          );
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Submit and Cancel Buttons */}
            <div className="flex items-center gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/vehicles")}
                className="flex-1 border-sky-500 text-sky-500 hover:bg-sky-500/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || loadingDropdowns}
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Vehicle...
                  </>
                ) : (
                  "Create Vehicle"
                )}
              </Button>
            </div>
          </form>
        </Form>

        <SelectAmenitiesDialog
          open={amenitiesDialogOpen}
          onOpenChange={setAmenitiesDialogOpen}
          selectedAmenities={selectedAmenities}
          onSelect={setSelectedAmenities}
        />
      </CardContent>
    </Card>
  );
}
