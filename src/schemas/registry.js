// src/schemas/registry.js
// Centralized registry of common schema patterns to reduce repetition

import { z } from "zod";
import { zStr, zNum } from "./helpers.js";

/**
 * Registry of frequently-used schema patterns.
 * Only patterns actively referenced by schema files are kept here.
 */
export const COMMON_PATTERNS = {
  // IDs
  id: zNum().positive(),

  // Names
  name: zStr().min(1),
  email: z.string().email(),

  // Timestamps
  createdAt: z.string().datetime().optional(),

  // API Response
  message: zStr(),
  responseCode: zNum(),
};

/**
 * Common entity schemas
 */

export const brandBaseSchema = z.object({
  id: COMMON_PATTERNS.id,
  brand: COMMON_PATTERNS.name,
});

// Public alias used by brand list schemas.
export const brandSchema = brandBaseSchema;
