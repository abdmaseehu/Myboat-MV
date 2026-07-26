"use client";

import { motion } from "framer-motion";
import { useCustomFields } from "@/hooks/use-custom-fields";
import { useEffect, useState, useCallback } from "react";

const containerVariants = {
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const textVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

// Default content
const defaultContent = {
  title: "Our Services",
  subtitle: "Comprehensive Sea Travel Solutions",
  description:
    "Discover our range of services designed to make your sea travel experience seamless, comfortable, and enjoyable.",
};

export default function ServicesHero() {
  const { getFieldByName } = useCustomFields();
  const [content, setContent] = useState(null);

  // Use useCallback with empty dependency array
  const fetchContent = useCallback(async () => {
    try {
      const response = await getFieldByName("services_hero");
      setContent(response || defaultContent);
    } catch (error) {
      console.error("Error fetching services hero content:", error);
      setContent(defaultContent);
    }
  }, []); // Empty dependency array

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // If content is null, show default content
  const displayContent = content || defaultContent;

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={
            displayContent.hero_img
              ? `${process.env.NEXT_PUBLIC_ROOT_URL}/uploads/${displayContent.hero_img}`
              : "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=2940&auto=format&fit=crop"
          }
          alt="Ferry Services"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/80" />
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="container mx-auto px-4 relative z-10"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            variants={textVariants}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            {displayContent.title}
          </motion.h1>

          <motion.h2
            variants={textVariants}
            className="text-xl md:text-2xl font-medium text-sky-400 mb-6"
          >
            {displayContent.subtitle}
          </motion.h2>

          <motion.p
            variants={textVariants}
            className="text-lg text-gray-200 leading-relaxed mb-8 max-w-2xl mx-auto"
          >
            {displayContent.description}
          </motion.p>

          <motion.div
            variants={textVariants}
            className="flex items-center justify-center gap-4"
          >
            <div className="w-20 h-1 bg-gradient-to-r from-sky-500 to-sky-600 rounded-full" />
            <span className="text-sky-400 font-medium">
              {displayContent.est2024}
            </span>
            <div className="w-20 h-1 bg-gradient-to-r from-sky-600 to-sky-500 rounded-full" />
          </motion.div>
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
