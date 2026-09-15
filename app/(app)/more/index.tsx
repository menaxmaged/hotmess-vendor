import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import type { SfSymbols } from 'rn-icon-mapper';

import { InitialsAvatar } from '@/components/InitialsAvatar';
import { StudioStatusBanner } from '@/components/StudioStatusBanner';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { useAuth } from '@/Modules/auth/context';
import { useNotificationUnreadCount } from '@/Modules/notifications/hooks';
import { useSubscription } from '@/Modules/subscription/hooks';
import { useColorScheme } from '@/lib/useColorScheme';

interface MenuItem {
  href: Href;
  icon: SfSymbols;
  label: string;
  description: string;
  badge?: string;
  /** Amber badge (upsell / Premium) rather than the neutral one. */
  highlight?: boolean;
}

export default function MoreScreen() {
  const router = useRouter();
  const { t } = useTranslation(['more', 'common']);
  const { colors } = useColorScheme();
  const { user, signOut } = useAuth();
  const { data: subscription } = useSubscription();
  const { data: unreadNotifications = 0 } = useNotificationUnreadCount();

  const isPremium = subscription?.isPremium ?? false;

  const studioItems: MenuItem[] = [
    {
      href: '/(app)/more/profile',
      icon: 'person.circle.fill',
      label: t('menu.profile.label'),
      description: t('menu.profile.description'),
    },
    {
      href: '/(app)/more/automation',
      icon: 'bolt.fill',
      label: t('menu.automation.label'),
      description: t('menu.automation.description'),
    },
    {
      href: '/(app)/more/team',
      icon: 'person.2.fill',
      label: t('menu.team.label'),
      description: t('menu.team.description'),
      badge: isPremium ? undefined : t('common:badges.premium'),
      highlight: true,
    },
    {
      href: '/(app)/more/saved-replies' as Href,
      icon: 'quote.bubble.fill',
      label: t('menu.savedReplies.label'),
      description: t('menu.savedReplies.description'),
      badge: isPremium ? undefined : t('common:badges.premium'),
      highlight: true,
    },
  ];

  const growthItems: MenuItem[] = [
    {
      href: '/(app)/more/ads',
      icon: 'megaphone.fill',
      label: t('menu.ads.label'),
      description: t('menu.ads.description'),
    },
    {
      href: '/(app)/more/premium',
      icon: 'star.fill',
      label: t('menu.premium.label'),
      description: t('menu.premium.description'),
      badge: isPremium ? t('common:badges.premium') : t('common:badges.free'),
      highlight: isPremium,
    },
  ];

  const accountItems: MenuItem[] = [
    {
      href: '/(app)/more/notifications' as Href,
      icon: 'bell.fill',
      label: t('menu.notifications.label'),
      description: t('menu.notifications.description'),
      badge: unreadNotifications > 0 ? String(unreadNotifications) : undefined,
    },
    {
      href: '/(app)/more/settings',
      icon: 'gearshape.fill',
      label: t('menu.settings.label'),
      description: t('menu.settings.description'),
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 gap-6 p-4">
        <StudioStatusBanner />
        <Pressable
          onPress={() => router.push('/(app)/more/profile')}
          className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-4">
          <InitialsAvatar name={user?.name ?? 'Studio'} size={48} />
          <View className="flex-1">
            <Text variant="subhead" className="font-semibold" numberOfLines={1}>
              {user?.name ?? t('menu.yourStudio')}
            </Text>
            <Text variant="caption1" color="tertiary" numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
          <Icon name="chevron.right" size={16} color={colors.grey} />
        </Pressable>

        <MenuSection title={t('menu.sections.studio')} items={studioItems} onPress={(href) => router.push(href)} />
        <MenuSection title={t('menu.sections.growth')} items={growthItems} onPress={(href) => router.push(href)} />
        <MenuSection title={t('menu.sections.account')} items={accountItems} onPress={(href) => router.push(href)} />

        <View className="mt-auto gap-2">
          <Pressable
            onPress={signOut}
            className="items-center rounded-xl border border-border bg-card py-3">
            <Text className="font-medium text-destructive">{t('menu.signOut')}</Text>
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
                  item.highlight
                    ? 'bg-amber-100 dark:bg-amber-950'
                    : 'bg-muted'
                }`}>
                <Text
                  variant="caption2"
                  className={`font-medium ${
                    item.highlight
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
