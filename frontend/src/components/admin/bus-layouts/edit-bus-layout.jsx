"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/axios";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  totalSeats: z.coerce
    .number()
    .min(1, "Total seats must be at least 1")
    .max(100, "Total seats cannot exceed 100"),
  layout: z.object({
    rows: z.array(z.array(z.string())),
    seats: z.record(
      z.object({
        type: z.enum(["SEAT", "SLEEPER", "DRIVER", "EMPTY"]),
        number: z.number().optional(),
        isBooked: z.boolean().optional(),
      })
    ),
  }),
  isActive: z.boolean().default(true),
});

export default function EditBusLayout({
  open,
  onOpenChange,
  layout,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      totalSeats: "",
      layout: {
        rows: [["A1", "A2", "A3", "A4"]],
        seats: {
          A1: { type: "SEAT", number: 1 },
          A2: { type: "SEAT", number: 2 },
          A3: { type: "SEAT", number: 3 },
          A4: { type: "SEAT", number: 4 },
        },
      },
      isActive: true,
    },
  });

  // Set form values when layout changes
  useEffect(() => {
    if (layout) {
      form.reset({
        name: layout.name,
        totalSeats: layout.totalSeats,
        layout: layout.layout,
        isActive: layout.isActive,
      });
    }
  }, [layout, form]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await api.put(`/bus-layouts/${layout.id}`, data);
      toast.success("Seat layout updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update seat layout"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Seat Layout</DialogTitle>
          <DialogDescription>
            Modify the seat layout and seat configuration.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Layout Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter layout name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalSeats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Seats</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter total seats"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Disable to hide this layout from being used
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Update Layout
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
