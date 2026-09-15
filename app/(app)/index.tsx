import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { SafeTop } from '@/components/brand';
import { StudioStatusBanner } from '@/components/StudioStatusBanner';
import { Button } from '@/components/nativewindui/Button';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { useCampaigns } from '@/Modules/ads/hooks';
import { isLive, statusMeta } from '@/Modules/ads/status';
import { FunnelBars } from '@/Modules/analytics/components/FunnelBars';
import { useAnalyticsFunnel, useAnalyticsKpis } from '@/Modules/analytics/hooks';
import type { AnalyticsKpis } from '@/Modules/analytics/types';
import { useAuth } from '@/Modules/auth/context';
import { useFinanceSummary } from '@/Modules/finance/hooks';
import { useNotificationUnreadCount } from '@/Modules/notifications/hooks';
import type { FinanceSummary } from '@/Modules/finance/types';
import { useOnboardingChecklist } from '@/Modules/onboarding-checklist/hooks';
import { useSubscription } from '@/Modules/subscription/hooks';
import type { SubscriptionState } from '@/Modules/subscription/types';
import { getErrorMessage } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import i18n, { localeTag } from '@/lib/i18n';
import { pickBilingual } from '@/lib/localized';

const DISPLAY = 'font-display';

type HomeTab = 'overview' | 'ads' | 'subscription';

function greetingDate() {
  return new Date().toLocaleDateString(localeTag(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function moneyK(n: number, currency: string) {
  return n >= 1000 ? `${currency} ${Math.round(n / 1000)}k` : `${currency} ${Math.round(n)}`;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { t } = useTranslation('insights');
  const router = useRouter();
  const [tab, setTab] = useState<HomeTab>('overview');
  const { data: campaigns } = useCampaigns();
  const { data: unreadNotifications = 0 } = useNotificationUnreadCount();
  const awaitingPayment = (campaigns ?? []).filter((c) => c.status === 'pending_payment').length;

  return (
    <View className="flex-1 bg-background">
      <SafeTop />
      <View className="px-5 pb-2 pt-2">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text variant="caption2" className="font-bold uppercase tracking-wider text-muted-foreground">
              {`${greetingDate()} · ${user?.name ?? t('home.there')} 👋`}
            </Text>
            <Text className={`${DISPLAY} mt-1 text-[26px] leading-tight`}>
              {t('home.titleBefore')}
              <Text className={`${DISPLAY} text-[26px] text-primary`}>{t('home.titleAccent')}</Text>
              {t('home.titleAfter')}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/more/notifications' as Href)}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Icon name="bell.fill" size={20} color="#661C33" />
            {unreadNotifications > 0 ? (
              <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary" />
            ) : null}
          </Pressable>
        </View>
        <PillTabs value={tab} onChange={setTab} adsBadge={awaitingPayment} />
      </View>
      <StudioStatusBanner className="mx-5 mb-2" />

      {tab === 'overview' ? <OverviewTab /> : null}
      {tab === 'ads' ? <AdsTab /> : null}
      {tab === 'subscription' ? <SubscriptionTab /> : null}
    </View>
  );
}

function PillTabs({
  value,
  onChange,
  adsBadge,
}: {
  value: HomeTab;
  onChange: (tab: HomeTab) => void;
  adsBadge: number;
}) {
  const { t } = useTranslation('insights');
  const options: { key: HomeTab; label: string; badge?: number }[] = [
    { key: 'overview', label: t('home.tabs.overview') },
    { key: 'ads', label: t('home.tabs.ads'), badge: adsBadge },
    { key: 'subscription', label: t('home.tabs.subscription') },
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
  const { t } = useTranslation();
  return (
    <Centered>
      <Text color="tertiary" className="text-center">
        {message}
      </Text>
      <Pressable onPress={onRetry}>
        <Text className="text-primary">{t('actions.retry')}</Text>
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

// Home has no endpoint of its own — it composes the real analytics (30d),
// finance summary and onboarding checklist. The old revenue sparkline,
// monthly bars, "team today" and "smart insight" cards had no data source
// anywhere in the API and were removed rather than faked.
function OverviewTab() {
  const router = useRouter();
  const { t } = useTranslation('insights');
  const kpis = useAnalyticsKpis('30d');
  const funnel = useAnalyticsFunnel('30d');
  const finance = useFinanceSummary();
  const { data: checklistItems } = useOnboardingChecklist();

  const refetch = () => {
    void kpis.refetch();
    void funnel.refetch();
    void finance.refetch();
  };

  if (kpis.isLoading) {
    return (
      <Centered>
        <ActivityIndicator />
      </Centered>
    );
  }

  if (kpis.isError || !kpis.data) {
    return <ErrorState message={getErrorMessage(kpis.error)} onRetry={refetch} />;
  }

  const checklistTotal = checklistItems?.length ?? 0;
  const checklistCompleted = checklistItems?.filter((i) => i.completedAt).length ?? 0;
  const showSetupNudge = checklistTotal > 0 && checklistCompleted < checklistTotal;

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-4 px-5 pb-8 pt-1"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={kpis.isRefetching} onRefresh={refetch} />}>
      {finance.data ? (
        <Pressable onPress={() => router.push('/(app)/finance')}>
          <RevenueHero summary={finance.data} />
        </Pressable>
      ) : null}

      <KpiGrid kpis={kpis.data} onPress={() => router.push('/(app)/analytics')} />

      <View>
        <SectionLabel>{t('home.funnel')}</SectionLabel>
        <FunnelBars stages={funnel.data?.stages ?? []} />
      </View>

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

function RevenueHero({ summary }: { summary: FinanceSummary }) {
  const { t } = useTranslation('insights');
  return (
    <LinearGradient
      colors={['#1D1B20', '#661C33']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 20, padding: 20, overflow: 'hidden' }}>
      <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20" />
      <Text variant="caption2" className="font-extrabold uppercase tracking-wider text-white/85">
        {`● ${t('home.receivedThisMonth')}`}
      </Text>
      <Text className={`${DISPLAY} mt-2.5 text-4xl text-white`}>
        {summary.currencyCode}{' '}
        <Text className={`${DISPLAY} text-4xl text-brand-yellow`}>
          {moneyK(summary.receivedThisMonth, '').trim()}
        </Text>
      </Text>
      <Text variant="footnote" className="mt-1.5 text-white/85">
        {t('home.revenueLine', {
          total: moneyK(summary.totalReceived, summary.currencyCode),
          outstanding: moneyK(summary.outstanding, summary.currencyCode),
        })}
      </Text>
    </LinearGradient>
  );
}

function KpiGrid({ kpis, onPress }: { kpis: AnalyticsKpis; onPress: () => void }) {
  const { t } = useTranslation('insights');
  const items: { label: string; value: number }[] = [
    { label: t('kpis.profileViews'), value: kpis.profileViews },
    { label: t('kpis.saves'), value: kpis.saves },
    { label: t('kpis.messages'), value: kpis.messagesReceived },
    { label: t('kpis.bookingsClosed'), value: kpis.bookingsClosed },
  ];

  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => (
        <Pressable
          key={item.label}
          onPress={onPress}
          className="min-w-[47%] flex-1 rounded-xl border border-border bg-card p-3">
          <Text variant="caption2" className="font-extrabold uppercase tracking-wide text-muted-foreground">
            {item.label}
          </Text>
          <Text className={`${DISPLAY} mt-1 text-2xl`}>{item.value.toLocaleString(localeTag())}</Text>
          <Text variant="caption2" color="tertiary" className="mt-1">
            {t('home.last30Days')}
          </Text>
        </Pressable>
      ))}
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
  const { t } = useTranslation('insights');
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
          {t('home.setupSteps', { completed, total })}
        </Text>
        <Text style={{ color: '#1D1B20' }} className={`${DISPLAY} mt-0.5 text-[15px]`}>
          {t('home.finishSetup')}
        </Text>
      </View>
      <Icon name="chevron.right" size={15} color="#7A4500" />
    </Pressable>
  );
}

function AdsTab() {
  const router = useRouter();
  const { t } = useTranslation('insights');
  const { data, isLoading, isError, error, refetch, isRefetching } = useCampaigns();

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

  const live = data.filter((c) => isLive(c.status));
  const impressions = live.reduce((sum, c) => sum + c.impressions, 0);
  const clicks = live.reduce((sum, c) => sum + c.clicks, 0);

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
          {t('home.liveCampaigns')}
        </Text>
        <Text className={`${DISPLAY} mt-2 text-3xl text-white`}>{live.length}</Text>
        <Text variant="footnote" className="mt-1 text-white/85">
          {t('home.viewsClicks', { views: impressions.toLocaleString(localeTag()), clicks: clicks.toLocaleString(localeTag()) })}
        </Text>
      </LinearGradient>

      <View className="gap-2">
        {data.length === 0 ? (
          <Text variant="footnote" color="tertiary">
            {t('home.noCampaigns')}
          </Text>
        ) : (
          data.slice(0, 5).map((campaign) => {
            const meta = statusMeta(campaign.status);
            return (
              <View key={campaign.id} className="gap-1 rounded-xl border border-border bg-card p-3.5">
                <View className="flex-row items-center justify-between gap-2">
                  <Text variant="subhead" className="flex-1 font-bold" numberOfLines={1}>
                    {campaign.name}
                  </Text>
                  <View className={`rounded-full px-2 py-0.5 ${meta.className}`}>
                    <Text variant="caption2" className={`font-medium ${meta.className}`}>
                      {meta.label}
                    </Text>
                  </View>
                </View>
                <View className="mt-1 flex-row gap-3.5">
                  <Text variant="caption1" color="tertiary">
                    {t('home.views')} <Text className={`${DISPLAY} text-sm`}>{campaign.impressions.toLocaleString(localeTag())}</Text>
                  </Text>
                  <Text variant="caption1" color="tertiary">
                    {t('home.clicks')} <Text className={`${DISPLAY} text-sm`}>{campaign.clicks.toLocaleString(localeTag())}</Text>
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      <Button onPress={() => router.push('/(app)/more/ads')}>
        <Text>{t('home.manageCampaigns')}</Text>
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
  const { t } = useTranslation(['insights', 'common']);
  const { data, isLoading, isError, error, refetch, isRefetching } = useSubscription();

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

  const statusLine = subscriptionStatusLine(data);

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
          {`● ${statusLine}`}
        </Text>
        <Text className={`${DISPLAY} mt-2 text-3xl text-white`}>
          {data.isPremium ? (
            <>{t('home.premiumBefore')}<Text className={`${DISPLAY} text-3xl text-brand-yellow`}>{t('home.premiumAccent')}</Text>{t('home.premiumAfter')}</>
          ) : (
            <>{t('home.freeBefore')}<Text className={`${DISPLAY} text-3xl text-brand-yellow`}>{t('home.freeAccent')}</Text>{t('home.freeAfter')}</>
          )}
        </Text>
      </LinearGradient>

      <View className="gap-2.5 rounded-xl border border-border bg-card p-4">
        <SectionLabel>{t('home.usage')}</SectionLabel>
        <UsageRow label={t('home.plan')} value={pickBilingual(data.plan, 'name') || t('common:badges.free')} />
        <UsageRow label={t('home.teamSeats')} value={`${data.seats.used} / ${data.seats.max ?? '∞'}`} />
        {data.seats.suspended > 0 ? (
          <UsageRow label={t('home.suspendedSeats')} value={String(data.seats.suspended)} />
        ) : null}
      </View>

      <Button onPress={() => router.push('/(app)/more/premium' as Href)}>
        <Text>{data.isPremium ? t('home.manageSubscription') : t('home.seePremium')}</Text>
      </Button>
    </ScrollView>
  );
}

function subscriptionStatusLine(data: SubscriptionState): string {
  if (data.rawStatus === 'cancelled' && data.currentPeriodEnd) {
    return i18n.t('insights:home.cancels', { date: formatDate(data.currentPeriodEnd) });
  }
  if (data.status === 'grace' && data.graceEndsAt) {
    return i18n.t('insights:home.paymentDue', { date: formatDate(data.graceEndsAt) });
  }
  if (data.status === 'trialing' && data.trialEndsAt) {
    return i18n.t('insights:home.trialEnds', { date: formatDate(data.trialEndsAt) });
  }
  if (data.currentPeriodEnd) return i18n.t('insights:home.renews', { date: formatDate(data.currentPeriodEnd) });
  return data.isPremium ? i18n.t('insights:home.active') : i18n.t('insights:home.freePlan');
}
