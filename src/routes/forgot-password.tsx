import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/site/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
  head: () => ({ meta: [{ title: "Reset password — MLG Autohaus" }, { name: "robots", content: "noindex" }] }),
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = z.string().trim().email().safeParse(email);
    if (!p.success) return toast.error("Enter a valid email");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(p.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
  };

  return (
    <Layout>
      <section className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <h1 className="font-display text-2xl">Forgot your password?</h1>
          <p className="mt-1 text-sm text-muted-foreground">We'll email you a link to reset it.</p>
          {sent ? (
            <div className="mt-6 rounded-md bg-muted/40 p-4 text-sm">
              If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your inbox.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-3">
              <Input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button>
            </form>
          )}
          <div className="mt-4 text-center text-sm">
            <Link to="/auth" className="text-muted-foreground hover:text-foreground">Back to sign in</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
