// src/schemas/registry.js
// Centralized registry of common schema patterns to reduce repetition

import { z } from "zod";
import { zStr, zNum, zArr, zStatusCode } from "./helpers.js";

/**
 * Registry of frequently-used schema patterns
 * Import and reuse instead of defining same patterns in each schema file
 */

// Identity/Entity patterns
export const COMMON_PATTERNS = {
  // IDs (commonly used across products, brands, users)
  id: zNum().positive(),
  userId: zNum().positive(),
  productId: zNum().positive(),

  // Names/Titles
  name: zStr().min(1),
  title: zStr().min(1),
  email: z.string().email(),
  password: zStr().min(6),

  // Timestamps
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  timestamp: z.number().positive().optional(),

  // Status/State
  status: zStatusCode(),
  message: zStr(),
  responseCode: zNum(),

  // Flags
  active: z.boolean().optional(),
  deleted: z.boolean().optional(),
  verified: z.boolean().optional(),

  // Pagination
  page: zNum().positive().optional(),
  limit: zNum().positive().optional(),
  total: zNum().positive().optional(),
  offset: zNum().int().nonnegative().optional(),

  // Collections
  items: zArr().optional(),
  products: zArr().optional(),
  brands: zArr().optional(),
  users: zArr().optional(),

  // Nullable fields
  description: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
};

/**
 * Factory for creating common response schema structures
 * Use these to build response schemas without repetition
 */

export function apiSuccessResponse(dataSchema = z.object({})) {
  return z.object({
    responseCode: COMMON_PATTERNS.responseCode,
    message: COMMON_PATTERNS.message,
    data: dataSchema.optional(),
  });
}

export function apiListResponse(itemSchema = z.object({})) {
  return z.object({
    responseCode: COMMON_PATTERNS.responseCode,
    message: COMMON_PATTERNS.message,
    data: z.object({
      products: zArr(itemSchema),
    }),
  });
}

export function apiErrorResponse() {
  return z.object({
    responseCode: COMMON_PATTERNS.responseCode,
    message: COMMON_PATTERNS.message,
  });
}

/**
 * Common entity schemas
 */

export const productBaseSchema = z.object({
  id: COMMON_PATTERNS.id,
  name: COMMON_PATTERNS.name,
  price: zNum().positive(),
  category: COMMON_PATTERNS.name.optional(),
  image: z.string().optional(),
});

export const brandBaseSchema = z.object({
  id: COMMON_PATTERNS.id,
  brand: COMMON_PATTERNS.name,
});

export const userBaseSchema = z.object({
  id: COMMON_PATTERNS.id,
  email: COMMON_PATTERNS.email,
  firstName: COMMON_PATTERNS.name.optional(),
  lastName: COMMON_PATTERNS.name.optional(),
  createdAt: COMMON_PATTERNS.createdAt,
});
