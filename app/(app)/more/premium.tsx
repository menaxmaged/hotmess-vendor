import { Alert, Pressable, ScrollView, View } from 'react-native';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Button } from '@/components/nativewindui/Button';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/format';
import { useHomeSubscriptionSummary } from '@/Modules/home/hooks';

const COMPARISON: { feature: string; free: string; premium: string }[] = [
  { feature: 'Profile listing', free: 'Basic', premium: 'Enhanced + Verified badge' },
  { feature: 'Search ranking', free: 'Standard', premium: 'Boosted 2×' },
  { feature: 'Inbox', free: 'Basic chats', premium: 'Assign · filters · notes · reminders' },
  { feature: 'Saved replies', free: '—', premium: 'Unlimited' },
  { feature: 'Automation', free: 'Welcome message only', premium: 'Welcome + questions + files' },
  { feature: 'Team', free: 'Owner only', premium: 'Up to 10 seats, custom roles' },
  { feature: 'Finance', free: 'Basic tracking', premium: 'Advanced reports + export' },
  { feature: 'Analytics', free: 'Basic metrics', premium: 'Conversion rates + campaign insights' },
];

export default function PremiumScreen() {
  const { data, isLoading, isError, error } = useHomeSubscriptionSummary();

  const onCancel = () => {
    Alert.alert(
      'Cancel Premium?',
      "You'll lose the verified badge, boosted ranking, team roles, and conversion analytics. Your profile stays live on the Free plan and your data is kept.",
      [
        { text: 'Keep Premium', style: 'cancel' },
        { text: 'Confirm cancel', style: 'destructive', onPress: () => {} },
      ],
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text color="tertiary">{getErrorMessage(error)}</Text>
      </View>
    );
  }

  const isPremium = data.plan === 'premium';

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4">
      <View className="gap-2 rounded-xl border border-border bg-card p-4">
        <View className="flex-row items-center justify-between">
          <Text variant="title2" className="font-bold capitalize">
            {data.plan}
          </Text>
          {isPremium ? (
            <View className="flex-row items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 dark:bg-amber-950">
              <Icon name="star.fill" size={12} color="#B45309" />
              <Text variant="caption2" className="font-medium text-amber-700 dark:text-amber-300">
                Verified
              </Text>
            </View>
          ) : null}
        </View>
        {isPremium && data.renewalDate ? (
          <Text variant="footnote" color="tertiary">
            {`Renews ${formatDate(data.renewalDate)}${data.price ? ` · ${formatCurrency(data.price)}` : ''}`}
          </Text>
        ) : (
          <Text variant="footnote" color="tertiary">
            Upgrade to unlock team roles, automation, and conversion analytics.
          </Text>
        )}
      </View>

      <View className="overflow-hidden rounded-xl border border-border">
        <View className="flex-row bg-muted px-3 py-2">
          <Text variant="caption2" color="tertiary" className="flex-[1.2] font-medium">
            FEATURE
          </Text>
          <Text variant="caption2" color="tertiary" className="flex-1 font-medium">
            FREE
          </Text>
          <Text variant="caption2" color="tertiary" className="flex-[1.4] font-medium">
            PREMIUM
          </Text>
        </View>
        {COMPARISON.map((row, index) => (
          <View
            key={row.feature}
            className={`flex-row bg-card px-3 py-2.5 ${
              index < COMPARISON.length - 1 ? 'border-b border-border' : ''
            }`}>
            <Text variant="caption1" className="flex-[1.2] font-medium">
              {row.feature}
            </Text>
            <Text variant="caption1" color="tertiary" className="flex-1">
              {row.free}
            </Text>
            <Text variant="caption1" className="flex-[1.4]">
              {row.premium}
            </Text>
          </View>
        ))}
      </View>

      {isPremium ? (
        <>
          <Button variant="secondary">
            <Text>Change payment method</Text>
          </Button>
          <Pressable onPress={onCancel}>
            <Text variant="footnote" className="text-center text-destructive">
              Switch plan / cancel
            </Text>
          </Pressable>
        </>
      ) : (
        <Button>
          <Text>Upgrade to Premium</Text>
        </Button>
      )}
    </ScrollView>
  );
}
