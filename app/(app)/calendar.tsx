import { useActionSheet } from '@expo/react-native-action-sheet';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';

import { Card, DISPLAY, ErrorState, LoadingState, SafeTop, ScreenTitle, SectionLabel } from '@/components/brand';
import { DatePicker } from '@/components/nativewindui/DatePicker';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { Toggle } from '@/components/nativewindui/Toggle';
import { getErrorMessage } from '@/lib/api-client';
import { localeTag } from '@/lib/i18n';
import { useColorScheme } from '@/lib/useColorScheme';
import {
  useCalendarEvents,
  useCreateEvent,
  useDayAvailability,
  useDeleteEvent,
  useUpdateEvent,
} from '@/Modules/calendar/hooks';
import type { CalendarEvent, CalendarView, EventType } from '@/Modules/calendar/types';

const VIEW_KEYS: CalendarView[] = ['month', 'week', 'agenda'];

const TYPE_COLOR: Record<EventType, string> = {
  meeting: '#FF318A',
  booking: '#1A7A3E',
  tentative: '#7D5BFF',
  blocked: '#9A9A9A',
};

const EVENT_TYPES: EventType[] = ['meeting', 'booking', 'tentative', 'blocked'];

const REASONS = ['min_notice', 'blocked_time', 'day_full', 'weekend_full', 'in_the_past'] as const;
type AvailabilityReason = (typeof REASONS)[number];
const isReason = (r: string): r is AvailabilityReason => (REASONS as readonly string[]).includes(r);

// Sunday-first single-letter weekday headers in the UI language (7 Jan 2024 was a Sunday).
const weekdayInitials = () =>
  Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + i).toLocaleDateString(localeTag(), { weekday: 'narrow' }));

const dayKey = (iso: string) => new Date(iso).toDateString();
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const startOfWeek = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - x.getDay());
  return x;
};
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const atHour = (dayString: string, hour: number) => {
  const d = new Date(dayString);
  d.setHours(hour, 0, 0, 0);
  return d;
};

type EditorState = { mode: 'create'; day: string } | { mode: 'edit'; event: CalendarEvent };

export default function CalendarScreen() {
  const router = useRouter();
  const { t } = useTranslation(['calendar', 'common']);
  const { showActionSheetWithOptions } = useActionSheet();
  const [view, setView] = useState<CalendarView>('month');
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date().toDateString());
  const [editor, setEditor] = useState<EditorState | null>(null);

  // Fetch the whole visible grid (leading/trailing days included).
  const range = useMemo(() => {
    const from = startOfWeek(month);
    const to = startOfWeek(new Date(month.getFullYear(), month.getMonth() + 1, 0));
    to.setDate(to.getDate() + 6);
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [month]);

  const { data, isLoading, isError, error, refetch, isRefetching } = useCalendarEvents(range);
  const deleteEvent = useDeleteEvent();
  const events = useMemo(() => data ?? [], [data]);

  const changeMonth = (delta: number) => {
    const next = addMonths(month, delta);
    setMonth(next);
    setSelected(next.toDateString());
  };

  const onPressEvent = (event: CalendarEvent) => {
    if (event.isDerived) {
      if (event.conversationId) {
        router.push(`/(app)/inbox/${event.conversationId}`);
      } else {
        Alert.alert(event.title, t('derivedBody'));
      }
      return;
    }
    const options = [t('common:actions.edit'), t('common:actions.delete'), t('common:actions.cancel')];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: 2, destructiveButtonIndex: 1, title: event.title },
      (index) => {
        if (index === 0) setEditor({ mode: 'edit', event });
        if (index === 1) {
          Alert.alert(t('deleteTitle'), event.title, [
            { text: t('common:actions.cancel'), style: 'cancel' },
            {
              text: t('common:actions.delete'),
              style: 'destructive',
              onPress: () =>
                deleteEvent.mutate(event.id, {
                  onError: (err) => Alert.alert(t('deleteFailed'), getErrorMessage(err)),
                }),
            },
          ]);
        }
      },
    );
  };

  return (
    <View className="flex-1 bg-background">
      <SafeTop />
      <ScreenTitle eyebrow={t('eyebrow')} title={t('title')} />
      <View className="flex-row items-center gap-1.5 px-5 pb-1">
        {VIEW_KEYS.map((key) => {
          const on = key === view;
          return (
            <Pressable
              key={key}
              onPress={() => setView(key)}
              className={`rounded-full px-3.5 py-1.5 ${on ? 'bg-foreground' : 'border border-border'}`}>
              <Text variant="caption1" className={`font-bold ${on ? 'text-background' : 'text-foreground'}`}>
                {t(`views.${key}`)}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setEditor({ mode: 'create', day: selected })}
          className="ml-auto rounded-full bg-primary px-3.5 py-1.5 active:opacity-80">
          <Text variant="caption1" className="font-bold text-white">
            {t('add')}
          </Text>
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between px-5 pt-2">
        <Pressable onPress={() => changeMonth(-1)} className="p-2">
          <Icon name="chevron.left" size={16} color="#661C33" />
        </Pressable>
        <Text variant="subhead" className="font-bold">
          {month.toLocaleDateString(localeTag(), { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable onPress={() => changeMonth(1)} className="p-2">
          <Icon name="chevron.right" size={16} color="#661C33" />
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-8 pt-3"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
          <Legend />
          {view === 'month' ? (
            <MonthView
              month={month}
              events={events}
              selected={selected}
              onSelect={setSelected}
              onPressEvent={onPressEvent}
            />
          ) : null}
          {view === 'week' ? <WeekView events={events} selected={selected} onPressEvent={onPressEvent} /> : null}
          {view === 'agenda' ? <AgendaView events={events} onPressEvent={onPressEvent} /> : null}
        </ScrollView>
      )}

      {editor ? (
        <EventEditor
          event={editor.mode === 'edit' ? editor.event : null}
          day={editor.mode === 'create' ? editor.day : null}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </View>
  );
}

function Legend() {
  const { t } = useTranslation('calendar');
  return (
    <View className="flex-row flex-wrap gap-x-4 gap-y-1.5">
      {EVENT_TYPES.map((type) => (
        <View key={type} className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TYPE_COLOR[type] }} />
          <Text variant="caption2" color="tertiary">
            {t(`types.${type}`)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function groupByDay(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const k = dayKey(e.date);
    map.set(k, [...(map.get(k) ?? []), e]);
  }
  return map;
}

function MonthView({
  month,
  events,
  selected,
  onSelect,
  onPressEvent,
}: {
  month: Date;
  events: CalendarEvent[];
  selected: string;
  onSelect: (day: string) => void;
  onPressEvent: (event: CalendarEvent) => void;
}) {
  const { t } = useTranslation('calendar');
  const todayKey = new Date().toDateString();

  const cells = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const list: (Date | null)[] = [];
    for (let i = 0; i < month.getDay(); i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(new Date(year, m, d));
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [month]);

  const byDay = useMemo(() => groupByDay(events), [events]);
  const selectedEvents = byDay.get(selected) ?? [];

  return (
    <View className="gap-3">
      <Card>
        <View className="mb-1 flex-row">
          {weekdayInitials().map((w, i) => (
            <Text key={i} variant="caption2" className="flex-1 text-center font-bold text-muted-foreground">
              {w}
            </Text>
          ))}
        </View>
        <View className="flex-row flex-wrap">
          {cells.map((date, i) => {
            if (!date) return <View key={i} className="h-11 w-[14.28%]" />;
            const k = date.toDateString();
            const dayEvents = byDay.get(k) ?? [];
            const isToday = k === todayKey;
            const isSelected = k === selected;
            return (
              <Pressable key={i} onPress={() => onSelect(k)} className="h-11 w-[14.28%] items-center justify-center">
                <View className={`h-8 w-8 items-center justify-center rounded-full ${isSelected ? 'bg-foreground' : ''}`}>
                  <Text
                    variant="caption1"
                    className={`${isSelected ? 'text-background' : isToday ? 'text-primary' : 'text-foreground'} ${isToday ? 'font-extrabold' : ''}`}>
                    {date.getDate()}
                  </Text>
                </View>
                <View className="mt-0.5 h-1 flex-row gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <View key={e.id} className="h-1 w-1 rounded-full" style={{ backgroundColor: TYPE_COLOR[e.type] }} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <View>
        <SectionLabel>
          {new Date(selected).toLocaleDateString(localeTag(), { weekday: 'long', day: 'numeric', month: 'short' })}
        </SectionLabel>
        <DayAvailabilityLine day={selected} />
        {selectedEvents.length === 0 ? (
          <Text variant="footnote" color="tertiary" className="mt-2">
            {t('noEvents')}
          </Text>
        ) : (
          <View className="mt-2 gap-2">
            {selectedEvents.map((e) => (
              <EventRow key={e.id} event={e} onPress={() => onPressEvent(e)} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

/** GET /vendor/calendar/availability — what a bride would be told for this date. */
function DayAvailabilityLine({ day }: { day: string }) {
  const { t } = useTranslation('calendar');
  const { data } = useDayAvailability(ymd(new Date(day)));
  if (!data) return null;
  const reasons = data.reasons
    .map((r) => (isReason(r) ? t(`reasons.${r}`) : r.replace(/_/g, ' ')))
    .join(t('reasonSeparator'));
  return (
    <Text variant="caption1" className={data.isAvailable ? 'text-brand-green' : 'text-muted-foreground'}>
      {data.isAvailable ? t('available') : t('unavailable', { reasons: reasons || t('notBookable') })}
      {data.counts
        ? t('counts', { booked: data.counts.confirmedBookings, onHold: data.counts.tentativeHolds })
        : ''}
    </Text>
  );
}

function WeekView({
  events,
  selected,
  onPressEvent,
}: {
  events: CalendarEvent[];
  selected: string;
  onPressEvent: (event: CalendarEvent) => void;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(new Date(selected));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selected]);

  const byDay = useMemo(() => groupByDay(events), [events]);
  const todayKey = new Date().toDateString();

  return (
    <View className="gap-2">
      {days.map((d) => {
        const dayEvents = byDay.get(d.toDateString()) ?? [];
        const isToday = d.toDateString() === todayKey;
        return (
          <View key={d.toISOString()} className="flex-row gap-3">
            <View className="w-12 items-center">
              <Text variant="caption2" color="tertiary" className="uppercase">
                {d.toLocaleDateString(localeTag(), { weekday: 'short' })}
              </Text>
              <Text className={`${DISPLAY} text-lg ${isToday ? 'text-primary' : ''}`}>{d.getDate()}</Text>
            </View>
            <View className="flex-1 gap-2">
              {dayEvents.length === 0 ? (
                <View className="h-px flex-1 self-center bg-border" />
              ) : (
                dayEvents.map((e) => <EventRow key={e.id} event={e} onPress={() => onPressEvent(e)} />)
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function AgendaView({
  events,
  onPressEvent,
}: {
  events: CalendarEvent[];
  onPressEvent: (event: CalendarEvent) => void;
}) {
  const { t } = useTranslation('calendar');
  const groups = useMemo(() => {
    const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return Array.from(groupByDay(sorted).entries());
  }, [events]);

  if (groups.length === 0) {
    return (
      <Text variant="footnote" color="tertiary">
        {t('nothingThisMonth')}
      </Text>
    );
  }

  return (
    <View className="gap-4">
      {groups.map(([day, dayEvents]) => (
        <View key={day}>
          <SectionLabel>
            {new Date(day).toLocaleDateString(localeTag(), { weekday: 'long', day: 'numeric', month: 'short' })}
          </SectionLabel>
          <View className="gap-2">
            {dayEvents.map((e) => (
              <EventRow key={e.id} event={e} onPress={() => onPressEvent(e)} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function EventRow({ event, onPress }: { event: CalendarEvent; onPress: () => void }) {
  const { t } = useTranslation('calendar');
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 active:opacity-80">
      <View className="h-10 w-1 rounded-full" style={{ backgroundColor: TYPE_COLOR[event.type] }} />
      <View className="flex-1">
        <Text variant="footnote" className="font-bold">
          {event.title}
        </Text>
        <Text variant="caption1" color="tertiary" numberOfLines={1}>
          {[event.time, event.isDerived ? t('fromConversation') : null, event.notes].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${TYPE_COLOR[event.type]}20` }}>
        <Text variant="caption2" className="font-bold" style={{ color: TYPE_COLOR[event.type] }}>
          {t(`types.${event.type}`)}
        </Text>
      </View>
    </Pressable>
  );
}

/** Create or edit a studio-owned event. `kind` can't be changed after creation (PATCH has no kind). */
function EventEditor({
  event,
  day,
  onClose,
}: {
  event: CalendarEvent | null;
  day: string | null;
  onClose: () => void;
}) {
  const { colors } = useColorScheme();
  const { t } = useTranslation('calendar');
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const baseDay = day ?? new Date().toDateString();

  const [type, setType] = useState<EventType>(event?.type ?? 'meeting');
  const [title, setTitle] = useState(event?.title ?? '');
  const [startsAt, setStartsAt] = useState(() => (event ? new Date(event.startsAt) : atHour(baseDay, 10)));
  const [hasEnd, setHasEnd] = useState(!!event?.endsAt);
  const [endsAt, setEndsAt] = useState(() => (event?.endsAt ? new Date(event.endsAt) : atHour(baseDay, 11)));
  const [notes, setNotes] = useState(event?.notes ?? '');

  const endOk = !hasEnd || endsAt.getTime() > startsAt.getTime();
  const canSave = title.trim().length > 0 && endOk && !createEvent.isPending && !updateEvent.isPending;

  const onSave = () => {
    const onError = (err: unknown) => Alert.alert(t('saveFailed'), getErrorMessage(err));
    if (event) {
      updateEvent.mutate(
        {
          id: event.id,
          input: {
            title: title.trim(),
            startsAt: startsAt.toISOString(),
            endsAt: hasEnd ? endsAt.toISOString() : null,
            notes: notes.trim() || null,
          },
        },
        { onSuccess: onClose, onError },
      );
    } else {
      createEvent.mutate(
        {
          type,
          title: title.trim(),
          startsAt: startsAt.toISOString(),
          ...(hasEnd ? { endsAt: endsAt.toISOString() } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
        { onSuccess: onClose, onError },
      );
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
        <Pressable onPress={() => {}} className="max-h-[90%] rounded-t-3xl bg-background px-5 pb-8 pt-4">
          <ScrollView contentContainerClassName="gap-3" showsVerticalScrollIndicator={false}>
            <View className="mb-1 h-1 w-10 self-center rounded-full bg-muted" />
            <Text className={`${DISPLAY} text-2xl`}>{event ? t('editTitle') : t('newTitle')}</Text>

            {!event ? (
              <View className="flex-row flex-wrap gap-2">
                {EVENT_TYPES.map((option) => {
                  const on = option === type;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setType(option)}
                      className="rounded-full px-3.5 py-2"
                      style={{ backgroundColor: on ? TYPE_COLOR[option] : `${TYPE_COLOR[option]}20` }}>
                      <Text variant="caption1" className="font-bold" style={{ color: on ? '#fff' : TYPE_COLOR[option] }}>
                        {t(`types.${option}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <TextInput
              value={title}
              onChangeText={(v) => setTitle(v.slice(0, 200))}
              placeholder={t('titlePlaceholder')}
              placeholderTextColor={colors.grey}
              className="rounded-xl bg-muted px-4 py-3.5 text-foreground"
            />

            <Text variant="caption2" className="font-extrabold uppercase tracking-wide text-muted-foreground">
              {t('starts')}
            </Text>
            <DatePicker
              value={startsAt}
              mode="datetime"
              onChange={(_e, d) => {
                if (d) setStartsAt(d);
              }}
            />

            <View className="flex-row items-center justify-between">
              <Text variant="footnote">{t('setEnd')}</Text>
              <Toggle value={hasEnd} onValueChange={setHasEnd} />
            </View>
            {hasEnd ? (
              <DatePicker
                value={endsAt}
                mode="datetime"
                onChange={(_e, d) => {
                  if (d) setEndsAt(d);
                }}
              />
            ) : null}
            {!endOk ? (
              <Text variant="caption1" className="text-destructive">
                {t('endAfterStart')}
              </Text>
            ) : null}

            <TextInput
              value={notes}
              onChangeText={(v) => setNotes(v.slice(0, 2000))}
              placeholder={t('notesPlaceholder')}
              placeholderTextColor={colors.grey}
              multiline
              className="max-h-32 min-h-16 rounded-xl bg-muted px-4 py-3 text-foreground"
            />

            <Pressable
              onPress={onSave}
              disabled={!canSave}
              className={`items-center rounded-2xl bg-primary py-4 ${canSave ? 'active:opacity-80' : 'opacity-50'}`}>
              <Text className="font-bold text-white">
                {createEvent.isPending || updateEvent.isPending ? t('saving') : event ? t('saveChanges') : t('addEvent')}
              </Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
