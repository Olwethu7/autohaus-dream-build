import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Layout } from "@/components/site/Layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { submitTestDrive } from "@/server/forms.functions";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/test-drive")({
  component: TestDrive,
  validateSearch: (s: Record<string, unknown>) => ({ vehicleId: (s.vehicleId as string) || "" }),
  head: () => ({
    meta: [
      { title: "Book a Test Drive — MLG Autohaus" },
      { name: "description", content: "Book a no-obligation test drive at our Manchester showroom." },
    ],
  }),
});

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  vehicle_id: z.string().min(1, "Please choose a vehicle"),
  preferred_date: z.string().min(1, "Please choose a date"),
  notes: z.string().max(1000).optional(),
});

type V = { id: string; make: string; model: string; year: number };

function TestDrive() {
  const { vehicleId } = Route.useSearch();
  const send = useServerFn(submitTestDrive);
  const [vehicles, setVehicles] = useState<V[]>([]);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", vehicle_id: vehicleId, preferred_date: "", notes: "" });

  useEffect(() => {
    supabase.from("vehicles").select("id,make,model,year").eq("sold", false).order("created_at", { ascending: false })
      .then(({ data }) => setVehicles((data as V[]) || []));
  }, []);

  useEffect(() => { if (vehicleId) setF((s) => ({ ...s, vehicle_id: vehicleId })); }, [vehicleId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(f);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    try {
      const token = await getRecaptchaToken("test_drive");
      const res = await send({ data: { ...parsed.data, token, notes: parsed.data.notes || null } });
      if (!res.ok) { toast.error(res.error || "Could not book."); return; }
      setDone(true);
    } catch {
      toast.error("Could not book. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Layout>
        <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
          <CheckCircle2 className="mx-auto h-14 w-14 text-gold" />
          <h1 className="mt-6 font-display text-3xl">Test drive requested!</h1>
          <p className="mt-3 text-muted-foreground">We'll confirm your slot by email shortly.</p>
        </div>
      </Layout>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <Layout>
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">No obligation</div>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">Book a test drive</h1>
        </div>
      </section>
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
          <Input placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={80} required />
          <Input type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} maxLength={255} required />
          <Input type="tel" placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} maxLength={30} required />
          <Select value={f.vehicle_id} onValueChange={(v) => setF({ ...f, vehicle_id: v })}>
            <SelectTrigger><SelectValue placeholder="Choose a vehicle" /></SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.year} {v.make} {v.model}</SelectItem>)}
            </SelectContent>
          </Select>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Preferred date</label>
            <Input type="date" min={today} value={f.preferred_date} onChange={(e) => setF({ ...f, preferred_date: e.target.value })} required />
          </div>
          <Textarea placeholder="Anything we should know? (optional)" rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} maxLength={1000} />
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Booking…" : "Request test drive"}</Button>
        </form>
      </section>
    </Layout>
  );
}
