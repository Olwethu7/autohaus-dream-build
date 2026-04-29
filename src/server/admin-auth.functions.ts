import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

const emailSchema = z.object({
  email: z.string().trim().email().max(255).optional(),
});

function getClientIp(): string {
  return (
    getRequestHeader("cf-connecting-ip") ||
    getRequestHeader("x-real-ip") ||
    (getRequestHeader("x-forwarded-for") || "").split(",")[0].trim() ||
    getRequestIP({ xForwardedFor: true }) ||
    "unknown"
  );
}

/**
 * Check whether the calling IP is currently rate-limited.
 * Returns { locked: true, retryInMinutes } if too many recent failures.
 */
export const checkAdminLoginRate = createServerFn({ method: "POST" }).handler(
  async () => {
    const ip = getClientIp();
    const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from("admin_login_attempts")
      .select("attempted_at, success")
      .eq("ip_address", ip)
      .gte("attempted_at", since)
      .order("attempted_at", { ascending: false })
      .limit(20);

    if (error) {
      // Fail open on infrastructure errors so admins aren't locked out by a DB blip.
      return { locked: false as const };
    }

    const failures = (data || []).filter((r) => !r.success);
    if (failures.length >= MAX_ATTEMPTS) {
      const oldest = failures[failures.length - 1].attempted_at as string;
      const retryAt = new Date(oldest).getTime() + WINDOW_MINUTES * 60 * 1000;
      const retryInMinutes = Math.max(1, Math.ceil((retryAt - Date.now()) / 60000));
      return { locked: true as const, retryInMinutes };
    }
    return { locked: false as const };
  },
);

/**
 * Record an admin login attempt (success or failure) with the caller's IP.
 * Called from the client AFTER attempting `signInWithPassword`.
 */
export const recordAdminLoginAttempt = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255).optional(),
        success: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const ip = getClientIp();
    await supabaseAdmin.from("admin_login_attempts").insert({
      email: data.email ?? null,
      ip_address: ip,
      success: data.success,
    });
    return { ok: true };
  });
