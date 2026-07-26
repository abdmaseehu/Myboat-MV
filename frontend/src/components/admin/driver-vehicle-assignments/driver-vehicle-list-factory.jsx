"use client";

import { Ship, User, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import createDynamicList from "@/components/common/create-dynamic-list";
import CreateDriverVehicleAssignment from "./create-driver-vehicle-assignment";
import EditDriverVehicleAssignment from "./edit-driver-vehicle-assignment";
import DeleteDriverVehicleAssignment from "./delete-driver-vehicle-assignment";

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

// Format time
const formatTime = (time) => {
  if (!time) return "N/A";
  try {
    return new Date(time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    return time;
  }
};

// Get status color
const getStatusColor = (status) => {
  switch (status) {
    case "ACTIVE":
      return "border-green-500 text-green-500";
    case "INACTIVE":
      return "border-red-500 text-red-500";
    case "COMPLETED":
      return "border-blue-500 text-blue-500";
    default:
      return "border-sky-500 text-sky-500";
  }
};

// Column definitions
const columns = [
  { key: "driver", header: "Driver" },
  { key: "vehicle", header: "Vehicle" },
  { key: "period", header: "Assignment Period" },
  { key: "status", header: "Status" },
];

// Render row data based on column key
const renderRow = (assignment, columnKey) => {
  switch (columnKey) {
    case "driver":
      return (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center">
            <User className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <p className="font-medium">{assignment.driver.name}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{assignment.driver.phone}</span>
              <span>•</span>
              <span>{assignment.driver.licenseNumber}</span>
            </div>
          </div>
        </div>
      );

    case "vehicle":
      return (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
            <Ship className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{assignment.vehicle.vehicleName}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{assignment.vehicle.vehicleNumber}</span>
              <span>•</span>
              <Badge
                variant="outline"
                className="border-blue-500 text-blue-500"
              >
                {assignment.vehicle.vehicleType}
              </Badge>
            </div>
          </div>
        </div>
      );

    case "period":
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-sky-500" />
            <span>From: {formatDate(assignment.assignedFrom)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-sky-500" />
            <span>To: {formatDate(assignment.assignedTo)}</span>
          </div>
        </div>
      );

    case "status":
      return (
        <Badge
          variant="outline"
          className={cn("border shadow-sm", getStatusColor(assignment.status))}
        >
          {assignment.status}
        </Badge>
      );

    default:
      return null;
  }
};

// Custom delete handler with confirmation modal
const customDeleteHandler = async (assignment, refreshData) => {
  // We'll return false to prevent the default delete behavior
  // and handle it with our custom DeleteDriverVehicleAssignment modal
  return false;
};

// Create a custom EditDriverVehicleAssignment wrapper that accepts 'item' prop
const EditDriverVehicleAssignmentWrapper = ({ item, ...props }) => {
  return <EditDriverVehicleAssignment assignment={item} {...props} />;
};

// Create a custom DeleteDriverVehicleAssignment wrapper that accepts 'item' prop
const DeleteDriverVehicleAssignmentWrapper = ({ item, ...props }) => {
  return <DeleteDriverVehicleAssignment assignment={item} {...props} />;
};

// Create the dynamic driver-vehicle assignment list component
const DriverVehicleListFactory = createDynamicList({
  title: "Driver Vehicle Assignments",
  apiEndpoint: "/driver-vehicle-assigned",
  columns,
  renderRow,
  breadcrumbs: [
    { label: "Dashboard", href: "/admin/dashboard" },
    {
      label: "Driver Vehicle Assignments",
      href: "/admin/driver-vehicle-assignments",
    },
  ],
  createConfig: {
    show: true,
    label: "Create Assignment",
  },
  CreateModal: CreateDriverVehicleAssignment,
  EditModal: EditDriverVehicleAssignmentWrapper,
  DeleteModal: DeleteDriverVehicleAssignmentWrapper,
  searchPlaceholder: "Search assignments...",
  deleteEndpoint: "/driver-vehicle-assigned/:id",
});

export default DriverVehicleListFactory;
