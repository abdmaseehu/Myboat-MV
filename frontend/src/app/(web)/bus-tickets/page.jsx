"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Calendar, MapPin, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TicketList from "@/components/web/bus-tickets/ticket-list";
import SearchForm from "@/components/web/bus-tickets/search-form";

function BusTicketsContent() {
  const searchParams = useSearchParams();
  const [showSearchForm, setShowSearchForm] = useState(false);

  const routeId = searchParams.get("route-id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const searchDate = searchParams.get("date");

  return (
    <div className="min-h-screen bg-sand-gradient">
      {/* Journey summary bar */}
      <div className="bg-white/85 backdrop-blur-xl border-b border-border/50 sticky top-[72px] md:top-[80px] z-30">
        <div className="container-x py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-lagoon/10 text-ocean-deep h-11 w-11"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 md:gap-3 bg-foam rounded-full px-4 py-2.5 text-sm">
              <MapPin className="h-4 w-4 text-lagoon shrink-0" />
              <span className="font-medium text-ocean-deep truncate">{from || "From"}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-ocean-deep truncate">{to || "To"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-foam rounded-full px-4 py-2.5 text-sm">
              <Calendar className="h-4 w-4 text-lagoon" />
              <span className="font-medium text-ocean-deep">
                {searchDate ? format(new Date(searchDate), "MMM d, yyyy") : "Pick a date"}
              </span>
            </div>
            <Button
              onClick={() => setShowSearchForm(true)}
              className="bg-coral hover:bg-coral-soft text-white rounded-full h-11 px-5 shadow-coral"
            >
              <Search className="h-4 w-4 mr-1.5" /> Modify
            </Button>
          </div>
        </div>
      </div>

      {/* Tickets */}
      <div className="container-x py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TicketList routeId={routeId} date={searchDate} />
        </motion.div>
      </div>

      {showSearchForm && (
        <SearchForm
          isDialog={true}
          defaultValues={{ routeId, from, to, date: searchDate }}
          onClose={() => setShowSearchForm(false)}
        />
      )}
    </div>
  );
}

export default function BusTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-lagoon" />
        </div>
      }
    >
      <BusTicketsContent />
    </Suspense>
  );
}
