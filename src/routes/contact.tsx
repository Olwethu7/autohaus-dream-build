import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({
    meta: [
      { title: "Contact — MLG Autohaus" },
      { name: "description", content: "Get in touch with MLG Autohaus. Call us, email us, or visit our Manchester showroom." },
    ],
  }),
});

function Contact() {
  const [mapEmbed, setMapEmbed] = useState<string | null>(null);
  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "google_map_embed").maybeSingle()
      .then(({ data }) => setMapEmbed(data?.value ?? null));
  }, []);

  return (
    <Layout>
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="font-display text-4xl sm:text-5xl">Get in touch</h1>
          <p className="mt-4 text-primary-foreground/75">We're here to help. Drop us a message or pop into the showroom.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <Item icon={MapPin} title="Showroom" lines={["14 Showroom Lane", "Manchester M1 1AB"]} />
            <Item icon={Phone} title="Phone" lines={["0161 555 0199"]} />
            <Item icon={Mail} title="Email" lines={["sales@mlgautohaus.co.uk"]} />
            <Item icon={Clock} title="Opening hours" lines={["Mon–Fri 9:00 – 18:00", "Saturday 9:00 – 17:00", "Sunday by appointment"]} />
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
            <h2 className="font-display text-2xl">Send us a message</h2>
            <div className="mt-4">
              <EnquiryForm />
            </div>
          </div>
        </div>
      </section>

      {mapEmbed && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="overflow-hidden rounded-xl border border-border shadow-card">
            <iframe
              src={mapEmbed}
              title="MLG Autohaus location"
              width="100%"
              height="420"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>
      )}
    </Layout>
  );
}

function Item({ icon: Icon, title, lines }: { icon: React.ComponentType<{ className?: string }>; title: string; lines: string[] }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        {lines.map((l) => <div key={l} className="text-sm text-muted-foreground">{l}</div>)}
      </div>
    </div>
  );
}
