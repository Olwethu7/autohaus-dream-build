import { Link } from "@tanstack/react-router";
import { Gauge, Fuel, Settings2 } from "lucide-react";
import { formatGBP, formatMiles } from "@/lib/format";

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  body_type: string;
  images: string[];
  sold: boolean;
};

const placeholderImg = (v: Vehicle) =>
  `https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=70&auto=format&fit=crop&seed=${v.id}`;

export function VehicleCard({ v }: { v: Vehicle }) {
  const img = v.images?.[0] || placeholderImg(v);

  return (
    <div className="group relative overflow-hidden rounded-xl bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-luxe">
      <Link to="/vehicle/$id" params={{ id: v.id }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={img}
            alt={`${v.year} ${v.make} ${v.model}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {v.sold && (
            <div className="absolute left-3 top-3 rounded-md bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
              SOLD
            </div>
          )}
          <div className="absolute right-3 top-3 rounded-md bg-background/95 px-3 py-1.5 text-sm font-bold backdrop-blur">
            {formatGBP(Number(v.price))}
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs uppercase tracking-wider text-gold">{v.year} · {v.body_type}</div>
          <h3 className="mt-1 font-display text-xl leading-tight">{v.make} {v.model}</h3>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" /> {formatMiles(v.mileage)}</span>
            <span className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5" /> {v.fuel_type}</span>
            <span className="flex items-center gap-1"><Settings2 className="h-3.5 w-3.5" /> {v.transmission}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
