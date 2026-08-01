"use client";

import { Ship, Grid, Calendar, Armchair, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import createDynamicList from "@/components/common/create-dynamic-list";
import dynamic from "next/dynamic";

// Dynamically import delete component with SSR disabled
const EditBusLayout = dynamic(() => import("./edit-bus-layout"), {
  ssr: false,
});

const DeleteBusLayout = dynamic(() => import("./delete-bus-layout"), {
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

// Get vehicle names
const getVehicleNames = (vehicles) => {
  if (!vehicles || vehicles.length === 0) return "No vessels assigned";
  if (vehicles.length === 1)
    return `${vehicles[0].vehicleName} (${vehicles[0].vehicleNumber})`;
  return `${vehicles[0].vehicleName} (${vehicles[0].vehicleNumber}) +${
    vehicles.length - 1
  } more`;
};

// Column definitions
const columns = [
  { key: "layoutInfo", header: "Layout Info" },
  { key: "details", header: "Details" },
  { key: "vehicles", header: "Vessels" },
  { key: "created", header: "Created" },
];

// Determine vessel type from seat count (heuristic for legacy data)
const getVesselTypeLabel = (layout) => {
  const total = layout.totalSeats || 0;
  if (total <= 25) return "Speedboat";
  return "Ferry";
};

// Render row data based on column key
const renderRow = (layout, columnKey) => {
  switch (columnKey) {
    case "layoutInfo":
      return (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
            <Ship className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{layout.layoutName}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge
                variant="outline"
                className="border-blue-500 text-blue-500"
              >
                {getVesselTypeLabel(layout)}
              </Badge>
            </div>
          </div>
        </div>
      );
    case "details":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Grid className="h-4 w-4 text-blue-500" />
            <span>
              {layout.rowCount} × {layout.columnCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Armchair className="h-4 w-4 text-green-500" />
            <span className="text-sm">{layout.totalSeats} seats</span>
          </div>
        </div>
      );
    case "vehicles":
      return <div className="text-sm">{getVehicleNames(layout.vehicles)}</div>;
    case "created":
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span>{formatDate(layout.createdAt)}</span>
        </div>
      );
    default:
      return null;
  }
};

// Create a custom DeleteBusLayout wrapper that accepts 'item' prop
const DeleteBusLayoutWrapper = ({ item, ...props }) => {
  return <DeleteBusLayout layout={item} {...props} />;
};

// Create the dynamic seat layout list component
// EditBusLayout expects `layout` + `onOpenChange(bool)`; the list hands modals
// `item` + `onClose()`.
const EditBusLayoutWrapper = ({ item, onClose, ...props }) => {
  return (
    <EditBusLayout
      layout={item}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      {...props}
    />
  );
};

const BusLayoutListFactory = createDynamicList({
  title: "Seat Layouts",
  apiEndpoint: "/bus-layouts",
  columns,
  renderRow,
  breadcrumbs: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Seat Layouts", href: "/admin/bus-layouts" },
  ],
  // createConfig: {
  //   show: true,
  //   label: "Create New Layout",
  //   onClick: () => (window.location.href = "/admin/bus-layouts/create"),
  //   customButton: (
  //     <Button
  //       onClick={() => (window.location.href = "/admin/bus-layouts/create")}
  //       className="bg-sky-500 text-white hover:bg-sky-600"
  //     >
  //       <Plus className="h-4 w-4 mr-2" />
  //       Create New Layout
  //     </Button>
  //   ),
  // },
  EditModal: EditBusLayoutWrapper,
  DeleteModal: DeleteBusLayoutWrapper,
  // detailsPath: "/admin/bus-layouts/:id",
  searchPlaceholder: "Search layouts...",
  // deleteEndpoint: "/bus-layouts/:id",
  EditMode: true,
});

export default BusLayoutListFactory;
