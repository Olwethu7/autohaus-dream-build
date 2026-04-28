import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { submitEnquiry } from "@/server/forms.functions";
import { getRecaptchaToken } from "@/lib/recaptcha";

const schema = z.object({
  name: z.string().trim().min(2, "Name required").max(80),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Message required").max(2000),
});

export function EnquiryForm({ vehicleId }: { vehicleId?: string }) {
  const submit = useServerFn(submitEnquiry);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    try {
      const token = await getRecaptchaToken("enquiry");
      const res = await submit({ data: {
        token,
        vehicle_id: vehicleId ?? null,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        message: parsed.data.message,
      }});
      if (!res.ok) { toast.error(res.error || "Could not send."); return; }
      toast.success("Enquiry sent! We'll be in touch shortly.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      toast.error("Could not send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} />
      <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={255} />
      <Input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={30} />
      <Textarea placeholder="Your message" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength={2000} />
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Sending…" : "Send enquiry"}
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Protected by reCAPTCHA. We'll only use your details to reply.
      </p>
    </form>
  );
}
