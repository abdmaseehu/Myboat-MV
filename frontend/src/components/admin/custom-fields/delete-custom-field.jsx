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
import { Database } from "lucide-react";

export default function DeleteCustomField({
  customField,
  open,
  onClose,
  onSuccess,
}) {
  const handleConfirm = async () => {
    try {
      await onSuccess();
      onClose();
    } catch (error) {
      console.error("Error deleting custom field:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-sky-500" />
            Delete Custom Field
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the custom field{" "}
            <span className="font-medium text-foreground">
              {customField.name}
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
