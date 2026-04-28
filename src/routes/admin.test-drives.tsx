import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/test-drives")({
  component: TestDrivesAdmin,
});

type T = { id: string; name: string; email: string; phone: string; preferred_date: string; notes: string | null; status: string; vehicle_id: string | null; created_at: string };

function TestDrivesAdmin() {
  const [items, setItems] = useState<T[]>([]);
  const load = () => supabase.from("test_drives").select("*").order("created_at", { ascending: false }).then(({ data }) => setItems((data as T[]) || []));
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    await supabase.from("test_drives").update({ status }).eq("id", id);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-3xl">Test drives</h1>
      <div className="mt-6 space-y-3">
        {items.map((t) => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-lg">{t.name} <span className="text-sm text-muted-foreground">· {new Date(t.preferred_date).toLocaleDateString()}</span></div>
                <div className="text-sm text-muted-foreground">
                  <a href={`mailto:${t.email}`} className="hover:text-gold">{t.email}</a> · <a href={`tel:${t.phone}`} className="hover:text-gold">{t.phone}</a>
                </div>
                {t.notes && <p className="mt-2 text-sm">{t.notes}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`rounded px-2 py-0.5 text-xs ${t.status === "confirmed" ? "bg-gold/10 text-gold" : t.status === "completed" ? "bg-muted" : "bg-accent"}`}>{t.status}</span>
                <select value={t.status} onChange={(e) => setStatus(t.id, e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-xs">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">No test drive bookings yet.</div>}
      </div>
    </div>
  );
}
