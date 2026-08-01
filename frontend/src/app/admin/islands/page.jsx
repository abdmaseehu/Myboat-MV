"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import {
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/use-auth";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ALL = "ALL";

const ISLAND_TYPES = [
  { value: "INHABITED", label: "Inhabited" },
  { value: "RESORT", label: "Resort" },
  { value: "AIRPORT", label: "Airport" },
  { value: "INDUSTRIAL", label: "Industrial" },
];

const TYPE_BADGE_CLASSES = {
  INHABITED: "bg-slate-100 text-slate-700 border-slate-200",
  RESORT: "bg-teal-50 text-teal-700 border-teal-200",
  AIRPORT: "bg-sky-50 text-sky-700 border-sky-200",
  INDUSTRIAL: "bg-amber-50 text-amber-700 border-amber-200",
};

const EMPTY_FORM = {
  name: "",
  atollCode: "",
  atollName: "",
  type: "INHABITED",
  latitude: "",
  longitude: "",
  isActive: true,
};

function TypeBadge({ type }) {
  const meta = ISLAND_TYPES.find((t) => t.value === type);
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        TYPE_BADGE_CLASSES[type] || "bg-slate-100 text-slate-700 border-slate-200"
      )}
    >
      {meta?.label || type || "-"}
    </Badge>
  );
}

export default function IslandsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [islands, setIslands] = useState([]);
  const [atolls, setAtolls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Toolbar state
  const [search, setSearch] = useState("");
  const [atollFilter, setAtollFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Per-row toggle state
  const [togglingId, setTogglingId] = useState(null);

  const fetchIslands = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/islands?limit=500&includeInactive=true");
      setIslands(res.data?.data?.islands || []);
    } catch (error) {
      console.error("Error fetching islands:", error);
      toast.error(error.response?.data?.message || "Failed to load islands");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAtolls = useCallback(async () => {
    try {
      const res = await api.get("/islands/atolls");
      setAtolls(res.data?.data?.atolls || []);
    } catch (error) {
      console.error("Error fetching atolls:", error);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchIslands();
    fetchAtolls();
  }, [isAdmin, fetchIslands, fetchAtolls]);

  const filteredIslands = useMemo(() => {
    const q = search.trim().toLowerCase();
    return islands.filter((island) => {
      const matchesSearch =
        !q ||
        island.name?.toLowerCase().includes(q) ||
        island.label?.toLowerCase().includes(q);
      const matchesAtoll =
        atollFilter === ALL || island.atollCode === atollFilter;
      const matchesType = typeFilter === ALL || island.type === typeFilter;
      return matchesSearch && matchesAtoll && matchesType;
    });
  }, [islands, search, atollFilter, typeFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (island) => {
    setEditing(island);
    setForm({
      name: island.name ?? "",
      atollCode: island.atollCode ?? "",
      atollName: island.atollName ?? "",
      type: island.type ?? "INHABITED",
      latitude: island.latitude ?? "",
      longitude: island.longitude ?? "",
      isActive: island.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleAtollChange = (atollCode) => {
    const atoll = atolls.find((a) => a.atollCode === atollCode);
    setForm((prev) => ({
      ...prev,
      atollCode,
      atollName: atoll?.atollName || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.atollCode || !form.atollName) {
      toast.error("Atoll is required");
      return;
    }
    if (!form.type) {
      toast.error("Type is required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      atollCode: form.atollCode,
      atollName: form.atollName,
      type: form.type,
      isActive: form.isActive,
    };

    if (form.latitude !== "" && form.latitude !== null) {
      payload.latitude = Number(form.latitude);
    }
    if (form.longitude !== "" && form.longitude !== null) {
      payload.longitude = Number(form.longitude);
    }

    try {
      setSaving(true);
      if (editing) {
        await api.put(`/islands/${editing.id}`, payload);
        toast.success("Island updated successfully");
      } else {
        await api.post("/islands", payload);
        toast.success("Island created successfully");
      }
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await fetchIslands();
      await fetchAtolls();
    } catch (error) {
      console.error("Error saving island:", error);
      toast.error(error.response?.data?.message || "Failed to save island");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (island, nextValue) => {
    try {
      setTogglingId(island.id);
      // Optimistic update
      setIslands((prev) =>
        prev.map((i) => (i.id === island.id ? { ...i, isActive: nextValue } : i))
      );
      await api.put(`/islands/${island.id}`, { isActive: nextValue });
      toast.success(
        `${island.name} ${nextValue ? "activated" : "deactivated"}`
      );
    } catch (error) {
      console.error("Error updating island status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
      // Revert
      setIslands((prev) =>
        prev.map((i) =>
          i.id === island.id ? { ...i, isActive: !nextValue } : i
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/islands/${deleteTarget.id}`);
      toast.success("Island deleted successfully");
      setDeleteTarget(null);
      await fetchIslands();
      await fetchAtolls();
    } catch (error) {
      console.error("Error deleting island:", error);
      toast.error(error.response?.data?.message || "Failed to delete island");
    } finally {
      setDeleting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Toaster position="top-center" />
        <Card className="rounded-2xl shadow-premium">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <ShieldAlert className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold">Access denied</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              You do not have permission to view this page. Islands master data
              is restricted to administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <MapPin className="h-6 w-6 text-lagoon" />
            Islands
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage the master list of Maldivian islands, resorts and airports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchIslands}
            disabled={loading}
            className="hover-lift"
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
            />
            Refresh
          </Button>
          <Button onClick={openCreate} className="bg-lagoon text-white hover-lift">
            <Plus className="mr-2 h-4 w-4" />
            Add Island
          </Button>
        </div>
      </div>

      {/* Main card */}
      <Card className="rounded-2xl shadow-premium">
        <CardHeader className="gap-1">
          <CardTitle className="text-base">All Islands</CardTitle>
          <CardDescription>
            {loading
              ? "Loading islands..."
              : `${filteredIslands.length} of ${islands.length} island${
                  islands.length === 1 ? "" : "s"
                }`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search islands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row md:ml-auto">
              <Select value={atollFilter} onValueChange={setAtollFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All atolls" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All atolls</SelectItem>
                  {atolls.map((atoll) => (
                    <SelectItem key={atoll.atollCode} value={atoll.atollCode}>
                      {atoll.atollName} ({atoll.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All types</SelectItem>
                  {ISLAND_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Name</TableHead>
                    <TableHead className="min-w-[140px]">Atoll</TableHead>
                    <TableHead className="min-w-[120px]">Type</TableHead>
                    <TableHead className="min-w-[90px]">Active</TableHead>
                    <TableHead className="min-w-[100px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIslands.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-sm text-muted-foreground"
                      >
                        No islands found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIslands.map((island) => (
                      <TableRow key={island.id}>
                        <TableCell>
                          <div className="font-medium">{island.name}</div>
                          {island.label && island.label !== island.name ? (
                            <div className="text-xs text-muted-foreground">
                              {island.label}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{island.atollName}</div>
                          <div className="text-xs text-muted-foreground">
                            {island.atollCode}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TypeBadge type={island.type} />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={!!island.isActive}
                            disabled={togglingId === island.id}
                            onCheckedChange={(checked) =>
                              handleToggleActive(island, checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(island)}
                              aria-label={`Edit ${island.name}`}
                            >
                              <Pencil className="h-4 w-4 text-lagoon" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDeleteTarget(island)}
                              aria-label={`Delete ${island.name}`}
                            >
                              <Trash2 className="h-4 w-4 text-coral" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
            setForm(EMPTY_FORM);
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Island" : "Add Island"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the island details below."
                : "Create a new island entry in the master data."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="island-name">Name</Label>
              <Input
                id="island-name"
                placeholder="e.g. Maafushi"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>

            {/* Atoll */}
            <div className="space-y-2">
              <Label htmlFor="island-atoll">Atoll</Label>
              <Select
                value={form.atollCode || undefined}
                onValueChange={handleAtollChange}
              >
                <SelectTrigger id="island-atoll">
                  <SelectValue placeholder="Select an atoll" />
                </SelectTrigger>
                <SelectContent>
                  {atolls.map((atoll) => (
                    <SelectItem key={atoll.atollCode} value={atoll.atollCode}>
                      {atoll.atollName} ({atoll.atollCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="island-type">Type</Label>
              <Select
                value={form.type || undefined}
                onValueChange={(value) => setField("type", value)}
              >
                <SelectTrigger id="island-type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {ISLAND_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="island-latitude">Latitude (optional)</Label>
                <Input
                  id="island-latitude"
                  type="number"
                  step="any"
                  placeholder="3.9422"
                  value={form.latitude ?? ""}
                  onChange={(e) => setField("latitude", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="island-longitude">Longitude (optional)</Label>
                <Input
                  id="island-longitude"
                  type="number"
                  step="any"
                  placeholder="73.4906"
                  value={form.longitude ?? ""}
                  onChange={(e) => setField("longitude", e.target.value)}
                />
              </div>
            </div>

            {/* Active */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="island-active">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive islands are hidden from booking selectors.
                </p>
              </div>
              <Switch
                id="island-active"
                checked={!!form.isActive}
                onCheckedChange={(checked) => setField("isActive", checked)}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-lagoon text-white"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editing ? (
                  "Save Changes"
                ) : (
                  "Create Island"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete island?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-semibold">{deleteTarget?.name}</span> from
              the islands master data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-coral text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
