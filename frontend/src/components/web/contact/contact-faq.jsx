"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const containerVariants = {
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const faqs = [
  {
    question: "How do I book a ferry ticket?",
    answer:
      "You can book a ferry ticket through our website or mobile app. Simply select your departure and arrival locations, choose your preferred date and time, select your seats, and proceed to payment. You'll receive a confirmation email with your ticket details.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept various payment methods including credit/debit cards (Visa, MasterCard, American Express), PayPal, and other digital payment solutions. All payments are processed securely through our platform.",
  },
  {
    question: "Can I cancel or modify my booking?",
    answer:
      "Yes, you can cancel or modify your booking up to 24 hours before departure. Please note that cancellation fees may apply. You can manage your bookings through your account or contact our customer support team for assistance.",
  },
  {
    question: "What is your refund policy?",
    answer:
      "Refunds are processed according to our cancellation policy. Full refunds are available for cancellations made 24 hours or more before departure. Partial refunds may be available for cancellations made within 24 hours of departure, subject to terms and conditions.",
  },
  {
    question: "How can I contact customer support?",
    answer:
      "Our customer support team is available 24/7. You can reach us through email at support@myboat.mv, phone at +1 (555) 123-4567, or use the contact form on our website. We typically respond to inquiries within 24 hours.",
  },
];

export default function ContactFaq() {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="w-full max-w-3xl mx-auto"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-sky-600 mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground">
          Find answers to common questions about our services
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );
}
