"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import api from "@/lib/axios";

export default function DeleteAmenity({ open, onClose, amenity, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await api.delete(`/amenities/${amenity.id}`);

      if (response.data.success) {
        toast.success("Amenity deleted successfully");
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete amenity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Amenity</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the amenity "
            {amenity ? amenity.name : "Unknown"}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-sky-500 text-sky-500 hover:bg-sky-500/10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {loading ? "Deleting..." : "Delete Amenity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
