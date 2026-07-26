"use client";

import { Mail, Phone, Calendar, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import createDynamicList from "@/components/common/create-dynamic-list";
import CreateUser from "./create-user";
import EditUser from "./edit-user";

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Column definitions
const columns = [
  { key: "name", header: "Name" },
  { key: "contact", header: "Contact" },
  { key: "role", header: "Role" },
  { key: "status", header: "Status" },
  { key: "joined", header: "Joined" },
];

// Render row data based on column key
const renderRow = (user, columnKey) => {
  switch (columnKey) {
    case "name":
      return (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-sky-500 to-sky-600 shadow-lg flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {user.gender || "Not specified"}
            </p>
          </div>
        </div>
      );
    case "contact":
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-sky-500" />
            <span className="text-sm">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-sky-500" />
            <span className="text-sm">{user.mobile}</span>
          </div>
        </div>
      );
    case "role":
      return (
        <Badge
          variant="outline"
          className={cn(
            "border shadow-sm",
            user.role === "ADMIN"
              ? "border-red-500 text-red-500"
              : user.role === "VENDOR"
              ? "border-blue-500 text-blue-500"
              : "border-green-500 text-green-500"
          )}
        >
          {user.role}
        </Badge>
      );
    case "status":
      return (
        <Badge
          variant={user.active ? "outline" : "secondary"}
          className={cn(
            "bg-transparent border shadow-sm",
            user.active
              ? "border-sky-500 text-sky-500"
              : "text-muted-foreground"
          )}
        >
          {user.active ? "Active" : "Inactive"}
        </Badge>
      );
    case "joined":
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-sky-500" />
          <span className="text-sm">{formatDate(user.createdAt)}</span>
        </div>
      );
    default:
      return null;
  }
};

// Create a custom EditUser wrapper that accepts 'item' prop instead of 'user'
const EditUserWrapper = ({ item, ...props }) => {
  return <EditUser user={item} {...props} />;
};

// Create the dynamic user list component
const UserListFactory = createDynamicList({
  title: "Users",
  apiEndpoint: "/auth",
  columns,
  renderRow,
  breadcrumbs: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Users", href: "/admin/users" },
  ],
  createConfig: {
    show: true,
    label: "Create New User",
  },
  CreateModal: CreateUser,
  EditModal: EditUserWrapper,
  searchPlaceholder: "Search users...",
  deleteEndpoint: "/auth/:id",
});

export default UserListFactory;
