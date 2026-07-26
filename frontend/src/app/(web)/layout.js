'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X } from "lucide-react";
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
import { useRouter } from 'next/navigation';
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import UserSidebar from "@/components/users/user-sidebar";
import { SiteLogo } from "@/components/web/navigation/site-logo";

const inter = Inter({ subsets: ["latin"] });

export default function WebLayout({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDashboardClick = () => {
    if (user?.role === 'USER') {
      router.push('/users');
    } else if (user?.role === 'ADMIN' || user?.role === 'VENDOR') {
      router.push('/admin/dashboard');
    }
  };

  // Prevent hydration issues by not rendering auth-dependent content until mounted
  const renderAuthContent = () => {
    if (!mounted) return null;

    return user ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="p-0 h-8 w-8">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user?.avatar ? `${process.env.NEXT_PUBLIC_ROOT_URL}${user.avatar}` : null}
                alt={user?.firstName}
              />
              <AvatarFallback className="bg-gradient-to-tr from-sky-500 to-sky-600 text-white">
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.role}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDashboardClick}>
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-600">
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Button asChild className="bg-sky-500 text-black hover:bg-sky-600">
        <Link href="/auth/login">Login</Link>
      </Button>
    );
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="relative min-h-screen flex flex-col">
        {/* Navigation */}
        <header 
          className={`sticky top-0 z-50 w-full transition-all duration-300 ${
            isScrolled ? 'bg-background/80 backdrop-blur-lg shadow-md' : 'bg-transparent'
          }`}
        >
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              {/* Logo */}
              <SiteLogo />

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-6">
                <MainNav />
                <ThemeToggle />
                {renderAuthContent()}
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Mobile Navigation */}
            {mounted && (
              <MobileNav 
                isOpen={isMobileMenuOpen} 
                user={user} 
                onLogout={logout} 
                onDashboard={handleDashboardClick} 
              />
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <Footer />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

