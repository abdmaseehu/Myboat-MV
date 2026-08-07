"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const destinations = [
  {
    name: "Maafushi",
    atoll: "Kaafu Atoll",
    image:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=1200&auto=format&fit=crop",
    href: "/ferry",
  },
  {
    name: "Dhigurah",
    atoll: "Ari Atoll",
    image:
      "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?q=80&w=1200&auto=format&fit=crop",
    href: "/ferry",
  },
  {
    name: "Ukulhas",
    atoll: "Ari Atoll",
    image:
      "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=1200&auto=format&fit=crop",
    href: "/ferry",
  },
  {
    name: "Dhiffushi",
    atoll: "Kaafu Atoll",
    image:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop",
    href: "/ferry",
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function SummerTrips() {
  return (
    <section className="section-padding bg-sand-gradient">
      <div className="container-x">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 md:mb-20"
        >
          <div className="max-w-2xl">
            <motion.span variants={item} className="chip bg-coral/10 text-coral uppercase tracking-[0.2em]">
              Destinations
            </motion.span>
            <motion.h2
              variants={item}
              className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light text-ocean-deep italic leading-[1.05] text-balance"
            >
              Where the water
              <br />
              is bluest.
            </motion.h2>
          </div>
          <motion.p variants={item} className="text-muted-foreground max-w-sm">
            Handpicked atolls with easy ferry connections and unforgettable sunsets.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={container}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6"
        >
          {destinations.map((d) => (
            <motion.div key={d.name} variants={item}>
              <Link
                href={d.href}
                className="group relative block aspect-[4/5] rounded-3xl overflow-hidden shadow-premium"
              >
                <img
                  src={d.image}
                  alt={d.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/85 via-ocean-deep/20 to-transparent" />
                <div className="absolute inset-x-6 bottom-6 text-white">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h3
                        className="text-2xl md:text-3xl leading-tight italic font-light"
                        style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
                      >
                        {d.name}
                      </h3>
                      <p className="text-white/75 text-xs md:text-sm tracking-wide mt-1 uppercase">
                        {d.atoll}
                      </p>
                    </div>
                    <span className="h-10 w-10 rounded-full glass flex items-center justify-center shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
