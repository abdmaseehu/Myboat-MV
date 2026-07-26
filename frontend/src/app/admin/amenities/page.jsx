"use client";

import { Toaster } from "sonner";
import AmenitiesListFactory from "@/components/admin/amenities/amenities-list-factory";

export default function AmenitiesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />

      {/* Amenities List */}
      <AmenitiesListFactory />
    </div>
  );
}
