import { Pressable } from 'react-native';

import { Text } from '@/components/nativewindui/Text';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 ${
        selected ? 'border-primary bg-primary' : 'border-border bg-card'
      }`}>
      <Text variant="caption1" className={`font-medium ${selected ? 'text-white' : 'text-foreground'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
