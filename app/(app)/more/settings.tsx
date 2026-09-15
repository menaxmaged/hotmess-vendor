import { useActionSheet } from '@expo/react-native-action-sheet';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import type { SfSymbols } from 'rn-icon-mapper';

import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { setAppLanguage } from '@/lib/i18n';
import { useColorScheme } from '@/lib/useColorScheme';
import { useDeleteAccount, useMe, useUpdateMe } from '@/Modules/account/hooks';
import type { LocalePref, Me } from '@/Modules/account/types';
import { useAuth } from '@/Modules/auth/context';

const LANGUAGES: { key: LocalePref; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'ar', label: 'العربية' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation(['more', 'common']);
  const { showActionSheetWithOptions } = useActionSheet();
  const { user, signOut, updateUser } = useAuth();
  const { data: me } = useMe();
  const updateMe = useUpdateMe();
  const deleteAccount = useDeleteAccount();
  const [editing, setEditing] = useState(false);

  const syncAuthUser = (next: Me) => {
    if (user) updateUser({ ...user, name: next.name, phone: next.phone });
  };

  const onLanguage = () => {
    const options = [...LANGUAGES.map((l) => l.label), t('common:actions.cancel')];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: t('settings.languagePreference') },
      (index) => {
        if (index === undefined || index >= LANGUAGES.length) return;
        const next = LANGUAGES[index]!.key;
        // Switch locally first so it works offline; the server copy follows the
        // account to other devices.
        void setAppLanguage(next).then((needsRestart) => {
          if (needsRestart) Alert.alert(t('common:language.restartTitle'), t('common:language.restartBody'));
        });
        updateMe.mutate(
          { localePref: next },
          { onError: (err) => Alert.alert(t('common:errors.couldNotSave'), getErrorMessage(err)) },
        );
      },
    );
  };

  const onDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.deleteBody'),
      [
        { text: t('common:actions.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteAccount'),
          style: 'destructive',
          onPress: () =>
            deleteAccount.mutate(undefined, {
              onSuccess: (result) =>
                Alert.alert(
                  t('settings.deletedTitle'),
                  t('settings.deletedBody', { date: formatDate(result.purgeAt) }),
                  [{ text: t('common:actions.ok'), onPress: signOut }],
                ),
              onError: (err) => Alert.alert(t('settings.couldNotDelete'), getErrorMessage(err)),
            }),
        },
      ],
    );
  };

  const language = LANGUAGES.find((l) => l.key === i18n.language)?.label ?? LANGUAGES[0]!.label;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4">
      <View className="overflow-hidden rounded-xl border border-border bg-card">
        <SettingsRow label={t('settings.name')} value={me?.name ?? user?.name} />
        <SettingsRow label={t('settings.email')} value={me?.email ?? user?.email} />
        <SettingsRow label={t('settings.phone')} value={me?.phone ?? user?.phone ?? '—'} />
        <SettingsAction icon="person.circle.fill" label={t('settings.editNamePhone')} onPress={() => setEditing(true)} last />
      </View>

      <View className="overflow-hidden rounded-xl border border-border bg-card">
        <SettingsAction
          icon="lock.fill"
          label={t('settings.changePassword')}
          onPress={() => router.push('/(app)/more/change-password' as Href)}
        />
        <SettingsAction icon="globe" label={t('settings.language')} value={language} onPress={onLanguage} />
        <SettingsAction
          icon="bell.fill"
          label={t('settings.notificationPreferences')}
          onPress={() => router.push('/(app)/more/notification-preferences' as Href)}
          last
        />
      </View>

      <Pressable
        onPress={signOut}
        className="items-center rounded-xl border border-border bg-card py-3">
        <Text className="font-medium text-destructive">{t('settings.signOut')}</Text>
      </Pressable>

      <Pressable onPress={onDeleteAccount} disabled={deleteAccount.isPending} className="items-center py-2">
        <Text variant="footnote" className="text-destructive">
          {deleteAccount.isPending ? t('settings.deleting') : t('settings.deleteAccount')}
        </Text>
      </Pressable>

      {editing && me ? (
        <EditProfileModal
          me={me}
          onClose={() => setEditing(false)}
          onSaved={(next) => {
            syncAuthUser(next);
            setEditing(false);
          }}
        />
      ) : null}
    </ScrollView>
  );
}

function EditProfileModal({ me, onClose, onSaved }: { me: Me; onClose: () => void; onSaved: (me: Me) => void }) {
  const { colors } = useColorScheme();
  const { t } = useTranslation(['more', 'common']);
  const updateMe = useUpdateMe();
  const [name, setName] = useState(me.name);
  const [phone, setPhone] = useState(me.phone ?? '');

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const changed = trimmedName !== me.name || trimmedPhone !== (me.phone ?? '');

  const onSave = () => {
    updateMe.mutate(
      {
        ...(trimmedName !== me.name ? { name: trimmedName } : {}),
        // Sending null is the only way to clear a phone number.
        ...(trimmedPhone !== (me.phone ?? '') ? { phone: trimmedPhone || null } : {}),
      },
      {
        onSuccess: onSaved,
        onError: (err) => Alert.alert(t('common:errors.couldNotSave'), getErrorMessage(err)),
      },
    );
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
        <Pressable onPress={() => {}} className="gap-3 rounded-t-3xl bg-background px-5 pb-8 pt-4">
          <View className="mb-1 h-1 w-10 self-center rounded-full bg-muted" />
          <Text variant="title3" className="font-bold">
            {t('settings.editNamePhone')}
          </Text>
          <TextInput
            value={name}
            onChangeText={(v) => setName(v.slice(0, 120))}
            placeholder={t('settings.yourName')}
            placeholderTextColor={colors.grey}
            className="rounded-xl bg-muted px-4 py-3.5 text-foreground"
          />
          <TextInput
            value={phone}
            onChangeText={(v) => setPhone(v.slice(0, 32))}
            placeholder={t('settings.phoneOptional')}
            placeholderTextColor={colors.grey}
            keyboardType="phone-pad"
            className="rounded-xl bg-muted px-4 py-3.5 text-foreground"
          />
          <Pressable
            onPress={onSave}
            disabled={!changed || !trimmedName || updateMe.isPending}
            className={`items-center rounded-2xl bg-primary py-3.5 ${
              changed && trimmedName && !updateMe.isPending ? 'active:opacity-80' : 'opacity-50'
            }`}>
            <Text className="font-bold text-white">{updateMe.isPending ? t('common:actions.saving') : t('common:actions.save')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SettingsRow({ label, value, last }: { label: string; value?: string | null; last?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between p-4 ${last ? '' : 'border-b border-border'}`}>
      <Text variant="footnote" color="tertiary">
        {label}
      </Text>
      <Text variant="subhead">{value ?? '—'}</Text>
    </View>
  );
}

function SettingsAction({
  icon,
  label,
  value,
  onPress,
  last,
}: {
  icon: SfSymbols;
  label: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { colors } = useColorScheme();
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 p-4 ${last ? '' : 'border-b border-border'}`}>
      <Icon name={icon} size={18} color={colors.foreground} />
      <Text variant="subhead" className="flex-1">
        {label}
      </Text>
      {value ? (
        <Text variant="subhead" color="tertiary">
          {value}
        </Text>
      ) : null}
      <Icon name="chevron.right" size={14} color={colors.grey} />
    </Pressable>
  );
}
