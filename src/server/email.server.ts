// Dev-mode email sender. Logs to server console.
// Swap NOTIFY_TO and the transport with real SMTP later.

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "admin@mlgautohaus.com";
const FROM_EMAIL = process.env.MAIL_FROM || "no-reply@mlgautohaus.com";

export type Mail = {
  to: string;
  subject: string;
  text: string;
};

async function deliver(mail: Mail) {
  // Development mode: log to console. Replace with nodemailer/SMTP for production.
  // eslint-disable-next-line no-console
  console.log(
    `\n[email] -----------------------------\n` +
      `From: ${FROM_EMAIL}\n` +
      `To:   ${mail.to}\n` +
      `Subj: ${mail.subject}\n` +
      `${mail.text}\n` +
      `[email] -----------------------------\n`
  );
}

export async function sendTestDriveConfirmation(args: {
  to: string;
  name: string;
  vehicleLabel: string;
  date: string;
}) {
  await deliver({
    to: args.to,
    subject: `Your test drive request — ${args.vehicleLabel}`,
    text:
      `Hi ${args.name},\n\n` +
      `Thanks for booking a test drive at MLG Autohaus.\n\n` +
      `Vehicle: ${args.vehicleLabel}\n` +
      `Preferred date: ${args.date}\n\n` +
      `We'll be in touch shortly to confirm your slot.\n\n` +
      `— MLG Autohaus`,
  });
  await deliver({
    to: ADMIN_EMAIL,
    subject: `New test drive request: ${args.vehicleLabel}`,
    text: `Customer: ${args.name} <${args.to}>\nVehicle: ${args.vehicleLabel}\nDate: ${args.date}`,
  });
}

export async function sendEnquiryEmails(args: {
  to: string;
  name: string;
  message: string;
  vehicleLabel?: string | null;
}) {
  // Auto-reply to user
  await deliver({
    to: args.to,
    subject: `We received your enquiry — MLG Autohaus`,
    text:
      `Hi ${args.name},\n\n` +
      `Thanks for contacting MLG Autohaus${args.vehicleLabel ? ` about the ${args.vehicleLabel}` : ""}. ` +
      `One of our team will reply within one business day.\n\n` +
      `Your message:\n${args.message}\n\n` +
      `— MLG Autohaus`,
  });
  // Notify admin
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
  name: string;
  email: string;
  phone: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  asking_price?: number | null;
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
