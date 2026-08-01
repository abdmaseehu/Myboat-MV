"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2, Plus, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IslandMultiSelect,
  IslandSingleSelect,
} from "@/components/common/island-select";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

// How many pairs to list in the preview before collapsing into "+N more"
const PREVIEW_LIMIT = 8;

// Format time for API submission
const formatTimeForSubmission = (time) => {
  if (!time) return null;
  const today = new Date().toISOString().split("T")[0];
  return new Date(`${today}T${time}`).toISOString();
};

// A duplicate (sourceCity, destinationCity) pair trips the DB unique index.
// The API returns 409, but older deployments surface it as a 500 carrying the
// Prisma unique-constraint message - treat both as "already existed".
const isDuplicateError = (error) => {
  const status = error?.response?.status;
  if (status === 409) return true;
  const message = error?.response?.data?.message || "";
  return /unique constraint|already exists/i.test(message);
};

export default function CreateRoute({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sourceCities: [],
    destinationCities: [],
    serviceType: "SCHEDULED_FERRY",
    distance: "",
    durationMinutes: "",
    isActive: true,
    boardingPoints: [],
    droppingPoints: [],
  });

  // Every (from, to) combination, minus same-island pairs.
  const pairs = useMemo(() => {
    const result = [];
    formData.sourceCities.forEach((from) => {
      formData.destinationCities.forEach((to) => {
        if (from !== to) result.push({ from, to });
      });
    });
    return result;
  }, [formData.sourceCities, formData.destinationCities]);

  const resetForm = () => {
    setFormData({
      sourceCities: [],
      destinationCities: [],
      serviceType: "SCHEDULED_FERRY",
      distance: "",
    durationMinutes: "",
      isActive: true,
      boardingPoints: [],
      droppingPoints: [],
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ---------------------------- boarding points --------------------------- */

  const addBoardingPoint = () => {
    setFormData((prev) => ({
      ...prev,
      boardingPoints: [
        ...prev.boardingPoints,
        {
          locationName: "",
          arrivalTime: "",
          sequenceNumber: prev.boardingPoints.length + 1,
        },
      ],
    }));
  };

  const removeBoardingPoint = (index) => {
    setFormData((prev) => ({
      ...prev,
      boardingPoints: prev.boardingPoints.filter((_, i) => i !== index),
    }));
  };

  const updateBoardingPoint = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      boardingPoints: prev.boardingPoints.map((point, i) =>
        i === index ? { ...point, [field]: value } : point
      ),
    }));
  };

  /* ---------------------------- dropping points --------------------------- */

  const addDroppingPoint = () => {
    setFormData((prev) => ({
      ...prev,
      droppingPoints: [
        ...prev.droppingPoints,
        {
          locationName: "",
          arrivalTime: "",
          sequenceNumber: prev.droppingPoints.length + 1,
        },
      ],
    }));
  };

  const removeDroppingPoint = (index) => {
    setFormData((prev) => ({
      ...prev,
      droppingPoints: prev.droppingPoints.filter((_, i) => i !== index),
    }));
  };

  const updateDroppingPoint = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      droppingPoints: prev.droppingPoints.map((point, i) =>
        i === index ? { ...point, [field]: value } : point
      ),
    }));
  };

  /* -------------------------------- submit -------------------------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pairs.length === 0) {
      toast.error("Select at least one departure and one destination");
      return;
    }

    setLoading(true);

    // Fields shared by every generated route
    const basePayload = {
      serviceType: formData.serviceType,
      distance: formData.distance ? Number(formData.distance) : undefined,
      durationMinutes: formData.durationMinutes
        ? Number(formData.durationMinutes)
        : undefined,
      isActive: formData.isActive,
      boardingPoints: formData.boardingPoints
        .filter((point) => point.locationName?.length >= 2)
        .map((point) => ({
          locationName: point.locationName,
          sequenceNumber: point.sequenceNumber,
          arrivalTime: formatTimeForSubmission(point.arrivalTime),
        })),
      droppingPoints: formData.droppingPoints
        .filter((point) => point.locationName?.length >= 2)
        .map((point) => ({
          locationName: point.locationName,
          sequenceNumber: point.sequenceNumber,
          arrivalTime: formatTimeForSubmission(point.arrivalTime),
        })),
    };

    let created = 0;
    let duplicates = 0;
    let failed = 0;

    // Sequential - /routes creates one route at a time, and serialising keeps
    // the unique-constraint errors attributable to a specific pair.
    for (const pair of pairs) {
      try {
        await api.post("/routes", {
          ...basePayload,
          sourceCity: pair.from,
          destinationCity: pair.to,
        });
        created += 1;
      } catch (error) {
        if (isDuplicateError(error)) {
          duplicates += 1;
        } else {
          failed += 1;
        }
      }
    }

    setLoading(false);

    if (created > 0) {
      toast.success(`Created ${created} route${created === 1 ? "" : "s"}`);
    }
    if (duplicates > 0) {
      toast.info(
        `${duplicates} route${duplicates === 1 ? "" : "s"} already existed`
      );
    }
    if (failed > 0) {
      toast.error(`${failed} route${failed === 1 ? "" : "s"} failed to create`);
    }

    if (created > 0) {
      onSuccess?.();
      resetForm();
      onClose();
    }
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen && !loading) onClose();
  };

  const previewPairs = pairs.slice(0, PREVIEW_LIMIT);
  const hiddenCount = pairs.length - previewPairs.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create New Route</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Locations - one row each so the popovers get full width on mobile */}
          <div className="grid grid-cols-1 gap-4">
            <IslandMultiSelect
              label="From (select one or more locations)"
              placeholder="Select departure locations"
              value={formData.sourceCities}
              onChange={(next) =>
                setFormData((prev) => ({ ...prev, sourceCities: next }))
              }
              disabled={loading}
            />

            <IslandMultiSelect
              label="To (select one or more locations)"
              placeholder="Select destination locations"
              value={formData.destinationCities}
              onChange={(next) =>
                setFormData((prev) => ({ ...prev, destinationCities: next }))
              }
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, serviceType: v }))
                }
              >
                <SelectTrigger className="bg-background rounded-2xl h-11">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED_FERRY">Scheduled Ferry</SelectItem>
                  <SelectItem value="PRIVATE_CHARTER">Private Charter</SelectItem>
                  <SelectItem value="LOGISTICS">Logistics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distance">Nautical Miles (NM)</Label>
              <Input
                id="distance"
                name="distance"
                type="number"
                min="0"
                step="0.1"
                value={formData.distance}
                onChange={handleChange}
                placeholder="Distance in nautical miles"
                className="bg-background rounded-2xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="1"
                step="1"
                value={formData.durationMinutes}
                onChange={handleChange}
                placeholder="e.g. 90"
                className="bg-background rounded-2xl h-11"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
              className="data-[state=checked]:bg-lagoon"
            />
            <Label htmlFor="isActive">Active Route</Label>
          </div>

          {/* Boarding Points */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Boarding Points</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBoardingPoint}
                className="rounded-2xl border-lagoon text-lagoon hover:bg-teal-500/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Point
              </Button>
            </div>

            <div className="space-y-4">
              {formData.boardingPoints.map((point, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
                >
                  <IslandSingleSelect
                    label="Location"
                    placeholder="Select location"
                    value={point.locationName}
                    onChange={(v) =>
                      updateBoardingPoint(index, "locationName", v)
                    }
                    disabled={loading}
                    className="flex-1"
                  />
                  <div className="flex-1 space-y-2">
                    <Label>Arrival Time</Label>
                    <Input
                      type="time"
                      value={point.arrivalTime}
                      onChange={(e) =>
                        updateBoardingPoint(index, "arrivalTime", e.target.value)
                      }
                      className="bg-background rounded-2xl h-11"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeBoardingPoint(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Dropping Points */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Dropping Points</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDroppingPoint}
                className="rounded-2xl border-lagoon text-lagoon hover:bg-teal-500/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Point
              </Button>
            </div>

            <div className="space-y-4">
              {formData.droppingPoints.map((point, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
                >
                  <IslandSingleSelect
                    label="Location"
                    placeholder="Select location"
                    value={point.locationName}
                    onChange={(v) =>
                      updateDroppingPoint(index, "locationName", v)
                    }
                    disabled={loading}
                    className="flex-1"
                  />
                  <div className="flex-1 space-y-2">
                    <Label>Arrival Time</Label>
                    <Input
                      type="time"
                      value={point.arrivalTime}
                      onChange={(e) =>
                        updateDroppingPoint(index, "arrivalTime", e.target.value)
                      }
                      className="bg-background rounded-2xl h-11"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeDroppingPoint(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Live preview of the cartesian product */}
          <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4">
            <p className="text-sm font-medium text-lagoon">
              This will create {pairs.length} route
              {pairs.length === 1 ? "" : "s"}
            </p>

            {pairs.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {previewPairs.map((pair) => (
                  <li
                    key={`${pair.from}->${pair.to}`}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span className="truncate">{pair.from}</span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-lagoon" />
                    <span className="truncate">{pair.to}</span>
                  </li>
                ))}
                {hiddenCount > 0 && (
                  <li className="text-xs font-medium text-lagoon">
                    +{hiddenCount} more
                  </li>
                )}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Select at least one departure and one destination location.
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-2xl border-lagoon text-lagoon hover:bg-teal-500/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || pairs.length === 0}
              className="rounded-2xl bg-lagoon text-white hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Route"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
