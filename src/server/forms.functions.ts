import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { verifyRecaptcha, type CaptchaFailReason } from "./recaptcha.server";

type FormResult =
  | { ok: true }
  | { ok: false; error: string; reason?: CaptchaFailReason };

const enquirySchema = z.object({
  token: z.string().min(1),
  vehicle_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().nullable(),
  message: z.string().trim().min(5).max(2000),
});

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => enquirySchema.parse(d))
  .handler(async ({ data }): Promise<FormResult> => {
    const verify = await verifyRecaptcha(data.token, "enquiry", 0.5, data.email);
    if (!verify.ok) return { ok: false, error: "captcha", reason: verify.reason };
    const { error } = await supabaseAdmin.from("enquiries").insert({
      vehicle_id: data.vehicle_id ?? null,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
    });
    if (error) return { ok: false, error: "Could not save enquiry. Please try again." };
    return { ok: true };
  });

const testDriveSchema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  vehicle_id: z.string().uuid(),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(1000).optional().nullable(),
});

export const submitTestDrive = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => testDriveSchema.parse(d))
  .handler(async ({ data }): Promise<FormResult> => {
    const verify = await verifyRecaptcha(data.token, "test_drive", 0.5, data.email);
    if (!verify.ok) return { ok: false, error: "captcha", reason: verify.reason };
    const { error } = await supabaseAdmin.from("test_drives").insert({
      vehicle_id: data.vehicle_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      preferred_date: data.preferred_date,
      notes: data.notes || null,
    });
    if (error) return { ok: false, error: "Could not book test drive. Please try again." };
    return { ok: true };
  });

const sellSchema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  make: z.string().trim().min(1).max(50),
  model: z.string().trim().min(1).max(50),
  year: z.number().int().min(1950).max(new Date().getFullYear() + 1),
  mileage: z.number().int().min(0).max(1000000),
  condition: z.string().min(1).max(40),
  asking_price: z.number().min(0).nullable().optional(),
  description: z.string().max(2000).optional().nullable(),
});

export const submitSellRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => sellSchema.parse(d))
  .handler(async ({ data }): Promise<FormResult> => {
    const verify = await verifyRecaptcha(data.token, "sell", 0.5, data.email);
    if (!verify.ok) return { ok: false, error: "captcha", reason: verify.reason };
    const { error } = await supabaseAdmin.from("sell_requests").insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      make: data.make,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      condition: data.condition,
      asking_price: data.asking_price ?? null,
      description: data.description || null,
    });
    if (error) return { ok: false, error: "Could not submit request. Please try again." };
    return { ok: true };
  });

// Lightweight captcha-only verify, used to gate navigation away from the
// compare page into the booking flow.
const verifySchema = z.object({
  token: z.string().min(1),
  action: z.enum(["compare_proceed"]),
});

export const verifyCaptcha = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => verifySchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; reason: CaptchaFailReason }> => {
    const r = await verifyRecaptcha(data.token, data.action);
    return r.ok ? { ok: true } : { ok: false, reason: r.reason };
  });
