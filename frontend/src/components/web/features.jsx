"use client";

import { motion } from "framer-motion";
import { Ship, Shield, Zap, Users } from "lucide-react";

const features = [
  {
    icon: Ship,
    title: "Verified operators",
    desc: "Every captain, boat, and business on Myboat is vetted so you sail with confidence.",
  },
  {
    icon: Shield,
    title: "Secure payments",
    desc: "Encrypted transactions and buyer protection built into every booking.",
  },
  {
    icon: Zap,
    title: "Instant confirmation",
    desc: "Book in under a minute — your ticket lands in your inbox before you close the tab.",
  },
  {
    icon: Users,
    title: "Fair tiered pricing",
    desc: "Transparent rates for locals, residents, and visitors — no hidden markups.",
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function Features() {
  return (
    <section className="section-padding bg-background">
      <div className="container-x">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
          className="max-w-2xl mb-14 md:mb-20"
        >
          <motion.span variants={item} className="chip bg-lagoon/10 text-lagoon uppercase tracking-[0.2em]">
            Why Myboat
          </motion.span>
          <motion.h2
            variants={item}
            className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light text-ocean-deep italic leading-[1.05] text-balance"
          >
            Every boat, every island,
            <br />
            <span className="text-gradient-ocean not-italic font-normal">one place.</span>
          </motion.h2>
          <motion.p variants={item} className="mt-5 text-lg text-muted-foreground max-w-xl">
            A single home for scheduled ferries, private charters, and cargo across the Maldives.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={container}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="group bg-white rounded-3xl p-7 md:p-8 shadow-premium hover-lift border border-border/40"
            >
              <div className="w-14 h-14 rounded-2xl bg-lagoon/10 text-lagoon flex items-center justify-center mb-6 group-hover:bg-lagoon group-hover:text-white transition-colors duration-300">
                <f.icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h3 className="text-xl text-ocean-deep font-medium mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
