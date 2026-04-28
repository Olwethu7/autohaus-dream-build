import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { Award, Users, MapPin, Heart } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About Us — MLG Autohaus" },
      { name: "description", content: "Family-run independent dealership specialising in premium used cars. Transparent pricing, full inspections, aftercare you can rely on." },
    ],
  }),
});

function About() {
  return (
    <Layout>
      <section className="bg-primary py-20 text-primary-foreground sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Our story</div>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">A different kind of car dealership.</h1>
          <p className="mt-6 text-lg text-primary-foreground/75">
            MLG Autohaus is a family-run independent dealership in Manchester. Since 2008 we've been pairing customers with carefully selected premium and everyday vehicles — without the high-pressure sales tactics.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          <p className="text-lg leading-relaxed text-foreground/80">
            Every car in our showroom is HPI-checked, mechanically inspected, and prepared to the highest standard before sale. We pride ourselves on transparent pricing, no-pressure consultations, and an aftercare programme that actually means something.
          </p>
          <p className="mt-6 text-lg leading-relaxed text-foreground/80">
            Whether you're buying your first car, upgrading the family motor, or hunting for a weekend toy — we'll help you find the right one. And if it's not on our forecourt today, we'll source it for you.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Award, k: "16+", l: "Years trading" },
            { icon: Users, k: "4,200+", l: "Happy customers" },
            { icon: Heart, k: "98%", l: "Would recommend" },
            { icon: MapPin, k: "Manchester", l: "Family showroom" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-border bg-card p-6 text-center shadow-card">
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
