"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/store/use-auth";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Handshake, Ship, Ticket, LogOut, Loader2 } from "lucide-react";

const NAV = [
  { label: "My Partnerships", href: "/agent/partners", icon: Handshake },
  { label: "Find Operators", href: "/agent/operators", icon: Ship },
  { label: "Book a Trip", href: "/ferry", icon: Ticket },
];

/**
 * Agent workspace.
 *
 * Guesthouses sell operators' seats, so they get their own area rather than
 * the customer or operator dashboards — they manage partnerships, not vessels.
 */
export default function AgentLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, checkAuth } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const role = await checkAuth();
      if (role !== "AGENT") {
        // Send everyone else to the area that is actually theirs.
        if (role === "ADMIN" || role === "VENDOR") router.replace("/admin/dashboard");
        else if (role === "USER") router.replace("/users");
        else router.replace("/auth/login");
        return;
      }
      setReady(true);
    })();
  }, [checkAuth, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foam/30">
      <Toaster position="top-center" />

      <header className="border-b bg-white">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <Link href="/agent/partners" className="text-xl font-semibold text-sky-500">
            Myboat MV
            <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
              Agent
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                router.push("/auth/login");
              }}
            >
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <nav className="border-b bg-white">
        <div className="container-x flex gap-1 overflow-x-auto">
          {NAV.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                pathname === href
                  ? "border-sky-500 text-sky-600"
                  : "border-transparent text-muted-foreground hover:text-ocean-deep"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="container-x py-6">{children}</main>
    </div>
  );
}
