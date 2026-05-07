// schemas/helpers.js
/**
 * Zod schema helpers to reduce verbosity
 */
import { z } from "zod";

/**
 * Create a required string schema with error messages
 */
export function zStr(label) {
  return z.string({
    required_error: `${label} is required`,
    invalid_type_error: `${label} must be a string`,
  });
}

/**
 * Create a required number schema with error messages
 */
export function zNum(label) {
  return z.number({
    required_error: `${label} is required`,
    invalid_type_error: `${label} must be a number`,
  });
}

/**
 * Create a required array schema with error messages
 */
export function zArr(itemSchema, label) {
  return z.array(itemSchema, {
    required_error: `${label} is required`,
    invalid_type_error: `${label} must be an array`,
  });
}

/**
 * Create a literal number schema (e.g., for status codes)
 */
export function zStatusCode(code, label = "Response code") {
  return z.literal(code, {
    errorMap: () => ({
      message: `${label} must be ${code}`,
    }),
  });
}
