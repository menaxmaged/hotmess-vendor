import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/Modules/auth/context';
import { getErrorMessage } from '@/lib/api-client';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';

const DISPLAY = 'font-display';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const { signIn } = useAuth();
  const { colors } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = !isSubmitting && !!email && !!password;

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ flexGrow: 1 }}
      bottomOffset={24}>
      {/* Pink brand header */}
      <View
        className="items-center justify-center bg-secondary px-6 pb-12"
        style={{ paddingTop: insets.top + 48 }}>
        <Text className={`${DISPLAY} text-white`} style={{ fontSize: 40, lineHeight: 44 }}>
          {t('login.hero')}<Text className={`${DISPLAY} text-primary`} style={{ fontSize: 40 }}>.</Text>
        </Text>
      </View>

      {/* Form body */}
      <View className="flex-1 gap-5 bg-background px-6 pt-10">
        <Text className={`${DISPLAY} text-foreground`} style={{ fontSize: 26 }}>
          {t('login.title')}
        </Text>

        <View className="gap-3">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('login.email')}
            placeholderTextColor={colors.grey}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            className="rounded-xl bg-muted px-4 py-4 text-foreground"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('login.password')}
            placeholderTextColor={colors.grey}
            secureTextEntry
            autoCapitalize="none"
            className="rounded-xl bg-muted px-4 py-4 text-foreground"
          />
        </View>

        <Pressable
          className="self-end"
          onPress={() =>
            router.push(
              `/(auth)/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}` as Href,
            )
          }>
          <Text variant="footnote" className="font-semibold text-foreground">
            {t('login.forgot')}
          </Text>
        </Pressable>

        {error ? (
          <Text variant="footnote" className="text-destructive">
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          className={`items-center rounded-xl bg-primary py-4 ${canSubmit ? 'active:opacity-80' : 'opacity-50'}`}>
          <Text className="text-white" style={{ fontSize: 17, fontWeight: '700' }}>
            {isSubmitting ? t('login.submitting') : t('login.submit')}
          </Text>
        </Pressable>

        <Pressable className="mt-2 items-center" onPress={() => router.push('/(auth)/signup' as Href)}>
          <Text variant="footnote" color="tertiary">
            {t('login.noAccount')}{' '}
            <Text variant="footnote" className="font-semibold text-secondary underline">
              {t('login.createStudio')}
            </Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
}
