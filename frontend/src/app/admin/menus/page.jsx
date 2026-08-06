"use client";

import { useEffect, useState } from "react";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Menu as MenuIcon,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAuth } from "@/store/use-auth";

/**
 * The public site's header links.
 *
 * These were an array in the header component, so adding one meant a deploy —
 * which stopped making sense the moment pages could be written from the
 * dashboard. Reordering is arrows rather than drag-and-drop: the list is six
 * items long, and arrows work on a phone and with a keyboard.
 */

const BLANK = {
  id: null,
  label: "",
  url: "",
  location: "HEADER",
  isVisible: true,
  openInNewTab: false,
};

export default function MenusPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [pages, setPages] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    try {
      const [nav, pgs] = await Promise.allSettled([
        api.get("/admin/nav?location=HEADER"),
        api.get("/admin/pages"),
      ]);
      if (nav.status === "fulfilled") setItems(nav.value?.data?.data || []);
      // Offered as suggestions when adding a link, so a page written five
      // minutes ago does not have to have its path retyped.
      if (pgs.status === "fulfilled") {
        setPages((pgs.value?.data?.data || []).filter((p) => p.isPublished));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not load the menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const save = async () => {
    if (!form.label.trim()) return toast.error("Give the link a label");
    if (!form.url.trim()) return toast.error("Give the link a destination");

    const payload = {
      label: form.label,
      url: form.url,
      location: "HEADER",
      isVisible: form.isVisible,
      openInNewTab: form.openInNewTab,
    };

    try {
      setSaving(true);
      if (form.id) {
        await api.patch(`/admin/nav/${form.id}`, payload);
        toast.success("Link updated");
      } else {
        await api.post("/admin/nav", payload);
        toast.success("Link added");
      }
      setEditorOpen(false);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save the link");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Move one item and send the whole order back.
   *
   * The list is reordered locally first so the arrow feels instant; the server
   * is the authority, and load() puts it right if the write failed.
   */
  const move = async (index, delta) => {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);

    try {
      setBusy(true);
      await api.post("/admin/nav/reorder", { ids: next.map((i) => i.id) });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not reorder");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const toggleVisible = async (item) => {
    try {
      setBusy(true);
      await api.patch(`/admin/nav/${item.id}`, { isVisible: !item.isVisible });
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update the link");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/admin/nav/${deleting.id}`);
      toast.success("Link removed");
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not remove the link");
    }
  };

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  if (!isAdmin) {
    return (
      <div className="flex-1 p-4 pt-6 md:p-8">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Administrators only</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The site navigation is set by Myboat.
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
        items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Menus" }]}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <MenuIcon className="h-7 w-7 text-sky-500" />
            Menus
          </h2>
          <p className="text-muted-foreground">
            The links across the top of the public site, on desktop and mobile
            alike.
          </p>
        </div>
        <Button
          onClick={() => {
            setForm(BLANK);
            setEditorOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add link
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Header menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <MenuIcon className="mx-auto h-10 w-10 text-sky-300" />
              <p className="mt-3 font-medium">No links configured</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The site falls back to its built-in menu until you add one.
              </p>
            </div>
          ) : (
            items.map((item, i) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={i === 0 || busy}
                    onClick={() => move(i, -1)}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={i === items.length - 1 || busy}
                    onClick={() => move(i, 1)}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    {item.label}
                    {item.openInNewTab && (
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {!item.isVisible && (
                      <Badge variant="outline" className="border-amber-400 text-amber-700">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  <code className="text-xs text-muted-foreground">{item.url}</code>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={busy}
                    onClick={() => toggleVisible(item)}
                    aria-label={item.isVisible ? "Hide link" : "Show link"}
                  >
                    {item.isVisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setForm({ ...BLANK, ...item });
                      setEditorOpen(true);
                    }}
                    aria-label="Edit link"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleting(item)}
                    aria-label="Remove link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit link" : "Add link"}</DialogTitle>
            <DialogDescription>
              A site path like /charter, a custom page, or a full external
              address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={form.label}
                onChange={set("label")}
                placeholder="Island Guides"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="url">Destination</Label>
              <Input
                id="url"
                value={form.url}
                onChange={set("url")}
                placeholder="/pages/maldives/huraa-guide"
                className="font-mono text-sm"
              />
              {pages.length > 0 && (
                <div className="pt-1">
                  <Label className="text-xs text-muted-foreground">
                    Or pick a custom page
                  </Label>
                  <Select
                    onValueChange={(slug) =>
                      setForm((f) => ({
                        ...f,
                        url: `/pages/${slug}`,
                        label:
                          f.label ||
                          pages.find((p) => p.slug === slug)?.title ||
                          f.label,
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a page" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {pages.map((p) => (
                        <SelectItem key={p.id} value={p.slug}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Visible</Label>
                <p className="text-xs text-muted-foreground">
                  Hidden links stay configured but leave the header.
                </p>
              </div>
              <Switch
                checked={form.isVisible}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isVisible: v }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Open in a new tab</Label>
                <p className="text-xs text-muted-foreground">
                  Usually only for links off the site.
                </p>
              </div>
              <Switch
                checked={form.openInNewTab}
                onCheckedChange={(v) => setForm((f) => ({ ...f, openInNewTab: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {form.id ? "Save changes" : "Add link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this link?</DialogTitle>
            <DialogDescription>
              <b>{deleting?.label}</b> will disappear from the site header. The
              page it points at is not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={remove}>
              Remove link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
