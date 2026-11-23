import { z } from "zod";
import { serviceIds } from "@/content/services";
export const pinSchema = z
  .string()
  .regex(/^[1-9]\d{5}$/, "Enter a valid six-digit Indian PIN code.");
export const todayInKolkata = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const enquirySchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your name.").max(100),
    mobile: z
      .string()
      .trim()
      .regex(
        /^(?:\+?91[ -]?)?[6-9]\d{9}$/,
        "Enter a valid 10-digit Indian mobile number.",
      ),
    pin: pinSchema,
    service: z.enum(serviceIds, { error: "Please choose a service." }),
    email: z
      .union([z.email("Enter a valid email address.").max(254), z.literal("")])
      .optional(),
    brand: z.string().trim().max(80).optional(),
    model: z.string().trim().max(100).optional(),
    address: z.string().trim().max(500).optional(),
    preferredDate: z
      .string()
      .refine(
        (v) =>
          !v ||
          (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
            !Number.isNaN(Date.parse(v)) &&
            new Date(v).toISOString().slice(0, 10) === v &&
            v >= todayInKolkata() &&
            Date.parse(v) < Date.now() + 91 * 86400000),
        "Choose a valid date within the next 90 days.",
      )
      .optional(),
    preferredTime: z
      .enum(["", "morning", "afternoon", "evening", "flexible"])
      .optional(),
    problem: z
      .string()
      .trim()
      .max(2000, "Please keep your description under 2,000 characters.")
      .optional(),
    consent: z
      .boolean()
      .refine(
        (v) => v,
        "Please agree so we can contact you about this request.",
      ),
    website: z.string().max(200).optional(),
    source: z.enum([
      "hero",
      "service-card",
      "contact-form",
      "footer",
      "service-page",
      "area-check",
      "navigation",
      "faq",
    ]),
  })
  .strict();
export type EnquiryInput = z.infer<typeof enquirySchema>;
export type EnquirySource = EnquiryInput["source"];
