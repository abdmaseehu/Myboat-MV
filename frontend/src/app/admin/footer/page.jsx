"use client";

import { useEffect, useState } from "react";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Eye, Loader2, PanelBottom, RotateCcw, Save } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAuth } from "@/store/use-auth";

/**
 * Paste a footer.
 *
 * The built-in footer stays in the codebase and stays the default, so this is
 * a replacement rather than a rewrite: switch it off and the original comes
 * back exactly as it was, with nothing to restore from.
 *
 * The preview renders the same string the site will, in the same isolation, so
 * what is checked here is what ships.
 */

const STARTER = `<div style="background:#0b2a3d;color:#e8f1f5;padding:48px 24px">
  <div style="max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;gap:32px;justify-content:space-between">
    <div style="min-width:220px">
      <h3 style="margin:0 0 8px;font-size:20px">Myboat MV</h3>
      <p style="margin:0;opacity:.75;font-size:14px">
        Ferries, private charters and cargo across the Maldives.
      </p>
    </div>
    <div>
      <h4 style="margin:0 0 8px;font-size:14px;letter-spacing:.08em;text-transform:uppercase;opacity:.6">Explore</h4>
      <a href="/ferry" style="display:block;color:#e8f1f5;text-decoration:none;padding:4px 0">Ferry Tickets</a>
      <a href="/charter" style="display:block;color:#e8f1f5;text-decoration:none;padding:4px 0">Private Charter</a>
      <a href="/logistics" style="display:block;color:#e8f1f5;text-decoration:none;padding:4px 0">Logistics</a>
    </div>
    <div>
      <h4 style="margin:0 0 8px;font-size:14px;letter-spacing:.08em;text-transform:uppercase;opacity:.6">Contact</h4>
      <p style="margin:0 0 4px;font-size:14px;opacity:.8">hello@myboat.mv</p>
      <p style="margin:0;font-size:14px;opacity:.8">Male', Maldives</p>
    </div>
  </div>
  <p style="max-width:1100px;margin:32px auto 0;padding-top:16px;border-top:1px solid rgba(255,255,255,.12);font-size:13px;opacity:.6">
    &copy; 2026 Myboat MV. All rights reserved.
  </p>
</div>`;

export default function FooterBuilderPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [html, setHtml] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [saved, setSaved] = useState({ html: "", mode: "DEFAULT" });

  const load = async () => {
    try {
      const res = await api.get("/admin/footer");
      const d = res?.data?.data || {};
      setHtml(d.html || "");
      setUseCustom(d.mode === "CUSTOM");
      setSaved({ html: d.html || "", mode: d.mode || "DEFAULT" });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not load the footer");
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
    try {
      setSaving(true);
      const res = await api.post("/admin/footer", {
        mode: useCustom ? "CUSTOM" : "DEFAULT",
        html,
      });
      // The server says so when a custom footer was asked for but is empty.
      toast.success(res?.data?.message || "Footer saved");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save the footer");
    } finally {
      setSaving(false);
    }
  };

  const dirty = html !== saved.html || (useCustom ? "CUSTOM" : "DEFAULT") !== saved.mode;
  const live = saved.mode === "CUSTOM" && saved.html.trim().length > 0;

  if (!isAdmin) {
    return (
      <div className="flex-1 p-4 pt-6 md:p-8">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Administrators only</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The footer renders raw HTML on every page of the public site, so
            only Myboat staff can write it.
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
        items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Footer" }]}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <PanelBottom className="h-7 w-7 text-sky-500" />
            Footer
          </h2>
          <p className="text-muted-foreground">
            Paste a footer and it replaces the built-in one on every page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {live ? (
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
              Custom footer live
            </Badge>
          ) : (
            <Badge variant="outline">Built-in footer showing</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <Label className="text-sm font-medium">Use my footer</Label>
            <p className="text-xs text-muted-foreground">
              Off, or empty, and the built-in footer comes back untouched —
              nothing to restore.
            </p>
          </div>
          <Switch checked={useCustom} onCheckedChange={setUseCustom} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">HTML</CardTitle>
            {!html.trim() && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setHtml(STARTER)}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Start from an example
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={22}
              spellCheck={false}
              placeholder="<div style=&quot;background:#0b2a3d;color:#fff;padding:48px&quot;>…</div>"
              className="font-mono text-xs leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              Inline styles are the safest bet — the site&apos;s own CSS classes
              are not guaranteed to keep their names.{" "}
              <code className="rounded bg-muted px-1 py-0.5">&lt;footer&gt;</code>{" "}
              is added around it for you.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4 text-sky-500" /> Preview
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? "Hide" : "Show"}
            </Button>
          </CardHeader>
          <CardContent>
            {showPreview ? (
              html.trim() ? (
                <div className="overflow-x-auto rounded-lg border">
                  {/* The same string the site renders, so what is checked here
                      is what ships. */}
                  <div
                    className="cms-footer"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                  Nothing pasted yet.
                </div>
              )
            ) : (
              <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                Preview hidden.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving || !dirty} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save footer
        </Button>
        {dirty && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}
