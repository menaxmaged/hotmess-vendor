import { Pressable } from 'react-native';

import { Text } from '@/components/nativewindui/Text';
import { STATUS_META } from '../status';
import type { LeadStatus } from '../types';

interface StatusPillProps {
  status: LeadStatus;
  onPress?: () => void;
}

export function StatusPill({ status, onPress }: StatusPillProps) {
  const meta = STATUS_META[status];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`self-start rounded-full px-2.5 py-1 ${meta.bgClassName}`}>
      <Text variant="caption2" className={`font-medium ${meta.colorClassName}`}>
        {meta.label}
      </Text>
    </Pressable>
  );
}
