import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { verifyRecaptcha, type CaptchaFailReason } from "./recaptcha.server";
import {
  sendEnquiryEmails,
  sendSellRequestNotification,
  sendTestDriveConfirmation,
} from "./email.server";

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
    const verify = await verifyRecaptcha(data.token, "enquiry");
    if (!verify.ok) return { ok: false, error: "captcha", reason: verify.reason };
    const { error } = await supabaseAdmin.from("enquiries").insert({
      vehicle_id: data.vehicle_id ?? null,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
    });
    if (error) return { ok: false, error: "Could not save enquiry. Please try again." };
    let vehicleLabel: string | null = null;
    if (data.vehicle_id) {
      const { data: v } = await supabaseAdmin
        .from("vehicles").select("year,make,model").eq("id", data.vehicle_id).maybeSingle();
      if (v) vehicleLabel = `${v.year} ${v.make} ${v.model}`;
    }
    try {
      await sendEnquiryEmails({ to: data.email, name: data.name, message: data.message, vehicleLabel });
    } catch (e) { console.error("[email] enquiry failed", e); }
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
    const verify = await verifyRecaptcha(data.token, "test_drive");
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
    let vehicleLabel = "your selected vehicle";
    const { data: v } = await supabaseAdmin
      .from("vehicles").select("year,make,model").eq("id", data.vehicle_id).maybeSingle();
    if (v) vehicleLabel = `${v.year} ${v.make} ${v.model}`;
    try {
      await sendTestDriveConfirmation({ to: data.email, name: data.name, vehicleLabel, date: data.preferred_date });
    } catch (e) { console.error("[email] test drive failed", e); }
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
    const verify = await verifyRecaptcha(data.token, "sell");
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
    try {
      await sendSellRequestNotification({
        name: data.name, email: data.email, phone: data.phone,
        make: data.make, model: data.model, year: data.year, mileage: data.mileage,
        asking_price: data.asking_price ?? null,
      });
    } catch (e) { console.error("[email] sell request failed", e); }
    return { ok: true };
  });
