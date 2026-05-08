// support/schemas/product.schema.js
import { z } from "zod";
import { zStr, zNum } from "./helpers.js";
import { COMMON_PATTERNS } from "./registry.js";

/**
 * Schema for a single product
 */
export const productSchema = z.object({
  id: COMMON_PATTERNS.id,
  name: COMMON_PATTERNS.name,
  price: zStr(),
  brand: COMMON_PATTERNS.name,
  category: z.object({
    usertype: z.object({
      usertype: zStr(),
    }),
    category: zStr(),
  }),
});
