"use client";

import { Toaster } from "sonner";
import DroppingPointListFactory from "@/components/admin/dropping-points/dropping-point-list-factory";

export default function DroppingPointsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />
      
      {/* Dropping Points List */}
      <DroppingPointListFactory />
    </div>
  );
}