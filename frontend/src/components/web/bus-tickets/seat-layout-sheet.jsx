import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Ship, Loader2, Users, Minus, Plus } from "lucide-react";
import SeatLayout from "./seat-layout";
import BoardingPointSelection from "./boarding-point-selection";
import useTicketStore from "@/store/use-ticket-store";
import { priceForCategory, formatMoney, categoryLabel } from "@/lib/currency";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import api from "@/lib/axios";

// Prices come from the schedule's tier for the selected passenger category.
// MVR and USD are independent - nothing here converts between them.

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

export default function SeatLayoutSheet({ vehicle, isOpen, onClose }) {
  // Ferry/speedboat: always single deck. Never show upper deck tab regardless
  // of legacy `hasUpperDeck` data on old layouts.
  const [showBoardingPoints, setShowBoardingPoints] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  // Passenger count (used when operator disables seat selection on this vessel)
  const [passengerCount, setPassengerCount] = useState(1);
  const searchParams = useSearchParams();
  const {
    selectedSeats = [],
    setSelectedSeats,
    setTotalAmount,
    bookingDate,
    setBookingDate,
    passengerCategory,
  } = useTicketStore();

  // Per-vessel setting: operator can disable seat selection entirely
  const seatSelectionEnabled = vehicle?.seatSelectionEnabled !== false;

  // One seat's fare for THIS passenger category, in that category's currency.
  const { amount: unitPrice, currency } = priceForCategory(
    vehicle,
    passengerCategory
  );
  const fareLabel = categoryLabel(passengerCategory);
  const fmt = (v) => formatMoney(v, currency);
  // Operator hasn't published a fare for this tier - booking must not proceed
  // at a silent 0.00.
  const priceUnavailable = unitPrice === null || Number.isNaN(Number(unitPrice));
  const capacity = vehicle?.totalSeats || vehicle?.layout?.totalSeats || 10;

  // Fetch bookings when component mounts or when vehicle/date changes
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const date = searchParams.get("date");
        if (date && vehicle?.id) {
          setBookingDate(date);
          const response = await api.get(
            `/bookings/vehicle/${vehicle.id}?date=${date}`
          );
          if (response.data.success) {
            setBookings(response.data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Failed to fetch seat availability");
      } finally {
        setLoading(false);
      }
    };

    if (vehicle?.id) {
      fetchBookings();
    }
  }, [vehicle?.id, searchParams, setBookingDate]);

  const handleSeatSelect = (seatKey) => {
    if (!seatKey) return;
    if (priceUnavailable) {
      toast.error(
        `This operator has not set a ${fareLabel} fare for this trip yet`
      );
      return;
    }

    setSelectedSeats((prevSeats) => {
      const isSelected = prevSeats.some((seat) => seat.key === seatKey);
      let newSeats;

      if (isSelected) {
        // Remove the seat if it's already selected
        newSeats = prevSeats.filter((seat) => seat.key !== seatKey);
      } else {
        // Add the seat if it's not selected and we haven't reached the limit
        if (prevSeats.length >= 4) {
          toast.error("You can only select up to 4 seats");
          return prevSeats;
        }

        const seatInfo = vehicle.layout.layoutJson.seats[seatKey];
        if (!seatInfo) return prevSeats;

        newSeats = [
          ...prevSeats,
          { key: seatKey, type: seatInfo.type, price: Number(unitPrice) || 0 },
        ];
      }

      // Calculate total amount
      const total = newSeats.reduce((acc, seat) => acc + seat.price, 0);
      setTotalAmount(total);

      return newSeats;
    });
  };

  const calculateTotalPrice = (seats = []) =>
    Array.isArray(seats) ? seats.length * (Number(unitPrice) || 0) : 0;

  const handleContinue = () => {
    if (priceUnavailable) {
      toast.error(
        `This operator has not set a ${fareLabel} fare for this trip yet`
      );
      return;
    }
    if (seatSelectionEnabled) {
      if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) return;
    } else {
      // Seat selection disabled: synthesize virtual "seats" from passenger count
      const price = Number(unitPrice) || 0;
      const virtualSeats = Array.from({ length: passengerCount }, (_, i) => ({
        key: `virtual-${i + 1}`,
        type: "SEAT",
        price,
      }));
      setSelectedSeats(virtualSeats);
      setTotalAmount(price * passengerCount);
    }
    setShowBoardingPoints(true);
  };

  const handleCloseBoardingPoints = () => {
    setShowBoardingPoints(false);
  };

  // Render selected seats badges with enhanced design
  const renderSelectedSeats = () => {
    if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground text-center py-4"
        >
          No seats selected yet
        </motion.p>
      );
    }

    return (
      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {selectedSeats.map((seat) => {
          const seatInfo = vehicle?.layout?.layoutJson?.seats?.[seat.key];
          if (!seatInfo) return null;

          return (
            <motion.div
              key={seat.key}
              variants={itemVariants}
              className="flex items-center justify-between bg-sky-50/50 dark:bg-sky-900/10 p-3 rounded-lg"
            >
              <Badge
                className="bg-sky-500 text-black hover:bg-sky-600 cursor-pointer transition-colors duration-200"
                onClick={() => handleSeatSelect(seat.key)}
              >
                Seat {seatInfo.number}
              </Badge>
              <span className="font-medium text-sky-700 dark:text-sky-400">
                {fmt(unitPrice)}
              </span>
            </motion.div>
          );
        })}
        <motion.div
          variants={itemVariants}
          className="pt-3 mt-3 border-t border-sky-200 dark:border-sky-800 flex justify-between items-center"
        >
          <span className="font-medium text-sky-700 dark:text-sky-400">
            Total Amount
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({fareLabel} rate)
            </span>
          </span>
          <span className="text-lg font-bold bg-gradient-to-r from-sky-500 to-sky-600 bg-clip-text text-transparent">
            {fmt(calculateTotalPrice(selectedSeats))}
          </span>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <>
      <Sheet open={isOpen && !showBoardingPoints} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="h-full flex flex-col"
          >
            <SheetHeader className="space-y-2 text-center">
              <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-sky-500 to-sky-600 bg-clip-text text-transparent">
                Select Your Seats
              </SheetTitle>
              <SheetDescription className="flex items-center justify-center gap-2">
                <span>Maximum 4 seats can be selected</span>
                {Array.isArray(selectedSeats) && selectedSeats.length > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
                  >
                    Selected: {selectedSeats.length}
                  </Badge>
                )}
              </SheetDescription>
            </SheetHeader>

            {priceUnavailable && (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300">
                This operator hasn&apos;t published a{" "}
                <strong>{fareLabel}</strong> fare for this trip yet. Please pick
                another vessel or contact the operator.
              </div>
            )}

            <div className="flex-1 py-6">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full space-y-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Loader2 className="w-8 h-8 text-sky-500" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">
                    Loading seat availability...
                  </p>
                </motion.div>
              ) : seatSelectionEnabled ? (
                <SeatLayout
                  layout={vehicle?.layout?.layoutJson}
                  deck="lower"
                  selectedSeats={selectedSeats}
                  onSeatSelect={handleSeatSelect}
                  vehicle={vehicle}
                  bookings={bookings}
                  bookingDate={bookingDate}
                  fareLabel={priceUnavailable ? null : fmt(unitPrice)}
                />
              ) : (
                // Operator disabled seat selection: simple passenger counter
                <div className="flex flex-col items-center justify-center py-12 gap-6">
                  <div className="w-20 h-20 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                    <Users className="w-10 h-10 text-sky-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-lg">Number of Passengers</p>
                    <p className="text-sm text-muted-foreground">
                      This operator does not require seat selection.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setPassengerCount((c) => Math.max(1, c - 1))
                      }
                      disabled={passengerCount <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-3xl font-bold w-12 text-center text-sky-700 dark:text-sky-400">
                      {passengerCount}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setPassengerCount((c) => Math.min(capacity, c + 1))
                      }
                      disabled={passengerCount >= capacity}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Max {capacity} passengers
                  </p>
                </div>
              )}
            </div>

            {seatSelectionEnabled && (
              <div className="mt-4 space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-900/20 dark:to-sky-900/10 rounded-xl p-6 shadow-lg"
                >
                  <h3 className="font-medium mb-4 text-sky-700 dark:text-sky-400">
                    Selected Seats
                  </h3>
                  <div className="flex flex-col gap-2">
                    {renderSelectedSeats()}
                  </div>
                </motion.div>
              </div>
            )}

            <SheetFooter className="mt-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full"
              >
                <Button
                  onClick={handleContinue}
                  disabled={
                    priceUnavailable ||
                    (seatSelectionEnabled
                      ? !Array.isArray(selectedSeats) || selectedSeats.length === 0
                      : passengerCount < 1)
                  }
                  className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-medium shadow-lg transition-all duration-300"
                >
                  Continue Booking
                </Button>
              </motion.div>
            </SheetFooter>
          </motion.div>
        </SheetContent>
      </Sheet>

      <BoardingPointSelection
        isOpen={showBoardingPoints}
        onClose={handleCloseBoardingPoints}
        vehicle={vehicle}
      />
    </>
  );
}
