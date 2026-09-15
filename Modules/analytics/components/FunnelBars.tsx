import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { DISPLAY } from '@/components/brand';
import { Text } from '@/components/nativewindui/Text';
import { localeTag } from '@/lib/i18n';
import type { FunnelStage, FunnelStageKey } from '@/Modules/analytics/types';

const STAGE_KEYS: FunnelStageKey[] = ['views', 'saves', 'messages', 'meetings', 'bookings'];

const COLORS = ['#FFE5F0', '#FFC9DD', '#FF85B5', '#FF318A', '#661C33'];

/** GET /vendor/analytics/funnel stages as horizontal bars, scaled to the widest stage. */
export function FunnelBars({ stages }: { stages: FunnelStage[] }) {
  const { t } = useTranslation('insights');
  const max = Math.max(1, ...stages.map((s) => s.count));

  if (stages.length === 0) {
    return (
      <View className="rounded-2xl border border-border bg-card p-3.5">
        <Text variant="footnote" color="tertiary">
          {t('funnel.empty')}
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-2 rounded-2xl border border-border bg-card p-3.5">
      {stages.map((stage, i) => (
        <View key={stage.key} className="gap-1">
          <View className="flex-row items-baseline justify-between">
            <Text variant="footnote" className="font-bold">
              {STAGE_KEYS.includes(stage.key) ? t(`funnel.${stage.key}`) : stage.key}
            </Text>
            <Text className={`${DISPLAY} text-sm`}>{stage.count.toLocaleString(localeTag())}</Text>
          </View>
          <View className="h-3 overflow-hidden rounded-md bg-muted">
            <View
              className="h-full rounded-md"
              style={{
                width: `${Math.max((stage.count / max) * 100, 4)}%`,
                backgroundColor: COLORS[i % COLORS.length],
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
