"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, Star, Shield, Ship } from "lucide-react";
import SearchForm from "@/components/web/bus-tickets/search-form";
import { useCustomFields } from "@/hooks/use-custom-fields";

export default function Hero() {
  const [heroData, setHeroData] = useState(null);
  const { getFieldByName } = useCustomFields();

  // Memoize the fetch function to prevent recreation on each render
  const fetchHeroData = useCallback(async () => {
    try {
      const response = await getFieldByName("hero_section");
      setHeroData(response);
    } catch (error) {
      console.error("Error fetching hero data:", error);
    }
  }, []); // Empty dependency array since getFieldByName is stable

  // Only fetch on mount
  useEffect(() => {
    fetchHeroData();
  }, [fetchHeroData]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-800">
      {/* Background Image with Parallax Effect */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
        className="absolute inset-0 z-0"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: heroData?.hero_bg
              ? `url('${process.env.NEXT_PUBLIC_ROOT_URL}/uploads/${heroData.hero_bg}')`
              : "url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>
      </motion.div>

      <div className="container mx-auto px-4 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white space-y-8"
          >
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              {heroData?.title || "Begin Your Journey with Comfort & Style"}
            </h1>
            <p className="text-lg md:text-xl text-gray-300">
              {heroData?.sub_title ||
                "Experience hassle-free sea travel with our premium service. Book tickets instantly, travel comfortably, and reach your destination safely."}
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10">
                  <Clock className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {heroData?.["247_support"] || "24/7 Support"}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {heroData?.["247_support_sub"] ||
                      "Round-the-clock customer assistance"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10">
                  <Star className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {heroData?.premium_service || "Premium Services"}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {heroData?.premium_service_sub ||
                      "Luxury boats with amenities"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10">
                  <Shield className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {heroData?.secure_booking || "Secure Booking"}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {heroData?.secure_booking_sub ||
                      "Safe & easy payment options"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10">
                  <Ship className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {heroData?.wide_network || "Wide Network"}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {heroData?.wide_network_sub ||
                      "Multiple routes & destinations"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Booking Form */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8"
          >
            <SearchForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
