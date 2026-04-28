import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, ShieldOff, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

type Row = { id: string; email: string; created_at: string; is_admin: boolean };

function AdminUsers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) toast.error(error.message);
    else setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (r: Row) => {
    setBusy(r.id);
    const { error } = await supabase.rpc("admin_set_admin", { _user_id: r.id, _make_admin: !r.is_admin });
    if (error) toast.error(error.message);
    else { toast.success(r.is_admin ? "Admin revoked" : "Admin granted"); await load(); }
    setBusy(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Users</h1>
          <p className="text-sm text-muted-foreground">Grant or revoke admin access.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Joined {new Date(r.created_at).toLocaleDateString()} · {r.is_admin ? "Admin" : "User"}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={r.is_admin ? "outline" : "default"}
                  disabled={busy === r.id}
                  onClick={() => toggle(r)}
                >
                  {r.is_admin
                    ? <><ShieldOff className="mr-1.5 h-4 w-4" /> Revoke admin</>
                    : <><Shield className="mr-1.5 h-4 w-4" /> Make admin</>}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
