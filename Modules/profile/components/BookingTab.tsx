import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';
import { useUpdateBooking } from '@/Modules/profile/hooks';
import type { AvailabilityBehaviour, PaymentMethod, ProfileBooking } from '@/Modules/profile/types';
import { Chip } from './Chip';
import { FieldLabel } from './FieldLabel';

const AVAILABILITY_OPTIONS: { key: AvailabilityBehaviour; label: string }[] = [
  { key: 'hide', label: 'Hide when booked' },
  { key: 'show_busy', label: 'Show as unavailable' },
  { key: 'allow_request', label: 'Always visible, allow requests' },
];

const PAYMENT_METHOD_OPTIONS: { key: PaymentMethod; label: string }[] = [
  { key: 'cash', label: 'Cash' },
  { key: 'bank_transfer', label: 'Bank transfer' },
  { key: 'card', label: 'Card' },
  { key: 'instapay', label: 'Instapay' },
  { key: 'wallet', label: 'Wallet' },
];

export function BookingTab({ initial }: { initial: ProfileBooking }) {
  const { colors } = useColorScheme();
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
    updateBooking.mutate({
      depositPercent: depositPercent ? Number(depositPercent) : null,
      paymentMethods,
      maxBookingsPerDay: maxPerDay ? Number(maxPerDay) : null,
      maxBookingsPerWeekend: maxPerWeekend ? Number(maxPerWeekend) : null,
      minNoticeDays: minNotice ? Number(minNotice) : null,
      availabilityBehaviour: availability,
    });
  };

  return (
    <ScrollView contentContainerClassName="gap-5 p-4">
      <View className="gap-1.5">
        <FieldLabel>DEPOSIT %</FieldLabel>
        <TextInput
          value={depositPercent}
          onChangeText={setDepositPercent}
          keyboardType="numeric"
          placeholder="e.g. 25"
          placeholderTextColor={colors.grey}
          className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
        />
      </View>

      <View className="gap-1.5">
        <FieldLabel>PAYMENT METHODS</FieldLabel>
        <View className="flex-row flex-wrap gap-2">
          {PAYMENT_METHOD_OPTIONS.map((method) => (
            <Chip
              key={method.key}
              label={method.label}
              selected={paymentMethods.includes(method.key)}
              onPress={() => togglePayment(method.key)}
            />
          ))}
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 gap-1.5">
          <FieldLabel>MAX / DAY</FieldLabel>
          <TextInput
            value={maxPerDay}
            onChangeText={setMaxPerDay}
            keyboardType="numeric"
            placeholderTextColor={colors.grey}
            className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
          />
        </View>
        <View className="flex-1 gap-1.5">
          <FieldLabel>MAX / WEEKEND</FieldLabel>
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
        <FieldLabel>MINIMUM NOTICE (DAYS)</FieldLabel>
        <TextInput
          value={minNotice}
          onChangeText={setMinNotice}
          keyboardType="numeric"
          placeholderTextColor={colors.grey}
          className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
        />
      </View>

      <View className="gap-1.5">
        <FieldLabel>AVAILABILITY BEHAVIOUR</FieldLabel>
        <View className="gap-2">
          {AVAILABILITY_OPTIONS.map((opt) => {
            const selected = opt.key === availability;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setAvailability(opt.key)}
                className={`flex-row items-center gap-3 rounded-xl border p-3 ${
                  selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}>
                <View
                  className={`h-4 w-4 items-center justify-center rounded-full border-2 ${
                    selected ? 'border-primary' : 'border-border'
                  }`}>
                  {selected ? <View className="h-2 w-2 rounded-full bg-primary" /> : null}
                </View>
                <Text variant="subhead">{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button onPress={onSave} disabled={updateBooking.isPending}>
        <Text>{updateBooking.isPending ? 'Saving…' : 'Save booking rules'}</Text>
      </Button>
    </ScrollView>
  );
}
