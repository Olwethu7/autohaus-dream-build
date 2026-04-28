import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, X } from "lucide-react";

type Stats = {
  minutes: number;
  captcha_failures_total: number;
  captcha_failures_by_reason: Record<string, number>;
  rapid_enquiry_emails: { email: string; count: number }[];
  rapid_testdrive_emails: { email: string; count: number }[];
};

const CAPTCHA_THRESHOLD = 5; // failures in the last hour
const DISMISS_KEY = "mlg_abuse_banner_dismissed_at";
const DISMISS_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function AbuseBanner() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stamp = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (stamp && Date.now() - stamp < DISMISS_TTL_MS) setDismissed(true);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data, error } = await supabase.rpc("admin_recent_abuse_stats", { _minutes: 60 });
      if (!alive || error) return;
      setStats(data as unknown as Stats);
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!stats || dismissed) return null;

  const captchaHigh = stats.captcha_failures_total >= CAPTCHA_THRESHOLD;
  const rapidEnq = stats.rapid_enquiry_emails || [];
  const rapidTd = stats.rapid_testdrive_emails || [];
  const anyRapid = rapidEnq.length > 0 || rapidTd.length > 0;

  if (!captchaHigh && !anyRapid) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const reasonChips = Object.entries(stats.captcha_failures_by_reason || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-100">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1 space-y-2 text-sm">
          <div className="font-semibold">Possible abuse in the last hour</div>
          {captchaHigh && (
            <div>
              <span className="font-medium">{stats.captcha_failures_total}</span> reCAPTCHA failures.
              {reasonChips.length > 0 && (
                <span className="ml-1 text-xs opacity-80">
                  ({reasonChips.map(([r, c]) => `${r}: ${c}`).join(", ")})
                </span>
              )}
            </div>
          )}
          {rapidEnq.length > 0 && (
            <div>
              Rapid enquiries from:{" "}
              {rapidEnq.slice(0, 3).map((e) => (
                <span key={e.email} className="mr-2 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-xs">
                  {e.email} <span className="opacity-70">×{e.count}</span>
                </span>
              ))}
              {rapidEnq.length > 3 && <span className="text-xs opacity-80">and {rapidEnq.length - 3} more</span>}
            </div>
          )}
          {rapidTd.length > 0 && (
            <div>
              Rapid test drive bookings from:{" "}
              {rapidTd.slice(0, 3).map((e) => (
                <span key={e.email} className="mr-2 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-xs">
                  {e.email} <span className="opacity-70">×{e.count}</span>
                </span>
              ))}
              {rapidTd.length > 3 && <span className="text-xs opacity-80">and {rapidTd.length - 3} more</span>}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded p-1 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
          aria-label="Dismiss for 30 minutes"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
