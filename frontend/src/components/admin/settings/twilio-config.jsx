"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

export default function TwilioConfig() {
  const [settings, setSettings] = useState({
    TWILIO_ACCOUNT_SID: "",
    TWILIO_AUTH_TOKEN: "",
    TWILIO_PHONE_NUMBER: "",
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
      toast.error("Failed to fetch Twilio settings");
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
      toast.success("Twilio settings saved successfully");
    } catch (error) {
      toast.error("Failed to save Twilio settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const defaultSettings = {
        TWILIO_ACCOUNT_SID: "AC_REPLACE_ME",
        TWILIO_AUTH_TOKEN: "c685e7431c0ba101b83850f9ad25e5df",
        TWILIO_PHONE_NUMBER: "+14632823556",
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
      toast.success("Twilio settings reset to default values");
    } catch (error) {
      toast.error("Failed to reset Twilio settings");
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
          <h3 className="text-lg font-semibold">Twilio Configuration</h3>
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
            <Label htmlFor="accountSid">Account SID</Label>
            <Input
              id="accountSid"
              value={settings.TWILIO_ACCOUNT_SID}
              onChange={(e) =>
                handleChange("TWILIO_ACCOUNT_SID", e.target.value)
              }
              placeholder="Enter Twilio Account SID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authToken">Auth Token</Label>
            <Input
              id="authToken"
              type="password"
              value={settings.TWILIO_AUTH_TOKEN}
              onChange={(e) =>
                handleChange("TWILIO_AUTH_TOKEN", e.target.value)
              }
              placeholder="Enter Twilio Auth Token"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={settings.TWILIO_PHONE_NUMBER}
              onChange={(e) =>
                handleChange("TWILIO_PHONE_NUMBER", e.target.value)
              }
              placeholder="Enter Twilio Phone Number"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
