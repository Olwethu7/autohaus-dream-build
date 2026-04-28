import { toast } from "sonner";
import { captchaMessage, type CaptchaFailReason } from "./captcha-messages";

/**
 * Show a friendly reCAPTCHA failure toast with a context-appropriate action
 * (Retry the caller, Reload the page, or no action for hard configuration errors).
 *
 * @param reason  The failure reason returned from the server.
 * @param onRetry Called when the user clicks the Retry action (only shown when retrying typically helps).
 */
export function showCaptchaError(
  reason: CaptchaFailReason | null | undefined,
  onRetry?: () => void,
) {
  const m = captchaMessage(reason);
  const action = m.needsReload
    ? { label: "Reload page", onClick: () => window.location.reload() }
    : m.canRetry && onRetry
    ? { label: "Try again", onClick: onRetry }
    : undefined;

  toast.error(m.title, {
    description: m.description,
    duration: 8000,
    action,
  });
}
