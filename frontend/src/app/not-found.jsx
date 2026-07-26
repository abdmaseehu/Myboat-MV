"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { ArrowLeft, CloudSun, CloudMoon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Handle mounting state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render theme-dependent content until mounted
  if (!mounted) {
    return null; // or a loading placeholder
  }

  // Variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const boatVariants = {
    initial: { x: -1000, rotate: 0 },
    animate: {
      x: 1000,
      rotate: [0, -3, 3, -3, 0],
      transition: {
        x: {
          duration: 5,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
        },
        rotate: {
          duration: 1.5,
          repeat: Infinity,
          repeatType: "reverse",
        },
      },
    },
  };

  const cloudVariants = {
    animate: {
      x: [-20, 20, -20],
      y: [-10, 10, -10],
      transition: {
        duration: 5,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center p-4">
      <motion.div
        className="max-w-2xl w-full text-center relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Decorative elements */}
        <motion.div
          className="absolute top-0 left-10 text-sky-400 dark:text-sky-500"
          variants={cloudVariants}
          animate="animate"
        >
          {theme === "dark" ? (
            <CloudMoon className="w-12 h-12 opacity-50" />
          ) : (
            <CloudSun className="w-12 h-12 opacity-50" />
          )}
        </motion.div>
        <motion.div
          className="absolute top-20 right-10 text-sky-400 dark:text-sky-500"
          variants={cloudVariants}
          animate="animate"
        >
          {theme === "dark" ? (
            <CloudMoon className="w-8 h-8 opacity-30" />
          ) : (
            <CloudSun className="w-8 h-8 opacity-30" />
          )}
        </motion.div>

        {/* Main content */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-sky-500 via-sky-600 to-sky-500 dark:from-sky-400 dark:via-sky-500 dark:to-sky-400 bg-clip-text text-transparent">
            404
          </h1>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-zinc-700 dark:text-zinc-300">
            Oops! You've Gone Off Route
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Looks like this boat stop doesn't exist on our map.
          </p>
        </motion.div>

        {/* Animated speedboat scene */}
        <motion.div className="relative h-32 mb-8 overflow-hidden">
          {/* Water waves */}
          <div className="absolute bottom-0 w-full h-3 bg-gradient-to-r from-sky-300 via-sky-400 to-sky-300 dark:from-sky-800 dark:via-sky-700 dark:to-sky-800 rounded-full opacity-70" />
          <div className="absolute bottom-1 w-full h-1 bg-sky-200/60 dark:bg-sky-900/40 rounded-full" />

          {/* Speedboat */}
          <motion.div
            variants={boatVariants}
            initial="initial"
            animate="animate"
            className="absolute bottom-3"
          >
            <div className="relative">
              {/* Hull */}
              <div className="w-28 h-6 bg-gradient-to-b from-sky-500 to-sky-700 dark:from-sky-600 dark:to-sky-800 rounded-b-[50%] shadow-xl relative">
                {/* Cabin */}
                <div className="absolute -top-4 left-8 w-14 h-5 bg-gradient-to-b from-white to-sky-100 dark:from-zinc-200 dark:to-zinc-300 rounded-t-lg">
                  {/* Windshield */}
                  <div className="absolute top-1 left-1 right-1 h-2 bg-sky-300/70 dark:bg-sky-400/50 rounded-sm" />
                </div>
                {/* Bow accent */}
                <div className="absolute top-0 right-0 w-3 h-3 bg-sky-800 dark:bg-sky-900 rounded-tr-lg" />
              </div>
              {/* Wake spray */}
              <div className="absolute -bottom-1 -left-2 w-3 h-2 bg-white/70 dark:bg-white/40 rounded-full blur-[1px]" />
              <div className="absolute -bottom-1 -left-4 w-2 h-1 bg-white/50 dark:bg-white/30 rounded-full blur-[1px]" />
            </div>
          </motion.div>
        </motion.div>

        {/* Action button */}
        <motion.div variants={itemVariants}>
          <Link href="/">
            <Button
              size="lg"
              className="bg-sky-500 hover:bg-sky-600 text-black font-medium px-8 rounded-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </motion.div>

        {/* Location marker */}
        <motion.div
          variants={itemVariants}
          className="mt-8 inline-flex items-center space-x-2 text-sm text-zinc-500 dark:text-zinc-400"
        >
          <MapPin className="h-4 w-4" />
          <span>Current Location: Lost in Transit</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
