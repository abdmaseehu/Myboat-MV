import { motion } from "framer-motion";
import { Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BusInfo({ vehicle }) {
  const parseAmenities = (amenitiesString) => {
    try {
      if (!amenitiesString || !amenitiesString.ids || !amenitiesString.ids[0])
        return [];
      return JSON.parse(amenitiesString.ids[0]);
    } catch (e) {
      return [];
    }
  };

  const amenities = parseAmenities(vehicle.amenities);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        {vehicle.user?.vendor?.businessLogo ? (
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-md"
          >
            <img
              src={`${process.env.NEXT_PUBLIC_ROOT_URL}${vehicle.user.vendor.businessLogo}`}
              alt={vehicle.user.vendor.businessName}
              className="w-full h-full object-cover"
            />
          </motion.div>
        ) : (
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-16 h-16 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0 shadow-md"
          >
            <Ship className="h-8 w-8 text-sky-500" />
          </motion.div>
        )}
        <div className="space-y-1">
          <h3 className="font-semibold text-xl line-clamp-1">
            {vehicle.vehicleName}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {vehicle.user?.vendor?.businessName || "Unknown Vendor"}
          </p>
          {vehicle.user?.vendor?.businessAddress && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {vehicle.user.vendor.businessAddress}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {vehicle.vehicleType}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {vehicle.gearSystem}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          {amenities.map((amenity, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500 shadow-md"
                >
                  <img
                    src={`${process.env.NEXT_PUBLIC_ROOT_URL}${amenity.icon}`}
                    alt={amenity.name}
                    className="w-6 h-6"
                  />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{amenity.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
