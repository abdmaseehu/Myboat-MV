"use client";

import { Ship, Calendar, Tag, Eye, Settings, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import createDynamicList from "@/components/common/create-dynamic-list";
import dynamic from "next/dynamic";

// Dynamically import components with SSR disabled
const DeleteVehicle = dynamic(() => import("./delete-vehicle"), {
  ssr: false,
});

// Format date
const formatDate = (date) => {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return date;
  }
};

// Get status color
const getStatusColor = (status) => {
  switch (status) {
    case "AVAILABLE":
      return "border-green-500 text-green-500";
    case "UNAVAILABLE":
      return "border-red-500 text-red-500";
    case "MAINTENANCE":
      return "border-sky-500 text-sky-500";
    default:
      return "border-zinc-500 text-zinc-500";
  }
};

// Format amenities
const formatAmenities = (amenities) => {
  if (!amenities?.ids?.[0]) return "No amenities";

  try {
    // Parse the JSON string to get the amenities array
    const parsedAmenities = JSON.parse(amenities.ids[0]);

    if (!Array.isArray(parsedAmenities) || parsedAmenities.length === 0) {
      return "No amenities";
    }

    if (parsedAmenities.length === 1) {
      return parsedAmenities[0].name;
    }

    return `${parsedAmenities[0].name} +${parsedAmenities.length - 1} more`;
  } catch (error) {
    // If the amenities are stored as plain IDs (old format)
    if (Array.isArray(amenities.ids)) {
      return `${amenities.ids.length} amenities`;
    }
    return "No amenities";
  }
};

// Column definitions
const columns = [
  { key: "vehicleInfo", header: "Vehicle Info" },
  { key: "details", header: "Details" },
  { key: "amenities", header: "Amenities" },
  { key: "status", header: "Status" },
  { key: "created", header: "Created" },
];

// Render row data based on column key
const renderRow = (vehicle, columnKey) => {
  switch (columnKey) {
    case "vehicleInfo":
      return (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center">
            <Ship className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <p className="font-medium">{vehicle.vehicleName}</p>
            <p className="text-sm text-muted-foreground">
              {vehicle.vehicleNumber}
            </p>
          </div>
        </div>
      );
    case "details":
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-sky-500" />
            <span>
              {vehicle.vehicleType} {vehicle.gearSystem}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-sky-500" />
            <span className="text-sm">
              {vehicle.layout?.layoutName} ({vehicle.totalSeats} seats)
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{vehicle.availableCity || "No location set"}</span>
          </div>
        </div>
      );
    case "amenities":
      return (
        <div className="flex flex-wrap gap-1">
          {formatAmenities(vehicle.amenities)}
        </div>
      );
    case "status":
      return (
        <Badge
          variant="outline"
          className={cn(
            "border shadow-sm",
            getStatusColor(vehicle.vehicleStatus)
          )}
        >
          {vehicle.vehicleStatus}
        </Badge>
      );
    case "created":
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-sky-500" />
          <span>{formatDate(vehicle.createdAt)}</span>
        </div>
      );
    default:
      return null;
  }
};

// Create a custom DeleteVehicle wrapper that accepts 'item' prop
const DeleteVehicleWrapper = ({ item, ...props }) => {
  return <DeleteVehicle vehicle={item} {...props} />;
};

// Create the dynamic vehicle list component
const VehicleListFactory = createDynamicList({
  title: "Vessels",
  apiEndpoint: "/vehicles",
  columns,
  renderRow,
  breadcrumbs: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Vessels", href: "/admin/vehicles" },
  ],
  createConfig: {
    show: true,
    label: "Add New Vessel",
    href: "/admin/vehicles/create",
  },
  DeleteModal: DeleteVehicleWrapper,
  searchPlaceholder: "Search vehicles...",
  deleteEndpoint: "/vehicles/:id",
  EditMode: false,
});

export default VehicleListFactory;
