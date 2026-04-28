// Server-only reCAPTCHA v3 verification.
// Returns precise reasons so the UI can show actionable, friendly messages.
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

export async function verifyRecaptcha(
  token: string,
  expectedAction: string,
  minScore = 0.5,
): Promise<CaptchaResult> {
  if (!token) return { ok: false, reason: "missing-token" };

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
    return { ok: false, reason: "network" };
  }

  if (!data.success) {
    const codes = data["error-codes"] || [];
    const mapped = codes.map((c) => ERROR_TO_REASON[c]).find(Boolean) || "unknown";
    return { ok: false, reason: mapped, errorCodes: codes };
  }
  if (data.score !== undefined && data.score < minScore) {
    return { ok: false, reason: "low-score" };
  }
  if (data.action !== undefined && data.action !== expectedAction) {
    return { ok: false, reason: "action-mismatch" };
  }
  return { ok: true, score: data.score };
}
