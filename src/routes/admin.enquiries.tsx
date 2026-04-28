import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/enquiries")({
  component: EnquiriesAdmin,
});

type E = { id: string; name: string; email: string; phone: string | null; message: string; vehicle_id: string | null; created_at: string };

function EnquiriesAdmin() {
  const [items, setItems] = useState<E[]>([]);
  useEffect(() => {
    supabase.from("enquiries").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as E[]) || []));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl">Enquiries</h1>
      <p className="mt-1 text-sm text-muted-foreground">{items.length} total</p>
      <div className="mt-6 space-y-3">
        {items.map((e) => (
          <div key={e.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-lg">{e.name}</div>
                <div className="text-sm text-muted-foreground">
                  <a href={`mailto:${e.email}`} className="hover:text-gold">{e.email}</a>
                  {e.phone && <> · <a href={`tel:${e.phone}`} className="hover:text-gold">{e.phone}</a></>}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm">{e.message}</p>
          </div>
        ))}
        {items.length === 0 && <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">No enquiries yet.</div>}
      </div>
    </div>
  );
}
