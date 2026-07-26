"use client";

import { motion } from "framer-motion";
import ServicesHero from "@/components/web/services/services-hero";
import ServicesList from "@/components/web/services/services-list";
import ServiceFeatures from "@/components/web/services/service-features";
import ServiceProcess from "@/components/web/services/service-process";
import ServiceTestimonials from "@/components/web/services/service-testimonials";

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.2 } },
};

export default function ServicesPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={pageVariants}
      className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800"
    >
      <ServicesHero />
      <ServicesList />
      <ServiceFeatures />
      <ServiceProcess />
      <ServiceTestimonials />
    </motion.div>
  );
}
