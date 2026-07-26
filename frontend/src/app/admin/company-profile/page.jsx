"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Upload,
  Copy,
  ExternalLink,
  Trash2,
  Plus,
  GripVertical,
  HelpCircle,
  Share2,
  Landmark,
  DollarSign,
  Loader2,
} from "lucide-react";
import api from "@/lib/axios";

const PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://myboat-mv.vercel.app";

const kebab = (v) =>
  String(v || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const genId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `faq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function CompanyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vessels, setVessels] = useState([]);
  const [form, setForm] = useState({
    businessName: "",
    businessLogo: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    baseIsland: "",
    termsConditions: "",
    cancellationPolicy: "",
    publicSlug: "",
    bankMvrName: "",
    bankMvrHolder: "",
    bankMvrAccount: "",
    bankUsdName: "",
    bankUsdHolder: "",
    bankUsdAccount: "",
    faqs: [],
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [embedType, setEmbedType] = useState("all");
  const [embedVesselId, setEmbedVesselId] = useState("");

  // Load vendor + vessels
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/vendors/me");
        const v = res.data?.data;
        if (v) {
          setForm({
            businessName: v.businessName || "",
            businessLogo: v.businessLogo || "",
            description: v.description || "",
            contactEmail: v.contactEmail || "",
            contactPhone: v.contactPhone || "",
            baseIsland: v.baseIsland || "",
            termsConditions: v.termsConditions || "",
            cancellationPolicy: v.cancellationPolicy || "",
            publicSlug: v.publicSlug || "",
            bankMvrName: v.bankMvrName || "",
            bankMvrHolder: v.bankMvrHolder || "",
            bankMvrAccount: v.bankMvrAccount || "",
            bankUsdName: v.bankUsdName || "",
            bankUsdHolder: v.bankUsdHolder || "",
            bankUsdAccount: v.bankUsdAccount || "",
            faqs: Array.isArray(v.faqs) ? v.faqs : [],
          });
          if (v.businessLogo) {
            setLogoPreview(
              v.businessLogo.startsWith("http")
                ? v.businessLogo
                : `${process.env.NEXT_PUBLIC_ROOT_URL || ""}${v.businessLogo}`
            );
          }
        }
        // Load vessels (VENDOR-scoped list from /vehicles)
        try {
          const vs = await api.get("/vehicles?limit=100");
          const list =
            vs.data?.data?.vehicles ||
            vs.data?.data ||
            vs.data?.vehicles ||
            [];
          setVessels(Array.isArray(list) ? list : []);
        } catch (_) {
          setVessels([]);
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (k) => (e) => {
    const v = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const onSlugChange = (e) => {
    setForm((f) => ({ ...f, publicSlug: kebab(e.target.value) }));
  };

  const onLogoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      toast.error("Logo must be under 512KB");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // FAQ handlers
  const addFaq = () =>
    setForm((f) => ({
      ...f,
      faqs: [...f.faqs, { id: genId(), question: "", answer: "" }],
    }));
  const updateFaq = (id, patch) =>
    setForm((f) => ({
      ...f,
      faqs: f.faqs.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  const removeFaq = (id) =>
    setForm((f) => ({ ...f, faqs: f.faqs.filter((it) => it.id !== id) }));

  const publicUrl = form.publicSlug
    ? `${PUBLIC_APP_URL}/o/${form.publicSlug}`
    : "";
  const embedUrl = form.publicSlug
    ? embedType === "single" && embedVesselId
      ? `${PUBLIC_APP_URL}/embed/vessel/${embedVesselId}`
      : `${PUBLIC_APP_URL}/embed/operator/${form.publicSlug}`
    : "";
  const embedSnippet = embedUrl
    ? `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`
    : "";

  const copy = async (txt, label) => {
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "faqs") fd.append("faqs", JSON.stringify(v || []));
        else if (v === null || v === undefined) return;
        else fd.append(k, v);
      });
      if (fileInputRef.current?.files?.[0]) {
        fd.append("businessLogo", fileInputRef.current.files[0]);
      }
      const res = await api.put("/vendors/me", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const v = res.data?.data;
      if (v?.businessLogo) {
        setForm((f) => ({ ...f, businessLogo: v.businessLogo }));
        setLogoPreview(
          v.businessLogo.startsWith("http")
            ? v.businessLogo
            : `${process.env.NEXT_PUBLIC_ROOT_URL || ""}${v.businessLogo}`
        );
      }
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <Toaster position="top-center" richColors />

      {/* Card 1: Company Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-500/10 p-2">
              <Building2 className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>
                Manage your company information and branding
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-sky-200 bg-sky-50/30 flex items-center justify-center">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 className="h-10 w-10 text-sky-400" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-fit gap-2"
                >
                  <Upload className="h-4 w-4" /> Upload Logo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={onLogoPick}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: Square image, max 512KB. PNG or JPG format
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="businessName">Company Name</Label>
            <Input
              id="businessName"
              value={form.businessName}
              onChange={set("businessName")}
              placeholder="Your company name"
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={set("description")}
              placeholder="Tell customers about your company and services..."
            />
          </div>

          {/* Contact */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={set("contactEmail")}
                placeholder="contact@company.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={form.contactPhone}
                onChange={set("contactPhone")}
                placeholder="+960 xxxxxxx"
              />
            </div>
          </div>

          {/* Bank Details */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-zinc-600" />
              <div>
                <h3 className="font-semibold">
                  Bank Details (for Bank Transfer Payments)
                </h3>
                <p className="text-xs text-muted-foreground">
                  These details will be shown to customers who select bank
                  transfer as their payment method.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* MVR */}
              <div className="rounded-lg border-2 border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-emerald-500 p-1.5 text-white">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-800 dark:text-emerald-300">
                        MVR
                      </h4>
                      <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/70">
                        Local Currency
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500 hover:bg-emerald-600">MVR</Badge>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Bank Name</Label>
                  <Input
                    value={form.bankMvrName}
                    onChange={set("bankMvrName")}
                    placeholder="e.g., Bank of Maldives"
                    className="bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Account Name / Holder</Label>
                  <Input
                    value={form.bankMvrHolder}
                    onChange={set("bankMvrHolder")}
                    className="bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Account Number</Label>
                  <Input
                    value={form.bankMvrAccount}
                    onChange={set("bankMvrAccount")}
                    className="bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              {/* USD */}
              <div className="rounded-lg border-2 border-sky-500/40 bg-sky-50/40 dark:bg-sky-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-sky-500 p-1.5 text-white">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sky-800 dark:text-sky-300">
                        USD
                      </h4>
                      <p className="text-[11px] text-sky-700/70 dark:text-sky-400/70">
                        Foreign Currency
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-sky-500 hover:bg-sky-600">USD</Badge>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Bank Name</Label>
                  <Input
                    value={form.bankUsdName}
                    onChange={set("bankUsdName")}
                    placeholder="e.g., HSBC, Maldives Islamic Bank USD"
                    className="bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Account Name / Holder</Label>
                  <Input
                    value={form.bankUsdHolder}
                    onChange={set("bankUsdHolder")}
                    className="bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Account Number</Label>
                  <Input
                    value={form.bankUsdAccount}
                    onChange={set("bankUsdAccount")}
                    className="bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              USD and MVR transactions are handled independently. Ensure both
              bank accounts are set up if you accept both currencies.
            </p>
          </div>

          {/* Base island */}
          <div className="grid gap-2">
            <Label htmlFor="baseIsland">Base Island</Label>
            <Input
              id="baseIsland"
              value={form.baseIsland}
              onChange={set("baseIsland")}
              placeholder="e.g., Dhangethi"
            />
          </div>

          {/* Terms */}
          <div className="grid gap-2">
            <Label htmlFor="terms">Terms &amp; Conditions</Label>
            <Textarea
              id="terms"
              rows={4}
              value={form.termsConditions}
              onChange={set("termsConditions")}
            />
          </div>

          {/* Cancellation */}
          <div className="grid gap-2">
            <Label htmlFor="cancel">Cancellation Policy</Label>
            <Textarea
              id="cancel"
              rows={4}
              value={form.cancellationPolicy}
              onChange={set("cancellationPolicy")}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={!form.publicSlug}
              asChild={!!form.publicSlug}
            >
              {form.publicSlug ? (
                <a
                  href={`/o/${form.publicSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Preview Public Profile
                </a>
              ) : (
                <span>
                  <ExternalLink className="mr-2 h-4 w-4" /> Preview Public Profile
                </span>
              )}
            </Button>
            <Button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-sky-500 text-white hover:bg-sky-600"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Share Your Vessels */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-500/10 p-2">
              <Share2 className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <CardTitle>Share Your Vessels</CardTitle>
              <CardDescription>
                Share your vessels on social media or embed them on your website
                for real-time booking
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="url" className="w-full">
            <TabsList>
              <TabsTrigger value="url">Public URL</TabsTrigger>
              <TabsTrigger value="embed">Embed Widget</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label>Custom URL Slug</Label>
                <div className="flex items-stretch">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                    {PUBLIC_APP_URL}/o/
                  </span>
                  <Input
                    value={form.publicSlug}
                    onChange={onSlugChange}
                    placeholder="my-company"
                    className="rounded-l-none"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Only lowercase letters, numbers, and dashes.
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Full URL</Label>
                <div className="flex gap-2">
                  <Input readOnly value={publicUrl} placeholder="Set a slug above" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copy(publicUrl, "URL")}
                    disabled={!publicUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!publicUrl}
                    asChild={!!publicUrl}
                  >
                    {publicUrl ? (
                      <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" /> Open in New Tab
                      </a>
                    ) : (
                      <span>
                        <ExternalLink className="mr-2 h-4 w-4" /> Open in New Tab
                      </span>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link on social media, WhatsApp, or your website.
                  Customers can view all your vessels and book directly.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="embed" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Widget Type</Label>
                <RadioGroup
                  value={embedType}
                  onValueChange={setEmbedType}
                  className="flex flex-col gap-2 sm:flex-row sm:gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="all" id="w-all" />
                    <Label htmlFor="w-all" className="cursor-pointer">
                      All Vessels
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="single" id="w-single" />
                    <Label htmlFor="w-single" className="cursor-pointer">
                      Single Vessel
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {embedType === "single" && (
                <div className="grid gap-2">
                  <Label>Select Vessel</Label>
                  <Select value={embedVesselId} onValueChange={setEmbedVesselId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a vessel" />
                    </SelectTrigger>
                    <SelectContent>
                      {vessels.length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No vessels
                        </div>
                      )}
                      {vessels.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.vehicleName || v.vehicleNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Embed Snippet</Label>
                <textarea
                  readOnly
                  value={embedSnippet}
                  rows={4}
                  className="w-full rounded-md border bg-muted/40 p-3 font-mono text-xs"
                />
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copy(embedSnippet, "Embed code")}
                    disabled={!embedSnippet}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" /> Copy Embed Code
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Card 3: FAQ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-500/10 p-2">
              <HelpCircle className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <CardTitle>FAQ Management</CardTitle>
              <CardDescription>
                Customize frequently asked questions shown on your public
                profile. Drag to reorder.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.faqs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-10 text-center">
              <HelpCircle className="h-8 w-8 text-muted-foreground/60" />
              <p className="font-medium">No FAQs added yet</p>
              <p className="text-sm text-muted-foreground">
                Add common questions to help customers
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {form.faqs.map((f) => (
                <li
                  key={f.id}
                  className="flex items-start gap-2 rounded-lg border bg-card p-3"
                >
                  {/* TODO: add drag-reorder later */}
                  <button
                    type="button"
                    className="mt-2 cursor-grab text-muted-foreground/60 hover:text-muted-foreground"
                    aria-label="drag handle"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={f.question}
                      onChange={(e) =>
                        updateFaq(f.id, { question: e.target.value })
                      }
                      placeholder="Question"
                    />
                    <Textarea
                      rows={2}
                      value={f.answer}
                      onChange={(e) =>
                        updateFaq(f.id, { answer: e.target.value })
                      }
                      placeholder="Answer"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFaq(f.id)}
                    className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={addFaq}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add FAQ
          </Button>
          <p className="text-xs text-muted-foreground">
            FAQ changes are saved when you click <b>Save Changes</b> at the top.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
