// support/schemas/error.schema.js
import { z } from "zod";

/**
 * Schema for specific errors
 */
export const badRequestSchema = z
  .object({
    responseCode: z.literal(400),
    message: z.string({
      required_error: "Message is required",
      invalid_type_error: "Message must be a string",
    }),
  })
  .strict();

export const notFoundSchema = z
  .object({
    responseCode: z.literal(404),
    message: z.string({
      required_error: "Message is required",
      invalid_type_error: "Message must be a string",
    }),
  })
  .strict();
