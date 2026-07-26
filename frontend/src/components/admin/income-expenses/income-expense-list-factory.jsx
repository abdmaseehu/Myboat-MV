"use client";

import { DollarSign, Calendar, ArrowUpDown, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import createDynamicList from "@/components/common/create-dynamic-list";
import dynamic from "next/dynamic";
import api from "@/lib/axios";

// Dynamically import components with SSR disabled
const CreateIncomeExpense = dynamic(() => import("./create-income-expense"), {
  ssr: false,
});
const EditIncomeExpense = dynamic(() => import("./edit-income-expense"), {
  ssr: false,
});
const DeleteIncomeExpense = dynamic(() => import("./delete-income-expense"), {
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

// Format amount
const formatAmount = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Column definitions
const columns = [
  { key: "amount", header: "Amount" },
  { key: "category", header: "Category" },
  { key: "transactionDate", header: "Date" },
  { key: "description", header: "Description" },
];

// Render row data based on column key
const renderRow = (item, columnKey) => {
  if (!item) return null;

  switch (columnKey) {
    case "amount":
      return (
        <div className="flex items-center gap-2">
          <DollarSign
            className={cn(
              "h-4 w-4",
              item.category?.type === "INCOME"
                ? "text-green-500"
                : "text-red-500"
            )}
          />
          <span
            className={cn(
              "font-medium",
              item.category?.type === "INCOME"
                ? "text-green-600"
                : "text-red-600"
            )}
          >
            {formatAmount(Number(item.amount) || 0)}
          </span>
        </div>
      );
    case "category":
      return (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "border shadow-sm",
              item.category?.type === "INCOME"
                ? "border-green-500 text-green-500"
                : "border-red-500 text-red-500"
            )}
          >
            {String(item.category?.name || "")}
          </Badge>
        </div>
      );
    case "transactionDate":
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-sky-500" />
          <span>{formatDate(item.transactionDate)}</span>
        </div>
      );
    case "description":
      return (
        <div className="max-w-md truncate">
          {String(item.description || "No description")}
        </div>
      );
    default:
      return null;
  }
};

// Create a custom EditIncomeExpense wrapper that accepts 'item' prop
const EditIncomeExpenseWrapper = ({ item, ...props }) => {
  return <EditIncomeExpense incomeExpense={item} {...props} />;
};

// Create a custom DeleteIncomeExpense wrapper that accepts 'item' prop
const DeleteIncomeExpenseWrapper = ({ item, ...props }) => {
  return <DeleteIncomeExpense incomeExpense={item} {...props} />;
};

// Create the dynamic income-expense list component
const IncomeExpenseListFactory = createDynamicList({
  title: "Income & Expenses",
  apiEndpoint: "/income-expenses",
  columns,
  renderRow,
  breadcrumbs: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Income & Expenses", href: "/admin/income-expenses" },
  ],
  createConfig: {
    show: true,
    label: "Add Transaction",
  },
  CreateModal: CreateIncomeExpense,
  EditModal: EditIncomeExpenseWrapper,
  DeleteModal: DeleteIncomeExpenseWrapper,
  searchPlaceholder: "Search transactions...",
  deleteEndpoint: "/income-expenses/:id",
});

export default IncomeExpenseListFactory;
