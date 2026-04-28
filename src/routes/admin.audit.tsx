import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ShieldOff, Car, Pencil, Trash2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/audit")({
  component: AuditLog,
});

type Row = {
  id: string;
  created_at: string;
  actor_email: string | null;
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

function AuditLog() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.action !== filter) return false;
    if (q) {
      const hay = `${r.actor_email ?? ""} ${JSON.stringify(r.details)}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Audit log</h1>
          <p className="text-sm text-muted-foreground">Every admin action on roles and vehicles.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <Input placeholder="Search by email or details…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="role.grant">Admin granted</SelectItem>
            <SelectItem value="role.revoke">Admin revoked</SelectItem>
            <SelectItem value="vehicle.create">Vehicle created</SelectItem>
            <SelectItem value="vehicle.update">Vehicle updated</SelectItem>
            <SelectItem value="vehicle.delete">Vehicle deleted</SelectItem>
          </SelectContent>
        </Select>
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
                <li key={r.id} className="flex items-start gap-3 p-4">
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted ${COLORS[r.action] || ""}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-medium">{LABELS[r.action] || r.action}</span>
                      <span className="text-sm text-muted-foreground truncate">{summarise(r)}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      by <span className="font-medium text-foreground">{r.actor_email || "system"}</span>
                      {" · "}
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
