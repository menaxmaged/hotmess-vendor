import { useActionSheet } from '@expo/react-native-action-sheet';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';

import { Card, DISPLAY, SectionLabel } from '@/components/brand';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import {
    useAutoAssignRules,
    useCreateAutoAssignRule,
    useDeleteAutoAssignRule,
    useMergeFields,
    useSetWelcomeFlow,
    useUpdateAutoAssignRule,
    useWelcomeFlow,
} from '@/Modules/automation/hooks';
import type { AutoAssignRule, LeadSource, WelcomeFlow, WelcomeFlowMode } from '@/Modules/automation/types';
import { useCategoryOptions } from '@/Modules/profile/hooks';
import type { CoverageCityOption, CoverageOccasionOption } from '@/Modules/profile/types';
import { useSubscription } from '@/Modules/subscription/hooks';
import { useTeamOverview } from '@/Modules/team/hooks';
import { getErrorMessage } from '@/lib/api-client';
import i18n from '@/lib/i18n';
import { pickBilingual } from '@/lib/localized';
import { useColorScheme } from '@/lib/useColorScheme';

type Mode = 'off' | 'welcome' | 'welcome_q' | 'welcome_files' | 'full';

const MODES: { key: Mode; premium: boolean }[] = [
  { key: 'off', premium: false },
  { key: 'welcome', premium: false },
  { key: 'welcome_q', premium: true },
  { key: 'welcome_files', premium: true },
  { key: 'full', premium: true },
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
  const { t } = useTranslation(['automation', 'common']);
  const setWelcomeFlow = useSetWelcomeFlow();

  const [mode, setMode] = useState<Mode>(REAL_TO_MODE[initial.mode]);
  const [message, setMessage] = useState(initial.message ?? '');
  const [questions, setQuestions] = useState<string[]>(initial.questions.map((q) => q.prompt));
  const [newQuestion, setNewQuestion] = useState('');

  const showQuestions = mode === 'welcome_q' || mode === 'full';

  const selectMode = (m: Mode, premium: boolean) => {
    if (premium && !isPremium) {
      Alert.alert(t('premiumTitle'), t('premiumMode'));
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
        onSuccess: () => Alert.alert(t('savedTitle'), t('savedBody')),
        onError: (err) => Alert.alert(t('saveFailed'), getErrorMessage(err)),
      },
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 px-5 pb-8 pt-4"
      showsVerticalScrollIndicator={false}>
      <View>
        <SectionLabel>{t('modeTitle')}</SectionLabel>
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
                      {t(`modes.${m.key}.label`)}
                    </Text>
                    {m.premium ? (
                      <View className="rounded-full bg-amber-100 px-1.5 dark:bg-amber-950">
                        <Text variant="caption2" className="font-bold text-amber-700 dark:text-amber-300">
                          {t('common:badges.premium')}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text variant="caption1" color="tertiary">
                    {t(`modes.${m.key}.desc`)}
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
          <SectionLabel>{t('welcomeMessage')}</SectionLabel>
          <Card className="gap-3">
            <TextInput
              value={message}
              onChangeText={setMessage}
              multiline
              placeholder={t('messagePlaceholder')}
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
          <SectionLabel>{t('intakeQuestions', { value: questions.length })}</SectionLabel>
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
                  placeholder={t('addQuestionPlaceholder')}
                  placeholderTextColor={colors.grey}
                  className="flex-1 text-foreground"
                  onSubmitEditing={addQuestion}
                />
                <Pressable onPress={addQuestion} className="rounded-lg bg-primary px-3 py-2 active:opacity-80">
                  <Text variant="caption1" className="font-bold text-white">
                    {t('add')}
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
          {setWelcomeFlow.isPending ? t('saving') : t('save')}
        </Text>
      </Pressable>

      <AutoAssignRulesSection isPremium={isPremium} />
    </ScrollView>
  );
}

const LEAD_SOURCES: LeadSource[] = ['browse', 'explore', 'ad', 'task', 'direct'];

const nameOf = (rows: { id: string }[], id: string) => {
  const row = rows.find((r) => r.id === id);
  return row ? pickBilingual(row, 'name') || id : id;
};

function describeCriteria(
  rule: AutoAssignRule,
  cities: CoverageCityOption[],
  occasions: CoverageOccasionOption[],
): string {
  const parts: string[] = [];
  if (rule.criteria.leadSource?.length) {
    parts.push(
      rule.criteria.leadSource
        .map((s) => (LEAD_SOURCES.includes(s) ? i18n.t(`automation:leadSources.${s}`) : s))
        .join('/'),
    );
  }
  if (rule.criteria.cityIds?.length) {
    parts.push(rule.criteria.cityIds.map((id) => nameOf(cities, id)).join(', '));
  }
  if (rule.criteria.occasionTypeIds?.length) {
    parts.push(rule.criteria.occasionTypeIds.map((id) => nameOf(occasions, id)).join(', '));
  }
  return parts.length > 0 ? parts.join(' · ') : i18n.t('automation:matchesEvery');
}

function AutoAssignRulesSection({ isPremium }: { isPremium: boolean }) {
  const { colors } = useColorScheme();
  const { t } = useTranslation(['automation', 'common']);
  const { showActionSheetWithOptions } = useActionSheet();
  const { data: rules, isLoading: rulesLoading } = useAutoAssignRules();
  const { data: teamOverview } = useTeamOverview();
  const { data: categoryOptions } = useCategoryOptions();
  const createRule = useCreateAutoAssignRule();
  const updateRule = useUpdateAutoAssignRule();
  const deleteRule = useDeleteAutoAssignRule();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [cityIds, setCityIds] = useState<string[]>([]);
  const [occasionIds, setOccasionIds] = useState<string[]>([]);
  const [assignToMemberId, setAssignToMemberId] = useState<string | null>(null);

  const activeMembers = (teamOverview?.members ?? []).filter((m) => m.status === 'active');
  const cities = categoryOptions?.cities ?? [];
  const occasions = categoryOptions?.occasions ?? [];
  const sortedRules = [...(rules ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);

  const toggle = <T,>(list: T[], value: T, setList: (v: T[]) => void) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const resetForm = () => {
    setName('');
    setLeadSources([]);
    setCityIds([]);
    setOccasionIds([]);
    setAssignToMemberId(null);
    setShowForm(false);
  };

  const openNewRuleForm = () => {
    if (!isPremium) {
      Alert.alert(t('premiumTitle'), t('premiumRules'));
      return;
    }
    setShowForm(true);
  };

  const openAssigneePicker = () => {
    const options = [...activeMembers.map((m) => m.name), t('unassigned'), t('common:actions.cancel')];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: t('assignTo') },
      (index) => {
        if (index === undefined || index === options.length - 1) return;
        if (index === activeMembers.length) {
          setAssignToMemberId(null);
          return;
        }
        setAssignToMemberId(activeMembers[index]!.id);
      },
    );
  };

  const onCreate = () => {
    if (!name.trim()) return;
    createRule.mutate(
      {
        name: name.trim(),
        criteria: {
          leadSource: leadSources.length ? leadSources : undefined,
          cityIds: cityIds.length ? cityIds : undefined,
          occasionTypeIds: occasionIds.length ? occasionIds : undefined,
        },
        assignToMemberId,
        displayOrder: sortedRules.length,
        isActive: true,
      },
      {
        onSuccess: resetForm,
        onError: (err) => Alert.alert(t('saveFailed'), getErrorMessage(err)),
      },
    );
  };

  const moveRule = (index: number, direction: -1 | 1) => {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= sortedRules.length) return;
    const rule = sortedRules[index]!;
    const other = sortedRules[swapIndex]!;
    updateRule.mutate({ ruleId: rule.id, displayOrder: other.displayOrder });
    updateRule.mutate({ ruleId: other.id, displayOrder: rule.displayOrder });
  };

  const toggleActive = (rule: AutoAssignRule) => {
    updateRule.mutate({ ruleId: rule.id, isActive: !rule.isActive });
  };

  const onDelete = (rule: AutoAssignRule) => {
    Alert.alert(t('deleteTitle'), t('deleteBody', { name: rule.name }), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      { text: t('common:actions.delete'), style: 'destructive', onPress: () => deleteRule.mutate(rule.id) },
    ]);
  };

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <SectionLabel>{t('autoAssign')}</SectionLabel>
        <Pressable onPress={openNewRuleForm}>
          <Text variant="caption1" className={isPremium ? 'font-bold text-primary' : 'font-bold text-muted-foreground'}>
            {isPremium ? t('newRule') : t('newRuleLocked')}
          </Text>
        </Pressable>
      </View>

      {rulesLoading ? (
        <ActivityIndicator />
      ) : sortedRules.length === 0 && !showForm ? (
        <Text variant="footnote" color="tertiary">
          {t('noRules')}
        </Text>
      ) : (
        <View className="gap-2">
          {sortedRules.map((rule, index) => {
            const assignee = activeMembers.find((m) => m.id === rule.assignToMemberId);
            return (
              <View key={rule.id} className="gap-2 rounded-xl border border-border bg-card p-3.5">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1">
                    <Text variant="footnote" className="font-bold">
                      {rule.name}
                    </Text>
                    <Text variant="caption1" color="tertiary">
                      {describeCriteria(rule, cities, occasions)}
                    </Text>
                    <Text variant="caption2" color="tertiary" className="mt-0.5">
                      {t('ruleLine', { assignee: assignee?.name ?? t('unassigned'), fired: rule.firedCount })}
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <Pressable onPress={() => toggleActive(rule)}>
                      <Text
                        variant="caption2"
                        className={`font-bold ${rule.isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                        {rule.isActive ? t('active') : t('paused')}
                      </Text>
                    </Pressable>
                    <View className="flex-row items-center gap-1">
                      <Pressable onPress={() => moveRule(index, -1)} disabled={index === 0} className="p-1">
                        <Icon name="chevron.up" size={13} color={index === 0 ? colors.grey : colors.foreground} />
                      </Pressable>
                      <Pressable onPress={() => moveRule(index, 1)} disabled={index === sortedRules.length - 1} className="p-1">
                        <Icon
                          name="chevron.down"
                          size={13}
                          color={index === sortedRules.length - 1 ? colors.grey : colors.foreground}
                        />
                      </Pressable>
                      <Pressable onPress={() => onDelete(rule)} className="p-1">
                        <Icon name="trash.fill" size={13} color={colors.grey} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {showForm ? (
        <Card className="gap-3">
          <Text variant="caption1" color="tertiary" className="font-bold">
            {t('newRuleTitle')}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('ruleNamePlaceholder')}
            placeholderTextColor={colors.grey}
            className="rounded-lg border border-border px-3 py-2.5 text-foreground"
          />

          <View className="gap-1.5">
            <Text variant="caption2" color="tertiary">
              {t('leadSource')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {LEAD_SOURCES.map((source) => (
                <Pressable
                  key={source}
                  onPress={() => toggle(leadSources, source, setLeadSources)}
                  className={`rounded-full px-3 py-1.5 ${leadSources.includes(source) ? 'bg-foreground' : 'border border-border'}`}>
                  <Text
                    variant="caption1"
                    className={`font-bold ${leadSources.includes(source) ? 'text-background' : 'text-foreground'}`}>
                    {t(`leadSources.${source}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {cities.length > 0 ? (
            <View className="gap-1.5">
              <Text variant="caption2" color="tertiary">
                {t('city')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {cities.map((city) => (
                  <Pressable
                    key={city.id}
                    onPress={() => toggle(cityIds, city.id, setCityIds)}
                    className={`rounded-full px-3 py-1.5 ${cityIds.includes(city.id) ? 'bg-foreground' : 'border border-border'}`}>
                    <Text
                      variant="caption1"
                      className={`font-bold ${cityIds.includes(city.id) ? 'text-background' : 'text-foreground'}`}>
                      {pickBilingual(city, 'name')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {occasions.length > 0 ? (
            <View className="gap-1.5">
              <Text variant="caption2" color="tertiary">
                {t('occasion')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {occasions.map((occasion) => (
                  <Pressable
                    key={occasion.id}
                    onPress={() => toggle(occasionIds, occasion.id, setOccasionIds)}
                    className={`rounded-full px-3 py-1.5 ${occasionIds.includes(occasion.id) ? 'bg-foreground' : 'border border-border'}`}>
                    <Text
                      variant="caption1"
                      className={`font-bold ${occasionIds.includes(occasion.id) ? 'text-background' : 'text-foreground'}`}>
                      {pickBilingual(occasion, 'name')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View className="gap-1.5">
            <Text variant="caption2" color="tertiary">
              {t('assignToLabel')}
            </Text>
            <Pressable
              onPress={openAssigneePicker}
              className="rounded-lg border border-border px-3 py-2.5">
              <Text variant="footnote">
                {activeMembers.find((m) => m.id === assignToMemberId)?.name ?? t('unassigned')}
              </Text>
            </Pressable>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={onCreate}
              disabled={!name.trim() || createRule.isPending}
              className={`flex-1 items-center rounded-lg bg-primary py-2.5 ${!name.trim() || createRule.isPending ? 'opacity-50' : 'active:opacity-80'}`}>
              <Text variant="caption1" className="font-bold text-white">
                {createRule.isPending ? t('adding') : t('addRule')}
              </Text>
            </Pressable>
            <Pressable onPress={resetForm} className="items-center rounded-lg border border-border px-4 py-2.5">
              <Text variant="caption1" className="font-bold">
                {t('common:actions.cancel')}
              </Text>
            </Pressable>
          </View>
        </Card>
      ) : null}
    </View>
  );
}
