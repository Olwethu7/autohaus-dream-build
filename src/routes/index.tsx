import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Wrench, Award, Search } from "lucide-react";
import { Layout } from "@/components/site/Layout";
import { VehicleCard, type Vehicle } from "@/components/site/VehicleCard";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-showroom.jpg";
import { Testimonials } from "@/components/site/Testimonials";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "MLG Autohaus — Premium Pre-Owned & Franchise Vehicles" },
      { name: "description", content: "Trusted South African dealership. Quality pre-owned and franchise vehicles, transparent pricing, and exceptional customer service." },
    ],
  }),
});

const FRANCHISES = ["BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Toyota"];


function Home() {
  const [featured, setFeatured] = useState<Vehicle[]>([]);

  useEffect(() => {
    supabase.from("vehicles").select("*").eq("featured", true).eq("sold", false).limit(6)
      .then(({ data }) => setFeatured((data as Vehicle[]) || []));
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img src={heroImg} alt="MLG Autohaus showroom" className="absolute inset-0 h-full w-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8 lg:py-44">
          <div className="max-w-2xl text-primary-foreground">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Family-run since 2008
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Premium used cars,<br /><span className="text-gold">honestly priced.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/80">
              Hand-picked stock, fully inspected, ready to drive away. Browse our catalogue or book a no-obligation test drive today.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/catalogue" className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground transition-transform hover:scale-105">
                Browse catalogue <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/finance" className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/30 bg-background/10 px-6 py-3 text-sm font-semibold backdrop-blur transition-colors hover:bg-background/20">
                Calculate finance
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick search bar */}
      <section className="relative -mt-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-2xl bg-card p-6 shadow-luxe">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-gold" />
            <h3 className="font-display text-lg">Find your next car</h3>
          </div>
          <Link to="/catalogue" className="mt-4 flex items-center justify-between rounded-md border border-border bg-muted/40 px-4 py-3 text-sm transition-colors hover:bg-muted">
            <span className="text-muted-foreground">Search by make, model, body type or price…</span>
            <span className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Search</span>
          </Link>
        </div>
      </section>

      {/* Featured vehicles */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Hand-picked</div>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">Featured vehicles</h2>
          </div>
          <Link to="/catalogue" className="hidden items-center gap-2 text-sm font-medium hover:text-gold sm:inline-flex">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((v) => <VehicleCard key={v.id} v={v} />)}
        </div>
      </section>

      {/* Trust */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            { icon: ShieldCheck, title: "HPI Checked", body: "Every vehicle comes with a full history check and clear title guarantee." },
            { icon: Wrench, title: "Fully Inspected", body: "Multi-point mechanical and cosmetic inspection before every sale." },
            { icon: Award, title: "Aftercare", body: "Comprehensive warranty options and a service plan tailored to you." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl bg-card p-8 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-xl">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Testimonials />

      {/* Sell CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-primary p-10 text-primary-foreground sm:p-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-gold">Selling your car?</div>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl">Get a fair offer in 24 hours.</h2>
              <p className="mt-4 max-w-md text-primary-foreground/70">
                Skip the hassle of private sales. Tell us about your car and we'll come back with a no-obligation valuation.
              </p>
            </div>
            <div className="lg:text-right">
              <Link to="/sell" className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground transition-transform hover:scale-105">
                Get my valuation <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
