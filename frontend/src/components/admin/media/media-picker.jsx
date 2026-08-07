"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, ImagePlus, Loader2, Upload } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

/**
 * Pick an image from the library, or add one to it without leaving the form.
 *
 * Shared by the page builder and anywhere else that wants an image URL. It
 * hands back the URL rather than an id, because that is what the fields
 * consuming it store — a page keeps a URL so it can point at an image hosted
 * anywhere, not only at ours.
 */
export function MediaPicker({ open, onOpenChange, onSelect }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState(null);
  const inputRef = useRef(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/media");
      setAssets(res?.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not load the library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setChosen(null);
      load();
    }
  }, [open]);

  const upload = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const form = new FormData();
    files.forEach((f) => form.append("files", f));

    try {
      setUploading(true);
      const res = await api.post("/admin/media", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(res?.data?.message || "Uploaded");
      const added = res?.data?.data || [];
      // Newly uploaded is almost always the one wanted, so preselect it.
      if (added[0]) setChosen(added[0]);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const filtered = search.trim()
    ? assets.filter((a) =>
        [a.originalName, a.altText]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(search.trim().toLowerCase()))
      )
    : assets;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose an image</DialogTitle>
          <DialogDescription>
            From the library, or drop a new one in.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button
            variant="outline"
            className="gap-2"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
        </div>

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <ImagePlus className="mx-auto h-10 w-10 text-sky-300" />
            <p className="mt-3 text-sm font-medium">
              {assets.length === 0 ? "The library is empty" : "Nothing matches"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload an image and it will be available to every page.
            </p>
          </div>
        ) : (
          <div className="grid max-h-[45vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setChosen(a)}
                className={`group relative overflow-hidden rounded-lg border-2 text-left transition ${
                  chosen?.id === a.id
                    ? "border-sky-500 ring-2 ring-sky-500/30"
                    : "border-transparent hover:border-sky-300"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt={a.altText || a.originalName || ""}
                  className="h-28 w-full bg-muted object-cover"
                  loading="lazy"
                />
                {chosen?.id === a.id && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-sky-500 p-1 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <span className="block truncate px-2 py-1 text-[11px] text-muted-foreground">
                  {a.originalName || a.storageKey}
                </span>
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!chosen}
            onClick={() => {
              onSelect?.(chosen);
              onOpenChange(false);
            }}
          >
            Use this image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
