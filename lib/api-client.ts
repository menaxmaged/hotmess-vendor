/**
 * Global API Client - Base configuration
 * Used by all features
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiResponse } from "@/types";
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import Constants from "expo-constants";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "https://hotmess-api.codexeg.net/v1";

const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? "example";

// Set EXPO_PUBLIC_USE_MOCK_DATA=true to make every Modules/*/api.ts serve
// in-memory mock data instead of hitting the network. Toggled per-build via env.
export const USE_MOCK_DATA = process.env.EXPO_PUBLIC_USE_MOCK_DATA === "true";

const TOKEN_KEY = "hotmess_token";
const CACHE_PREFIX = "hotmess_cache:";
const CACHE_TTL_MS = 1000 * 60 * 10;

type CachedEntry<T> = {
  ts: number;
  data: ApiResponse<T>;
};

const getCacheKey = (url: string, config?: AxiosRequestConfig): string => {
  const params = config?.params ? JSON.stringify(config.params) : "";
  return `${CACHE_PREFIX}${url}?${params}`;
};

const readCache = <T>(key: string): ApiResponse<T> | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CachedEntry<T>;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const writeCache = <T>(key: string, data: ApiResponse<T>): void => {
  if (typeof window === "undefined") return;
  const payload: CachedEntry<T> = { ts: Date.now(), data };
  localStorage.setItem(key, JSON.stringify(payload));
};

const createCachedResponse = <T>(
  data: ApiResponse<T>,
  config?: AxiosRequestConfig,
): AxiosResponse<ApiResponse<T>> => ({
  data,
  status: 200,
  statusText: "OK (cached)",
  headers: {},
  config: (config ?? {}) as InternalAxiosRequestConfig,
});

// ---------------------------------------------------------------------------
// Token manager — SecureStore on native, localStorage on web
// ---------------------------------------------------------------------------
export const tokenManager = {
  get: async (): Promise<string | null> => {
    if (Platform.OS === "web") {
      return typeof window !== "undefined"
        ? localStorage.getItem(TOKEN_KEY)
        : null;
    }
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  set: async (token: string): Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  },

  remove: async (): Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  },
};

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      "api-key": API_KEY,
    },
  });

  client.interceptors.request.use(
    async (config) => {
      const token = await tokenManager.get();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        await tokenManager.remove();
        router.replace("/(auth)/login");
      }
      return Promise.reject(error);
    },
  );

  return client;
};

export const apiClient = createApiClient();

// ---------------------------------------------------------------------------
// Typed helper methods
// ---------------------------------------------------------------------------
export const api = {
  get: <T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    const isWeb = Platform.OS === "web" && typeof window !== "undefined";
    const cacheKey = isWeb ? getCacheKey(url, config) : "";

    if (isWeb && typeof navigator !== "undefined" && !navigator.onLine) {
      const cached = readCache<T>(cacheKey);
      if (cached) return Promise.resolve(createCachedResponse(cached, config));
    }

    return apiClient
      .get(url, config)
      .then((response) => {
        if (isWeb) writeCache<T>(cacheKey, response.data);
        return response;
      })
      .catch((error) => {
        if (isWeb) {
          const cached = readCache<T>(cacheKey);
          if (cached)
            return Promise.resolve(createCachedResponse(cached, config));
        }
        return Promise.reject(error);
      });
  },

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.post(url, data, config);
  },

  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.put(url, data, config);
  },

  delete: <T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.delete(url, config);
  },

  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.patch(url, data, config);
  },
};

// ---------------------------------------------------------------------------
// Multipart form-data helpers
// ---------------------------------------------------------------------------
export const apiFormData = {
  post: <T = any>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    }),

  put: <T = any>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ApiResponse<T>>> =>
    apiClient.put(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    }),
};

// ---------------------------------------------------------------------------
// Generic response-unwrapping helpers (used by all API modules)
// ---------------------------------------------------------------------------
export const toList = <T>(payload: unknown, key: string): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const c = payload as Record<string, unknown>;
    const nested = c[key] ?? c.items ?? c.data;
    if (Array.isArray(nested)) return nested as T[];
  }
  return [];
};

export const toItem = <T>(payload: unknown, key?: string): T | null => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const c = payload as Record<string, unknown>;
    const nested = key ? c[key] : (c.item ?? c.data);
    if (nested && typeof nested === "object" && !Array.isArray(nested))
      return nested as T;
    return c as T;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------
export const getErrorMessage = (error: any): string => {
  // Check for API response message
  if (error.response?.data?.message_en) {
    return error.response.data.message_en;
  }

  // Check for API response message (fallback)
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Check for error.data.message (some APIs return this)
  if (error.data?.message) {
    return error.data.message;
  }

  // Check for HTTP status code specific messages
  if (error.response?.status === 401) {
    return "Invalid email or password";
  }

  if (error.response?.status === 400) {
    return "Invalid request. Please check your input.";
  }

  if (error.response?.status === 403) {
    return "Access denied.";
  }

  if (error.response?.status === 404) {
    return "Resource not found.";
  }

  if (error.response?.status === 409) {
    return "Email already exists. Please try logging in or use a different email.";
  }

  if (error.response?.status === 429) {
    return "Too many requests. Please try again later.";
  }

  if (error.response?.status >= 500) {
    return "Server error. Please try again later.";
  }

  // Check for network error
  if (error.code === "ECONNABORTED" || error.message === "timeout") {
    return "Request timeout. Please check your connection and try again.";
  }

  if (
    error.code === "ECONNREFUSED" ||
    error.message?.includes("ECONNREFUSED")
  ) {
    return "Cannot connect to server. Please check if the backend is running.";
  }

  // Check for error.message (usually from thrown errors)
  if (error.message) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
};
