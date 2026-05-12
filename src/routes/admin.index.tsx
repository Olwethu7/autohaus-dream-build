import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Car, Mail, Calendar, HandCoins, TrendingUp, Plus, Download, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

type Activity = {
  id: string;
  customer: string;
  type: "Enquiry" | "Test Drive" | "Sell Request";
  vehicle: string;
  date: string;
  status: string;
};

function Dashboard() {
  const [stats, setStats] = useState({ vehicles: 0, enquiries: 0, testDrives: 0, sellReqs: 0 });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [v, e, t, s, recentE, recentT] = await Promise.all([
        supabase.from("vehicles").select("*", { count: "exact", head: true }),
        supabase.from("enquiries").select("*", { count: "exact", head: true }),
        supabase.from("test_drives").select("*", { count: "exact", head: true }),
        supabase.from("sell_requests").select("*", { count: "exact", head: true }),
        supabase.from("enquiries").select("id,name,vehicle_id,created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("test_drives").select("id,name,vehicle_id,preferred_date,status,created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        vehicles: v.count || 0,
        enquiries: e.count || 0,
        testDrives: t.count || 0,
        sellReqs: s.count || 0,
      });

      // collect vehicle titles
      const vIds = Array.from(new Set([
        ...(recentE.data || []).map((r: any) => r.vehicle_id).filter(Boolean),
        ...(recentT.data || []).map((r: any) => r.vehicle_id).filter(Boolean),
      ]));
      let titleMap: Record<string, string> = {};
      if (vIds.length) {
        const { data: vs } = await supabase.from("vehicles").select("id,year,make,model").in("id", vIds);
        titleMap = Object.fromEntries((vs || []).map((x: any) => [x.id, `${x.year} ${x.make} ${x.model}`]));
      }

      const merged: Activity[] = [
        ...((recentE.data || []) as any[]).map((r) => ({
          id: `e-${r.id}`,
          customer: r.name,
          type: "Enquiry" as const,
          vehicle: r.vehicle_id ? (titleMap[r.vehicle_id] || "—") : "General",
          date: r.created_at,
          status: "New",
        })),
        ...((recentT.data || []) as any[]).map((r) => ({
          id: `t-${r.id}`,
          customer: r.name,
          type: "Test Drive" as const,
          vehicle: r.vehicle_id ? (titleMap[r.vehicle_id] || "—") : "—",
          date: r.created_at,
          status: r.status || "pending",
        })),
      ].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 8);

      setActivity(merged);
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    {
      label: "Vehicles in Stock", value: stats.vehicles, icon: Car, to: "/admin/vehicles" as const,
      gradient: "from-amber-500 to-orange-600", trend: "+2 this month",
    },
    {
      label: "Enquiries", value: stats.enquiries, icon: Mail, to: "/admin/enquiries" as const,
      gradient: "from-blue-500 to-indigo-600", trend: "Last 30 days",
    },
    {
      label: "Test Drive Bookings", value: stats.testDrives, icon: Calendar, to: "/admin/test-drives" as const,
      gradient: "from-emerald-500 to-teal-600", trend: "Pending review",
    },
    {
      label: "Sell Requests", value: stats.sellReqs, icon: HandCoins, to: "/admin/sell-requests" as const,
      gradient: "from-violet-500 to-purple-600", trend: "Awaiting valuation",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-amber-400">Welcome back</p>
            <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Here's what's happening today</h2>
            <p className="mt-1 text-sm text-slate-300">Manage inventory, customer requests, and site content from one place.</p>
          </div>
          <Link
            to="/admin/vehicles"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 hover:shadow-amber-500/40"
          >
            <Plus className="h-4 w-4" /> Add Vehicle
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{c.label}</div>
                <div className="mt-2 font-display text-3xl font-bold text-slate-900">
                  {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-200" /> : c.value}
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                  <TrendingUp className="h-3 w-3" /> {c.trend}
                </div>
              </div>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md", c.gradient)}>
                <c.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium text-slate-500 group-hover:text-amber-600">
              View details <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900">Recent Activity</h3>
            <p className="text-xs text-slate-500">Latest enquiries and test drive bookings</p>
          </div>
          <Link to="/admin/enquiries" className="text-xs font-semibold text-amber-600 hover:text-amber-700">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Customer</th>
                <th className="px-6 py-3 text-left font-medium">Type</th>
                <th className="px-6 py-3 text-left font-medium">Vehicle</th>
                <th className="px-6 py-3 text-left font-medium">Date</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading…</td></tr>
              )}
              {!loading && activity.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No recent activity yet.</td></tr>
              )}
              {activity.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-900">{a.customer}</td>
                  <td className="px-6 py-3">
                    <span className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      a.type === "Enquiry" && "bg-blue-50 text-blue-700",
                      a.type === "Test Drive" && "bg-emerald-50 text-emerald-700",
                      a.type === "Sell Request" && "bg-violet-50 text-violet-700",
                    )}>{a.type}</span>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{a.vehicle}</td>
                  <td className="px-6 py-3 text-slate-600">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-semibold text-slate-900">Quick Actions</h3>
        <p className="text-xs text-slate-500">Jump to common tasks</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/admin/vehicles" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800">
            <Plus className="h-4 w-4" /> Add Vehicle
          </Link>
          <Link to="/admin/enquiries" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-amber-400 hover:text-amber-600">
            <Mail className="h-4 w-4" /> View All Enquiries
          </Link>
          <Link to="/admin/newsletter" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-amber-400 hover:text-amber-600">
            <Download className="h-4 w-4" /> Export Subscribers
          </Link>
        </div>
      </div>
    </div>
  );
}
