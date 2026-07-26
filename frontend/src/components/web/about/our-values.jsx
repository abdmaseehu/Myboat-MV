"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Clock, ThumbsUp, Users2 } from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Safety First",
    description:
      "We prioritize the safety and security of our passengers above all else, partnering only with verified and reliable ferry operators.",
  },
  {
    icon: Clock,
    title: "Reliability",
    description:
      "We understand the importance of punctuality and strive to ensure all our services run according to schedule.",
  },
  {
    icon: ThumbsUp,
    title: "Quality Service",
    description:
      "We maintain high standards of service quality, from the booking process to the completion of your journey.",
  },
  {
    icon: Users2,
    title: "Customer Focus",
    description:
      "Our customers are at the heart of everything we do, and we're committed to providing exceptional support at every step.",
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

export default function OurValues() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="py-20 bg-gradient-to-br from-sky-50 via-white to-sky-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
      <motion.div
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        className="container mx-auto px-4"
      >
        <div className="text-center mb-12">
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Our Core Values
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            These principles guide our actions and shape our commitment to
            providing the best sea travel experience.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative"
            >
              <div className="p-6 rounded-xl bg-white dark:bg-zinc-900 shadow-lg group-hover:shadow-xl transition-all duration-300 h-full border border-sky-100/20 dark:border-sky-500/10">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-500 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <value.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
