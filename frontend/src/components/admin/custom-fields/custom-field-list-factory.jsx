"use client";

import { Database, Calendar, Eye, Edit, Trash, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import createDynamicList from "@/components/common/create-dynamic-list";
import DeleteCustomField from "./delete-custom-field";

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

// Column definitions
const columns = [
  { key: "name", header: "Name" },
  { key: "fields", header: "Custom Fields" },
  { key: "created", header: "Created" },
];

// Render row data based on column key
const renderRow = (customField, columnKey) => {
  switch (columnKey) {
    case "name":
      return (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center">
            <Database className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <p className="font-medium">{customField.name}</p>
          </div>
        </div>
      );
    case "fields":
      return (
        <div className="flex flex-wrap gap-1">
          {(typeof customField.customFields === "string"
            ? JSON.parse(customField.customFields)
            : customField.customFields
          ).map((field, index) => (
            <Badge
              key={index}
              variant="outline"
              className={cn(
                "border shadow-sm",
                field.type === "image"
                  ? "border-blue-500 text-blue-500"
                  : "border-sky-500 text-sky-500"
              )}
            >
              {field.key} ({field.type})
            </Badge>
          ))}
        </div>
      );
    case "created":
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-sky-500" />
          <span>{formatDate(customField.createdAt)}</span>
        </div>
      );
    default:
      return null;
  }
};

// Create a custom DeleteCustomField wrapper that accepts 'item' prop
const DeleteCustomFieldWrapper = ({ item, ...props }) => {
  return <DeleteCustomField customField={item} {...props} />;
};

// Create the dynamic custom field list component
const CustomFieldListFactory = createDynamicList({
  title: "Custom Fields",
  apiEndpoint: "/custom-fields",
  columns,
  renderRow,
  breadcrumbs: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Custom Fields", href: "/admin/custom-fields" },
  ],
  createConfig: {
    show: true,
    label: "Create Custom Field",
    onClick: () => (window.location.href = "/admin/custom-fields/create"),
    customButton: (
      <Button
        onClick={() => (window.location.href = "/admin/custom-fields/create")}
        className="bg-sky-500 text-white hover:bg-sky-600"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Custom Field
      </Button>
    ),
  },
  customActions: [
    {
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
      onClick: (customField) =>
        (window.location.href = `/admin/custom-fields/${customField.id}/edit`),
      className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50",
    },
  ],
  DeleteModal: DeleteCustomFieldWrapper,
  searchPlaceholder: "Search custom fields...",
  deleteEndpoint: "/custom-fields/:id",
  EditMode: false,
});

export default CustomFieldListFactory;
