import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Layout } from "@/components/site/Layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServerFn } from "@tanstack/react-start";
import { submitSellRequest } from "@/server/forms.functions";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/sell")({
  component: Sell,
  head: () => ({
    meta: [
      { title: "Sell Your Car — MLG Autohaus" },
      { name: "description", content: "Get a fair, no-obligation valuation for your car within 24 hours." },
    ],
  }),
});

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  make: z.string().trim().min(1).max(50),
  model: z.string().trim().min(1).max(50),
  year: z.number().int().min(1950).max(new Date().getFullYear() + 1),
  mileage: z.number().int().min(0).max(1000000),
  condition: z.string().min(1),
  asking_price: z.number().min(0).optional(),
  description: z.string().max(2000).optional(),
});

function Sell() {
  const send = useServerFn(submitSellRequest);
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState({
    name: "", email: "", phone: "",
    make: "", model: "", year: "", mileage: "", condition: "",
    asking_price: "", description: "",
  });

  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const submit = async () => {
    const parsed = schema.safeParse({
      ...f,
      year: Number(f.year),
      mileage: Number(f.mileage),
      asking_price: f.asking_price ? Number(f.asking_price) : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const token = await getRecaptchaToken("sell");
      const res = await send({ data: {
        ...parsed.data,
        token,
        asking_price: parsed.data.asking_price ?? null,
        description: parsed.data.description || null,
      }});
      if (!res.ok) {
        if (res.error === "captcha") {
          const { showCaptchaError } = await import("@/lib/captcha-toast");
          showCaptchaError(res.reason, () => submit(e));
        } else {
          toast.error(res.error);
        }
        return;
      }
      setDone(true);
    } catch {
      toast.error("Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Layout>
        <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
          <CheckCircle2 className="mx-auto h-14 w-14 text-gold" />
          <h1 className="mt-6 font-display text-3xl">Thanks! We've got your details.</h1>
          <p className="mt-3 text-muted-foreground">One of our buyers will be in touch within 24 hours with a valuation.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Sell your car</div>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">Get a fair offer in 24 hours</h1>
          <p className="mt-4 text-primary-foreground/75">Tell us about your car. No obligation, no haggling.</p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-1 items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${step >= n ? "bg-gold text-gold-foreground" : "bg-muted text-muted-foreground"}`}>{n}</div>
              {n < 3 && <div className={`mx-2 h-0.5 flex-1 ${step > n ? "bg-gold" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl">Your contact details</h2>
              <Input placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={80} />
              <Input type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} maxLength={255} />
              <Input type="tel" placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} maxLength={30} />
              <div className="flex justify-end">
                <Button onClick={next}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl">Your car</h2>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Make (e.g. BMW)" value={f.make} onChange={(e) => setF({ ...f, make: e.target.value })} />
                <Input placeholder="Model" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} />
                <Input type="number" placeholder="Year" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} />
                <Input type="number" placeholder="Mileage" value={f.mileage} onChange={(e) => setF({ ...f, mileage: e.target.value })} />
              </div>
              <Select value={f.condition} onValueChange={(v) => setF({ ...f, condition: v })}>
                <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Needs work">Needs work</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex justify-between">
                <Button variant="outline" onClick={prev}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={next}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl">Anything else?</h2>
              <Input type="number" placeholder="Asking price (optional, £)" value={f.asking_price} onChange={(e) => setF({ ...f, asking_price: e.target.value })} />
              <Textarea rows={5} placeholder="Service history, mods, condition notes…" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={2000} />
              <div className="flex justify-between">
                <Button variant="outline" onClick={prev}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={submit} disabled={submitting}>{submitting ? "Sending…" : "Submit for valuation"}</Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
