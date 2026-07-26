"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Calendar, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TicketList from "@/components/web/bus-tickets/ticket-list";
import SearchForm from "@/components/web/bus-tickets/search-form";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function BusTicketsContent() {
  const searchParams = useSearchParams();
  const [showSearchForm, setShowSearchForm] = useState(false);

  const routeId = searchParams.get("route-id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const searchDate = searchParams.get("date");

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800"
    >
      {/* Search Bar */}
      <div className="sticky top-0 z-40 w-full border-b bg-white/95 dark:bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-900/60 shadow-lg">
        <div className="container mx-auto flex flex-col sm:flex-row h-auto sm:h-20 items-center justify-between px-4 py-4 sm:py-0 space-y-4 sm:space-y-0">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center space-x-4 w-full sm:w-auto"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-sky-500 hover:bg-sky-100 dark:hover:bg-sky-900/30"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3 bg-sky-50 dark:bg-sky-900/20 px-4 py-2 rounded-full text-sm sm:text-base">
              <MapPin className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
              <span className="font-medium text-sky-700 dark:text-sky-300 truncate">
                {from}
              </span>
              <ArrowRight className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
              <span className="font-medium text-sky-700 dark:text-sky-300 truncate">
                {to}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center space-x-4 w-full sm:w-auto"
          >
            <div className="flex items-center space-x-3 bg-sky-50 dark:bg-sky-900/20 px-4 py-2 rounded-full text-sm">
              <Calendar className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span className="font-medium text-sky-700 dark:text-sky-300">
                {searchDate
                  ? format(new Date(searchDate), "PPP")
                  : "Select date"}
              </span>
            </div>
            <Button
              className="bg-sky-500 hover:bg-sky-600 text-black font-medium px-6 rounded-full w-full sm:w-auto"
              onClick={() => setShowSearchForm(true)}
            >
              <Search className="w-4 h-4 mr-2" />
              Modify Search
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TicketList routeId={routeId} date={searchDate} />
        </motion.div>
      </div>

      {/* Search Form Dialog */}
      {showSearchForm && (
        <SearchForm
          isDialog={true}
          defaultValues={{
            routeId,
            from,
            to,
            date: searchDate,
          }}
          onClose={() => setShowSearchForm(false)}
        />
      )}
    </motion.div>
  );
}

export default function BusTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      }
    >
      <BusTicketsContent />
    </Suspense>
  );
}
