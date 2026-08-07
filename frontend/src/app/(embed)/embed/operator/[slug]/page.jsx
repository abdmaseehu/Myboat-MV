import { notFound } from "next/navigation";
import { Ship, Users, MapPin, Star, Snowflake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://myboat-mv.vercel.app";

async function fetchVendor(slug) {
  try {
    const res = await fetch(`${API_URL}/vendors/public/${encodeURIComponent(slug)}`, {
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

const resolveImg = (src) => {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  return `${ROOT_URL}${src}`;
};

export default async function EmbedOperatorPage({ params }) {
  const data = await fetchVendor(params.slug);
  if (!data?.vendor) return notFound();
  const { vendor, vessels } = data;
  const logo = resolveImg(vendor.businessLogo);

  return (
    <div className="p-4">
      {/* Compact header */}
      <div className="mb-4 flex items-center gap-3 border-b pb-3">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={vendor.businessName} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
            <Ship className="h-5 w-5 text-sky-500" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate font-semibold">{vendor.businessName}</h1>
          {vendor.baseIsland && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {vendor.baseIsland}
            </p>
          )}
        </div>
      </div>

      {vessels.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No vessels available.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vessels.map((v) => {
            const img = resolveImg(v.vehicleImage);
            return (
              <Card key={v.id} className="overflow-hidden">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-sky-100 to-sky-50">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={v.vehicleName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Ship className="h-10 w-10 text-sky-400" />
                    </div>
                  )}
                  {v.hasAc && (
                    <Badge className="absolute right-2 top-2 gap-1 bg-sky-500 hover:bg-sky-600">
                      <Snowflake className="h-3 w-3" /> AC
                    </Badge>
                  )}
                </div>
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold leading-tight">{v.vehicleName}</h3>
                    {v.vehicleRating != null && (
                      <span className="flex items-center gap-0.5 text-xs">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {Number(v.vehicleRating).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                    {v.vehicleType && <Badge variant="outline">{v.vehicleType}</Badge>}
                    {v.totalSeats && (
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-3 w-3" /> {v.totalSeats}
                      </Badge>
                    )}
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="mt-1 w-full bg-sky-500 text-white hover:bg-sky-600"
                  >
                    <a
                      href={`${APP_URL}/ferry?vessel=${v.id}`}
                      target="_top"
                      rel="noopener noreferrer"
                    >
                      Book Now
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Powered by{" "}
        <a
          href={APP_URL}
          target="_top"
          rel="noopener noreferrer"
          className="text-sky-500 hover:underline"
        >
          MyBoat
        </a>
      </p>
    </div>
  );
}
