import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Ship,
  Anchor,
  Truck,
  MapPin,
  Mail,
  Phone,
  Star,
  Users,
  Snowflake,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || "";

async function fetchVendor(slug) {
  try {
    const res = await fetch(`${API_URL}/vendors/public/${encodeURIComponent(slug)}`, {
      // Revalidate every 60 seconds; fine for a public profile.
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.success) return null;
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const data = await fetchVendor(params.slug);
  if (!data?.vendor) return { title: "Operator not found" };
  const { businessName, description } = data.vendor;
  return {
    title: `${businessName} — MyBoat`,
    description: description?.slice(0, 160) || `Book vessels with ${businessName}`,
  };
}

const resolveImg = (src) => {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  return `${ROOT_URL}${src}`;
};

export default async function OperatorPublicPage({ params }) {
  const data = await fetchVendor(params.slug);
  if (!data?.vendor) return notFound();

  const { vendor, vessels } = data;
  const faqs = Array.isArray(vendor.faqs) ? vendor.faqs : [];
  const logo = resolveImg(vendor.businessLogo);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Hero */}
      <section className="mb-10 flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-br from-sky-50 to-white p-8 text-center dark:from-sky-950/20 dark:to-transparent md:flex-row md:text-left">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-white ring-4 ring-sky-100 dark:bg-zinc-900 dark:ring-sky-500/20">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={vendor.businessName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Anchor className="h-10 w-10 text-sky-500" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{vendor.businessName}</h1>
          {vendor.rating != null && (
            <div className="mt-2 flex items-center justify-center gap-1 md:justify-start">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium">{Number(vendor.rating).toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">rating</span>
            </div>
          )}
          {vendor.baseIsland && (
            <div className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground md:justify-start">
              <MapPin className="h-4 w-4" /> {vendor.baseIsland}
            </div>
          )}
          {vendor.description && (
            <p className="mt-4 text-muted-foreground">{vendor.description}</p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
            <Button
              asChild
              className="rounded-full bg-coral px-6 text-white shadow-coral hover:bg-coral-soft"
            >
              <Link href={`/charter?operator=${encodeURIComponent(params.slug)}`}>
                <Anchor className="mr-2 h-4 w-4" /> Request a Charter
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full px-6"
            >
              <Link href={`/logistics?operator=${encodeURIComponent(params.slug)}`}>
                <Truck className="mr-2 h-4 w-4" /> Request Cargo Transport
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact */}
      {(vendor.contactEmail || vendor.contactPhone) && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Contact</h2>
          <div className="flex flex-wrap gap-3">
            {vendor.contactEmail && (
              <a
                href={`mailto:${vendor.contactEmail}`}
                className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm hover:bg-sky-50 dark:hover:bg-sky-500/10"
              >
                <Mail className="h-4 w-4 text-sky-500" /> {vendor.contactEmail}
              </a>
            )}
            {vendor.contactPhone && (
              <a
                href={`tel:${vendor.contactPhone}`}
                className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm hover:bg-sky-50 dark:hover:bg-sky-500/10"
              >
                <Phone className="h-4 w-4 text-sky-500" /> {vendor.contactPhone}
              </a>
            )}
          </div>
        </section>
      )}

      {/* Vessels */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold">
          <Ship className="h-6 w-6 text-sky-500" /> Our Vessels
        </h2>
        {vessels.length === 0 ? (
          <p className="text-muted-foreground">No vessels available right now.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vessels.map((v) => {
              const img = resolveImg(v.vehicleImage);
              return (
                <Card key={v.id} className="overflow-hidden">
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-500/10 dark:to-transparent">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={v.vehicleName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Ship className="h-12 w-12 text-sky-400" />
                      </div>
                    )}
                    {v.hasAc && (
                      <Badge className="absolute right-2 top-2 bg-sky-500 hover:bg-sky-600 gap-1">
                        <Snowflake className="h-3 w-3" /> AC
                      </Badge>
                    )}
                  </div>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-tight">{v.vehicleName}</h3>
                      {v.vehicleRating != null && (
                        <span className="flex items-center gap-0.5 text-xs">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {Number(v.vehicleRating).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                      {v.vehicleType && <Badge variant="outline">{v.vehicleType}</Badge>}
                      {v.totalSeats && (
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" /> {v.totalSeats}
                        </Badge>
                      )}
                    </div>
                    {v.baseIsland && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {v.baseIsland}
                      </p>
                    )}
                    <Button
                      asChild
                      className="mt-2 w-full bg-sky-500 text-white hover:bg-sky-600"
                    >
                      <Link href={`/bus-tickets?vessel=${v.id}`}>Book Now</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Terms / Cancellation / FAQ */}
      {(vendor.termsConditions || vendor.cancellationPolicy || faqs.length > 0) && (
        <section className="mb-10">
          <Accordion type="single" collapsible className="w-full">
            {vendor.termsConditions && (
              <AccordionItem value="terms">
                <AccordionTrigger>Terms &amp; Conditions</AccordionTrigger>
                <AccordionContent>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">
                    {vendor.termsConditions}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}
            {vendor.cancellationPolicy && (
              <AccordionItem value="cancel">
                <AccordionTrigger>Cancellation Policy</AccordionTrigger>
                <AccordionContent>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">
                    {vendor.cancellationPolicy}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}
            {faqs.length > 0 && (
              <AccordionItem value="faq">
                <AccordionTrigger>Frequently Asked Questions</AccordionTrigger>
                <AccordionContent>
                  <Accordion type="single" collapsible>
                    {faqs.map((f) => (
                      <AccordionItem key={f.id} value={f.id}>
                        <AccordionTrigger className="text-left">
                          {f.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="whitespace-pre-line text-sm text-muted-foreground">
                            {f.answer}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </section>
      )}
    </div>
  );
}
