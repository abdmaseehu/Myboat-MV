"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Ship,
  Route,
  Store,
  CreditCard,
  Calendar,
  User,
  Loader2,
  Clock,
  MapPin,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { formatMoney } from "@/lib/currency";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentBookings from "@/components/dashboard/RecentBookings";
import { useAuth } from "@/store/use-auth";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get("/dashboard/stats");
        setStats(response.data?.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setError(
          error.response?.data?.message || "Failed to fetch dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-sky-500 hover:bg-sky-600"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName}!
          </h2>
          <p className="text-muted-foreground">
            Here's what's happening with your {user?.role.toLowerCase()}{" "}
            account.
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {/* Common Stats for all roles */}
        <StatsCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          icon={Calendar}
          description="All time bookings"
          delay={0.1}
        />
        {/*
          A customer spends, they don't earn. MVR and USD are kept as separate
          cards because the two currencies never mix - summing them would be a
          meaningless number.
        */}
        <StatsCard
          title="Total Spent (MVR)"
          value={formatMoney(stats?.revenueMvr || 0, "MVR")}
          icon={Wallet}
          description="Paid on local-fare trips"
          delay={0.2}
        />
        <StatsCard
          title="Total Spent (USD)"
          value={formatMoney(stats?.revenueUsd || 0, "USD")}
          icon={Wallet}
          description="Paid on tourist-fare trips"
          delay={0.3}
        />

        {/* Admin-specific Stats */}
        {user?.role === "ADMIN" && (
          <>
            <StatsCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              icon={Users}
              description="Registered users"
              delay={0.3}
            />
            <StatsCard
              title="Total Vendors"
              value={stats?.totalVendors || 0}
              icon={Store}
              description="Active vendors"
              delay={0.4}
            />
            <StatsCard
              title="Total Vehicles"
              value={stats?.totalVehicles || 0}
              icon={Ship}
              description="Available boats"
              delay={0.5}
            />
            <StatsCard
              title="Total Routes"
              value={stats?.totalRoutes || 0}
              icon={Route}
              description="Active routes"
              delay={0.6}
            />
          </>
        )}

        {/* Vendor-specific Stats */}
        {user?.role === "VENDOR" && (
          <>
            <StatsCard
              title="Total Vehicles"
              value={stats?.totalVehicles || 0}
              icon={Ship}
              description="Your fleet"
              delay={0.3}
            />
            <StatsCard
              title="Total Drivers"
              value={stats?.totalDrivers || 0}
              icon={User}
              description="Active drivers"
              delay={0.4}
            />
          </>
        )}

        {/* User-specific Stats */}
        {user?.role === "USER" && (
          <>
            <StatsCard
              title="Account Status"
              value="Active"
              icon={User}
              description={`Since ${format(
                new Date(user?.createdAt),
                "MMM dd, yyyy"
              )}`}
              delay={0.3}
            />
            <StatsCard
              title="Upcoming Trips"
              value={stats?.upcomingTrips || 0}
              icon={Clock}
              description="Next 30 days"
              delay={0.4}
            />
          </>
        )}
      </motion.div>

      {/* Recent Bookings */}
      {stats?.recentBookings?.length > 0 ? (
        <RecentBookings bookings={stats.recentBookings} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <p>No bookings found</p>
                {user?.role === "USER" && (
                  <Button
                    className="mt-4 bg-sky-500 hover:bg-sky-600"
                    onClick={() => (window.location.href = "/")}
                  >
                    Book a Trip
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
