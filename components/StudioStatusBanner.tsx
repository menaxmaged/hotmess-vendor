import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { useStudioStatus } from '@/Modules/profile/hooks';

const TONE = {
  pending: {
    box: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950',
    title: 'text-amber-800 dark:text-amber-300',
    body: 'text-amber-700 dark:text-amber-400',
    icon: '#B45309',
  },
  suspended: {
    box: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950',
    title: 'text-red-800 dark:text-red-300',
    body: 'text-red-700 dark:text-red-400',
    icon: '#B91C1C',
  },
  delisted: {
    box: 'border-border bg-muted',
    title: 'text-foreground',
    body: 'text-muted-foreground',
    icon: '#6B7280',
  },
} as const;

/**
 * Explains a studio that brides can't see (pending review, suspended, delisted).
 * Renders nothing for an active studio. The server enforces the restrictions;
 * this only tells the vendor why enquiries stopped or chats won't send.
 */
export function StudioStatusBanner({ className = '' }: { className?: string }) {
  const { t } = useTranslation('studio');
  const status = useStudioStatus();
  if (status === 'active') return null;
  const tone = TONE[status];

  return (
    <View className={`flex-row gap-3 rounded-xl border p-3.5 ${tone.box} ${className}`}>
      <Icon name="exclamationmark" size={16} color={tone.icon} />
      <View className="flex-1 gap-0.5">
        <Text variant="subhead" className={`font-semibold ${tone.title}`}>
          {t(`status.${status}Title`)}
        </Text>
        <Text variant="caption1" className={tone.body}>
          {t(`status.${status}Body`)}
        </Text>
      </View>
    </View>
  );
}
