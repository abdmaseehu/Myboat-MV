"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const routes = [
  { href: "/", label: "Home" },
  { href: "/bus-tickets", label: "Ferry" },
  { href: "/charter", label: "Charter" },
  { href: "/logistics", label: "Logistics" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MainNav({ variant = "auto" }) {
  const pathname = usePathname();
  const isLight = variant === "light";

  return (
    <nav className="hidden md:flex items-center gap-1">
      {routes.map((route) => {
        const active =
          route.href === "/"
            ? pathname === "/"
            : pathname.startsWith(route.href);

        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "relative px-4 py-2 rounded-full text-[15px] font-medium tracking-wide transition-colors duration-200",
              isLight
                ? active
                  ? "text-white"
                  : "text-white/75 hover:text-white"
                : active
                ? "text-ocean-deep"
                : "text-ocean/70 hover:text-ocean-deep"
            )}
          >
            <span className="relative z-10">{route.label}</span>
            {active && (
              <motion.span
                layoutId="nav-active-indicator"
                className={cn(
                  "absolute left-3 right-3 -bottom-1 h-[2px] rounded-full",
                  isLight ? "bg-lagoon-light" : "bg-lagoon"
                )}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
