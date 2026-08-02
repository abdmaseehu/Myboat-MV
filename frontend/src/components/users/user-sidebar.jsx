import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  User,
  Clock,
  Settings,
  LogOut,
  Key,
  Home,
  X,
  Anchor,
  FileText,
} from "lucide-react";
import { useAuth } from "@/store/use-auth";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const routes = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/users",
  },
  {
    label: "My Bookings",
    icon: Clock,
    href: "/users/bookings",
  },
  {
    label: "My Requests",
    icon: FileText,
    href: "/users/my-requests",
  },
  // No "Checkout" entry: checkout is only reachable partway through a booking
  // and has no meaning on its own - opening it directly just bounced the
  // customer back to the homepage.
  {
    label: "Profile",
    icon: User,
    href: "/users/profile",
  },
  {
    label: "Change Password",
    icon: Key,
    href: "/users/change-password",
  },
];

export default function UserSidebar({ onClose }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b">
        <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="space-y-0.5 px-3 py-4">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => onClose?.()}
              className={cn(
                "group flex items-center gap-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                pathname === route.href
                  ? "bg-sky-500/10 text-sky-500"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: pathname === route.href ? 1.1 : 1,
                  color:
                    pathname === route.href ? "rgb(234 179 8)" : "currentColor",
                }}
                className="flex items-center"
              >
                <route.icon className="h-4 w-4" />
              </motion.div>
              <span>{route.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="border-t p-3">
        <button
          onClick={() => {
            onClose?.();
            logout();
          }}
          className="flex items-center gap-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
