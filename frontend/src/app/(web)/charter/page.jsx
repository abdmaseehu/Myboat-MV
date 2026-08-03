"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuth } from "@/store/use-auth";
import {
  Anchor,
  MapPin,
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z
  .object({
    origin: z.string().min(1, "Departure island is required"),
    destination: z.string().min(1, "Destination island is required"),
    tripDate: z.string().min(1, "Trip date is required"),
    departureTime: z.string().optional().or(z.literal("")),
    passengers: z.coerce.number().int().min(1).max(200),
    returnTrip: z.boolean().default(false),
    returnDate: z.string().optional().or(z.literal("")),
    returnTime: z.string().optional().or(z.literal("")),
    guestName: z.string().min(1, "Your name is required"),
    guestEmail: z.string().email("Enter a valid email"),
    guestPhone: z.string().optional().or(z.literal("")),
    specialRequirements: z.string().optional().or(z.literal("")),
  })
  .refine((v) => !v.returnTrip || (v.returnDate && v.returnDate.length > 0), {
    path: ["returnDate"],
    message: "Return date is required",
  });

const today = () => new Date().toISOString().slice(0, 10);

export default function CharterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [operators, setOperators] = useState([]);
  // "" = broadcast to every operator (the recommended default)
  const [vendorId, setVendorId] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      origin: "",
      destination: "",
      tripDate: "",
      departureTime: "",
      passengers: 2,
      returnTrip: false,
      returnDate: "",
      returnTime: "",
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      specialRequirements: "",
    },
  });

  const returnTrip = watch("returnTrip");

  useEffect(() => {
    if (user) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
      if (name) setValue("guestName", name);
      if (user.email) setValue("guestEmail", user.email);
      if (user.phone) setValue("guestPhone", user.phone);
    }
  }, [user, setValue]);

  // Prefill the trip from a charter search. "Request Boat MV" links here with
  // no vendor, which the submit handler already treats as a broadcast request.
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const from = qs.get("from");
    const to = qs.get("to");
    const date = qs.get("date");
    const pax = Number(qs.get("passengers"));
    if (from) setValue("origin", from);
    if (to) setValue("destination", to);
    if (date) setValue("tripDate", date);
    if (pax > 0) setValue("passengers", pax);
  }, [setValue]);

  // Load approved operators + honour ?operator=<publicSlug> deep links
  // (e.g. the "Request a Charter" button on an operator profile page).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/vendors/public");
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        if (cancelled) return;
        setOperators(list);
        const qs = new URLSearchParams(window.location.search);
        const slug = qs.get("operator");
        if (slug) {
          const match = list.find(
            (o) => (o.publicSlug || "").toLowerCase() === slug.toLowerCase()
          );
          if (match) setVendorId(match.id);
        }
        // Search results link here with the operator id directly.
        const vendor = qs.get("vendor");
        if (vendor && list.some((o) => o.id === vendor)) setVendorId(vendor);
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
      router.push("/auth/login?returnTo=/charter");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        origin: values.origin,
        destination: values.destination,
        tripDate: values.tripDate,
        departureTime: values.departureTime || null,
        passengers: values.passengers,
        returnTrip: values.returnTrip,
        returnDate: values.returnTrip ? values.returnDate : null,
        returnTime: values.returnTrip ? values.returnTime || null : null,
        guestName: values.guestName,
        guestEmail: values.guestEmail,
        guestPhone: values.guestPhone || null,
        specialRequirements: values.specialRequirements || null,
        // "" -> null = broadcast to all operators
        vendorId: vendorId || null,
      };
      await api.post("/charter-requests", payload);
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
      {/* Hero */}
      <section className="relative overflow-hidden bg-ocean-gradient text-white isolate">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-35 mix-blend-overlay"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1548574505-5e239809ee19?q=80&w=2000&auto=format&fit=crop')",
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
              <Sparkles className="h-3 w-3" /> Private Charter
            </span>
            <h1
              className="mt-6 text-5xl md:text-7xl lg:text-8xl font-light italic leading-[0.98] text-balance"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              A boat, all
              <br />
              <span className="text-gradient-lagoon not-italic font-normal">to yourself.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/85 max-w-xl">
              Submit your requirements and receive quotes from verified Maldives operators within hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container-x -mt-16 md:-mt-24 pb-16 md:pb-24 relative z-10">
        {success ? (
          <SuccessCard user={user} onNew={() => setSuccess(false)} />
        ) : (
          <div className="grid lg:grid-cols-5 gap-6 md:gap-8">
            {/* Left */}
            <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-28 lg:self-start">
              <div className="glass-white rounded-3xl p-8 shadow-premium">
                <div className="flex items-center gap-2 text-lagoon font-medium mb-4">
                  <Anchor className="h-5 w-5" />
                  Why book a private charter?
                </div>
                <ul className="space-y-3 text-sm">
                  {[
                    "Full boat privacy — no shared trips",
                    "Flexible timing that suits your schedule",
                    "Custom itinerary to fit your plans",
                    "Direct quotes from multiple operators",
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
                  Trusted operators
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                  Every operator on Myboat is vetted. Receive competitive quotes and pick the best for your trip.
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="lg:col-span-3">
              <div className="glass-white rounded-3xl shadow-premium p-6 md:p-10">
                <div className="mb-8">
                  <h2
                    className="text-3xl md:text-4xl italic font-light text-ocean-deep leading-tight"
                    style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
                  >
                    Request quotes
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Fill in your trip details — operators respond with quotes within hours.
                  </p>
                  {!user && (
                    <p className="text-xs text-coral mt-3">
                      You&apos;ll need to log in to submit — we&apos;ll take you there.
                    </p>
                  )}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  <FormSection title="Trip Details" icon={MapPin}>
                    <FormRow>
                      <Field label="From" required error={errors.origin?.message}>
                        <StyledInput placeholder="e.g. Malé" {...register("origin")} />
                      </Field>
                      <Field label="To" required error={errors.destination?.message}>
                        <StyledInput placeholder="e.g. Maafushi" {...register("destination")} />
                      </Field>
                    </FormRow>
                    <FormRow>
                      <Field label="Trip Date" required error={errors.tripDate?.message}>
                        <StyledInput type="date" min={today()} {...register("tripDate")} />
                      </Field>
                      <Field label="Departure Time" hint="Leave blank if flexible">
                        <StyledInput type="time" {...register("departureTime")} />
                      </Field>
                    </FormRow>
                    <FormRow>
                      <Field label="Passengers" required error={errors.passengers?.message}>
                        <StyledInput type="number" min={1} max={200} {...register("passengers")} />
                      </Field>
                      <div className="flex items-end pb-2">
                        <div className="flex items-center gap-3">
                          <Switch
                            id="returnTrip"
                            checked={returnTrip}
                            onCheckedChange={(v) => setValue("returnTrip", !!v)}
                          />
                          <Label htmlFor="returnTrip" className="cursor-pointer text-ocean-deep">
                            Return trip
                          </Label>
                        </div>
                      </div>
                    </FormRow>
                    {returnTrip && (
                      <FormRow>
                        <Field label="Return Date" required error={errors.returnDate?.message}>
                          <StyledInput type="date" min={today()} {...register("returnDate")} />
                        </Field>
                        <Field label="Return Time" hint="Optional">
                          <StyledInput type="time" {...register("returnTime")} />
                        </Field>
                      </FormRow>
                    )}
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
                      <Field label="Phone" hint="Recommended for faster contact">
                        <StyledInput {...register("guestPhone")} />
                      </Field>
                      <div />
                    </FormRow>
                  </FormSection>

                  <FormSection title="Additional" icon={Sparkles}>
                    <Field label="Special Requirements">
                      <Textarea
                        rows={4}
                        placeholder="e.g. wheelchair accessibility, snorkel gear, dietary preferences..."
                        className="rounded-2xl border-border/60 bg-white"
                        {...register("specialRequirements")}
                      />
                    </Field>
                  </FormSection>

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

      {/* How it works */}
      <section className="section-padding bg-foam">
        <div className="container-x">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="chip bg-white text-lagoon uppercase tracking-[0.2em]">Process</span>
            <h2
              className="mt-5 text-4xl md:text-5xl italic font-light text-ocean-deep leading-tight"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              Three steps to your charter.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            <Step n="01" title="Submit your request" desc="Tell us where you want to go, when, and how many people." />
            <Step n="02" title="Receive quotes" desc="Verified operators send you competitive prices." />
            <Step n="03" title="Accept & book" desc="Choose the best quote and confirm your charter." />
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
            You&apos;ll receive quotes from operators shortly. Check your email or track responses from your account.
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
          <Button
            variant="outline"
            onClick={onNew}
            className="rounded-full h-12 px-6 border-border"
          >
            Submit Another
          </Button>
        </div>
      </div>
    </div>
  );
}
