"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "sonner";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import TwilioConfig from "@/components/admin/settings/twilio-config";
import PaymentConfig from "@/components/admin/settings/payment-config";
import SiteConfig from "@/components/admin/settings/site-config";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("site");

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Settings" },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between">
        <div>
          <BreadcrumbNav items={breadcrumbs} />
          <h2 className="text-2xl font-bold tracking-tight mt-2">Settings</h2>
          <p className="text-muted-foreground">
            Manage your application settings and configurations
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-card">
          <TabsTrigger value="site">Site Config</TabsTrigger>
          <TabsTrigger value="twilio">Phone Info</TabsTrigger>
          <TabsTrigger value="payment">Payment Info</TabsTrigger>
        </TabsList>

        <TabsContent value="site" className="space-y-4">
          <SiteConfig />
        </TabsContent>

        <TabsContent value="twilio" className="space-y-4">
          <TwilioConfig />
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <PaymentConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
