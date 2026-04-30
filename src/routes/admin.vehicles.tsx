import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, X, Upload, BadgeCheck, RotateCcw, Car } from "lucide-react";
import { formatGBP } from "@/lib/format";

export const Route = createFileRoute("/admin/vehicles")({
  component: VehiclesAdmin,
});

type V = {
  id: string; make: string; model: string; year: number; price: number; mileage: number;
  fuel_type: string; transmission: string; body_type: string; color: string | null;
  engine_size: string | null; doors: number | null; description: string | null;
  drivetrain: string | null; condition: string | null;
  co2_emissions: number | null; road_tax_band: string | null; mot_expiry: string | null;
  images: string[]; featured: boolean; sold: boolean;
};

const empty: Partial<V> = {
  make: "", model: "", year: new Date().getFullYear(), price: 0, mileage: 0,
  fuel_type: "Petrol", transmission: "Manual", body_type: "Saloon",
  color: "", engine_size: "", doors: 4, description: "",
  drivetrain: "FWD", condition: "Excellent",
  co2_emissions: null, road_tax_band: "", mot_expiry: null,
  images: [], featured: false, sold: false,
};

function VehiclesAdmin() {
  const [list, setList] = useState<V[]>([]);
  const [editing, setEditing] = useState<Partial<V> | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false });
    setList((data as V[]) || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload = {
      make: editing.make!, model: editing.model!, year: Number(editing.year),
      price: Number(editing.price), mileage: Number(editing.mileage),
      fuel_type: editing.fuel_type!, transmission: editing.transmission!, body_type: editing.body_type!,
      color: editing.color || null, engine_size: editing.engine_size || null,
      doors: editing.doors ? Number(editing.doors) : null,
      description: editing.description || null, images: editing.images || [],
      drivetrain: editing.drivetrain || null,
      condition: editing.condition || null,
      co2_emissions: editing.co2_emissions != null && String(editing.co2_emissions) !== "" ? Number(editing.co2_emissions) : null,
      road_tax_band: editing.road_tax_band || null,
      mot_expiry: editing.mot_expiry || null,
      featured: !!editing.featured, sold: !!editing.sold,
    };
    if (editing.id) {
      const { error } = await supabase.from("vehicles").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("vehicles").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this vehicle?")) return;
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const onUpload = async (files: FileList | null) => {
    if (!files || !editing) return;
    setUploading(true);
    const urls: string[] = [...(editing.images || [])];
    for (const file of Array.from(files)) {
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error } = await supabase.storage.from("vehicle-images").upload(path, file, { upsert: false });
      if (error) { toast.error(error.message); continue; }
      const { data } = supabase.storage.from("vehicle-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    setEditing({ ...editing, images: urls });
    setUploading(false);
  };

  const toggleSold = async (v: V) => {
    const { error } = await supabase.from("vehicles").update({ sold: !v.sold }).eq("id", v.id);
    if (error) return toast.error(error.message);
    toast.success(v.sold ? "Marked available" : "Marked as sold");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Vehicles</h1>
          <p className="mt-1 text-sm text-muted-foreground">{list.length} in stock</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}><Plus className="mr-2 h-4 w-4" /> Add vehicle</Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-3 text-left">Vehicle</th><th className="p-3 text-left">Year</th><th className="p-3 text-left">Price</th><th className="p-3 text-left">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v.id} className="border-t border-border">
                <td className="p-3 font-medium">{v.make} {v.model}</td>
                <td className="p-3">{v.year}</td>
                <td className="p-3">{formatGBP(Number(v.price))}</td>
                <td className="p-3">
                  {v.sold ? <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">Sold</span>
                   : v.featured ? <span className="rounded bg-gold/10 px-2 py-0.5 text-xs text-gold">Featured</span>
                   : <span className="text-muted-foreground">Available</span>}
                </td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => toggleSold(v)} title={v.sold ? "Mark available" : "Mark as sold"}>
                    {v.sold ? <RotateCcw className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4 text-destructive" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(v)}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No vehicles yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur">
          <div className="my-8 w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-luxe">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">{editing.id ? "Edit vehicle" : "Add vehicle"}</h2>
              <button onClick={() => setEditing(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input placeholder="Make" value={editing.make || ""} onChange={(e) => setEditing({ ...editing, make: e.target.value })} />
              <Input placeholder="Model" value={editing.model || ""} onChange={(e) => setEditing({ ...editing, model: e.target.value })} />
              <Input type="number" placeholder="Year" value={editing.year || ""} onChange={(e) => setEditing({ ...editing, year: Number(e.target.value) })} />
              <Input type="number" placeholder="Price (£)" value={editing.price || ""} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
              <Input type="number" placeholder="Mileage" value={editing.mileage || ""} onChange={(e) => setEditing({ ...editing, mileage: Number(e.target.value) })} />
              <Select value={editing.fuel_type} onValueChange={(v) => setEditing({ ...editing, fuel_type: v })}>
                <SelectTrigger><SelectValue placeholder="Fuel" /></SelectTrigger>
                <SelectContent>{["Petrol","Diesel","Hybrid","Electric"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={editing.transmission} onValueChange={(v) => setEditing({ ...editing, transmission: v })}>
                <SelectTrigger><SelectValue placeholder="Transmission" /></SelectTrigger>
                <SelectContent>{["Manual","Automatic"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={editing.body_type} onValueChange={(v) => setEditing({ ...editing, body_type: v })}>
                <SelectTrigger><SelectValue placeholder="Body" /></SelectTrigger>
                <SelectContent>{["Saloon","Hatchback","Estate","SUV","Coupe","Convertible","MPV"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Colour" value={editing.color || ""} onChange={(e) => setEditing({ ...editing, color: e.target.value })} />
              <Input placeholder="Engine size (e.g. 2.0L)" value={editing.engine_size || ""} onChange={(e) => setEditing({ ...editing, engine_size: e.target.value })} />
              <Input type="number" placeholder="Doors" value={editing.doors || ""} onChange={(e) => setEditing({ ...editing, doors: Number(e.target.value) })} />
              <Select value={editing.drivetrain || ""} onValueChange={(v) => setEditing({ ...editing, drivetrain: v })}>
                <SelectTrigger><SelectValue placeholder="Drivetrain" /></SelectTrigger>
                <SelectContent>{["FWD","RWD","AWD","4WD"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={editing.condition || ""} onValueChange={(v) => setEditing({ ...editing, condition: v })}>
                <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
                <SelectContent>{["Excellent","Good","Fair","Needs work"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" placeholder="CO₂ emissions (g/km)" value={editing.co2_emissions ?? ""} onChange={(e) => setEditing({ ...editing, co2_emissions: e.target.value === "" ? null : Number(e.target.value) })} />
              <Input placeholder="Road tax band (e.g. C)" value={editing.road_tax_band || ""} onChange={(e) => setEditing({ ...editing, road_tax_band: e.target.value })} />
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">MOT expiry</label>
                <Input type="date" value={editing.mot_expiry || ""} onChange={(e) => setEditing({ ...editing, mot_expiry: e.target.value })} />
              </div>
            </div>
            <Textarea className="mt-3" rows={4} placeholder="Description" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />

            <div className="mt-4">
              <label className="text-sm font-medium">Images</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {(editing.images || []).map((url, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-border">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => setEditing({ ...editing, images: (editing.images || []).filter((_, j) => j !== i) })} className="absolute right-1 top-1 rounded bg-background/90 p-1">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex aspect-square cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border text-muted-foreground hover:border-gold hover:text-gold">
                  <Upload className="h-5 w-5" />
                  <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files)} />
                </label>
              </div>
              {uploading && <p className="mt-2 text-xs text-muted-foreground">Uploading…</p>}
            </div>

            <div className="mt-4 flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={!!editing.featured} onCheckedChange={(v) => setEditing({ ...editing, featured: v })} /> Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={!!editing.sold} onCheckedChange={(v) => setEditing({ ...editing, sold: v })} /> Sold
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save}>Save vehicle</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
