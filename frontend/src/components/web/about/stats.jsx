"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Users, Ship, MapPin, Award } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "50K+",
    label: "Happy Customers",
    description: "Satisfied travelers who trust us",
  },
  {
    icon: Ship,
    value: "1000+",
    label: "Boat Partners",
    description: "Quality ferry operators nationwide",
  },
  {
    icon: MapPin,
    value: "100+",
    label: "Destinations",
    description: "Routes covering major islands",
  },
  {
    icon: Award,
    value: "5★",
    label: "Rating",
    description: "Average customer satisfaction",
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
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

export default function Stats() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="py-16 bg-white dark:bg-zinc-900/50">
      <motion.div
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        className="container mx-auto px-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative group"
            >
              <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-50 to-white dark:from-zinc-900 dark:to-zinc-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-sky-100/20 dark:border-sky-500/10">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-sky-500/10 text-sky-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-sky-500 mb-2">
                  {stat.value}
                </h3>
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  {stat.label}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
