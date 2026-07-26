"use client";

import { Building2, Phone, Mail, MapPin, Eye, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import createDynamicList from "@/components/common/create-dynamic-list";
import CreateVendor from "./create-vendor";
import EditVendor from "./edit-vendor";
import api from "@/lib/axios";

// Get status color
const getStatusColor = (status) => {
  switch (status) {
    case "ACTIVE":
      return "border-green-500 text-green-500";
    case "INACTIVE":
      return "border-sky-500 text-sky-500";
    case "SUSPENDED":
      return "border-red-500 text-red-500";
    default:
      return "border-zinc-500 text-zinc-500";
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

// Column definitions
const columns = [
  { key: "businessInfo", header: "Business Info" },
  { key: "contact", header: "Contact" },
  { key: "businessEmail", header: "Business Email" },
  { key: "status", header: "Status" },
  { key: "owner", header: "Owner" },
];

// Render row data based on column key
const renderRow = (vendor, columnKey) => {
  switch (columnKey) {
    case "businessInfo":
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={
                vendor.businessLogo
                  ? `${process.env.NEXT_PUBLIC_ROOT_URL}${vendor.businessLogo}`
                  : null
              }
              alt={vendor.businessName}
            />
            <AvatarFallback>
              <Building2 className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{vendor.businessName}</p>
            <p className="text-sm text-muted-foreground">
              {vendor.businessEmail}
            </p>
          </div>
        </div>
      );
    case "contact":
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-sky-500" />
            <span className="text-sm">{vendor.businessMobile}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-sky-500" />
            <span className="text-sm">{vendor.businessAddress}</span>
          </div>
        </div>
      );
    case "businessEmail":
      return (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-sky-500" />
          <span>{vendor.businessEmail}</span>
        </div>
      );
    case "status":
      return (
        <Badge
          variant="outline"
          className={cn("border shadow-sm", getStatusColor(vendor.status))}
        >
          {vendor.status}
        </Badge>
      );
    case "owner":
      return (
        <div>
          <p className="font-medium">
            {vendor.firstName} {vendor.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{vendor.email}</p>
        </div>
      );
    default:
      return null;
  }
};

// Custom delete handler
const customDeleteHandler = async (vendor, refreshData) => {
  try {
    const confirmed = window.confirm(
      `Are you sure you want to delete vendor "${vendor.businessName}"?`
    );

    if (!confirmed) {
      return false;
    }

    await api.delete(`/vendors/${vendor.id}`);
    toast.success("Vendor deleted successfully");
    refreshData();
    return true;
  } catch (error) {
    toast.error(error.response?.data?.message || "Error deleting vendor");
    return false;
  }
};

// Create a custom EditVendor wrapper that accepts 'item' prop instead of 'vendor'
const EditVendorWrapper = ({ item, ...props }) => {
  return <EditVendor vendor={item} {...props} />;
};

// Create the dynamic vendor list component
const VendorListFactory = createDynamicList({
  title: "Vendors",
  apiEndpoint: "/vendors",
  columns,
  renderRow,
  breadcrumbs: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Vendors", href: "/admin/vendors" },
  ],
  createConfig: {
    show: true,
    label: "Create New Vendor",
  },
  CreateModal: CreateVendor,
  EditModal: EditVendorWrapper,
  searchPlaceholder: "Search vendors...",
  deleteEndpoint: "/vendors/:id",
});

export default VendorListFactory;
