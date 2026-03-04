// support/schemas/product.schema.js
import { z } from 'zod';

/**
 * Schema for a single product
 */
export const productSchema = z.object({
    id: z.number({
        required_error: "Product ID is required",
        invalid_type_error: "Product ID must be a number"
    }),

    name: z.string({
        required_error: "Product name is required",
        invalid_type_error: "Product name must be a string"
    }).min(1, "Product name cannot be empty"),

    price: z.string({
        required_error: "Product price is required",
        invalid_type_error: "Product price must be a string"
    }),

    brand: z.string({
        required_error: "Product brand is required",
        invalid_type_error: "Product brand must be a string"
    }),

    category: z.object({
        usertype: z.object({
            usertype: z.string({
                required_error: "Category user type is required",
                invalid_type_error: "Category user type must be a string"
            })
        }),
        category: z.string({
            required_error: "Category name is required",
            invalid_type_error: "Category name must be a string"
        })
    })
});

/**
 * Schema for partial validation (when some fields may be missing)
 */
export const partialProductSchema = productSchema.partial();