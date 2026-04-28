// Server-only reCAPTCHA v3 verification.
// Returns precise reasons so the UI can show actionable, friendly messages.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getRequestHeader } from "@tanstack/react-start/server";

const TEST_SECRET = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

export type CaptchaFailReason =
  | "missing-token"
  | "timeout-or-duplicate"
  | "invalid-key"
  | "low-score"
  | "action-mismatch"
  | "network"
  | "unknown";

export type CaptchaResult =
  | { ok: true; score?: number }
  | { ok: false; reason: CaptchaFailReason; errorCodes?: string[] };

const ERROR_TO_REASON: Record<string, CaptchaFailReason> = {
  "missing-input-secret": "invalid-key",
  "invalid-input-secret": "invalid-key",
  "missing-input-response": "missing-token",
  "invalid-input-response": "missing-token",
  "bad-request": "unknown",
  "timeout-or-duplicate": "timeout-or-duplicate",
};

function clientIp(): string | null {
  try {
    const xff = getRequestHeader("x-forwarded-for");
    if (xff) return xff.split(",")[0]?.trim() || null;
    return getRequestHeader("cf-connecting-ip") || null;
  } catch {
    return null;
  }
}

async function logFailure(
  action: string,
  reason: CaptchaFailReason,
  email: string | null,
  errorCodes?: string[],
  score?: number,
) {
  try {
    await supabaseAdmin.from("captcha_failures").insert({
      action,
      reason,
      email,
      ip: clientIp(),
      details: { error_codes: errorCodes ?? [], score: score ?? null },
    });
  } catch {
    // never let logging block the response
  }
}

export async function verifyRecaptcha(
  token: string,
  expectedAction: string,
  minScore = 0.5,
  email: string | null = null,
): Promise<CaptchaResult> {
  if (!token) {
    await logFailure(expectedAction, "missing-token", email);
    return { ok: false, reason: "missing-token" };
  }

  const secret = process.env.RECAPTCHA_SECRET || TEST_SECRET;
  const params = new URLSearchParams({ secret, response: token });

  let data: {
    success: boolean;
    score?: number;
    action?: string;
    "error-codes"?: string[];
  };
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    data = await res.json();
  } catch {
    await logFailure(expectedAction, "network", email);
    return { ok: false, reason: "network" };
  }

  if (!data.success) {
    const codes = data["error-codes"] || [];
    const mapped = codes.map((c) => ERROR_TO_REASON[c]).find(Boolean) || "unknown";
    await logFailure(expectedAction, mapped, email, codes);
    return { ok: false, reason: mapped, errorCodes: codes };
  }
  // Test keys don't return score/action; allow when missing.
  if (data.score !== undefined && data.score < minScore) {
    await logFailure(expectedAction, "low-score", email, [], data.score);
    return { ok: false, reason: "low-score" };
  }
  if (data.action !== undefined && data.action !== expectedAction) {
    await logFailure(expectedAction, "action-mismatch", email, [], data.score);
    return { ok: false, reason: "action-mismatch" };
  }
  return { ok: true, score: data.score };
}
