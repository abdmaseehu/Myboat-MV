"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import { Toaster, toast } from "sonner";
import EditCustomField from "@/components/admin/custom-fields/edit-custom-field";
import api from "@/lib/axios";

export default function EditCustomFieldPage() {
  const params = useParams();
  const router = useRouter();
  const [customField, setCustomField] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Custom Fields", href: "/admin/custom-fields" },
    { label: "Edit Custom Field" },
  ];

  useEffect(() => {
    const fetchCustomField = async () => {
      try {
        const response = await api.get(`/custom-fields/${params.id}`);
        setCustomField(response.data.data);
      } catch (error) {
        toast.error("Failed to fetch custom field");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomField();
  }, [params.id]);

  const handleSuccess = () => {
    router.push("/admin/custom-fields");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between">
        <BreadcrumbNav items={breadcrumbs} />
      </div>

      {customField && (
        <EditCustomField customField={customField} onSuccess={handleSuccess} />
      )}
    </div>
  );
}
