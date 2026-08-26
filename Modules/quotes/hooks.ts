/**
 * Quotes Feature - Hooks
 */

import { getErrorMessage } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { quotesApi } from "./api";
import type { CreateQuoteInput, QuotesQuery, UpdateQuoteInput } from "./types";

export const quotesKeys = {
  all: ["quotes"] as const,
  list: (query: QuotesQuery) => [...quotesKeys.all, "list", query] as const,
  detail: (quoteId: string) => [...quotesKeys.all, "detail", quoteId] as const,
};

export const useQuotes = (query: QuotesQuery = {}) => {
  return useQuery({
    queryKey: quotesKeys.list(query),
    queryFn: () => quotesApi.getQuotes(query),
  });
};

export const useQuote = (quoteId: string | undefined) => {
  return useQuery({
    queryKey: quotesKeys.detail(quoteId ?? ""),
    queryFn: () => quotesApi.getQuote(quoteId as string),
    enabled: !!quoteId,
  });
};

const useInvalidateQuotes = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: quotesKeys.all });
};

export const useCreateQuote = () => {
  const invalidate = useInvalidateQuotes();
  return useMutation({
    mutationFn: (input: CreateQuoteInput) => quotesApi.createQuote(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Create quote error:", getErrorMessage(error)),
  });
};

export const useUpdateQuote = () => {
  const invalidate = useInvalidateQuotes();
  return useMutation({
    mutationFn: (input: UpdateQuoteInput) => quotesApi.updateQuote(input),
    onSuccess: invalidate,
    onError: (error) => console.error("Update quote error:", getErrorMessage(error)),
  });
};
