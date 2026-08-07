import { notFound } from "next/navigation";
import { Ship, Users, MapPin, Star, Snowflake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://myboat-mv.vercel.app";

async function fetchVessel(id) {
  try {
    const res = await fetch(`${API_URL}/vendors/public/vessel/${encodeURIComponent(id)}`, {
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

export default async function EmbedVesselPage({ params }) {
  const data = await fetchVessel(params.id);
  if (!data?.vessel) return notFound();
  const { vessel, vendor } = data;
  const img = resolveImg(vessel.vehicleImage);
  const logo = resolveImg(vendor?.businessLogo);

  return (
    <div className="mx-auto max-w-xl p-4">
      <Card className="overflow-hidden">
        <div className="relative aspect-[16/9] bg-gradient-to-br from-sky-100 to-sky-50">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={vessel.vehicleName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Ship className="h-16 w-16 text-sky-400" />
            </div>
          )}
          {vessel.hasAc && (
            <Badge className="absolute right-2 top-2 gap-1 bg-sky-500 hover:bg-sky-600">
              <Snowflake className="h-3 w-3" /> AC
            </Badge>
          )}
        </div>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold leading-tight">{vessel.vehicleName}</h2>
              {vessel.vehicleType && (
                <p className="text-xs text-muted-foreground">{vessel.vehicleType}</p>
              )}
            </div>
            {vessel.vehicleRating != null && (
              <span className="flex items-center gap-0.5 text-xs">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {Number(vessel.vehicleRating).toFixed(1)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1 text-xs">
            {vessel.totalSeats && (
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" /> {vessel.totalSeats} seats
              </Badge>
            )}
            {vessel.baseIsland && (
              <Badge variant="outline" className="gap-1">
                <MapPin className="h-3 w-3" /> {vessel.baseIsland}
              </Badge>
            )}
          </div>

          {vendor && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2 text-xs">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={vendor.businessName} className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100">
                  <Ship className="h-3 w-3 text-sky-500" />
                </div>
              )}
              <span>
                Operated by <b>{vendor.businessName}</b>
              </span>
            </div>
          )}

          <Button asChild className="w-full bg-sky-500 text-white hover:bg-sky-600">
            <a
              href={`${APP_URL}/ferry?vessel=${vessel.id}`}
              target="_top"
              rel="noopener noreferrer"
            >
              Book Now
            </a>
          </Button>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
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
