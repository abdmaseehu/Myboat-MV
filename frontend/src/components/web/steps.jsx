"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, CreditCard } from "lucide-react";
import { useCustomFields } from "@/hooks/use-custom-fields";

const defaultSteps = [
  {
    icon: <MapPin className="h-6 w-6 text-sky-500" />,
    title: "Choose Destination",
    description:
      "Select your departure and arrival locations from our wide network of routes.",
    color: "bg-blue-500",
  },
  {
    icon: <Clock className="h-6 w-6 text-sky-500" />,
    title: "Pick Your Time",
    description:
      "Choose from multiple departure times that best suit your schedule.",
    color: "bg-green-500",
  },
  {
    icon: <CreditCard className="h-6 w-6 text-sky-500" />,
    title: "Make Payment",
    description: "Secure your booking with our safe and easy payment options.",
    color: "bg-sky-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function Steps() {
  const [steps, setSteps] = useState(defaultSteps);
  const [title, setTitle] = useState("Book Your Ticket in 3 Easy Steps");
  const [subTitle, setSubTitle] = useState(
    "Follow these simple steps to book your ferry ticket and start your journey."
  );
  const { getFieldByName } = useCustomFields();

  useEffect(() => {
    let isMounted = true;

    const fetchSteps = async () => {
      try {
        const data = await getFieldByName("ticket_in_3_easy_steps");
        console.log("Ticket in 3 Easy Steps Data:", data);

        if (!isMounted) return;

        // Update title and subtitle
        setTitle(data.title || title);
        setSubTitle(data.sub_title || subTitle);

        // Update steps with the exact response structure
        const customSteps = [
          {
            icon: <MapPin className="h-6 w-6 text-sky-500" />,
            title: data.choose_destination || defaultSteps[0].title,
            description:
              data.choose_destination_title || defaultSteps[0].description,
            color: "bg-blue-500",
          },
          {
            icon: <Clock className="h-6 w-6 text-sky-500" />,
            title: data.pick_your_time || defaultSteps[1].title,
            description:
              data.pick_your_time_title || defaultSteps[1].description,
            color: "bg-green-500",
          },
          {
            icon: <CreditCard className="h-6 w-6 text-sky-500" />,
            title: data.make_payment || defaultSteps[2].title,
            description: data.make_payment_title || defaultSteps[2].description,
            color: "bg-sky-500",
          },
        ];
        setSteps(customSteps);
      } catch (error) {
        console.error("Error fetching steps:", error);
      }
    };

    fetchSteps();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array

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
              {title}
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              {subTitle}
            </motion.p>
          </div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {steps.map((step, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="relative h-full bg-white dark:bg-zinc-900 border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center">
                          {step.icon}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-8 h-8 rounded-full ${step.color} text-white flex items-center justify-center text-sm font-bold`}
                          >
                            {index + 1}
                          </span>
                          <h3 className="text-xl font-semibold text-foreground">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-muted-foreground">
                          {step.description}
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
