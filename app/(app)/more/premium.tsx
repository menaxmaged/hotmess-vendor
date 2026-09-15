import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Button } from '@/components/nativewindui/Button';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/format';
import { pickBilingual } from '@/lib/localized';
import { useColorScheme } from '@/lib/useColorScheme';
import {
    useCancelSubscription,
    useDownloadInvoicePdf,
    useInvoices,
    usePlans,
    useSubscription,
    useUpgrade,
} from '@/Modules/subscription/hooks';
import type { Invoice } from '@/Modules/subscription/types';

const COMPARISON_ROWS = ['profile', 'search', 'inbox', 'savedReplies', 'automation', 'team', 'finance', 'analytics'] as const;

export default function PremiumScreen() {
  const { colors } = useColorScheme();
  const { t } = useTranslation(['growth', 'common']);
  const { data, isLoading, isError, error, refetch } = useSubscription();
  const { data: plans } = usePlans();
  const { data: invoicesPage } = useInvoices();
  const upgrade = useUpgrade();
  const cancelSubscription = useCancelSubscription();
  const downloadPdf = useDownloadInvoicePdf();

  const onUpgrade = async () => {
    const plan = (plans ?? []).find((p) => !p.isCurrent) ?? (plans ?? [])[0];
    if (!plan) return;
    try {
      const checkout = await upgrade.mutateAsync(plan.id);
      await WebBrowser.openBrowserAsync(checkout.redirectUrl);
      // Upgrade only takes effect once the payment provider's webhook confirms
      // it server-side — refetch in case it already landed while the browser was open.
      refetch();
    } catch (err) {
      Alert.alert(t('premium.upgradeFailed'), getErrorMessage(err));
    }
  };

  const onCancel = () => {
    Alert.alert(
      t('premium.cancelTitle'),
      t('premium.cancelBody'),
      [
        { text: t('premium.keepPremium'), style: 'cancel' },
        {
          text: t('premium.confirmCancel'),
          style: 'destructive',
          onPress: () => cancelSubscription.mutate(undefined, {
            onError: (err) => Alert.alert(t('premium.cancelFailed'), getErrorMessage(err)),
          }),
        },
      ],
    );
  };

  const onChangePaymentMethod = () => {
    Alert.alert(t('premium.notAvailableTitle'), t('premium.paymentMethodBody'));
  };

  const onDownloadInvoice = async (invoice: Invoice) => {
    try {
      const bytes = await downloadPdf.mutateAsync(invoice.id);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${invoice.number}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        Alert.alert(t('premium.noSaveTitle'), t('premium.noSaveBody'));
      }
    } catch (err) {
      Alert.alert(t('premium.downloadFailed'), getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text color="tertiary">{getErrorMessage(error)}</Text>
      </View>
    );
  }

  const isPremium = data.isPremium;
  const isCancelling = data.rawStatus === 'cancelled' && data.status !== 'expired';

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4">
      <View className="gap-2 rounded-xl border border-border bg-card p-4">
        <View className="flex-row items-center justify-between">
          <Text variant="title2" className="font-bold">
            {pickBilingual(data.plan, 'name') || t('common:badges.free')}
          </Text>
          {isPremium ? (
            <View className="flex-row items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 dark:bg-amber-950">
              <Icon name="star.fill" size={12} color="#B45309" />
              <Text variant="caption2" className="font-medium text-amber-700 dark:text-amber-300">
                {t('premium.verified')}
              </Text>
            </View>
          ) : null}
        </View>
        {isPremium && data.currentPeriodEnd ? (
          <Text variant="footnote" color="tertiary">
            {isCancelling
              ? t('premium.cancelsKeep', { date: formatDate(data.currentPeriodEnd) })
              : t('premium.renews', { date: formatDate(data.currentPeriodEnd) })}
          </Text>
        ) : (
          <Text variant="footnote" color="tertiary">
            {t('premium.upgradePitch')}
          </Text>
        )}
        {isPremium && data.paymentMethod ? (
          <Text variant="caption1" color="tertiary">
            {`${data.paymentMethod.brand} •••• ${data.paymentMethod.last4}`}
          </Text>
        ) : null}
      </View>

      <View className="overflow-hidden rounded-xl border border-border">
        <View className="flex-row bg-muted px-3 py-2">
          <Text variant="caption2" color="tertiary" className="flex-[1.2] font-medium">
            {t('premium.table.feature')}
          </Text>
          <Text variant="caption2" color="tertiary" className="flex-1 font-medium">
            {t('premium.table.free')}
          </Text>
          <Text variant="caption2" color="tertiary" className="flex-[1.4] font-medium">
            {t('premium.table.premium')}
          </Text>
        </View>
        {COMPARISON_ROWS.map((row, index) => (
          <View
            key={row}
            className={`flex-row bg-card px-3 py-2.5 ${
              index < COMPARISON_ROWS.length - 1 ? 'border-b border-border' : ''
            }`}>
            <Text variant="caption1" className="flex-[1.2] font-medium">
              {t(`premium.comparison.${row}.feature`)}
            </Text>
            <Text variant="caption1" color="tertiary" className="flex-1">
              {t(`premium.comparison.${row}.free`)}
            </Text>
            <Text variant="caption1" className="flex-[1.4]">
              {t(`premium.comparison.${row}.premium`)}
            </Text>
          </View>
        ))}
      </View>

      {isPremium ? (
        <>
          <Button variant="secondary" onPress={onChangePaymentMethod}>
            <Text>{t('premium.changePaymentMethod')}</Text>
          </Button>
          {!isCancelling ? (
            <Pressable onPress={onCancel} disabled={cancelSubscription.isPending}>
              <Text variant="footnote" className="text-center text-destructive">
                {cancelSubscription.isPending ? t('premium.cancelling') : t('premium.switchCancel')}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <Button onPress={onUpgrade} disabled={upgrade.isPending || !plans?.length}>
          <Text>{upgrade.isPending ? t('premium.openingCheckout') : t('premium.upgrade')}</Text>
        </Button>
      )}

      {invoicesPage && invoicesPage.invoices.length > 0 ? (
        <View>
          <Text variant="caption2" color="tertiary" className="mb-2 px-1">
            {t('premium.invoices')}
          </Text>
          <View className="overflow-hidden rounded-xl border border-border bg-card">
            {invoicesPage.invoices.map((invoice, index) => (
              <View
                key={invoice.id}
                className={`flex-row items-center justify-between p-4 ${
                  index < invoicesPage.invoices.length - 1 ? 'border-b border-border' : ''
                }`}>
                <View className="flex-1">
                  <Text variant="subhead" className="font-medium">
                    {invoice.number}
                  </Text>
                  <Text variant="caption1" color="tertiary">
                    {`${formatDate(invoice.issuedAt)} · ${formatCurrency(invoice.amount, invoice.currencyCode)}`}
                  </Text>
                </View>
                <Pressable onPress={() => onDownloadInvoice(invoice)} className="p-2">
                  <Icon name="arrow.down.circle" size={20} color={colors.primary} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
