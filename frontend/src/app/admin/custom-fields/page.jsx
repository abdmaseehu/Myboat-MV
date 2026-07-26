"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import { useRouter } from "next/navigation";
import CustomFieldListFactory from "@/components/admin/custom-fields/custom-field-list-factory";

export default function CustomFieldsPage() {
  const router = useRouter();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          {/* <h2 className="text-2xl font-bold tracking-tight">Custom Fields</h2>
          <p className="text-muted-foreground">
            Manage and organize your custom fields
          </p> */}
        </div>

        <Button
          onClick={() => router.push("/admin/custom-fields/create")}
          className="bg-sky-500 text-white hover:bg-sky-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Field
        </Button>
      </div>

      <Toaster position="top-center" />
      <CustomFieldListFactory />
    </div>
  );
}
