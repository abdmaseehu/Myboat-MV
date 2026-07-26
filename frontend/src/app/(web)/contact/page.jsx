"use client";

import { motion } from "framer-motion";
import ContactHero from "@/components/web/contact/contact-hero";
import ContactForm from "@/components/web/contact/contact-form";
import ContactInfo from "@/components/web/contact/contact-info";
import ContactMap from "@/components/web/contact/contact-map";
import ContactFaq from "@/components/web/contact/contact-faq";

const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

export default function ContactPage() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-background"
    >
      <ContactHero />

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <ContactForm />
          <ContactInfo />
        </div>

        <div className="mb-16">
          <ContactMap />
        </div>

        <div className="mb-16">
          <ContactFaq />
        </div>
      </div>
    </motion.div>
  );
}
