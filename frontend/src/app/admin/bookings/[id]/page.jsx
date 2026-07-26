"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/axios";
import BookingDetails from "@/components/admin/bookings/booking-details";

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/bookings/${params.id}`);
        setBooking(response.data?.data);
      } catch (error) {
        console.error("Error fetching booking:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch booking details"
        );
        router.push("/admin/bookings");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchBooking();
    }
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <Button
        variant="ghost"
        className="gap-2"
        onClick={() => router.push("/admin/bookings")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bookings
      </Button>
      <BookingDetails booking={booking} />
    </div>
  );
}
