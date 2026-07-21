import { useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';

import { Card, DISPLAY, ErrorState, GradientHero, LoadingState, SectionLabel } from '@/components/brand';
import { Text } from '@/components/nativewindui/Text';
import { useAds, useCreateCampaign } from '@/Modules/ads/hooks';
import type { Campaign, CampaignDuration, CampaignStatus, Demand, Placement } from '@/Modules/ads/types';
import { getErrorMessage } from '@/lib/api-client';
import { useColorScheme } from '@/lib/useColorScheme';

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

const DURATIONS: { key: CampaignDuration; label: string; mult: number }[] = [
  { key: '1w', label: '1 week', mult: 1 },
  { key: '2w', label: '2 weeks', mult: 1.8 },
  { key: '1m', label: '1 month', mult: 3.2 },
];

function egpK(n: number) {
  return n >= 1000 ? `EGP ${Math.round(n / 1000)}k` : `EGP ${n}`;
}

export default function AdsScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useAds();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderPlacement, setBuilderPlacement] = useState<Placement | null>(null);

  const openBuilder = (placement: Placement | null) => {
    setBuilderPlacement(placement);
    setBuilderOpen(true);
  };

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
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
              <PlacementCard key={placement.id} placement={placement} onPress={() => openBuilder(placement)} />
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

        <Pressable onPress={() => openBuilder(null)} className="items-center rounded-2xl bg-foreground py-4 active:opacity-80">
          <Text className="font-bold text-background">＋ Create new campaign</Text>
        </Pressable>
      </ScrollView>

      <CampaignBuilder
        visible={builderOpen}
        placements={data.placements}
        initialPlacement={builderPlacement}
        onClose={() => setBuilderOpen(false)}
      />
    </View>
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

const STEP_TITLES = ['Pick a placement', 'Campaign details', 'Ad creative', 'Review & pay'];

function CampaignBuilder({
  visible,
  placements,
  initialPlacement,
  onClose,
}: {
  visible: boolean;
  placements: Placement[];
  initialPlacement: Placement | null;
  onClose: () => void;
}) {
  const { colors } = useColorScheme();
  const createCampaign = useCreateCampaign();

  const [step, setStep] = useState(0);
  const [placementId, setPlacementId] = useState<string | null>(initialPlacement?.id ?? null);
  const [name, setName] = useState('');
  const [city, setCity] = useState('Cairo');
  const [duration, setDuration] = useState<CampaignDuration>('2w');
  const [headline, setHeadline] = useState('');
  const [ctaText, setCtaText] = useState('Book now');

  // Reset the wizard whenever it is re-opened.
  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setStep(initialPlacement ? 1 : 0);
      setPlacementId(initialPlacement?.id ?? null);
      setName('');
      setCity('Cairo');
      setDuration('2w');
      setHeadline('');
      setCtaText('Book now');
      createCampaign.reset();
    }
  }

  const placement = placements.find((p) => p.id === placementId) ?? null;
  const mult = DURATIONS.find((d) => d.key === duration)?.mult ?? 1;
  const price = placement ? Math.round(placement.priceFrom * mult) : 0;

  const canNext =
    (step === 0 && !!placementId) ||
    (step === 1 && name.trim().length > 0 && city.trim().length > 0) ||
    (step === 2 && headline.trim().length > 0) ||
    step === 3;

  const next = () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    if (!placementId) return;
    createCampaign.mutate(
      { name: name.trim(), placementId, city: city.trim(), duration, headline: headline.trim(), ctaText: ctaText.trim() },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[88%] gap-4 rounded-t-3xl bg-background px-5 pb-8 pt-4">
          <View className="h-1 w-10 self-center rounded-full bg-muted" />

          <View className="flex-row items-center justify-between">
            <Text className={`${DISPLAY} text-2xl`}>{STEP_TITLES[step].toLowerCase()}.</Text>
            <Pressable onPress={onClose}>
              <Text variant="footnote" color="tertiary">
                Cancel
              </Text>
            </Pressable>
          </View>

          {/* Step progress */}
          <View className="flex-row gap-1.5">
            {STEP_TITLES.map((_, i) => (
              <View key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 pb-2">
            {step === 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {placements.map((p) => {
                  const on = p.id === placementId;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => setPlacementId(p.id)}
                      className={`min-w-[47%] flex-1 gap-1 rounded-xl border p-3 ${on ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                      <Text variant="footnote" className="font-bold">
                        {p.name}
                      </Text>
                      <Text className={`${DISPLAY} text-sm`}>{`from ${egpK(p.priceFrom)}`}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {step === 1 ? (
              <>
                <Field label="Campaign name">
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Spring atelier slots"
                    placeholderTextColor={colors.grey}
                    className="rounded-xl bg-muted px-4 py-3.5 text-foreground"
                  />
                </Field>
                <Field label="City / region">
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="Cairo"
                    placeholderTextColor={colors.grey}
                    className="rounded-xl bg-muted px-4 py-3.5 text-foreground"
                  />
                </Field>
                <Field label="Duration">
                  <View className="flex-row gap-2">
                    {DURATIONS.map((d) => {
                      const on = d.key === duration;
                      return (
                        <Pressable
                          key={d.key}
                          onPress={() => setDuration(d.key)}
                          className={`flex-1 items-center rounded-xl px-2 py-2.5 ${on ? 'bg-primary' : 'border border-border'}`}>
                          <Text variant="caption1" className={`font-bold ${on ? 'text-white' : 'text-foreground'}`}>
                            {d.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Field>
                <PriceLine price={price} />
              </>
            ) : null}

            {step === 2 ? (
              <>
                <View className="items-center justify-center rounded-xl border border-dashed border-border bg-card py-8">
                  <Text variant="footnote" color="tertiary">
                    ＋ Upload image (1:1, max 5MB)
                  </Text>
                </View>
                <Field label="Headline (max 60 chars)">
                  <TextInput
                    value={headline}
                    onChangeText={(t) => setHeadline(t.slice(0, 60))}
                    placeholder="Couture gowns, made for you"
                    placeholderTextColor={colors.grey}
                    className="rounded-xl bg-muted px-4 py-3.5 text-foreground"
                  />
                </Field>
                <Field label="CTA button text">
                  <TextInput
                    value={ctaText}
                    onChangeText={setCtaText}
                    placeholder="Book now"
                    placeholderTextColor={colors.grey}
                    className="rounded-xl bg-muted px-4 py-3.5 text-foreground"
                  />
                </Field>
              </>
            ) : null}

            {step === 3 ? (
              <Card className="gap-2.5">
                <ReviewRow label="Placement" value={placement?.name ?? '—'} />
                <ReviewRow label="Campaign" value={name || '—'} />
                <ReviewRow label="City" value={city} />
                <ReviewRow label="Duration" value={DURATIONS.find((d) => d.key === duration)?.label ?? ''} />
                <ReviewRow label="Headline" value={headline || '—'} />
                <View className="mt-1 flex-row items-center justify-between border-t border-border pt-2.5">
                  <Text variant="footnote" className="font-bold">
                    Total
                  </Text>
                  <Text className={`${DISPLAY} text-xl`}>{egpK(price)}</Text>
                </View>
                <Text variant="caption2" color="tertiary">
                  Campaign goes live immediately after payment — no admin review.
                </Text>
              </Card>
            ) : null}

            {createCampaign.isError ? (
              <Text variant="footnote" className="text-destructive">
                {getErrorMessage(createCampaign.error)}
              </Text>
            ) : null}
          </ScrollView>

          <View className="flex-row gap-2">
            {step > 0 ? (
              <Pressable
                onPress={() => setStep(step - 1)}
                className="items-center rounded-2xl border border-border px-6 py-4 active:opacity-80">
                <Text className="font-bold text-foreground">Back</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={next}
              disabled={!canNext || createCampaign.isPending}
              className={`flex-1 items-center rounded-2xl bg-primary py-4 ${canNext && !createCampaign.isPending ? 'active:opacity-80' : 'opacity-50'}`}>
              <Text className="font-bold text-white">
                {step < 3 ? 'Continue' : createCampaign.isPending ? 'Processing…' : `Pay ${egpK(price)}`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text variant="caption2" className="font-extrabold uppercase tracking-wide text-muted-foreground">
        {label}
      </Text>
      {children}
    </View>
  );
}

function PriceLine({ price }: { price: number }) {
  return (
    <View className="flex-row items-center justify-between rounded-xl bg-muted px-4 py-3">
      <Text variant="footnote" color="tertiary">
        Price
      </Text>
      <Text className={`${DISPLAY} text-lg`}>{egpK(price)}</Text>
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text variant="footnote" color="tertiary">
        {label}
      </Text>
      <Text variant="footnote" className="flex-1 text-right font-medium" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
