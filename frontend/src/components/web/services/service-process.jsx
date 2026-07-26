"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Search, Calendar, CreditCard, Ticket } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search Routes",
    description:
      "Enter your departure and destination cities to find available boat routes.",
  },
  {
    icon: Calendar,
    title: "Choose Schedule",
    description:
      "Select your preferred travel date and time from available options.",
  },
  {
    icon: CreditCard,
    title: "Make Payment",
    description:
      "Complete your booking with secure payment using your preferred method.",
  },
  {
    icon: Ticket,
    title: "Get Ticket",
    description: "Receive your e-ticket instantly via email and in the app.",
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
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function ServiceProcess() {
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
            How It Works
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Book your ferry tickets in four simple steps
          </motion.p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="absolute left-[50%] top-0 bottom-0 w-px bg-sky-200 dark:bg-sky-500/20 hidden md:block" />

          <div className="space-y-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`flex flex-col md:flex-row items-center gap-8 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Icon */}
                <div className="w-full md:w-1/2 flex justify-center md:justify-end">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-sky-500/10 flex items-center justify-center relative z-10">
                      <step.icon className="w-8 h-8 text-sky-500" />
                    </div>
                    <div className="absolute inset-0 bg-sky-500/5 rounded-full blur-xl" />
                  </div>
                </div>

                {/* Content */}
                <div className="w-full md:w-1/2 text-center md:text-left">
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
