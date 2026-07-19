import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { CircularProgress } from '@/components/CircularProgress';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Button } from '@/components/nativewindui/Button';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { useAuth } from '@/Modules/auth/context';
import {
    useHomeAdsSummary,
    useHomeOverview,
    useHomeSubscriptionSummary,
} from '@/Modules/home/hooks';
import type {
    AdCampaignSummary,
    FunnelStep,
    HomeInsight,
    HomeKpis,
    SetupChecklist,
    SubscriptionSummary,
    TeamMemberActivity,
} from '@/Modules/home/types';
import { getErrorMessage } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/format';
import { useColorScheme } from '@/lib/useColorScheme';

type HomeTab = 'overview' | 'ads' | 'subscription';

export default function HomeScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<HomeTab>('overview');

  return (
    <View className="flex-1 bg-background">
      <View className="border-b border-border px-4 pb-3 pt-2">
        <Text variant="title1" className="font-bold">
          {`Hi, ${user?.name ?? 'there'}`}
        </Text>
        <SegmentedTabs value={tab} onChange={setTab} />
      </View>

      {tab === 'overview' ? <OverviewTab /> : null}
      {tab === 'ads' ? <AdsTab /> : null}
      {tab === 'subscription' ? <SubscriptionTab /> : null}
    </View>
  );
}

function SegmentedTabs({ value, onChange }: { value: HomeTab; onChange: (tab: HomeTab) => void }) {
  const options: { key: HomeTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'ads', label: 'Ads' },
    { key: 'subscription', label: 'Subscription' },
  ];

  return (
    <View className="mt-3 flex-row rounded-xl bg-muted p-1">
      {options.map((opt) => {
        const selected = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            className={`flex-1 items-center rounded-lg py-1.5 ${selected ? 'bg-card' : ''}`}>
            <Text
              variant="footnote"
              className={selected ? 'font-semibold' : 'text-muted-foreground'}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View className="flex-1 items-center justify-center gap-2 p-6">{children}</View>;
}

function OverviewTab() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useHomeOverview();

  if (isLoading) {
    return (
      <Centered>
        <ActivityIndicator />
      </Centered>
    );
  }

  if (isError || !data) {
    return (
      <Centered>
        <Text color="tertiary" className="text-center">
          {getErrorMessage(error)}
        </Text>
        <Pressable onPress={() => refetch()}>
          <Text className="text-primary">Try again</Text>
        </Pressable>
      </Centered>
    );
  }

  const { setupChecklist, kpis, funnel, teamToday, insight } = data;
  const showSetupNudge = setupChecklist && setupChecklist.completed < setupChecklist.total;

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-4 p-4"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
      {showSetupNudge ? <SetupNudge checklist={setupChecklist} /> : null}

      <KpiGrid
        kpis={kpis}
        onPressMetric={(metric) =>
          router.push({ pathname: '/(app)/analytics', params: { metric } })
        }
      />

      <FunnelCard funnel={funnel} onPressMore={() => router.push('/(app)/analytics')} />

      {teamToday && teamToday.length > 0 ? (
        <TeamTodayCard
          members={teamToday}
          onPressMember={(id) =>
            router.push({ pathname: '/(app)/inbox', params: { assignee: id } })
          }
          onManage={() => router.push('/(app)/more')}
        />
      ) : null}

      {insight ? (
        <InsightCard insight={insight} onPress={() => router.push('/(app)/analytics')} />
      ) : null}
    </ScrollView>
  );
}

function SetupNudge({ checklist }: { checklist: SetupChecklist }) {
  const progress = checklist.total > 0 ? checklist.completed / checklist.total : 0;

  return (
    <View className="flex-row items-center gap-4 rounded-xl border border-border bg-card p-4">
      <CircularProgress progress={progress} label={`${checklist.completed}/${checklist.total}`} />
      <View className="flex-1 gap-1">
        <Text variant="subhead" className="font-semibold">
          {`${checklist.completed} of ${checklist.total} steps complete`}
        </Text>
        <Text variant="caption1" color="tertiary" numberOfLines={2}>
          {checklist.missingItems.slice(0, 3).join(' · ')}
        </Text>
      </View>
    </View>
  );
}

function DeltaBadge({ deltaPct }: { deltaPct: number }) {
  const positive = deltaPct >= 0;
  return (
    <Text
      variant="caption2"
      className={`font-medium ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      {`${positive ? '+' : ''}${deltaPct}%`}
    </Text>
  );
}

function KpiGrid({
  kpis,
  onPressMetric,
}: {
  kpis: HomeKpis;
  onPressMetric: (metric: keyof HomeKpis) => void;
}) {
  const { colors } = useColorScheme();
  const items: { key: keyof HomeKpis; label: string; icon: 'eye.fill' | 'bookmark.fill' | 'envelope.fill' | 'checkmark.circle.fill' }[] = [
    { key: 'profileViews', label: 'Profile views', icon: 'eye.fill' },
    { key: 'saves', label: 'Saves', icon: 'bookmark.fill' },
    { key: 'newInquiries', label: 'New inquiries', icon: 'envelope.fill' },
    { key: 'bookingsClosed', label: 'Bookings closed', icon: 'checkmark.circle.fill' },
  ];

  return (
    <View className="flex-row flex-wrap gap-3">
      {items.map((item) => {
        const kpi = kpis[item.key];
        return (
          <Pressable
            key={item.key}
            onPress={() => onPressMetric(item.key)}
            className="min-w-[47%] flex-1 gap-2 rounded-xl border border-border bg-card p-4">
            <View className="flex-row items-center justify-between">
              <Icon name={item.icon} size={16} color={colors.grey} />
              <DeltaBadge deltaPct={kpi.deltaPct} />
            </View>
            <Text variant="title2" className="font-bold">
              {kpi.value.toLocaleString()}
            </Text>
            <Text variant="caption1" color="tertiary">
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FunnelCard({
  funnel,
  onPressMore,
}: {
  funnel: FunnelStep[];
  onPressMore: () => void;
}) {
  const max = funnel[0]?.count || 1;

  return (
    <View className="gap-3 rounded-xl border border-border bg-card p-4">
      <Text variant="subhead" className="font-semibold">
        Conversion funnel
      </Text>
      <View className="gap-2.5">
        {funnel.map((step) => (
          <View key={step.stage} className="gap-1">
            <View className="flex-row items-center justify-between">
              <Text variant="footnote">{step.label}</Text>
              <Text variant="footnote" color="tertiary">
                {step.count.toLocaleString()}
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-muted">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max((step.count / max) * 100, 4)}%` }}
              />
            </View>
          </View>
        ))}
      </View>
      <Pressable onPress={onPressMore}>
        <Text variant="footnote" className="text-primary">
          Full analytics →
        </Text>
      </Pressable>
    </View>
  );
}

function TeamTodayCard({
  members,
  onPressMember,
  onManage,
}: {
  members: TeamMemberActivity[];
  onPressMember: (id: string) => void;
  onManage: () => void;
}) {
  return (
    <View className="gap-3 rounded-xl border border-border bg-card p-4">
      <View className="flex-row items-center justify-between">
        <Text variant="subhead" className="font-semibold">
          Team today
        </Text>
        <Pressable onPress={onManage}>
          <Text variant="footnote" className="text-primary">
            Manage →
          </Text>
        </Pressable>
      </View>
      <View className="gap-3">
        {members.map((member) => (
          <Pressable
            key={member.id}
            onPress={() => onPressMember(member.id)}
            className="flex-row items-center gap-3">
            <View>
              <InitialsAvatar name={member.name} size={36} />
              <View
                className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${
                  member.online ? 'bg-green-500' : 'bg-neutral-400'
                }`}
              />
            </View>
            <View className="flex-1">
              <Text variant="footnote" className="font-medium">
                {member.name}
              </Text>
              <Text variant="caption2" color="tertiary">
                {`${member.openChats} open · ${member.repliedToday} replied today`}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function InsightCard({ insight, onPress }: { insight: HomeInsight; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="gap-1 rounded-xl border border-border bg-card p-4">
      <Text variant="subhead" className="font-semibold">
        {insight.headline}
      </Text>
      <Text variant="footnote" color="tertiary">
        {insight.description}
      </Text>
    </Pressable>
  );
}

function CampaignStatusBadge({ status }: { status: AdCampaignSummary['status'] }) {
  const meta: Record<AdCampaignSummary['status'], { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
    paused: { label: 'Paused', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    completed: { label: 'Completed', className: 'bg-muted text-muted-foreground' },
  };
  const m = meta[status];
  return (
    <View className={`rounded-full px-2 py-0.5 ${m.className}`}>
      <Text variant="caption2" className={`font-medium ${m.className}`}>
        {m.label}
      </Text>
    </View>
  );
}

function AdsTab() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useHomeAdsSummary();

  if (isLoading) {
    return (
      <Centered>
        <ActivityIndicator />
      </Centered>
    );
  }

  if (isError || !data) {
    return (
      <Centered>
        <Text color="tertiary" className="text-center">
          {getErrorMessage(error)}
        </Text>
        <Pressable onPress={() => refetch()}>
          <Text className="text-primary">Try again</Text>
        </Pressable>
      </Centered>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-4 p-4"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
      <View className="gap-1 rounded-xl border border-border bg-card p-4">
        <Text variant="caption1" color="tertiary">
          THIS MONTH&apos;S ROI
        </Text>
        <Text variant="title1" className="font-bold">
          {`${data.roiPct}%`}
        </Text>
      </View>

      <View className="gap-2">
        {data.campaigns.length === 0 ? (
          <Text variant="footnote" color="tertiary">
            No campaigns yet.
          </Text>
        ) : (
          data.campaigns.map((campaign) => (
            <View key={campaign.id} className="gap-1 rounded-xl border border-border bg-card p-4">
              <View className="flex-row items-center justify-between">
                <Text variant="subhead" className="font-medium" numberOfLines={1}>
                  {campaign.name}
                </Text>
                <CampaignStatusBadge status={campaign.status} />
              </View>
              <Text variant="caption1" color="tertiary">
                {`${campaign.impressions.toLocaleString()} impressions · ${campaign.clicks.toLocaleString()} clicks`}
              </Text>
            </View>
          ))
        )}
      </View>

      <Button onPress={() => router.push('/(app)/more')}>
        <Text>Create new campaign</Text>
      </Button>
    </ScrollView>
  );
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="footnote" color="tertiary">
        {label}
      </Text>
      <Text variant="footnote" className="font-medium">
        {value}
      </Text>
    </View>
  );
}

function SubscriptionTab() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useHomeSubscriptionSummary();

  if (isLoading) {
    return (
      <Centered>
        <ActivityIndicator />
      </Centered>
    );
  }

  if (isError || !data) {
    return (
      <Centered>
        <Text color="tertiary" className="text-center">
          {getErrorMessage(error)}
        </Text>
        <Pressable onPress={() => refetch()}>
          <Text className="text-primary">Try again</Text>
        </Pressable>
      </Centered>
    );
  }

  const renewalLine = renewalSummaryLine(data);

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-4 p-4"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
      <View className="gap-2 rounded-xl border border-border bg-card p-4">
        <View className="flex-row items-center justify-between">
          <Text variant="title2" className="font-bold capitalize">
            {data.plan}
          </Text>
          {data.plan === 'premium' ? (
            <View className="flex-row items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 dark:bg-amber-950">
              <Icon name="star.fill" size={12} color="#B45309" />
              <Text variant="caption2" className="font-medium text-amber-700 dark:text-amber-300">
                Verified
              </Text>
            </View>
          ) : null}
        </View>
        {renewalLine ? (
          <Text variant="footnote" color="tertiary">
            {renewalLine}
          </Text>
        ) : null}
      </View>

      <View className="gap-2.5 rounded-xl border border-border bg-card p-4">
        <Text variant="caption1" color="tertiary">
          USAGE
        </Text>
        <UsageRow
          label="Team seats"
          value={`${data.usage.teamSeatsUsed} / ${data.usage.teamSeatsTotal}`}
        />
        <UsageRow label="Reply sends" value={data.usage.replySends.toLocaleString()} />
        <UsageRow label="Ad credits" value={data.usage.adCredits.toLocaleString()} />
      </View>

      <Button onPress={() => router.push('/(app)/more')}>
        <Text>Manage subscription</Text>
      </Button>
      <Pressable onPress={() => router.push('/(app)/more')}>
        <Text variant="footnote" color="tertiary" className="text-center">
          Downgrade or cancel
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function renewalSummaryLine(data: SubscriptionSummary): string | null {
  if (!data.renewalDate) return null;
  const price = data.price ? ` · ${formatCurrency(data.price)}` : '';
  return `Renews ${formatDate(data.renewalDate)}${price}`;
}
