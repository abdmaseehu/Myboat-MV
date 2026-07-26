import {
  Calendar,
  MapPin,
  Ship,
  Eye,
  CreditCard,
  Tag,
  Clock,
  Coins,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import createDynamicList from "@/components/common/create-dynamic-list";
import { formatMoney } from "@/lib/currency";

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
  switch (status) {
    case "CONFIRMED":
      return "border-green-500 text-green-500";
    case "PENDING":
      return "border-sky-500 text-sky-500";
    case "CANCELLED":
      return "border-red-500 text-red-500";
    default:
      return "border-gray-500 text-gray-500";
  }
};

// Get payment status color
const getPaymentStatusColor = (status) => {
  switch (status) {
    case "PAID":
      return "border-green-500 text-green-500";
    case "PENDING":
      return "border-sky-500 text-sky-500";
    case "FAILED":
      return "border-red-500 text-red-500";
    default:
      return "border-gray-500 text-gray-500";
  }
};

// Currency badge (MVR = green, USD = blue). Currencies are independent.
const CurrencyBadge = ({ currency }) => {
  const cur = (currency || "MVR").toUpperCase();
  if (cur === "USD") {
    return (
      <Badge
        variant="outline"
        className="border-sky-500 text-sky-600 flex items-center gap-1 w-fit"
      >
        <DollarSign className="h-3 w-3" />
        USD
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-emerald-500 text-emerald-600 flex items-center gap-1 w-fit"
    >
      <Coins className="h-3 w-3" />
      MVR
    </Badge>
  );
};

// Column definitions
const columns = [
  { key: "booking", header: "Booking Details" },
  { key: "route", header: "Route" },
  { key: "currency", header: "Currency" },
  { key: "payment", header: "Payment" },
  { key: "status", header: "Status" },
  { key: "created", header: "Created" },
];

// Render row data based on column key
const renderRow = (booking, columnKey) => {
  const currency = (booking.currency || "MVR").toUpperCase();
  switch (columnKey) {
    case "booking":
      return (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center">
            <Tag className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <p className="font-medium">
              {booking.user?.firstName} {booking.user?.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {booking.user?.email || booking.user?.mobile}
            </p>
          </div>
        </div>
      );
    case "route":
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span className="text-sm">
              {booking.route?.sourceCity} to {booking.route?.destinationCity}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Ship className="h-4 w-4 text-sky-500" />
            <span className="text-sm">
              {booking.vehicle?.registrationNumber}
            </span>
          </div>
        </div>
      );
    case "currency":
      return <CurrencyBadge currency={currency} />;
    case "payment":
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CreditCard
              className={cn(
                "h-4 w-4",
                currency === "USD" ? "text-sky-500" : "text-emerald-500"
              )}
            />
            <span
              className={cn(
                "font-medium",
                currency === "USD"
                  ? "text-sky-600 dark:text-sky-400"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {formatMoney(booking.finalAmount, currency)}
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "border shadow-sm",
              getPaymentStatusColor(booking.paymentStatus)
            )}
          >
            {booking.paymentStatus}
          </Badge>
        </div>
      );
    case "status":
      return (
        <Badge
          variant="outline"
          className={cn("border shadow-sm", getStatusColor(booking.status))}
        >
          {booking.status}
        </Badge>
      );
    case "created":
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-sky-500" />
          <span className="text-sm">{formatDate(booking.createdAt)}</span>
        </div>
      );
    default:
      return null;
  }
};

// Create the dynamic booking list component.
// Adds a Currency filter dropdown (All / MVR / USD).
const BookingListFactory = createDynamicList({
  title: "Bookings",
  apiEndpoint: "/bookings",
  columns,
  renderRow,
  breadcrumbs: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Bookings", href: "/admin/bookings" },
  ],
  createConfig: {
    show: false,
  },
  filters: [
    {
      key: "currency",
      label: "Currency",
      options: [
        { value: "", label: "All Currencies" },
        { value: "MVR", label: "MVR" },
        { value: "USD", label: "USD" },
      ],
    },
  ],
  customActions: [
    {
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (booking) =>
        (window.location.href = `/admin/bookings/${booking.id}`),
      className:
        "text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer",
    },
  ],
  searchPlaceholder: "Search bookings...",
  EditMode: false,
});

export default BookingListFactory;
