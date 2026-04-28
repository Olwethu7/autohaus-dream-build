import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useCompare } from "@/components/site/CompareContext";
import { formatGBP, formatMiles } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { X, GitCompareArrows } from "lucide-react";

export const Route = createFileRoute("/compare")({
  component: ComparePage,
  head: () => ({
    meta: [
      { title: "Compare Vehicles — MLG Autohaus" },
      { name: "description", content: "Compare key specs of up to 3 vehicles side by side." },
    ],
  }),
});

type V = {
  id: string; make: string; model: string; year: number; price: number;
  mileage: number; fuel_type: string; transmission: string; body_type: string;
  color: string | null; engine_size: string | null; doors: number | null;
  images: string[]; sold: boolean;
};

const placeholder = (id: string) =>
  `https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=70&auto=format&fit=crop&seed=${id}`;

function ComparePage() {
  const { ids, remove, clear } = useCompare();
  const [rows, setRows] = useState<V[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) { setRows([]); setLoading(false); return; }
    setLoading(true);
    supabase.from("vehicles").select("*").in("id", ids).then(({ data }) => {
      // preserve selection order
      const map = new Map((data as V[] || []).map((v) => [v.id, v]));
      setRows(ids.map((id) => map.get(id)).filter(Boolean) as V[]);
      setLoading(false);
    });
  }, [ids]);

  if (ids.length === 0) {
    return (
      <Layout>
        <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <GitCompareArrows className="mx-auto h-12 w-12 text-gold" />
          <h1 className="mt-6 font-display text-3xl">No vehicles selected</h1>
          <p className="mt-3 text-muted-foreground">
            Pick up to 3 vehicles in the catalogue to compare key specs side by side.
          </p>
          <Button asChild className="mt-6">
            <Link to="/catalogue">Browse catalogue</Link>
          </Button>
        </section>
      </Layout>
    );
  }

  const specs: { label: string; get: (v: V) => string }[] = [
    { label: "Price", get: (v) => formatGBP(Number(v.price)) },
    { label: "Year", get: (v) => String(v.year) },
    { label: "Mileage", get: (v) => formatMiles(v.mileage) },
    { label: "Body type", get: (v) => v.body_type },
    { label: "Fuel", get: (v) => v.fuel_type },
    { label: "Transmission", get: (v) => v.transmission },
    { label: "Engine", get: (v) => v.engine_size || "—" },
    { label: "Colour", get: (v) => v.color || "—" },
    { label: "Doors", get: (v) => v.doors ? String(v.doors) : "—" },
    { label: "Status", get: (v) => v.sold ? "Sold" : "Available" },
  ];

  const cols = rows.length;

  return (
    <Layout>
      <section className="border-b border-border bg-muted/30 py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Side-by-side</div>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl">Compare vehicles</h1>
            <p className="mt-1 text-sm text-muted-foreground">{cols} of 3 selected</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/catalogue">Add more</Link></Button>
            <Button variant="ghost" onClick={clear}>Clear all</Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  <th className="w-32 p-3 text-left text-xs uppercase tracking-wider text-muted-foreground" />
                  {rows.map((v) => (
                    <th key={v.id} className="p-3 align-top">
                      <div className="relative overflow-hidden rounded-lg border border-border bg-card">
                        <button
                          type="button"
                          onClick={() => remove(v.id)}
                          className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground hover:bg-destructive hover:text-destructive-foreground"
                          aria-label="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="aspect-[4/3] overflow-hidden bg-muted">
                          <img
                            src={v.images?.[0] || placeholder(v.id)}
                            alt={`${v.year} ${v.make} ${v.model}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="p-3 text-left">
                          <div className="text-[11px] uppercase tracking-wider text-gold">{v.year}</div>
                          <div className="font-display text-base leading-tight">{v.make} {v.model}</div>
                          <Link
                            to="/vehicle/$id"
                            params={{ id: v.id }}
                            className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                          >
                            View details →
                          </Link>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                {specs.map((s, i) => (
                  <tr key={s.label} className={i % 2 === 0 ? "bg-card" : ""}>
                    <td className="border-t border-border p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </td>
                    {rows.map((v) => (
                      <td key={v.id} className="border-t border-border p-3 font-medium">
                        {s.get(v)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="border-t border-border p-3" />
                  {rows.map((v) => (
                    <td key={v.id} className="border-t border-border p-3">
                      <Button asChild size="sm" className="w-full">
                        <Link to="/test-drive" search={{ vehicleId: v.id }}>Book test drive</Link>
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  );
}
