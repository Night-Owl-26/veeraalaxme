const { z } = require("zod");

const phoneSchema = z.string().regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number");

const requestOtpSchema = z.object({
  phone: phoneSchema,
  purpose: z.enum(["register", "login"]),
  name: z.string().min(2).max(80).optional(),
  role: z.enum(["BUYER", "SELLER"]).optional(),
}).refine((v) => v.purpose !== "register" || (v.name && v.role), {
  message: "name and role are required to register",
  path: ["name"],
});

const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6),
  purpose: z.enum(["register", "login"]),
  name: z.string().min(2).max(80).optional(),
  role: z.enum(["BUYER", "SELLER"]).optional(),
});

module.exports = { requestOtpSchema, verifyOtpSchema, phoneSchema };
