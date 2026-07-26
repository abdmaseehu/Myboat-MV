"use client";

import { Tag, Bookmark, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import createDynamicList from "@/components/common/create-dynamic-list";
import dynamic from "next/dynamic";
import api from "@/lib/axios";

// Dynamically import components with SSR disabled
const CreateCategory = dynamic(() => import("./create-category"), {
  ssr: false,
});
const EditCategory = dynamic(() => import("./edit-category"), { ssr: false });
const DeleteCategory = dynamic(() => import("./delete-category"), {
  ssr: false,
});

// Get category icon based on type
const getCategoryIcon = (type) => {
  if (!type) return <Tag className="h-4 w-4 text-sky-500" />;

  switch (type.toLowerCase()) {
    case "bus":
      return <Tag className="h-4 w-4 text-blue-500" />;
    case "seat":
      return <Bookmark className="h-4 w-4 text-green-500" />;
    default:
      return <Tag className="h-4 w-4 text-sky-500" />;
  }
};

// Column definitions
const columns = [
  { key: "name", header: "Name" },
  { key: "type", header: "Type" },
  { key: "description", header: "Description" },
];

// Render row data based on column key
const renderRow = (category, columnKey) => {
  switch (columnKey) {
    case "name":
      return (
        <div className="flex items-center gap-2">
          {getCategoryIcon(category.type)}
          <span className="font-medium">{category.name}</span>
        </div>
      );
    case "type":
      return (
        <Badge
          variant="outline"
          className="border-sky-500 text-sky-500 shadow-sm"
        >
          {category.type}
        </Badge>
      );
    case "description":
      return (
        <div className="max-w-md truncate">
          {category.description || "No description"}
        </div>
      );
    default:
      return null;
  }
};

// Custom delete handler with confirmation modal
const customDeleteHandler = async (category, refreshData) => {
  // We'll return false to prevent the default delete behavior
  // and handle it with our custom DeleteCategory modal
  return false;
};

// Create a custom EditCategory wrapper that accepts 'item' prop instead of 'category'
const EditCategoryWrapper = ({ item, ...props }) => {
  return <EditCategory category={item} {...props} />;
};

// Create a custom DeleteCategory wrapper that accepts 'item' prop instead of 'category'
const DeleteCategoryWrapper = ({ item, ...props }) => {
  return <DeleteCategory category={item} {...props} />;
};

// Create the dynamic category list component
const CategoryListFactory = createDynamicList({
  title: "Categories",
  apiEndpoint: "/categories",
  columns,
  renderRow,
  breadcrumbs: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Categories", href: "/admin/categories" },
  ],
  createConfig: {
    show: true,
    label: "Add Category",
  },
  CreateModal: CreateCategory,
  EditModal: EditCategoryWrapper,
  DeleteModal: DeleteCategoryWrapper,

  searchPlaceholder: "Search categories...",
  deleteEndpoint: "/categories/:id",
});

export default CategoryListFactory;
