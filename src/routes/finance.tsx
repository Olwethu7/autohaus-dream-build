import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { formatGBP } from "@/lib/format";
import { Calculator } from "lucide-react";

export const Route = createFileRoute("/finance")({
  component: Finance,
  head: () => ({
    meta: [
      { title: "Finance Calculator — MLG Autohaus" },
      { name: "description", content: "Estimate your monthly car finance payments. Quick, transparent, no obligation." },
    ],
  }),
});

function Finance() {
  const [price, setPrice] = useState(20000);
  const [deposit, setDeposit] = useState(2000);
  const [term, setTerm] = useState(48);
  const [apr, setApr] = useState(9.9);

  const { monthly, total, interest } = useMemo(() => {
    const principal = Math.max(0, price - deposit);
    const r = apr / 100 / 12;
    const n = term;
    const m = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
    const tot = m * n + deposit;
    return { monthly: m, total: tot, interest: tot - price };
  }, [price, deposit, term, apr]);

  return (
    <Layout>
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Indicative quote</div>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">Finance calculator</h1>
          <p className="mt-4 text-primary-foreground/75">Estimate your monthly payment in seconds. Final terms subject to credit approval.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
            <Field label="Vehicle price" suffix="£">
              <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} />
              <Slider value={[price]} min={2000} max={80000} step={500} onValueChange={(v) => setPrice(v[0])} className="mt-3" />
            </Field>
            <Field label="Deposit" suffix="£">
              <Input type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value) || 0)} />
              <Slider value={[deposit]} min={0} max={Math.max(1000, price)} step={250} onValueChange={(v) => setDeposit(v[0])} className="mt-3" />
            </Field>
            <Field label={`Term: ${term} months`}>
              <Slider value={[term]} min={12} max={72} step={6} onValueChange={(v) => setTerm(v[0])} />
            </Field>
            <Field label={`APR: ${apr.toFixed(1)}%`}>
              <Slider value={[apr]} min={4} max={19.9} step={0.1} onValueChange={(v) => setApr(v[0])} />
            </Field>
          </div>

          <div className="rounded-xl bg-primary p-6 text-primary-foreground shadow-luxe sm:p-8">
            <div className="flex items-center gap-2 text-gold">
              <Calculator className="h-5 w-5" />
              <span className="text-xs uppercase tracking-wider">Your estimate</span>
            </div>
            <div className="mt-4 text-sm text-primary-foreground/70">Monthly payment</div>
            <div className="mt-1 font-display text-5xl text-gold">{formatGBP(monthly)}</div>
            <div className="mt-1 text-sm text-primary-foreground/60">over {term} months</div>

            <div className="mt-8 space-y-3 border-t border-primary-foreground/10 pt-6 text-sm">
              <Row label="Amount financed" v={formatGBP(price - deposit)} />
              <Row label="Total interest" v={formatGBP(interest)} />
              <Row label="Total payable" v={formatGBP(total)} />
            </div>
            <p className="mt-6 text-xs text-primary-foreground/60">
              For illustrative purposes only. Actual rates depend on credit checks, term, and vehicle. MLG Autohaus is a credit broker, not a lender.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Field({ label, suffix, children }: { label: string; suffix?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
      {children}
    </div>
  );
}

function Row({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-primary-foreground/70">{label}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
