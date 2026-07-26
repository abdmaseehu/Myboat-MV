import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Armchair } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SeatLayout({
  layout,
  deck,
  selectedSeats = [],
  onSeatSelect,
  vehicle,
  bookings = [],
  bookingDate,
}) {
  const rows = layout?.rows || [];
  const seats = layout?.seats || {};

  const isSeatBooked = (seatKey) => {
    if (!bookings || !bookingDate) return false;

    return bookings.some((booking) => {
      const bookingDateStr = new Date(booking.bookingDate).toDateString();
      const selectedDateStr = new Date(bookingDate).toDateString();

      if (bookingDateStr !== selectedDateStr) return false;

      return booking.seatNumbers.some((seat) => seat.key === seatKey);
    });
  };

  const handleSeatClick = (seatKey, seatInfo) => {
    if (!seatInfo) return;
    if (isSeatBooked(seatKey)) return;
    onSeatSelect(seatKey);
  };

  const getSeatStatus = (seatKey, seatInfo) => {
    if (!seatInfo) return "empty";
    if (isSeatBooked(seatKey)) return "booked";
    if (selectedSeats.some((seat) => seat.key === seatKey)) return "selected";
    return "available";
  };

  return (
    <div className="p-4">
      {/* Legend — ferry/speedboat: only 3 states, no sleeper */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-6 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md border-2 border-sky-500 flex items-center justify-center">
            <Armchair className="w-5 h-5 text-sky-500" />
          </div>
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-sky-500 flex items-center justify-center">
            <Armchair className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
            <Armchair className="w-5 h-5 text-zinc-500" />
          </div>
          <span className="text-sm">Booked</span>
        </div>
      </div>

      {/* Bow (Front of vessel) */}
      <div className="relative mb-8">
        <div className="w-32 h-16 mx-auto bg-sky-500/10 border-2 border-sky-500 rounded-t-3xl flex items-center justify-center">
          <span className="text-sm font-medium text-sky-500">Bow</span>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="grid gap-4 justify-center">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 justify-center">
            {row.map((seatType, colIndex) => {
              const seatKey = `${deck}-${rowIndex}-${colIndex}`;
              const seatInfo = seats[seatKey];

              if (!seatInfo || (seatInfo.deck || "").toLowerCase() !== deck) {
                return <div key={colIndex} className="w-8 h-8" />;
              }

              const status = getSeatStatus(seatKey, seatInfo);

              return (
                <TooltipProvider key={colIndex}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={
                          status === "available" ? { scale: 1.1 } : {}
                        }
                        whileTap={status === "available" ? { scale: 0.9 } : {}}
                        onClick={() => handleSeatClick(seatKey, seatInfo)}
                        disabled={status === "booked"}
                        className={cn(
                          "relative transition-all duration-200 p-1 w-10 h-10 rounded-md border-2",
                          status === "booked" &&
                            "bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 cursor-not-allowed",
                          status === "selected" &&
                            "bg-sky-500 border-sky-500",
                          status === "available" &&
                            "border-sky-500 hover:border-sky-600"
                        )}
                      >
                        <Armchair
                          className={cn(
                            "w-7 h-7",
                            status === "selected"
                              ? "text-white"
                              : "text-sky-500",
                            status === "booked" && "text-zinc-500"
                          )}
                        />
                        <span
                          className={cn(
                            "absolute -top-4 -right-2 w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-full",
                            status === "selected"
                              ? "bg-white text-sky-500"
                              : "bg-sky-500 text-white"
                          )}
                        >
                          {seatInfo.number}
                        </span>
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-sky-500 text-white border-none"
                    >
                      <div className="text-center">
                        <p className="font-bold">Seat {seatInfo.number}</p>
                        <p className="text-xs font-medium">
                          MVR {vehicle?.layout?.seaterPrice ?? "—"}
                        </p>
                        {status === "booked" && (
                          <p className="text-xs font-medium text-red-800">
                            Already Booked
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        ))}
      </div>

      {/* Aisle Label */}
      <div className="mt-2 text-center">
        <div className="w-32 mx-auto border-t-2 border-dashed border-sky-500 pt-2">
          <span className="text-sm text-sky-500 font-medium">Aisle</span>
        </div>
      </div>
    </div>
  );
}
