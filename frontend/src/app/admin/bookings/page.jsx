"use client";

import dynamic from "next/dynamic";

const BookingListFactory = dynamic(
  () => import("@/components/admin/bookings/booking-list-factory"),
  { ssr: false }
);

export default function BookingsPage() {
  return <BookingListFactory />;
}
