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
import api from "@/lib/axios";

export default function DeleteBusLayout({
  open,
  onOpenChange,
  layout,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/bus-layouts/${layout.id}`);
      toast.success("Seat layout deleted successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete seat layout"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Seat Layout</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this seat layout? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm">
            <p>
              <span className="font-medium">Layout Name:</span> {layout?.name}
            </p>
            <p>
              <span className="font-medium">Total Seats:</span>{" "}
              {layout?.totalSeats}
            </p>
            <p>
              <span className="font-medium">Vehicles Using:</span>{" "}
              {layout?.vehicles?.length || 0}
            </p>
          </div>

          {layout?.vehicles?.length > 0 && (
            <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
              Warning: This layout is currently being used by{" "}
              {layout.vehicles.length} vehicle(s). Deleting it may affect
              existing configurations.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            loading={loading}
          >
            Delete Layout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
