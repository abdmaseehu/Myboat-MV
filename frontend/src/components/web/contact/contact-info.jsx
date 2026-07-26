"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const containerVariants = {
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const contactInfo = [
  {
    icon: MapPin,
    title: "Address",
    content: "123 Business Street, Suite 100, City, State 12345",
  },
  {
    icon: Phone,
    title: "Phone",
    content: "+1 (555) 123-4567",
  },
  {
    icon: Mail,
    title: "Email",
    content: "contact@myboat.mv",
  },
  {
    icon: Clock,
    title: "Business Hours",
    content: "Mon - Fri: 9:00 AM - 6:00 PM",
  },
];

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export default function ContactInfo() {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="w-full max-w-lg mx-auto p-6 bg-card rounded-xl shadow-lg border border-border"
    >
      <div className="space-y-8">
        {contactInfo.map((item, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="flex items-start space-x-4"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="text-muted-foreground">{item.content}</p>
            </div>
          </motion.div>
        ))}

        <motion.div variants={itemVariants} className="pt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Follow Us
          </h3>
          <div className="flex space-x-4">
            {socialLinks.map((social, index) => (
              <Button
                key={index}
                variant="outline"
                size="icon"
                className="hover:bg-sky-100 hover:text-sky-600 dark:hover:bg-sky-900/20 dark:hover:text-sky-400"
                asChild
              >
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              </Button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
