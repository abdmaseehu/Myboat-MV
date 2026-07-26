"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

// Validation schema
const driverSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseExpiryDate: z.string().min(1, "License expiry date is required"),
  address: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  drivingStatus: z
    .enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY"])
    .default("AVAILABLE"),
});

export default function CreateDriver({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    licenseExpiryDate: "",
    address: "",
    status: "ACTIVE",
    drivingStatus: "AVAILABLE",
  });
  const [files, setFiles] = useState({
    driverPhoto: null,
    driverLicenseBack: null,
    driverLicenseFront: null,
  });
  const [previews, setPreviews] = useState({
    driverPhoto: null,
    driverLicenseBack: null,
    driverLicenseFront: null,
  });
  const [errors, setErrors] = useState({});

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle file changes
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files[0]) {
      setFiles((prev) => ({
        ...prev,
        [name]: files[0],
      }));
      setPreviews((prev) => ({
        ...prev,
        [name]: URL.createObjectURL(files[0]),
      }));
    }
  };

  // Clear file preview
  const clearFilePreview = (name) => {
    setFiles((prev) => ({
      ...prev,
      [name]: null,
    }));
    setPreviews((prev) => ({
      ...prev,
      [name]: null,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validate form data
      const validatedData = driverSchema.parse(formData);

      // Create FormData for file upload
      const formDataToSend = new FormData();
      Object.keys(validatedData).forEach((key) => {
        if (validatedData[key]) {
          formDataToSend.append(key, validatedData[key]);
        }
      });

      // Append files
      if (files.driverPhoto) {
        formDataToSend.append("driverPhoto", files.driverPhoto);
      }
      if (files.driverLicenseBack) {
        formDataToSend.append("driverLicenseBack", files.driverLicenseBack);
      }
      if (files.driverLicenseFront) {
        formDataToSend.append("driverLicenseFront", files.driverLicenseFront);
      }

      // Submit to API
      await api.post("/drivers", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Driver created successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
        toast.error("Please check the form for errors");
      } else {
        toast.error(error.response?.data?.message || "Error creating driver");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Driver</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={cn(errors.name && "border-destructive")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={cn(errors.email && "border-destructive")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={cn(errors.phone && "border-destructive")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                className={cn(errors.licenseNumber && "border-destructive")}
              />
              {errors.licenseNumber && (
                <p className="text-sm text-destructive">
                  {errors.licenseNumber}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseExpiryDate">License Expiry Date</Label>
              <Input
                id="licenseExpiryDate"
                name="licenseExpiryDate"
                type="date"
                value={formData.licenseExpiryDate}
                onChange={handleChange}
                className={cn(errors.licenseExpiryDate && "border-destructive")}
              />
              {errors.licenseExpiryDate && (
                <p className="text-sm text-destructive">
                  {errors.licenseExpiryDate}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={cn(errors.address && "border-destructive")}
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-3 gap-4">
            {/* Driver Photo */}
            <div className="space-y-2">
              <Label>Driver Photo</Label>
              <div className="flex flex-col items-center gap-4">
                {previews.driverPhoto ? (
                  <div className="relative h-32 w-32 rounded-lg overflow-hidden border">
                    <img
                      src={previews.driverPhoto}
                      alt="Driver"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => clearFilePreview("driverPhoto")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="h-32 w-32 rounded-lg border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-sky-500/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground/30" />
                    <span className="text-xs text-muted-foreground">
                      Upload
                    </span>
                    <Input
                      type="file"
                      name="driverPhoto"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* License Back */}
            <div className="space-y-2">
              <Label>License Back</Label>
              <div className="flex flex-col items-center gap-4">
                {previews.driverLicenseBack ? (
                  <div className="relative h-32 w-32 rounded-lg overflow-hidden border">
                    <img
                      src={previews.driverLicenseBack}
                      alt="License Back"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => clearFilePreview("driverLicenseBack")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="h-32 w-32 rounded-lg border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-sky-500/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground/30" />
                    <span className="text-xs text-muted-foreground">
                      Upload
                    </span>
                    <Input
                      type="file"
                      name="driverLicenseBack"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* License Front */}
            <div className="space-y-2">
              <Label>License Front</Label>
              <div className="flex flex-col items-center gap-4">
                {previews.driverLicenseFront ? (
                  <div className="relative h-32 w-32 rounded-lg overflow-hidden border">
                    <img
                      src={previews.driverLicenseFront}
                      alt="License Front"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => clearFilePreview("driverLicenseFront")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="h-32 w-32 rounded-lg border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-sky-500/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground/30" />
                    <span className="text-xs text-muted-foreground">
                      Upload
                    </span>
                    <Input
                      type="file"
                      name="driverLicenseFront"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Status Switches */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="status"
                checked={formData.status === "ACTIVE"}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: checked ? "ACTIVE" : "INACTIVE",
                  }))
                }
              />
              <Label htmlFor="status">Active Status</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="drivingStatus"
                checked={formData.drivingStatus === "AVAILABLE"}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    drivingStatus: checked ? "AVAILABLE" : "OFF_DUTY",
                  }))
                }
              />
              <Label htmlFor="drivingStatus">Available for Driving</Label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
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
              {loading ? "Creating..." : "Create Driver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
