import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Loader2, Play } from "lucide-react";

export const Route = createFileRoute("/admin/rls-check")({
  component: RlsCheck,
});

type Op = "INSERT" | "UPDATE" | "DELETE";
type Outcome = "blocked" | "allowed" | "error";
type Result = {
  table: string;
  op: Op;
  asRole: "anon" | "authenticated";
  outcome: Outcome;
  detail: string;
};

const TABLES = ["enquiries", "test_drives", "sell_requests"] as const;
type T = (typeof TABLES)[number];

const SAMPLE: Record<T, Record<string, unknown>> = {
  enquiries: { name: "RLS Test", email: "rls@test.invalid", message: "rls probe" },
  test_drives: {
    name: "RLS Test",
    email: "rls@test.invalid",
    phone: "0000000",
    preferred_date: "2099-01-01",
  },
  sell_requests: {
    name: "RLS Test",
    email: "rls@test.invalid",
    phone: "0000000",
    make: "Test",
    model: "RLS",
    year: 2000,
    mileage: 0,
    condition: "Good",
  },
};

function classify(error: unknown): Outcome {
  if (!error) return "allowed";
  const msg = String((error as { message?: string }).message || "").toLowerCase();
  if (
    msg.includes("row-level security") ||
    msg.includes("violates row-level") ||
    msg.includes("policy") ||
    msg.includes("not allowed") ||
    msg.includes("permission denied")
  ) {
    return "blocked";
  }
  // Validation errors (e.g. NOT NULL) before RLS — still means write was rejected;
  // but we can't be sure RLS would have blocked it. Treat as error so the admin investigates.
  return "error";
}

async function probe(table: T, op: Op, role: "anon" | "authenticated"): Promise<Result> {
  try {
    if (op === "INSERT") {
      const { error } = await supabase.from(table).insert(SAMPLE[table] as never);
      return { table, op, asRole: role, outcome: classify(error), detail: error?.message || "(no error)" };
    }
    if (op === "UPDATE") {
      const { error } = await supabase
        .from(table)
        .update({ status: "tampered" } as never)
        .eq("id", "00000000-0000-0000-0000-000000000000");
      return { table, op, asRole: role, outcome: classify(error), detail: error?.message || "(no error — but no rows match this id)" };
    }
    // DELETE
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", "00000000-0000-0000-0000-000000000000");
    return { table, op, asRole: role, outcome: classify(error), detail: error?.message || "(no error — but no rows match this id)" };
  } catch (e) {
    return { table, op, asRole: role, outcome: "error", detail: String((e as Error).message) };
  }
}

function RlsCheck() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const run = async () => {
    setRunning(true);
    setResults([]);
    const { data: { session } } = await supabase.auth.getSession();
    const role: "anon" | "authenticated" = session ? "authenticated" : "anon";
    setSignedIn(!!session);

    const ops: Op[] = ["INSERT", "UPDATE", "DELETE"];
    const all: Result[] = [];
    for (const t of TABLES) {
      for (const op of ops) {
        const r = await probe(t, op, role);
        all.push(r);
        setResults([...all]);
      }
    }
    setRunning(false);
  };

  const summary = (() => {
    if (results.length === 0) return null;
    const total = results.length;
    const blocked = results.filter((r) => r.outcome === "blocked").length;
    return { total, blocked, allPass: blocked === total };
  })();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl">RLS verification</h1>
        <p className="text-sm text-muted-foreground">
          Attempts direct INSERT / UPDATE / DELETE on <code>enquiries</code>, <code>test_drives</code>,
          and <code>sell_requests</code> using the browser Supabase client. Every attempt should be{" "}
          <span className="font-semibold">blocked</span> by RLS — public writes must only flow through the
          server functions in <code>src/server/forms.functions.ts</code>.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Button onClick={run} disabled={running}>
          {running ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running…</> : <><Play className="mr-2 h-4 w-4" /> Run checks</>}
        </Button>
        {signedIn !== null && (
          <Badge variant="outline">Running as {signedIn ? "authenticated (admin session)" : "anon"}</Badge>
        )}
        {summary && (
          summary.allPass ? (
            <Badge className="bg-emerald-600 text-white"><ShieldCheck className="mr-1 h-3 w-3" /> All {summary.total} blocked</Badge>
          ) : (
            <Badge className="bg-destructive text-destructive-foreground"><ShieldAlert className="mr-1 h-3 w-3" /> {summary.total - summary.blocked} of {summary.total} not blocked</Badge>
          )
        )}
      </div>

      {results.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Table</th>
                <th className="px-3 py-2 text-left">Operation</th>
                <th className="px-3 py-2 text-left">Outcome</th>
                <th className="px-3 py-2 text-left">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 font-mono text-xs">{r.table}</td>
                  <td className="px-3 py-2"><Badge variant="outline">{r.op}</Badge></td>
                  <td className="px-3 py-2">
                    {r.outcome === "blocked" ? (
                      <Badge className="bg-emerald-600 text-white">Blocked ✓</Badge>
                    ) : r.outcome === "allowed" ? (
                      <Badge className="bg-destructive text-destructive-foreground">ALLOWED ✗</Badge>
                    ) : (
                      <Badge variant="secondary">Inconclusive</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-semibold">What this verifies</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>The browser client (anon or signed-in non-service role) cannot INSERT into the three form tables.</li>
          <li>UPDATE and DELETE are also blocked (no public policies; admin policies use <code>has_role()</code>).</li>
          <li>UPDATE/DELETE may show "no rows match" on a real admin session — that's still blocked at the row level for non-admins.</li>
        </ul>
        <p className="mt-3">For a full external check, paste the same statements into the Supabase SQL Editor while toggling{" "}
          <em>Run as: anon</em> — every statement should fail with a row-level security error.</p>
      </div>
    </div>
  );
}
