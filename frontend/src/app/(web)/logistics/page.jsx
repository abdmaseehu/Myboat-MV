"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuth } from "@/store/use-auth";
import {
  Truck,
  MapPin,
  Package,
  User,
  CheckCircle2,
  Ship,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CARGO_TYPES = [
  "General Cargo",
  "Food Supplies",
  "Construction Materials",
  "Vehicles",
  "Livestock",
  "Refrigerated",
  "Other",
];

const schema = z.object({
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  tripDate: z.string().min(1, "Trip date is required"),
  cargoType: z.string().min(1, "Cargo type is required"),
  weightKg: z.string().optional().or(z.literal("")),
  volumeM3: z.string().optional().or(z.literal("")),
  cargoDescription: z.string().min(1, "Please describe your cargo"),
  guestName: z.string().min(1, "Your name is required"),
  guestEmail: z.string().email("Enter a valid email"),
  guestPhone: z.string().optional().or(z.literal("")),
  specialRequirements: z.string().optional().or(z.literal("")),
});

const today = () => new Date().toISOString().slice(0, 10);

export default function LogisticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [operators, setOperators] = useState([]);
  // "" = broadcast to every operator (the recommended default)
  const [vendorId, setVendorId] = useState("");
  // "Request Boat MV": goes to Myboat staff, not the operator broadcast.
  const [adminDirect, setAdminDirect] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      origin: "",
      destination: "",
      tripDate: "",
      cargoType: "",
      weightKg: "",
      volumeM3: "",
      cargoDescription: "",
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      specialRequirements: "",
    },
  });

  useEffect(() => {
    if (user) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
      if (name) setValue("guestName", name);
      if (user.email) setValue("guestEmail", user.email);
      if (user.phone) setValue("guestPhone", user.phone);
    }
  }, [user, setValue]);

  // Prefill from a logistics search. "Request Boat MV" links here with no
  // vendor, which the submit handler already treats as a broadcast request.
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    if (qs.get("adminDirect") === "1") setAdminDirect(true);
    const from = qs.get("from");
    const to = qs.get("to");
    const date = qs.get("date");
    const cargo = qs.get("cargoType");
    const tons = Number(qs.get("tons"));
    if (from) setValue("origin", from);
    if (to) setValue("destination", to);
    if (date) setValue("tripDate", date);
    if (cargo) setValue("cargoType", cargo);
    // The search asks for tons; this form stores kilograms.
    if (tons > 0) setValue("weightKg", String(tons * 1000));
  }, [setValue]);

  // Load approved operators + honour ?operator=<publicSlug> deep links.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/vendors/public");
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        if (cancelled) return;
        setOperators(list);
        const qs0 = new URLSearchParams(window.location.search);
        const vendor = qs0.get("vendor");
        if (vendor && list.some((o) => o.id === vendor)) setVendorId(vendor);
        const slug = qs0.get("operator");
        if (slug) {
          const match = list.find(
            (o) => (o.publicSlug || "").toLowerCase() === slug.toLowerCase()
          );
          if (match) setVendorId(match.id);
        }
      } catch {
        // Non-fatal: the form still works as a broadcast request.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (values) => {
    if (!user) {
      router.push("/auth/login?returnTo=/logistics");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        origin: values.origin,
        destination: values.destination,
        tripDate: values.tripDate,
        cargoType: values.cargoType,
        weightKg: values.weightKg || null,
        volumeM3: values.volumeM3 || null,
        cargoDescription: values.cargoDescription,
        guestName: values.guestName,
        guestEmail: values.guestEmail,
        guestPhone: values.guestPhone || null,
        specialRequirements: values.specialRequirements || null,
        // "" -> null = broadcast to all operators
        vendorId: adminDirect ? null : vendorId || null,
        adminDirect,
      };
      await api.post("/logistics-requests", payload);
      setSuccess(true);
      reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-ocean-gradient text-white isolate">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-35 mix-blend-overlay"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1494412651409-8dd18a7ca6e5?q=80&w=2000&auto=format&fit=crop')",
          }}
        />
        <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-lagoon-light/25 blur-3xl animate-drift" />
        <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-coral/25 blur-3xl animate-drift" style={{ animationDelay: "-6s" }} />

        <div className="container-x pt-32 md:pt-40 pb-24 md:pb-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <span className="chip glass text-white uppercase tracking-[0.22em]">
              <Truck className="h-3 w-3" /> Logistics
            </span>
            <h1
              className="mt-6 text-5xl md:text-7xl lg:text-8xl font-light italic leading-[0.98] text-balance"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              Move cargo,
              <br />
              <span className="text-gradient-lagoon not-italic font-normal">island to island.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/85 max-w-xl">
              Bulk goods, supplies, and equipment delivered to any inhabited island. Quotes from trusted logistics operators.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container-x -mt-16 md:-mt-24 pb-16 md:pb-24 relative z-10">
        {success ? (
          <SuccessCard user={user} onNew={() => setSuccess(false)} />
        ) : (
          <div className="grid lg:grid-cols-5 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-28 lg:self-start">
              <div className="glass-white rounded-3xl p-8 shadow-premium">
                <div className="flex items-center gap-2 text-lagoon font-medium mb-4">
                  <Truck className="h-5 w-5" />
                  Why ship with Myboat?
                </div>
                <ul className="space-y-3 text-sm">
                  {[
                    "Handle any cargo — bulk, fragile, refrigerated",
                    "Reach any inhabited island in the Maldives",
                    "Compare quotes from vetted operators",
                    "Simple, transparent pricing — no surprises",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-lagoon mt-0.5 shrink-0" />
                      <span className="text-ocean/80">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-sunset-gradient text-white rounded-3xl p-8 shadow-premium">
                <div className="flex items-center gap-2 font-medium mb-2">
                  <Ship className="h-5 w-5" />
                  Every operator vetted
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                  Our logistics partners carry proper permits and insurance so your cargo is handled with care.
                </p>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="glass-white rounded-3xl shadow-premium p-6 md:p-10">
                <div className="mb-8">
                  <h2
                    className="text-3xl md:text-4xl italic font-light text-ocean-deep leading-tight"
                    style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
                  >
                    Request cargo quotes
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Describe your shipment — operators respond with quotes quickly.
                  </p>
                  {!user && (
                    <p className="text-xs text-coral mt-3">
                      You&apos;ll need to log in to submit.
                    </p>
                  )}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  <FormSection title="Trip Details" icon={MapPin}>
                    <FormRow>
                      <Field label="From" required error={errors.origin?.message}>
                        <StyledInput placeholder="Origin island e.g. Malé" {...register("origin")} />
                      </Field>
                      <Field label="To" required error={errors.destination?.message}>
                        <StyledInput placeholder="Destination island" {...register("destination")} />
                      </Field>
                    </FormRow>
                    <FormRow>
                      <Field label="Trip Date" required error={errors.tripDate?.message}>
                        <StyledInput type="date" min={today()} {...register("tripDate")} />
                      </Field>
                      <div />
                    </FormRow>
                  </FormSection>

                  <FormSection title="Cargo" icon={Package}>
                    <Field label="Cargo Type" required error={errors.cargoType?.message}>
                      <Controller
                        control={control}
                        name="cargoType"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-12 rounded-2xl border-border/60 bg-white">
                              <SelectValue placeholder="Select cargo type" />
                            </SelectTrigger>
                            <SelectContent>
                              {CARGO_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </Field>
                    <FormRow>
                      <Field label="Weight (kg)" hint="Optional">
                        <StyledInput type="number" min="0" step="0.1" {...register("weightKg")} />
                      </Field>
                      <Field label="Volume (m³)" hint="Optional">
                        <StyledInput type="number" min="0" step="0.1" {...register("volumeM3")} />
                      </Field>
                    </FormRow>
                    <Field label="Cargo Description" required error={errors.cargoDescription?.message}>
                      <Textarea
                        rows={4}
                        placeholder="Describe what you're shipping..."
                        className="rounded-2xl border-border/60 bg-white"
                        {...register("cargoDescription")}
                      />
                    </Field>
                  </FormSection>

                  <FormSection title="Contact" icon={User}>
                    <FormRow>
                      <Field label="Full Name" required error={errors.guestName?.message}>
                        <StyledInput {...register("guestName")} />
                      </Field>
                      <Field label="Email" required error={errors.guestEmail?.message}>
                        <StyledInput type="email" {...register("guestEmail")} />
                      </Field>
                    </FormRow>
                    <FormRow>
                      <Field label="Phone" hint="Recommended">
                        <StyledInput {...register("guestPhone")} />
                      </Field>
                      <div />
                    </FormRow>
                  </FormSection>

                  <FormSection title="Additional" icon={Sparkles}>
                    <Field label="Special Requirements">
                      <Textarea
                        rows={3}
                        placeholder="e.g. refrigeration, careful handling, loading assistance..."
                        className="rounded-2xl border-border/60 bg-white"
                        {...register("specialRequirements")}
                      />
                    </Field>
                  </FormSection>

                  {adminDirect ? (
                    <FormSection title="Handled by Myboat" icon={Ship}>
                      <div className="rounded-2xl border border-lagoon/30 bg-foam/50 p-4">
                        <p className="text-sm text-ocean-deep font-medium">
                          This request goes straight to the Myboat team.
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          We&apos;ll search across every operator in the Maldives
                          and come back to you with a boat and a price. No
                          operator is contacted directly.
                        </p>
                      </div>
                    </FormSection>
                  ) : (
                  <FormSection title="Preferred Operator" icon={Ship}>
                    <Field
                      label="Send this request to"
                      hint="Broadcasting to every operator usually gets you more quotes to compare."
                    >
                      <Select value={vendorId || "ANY"} onValueChange={(v) => setVendorId(v === "ANY" ? "" : v)}>
                        <SelectTrigger className="h-12 rounded-2xl border-border/60 bg-white text-ocean-deep focus:ring-lagoon">
                          <SelectValue placeholder="Any operator" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="ANY">
                            Any operator (recommended — get more quotes)
                          </SelectItem>
                          {operators.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.businessName}
                              {o.baseIsland ? ` — ${o.baseIsland}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FormSection>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-14 text-base bg-coral hover:bg-coral-soft text-white rounded-full shadow-coral tracking-wide"
                  >
                    {!user
                      ? "Log In to Request Quotes"
                      : submitting
                      ? "Submitting..."
                      : "Request Quotes"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="section-padding bg-foam">
        <div className="container-x">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="chip bg-white text-lagoon uppercase tracking-[0.2em]">Process</span>
            <h2
              className="mt-5 text-4xl md:text-5xl italic font-light text-ocean-deep leading-tight"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              From dock to destination.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            <Step n="01" title="Describe your cargo" desc="Tell us what, where, and when." />
            <Step n="02" title="Compare operator quotes" desc="Get pricing from multiple logistics partners." />
            <Step n="03" title="Ship with confidence" desc="Choose the right operator and track your shipment." />
          </div>
        </div>
      </section>
    </div>
  );
}

function StyledInput(props) {
  return (
    <Input
      {...props}
      className="h-12 rounded-2xl border-border/60 bg-white text-ocean-deep placeholder:text-muted-foreground focus-visible:ring-lagoon"
    />
  );
}

function FormSection({ title, icon: Icon, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
        {Icon && <Icon className="h-4 w-4 text-lagoon" />}
        <h3 className="text-[11px] font-medium text-ocean-deep uppercase tracking-[0.22em]">
          {title}
        </h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FormRow({ children }) {
  return <div className="grid md:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, required, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-ocean-deep">
        {label} {required && <span className="text-coral">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-[11px] text-coral">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Step({ n, title, desc }) {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-premium border border-border/40 hover-lift">
      <div className="text-coral text-sm font-medium tracking-[0.3em] mb-3">{n}</div>
      <div className="text-xl text-ocean-deep font-medium mb-2">{title}</div>
      <div className="text-sm text-muted-foreground leading-relaxed">{desc}</div>
    </div>
  );
}

function SuccessCard({ user, onNew }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-premium p-8 md:p-12 text-center space-y-6 border border-lagoon/20">
        <div className="mx-auto w-16 h-16 rounded-full bg-lagoon/10 flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-lagoon" />
        </div>
        <div className="space-y-2">
          <h2
            className="text-3xl md:text-4xl italic font-light text-ocean-deep"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            Request submitted!
          </h2>
          <p className="text-muted-foreground">
            You&apos;ll receive quotes from logistics operators shortly.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          {user ? (
            <Button asChild className="bg-lagoon hover:bg-lagoon-dark text-white rounded-full h-12 px-6">
              <Link href="/users/my-requests">View My Requests</Link>
            </Button>
          ) : (
            <Button asChild className="bg-lagoon hover:bg-lagoon-dark text-white rounded-full h-12 px-6">
              <Link href="/auth/login">Log In</Link>
            </Button>
          )}
          <Button variant="outline" onClick={onNew} className="rounded-full h-12 px-6 border-border">
            Submit Another
          </Button>
        </div>
      </div>
    </div>
  );
}
