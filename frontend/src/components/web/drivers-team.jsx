"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

const drivers = [
  {
    id: 1,
    name: "Rahul Kumar",
    image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d",
    experience: "8+ Years",
    rating: 4.8,
    trips: 850,
    specialization: "Long Route Expert",
  },
  {
    id: 2,
    name: "Amit Singh",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
    experience: "12+ Years",
    rating: 4.9,
    trips: 1200,
    specialization: "Highway Specialist",
  },
  {
    id: 3,
    name: "Pradeep Sharma",
    image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857",
    experience: "6+ Years",
    rating: 4.7,
    trips: 620,
    specialization: "City Route Expert",
  },
  {
    id: 4,
    name: "Rajesh Verma",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    experience: "10+ Years",
    rating: 4.9,
    trips: 950,
    specialization: "Mountain Route Specialist",
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

export default function DriversTeam() {
  return (
    <section className="py-20 bg-white dark:bg-zinc-900">
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
              Meet Our
              <span className="text-sky-500"> Expert Drivers</span>
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Our team of experienced and professional drivers ensures your
              safety and comfort throughout the journey.
            </motion.p>
          </div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {drivers.map((driver) => (
              <motion.div key={driver.id} variants={itemVariants}>
                <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="relative h-48">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${driver.image})`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-lg font-semibold text-white">
                        {driver.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sky-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm">{driver.rating}</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="bg-sky-500/10 text-sky-500 border-sky-500"
                      >
                        {driver.experience}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 text-blue-500 border-blue-500"
                      >
                        {driver.trips} Trips
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {driver.specialization}
                    </p>
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
