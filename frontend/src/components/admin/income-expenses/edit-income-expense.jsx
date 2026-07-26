// src/components/admin/income-expenses/edit-income-expense.jsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

const incomeExpenseSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required").transform(Number),
  description: z.string().optional(),
  transactionDate: z.string().min(1, "Transaction date is required"),
});

export default function EditIncomeExpense({ item, open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    description: "",
    transactionDate: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item) {
      setFormData({
        categoryId: item.categoryId || "",
        amount: item.amount?.toString() || "",
        description: item.description || "",
        transactionDate: item.transactionDate
          ? new Date(item.transactionDate).toISOString().split("T")[0]
          : "",
      });
    }
  }, [item]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (error) {
        toast.error("Failed to fetch categories");
      }
    };

    if (open) {
      fetchCategories();
    }
  }, [open]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const validatedData = incomeExpenseSchema.parse(formData);

      const response = await api.put(
        `/income-expenses/${item.id}`,
        validatedData
      );

      if (response.data.success) {
        toast.success("Record updated successfully");
        onSuccess();
        onClose();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
        toast.error("Please check the form for errors");
      } else {
        toast.error(error.response?.data?.message || "Failed to update record");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => handleChange("categoryId", value)}
            >
              <SelectTrigger
                className={cn(
                  "bg-background",
                  errors.categoryId && "border-destructive"
                )}
              >
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} ({category.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-destructive">{errors.categoryId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              className={cn(
                "bg-background",
                errors.amount && "border-destructive"
              )}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="bg-background"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionDate">Transaction Date</Label>
            <Input
              type="date"
              id="transactionDate"
              value={formData.transactionDate}
              onChange={(e) => handleChange("transactionDate", e.target.value)}
              className={cn(
                "bg-background",
                errors.transactionDate && "border-destructive"
              )}
            />
            {errors.transactionDate && (
              <p className="text-sm text-destructive">
                {errors.transactionDate}
              </p>
            )}
          </div>

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
              type="submit"
              disabled={loading}
              className="bg-sky-500 text-white hover:bg-sky-600"
            >
              {loading ? "Updating..." : "Update Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
