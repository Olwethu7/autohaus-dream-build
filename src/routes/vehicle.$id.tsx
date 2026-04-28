import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Calculator, Phone, ArrowLeft, Gauge, Fuel, Settings2, Palette, Car, DoorOpen } from "lucide-react";
import { Layout } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { formatGBP, formatMiles } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EnquiryForm } from "@/components/site/EnquiryForm";

export const Route = createFileRoute("/vehicle/$id")({
  component: VehicleDetail,
});

type V = {
  id: string; make: string; model: string; year: number; price: number; mileage: number;
  fuel_type: string; transmission: string; body_type: string; color: string | null;
  engine_size: string | null; doors: number | null; description: string | null;
  images: string[]; sold: boolean;
};

function VehicleDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [v, setV] = useState<V | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    supabase.from("vehicles").select("*").eq("id", id).maybeSingle()
      .then(({ data }) => setV(data as V | null));
  }, [id]);

  if (!v) return <Layout><div className="mx-auto max-w-7xl px-4 py-20">Loading…</div></Layout>;

  const images = v.images?.length ? v.images : [`https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=70&seed=${v.id}`];
  const monthly = Math.round((Number(v.price) * 0.012)); // rough indicator

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button onClick={() => navigate({ to: "/catalogue" })} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to catalogue
        </button>

        <div className="mt-6 grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-xl bg-muted">
              <img src={images[active]} alt={`${v.make} ${v.model}`} className="aspect-[4/3] w-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {images.map((src, i) => (
                  <button key={i} onClick={() => setActive(i)} className={`overflow-hidden rounded-md border-2 ${i === active ? "border-gold" : "border-transparent"}`}>
                    <img src={src} alt="" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="text-xs uppercase tracking-[0.2em] text-gold">{v.year} · {v.body_type}</div>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl">{v.make} {v.model}</h1>
            <div className="mt-4 flex items-baseline gap-3">
              <div className="font-display text-4xl text-primary">{formatGBP(Number(v.price))}</div>
              {v.sold && <span className="rounded bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">SOLD</span>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">From {formatGBP(monthly)}/mo with finance · <Link to="/finance" className="underline hover:text-gold">calculate</Link></p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link to="/test-drive" search={{ vehicleId: v.id }} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                <Calendar className="h-4 w-4" /> Book test drive
              </Link>
              <a href="tel:01615550199" className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-semibold hover:bg-accent">
                <Phone className="h-4 w-4" /> Call us
              </a>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-5">
              <Spec icon={Gauge} label="Mileage" value={formatMiles(v.mileage)} />
              <Spec icon={Fuel} label="Fuel" value={v.fuel_type} />
              <Spec icon={Settings2} label="Transmission" value={v.transmission} />
              <Spec icon={Car} label="Body" value={v.body_type} />
              {v.color && <Spec icon={Palette} label="Colour" value={v.color} />}
              {v.engine_size && <Spec icon={Calculator} label="Engine" value={v.engine_size} />}
              {v.doors && <Spec icon={DoorOpen} label="Doors" value={String(v.doors)} />}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h2 className="font-display text-2xl">About this vehicle</h2>
            <p className="mt-4 whitespace-pre-line text-foreground/80">{v.description || "Contact us for more details."}</p>
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-display text-xl">Enquire about this car</h3>
              <p className="mt-1 text-sm text-muted-foreground">We'll get back to you within one working day.</p>
              <div className="mt-4">
                <EnquiryForm vehicleId={v.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Spec({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-gold" />
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
