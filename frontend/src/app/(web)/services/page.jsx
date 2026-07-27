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
      className="min-h-screen bg-sand-gradient"
    >
      <ServicesHero />
      <ServicesList />
      <ServiceFeatures />
      <ServiceProcess />
      <ServiceTestimonials />
    </motion.div>
  );
}
