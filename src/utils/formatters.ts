export function formatSeconds(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function formatShortDate(timestamp: number | Date): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTimeOnly(timestamp: number | Date): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getRelativeTime(timestamp: number): string {
  const elapsedMs = Date.now() - timestamp;
  const elapsedSecs = Math.floor(elapsedMs / 1000);
  const elapsedMins = Math.floor(elapsedSecs / 60);
  const elapsedHours = Math.floor(elapsedMins / 60);
  const elapsedDays = Math.floor(elapsedHours / 24);

  if (elapsedHours < 1) {
    return `${Math.max(1, elapsedMins)}m ago`;
  }
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }
  return `${elapsedDays}d ago`;
}
