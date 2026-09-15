import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { Card, DISPLAY, ErrorState, GradientHero, LoadingState, SafeTop, ScreenTitle, SectionLabel, SegmentedRange } from '@/components/brand';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format';
import { localeTag } from '@/lib/i18n';
import { textEnd, useIsRTL } from '@/lib/rtl';
import { useCampaigns } from '@/Modules/ads/hooks';
import { isLive } from '@/Modules/ads/status';
import { FunnelBars } from '@/Modules/analytics/components/FunnelBars';
import {
  useAnalyticsFunnel,
  useAnalyticsKpis,
  useConversionRates,
  useSourceBreakdown,
} from '@/Modules/analytics/hooks';
import type {
  AnalyticsKpis,
  AnalyticsRange,
  AnalyticsSources,
  ConversionRates,
  InquirySource,
} from '@/Modules/analytics/types';
import { useFinanceSummary } from '@/Modules/finance/hooks';

const RANGE_KEYS: AnalyticsRange[] = ['7d', '30d', '90d', '1y'];

const SOURCE_KEYS: InquirySource[] = ['browse', 'explore', 'ad', 'task', 'direct', 'unknown'];

function moneyK(n: number, currency: string) {
  return n >= 1000 ? `${currency} ${Math.round(n / 1000)}k` : `${currency} ${Math.round(n)}`;
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const { t } = useTranslation(['insights', 'common']);
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const ranges = RANGE_KEYS.map((key) => ({ key, label: t(`ranges.${key}`) }));
  const kpis = useAnalyticsKpis(range);
  const funnel = useAnalyticsFunnel(range);
  const conversion = useConversionRates(range);
  const sources = useSourceBreakdown(range);
  const finance = useFinanceSummary();
  const campaigns = useCampaigns();

  const refetchAll = () => {
    void kpis.refetch();
    void funnel.refetch();
    void conversion.refetch();
    void sources.refetch();
    void finance.refetch();
    void campaigns.refetch();
  };

  const liveCampaigns = (campaigns.data ?? []).filter((c) => isLive(c.status));
  const adImpressions = liveCampaigns.reduce((sum, c) => sum + c.impressions, 0);
  const premiumLocked = conversion.data?.locked === true;

  return (
    <View className="flex-1 bg-background">
      <SafeTop />
      <ScreenTitle eyebrow={t('analytics.eyebrow')} title={t('analytics.title')} />
      <View className="px-5 pb-1">
        <SegmentedRange value={range} options={ranges} onChange={setRange} />
      </View>

      {kpis.isLoading ? (
        <LoadingState />
      ) : kpis.isError || !kpis.data ? (
        <ErrorState message={getErrorMessage(kpis.error)} onRetry={refetchAll} />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-8 pt-3"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={kpis.isRefetching} onRefresh={refetchAll} />}>
          <KpiGrid kpis={kpis.data} />

          <View>
            <SectionLabel>{t('analytics.funnel')}</SectionLabel>
            <FunnelBars stages={funnel.data?.stages ?? []} />
          </View>

          <View>
            <SectionLabel>{premiumLocked ? t('analytics.conversionRatesPremium') : t('analytics.conversionRates')}</SectionLabel>
            {conversion.isLoading ? (
              <Card>
                <Text variant="footnote" color="tertiary">
                  {t('common:actions.loading')}
                </Text>
              </Card>
            ) : conversion.isError ? (
              <Card>
                <Text variant="footnote" color="tertiary">
                  {getErrorMessage(conversion.error)}
                </Text>
              </Card>
            ) : conversion.data?.locked ? (
              <Pressable onPress={() => router.push('/(app)/more/premium')}>
                <Card>
                  <Text variant="footnote" color="tertiary">
                    {t('analytics.lockedBody')}
                  </Text>
                  <Text variant="caption1" className="mt-2 font-bold text-primary">
                    {t('analytics.seePremium')}
                  </Text>
                </Card>
              </Pressable>
            ) : conversion.data && !conversion.data.data.available ? (
              <Card>
                <Text variant="footnote" color="tertiary">
                  {t('analytics.notEnoughData')}
                </Text>
              </Card>
            ) : conversion.data ? (
              <ConversionCard conversion={conversion.data.data} />
            ) : null}
          </View>

          {sources.data && !sources.data.locked ? (
            <View>
              <SectionLabel>{t('analytics.sources')}</SectionLabel>
              <SourcesCard sources={sources.data.data} currency={finance.data?.currencyCode ?? 'EGP'} />
            </View>
          ) : null}

          {finance.data ? (
            <Pressable onPress={() => router.push('/(app)/finance')}>
              <GradientHero>
                <Text variant="caption2" className="font-extrabold uppercase tracking-wider text-white/85">
                  {t('analytics.finance')}
                </Text>
                <View className="mt-3 flex-row justify-between">
                  <FinanceStat label={t('analytics.thisMonth')} value={moneyK(finance.data.receivedThisMonth, finance.data.currencyCode)} />
                  <FinanceStat label={t('analytics.outstanding')} value={moneyK(finance.data.outstanding, finance.data.currencyCode)} />
                  <FinanceStat label={t('analytics.openQuotes')} value={String(finance.data.openQuotes)} />
                </View>
                <Text variant="caption1" className="mt-3 font-bold text-brand-yellow">
                  {t('analytics.openFinance')}
                </Text>
              </GradientHero>
            </Pressable>
          ) : null}

          <Pressable onPress={() => router.push('/(app)/more/ads')}>
            <GradientHero colors={['#FF318A', '#661C33']}>
              <Text variant="caption2" className="font-extrabold uppercase tracking-wider text-white/85">
                {t('analytics.ads')}
              </Text>
              <Text className={`${DISPLAY} mt-2 text-3xl text-white`}>
                {liveCampaigns.length} <Text className={`${DISPLAY} text-lg text-brand-yellow`}>{t('analytics.live')}</Text>
              </Text>
              <Text variant="footnote" className="mt-1 text-white/85">
                {t('analytics.liveImpressions', { value: adImpressions.toLocaleString(localeTag()) })}
              </Text>
              <Text variant="caption1" className="mt-3 font-bold text-brand-yellow">
                {t('analytics.manageCampaigns')}
              </Text>
            </GradientHero>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function FinanceStat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text variant="caption2" className="uppercase tracking-wide text-white/60">
        {label}
      </Text>
      <Text className={`${DISPLAY} mt-0.5 text-lg text-white`}>{value}</Text>
    </View>
  );
}

function KpiGrid({ kpis }: { kpis: AnalyticsKpis }) {
  const { t } = useTranslation(['insights', 'common']);
  const items: { label: string; value: string }[] = [
    { label: t('kpis.profileViews'), value: kpis.profileViews.toLocaleString(localeTag()) },
    { label: t('kpis.saves'), value: kpis.saves.toLocaleString(localeTag()) },
    { label: t('kpis.messages'), value: kpis.messagesReceived.toLocaleString(localeTag()) },
    { label: t('kpis.meetings'), value: kpis.meetingsScheduled.toLocaleString(localeTag()) },
    {
      label: t('kpis.avgResponse'),
      value: kpis.averageResponseMinutes != null ? t('common:time.minutesShort', { count: kpis.averageResponseMinutes }) : '—',
    },
    { label: t('kpis.bookings'), value: kpis.bookingsClosed.toLocaleString(localeTag()) },
  ];

  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => (
        <View key={item.label} className="min-w-[47%] flex-1 rounded-xl border border-border bg-card p-3">
          <Text variant="caption2" className="font-extrabold uppercase tracking-wide text-muted-foreground">
            {item.label}
          </Text>
          <Text className={`${DISPLAY} mt-1 text-2xl`}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function ConversionCard({ conversion }: { conversion: ConversionRates }) {
  const { t } = useTranslation('insights');
  const rows: { label: string; value: number | null }[] = [
    { label: t('conversion.viewToSave'), value: conversion.viewToSave },
    { label: t('conversion.saveToMessage'), value: conversion.saveToMessage },
    { label: t('conversion.messageToMeeting'), value: conversion.messageToMeeting },
    { label: t('conversion.meetingToBooking'), value: conversion.meetingToBooking },
  ];

  return (
    <Card className="gap-3">
      {rows.map((row) => (
        <View key={row.label} className="gap-1">
          <View className="flex-row items-baseline justify-between">
            <Text variant="footnote" className="font-bold">
              {row.label}
            </Text>
            <Text className={`${DISPLAY} text-sm`}>{row.value != null ? `${row.value}%` : '—'}</Text>
          </View>
          <View className="h-2.5 overflow-hidden rounded-full bg-muted">
            <View className="h-full rounded-full bg-primary" style={{ width: `${Math.min(row.value ?? 0, 100)}%` }} />
          </View>
        </View>
      ))}
      {conversion.overall != null ? (
        <Text variant="caption1" color="tertiary">
          {t('conversion.overall', { value: conversion.overall })}
        </Text>
      ) : null}
    </Card>
  );
}

function SourcesCard({ sources, currency }: { sources: AnalyticsSources; currency: string }) {
  const { t } = useTranslation('insights');
  const endAlign = textEnd(useIsRTL());
  if (sources.bySource.length === 0) {
    return (
      <Card>
        <Text variant="footnote" color="tertiary">
          {t('sources.empty')}
        </Text>
      </Card>
    );
  }
  return (
    <Card className="gap-2.5">
      {sources.bySource.map((s) => (
        <View key={s.source} className="flex-row items-center justify-between gap-2">
          <Text variant="footnote" className="flex-1 font-bold">
            {SOURCE_KEYS.includes(s.source) ? t(`sources.${s.source}`) : s.source}
          </Text>
          <Text variant="caption1" color="tertiary">
            {t('sources.counts', { chats: s.conversations, booked: s.bookings })}
          </Text>
          <Text className={`${DISPLAY} w-24 ${endAlign} text-sm`}>{formatCurrency(s.revenue, currency)}</Text>
        </View>
      ))}
      <Text variant="caption2" color="tertiary">
        {t('sources.adAttributed', { count: sources.adAttributedBookings })}
      </Text>
    </Card>
  );
}
