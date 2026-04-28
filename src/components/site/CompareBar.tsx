import { Link } from "@tanstack/react-router";
import { useCompare } from "./CompareContext";
import { X, GitCompareArrows } from "lucide-react";

export function CompareBar() {
  const { ids, remove, clear } = useCompare();
  if (ids.length === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 mx-auto w-full max-w-3xl px-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/95 p-3 shadow-luxe backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-gold text-gold-foreground">
            <GitCompareArrows className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <div className="font-semibold">{ids.length} selected</div>
            <div className="text-xs text-muted-foreground">Up to 3 vehicles</div>
          </div>
          <div className="ml-2 hidden items-center gap-1 sm:flex">
            {ids.map((id) => (
              <button
                key={id}
                onClick={() => remove(id)}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-mono hover:bg-destructive hover:text-destructive-foreground"
                title="Remove"
              >
                {id.slice(0, 6)} <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clear} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
          <Link
            to="/compare"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Compare {ids.length > 1 ? "now" : ""}
          </Link>
        </div>
      </div>
    </div>
  );
}
