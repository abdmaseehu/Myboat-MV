"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, LayoutDashboard, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";

const routes = [
  { href: "/", label: "Home" },
  { href: "/bus-tickets", label: "Ferry" },
  { href: "/charter", label: "Private Charter" },
  { href: "/logistics", label: "Logistics" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const drawerVariants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: { type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { x: "100%", transition: { duration: 0.25 } },
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export function MobileNav({ isOpen, user, onLogout, onDashboard, onClose }) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-ocean-deep/60 backdrop-blur-sm md:hidden"
          />

          {/* Drawer */}
          <motion.aside
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={drawerVariants}
            className="fixed inset-y-0 right-0 z-[70] w-full max-w-sm bg-white md:hidden flex flex-col safe-top safe-bottom shadow-2xl"
          >
            {/* Top strip — visual accent */}
            <div className="h-1.5 bg-lagoon-gradient shrink-0" />

            {/* Nav list */}
            <motion.nav
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="flex-1 overflow-y-auto px-8 pt-10 pb-6"
            >
              <div className="space-y-1">
                {routes.map((route) => {
                  const active =
                    route.href === "/" ? pathname === "/" : pathname.startsWith(route.href);
                  return (
                    <motion.div key={route.href} variants={itemVariants}>
                      <Link
                        href={route.href}
                        onClick={onClose}
                        className={cn(
                          "block py-3 text-2xl transition-colors",
                          active
                            ? "text-lagoon font-serif italic"
                            : "text-ocean-deep hover:text-lagoon"
                        )}
                        style={
                          active
                            ? { fontFamily: "var(--font-fraunces), Georgia, serif" }
                            : undefined
                        }
                      >
                        {route.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* User area */}
              {user ? (
                <motion.div
                  variants={itemVariants}
                  className="mt-8 pt-6 border-t border-border/60 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage
                        src={
                          user?.avatar
                            ? `${process.env.NEXT_PUBLIC_ROOT_URL}${user.avatar}`
                            : null
                        }
                        alt={user?.firstName}
                      />
                      <AvatarFallback className="bg-lagoon text-white">
                        {user?.firstName?.charAt(0)}
                        {user?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-ocean-deep">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {user?.role}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        onDashboard?.();
                        onClose?.();
                      }}
                      className="bg-lagoon hover:bg-lagoon-dark text-white rounded-full h-11"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-1.5" />
                      Dashboard
                    </Button>
                    <Button
                      onClick={() => {
                        onLogout?.();
                        onClose?.();
                      }}
                      variant="outline"
                      className="rounded-full h-11 border-border"
                    >
                      <LogOut className="h-4 w-4 mr-1.5" />
                      Logout
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-border/60">
                  <Link
                    href="/auth/login"
                    onClick={onClose}
                    className="block text-center text-ocean-deep hover:text-lagoon transition-colors text-sm font-medium"
                  >
                    Sign in to your account →
                  </Link>
                </motion.div>
              )}
            </motion.nav>

            {/* CTA + Footer */}
            <div className="border-t border-border/60 px-8 pt-6 pb-8 space-y-6 shrink-0 bg-foam">
              <Button
                asChild
                onClick={onClose}
                className="w-full bg-coral hover:bg-coral-soft text-white rounded-full h-14 text-base font-medium shadow-coral tracking-wide"
              >
                <Link href="/bus-tickets">Book Now</Link>
              </Button>

              <div className="grid grid-cols-1 gap-2 text-sm text-ocean/80">
                <a href="mailto:info@myboat.mv" className="inline-flex items-center gap-2 hover:text-lagoon">
                  <Mail className="h-4 w-4" /> info@myboat.mv
                </a>
                <a href="tel:+9600000000" className="inline-flex items-center gap-2 hover:text-lagoon">
                  <Phone className="h-4 w-4" /> +960 000-0000
                </a>
                <div className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Malé City, Maldives
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <SocialIcon href="#" icon={Instagram} />
                <SocialIcon href="#" icon={Facebook} />
                <SocialIcon href="#" icon={Twitter} />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SocialIcon({ href, icon: Icon }) {
  return (
    <a
      href={href}
      className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-white border border-border text-ocean hover:text-lagoon hover:border-lagoon transition-colors"
      aria-label="social"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}
