import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TicketSkeleton() {
  return (
    <Card className="overflow-hidden border border-gray-100 dark:border-gray-800 shadow-md bg-white dark:bg-zinc-900/50">
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Bus Info Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-8 h-8 rounded-full" />
              ))}
            </div>
          </div>

          {/* Time and Route Skeleton */}
          <div className="md:col-span-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="text-center">
                <Skeleton className="h-8 w-24 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
              <div className="flex-1 w-full sm:px-4">
                <div className="relative py-2">
                  <Skeleton className="h-0.5 w-full absolute top-1/2 -translate-y-1/2" />
                  <Skeleton className="h-3 w-3 rounded-full absolute left-0 top-1/2 -translate-y-1/2" />
                  <Skeleton className="h-3 w-3 rounded-full absolute right-0 top-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center mt-2">
                  <Skeleton className="h-6 w-20 mx-auto" />
                </div>
              </div>
              <div className="text-center">
                <Skeleton className="h-8 w-24 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            </div>
          </div>

          {/* Price and Book Skeleton */}
          <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-4">
            <div className="text-center md:text-right">
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-11 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
