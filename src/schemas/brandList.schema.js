// support/schemas/brandList.schema.js
import { z } from "zod";
import { zArr } from "./helpers.js";
import { brandSchema } from "./brand.schema.js";
import { COMMON_PATTERNS } from "./registry.js";

/**
 * Schema for a list of brands
 */
export const brandListSchema = z.object({
  responseCode: COMMON_PATTERNS.responseCode,
  brands: zArr(brandSchema),
});
