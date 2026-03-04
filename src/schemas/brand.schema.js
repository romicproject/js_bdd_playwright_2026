// support/schemas/brand.schema.js
import { z } from 'zod';

/**
 * Schema for a single brand
 */
export const brandSchema = z.object({
    id: z.number({
        required_error: "Brand ID is required",
        invalid_type_error: "Brand ID must be a number"
    }),

    brand: z.string({
        required_error: "Brand name is required",
        invalid_type_error: "Brand name must be a string"
    }).min(1, "Brand name cannot be empty")
});