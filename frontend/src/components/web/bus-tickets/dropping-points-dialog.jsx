import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin } from "lucide-react";

export default function DroppingPointsDialog({ vehicle, formatPointTime }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-sky-500 text-sky-500 hover:bg-sky-500/10"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Dropping Points ({vehicle?.route?.droppingPoints?.length || 0})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dropping Points</DialogTitle>
          <DialogDescription>
            Available dropping points for this boat
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-4">
          {vehicle?.route?.droppingPoints?.length > 0 ? (
            vehicle?.route?.droppingPoints.map((point, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <MapPin className="w-5 h-5 text-sky-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-medium">{point.locationName}</h4>
                  <p className="text-sm text-sky-500 font-medium">
                    {formatPointTime(point.arrivalTime)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No dropping points available
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
