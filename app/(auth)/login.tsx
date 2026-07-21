import { useState } from 'react';
import { Linking, Pressable, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/Modules/auth/context';
import { getErrorMessage } from '@/lib/api-client';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';

const DISPLAY = 'font-display';

export default function LoginScreen() {
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
      contentContainerClassName="flex-grow"
      bottomOffset={24}>
      {/* Pink brand header */}
      <View
        className="items-center justify-center bg-secondary px-6 pb-12"
        style={{ paddingTop: insets.top + 48 }}>
        <Text className={`${DISPLAY} text-white`} style={{ fontSize: 40, lineHeight: 44 }}>
          welcome{'\n'}back<Text className={`${DISPLAY} text-primary`} style={{ fontSize: 40 }}>.</Text>
        </Text>
      </View>

      {/* Form body */}
      <View className="flex-1 gap-5 bg-background px-6 pt-10">
        <Text className={`${DISPLAY} text-foreground`} style={{ fontSize: 26 }}>
          sign in to your studio
        </Text>

        <View className="gap-3">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.grey}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            className="rounded-xl bg-muted px-4 py-4 text-foreground"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.grey}
            secureTextEntry
            autoCapitalize="none"
            className="rounded-xl bg-muted px-4 py-4 text-foreground"
          />
        </View>

        <Pressable className="self-end" onPress={() => {}}>
          <Text variant="footnote" className="font-semibold text-foreground">
            Forgot password?
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
            {isSubmitting ? 'Signing in…' : 'Continue'}
          </Text>
        </Pressable>

        <Pressable
          className="mt-2 items-center"
          onPress={() => Linking.openURL('https://hotmessbride.com')}>
          <Text variant="footnote" color="tertiary">
            Don’t have an account? Onboard on{' '}
            <Text variant="footnote" className="font-semibold text-secondary underline">
              hotmessbride.com
            </Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
}
