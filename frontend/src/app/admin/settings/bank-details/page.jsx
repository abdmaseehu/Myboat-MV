"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import {
  Coins,
  DollarSign,
  Landmark,
  Loader2,
  Crown,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

const KEYS = {
  MVR_NAME: "ADMIN_BANK_MVR_NAME",
  MVR_HOLDER: "ADMIN_BANK_MVR_HOLDER",
  MVR_ACCOUNT: "ADMIN_BANK_MVR_ACCOUNT",
  USD_NAME: "ADMIN_BANK_USD_NAME",
  USD_HOLDER: "ADMIN_BANK_USD_HOLDER",
  USD_ACCOUNT: "ADMIN_BANK_USD_ACCOUNT",
  CP_PRICE: "CHARTER_PRO_PRICE_MVR",
  CP_DAYS: "CHARTER_PRO_DURATION_DAYS",
};

export default function BankDetailsPage() {
  const [values, setValues] = useState({
    [KEYS.MVR_NAME]: "",
    [KEYS.MVR_HOLDER]: "",
    [KEYS.MVR_ACCOUNT]: "",
    [KEYS.USD_NAME]: "",
    [KEYS.USD_HOLDER]: "",
    [KEYS.USD_ACCOUNT]: "",
    [KEYS.CP_PRICE]: "500",
    [KEYS.CP_DAYS]: "30",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Settings", href: "/admin/settings" },
    { label: "Bank Details" },
  ];

  const fetchAll = async () => {
    try {
      setLoading(true);
      const keys = Object.values(KEYS);
      const results = await Promise.allSettled(
        keys.map((k) => api.get(`/settings/key/${k}`))
      );
      const next = { ...values };
      results.forEach((res, i) => {
        if (res.status === "fulfilled") {
          const v = res.value?.data?.data?.value;
          if (typeof v !== "undefined") next[keys[i]] = v;
        }
      });
      setValues(next);
    } catch (e) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => {
    const v = e?.target?.value ?? "";
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const items = Object.entries(values).map(([key, value]) => ({
        key,
        value: String(value ?? ""),
        type: "TEXT",
      }));
      await api.put("/settings/bulk", { items });
      toast.success("Settings saved");
    } catch (err) {
      // Fallback to per-key PUT if bulk endpoint isn't available
      try {
        await Promise.all(
          Object.entries(values).map(([key, value]) =>
            api.put(`/settings/key/${key}`, {
              value: String(value ?? ""),
              type: "TEXT",
            })
          )
        );
        toast.success("Settings saved");
      } catch (e2) {
        toast.error(e2?.response?.data?.message || "Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <BreadcrumbNav items={breadcrumbs} />
        <div className="flex items-center gap-2 mt-2">
          <Landmark className="h-6 w-6 text-sky-500" />
          <h2 className="text-2xl font-bold tracking-tight">
            Platform Bank Details
          </h2>
        </div>
        <p className="text-muted-foreground mt-1">
          Configure your platform&apos;s MVR and USD bank accounts. These are
          used for operator payouts and refunds. MVR and USD accounts are
          handled independently.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* MVR Account (green accent) */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-500" />
              <CardTitle>MVR Account</CardTitle>
            </div>
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
              MVR
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mvr-name">Bank Name</Label>
              <Input
                id="mvr-name"
                value={values[KEYS.MVR_NAME] || ""}
                onChange={set(KEYS.MVR_NAME)}
                placeholder="Bank of Maldives"
              />
            </div>
            <div>
              <Label htmlFor="mvr-holder">Account Holder Name</Label>
              <Input
                id="mvr-holder"
                value={values[KEYS.MVR_HOLDER] || ""}
                onChange={set(KEYS.MVR_HOLDER)}
                placeholder="Myboat Pvt Ltd"
              />
            </div>
            <div>
              <Label htmlFor="mvr-account">Account Number</Label>
              <Input
                id="mvr-account"
                value={values[KEYS.MVR_ACCOUNT] || ""}
                onChange={set(KEYS.MVR_ACCOUNT)}
                placeholder="7730000000000"
              />
            </div>
          </CardContent>
        </Card>

        {/* USD Account (blue accent) */}
        <Card className="border-l-4 border-l-sky-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-sky-500" />
              <CardTitle>USD Account</CardTitle>
            </div>
            <Badge className="bg-sky-500 hover:bg-sky-600 text-white">
              USD
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="usd-name">Bank Name</Label>
              <Input
                id="usd-name"
                value={values[KEYS.USD_NAME] || ""}
                onChange={set(KEYS.USD_NAME)}
                placeholder="Bank of Maldives (USD)"
              />
            </div>
            <div>
              <Label htmlFor="usd-holder">Account Holder Name</Label>
              <Input
                id="usd-holder"
                value={values[KEYS.USD_HOLDER] || ""}
                onChange={set(KEYS.USD_HOLDER)}
                placeholder="Myboat Pvt Ltd"
              />
            </div>
            <div>
              <Label htmlFor="usd-account">Account Number</Label>
              <Input
                id="usd-account"
                value={values[KEYS.USD_ACCOUNT] || ""}
                onChange={set(KEYS.USD_ACCOUNT)}
                placeholder="7770000000000"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charter Pro pricing */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Crown className="h-5 w-5 text-amber-500" />
          <CardTitle>Charter Pro Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div>
            <Label htmlFor="cp-price">Price (MVR / period)</Label>
            <Input
              id="cp-price"
              type="number"
              min="0"
              value={values[KEYS.CP_PRICE] || ""}
              onChange={set(KEYS.CP_PRICE)}
              placeholder="500"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Charter Pro is billed in MVR only.
            </p>
          </div>
          <div>
            <Label htmlFor="cp-days">Duration (days)</Label>
            <Input
              id="cp-days"
              type="number"
              min="1"
              value={values[KEYS.CP_DAYS] || ""}
              onChange={set(KEYS.CP_DAYS)}
              placeholder="30"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-sky-500 hover:bg-sky-600"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
