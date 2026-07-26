"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

const posts = [
  {
    id: 1,
    title: "Top 10 Tourist Destinations You Must Visit",
    excerpt:
      "Discover the most beautiful and popular tourist spots across the Maldives that you shouldn't miss.",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
    category: "Travel Guide",
    date: "Mar 15, 2024",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "Essential Tips for Comfortable Sea Travel",
    excerpt:
      "Make your sea journey more comfortable with these practical tips and tricks for long-distance travel.",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957",
    category: "Travel Tips",
    date: "Mar 12, 2024",
    readTime: "4 min read",
  },
  {
    id: 3,
    title: "Planning Your Summer Vacation: A Complete Guide",
    excerpt:
      "Everything you need to know about planning the perfect summer vacation, from booking to packing.",
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
    category: "Planning",
    date: "Mar 10, 2024",
    readTime: "6 min read",
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

export default function Blog() {
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
              Latest From Our
              <span className="text-sky-500"> Blog</span>
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Stay updated with travel tips, destination guides, and news from
              the world of sea travel.
            </motion.p>
          </div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {posts.map((post) => (
              <motion.div key={post.id} variants={itemVariants}>
                <Card className="group overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                      style={{
                        backgroundImage: `url(${post.image})`,
                      }}
                    />
                    <div className="absolute inset-0 bg-black/25" />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-sky-500 text-black hover:bg-sky-600">
                        {post.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{post.date}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-sky-500 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground">{post.excerpt}</p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sky-500 hover:text-sky-600"
                    >
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="text-center pt-8">
            <Button
              variant="outline"
              className="border-sky-500 text-sky-500 hover:bg-sky-500/10"
            >
              View All Posts
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
