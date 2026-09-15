import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/brand';
import { Text } from '@/components/nativewindui/Text';
import { Toggle } from '@/components/nativewindui/Toggle';
import { getErrorMessage } from '@/lib/api-client';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/Modules/notifications/hooks';
import type {
  NotificationPreference,
  NotificationPreferenceType,
} from '@/Modules/notifications/types';

const KNOWN_TYPES: NotificationPreferenceType[] = [
  'vendor_new_enquiry',
  'vendor_chat_assigned',
  'vendor_follow_up_due',
  'vendor_instagram_disconnected',
  'vendor_campaign_live',
  'unread_message',
  'meeting_accepted',
  'subscription_expiry',
  'platform_notice',
  'task_deadline',
  'task_overdue',
  'bridesmaid_task_completed',
  'occasion_countdown',
];

type Channel = 'push' | 'email' | 'inApp';

const CHANNELS: Channel[] = ['push', 'email', 'inApp'];

export default function NotificationPreferencesScreen() {
  const { t } = useTranslation('studio');
  const { data, isLoading, isError, error, refetch } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();
  // Local edits; null means "showing what the server has".
  const [draft, setDraft] = useState<NotificationPreference[] | null>(null);

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  const rows = draft ?? data;

  const toggle = (type: NotificationPreferenceType, channel: Channel, value: boolean) =>
    setDraft(rows.map((p) => (p.type === type ? { ...p, [channel]: value } : p)));

  const onSave = () => {
    if (!draft) return;
    update.mutate(draft, {
      onSuccess: () => setDraft(null),
      onError: (err) => Alert.alert(t('saveFailed'), getErrorMessage(err)),
    });
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-3 p-4 pb-28">
        <Text variant="footnote" color="tertiary">
          {t('prefs.intro')}
        </Text>
        {rows.map((pref) => {
          const label = KNOWN_TYPES.includes(pref.type)
            ? { title: t(`prefs.types.${pref.type}.title`), description: t(`prefs.types.${pref.type}.description`) }
            : { title: pref.type.replace(/_/g, ' '), description: '' };
          return (
            <View key={pref.type} className="gap-2.5 rounded-xl border border-border bg-card p-4">
              <View className="gap-0.5">
                <Text variant="subhead" className="font-semibold">
                  {label.title}
                </Text>
                {label.description ? (
                  <Text variant="caption1" color="tertiary">
                    {label.description}
                  </Text>
                ) : null}
              </View>
              <View className="flex-row flex-wrap justify-between gap-x-3 gap-y-2">
                {CHANNELS.map((channel) => (
                  <View key={channel} className="flex-row items-center gap-2">
                    <Text variant="footnote">{t(`prefs.channels.${channel}`)}</Text>
                    <Toggle value={pref[channel]} onValueChange={(v) => toggle(pref.type, channel, v)} />
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {draft ? (
        <View className="absolute bottom-0 left-0 right-0 flex-row gap-2 border-t border-border bg-background p-4">
          <Pressable
            onPress={() => setDraft(null)}
            className="items-center rounded-xl border border-border px-5 py-3.5">
            <Text className="font-semibold">{t('prefs.discard')}</Text>
          </Pressable>
          <Pressable
            onPress={onSave}
            disabled={update.isPending}
            className={`flex-1 items-center rounded-xl bg-primary py-3.5 ${update.isPending ? 'opacity-50' : ''}`}>
            <Text className="font-bold text-white">{update.isPending ? t('saving') : t('prefs.save')}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
