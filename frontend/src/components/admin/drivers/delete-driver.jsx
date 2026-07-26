"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/axios";

export default function DeleteDriver({ open, onClose, driver }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/drivers/${driver.id}`);
      toast.success("Driver deleted successfully");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting driver");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Driver</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p>
            Are you sure you want to delete the driver "{driver.name}"? This
            action cannot be undone.
          </p>

          <div className="flex justify-end gap-4">
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
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {loading ? "Deleting..." : "Delete Driver"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
