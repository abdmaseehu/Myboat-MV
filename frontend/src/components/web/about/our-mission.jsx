"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Target, Rocket, Heart } from "lucide-react";

const missions = [
  {
    icon: Target,
    title: "Our Mission",
    description:
      "To revolutionize sea travel by providing a seamless, reliable, and user-friendly platform that connects travelers with quality ferry services across the Maldives.",
  },
  {
    icon: Rocket,
    title: "Our Vision",
    description:
      "To become the leading digital platform for sea travel, setting new standards in convenience, reliability, and customer satisfaction in the transportation industry.",
  },
  {
    icon: Heart,
    title: "Our Promise",
    description:
      "We are committed to delivering exceptional service, maintaining transparency, and ensuring a comfortable journey for every passenger who travels with us.",
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
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

export default function OurMission() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute left-0 top-0 w-1/3 h-1/3 bg-gradient-to-br from-sky-500/5 to-transparent" />
        <div className="absolute right-0 bottom-0 w-1/3 h-1/3 bg-gradient-to-tl from-sky-500/5 to-transparent" />
      </div>

      <motion.div
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        className="container mx-auto px-4 relative z-10"
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {missions.map((mission, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative group"
              >
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 shadow-lg hover:shadow-xl transition-all duration-300 h-full border border-sky-100/20 dark:border-sky-500/10">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-sky-500/10 text-sky-500 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <mission.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {mission.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {mission.description}
                  </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -inset-px bg-gradient-to-br from-sky-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl -z-10" />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
