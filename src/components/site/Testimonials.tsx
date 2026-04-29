import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type T = { id: string; author_name: string; author_role: string | null; quote: string; rating: number; image_url: string | null };

export function Testimonials() {
  const [items, setItems] = useState<T[]>([]);

  useEffect(() => {
    supabase
      .from("testimonials")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setItems((data as T[]) || []));
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="bg-muted/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">What our customers say</div>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">Trusted by drivers across the North West</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <figure key={t.id} className="flex flex-col rounded-xl bg-card p-7 shadow-card">
              <div className="flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < t.rating ? "fill-current" : "opacity-30"}`} />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">"{t.quote}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                {t.image_url ? (
                  <img src={t.image_url} alt={t.author_name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold text-sm font-bold text-gold-foreground">
                    {t.author_name.slice(0, 1)}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold">{t.author_name}</div>
                  {t.author_role && <div className="text-xs text-muted-foreground">{t.author_role}</div>}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
