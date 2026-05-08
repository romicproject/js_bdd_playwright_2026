// support/schemas/error.schema.js
import { z } from "zod";
import { COMMON_PATTERNS } from "./registry.js";

/**
 * Schema for specific errors
 */
export const badRequestSchema = z
  .object({
    responseCode: z.literal(400),
    message: COMMON_PATTERNS.message,
  })
  .strict();

export const notFoundSchema = z
  .object({
    responseCode: z.literal(404),
    message: COMMON_PATTERNS.message,
  })
  .strict();
