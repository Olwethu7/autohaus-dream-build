// Shared client/server mapping for reCAPTCHA failure reasons.
export type CaptchaFailReason =
  | "missing-token"
  | "timeout-or-duplicate"
  | "invalid-key"
  | "low-score"
  | "action-mismatch"
  | "network"
  | "unknown";

export function captchaMessage(reason?: CaptchaFailReason | null): string {
  switch (reason) {
    case "missing-token":
      return "We couldn't verify you're human. Please refresh the page and try again.";
    case "timeout-or-duplicate":
      return "Your security check has expired. Please reload the page and resubmit.";
    case "low-score":
      return "Your submission looked suspicious to our spam filter. Try again from a stable network or contact us by phone.";
    case "action-mismatch":
      return "Security check mismatch. Please refresh the page and try again.";
    case "invalid-key":
      return "Our spam protection is misconfigured. Please contact us directly so we can help.";
    case "network":
      return "Couldn't reach the security service. Check your connection and try again.";
    default:
      return "Security verification failed. Please try again in a moment.";
  }
}
