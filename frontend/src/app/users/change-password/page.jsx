"use client";

import { Toaster } from "sonner";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import PasswordChange from "@/components/users/password-change";

export default function ChangePasswordPage() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/users" },
    { label: "Change Password" },
  ];

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <BreadcrumbNav items={breadcrumbs} />
          <h2 className="text-2xl font-bold tracking-tight mt-2">
            Change Password
          </h2>
          <p className="text-muted-foreground">
            Update your password to keep your account secure
          </p>
        </div>
      </div>

      <PasswordChange />
    </div>
  );
}
