"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Anchor } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function Hero() {
  return (
    <section className="relative isolate min-h-[92vh] md:min-h-screen flex items-end md:items-center overflow-hidden bg-ocean-gradient text-white">
      {/* Background image overlay */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-45 mix-blend-overlay"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=2000&auto=format&fit=crop')",
        }}
        aria-hidden="true"
      />
      {/* Subtle darken at top so header stays readable */}
      <div className="absolute inset-x-0 top-0 h-40 -z-10 bg-gradient-to-b from-ocean-deep/70 to-transparent" />

      {/* Floating soft blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-20 h-[420px] w-[420px] rounded-full bg-lagoon-light/20 blur-3xl animate-drift" />
        <div className="absolute top-1/3 -right-32 h-[500px] w-[500px] rounded-full bg-coral/20 blur-3xl animate-drift" style={{ animationDelay: "-6s" }} />
        <div className="absolute -bottom-40 left-1/3 h-[380px] w-[380px] rounded-full bg-lagoon/25 blur-3xl animate-drift" style={{ animationDelay: "-12s" }} />
      </div>

      {/* Content */}
      <div className="container-x pt-32 md:pt-24 pb-16 md:pb-32 w-full">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          {/* Pre-title chip */}
          <motion.div variants={item} className="flex justify-center">
            <span className="chip glass text-white text-[11px] uppercase tracking-[0.22em]">
              <Sparkles className="h-3 w-3" /> Maldives Sea Marketplace
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={item}
            className="mt-6 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-[0.98] text-balance"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontStyle: "italic" }}
          >
            Sail the Maldives,
            <br />
            <span className="text-gradient-lagoon not-italic font-normal" style={{ WebkitTextStroke: "0" }}>
              effortlessly.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={item}
            className="mt-6 md:mt-8 text-base md:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed"
          >
            Ferries, private charters, and cargo across 1,192 islands.
            Verified operators. Instant confirmations.
          </motion.p>

          {/* CTA row (visible on mobile above search) */}
          <motion.div
            variants={item}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 md:hidden"
          >
            <Button
              asChild
              className="bg-coral hover:bg-coral-soft text-white rounded-full h-12 px-6 shadow-coral tracking-wide"
            >
              <Link href="/bus-tickets">
                Book a ferry <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white rounded-full h-12 px-6 backdrop-blur"
            >
              <Link href="/charter">
                <Anchor className="h-4 w-4 mr-1.5" /> Charter
              </Link>
            </Button>
          </motion.div>

          {/* Trust row */}
          <motion.div
            variants={item}
            className="mt-10 md:mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs md:text-sm text-white/70"
          >
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-lagoon-light" />
              1,192 islands
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-lagoon-light" />
              200+ verified operators
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-lagoon-light" />
              Book in 60 seconds
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Wave-ish soft fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background pointer-events-none" />
    </section>
  );
}
