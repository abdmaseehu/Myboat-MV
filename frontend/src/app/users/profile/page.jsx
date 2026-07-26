"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/store/use-auth";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Ship,
  MapPin,
  User,
  Mail,
  Phone,
  Crown,
  Building2,
} from "lucide-react";

// Atoll options — hardcoded per spec
const ATOLL_OPTIONS = [
  "Kaafu",
  "Alifu Alifu",
  "Alifu Dhaalu",
  "Baa",
  "Dhaalu",
  "Faafu",
  "Gaafu Alifu",
  "Gaafu Dhaalu",
  "Haa Alifu",
  "Haa Dhaalu",
  "Laamu",
  "Lhaviyani",
  "Meemu",
  "Noonu",
  "Raa",
  "Seenu",
  "Shaviyani",
  "Thaa",
  "Vaavu",
  "Gnaviyani",
];

// Nationality options — value = ISO code stored on the profile,
// category is derived server-side but kept here for the info panel
const NATIONALITY_OPTIONS = [
  { code: "MDV", label: "Maldivian (Local)", category: "LOCAL" },
  {
    code: "EXP",
    label: "Expat Resident (living in Maldives with work permit)",
    category: "EXPAT",
  },
  { code: "IND", label: "India", category: "TOURIST" },
  { code: "LKA", label: "Sri Lanka", category: "TOURIST" },
  { code: "BGD", label: "Bangladesh", category: "TOURIST" },
  { code: "PAK", label: "Pakistan", category: "TOURIST" },
  { code: "CHN", label: "China", category: "TOURIST" },
  { code: "USA", label: "USA", category: "TOURIST" },
  { code: "GBR", label: "UK", category: "TOURIST" },
  { code: "DEU", label: "Germany", category: "TOURIST" },
  { code: "FRA", label: "France", category: "TOURIST" },
  { code: "ITA", label: "Italy", category: "TOURIST" },
  { code: "RUS", label: "Russia", category: "TOURIST" },
  { code: "AUS", label: "Australia", category: "TOURIST" },
  { code: "JPN", label: "Japan", category: "TOURIST" },
  { code: "KOR", label: "South Korea", category: "TOURIST" },
  { code: "ARE", label: "UAE", category: "TOURIST" },
  { code: "SAU", label: "Saudi Arabia", category: "TOURIST" },
  { code: "OTH", label: "Other", category: "TOURIST" },
];

const deriveCategory = (code) => {
  if (!code) return null;
  if (code === "MDV") return "LOCAL";
  if (code === "EXP") return "EXPAT";
  return "TOURIST";
};

const formatDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (_e) {
    return "";
  }
};

export default function UserProfilePage() {
  const router = useRouter();
  const { user: authUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [profile, setProfile] = useState({
    id: "",
    email: "",
    firstName: "",
    lastName: "",
    mobile: "",
    avatar: null,
    role: "USER",
    nationality: "",
    passengerCategory: null,
    atollCode: "",
    islandName: "",
    address: "",
    charterProSubscribedUntil: null,
  });
  const [fullName, setFullName] = useState("");
  const avatarInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/profile");
        const u = res.data?.data?.user || {};
        setProfile((prev) => ({ ...prev, ...u }));
        setFullName(
          `${u.firstName || ""} ${u.lastName || ""}`.trim()
        );
      } catch (e) {
        toast.error(
          e.response?.data?.message || "Failed to load profile"
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const derivedCategory = useMemo(
    () => deriveCategory(profile.nationality),
    [profile.nationality]
  );

  const isCharterProActive = useMemo(() => {
    if (!profile.charterProSubscribedUntil) return false;
    return new Date(profile.charterProSubscribedUntil).getTime() > Date.now();
  }, [profile.charterProSubscribedUntil]);

  const isOperator =
    profile.role === "VENDOR" || profile.role === "ADMIN" ||
    authUser?.role === "VENDOR" || authUser?.role === "ADMIN";

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large. Max 2MB.");
      return;
    }
    setIsUploadingAvatar(true);
    try {
      // Reuse the /auth/profile multipart endpoint to upload avatar
      // TODO: dedicated /users/avatar endpoint not present — using profile update
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api.put("/auth/profile", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const u = res.data?.data?.user;
      if (u) setProfile((prev) => ({ ...prev, avatar: u.avatar }));
      toast.success("Photo updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload photo");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleNationalityChange = (code) => {
    setProfile((prev) => ({
      ...prev,
      nationality: code,
      passengerCategory: deriveCategory(code),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Split fullName into first/last
      const trimmed = (fullName || "").trim().replace(/\s+/g, " ");
      const parts = trimmed.length ? trimmed.split(" ") : [];
      const firstName =
        parts.length > 0 ? parts[0] : profile.firstName || "";
      const lastName =
        parts.length > 1 ? parts.slice(1).join(" ") : profile.lastName || "";

      const payload = {
        firstName,
        lastName,
        mobile: profile.mobile || "",
        nationality: profile.nationality || null,
        passengerCategory: deriveCategory(profile.nationality),
        atollCode: profile.atollCode || null,
        islandName: profile.islandName || null,
        address: profile.address || null,
      };

      const res = await api.put("/auth/profile", payload);
      const u = res.data?.data?.user;
      if (u) {
        setProfile((prev) => ({ ...prev, ...u }));
        setFullName(`${u.firstName || ""} ${u.lastName || ""}`.trim());
      }
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      // TODO: /users/subscribe-charter-pro endpoint not implemented on backend yet
      await new Promise((r) => setTimeout(r, 500));
      toast.info("Subscription flow — pending Stripe integration");
    } catch (err) {
      toast.error("Failed to start subscription");
    } finally {
      setIsSubscribing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  const initial = (profile.firstName || profile.email || "?")
    .charAt(0)
    .toUpperCase();
  const avatarUrl = profile.avatar
    ? `${process.env.NEXT_PUBLIC_ROOT_URL || ""}${profile.avatar}`
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Profile Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and pricing preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-sky-500" />
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-tr from-sky-500 to-sky-600 flex items-center justify-center text-white text-2xl font-semibold">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="border-sky-500 text-sky-600 hover:bg-sky-50"
                >
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Photo"
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG or GIF. Max 2MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-sky-500" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email || ""}
                readOnly
                disabled
                className="bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone Number
              </Label>
              <Input
                id="mobile"
                type="tel"
                value={profile.mobile || ""}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, mobile: e.target.value }))
                }
                placeholder="Enter your mobile number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location & Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-sky-500" />
              Location & Address
            </CardTitle>
            <CardDescription>
              Your residential location in Maldives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="atollCode">Atoll</Label>
              <Select
                value={profile.atollCode || ""}
                onValueChange={(v) =>
                  setProfile((prev) => ({ ...prev, atollCode: v }))
                }
              >
                <SelectTrigger id="atollCode">
                  <SelectValue placeholder="e.g., Kaafu Atoll" />
                </SelectTrigger>
                <SelectContent>
                  {ATOLL_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="islandName">Island Name</Label>
              <Input
                id="islandName"
                value={profile.islandName || ""}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    islandName: e.target.value,
                  }))
                }
                placeholder="e.g., Maafushi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={profile.address || ""}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Enter your full address"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ship className="h-5 w-5 text-sky-500" />
              Pricing Category
            </CardTitle>
            <CardDescription>
              Your nationality determines your fare category for ferry services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Select
                value={profile.nationality || ""}
                onValueChange={handleNationalityChange}
              >
                <SelectTrigger id="nationality">
                  <SelectValue placeholder="Select your nationality" />
                </SelectTrigger>
                <SelectContent>
                  {NATIONALITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.code} value={opt.code}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(() => {
              if (!derivedCategory) {
                return (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Select your nationality above to see pricing options
                  </div>
                );
              }
              const map = {
                LOCAL: {
                  dot: "bg-green-500",
                  border: "border-green-200 bg-green-50 dark:bg-green-950/30",
                  text: "text-green-800 dark:text-green-200",
                  label: "Local — Pay in MVR at local rate",
                },
                EXPAT: {
                  dot: "bg-sky-500",
                  border: "border-sky-200 bg-sky-50 dark:bg-sky-950/30",
                  text: "text-sky-800 dark:text-sky-200",
                  label: "Expat Resident — Pay in MVR at expat rate",
                },
                TOURIST: {
                  dot: "bg-orange-500",
                  border: "border-orange-200 bg-orange-50 dark:bg-orange-950/30",
                  text: "text-orange-800 dark:text-orange-200",
                  label: "Tourist — Pay in USD at tourist rate",
                },
              };
              const info = map[derivedCategory];
              return (
                <div
                  className={`rounded-lg border p-4 flex items-center gap-3 ${info.border}`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${info.dot}`}
                  />
                  <span className={`font-medium ${info.text}`}>
                    {info.label}
                  </span>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Charter Pro Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-sky-500" />
              Charter Pro Subscription
            </CardTitle>
            <CardDescription>
              Subscribe to view operator contact information when comparing
              charter quotations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCharterProActive ? (
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 p-4">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-200">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Active until{" "}
                  {formatDate(profile.charterProSubscribedUntil)}
                </span>
                <button
                  type="button"
                  className="text-sm font-medium text-sky-600 hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Subscription management coming soon");
                  }}
                >
                  Manage Subscription
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 p-4">
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                  No Active Subscription
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Subscribe to view operator contact details in charter
                  quotations
                </p>
              </div>
            )}

            <Card className="border-sky-200 bg-sky-50/40 dark:bg-sky-950/20">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    <Crown className="h-4 w-4 text-sky-500" />
                    Charter Pro
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Access to contact information for private charter requests
                    and quotations
                  </p>
                  <p className="text-2xl font-bold mt-2 text-sky-700 dark:text-sky-300">
                    500 MVR
                    <span className="text-sm font-normal text-muted-foreground">
                      /month
                    </span>
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={isSubscribing || isCharterProActive}
                  className="bg-sky-500 hover:bg-sky-600 text-white"
                >
                  {isSubscribing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCharterProActive ? (
                    "Subscribed"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Become an Operator */}
        {!isOperator && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-sky-500" />
                Become an Operator
              </CardTitle>
              <CardDescription>
                Register as a ferry/speedboat operator to manage vessels,
                routes, and bookings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-sky-500">•</span>
                  Manage your vessels and schedules
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-500">•</span>
                  Accept bookings from customers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-500">•</span>
                  Track revenue and commissions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-500">•</span>
                  Handle charter and logistics requests
                </li>
              </ul>
              <Link href="/users/become-operator" className="block">
                <Button
                  type="button"
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Become an Operator
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Save */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
