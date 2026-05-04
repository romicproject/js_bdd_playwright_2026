import { redactSensitiveDeep } from "../http/redact.js";

export function validateSchema(data, schema, options = {}) {
  const { throwOnError = false, logger } = options;
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues;
    const redactedData = redactSensitiveDeep(data);
    const errorLines = [
      "[Schema] Validation failed:",
      `Data: ${JSON.stringify(redactedData, null, 2)}`,
      `Errors: ${JSON.stringify(errors, null, 2)}`,
    ];

    if (logger?.error) {
      logger.error(errorLines.join("\n"));
    } else {
      console.error("[Schema] Validation failed:");
      console.error("Data:", JSON.stringify(redactedData, null, 2));
      console.error("Errors:", JSON.stringify(errors, null, 2));
    }

    if (throwOnError) {
      throw new Error(
        `[VALIDATION] Schema validation failed: ${errors.map((error) => error.message).join(", ")}`,
      );
    }

    return {
      valid: false,
      errors,
      formattedErrors: formatZodErrors(errors),
    };
  }

  return {
    valid: true,
    data: result.data,
  };
}

function formatZodErrors(errors) {
  return errors.map((error) => ({
    path: error.path.join("."),
    message: error.message,
    expected: error.expected,
    received: error.received,
  }));
}
