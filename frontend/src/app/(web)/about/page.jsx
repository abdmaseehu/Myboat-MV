"use client";

import { motion } from "framer-motion";
import AboutHero from "@/components/web/about/about-hero";
import OurMission from "@/components/web/about/our-mission";
import OurValues from "@/components/web/about/our-values";
import OurTeam from "@/components/web/about/our-team";
import Stats from "@/components/web/about/stats";

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.2 } },
};

export default function AboutPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={pageVariants}
      className="min-h-screen bg-sand-gradient"
    >
      <AboutHero />
      <Stats />
      <OurMission />
      <OurValues />
      <OurTeam />
    </motion.div>
  );
}
