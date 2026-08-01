"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const POLL_MS = 60_000;

function relativeTime(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.floor((Date.now() - then) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const TYPE_ACCENT = {
  QUOTE_RECEIVED: "bg-lagoon",
  QUOTE_ACCEPTED: "bg-emerald-500",
  QUOTE_REJECTED: "bg-coral",
  REQUEST_RECEIVED: "bg-lagoon",
  BOOKING_CONFIRMED: "bg-emerald-500",
  BOOKING_CANCELLED: "bg-coral",
  PAYMENT_RECEIVED: "bg-emerald-500",
  GENERAL: "bg-muted-foreground",
};

/**
 * Notification bell with unread badge + popover list.
 * Renders nothing when the user isn't logged in.
 *
 * @param {"light"|"dark"} variant - icon colour for transparent headers
 */
export default function NotificationBell({ variant = "dark", className }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setCount(res?.data?.data?.count ?? 0);
    } catch {
      // Silent: the bell must never nag. 401 simply means not logged in.
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications", { params: { limit: 20 } });
      setItems(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll the unread count every 60s.
  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, POLL_MS);
    return () => clearInterval(id);
  }, [fetchCount]);

  useEffect(() => {
    if (open) fetchList();
  }, [open, fetchList]);

  const handleMarkAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setCount(0);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not mark all as read");
    }
  };

  const handleOpenOne = async (n) => {
    setOpen(false);
    if (!n.isRead) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
      );
      setCount((c) => Math.max(0, c - 1));
      try {
        await api.patch(`/notifications/${n.id}/read`);
      } catch {
        // Non-fatal — navigation matters more than the read receipt.
      }
    }
    if (n.link) router.push(n.link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={count ? `Notifications (${count} unread)` : "Notifications"}
          className={cn(
            "relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors",
            variant === "light"
              ? "text-white hover:bg-white/15"
              : "text-ocean-deep hover:bg-lagoon/10",
            className
          )}
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-white text-[10px] font-semibold leading-[18px] text-center shadow-coral">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[22rem] p-0 rounded-2xl shadow-premium border-border/60 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <span className="text-sm font-medium text-ocean-deep">
            Notifications
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAll}
            disabled={count === 0}
            className="h-7 px-2 text-[11px] text-lagoon hover:text-lagoon-dark hover:bg-lagoon/10 rounded-full"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Mark all as read
          </Button>
        </div>

        <ScrollArea className="max-h-[22rem]">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleOpenOne(n)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-lagoon/5",
                      !n.isRead && "bg-lagoon/[0.06]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 rounded-full shrink-0",
                        n.isRead
                          ? "bg-transparent"
                          : TYPE_ACCENT[n.type] || "bg-lagoon"
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-sm leading-snug",
                          n.isRead
                            ? "text-muted-foreground"
                            : "text-ocean-deep font-medium"
                        )}
                      >
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.body}
                        </span>
                      )}
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1">
                        {relativeTime(n.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
