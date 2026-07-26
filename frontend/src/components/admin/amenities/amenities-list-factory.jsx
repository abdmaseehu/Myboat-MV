"use client";

import { Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import createDynamicList from "@/components/common/create-dynamic-list";
import dynamic from "next/dynamic";
import api from "@/lib/axios";
import Image from "next/image";

// Dynamically import components with SSR disabled
const CreateAmenity = dynamic(() => import("./create-amenity"), { ssr: false });
const EditAmenity = dynamic(() => import("./edit-amenity"), { ssr: false });
const DeleteAmenity = dynamic(() => import("./delete-amenity"), { ssr: false });

// Get amenity icon based on type
const getAmenityIcon = (type) => {
  if (!type) return null;

  switch (type.toLowerCase()) {
    case "wifi":
      return <Wifi className="h-4 w-4 text-sky-500" />;
    case "refreshment":
      return <Wifi className="h-4 w-4 text-sky-500" />;
    default:
      return null;
  }
};

// Column definitions
const columns = [{ key: "name", header: "Name" }];

// Render row data based on column key
const renderRow = (amenity, columnKey) => {
  switch (columnKey) {
    case "name":
      return (
        <div className="flex items-center gap-3">
          {amenity.icon ? (
            <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted">
              <img
                src={`${process.env.NEXT_PUBLIC_ROOT_URL}${amenity.icon}`}
                alt={`${amenity.name} icon`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.src = "/placeholder.png";
                  e.target.onerror = null;
                }}
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center">
              <Wifi className="h-5 w-5 text-sky-500" />
            </div>
          )}
          <span className="font-medium">{amenity.name}</span>
        </div>
      );
    default:
      return null;
  }
};

// Custom delete handler with confirmation modal
const customDeleteHandler = async (amenity, refreshData) => {
  // We'll return false to prevent the default delete behavior
  // and handle it with our custom DeleteAmenity modal
  return false;
};

// Create a custom EditAmenity wrapper that accepts 'item' prop instead of 'amenity'
const EditAmenityWrapper = ({ item, ...props }) => {
  return <EditAmenity amenity={item} {...props} />;
};

// Create a custom DeleteAmenity wrapper that accepts 'item' prop instead of 'amenity'
const DeleteAmenityWrapper = ({ item, ...props }) => {
  return <DeleteAmenity amenity={item} {...props} />;
};

// Create the dynamic amenities list component
const AmenitiesListFactory = createDynamicList({
  title: "Amenities",
  apiEndpoint: "/amenities",
  columns,
  renderRow,
  breadcrumbs: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Amenities", href: "/admin/amenities" },
  ],
  createConfig: {
    show: true,
    label: "Add Amenity",
  },
  CreateModal: CreateAmenity,
  EditModal: EditAmenityWrapper,
  DeleteModal: DeleteAmenityWrapper,
  searchPlaceholder: "Search amenities...",
  deleteEndpoint: "/amenities/:id",
});

export default AmenitiesListFactory;
