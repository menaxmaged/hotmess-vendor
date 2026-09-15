import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Text } from '@/components/nativewindui/Text';
import { Toggle } from '@/components/nativewindui/Toggle';
import { getErrorMessage } from '@/lib/api-client';
import i18n from '@/lib/i18n';
import { pickBilingual } from '@/lib/localized';
import { useColorScheme } from '@/lib/useColorScheme';
import { useAuth } from '@/Modules/auth/context';
import { useSignupSchema, useVendorSignup } from '@/Modules/auth/hooks';
import {
  cleanAnswers,
  stepErrors,
  visibleFieldKeys,
  type SignupAnswers,
  type SignupAnswerValue,
} from '@/Modules/auth/signup-form';
import type { SignupSchemaField } from '@/Modules/auth/types';

const DISPLAY = 'font-display';
const INPUT = 'rounded-xl bg-muted px-4 py-4 text-foreground';

// Schema copy comes in both languages (`labelEn`/`labelAr`, `titleEn`/`titleAr`, `helpEn`/`helpAr`).
const schemaText = pickBilingual;

interface AccountForm {
  businessName: string;
  contactPersonName: string;
  email: string;
  whatsapp: string;
  password: string;
  confirm: string;
}

// Step 1 is hardcoded by the API and always present; schema steps follow it.
function accountErrors(a: AccountForm): Partial<Record<keyof AccountForm, string>> {
  const e: Partial<Record<keyof AccountForm, string>> = {};
  const name = a.businessName.trim();
  if (name.length < 2 || name.length > 120) e.businessName = i18n.t('auth:signup.errors.businessName');
  const contact = a.contactPersonName.trim();
  if (contact.length < 1 || contact.length > 120) e.contactPersonName = i18n.t('auth:signup.errors.required');
  if (!/^\S+@\S+\.\S+$/.test(a.email.trim())) e.email = i18n.t('auth:signup.errors.email');
  if (!/^\+?[0-9\s-]{8,20}$/.test(a.whatsapp.trim())) e.whatsapp = i18n.t('auth:signup.errors.whatsapp');
  if (a.password.length < 8 || a.password.length > 128) e.password = i18n.t('auth:signup.errors.password');
  if (a.confirm !== a.password) e.confirm = i18n.t('auth:signup.errors.mismatch');
  return e;
}

function signupErrorMessage(error: unknown): string {
  const response = (error as { response?: { status?: number; data?: { details?: { code?: string } } } }).response;
  if (response?.data?.details?.code === 'self_registration_disabled') {
    return i18n.t('auth:signup.closed');
  }
  if (response?.status === 409) return i18n.t('auth:signup.emailTaken');
  return getErrorMessage(error);
}

export default function SignupScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const schemaQuery = useSignupSchema();
  const signup = useVendorSignup();

  const [stepIndex, setStepIndex] = useState(0);
  const [account, setAccount] = useState<AccountForm>({
    businessName: '',
    contactPersonName: '',
    email: '',
    whatsapp: '',
    password: '',
    confirm: '',
  });
  const [answers, setAnswers] = useState<SignupAnswers>({});
  const [showErrors, setShowErrors] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schemaSteps = useMemo(() => schemaQuery.data?.steps ?? [], [schemaQuery.data]);
  const visible = useMemo(() => visibleFieldKeys(schemaSteps, answers), [schemaSteps, answers]);
  const totalSteps = 1 + schemaSteps.length;
  const isLast = stepIndex === totalSteps - 1;
  const schemaStep = stepIndex > 0 ? schemaSteps[stepIndex - 1] : undefined;

  const errors: Record<string, string> = schemaStep
    ? stepErrors(schemaStep, visible, answers)
    : (accountErrors(account) as Record<string, string>);
  const hasErrors = Object.keys(errors).length > 0;

  const setAnswer = (key: string, value: SignupAnswerValue) => setAnswers((prev) => ({ ...prev, [key]: value }));

  const next = () => {
    if (hasErrors) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setSubmitError(null);
    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }
    signup.mutate(
      {
        businessName: account.businessName.trim(),
        contactPersonName: account.contactPersonName.trim(),
        email: account.email.trim(),
        whatsapp: account.whatsapp.trim(),
        password: account.password,
        answers: cleanAnswers(schemaSteps, answers),
      },
      {
        // Same payload as login — the new owner is signed straight in.
        onSuccess: (result) => login(result),
        onError: (err) => setSubmitError(signupErrorMessage(err)),
      },
    );
  };

  const back = () => {
    setShowErrors(false);
    if (stepIndex === 0) router.back();
    else setStepIndex((i) => i - 1);
  };

  const shownError = (key: string) => (showErrors ? errors[key] : undefined);

  return (
    <KeyboardAwareScrollView className="flex-1 bg-background" contentContainerStyle={{ flexGrow: 1 }} bottomOffset={24}>
      <View className="bg-secondary px-6 pb-10" style={{ paddingTop: insets.top + 36 }}>
        <Text className={`${DISPLAY} text-white`} style={{ fontSize: 36, lineHeight: 40 }}>
          {schemaStep ? schemaText(schemaStep, 'title').toLowerCase() : t('signup.hero')}
          <Text className={`${DISPLAY} text-primary`} style={{ fontSize: 36 }}>
            .
          </Text>
        </Text>
        <View className="mt-5 flex-row gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => (
            <View key={i} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-white/25'}`} />
          ))}
        </View>
        <Text variant="caption1" className="mt-2 text-white/70">
          {t('signup.step', { current: stepIndex + 1, total: totalSteps })}
        </Text>
      </View>

      <View className="flex-1 gap-4 bg-background px-6 pt-8" style={{ paddingBottom: insets.bottom + 24 }}>
        {stepIndex === 0 ? (
          <>
            <LabeledInput
              label={t('signup.businessName')}
              value={account.businessName}
              onChangeText={(v) => setAccount({ ...account, businessName: v })}
              error={shownError('businessName')}
            />
            <LabeledInput
              label={t('signup.yourName')}
              value={account.contactPersonName}
              onChangeText={(v) => setAccount({ ...account, contactPersonName: v })}
              error={shownError('contactPersonName')}
            />
            <LabeledInput
              label={t('signup.email')}
              value={account.email}
              onChangeText={(v) => setAccount({ ...account, email: v })}
              keyboardType="email-address"
              autoComplete="email"
              error={shownError('email')}
            />
            <LabeledInput
              label={t('signup.whatsapp')}
              value={account.whatsapp}
              onChangeText={(v) => setAccount({ ...account, whatsapp: v })}
              keyboardType="phone-pad"
              placeholder="+201001234567"
              error={shownError('whatsapp')}
            />
            <LabeledInput
              label={t('signup.password')}
              value={account.password}
              onChangeText={(v) => setAccount({ ...account, password: v })}
              secureTextEntry
              autoComplete="new-password"
              error={shownError('password')}
            />
            <LabeledInput
              label={t('signup.confirmPassword')}
              value={account.confirm}
              onChangeText={(v) => setAccount({ ...account, confirm: v })}
              secureTextEntry
              autoComplete="new-password"
              error={shownError('confirm')}
            />
            {schemaQuery.isLoading ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" />
                <Text variant="caption1" color="tertiary">
                  {t('signup.loadingForm')}
                </Text>
              </View>
            ) : null}
          </>
        ) : schemaStep ? (
          schemaStep.fields
            .filter((field) => visible.has(field.key))
            .map((field) => (
              <SchemaField
                key={field.key}
                field={field}
                value={answers[field.key]}
                onChange={(v) => setAnswer(field.key, v)}
                error={shownError(field.key)}
              />
            ))
        ) : null}

        {submitError ? (
          <Text variant="footnote" className="text-destructive">
            {submitError}
          </Text>
        ) : null}

        <View className="mt-2 flex-row gap-2">
          <Pressable onPress={back} className="items-center rounded-xl border border-border px-6 py-4 active:opacity-80">
            <Text className="font-bold text-foreground">{t('signup.back')}</Text>
          </Pressable>
          <Pressable
            onPress={next}
            disabled={signup.isPending || (stepIndex === 0 && schemaQuery.isLoading)}
            className={`flex-1 items-center rounded-xl bg-primary py-4 ${
              signup.isPending || (stepIndex === 0 && schemaQuery.isLoading) ? 'opacity-50' : 'active:opacity-80'
            }`}>
            <Text className="text-white" style={{ fontSize: 17, fontWeight: '700' }}>
              {signup.isPending ? t('signup.creating') : isLast ? t('signup.create') : t('signup.continue')}
            </Text>
          </Pressable>
        </View>

        <Pressable className="items-center" onPress={() => router.replace('/(auth)/login')}>
          <Text variant="footnote" color="tertiary">
            {t('signup.haveAccount')}{' '}
            <Text variant="footnote" className="font-semibold text-secondary underline">
              {t('signup.signIn')}
            </Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
}

function LabeledInput({
  label,
  error,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; error?: string }) {
  const { colors } = useColorScheme();
  return (
    <View className="gap-1.5">
      <Text variant="caption2" className="font-extrabold uppercase tracking-wide text-muted-foreground">
        {label}
      </Text>
      <TextInput autoCapitalize="none" placeholderTextColor={colors.grey} className={INPUT} {...props} />
      {error ? (
        <Text variant="caption1" className="text-destructive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function SchemaField({
  field,
  value,
  onChange,
  error,
}: {
  field: SignupSchemaField;
  value: SignupAnswerValue | undefined;
  onChange: (value: SignupAnswerValue) => void;
  error?: string;
}) {
  const { colors } = useColorScheme();
  const { t } = useTranslation('auth');
  const label = field.required
    ? schemaText(field, 'label')
    : t('signup.optional', { label: schemaText(field, 'label') });

  let control: React.ReactNode;
  switch (field.type) {
    case 'boolean':
      control = (
        <View className="flex-row items-center justify-between rounded-xl bg-muted px-4 py-3">
          <Text variant="subhead" className="flex-1 pr-3">
            {schemaText(field, 'label')}
          </Text>
          <Toggle value={value === true} onValueChange={onChange} />
        </View>
      );
      break;
    case 'select':
    case 'multiselect': {
      const selected = Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : [];
      control = (
        <View className="flex-row flex-wrap gap-2">
          {(field.options ?? []).map((option) => {
            const on = selected.includes(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  if (field.type === 'select') onChange(option.value);
                  else onChange(on ? selected.filter((v) => v !== option.value) : [...selected, option.value]);
                }}
                className={`rounded-full px-3.5 py-2 ${on ? 'bg-primary' : 'border border-border'}`}>
                <Text variant="caption1" className={`font-bold ${on ? 'text-white' : 'text-foreground'}`}>
                  {schemaText(option, 'label')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
      break;
    }
    default:
      control = (
        <TextInput
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
          placeholderTextColor={colors.grey}
          autoCapitalize={field.type === 'text' || field.type === 'textarea' ? 'sentences' : 'none'}
          keyboardType={
            field.type === 'email'
              ? 'email-address'
              : field.type === 'phone'
                ? 'phone-pad'
                : field.type === 'number'
                  ? 'numeric'
                  : field.type === 'url'
                    ? 'url'
                    : 'default'
          }
          multiline={field.type === 'textarea'}
          maxLength={field.type === 'text' || field.type === 'textarea' ? (field.max ?? undefined) : undefined}
          className={`${INPUT} ${field.type === 'textarea' ? 'min-h-28' : ''}`}
          textAlignVertical={field.type === 'textarea' ? 'top' : 'center'}
        />
      );
  }

  return (
    <View className="gap-1.5">
      {field.type !== 'boolean' ? (
        <Text variant="caption2" className="font-extrabold uppercase tracking-wide text-muted-foreground">
          {label}
        </Text>
      ) : null}
      {control}
      {schemaText(field, 'help') ? (
        <Text variant="caption1" color="tertiary">
          {schemaText(field, 'help')}
        </Text>
      ) : null}
      {error ? (
        <Text variant="caption1" className="text-destructive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
