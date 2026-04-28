// Server-only reCAPTCHA v3 verification.
// Uses Google's public test secret by default — replace via RECAPTCHA_SECRET env var
// for production. Test secret always returns success: true.
const TEST_SECRET = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

export async function verifyRecaptcha(token: string, expectedAction: string, minScore = 0.5) {
  if (!token) return { ok: false, reason: "missing-token" as const };
  const secret = process.env.RECAPTCHA_SECRET || TEST_SECRET;
  const params = new URLSearchParams({ secret, response: token });
  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = (await res.json()) as {
    success: boolean;
    score?: number;
    action?: string;
    "error-codes"?: string[];
  };
  if (!data.success) return { ok: false, reason: "failed" as const, errors: data["error-codes"] };
  // Test keys don't return score/action; allow when missing.
  if (data.score !== undefined && data.score < minScore) return { ok: false, reason: "low-score" as const };
  if (data.action !== undefined && data.action !== expectedAction) return { ok: false, reason: "action-mismatch" as const };
  return { ok: true as const };
}
