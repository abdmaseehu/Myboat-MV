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
  Calendar,
  Users,
  Phone,
  Mail,
  User,
  CheckCircle2,
  Clock,
  Ship,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
  .refine(
    (v) => !v.returnTrip || (v.returnDate && v.returnDate.length > 0),
    { path: ["returnDate"], message: "Return date is required" }
  );

const today = () => new Date().toISOString().slice(0, 10);

export default function CharterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
        vendorId: null,
      };
      await api.post("/charter-requests", payload);
      setSuccess(true);
      reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e.message || "Failed to submit request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 text-white">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.25),transparent_45%)]" />
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium mb-5 border border-white/20">
              <Sparkles className="h-3.5 w-3.5" />
              Private Charter Requests
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
              Book a Private Charter
            </h1>
            <p className="text-lg md:text-xl text-sky-50/90 max-w-2xl">
              Have a Maldives boat all to yourself. Submit your requirements and
              receive quotes from verified operators.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <TrustBadge>🚤 Verified Operators</TrustBadge>
              <TrustBadge>💰 Best Prices</TrustBadge>
              <TrustBadge>⚡ Fast Quotes</TrustBadge>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        {success ? (
          <SuccessCard user={user} onNew={() => setSuccess(false)} />
        ) : (
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Benefits */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-sky-500/20">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold">
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
                      <li key={t} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{t}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/40 dark:to-transparent border-sky-500/20">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold">
                    <Ship className="h-5 w-5" />
                    Trusted operators
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Every operator on Myboat is vetted. You&apos;ll receive
                    competitive quotes and can pick the best one for your trip.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6 md:p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-1">Request quotes</h2>
                    <p className="text-sm text-muted-foreground">
                      Fill in your trip details — operators will respond with
                      quotes within hours.
                    </p>
                    {!user && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        You&apos;ll need to log in to submit — we&apos;ll take
                        you there when you click submit.
                      </p>
                    )}
                  </div>

                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-8"
                  >
                    <FormSection title="Trip Details" icon={MapPin}>
                      <FormRow>
                        <Field
                          label="From"
                          required
                          error={errors.origin?.message}
                        >
                          <Input
                            placeholder="Departure island e.g. Male"
                            {...register("origin")}
                          />
                        </Field>
                        <Field
                          label="To"
                          required
                          error={errors.destination?.message}
                        >
                          <Input
                            placeholder="Destination island e.g. Maafushi"
                            {...register("destination")}
                          />
                        </Field>
                      </FormRow>
                      <FormRow>
                        <Field
                          label="Trip Date"
                          required
                          error={errors.tripDate?.message}
                        >
                          <Input
                            type="date"
                            min={today()}
                            {...register("tripDate")}
                          />
                        </Field>
                        <Field
                          label="Departure Time"
                          hint="Leave blank if flexible"
                        >
                          <Input type="time" {...register("departureTime")} />
                        </Field>
                      </FormRow>
                      <FormRow>
                        <Field
                          label="Number of Passengers"
                          required
                          error={errors.passengers?.message}
                        >
                          <Input
                            type="number"
                            min={1}
                            max={200}
                            {...register("passengers")}
                          />
                        </Field>
                        <div className="flex items-end pb-1">
                          <div className="flex items-center gap-3">
                            <Switch
                              id="returnTrip"
                              checked={returnTrip}
                              onCheckedChange={(v) =>
                                setValue("returnTrip", !!v)
                              }
                            />
                            <Label
                              htmlFor="returnTrip"
                              className="cursor-pointer"
                            >
                              Return trip
                            </Label>
                          </div>
                        </div>
                      </FormRow>
                      {returnTrip && (
                        <FormRow>
                          <Field
                            label="Return Date"
                            required
                            error={errors.returnDate?.message}
                          >
                            <Input
                              type="date"
                              min={today()}
                              {...register("returnDate")}
                            />
                          </Field>
                          <Field label="Return Time" hint="Optional">
                            <Input type="time" {...register("returnTime")} />
                          </Field>
                        </FormRow>
                      )}
                    </FormSection>

                    <FormSection title="Contact Details" icon={User}>
                      <FormRow>
                        <Field
                          label="Full Name"
                          required
                          error={errors.guestName?.message}
                        >
                          <Input {...register("guestName")} />
                        </Field>
                        <Field
                          label="Email"
                          required
                          error={errors.guestEmail?.message}
                        >
                          <Input type="email" {...register("guestEmail")} />
                        </Field>
                      </FormRow>
                      <FormRow>
                        <Field
                          label="Phone"
                          hint="Recommended for faster contact"
                        >
                          <Input {...register("guestPhone")} />
                        </Field>
                        <div />
                      </FormRow>
                    </FormSection>

                    <FormSection title="Additional Info" icon={Sparkles}>
                      <Field label="Special Requirements">
                        <Textarea
                          rows={4}
                          placeholder="e.g. wheelchair accessibility, dietary preferences, ice box, snorkel gear..."
                          {...register("specialRequirements")}
                        />
                      </Field>
                    </FormSection>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 text-base bg-sky-500 hover:bg-sky-600 text-white"
                    >
                      {!user
                        ? "Log In to Request Quotes"
                        : submitting
                        ? "Submitting..."
                        : "Request Quotes"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-muted/30 border-t">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-3">How it works</h2>
            <p className="text-muted-foreground">
              Three simple steps between you and the perfect charter.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Step
              icon="📝"
              title="Submit your request"
              desc="Tell us where you want to go, when, and how many people."
            />
            <Step
              icon="💬"
              title="Receive quotes"
              desc="Verified operators send you competitive prices."
            />
            <Step
              icon="✅"
              title="Accept & book"
              desc="Choose the best quote and confirm your charter."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function TrustBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur border border-white/20 px-3 py-1.5 text-xs md:text-sm font-medium">
      {children}
    </span>
  );
}

function FormSection({ title, icon: Icon, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        {Icon && <Icon className="h-4 w-4 text-sky-500" />}
        <h3 className="text-sm font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wide">
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
      <Label className="text-xs font-medium">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-[11px] text-rose-500">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Step({ icon, title, desc }) {
  return (
    <Card className="border-sky-500/10">
      <CardContent className="p-6 text-center space-y-2">
        <div className="text-4xl mb-2">{icon}</div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </CardContent>
    </Card>
  );
}

function SuccessCard({ user, onNew }) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-transparent">
        <CardContent className="p-8 md:p-10 text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Request Submitted!</h2>
            <p className="text-muted-foreground">
              You&apos;ll receive quotes from operators shortly. Check your
              email or track responses from your account.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            {user ? (
              <Button
                asChild
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                <Link href="/users/my-requests">View My Requests</Link>
              </Button>
            ) : (
              <>
                <p className="text-xs text-amber-600 dark:text-amber-400 w-full">
                  Log in to track your requests and accept quotes.
                </p>
                <Button
                  asChild
                  className="bg-sky-500 hover:bg-sky-600 text-white"
                >
                  <Link href="/auth/login">Log In</Link>
                </Button>
              </>
            )}
            <Button variant="outline" onClick={onNew}>
              Submit Another
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
