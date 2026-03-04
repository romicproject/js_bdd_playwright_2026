function isAbsoluteUrl(url) {
  return /^https?:\/\//i.test(String(url));
}

export function joinUrl(baseUrl, pth) {
  if (isAbsoluteUrl(pth)) return String(pth);

  const base = String(baseUrl || '').replace(/\/+$/, '');
  const p = String(pth || '').startsWith('/') ? String(pth) : `/${pth}`;

  return `${base}${p}`;
}