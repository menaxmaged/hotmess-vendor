import { getLocales } from "expo-localization";
import i18n from "i18next";
import * as SecureStore from "expo-secure-store";
import { initReactI18next } from "react-i18next";
import { I18nManager, Platform } from "react-native";

import { resources } from "@/locales";

export type AppLanguage = "en" | "ar";

const STORAGE_KEY = "hotmess_language";

const isAppLanguage = (value: unknown): value is AppLanguage => value === "en" || value === "ar";

const readStoredSync = (): AppLanguage | null => {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") return null;
  const value = localStorage.getItem(STORAGE_KEY);
  return isAppLanguage(value) ? value : null;
};

// Native direction survives restarts (forceRTL is persisted by the OS), so on a
// cold start `I18nManager.isRTL` already says which language was last chosen —
// using it avoids rendering one frame of English inside an RTL layout.
const initialLanguage = (): AppLanguage => {
  const stored = readStoredSync();
  if (stored) return stored;
  if (Platform.OS !== "web" && I18nManager.isRTL) return "ar";
  const device = getLocales()[0]?.languageCode;
  return device === "ar" ? "ar" : "en";
};

const applyWebDirection = (language: AppLanguage) => {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
};

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage(),
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
    // Wrap every interpolated value in first-strong isolates while in Arabic, so
    // LTR values (sizes, money, dates, emails) keep their own order mid-sentence
    // instead of being reshuffled by the bidi algorithm.
    alwaysFormat: true,
    format: (value: string, _format?: string, lng?: string): string =>
      lng === "ar" && (typeof value === "string" || typeof value === "number") && value !== ""
        ? `\u2068${value}\u2069`
        : value,
  },
  returnNull: false,
});
applyWebDirection(i18n.language as AppLanguage);

// Native stores the choice in SecureStore (async); reconcile once it's read.
if (Platform.OS !== "web") {
  void SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
    if (isAppLanguage(stored) && stored !== i18n.language) void i18n.changeLanguage(stored);
  });
}

/** The language picked on this device, if any (as opposed to the device default). */
export async function storedLanguage(): Promise<AppLanguage | null> {
  if (Platform.OS === "web") return readStoredSync();
  const value = await SecureStore.getItemAsync(STORAGE_KEY);
  return isAppLanguage(value) ? value : null;
}

export const currentLanguage = (): AppLanguage => (i18n.language === "ar" ? "ar" : "en");

/** BCP-47 tag for Intl formatting. Latin digits in both, matching EGP amounts and phone numbers. */
export const localeTag = (): string => (currentLanguage() === "ar" ? "ar-EG-u-nu-latn" : "en-GB");

/**
 * Switches the UI language and layout direction. Returns true when a native
 * restart is still needed for the direction to flip (RN applies forceRTL only
 * on the next launch); web flips immediately.
 */
export async function setAppLanguage(language: AppLanguage): Promise<boolean> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, language);
  } else {
    await SecureStore.setItemAsync(STORAGE_KEY, language);
  }
  await i18n.changeLanguage(language);
  applyWebDirection(language);

  if (Platform.OS === "web") return false;
  const wantRTL = language === "ar";
  I18nManager.allowRTL(wantRTL);
  I18nManager.forceRTL(wantRTL);
  return I18nManager.isRTL !== wantRTL;
}

export default i18n;
