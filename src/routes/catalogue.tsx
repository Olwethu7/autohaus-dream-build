import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { VehicleCard, type Vehicle } from "@/components/site/VehicleCard";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/catalogue")({
  component: Catalogue,
  head: () => ({
    meta: [
      { title: "Vehicle Catalogue — MLG Autohaus" },
      { name: "description", content: "Browse our full stock of premium used cars. Filter by make, body type, fuel and price." },
    ],
  }),
});

function Catalogue() {
  const [all, setAll] = useState<Vehicle[]>([]);
  const [q, setQ] = useState("");
  const [body, setBody] = useState("all");
  const [fuel, setFuel] = useState("all");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    supabase.from("vehicles").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setAll((data as Vehicle[]) || []));
  }, []);

  const filtered = useMemo(() => {
    let r = all.filter((v) => {
      const text = `${v.make} ${v.model} ${v.year}`.toLowerCase();
      if (q && !text.includes(q.toLowerCase())) return false;
      if (body !== "all" && v.body_type !== body) return false;
      if (fuel !== "all" && v.fuel_type !== fuel) return false;
      return true;
    });
    if (sort === "price-asc") r = [...r].sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-desc") r = [...r].sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "miles-asc") r = [...r].sort((a, b) => a.mileage - b.mileage);
    return r;
  }, [all, q, body, fuel, sort]);

  const bodies = Array.from(new Set(all.map((v) => v.body_type)));
  const fuels = Array.from(new Set(all.map((v) => v.fuel_type)));

  return (
    <Layout>
      <section className="border-b border-border bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Stock</div>
          <h1 className="mt-2 font-display text-4xl">Vehicle catalogue</h1>
          <p className="mt-2 text-muted-foreground">{all.length} vehicles available</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input placeholder="Search make or model…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={body} onValueChange={setBody}>
            <SelectTrigger><SelectValue placeholder="Body type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All body types</SelectItem>
              {bodies.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fuel} onValueChange={setFuel}>
            <SelectTrigger><SelectValue placeholder="Fuel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All fuels</SelectItem>
              {fuels.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="price-asc">Price: low to high</SelectItem>
              <SelectItem value="price-desc">Price: high to low</SelectItem>
              <SelectItem value="miles-asc">Lowest mileage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-16 text-center text-muted-foreground">No vehicles match your filters.</div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v) => <VehicleCard key={v.id} v={v} />)}
          </div>
        )}
      </section>
    </Layout>
  );
}
