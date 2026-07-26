// src/components/admin/income-expenses/create-income-expense.jsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

// Form validation schema
const formSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().optional(),
  transactionDate: z.string().min(1, "Date is required"),
});

export default function CreateIncomeExpense({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: "",
      amount: "",
      description: "",
      transactionDate: new Date().toISOString().split("T")[0],
    },
  });

  // Fetch categories when component mounts
  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      if (!mounted) return;

      try {
        setLoadingCategories(true);
        const response = await api.get("/categories");

        if (!mounted) return;

        // Check if response.data.categories exists and is an array
        if (
          response.data?.data?.categories &&
          Array.isArray(response.data.data.categories)
        ) {
          setCategories(response.data.data.categories);
        } else {
          console.error("Invalid categories data:", response.data);
          toast.error("Invalid categories data received");
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Error fetching categories:", error);
        toast.error("Failed to fetch categories");
      } finally {
        if (!mounted) return;
        setLoadingCategories(false);
      }
    };

    if (open) {
      fetchCategories();
    }

    return () => {
      mounted = false;
    };
  }, [open]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await api.post("/income-expenses", {
        ...data,
        amount: parseFloat(data.amount),
      });
      toast.success("Transaction created successfully");
      form.reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error(
        error.response?.data?.message || "Error creating transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Transaction</DialogTitle>
          <DialogDescription>
            Add a new income or expense transaction.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loadingCategories}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingCategories
                              ? "Loading categories..."
                              : categories.length === 0
                              ? "No categories available"
                              : "Select a category"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}
                            className={cn(
                              "flex items-center gap-2",
                              category.type === "INCOME"
                                ? "text-green-600"
                                : "text-red-600"
                            )}
                          >
                            {category.name} ({category.type})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                          {loadingCategories
                            ? "Loading..."
                            : "No categories available"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount"
                      {...field}
                      className="bg-white dark:bg-zinc-800/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      className="bg-white dark:bg-zinc-800/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description"
                      {...field}
                      className="bg-white dark:bg-zinc-800/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                disabled={
                  loading || loadingCategories || categories.length === 0
                }
                className="bg-sky-500 text-black hover:bg-sky-600"
              >
                {loading ? "Creating..." : "Create Transaction"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
