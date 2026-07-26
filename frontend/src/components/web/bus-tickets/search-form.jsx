import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CalendarIcon, Loader2, MapPin, Ship, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { toast } from "sonner";

export default function SearchForm({
  isDialog = false,
  defaultValues = {},
  onClose,
  className,
}) {
  const router = useRouter();
  const [date, setDate] = useState(
    defaultValues.date ? new Date(defaultValues.date) : new Date()
  );
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [formData, setFormData] = useState({
    sourceCity: defaultValues.from || "",
    destinationCity: defaultValues.to || "",
    routeId: defaultValues.routeId || "",
  });

  // Get unique source cities
  const sourceCities = [
    ...new Set(routes.map((route) => route.sourceCity)),
  ].sort();

  // Get destination cities based on selected source city
  const destinationCities = routes
    .filter((route) => route.sourceCity === formData.sourceCity)
    .map((route) => route.destinationCity)
    .sort();

  // Fetch cities on component mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setIsLoadingCities(true);
        const response = await api.get("/public/cities");
        if (response.data.success) {
          setRoutes(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        toast.error("Failed to load islands. Please try again.");
      } finally {
        setIsLoadingCities(false);
      }
    };

    fetchCities();
  }, []);

  const handleSearch = async () => {
    if (!formData.sourceCity || !formData.destinationCity || !date) {
      toast.error("Please select all required fields");
      return;
    }

    try {
      setLoading(true);
      // Find the route ID based on source and destination cities
      const selectedRoute = routes.find(
        (route) =>
          route.sourceCity === formData.sourceCity &&
          route.destinationCity === formData.destinationCity
      );

      if (selectedRoute) {
        // Add a small delay to show loading state
        await new Promise((resolve) => setTimeout(resolve, 800));

        const searchUrl = `/bus-tickets?route-id=${
          selectedRoute.id
        }&from=${encodeURIComponent(
          formData.sourceCity
        )}&to=${encodeURIComponent(formData.destinationCity)}&date=${format(
          date,
          "yyyy-MM-dd"
        )}`;

        router.push(searchUrl);
        if (onClose) onClose();
      } else {
        toast.error("No routes available for selected islands");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error searching routes:", error);
      toast.error("Failed to search routes. Please try again.");
      setLoading(false);
    }
  };

  const FormContent = () => (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Book Your Trip</h2>
        <p className="text-sm text-gray-300">
          Find the perfect boat for your journey
        </p>
      </div>

      {/* Source City */}
      <div className="space-y-2">
        <label className="text-sm text-gray-300">From</label>
        <Select
          value={formData.sourceCity}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              sourceCity: value,
              destinationCity: "", // Reset destination when source changes
            }))
          }
          disabled={isLoadingCities}
        >
          <SelectTrigger
            className={cn(
              "w-full border-white/20 text-white",
              isLoadingCities ? "bg-white/5" : "bg-white/10 hover:bg-white/20"
            )}
          >
            <SelectValue placeholder="Select departure island">
              {isLoadingCities ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading islands...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {formData.sourceCity || "Select departure island"}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sourceCities.length === 0 && !isLoadingCities ? (
              <div className="p-2 text-sm text-center text-muted-foreground">
                No islands available
              </div>
            ) : (
              sourceCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Destination City */}
      <div className="space-y-2">
        <label className="text-sm text-gray-300">To</label>
        <Select
          value={formData.destinationCity}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, destinationCity: value }))
          }
          disabled={isLoadingCities || !formData.sourceCity}
        >
          <SelectTrigger
            className={cn(
              "w-full border-white/20 text-white",
              isLoadingCities || !formData.sourceCity
                ? "bg-white/5"
                : "bg-white/10 hover:bg-white/20"
            )}
          >
            <SelectValue placeholder="Select destination island">
              {isLoadingCities ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading islands...
                </div>
              ) : !formData.sourceCity ? (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Select departure island first
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {formData.destinationCity || "Select destination island"}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {destinationCities.length === 0 ? (
              <div className="p-2 text-sm text-center text-muted-foreground">
                {!formData.sourceCity
                  ? "Select departure island first"
                  : "No destinations available"}
              </div>
            ) : (
              destinationCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <label className="text-sm text-gray-300">Journey Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20",
                !date && "text-muted-foreground"
              )}
              disabled={isLoadingCities}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Search Button */}
      <Button
        className={cn(
          "w-full font-semibold h-12 transition-all duration-200",
          loading || isLoadingCities
            ? "bg-sky-500/50 cursor-not-allowed"
            : "bg-sky-500 hover:bg-sky-600 hover:shadow-lg transform hover:-translate-y-0.5"
        )}
        onClick={handleSearch}
        disabled={
          loading ||
          isLoadingCities ||
          !formData.sourceCity ||
          !formData.destinationCity ||
          !date
        }
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Searching Available Boats...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            {isLoadingCities ? "Loading..." : "Search Available Boats"}
          </div>
        )}
      </Button>

      {/* Additional Info */}
      <p className="text-xs text-gray-400 text-center">
        * All prices include taxes and fees. Terms and conditions apply.
      </p>
    </div>
  );

  if (isDialog) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Modify Search</DialogTitle>
          </DialogHeader>
          <FormContent />
        </DialogContent>
      </Dialog>
    );
  }

  return <FormContent />;
}
