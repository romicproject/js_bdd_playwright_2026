export function hasHeader(headers, headerName) {
  return Object.keys(headers || {}).some(
    (h) => String(h).toLowerCase() === String(headerName).toLowerCase()
  );
}

export function isFormLike(data) {
  return typeof data === 'string' || data instanceof URLSearchParams;
}