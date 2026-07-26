import { motion } from "framer-motion";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Ship, Snowflake } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
  },
};

const RecentBookings = ({ bookings }) => {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {bookings?.map((booking) => (
              <motion.div
                key={booking.id}
                variants={itemVariants}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {booking.user.firstName} {booking.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {booking.vehicle.route.sourceCity} →{" "}
                    {booking.vehicle.route.destinationCity}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Ship className="w-3 h-3" />
                      {booking.vehicle.vehicleNumber}
                    </Badge>
                    {booking.vehicle.hasAc && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Snowflake className="w-3 h-3" />
                        AC
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className="bg-sky-500/10 text-sky-500"
                    >
                      ${booking.finalAmount}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {format(new Date(booking.createdAt), "PPP")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(booking.createdAt), "p")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {booking.vehicle.vehicleName} •{" "}
                    {booking.vehicle.vehicleType}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentBookings;
