import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/content")({
  component: ContentAdmin,
});

type C = { id: string; key: string; title: string | null; body: string | null };

function ContentAdmin() {
  const [items, setItems] = useState<C[]>([]);
  const load = () => supabase.from("site_content").select("*").order("key").then(({ data }) => setItems((data as C[]) || []));
  useEffect(() => { load(); }, []);

  const save = async (c: C) => {
    const { error } = await supabase.from("site_content").update({ title: c.title, body: c.body }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  return (
    <div>
      <h1 className="font-display text-3xl">Site content</h1>
      <p className="mt-1 text-sm text-muted-foreground">Edit the hero banner and About page text.</p>
      <div className="mt-6 space-y-4">
        {items.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="text-xs uppercase tracking-wider text-gold">{c.key}</div>
            <Input className="mt-3" value={c.title || ""} onChange={(e) => setItems((arr) => arr.map((x) => x.id === c.id ? { ...x, title: e.target.value } : x))} placeholder="Title" />
            <Textarea className="mt-3" rows={5} value={c.body || ""} onChange={(e) => setItems((arr) => arr.map((x) => x.id === c.id ? { ...x, body: e.target.value } : x))} placeholder="Body" />
            <div className="mt-3 flex justify-end">
              <Button onClick={() => save(c)}>Save</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
