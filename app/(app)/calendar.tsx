import { View } from 'react-native';

import { Text } from '@/components/nativewindui/Text';

export default function CalendarScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-background p-6">
      <Text variant="title2" className="font-semibold">
        Calendar
      </Text>
      <Text variant="subhead" color="tertiary" className="text-center">
        Month / week / agenda views and event management will live here.
      </Text>
    </View>
  );
}
