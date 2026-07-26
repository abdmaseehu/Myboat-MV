"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Emily Johnson",
    role: "Regular Traveler",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=2787&auto=format&fit=crop",
    quote:
      "Myboat MV has made my regular commute so much easier. The booking process is seamless, and the service is always reliable.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Business Traveler",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2787&auto=format&fit=crop",
    quote:
      "As a frequent business traveler, I appreciate the punctuality and comfort of the ferry services. The mobile app is a game-changer!",
    rating: 5,
  },
  {
    name: "Sarah Williams",
    role: "Student",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop",
    quote:
      "The student discounts and flexible booking options make Myboat MV perfect for my weekend trips home from university.",
    rating: 5,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function ServiceTestimonials() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="py-20 bg-white dark:bg-zinc-900/50">
      <motion.div
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        className="container mx-auto px-4"
      >
        <div className="text-center mb-12">
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            What Our Customers Say
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Read what our satisfied customers have to say about their experience
            with Myboat MV
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative group"
            >
              <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-50 to-white dark:from-zinc-900 dark:to-zinc-800 shadow-lg hover:shadow-xl transition-all duration-300 border border-sky-100/20 dark:border-sky-500/10">
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 text-sky-500/20">
                  <Quote className="w-8 h-8" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-sky-500 text-sky-500"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-muted-foreground mb-6">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
