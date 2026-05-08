// support/schemas/productList.schema.js
import { z } from "zod";
import { zArr, zNum } from "./helpers.js";
import { productSchema } from "./product.schema.js";
import { COMMON_PATTERNS } from "./registry.js";

/**
 * Schema for a list of products
 * Reuses productSchema for each product in the array
 */
export const productListSchema = z.object({
  responseCode: COMMON_PATTERNS.responseCode,
  products: zArr(productSchema),
});
