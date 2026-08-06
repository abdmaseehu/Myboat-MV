"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useNavMenu } from "@/hooks/use-nav-menu";

export function MainNav({ variant = "auto" }) {
  const pathname = usePathname();
  const isLight = variant === "light";
  // Editable in Admin -> Content -> Menus; falls back to the built-in list.
  const routes = useNavMenu("HEADER");

  return (
    <nav className="hidden md:flex items-center gap-1">
      {routes.map((route) => {
        const href = route.url;
        // An external link is never "the page you are on".
        const external = /^(https?:)?\/\//i.test(href);
        const active =
          external || !href
            ? false
            : href === "/"
            ? pathname === "/"
            : pathname.startsWith(href);

        return (
          <Link
            key={route.id || href}
            href={href}
            target={route.openInNewTab ? "_blank" : undefined}
            rel={route.openInNewTab ? "noopener noreferrer" : undefined}
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
