import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Wrench, Award, Search } from "lucide-react";
import { Layout } from "@/components/site/Layout";
import { VehicleCard, type Vehicle } from "@/components/site/VehicleCard";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-showroom.jpg";
import { Testimonials } from "@/components/site/Testimonials";
import { Reveal, CountUp } from "@/components/site/Reveal";

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
    const load = () => supabase.from("vehicles").select("*").eq("featured", true).eq("sold", false).limit(6)
      .then(({ data }) => setFeatured((data as Vehicle[]) || []));
    load();
    const channel = supabase
      .channel("vehicles-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={heroImg}
          preload="metadata"
          className="absolute inset-0 hidden h-full w-full object-cover animate-fade-in sm:block"
        >
          <source src="https://cdn.coverr.co/videos/coverr-driving-on-a-highway-158992/720.mp4" type="video/mp4" />
        </video>
        <img
          src={heroImg}
          alt="MLG Autohaus showroom"
          className="absolute inset-0 h-full w-full object-cover sm:hidden"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8 lg:py-44">
          <div className="max-w-2xl text-primary-foreground animate-fade-in" style={{ animationDelay: "0.6s", animationFillMode: "both" }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Trusted South African dealership
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Premium Pre-Owned &<br /><span className="text-gold">Franchise Vehicles.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/85">
              Trusted dealership serving South Africa. Quality vehicles, transparent prices.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/catalogue" className="inline-flex items-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground transition-all hover:scale-[1.03] hover:shadow-luxe">
                Browse catalogue <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/finance" className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-all hover:scale-[1.03] hover:bg-white/20">
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

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-8 sm:grid-cols-4">
            {[
              { label: "Vehicles in stock", to: featured.length || 12, suffix: "+" },
              { label: "Years of trust", to: 15, suffix: "+" },
              { label: "Happy customers", to: 1200, suffix: "+" },
              { label: "Franchise brands", to: 5, suffix: "" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl text-gold sm:text-4xl">
                  <CountUp to={s.to} suffix={s.suffix} />
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Featured vehicles */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-gold">Hand-picked</div>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl">Latest Arrivals</h2>
            </div>
            <Link to="/catalogue" className="hidden items-center gap-2 text-sm font-medium hover:text-gold sm:inline-flex">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((v, i) => (
            <Reveal key={v.id} delay={i * 100}>
              <VehicleCard v={v} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Franchise Partners */}
      <section className="border-y border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-gold">Authorised dealer</div>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl">Our Franchise Partners</h2>
              <p className="mt-3 text-sm text-muted-foreground">Proud to represent leading automotive brands in South Africa.</p>
            </div>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {FRANCHISES.map((b, i) => (
              <Reveal key={b} delay={i * 80}>
                <div className="flex h-24 items-center justify-center rounded-xl border border-border bg-card font-display text-lg shadow-card transition-all hover:-translate-y-1 hover:scale-[1.04] hover:shadow-luxe hover:animate-pulse">
                  {b}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            { icon: ShieldCheck, title: "HPI Checked", body: "Every vehicle comes with a full history check and clear title guarantee." },
            { icon: Wrench, title: "Fully Inspected", body: "Multi-point mechanical and cosmetic inspection before every sale." },
            { icon: Award, title: "Aftercare", body: "Comprehensive warranty options and a service plan tailored to you." },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <div className="rounded-xl bg-card p-8 shadow-card transition-all hover:-translate-y-1 hover:shadow-luxe">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <Testimonials />
      </Reveal>

      {/* Sell CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
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
                  Get a Free Valuation <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </Layout>
  );
}
