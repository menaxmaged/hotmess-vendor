import { useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';

import { BackHeader, Card, DISPLAY, ErrorState, LoadingState, SectionLabel, SegmentedRange } from '@/components/brand';
import { Text } from '@/components/nativewindui/Text';
import { useAddPayment, useFinanceOverview } from '@/Modules/finance/hooks';
import type { BridePayment, FinanceRange, FinanceSummary, PaymentStatus, PaymentType } from '@/Modules/finance/types';
import { getErrorMessage } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { useColorScheme } from '@/lib/useColorScheme';

const RANGES: { key: FinanceRange; label: string }[] = [
  { key: 'month', label: 'Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'ytd', label: 'YTD' },
  { key: 'all', label: 'All time' },
];

type SummaryKey = keyof FinanceSummary;

const SUMMARY_META: { key: SummaryKey; label: string }[] = [
  { key: 'received', label: 'Received' },
  { key: 'deposits', label: 'Deposits' },
  { key: 'remaining', label: 'Remaining' },
  { key: 'quoted', label: 'Quoted' },
];

const STATUS_META: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: 'Fully paid', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  partial: { label: 'Partial', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  deposit_pending: { label: 'Deposit pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  quoted: { label: 'Quoted', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
};

const REPORTS = ['Monthly revenue', 'By bride', 'By package', 'Outstanding payments'];

function egpK(n: number) {
  return n >= 1000 ? `EGP ${Math.round(n / 1000)}k` : `EGP ${n}`;
}

function matchesFilter(payment: BridePayment, filter: SummaryKey): boolean {
  switch (filter) {
    case 'received':
      return payment.received > 0;
    case 'deposits':
      return payment.status === 'deposit_pending' || payment.status === 'partial';
    case 'remaining':
      return payment.status !== 'quoted' && payment.status !== 'cancelled' && payment.total - payment.received > 0;
    case 'quoted':
      return payment.status === 'quoted';
    default:
      return true;
  }
}

export default function FinanceScreen() {
  const [range, setRange] = useState<FinanceRange>('month');
  const [filter, setFilter] = useState<SummaryKey | null>(null);
  const [sheetBride, setSheetBride] = useState<BridePayment | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data, isLoading, isError, error, refetch, isRefetching } = useFinanceOverview(range);

  const payments = useMemo(() => {
    if (!data) return [];
    return filter ? data.payments.filter((p) => matchesFilter(p, filter)) : data.payments;
  }, [data, filter]);

  const openSheet = (bride: BridePayment | null) => {
    setSheetBride(bride);
    setSheetOpen(true);
  };

  return (
    <View className="flex-1 bg-background">
      <BackHeader title="finance." />

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
          <SegmentedRange value={range} options={RANGES} onChange={setRange} />

          <View className="flex-row flex-wrap gap-2">
            {SUMMARY_META.map((item) => {
              const on = filter === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setFilter(on ? null : item.key)}
                  className={`min-w-[47%] flex-1 rounded-xl border p-3 ${on ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                  <Text variant="caption2" className="font-extrabold uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </Text>
                  <Text className={`${DISPLAY} mt-1 text-xl`}>{egpK(data.summary[item.key])}</Text>
                </Pressable>
              );
            })}
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
              <SectionLabel>
                Payments{filter ? ` · ${SUMMARY_META.find((s) => s.key === filter)?.label}` : ''}
              </SectionLabel>
              <Pressable onPress={() => openSheet(null)} className="rounded-full bg-primary px-3 py-1 active:opacity-80">
                <Text variant="caption1" className="font-bold text-white">
                  ＋ Add
                </Text>
              </Pressable>
            </View>
            <View className="gap-2">
              {payments.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} onPress={() => openSheet(payment)} />
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {data ? (
        <AddPaymentSheet
          visible={sheetOpen}
          brides={data.payments.filter((p) => p.status !== 'cancelled')}
          initialBride={sheetBride}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </View>
  );
}

function PaymentRow({ payment, onPress }: { payment: BridePayment; onPress: () => void }) {
  const meta = STATUS_META[payment.status];
  const progress = payment.total > 0 ? Math.min(payment.received / payment.total, 1) : 0;

  return (
    <Pressable onPress={onPress} className="gap-2 rounded-xl border border-border bg-card p-3.5 active:opacity-80">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text variant="footnote" className="font-bold">
            {payment.brideName}
          </Text>
          <Text variant="caption1" color="tertiary">
            {payment.packageName}
            {payment.dueDate ? ` · due ${formatDate(payment.dueDate)}` : ''}
          </Text>
        </View>
        <View className={`rounded-full px-2 py-0.5 ${meta.className}`}>
          <Text variant="caption2" className={`font-medium ${meta.className}`}>
            {meta.label}
          </Text>
        </View>
      </View>

      <View className="h-2 overflow-hidden rounded-full bg-muted">
        <View className="h-full rounded-full bg-primary" style={{ width: `${Math.max(progress * 100, 2)}%` }} />
      </View>

      <View className="flex-row justify-between">
        <Text variant="caption2" color="tertiary">
          Received <Text className={`${DISPLAY} text-xs`}>{egpK(payment.received)}</Text>
        </Text>
        <Text variant="caption2" color="tertiary">
          Total <Text className={`${DISPLAY} text-xs`}>{egpK(payment.total)}</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const PAYMENT_TYPES: { key: PaymentType; label: string }[] = [
  { key: 'deposit', label: 'Deposit' },
  { key: 'instalment', label: 'Instalment' },
  { key: 'final', label: 'Final payment' },
];

function AddPaymentSheet({
  visible,
  brides,
  initialBride,
  onClose,
}: {
  visible: boolean;
  brides: BridePayment[];
  initialBride: BridePayment | null;
  onClose: () => void;
}) {
  const { colors } = useColorScheme();
  const addPayment = useAddPayment();
  const [brideId, setBrideId] = useState<string | null>(initialBride?.id ?? null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<PaymentType>('deposit');

  // Sync selection when the sheet is opened from a specific row.
  const [lastInitial, setLastInitial] = useState<string | null>(initialBride?.id ?? null);
  if ((initialBride?.id ?? null) !== lastInitial) {
    setLastInitial(initialBride?.id ?? null);
    setBrideId(initialBride?.id ?? null);
    setAmount('');
    setType('deposit');
  }

  const numericAmount = Number(amount.replace(/[^0-9.]/g, ''));
  const canSubmit = !!brideId && numericAmount > 0 && !addPayment.isPending;

  const submit = () => {
    if (!brideId || numericAmount <= 0) return;
    addPayment.mutate(
      { brideId, amount: numericAmount, type, date: new Date().toISOString() },
      { onSuccess: onClose },
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
                const on = b.id === brideId;
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => setBrideId(b.id)}
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
                const on = t.key === type;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setType(t.key)}
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
