"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const assignmentSchema = z.object({
  driverId: z.string().min(1, "Driver is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  assignedFrom: z.string().min(1, "Assigned from date is required"),
  assignedTo: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "COMPLETED"]).default("ACTIVE"),
});

export default function CreateDriverVehicleAssignment({
  open,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    driverId: "",
    vehicleId: "",
    assignedFrom: new Date().toISOString().split("T")[0],
    assignedTo: "",
    status: "ACTIVE",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await api.get("/driver-vehicle-assigned/drivers");
        if (response.data.success) {
          setDrivers(response.data.data);
        }
      } catch (error) {
        toast.error("Failed to fetch drivers");
      }
    };

    const fetchVehicles = async () => {
      try {
        const response = await api.get("/driver-vehicle-assigned/vehicles");
        if (response.data.success) {
          setVehicles(response.data.data);
        }
      } catch (error) {
        toast.error("Failed to fetch vehicles");
      }
    };

    if (open) {
      fetchDrivers();
      fetchVehicles();
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
      const validatedData = assignmentSchema.parse(formData);

      const response = await api.post(
        "/driver-vehicle-assigned",
        validatedData
      );

      if (response.data.success) {
        toast.success("Assignment created successfully");
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
        toast.error(
          error.response?.data?.message || "Failed to create assignment"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="driverId">Driver</Label>
            <Select
              value={formData.driverId}
              onValueChange={(value) => handleChange("driverId", value)}
            >
              <SelectTrigger
                className={cn(
                  "bg-background",
                  errors.driverId && "border-destructive"
                )}
              >
                <SelectValue placeholder="Select Driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.driverId && (
              <p className="text-sm text-destructive">{errors.driverId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleId">Vehicle</Label>
            <Select
              value={formData.vehicleId}
              onValueChange={(value) => handleChange("vehicleId", value)}
            >
              <SelectTrigger
                className={cn(
                  "bg-background",
                  errors.vehicleId && "border-destructive"
                )}
              >
                <SelectValue placeholder="Select Vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vehicleId && (
              <p className="text-sm text-destructive">{errors.vehicleId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedFrom">Assigned From</Label>
            <Input
              type="date"
              id="assignedFrom"
              value={formData.assignedFrom}
              onChange={(e) => handleChange("assignedFrom", e.target.value)}
              className={cn(
                "bg-background",
                errors.assignedFrom && "border-destructive"
              )}
            />
            {errors.assignedFrom && (
              <p className="text-sm text-destructive">{errors.assignedFrom}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned To (Optional)</Label>
            <Input
              type="date"
              id="assignedTo"
              value={formData.assignedTo}
              onChange={(e) => handleChange("assignedTo", e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
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
              {loading ? "Creating..." : "Create Assignment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
