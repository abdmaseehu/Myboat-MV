'use client'

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  ShoppingCart,
  Users,
  Ship,
  MapPin,
  Calendar,
  Loader2,
} from "lucide-react";
import { RevenueChart } from "./revenue-chart.js";
import api from "@/lib/axios";
import { formatDistanceToNow } from "date-fns";

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'text-green-500';
      case 'PENDING':
        return 'text-sky-500';
      case 'CANCELLED':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'text-green-500';
      case 'PENDING':
        return 'text-sky-500';
      case 'FAILED':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600">
              {formatCurrency(stats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              From {stats?.totalBookings || 0} total bookings
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
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Ship className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.totalVehicles || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              On {stats?.totalRoutes || 0} routes
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Trips Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Trips</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.upcomingTrips || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Scheduled trips
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
            {stats?.recentBookings?.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-accent transition-colors border"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {booking.user.firstName} {booking.user.lastName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {booking.vehicle.route.sourceCity} to {booking.vehicle.route.destinationCity}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">
                    {formatCurrency(booking.finalAmount)}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <span className={`text-xs ${getPaymentStatusColor(booking.paymentStatus)}`}>
                      • {booking.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
