import { View } from 'react-native';

import { Text } from '@/components/nativewindui/Text';

export default function AnalyticsScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-background p-6">
      <Text variant="title2" className="font-semibold">
        Analytics
      </Text>
      <Text variant="subhead" color="tertiary" className="text-center">
        KPIs, funnel, and the Finance / Ads drill-in cards will live here.
      </Text>
    </View>
  );
}
