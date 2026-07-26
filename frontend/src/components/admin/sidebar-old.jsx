"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  LogOut,
  Map,
  MapPin,
  Navigation,
  Menu,
  X,
  ChevronLast,
  ChevronFirst,
  Users,
  Ship,
  CalendarDays,
  Receipt,
  Settings,
  CreditCard,
  Building2,
  Sparkles,
  Wallet,
  Users2,
  UserCog,
  Tags,
  DollarSign,
} from "lucide-react";
import { useSidebar } from "@/store/use-sidebar";
import { useAuth } from "@/store/use-auth";

// Admin Routes
const adminRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Users",
    icon: Users,
    href: "/admin/users",
    color: "text-sky-500",
  },
  {
    label: "Routes",
    icon: Map,
    href: "/admin/routes",
    color: "text-sky-500",
  },
  {
    label: "Boarding Points",
    icon: MapPin,
    href: "/admin/boarding-points",
    color: "text-sky-500",
  },
  {
    label: "Dropping Points",
    icon: Navigation,
    href: "/admin/dropping-points",
    color: "text-sky-500",
  },
  {
    label: "Seat Layouts",
    icon: Ship,
    href: "/admin/bus-layouts",
    color: "text-sky-500",
  },
  {
    label: "Vessels",
    icon: Ship,
    href: "/admin/vehicles",
    color: "text-sky-500",
  },
  {
    label: "Schedules",
    icon: CalendarDays,
    href: "/admin/schedules",
    color: "text-sky-500",
  },
  {
    label: "Bookings",
    icon: Receipt,
    href: "/admin/bookings",
    color: "text-sky-500",
  },
  // {
  //   label: "Payments",
  //   icon: CreditCard,
  //   href: "/admin/payments",
  //   color: "text-sky-500",
  // },
  {
    label: "Vendors",
    icon: Building2,
    href: "/admin/vendors",
    color: "text-sky-500",
  },
  // {
  //   label: "Settings",
  //   icon: Settings,
  //   href: "/admin/settings",
  //   color: "text-sky-500",
  // },
  {
    label: "Amenities",
    href: "/admin/amenities",
    icon: Sparkles,
    color: "text-sky-500",
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: Tags,
    color: "text-sky-500",
  },
  {
    label: "Income & Expenses",
    href: "/admin/income-expenses",
    icon: DollarSign,
    color: "text-sky-500",
  },
  {
    label: "Drivers",
    href: "/admin/drivers",
    icon: Users2,
    color: "text-sky-500",
  },
  {
    label: "Driver Vehicle Assignments",
    href: "/admin/driver-vehicle-assignments",
    icon: UserCog,
    color: "text-sky-500",
  },
];

// Vendor Routes
const vendorRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
    color: "text-sky-500",
  },

  {
    label: "Vessels",
    icon: Ship,
    href: "/admin/vehicles",
    color: "text-sky-500",
  },
  {
    label: "Schedules",
    icon: CalendarDays,
    href: "/admin/schedules",
    color: "text-sky-500",
  },
  {
    label: "Bookings",
    icon: Receipt,
    href: "/admin/bookings",
    color: "text-sky-500",
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: Tags,
    color: "text-sky-500",
  },
  {
    label: "Income & Expenses",
    href: "/admin/income-expenses",
    icon: DollarSign,
    color: "text-sky-500",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, toggle, close } = useSidebar();
  const { user, logout } = useAuth();

  // Determine which routes to show based on user role
  const routes = user?.role === "ADMIN" ? adminRoutes : vendorRoutes;

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 border-r transition-all duration-300 ease-in-out flex flex-col",
          "border-border/10 backdrop-blur-xl",
          "bg-white/80 dark:bg-zinc-900/90",
          "shadow-lg shadow-zinc-200/50 dark:shadow-sky-500/5",
          !isOpen && "md:w-20 -translate-x-full md:translate-x-0",
          isOpen && "translate-x-0"
        )}
      >
        {/* Mobile Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-border/10 md:hidden">
          <Link href="/admin/dashboard" className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-300 to-sky-500 bg-clip-text text-transparent">
              {process.env.NEXT_PUBLIC_APP_NAME}
            </h1>
          </Link>
          <Button variant="ghost" size="icon" onClick={close}>
            <X className="h-4 w-4 text-muted-foreground/50" />
          </Button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex h-14 items-center justify-between px-4 border-b border-border/10">
          <Link href="/admin/dashboard" className="flex items-center">
            <h1
              className={cn(
                "text-2xl font-bold transition-all bg-gradient-to-r from-sky-300 to-sky-500 bg-clip-text text-transparent",
                !isOpen && "md:hidden"
              )}
            >
              {process.env.NEXT_PUBLIC_APP_NAME}
            </h1>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-8 w-8 hover:bg-sky-500/5"
          >
            {isOpen ? (
              <ChevronFirst className="h-4 w-4 text-muted-foreground/50 transition-transform duration-200" />
            ) : (
              <ChevronLast className="h-4 w-4 text-muted-foreground/50 transition-transform duration-200" />
            )}
          </Button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Navigation */}
          <ScrollArea className="flex-1 py-2">
            <div className="space-y-6 px-3">
              <div>
                <h2
                  className={cn(
                    "text-xs uppercase text-zinc-500 dark:text-white/60 pl-4 mb-2 font-medium",
                    !isOpen && "md:hidden"
                  )}
                >
                  Menu
                </h2>
                <div className="space-y-1">
                  {routes.map((route) => (
                    <Button
                      key={route.href}
                      variant={pathname === route.href ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-9 transition-colors duration-200",
                        pathname === route.href &&
                          "bg-sky-500/5 dark:bg-sky-500/5 font-medium",
                        !isOpen && "md:justify-center md:p-2",
                        "hover:bg-sky-500/5 hover:dark:bg-sky-500/5"
                      )}
                      asChild
                    >
                      <Link href={route.href}>
                        <route.icon
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isOpen ? "mr-3" : "",
                            pathname === route.href
                              ? "text-sky-500"
                              : "text-sky-500/70"
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm transition-colors duration-200",
                            !isOpen && "md:hidden",
                            pathname === route.href
                              ? "text-zinc-900 dark:text-white"
                              : "text-zinc-700 dark:text-white/70"
                          )}
                        >
                          {route.label}
                        </span>
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border/10 p-2">
            <div
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-all duration-200",
                "hover:dark:bg-sky-500/5 hover:bg-zinc-500/5",
                !isOpen && "md:justify-center"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-x-3",
                  !isOpen && "md:hidden"
                )}
              >
                <div className="p-1 rounded-lg dark:bg-sky-500/5 bg-zinc-500/5 backdrop-blur-sm">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-sky-300 to-sky-500 shadow-sm" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none text-zinc-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-white/60">
                    {user?.role}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="ml-auto hover:bg-sky-500/5"
              >
                <LogOut className="h-4 w-4 text-sky-500" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}
    </>
  );
}
