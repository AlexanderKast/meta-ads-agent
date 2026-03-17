import { z } from "zod";
import { LIMITS } from "./constants";

export const adRequestSchema = z.object({
  platform: z.enum(["meta", "tiktok", "google", "youtube", "linkedin", "pinterest", "twitter", "microsoft"]),
  objective: z.enum(["awareness", "consideration", "conversion"]),
  tone: z.enum(["profesional", "casual", "urgente", "emocional", "divertido"]),
  product: z
    .string()
    .min(1, "El producto es requerido")
    .max(LIMITS.product, `Maximo ${LIMITS.product} caracteres`),
  audience: z
    .string()
    .min(1, "La audiencia es requerida")
    .max(LIMITS.audience, `Maximo ${LIMITS.audience} caracteres`),
  extras: z
    .string()
    .max(LIMITS.extras, `Maximo ${LIMITS.extras} caracteres`)
    .optional()
    .default(""),
  variations: z
    .number()
    .int()
    .min(LIMITS.variations.min)
    .max(LIMITS.variations.max)
    .default(3),
  language: z.enum(["es", "en", "pt", "fr"]).optional().default("es"),
  generateImagePrompts: z.boolean().optional().default(false),
});

export type ValidatedAdRequest = z.infer<typeof adRequestSchema>;

export const analyzeSchema = z.object({
  adText: z.string().min(1, "El texto del anuncio es requerido").max(2000),
  platform: z.enum(["meta", "tiktok", "google", "youtube", "linkedin", "pinterest", "twitter", "microsoft"]).optional(),
  variations: z.number().int().min(1).max(5).default(3),
});

export const abTestSchema = z.object({
  variations: z.array(z.string().min(1)).min(2, "Minimo 2 variaciones").max(5),
  platform: z.enum(["meta", "tiktok", "google", "youtube", "linkedin", "pinterest", "twitter", "microsoft"]),
  objective: z.enum(["awareness", "consideration", "conversion"]),
  budget: z.string().optional(),
});

export const refineSchema = z.object({
  original: z.object({
    headline: z.string(),
    primaryText: z.string(),
    description: z.string().optional(),
    cta: z.string(),
    hook: z.string().optional(),
  }),
  instruction: z.string().min(1, "La instruccion es requerida").max(300),
  platform: z.enum(["meta", "tiktok", "google", "youtube", "linkedin", "pinterest", "twitter", "microsoft"]),
});

export const scoreSchema = z.object({
  variation: z.object({
    headline: z.string(),
    primaryText: z.string(),
    description: z.string().optional(),
    cta: z.string(),
    hook: z.string().optional(),
  }),
  platform: z.enum(["meta", "tiktok", "google", "youtube", "linkedin", "pinterest", "twitter", "microsoft"]),
  objective: z.enum(["awareness", "consideration", "conversion"]),
});
