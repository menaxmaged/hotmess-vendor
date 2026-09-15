import { useActionSheet } from '@expo/react-native-action-sheet';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';

import { BackHeader, Card, DISPLAY, ErrorState, LoadingState, SectionLabel, SegmentedRange } from '@/components/brand';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { DatePicker } from '@/components/nativewindui/DatePicker';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/format';
import { localeTag } from '@/lib/i18n';
import { textEnd, useIsRTL } from '@/lib/rtl';
import { useColorScheme } from '@/lib/useColorScheme';
import { useChats } from '@/Modules/inbox/hooks';
import {
  useAddPayment,
  useDeletePayment,
  useExportReport,
  useExportStatus,
  useFinanceSummary,
  usePayments,
  useRecentExports,
  useReport,
  useUpdatePayment,
} from '@/Modules/finance/hooks';
import type {
  FinanceReport,
  FinanceSummary,
  LedgerPayment,
  PaymentKind,
  ReportColumn,
  ReportDateRange,
  ReportType,
} from '@/Modules/finance/types';

type DateRangeKey = 'month' | 'quarter' | 'ytd' | 'all';

const RANGE_KEYS: DateRangeKey[] = ['month', 'quarter', 'ytd', 'all'];

// Local calendar dates: `toISOString()` is the UTC date, which in Egypt (UTC+2/+3) is the previous day for
// local midnight — "this month" would start on the last day of last month.
function rangeToDates(range: DateRangeKey): { from?: string; to?: string } {
  if (range === 'all') return {};
  const now = new Date();
  const to = ymd(now);
  let from: Date;
  if (range === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === 'quarter') {
    from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  } else {
    from = new Date(now.getFullYear(), 0, 1);
  }
  return { from: ymd(from), to };
}

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

type SummaryKey = keyof Omit<FinanceSummary, 'currencyCode' | 'paymentsCount'>;

const SUMMARY_KEYS: SummaryKey[] = ['totalReceived', 'receivedThisMonth', 'outstanding', 'openQuotes'];

const KIND_FILTERS: (PaymentKind | null)[] = [null, 'deposit', 'instalment', 'final'];

const KIND_CLASS: Record<PaymentKind, string> = {
  deposit: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  instalment: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  final: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
};

const REPORT_TYPES: ReportType[] = ['monthly_revenue', 'by_bride', 'by_package', 'outstanding'];

function egpK(n: number) {
  return n >= 1000 ? `EGP ${Math.round(n / 1000)}k` : `EGP ${n}`;
}

export default function FinanceScreen() {
  const { t } = useTranslation(['finance', 'common']);
  const { showActionSheetWithOptions } = useActionSheet();
  const [range, setRange] = useState<DateRangeKey>('month');
  const ranges = RANGE_KEYS.map((key) => ({ key, label: t(`ranges.${key}`) }));
  const [kindFilter, setKindFilter] = useState<PaymentKind | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<LedgerPayment | null>(null);
  const [reportType, setReportType] = useState<ReportType | null>(null);

  const summaryQuery = useFinanceSummary();
  const { from, to } = useMemo(() => rangeToDates(range), [range]);
  const paymentsQuery = usePayments({ from, to, kind: kindFilter ?? undefined, pageSize: 50 });
  const deletePayment = useDeletePayment();

  const isLoading = summaryQuery.isLoading || paymentsQuery.isLoading;
  const isError = summaryQuery.isError || paymentsQuery.isError;
  const error = summaryQuery.error ?? paymentsQuery.error;
  const isRefetching = summaryQuery.isRefetching || paymentsQuery.isRefetching;
  const refetchAll = () => {
    summaryQuery.refetch();
    paymentsQuery.refetch();
  };

  const payments = paymentsQuery.data?.payments ?? [];

  const openPaymentActions = (payment: LedgerPayment) => {
    const options = [t('common:actions.edit'), t('common:actions.delete'), t('common:actions.cancel')];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: 2, destructiveButtonIndex: 1, title: `${payment.brideName} · ${egpK(payment.amount)}` },
      (index) => {
        if (index === 0) setEditing(payment);
        if (index === 1) {
          Alert.alert(t('deleteTitle'), t('deleteBody'), [
            { text: t('common:actions.cancel'), style: 'cancel' },
            {
              text: t('common:actions.delete'),
              style: 'destructive',
              onPress: () =>
                deletePayment.mutate(payment.id, {
                  onError: (err) => Alert.alert(t('deleteFailed'), getErrorMessage(err)),
                }),
            },
          ]);
        }
      },
    );
  };

  return (
    <View className="flex-1 bg-background">
      <BackHeader title={t('title')} />

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
          <SegmentedRange value={range} options={ranges} onChange={setRange} />
          <Text variant="caption2" color="tertiary">
            {t('paymentsRecorded', { count: summaryQuery.data.paymentsCount })}
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {SUMMARY_KEYS.map((key) => (
              <View key={key} className="min-w-[47%] flex-1 rounded-xl border border-border bg-card p-3">
                <Text variant="caption2" className="font-extrabold uppercase tracking-wide text-muted-foreground">
                  {t(`summary.${key}`)}
                </Text>
                <Text className={`${DISPLAY} mt-1 text-xl`}>
                  {key === 'openQuotes' ? summaryQuery.data.openQuotes : egpK(summaryQuery.data[key])}
                </Text>
              </View>
            ))}
          </View>

          <View>
            <SectionLabel>{t('reportsTitle')}</SectionLabel>
            <Card className="p-0">
              {REPORT_TYPES.map((reportKey, i) => (
                <Pressable
                  key={reportKey}
                  onPress={() => setReportType(reportKey)}
                  className={`flex-row items-center justify-between px-4 py-3.5 active:opacity-70 ${i < REPORT_TYPES.length - 1 ? 'border-b border-border' : ''}`}>
                  <Text variant="footnote" className="font-bold">
                    {t(`reports.${reportKey}`)}
                  </Text>
                  <Text variant="footnote" color="tertiary">
                    {t('view')}
                  </Text>
                </Pressable>
              ))}
            </Card>
          </View>

          <View>
            <View className="mb-2.5 flex-row items-center justify-between">
              <SectionLabel>{t('paymentsTitle')}</SectionLabel>
              <Pressable onPress={() => setSheetOpen(true)} className="rounded-full bg-primary px-3 py-1 active:opacity-80">
                <Text variant="caption1" className="font-bold text-white">
                  {t('add')}
                </Text>
              </Pressable>
            </View>

            <View className="mb-2 flex-row flex-wrap gap-2">
              {KIND_FILTERS.map((kindKey) => {
                const on = kindKey === kindFilter;
                return (
                  <Pressable
                    key={kindKey ?? 'all'}
                    onPress={() => setKindFilter(kindKey)}
                    className={`rounded-full px-3 py-1.5 ${on ? 'bg-foreground' : 'border border-border'}`}>
                    <Text variant="caption1" className={`font-bold ${on ? 'text-background' : 'text-foreground'}`}>
                      {kindKey ? t(`kinds.${kindKey}`) : t('all')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="gap-2">
              {payments.length === 0 ? (
                <Text variant="footnote" color="tertiary" className="p-2">
                  {t('noPayments')}
                </Text>
              ) : (
                payments.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} onPress={() => openPaymentActions(payment)} />
                ))
              )}
            </View>
          </View>
        </ScrollView>
      )}

      <AddPaymentSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
      {editing ? <EditPaymentSheet payment={editing} onClose={() => setEditing(null)} /> : null}
      {reportType ? (
        <ReportSheet type={reportType} range={{ from, to }} onClose={() => setReportType(null)} />
      ) : null}
    </View>
  );
}

function PaymentRow({ payment, onPress }: { payment: LedgerPayment; onPress: () => void }) {
  const { t } = useTranslation('finance');
  const kindClass = KIND_CLASS[payment.kind];

  return (
    <Pressable onPress={onPress} className="gap-2 rounded-xl border border-border bg-card p-3.5 active:opacity-80">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text variant="footnote" className="font-bold">
            {payment.brideName}
          </Text>
          <Text variant="caption1" color="tertiary">
            {payment.packageName ?? t('noPackage')} · {formatDate(payment.paidOn)}
          </Text>
        </View>
        <View className={`rounded-full px-2 py-0.5 ${kindClass}`}>
          <Text variant="caption2" className={`font-medium ${kindClass}`}>
            {t(`kinds.${payment.kind}`)}
          </Text>
        </View>
      </View>

      <Text className={`${DISPLAY} text-lg`}>{egpK(payment.amount)}</Text>
    </Pressable>
  );
}

const PAYMENT_KINDS: PaymentKind[] = ['deposit', 'instalment', 'final'];

function KindPicker({ value, onChange }: { value: PaymentKind; onChange: (k: PaymentKind) => void }) {
  const { t } = useTranslation('finance');
  return (
    <View className="flex-row gap-2">
      {PAYMENT_KINDS.map((kindKey) => {
        const on = kindKey === value;
        return (
          <Pressable
            key={kindKey}
            onPress={() => onChange(kindKey)}
            className={`flex-1 items-center rounded-xl px-2 py-2.5 ${on ? 'bg-primary' : 'border border-border'}`}>
            <Text variant="caption1" className={`font-bold ${on ? 'text-white' : 'text-foreground'}`}>
              {t(`kindOptions.${kindKey}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AddPaymentSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useColorScheme();
  const { t } = useTranslation('finance');
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
        paidOn: ymd(new Date()),
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
          <Text className={`${DISPLAY} text-2xl`}>{t('addTitle')}</Text>

          <View>
            <SectionLabel>{t('bride')}</SectionLabel>
            {brides.length === 0 ? (
              <Text variant="footnote" color="tertiary">
                {t('noBrides')}
              </Text>
            ) : null}
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
            <SectionLabel>{t('amount')}</SectionLabel>
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
            <SectionLabel>{t('type')}</SectionLabel>
            <KindPicker value={kind} onChange={setKind} />
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
              {addPayment.isPending ? t('saving') : t('savePayment')}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** PATCH /vendor/finance/payments/{id} — only changed fields are sent. */
function EditPaymentSheet({ payment, onClose }: { payment: LedgerPayment; onClose: () => void }) {
  const { colors } = useColorScheme();
  const { t } = useTranslation('finance');
  const updatePayment = useUpdatePayment();
  const [amount, setAmount] = useState(String(payment.amount));
  const [kind, setKind] = useState<PaymentKind>(payment.kind);
  const [paidOn, setPaidOn] = useState(() => new Date(`${payment.paidOn.slice(0, 10)}T12:00:00`));

  const numericAmount = Number(amount.replace(/[^0-9.]/g, ''));
  const nextPaidOn = ymd(paidOn);
  const changed =
    numericAmount !== payment.amount || kind !== payment.kind || nextPaidOn !== payment.paidOn.slice(0, 10);
  const canSubmit = numericAmount > 0 && changed && !updatePayment.isPending;

  const submit = () =>
    updatePayment.mutate(
      {
        paymentId: payment.id,
        ...(numericAmount !== payment.amount ? { amount: numericAmount } : {}),
        ...(kind !== payment.kind ? { kind } : {}),
        ...(nextPaidOn !== payment.paidOn.slice(0, 10) ? { paidOn: nextPaidOn } : {}),
      },
      { onSuccess: onClose, onError: (err) => Alert.alert(t('saveFailed'), getErrorMessage(err)) },
    );

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
        <Pressable onPress={() => {}} className="gap-4 rounded-t-3xl bg-background px-5 pb-8 pt-4">
          <View className="mb-1 h-1 w-10 self-center rounded-full bg-muted" />
          <Text className={`${DISPLAY} text-2xl`}>{t('editTitle')}</Text>
          <Text variant="footnote" color="tertiary">
            {`${payment.brideName}${payment.packageName ? ` · ${payment.packageName}` : ''}`}
          </Text>

          <View>
            <SectionLabel>{t('amount')}</SectionLabel>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor={colors.grey}
              className="rounded-xl bg-muted px-4 py-3.5 text-foreground"
            />
          </View>

          <View>
            <SectionLabel>{t('type')}</SectionLabel>
            <KindPicker value={kind} onChange={setKind} />
          </View>

          <View>
            <SectionLabel>{t('paidOn')}</SectionLabel>
            <DatePicker
              value={paidOn}
              mode="date"
              onChange={(_e, d) => {
                if (d) setPaidOn(d);
              }}
            />
          </View>

          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            className={`items-center rounded-2xl bg-primary py-4 ${canSubmit ? 'active:opacity-80' : 'opacity-50'}`}>
            <Text className="font-bold text-white">{updatePayment.isPending ? t('saving') : t('saveChanges')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function formatCell(value: unknown, column: ReportColumn, currency: string): string {
  if (value == null || value === '') return '—';
  switch (column.format) {
    case 'money':
      // Report money values are integers in minor units of currencyCode.
      return formatCurrency(Number(value) / 100, currency);
    case 'integer':
      return Number(value).toLocaleString(localeTag());
    case 'date':
      return formatDate(String(value));
    default:
      return String(value);
  }
}

/**
 * GET /vendor/finance/reports/{type} (JSON) + PDF export: POST .../export
 * answers 202, then poll GET .../exports/{id} until done/failed.
 */
function ReportSheet({ type, range, onClose }: { type: ReportType; range: ReportDateRange; onClose: () => void }) {
  const { t } = useTranslation('finance');
  const { data: report, isLoading, isError, error } = useReport(type, range, true);
  const exportReport = useExportReport();
  const [exportId, setExportId] = useState<string | undefined>(undefined);
  const { data: exportStatus } = useExportStatus(exportId, !!exportId);
  const { data: recentExports } = useRecentExports(true);

  const onExport = () =>
    exportReport.mutate(
      { type, range },
      {
        onSuccess: (created) => setExportId(created.id),
        // A 4th concurrent export is a 409 export_queue_full; a full storage quota also fails it.
        onError: (err) => Alert.alert(t('exportFailedTitle'), getErrorMessage(err)),
      },
    );

  const current = exportStatus ?? null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
        <Pressable onPress={() => {}} className="max-h-[90%] rounded-t-3xl bg-background px-5 pb-8 pt-4">
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-muted" />
          {isLoading ? (
            <ActivityIndicator />
          ) : isError || !report ? (
            <Text color="tertiary">{getErrorMessage(error)}</Text>
          ) : (
            <ScrollView contentContainerClassName="gap-3" showsVerticalScrollIndicator={false}>
              <ReportBody report={report} />

              <Pressable
                onPress={onExport}
                disabled={exportReport.isPending || (!!current && current.status !== 'done' && current.status !== 'failed')}
                className="items-center rounded-2xl bg-primary py-3.5 active:opacity-80">
                <Text className="font-bold text-white">{exportReport.isPending ? t('queuing') : t('exportPdf')}</Text>
              </Pressable>

              {current ? (
                <Text
                  variant="footnote"
                  className={current.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'}>
                  {current.status === 'failed'
                    ? t('exportFailed', { error: current.error ?? t('unknownError') })
                    : current.status === 'done'
                      ? t('exportReady')
                      : t(`exportInline.${current.status}`)}
                </Text>
              ) : null}

              {(recentExports ?? []).length > 0 ? (
                <View className="gap-1.5">
                  <SectionLabel>{t('recentExports')}</SectionLabel>
                  {(recentExports ?? []).slice(0, 5).map((e) => (
                    <View key={e.id} className="flex-row justify-between">
                      <Text variant="caption1">
                        {REPORT_TYPES.includes(e.type) ? t(`reports.${e.type}`) : e.type}
                      </Text>
                      <Text variant="caption1" color="tertiary">
                        {`${t(`exportStatus.${e.status}`)} · ${formatDate(e.createdAt)}`}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ReportBody({ report }: { report: FinanceReport }) {
  const { t } = useTranslation('finance');
  const endAlign = textEnd(useIsRTL());
  const totalWeight = report.columns.reduce((sum, c) => sum + (c.weight ?? 1), 0) || 1;
  const flexOf = (c: ReportColumn) => (c.weight ?? 1) / totalWeight;

  return (
    <View className="gap-3">
      <View>
        <Text className={`${DISPLAY} text-2xl`}>{report.title}</Text>
        <Text variant="footnote" color="tertiary">
          {report.subtitle}
        </Text>
      </View>

      {report.meta.length > 0 ? (
        <View className="flex-row flex-wrap gap-x-4 gap-y-1">
          {report.meta.map((m) => (
            <Text key={m.label} variant="caption1" color="tertiary">
              {`${m.label}: `}
              <Text variant="caption1" className="font-semibold text-foreground">
                {m.value}
              </Text>
            </Text>
          ))}
        </View>
      ) : null}

      <Card className="gap-2">
        <View className="flex-row gap-2 border-b border-border pb-2">
          {report.columns.map((c) => (
            <Text
              key={c.key}
              variant="caption2"
              className={`font-extrabold uppercase text-muted-foreground ${c.format === 'text' ? '' : endAlign}`}
              style={{ flex: flexOf(c) }}>
              {c.label}
            </Text>
          ))}
        </View>
        {report.rows.length === 0 ? (
          <Text variant="footnote" color="tertiary">
            {t('nothingInWindow')}
          </Text>
        ) : (
          report.rows.map((row, i) => (
            <View key={i} className="flex-row gap-2">
              {report.columns.map((c) => (
                <Text
                  key={c.key}
                  variant="caption1"
                  numberOfLines={1}
                  className={c.format === 'text' ? '' : endAlign}
                  style={{ flex: flexOf(c) }}>
                  {formatCell(row[c.key], c, report.currencyCode)}
                </Text>
              ))}
            </View>
          ))
        )}
        {Object.keys(report.totals ?? {}).length > 0 ? (
          <View className="flex-row gap-2 border-t border-border pt-2">
            {report.columns.map((c, i) => (
              <Text
                key={c.key}
                variant="caption1"
                className={`font-bold ${c.format === 'text' ? '' : endAlign}`}
                style={{ flex: flexOf(c) }}>
                {c.key in report.totals ? formatCell(report.totals[c.key], c, report.currencyCode) : i === 0 ? t('total') : ''}
              </Text>
            ))}
          </View>
        ) : null}
      </Card>
    </View>
  );
}
