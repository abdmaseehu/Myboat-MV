"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle } from "lucide-react";

const features = [
  {
    title: "Real-Time Tracking",
    description:
      "Track your boat location in real-time and get accurate ETAs for your journey.",
    image:
      "https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?q=80&w=2072&auto=format&fit=crop",
    benefits: [
      "Live GPS tracking",
      "Accurate arrival times",
      "Route progress updates",
      "Smart notifications",
    ],
  },
  {
    title: "Comfort & Amenities",
    description:
      "Experience comfortable travel with modern boats equipped with essential amenities.",
    image:
      "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=2071&auto=format&fit=crop",
    benefits: [
      "Reclining seats",
      "Air conditioning",
      "Entertainment systems",
      "Clean restrooms",
    ],
  },
  {
    title: "Flexible Booking",
    description:
      "Book, modify, or cancel your tickets with ease through our user-friendly platform.",
    image:
      "https://images.unsplash.com/photo-1531685250784-7569952593d2?q=80&w=2074&auto=format&fit=crop",
    benefits: [
      "Easy modifications",
      "Instant refunds",
      "Multiple payment options",
      "Digital tickets",
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

export default function ServiceFeatures() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="py-20">
      <motion.div
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        className="container mx-auto px-4"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="flex flex-col md:flex-row items-center gap-8 mb-20 last:mb-0"
            style={{
              flexDirection: index % 2 === 0 ? "row" : "row-reverse",
            }}
          >
            {/* Image Section */}
            <div className="w-full md:w-1/2">
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-transparent" />
              </div>
            </div>

            {/* Content Section */}
            <div className="w-full md:w-1/2">
              <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
              <p className="text-lg text-muted-foreground mb-6">
                {feature.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {feature.benefits.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 text-foreground"
                  >
                    <CheckCircle className="w-5 h-5 text-sky-500" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
