"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Clock, MapPin, Headphones, ThumbsUp, Tag } from "lucide-react";

const features = [
  {
    icon: <Shield className="h-8 w-8 text-sky-500" />,
    title: "Safety First",
    description:
      "Your safety is our top priority. All our boats are regularly maintained and equipped with modern safety features.",
  },
  {
    icon: <Clock className="h-8 w-8 text-sky-500" />,
    title: "Punctual Service",
    description:
      "We value your time. Our boats maintain strict schedules to ensure you reach your destination on time.",
  },
  {
    icon: <MapPin className="h-8 w-8 text-sky-500" />,
    title: "Wide Network",
    description:
      "Extensive route network covering all major islands and tourist destinations across the Maldives.",
  },
  {
    icon: <Headphones className="h-8 w-8 text-sky-500" />,
    title: "24/7 Support",
    description:
      "Our customer support team is always available to assist you with any queries or concerns.",
  },
  {
    icon: <ThumbsUp className="h-8 w-8 text-sky-500" />,
    title: "Comfort Guaranteed",
    description:
      "Modern boats with comfortable seating, air conditioning, and entertainment systems for a pleasant journey.",
  },
  {
    icon: <Tag className="h-8 w-8 text-sky-500" />,
    title: "Best Prices",
    description:
      "Competitive prices with regular discounts and offers to make your travel affordable.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

export default function WhyChooseUs() {
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
              Why Choose
              <span className="text-sky-500"> Myboat MV</span>
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              We strive to provide the best sea travel experience with our
              premium services and customer-first approach.
            </motion.p>
          </div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full bg-white dark:bg-zinc-900 border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
                          {feature.icon}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-foreground">
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {feature.description}
                        </p>
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
