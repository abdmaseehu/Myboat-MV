"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  Trash2,
  Edit,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { LoadingAnimation } from "./loading-animation";

export default function DynamicList({
  title,
  apiEndpoint,
  columns,
  renderRow,
  breadcrumbs,
  createButton = {
    show: true,
    label: "Create New",
    onClick: () => {},
  },
  onEdit = () => {},
  onDelete = async () => true,
  customActions = [],
  pageSize = 5,
  searchPlaceholder = "Search...",
  searchField = "search",
  refreshTrigger = 0,
  EditMode = true,
  // Extra query-string params merged into every fetch (e.g. { status: "PENDING" }).
  extraParams,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(pageSize);
  const [total, setTotal] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
      };

      // Add search parameter if provided
      if (search) {
        params[searchField] = search;
      }

      // Merge caller-supplied filters (skip empty values)
      if (extraParams) {
        Object.entries(extraParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params[key] = value;
          }
        });
      }

      const response = await api.get(apiEndpoint, { params });

      // Handle different API response structures
      let items, pagination;

      if (response.data.data?.items) {
        // Format: { data: { items: [], pagination: {} } }
        items = response.data.data.items;
        pagination = response.data.data.pagination;
      } else if (response.data.data?.pagination) {
        // Format: { data: { [entityName]: [], pagination: {} } }
        // Find the data array by looking for array properties or excluding known non-array properties
        const dataKeys = Object.keys(response.data.data).filter(
          (key) =>
            key !== "pagination" && Array.isArray(response.data.data[key])
        );

        if (dataKeys.length > 0) {
          // Use the first array found (usually there's only one)
          items = response.data.data[dataKeys[0]];
          pagination = response.data.data.pagination;
        } else {
          // Fallback: try to find any property that might be the data array
          const possibleDataKey = Object.keys(response.data.data).find(
            (key) => key !== "pagination"
          );
          items = possibleDataKey ? response.data.data[possibleDataKey] : [];
          pagination = response.data.data.pagination;
        }
      } else {
        // Fallback format
        items = response.data.data || [];
        pagination = response.data.pagination || { total: items.length };
      }

      setItems(items);

      // Handle different pagination formats
      if (pagination) {
        // Standard pagination object
        setTotal(
          pagination.total ||
            pagination.totalCount ||
            pagination.count ||
            items.length
        );
      } else if (response.data.meta?.total) {
        // Some APIs use a meta object for pagination
        setTotal(response.data.meta.total);
      } else if (response.data.totalCount) {
        // Some APIs put the count at the root level
        setTotal(response.data.totalCount);
      } else {
        // Fallback to items length
        setTotal(items.length);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || `Error fetching ${title.toLowerCase()}`
      );
    } finally {
      setLoading(false);
    }
  };

  const extraParamsKey = JSON.stringify(extraParams || {});

  useEffect(() => {
    fetchData();
  }, [page, limit, search, refreshTrigger, apiEndpoint, extraParamsKey]);

  // Reset to page 1 whenever the external filters change
  useEffect(() => {
    setPage(1);
  }, [extraParamsKey]);

  // Delete item
  const handleDelete = async () => {
    try {
      const success = await onDelete(selectedItem);
      if (success !== false) {
        toast.success(`${title.slice(0, -1)} deleted successfully`);
        fetchData();
      }
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Error deleting ${title.slice(0, -1).toLowerCase()}`
      );
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(total / limit);
  const canPreviousPage = page > 1;
  const canNextPage = page < totalPages;

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            {breadcrumbs.map((crumb, index) => {
              // Check if the breadcrumb item has a URL
              const isLink = typeof crumb === "object" && crumb.href;
              const label = isLink ? crumb.label : crumb;
              const isLastItem = index === breadcrumbs.length - 1;

              return (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
                  )}

                  {isLastItem ? (
                    <span
                      className="font-medium text-foreground"
                      aria-current="page"
                    >
                      {label}
                    </span>
                  ) : isLink ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-sky-500 transition-colors"
                    >
                      {label}
                    </Link>
                  ) : (
                    <span>{label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <Card className="border-none bg-gradient-to-b from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-900/50 shadow-md shadow-zinc-200/30 dark:shadow-zinc-950/50">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <CardTitle className="text-2xl font-bold">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and organize your {title.toLowerCase()}
              </p>
            </div>
            {createButton.show && (
              <Button
                onClick={createButton.onClick}
                className="bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                {createButton.label}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1); // Reset to first page when searching
                }}
                className="pl-9 bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-sky-500 h-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                disabled={!search}
                className="h-10 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  fetchData();
                }}
                disabled={loading}
                className="h-10 bg-sky-500 text-white hover:bg-sky-600 shadow-sm"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent bg-zinc-50/50 dark:bg-zinc-800/50">
                  {columns.map((column, index) => (
                    <TableHead key={index}>{column.header}</TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="text-center h-48 bg-white dark:bg-zinc-900/50"
                    >
                      <LoadingAnimation />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="text-center h-24"
                    >
                      <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
                        <p>No {title.toLowerCase()} found</p>
                        <p className="text-sm">Try adjusting your search</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      {columns.map((column, index) => (
                        <TableCell key={index}>
                          {renderRow(item, column.key)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-sky-500/10 hover:text-sky-500"
                            >
                              <ChevronDown className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-[160px]"
                          >
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {EditMode && (
                              <DropdownMenuItem
                                onClick={() => onEdit(item)}
                                className="text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10 cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(item);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                            {customActions
                              // `show` is an optional per-row predicate; actions
                              // without one are always rendered.
                              .filter((action) =>
                                typeof action.show === "function"
                                  ? action.show(item)
                                  : true
                              )
                              .map((action, index) => (
                                <DropdownMenuItem
                                  key={action.label || index}
                                  // Handlers may be async; `fetchData` is handed in
                                  // so an action can refresh the list in place.
                                  onClick={() => action.onClick(item, fetchData)}
                                  className={
                                    action.className ||
                                    "text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10 cursor-pointer"
                                  }
                                >
                                  {action.icon && (
                                    <span className="mr-2">{action.icon}</span>
                                  )}
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-sky-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Loading results...</span>
                  </div>
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-medium text-foreground">
                      {items.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">{total}</span>{" "}
                    results
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  |
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show</span>
                  <Select
                    value={limit.toString()}
                    onValueChange={(value) => {
                      setLimit(Number(value));
                      setPage(1); // Reset to first page when changing page size
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-8 w-[70px] bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-sky-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    per page
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <div className="text-sm text-muted-foreground sm:mr-4">
                Page <span className="font-medium text-foreground">{page}</span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {totalPages || 1}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={!canPreviousPage || loading}
                  className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <span className="sr-only">First page</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-chevrons-left"
                  >
                    <path d="m11 17-5-5 5-5" />
                    <path d="m18 17-5-5 5-5" />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!canPreviousPage || loading}
                  className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 sm:w-auto sm:px-3"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-chevron-left sm:mr-1"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  <span className="hidden sm:inline">Previous</span>
                </Button>

                <div className="hidden md:flex items-center">
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Logic to show pages around current page
                    let pageNum;
                    if (totalPages <= 5) {
                      // If 5 or fewer pages, show all
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      // If near start, show first 5
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      // If near end, show last 5
                      pageNum = totalPages - 4 + i;
                    } else {
                      // Otherwise show current page and 2 on each side
                      pageNum = page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        disabled={loading}
                        className={cn(
                          "h-8 w-8 p-0 mx-0.5",
                          page === pageNum
                            ? "bg-sky-500 text-white hover:bg-sky-600 border-sky-500"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  {/* Show ellipsis if there are more pages */}
                  {totalPages > 5 && page < totalPages - 2 && (
                    <span className="mx-1 text-muted-foreground">...</span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!canNextPage || loading}
                  className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 sm:w-auto sm:px-3"
                >
                  <span className="hidden sm:inline">Next</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-chevron-right sm:ml-1"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={!canNextPage || loading}
                  className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <span className="sr-only">Last page</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-chevrons-right"
                  >
                    <path d="m13 17 5-5-5-5" />
                    <path d="m6 17 5-5-5-5" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {/* Delete Dialog */}
          <AlertDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {title.slice(0, -1)}</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this{" "}
                  {title.slice(0, -1).toLowerCase()}? This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-sky-500 text-sky-500 hover:bg-sky-500/10">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
