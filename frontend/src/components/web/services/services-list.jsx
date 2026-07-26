"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  Ship,
  Calendar,
  CreditCard,
  Users,
  MapPin,
  HeadphonesIcon,
} from "lucide-react";

const services = [
  {
    icon: Ship,
    title: "Ferry Booking",
    description:
      "Easy and secure ferry ticket booking with instant confirmation.",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop",
  },
  {
    icon: Calendar,
    title: "Schedule Management",
    description:
      "Flexible scheduling options with real-time updates and notifications.",
    image:
      "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Multiple payment options with secure transaction processing.",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2070&auto=format&fit=crop",
  },
  {
    icon: Users,
    title: "Group Bookings",
    description:
      "Special rates and easy management for group travel arrangements.",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070&auto=format&fit=crop",
  },
  {
    icon: MapPin,
    title: "Route Planning",
    description: "Optimized route suggestions with multiple options and stops.",
    image:
      "https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?q=80&w=2074&auto=format&fit=crop",
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description: "Round-the-clock customer support for all your travel needs.",
    image:
      "https://images.unsplash.com/photo-1534536281715-e28d76689b4d?q=80&w=2070&auto=format&fit=crop",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function ServicesList() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="py-20 bg-white dark:bg-zinc-900/50">
      <motion.div
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        className="container mx-auto px-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative"
            >
              <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-50 to-white dark:from-zinc-900 dark:to-zinc-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-sky-100/20 dark:border-sky-500/10 overflow-hidden">
                {/* Service Image */}
                <div className="relative h-48 mb-6 rounded-xl overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-sky-500/10 text-sky-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {service.title}
                </h3>
                <p className="text-muted-foreground">{service.description}</p>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
