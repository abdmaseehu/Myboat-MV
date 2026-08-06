"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Search, Ship, Check, Clock } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || "";
const logoUrl = (src) =>
  !src ? null : src.startsWith("http") ? src : `${ROOT_URL}${src}`;

export default function AgentOperatorsPage() {
  const [operators, setOperators] = useState([]);
  const [partnerships, setPartnerships] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);

  const load = async () => {
    const [ops, mine] = await Promise.allSettled([
      api.get("/vendors/public"),
      api.get("/operator-agents/my-partnerships"),
    ]);
    if (ops.status === "fulfilled") {
      const d = ops.value?.data?.data;
      setOperators(Array.isArray(d) ? d : []);
    }
    if (mine.status === "fulfilled") {
      setPartnerships(mine.value?.data?.data || []);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {
        toast.error("Could not load operators");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Existing relationship per operator, so the button reflects reality.
  const statusFor = useMemo(() => {
    const map = new Map();
    partnerships.forEach((p) => map.set(p.vendor?.id || p.vendorId, p.status));
    return map;
  }, [partnerships]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return operators;
    return operators.filter((o) =>
      [o.businessName, o.baseIsland]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [operators, query]);

  const apply = async (operatorId) => {
    try {
      setApplying(operatorId);
      await api.post("/operator-agents/apply", {
        operatorId,
        agentType: "GUESTHOUSE",
      });
      toast.success("Application sent — the operator sets your rates on approval");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not send the application");
    } finally {
      setApplying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ocean-deep">
          <Ship className="h-6 w-6 text-sky-500" />
          Find Operators
        </h1>
        <p className="text-sm text-muted-foreground">
          Apply to the speedboat lines serving your island. Each operator sets
          your commission and discount when they approve you.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by operator or island"
          className="pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No operators match that search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => {
            const status = statusFor.get(o.id);
            const logo = logoUrl(o.businessLogo);
            return (
              <Card key={o.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo}
                        alt={o.businessName}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100">
                        <Ship className="h-5 w-5 text-sky-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{o.businessName}</p>
                      {o.baseIsland && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {o.baseIsland}
                        </p>
                      )}
                    </div>
                  </div>

                  {status === "ACTIVE" ? (
                    <Badge className="justify-center gap-1 bg-emerald-500 hover:bg-emerald-600">
                      <Check className="h-3 w-3" /> Partnered
                    </Badge>
                  ) : status === "PENDING" ? (
                    <Badge variant="outline" className="justify-center gap-1">
                      <Clock className="h-3 w-3" /> Awaiting approval
                    </Badge>
                  ) : status === "SUSPENDED" ? (
                    <Badge variant="outline" className="justify-center">
                      Suspended
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-full bg-sky-500 text-white hover:bg-sky-600"
                      disabled={applying === o.id}
                      onClick={() => apply(o.id)}
                    >
                      {applying === o.id ? (
                        <>
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending…
                        </>
                      ) : status === "REJECTED" ? (
                        "Apply again"
                      ) : (
                        "Apply to Partner"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
