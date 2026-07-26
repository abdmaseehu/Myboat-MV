"use client";

import { Toaster } from "sonner";
import { useRouter } from "next/navigation";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import CreateCustomField from "@/components/admin/custom-fields/create-custom-field";

export default function CreateCustomFieldPage() {
  const router = useRouter();

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Custom Fields", href: "/admin/custom-fields" },
    { label: "Create Custom Field" },
  ];

  const handleSuccess = () => {
    router.push("/admin/custom-fields");
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between">
        <BreadcrumbNav items={breadcrumbs} />
      </div>

      <CreateCustomField onSuccess={handleSuccess} />
    </div>
  );
}
