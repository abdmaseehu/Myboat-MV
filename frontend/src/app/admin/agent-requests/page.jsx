"use client";

import { useEffect, useState } from "react";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Handshake, Loader2, Mail, Phone, UserPlus } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

/**
 * Pending agent applications for this operator.
 *
 * The operator sets the commission and discount at approval. The ceilings come
 * from the API rather than being hardcoded here, and the server re-checks them
 * — these inputs are a convenience, not the control.
 */
export default function AgentRequestsPage() {
  const [rows, setRows] = useState([]);
  const [ceilings, setCeilings] = useState({ maxCommission: 25, maxDiscount: 25 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [terms, setTerms] = useState({});

  const load = async () => {
    const res = await api.get("/operator-agents/requests");
    const list = res.data?.data || [];
    setRows(list);
    if (res.data?.meta) setCeilings(res.data.meta);
    // Seed each row's inputs so the operator can just hit Approve.
    setTerms((prev) => {
      const next = { ...prev };
      list.forEach((r) => {
        if (!next[r.id]) next[r.id] = { commissionPercent: "", discountPercent: "" };
      });
      return next;
    });
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {
        toast.error("Could not load agent requests");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setTerm = (id, key, value) =>
    setTerms((t) => ({ ...t, [id]: { ...t[id], [key]: value } }));

  const approve = async (id) => {
    const t = terms[id] || {};
    const commission = Number(t.commissionPercent);
    const discount = Number(t.discountPercent);
    if (!Number.isFinite(commission) || !Number.isFinite(discount)) {
      toast.error("Enter both a commission and a discount");
      return;
    }
    try {
      setBusy(id);
      await api.post(`/operator-agents/${id}/approve`, {
        commissionPercent: commission,
        discountPercent: discount,
      });
      toast.success("Partnership approved");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not approve");
    } finally {
      setBusy(null);
    }
  };

  const reject = async (id) => {
    try {
      setBusy(id);
      await api.post(`/operator-agents/${id}/reject`);
      toast.success("Application declined");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not decline");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Agent Requests" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Handshake className="h-7 w-7 text-sky-500" />
            Agent Requests
          </h2>
          <p className="text-muted-foreground">
            Guesthouses applying to sell your seats. You set their terms when you
            approve.
          </p>
        </div>
        {!loading && rows.length > 0 && (
          <Badge className="bg-amber-500 hover:bg-amber-600">
            {rows.length} pending
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <UserPlus className="mx-auto h-10 w-10 text-sky-300" />
            <p className="mt-3 font-medium">No pending applications</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Agents who apply to work with you will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const t = terms[r.id] || {};
            const name =
              [r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ") ||
              r.user?.email ||
              "Agent";
            return (
              <Card key={r.id}>
                <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{name}</span>
                      <Badge variant="outline">{r.agentType || "AGENT"}</Badge>
                    </div>
                    {r.user?.email && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {r.user.email}
                      </p>
                    )}
                    {r.user?.mobile && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {r.user.mobile}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        Commission % (max {ceilings.maxCommission})
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={ceilings.maxCommission}
                        step="0.01"
                        placeholder="e.g. 10"
                        className="w-32"
                        value={t.commissionPercent ?? ""}
                        onChange={(e) =>
                          setTerm(r.id, "commissionPercent", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        Discount % (max {ceilings.maxDiscount})
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={ceilings.maxDiscount}
                        step="0.01"
                        placeholder="e.g. 5"
                        className="w-32"
                        value={t.discountPercent ?? ""}
                        onChange={(e) =>
                          setTerm(r.id, "discountPercent", e.target.value)
                        }
                      />
                    </div>

                    <Button
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={busy === r.id}
                      onClick={() => approve(r.id)}
                    >
                      {busy === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Approve"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy === r.id}
                      onClick={() => reject(r.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
