import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { useColorScheme } from '@/lib/useColorScheme';
import { useUpdateBooking } from '@/Modules/profile/hooks';
import type { AvailabilityBehaviour, PaymentMethod, ProfileBooking } from '@/Modules/profile/types';
import { Chip } from './Chip';
import { FieldLabel } from './FieldLabel';

const AVAILABILITY_OPTIONS: AvailabilityBehaviour[] = ['hide', 'show_busy', 'allow_request'];

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = ['cash', 'bank_transfer', 'card', 'instapay', 'wallet'];

export function BookingTab({ initial }: { initial: ProfileBooking }) {
  const { colors } = useColorScheme();
  const { t } = useTranslation('studio');
  const updateBooking = useUpdateBooking();

  const [depositPercent, setDepositPercent] = useState(initial.depositPercent?.toString() ?? '');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initial.paymentMethods);
  const [maxPerDay, setMaxPerDay] = useState(initial.maxBookingsPerDay?.toString() ?? '');
  const [maxPerWeekend, setMaxPerWeekend] = useState(
    initial.maxBookingsPerWeekend?.toString() ?? '',
  );
  const [minNotice, setMinNotice] = useState(initial.minNoticeDays?.toString() ?? '');
  const [availability, setAvailability] = useState<AvailabilityBehaviour | null>(
    initial.availabilityBehaviour,
  );

  const togglePayment = (method: PaymentMethod) => {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    );
  };

  const onSave = () => {
    updateBooking.mutate(
      {
        depositPercent: depositPercent ? Number(depositPercent) : null,
        paymentMethods,
        maxBookingsPerDay: maxPerDay ? Number(maxPerDay) : null,
        maxBookingsPerWeekend: maxPerWeekend ? Number(maxPerWeekend) : null,
        minNoticeDays: minNotice ? Number(minNotice) : null,
        availabilityBehaviour: availability,
      },
      {
        onSuccess: () => Alert.alert(t('saved'), t('booking.savedBody')),
        onError: (err) => Alert.alert(t('saveFailed'), getErrorMessage(err)),
      },
    );
  };

  return (
    <ScrollView contentContainerClassName="gap-5 p-4">
      <View className="gap-1.5">
        <FieldLabel>{t('booking.deposit')}</FieldLabel>
        <TextInput
          value={depositPercent}
          onChangeText={setDepositPercent}
          keyboardType="numeric"
          placeholder={t('booking.depositPlaceholder')}
          placeholderTextColor={colors.grey}
          className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
        />
      </View>

      <View className="gap-1.5">
        <FieldLabel>{t('booking.paymentMethods')}</FieldLabel>
        <View className="flex-row flex-wrap gap-2">
          {PAYMENT_METHOD_OPTIONS.map((method) => (
            <Chip
              key={method}
              label={t(`booking.methods.${method}`)}
              selected={paymentMethods.includes(method)}
              onPress={() => togglePayment(method)}
            />
          ))}
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 gap-1.5">
          <FieldLabel>{t('booking.maxDay')}</FieldLabel>
          <TextInput
            value={maxPerDay}
            onChangeText={setMaxPerDay}
            keyboardType="numeric"
            placeholderTextColor={colors.grey}
            className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
          />
        </View>
        <View className="flex-1 gap-1.5">
          <FieldLabel>{t('booking.maxWeekend')}</FieldLabel>
          <TextInput
            value={maxPerWeekend}
            onChangeText={setMaxPerWeekend}
            keyboardType="numeric"
            placeholderTextColor={colors.grey}
            className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
          />
        </View>
      </View>

      <View className="gap-1.5">
        <FieldLabel>{t('booking.minNotice')}</FieldLabel>
        <TextInput
          value={minNotice}
          onChangeText={setMinNotice}
          keyboardType="numeric"
          placeholderTextColor={colors.grey}
          className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
        />
      </View>

      <View className="gap-1.5">
        <FieldLabel>{t('booking.availability')}</FieldLabel>
        <View className="gap-2">
          {AVAILABILITY_OPTIONS.map((option) => {
            const selected = option === availability;
            return (
              <Pressable
                key={option}
                onPress={() => setAvailability(option)}
                className={`flex-row items-center gap-3 rounded-xl border p-3 ${
                  selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}>
                <View
                  className={`h-4 w-4 items-center justify-center rounded-full border-2 ${
                    selected ? 'border-primary' : 'border-border'
                  }`}>
                  {selected ? <View className="h-2 w-2 rounded-full bg-primary" /> : null}
                </View>
                <Text variant="subhead">{t(`booking.availabilityOptions.${option}`)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button onPress={onSave} disabled={updateBooking.isPending}>
        <Text>{updateBooking.isPending ? t('saving') : t('booking.save')}</Text>
      </Button>
    </ScrollView>
  );
}
