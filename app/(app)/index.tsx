import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

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
    HomeRevenue,
    SubscriptionSummary,
    TeamMemberActivity,
} from '@/Modules/home/types';
import { useOnboardingChecklist } from '@/Modules/onboarding-checklist/hooks';
import { getErrorMessage } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/format';

const DISPLAY = 'font-display';

type HomeTab = 'overview' | 'ads' | 'subscription';

function greetingDate() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<HomeTab>('overview');

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pb-2 pt-2">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text variant="caption2" className="font-bold uppercase tracking-wider text-muted-foreground">
              {`${greetingDate()} · ${user?.name ?? 'there'} 👋`}
            </Text>
            <Text className={`${DISPLAY} mt-1 text-[26px] leading-tight`}>
              your <Text className={`${DISPLAY} text-[26px] text-primary`}>studio</Text>.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/more')}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Icon name="bell.fill" size={20} color="#661C33" />
            <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary" />
          </Pressable>
        </View>
        <PillTabs value={tab} onChange={setTab} />
      </View>

      {tab === 'overview' ? <OverviewTab /> : null}
      {tab === 'ads' ? <AdsTab /> : null}
      {tab === 'subscription' ? <SubscriptionTab /> : null}
    </View>
  );
}

function PillTabs({ value, onChange }: { value: HomeTab; onChange: (tab: HomeTab) => void }) {
  const options: { key: HomeTab; label: string; badge?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'ads', label: 'Ads', badge: 1 },
    { key: 'subscription', label: 'Subscription' },
  ];

  return (
    <View className="mt-4 flex-row gap-1.5">
      {options.map((opt) => {
        const on = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5 ${
              on ? 'bg-foreground' : 'border border-border'
            }`}>
            <Text
              variant="caption1"
              className={`font-bold ${on ? 'text-background' : 'text-foreground'}`}>
              {opt.label}
            </Text>
            {opt.badge ? (
              <View className={`rounded-full px-1.5 ${on ? 'bg-primary' : 'bg-foreground'}`}>
                <Text variant="caption2" className="font-extrabold text-white">
                  {opt.badge}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View className="flex-1 items-center justify-center gap-2 p-6">{children}</View>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Centered>
      <Text color="tertiary" className="text-center">
        {message}
      </Text>
      <Pressable onPress={onRetry}>
        <Text className="text-primary">Try again</Text>
      </Pressable>
    </Centered>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="caption2" className="mb-2.5 ml-0.5 font-extrabold uppercase tracking-wider">
      {children}
    </Text>
  );
}

function OverviewTab() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useHomeOverview();
  const { data: checklistItems } = useOnboardingChecklist();

  if (isLoading) {
    return (
      <Centered>
        <ActivityIndicator />
      </Centered>
    );
  }

  if (isError || !data) {
    return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  }

  const { revenue, kpis, funnel, teamToday, insight } = data;
  const checklistTotal = checklistItems?.length ?? 0;
  const checklistCompleted = checklistItems?.filter((i) => i.completedAt).length ?? 0;
  const showSetupNudge = checklistTotal > 0 && checklistCompleted < checklistTotal;

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-4 px-5 pb-8 pt-1"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
      {revenue ? <RevenueHero revenue={revenue} /> : null}

      <KpiGrid
        kpis={kpis}
        onPressMetric={(metric) =>
          router.push({ pathname: '/(app)/analytics', params: { metric } })
        }
      />

      {revenue && revenue.monthly.length > 0 ? <MonthlyBars revenue={revenue} /> : null}

      <FunnelCard funnel={funnel} />

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

      {showSetupNudge ? (
        <SetupNudge
          completed={checklistCompleted}
          total={checklistTotal}
          onPress={() => router.push('/(app)/more/onboarding-checklist' as Href)}
        />
      ) : null}
    </ScrollView>
  );
}

function sparkPath(values: number[], width = 280, height = 50) {
  if (values.length < 2) return { line: '', area: '' };
  const step = width / (values.length - 1);
  const line = values
    .map((y, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  return { line, area };
}

function RevenueHero({ revenue }: { revenue: HomeRevenue }) {
  const ranges = ['7D', '30D', 'YTD'];
  const { line, area } = sparkPath(revenue.spark);
  const positive = revenue.deltaPct >= 0;
  const amountK = `${Math.round(revenue.amount / 1000)}k`;

  return (
    <LinearGradient
      colors={['#1D1B20', '#661C33']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 20, padding: 20, overflow: 'hidden' }}>
      <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20" />
      <View className="flex-row items-center justify-between">
        <Text variant="caption2" className="font-extrabold uppercase tracking-wider text-white/85">
          {`● ${revenue.label}`}
        </Text>
        <View className="flex-row gap-1">
          {ranges.map((r, i) => (
            <View
              key={r}
              className={`rounded-lg px-2 py-0.5 ${i === 1 ? 'bg-brand-yellow' : 'bg-white/10'}`}>
              <Text
                variant="caption2"
                className={`font-extrabold ${i === 1 ? 'text-brand-ink' : 'text-white/60'}`}>
                {r}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text className={`${DISPLAY} mt-2.5 text-4xl text-white`}>
        EGP <Text className={`${DISPLAY} text-4xl text-brand-yellow`}>{amountK}</Text>
      </Text>
      <Text variant="footnote" className="mt-1.5 text-white/85">
        Revenue ·{' '}
        <Text variant="footnote" className="font-extrabold text-brand-lime">
          {`${positive ? '↑' : '↓'} ${Math.abs(revenue.deltaPct)}%`}
        </Text>{' '}
        vs prev
      </Text>

      <Svg viewBox="0 0 280 50" width="100%" height={44} preserveAspectRatio="none" style={{ marginTop: 14 }}>
        <Defs>
          <SvgGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FF318A" stopOpacity={0.55} />
            <Stop offset="100%" stopColor="#FF318A" stopOpacity={0} />
          </SvgGradient>
        </Defs>
        <Path d={area} fill="url(#sparkFill)" />
        <Path d={line} fill="none" stroke="#FEFE00" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </LinearGradient>
  );
}

function DeltaBadge({ deltaPct }: { deltaPct: number }) {
  const positive = deltaPct >= 0;
  return (
    <Text
      variant="caption2"
      className={`font-extrabold ${positive ? 'text-brand-green' : 'text-destructive'}`}>
      {`${positive ? '↑' : '↓'} ${Math.abs(deltaPct)}% vs prev`}
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
  const items: { key: keyof HomeKpis; label: string }[] = [
    { key: 'profileViews', label: 'Profile views' },
    { key: 'saves', label: 'Saves' },
    { key: 'newInquiries', label: 'New inquiries' },
    { key: 'bookingsClosed', label: 'Bookings closed' },
  ];

  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => {
        const kpi = kpis[item.key];
        return (
          <Pressable
            key={item.key}
            onPress={() => onPressMetric(item.key)}
            className="min-w-[47%] flex-1 rounded-xl border border-border bg-card p-3">
            <Text variant="caption2" className="font-extrabold uppercase tracking-wide text-muted-foreground">
              {item.label}
            </Text>
            <Text className={`${DISPLAY} mt-1 text-2xl`}>{kpi.value.toLocaleString()}</Text>
            <View className="mt-1">
              <DeltaBadge deltaPct={kpi.deltaPct} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function MonthlyBars({ revenue }: { revenue: HomeRevenue }) {
  const max = Math.max(...revenue.monthly.map((m) => m.value)) || 1;
  const last = revenue.monthly.length - 1;

  return (
    <View>
      <SectionLabel>Revenue · last 6 months</SectionLabel>
      <View className="rounded-2xl border border-border bg-card p-3.5">
        <View className="h-28 flex-row items-end gap-2">
          {revenue.monthly.map((m, i) => (
            <View key={m.month} className="flex-1 items-center gap-1.5">
              <Text variant="caption2" className="font-extrabold">
                {`${Math.round(m.value / 1000)}k`}
              </Text>
              <View
                className={`w-full rounded ${i === last ? 'bg-primary' : 'bg-foreground'}`}
                style={{ height: Math.max((m.value / max) * 78, 4) }}
              />
              <Text variant="caption2" className="font-bold text-muted-foreground">
                {m.month}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const FUNNEL_COLORS = ['#FFE5F0', '#FFC9DD', '#FF85B5', '#FF318A', '#661C33'];

function FunnelCard({ funnel }: { funnel: FunnelStep[] }) {
  const max = funnel[0]?.count || 1;

  return (
    <View>
      <SectionLabel>Conversion funnel · last 30d</SectionLabel>
      <View className="gap-2 rounded-2xl border border-border bg-card p-3.5">
        {funnel.map((step, i) => (
          <View key={step.stage} className="gap-1">
            <View className="flex-row items-baseline justify-between">
              <Text variant="footnote" className="font-bold">
                {step.label}
              </Text>
              <Text className={`${DISPLAY} text-sm`}>{step.count.toLocaleString()}</Text>
            </View>
            <View className="h-3 overflow-hidden rounded-md bg-muted">
              <View
                className="h-full rounded-md"
                style={{
                  width: `${Math.max((step.count / max) * 100, 4)}%`,
                  backgroundColor: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                }}
              />
            </View>
          </View>
        ))}
      </View>
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
    <View>
      <View className="mb-2.5 flex-row items-center justify-between px-0.5">
        <SectionLabel>Team today</SectionLabel>
        <Pressable onPress={onManage}>
          <Text variant="caption1" className="font-extrabold text-primary">
            Manage →
          </Text>
        </Pressable>
      </View>
      <View className="overflow-hidden rounded-2xl border border-border bg-card">
        {members.map((member, i) => (
          <Pressable
            key={member.id}
            onPress={() => onPressMember(member.id)}
            className={`flex-row items-center gap-3 p-3.5 ${
              i < members.length - 1 ? 'border-b border-border' : ''
            }`}>
            <View>
              <InitialsAvatar name={member.name} size={36} />
              {member.online ? (
                <View className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-brand-green" />
              ) : null}
            </View>
            <View className="flex-1">
              <View className="flex-row items-baseline justify-between">
                <Text variant="footnote" className="font-bold">
                  {member.name}
                </Text>
                <Text
                  variant="caption2"
                  className={`font-bold ${member.online ? 'text-brand-green' : 'text-muted-foreground'}`}>
                  {member.online ? 'Online now' : 'Offline'}
                </Text>
              </View>
              <View className="mt-1 flex-row gap-3">
                <Text variant="caption2" color="tertiary">
                  Open <Text className={`${DISPLAY} text-xs`}>{member.openChats}</Text>
                </Text>
                <Text variant="caption2" color="tertiary">
                  Replied <Text className={`${DISPLAY} text-xs`}>{member.repliedToday}</Text>
                </Text>
              </View>
            </View>
            <Icon name="chevron.right" size={14} color="#D7D0C4" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function InsightCard({ insight, onPress }: { insight: HomeInsight; onPress: () => void }) {
  return (
    <View className="flex-row gap-3 rounded-2xl bg-foreground p-4">
      <View className="h-8 w-8 items-center justify-center rounded-lg bg-brand-lime/15">
        <Icon name="sparkle" size={16} color="#B2FF2E" />
      </View>
      <View className="flex-1">
        <Text variant="caption2" className="font-extrabold uppercase tracking-wider text-brand-lime">
          ● Smart insight
        </Text>
        <Text variant="footnote" className="mt-1 text-background">
          {insight.headline}. {insight.description}
        </Text>
        <Pressable onPress={onPress} className="mt-2.5 self-start rounded-lg bg-primary px-3.5 py-1.5">
          <Text variant="caption1" className="font-bold text-white">
            See full funnel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SetupNudge({
  completed,
  total,
  onPress,
}: {
  completed: number;
  total: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: '#FFFBE6', borderColor: '#FFD460' }}
      className="flex-row items-center gap-3 rounded-2xl border p-3.5">
      <View style={{ backgroundColor: '#FFE5A8' }} className="h-9 w-9 items-center justify-center rounded-full">
        <Icon name="checkmark.circle.fill" size={18} color="#7A4500" />
      </View>
      <View className="flex-1">
        <Text variant="caption2" style={{ color: '#7A4500' }} className="font-extrabold uppercase tracking-wider">
          {`${completed} of ${total} setup steps`}
        </Text>
        <Text style={{ color: '#1D1B20' }} className={`${DISPLAY} mt-0.5 text-[15px]`}>
          finish your studio setup
        </Text>
      </View>
      <Icon name="chevron.right" size={15} color="#7A4500" />
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
    return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-4 px-5 pb-8 pt-1"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
      <LinearGradient
        colors={['#FF318A', '#661C33']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 18, padding: 18, overflow: 'hidden' }}>
        <View className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <Text variant="caption2" className="font-extrabold uppercase tracking-wider text-white/85">
          This month · ad return
        </Text>
        <Text className={`${DISPLAY} mt-2 text-3xl text-white`}>{`${data.roiPct}%`}</Text>
      </LinearGradient>

      <View className="gap-2">
        {data.campaigns.length === 0 ? (
          <Text variant="footnote" color="tertiary">
            No campaigns yet.
          </Text>
        ) : (
          data.campaigns.map((campaign) => (
            <View key={campaign.id} className="gap-1 rounded-xl border border-border bg-card p-3.5">
              <View className="flex-row items-center justify-between">
                <Text variant="subhead" className="font-bold" numberOfLines={1}>
                  {campaign.name}
                </Text>
                <CampaignStatusBadge status={campaign.status} />
              </View>
              <View className="mt-1 flex-row gap-3.5">
                <Text variant="caption1" color="tertiary">
                  Views <Text className={`${DISPLAY} text-sm`}>{campaign.impressions.toLocaleString()}</Text>
                </Text>
                <Text variant="caption1" color="tertiary">
                  Clicks <Text className={`${DISPLAY} text-sm`}>{campaign.clicks.toLocaleString()}</Text>
                </Text>
              </View>
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
    return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  }

  const renewalLine = renewalSummaryLine(data);

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-4 px-5 pb-8 pt-1"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
      <LinearGradient
        colors={['#1D1B20', '#661C33']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 18, padding: 20, overflow: 'hidden' }}>
        <View className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20" />
        <Text variant="caption2" className="font-extrabold uppercase tracking-wider text-brand-yellow">
          {`● ${renewalLine ?? 'Active'}`}
        </Text>
        <Text className={`${DISPLAY} mt-2 text-3xl text-white capitalize`}>
          {data.plan === 'premium' ? (
            <>you&apos;re <Text className={`${DISPLAY} text-3xl text-brand-yellow`}>premium</Text>.</>
          ) : (
            <>you&apos;re on <Text className={`${DISPLAY} text-3xl text-brand-yellow`}>free</Text>.</>
          )}
        </Text>
      </LinearGradient>

      <View className="gap-2.5 rounded-xl border border-border bg-card p-4">
        <SectionLabel>Usage</SectionLabel>
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
