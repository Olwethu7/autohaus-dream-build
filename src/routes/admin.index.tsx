import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Car, Mail, Calendar, HandCoins } from "lucide-react";
import { AbuseBanner } from "@/components/site/AbuseBanner";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState({ vehicles: 0, enquiries: 0, testDrives: 0, sellReqs: 0 });

  useEffect(() => {
    const load = async () => {
      const [v, e, t, s] = await Promise.all([
        supabase.from("vehicles").select("*", { count: "exact", head: true }),
        supabase.from("enquiries").select("*", { count: "exact", head: true }),
        supabase.from("test_drives").select("*", { count: "exact", head: true }),
        supabase.from("sell_requests").select("*", { count: "exact", head: true }),
      ]);
      setStats({ vehicles: v.count || 0, enquiries: e.count || 0, testDrives: t.count || 0, sellReqs: s.count || 0 });
    };
    load();
  }, []);

  const cards = [
    { label: "Vehicles in stock", value: stats.vehicles, icon: Car },
    { label: "Enquiries", value: stats.enquiries, icon: Mail },
    { label: "Test drive bookings", value: stats.testDrives, icon: Calendar },
    { label: "Sell requests", value: stats.sellReqs, icon: HandCoins },
  ];

  return (
    <div>
      <AbuseBanner />
      <h1 className="font-display text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Overview of your dealership.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
                <div className="mt-2 font-display text-3xl">{c.value}</div>
              </div>
              <c.icon className="h-5 w-5 text-gold" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
