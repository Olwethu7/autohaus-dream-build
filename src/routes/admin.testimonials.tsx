import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, X, Star } from "lucide-react";

export const Route = createFileRoute("/admin/testimonials")({
  component: AdminTestimonials,
});

type T = {
  id: string; author_name: string; author_role: string | null; quote: string;
  rating: number; image_url: string | null; published: boolean; sort_order: number;
};

const empty: Partial<T> = { author_name: "", author_role: "", quote: "", rating: 5, image_url: "", published: true, sort_order: 0 };

function AdminTestimonials() {
  const [list, setList] = useState<T[]>([]);
  const [editing, setEditing] = useState<Partial<T> | null>(null);

  const load = async () => {
    const { data } = await supabase.from("testimonials").select("*").order("sort_order", { ascending: true });
    setList((data as T[]) || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload = {
      author_name: editing.author_name || "",
      author_role: editing.author_role || null,
      quote: editing.quote || "",
      rating: Number(editing.rating) || 5,
      image_url: editing.image_url || null,
      published: !!editing.published,
      sort_order: Number(editing.sort_order) || 0,
    };
    const { error } = editing.id
      ? await supabase.from("testimonials").update(payload).eq("id", editing.id)
      : await supabase.from("testimonials").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Testimonials</h1>
          <p className="mt-1 text-sm text-muted-foreground">{list.length} total</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}><Plus className="mr-2 h-4 w-4" /> Add testimonial</Button>
      </div>

      <div className="mt-6 grid gap-3">
        {list.map((t) => (
          <div key={t.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{t.author_name}</span>
                {t.author_role && <span className="text-xs text-muted-foreground">· {t.author_role}</span>}
                <span className="flex gap-0.5 text-gold">{Array.from({length:t.rating}).map((_,i)=><Star key={i} className="h-3 w-3 fill-current" />)}</span>
                {!t.published && <span className="rounded bg-muted px-1.5 py-0.5 text-xs">Hidden</span>}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">"{t.quote}"</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="sm" onClick={() => setEditing(t)}>Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">No testimonials yet.</div>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur">
          <div className="my-8 w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-luxe">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">{editing.id ? "Edit" : "Add"} testimonial</h2>
              <button onClick={() => setEditing(null)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 grid gap-3">
              <Input placeholder="Author name" value={editing.author_name || ""} onChange={(e) => setEditing({ ...editing, author_name: e.target.value })} />
              <Input placeholder="Role / location (optional)" value={editing.author_role || ""} onChange={(e) => setEditing({ ...editing, author_role: e.target.value })} />
              <Textarea rows={4} placeholder="Quote" value={editing.quote || ""} onChange={(e) => setEditing({ ...editing, quote: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" min={1} max={5} placeholder="Rating (1-5)" value={editing.rating ?? 5} onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })} />
                <Input type="number" placeholder="Sort order" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
              </div>
              <Input placeholder="Image URL (optional)" value={editing.image_url || ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={!!editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} /> Published
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
