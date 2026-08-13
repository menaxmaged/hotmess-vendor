import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';

import { Card, DISPLAY, SectionLabel } from '@/components/brand';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { useMergeFields, useSetWelcomeFlow, useWelcomeFlow } from '@/Modules/automation/hooks';
import type { WelcomeFlow, WelcomeFlowMode } from '@/Modules/automation/types';
import { useSubscription } from '@/Modules/subscription/hooks';
import { getErrorMessage } from '@/lib/api-client';
import { useColorScheme } from '@/lib/useColorScheme';

type Mode = 'off' | 'welcome' | 'welcome_q' | 'welcome_files' | 'full';

const MODES: { key: Mode; label: string; desc: string; premium: boolean }[] = [
  { key: 'off', label: 'Off', desc: 'No auto-reply. Manual response only.', premium: false },
  { key: 'welcome', label: 'Welcome only', desc: 'Sends a greeting with personalised merge fields.', premium: false },
  { key: 'welcome_q', label: 'Welcome + questions', desc: 'Greeting, then 2–5 intake questions.', premium: true },
  { key: 'welcome_files', label: 'Welcome + files', desc: 'Greeting, then attaches a lookbook or deck.', premium: true },
  { key: 'full', label: 'Welcome + questions + files', desc: 'Full intake sequence.', premium: true },
];

const MODE_TO_REAL: Record<Mode, WelcomeFlowMode> = {
  off: 'off',
  welcome: 'welcome',
  welcome_q: 'welcome_questions',
  welcome_files: 'welcome_files',
  full: 'welcome_questions_files',
};

const REAL_TO_MODE: Record<WelcomeFlowMode, Mode> = {
  off: 'off',
  welcome: 'welcome',
  welcome_questions: 'welcome_q',
  welcome_files: 'welcome_files',
  welcome_questions_files: 'full',
};

export default function AutomationScreen() {
  const { data: flow, isLoading, isError, error } = useWelcomeFlow();
  const { data: mergeFields } = useMergeFields();
  const { data: sub } = useSubscription();
  const isPremium = sub?.isPremium ?? false;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !flow) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text color="tertiary">{getErrorMessage(error)}</Text>
      </View>
    );
  }

  return (
    <AutomationForm
      initial={flow}
      mergeFieldTokens={(mergeFields ?? []).map((f) => f.token)}
      isPremium={isPremium}
    />
  );
}

function AutomationForm({
  initial,
  mergeFieldTokens,
  isPremium,
}: {
  initial: WelcomeFlow;
  mergeFieldTokens: string[];
  isPremium: boolean;
}) {
  const { colors } = useColorScheme();
  const setWelcomeFlow = useSetWelcomeFlow();

  const [mode, setMode] = useState<Mode>(REAL_TO_MODE[initial.mode]);
  const [message, setMessage] = useState(initial.message ?? '');
  const [questions, setQuestions] = useState<string[]>(initial.questions.map((q) => q.prompt));
  const [newQuestion, setNewQuestion] = useState('');

  const showQuestions = mode === 'welcome_q' || mode === 'full';

  const selectMode = (m: Mode, premium: boolean) => {
    if (premium && !isPremium) {
      Alert.alert('Premium feature', 'Upgrade to Premium to unlock this automation mode.');
      return;
    }
    setMode(m);
  };

  const insertField = (field: string) => setMessage((prev) => `${prev} ${field}`);
  const addQuestion = () => {
    const q = newQuestion.trim();
    if (!q || questions.length >= 6) return;
    setQuestions((prev) => [...prev, q]);
    setNewQuestion('');
  };

  const onSave = () => {
    setWelcomeFlow.mutate(
      {
        mode: MODE_TO_REAL[mode],
        message: mode === 'off' ? null : message,
        questions: showQuestions ? questions.map((prompt) => ({ prompt, isRequired: false })) : [],
        fileIds: [],
      },
      {
        onSuccess: () => Alert.alert('Saved', 'Your automation settings have been saved.'),
        onError: (err) => Alert.alert('Save failed', getErrorMessage(err)),
      },
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 px-5 pb-8 pt-4"
      showsVerticalScrollIndicator={false}>
      <View>
        <SectionLabel>Automation mode</SectionLabel>
        <View className="gap-2">
          {MODES.map((m) => {
            const on = mode === m.key;
            const locked = m.premium && !isPremium;
            return (
              <Pressable
                key={m.key}
                onPress={() => selectMode(m.key, m.premium)}
                className={`flex-row items-center gap-3 rounded-xl border p-3.5 ${on ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                <View className={`h-5 w-5 items-center justify-center rounded-full border-2 ${on ? 'border-primary' : 'border-muted-foreground'}`}>
                  {on ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text variant="footnote" className="font-bold">
                      {m.label}
                    </Text>
                    {m.premium ? (
                      <View className="rounded-full bg-amber-100 px-1.5 dark:bg-amber-950">
                        <Text variant="caption2" className="font-bold text-amber-700 dark:text-amber-300">
                          Premium
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text variant="caption1" color="tertiary">
                    {m.desc}
                  </Text>
                </View>
                {locked ? <Icon name="lock.fill" size={15} color={colors.grey} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {mode !== 'off' ? (
        <View>
          <SectionLabel>Welcome message</SectionLabel>
          <Card className="gap-3">
            <TextInput
              value={message}
              onChangeText={setMessage}
              multiline
              placeholder="Write your greeting…"
              placeholderTextColor={colors.grey}
              className="min-h-[96px] rounded-xl bg-muted px-3 py-3 text-foreground"
              style={{ textAlignVertical: 'top' }}
            />
            <View className="flex-row flex-wrap gap-2">
              {mergeFieldTokens.map((field) => (
                <Pressable
                  key={field}
                  onPress={() => insertField(field)}
                  className="rounded-full border border-border px-2.5 py-1 active:opacity-70">
                  <Text variant="caption2" className="font-medium text-primary">
                    {field}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
        </View>
      ) : null}

      {showQuestions ? (
        <View>
          <SectionLabel>Intake questions · {questions.length}/6</SectionLabel>
          <View className="gap-2">
            {questions.map((q, i) => (
              <View key={`${q}-${i}`} className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3">
                <Text className={`${DISPLAY} text-base text-muted-foreground`}>{i + 1}</Text>
                <Text variant="footnote" className="flex-1">
                  {q}
                </Text>
                <Pressable onPress={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}>
                  <Icon name="trash.fill" size={15} color={colors.grey} />
                </Pressable>
              </View>
            ))}
            {questions.length < 6 ? (
              <View className="flex-row items-center gap-2 rounded-xl border border-border bg-card p-2 pl-3">
                <TextInput
                  value={newQuestion}
                  onChangeText={setNewQuestion}
                  placeholder="Add a question…"
                  placeholderTextColor={colors.grey}
                  className="flex-1 text-foreground"
                  onSubmitEditing={addQuestion}
                />
                <Pressable onPress={addQuestion} className="rounded-lg bg-primary px-3 py-2 active:opacity-80">
                  <Text variant="caption1" className="font-bold text-white">
                    Add
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={onSave}
        disabled={setWelcomeFlow.isPending}
        className={`items-center rounded-2xl bg-primary py-4 ${setWelcomeFlow.isPending ? 'opacity-50' : 'active:opacity-80'}`}>
        <Text className="font-bold text-white">
          {setWelcomeFlow.isPending ? 'Saving…' : 'Save automation'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
