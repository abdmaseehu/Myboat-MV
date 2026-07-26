"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

export default function SiteConfig() {
  const [settings, setSettings] = useState({
    SITE_NAME: "",
    SITE_LOGO: "",
    LOGIN_BG: "",
    REGISTER_BG: "",
  });
  const [files, setFiles] = useState({
    SITE_LOGO: null,
    LOGIN_BG: null,
    REGISTER_BG: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/settings");
      const settingsData = response.data.data.settings;

      const formattedSettings = {};
      settingsData.forEach((setting) => {
        formattedSettings[setting.keyName] = setting.value;
      });

      setSettings(formattedSettings);
    } catch (error) {
      toast.error("Failed to fetch site settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFileChange = async (e, key) => {
    const file = e.target.files[0];
    if (file) {
      setFiles((prev) => ({
        ...prev,
        [key]: file,
      }));

      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings((prev) => ({
          ...prev,
          [key]: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Create an array to store all promises
      const promises = [];

      // Handle text setting (SITE_NAME)
      if (settings.SITE_NAME) {
        promises.push(
          api.post("/settings", {
            keyName: "SITE_NAME",
            value: settings.SITE_NAME,
            type: "TEXT",
          })
        );
      }

      // Handle image settings
      const imageKeys = ["SITE_LOGO", "LOGIN_BG", "REGISTER_BG"];

      for (const key of imageKeys) {
        if (files[key]) {
          const formData = new FormData();
          formData.append("file", files[key]);
          formData.append("keyName", key);
          formData.append("type", "IMAGE");

          promises.push(
            api.post("/settings", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            })
          );
        }
      }

      // Wait for all settings to be saved
      await Promise.all(promises);

      toast.success("Settings saved successfully");
      await fetchSettings(); // Refresh settings

      // Clear file states after successful save
      setFiles({
        SITE_LOGO: null,
        LOGIN_BG: null,
        REGISTER_BG: null,
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);

      // Default values
      const defaultSettings = {
        SITE_NAME: "Myboat MV",
        SITE_LOGO: "",
        LOGIN_BG: "",
        REGISTER_BG: "",
      };

      // Reset each setting
      await Promise.all(
        Object.entries(defaultSettings).map(([key, value]) =>
          api.post("/settings", {
            keyName: key,
            value: value,
            type: key === "SITE_NAME" ? "TEXT" : "IMAGE",
          })
        )
      );

      toast.success("Settings reset successfully");
      fetchSettings(); // Refresh settings
    } catch (error) {
      console.error("Error resetting settings:", error);
      toast.error("Failed to reset settings");
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              value={settings.SITE_NAME || ""}
              onChange={(e) => handleChange("SITE_NAME", e.target.value)}
              placeholder="Enter site name"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Site Logo</Label>
              {settings.SITE_LOGO && (
                <div className="relative w-full h-[200px] rounded-lg overflow-hidden bg-muted">
                  <img
                    src={
                      files.SITE_LOGO
                        ? settings.SITE_LOGO
                        : `${process.env.NEXT_PUBLIC_ROOT_URL}/uploads/${settings.SITE_LOGO}`
                    }
                    alt="Site Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <Input
                id="siteLogo"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "SITE_LOGO")}
              />
            </div>

            <div className="space-y-2">
              <Label>Login Background</Label>
              {settings.LOGIN_BG && (
                <div className="relative w-full h-[200px] rounded-lg overflow-hidden bg-muted">
                  <img
                    src={
                      files.LOGIN_BG
                        ? settings.LOGIN_BG
                        : `${process.env.NEXT_PUBLIC_ROOT_URL}/uploads/${settings.LOGIN_BG}`
                    }
                    alt="Login Background"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <Input
                id="loginBg"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "LOGIN_BG")}
              />
            </div>

            <div className="space-y-2">
              <Label>Register Background</Label>
              {settings.REGISTER_BG && (
                <div className="relative w-full h-[200px] rounded-lg overflow-hidden bg-muted">
                  <img
                    src={
                      files.REGISTER_BG
                        ? settings.REGISTER_BG
                        : `${process.env.NEXT_PUBLIC_ROOT_URL}/uploads/${settings.REGISTER_BG}`
                    }
                    alt="Register Background"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <Input
                id="registerBg"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "REGISTER_BG")}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleSave}
              className="bg-sky-500 hover:bg-sky-600"
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isResetting}
            >
              {isResetting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isResetting ? "Resetting..." : "Reset to Default"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
