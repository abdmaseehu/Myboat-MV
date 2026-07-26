"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "sonner";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import ProfileUpdate from "@/components/admin/profile/profile-update";
import PasswordChange from "@/components/admin/profile/password-change";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Profile Settings" },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between">
        <div>
          <BreadcrumbNav items={breadcrumbs} />
          <h2 className="text-2xl font-bold tracking-tight mt-2">
            Profile Settings
          </h2>
          <p className="text-muted-foreground">
            Manage your profile information and security settings
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-card">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileUpdate />
        </TabsContent>

        <TabsContent value="password" className="space-y-4">
          <PasswordChange />
        </TabsContent>
      </Tabs>
    </div>
  );
}
