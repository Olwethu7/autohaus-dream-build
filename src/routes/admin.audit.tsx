import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldOff, Car, Pencil, Trash2, RefreshCw, X, FilterX } from "lucide-react";

export const Route = createFileRoute("/admin/audit")({
  component: AuditLog,
});

type Row = {
  id: string;
  created_at: string;
  actor_email: string | null;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
};

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "role.grant": Shield,
  "role.revoke": ShieldOff,
  "vehicle.create": Car,
  "vehicle.update": Pencil,
  "vehicle.delete": Trash2,
};

const COLORS: Record<string, string> = {
  "role.grant": "text-gold",
  "role.revoke": "text-destructive",
  "vehicle.create": "text-primary",
  "vehicle.update": "text-foreground",
  "vehicle.delete": "text-destructive",
};

const LABELS: Record<string, string> = {
  "role.grant": "Granted admin",
  "role.revoke": "Revoked admin",
  "vehicle.create": "Created vehicle",
  "vehicle.update": "Updated vehicle",
  "vehicle.delete": "Deleted vehicle",
};

const DATE_PRESETS = [
  { value: "all", label: "All time" },
  { value: "1d", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
] as const;

type Preset = (typeof DATE_PRESETS)[number]["value"];

function presetToRange(p: Preset): { from?: string; to?: string } {
  const now = Date.now();
  const days = p === "1d" ? 1 : p === "7d" ? 7 : p === "30d" ? 30 : 0;
  if (!days) return {};
  return { from: new Date(now - days * 86400_000).toISOString() };
}

function AuditLog() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const [preset, setPreset] = useState<Preset>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const dateBounds = useMemo(() => {
    if (preset === "custom") {
      return {
        from: from ? new Date(from).getTime() : undefined,
        to: to ? new Date(to).getTime() + 86400_000 - 1 : undefined,
      };
    }
    const r = presetToRange(preset);
    return { from: r.from ? new Date(r.from).getTime() : undefined, to: undefined as number | undefined };
  }, [preset, from, to]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (action !== "all" && r.action !== action) return false;
    if (entity !== "all" && r.entity_type !== entity) return false;
    const t = new Date(r.created_at).getTime();
    if (dateBounds.from !== undefined && t < dateBounds.from) return false;
    if (dateBounds.to !== undefined && t > dateBounds.to) return false;
    if (q) {
      const hay = `${r.actor_email ?? ""} ${r.entity_id ?? ""} ${JSON.stringify(r.details)}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [rows, action, entity, dateBounds, q]);

  const entityTypes = useMemo(() => {
    const set = new Set(rows.map((r) => r.entity_type));
    return Array.from(set).sort();
  }, [rows]);

  const summarise = (r: Row): string => {
    const d = r.details || {};
    if (r.action.startsWith("role.")) return String(d.target_email || r.entity_id || "");
    if (r.action === "vehicle.create" || r.action === "vehicle.delete")
      return `${d.year ?? ""} ${d.make ?? ""} ${d.model ?? ""}`.trim();
    if (r.action === "vehicle.update") {
      const parts: string[] = [`${d.year ?? ""} ${d.make ?? ""} ${d.model ?? ""}`.trim()];
      if (d.price_changed) parts.push(`price £${d.old_price} → £${d.new_price}`);
      if (d.sold_changed) parts.push("sold status changed");
      return parts.join(" · ");
    }
    return "";
  };

  const reset = () => {
    setAction("all"); setEntity("all"); setPreset("all"); setFrom(""); setTo(""); setQ("");
  };

  const hasFilters = action !== "all" || entity !== "all" || preset !== "all" || q !== "";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Audit log</h1>
          <p className="text-sm text-muted-foreground">Every admin action on roles and vehicles.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
      </div>

      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <Input placeholder="Search email, entity ID, details…" value={q} onChange={(e) => setQ(e.target.value)} className="md:col-span-2" />
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="role.grant">Admin granted</SelectItem>
            <SelectItem value="role.revoke">Admin revoked</SelectItem>
            <SelectItem value="vehicle.create">Vehicle created</SelectItem>
            <SelectItem value="vehicle.update">Vehicle updated</SelectItem>
            <SelectItem value="vehicle.delete">Vehicle deleted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger><SelectValue placeholder="Entity type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entityTypes.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={preset} onValueChange={(v) => setPreset(v as Preset)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {DATE_PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {preset === "custom" && (
          <>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">From</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">To</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{filtered.length} of {rows.length} events</span>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <FilterX className="mr-1.5 h-3.5 w-3.5" /> Clear filters
          </Button>
        )}
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">No matching events.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <ul className="divide-y divide-border">
            {filtered.map((r) => {
              const Icon = ICON[r.action] || Pencil;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(r)}
                    className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-muted/40"
                  >
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted ${COLORS[r.action] || ""}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-medium">{LABELS[r.action] || r.action}</span>
                        <span className="truncate text-sm text-muted-foreground">{summarise(r)}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        by <span className="font-medium text-foreground">{r.actor_email || "system"}</span>
                        {" · "}
                        {new Date(r.created_at).toLocaleString()}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {(() => { const Icon = ICON[selected.action] || Pencil; return <Icon className={`h-5 w-5 ${COLORS[selected.action] || ""}`} />; })()}
                  {LABELS[selected.action] || selected.action}
                </SheetTitle>
                <SheetDescription>
                  {new Date(selected.created_at).toLocaleString()}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <DetailRow label="Actor" value={selected.actor_email || "system"} />
                <DetailRow label="Action" value={<Badge variant="secondary">{selected.action}</Badge>} />
                <DetailRow label="Entity type" value={<Badge variant="outline">{selected.entity_type}</Badge>} />
                {selected.entity_id && <DetailRow label="Entity ID" value={<code className="text-xs">{selected.entity_id}</code>} />}
                {selected.actor_id && <DetailRow label="Actor ID" value={<code className="text-xs">{selected.actor_id}</code>} />}
                <DetailRow label="Summary" value={summarise(selected) || "—"} />
                <div>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raw details</div>
                  <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs">
{JSON.stringify(selected.details, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 break-words text-right text-sm">{value}</span>
    </div>
  );
}
