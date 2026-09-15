import { useActionSheet } from '@expo/react-native-action-sheet';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { useColorScheme } from '@/lib/useColorScheme';
import { useRoles } from '@/Modules/roles/hooks';
import { useInviteMember } from '@/Modules/team/hooks';
import type { InviteDelivery } from '@/Modules/team/types';

const DELIVERY_OPTIONS: InviteDelivery[] = ['email', 'whatsapp'];

export default function InviteMemberScreen() {
  const router = useRouter();
  const { t } = useTranslation(['studio', 'common']);
  const { colors } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const { data: roles } = useRoles();
  const inviteMember = useInviteMember();

  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<InviteDelivery>('email');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedRole = (roles ?? []).find((r) => r.id === roleId);

  const openRolePicker = () => {
    const list = roles ?? [];
    const options = [...list.map((r) => r.name), t('common:actions.cancel')];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, title: t('invite.assignRole') },
      (index) => {
        if (index === undefined || index === options.length - 1) return;
        setRoleId(list[index]!.id);
      },
    );
  };

  const onSubmit = async () => {
    setError(null);
    if (delivery === 'whatsapp' && !phone.trim()) {
      setError(t('invite.enterWhatsapp'));
      return;
    }
    try {
      await inviteMember.mutateAsync({
        email: email.trim(),
        roleId,
        delivery,
        phone: delivery === 'whatsapp' ? phone.trim() : undefined,
      });
      router.back();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ gap: 20, padding: 16 }}>
      <View className="gap-1.5">
        <Text variant="caption1" color="tertiary">
          {t('invite.email')}
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="teammate@studio.com"
          placeholderTextColor={colors.grey}
          autoCapitalize="none"
          keyboardType="email-address"
          className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
        />
      </View>

      <View className="gap-1.5">
        <Text variant="caption1" color="tertiary">
          {t('invite.role')}
        </Text>
        <Pressable
          onPress={openRolePicker}
          className="flex-row items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <Text className={selectedRole ? undefined : 'text-muted-foreground'}>
            {selectedRole?.name ?? t('invite.chooseRole')}
          </Text>
        </Pressable>
      </View>

      <View className="gap-1.5">
        <Text variant="caption1" color="tertiary">
          {t('invite.delivery')}
        </Text>
        <View className="flex-row rounded-xl bg-muted p-1">
          {DELIVERY_OPTIONS.map((option) => {
            const selected = option === delivery;
            return (
              <Pressable
                key={option}
                onPress={() => setDelivery(option)}
                className={`flex-1 items-center rounded-lg py-2 ${selected ? 'bg-card' : ''}`}>
                <Text
                  variant="footnote"
                  className={selected ? 'font-semibold' : 'text-muted-foreground'}>
                  {t(`invite.deliveryOptions.${option}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {delivery === 'whatsapp' ? (
        <View className="gap-1.5">
          <Text variant="caption1" color="tertiary">
            {t('invite.whatsappNumber')}
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+20 10 1234 5678"
            placeholderTextColor={colors.grey}
            keyboardType="phone-pad"
            className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
          />
          <Text variant="caption2" color="tertiary">
            {t('invite.whatsappNote')}
          </Text>
        </View>
      ) : null}

      {error ? (
        <Text variant="footnote" className="text-destructive">
          {error}
        </Text>
      ) : null}

      <Button
        onPress={onSubmit}
        disabled={
          !email.trim() ||
          (delivery === 'whatsapp' && !phone.trim()) ||
          inviteMember.isPending
        }>
        <Text>{inviteMember.isPending ? t('invite.sending') : t('invite.send')}</Text>
      </Button>
    </KeyboardAwareScrollView>
  );
}
