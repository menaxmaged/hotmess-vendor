import i18n, { localeTag } from '@/lib/i18n';

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return i18n.t('common:time.now');
  if (diffMin < 60) return i18n.t('common:time.minutesShort', { count: diffMin });
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return i18n.t('common:time.hoursShort', { count: diffHr });
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return i18n.t('common:time.daysShort', { count: diffDay });
  return date.toLocaleDateString(localeTag(), { month: 'short', day: 'numeric' });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(localeTag(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(localeTag(), {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number, currency = 'EGP'): string {
  return `${currency} ${amount.toLocaleString(localeTag())}`;
}
