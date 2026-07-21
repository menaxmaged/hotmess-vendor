import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { BackHeader, Card, DISPLAY, ErrorState, LoadingState, SectionLabel, SegmentedRange } from '@/components/brand';
import { Text } from '@/components/nativewindui/Text';
import { useFinanceOverview } from '@/Modules/finance/hooks';
import type { BridePayment, FinanceRange, FinanceSummary, PaymentStatus } from '@/Modules/finance/types';
import { getErrorMessage } from '@/lib/api-client';
import { formatDate } from '@/lib/format';

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
  const { data, isLoading, isError, error, refetch, isRefetching } = useFinanceOverview(range);

  const payments = useMemo(() => {
    if (!data) return [];
    return filter ? data.payments.filter((p) => matchesFilter(p, filter)) : data.payments;
  }, [data, filter]);

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
            <SectionLabel>
              Payments{filter ? ` · ${SUMMARY_META.find((s) => s.key === filter)?.label}` : ''}
            </SectionLabel>
            <View className="gap-2">
              {payments.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function PaymentRow({ payment }: { payment: BridePayment }) {
  const meta = STATUS_META[payment.status];
  const progress = payment.total > 0 ? Math.min(payment.received / payment.total, 1) : 0;

  return (
    <View className="gap-2 rounded-xl border border-border bg-card p-3.5">
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
    </View>
  );
}
