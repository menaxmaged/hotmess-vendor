/**
 * Subscription Feature - Hooks
 */

import { getErrorMessage } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionApi } from "./api";
import type { SetPaymentMethodInput } from "./types";

export const subscriptionKeys = {
  all: ["subscription"] as const,
  state: () => [...subscriptionKeys.all, "state"] as const,
  plans: () => [...subscriptionKeys.all, "plans"] as const,
  invoices: (page: number) => [...subscriptionKeys.all, "invoices", page] as const,
};

export const useSubscription = () => {
  return useQuery({
    queryKey: subscriptionKeys.state(),
    queryFn: subscriptionApi.getSubscription,
  });
};

export const usePlans = () => {
  return useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: subscriptionApi.getPlans,
  });
};

export const useInvoices = (page = 1) => {
  return useQuery({
    queryKey: subscriptionKeys.invoices(page),
    queryFn: () => subscriptionApi.getInvoices(page),
  });
};

const useInvalidateSubscription = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
};

export const useUpgrade = () => {
  return useMutation({
    mutationFn: (planId: string) => subscriptionApi.upgrade(planId),
    onError: (error) => console.error("Upgrade error:", getErrorMessage(error)),
  });
};

export const useCancelSubscription = () => {
  const invalidate = useInvalidateSubscription();
  return useMutation({
    mutationFn: (reason?: string) => subscriptionApi.cancel(reason),
    onSuccess: invalidate,
    onError: (error) => console.error("Cancel subscription error:", getErrorMessage(error)),
  });
};

export const useDownloadInvoicePdf = () => {
  return useMutation({
    mutationFn: (invoiceId: string) => subscriptionApi.getInvoicePdf(invoiceId),
    onError: (error) => console.error("Download invoice PDF error:", getErrorMessage(error)),
  });
};

export const useSetPaymentMethod = () => {
  const invalidate = useInvalidateSubscription();
  return useMutation({
    mutationFn: (input: SetPaymentMethodInput) => subscriptionApi.setPaymentMethod(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Set payment method error:", getErrorMessage(error)),
  });
};
