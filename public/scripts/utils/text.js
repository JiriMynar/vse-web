export function truncate(text, length) {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length)}…` : text;
}
