'use client'

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Coins,
  DollarSign,
  Users,
  Ship,
  MapPin,
  Calendar,
  Loader2,
} from "lucide-react";
import api from "@/lib/axios";
import { formatMoney } from "@/lib/currency";

export default function BusinessOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats");
        setStats(response.data.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "text-green-500";
      case "PENDING":
        return "text-sky-500";
      case "CANCELLED":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "text-green-500";
      case "PENDING":
        return "text-sky-500";
      case "FAILED":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const revenueMvr = Number(stats?.revenueMvr || 0);
  const revenueUsd = Number(stats?.revenueUsd || 0);
  const bookingsMvrCount = stats?.bookingsMvrCount || 0;
  const bookingsUsdCount = stats?.bookingsUsdCount || 0;

  return (
    <div className="space-y-6">
      {/* Currency-split revenue stats: MVR and USD are handled INDEPENDENTLY */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MVR Revenue</CardTitle>
            <Coins className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatMoney(revenueMvr, "MVR")}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {bookingsMvrCount} MVR bookings
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-sky-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">USD Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
              {formatMoney(revenueUsd, "USD")}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {bookingsUsdCount} USD bookings
            </p>
          </CardContent>
        </Card>

        {/* Users Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Including {stats?.totalVendors || 0} vendors
            </p>
          </CardContent>
        </Card>

        {/* Vehicles Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vessels</CardTitle>
            <Ship className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.totalVehicles || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              On {stats?.totalRoutes || 0} routes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentBookings?.length ? (
              stats.recentBookings.map((booking) => {
                const currency = (booking.currency || "MVR").toUpperCase();
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-accent transition-colors border"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {booking.user?.firstName} {booking.user?.lastName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {booking.vehicle?.route?.sourceCity} to{" "}
                        {booking.vehicle?.route?.destinationCity}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p
                        className={`text-sm font-medium ${
                          currency === "USD"
                            ? "text-sky-600 dark:text-sky-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {formatMoney(booking.finalAmount, currency)}
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <span className={`text-xs ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        <span
                          className={`text-xs ${getPaymentStatusColor(
                            booking.paymentStatus
                          )}`}
                        >
                          • {booking.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No recent bookings
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
