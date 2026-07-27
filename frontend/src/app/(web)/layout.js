"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import { MainNav } from "@/components/web/navigation/main-nav";
import { MobileNav } from "@/components/web/navigation/mobile-nav";
import { Footer } from "@/components/web/footer";
import { useAuth } from "@/store/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteLogo } from "@/components/web/navigation/site-logo";

export default function WebLayout({ children }) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Only home page has the transparent-over-hero treatment
  const isHome = pathname === "/";
  const transparent = isHome && !isScrolled;

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleDashboardClick = () => {
    if (user?.role === "USER") router.push("/users");
    else if (user?.role === "ADMIN" || user?.role === "VENDOR")
      router.push("/admin/dashboard");
  };

  const renderAuthContent = () => {
    if (!mounted) return null;

    return user ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`p-0.5 rounded-full transition-all ${
              transparent
                ? "ring-1 ring-white/30 hover:ring-white/60"
                : "ring-1 ring-border hover:ring-lagoon"
            }`}
          >
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={
                  user?.avatar
                    ? `${process.env.NEXT_PUBLIC_ROOT_URL}${user.avatar}`
                    : null
                }
                alt={user?.firstName}
              />
              <AvatarFallback className="bg-lagoon-gradient text-white text-xs font-medium">
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-60 rounded-2xl shadow-premium border-border/60 p-2"
        >
          <DropdownMenuLabel className="font-normal px-3 py-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-ocean-deep">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs leading-none text-muted-foreground uppercase tracking-wider">
                {user?.role}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDashboardClick}
            className="rounded-xl cursor-pointer focus:bg-lagoon/10 focus:text-lagoon-dark"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className="rounded-xl cursor-pointer focus:bg-coral/10 focus:text-coral text-coral"
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Button
        asChild
        className={
          transparent
            ? "bg-white/15 hover:bg-white/25 text-white rounded-full h-10 px-5 border border-white/20 backdrop-blur"
            : "bg-lagoon hover:bg-lagoon-dark text-white rounded-full h-10 px-5 shadow-lagoon"
        }
      >
        <Link href="/auth/login">Sign In</Link>
      </Button>
    );
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <div className="relative min-h-screen flex flex-col bg-background">
        {/* Navigation */}
        <header
          className={`fixed top-0 z-50 w-full transition-all duration-500 ${
            transparent
              ? "bg-transparent"
              : "bg-white/85 backdrop-blur-xl border-b border-border/50 shadow-[0_1px_0_rgba(15,42,71,0.03)]"
          }`}
        >
          <div className="container-x">
            <div className="flex h-[72px] md:h-[80px] items-center justify-between gap-4">
              <SiteLogo variant={transparent ? "light" : "dark"} />

              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-6">
                <MainNav variant={transparent ? "light" : "dark"} />
                {renderAuthContent()}
              </div>

              {/* Mobile menu button */}
              <button
                className={`md:hidden inline-flex items-center justify-center h-11 w-11 rounded-full transition-colors ${
                  transparent
                    ? "text-white hover:bg-white/10"
                    : "text-ocean-deep hover:bg-lagoon/10"
                }`}
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                aria-label="Menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </header>

        {mounted && (
          <MobileNav
            isOpen={isMobileMenuOpen}
            user={user}
            onLogout={logout}
            onDashboard={handleDashboardClick}
            onClose={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main content — no top padding on home (hero handles it), padded elsewhere */}
        <main className={`flex-1 ${isHome ? "" : "pt-[72px] md:pt-[80px]"}`}>
          {children}
        </main>

        <Footer />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
