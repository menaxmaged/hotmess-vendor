import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Card, DISPLAY, ErrorState, LoadingState, ScreenTitle, SectionLabel } from '@/components/brand';
import { Text } from '@/components/nativewindui/Text';
import { useCalendarEvents } from '@/Modules/calendar/hooks';
import type { CalendarEvent, CalendarView, EventType } from '@/Modules/calendar/types';
import { getErrorMessage } from '@/lib/api-client';

const VIEWS: { key: CalendarView; label: string }[] = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'agenda', label: 'Agenda' },
];

const TYPE_COLOR: Record<EventType, string> = {
  meeting: '#FF318A',
  booking: '#1A7A3E',
  tentative: '#7D5BFF',
  blocked: '#9A9A9A',
};

const TYPE_LABEL: Record<EventType, string> = {
  meeting: 'Meeting',
  booking: 'Booking',
  tentative: 'Tentative',
  blocked: 'Blocked',
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

export default function CalendarScreen() {
  const [view, setView] = useState<CalendarView>('month');
  const { data, isLoading, isError, error, refetch } = useCalendarEvents();

  const events = data ?? [];

  return (
    <View className="flex-1 bg-background">
      <ScreenTitle eyebrow="Schedule" title="calendar." />
      <View className="flex-row gap-1.5 px-5 pb-1">
        {VIEWS.map((v) => {
          const on = v.key === view;
          return (
            <Pressable
              key={v.key}
              onPress={() => setView(v.key)}
              className={`rounded-full px-3.5 py-1.5 ${on ? 'bg-foreground' : 'border border-border'}`}>
              <Text variant="caption1" className={`font-bold ${on ? 'text-background' : 'text-foreground'}`}>
                {v.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-8 pt-3"
          showsVerticalScrollIndicator={false}>
          <Legend />
          {view === 'month' ? <MonthView events={events} /> : null}
          {view === 'week' ? <WeekView events={events} /> : null}
          {view === 'agenda' ? <AgendaView events={events} /> : null}
        </ScrollView>
      )}
    </View>
  );
}

function Legend() {
  return (
    <View className="flex-row flex-wrap gap-x-4 gap-y-1.5">
      {(Object.keys(TYPE_COLOR) as EventType[]).map((t) => (
        <View key={t} className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TYPE_COLOR[t] }} />
          <Text variant="caption2" color="tertiary">
            {TYPE_LABEL[t]}
          </Text>
        </View>
      ))}
    </View>
  );
}

function MonthView({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [selected, setSelected] = useState<string>(today.toDateString());

  const { cells, monthLabel } = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = first.getDay();
    const list: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(new Date(year, month, d));
    while (list.length % 7 !== 0) list.push(null);
    return {
      cells: list,
      monthLabel: first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }, [today]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const k = dayKey(e.date);
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return map;
  }, [events]);

  const selectedEvents = byDay.get(selected) ?? [];

  return (
    <View className="gap-3">
      <Text variant="subhead" className="font-bold">
        {monthLabel}
      </Text>
      <Card>
        <View className="mb-1 flex-row">
          {WEEKDAYS.map((w, i) => (
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
            const isToday = k === today.toDateString();
            const isSelected = k === selected;
            return (
              <Pressable key={i} onPress={() => setSelected(k)} className="h-11 w-[14.28%] items-center justify-center">
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
        <SectionLabel>{new Date(selected).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}</SectionLabel>
        {selectedEvents.length === 0 ? (
          <Text variant="footnote" color="tertiary">
            No events this day.
          </Text>
        ) : (
          <View className="gap-2">
            {selectedEvents.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function WeekView({ events }: { events: CalendarEvent[] }) {
  const start = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, []);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  }), [start]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const k = dayKey(e.date);
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return map;
  }, [events]);

  return (
    <View className="gap-2">
      {days.map((d) => {
        const dayEvents = byDay.get(d.toDateString()) ?? [];
        const isToday = d.toDateString() === new Date().toDateString();
        return (
          <View key={d.toISOString()} className="flex-row gap-3">
            <View className="w-12 items-center">
              <Text variant="caption2" color="tertiary" className="uppercase">
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text className={`${DISPLAY} text-lg ${isToday ? 'text-primary' : ''}`}>{d.getDate()}</Text>
            </View>
            <View className="flex-1 gap-2">
              {dayEvents.length === 0 ? (
                <View className="h-px flex-1 self-center bg-border" />
              ) : (
                dayEvents.map((e) => <EventRow key={e.id} event={e} />)
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function AgendaView({ events }: { events: CalendarEvent[] }) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events],
  );

  const groups = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of sorted) {
      const k = dayKey(e.date);
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return Array.from(map.entries());
  }, [sorted]);

  return (
    <View className="gap-4">
      {groups.map(([day, dayEvents]) => (
        <View key={day}>
          <SectionLabel>
            {new Date(day).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
          </SectionLabel>
          <View className="gap-2">
            {dayEvents.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3">
      <View className="h-10 w-1 rounded-full" style={{ backgroundColor: TYPE_COLOR[event.type] }} />
      <View className="flex-1">
        <Text variant="footnote" className="font-bold">
          {event.title}
        </Text>
        <Text variant="caption1" color="tertiary">
          {[event.time, event.brideName, event.city].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${TYPE_COLOR[event.type]}20` }}>
        <Text variant="caption2" className="font-bold" style={{ color: TYPE_COLOR[event.type] }}>
          {TYPE_LABEL[event.type]}
        </Text>
      </View>
    </View>
  );
}
