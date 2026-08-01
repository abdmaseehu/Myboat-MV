import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, ChevronRight, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import useTicketStore from "@/store/use-ticket-store";
import { formatMoney } from "@/lib/currency";
import { useAuth } from "@/store/use-auth";
import { cn } from "@/lib/utils";

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

const sidebarVariants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { type: "spring", damping: 30, stiffness: 300 },
  },
};

export default function BoardingPointSelection({ isOpen, onClose, vehicle }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const {
    selectedBoardingPoint,
    setSelectedBoardingPoint,
    selectedSeats,
    setBookingDate,
    currency,
  } = useTicketStore();

  // Currency follows the passenger category (LOCAL/EXPAT -> MVR, TOURIST -> USD).
  const fmt = (v) => formatMoney(v, currency);

  useEffect(() => {
    const date = searchParams.get("date");
    if (date) {
      const formattedDate = new Date(date);
      if (!isNaN(formattedDate.getTime())) {
        setBookingDate(formattedDate.toISOString());
      }
    }
  }, [searchParams, setBookingDate]);

  const handlePointSelect = (point) => {
    setSelectedBoardingPoint(point);
  };

  const handleContinue = async () => {
    try {
      setLoading(true);

      if (!selectedBoardingPoint) {
        toast.error("Please select a boarding point");
        return;
      }

      if (!user) {
        localStorage.setItem("redirectAfterLogin", "/users/checkout");
        router.push("/auth/login");
        return;
      }

      router.push("/users/checkout");
      onClose();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            variants={sidebarVariants}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] border-l bg-background shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="py-6 px-6 border-b">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-semibold text-foreground">
                    Select Boarding Point
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-accent hover:text-accent-foreground"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred boarding location
                </p>
              </div>

              {/* Boarding Points List */}
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-3">
                  {vehicle?.route?.boardingPoints?.map((point, index) => (
                    <motion.div
                      key={point.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handlePointSelect(point)}
                      className={cn(
                        "group relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                        selectedBoardingPoint?.id === point.id
                          ? "bg-sky-500 border-sky-500 dark:bg-sky-500 dark:border-sky-500"
                          : "border-border hover:border-sky-500/50 dark:hover:border-sky-500/50"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-lg flex items-center justify-center transition-colors",
                            selectedBoardingPoint?.id === point.id
                              ? "bg-black/20"
                              : "bg-sky-500/10 dark:bg-sky-500/20"
                          )}
                        >
                          <MapPin
                            className={cn(
                              "h-6 w-6",
                              selectedBoardingPoint?.id === point.id
                                ? "text-black"
                                : "text-sky-500"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className={cn(
                              "text-lg font-medium mb-1",
                              selectedBoardingPoint?.id === point.id
                                ? "text-black"
                                : "text-foreground"
                            )}
                          >
                            {point.locationName}
                          </h4>
                          <span
                            className={cn(
                              "text-sm",
                              selectedBoardingPoint?.id === point.id
                                ? "text-black/70"
                                : "text-muted-foreground"
                            )}
                          >
                            Stop {point.sequenceNumber ?? index + 1}
                          </span>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-5 w-5 transition-transform group-hover:translate-x-1",
                            selectedBoardingPoint?.id === point.id
                              ? "text-black"
                              : "text-muted-foreground"
                          )}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="p-6 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="mb-6 space-y-4">
                  {/* Selected Seats Summary */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Selected Seats
                      </span>
                      <span className="text-sm font-medium text-sky-500">
                        {selectedSeats.length} seats
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedSeats.map((seat) => (
                        <div
                          key={seat.key}
                          className="p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                        >
                          <div className="text-sm font-medium text-card-foreground">
                            Seat {seat.key.split("-").slice(-2).join("-")}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                              {seat.type}
                            </span>
                            <span className="text-xs font-medium text-sky-500">
                              {fmt(seat.price)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-sky-500" />
                      <span className="font-medium text-card-foreground">
                        Total Amount
                      </span>
                    </div>
                    <span className="text-lg font-bold text-sky-500">
                      {fmt(
                        selectedSeats.reduce(
                          (total, seat) => total + seat.price,
                          0
                        )
                      )}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="h-11 text-base"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleContinue}
                    disabled={!selectedBoardingPoint || loading}
                    className={cn(
                      "h-11 text-base font-medium bg-sky-500 text-black hover:bg-sky-600",
                      "disabled:bg-muted disabled:text-muted-foreground"
                    )}
                  >
                    {loading ? "Please wait..." : "Continue"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
