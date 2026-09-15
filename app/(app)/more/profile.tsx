import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, View } from 'react-native';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { AccountTab } from '@/Modules/profile/components/AccountTab';
import { BookingTab } from '@/Modules/profile/components/BookingTab';
import { CategoriesTab } from '@/Modules/profile/components/CategoriesTab';
import { FilesTab } from '@/Modules/profile/components/FilesTab';
import { InstagramTab } from '@/Modules/profile/components/InstagramTab';
import { ProfileTab } from '@/Modules/profile/components/ProfileTab';
import { useProfileOverview } from '@/Modules/profile/hooks';

type ProfileSubTab = 'profile' | 'categories' | 'booking' | 'instagram' | 'files' | 'account';

const TABS: ProfileSubTab[] = ['profile', 'categories', 'booking', 'instagram', 'files', 'account'];

export default function ProfileScreen() {
  const { t } = useTranslation(['studio', 'common']);
  const params = useLocalSearchParams<{ tab?: string }>();
  const linkedTab = TABS.find((key) => key === params.tab);
  const [tab, setTab] = useState<ProfileSubTab>(linkedTab ?? 'profile');
  // Deep links (checklist, notifications) can land here with a tab already open,
  // including while the screen is still mounted from an earlier visit.
  const [seenLink, setSeenLink] = useState(linkedTab);
  if (linkedTab !== seenLink) {
    setSeenLink(linkedTab);
    if (linkedTab) setTab(linkedTab);
  }
  const { data, isLoading, isError, error, refetch } = useProfileOverview();

  return (
    <View className="flex-1 bg-background">
      <View className="border-b border-border py-2">
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(key) => key}
          contentContainerClassName="gap-2 px-4"
          renderItem={({ item }) => {
            const selected = item === tab;
            return (
              <Pressable
                onPress={() => setTab(item)}
                className={`rounded-full border px-3.5 py-1.5 ${
                  selected ? 'border-primary bg-primary' : 'border-border bg-card'
                }`}>
                <Text
                  variant="footnote"
                  className={selected ? 'font-semibold text-white' : 'font-medium'}>
                  {t(`profileTabs.${item}`)}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : isError || !data ? (
        <View className="flex-1 items-center justify-center gap-2 p-6">
          <Text color="tertiary" className="text-center">
            {getErrorMessage(error)}
          </Text>
          <Pressable onPress={() => refetch()}>
            <Text className="text-primary">{t('common:actions.retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-1">
          {tab === 'profile' ? <ProfileTab initial={data.profile} /> : null}
          {tab === 'categories' ? (
            <CategoriesTab initial={data.categories} coverage={data.coverage} />
          ) : null}
          {tab === 'booking' ? <BookingTab initial={data.booking} /> : null}
          {tab === 'instagram' ? <InstagramTab vendorId={data.profile.id} /> : null}
          {tab === 'files' ? <FilesTab initial={data.files} /> : null}
          {tab === 'account' ? <AccountTab /> : null}
        </View>
      )}
    </View>
  );
}
