/**
 * Finance Feature - Hooks
 */

import { getErrorMessage } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "./api";
import type {
    PaymentsQuery,
    RecordPaymentInput,
    ReportDateRange,
    ReportType,
    UpdatePaymentInput,
} from "./types";

export const financeKeys = {
  all: ["finance"] as const,
  summary: () => [...financeKeys.all, "summary"] as const,
  payments: (query: PaymentsQuery) => [...financeKeys.all, "payments", query] as const,
  report: (type: ReportType, range: ReportDateRange) =>
    [...financeKeys.all, "report", type, range] as const,
  exports: () => [...financeKeys.all, "exports"] as const,
};

export const useFinanceSummary = () => {
  return useQuery({
    queryKey: financeKeys.summary(),
    queryFn: financeApi.getSummary,
  });
};

export const usePayments = (query: PaymentsQuery = {}) => {
  return useQuery({
    queryKey: financeKeys.payments(query),
    queryFn: () => financeApi.getPayments(query),
  });
};

const useInvalidateFinance = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: financeKeys.all });
};

export const useAddPayment = () => {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => financeApi.addPayment(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Add payment error:", getErrorMessage(error)),
  });
};

export const useUpdatePayment = () => {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (input: UpdatePaymentInput) => financeApi.updatePayment(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Update payment error:", getErrorMessage(error)),
  });
};

export const useDeletePayment = () => {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (paymentId: string) => financeApi.deletePayment(paymentId),
    onSuccess: invalidate,
    onError: (error) => console.error("Delete payment error:", getErrorMessage(error)),
  });
};

// Report JSON, PDF export (202 → poll until done/failed) and recent exports.
export const useReport = (type: ReportType, range: ReportDateRange = {}, enabled = false) => {
  return useQuery({
    queryKey: financeKeys.report(type, range),
    queryFn: () => financeApi.getReport(type, range),
    enabled,
  });
};

export const useExportReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.exports() }),
    mutationFn: ({ type, range }: { type: ReportType; range?: ReportDateRange }) =>
      financeApi.exportReport(type, range),
    onError: (error) => console.error("Export report error:", getErrorMessage(error)),
  });
};

export const useExportStatus = (exportId: string | undefined, enabled = false) => {
  return useQuery({
    queryKey: [...financeKeys.exports(), exportId],
    queryFn: () => financeApi.getExportStatus(exportId!),
    enabled: enabled && !!exportId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "done" || status === "failed" ? false : 2000;
    },
  });
};

export const useRecentExports = (enabled = false) => {
  return useQuery({
    queryKey: financeKeys.exports(),
    queryFn: financeApi.getRecentExports,
    enabled,
  });
};
