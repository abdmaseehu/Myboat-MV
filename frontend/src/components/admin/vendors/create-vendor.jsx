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
  rating: z.coerce.number().min(0).max(5).default(5),
  agentCommission: z.coerce.number().min(0).max(100).default(5),
  adminCommission: z.coerce.number().min(0).max(100).default(10),
  userId: z.string({
    required_error: "Please select a user",
  }),
});

export default function CreateVendor({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [users, setUsers] = useState([]);
  const fileInputRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      businessEmail: "",
      businessMobile: "",
      businessAddress: "",
      status: "ACTIVE",
      rating: 5,
      agentCommission: 5,
      adminCommission: 10,
      userId: "",
    },
  });

  // Fetch users for selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/auth");
        setUsers(response.data.data.users);
      } catch (error) {
        toast.error("Error fetching users");
      }
    };
    fetchUsers();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Preview
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

      // Append file if selected
      if (fileInputRef.current?.files[0]) {
        formData.append("businessLogo", fileInputRef.current.files[0]);
      }

      // Append other form data
      Object.keys(values).forEach((key) => {
        if (values[key]) {
          formData.append(key, values[key]);
        }
      });

      console.log("FormData contents:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      const response = await api.post("/vendors", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Response:", response.data);
      toast.success("Vendor created successfully");
      form.reset();
      setPreviewUrl(null);
      onSuccess();
    } catch (error) {
      console.error("Error creating vendor:", error);
      toast.error(error.response?.data?.message || "Error creating vendor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Vendor</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new vendor.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Logo Upload */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={previewUrl} />
                <AvatarFallback>
                  <Building2 className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <FormLabel>Business Logo</FormLabel>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("logo-upload").click()
                    }
                    className="w-full border-sky-500 text-sky-500 hover:bg-sky-500/10"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </div>
            </div>

            {/* User Selection */}
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select User</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-zinc-800/50">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Business Info */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Contact Info */}
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

            {/* Address */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Rating + Commissions */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator Rating (0-5)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        placeholder="5.0"
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
                name="agentCommission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Commission (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="5"
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
                name="adminCommission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Commission (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="10"
                        {...field}
                        className="bg-white dark:bg-zinc-800/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue="ACTIVE">
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-zinc-800/50">
                        <SelectValue placeholder="Select vendor status" />
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
                {loading ? "Creating..." : "Create Vendor"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
