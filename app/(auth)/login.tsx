import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { useAuth } from '@/Modules/auth/context';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { colors } = useColorScheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      contentContainerClassName="flex-1 justify-center gap-6 px-6"
      bottomOffset={24}>
      <View className="gap-1">
        <Text variant="largeTitle" className="font-bold">
          Hot Mess
        </Text>
        <Text variant="subhead" color="tertiary">
          Sign in to manage your studio
        </Text>
      </View>

      <View className="gap-3">
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.grey}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.grey}
          secureTextEntry
          autoCapitalize="none"
          className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
        />
      </View>

      {error ? (
        <Text variant="footnote" className="text-destructive">
          {error}
        </Text>
      ) : null}

      <Button onPress={onSubmit} disabled={isSubmitting || !email || !password}>
        <Text>{isSubmitting ? 'Signing in…' : 'Sign in'}</Text>
      </Button>
    </KeyboardAwareScrollView>
  );
}
