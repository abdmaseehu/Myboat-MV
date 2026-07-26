"use client";

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
import { MapPin } from "lucide-react";

export default function DeleteBoardingPoint({
  point,
  open,
  onClose,
  onSuccess,
}) {
  // Handle delete confirmation
  const handleConfirm = async () => {
    try {
      // Call the parent's onSuccess handler
      await onSuccess();
      onClose();
    } catch (error) {
      console.error("Error deleting boarding point:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-sky-500" />
            Delete Boarding Point
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the boarding point{" "}
            <span className="font-medium text-foreground">
              {point.locationName}
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-500 hover:bg-red-600"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
