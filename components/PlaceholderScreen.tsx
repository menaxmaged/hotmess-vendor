import { View } from 'react-native';

import type { SfSymbols } from 'rn-icon-mapper';

import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';

interface PlaceholderScreenProps {
  icon: SfSymbols;
  title: string;
  description: string;
  bullets?: string[];
}

export function PlaceholderScreen({ icon, title, description, bullets }: PlaceholderScreenProps) {
  const { colors } = useColorScheme();

  return (
    <View className="flex-1 gap-5 bg-background p-6">
      <View className="items-center gap-3 pt-8">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Icon name={icon} size={26} color={colors.primary} />
        </View>
        <Text variant="title2" className="text-center font-semibold">
          {title}
        </Text>
        <Text variant="subhead" color="tertiary" className="text-center">
          {description}
        </Text>
      </View>

      {bullets && bullets.length > 0 ? (
        <View className="gap-2.5 rounded-xl border border-border bg-card p-4">
          {bullets.map((bullet) => (
            <View key={bullet} className="flex-row items-start gap-2">
              <Text color="tertiary">·</Text>
              <Text variant="footnote" color="tertiary" className="flex-1">
                {bullet}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
