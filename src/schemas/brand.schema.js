// support/schemas/brand.schema.js
import { z } from "zod";
import { COMMON_PATTERNS, brandBaseSchema } from "./registry.js";

/**
 * Schema for a single brand
 */
export const brandSchema = brandBaseSchema;
