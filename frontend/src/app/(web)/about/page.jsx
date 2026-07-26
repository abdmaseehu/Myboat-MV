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
      className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800"
    >
      <AboutHero />
      <Stats />
      <OurMission />
      <OurValues />
      <OurTeam />
    </motion.div>
  );
}
