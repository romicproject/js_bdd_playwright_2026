// fixtures/api/helpers/utils.js
export const FORM_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

export function buildForm(data = {}) {
  const form = new URLSearchParams();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      form.append(key, String(value));
    }
  });

  return form;
}

export function formBody(data = {}) {
  return buildForm(data).toString();
}

export function buildSearchParams(searchTerm) {
  const params = new URLSearchParams();

  if (typeof searchTerm === 'string' && searchTerm.length > 0) {
    params.append('search_product', searchTerm);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
