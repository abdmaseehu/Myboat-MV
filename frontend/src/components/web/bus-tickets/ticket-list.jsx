"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ArrowRight, Filter, MapPin, Ship, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import useVehicleStore from "@/store/use-vehicle-store";
import TicketSkeleton from "./ticket-skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import BoardingPointsDialog from "./boarding-points-dialog";
import DroppingPointsDialog from "./dropping-points-dialog";
import CancellationPolicyDialog from "./cancellation-policy-dialog";
import BusInfo from "./bus-info";
import SeatLayoutSheet from "./seat-layout-sheet";
import useTicketStore from "@/store/use-ticket-store";
import { priceForCategory, formatMoney } from "@/lib/currency";
import SearchForm from "@/components/web/bus-tickets/search-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.6,
    },
  },
};

const filterVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5 },
  },
};

// The schedule is the authority on when the vessel sails. Boarding/dropping
// point times are per-jetty offsets and belong in the points dialog only.
const formatScheduleTime = (date) => {
  if (!date) return "--:--";
  try {
    return format(date, "hh:mm a");
  } catch (error) {
    return "--:--";
  }
};

const formatPointTime = (time) => {
  if (!time) return "Time not specified";
  try {
    return format(new Date(time), "hh:mm a");
  } catch (error) {
    return "Invalid time";
  }
};

const CATEGORY_OPTIONS = [
  {
    value: "LOCAL",
    label: "Local Resident",
    description: "Maldivian citizen with local ID",
    color: "bg-green-500",
    ring: "ring-green-500",
  },
  {
    value: "EXPAT",
    label: "Expat Resident",
    description: "Foreign national living in Maldives with work permit",
    color: "bg-blue-500",
    ring: "ring-blue-500",
  },
  {
    value: "TOURIST",
    label: "Tourist",
    description: "Visiting the Maldives",
    color: "bg-orange-500",
    ring: "ring-orange-500",
  },
];

export default function TicketList({ routeId, date }) {
  const {
    vehicles,
    loading,
    hasMore,
    sortOrder,
    filters,
    fetchVehicles,
    loadMore,
    setSortOrder,
    setFilters,
    reset,
  } = useVehicleStore();

  const {
    setSelectedVehicle,
    resetTicketSelection,
    passengerCategory,
    currency,
    setPassengerCategory,
  } = useTicketStore();

  const [categoryModalOpen, setCategoryModalOpen] = useState(
    !passengerCategory
  );
  const [pendingCategory, setPendingCategory] = useState(
    passengerCategory || ""
  );

  useEffect(() => {
    if (!passengerCategory) setCategoryModalOpen(true);
  }, [passengerCategory]);

  const confirmCategory = () => {
    if (!pendingCategory) return;
    setPassengerCategory(pendingCategory);
    setCategoryModalOpen(false);
  };

  // console.log(vehicles);

  const [hoveredCard, setHoveredCard] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedBusTypes, setSelectedBusTypes] = useState([]);
  const [showAC, setShowAC] = useState(false);
  const [showSeatLayout, setShowSeatLayout] = useState(false);
  const [selectedVehicle, setSelectedVehicleState] = useState(null);

  const observer = useRef();
  const lastVehicleElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore(routeId, date);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadMore, routeId, date]
  );

  useEffect(() => {
    reset();
    fetchVehicles(routeId, date);
    return () => reset();
  }, [routeId, date, reset, fetchVehicles]);

  // A vessel can run the same route several times a day at different times and
  // fares, so each departure gets its own result row.
  // A vessel with no schedule on this route has nothing to sell, so it is not
  // a result. (It would otherwise render a card with no time and no fare.)
  const departures = vehicles.flatMap((vehicle) =>
    (vehicle.schedules || []).map((schedule) => ({
      vehicle,
      schedule,
      // Downstream (seat picker, checkout) reads schedules[0]; narrowing the
      // list to the chosen departure keeps that contract intact.
      vehicleForBooking: { ...vehicle, schedules: [schedule] },
    }))
  );

  // Sorting compares like with like: every row is priced in the same currency
  // here (it's driven by the one selected passenger category). Departures with
  // no fare published for that tier always sort last.
  const sortedDepartures = [...departures].sort((a, b) => {
    const priceA = priceForCategory(a.vehicleForBooking, passengerCategory).amount;
    const priceB = priceForCategory(b.vehicleForBooking, passengerCategory).amount;
    if (priceA == null && priceB == null) return 0;
    if (priceA == null) return 1;
    if (priceB == null) return -1;
    return sortOrder === "LOW_TO_HIGH" ? priceA - priceB : priceB - priceA;
  });

  const parseAmenities = (amenitiesString) => {
    try {
      if (!amenitiesString || !amenitiesString.ids || !amenitiesString.ids[0])
        return [];
      return JSON.parse(amenitiesString.ids[0]);
    } catch (e) {
      return [];
    }
  };

  // Filter handlers
  const handlePriceRangeChange = (value) => {
    setPriceRange(value);
    setFilters({ ...filters, priceRange: value });
  };

  const handleAmenityToggle = (amenityId) => {
    const newAmenities = selectedAmenities.includes(amenityId)
      ? selectedAmenities.filter((id) => id !== amenityId)
      : [...selectedAmenities, amenityId];
    setSelectedAmenities(newAmenities);
    setFilters({ ...filters, amenities: newAmenities });
  };

  const handleBusTypeToggle = (type) => {
    const newTypes = selectedBusTypes.includes(type)
      ? selectedBusTypes.filter((t) => t !== type)
      : [...selectedBusTypes, type];
    setSelectedBusTypes(newTypes);
    setFilters({ ...filters, busTypes: newTypes });
  };

  const handleACToggle = (checked) => {
    setShowAC(checked);
    setFilters({ ...filters, isAC: checked });
  };

  const handleBookNow = (vehicleForBooking) => {
    const vehicle = vehicleForBooking;
    resetTicketSelection(); // Reset previous selection
    setSelectedVehicleState(vehicle);
    setShowSeatLayout(true);
    // Store vehicle information in ticket store
    setSelectedVehicle(vehicle);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Filters and Sort */}
      <motion.div
        variants={filterVariants}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-sky-50/50 dark:bg-sky-900/10 p-4 rounded-xl shadow-lg"
      >
        <div className="flex flex-wrap items-center gap-4">
          <Badge
            variant="outline"
            className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800 px-4 py-1.5 text-sm font-medium"
          >
            {sortedDepartures.length} Departures Found
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSortOrder(
                sortOrder === "LOW_TO_HIGH" ? "HIGH_TO_LOW" : "LOW_TO_HIGH"
              )
            }
            className="border-sky-500 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30 font-medium"
          >
            Price: {sortOrder === "LOW_TO_HIGH" ? "Low to High" : "High to Low"}
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-sky-500 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="text-sky-700 dark:text-sky-400">
                Filter Boats
              </SheetTitle>
              <SheetDescription className="text-sky-600/80 dark:text-sky-500/80">
                Customize your search with these filters
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <h4 className="font-medium text-sky-700 dark:text-sky-400">
                  Price Range
                </h4>
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  min={0}
                  max={5000}
                  step={100}
                  className="w-full [&>[role=slider]]:bg-sky-500 [&>[role=slider]]:border-sky-600"
                />
                <div className="flex justify-between text-sm text-sky-600/80 dark:text-sky-500/80">
                  <span>{formatMoney(priceRange[0])}</span>
                  <span>{formatMoney(priceRange[1])}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sky-700 dark:text-sky-400">
                  Boat Type
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-sky-600/80 dark:text-sky-500/80">
                      AC Boats Only
                    </label>
                    <Switch
                      checked={showAC}
                      onCheckedChange={handleACToggle}
                      className="data-[state=checked]:bg-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sky-700 dark:text-sky-400">
                  Amenities
                </h4>
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-2">
                    {/* Add your amenities list here */}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>

      {/* Vehicle Cards */}
      <div className="space-y-6">
        <AnimatePresence>
          {!loading && vehicles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-sky-500/10 flex items-center justify-center mb-6">
                <Ship className="w-12 h-12 text-sky-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No Boats Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                We couldn't find any boats for this route on the selected date.
              </p>

              {/* Search Form */}
              <div className="w-full max-w-xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4 text-sky-500">
                  Try Another Search
                </h4>
                <SearchForm />
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="border-sky-500 text-sky-500 hover:bg-sky-500/10"
                >
                  Go Back
                </Button>
                <Button
                  onClick={() => (window.location.href = "/")}
                  className="bg-sky-500 hover:bg-sky-600 text-black"
                >
                  Search All Routes
                </Button>
              </div>
            </motion.div>
          ) : (
            sortedDepartures.map((departure, index) => {
              const { vehicle, schedule, vehicleForBooking } = departure;
              const amenities = parseAmenities(vehicle.amenities);
              const departureTime = schedule
                ? new Date(schedule.departureTime)
                : null;
              const arrivalTime = schedule
                ? new Date(schedule.arrivalTime)
                : null;

              return (
                <motion.div
                  key={schedule ? `${vehicle.id}-${schedule.id}` : vehicle.id}
                  ref={
                    index === sortedDepartures.length - 1 ? lastVehicleElementRef : null
                  }
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  layout
                  onHoverStart={() => setHoveredCard(vehicle.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                >
                  <Card
                    className={cn(
                      "overflow-hidden border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-zinc-900/50 backdrop-blur-xl",
                      hoveredCard === vehicle.id &&
                        "border-sky-500/50 dark:border-sky-500/50 shadow-sky-500/10"
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Bus Info */}
                        <div className="bg-sky-50/50 dark:bg-sky-900/10 rounded-xl p-4">
                          <BusInfo vehicle={vehicle} />
                        </div>

                        {/* Time and Route */}
                        <div className="md:col-span-2 bg-sky-50/30 dark:bg-sky-900/10 rounded-xl p-4">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                            {/* Source City */}
                            <div className="text-center flex-1">
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="relative"
                              >
                                <div className="w-16 h-16 mx-auto rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-3">
                                  <MapPin className="h-8 w-8 text-sky-600 dark:text-sky-500" />
                                </div>
                                <h3 className="text-lg font-bold text-sky-700 dark:text-sky-400 mb-1">
                                  {vehicle?.route?.sourceCity}
                                </h3>
                                <p className="text-sm font-medium text-sky-600/80 dark:text-sky-500/80">
                                  {formatScheduleTime(departureTime)}
                                </p>
                              </motion.div>
                            </div>

                            {/* Route Line */}
                            <div className="flex-[2] px-4 py-2">
                              <motion.div
                                initial={{ opacity: 0, scaleX: 0 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                transition={{ duration: 0.5 }}
                                className="relative flex flex-col items-center justify-center h-full py-4"
                              >
                                <div className="relative w-full">
                                  <div className="h-2 w-full bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 rounded-full shadow-lg" />

                                  {/* Animated Bus */}
                                  <motion.div
                                    initial={{ left: "0%", scale: 0 }}
                                    animate={{ left: "100%", scale: 1 }}
                                    transition={{
                                      duration: 2,
                                      ease: "easeInOut",
                                      repeat: Infinity,
                                      repeatDelay: 1,
                                    }}
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                                  >
                                    <div className="bg-white dark:bg-sky-900/50 p-2 rounded-full shadow-xl">
                                      <Ship className="h-5 w-5 text-sky-500" />
                                    </div>
                                  </motion.div>
                                </div>

                                <div className="flex items-center justify-between w-full mt-6 space-x-2">
                                  <Badge
                                    variant="outline"
                                    className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800 whitespace-nowrap"
                                  >
                                    {vehicle?.route?.distance} NM
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800 whitespace-nowrap"
                                  >
                                    Departs {formatScheduleTime(departureTime)}
                                    {" · "}
                                    {formatScheduleTime(arrivalTime)} arrival
                                  </Badge>
                                </div>
                              </motion.div>
                            </div>

                            {/* Destination City */}
                            <div className="text-center flex-1">
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="relative"
                              >
                                <div className="w-16 h-16 mx-auto rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-3">
                                  <MapPin className="h-8 w-8 text-sky-600 dark:text-sky-500" />
                                </div>
                                <h3 className="text-lg font-bold text-sky-700 dark:text-sky-400 mb-1">
                                  {vehicle?.route?.destinationCity}
                                </h3>
                                <p className="text-sm font-medium text-sky-600/80 dark:text-sky-500/80">
                                  {formatScheduleTime(arrivalTime)}
                                </p>
                              </motion.div>
                            </div>
                          </div>
                        </div>

                        {/* Price and Book */}
                        <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-4 bg-sky-50/50 dark:bg-sky-900/10 rounded-xl p-4">
                          <div className="text-center md:text-right space-y-3 w-full">
                            {/* Price information (based on selected passenger category) */}
                            {(() => {
                              const { amount, currency: cur } =
                                priceForCategory(vehicle, passengerCategory);
                              const label =
                                passengerCategory === "LOCAL"
                                  ? "Local"
                                  : passengerCategory === "EXPAT"
                                  ? "Expat"
                                  : passengerCategory === "TOURIST"
                                  ? "Tourist"
                                  : "Fare";
                              return (
                                <motion.div
                                  whileHover={{ scale: 1.02 }}
                                  className="flex flex-col items-end"
                                >
                                  <div className="flex items-center gap-2 w-full justify-end bg-sky-100/50 dark:bg-sky-900/30 p-2 rounded-lg">
                                    <span className="text-sm font-medium text-sky-700 dark:text-sky-400">
                                      {label}
                                    </span>
                                    <p className="text-2xl font-bold text-sky-800 dark:text-sky-300">
                                      {amount != null
                                        ? formatMoney(amount, cur)
                                        : `${cur} —`}
                                    </p>
                                  </div>
                                  {amount == null && (
                                    <span className="block text-xs text-muted-foreground italic mt-1">
                                      No {label.toLowerCase()} fare set — contact
                                      operator
                                    </span>
                                  )}
                                </motion.div>
                              );
                            })()}

                            {/* Book Now Button */}
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full"
                            >
                              <Button
                                onClick={() => handleBookNow(vehicleForBooking)}
                                className="w-full bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-black dark:text-white font-medium px-6 py-3 rounded-xl text-lg shadow-lg transition-all duration-300"
                              >
                                Book Now
                                <ArrowRight className="ml-2 h-5 w-5" />
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </div>

                      {/* Additional Features */}
                      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <BoardingPointsDialog
                            vehicle={vehicle}
                            formatPointTime={formatPointTime}
                          />
                          <DroppingPointsDialog
                            vehicle={vehicle}
                            formatPointTime={formatPointTime}
                          />
                          <CancellationPolicyDialog />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>

        {/* Loading Skeletons */}
        {loading && (
          <>
            <TicketSkeleton />
            <TicketSkeleton />
            <TicketSkeleton />
          </>
        )}
      </div>

      {selectedVehicle && (
        <SeatLayoutSheet
          vehicle={selectedVehicle}
          isOpen={showSeatLayout}
          onClose={() => {
            setShowSeatLayout(false);
            setSelectedVehicleState(null);
          }}
        />
      )}

      {/* Passenger Category Modal */}
      <Dialog
        open={categoryModalOpen}
        onOpenChange={(v) => {
          // Prevent closing without selection if none previously stored
          if (!v && !passengerCategory) return;
          setCategoryModalOpen(v);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Your Category</DialogTitle>
            <DialogDescription>
              Choose your passenger category to see the correct ferry prices
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {CATEGORY_OPTIONS.map((opt) => {
              const selected = pendingCategory === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPendingCategory(opt.value)}
                  className={cn(
                    "w-full text-left p-4 border rounded-xl transition flex items-start gap-3",
                    selected
                      ? `ring-2 ${opt.ring} border-transparent`
                      : "hover:bg-accent"
                  )}
                >
                  <span
                    className={cn(
                      "h-3.5 w-3.5 rounded-full mt-1 shrink-0",
                      opt.color
                    )}
                  />
                  <div>
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {opt.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <Button
            onClick={confirmCategory}
            disabled={!pendingCategory}
            className="w-full mt-4 bg-sky-500 hover:bg-sky-600 text-white"
          >
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
