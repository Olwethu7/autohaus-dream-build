import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, ShieldOff, UserPlus } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

type Row = { id: string; email: string; created_at: string; is_admin: boolean };

function AdminUsers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    setMeId(session?.user.id ?? null);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) toast.error(error.message);
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (r: Row) => {
    const make = !r.is_admin;
    if (!make && !confirm(`Revoke admin access from ${r.email}?`)) return;
    const { error } = await supabase.rpc("admin_set_admin", { _user_id: r.id, _make_admin: make });
    if (error) { toast.error(error.message); return; }
    toast.success(make ? `${r.email} is now an admin` : `Admin revoked for ${r.email}`);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl">Users & admins</h1>
          <p className="text-sm text-muted-foreground">Promote signed-up users to admin or revoke access.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><UserPlus className="mr-2 h-4 w-4" /> Refresh</Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">No users yet.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Role</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-medium">
                    {r.email}{r.id === meId && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </td>
                  <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    {r.is_admin ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold">
                        <Shield className="h-3 w-3" /> Admin
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">User</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {r.id === meId ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : r.is_admin ? (
                      <Button size="sm" variant="outline" onClick={() => toggle(r)}>
                        <ShieldOff className="mr-2 h-4 w-4" /> Revoke
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => toggle(r)}>
                        <Shield className="mr-2 h-4 w-4" /> Make admin
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
