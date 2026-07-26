"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import { useRouter } from "next/navigation";
import VehicleListFactory from "@/components/admin/vehicles/vehicle-list-factory";

// Format amenities
const formatAmenities = (amenities) => {
  if (!amenities?.ids?.[0]) return "No amenities";

  try {
    // Parse the JSON string to get the amenities array
    const parsedAmenities = JSON.parse(amenities.ids[0]);

    if (!Array.isArray(parsedAmenities) || parsedAmenities.length === 0) {
      return "No amenities";
    }

    if (parsedAmenities.length === 1) {
      return parsedAmenities[0].name;
    }

    return `${parsedAmenities[0].name} +${parsedAmenities.length - 1} more`;
  } catch (error) {
    // If the amenities are stored as plain IDs (old format)
    if (Array.isArray(amenities.ids)) {
      return `${amenities.ids.length} amenities`;
    }
    return "No amenities";
  }
};

export default function VehiclesPage() {
  const router = useRouter();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          {/* <h2 className="text-2xl font-bold tracking-tight">Vessels</h2>
          <p className="text-muted-foreground">
            Manage and organize your vehicles
          </p> */}
        </div>

        <Button
          onClick={() => router.push("/admin/vehicles/create")}
          className="bg-sky-500 text-white hover:bg-sky-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Vehicle
        </Button>
      </div>

      <Toaster position="top-center" />
      <VehicleListFactory />
    </div>
  );
}
