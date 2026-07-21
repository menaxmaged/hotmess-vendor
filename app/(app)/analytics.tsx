import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { Card, DISPLAY, ErrorState, GradientHero, LoadingState, ScreenTitle, SectionLabel, SegmentedRange } from '@/components/brand';
import { Text } from '@/components/nativewindui/Text';
import { useAnalyticsOverview } from '@/Modules/analytics/hooks';
import type { AnalyticsKpis, AnalyticsRange, ConversionRates } from '@/Modules/analytics/types';
import { getErrorMessage } from '@/lib/api-client';

const RANGES: { key: AnalyticsRange; label: string }[] = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: '1y', label: '1y' },
];

function egpK(n: number) {
  return n >= 1000 ? `EGP ${Math.round(n / 1000)}k` : `EGP ${n}`;
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const { data, isLoading, isError, error, refetch, isRefetching } = useAnalyticsOverview(range);

  return (
    <View className="flex-1 bg-background">
      <ScreenTitle eyebrow="Performance" title="analytics." />
      <View className="px-5 pb-1">
        <SegmentedRange value={range} options={RANGES} onChange={setRange} />
      </View>

      {isLoading ? (
        <LoadingState />
      ) : isError || !data ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-8 pt-3"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
          <KpiGrid kpis={data.kpis} />

          <View>
            <SectionLabel>Conversion rates{data.isPremium ? '' : ' · premium'}</SectionLabel>
            {!data.isPremium ? (
              <Card>
                <Text variant="footnote" color="tertiary">
                  Upgrade to Premium to unlock conversion rates and campaign insights.
                </Text>
              </Card>
            ) : !data.hasEnoughData || !data.conversion ? (
              <Card>
                <Text variant="footnote" color="tertiary">
                  Not enough data yet — needs at least 10 profile views in this period.
                </Text>
              </Card>
            ) : (
              <ConversionCard conversion={data.conversion} />
            )}
          </View>

          <Pressable onPress={() => router.push('/(app)/finance')}>
            <GradientHero>
              <Text variant="caption2" className="font-extrabold uppercase tracking-wider text-white/85">
                Finance · this period
              </Text>
              <View className="mt-3 flex-row justify-between">
                <FinanceStat label="Received" value={egpK(data.finance.received)} />
                <FinanceStat label="Pending" value={egpK(data.finance.pending)} />
                <FinanceStat label="Quoted" value={egpK(data.finance.quoted)} />
              </View>
              <Text variant="caption1" className="mt-3 font-bold text-brand-yellow">
                Open finance →
              </Text>
            </GradientHero>
          </Pressable>

          <Pressable onPress={() => router.push('/(app)/more/ads')}>
            <GradientHero colors={['#FF318A', '#661C33']}>
              <Text variant="caption2" className="font-extrabold uppercase tracking-wider text-white/85">
                Ads · this month
              </Text>
              <Text className={`${DISPLAY} mt-2 text-3xl text-white`}>
                {`${data.ads.roiX}×`} <Text className={`${DISPLAY} text-lg text-brand-yellow`}>ROI</Text>
              </Text>
              <Text variant="footnote" className="mt-1 text-white/85">
                {`${data.ads.impressions.toLocaleString()} impressions · ${data.ads.activeCampaigns} active`}
              </Text>
              <Text variant="caption1" className="mt-3 font-bold text-brand-yellow">
                Manage campaigns →
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

function Delta({ deltaPct, invert }: { deltaPct: number; invert?: boolean }) {
  const good = invert ? deltaPct <= 0 : deltaPct >= 0;
  return (
    <Text variant="caption2" className={`font-extrabold ${good ? 'text-brand-green' : 'text-destructive'}`}>
      {`${deltaPct >= 0 ? '↑' : '↓'} ${Math.abs(deltaPct)}%`}
    </Text>
  );
}

function KpiGrid({ kpis }: { kpis: AnalyticsKpis }) {
  const items: { key: keyof AnalyticsKpis; label: string; fmt?: (n: number) => string; invert?: boolean }[] = [
    { key: 'profileViews', label: 'Profile views' },
    { key: 'saves', label: 'Saves' },
    { key: 'messages', label: 'Messages' },
    { key: 'meetings', label: 'Meetings' },
    { key: 'avgResponseMins', label: 'Avg response', fmt: (n) => `${n}m`, invert: true },
    { key: 'bookings', label: 'Bookings' },
  ];

  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => {
        const m = kpis[item.key];
        return (
          <View key={item.key} className="min-w-[47%] flex-1 rounded-xl border border-border bg-card p-3">
            <Text variant="caption2" className="font-extrabold uppercase tracking-wide text-muted-foreground">
              {item.label}
            </Text>
            <Text className={`${DISPLAY} mt-1 text-2xl`}>
              {item.fmt ? item.fmt(m.value) : m.value.toLocaleString()}
            </Text>
            <View className="mt-1">
              <Delta deltaPct={m.deltaPct} invert={item.invert} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ConversionCard({ conversion }: { conversion: ConversionRates }) {
  const rows: { label: string; value: number }[] = [
    { label: 'Save → message', value: conversion.saveToMessage },
    { label: 'Message → meeting', value: conversion.messageToMeeting },
    { label: 'Meeting → booking', value: conversion.meetingToBooking },
  ];

  return (
    <Card className="gap-3">
      {rows.map((row) => (
        <View key={row.label} className="gap-1">
          <View className="flex-row items-baseline justify-between">
            <Text variant="footnote" className="font-bold">
              {row.label}
            </Text>
            <Text className={`${DISPLAY} text-sm`}>{`${row.value}%`}</Text>
          </View>
          <View className="h-2.5 overflow-hidden rounded-full bg-muted">
            <View className="h-full rounded-full bg-primary" style={{ width: `${Math.min(row.value, 100)}%` }} />
          </View>
        </View>
      ))}
    </Card>
  );
}
