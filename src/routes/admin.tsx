import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/site/Layout";
import {
  LayoutDashboard, Car, Mail, Calendar, HandCoins, FileText,
  LogOut, Users, Quote, Inbox, UserCircle, Menu, X, Search, Bell, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminShell,
});

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/vehicles", label: "Vehicles", icon: Car },
  { to: "/admin/enquiries", label: "Enquiries", icon: Mail },
  { to: "/admin/test-drives", label: "Test Drives", icon: Calendar },
  { to: "/admin/sell-requests", label: "Sell Requests", icon: HandCoins },
  { to: "/admin/testimonials", label: "Testimonials", icon: Quote },
  { to: "/admin/newsletter", label: "Newsletter", icon: Inbox },
  { to: "/admin/content", label: "Site Content", icon: FileText },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/profile", label: "My Profile", icon: UserCircle },
] as const;

const titleMap: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/vehicles": "Vehicles",
  "/admin/enquiries": "Enquiries",
  "/admin/test-drives": "Test Drives",
  "/admin/sell-requests": "Sell Requests",
  "/admin/testimonials": "Testimonials",
  "/admin/newsletter": "Newsletter",
  "/admin/content": "Site Content",
  "/admin/users": "Users",
  "/admin/profile": "My Profile",
};

function AdminShell() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [email, setEmail] = useState<string>("");

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pageTitle = titleMap[pathname] ?? "Admin";

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/admin/login") {
      setReady(true);
      setIsAdmin(true);
      return;
    }
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { nav({ to: "/admin/login" }); return; }
      setEmail(session.user.email ?? "");
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      const admin = (roles || []).some((r) => r.role === "admin");
      if (!admin) {
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

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    nav({ to: "/" });
  };

  if (typeof window !== "undefined" && window.location.pathname === "/admin/login") {
    return <Outlet />;
  }
  if (!ready) return <Layout><div className="mx-auto max-w-7xl px-4 py-20">Loading…</div></Layout>;
  if (!isAdmin) return null;

  const sidebarWidth = collapsed ? "lg:w-20" : "lg:w-64";
  const initials = email ? email.slice(0, 2).toUpperCase() : "AD";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-100 transition-all duration-300",
          "w-64 -translate-x-full lg:translate-x-0",
          mobileOpen && "translate-x-0",
          sidebarWidth,
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <Link to="/" className={cn("flex items-center gap-2 overflow-hidden", collapsed && "lg:justify-center")}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 font-display text-sm font-bold text-slate-900">
              ML
            </div>
            <div className={cn("flex flex-col leading-tight transition-opacity", collapsed && "lg:hidden")}>
              <span className="font-display text-sm font-bold tracking-wide">MLG Autohaus</span>
              <span className="text-[10px] uppercase tracking-widest text-amber-400/80">Admin Panel</span>
            </div>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="rounded p-1 text-slate-400 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={{ exact: it.end }}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-all duration-200",
                "hover:bg-slate-800 hover:text-white",
                collapsed && "lg:justify-center lg:px-2",
              )}
              activeProps={{
                className: "bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 shadow-[inset_3px_0_0_0] shadow-amber-400",
              }}
              title={collapsed ? it.label : undefined}
            >
              <it.icon className="h-5 w-5 shrink-0" />
              <span className={cn("truncate", collapsed && "lg:hidden")}>{it.label}</span>
            </Link>
          ))}
        </nav>

        {/* Sign out */}
        <div className="border-t border-slate-800 p-3">
          <button
            onClick={signOut}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-400",
              collapsed && "lg:justify-center lg:px-2",
            )}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={cn(collapsed && "lg:hidden")}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={cn("flex min-h-screen flex-col transition-all duration-300", collapsed ? "lg:pl-20" : "lg:pl-64")}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => { if (window.innerWidth >= 1024) setCollapsed((c) => !c); else setMobileOpen(true); }}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-semibold text-slate-900 sm:text-xl">{pageTitle}</h1>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 md:flex md:w-72">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              placeholder="Search…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <button className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500" />
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-slate-900">
                {initials}
              </div>
              <span className="hidden max-w-[160px] truncate text-sm font-medium text-slate-700 sm:block">{email || "Admin"}</span>
              <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">Signed in as<br /><span className="font-medium text-slate-700">{email}</span></div>
                  <Link to="/admin/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <UserCircle className="h-4 w-4" /> My Profile
                  </Link>
                  <Link to="/" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <Car className="h-4 w-4" /> View Site
                  </Link>
                  <button onClick={signOut} className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
