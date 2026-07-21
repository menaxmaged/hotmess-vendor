import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { Icon } from '@/components/nativewindui/Icon';
import { useColorScheme } from '@/lib/useColorScheme';

const asString = (color: ColorValue) => color as string;

export default function AppTabsLayout() {
  const { colors } = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.grey,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="house.fill" color={asString(color)} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="tray.fill" color={asString(color)} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <Icon name="calendar" color={asString(color)} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <Icon name="chart.bar.fill" color={asString(color)} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="ellipsis.circle.fill" color={asString(color)} />,
        }}
      />
      <Tabs.Screen name="finance" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
