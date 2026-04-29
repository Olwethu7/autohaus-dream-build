import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock } from "lucide-react";
import {
  checkAdminLoginRate,
  recordAdminLoginAttempt,
} from "@/server/admin-auth.functions";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
  head: () => ({
    meta: [
      { title: "Admin sign in" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const credSchema = z.object({
  email: z.string().trim().email("Invalid credentials").max(255),
  password: z.string().min(1, "Invalid credentials").max(72),
});

function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If already a signed-in admin, jump straight to dashboard.
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      if ((roles || []).some((r) => r.role === "admin")) {
        nav({ to: "/admin" });
      }
    })();
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLockedMsg(null);

    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError("Invalid credentials");
      return;
    }

    setBusy(true);

    // 1. Server-side rate-limit check
    const rate = await checkAdminLoginRate();
    if (rate.locked) {
      setBusy(false);
      setLockedMsg(
        `Too many failed attempts. Please try again in ${rate.retryInMinutes} minute${rate.retryInMinutes === 1 ? "" : "s"}.`,
      );
      return;
    }

    // 2. Attempt sign-in
    const { data, error: signInError } = await supabase.auth.signInWithPassword(parsed.data);

    // 3. If sign-in failed -> log failure, show generic error
    if (signInError || !data.session) {
      await recordAdminLoginAttempt({ data: { email: parsed.data.email, success: false } });
      setBusy(false);
      setError("Invalid credentials");
      return;
    }

    // 4. Verify admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.session.user.id);
    const isAdmin = (roles || []).some((r) => r.role === "admin");

    if (!isAdmin) {
      // Not an admin — sign them out, log a failure, and refuse access.
      await recordAdminLoginAttempt({ data: { email: parsed.data.email, success: false } });
      await supabase.auth.signOut();
      setBusy(false);
      setError("Invalid credentials");
      return;
    }

    await recordAdminLoginAttempt({ data: { email: parsed.data.email, success: true } });
    setBusy(false);
    toast.success("Welcome back");
    nav({ to: "/admin" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl">Staff sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Restricted area. Authorised personnel only.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-xl border border-border bg-card p-6 shadow-card"
        >
          {lockedMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{lockedMsg}</span>
            </div>
          )}
          {error && !lockedMsg && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <label className="block text-sm font-medium">Email</label>
          <Input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
          />

          <label className="mt-4 block text-sm font-medium">Password</label>
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1"
          />

          <Button type="submit" className="mt-6 w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
