"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  TrendingDown,
  Edit,
  Trash2,
  XCircle,
} from "lucide-react";
import api from "@/lib/axios";

const AGENT_TYPES = [
  { value: "GUESTHOUSE", label: "Guesthouse" },
  { value: "HOTEL", label: "Hotel" },
  { value: "AGENT", label: "Travel Agent" },
];

function AgentModal({ open, onClose, onSaved, editing }) {
  const [form, setForm] = useState({
    email: "",
    agentType: "GUESTHOUSE",
    discountPercent: 5,
    commissionPercent: 5,
    status: "PENDING",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        email: editing.user?.email || "",
        agentType: editing.agentType || "GUESTHOUSE",
        discountPercent: Number(editing.discountPercent || 0),
        commissionPercent: Number(editing.commissionPercent || 0),
        status: editing.status || "PENDING",
      });
    } else {
      setForm({
        email: "",
        agentType: "GUESTHOUSE",
        discountPercent: 5,
        commissionPercent: 5,
        status: "PENDING",
      });
    }
  }, [editing, open]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const { data } = await api.patch(`/operator-agents/${editing.id}`, {
          agentType: form.agentType,
          discountPercent: Number(form.discountPercent),
          commissionPercent: Number(form.commissionPercent),
          status: form.status,
        });
        toast.success("Agent updated");
        onSaved?.(data?.data);
      } else {
        const { data } = await api.post("/operator-agents", {
          email: form.email,
          agentType: form.agentType,
          discountPercent: Number(form.discountPercent),
          commissionPercent: Number(form.commissionPercent),
        });
        toast.success("Invitation sent");
        onSaved?.(data?.data);
      }
      onClose?.();
    } catch (err) {
      toast.error(err.message || "Failed to save agent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Agent" : "Invite Agent"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              disabled={!!editing}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Agent Type</Label>
            <Select
              value={form.agentType}
              onValueChange={(v) => setForm((f) => ({ ...f, agentType: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Discount %</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.discountPercent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discountPercent: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Commission %</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.commissionPercent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, commissionPercent: e.target.value }))
                }
              />
            </div>
          </div>
          {editing && (
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              {saving
                ? "Saving..."
                : editing
                ? "Save Changes"
                : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AgentTable({ agents, onEdit, onDelete }) {
  if (!agents.length) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <UserPlus className="mx-auto h-8 w-8 mb-2 opacity-40" />
        <p>No agents in this list yet.</p>
      </div>
    );
  }

  const typeBadge = (t) => {
    const map = {
      GUESTHOUSE: "bg-blue-100 text-blue-700",
      HOTEL: "bg-purple-100 text-purple-700",
      AGENT: "bg-slate-100 text-slate-700",
    };
    return map[t] || map.AGENT;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent / Guesthouse</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Since</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {a.user?.avatar && (
                      <AvatarImage src={a.user.avatar} alt={a.user.firstName} />
                    )}
                    <AvatarFallback className="bg-sky-500 text-white">
                      {(a.user?.firstName || "?").charAt(0)}
                      {(a.user?.lastName || "").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {a.user?.firstName} {a.user?.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.user?.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={typeBadge(a.agentType)}>
                  {a.agentType}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{a.user?.mobile || "—"}</TableCell>
              <TableCell>
                <Badge className="bg-red-100 text-red-700 border border-red-200">
                  {Number(a.discountPercent || 0)}%
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className="bg-green-100 text-green-700 border border-green-200">
                  {Number(a.commissionPercent || 0)}%
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {a.createdAt
                  ? new Date(a.createdAt).toLocaleDateString()
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(a)}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(a)}
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("ACTIVE");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/operator-agents");
      setAgents(data?.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter((a) => {
      if (!q) return true;
      const email = (a.user?.email || "").toLowerCase();
      return email.includes(q);
    });
  }, [agents, search]);

  const byStatus = useMemo(() => {
    const groups = { ACTIVE: [], PENDING: [], OTHER: [] };
    filtered.forEach((a) => {
      const s = (a.status || "PENDING").toUpperCase();
      if (s === "ACTIVE") groups.ACTIVE.push(a);
      else if (s === "PENDING") groups.PENDING.push(a);
      else groups.OTHER.push(a);
    });
    return groups;
  }, [filtered]);

  const stats = useMemo(() => {
    const active = agents.filter((a) => a.status === "ACTIVE");
    const pending = agents.filter((a) => a.status === "PENDING");
    const avgDiscount =
      agents.length > 0
        ? agents.reduce((s, a) => s + Number(a.discountPercent || 0), 0) /
          agents.length
        : 0;
    return {
      active: active.length,
      pending: pending.length,
      avgDiscount,
    };
  }, [agents]);

  const handleDelete = async (agent) => {
    if (!confirm(`Remove ${agent.user?.email}?`)) return;
    try {
      await api.delete(`/operator-agents/${agent.id}`);
      toast.success("Agent removed");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to remove agent");
    }
  };

  const openEdit = (agent) => {
    setEditing(agent);
    setShowModal(true);
  };

  const openInvite = () => {
    setEditing(null);
    setShowModal(true);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h1 className="text-2xl font-bold">Agent Management</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Agents</p>
              <p className="text-xl font-semibold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Requests</p>
              <p className="text-xl font-semibold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg. Discount</p>
              <p className="text-xl font-semibold">
                {stats.avgDiscount.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          onClick={openInvite}
          className="bg-sky-500 hover:bg-sky-600 text-white"
        >
          <UserPlus className="h-4 w-4 mr-1" /> Invite Agent
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ACTIVE">
            Active Agents{" "}
            <Badge variant="secondary" className="ml-2">
              {byStatus.ACTIVE.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="PENDING">
            Pending{" "}
            <Badge variant="secondary" className="ml-2">
              {byStatus.PENDING.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="OTHER">
            Suspended / Rejected{" "}
            <Badge variant="secondary" className="ml-2">
              {byStatus.OTHER.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ACTIVE">
          <Card>
            <CardHeader>
              <CardTitle>Agent Pricing & Details</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-6">Loading...</p>
              ) : agents.length === 0 ? (
                <div className="text-center py-10">
                  <UserPlus className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="mb-3 text-muted-foreground">
                    No agents yet — Invite your first agent
                  </p>
                  <Button
                    onClick={openInvite}
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-1" /> Invite Agent
                  </Button>
                </div>
              ) : (
                <AgentTable
                  agents={byStatus.ACTIVE}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="PENDING">
          <Card>
            <CardContent className="pt-6">
              <AgentTable
                agents={byStatus.PENDING}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="OTHER">
          <Card>
            <CardContent className="pt-6">
              <AgentTable
                agents={byStatus.OTHER}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AgentModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        onSaved={() => load()}
        editing={editing}
      />
    </div>
  );
}
