import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";

const schema = z.string().trim().email().max(255);

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(email);
    if (!parsed.success) { toast.error("Please enter a valid email"); return; }
    setBusy(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: parsed.data, source: "footer" });
    setBusy(false);
    if (error) {
      if (error.code === "23505") { toast.success("You're already subscribed!"); setEmail(""); return; }
      toast.error(error.message); return;
    }
    toast.success("Subscribed — thanks!");
    setEmail("");
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="text-sm font-semibold uppercase tracking-wider text-gold">Newsletter</label>
      <p className="text-xs text-primary-foreground/70">New stock and offers, monthly. No spam.</p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-foreground/50" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-md border border-primary-foreground/20 bg-primary-foreground/10 py-2 pl-8 pr-3 text-sm placeholder:text-primary-foreground/50 focus:border-gold focus:outline-none"
          />
        </div>
        <button type="submit" disabled={busy} className="rounded-md bg-gold px-3 py-2 text-xs font-semibold text-gold-foreground hover:opacity-90 disabled:opacity-60">
          {busy ? "…" : "Join"}
        </button>
      </div>
    </form>
  );
}
