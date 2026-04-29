import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/site/Layout";
import { LayoutDashboard, Car, Mail, Calendar, HandCoins, FileText, LogOut, Users, Quote, Inbox, UserCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminShell,
});

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/vehicles", label: "Vehicles", icon: Car },
  { to: "/admin/enquiries", label: "Enquiries", icon: Mail },
  { to: "/admin/test-drives", label: "Test drives", icon: Calendar },
  { to: "/admin/sell-requests", label: "Sell requests", icon: HandCoins },
  { to: "/admin/testimonials", label: "Testimonials", icon: Quote },
  { to: "/admin/newsletter", label: "Newsletter", icon: Inbox },
  { to: "/admin/content", label: "Site content", icon: FileText },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/profile", label: "My profile", icon: UserCircle },
];

function AdminShell() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // The /admin/login page is itself under the /admin path tree.
    // Don't gate it — let the login page render.
    if (typeof window !== "undefined" && window.location.pathname === "/admin/login") {
      setReady(true);
      setIsAdmin(true); // bypass shell gating; login page renders its own UI via Outlet
      return;
    }

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        nav({ to: "/admin/login" });
        return;
      }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      const admin = (roles || []).some((r) => r.role === "admin");
      if (!admin) {
        // Customer account trying to reach admin area — sign them out of the admin context
        // and bounce to the customer auth page with a clear message.
        await supabase.auth.signOut();
        toast.error("That account doesn't have admin access.");
        nav({ to: "/auth" });
        return;
      }
      setIsAdmin(true);
      setReady(true);
    };
    check();
  }, [nav]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    nav({ to: "/" });
  };

  // Login page renders standalone, without the admin shell chrome.
  if (typeof window !== "undefined" && window.location.pathname === "/admin/login") {
    return <Outlet />;
  }

  if (!ready) return <Layout><div className="mx-auto max-w-7xl px-4 py-20">Loading…</div></Layout>;

  if (!isAdmin) {
    // Should never render — effect redirects — but keep a safe fallback.
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="font-display text-lg font-bold">MLG <span className="text-gold">Admin</span></Link>
          <button onClick={signOut} className="inline-flex items-center gap-2 text-sm hover:text-gold">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="space-y-1">
            {items.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                activeOptions={{ exact: it.end }}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" }}
              >
                <it.icon className="h-4 w-4" /> {it.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
      <div className="border-t border-border bg-card px-4 py-3 lg:hidden">
        <nav className="flex gap-2 overflow-x-auto">
          {items.map((it) => (
            <Link key={it.to} to={it.to} activeOptions={{ exact: it.end }} className="whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium text-muted-foreground"
              activeProps={{ className: "bg-primary text-primary-foreground" }}>
              {it.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
