import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';

export const DISPLAY = 'font-display';

export function BackHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  const { colors } = useColorScheme();
  return (
    <View
      className="flex-row items-center gap-3 border-b border-border bg-background px-4 pb-3"
      style={{ paddingTop: insets.top + 8 }}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)'))}
        className="h-9 w-9 items-center justify-center rounded-full bg-muted">
        <Icon name="chevron.left" size={18} color={colors.foreground} />
      </Pressable>
      <Text className={`${DISPLAY} text-2xl`}>{title}</Text>
    </View>
  );
}

// Tab screens with headerShown: false draw their own title; this keeps them
// clear of the status bar / notch.
export function SafeTop() {
  const insets = useSafeAreaInsets();
  return <View style={{ height: insets.top }} />;
}

export function ScreenTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <View className="px-5 pb-2 pt-2">
      {eyebrow ? (
        <Text variant="caption2" className="font-bold uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </Text>
      ) : null}
      <Text className={`${DISPLAY} text-[26px] leading-tight`}>{title}</Text>
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="caption2" className="mb-2.5 ml-0.5 font-extrabold uppercase tracking-wider">
      {children}
    </Text>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`rounded-2xl border border-border bg-card p-3.5 ${className}`}>{children}</View>
  );
}

export function GradientHero({
  colors = ['#1D1B20', '#661C33'],
  children,
}: {
  colors?: [string, string, ...string[]];
  children: React.ReactNode;
}) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 20, padding: 20, overflow: 'hidden' }}>
      <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      {children}
    </LinearGradient>
  );
}

export function SegmentedRange<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row gap-1.5">
      {options.map((opt) => {
        const on = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            className={`rounded-full px-3.5 py-1.5 ${on ? 'bg-foreground' : 'border border-border'}`}>
            <Text variant="caption1" className={`font-bold ${on ? 'text-background' : 'text-foreground'}`}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function LoadingState() {
  return (
    <View className="flex-1 items-center justify-center gap-2 p-6">
      <ActivityIndicator />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center gap-2 p-6">
      <Text color="tertiary" className="text-center">
        {message}
      </Text>
      <Pressable onPress={onRetry}>
        <Text className="text-primary">{t('actions.retry')}</Text>
      </Pressable>
    </View>
  );
}
