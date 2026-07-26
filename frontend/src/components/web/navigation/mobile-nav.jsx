"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const routes = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/about",
    label: "About",
  },
  {
    href: "/services",
    label: "Services",
  },
  {
    href: "/contact",
    label: "Contact",
  },
];

const menuVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

export function MobileNav({ isOpen, user, onLogout, onDashboard }) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={menuVariants}
        className="md:hidden py-4 space-y-4 bg-background/95 backdrop-blur-sm border-t"
      >
        {/* Navigation Links */}
        <div className="space-y-3">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "block px-4 py-2 text-sm font-medium transition-colors hover:text-sky-500",
                pathname === route.href
                  ? "text-sky-500 bg-sky-500/10"
                  : "text-muted-foreground"
              )}
            >
              {route.label}
            </Link>
          ))}
        </div>

        {/* User Section */}
        <div className="px-4 pt-4 border-t">
          {user ? (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={
                      user?.avatar
                        ? `${process.env.NEXT_PUBLIC_ROOT_URL}${user.avatar}`
                        : null
                    }
                    alt={user?.firstName}
                  />
                  <AvatarFallback className="bg-gradient-to-tr from-sky-500 to-sky-600 text-white">
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.role}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={onDashboard}
                  className="w-full bg-sky-500 text-black hover:bg-sky-600"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={onLogout}
                  variant="destructive"
                  className="w-full"
                >
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ThemeToggle className="w-full" />
              <Button
                asChild
                className="w-full bg-sky-500 text-black hover:bg-sky-600"
              >
                <Link href="/auth/login">Login</Link>
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
