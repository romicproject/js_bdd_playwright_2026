// utils/schemaValidator.js

const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'pwd',
  'token',
  'api_key',
  'apikey',
  'authorization',
  'email'
]);

function redactSensitive(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map((item) => redactSensitive(item));
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => {
        const isSensitive = SENSITIVE_KEYS.has(String(key).toLowerCase());
        return [key, isSensitive ? '***' : redactSensitive(val)];
      })
    );
  }
  return value;
}

export function validateSchema(data, schema, options = {}) {
  const { throwOnError = false } = options;

  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues;

    console.error('❌ Schema validation failed:');
    console.error('Data:', JSON.stringify(redactSensitive(data), null, 2));
    console.error('Errors:', JSON.stringify(errors, null, 2));

    if (throwOnError) {
      throw new Error(
        `Schema validation failed: ${errors.map(e => e.message).join(', ')}`
      );
    }

    return {
      valid: false,
      errors: errors,
      formattedErrors: formatZodErrors(errors)
    };
  }

  return {
    valid: true,
    data: result.data
  };
}

/**
 * Format Zod errors for clearer logging
 */
function formatZodErrors(errors) {
  return errors.map(error => ({
    path: error.path.join('.'),
    message: error.message,
    expected: error.expected,
    received: error.received
  }));
}

/**
 * Validate and throw if invalid (for scenarios where you want fail fast)
 */
export function validateSchemaStrict(data, schema) {
  return validateSchema(data, schema, { throwOnError: true });
}

/**
 * Validate only the structure (ignore specific values)
 */
export function validateSchemaShape(data, schema) {
  // Use partial to allow missing fields
  if (schema && typeof schema.partial === 'function') {
    return validateSchema(data, schema.partial());
  }
  return validateSchema(data, schema);
}