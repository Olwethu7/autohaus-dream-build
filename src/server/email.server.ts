// Email sender. Uses Resend HTTP API when RESEND_API_KEY is set,
// otherwise logs to console (dev fallback). HTTP-only so it works in Workers.
//
// Required env (set as Cloud secrets to enable real sending):
//   RESEND_API_KEY        — Resend API key (https://resend.com)
//   MAIL_FROM             — From address, e.g. "MLG Autohaus <no-reply@yourdomain.com>"
//   ADMIN_NOTIFY_EMAIL    — Where admin notifications go (defaults to admin@mlgautohaus.com)

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "admin@mlgautohaus.com";
const FROM_EMAIL = process.env.MAIL_FROM || "MLG Autohaus <no-reply@mlgautohaus.com>";
const RESEND_KEY = process.env.RESEND_API_KEY;

export type Mail = { to: string; subject: string; text: string; html?: string };

async function deliver(mail: Mail) {
  if (RESEND_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [mail.to],
          subject: mail.subject,
          text: mail.text,
          html: mail.html ?? `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(mail.text)}</pre>`,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error(`[email] Resend failed ${res.status}: ${body}`);
      }
      return;
    } catch (e) {
      console.error("[email] Resend transport error:", e);
      return;
    }
  }
  // Dev fallback: log to console
  console.log(
    `\n[email] -----------------------------\nFrom: ${FROM_EMAIL}\nTo:   ${mail.to}\nSubj: ${mail.subject}\n${mail.text}\n[email] -----------------------------\n`
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export async function sendTestDriveConfirmation(args: {
  to: string; name: string; vehicleLabel: string; date: string;
}) {
  await deliver({
    to: args.to,
    subject: `Your test drive request — ${args.vehicleLabel}`,
    text:
      `Hi ${args.name},\n\nThanks for booking a test drive at MLG Autohaus.\n\n` +
      `Vehicle: ${args.vehicleLabel}\nPreferred date: ${args.date}\n\n` +
      `We'll be in touch shortly to confirm your slot.\n\n— MLG Autohaus`,
  });
  await deliver({
    to: ADMIN_EMAIL,
    subject: `New test drive request: ${args.vehicleLabel}`,
    text: `Customer: ${args.name} <${args.to}>\nVehicle: ${args.vehicleLabel}\nDate: ${args.date}`,
  });
}

export async function sendEnquiryEmails(args: {
  to: string; name: string; message: string; vehicleLabel?: string | null;
}) {
  await deliver({
    to: args.to,
    subject: `We received your enquiry — MLG Autohaus`,
    text:
      `Hi ${args.name},\n\nThanks for contacting MLG Autohaus${args.vehicleLabel ? ` about the ${args.vehicleLabel}` : ""}. ` +
      `One of our team will reply within one business day.\n\nYour message:\n${args.message}\n\n— MLG Autohaus`,
  });
  await deliver({
    to: ADMIN_EMAIL,
    subject: `New enquiry${args.vehicleLabel ? `: ${args.vehicleLabel}` : ""}`,
    text:
      `From: ${args.name} <${args.to}>\n` +
      (args.vehicleLabel ? `Vehicle: ${args.vehicleLabel}\n` : "") +
      `\n${args.message}`,
  });
}

export async function sendSellRequestNotification(args: {
  name: string; email: string; phone: string; make: string; model: string;
  year: number; mileage: number; asking_price?: number | null;
}) {
  await deliver({
    to: ADMIN_EMAIL,
    subject: `New sell-your-car request: ${args.year} ${args.make} ${args.model}`,
    text:
      `Customer: ${args.name} <${args.email}> ${args.phone}\n` +
      `Vehicle:  ${args.year} ${args.make} ${args.model}\n` +
      `Mileage:  ${args.mileage.toLocaleString()}\n` +
      (args.asking_price ? `Asking:   £${args.asking_price.toLocaleString()}\n` : ""),
  });
}

export async function sendPasswordResetNotice(to: string) {
  // Supabase sends the actual reset email. This is just an internal admin trace.
  console.log(`[email] password reset requested for ${to}`);
}
