// fixtures/api/helpers/utils.js
export const FORM_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
};

/**
 * Convert data object to URL-encoded form body string.
 * Used for form-encoded POST requests.
 */
export function formBody(data = {}) {
  const form = new URLSearchParams();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      form.append(key, String(value));
    }
  });

  return form.toString();
}

export function buildSearchParams(searchTerm) {
  const params = new URLSearchParams();

  if (typeof searchTerm === "string" && searchTerm.length > 0) {
    params.append("search_product", searchTerm);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
