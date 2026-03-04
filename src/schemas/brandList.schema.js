// support/schemas/brandList.schema.js
import { z } from 'zod';
import { brandSchema } from './brand.schema.js';

/**
 * Schema for a list of brands
 */
export const brandListSchema = z.object({
    responseCode: z.number({
        required_error: "Response code is required",
        invalid_type_error: "Response code must be a number"
    }),

    brands: z.array(brandSchema, {
        required_error: "Brands array is required",
        invalid_type_error: "Brands must be an array"
    })
});