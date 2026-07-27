"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Booked our Malé to Maafushi transfer in under a minute. The speedboat was spotless and the crew treated us like guests, not passengers.",
    author: "Priya P.",
    location: "Bangalore",
  },
  {
    quote:
      "As someone who lives on Dhigurah, Myboat made scheduling my weekly Malé trips something I don't have to think about anymore.",
    author: "Arun S.",
    location: "Dhigurah, Ari",
  },
  {
    quote:
      "The private charter for our family's honeymoon party was flawless — three quotes within an hour, and the operator was outstanding.",
    author: "Meera & Karthik",
    location: "Mumbai",
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function Testimonials() {
  return (
    <section className="section-padding bg-foam">
      <div className="container-x">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
          className="max-w-2xl mx-auto text-center mb-14 md:mb-20"
        >
          <motion.span variants={item} className="chip bg-white/70 text-ocean-deep uppercase tracking-[0.2em]">
            Guests say
          </motion.span>
          <motion.h2
            variants={item}
            className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light text-ocean-deep italic leading-[1.05] text-balance"
          >
            Loved by travellers
            <br />
            and locals alike.
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={container}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6"
        >
          {testimonials.map((t, i) => (
            <motion.figure
              key={i}
              variants={item}
              className="bg-white rounded-3xl p-8 md:p-10 shadow-premium hover-lift border border-border/40 flex flex-col"
            >
              <Quote className="h-8 w-8 text-coral/70 mb-6" />
              <blockquote
                className="text-xl md:text-[22px] leading-[1.4] text-ocean-deep italic font-light flex-1"
                style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
              >
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-8 pt-6 border-t border-border/50">
                <div className="text-ocean-deep font-medium text-sm">{t.author}</div>
                <div className="text-xs text-muted-foreground tracking-wide uppercase">{t.location}</div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
