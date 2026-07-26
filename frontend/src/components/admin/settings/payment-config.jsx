"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

export default function PaymentConfig() {
  const [settings, setSettings] = useState({
    STRIPE_SECRET_KEY: "",
    STRIPE_PUBLISHABLE_KEY: "",
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
      toast.error("Failed to fetch payment settings");
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(settings).map(([key, value]) => {
        return api.post("/settings", {
          keyName: key,
          value: value,
          type: "TEXT",
        });
      });

      await Promise.all(promises);
      toast.success("Payment settings saved successfully");
    } catch (error) {
      toast.error("Failed to save payment settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const defaultSettings = {
        STRIPE_SECRET_KEY:
          "sk_test_REPLACE_ME",
        STRIPE_PUBLISHABLE_KEY:
          "pk_test_REPLACE_ME",
      };

      const promises = Object.entries(defaultSettings).map(([key, value]) => {
        return api.post("/settings", {
          keyName: key,
          value: value,
          type: "TEXT",
        });
      });

      await Promise.all(promises);
      await fetchSettings();
      toast.success("Payment settings reset to default values");
    } catch (error) {
      toast.error("Failed to reset payment settings");
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Payment Configuration</h3>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleReset}
              disabled={isResetting || isSaving}
              variant="outline"
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isResetting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Reset to Default
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving || isResetting}
              className="bg-sky-500 text-white hover:bg-sky-600"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secretKey">Secret Key</Label>
            <Input
              id="secretKey"
              type="password"
              value={settings.STRIPE_SECRET_KEY}
              onChange={(e) =>
                handleChange("STRIPE_SECRET_KEY", e.target.value)
              }
              placeholder="Enter Stripe Secret Key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publishableKey">Publishable Key</Label>
            <Input
              id="publishableKey"
              value={settings.STRIPE_PUBLISHABLE_KEY}
              onChange={(e) =>
                handleChange("STRIPE_PUBLISHABLE_KEY", e.target.value)
              }
              placeholder="Enter Stripe Publishable Key"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
