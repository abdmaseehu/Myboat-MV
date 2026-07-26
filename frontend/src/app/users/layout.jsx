"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/use-auth";
import UserSidebar from "@/components/users/user-sidebar";
import { Toaster } from "sonner";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function UserLayout({ children }) {
  const router = useRouter();
  const { user, checkAuth } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const validateAuth = async () => {
      const role = await checkAuth();
      if (!role || role !== "USER") {
        router.push("/auth/login");
      }
    };

    validateAuth();
  }, [router, checkAuth]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById("user-sidebar");
      const menuButton = document.getElementById("menu-button");

      if (
        sidebar &&
        !sidebar.contains(event.target) &&
        !menuButton?.contains(event.target)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent hydration issues by not rendering anything until mounted
  if (!mounted) {
    return null;
  }

  // After mounting, check for user auth
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b bg-background">
        <div className="flex h-16 items-center px-4 md:px-8">
          {/* Mobile Menu Button */}
          <Button
            id="menu-button"
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-sky-500">
              Myboat MV
            </span>
          </Link>
          <div className="ml-auto flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar - Mobile Overlay */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden",
            isSidebarOpen ? "block" : "hidden"
          )}
        />

        {/* Sidebar */}
        <aside
          id="user-sidebar"
          className={cn(
            "fixed left-0 z-40 w-72 h-[calc(100vh-4rem)] bg-background border-r transition-transform duration-300 ease-in-out md:translate-x-0",
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          )}
        >
          <UserSidebar onClose={() => setIsSidebarOpen(false)} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full md:pl-72 transition-all duration-300">
          <div className="container p-4 md:p-6 mx-auto">{children}</div>
        </main>
      </div>

      <Toaster position="top-center" />
    </div>
  );
}
