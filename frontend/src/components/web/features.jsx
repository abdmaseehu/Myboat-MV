"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Search, CreditCard, Ship } from "lucide-react";
import { useCustomFields } from "@/hooks/use-custom-fields";

const defaultFeatures = [
  {
    icon: <Search className="h-8 w-8 text-sky-500" />,
    title: "Find Your Destination",
    description:
      "Search and find the perfect boat route for your journey with our easy-to-use platform.",
  },
  {
    icon: <CreditCard className="h-8 w-8 text-sky-500" />,
    title: "Book Your Ticket",
    description:
      "Secure your seat with our simple and safe online booking system.",
  },
  {
    icon: <Ship className="h-8 w-8 text-sky-500" />,
    title: "Start Your Journey",
    description: "Enjoy a comfortable and safe journey to your destination.",
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

export default function Features() {
  const [features, setFeatures] = useState(defaultFeatures);
  const [title, setTitle] = useState(
    "Follow 3 Steps To Get Your Online Ticket"
  );
  const [subTitle, setSubTitle] = useState(
    "Book your ferry tickets in just a few simple steps. Our easy-to-follow process ensures a smooth booking experience."
  );
  const { getFieldByName } = useCustomFields();

  useEffect(() => {
    let isMounted = true;

    const fetchFeatures = async () => {
      try {
        const data = await getFieldByName("follow_3_steps");
        console.log("Follow 3 Steps Data:", data);

        if (!isMounted) return;

        // Update title and subtitle
        setTitle(data.title || title);
        setSubTitle(data.sub_title || subTitle);

        // Update features with the new structure
        const customFeatures = [
          {
            icon: <Search className="h-8 w-8 text-sky-500" />,
            title: data.find_your_destination || defaultFeatures[0].title,
            description:
              data.find_your_destination_title ||
              defaultFeatures[0].description,
          },
          {
            icon: <CreditCard className="h-8 w-8 text-sky-500" />,
            title: data.book_your_ticket || defaultFeatures[1].title,
            description:
              data.book_your_ticket_title || defaultFeatures[1].description,
          },
          {
            icon: <Ship className="h-8 w-8 text-sky-500" />,
            title: data.start_your_journey || defaultFeatures[2].title,
            description:
              data.start_your_journey_title || defaultFeatures[2].description,
          },
        ];
        setFeatures(customFeatures);
      } catch (error) {
        console.error("Error fetching features:", error);
      }
    };

    fetchFeatures();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array

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
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="relative h-full bg-gradient-to-b from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-900/50 border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-sky-500/10 flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
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
