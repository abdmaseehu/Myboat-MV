"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Priya Patel",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    role: "Regular Traveler",
    rating: 5,
    comment:
      "The best ferry service I've ever experienced. Clean boats, punctual service, and very professional staff. Highly recommended!",
  },
  {
    id: 2,
    name: "Arun Sharma",
    image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36",
    role: "Business Traveler",
    rating: 5,
    comment:
      "I frequently travel for business, and Myboat MV has been my go-to choice. Their service is reliable and comfortable.",
  },
  {
    id: 3,
    name: "Meera Singh",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
    role: "Tourist",
    rating: 4,
    comment:
      "Great experience traveling with Myboat MV. The online booking process is smooth, and the journey was comfortable.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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

export default function Testimonials() {
  return (
    <section className="py-20 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl font-bold text-foreground"
            >
              What Our
              <span className="text-sky-500"> Customers Say</span>
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Read what our satisfied customers have to say about their
              experience with our service.
            </motion.p>
          </div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial) => (
              <motion.div key={testimonial.id} variants={itemVariants}>
                <Card className="h-full bg-white dark:bg-zinc-900 border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 space-y-4">
                    <Quote className="h-8 w-8 text-sky-500/50" />
                    <p className="text-muted-foreground">
                      {testimonial.comment}
                    </p>
                    <div className="flex items-center gap-4 pt-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                          <div
                            className="w-full h-full bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${testimonial.image})`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </div>
                        <div className="flex items-center gap-1 text-sky-500 mt-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
