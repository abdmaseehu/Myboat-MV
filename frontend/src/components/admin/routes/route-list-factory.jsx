"use client";

import { MapPin, Navigation, Calendar, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import createDynamicList from "@/components/common/create-dynamic-list";
import CreateRoute from "./create-route";
import EditRoute from "./edit-route";
import DeleteRoute from "./delete-route";
import api from "@/lib/axios";

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format distance
const formatDistance = (distance) => {
  return `${distance} km`;
};

// Column definitions
const columns = [
  { key: "source", header: "Source City" },
  { key: "destination", header: "Destination City" },
  { key: "distance", header: "Distance" },
  { key: "boardingPoints", header: "Boarding Points" },
  { key: "status", header: "Status" },
];

// Render row data based on column key
const renderRow = (route, columnKey) => {
  switch (columnKey) {
    case "source":
      return (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-blue-600 shadow-lg flex items-center justify-center">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium">{route.sourceCity}</p>
          </div>
        </div>
      );
    case "destination":
      return (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-green-500 to-green-600 shadow-lg flex items-center justify-center">
            <Navigation className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium">{route.destinationCity}</p>
          </div>
        </div>
      );
    case "distance":
      return (
        <div className="font-medium">{formatDistance(route.distance)}</div>
      );
    case "boardingPoints":
      return (
        <div className="flex flex-wrap gap-1">
          {route.boardingPoints.slice(0, 3).map((point, index) => (
            <Badge
              key={index}
              variant="outline"
              className="border-zinc-200 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {point.locationName}
            </Badge>
          ))}
          {route.boardingPoints.length > 3 && (
            <Badge
              variant="outline"
              className="border-zinc-200 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              +{route.boardingPoints.length - 3} more
            </Badge>
          )}
        </div>
      );
    case "status":
      return (
        <Badge
          variant="outline"
          className={cn(
            "border shadow-sm",
            route.isActive
              ? "border-green-500 text-green-500"
              : "border-red-500 text-red-500"
          )}
        >
          {route.isActive ? "Active" : "Inactive"}
        </Badge>
      );
    default:
      return null;
  }
};

// Custom delete handler
const customDeleteHandler = async (route, refreshData) => {
  try {
    // Show the delete confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the route from ${route.sourceCity} to ${route.destinationCity}?`
    );

    if (!confirmed) {
      return false;
    }

    await api.delete(`/routes/${route.id}`);
    toast.success("Route deleted successfully");
    refreshData();
    return true;
  } catch (error) {
    toast.error(error.response?.data?.message || "Error deleting route");
    return false;
  }
};

// Create a custom EditRoute wrapper that accepts 'item' prop instead of 'route'
const EditRouteWrapper = ({ item, ...props }) => {
  return <EditRoute route={item} {...props} />;
};

// Create the dynamic route list component
const RouteListFactory = createDynamicList({
  title: "Routes",
  apiEndpoint: "/routes",
  columns,
  renderRow,
  breadcrumbs: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Routes", href: "/admin/routes" },
  ],
  createConfig: {
    show: true,
    label: "Create New Route",
  },
  CreateModal: CreateRoute,
  EditModal: EditRouteWrapper,

  searchPlaceholder: "Search routes...",
  deleteEndpoint: "/routes/:id",
});

export default RouteListFactory;
