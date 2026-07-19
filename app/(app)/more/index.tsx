import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import type { SfSymbols } from 'rn-icon-mapper';

import { InitialsAvatar } from '@/components/InitialsAvatar';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { useAuth } from '@/Modules/auth/context';
import { useHomeSubscriptionSummary } from '@/Modules/home/hooks';
import { useColorScheme } from '@/lib/useColorScheme';

interface MenuItem {
  href: Href;
  icon: SfSymbols;
  label: string;
  description: string;
  badge?: string;
}

export default function MoreScreen() {
  const router = useRouter();
  const { colors } = useColorScheme();
  const { user, signOut } = useAuth();
  const { data: subscription } = useHomeSubscriptionSummary();

  const isPremium = subscription?.plan === 'premium';

  const studioItems: MenuItem[] = [
    {
      href: '/(app)/more/profile',
      icon: 'person.circle.fill',
      label: 'Profile & Settings',
      description: 'Business info, categories, booking rules, Instagram, packages',
    },
    {
      href: '/(app)/more/automation',
      icon: 'bolt.fill',
      label: 'Automation',
      description: 'Welcome flow, intake questions, auto-reply',
    },
    {
      href: '/(app)/more/auto-assign',
      icon: 'arrow.right.circle.fill',
      label: 'Auto-Assign Rules',
      description: 'Route chats to team members by status',
      badge: isPremium ? undefined : 'Premium',
    },
    {
      href: '/(app)/more/team',
      icon: 'person.2.fill',
      label: 'Team & Roles',
      description: 'Invite members, manage permissions',
      badge: isPremium ? undefined : 'Premium',
    },
  ];

  const growthItems: MenuItem[] = [
    {
      href: '/(app)/more/ads',
      icon: 'megaphone.fill',
      label: 'Sponsored Ads',
      description: 'Buy placements, manage campaigns',
    },
    {
      href: '/(app)/more/premium',
      icon: 'star.fill',
      label: 'Subscription & Premium',
      description: 'Manage your plan and billing',
      badge: isPremium ? 'Premium' : 'Free',
    },
  ];

  const accountItems: MenuItem[] = [
    {
      href: '/(app)/more/settings',
      icon: 'gearshape.fill',
      label: 'Settings',
      description: 'Language, notifications, security',
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 gap-6 p-4">
        <Pressable
          onPress={() => router.push('/(app)/more/profile')}
          className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-4">
          <InitialsAvatar name={user?.name ?? 'Studio'} size={48} />
          <View className="flex-1">
            <Text variant="subhead" className="font-semibold" numberOfLines={1}>
              {user?.name ?? 'Your studio'}
            </Text>
            <Text variant="caption1" color="tertiary" numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
          <Icon name="chevron.right" size={16} color={colors.grey} />
        </Pressable>

        <MenuSection title="Studio" items={studioItems} onPress={(href) => router.push(href)} />
        <MenuSection title="Growth" items={growthItems} onPress={(href) => router.push(href)} />
        <MenuSection title="Account" items={accountItems} onPress={(href) => router.push(href)} />

        <View className="mt-auto gap-2">
          <Pressable
            onPress={signOut}
            className="items-center rounded-xl border border-border bg-card py-3">
            <Text className="font-medium text-destructive">Sign out</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MenuSection({
  title,
  items,
  onPress,
}: {
  title: string;
  items: MenuItem[];
  onPress: (href: Href) => void;
}) {
  const { colors } = useColorScheme();

  return (
    <View className="gap-2">
      <Text variant="caption2" color="tertiary" className="px-1">
        {title.toUpperCase()}
      </Text>
      <View className="overflow-hidden rounded-xl border border-border bg-card">
        {items.map((item, index) => (
          <Pressable
            key={item.label}
            onPress={() => onPress(item.href)}
            className={`flex-row items-center gap-3 p-4 ${
              index < items.length - 1 ? 'border-b border-border' : ''
            }`}>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Icon name={item.icon} size={18} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text variant="subhead" className="font-medium">
                {item.label}
              </Text>
              <Text variant="caption1" color="tertiary" numberOfLines={1}>
                {item.description}
              </Text>
            </View>
            {item.badge ? (
              <View
                className={`rounded-full px-2 py-0.5 ${
                  item.badge === 'Premium'
                    ? 'bg-amber-100 dark:bg-amber-950'
                    : 'bg-muted'
                }`}>
                <Text
                  variant="caption2"
                  className={`font-medium ${
                    item.badge === 'Premium'
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-muted-foreground'
                  }`}>
                  {item.badge}
                </Text>
              </View>
            ) : null}
            <Icon name="chevron.right" size={14} color={colors.grey} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
