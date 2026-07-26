"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";

// Form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  icon: z.any().optional(),
});

export default function CreateAmenity({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      icon: null,
    },
  });

  // Handle file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      form.setValue("icon", file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Clear preview
  const clearPreview = () => {
    setPreview(null);
    form.setValue("icon", null);
  };

  // Form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Create FormData
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.icon) {
        formData.append("icon", data.icon);
      }

      // Submit to API
      await api.post("/amenities", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Show success message
      toast.success("Amenity created successfully");

      // Reset form
      form.reset();
      setPreview(null);

      // Close modal and refresh data
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Error creating amenity:", error);
      toast.error(error.response?.data?.message || "Error creating amenity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Amenity</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter amenity name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icon Upload */}
            <FormField
              control={form.control}
              name="icon"
              render={() => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        {preview ? (
                          <div className="relative h-20 w-20 rounded-lg overflow-hidden border">
                            <img
                              src={preview}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={clearPreview}
                            >
                              ×
                            </Button>
                          </div>
                        ) : (
                          <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                            <Upload className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="max-w-[250px]"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Recommended size: 40x40px. Max file size: 2MB.
                      </p>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Amenity"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
