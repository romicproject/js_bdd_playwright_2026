// support/schemas/error.schema.js
import { z } from 'zod';

/**
 * Generic schema for error responses
 */
export const errorResponseSchema = z.object({
    responseCode: z.number({
        required_error: "Response code is required",
        invalid_type_error: "Response code must be a number"
    }).int().positive(),
    message: z.string({
        required_error: "Message is required",
        invalid_type_error: "Message must be a string"
    })
}).strict();

/**
 * Schema for specific errors
 */
export const badRequestSchema = z.object({
    responseCode: z.literal(400),
    message: z.string({
        required_error: "Message is required",
        invalid_type_error: "Message must be a string"
    })
}).strict();

export const notFoundSchema = z.object({
    responseCode: z.literal(404),
    message: z.string({
        required_error: "Message is required",
        invalid_type_error: "Message must be a string"
    })
}).strict();

export const conflictSchema = z.object({
    responseCode: z.literal(409),
    message: z.string({
        required_error: "Message is required",
        invalid_type_error: "Message must be a string"
    })
}).strict();

/**
 * Union type for all possible errors
 */
export const anyErrorSchema = z.union([
    badRequestSchema,
    notFoundSchema,
    conflictSchema,
    errorResponseSchema
]);