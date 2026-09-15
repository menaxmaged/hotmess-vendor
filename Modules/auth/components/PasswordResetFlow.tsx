import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';

import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { useColorScheme } from '@/lib/useColorScheme';
import {
  useForgotPassword,
  useResendResetCode,
  useResetPassword,
  useVerifyResetCode,
} from '@/Modules/auth/hooks';

type Step = 'email' | 'code' | 'password';

const INPUT = 'rounded-xl bg-muted px-4 py-4 text-foreground';

/**
 * forgot-password → verify-reset-code → reset-password. Used signed-out (from
 * login) and signed-in (Settings → Change password). A successful reset ends
 * every session, so callers should send the user to sign in afterwards.
 */
export function PasswordResetFlow({
  initialEmail = '',
  lockEmail = false,
  intro,
  onDone,
}: {
  initialEmail?: string;
  lockEmail?: boolean;
  intro?: string;
  onDone: () => void;
}) {
  const { colors } = useColorScheme();
  const { t } = useTranslation('auth');
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const forgot = useForgotPassword();
  const resend = useResendResetCode();
  const verify = useVerifyResetCode();
  const reset = useResetPassword();

  const trimmedEmail = email.trim();
  const emailOk = /^\S+@\S+\.\S+$/.test(trimmedEmail);
  const codeOk = /^\d{6}$/.test(code);
  const passwordOk = password.length >= 8 && password.length <= 128;
  const matches = password === confirm;

  const sendCode = () => {
    setError(null);
    forgot.mutate(trimmedEmail, {
      onSuccess: () => {
        setStep('code');
        // The API answers the same whether or not the address exists.
        setNotice(t('reset.codeSent', { email: trimmedEmail }));
      },
      onError: (err) => setError(getErrorMessage(err)),
    });
  };

  const resendCode = () => {
    setError(null);
    resend.mutate(trimmedEmail, {
      onSuccess: () => {
        setCode('');
        setNotice(t('reset.codeResent'));
      },
      onError: (err) => setError(getErrorMessage(err)),
    });
  };

  const checkCode = () => {
    setError(null);
    verify.mutate(
      { email: trimmedEmail, code },
      {
        onSuccess: (result) => {
          setToken(result.resetToken);
          setNotice(null);
          setStep('password');
        },
        // Wrong, expired and destroyed codes are deliberately one indistinguishable 401.
        onError: () => setError(t('reset.badCode')),
      },
    );
  };

  const savePassword = () => {
    if (!token) return;
    setError(null);
    reset.mutate(
      { token, password },
      {
        onSuccess: onDone,
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <View className="gap-4">
      {step === 'email' ? (
        <>
          <Text variant="footnote" color="tertiary">
            {intro ?? t('reset.intro')}
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            editable={!lockEmail}
            placeholder={t('reset.email')}
            placeholderTextColor={colors.grey}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            className={`${INPUT} ${lockEmail ? 'opacity-60' : ''}`}
          />
          <PrimaryButton
            label={forgot.isPending ? t('reset.sending') : t('reset.sendCode')}
            disabled={!emailOk || forgot.isPending}
            onPress={sendCode}
          />
        </>
      ) : null}

      {step === 'code' ? (
        <>
          {notice ? (
            <Text variant="footnote" color="tertiary">
              {notice}
            </Text>
          ) : null}
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            placeholder={t('reset.codePlaceholder')}
            placeholderTextColor={colors.grey}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            className={`${INPUT} text-center tracking-[8px]`}
          />
          <PrimaryButton
            label={verify.isPending ? t('reset.verifying') : t('reset.verify')}
            disabled={!codeOk || verify.isPending}
            onPress={checkCode}
          />
          <View className="flex-row justify-between">
            <Pressable onPress={() => setStep('email')} disabled={lockEmail}>
              <Text variant="footnote" color="tertiary">
                {lockEmail ? ' ' : t('reset.differentEmail')}
              </Text>
            </Pressable>
            <Pressable onPress={resendCode} disabled={resend.isPending}>
              <Text variant="footnote" className="font-semibold text-foreground">
                {resend.isPending ? t('reset.sending') : t('reset.resend')}
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {step === 'password' ? (
        <>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('reset.newPassword')}
            placeholderTextColor={colors.grey}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            className={INPUT}
          />
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder={t('reset.confirmPassword')}
            placeholderTextColor={colors.grey}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            className={INPUT}
          />
          {confirm.length > 0 && !matches ? (
            <Text variant="footnote" className="text-destructive">
              {t('reset.mismatch')}
            </Text>
          ) : null}
          <PrimaryButton
            label={reset.isPending ? t('reset.saving') : t('reset.setPassword')}
            disabled={!passwordOk || !matches || reset.isPending}
            onPress={savePassword}
          />
        </>
      ) : null}

      {error ? (
        <Text variant="footnote" className="text-destructive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function PrimaryButton({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`items-center rounded-xl bg-primary py-4 ${disabled ? 'opacity-50' : 'active:opacity-80'}`}>
      <Text className="text-white" style={{ fontSize: 17, fontWeight: '700' }}>
        {label}
      </Text>
    </Pressable>
  );
}
