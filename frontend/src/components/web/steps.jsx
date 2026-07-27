"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const services = [
  {
    title: "Scheduled Ferry",
    tag: "Everyday transport",
    desc: "Public and speedboat ferry connections between islands — book a seat in seconds.",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1600&auto=format&fit=crop",
    href: "/bus-tickets",
    cta: "Search ferries",
  },
  {
    title: "Private Charter",
    tag: "Sea, on your terms",
    desc: "Rent a speedboat or dhoni for the day. Custom itineraries, verified operators, transparent quotes.",
    image:
      "https://images.unsplash.com/photo-1548574505-5e239809ee19?q=80&w=1600&auto=format&fit=crop",
    href: "/charter",
    cta: "Book a charter",
  },
  {
    title: "Logistics",
    tag: "Cargo, delivered",
    desc: "Ship supplies, equipment, and bulk cargo to any inhabited island in the Maldives.",
    image:
      "https://images.unsplash.com/photo-1494412651409-8dd18a7ca6e5?q=80&w=1600&auto=format&fit=crop",
    href: "/logistics",
    cta: "Request logistics",
  },
];

export default function Steps() {
  return (
    <section className="section-padding bg-background">
      <div className="container-x">
        <div className="max-w-2xl mb-14 md:mb-20">
          <span className="chip bg-lagoon/10 text-lagoon uppercase tracking-[0.2em]">Services</span>
          <h2 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light text-ocean-deep italic leading-[1.05] text-balance">
            Three ways to
            <br />
            <span className="text-gradient-ocean not-italic font-normal">move by sea.</span>
          </h2>
        </div>

        <div className="space-y-16 md:space-y-24">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center ${
                i % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div>
                <div className="relative rounded-[2rem] overflow-hidden aspect-[5/4] shadow-premium">
                  <img
                    src={s.image}
                    alt={s.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-ocean-deep/20 to-transparent" />
                </div>
              </div>
              <div className="max-w-md">
                <span className="text-xs uppercase tracking-[0.22em] text-coral font-medium">
                  {s.tag}
                </span>
                <h3
                  className="mt-3 text-3xl md:text-5xl italic font-light text-ocean-deep leading-[1.05]"
                  style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
                >
                  {s.title}
                </h3>
                <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
                <Link
                  href={s.href}
                  className="mt-8 inline-flex items-center gap-2 text-coral hover:text-coral-soft font-medium tracking-wide group"
                >
                  {s.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
