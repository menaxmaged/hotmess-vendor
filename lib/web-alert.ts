import { Alert, Platform, type AlertButton } from "react-native";

/**
 * react-native-web ships `Alert.alert` as a no-op, so every confirm dialog
 * (delete account, cancel campaign, delete event...) silently did nothing on
 * web. Map it onto the browser's own dialogs: one button → window.alert, a
 * cancel + action pair → window.confirm, anything longer → a numbered prompt.
 */
export function installWebAlert() {
  if (Platform.OS !== "web" || typeof window === "undefined") return;

  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    const text = [title, message].filter(Boolean).join("\n\n");
    const list = buttons?.length ? buttons : [{ text: "OK" }];
    const cancel = list.find((b) => b.style === "cancel");
    const actions = list.filter((b) => b !== cancel);

    if (actions.length <= 1 && !cancel) {
      window.alert(text);
      actions[0]?.onPress?.();
      return;
    }
    if (actions.length === 1) {
      if (window.confirm(text)) actions[0]!.onPress?.();
      else cancel?.onPress?.();
      return;
    }
    const menu = actions.map((b, i) => `${i + 1}. ${b.text ?? ""}`).join("\n");
    const picked = Number(window.prompt(`${text}\n\n${menu}`, "1"));
    const chosen = actions[picked - 1];
    if (chosen) chosen.onPress?.();
    else cancel?.onPress?.();
  };
}
