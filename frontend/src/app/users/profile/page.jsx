"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileUpdate from "@/components/users/profile-update";
import PasswordChange from "@/components/users/password-change";

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Profile Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileUpdate />
        </TabsContent>

        <TabsContent value="password">
          <PasswordChange />
        </TabsContent>
      </Tabs>
    </div>
  );
}
