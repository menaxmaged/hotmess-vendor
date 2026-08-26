import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { useColorScheme } from '@/lib/useColorScheme';
import { useCompleteChecklistItem, useOnboardingChecklist } from '@/Modules/onboarding-checklist/hooks';
import type { ChecklistItem } from '@/Modules/onboarding-checklist/types';

export default function OnboardingChecklistScreen() {
  const router = useRouter();
  const { colors } = useColorScheme();
  const { data: items, isLoading, isError, error, refetch } = useOnboardingChecklist();
  const completeItem = useCompleteChecklistItem();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !items) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background p-6">
        <Text color="tertiary" className="text-center">
          {getErrorMessage(error)}
        </Text>
        <Pressable onPress={() => refetch()}>
          <Text className="text-primary">Try again</Text>
        </Pressable>
      </View>
    );
  }

  const completed = items.filter((i) => i.completedAt).length;

  const openItem = (item: ChecklistItem) => {
    if (item.deepLink) {
      router.push(item.deepLink as Href);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4">
      <View className="gap-1">
        <Text variant="title2" className="font-bold">
          {`${completed} of ${items.length} steps done`}
        </Text>
        <Text variant="footnote" color="tertiary">
          Finish setting up your studio so brides can find and book you.
        </Text>
      </View>

      <View className="overflow-hidden rounded-xl border border-border bg-card">
        {items.map((item, index) => {
          const done = !!item.completedAt;
          return (
            <View
              key={item.id}
              className={`flex-row items-start gap-3 p-4 ${
                index < items.length - 1 ? 'border-b border-border' : ''
              }`}>
              <Pressable
                onPress={() => !done && completeItem.mutate(item.id)}
                disabled={done || completeItem.isPending}
                className={`mt-0.5 h-6 w-6 items-center justify-center rounded-full border-2 ${
                  done ? 'border-primary bg-primary' : 'border-border'
                }`}>
                {done ? <Icon name="checkmark" size={13} color="#fff" /> : null}
              </Pressable>
              <Pressable className="flex-1" onPress={() => openItem(item)} disabled={!item.deepLink}>
                <View className="flex-row items-center gap-2">
                  <Text
                    variant="subhead"
                    className={`font-medium ${done ? 'text-muted-foreground line-through' : ''}`}>
                    {item.labelEn}
                  </Text>
                  {item.isRequired && !done ? (
                    <View className="rounded-full bg-amber-100 px-1.5 dark:bg-amber-950">
                      <Text variant="caption2" className="font-bold text-amber-700 dark:text-amber-300">
                        Required
                      </Text>
                    </View>
                  ) : null}
                </View>
                {item.descriptionEn ? (
                  <Text variant="caption1" color="tertiary">
                    {item.descriptionEn}
                  </Text>
                ) : null}
              </Pressable>
              {item.deepLink ? (
                <Icon name="chevron.right" size={14} color={colors.grey} />
              ) : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
