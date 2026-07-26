"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";
import api from "@/lib/axios";

export default function DeleteRoute({ route, open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/routes/${route.id}`);
      toast.success("Route deleted successfully");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting route");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Route</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this route? This action cannot be
            undone. All associated boarding and dropping points will also be
            deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            <p className="flex items-center justify-between py-1">
              <span className="font-medium">Source City:</span>
              <span>{route.sourceCity}</span>
            </p>
            <p className="flex items-center justify-between py-1">
              <span className="font-medium">Destination City:</span>
              <span>{route.destinationCity}</span>
            </p>
            <p className="flex items-center justify-between py-1">
              <span className="font-medium">Distance:</span>
              <span>{route.distance ? `${route.distance} km` : "N/A"}</span>
            </p>
            <div className="flex items-center justify-between py-1">
              <span className="font-medium">Points:</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-sky-500" />
                  <span>{route.boardingPoints?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Navigation className="h-4 w-4 text-sky-500" />
                  <span>{route.droppingPoints?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {(route.boardingPoints?.length > 0 ||
            route.droppingPoints?.length > 0) && (
            <div className="rounded-md bg-red-500/10 text-red-600 px-4 py-3 text-sm">
              Warning: This route has associated boarding and dropping points
              that will also be deleted.
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-sky-500 text-sky-500 hover:bg-sky-500/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {loading ? "Deleting..." : "Delete Route"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
