import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/nativewindui/Text';

const DISPLAY = 'font-display';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('auth');

  return (
    <View className="flex-1 bg-background">
      {/* Logo mark */}
      <View
        className="flex-1 items-center justify-center"
        style={{ paddingTop: insets.top }}>
        <Text className={`${DISPLAY} text-foreground`} style={{ fontSize: 88, lineHeight: 104 }}>
          hm<Text className={`${DISPLAY} text-primary`} style={{ fontSize: 88, lineHeight: 104 }}>!</Text>
        </Text>
        <Text variant="caption1" className="mt-2 font-bold uppercase tracking-[3px] text-muted-foreground">
          {t('welcome.tagline')}
        </Text>
      </View>

      {/* Wine call-to-action panel */}
      <View
        className="items-center gap-5 rounded-t-[40px] bg-secondary px-8 pt-12"
        style={{ paddingBottom: insets.bottom + 32 }}>
        <Text className={`${DISPLAY} text-center text-white`} style={{ fontSize: 40, lineHeight: 42 }}>
          {t('welcome.brand')}
        </Text>

        <Pressable
          onPress={() => router.push('/login')}
          className="w-full items-center rounded-2xl bg-primary py-4 active:opacity-80">
          <Text className="text-white" style={{ fontSize: 17, fontWeight: '700' }}>
            {t('welcome.signIn')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(auth)/signup' as Href)}
          className="w-full items-center rounded-2xl border border-white/40 py-4 active:opacity-80">
          <Text className="text-white" style={{ fontSize: 17, fontWeight: '700' }}>
            {t('welcome.createStudio')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
