"use client";

import { useEffect, useRef, useState } from "react";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Check,
  Copy,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAuth } from "@/store/use-auth";

/**
 * The media library.
 *
 * Files went to storage before this existed but nothing listed them, so an
 * image on a page meant hosting it elsewhere and pasting a URL. Here they can
 * be dropped in, copied out, and given the alt text nobody writes at upload
 * time.
 */

const fmtSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export default function MediaPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(null);
  const [editing, setEditing] = useState(null);
  const [altDraft, setAltDraft] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef(null);

  const load = async () => {
    try {
      const res = await api.get("/admin/media");
      setAssets(res?.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not load the library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

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
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const copy = async (asset) => {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopied(asset.id);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      toast.error("Could not copy — select the URL and copy it manually");
    }
  };

  const saveAlt = async () => {
    try {
      await api.patch(`/admin/media/${editing.id}`, { altText: altDraft });
      toast.success("Saved");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save");
    }
  };

  const remove = async () => {
    try {
      setRemoving(true);
      const res = await api.delete(`/admin/media/${deleting.id}`);
      const used = res?.data?.data?.usedBy || [];
      if (used.length) {
        // Said plainly rather than buried: the pages are now showing a gap.
        toast.warning(
          `Deleted. Still referenced by: ${used.map((u) => u.title).join(", ")}`
        );
      } else {
        toast.success("Deleted");
      }
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not delete");
    } finally {
      setRemoving(false);
    }
  };

  const filtered = search.trim()
    ? assets.filter((a) =>
        [a.originalName, a.altText]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(search.trim().toLowerCase()))
      )
    : assets;

  if (!isAdmin) {
    return (
      <div className="flex-1 p-4 pt-6 md:p-8">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Administrators only</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The media library is part of site authoring.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <BreadcrumbNav
        items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Media" }]}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <ImageIcon className="h-7 w-7 text-sky-500" />
            Media
          </h2>
          <p className="text-muted-foreground">
            Images for pages and the footer. Upload once, use anywhere.
          </p>
        </div>
        <Input
          placeholder="Search by name or alt text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Drop target doubles as the upload button — the two gestures people
          reach for, in one place. */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer?.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed p-8 text-center transition ${
          dragging ? "border-sky-500 bg-sky-50 dark:bg-sky-950/20" : "hover:border-sky-300"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">
          {uploading ? "Uploading…" : "Drop images here, or click to choose"}
        </span>
        <span className="text-xs text-muted-foreground">
          JPG, PNG, WEBP or GIF · up to 5 MB each · 20 at a time
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {assets.length} file{assets.length === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-sky-300" />
              <p className="mt-3 font-medium">
                {assets.length === 0 ? "Nothing uploaded yet" : "Nothing matches"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((a) => (
                <div key={a.id} className="overflow-hidden rounded-xl border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.url}
                    alt={a.altText || a.originalName || ""}
                    className="h-32 w-full bg-muted object-cover"
                    loading="lazy"
                  />
                  <div className="space-y-1.5 p-2.5">
                    <div className="truncate text-xs font-medium" title={a.originalName}>
                      {a.originalName || a.storageKey}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {fmtSize(a.sizeBytes)}
                      {a.altText ? " · alt set" : " · no alt text"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 flex-1 gap-1 px-2 text-[11px]"
                        onClick={() => copy(a)}
                      >
                        {copied === a.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copied === a.id ? "Copied" : "URL"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => {
                          setEditing(a);
                          setAltDraft(a.altText || "");
                        }}
                      >
                        Alt
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleting(a)}
                        aria-label="Delete file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alt text</DialogTitle>
            <DialogDescription>
              What a screen reader announces, and what a search engine reads
              when the image will not load.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="alt">Describe the image</Label>
            <Input
              id="alt"
              value={altDraft}
              onChange={(e) => setAltDraft(e.target.value)}
              placeholder="Speedboat moored off Huraa at sunset"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveAlt}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this file?</DialogTitle>
            <DialogDescription>
              <b>{deleting?.originalName}</b> will be removed from storage. Any
              page still pointing at it will show a broken image — you will be
              told which, if any.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={remove} disabled={removing}>
              {removing && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
