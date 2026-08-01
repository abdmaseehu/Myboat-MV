"use client";

import { MapPin, Ship, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import createDynamicList from "@/components/common/create-dynamic-list";
import dynamic from "next/dynamic";

// Dynamically import delete component with SSR disabled
const DeleteBoardingPoint = dynamic(() => import("./delete-boarding-point"), {
  ssr: false,
});

// Get sequence color
const getSequenceColor = (sequence) => {
  if (sequence === 1) return "border-green-500 text-green-500";
  if (sequence === 2) return "border-blue-500 text-blue-500";
  return "border-sky-500 text-sky-500";
};

// Column definitions
const columns = [
  { key: "location", header: "Location" },
  { key: "route", header: "Route" },
  { key: "sequence", header: "Sequence" },
];

// Render row data based on column key
const renderRow = (point, columnKey) => {
  switch (columnKey) {
    case "location":
      return (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <p className="font-medium">{point.locationName}</p>
            <p className="text-sm text-muted-foreground">{point.address}</p>
          </div>
        </div>
      );
    case "route":
      return (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-blue-100 flex items-center justify-center">
            <Ship className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">
              {point.route?.sourceCity} to {point.route?.destinationCity}
            </p>
            <p className="text-sm text-muted-foreground">
              {point.route?.distance} km
            </p>
          </div>
        </div>
      );
    case "sequence":
      return (
        <Badge
          variant="outline"
          className={cn(
            "border shadow-sm",
            getSequenceColor(point.sequenceNumber)
          )}
        >
          Stop {point.sequenceNumber}
        </Badge>
      );
    default:
      return null;
  }
};

// Custom delete handler with confirmation modal
const customDeleteHandler = async (point, refreshData) => {
  // We'll return false to prevent the default delete behavior
  // and handle it with our custom DeleteBoardingPoint modal
  return false;
};

// Create a custom DeleteBoardingPoint wrapper that accepts 'item' prop
const DeleteBoardingPointWrapper = ({ item, ...props }) => {
  return <DeleteBoardingPoint point={item} {...props} />;
};

// Create the dynamic boarding point list component
const BoardingPointListFactory = createDynamicList({
  title: "Boarding Points",
  apiEndpoint: "/boarding-points",
  columns,
  renderRow,
  breadcrumbs: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Boarding Points", href: "/admin/boarding-points" },
  ],
  createConfig: {
    show: false, // Disable create functionality
  },
  EditMode: false,
  searchPlaceholder: "Search boarding points...",
});

export default BoardingPointListFactory;
