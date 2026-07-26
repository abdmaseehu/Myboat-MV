"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Toaster } from "sonner";
import CreateVehicleForm from "@/components/admin/vehicles/create-vehicle-form";

export default function CreateVehiclePage() {
  return (
    <div className="flex-1 space-y-1 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />

      {/* Form */}
      <CreateVehicleForm />
    </div>
  );
}
