import { View } from 'react-native';

import { Text } from '@/components/nativewindui/Text';
import { cn } from '@/lib/cn';

const PALETTE = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
];

function hashToIndex(value: string, length: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % length;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

interface InitialsAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export function InitialsAvatar({ name, size = 40, className }: InitialsAvatarProps) {
  const colorClass = PALETTE[hashToIndex(name, PALETTE.length)];

  return (
    <View
      className={cn('items-center justify-center rounded-full', colorClass, className)}
      style={{ width: size, height: size }}>
      <Text style={{ fontSize: size * 0.4 }} className="font-semibold text-white">
        {getInitials(name)}
      </Text>
    </View>
  );
}
