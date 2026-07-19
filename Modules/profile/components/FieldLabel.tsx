import { View } from 'react-native';

import { Text } from '@/components/nativewindui/Text';

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <View className="px-1">
      <Text variant="caption1" color="tertiary">
        {children}
      </Text>
    </View>
  );
}
