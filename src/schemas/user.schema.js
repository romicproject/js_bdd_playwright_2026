// support/schemas/user.schema.js
import { z } from 'zod';

/**
 * Schema for the response to user creation/verification
 */
export const userResponseSchema = z.object({
    responseCode: z.number({
        required_error: "Response code is required",
        invalid_type_error: "Response code must be a number"
    }).int(),

    message: z.string({
        invalid_type_error: "Message must be a string"
    }).optional()
}).strict();

/**
 * Schema for user creation success
 */
export const userCreatedSchema = z.object({
    responseCode: z.literal(201),
    message: z.string({
        required_error: "Message is required",
        invalid_type_error: "Message must be a string"
    })
});

/**
 * Schema for login success
 */
export const loginSuccessSchema = z.object({
    responseCode: z.literal(200),
    message: z.string({
        required_error: "Message is required",
        invalid_type_error: "Message must be a string"
    })
});

/**
 * Schema for delete success
 */
export const deleteSuccessSchema = z.object({
    responseCode: z.literal(200),
    message: z.string({
        required_error: "Message is required",
        invalid_type_error: "Message must be a string"
    })
});