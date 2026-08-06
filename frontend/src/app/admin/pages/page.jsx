"use client";

import { useEffect, useMemo, useState } from "react";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  FileCode,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAuth } from "@/store/use-auth";

/**
 * Custom pages: island guides, landing pages, policy text.
 *
 * The body is raw HTML on purpose — the point is to paste a layout with its
 * own styles and widgets. That HTML runs in every visitor's browser, so this
 * screen is administrators only and the API enforces the same.
 */

const BLANK = {
  id: null,
  title: "",
  slug: "",
  htmlContent: "",
  metaTitle: "",
  metaDescription: "",
  schemaJson: "",
  isPublished: true,
};

/** The same reduction the server makes, so the preview matches what is saved. */
const normaliseSlug = (raw) =>
  String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "-")
    .split("/")
    .map((s) =>
      s
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
    )
    .filter(Boolean)
    .join("/");

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

export default function CustomPagesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [search, setSearch] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    try {
      const res = await api.get("/admin/pages");
      setPages(res?.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not load pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const openNew = () => {
    setForm(BLANK);
    setEditorOpen(true);
  };

  // The table omits the body because it can be very large; the editor needs it,
  // so open fetches the whole row.
  const openEdit = async (row) => {
    setForm({ ...BLANK, ...row, id: row.id });
    setEditorOpen(true);
    try {
      setLoadingPage(true);
      const res = await api.get(`/admin/pages/${row.id}`);
      const d = res?.data?.data;
      if (d) {
        setForm({
          id: d.id,
          title: d.title || "",
          slug: d.slug || "",
          htmlContent: d.htmlContent || "",
          metaTitle: d.metaTitle || "",
          metaDescription: d.metaDescription || "",
          schemaJson: d.schemaJson || "",
          isPublished: !!d.isPublished,
        });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not open that page");
      setEditorOpen(false);
    } finally {
      setLoadingPage(false);
    }
  };

  const schemaError = useMemo(() => {
    const raw = String(form.schemaJson || "").trim();
    if (!raw) return null;
    try {
      JSON.parse(raw);
      return null;
    } catch (e) {
      return e.message;
    }
  }, [form.schemaJson]);

  const save = async () => {
    if (!form.title.trim()) return toast.error("Give the page a title");
    if (!normaliseSlug(form.slug)) return toast.error("Give the page a path");
    if (schemaError) return toast.error("Fix the structured data before saving");

    const payload = {
      title: form.title,
      slug: form.slug,
      htmlContent: form.htmlContent,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      schemaJson: form.schemaJson,
      isPublished: form.isPublished,
    };

    try {
      setSaving(true);
      if (form.id) {
        await api.patch(`/admin/pages/${form.id}`, payload);
        toast.success("Page updated");
      } else {
        await api.post("/admin/pages", payload);
        toast.success("Page created");
      }
      setEditorOpen(false);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save the page");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/admin/pages/${deleting.id}`);
      toast.success("Page deleted");
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not delete the page");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) =>
      [p.title, p.slug].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    );
  }, [pages, search]);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const preview = normaliseSlug(form.slug);

  if (!isAdmin) {
    return (
      <div className="flex-1 p-4 pt-6 md:p-8">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Administrators only</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Custom pages render raw HTML on the public site, so only Myboat
            staff can write them.
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
        items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Pages" }]}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <FileCode className="h-7 w-7 text-sky-500" />
            Pages
          </h2>
          <p className="text-muted-foreground">
            Island guides, landing pages and policy text — written here, live at
            /pages/… without a deploy.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New page
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">
            {pages.length} page{pages.length === 1 ? "" : "s"}
          </CardTitle>
          <Input
            placeholder="Search title or path"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-14 text-center">
              <FileCode className="mx-auto h-10 w-10 text-sky-300" />
              <p className="mt-3 font-medium">No pages yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                A page can nest as deep as you like — try
                maldives/kaafu-atoll/huraa-guide.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.title}
                      {p.metaTitle && (
                        <div className="text-[11px] text-muted-foreground">
                          SEO: {p.metaTitle}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        /pages/{p.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      {p.isPublished ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-400 text-amber-700">
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmtDate(p.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {p.isPublished && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a
                              href={`/pages/${p.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="View page"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(p)}
                          aria-label="Edit page"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleting(p)}
                          aria-label="Delete page"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------ builder ------------------------------ */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit page" : "New page"}</DialogTitle>
            <DialogDescription>
              The body is rendered as raw HTML, exactly as written.
            </DialogDescription>
          </DialogHeader>

          {loadingPage ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Page title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={set("title")}
                    placeholder="Huraa Island Guide"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug">Path</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={set("slug")}
                    placeholder="maldives/kaafu-atoll/huraa-guide"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lives at{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      /pages/{preview || "…"}
                    </code>
                    . Slashes nest it; spaces and capitals are tidied for you.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="html">HTML body</Label>
                <Textarea
                  id="html"
                  value={form.htmlContent}
                  onChange={set("htmlContent")}
                  rows={14}
                  spellCheck={false}
                  placeholder={'<section class="hero">\n  <h1>Huraa</h1>\n</section>'}
                  className="font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="metaTitle">Meta title</Label>
                  <Input
                    id="metaTitle"
                    value={form.metaTitle}
                    onChange={set("metaTitle")}
                    placeholder="Falls back to the page title"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="metaDescription">Meta description</Label>
                  <Textarea
                    id="metaDescription"
                    value={form.metaDescription}
                    onChange={set("metaDescription")}
                    rows={3}
                    placeholder="Shown under the title in search results"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="schema">Structured data (JSON-LD)</Label>
                <Textarea
                  id="schema"
                  value={form.schemaJson}
                  onChange={set("schemaJson")}
                  rows={6}
                  spellCheck={false}
                  placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "TouristDestination"\n}'}
                  className="font-mono text-xs"
                />
                {/* Broken markup in a page's head is worse than an error here,
                    because nothing on the page looks wrong. */}
                {schemaError ? (
                  <p className="text-xs text-destructive">Not valid JSON — {schemaError}</p>
                ) : form.schemaJson?.trim() ? (
                  <p className="text-xs text-emerald-600">Valid JSON.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Optional. Injected into the page head as-is.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="published" className="text-sm font-medium">
                    Published
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    An unpublished page is a 404 to everyone but you.
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={form.isPublished}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v }))}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={save} disabled={saving || loadingPage} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {form.id ? "Save changes" : "Create page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this page?</DialogTitle>
            <DialogDescription>
              <b>{deleting?.title}</b> at{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                /pages/{deleting?.slug}
              </code>{" "}
              will be removed and the URL will start returning 404. This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={remove}>
              Delete page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
