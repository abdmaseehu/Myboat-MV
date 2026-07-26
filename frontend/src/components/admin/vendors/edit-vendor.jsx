"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Upload } from "lucide-react";
import api from "@/lib/axios";
import Image from "next/image";
import { Label } from "@/components/ui/label";

// Form validation schema
const formSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters"),
  businessEmail: z.string().email("Invalid business email address"),
  businessMobile: z
    .string()
    .min(10, "Business mobile must be at least 10 characters"),
  businessAddress: z
    .string()
    .min(5, "Business address must be at least 5 characters"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  userId: z.string().min(1, "User ID is required"),
});

export default function EditVendor({ vendor, open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(
    vendor.businessLogo
      ? `${process.env.NEXT_PUBLIC_ROOT_URL}${vendor.businessLogo}`
      : null
  );
  const fileInputRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: vendor.businessName,
      businessEmail: vendor.businessEmail,
      businessMobile: vendor.businessMobile,
      businessAddress: vendor.businessAddress,
      status: vendor.status,
      userId: vendor.userId,
    },
  });

  useEffect(() => {
    form.reset({
      businessName: vendor.businessName,
      businessEmail: vendor.businessEmail,
      businessMobile: vendor.businessMobile,
      businessAddress: vendor.businessAddress,
      status: vendor.status,
      userId: vendor.userId,
    });
    setPreviewUrl(
      vendor.businessLogo
        ? `${process.env.NEXT_PUBLIC_ROOT_URL}${vendor.businessLogo}`
        : null
    );
  }, [vendor, form]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();

      // Append all form fields
      Object.keys(values).forEach((key) => {
        formData.append(key, values[key]);
      });

      // Append file if selected
      if (fileInputRef.current?.files[0]) {
        formData.append("businessLogo", fileInputRef.current.files[0]);
      }

      await api.put(`/vendors/${vendor.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Vendor updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating vendor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Vendor</DialogTitle>
          <DialogDescription>
            Update the vendor's information below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Business Logo</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full rounded-lg object-cover"
                      width={80}
                      height={80}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="max-w-[250px] bg-white dark:bg-zinc-800/50"
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter business name"
                      {...field}
                      className="bg-white dark:bg-zinc-800/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter business email"
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
                name="businessMobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Mobile</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter business mobile"
                        {...field}
                        className="bg-white dark:bg-zinc-800/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="businessAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter business address"
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-zinc-800/50">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
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
                disabled={loading}
                className="bg-sky-500 text-white hover:bg-sky-600"
              >
                {loading ? "Updating..." : "Update Vendor"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
