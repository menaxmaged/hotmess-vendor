import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

import { openDeepLink } from '@/lib/deep-link';

import { notificationKeys } from '../hooks';
import { deepLinkFromResponse, registerPushDevice } from '../push';

/**
 * Native only (mounted by the signed-in tab layout). Registers this device for
 * push once per session, follows a tapped push's deep link (including the one
 * that cold-started the app), and refreshes the list and badge when one lands.
 */
export function PushBridge() {
  const queryClient = useQueryClient();
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);

  useEffect(() => {
    // Best-effort: no permission, a simulator, or missing FCM/APNs config just means no push.
    registerPushDevice().catch(() => {});
  }, []);

  useEffect(() => {
    if (!lastResponse || lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const id = lastResponse.notification.request.identifier;
    if (handledId.current === id) return;
    handledId.current = id;
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    const link = deepLinkFromResponse(lastResponse);
    if (link) openDeepLink(link);
  }, [lastResponse, queryClient]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });
    return () => subscription.remove();
  }, [queryClient]);

  return null;
}
