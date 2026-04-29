import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Trash2, Mail } from "lucide-react";

export const Route = createFileRoute("/admin/newsletter")({
  component: AdminNewsletter,
});

type Sub = { id: string; email: string; source: string | null; created_at: string };

function AdminNewsletter() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setSubs((data as Sub[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const exportCsv = () => {
    const header = "email,source,subscribed_at\n";
    const rows = subs.map((s) => `${s.email},${s.source ?? ""},${s.created_at}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `mlg-subscribers-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this subscriber?")) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed"); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Newsletter</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subs.length} subscriber{subs.length === 1 ? "" : "s"}</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={subs.length === 0}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : subs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
            <Mail className="h-8 w-8" /><div>No subscribers yet.</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3 text-left">Email</th><th className="p-3 text-left">Source</th><th className="p-3 text-left">Joined</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="p-3 font-medium">{s.email}</td>
                  <td className="p-3 text-muted-foreground">{s.source ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right"><Button variant="ghost" size="sm" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
