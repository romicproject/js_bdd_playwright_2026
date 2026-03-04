// support/schemas/productList.schema.js
import { z } from 'zod';
import { productSchema } from './product.schema.js';

/**
 * Schema for a list of products
 * Reuses productSchema for each product in the array
 */
export const productListSchema = z.object({
    responseCode: z.number({
        required_error: "Response code is required",
        invalid_type_error: "Response code must be a number"
    }),

    products: z.array(productSchema, {
        required_error: "Products array is required",
        invalid_type_error: "Products must be an array"
    })
});

/**
 * Schema for search with no results (empty products array is valid)
 */
export const emptyProductListSchema = z.object({
    responseCode: z.number(),
    products: z.array(productSchema).length(0, "Products array should be empty")
});