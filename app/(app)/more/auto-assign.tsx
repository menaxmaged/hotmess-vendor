import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Card, DISPLAY, SectionLabel } from '@/components/brand';
import { Text } from '@/components/nativewindui/Text';
import { Toggle } from '@/components/nativewindui/Toggle';
import { STATUS_META } from '@/Modules/inbox/status';
import type { LeadStatus } from '@/Modules/inbox/types';
import { useHomeSubscriptionSummary } from '@/Modules/home/hooks';

interface Rule {
  id: string;
  status: LeadStatus;
  memberName: string;
  enabled: boolean;
  firedCount: number;
}

const INITIAL_RULES: Rule[] = [
  { id: 'r1', status: 'new_inquiry', memberName: 'Mona Adel', enabled: true, firedCount: 42 },
  { id: 'r2', status: 'needs_quotation', memberName: 'Youssef Nabil', enabled: true, firedCount: 18 },
  { id: 'r3', status: 'meeting_scheduled', memberName: 'Mariam El-Adl', enabled: false, firedCount: 7 },
];

export default function AutoAssignScreen() {
  const { data: sub } = useHomeSubscriptionSummary();
  const isPremium = sub?.plan === 'premium';
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);

  const toggle = (id: string) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 px-5 pb-8 pt-4"
      showsVerticalScrollIndicator={false}>
      {!isPremium ? (
        <Card>
          <Text variant="footnote" color="tertiary">
            Auto-assign is a Premium feature. Upgrade to route chats to team members automatically.
          </Text>
        </Card>
      ) : null}

      <View>
        <SectionLabel>Rules · {rules.length}</SectionLabel>
        <View className="gap-2">
          {rules.map((rule) => {
            const meta = STATUS_META[rule.status];
            return (
              <Card key={rule.id} className="gap-3">
                <View className="flex-row items-center justify-between">
                  <View className={`rounded-full px-2 py-0.5 ${meta.bgClassName}`}>
                    <Text variant="caption2" className={`font-bold ${meta.colorClassName}`}>
                      {meta.label}
                    </Text>
                  </View>
                  <Toggle value={rule.enabled} onValueChange={() => toggle(rule.id)} />
                </View>
                <View className="flex-row items-center gap-2">
                  <Text variant="footnote" color="tertiary">
                    Assign to
                  </Text>
                  <Text variant="footnote" className="font-bold">
                    {rule.memberName}
                  </Text>
                </View>
                <Text variant="caption2" color="tertiary">
                  Fired <Text className={`${DISPLAY} text-xs`}>{rule.firedCount}</Text> times this month
                </Text>
              </Card>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={() =>
          isPremium
            ? Alert.alert('New rule', 'Pick a trigger status and a team member to assign.')
            : Alert.alert('Premium feature', 'Upgrade to Premium to create auto-assign rules.')
        }
        className="items-center rounded-2xl bg-foreground py-4 active:opacity-80">
        <Text className="font-bold text-background">＋ New rule</Text>
      </Pressable>
    </ScrollView>
  );
}
