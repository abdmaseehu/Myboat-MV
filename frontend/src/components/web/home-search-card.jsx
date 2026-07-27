"use client";

import { motion } from "framer-motion";
import SearchForm from "@/components/web/bus-tickets/search-form";

export default function HomeSearchCard() {
  return (
    <section className="relative -mt-24 md:-mt-32 lg:-mt-40 z-10">
      <div className="container-x">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          className="glass-white rounded-3xl shadow-premium p-5 md:p-8 lg:p-10 max-w-6xl mx-auto"
        >
          <SearchForm />
        </motion.div>
      </div>
    </section>
  );
}
