import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Layout } from "@/components/site/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: Auth,
  head: () => ({ meta: [{ title: "Sign in — MLG Autohaus" }, { name: "robots", content: "noindex" }] }),
});

const credSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

function Auth() {
  const nav = useNavigate();
  const [tab, setTab] = useState("signin");
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: "/admin" }); });
  }, [nav]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = credSchema.safeParse(form);
    if (!p.success) { toast.error(p.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(p.data);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back");
    nav({ to: "/admin" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = credSchema.safeParse(form);
    if (!p.success) { toast.error(p.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      ...p.data,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created. You can sign in now.");
    setTab("signin");
  };

  return (
    <Layout>
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <h1 className="font-display text-2xl">Admin access</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to manage stock and customer requests.</p>
          <Tabs value={tab} onValueChange={setTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="mt-4 space-y-3">
                <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                <Input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
                <div className="text-center text-xs">
                  <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground">Forgot your password?</Link>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="mt-4 space-y-3">
                <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                <Input type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
                <p className="text-xs text-muted-foreground">An admin must grant you the admin role before you can manage content.</p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
}
