import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatGBP, formatMiles } from "@/lib/format";

export const Route = createFileRoute("/admin/sell-requests")({
  component: SellRequestsAdmin,
});

type S = { id: string; name: string; email: string; phone: string; make: string; model: string; year: number; mileage: number; condition: string; asking_price: number | null; description: string | null; status: string; created_at: string };

function SellRequestsAdmin() {
  const [items, setItems] = useState<S[]>([]);
  useEffect(() => {
    supabase.from("sell_requests").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as S[]) || []));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl">Sell requests</h1>
      <div className="mt-6 space-y-3">
        {items.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-lg">{s.year} {s.make} {s.model}</div>
                <div className="text-sm text-muted-foreground">{formatMiles(s.mileage)} · {s.condition}{s.asking_price ? ` · asking ${formatGBP(Number(s.asking_price))}` : ""}</div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">{s.name}</span> · <a href={`mailto:${s.email}`} className="hover:text-gold">{s.email}</a> · <a href={`tel:${s.phone}`} className="hover:text-gold">{s.phone}</a>
                </div>
                {s.description && <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>}
              </div>
              <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">No sell requests yet.</div>}
      </div>
    </div>
  );
}
