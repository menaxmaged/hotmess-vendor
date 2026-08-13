import { useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';

import { BackHeader, Card, DISPLAY, ErrorState, LoadingState, SectionLabel, SegmentedRange } from '@/components/brand';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { useColorScheme } from '@/lib/useColorScheme';
import { useChats } from '@/Modules/inbox/hooks';
import { useAddPayment, useFinanceSummary, usePayments } from '@/Modules/finance/hooks';
import type { FinanceSummary, LedgerPayment, PaymentKind } from '@/Modules/finance/types';

type DateRangeKey = 'month' | 'quarter' | 'ytd' | 'all';

const RANGES: { key: DateRangeKey; label: string }[] = [
  { key: 'month', label: 'Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'ytd', label: 'YTD' },
  { key: 'all', label: 'All time' },
];

function rangeToDates(range: DateRangeKey): { from?: string; to?: string } {
  if (range === 'all') return {};
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  let from: Date;
  if (range === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === 'quarter') {
    from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  } else {
    from = new Date(now.getFullYear(), 0, 1);
  }
  return { from: from.toISOString().slice(0, 10), to };
}

type SummaryKey = keyof Omit<FinanceSummary, 'currencyCode' | 'paymentsCount'>;

const SUMMARY_META: { key: SummaryKey; label: string }[] = [
  { key: 'totalReceived', label: 'Total received' },
  { key: 'receivedThisMonth', label: 'This month' },
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'openQuotes', label: 'Open quotes' },
];

const KIND_FILTERS: { key: PaymentKind | null; label: string }[] = [
  { key: null, label: 'All' },
  { key: 'deposit', label: 'Deposit' },
  { key: 'instalment', label: 'Instalment' },
  { key: 'final', label: 'Final' },
];

const KIND_META: Record<PaymentKind, { label: string; className: string }> = {
  deposit: { label: 'Deposit', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  instalment: { label: 'Instalment', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  final: { label: 'Final', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
};

const REPORTS = ['Monthly revenue', 'By bride', 'By package', 'Outstanding payments'];

function egpK(n: number) {
  return n >= 1000 ? `EGP ${Math.round(n / 1000)}k` : `EGP ${n}`;
}

export default function FinanceScreen() {
  const [range, setRange] = useState<DateRangeKey>('month');
  const [kindFilter, setKindFilter] = useState<PaymentKind | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const summaryQuery = useFinanceSummary();
  const { from, to } = useMemo(() => rangeToDates(range), [range]);
  const paymentsQuery = usePayments({ from, to, kind: kindFilter ?? undefined, pageSize: 50 });

  const isLoading = summaryQuery.isLoading || paymentsQuery.isLoading;
  const isError = summaryQuery.isError || paymentsQuery.isError;
  const error = summaryQuery.error ?? paymentsQuery.error;
  const isRefetching = summaryQuery.isRefetching || paymentsQuery.isRefetching;
  const refetchAll = () => {
    summaryQuery.refetch();
    paymentsQuery.refetch();
  };

  const payments = paymentsQuery.data?.payments ?? [];

  return (
    <View className="flex-1 bg-background">
      <BackHeader title="finance." />

      {isLoading ? (
        <LoadingState />
      ) : isError || !summaryQuery.data ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetchAll} />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-8 pt-3"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetchAll} />}>
          <SegmentedRange value={range} options={RANGES} onChange={setRange} />
          <Text variant="caption2" color="tertiary">
            {`${summaryQuery.data.paymentsCount} payments recorded, all time`}
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {SUMMARY_META.map((item) => (
              <View key={item.key} className="min-w-[47%] flex-1 rounded-xl border border-border bg-card p-3">
                <Text variant="caption2" className="font-extrabold uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </Text>
                <Text className={`${DISPLAY} mt-1 text-xl`}>
                  {item.key === 'openQuotes' ? summaryQuery.data.openQuotes : egpK(summaryQuery.data[item.key])}
                </Text>
              </View>
            ))}
          </View>

          <View>
            <SectionLabel>Reports</SectionLabel>
            <Card className="p-0">
              {REPORTS.map((report, i) => (
                <View
                  key={report}
                  className={`flex-row items-center justify-between px-4 py-3.5 ${i < REPORTS.length - 1 ? 'border-b border-border' : ''}`}>
                  <Text variant="footnote" className="font-bold">
                    {report}
                  </Text>
                  <Text variant="footnote" color="tertiary">
                    Export →
                  </Text>
                </View>
              ))}
            </Card>
          </View>

          <View>
            <View className="mb-2.5 flex-row items-center justify-between">
              <SectionLabel>Payments</SectionLabel>
              <Pressable onPress={() => setSheetOpen(true)} className="rounded-full bg-primary px-3 py-1 active:opacity-80">
                <Text variant="caption1" className="font-bold text-white">
                  ＋ Add
                </Text>
              </Pressable>
            </View>

            <View className="mb-2 flex-row flex-wrap gap-2">
              {KIND_FILTERS.map((f) => {
                const on = f.key === kindFilter;
                return (
                  <Pressable
                    key={f.label}
                    onPress={() => setKindFilter(f.key)}
                    className={`rounded-full px-3 py-1.5 ${on ? 'bg-foreground' : 'border border-border'}`}>
                    <Text variant="caption1" className={`font-bold ${on ? 'text-background' : 'text-foreground'}`}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="gap-2">
              {payments.length === 0 ? (
                <Text variant="footnote" color="tertiary" className="p-2">
                  No payments in this range.
                </Text>
              ) : (
                payments.map((payment) => <PaymentRow key={payment.id} payment={payment} />)
              )}
            </View>
          </View>
        </ScrollView>
      )}

      <AddPaymentSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

function PaymentRow({ payment }: { payment: LedgerPayment }) {
  const meta = KIND_META[payment.kind];

  return (
    <View className="gap-2 rounded-xl border border-border bg-card p-3.5">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text variant="footnote" className="font-bold">
            {payment.brideName}
          </Text>
          <Text variant="caption1" color="tertiary">
            {payment.packageName ?? 'No package'} · {formatDate(payment.paidOn)}
          </Text>
        </View>
        <View className={`rounded-full px-2 py-0.5 ${meta.className}`}>
          <Text variant="caption2" className={`font-medium ${meta.className}`}>
            {meta.label}
          </Text>
        </View>
      </View>

      <Text className={`${DISPLAY} text-lg`}>{egpK(payment.amount)}</Text>
    </View>
  );
}

const PAYMENT_TYPES: { key: PaymentKind; label: string }[] = [
  { key: 'deposit', label: 'Deposit' },
  { key: 'instalment', label: 'Instalment' },
  { key: 'final', label: 'Final payment' },
];

function AddPaymentSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useColorScheme();
  const addPayment = useAddPayment();
  const { data: chatsData } = useChats();
  const brides = chatsData?.chats ?? [];

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<PaymentKind>('deposit');

  const numericAmount = Number(amount.replace(/[^0-9.]/g, ''));
  const canSubmit = !!conversationId && numericAmount > 0 && !addPayment.isPending;

  const reset = () => {
    setConversationId(null);
    setAmount('');
    setKind('deposit');
  };

  const submit = () => {
    if (!conversationId || numericAmount <= 0) return;
    addPayment.mutate(
      {
        conversationId,
        amount: numericAmount,
        kind,
        paidOn: new Date().toISOString().slice(0, 10),
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
        <Pressable onPress={() => {}} className="gap-4 rounded-t-3xl bg-background px-5 pb-8 pt-4">
          <View className="mb-1 h-1 w-10 self-center rounded-full bg-muted" />
          <Text className={`${DISPLAY} text-2xl`}>add payment.</Text>

          <View>
            <SectionLabel>Bride</SectionLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {brides.map((b) => {
                const on = b.id === conversationId;
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => setConversationId(b.id)}
                    className={`rounded-full px-3.5 py-2 ${on ? 'bg-foreground' : 'border border-border'}`}>
                    <Text variant="caption1" className={`font-bold ${on ? 'text-background' : 'text-foreground'}`}>
                      {b.brideName}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View>
            <SectionLabel>Amount (EGP)</SectionLabel>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.grey}
              className="rounded-xl bg-muted px-4 py-3.5 text-foreground"
            />
          </View>

          <View>
            <SectionLabel>Type</SectionLabel>
            <View className="flex-row gap-2">
              {PAYMENT_TYPES.map((t) => {
                const on = t.key === kind;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setKind(t.key)}
                    className={`flex-1 items-center rounded-xl px-2 py-2.5 ${on ? 'bg-primary' : 'border border-border'}`}>
                    <Text variant="caption1" className={`font-bold ${on ? 'text-white' : 'text-foreground'}`}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {addPayment.isError ? (
            <Text variant="footnote" className="text-destructive">
              {getErrorMessage(addPayment.error)}
            </Text>
          ) : null}

          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            className={`items-center rounded-2xl bg-primary py-4 ${canSubmit ? 'active:opacity-80' : 'opacity-50'}`}>
            <Text className="font-bold text-white">
              {addPayment.isPending ? 'Saving…' : 'Save payment'}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
