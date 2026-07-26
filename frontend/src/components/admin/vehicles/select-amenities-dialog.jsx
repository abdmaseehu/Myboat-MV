"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import api from "@/lib/axios";

export default function SelectAmenitiesDialog({
  open,
  onOpenChange,
  selectedAmenities,
  onSelect,
}) {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(selectedAmenities || []);

  const fetchAmenities = async () => {
    try {
      setLoading(true);
      const response = await api.get("/amenities", {
        params: { search },
      });
      setAmenities(response.data.data.amenities);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching amenities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, [search]);

  useEffect(() => {
    setSelected(selectedAmenities || []);
  }, [selectedAmenities]);

  const handleSelect = (amenity) => {
    const isSelected = selected.some((item) => item.id === amenity.id);
    let updatedSelection;

    if (isSelected) {
      updatedSelection = selected.filter((item) => item.id !== amenity.id);
    } else {
      updatedSelection = [...selected, amenity];
    }

    setSelected(updatedSelection);
  };

  const handleSave = () => {
    onSelect(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Amenities</DialogTitle>
          <DialogDescription>
            Choose the amenities available in this vehicle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search amenities..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Amenities List */}
          <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading...
              </div>
            ) : amenities.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No amenities found
              </div>
            ) : (
              amenities.map((amenity) => (
                <div
                  key={amenity.id}
                  className="flex items-center space-x-4 p-4 hover:bg-accent transition-colors"
                >
                  <Checkbox
                    checked={selected.some((item) => item.id === amenity.id)}
                    onCheckedChange={() => handleSelect(amenity)}
                  />
                  <div className="relative h-8 w-8">
                    <img
                      src={`${process.env.NEXT_PUBLIC_ROOT_URL}${amenity.icon}`}
                      alt={amenity.name}
                      className="rounded object-cover"
                      width={32}
                      height={32}
                    />
                  </div>
                  <span className="flex-1">{amenity.name}</span>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-sky-500 text-sky-500 hover:bg-sky-500/10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-sky-500 text-black hover:bg-sky-600"
            >
              Save Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
