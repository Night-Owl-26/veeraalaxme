import { z } from "zod";

// Mirrors the backend's zod schemas closely enough to give the user instant
// feedback client-side. The backend re-validates everything independently —
// this is a UX convenience, never the actual security boundary.
export const phoneSchema = z.string().regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number");
export const otpSchema = z.string().length(6, "Enter the 6-digit code");

export const propertyDraftSchema = z.object({
  title: z.string().min(5, "Title should be at least 5 characters").max(140),
  price: z.number({ invalid_type_error: "Enter a price" }).int().positive("Enter a valid price"),
  city: z.string().min(2, "City is required"),
  locality: z.string().min(2, "Locality is required"),
  areaLabel: z.string().min(1, "Area is required"),
  description: z.string().min(10, "Add a bit more detail (10+ characters)").max(4000),
});

// Runs a zod schema and returns { valid, errors } shaped for easy form rendering.
export function validate(schema, values) {
  const result = schema.safeParse(values);
  if (result.success) return { valid: true, errors: {} };
  const errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (!errors[key]) errors[key] = issue.message;
  }
  return { valid: false, errors };
}
