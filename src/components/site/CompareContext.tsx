import { createContext, useCallback, useContext, useEffect, useState } from "react";

const KEY = "mlg.compare.v1";
const MAX = 3;

type Ctx = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => boolean; // returns true if now selected
  remove: (id: string) => void;
  clear: () => void;
};

const CompareContext = createContext<Ctx | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* noop */ }
  }, [ids]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    let nowSelected = false;
    setIds((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= MAX) return cur;
      nowSelected = true;
      return [...cur, id];
    });
    return nowSelected;
  }, []);

  const remove = useCallback((id: string) => setIds((cur) => cur.filter((x) => x !== id)), []);
  const clear = useCallback(() => setIds([]), []);

  return (
    <CompareContext.Provider value={{ ids, has, toggle, remove, clear }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}

export const COMPARE_MAX = MAX;
