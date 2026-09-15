import { useActionSheet } from '@expo/react-native-action-sheet';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Modal, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';

import { Card, DISPLAY, ErrorState, GradientHero, LoadingState, SectionLabel } from '@/components/brand';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { DatePicker } from '@/components/nativewindui/DatePicker';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/format';
import { localeTag } from '@/lib/i18n';
import { pickBilingual } from '@/lib/localized';
import { textEnd, useIsRTL } from '@/lib/rtl';
import { useColorScheme } from '@/lib/useColorScheme';
import { isPaymentProviderUnavailable } from '@/Modules/ads/api';
import {
  useAvailability,
  useCampaign,
  useCampaigns,
  useCancelCampaign,
  useCreateCampaign,
  usePauseCampaign,
  usePayCampaign,
  usePlacement,
  usePlacements,
  useResumeCampaign,
  useUpdateCreative,
} from '@/Modules/ads/hooks';
import type { Campaign, DurationTier, OutgoingFile, Placement } from '@/Modules/ads/types';
import { isLive, statusMeta } from '@/Modules/ads/status';
import { useCategoryOptions } from '@/Modules/profile/hooks';

const DURATIONS: DurationTier[] = ['one_week', 'two_weeks', 'one_month'];

const ctrPct = (c: Pick<Campaign, 'ctr' | 'clicks' | 'impressions'>) =>
  c.ctr ?? (c.impressions > 0 ? (c.clicks / c.impressions) * 100 : null);

async function pickImage(): Promise<OutgoingFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;
  return {
    uri: asset.uri,
    name: asset.fileName ?? `creative-${Date.now()}.jpg`,
    type: asset.mimeType ?? 'image/jpeg',
  };
}

/** Pay opens a hosted checkout; the campaign only goes live when the webhook confirms. */
function usePayFlow(onReturn: () => void) {
  const { t } = useTranslation('growth');
  const pay = usePayCampaign();
  const run = (campaignId: string) =>
    pay.mutate(campaignId, {
      onSuccess: async (checkout) => {
        await WebBrowser.openBrowserAsync(checkout.redirectUrl);
        onReturn();
      },
      onError: (err) => {
        if (isPaymentProviderUnavailable(err)) {
          Alert.alert(t('ads.paymentsOffTitle'), t('ads.paymentsOffBody'));
        } else {
          Alert.alert(t('ads.paymentFailed'), getErrorMessage(err));
        }
      },
    });
  return { run, isPending: pay.isPending };
}

export default function AdsScreen() {
  const { t } = useTranslation(['growth', 'common']);
  const { showActionSheetWithOptions } = useActionSheet();
  const placementsQuery = usePlacements();
  const campaignsQuery = useCampaigns();
  const pause = usePauseCampaign();
  const resume = useResumeCampaign();
  const cancel = useCancelCampaign();
  const payFlow = usePayFlow(() => void campaignsQuery.refetch());

  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderPlacement, setBuilderPlacement] = useState<Placement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openBuilder = (placement: Placement | null) => {
    setBuilderPlacement(placement);
    setBuilderOpen(true);
  };

  const onError = (title: string) => (err: unknown) => Alert.alert(title, getErrorMessage(err));

  const confirmCancel = (campaign: Campaign) =>
    Alert.alert(
      t('ads.cancelTitle', { name: campaign.name }),
      t('ads.cancelBody'),
      [
        { text: t('ads.keep'), style: 'cancel' },
        {
          text: t('ads.cancelCampaign'),
          style: 'destructive',
          onPress: () => cancel.mutate(campaign.id, { onError: onError(t('ads.cancelFailed')) }),
        },
      ],
    );

  const openCampaignActions = (campaign: Campaign) => {
    const actions: { label: string; run: () => void; destructive?: boolean }[] = [];
    if (campaign.status === 'pending_payment') {
      actions.push({ label: t('ads.payNow'), run: () => payFlow.run(campaign.id) });
    }
    if (isLive(campaign.status)) {
      actions.push({ label: t('ads.editCreative'), run: () => setEditingId(campaign.id) });
      actions.push({ label: t('ads.pause'), run: () => pause.mutate(campaign.id, { onError: onError(t('ads.pauseFailed')) }) });
    }
    if (campaign.status === 'paused') {
      actions.push({ label: t('ads.resume'), run: () => resume.mutate(campaign.id, { onError: onError(t('ads.resumeFailed')) }) });
    }
    if (['pending_payment', 'scheduled', 'live', 'active', 'paused'].includes(campaign.status)) {
      actions.push({ label: t('ads.cancelCampaign'), run: () => confirmCancel(campaign), destructive: true });
    }
    if (actions.length === 0) return;

    const options = [...actions.map((a) => a.label), t('ads.close')];
    const destructiveIndex = actions.findIndex((a) => a.destructive);
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: destructiveIndex >= 0 ? destructiveIndex : undefined,
        title: campaign.name,
      },
      (index) => {
        if (index === undefined || index >= actions.length) return;
        actions[index]!.run();
      },
    );
  };

  if (placementsQuery.isLoading || campaignsQuery.isLoading) return <LoadingState />;
  if (placementsQuery.isError || campaignsQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(placementsQuery.error ?? campaignsQuery.error)}
        onRetry={() => {
          void placementsQuery.refetch();
          void campaignsQuery.refetch();
        }}
      />
    );
  }

  const placements = placementsQuery.data ?? [];
  const campaigns = campaignsQuery.data ?? [];
  const liveCount = campaigns.filter((c) => isLive(c.status)).length;
  const impressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const clicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const overallCtr = impressions > 0 ? (clicks / impressions) * 100 : null;
  const busy = pause.isPending || resume.isPending || cancel.isPending || payFlow.isPending;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={placementsQuery.isRefetching || campaignsQuery.isRefetching}
            onRefresh={() => {
              void placementsQuery.refetch();
              void campaignsQuery.refetch();
            }}
          />
        }>
        <GradientHero colors={['#FF318A', '#661C33']}>
          <Text variant="caption2" className="font-extrabold uppercase tracking-wider text-white/85">
            {t('ads.yourCampaigns')}
          </Text>
          <Text className={`${DISPLAY} mt-2 text-3xl text-white`}>
            {liveCount} <Text className={`${DISPLAY} text-lg text-brand-yellow`}>{t('ads.live')}</Text>
          </Text>
          <Text variant="footnote" className="mt-1.5 text-white/85">
            {`${t('ads.heroStats', {
              views: impressions.toLocaleString(localeTag()),
              clicks: clicks.toLocaleString(localeTag()),
            })}${overallCtr != null ? t('ads.heroCtr', { ctr: overallCtr.toFixed(1) }) : ''}`}
          </Text>
        </GradientHero>

        <View>
          <SectionLabel>{t('ads.placements')}</SectionLabel>
          {placements.length === 0 ? (
            <Card>
              <Text variant="footnote" color="tertiary">
                {t('ads.noPlacements')}
              </Text>
            </Card>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {placements.map((placement) => (
                <PlacementCard key={placement.id} placement={placement} onPress={() => openBuilder(placement)} />
              ))}
            </View>
          )}
        </View>

        <View>
          <View className="flex-row items-center justify-between">
            <SectionLabel>{t('ads.myCampaigns', { value: campaigns.length })}</SectionLabel>
            {busy ? <ActivityIndicator size="small" /> : null}
          </View>
          {campaigns.length === 0 ? (
            <Card>
              <Text variant="footnote" color="tertiary">
                {t('ads.noCampaigns')}
              </Text>
            </Card>
          ) : (
            <View className="gap-2">
              {campaigns.map((campaign) => (
                <CampaignRow key={campaign.id} campaign={campaign} onPress={() => openCampaignActions(campaign)} />
              ))}
            </View>
          )}
        </View>

        {placements.length > 0 ? (
          <Pressable onPress={() => openBuilder(null)} className="items-center rounded-2xl bg-foreground py-4 active:opacity-80">
            <Text className="font-bold text-background">{t('ads.createNew')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {builderOpen ? (
        <CampaignBuilder
          placements={placements}
          initialPlacement={builderPlacement}
          onClose={() => setBuilderOpen(false)}
          onCreated={(campaign) => {
            setBuilderOpen(false);
            payFlow.run(campaign.id);
          }}
        />
      ) : null}

      {editingId ? <EditCreativeModal campaignId={editingId} onClose={() => setEditingId(null)} /> : null}
    </View>
  );
}

function PlacementCard({ placement, onPress }: { placement: Placement; onPress: () => void }) {
  const { t } = useTranslation('growth');
  return (
    <Pressable onPress={onPress} className="min-w-[47%] flex-1 gap-2 rounded-xl border border-border bg-card p-3.5 active:opacity-80">
      <Text variant="footnote" className="font-bold">
        {pickBilingual(placement, 'name')}
      </Text>
      {placement.demandLabel ? (
        <View className="self-start rounded-full bg-primary/10 px-2 py-0.5">
          <Text variant="caption2" className="font-bold text-primary">
            {placement.demandLabel}
          </Text>
        </View>
      ) : null}
      <Text variant="caption2" color="tertiary">
        {t('ads.tapToBuild')}
      </Text>
    </Pressable>
  );
}

function CampaignRow({ campaign, onPress }: { campaign: Campaign; onPress: () => void }) {
  const { t } = useTranslation('growth');
  const meta = statusMeta(campaign.status);
  const ctr = ctrPct(campaign);
  const where = [campaign.placementName, campaign.cityName].filter(Boolean).join(' · ');
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
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
        {where ? (
          <Text variant="caption1" color="tertiary">
            {where}
          </Text>
        ) : null}
        {campaign.startsOn ? (
          <Text variant="caption2" color="tertiary">
            {`${formatDate(campaign.startsOn)}${campaign.endsOn ? ` → ${formatDate(campaign.endsOn)}` : ''}`}
          </Text>
        ) : null}
        <View className="flex-row flex-wrap gap-x-4 gap-y-1">
          <Stat label={t('ads.stats.views')} value={campaign.impressions.toLocaleString(localeTag())} />
          <Stat label={t('ads.stats.clicks')} value={campaign.clicks.toLocaleString(localeTag())} />
          {ctr != null ? <Stat label={t('ads.stats.ctr')} value={`${ctr.toFixed(1)}%`} /> : null}
          {campaign.roi != null ? <Stat label={t('ads.stats.roi')} value={`${campaign.roi}×`} /> : null}
          {campaign.amount != null ? (
            <Stat label={t('ads.stats.price')} value={formatCurrency(campaign.amount, campaign.currencyCode ?? undefined)} />
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Text variant="caption2" color="tertiary">
      {label} <Text className={`${DISPLAY} text-xs`}>{value}</Text>
    </Text>
  );
}

const STEP_KEYS = ['placement', 'details', 'creative', 'review'] as const;

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
};

function CampaignBuilder({
  placements,
  initialPlacement,
  onClose,
  onCreated,
}: {
  placements: Placement[];
  initialPlacement: Placement | null;
  onClose: () => void;
  onCreated: (campaign: Campaign) => void;
}) {
  const { colors } = useColorScheme();
  const { t } = useTranslation(['growth', 'common']);
  const createCampaign = useCreateCampaign();
  const { data: options } = useCategoryOptions();

  // Mounted fresh on every open, so initial state is the reset.
  const [step, setStep] = useState(initialPlacement ? 1 : 0);
  const [placementId, setPlacementId] = useState<string | null>(initialPlacement?.id ?? null);
  const [name, setName] = useState('');
  const [cityId, setCityId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tier, setTier] = useState<DurationTier>('two_weeks');
  const [startsOn, setStartsOn] = useState(tomorrow);
  const [headline, setHeadline] = useState('');
  // Brides see this, so the default follows the vendor's UI language.
  const [ctaText, setCtaText] = useState(() => t('ads.ctaDefault'));
  const [creative, setCreative] = useState<OutgoingFile | null>(null);

  const { data: detail } = usePlacement(placementId);
  const monthStart = new Date(startsOn.getFullYear(), startsOn.getMonth(), 1).toISOString();
  const { data: availability } = useAvailability(placementId, {
    month: monthStart,
    cityId: cityId ?? undefined,
    vendorCategoryId: categoryId ?? undefined,
  });

  const placement = placements.find((p) => p.id === placementId) ?? null;
  const price = detail?.prices.find((p) => p.durationTier === tier) ?? null;
  const priceLabel = (t: DurationTier) => {
    const p = detail?.prices.find((x) => x.durationTier === t);
    return p ? formatCurrency(p.amount, p.currencyCode ?? undefined) : null;
  };
  const city = options?.cities.find((c) => c.id === cityId);
  const category = options?.categories.find((c) => c.id === categoryId);
  const cityName = city ? pickBilingual(city, 'name') : t('ads.allCities');
  const categoryName = category ? pickBilingual(category, 'name') : t('ads.anyCategory');
  const soldOut = availability != null && availability.remaining <= 0;

  const canNext =
    (step === 0 && !!placementId) ||
    (step === 1 && name.trim().length > 0) ||
    step === 2 ||
    step === 3;

  const next = () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    if (!placementId) return;
    createCampaign.mutate(
      {
        placementId,
        name: name.trim(),
        durationTier: tier,
        startsOn: startsOn.toISOString(),
        cityId,
        vendorCategoryId: categoryId,
        headline,
        ctaText,
        creative,
      },
      { onSuccess: onCreated },
    );
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[88%] gap-4 rounded-t-3xl bg-background px-5 pb-8 pt-4">
          <View className="h-1 w-10 self-center rounded-full bg-muted" />

          <View className="flex-row items-center justify-between">
            <Text className={`${DISPLAY} text-2xl`}>{`${t(`ads.steps.${STEP_KEYS[step]!}`).toLowerCase()}.`}</Text>
            <Pressable onPress={onClose}>
              <Text variant="footnote" color="tertiary">
                {t('common:actions.cancel')}
              </Text>
            </Pressable>
          </View>

          <View className="flex-row gap-1.5">
            {STEP_KEYS.map((_, i) => (
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
                        {pickBilingual(p, 'name')}
                      </Text>
                      {p.demandLabel ? (
                        <Text variant="caption2" color="tertiary">
                          {p.demandLabel}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {step === 1 ? (
              <>
                {detail?.description ? (
                  <Text variant="footnote" color="tertiary">
                    {detail.description}
                  </Text>
                ) : null}
                <Field label={t('ads.campaignName')}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={t('ads.namePlaceholder')}
                    placeholderTextColor={colors.grey}
                    className="rounded-xl bg-muted px-4 py-3.5 text-foreground"
                  />
                </Field>
                <Field label={t('ads.city')}>
                  <ChipRow
                    value={cityId}
                    onChange={setCityId}
                    allLabel={t('ads.allCities')}
                    items={(options?.cities ?? []).map((c) => ({ id: c.id, label: pickBilingual(c, 'name') }))}
                  />
                </Field>
                <Field label={t('ads.category')}>
                  <ChipRow
                    value={categoryId}
                    onChange={setCategoryId}
                    allLabel={t('ads.anyCategory')}
                    items={(options?.categories ?? []).map((c) => ({ id: c.id, label: pickBilingual(c, 'name') }))}
                  />
                </Field>
                <Field label={t('ads.duration')}>
                  <View className="flex-row gap-2">
                    {DURATIONS.map((durationKey) => {
                      const on = durationKey === tier;
                      const label = priceLabel(durationKey);
                      return (
                        <Pressable
                          key={durationKey}
                          onPress={() => setTier(durationKey)}
                          className={`flex-1 items-center rounded-xl px-2 py-2.5 ${on ? 'bg-primary' : 'border border-border'}`}>
                          <Text variant="caption1" className={`font-bold ${on ? 'text-white' : 'text-foreground'}`}>
                            {t(`ads.durations.${durationKey}`)}
                          </Text>
                          {label ? (
                            <Text variant="caption2" className={on ? 'text-white/80' : 'text-muted-foreground'}>
                              {label}
                            </Text>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </Field>
                <Field label={t('ads.startDate')}>
                  <DatePicker
                    value={startsOn}
                    mode="date"
                    minimumDate={tomorrow()}
                    onChange={(_event, date) => {
                      if (date) setStartsOn(date);
                    }}
                  />
                </Field>
                {availability ? (
                  <View className={`rounded-xl px-4 py-3 ${soldOut ? 'bg-red-100 dark:bg-red-950' : 'bg-muted'}`}>
                    <Text variant="footnote" className={soldOut ? 'text-red-700 dark:text-red-300' : 'text-foreground'}>
                      {soldOut
                        ? t('ads.soldOut')
                        : t('ads.slotsLeft', { remaining: availability.remaining, total: availability.slotsPerMonth })}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Pressable
                  onPress={async () => {
                    const file = await pickImage();
                    if (file) setCreative(file);
                  }}
                  className="items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-card">
                  {creative ? (
                    <Image source={{ uri: creative.uri }} style={{ width: '100%', aspectRatio: 1 }} resizeMode="cover" />
                  ) : (
                    <Text variant="footnote" color="tertiary" className="py-8">
                      {t('ads.uploadImage')}
                    </Text>
                  )}
                </Pressable>
                <Field label={t('ads.headline')}>
                  <TextInput
                    value={headline}
                    onChangeText={(t) => setHeadline(t.slice(0, 60))}
                    placeholder={t('ads.headlinePlaceholder')}
                    placeholderTextColor={colors.grey}
                    className="rounded-xl bg-muted px-4 py-3.5 text-foreground"
                  />
                </Field>
                <Field label={t('ads.buttonText')}>
                  <TextInput
                    value={ctaText}
                    onChangeText={(t) => setCtaText(t.slice(0, 30))}
                    placeholder={t('ads.ctaDefault')}
                    placeholderTextColor={colors.grey}
                    className="rounded-xl bg-muted px-4 py-3.5 text-foreground"
                  />
                </Field>
              </>
            ) : null}

            {step === 3 ? (
              <Card className="gap-2.5">
                <ReviewRow label={t('ads.review.placement')} value={placement ? pickBilingual(placement, 'name') : '—'} />
                <ReviewRow label={t('ads.review.campaign')} value={name || '—'} />
                <ReviewRow label={t('ads.review.city')} value={cityName} />
                <ReviewRow label={t('ads.review.category')} value={categoryName} />
                <ReviewRow label={t('ads.review.duration')} value={t(`ads.durations.${tier}`)} />
                <ReviewRow label={t('ads.review.starts')} value={formatDate(startsOn.toISOString())} />
                <ReviewRow label={t('ads.review.headline')} value={headline || '—'} />
                <View className="mt-1 flex-row items-center justify-between border-t border-border pt-2.5">
                  <Text variant="footnote" className="font-bold">
                    {t('ads.review.total')}
                  </Text>
                  <Text className={`${DISPLAY} text-xl`}>
                    {price ? formatCurrency(price.amount, price.currencyCode ?? undefined) : '—'}
                  </Text>
                </View>
                <Text variant="caption2" color="tertiary">
                  {t('ads.reviewNote')}
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
            {step > (initialPlacement ? 1 : 0) ? (
              <Pressable
                onPress={() => setStep(step - 1)}
                className="items-center rounded-2xl border border-border px-6 py-4 active:opacity-80">
                <Text className="font-bold text-foreground">{t('ads.back')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={next}
              disabled={!canNext || createCampaign.isPending}
              className={`flex-1 items-center rounded-2xl bg-primary py-4 ${canNext && !createCampaign.isPending ? 'active:opacity-80' : 'opacity-50'}`}>
              <Text className="font-bold text-white">
                {step < 3 ? t('ads.continue') : createCampaign.isPending ? t('ads.saving') : t('ads.savePay')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EditCreativeModal({ campaignId, onClose }: { campaignId: string; onClose: () => void }) {
  const { colors } = useColorScheme();
  const { t } = useTranslation('growth');
  const { data: campaign, isLoading } = useCampaign(campaignId);
  const updateCreative = useUpdateCreative();
  const [headline, setHeadline] = useState<string | null>(null);
  const [ctaText, setCtaText] = useState<string | null>(null);
  const [creative, setCreative] = useState<OutgoingFile | null>(null);

  const currentHeadline = headline ?? campaign?.headline ?? '';
  const currentCta = ctaText ?? campaign?.ctaText ?? '';
  const dirty = headline !== null || ctaText !== null || creative !== null;

  const onSave = () => {
    updateCreative.mutate(
      {
        id: campaignId,
        ...(headline !== null ? { headline } : {}),
        ...(ctaText !== null ? { ctaText } : {}),
        ...(creative ? { creative } : {}),
      },
      {
        onSuccess: onClose,
        onError: (err) => Alert.alert(t('ads.saveFailed'), getErrorMessage(err)),
      },
    );
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
        <Pressable onPress={() => {}} className="gap-3 rounded-t-3xl bg-background px-5 pb-8 pt-4">
          <View className="mb-1 h-1 w-10 self-center rounded-full bg-muted" />
          <Text className={`${DISPLAY} text-2xl`}>{t('ads.editTitle')}</Text>
          {isLoading ? (
            <ActivityIndicator />
          ) : (
            <>
              <Pressable
                onPress={async () => {
                  const file = await pickImage();
                  if (file) setCreative(file);
                }}
                className="items-center rounded-xl border border-dashed border-border bg-card py-4">
                <Text variant="footnote" color="tertiary">
                  {creative
                    ? t('ads.newImage', { name: creative.name })
                    : campaign?.creativeFileId
                      ? t('ads.replaceImage')
                      : t('ads.addImage')}
                </Text>
              </Pressable>
              <Field label={t('ads.headline')}>
                <TextInput
                  value={currentHeadline}
                  onChangeText={(t) => setHeadline(t.slice(0, 60))}
                  placeholderTextColor={colors.grey}
                  className="rounded-xl bg-muted px-4 py-3.5 text-foreground"
                />
              </Field>
              <Field label={t('ads.buttonText')}>
                <TextInput
                  value={currentCta}
                  onChangeText={(t) => setCtaText(t.slice(0, 30))}
                  placeholderTextColor={colors.grey}
                  className="rounded-xl bg-muted px-4 py-3.5 text-foreground"
                />
              </Field>
              <Pressable
                onPress={onSave}
                disabled={!dirty || updateCreative.isPending}
                className={`items-center rounded-2xl bg-primary py-3.5 ${dirty && !updateCreative.isPending ? 'active:opacity-80' : 'opacity-50'}`}>
                <Text className="font-bold text-white">{updateCreative.isPending ? t('ads.saving') : t('ads.save')}</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ChipRow({
  value,
  onChange,
  items,
  allLabel,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  items: { id: string; label: string }[];
  allLabel: string;
}) {
  const chips = [{ id: null as string | null, label: allLabel }, ...items];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
      {chips.map((chip) => {
        const on = chip.id === value;
        return (
          <Pressable
            key={chip.id ?? 'all'}
            onPress={() => onChange(chip.id)}
            className={`rounded-full px-3.5 py-2 ${on ? 'bg-primary' : 'border border-border'}`}>
            <Text variant="caption1" className={`font-bold ${on ? 'text-white' : 'text-foreground'}`}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
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

function ReviewRow({ label, value }: { label: string; value: string }) {
  const endAlign = textEnd(useIsRTL());
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text variant="footnote" color="tertiary">
        {label}
      </Text>
      <Text variant="footnote" className={`flex-1 ${endAlign} font-medium`} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
