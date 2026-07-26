"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Linkedin, Twitter, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const team = [
  {
    name: "John Smith",
    role: "CEO & Founder",
    image: "/team/john.jpg",
    bio: "With over 15 years of experience in transportation and technology, John leads our mission to transform sea travel.",
    social: {
      linkedin: "#",
      twitter: "#",
      email: "john@example.com",
    },
  },
  {
    name: "Sarah Johnson",
    role: "Head of Operations",
    image: "/team/sarah.jpg",
    bio: "Sarah ensures smooth operations and maintains our high standards of service quality across all routes.",
    social: {
      linkedin: "#",
      twitter: "#",
      email: "sarah@example.com",
    },
  },
  {
    name: "Michael Chen",
    role: "Technical Director",
    image: "/team/michael.jpg",
    bio: "Michael leads our technical initiatives, ensuring a seamless and reliable platform for our users.",
    social: {
      linkedin: "#",
      twitter: "#",
      email: "michael@example.com",
    },
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

export default function OurTeam() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="py-20">
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
            Meet Our Team
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            The passionate individuals behind Myboat MV, working together to
            provide you with the best travel experience.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative"
            >
              <div className="p-6 rounded-xl bg-white dark:bg-zinc-900 shadow-lg group-hover:shadow-xl transition-all duration-300 border border-sky-100/20 dark:border-sky-500/10">
                <div className="relative mb-6">
                  <div className="aspect-square rounded-xl bg-sky-500/10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-transparent" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                <p className="text-sky-500 font-medium mb-4">
                  {member.role}
                </p>
                <p className="text-muted-foreground mb-6">{member.bio}</p>

                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-sky-500 hover:bg-sky-500/10"
                  >
                    <Linkedin className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-sky-500 hover:bg-sky-500/10"
                  >
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-sky-500 hover:bg-sky-500/10"
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
