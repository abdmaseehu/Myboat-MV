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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  ChevronDown,
  X,
  FileText,
} from "lucide-react";
import api from "@/lib/axios";
import SelectAmenitiesDialog from "./select-amenities-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import VesselServicesFields from "./vessel-services-fields";

const vehicleSchema = z.object({
  vehicleName: z.string().min(2, "Vessel name must be at least 2 characters"),
  vehicleNumber: z
    .string()
    .min(2, "Vessel number must be at least 2 characters"),
  vehicleType: z.enum(["AC", "NON_AC"]),
  vehicleStatus: z.enum(["AVAILABLE", "BOOKED", "MAINTENANCE", "INACTIVE"]),
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
  // Vessel-specific fields
  baseIsland: z.string().optional(),
  specLength: z.string().optional(),
  specEnginePower: z.string().optional(),
  specTopSpeed: z.string().optional(),
  specYearBuilt: z.string().optional(),
  description: z.string().optional(),
  termsConditions: z.string().optional(),
  seatSelectionEnabled: z.boolean().optional().default(true),
  maxSeatsPerBooking: z.coerce.number().int().positive().nullable().optional(),
  cancellationPolicy: z.string().optional(),
});

const MAX_IMAGES = 5;

export default function CreateVehicleForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [preview, setPreview] = useState(null);
  const [amenitiesDialogOpen, setAmenitiesDialogOpen] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  // Service configuration lives outside react-hook-form: these are nested
  // arrays that are simpler to manage directly and serialise on submit.
  const [serviceTypes, setServiceTypes] = useState(["FERRY"]);
  const [charterPricingMode, setCharterPricingMode] = useState("QUOTE");
  const [charterInstantBooking, setCharterInstantBooking] = useState(false);
  const [charterRates, setCharterRates] = useState([]);
  const [capacityTons, setCapacityTons] = useState("");
  const [cargoTypes, setCargoTypes] = useState([]);
  const [logisticsRates, setLogisticsRates] = useState([]);
  const [specOpen, setSpecOpen] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Object URLs must be revoked or they leak for the page's lifetime.
  useEffect(() => {
    return () => imagePreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [imagePreviews]);

  const handleImagesSelected = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-picking the same file after a remove
    if (!picked.length) return;

    const room = MAX_IMAGES - imageFiles.length;
    if (room <= 0) {
      toast.error(`You can upload up to ${MAX_IMAGES} photos`);
      return;
    }
    if (picked.length > room) {
      toast.info(`Only ${room} more photo${room === 1 ? "" : "s"} added`);
    }

    const accepted = picked.slice(0, room);
    setImageFiles((prev) => [...prev, ...accepted]);
    setImagePreviews((prev) => [
      ...prev,
      ...accepted.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

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
      baseIsland: "",
      specLength: "",
      specEnginePower: "",
      specTopSpeed: "",
      specYearBuilt: "",
      description: "",
      termsConditions: "",
      seatSelectionEnabled: true,
      maxSeatsPerBooking: null,
      cancellationPolicy: "",
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

      // Build the specification JSON blob from spec* fields + description
      const specification = {};
      if (data.specLength) specification.length = data.specLength;
      if (data.specEnginePower) specification.enginePower = data.specEnginePower;
      if (data.specTopSpeed) specification.topSpeed = data.specTopSpeed;
      if (data.specYearBuilt) specification.yearBuilt = data.specYearBuilt;
      if (data.description) specification.description = data.description;

      // Fields to exclude from direct FormData iteration
      const skipKeys = new Set([
        "amenities",
        "vehicleImage",
        "specLength",
        "specEnginePower",
        "specTopSpeed",
        "specYearBuilt",
        "description",
      ]);

      Object.keys(data).forEach((key) => {
        if (skipKeys.has(key)) return;
        if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
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

      // Service config + rate tables. Sent even when empty so the API can
      // clear a table the operator emptied.
      formData.append("serviceTypes", JSON.stringify(serviceTypes));
      formData.append("charterPricingMode", charterPricingMode);
      formData.append("charterInstantBooking", String(charterInstantBooking));
      formData.append(
        "charterRates",
        JSON.stringify(serviceTypes.includes("PRIVATE_CHARTER") ? charterRates : [])
      );
      if (capacityTons !== "") formData.append("capacityTons", capacityTons);
      formData.append("cargoTypes", JSON.stringify(cargoTypes));
      formData.append(
        "logisticsRates",
        JSON.stringify(serviceTypes.includes("LOGISTICS") ? logisticsRates : [])
      );

      // Append specification as JSON string
      formData.append("specification", JSON.stringify(specification));

      // Gallery photos (backend accepts up to 5 on the `vesselImages` field)
      imageFiles.forEach((file) => formData.append("vesselImages", file));

      await api.post("/vehicles", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Vessel created successfully");
      router.push("/admin/vehicles");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating vessel");
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
              { label: "Create Vessel" },
            ]}
            className="mb-2"
          />
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                Create New Vessel
              </CardTitle>
              <CardDescription>
                Add a new vessel to your fleet with complete details.
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
                      <FormLabel>Vessel Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter vessel name"
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
                      <FormLabel>Vessel Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter vessel number"
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
                      <FormLabel>Vessel Type</FormLabel>
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
                      <FormLabel>Vessel Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500">
                            <SelectValue placeholder="Select vessel status" />
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
                          <SelectItem value="BOOKED">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="border-amber-500 text-amber-500"
                              >
                                Booked
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
                          <SelectItem value="INACTIVE">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="border-red-500 text-red-500"
                              >
                                Inactive
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
                  name="maxSeatsPerBooking"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Seats Per Booking</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="No limit"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? null : Number(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Leave blank for no limit — customers can then book as many
                        seats as the departure still has free.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seatSelectionEnabled"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2 flex flex-row items-center justify-between rounded-lg border border-sky-200 dark:border-sky-800 p-4 bg-sky-50/50 dark:bg-sky-900/10">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Enable Seat Selection
                        </FormLabel>
                        <FormDescription>
                          When ON, customers pick specific seats from the layout.
                          When OFF, customers only enter a passenger count — best for
                          speedboats or small ferries without assigned seating.
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

                <FormItem className="md:col-span-2">
                  <FormLabel>
                    Vessel Photos
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      up to {MAX_IMAGES} — the first is used as the cover
                    </span>
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-3">
                        {imagePreviews.map((src, i) => (
                          <div
                            key={src}
                            className="relative h-24 w-32 rounded-xl overflow-hidden border border-border group"
                          >
                            <img
                              src={src}
                              alt={`Vessel photo ${i + 1}`}
                              className="h-full w-full object-cover"
                            />
                            {i === 0 && (
                              <span className="absolute top-1 left-1 rounded-full bg-lagoon px-2 py-0.5 text-[10px] font-medium text-white">
                                Cover
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              aria-label={`Remove photo ${i + 1}`}
                              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}

                        {imageFiles.length < MAX_IMAGES && (
                          <label className="h-24 w-32 rounded-xl border-2 border-dashed border-border hover:border-lagoon cursor-pointer flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-lagoon transition-colors">
                            <ImageIcon className="h-5 w-5" />
                            <span className="text-xs">Add photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="sr-only"
                              onChange={handleImagesSelected}
                            />
                          </label>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {imageFiles.length}/{MAX_IMAGES} selected. JPG or PNG.
                      </p>
                    </div>
                  </FormControl>
                </FormItem>
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

            {/* Vessel Location & Specification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-sky-500">
                <MapPin className="h-5 w-5" />
                Vessel Location
              </h3>
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
                        className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <Collapsible open={specOpen} onOpenChange={setSpecOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border border-dashed border-sky-300 dark:border-sky-800 p-3 text-left hover:bg-sky-50 dark:hover:bg-sky-950/20"
                  >
                    <span className="text-lg font-semibold flex items-center gap-2 text-sky-500">
                      <Ship className="h-5 w-5" />
                      Vessel Specification
                      <span className="text-xs font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${specOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500"
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
                              className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500"
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
                              className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500"
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
                              className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Description, T&C, Cancellation Policy */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-sky-500">
                <FileText className="h-5 w-5" />
                Details & Policies
              </h3>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Describe the vessel, its features, and any special notes"
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
                name="termsConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Enter terms and conditions for this vessel"
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
                name="cancellationPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cancellation Policy</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Enter cancellation policy for this vessel"
                        {...field}
                        className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-sky-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Amenities Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-sky-500">
                <Settings className="h-5 w-5" />
                Amenities
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Select the amenities available in this vessel
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

            <VesselServicesFields
              serviceTypes={serviceTypes}
              onServiceTypesChange={setServiceTypes}
              charterPricingMode={charterPricingMode}
              onCharterPricingModeChange={setCharterPricingMode}
              charterInstantBooking={charterInstantBooking}
              onCharterInstantBookingChange={setCharterInstantBooking}
              charterRates={charterRates}
              onCharterRatesChange={setCharterRates}
              capacityTons={capacityTons}
              onCapacityTonsChange={setCapacityTons}
              cargoTypes={cargoTypes}
              onCargoTypesChange={setCargoTypes}
              logisticsRates={logisticsRates}
              onLogisticsRatesChange={setLogisticsRates}
              disabled={loading}
            />

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
                    Creating Vessel...
                  </>
                ) : (
                  "Create Vessel"
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
