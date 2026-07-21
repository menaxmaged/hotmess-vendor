import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { Card, DISPLAY, ErrorState, GradientHero, LoadingState, SectionLabel } from '@/components/brand';
import { Text } from '@/components/nativewindui/Text';
import { useAds } from '@/Modules/ads/hooks';
import type { Campaign, CampaignStatus, Demand, Placement } from '@/Modules/ads/types';
import { getErrorMessage } from '@/lib/api-client';

const STATUS_META: Record<CampaignStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  pending: { label: 'Review', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  completed: { label: 'Done', className: 'bg-muted text-muted-foreground' },
  paused: { label: 'Paused', className: 'bg-muted text-muted-foreground' },
};

const DEMAND_COLOR: Record<Demand, string> = {
  Highest: '#FF318A',
  High: '#7D5BFF',
  Medium: '#0EA5E9',
};

function egpK(n: number) {
  return n >= 1000 ? `EGP ${Math.round(n / 1000)}k` : `EGP ${n}`;
}

export default function AdsScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useAds();

  const onCreate = () =>
    Alert.alert('Create campaign', 'The 4-step campaign builder (placement → details → creative → pay) opens here.');

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 px-5 pb-8 pt-4"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
      <GradientHero colors={['#FF318A', '#661C33']}>
        <Text variant="caption2" className="font-extrabold uppercase tracking-wider text-white/85">
          This month · ad return
        </Text>
        <Text className={`${DISPLAY} mt-2 text-3xl text-white`}>
          {`${data.roiX}×`} <Text className={`${DISPLAY} text-lg text-brand-yellow`}>ROI</Text>
        </Text>
        <Text variant="footnote" className="mt-1.5 text-white/85">
          {`${egpK(data.spent)} spent · ${egpK(data.quoted)} quoted from ads`}
        </Text>
      </GradientHero>

      <View>
        <SectionLabel>Placements</SectionLabel>
        <View className="flex-row flex-wrap gap-2">
          {data.placements.map((placement) => (
            <PlacementCard key={placement.id} placement={placement} onPress={onCreate} />
          ))}
        </View>
      </View>

      <View>
        <SectionLabel>My campaigns · {data.campaigns.length}</SectionLabel>
        <View className="gap-2">
          {data.campaigns.map((campaign) => (
            <CampaignRow key={campaign.id} campaign={campaign} />
          ))}
        </View>
      </View>

      <Pressable onPress={onCreate} className="items-center rounded-2xl bg-foreground py-4 active:opacity-80">
        <Text className="font-bold text-background">＋ Create new campaign</Text>
      </Pressable>
    </ScrollView>
  );
}

function PlacementCard({ placement, onPress }: { placement: Placement; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="min-w-[47%] flex-1 gap-2 rounded-xl border border-border bg-card p-3.5 active:opacity-80">
      <View className="flex-row items-center justify-between">
        <Text variant="footnote" className="font-bold">
          {placement.name}
        </Text>
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${DEMAND_COLOR[placement.demand]}20` }}>
          <Text variant="caption2" className="font-bold" style={{ color: DEMAND_COLOR[placement.demand] }}>
            {placement.demand}
          </Text>
        </View>
      </View>
      <Text variant="caption2" color="tertiary" numberOfLines={2}>
        {placement.description}
      </Text>
      <View className="flex-row items-baseline justify-between">
        <Text variant="caption2" color="tertiary">
          {placement.slots}
        </Text>
        <Text className={`${DISPLAY} text-sm`}>{`${egpK(placement.priceFrom)}`}</Text>
      </View>
    </Pressable>
  );
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const meta = STATUS_META[campaign.status];
  return (
    <Card className="gap-2">
      <View className="flex-row items-start justify-between gap-2">
        <Text variant="footnote" className="flex-1 font-bold">
          {campaign.name}
        </Text>
        <View className={`rounded-full px-2 py-0.5 ${meta.className}`}>
          <Text variant="caption2" className={`font-medium ${meta.className}`}>
            {meta.label}
          </Text>
        </View>
      </View>
      <Text variant="caption1" color="tertiary">
        {campaign.placement}
      </Text>
      <View className="flex-row gap-4">
        <Text variant="caption2" color="tertiary">
          Views <Text className={`${DISPLAY} text-xs`}>{campaign.impressions.toLocaleString()}</Text>
        </Text>
        <Text variant="caption2" color="tertiary">
          Clicks <Text className={`${DISPLAY} text-xs`}>{campaign.clicks.toLocaleString()}</Text>
        </Text>
      </View>
    </Card>
  );
}
