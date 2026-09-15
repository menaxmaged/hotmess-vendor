import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/nativewindui/Text';
import { PasswordResetFlow } from '@/Modules/auth/components/PasswordResetFlow';

const DISPLAY = 'font-display';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ flexGrow: 1 }}
      bottomOffset={24}>
      <View
        className="items-center justify-center bg-secondary px-6 pb-12"
        style={{ paddingTop: insets.top + 48 }}>
        <Text className={`${DISPLAY} text-white`} style={{ fontSize: 40, lineHeight: 44 }}>
          {t('forgot.hero')}<Text className={`${DISPLAY} text-primary`} style={{ fontSize: 40 }}>.</Text>
        </Text>
      </View>

      <View className="flex-1 gap-5 bg-background px-6 pt-10">
        <PasswordResetFlow
          initialEmail={email ?? ''}
          onDone={() => {
            Alert.alert(t('forgot.doneTitle'), t('forgot.doneBody'));
            router.replace('/(auth)/login');
          }}
        />

        <Pressable className="mt-2 items-center" onPress={() => router.back()}>
          <Text variant="footnote" className="font-semibold text-foreground">
            {t('forgot.backToSignIn')}
          </Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
}
