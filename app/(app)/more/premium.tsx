import * as WebBrowser from 'expo-web-browser';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Button } from '@/components/nativewindui/Button';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/format';
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

const COMPARISON: { feature: string; free: string; premium: string }[] = [
  { feature: 'Profile listing', free: 'Basic', premium: 'Enhanced + Verified badge' },
  { feature: 'Search ranking', free: 'Standard', premium: 'Boosted 2×' },
  { feature: 'Inbox', free: 'Basic chats', premium: 'Assign · filters · notes · reminders' },
  { feature: 'Saved replies', free: '—', premium: 'Unlimited' },
  { feature: 'Automation', free: 'Welcome message only', premium: 'Welcome + questions + files' },
  { feature: 'Team', free: 'Owner only', premium: 'Up to 10 seats, custom roles' },
  { feature: 'Finance', free: 'Basic tracking', premium: 'Advanced reports + export' },
  { feature: 'Analytics', free: 'Basic metrics', premium: 'Conversion rates + campaign insights' },
];

export default function PremiumScreen() {
  const { colors } = useColorScheme();
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
      Alert.alert('Upgrade failed', getErrorMessage(err));
    }
  };

  const onCancel = () => {
    Alert.alert(
      'Cancel Premium?',
      "You'll keep everything until the end of the current period, then drop to Free. Your profile stays live and your data is kept.",
      [
        { text: 'Keep Premium', style: 'cancel' },
        {
          text: 'Confirm cancel',
          style: 'destructive',
          onPress: () => cancelSubscription.mutate(undefined, {
            onError: (err) => Alert.alert('Cancel failed', getErrorMessage(err)),
          }),
        },
      ],
    );
  };

  const onChangePaymentMethod = () => {
    Alert.alert(
      'Not available yet',
      'Changing the saved card needs a payment-provider checkout flow that isn’t wired into the app yet.',
    );
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
        Alert.alert(
          'Downloaded, nowhere to put it',
          'The PDF was fetched but this app has no file-saving capability on this platform yet (needs expo-file-system + expo-sharing, not installed).',
        );
      }
    } catch (err) {
      Alert.alert('Download failed', getErrorMessage(err));
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
            {data.plan?.nameEn ?? 'Free'}
          </Text>
          {isPremium ? (
            <View className="flex-row items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 dark:bg-amber-950">
              <Icon name="star.fill" size={12} color="#B45309" />
              <Text variant="caption2" className="font-medium text-amber-700 dark:text-amber-300">
                Verified
              </Text>
            </View>
          ) : null}
        </View>
        {isPremium && data.currentPeriodEnd ? (
          <Text variant="footnote" color="tertiary">
            {isCancelling
              ? `Cancels ${formatDate(data.currentPeriodEnd)} — you keep Premium until then`
              : `Renews ${formatDate(data.currentPeriodEnd)}`}
          </Text>
        ) : (
          <Text variant="footnote" color="tertiary">
            Upgrade to unlock team roles, automation, and conversion analytics.
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
            FEATURE
          </Text>
          <Text variant="caption2" color="tertiary" className="flex-1 font-medium">
            FREE
          </Text>
          <Text variant="caption2" color="tertiary" className="flex-[1.4] font-medium">
            PREMIUM
          </Text>
        </View>
        {COMPARISON.map((row, index) => (
          <View
            key={row.feature}
            className={`flex-row bg-card px-3 py-2.5 ${
              index < COMPARISON.length - 1 ? 'border-b border-border' : ''
            }`}>
            <Text variant="caption1" className="flex-[1.2] font-medium">
              {row.feature}
            </Text>
            <Text variant="caption1" color="tertiary" className="flex-1">
              {row.free}
            </Text>
            <Text variant="caption1" className="flex-[1.4]">
              {row.premium}
            </Text>
          </View>
        ))}
      </View>

      {isPremium ? (
        <>
          <Button variant="secondary" onPress={onChangePaymentMethod}>
            <Text>Change payment method</Text>
          </Button>
          {!isCancelling ? (
            <Pressable onPress={onCancel} disabled={cancelSubscription.isPending}>
              <Text variant="footnote" className="text-center text-destructive">
                {cancelSubscription.isPending ? 'Cancelling…' : 'Switch plan / cancel'}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <Button onPress={onUpgrade} disabled={upgrade.isPending || !plans?.length}>
          <Text>{upgrade.isPending ? 'Opening checkout…' : 'Upgrade to Premium'}</Text>
        </Button>
      )}

      {invoicesPage && invoicesPage.invoices.length > 0 ? (
        <View>
          <Text variant="caption2" color="tertiary" className="mb-2 px-1">
            INVOICES
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
