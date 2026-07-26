"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";

export default function DeleteVehicle({ open, onClose, vehicle, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!vehicle?.id) return;

    try {
      setLoading(true);
      await api.delete(`/vehicles/${vehicle.id}`);
      toast.success("Vehicle deleted successfully");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting vehicle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This action cannot be undone. This will permanently delete the
              vehicle:
            </p>
            <div className="rounded-md bg-zinc-900/50 p-3 text-sm">
              <div>
                <span className="font-medium">Vehicle Name:</span>{" "}
                {vehicle?.vehicleName}
              </div>
              <div>
                <span className="font-medium">Vehicle Number:</span>{" "}
                {vehicle?.vehicleNumber}
              </div>
              <div>
                <span className="font-medium">Type:</span>{" "}
                {vehicle?.vehicleType}
              </div>
              <div>
                <span className="font-medium">Route:</span>{" "}
                {vehicle?.route
                  ? `${vehicle.route.sourceCity} - ${vehicle.route.destinationCity}`
                  : "Not Assigned"}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={loading}
            className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:text-zinc-50"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Vehicle"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
