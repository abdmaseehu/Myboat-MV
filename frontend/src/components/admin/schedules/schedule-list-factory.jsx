"use client";

import { Ship, Calendar, Clock, Users2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import createDynamicList from "@/components/common/create-dynamic-list";
import CreateSchedule from "./create-schedule";
import EditSchedule from "./edit-schedule";
import DeleteSchedule from "./delete-schedule";
import api from "@/lib/axios";

// Format time
const formatTime = (time) => {
  if (!time) return "N/A";

  try {
    // If it's an ISO string, extract the time part
    if (time.includes("T")) {
      const date = new Date(time);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    // If it's already a time string
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    return time; // Return as is if parsing fails
  }
};

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
    return date; // Return as is if parsing fails
  }
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Column definitions
const columns = [
  { key: "route", header: "Route" },
  { key: "vehicle", header: "Vehicle" },
  { key: "departure", header: "Departure" },
  { key: "arrival", header: "Arrival" },
  { key: "recurrence", header: "Recurrence" },
  { key: "pricing", header: "Pricing" },
  { key: "seats", header: "Seats" },
  { key: "status", header: "Status" },
];

// Render row data based on column key
const renderRow = (schedule, columnKey) => {
  switch (columnKey) {
    case "route":
      return (
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-sky-500" />
          {schedule.route.sourceCity} to {schedule.route.destinationCity}
        </div>
      );
    case "vehicle":
      return schedule.vehicles && schedule.vehicles[0] ? (
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-sky-500" />
          {schedule.vehicles[0].vehicleName} (
          {schedule.vehicles[0].vehicleNumber})
        </div>
      ) : (
        "Not assigned"
      );
    case "departure":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-sky-500" />
            {formatDate(schedule.departureDate)}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-sky-500" />
            {formatTime(schedule.departureTime)}
          </div>
        </div>
      );
    case "arrival":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-sky-500" />
            {formatDate(schedule.arrivalDate)}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-sky-500" />
            {formatTime(schedule.arrivalTime)}
          </div>
        </div>
      );
    case "recurrence":
      if (!schedule.isRecurring) {
        return <span className="text-xs text-muted-foreground">One-time</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {(schedule.daysOfWeek || []).map((d) => (
            <Badge
              key={d}
              variant="outline"
              className="text-xs bg-sky-50 dark:bg-sky-900/20 border-sky-200 text-sky-700"
            >
              {DAY_LABELS[d]}
            </Badge>
          ))}
        </div>
      );
    case "pricing":
      return (
        <div className="flex flex-col gap-0.5 text-xs">
          {schedule.priceLocalMvr != null && (
            <span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1" />
              MVR {Number(schedule.priceLocalMvr).toFixed(2)}
            </span>
          )}
          {schedule.priceExpatMvr != null && (
            <span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 mr-1" />
              MVR {Number(schedule.priceExpatMvr).toFixed(2)}
            </span>
          )}
          {schedule.priceTouristUsd != null && (
            <span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500 mr-1" />
              USD {Number(schedule.priceTouristUsd).toFixed(2)}
            </span>
          )}
          {schedule.priceLocalMvr == null &&
            schedule.priceExpatMvr == null &&
            schedule.priceTouristUsd == null && (
              <span className="text-muted-foreground">Not set</span>
            )}
        </div>
      );
    case "seats":
      return (
        <div className="flex flex-col gap-0.5 text-xs">
          <div className="flex items-center gap-2">
            <Users2 className="h-3.5 w-3.5 text-sky-500" />
            Available: {schedule.availableSeats}
          </div>
          {schedule.blockedSeats > 0 && (
            <div className="text-muted-foreground">
              Blocked: {schedule.blockedSeats}
            </div>
          )}
        </div>
      );
    case "status":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-transparent border shadow-sm",
            schedule.status === "ACTIVE"
              ? "border-green-500 text-green-500"
              : schedule.status === "CANCELLED"
              ? "border-red-500 text-red-500"
              : "border-sky-500 text-sky-500"
          )}
        >
          {schedule.status}
        </Badge>
      );
    default:
      return null;
  }
};

// Custom delete handler with confirmation modal
const customDeleteHandler = async (schedule, refreshData) => {
  // We'll return false to prevent the default delete behavior
  // and handle it with our custom DeleteSchedule modal
  return false;
};

// Create a custom EditSchedule wrapper that accepts 'item' prop instead of 'schedule'
const EditScheduleWrapper = ({ item, ...props }) => {
  return <EditSchedule schedule={item} {...props} />;
};

// Create the dynamic schedule list component
const ScheduleListFactory = createDynamicList({
  title: "Trip Schedules",
  apiEndpoint: "/bus-schedules",
  columns,
  renderRow,
  breadcrumbs: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Trip Schedules", href: "/admin/schedules" },
  ],
  createConfig: {
    show: true,
    label: "Create New Schedule",
  },
  CreateModal: CreateSchedule,
  EditModal: EditScheduleWrapper,
  // detailsPath: "/admin/schedules/:id",
  // customActions: [
  //   {
  //     label: "View Details",
  //     icon: <Eye className="h-4 w-4" />,
  //     onClick: (schedule) =>
  //       (window.location.href = `/admin/schedules/${schedule.id}`),
  //     className:
  //       "text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer",
  //   },
  // ],
  EditMode: true,
  searchPlaceholder: "Search schedules...",
  deleteEndpoint: "/schedules/:id",
});

export default ScheduleListFactory;
