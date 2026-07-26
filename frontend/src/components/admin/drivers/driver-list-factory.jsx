"use client";

import {
  User,
  Phone,
  Mail,
  Calendar,
  Eye,
  UserCog,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import createDynamicList from "@/components/common/create-dynamic-list";
import dynamic from "next/dynamic";
import api from "@/lib/axios";

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
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "border-green-500 text-green-500";
    case "INACTIVE":
      return "border-red-500 text-red-500";
    case "PENDING":
      return "border-sky-500 text-sky-500";
    default:
      return "border-zinc-500 text-zinc-500";
  }
};

// Dynamically import components with SSR disabled
const CreateDriver = dynamic(() => import("./create-driver"), { ssr: false });
const EditDriver = dynamic(() => import("./edit-driver"), { ssr: false });
const DeleteDriver = dynamic(() => import("./delete-driver"), { ssr: false });

// Column definitions
const columns = [
  { key: "driverInfo", header: "Driver Info" },
  { key: "contact", header: "Contact" },
  { key: "license", header: "License" },
  { key: "status", header: "Status" },
  { key: "created", header: "Created" },
];

// Render row data based on column key
const renderRow = (driver, columnKey) => {
  switch (columnKey) {
    case "driverInfo":
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={
                driver.driverPhoto
                  ? `${process.env.NEXT_PUBLIC_ROOT_URL}${driver.driverPhoto}`
                  : null
              }
              alt={driver.name}
            />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{driver.name}</p>
            <p className="text-sm text-muted-foreground">{driver.email}</p>
          </div>
        </div>
      );
    case "contact":
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-sky-500" />
            <span className="text-sm">{driver.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-sky-500" />
            <span className="text-sm truncate max-w-[200px]">
              {driver.address}
            </span>
          </div>
        </div>
      );
    case "license":
      return (
        <div className="space-y-1">
          <p className="font-medium">{driver.licenseNumber}</p>
          <p className="text-sm text-muted-foreground">
            Expires: {formatDate(driver.licenseExpiryDate)}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-zinc-200">
              {driver.totalTravel} trips
            </Badge>
          </div>
        </div>
      );
    case "status":
      return (
        <div className="space-y-2">
          <Badge
            variant="outline"
            className={cn("border shadow-sm", getStatusColor(driver.status))}
          >
            {driver.status}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "border shadow-sm",
              driver.drivingStatus === "AVAILABLE"
                ? "border-green-500 text-green-500"
                : "border-red-500 text-red-500"
            )}
          >
            {driver.drivingStatus}
          </Badge>
        </div>
      );
    case "created":
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-sky-500" />
          <span>{formatDate(driver.createdAt)}</span>
        </div>
      );
    default:
      return null;
  }
};

// Custom delete handler with confirmation modal
const customDeleteHandler = async (driver, refreshData) => {
  // We'll return false to prevent the default delete behavior
  // and handle it with our custom DeleteDriver modal
  return false;
};

// Create a custom EditDriver wrapper that accepts 'item' prop instead of 'driver'
const EditDriverWrapper = ({ item, ...props }) => {
  return <EditDriver driver={item} {...props} />;
};

// Create a custom DeleteDriver wrapper that accepts 'item' prop instead of 'driver'
const DeleteDriverWrapper = ({ item, ...props }) => {
  return <DeleteDriver driver={item} {...props} />;
};

// Create the dynamic driver list component
const DriverListFactory = createDynamicList({
  title: "Drivers",
  apiEndpoint: "/drivers",
  columns,
  renderRow,
  breadcrumbs: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Drivers", href: "/admin/drivers" },
  ],
  createConfig: {
    show: true,
    label: "Add New Driver",
  },
  CreateModal: CreateDriver,
  EditModal: EditDriverWrapper,
  DeleteModal: DeleteDriverWrapper,

  searchPlaceholder: "Search drivers...",
  deleteEndpoint: "/drivers/:id",
});

export default DriverListFactory;
