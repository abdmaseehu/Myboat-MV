"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Anchor } from "lucide-react";

export default function Blog() {
  return (
    <section className="relative section-padding overflow-hidden bg-ocean-gradient text-white isolate">
      {/* Overlay image + blobs */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-25 mix-blend-overlay"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1573843981267-be1999ff37cd?q=80&w=2000&auto=format&fit=crop')",
        }}
      />
      <div className="pointer-events-none absolute -top-24 left-10 h-80 w-80 rounded-full bg-lagoon-light/25 blur-3xl animate-drift" />
      <div className="pointer-events-none absolute -bottom-32 right-10 h-96 w-96 rounded-full bg-coral/25 blur-3xl animate-drift" style={{ animationDelay: "-8s" }} />

      <div className="container-x relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto text-center space-y-8"
        >
          <span className="chip glass text-white uppercase tracking-[0.22em]">
            <Anchor className="h-3 w-3" /> Ready when you are
          </span>
          <h2
            className="text-5xl md:text-7xl font-light italic leading-[0.98] text-balance"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            Ready to sail?
          </h2>
          <p className="text-white/80 text-lg md:text-xl max-w-xl mx-auto">
            Find a ferry, request a private charter, or move cargo — start in a single click.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Button
              asChild
              className="bg-coral hover:bg-coral-soft text-white rounded-full h-14 px-8 text-base font-medium shadow-coral tracking-wide"
            >
              <Link href="/bus-tickets">
                Book a ferry <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-white/10 border-white/30 hover:bg-white/20 hover:text-white text-white rounded-full h-14 px-8 backdrop-blur"
            >
              <Link href="/charter">Request a charter</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
