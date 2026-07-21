import { router } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/nativewindui/Text';

const DISPLAY = 'font-display';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      {/* Logo mark */}
      <View
        className="flex-1 items-center justify-center"
        style={{ paddingTop: insets.top }}>
        <Text className={`${DISPLAY} text-foreground`} style={{ fontSize: 88 }}>
          hm<Text className={`${DISPLAY} text-primary`} style={{ fontSize: 88 }}>!</Text>
        </Text>
        <Text variant="caption1" className="mt-2 font-bold uppercase tracking-[3px] text-muted-foreground">
          Vendor Studio
        </Text>
      </View>

      {/* Wine call-to-action panel */}
      <View
        className="items-center gap-5 rounded-t-[40px] bg-secondary px-8 pt-12"
        style={{ paddingBottom: insets.bottom + 32 }}>
        <Text className={`${DISPLAY} text-center text-white`} style={{ fontSize: 40, lineHeight: 42 }}>
          hot mess.
        </Text>

        <Pressable
          onPress={() => router.push('/login')}
          className="w-full items-center rounded-2xl bg-primary py-4 active:opacity-80">
          <Text className="text-white" style={{ fontSize: 17, fontWeight: '700' }}>
            Sign In
          </Text>
        </Pressable>

        <Pressable onPress={() => Linking.openURL('https://hotmessbride.com')}>
          <Text variant="footnote" className="text-center text-white/80">
            Don’t have an account? Onboard on{'\n'}
            <Text variant="footnote" className="font-semibold text-white underline">
              hotmessbride.com
            </Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
