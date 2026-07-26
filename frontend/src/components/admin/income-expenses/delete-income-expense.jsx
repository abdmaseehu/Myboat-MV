// src/components/admin/income-expenses/delete-income-expense.jsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/axios";

export default function DeleteIncomeExpense({
  item,
  open,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await api.delete(`/income-expenses/${item.id}`);

      if (response.data.success) {
        toast.success("Record deleted successfully");
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Record</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this{" "}
            {item.category.type.toLowerCase()} record? This action cannot be
            undone.
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
            {loading ? "Deleting..." : "Delete Record"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
