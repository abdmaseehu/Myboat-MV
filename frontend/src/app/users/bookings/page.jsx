"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Loader2,
  Ship,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/currency";
import ETicketDialog, {
  bookingRef,
} from "@/components/web/bookings/e-ticket-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import api from "@/lib/axios";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function BookingsPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState(null);

  useEffect(() => {
    const paymentStatus = searchParams.get("redirect_status");
    if (paymentStatus === "succeeded") {
      toast.success("Payment successful! Your booking has been confirmed.");
    }

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await api.get("/bookings");
        setBookings(response.data?.data?.bookings || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch bookings"
        );
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [searchParams]);

  const formatDate = (date) => {
    try {
      return format(new Date(date), "PPP");
    } catch (error) {
      return date;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return "bg-green-500/10 text-green-500";
      case "PENDING":
        return "bg-sky-500/10 text-sky-500";
      case "CANCELLED":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "PENDING":
        return <AlertCircle className="h-4 w-4 text-sky-500" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 space-y-4 p-4 md:p-8 pt-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">My Bookings</h2>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <Ship className="h-12 w-12 text-sky-500" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No Bookings Found</h3>
              <p className="text-muted-foreground max-w-sm">
                You haven't made any bookings yet. Start your journey by booking
                a ferry ticket!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-3xl font-bold tracking-tight">My Bookings</h2>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4"
      >
        {bookings.map((booking) => (
          <motion.div key={booking?.id} variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardHeader className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <Ship className="h-5 w-5 text-sky-500" />
                    <CardTitle className="text-lg">
                      {booking?.vehicle?.vehicleName}
                    </CardTitle>
                    <Badge variant="outline">
                      {booking?.vehicle?.vehicleNumber}
                    </Badge>
                  </div>
                  <Badge className={getStatusColor(booking?.status)}>
                    {booking?.status}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  {getPaymentStatusIcon(booking?.paymentStatus)}
                  {booking?.paymentMethod} • {booking?.paymentStatus}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Journey Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {/* Route */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex-shrink-0">
                        <MapPin className="h-4 w-4 text-sky-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-muted-foreground">Route</p>
                        <p className="font-medium truncate">
                          {booking?.route?.sourceCity} →{" "}
                          {booking?.route?.destinationCity}
                        </p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex-shrink-0">
                        <Calendar className="h-4 w-4 text-sky-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-muted-foreground">Travel Date</p>
                        <p className="font-medium">
                          {formatDate(booking?.bookingDate)}
                        </p>
                      </div>
                    </div>

                    {/* Boarding Point */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex-shrink-0">
                        <Clock className="h-4 w-4 text-sky-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-muted-foreground">Boarding</p>
                        <p className="font-medium truncate">
                          {booking?.boardingPoint?.locationName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Seats and Payment */}
                  <div className="space-y-3">
                    {/* Seats */}
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Selected Seats
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {booking?.seatNumbers
                          ?.filter((seat) => seat && seat.key !== "_meta")
                          .map((seat, index) => (
                            <div
                              key={`${booking.id}-seat-${index}`}
                              className="p-2 rounded-lg bg-muted/50 text-xs"
                            >
                              <div className="font-medium">
                                {seat?.key?.split("-").slice(-2).join("-") ||
                                  `Seat ${index + 1}`}
                              </div>
                              <div className="text-muted-foreground">
                                {seat?.deck ||
                                  seat?.key?.split("-")[0]?.toUpperCase() ||
                                  "DECK"}{" "}
                                • {seat?.type || "SEAT"}
                              </div>
                              <div className="text-sky-500 font-medium">
                                {formatMoney(
                                  seat?.price || 0,
                                  booking?.currency || "MVR"
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex-shrink-0">
                        <CreditCard className="h-4 w-4 text-sky-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-muted-foreground">Payment Details</p>
                        <div className="flex justify-between items-center">
                          <span>Total Amount</span>
                          <span className="font-bold text-sky-500">
                            {formatMoney(
                              booking?.finalAmount ?? booking?.totalAmount,
                              booking?.currency || "MVR"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* E-ticket - only once the trip is actually confirmed */}
                {booking?.status?.toUpperCase() === "CONFIRMED" && (
                  <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Booking reference</p>
                      <p className="font-mono font-medium tracking-wide">
                        {bookingRef(booking.id)}
                      </p>
                    </div>
                    <ETicketDialog booking={booking} />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
