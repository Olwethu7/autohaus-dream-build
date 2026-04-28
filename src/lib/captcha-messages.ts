// Shared client/server mapping for reCAPTCHA failure reasons.
export type CaptchaFailReason =
  | "missing-token"
  | "timeout-or-duplicate"
  | "invalid-key"
  | "low-score"
  | "action-mismatch"
  | "network"
  | "unknown";

export type CaptchaMessage = {
  title: string;
  description: string;
  /** True when reloading the page is the recommended fix. */
  needsReload: boolean;
  /** True when retrying the same submission usually works. */
  canRetry: boolean;
};

export function captchaMessage(reason?: CaptchaFailReason | null): CaptchaMessage {
  switch (reason) {
    case "missing-token":
      return {
        title: "Verification didn't start",
        description:
          "We couldn't get a security token from reCAPTCHA. Please reload the page and try again.",
        needsReload: true,
        canRetry: false,
      };
    case "timeout-or-duplicate":
      return {
        title: "Security check expired",
        description:
          "Your verification timed out (tokens last about 2 minutes). Reload the page and resubmit your form.",
        needsReload: true,
        canRetry: false,
      };
    case "low-score":
      return {
        title: "Looks suspicious to our spam filter",
        description:
          "reCAPTCHA flagged this attempt as risky. Try again from a stable network, disable VPN/proxy if possible, or call us on +44 161 000 0000.",
        needsReload: false,
        canRetry: true,
      };
    case "action-mismatch":
      return {
        title: "Security check mismatch",
        description:
          "The form action didn't match what reCAPTCHA expected. Reload the page and submit again.",
        needsReload: true,
        canRetry: false,
      };
    case "invalid-key":
      return {
        title: "Spam protection misconfigured",
        description:
          "Our reCAPTCHA keys are invalid. This is on us — please call us on +44 161 000 0000 or email sales@mlgautohaus.co.uk so we can help directly.",
        needsReload: false,
        canRetry: false,
      };
    case "network":
      return {
        title: "Couldn't reach the security service",
        description:
          "Google's reCAPTCHA service didn't respond. Check your internet connection and try again.",
        needsReload: false,
        canRetry: true,
      };
    default:
      return {
        title: "Verification failed",
        description:
          "Something went wrong with our spam check. Please try again in a moment.",
        needsReload: false,
        canRetry: true,
      };
  }
}

/** One-line summary for compact toasts. */
export function captchaToastText(reason?: CaptchaFailReason | null): string {
  const m = captchaMessage(reason);
  return `${m.title}. ${m.description}`;
}
