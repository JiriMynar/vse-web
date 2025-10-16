const relativeTimeFormatter = new Intl.RelativeTimeFormat('cs', { numeric: 'auto' });
const dateTimeFormatter = new Intl.DateTimeFormat('cs-CZ', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const diff = date.getTime() - Date.now();
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  if (Math.abs(seconds) < 60) {
    return relativeTimeFormatter.format(seconds, 'second');
  }
  if (Math.abs(minutes) < 60) {
    return relativeTimeFormatter.format(minutes, 'minute');
  }
  if (Math.abs(hours) < 24) {
    return relativeTimeFormatter.format(hours, 'hour');
  }
  return relativeTimeFormatter.format(days, 'day');
}

export function formatDateTime(dateString) {
  return dateTimeFormatter.format(new Date(dateString));
}
