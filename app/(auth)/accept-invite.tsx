import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { useColorScheme } from '@/lib/useColorScheme';
import { useAuth } from '@/Modules/auth/context';
import { useAcceptInvite } from '@/Modules/team/hooks';

const DISPLAY = 'font-display';

export default function AcceptInviteScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { t } = useTranslation('auth');
  const { colors } = useColorScheme();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const acceptInvite = useAcceptInvite();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background p-6">
        <Text variant="title2" className="text-center font-bold">
          {t('invite.missingToken')}
        </Text>
        <Text variant="footnote" color="tertiary" className="text-center">
          {t('invite.missingTokenHint')}
        </Text>
      </View>
    );
  }

  const canSubmit =
    !acceptInvite.isPending &&
    !!name.trim() &&
    password.length >= 8 &&
    password === confirmPassword;

  const onSubmit = async () => {
    setError(null);
    if (password.length < 8) {
      setError(t('invite.tooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('invite.mismatch'));
      return;
    }
    try {
      const response = await acceptInvite.mutateAsync({ token, name: name.trim(), password });
      login(response);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ flexGrow: 1 }}
      bottomOffset={24}>
      <View
        className="items-center justify-center bg-secondary px-6 pb-12"
        style={{ paddingTop: insets.top + 48 }}>
        <Text className={`${DISPLAY} text-white`} style={{ fontSize: 40, lineHeight: 44 }}>
          {t('invite.hero')}<Text className={`${DISPLAY} text-primary`} style={{ fontSize: 40 }}>.</Text>
        </Text>
      </View>

      <View className="flex-1 gap-5 bg-background px-6 pt-10">
        <Text className={`${DISPLAY} text-foreground`} style={{ fontSize: 26 }}>
          {t('invite.title')}
        </Text>

        <View className="gap-3">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('invite.fullName')}
            placeholderTextColor={colors.grey}
            autoComplete="name"
            className="rounded-xl bg-muted px-4 py-4 text-foreground"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('invite.password')}
            placeholderTextColor={colors.grey}
            secureTextEntry
            autoCapitalize="none"
            className="rounded-xl bg-muted px-4 py-4 text-foreground"
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('invite.confirmPassword')}
            placeholderTextColor={colors.grey}
            secureTextEntry
            autoCapitalize="none"
            className="rounded-xl bg-muted px-4 py-4 text-foreground"
          />
        </View>

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
            {acceptInvite.isPending ? t('invite.submitting') : t('invite.submit')}
          </Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
}
