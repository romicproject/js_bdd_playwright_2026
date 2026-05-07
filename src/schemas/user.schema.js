// support/schemas/user.schema.js
import { z } from "zod";
import { zStatusCode, zStr } from "./helpers.js";

/**
 * Schema for user creation success
 */
export const userCreatedSchema = z.object({
  responseCode: zStatusCode(201),
  message: zStr("Message"),
});

/**
 * Schema for login success
 */
export const loginSuccessSchema = z.object({
  responseCode: zStatusCode(200),
  message: zStr("Message"),
});

/**
 * Schema for delete success
 */
export const deleteSuccessSchema = z.object({
  responseCode: zStatusCode(200),
  message: zStr("Message"),
});
