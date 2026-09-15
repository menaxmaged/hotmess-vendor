import { useTranslation } from "react-i18next";
import { I18nManager, Platform } from "react-native";

/**
 * Whether the UI is laid out right-to-left right now. Web flips as soon as the
 * language changes (`dir="rtl"` on <html>); native only after the restart that
 * `forceRTL` needs, so it follows `I18nManager.isRTL` instead of the language.
 */
export function useIsRTL(): boolean {
  const { i18n } = useTranslation();
  return Platform.OS === "web" ? i18n.language === "ar" : I18nManager.isRTL;
}

/**
 * Class that pins text to the end edge. RN native already swaps `right` for
 * `left` in RTL; CSS on web doesn't, so web needs the mirrored class.
 */
export const textEnd = (isRTL: boolean) => (Platform.OS === "web" && isRTL ? "text-left" : "text-right");
