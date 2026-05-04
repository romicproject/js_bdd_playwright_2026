import { z } from "zod";

export const userDetailSchema = z
  .object({
    responseCode: z.literal(200),
    user: z
      .object({
        email: z.string().min(3),
      })
      .passthrough(),
  })
  .passthrough();
