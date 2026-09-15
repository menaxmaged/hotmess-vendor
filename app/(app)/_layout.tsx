import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, type ColorValue } from 'react-native';

import { Icon } from '@/components/nativewindui/Icon';
import { currentLanguage, setAppLanguage, storedLanguage } from '@/lib/i18n';
import { useColorScheme } from '@/lib/useColorScheme';
import { useMe } from '@/Modules/account/hooks';
import { useUnreadCount } from '@/Modules/inbox/hooks';
import { PushBridge } from '@/Modules/notifications/components/PushBridge';

const asString = (color: ColorValue) => color as string;

export default function AppTabsLayout() {
  const { colors } = useColorScheme();
  const { t } = useTranslation();
  const { data: unread } = useUnreadCount();
  const { data: me } = useMe();

  // The account's saved language seeds a device that hasn't picked one yet. A
  // choice made on this device wins, so switching in Settings can't be undone
  // by a stale server copy before the save lands.
  useEffect(() => {
    const serverPref = me?.localePref;
    if (!serverPref) return;
    void storedLanguage().then((stored) => {
      if (!stored && serverPref !== currentLanguage()) void setAppLanguage(serverPref);
    });
  }, [me?.localePref]);

  return (
    <>
      {Platform.OS !== 'web' ? <PushBridge /> : null}
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.grey,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="house.fill" color={asString(color)} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: t('tabs.inbox'),
          headerShown: false,
          tabBarBadge: unread?.conversations ? unread.conversations : undefined,
          tabBarIcon: ({ color }) => <Icon name="tray.fill" color={asString(color)} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabs.calendar'),
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="calendar" color={asString(color)} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: t('tabs.analytics'),
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="chart.bar.fill" color={asString(color)} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('tabs.more'),
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="ellipsis.circle.fill" color={asString(color)} />,
        }}
      />
      <Tabs.Screen name="finance" options={{ href: null, headerShown: false }} />
      </Tabs>
    </>
  );
}
