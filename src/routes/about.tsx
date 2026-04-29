import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { Award, Users, MapPin, Heart } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About Us — MLG Autohaus" },
      { name: "description", content: "MLG Autohaus is a trusted South African dealership specialising in premium pre-owned and franchise vehicles, with transparent pricing and exceptional service." },
    ],
  }),
});

function About() {
  return (
    <Layout>
      <section className="bg-primary py-20 text-primary-foreground sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8 animate-fade-in">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Our story</div>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">A trusted name in South African motoring.</h1>
          <p className="mt-6 text-lg text-primary-foreground/75">
            MLG Autohaus is a trusted name in the South African automotive industry — specialising in premium pre-owned vehicles and authorised franchise sales.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none animate-fade-in">
          <p className="text-lg leading-relaxed text-foreground/80">
            MLG Autohaus is a trusted name in the South African automotive industry. We specialise in premium pre-owned vehicles and are an authorised franchise dealer for multiple leading brands.
          </p>
          <p className="mt-6 text-lg leading-relaxed text-foreground/80">
            Our team is committed to providing quality vehicles with transparent pricing and exceptional customer service. Visit our showroom to experience the MLG difference.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Award, k: "Premium", l: "Pre-owned stock" },
            { icon: Users, k: "Trusted", l: "Family team" },
            { icon: Heart, k: "Transparent", l: "Honest pricing" },
            { icon: MapPin, k: "Durban", l: "Visit our showroom" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-border bg-card p-6 text-center shadow-card transition-transform hover:-translate-y-1">
              <s.icon className="mx-auto h-7 w-7 text-gold" />
              <div className="mt-3 font-display text-3xl">{s.k}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
