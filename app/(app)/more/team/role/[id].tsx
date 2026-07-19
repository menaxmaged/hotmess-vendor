import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { Toggle } from '@/components/nativewindui/Toggle';
import { getErrorMessage } from '@/lib/api-client';
import { useColorScheme } from '@/lib/useColorScheme';
import { useCreateRole, useDeleteRole, useTeamOverview, useUpdateRole } from '@/Modules/team/hooks';
import { DEFAULT_PERMISSIONS } from '@/Modules/team/types';
import type { CalendarAccess, InboxAccess, Role, RolePermissions } from '@/Modules/team/types';

export default function RoleEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const { data, isLoading } = useTeamOverview();
  const existingRole = !isNew ? data?.roles.find((r) => r.id === id) : undefined;

  if (!isNew && isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!isNew && !existingRole) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text color="tertiary">Role not found.</Text>
      </View>
    );
  }

  return <RoleForm roleId={isNew ? null : (id as string)} initialRole={existingRole ?? null} />;
}

function RoleForm({ roleId, initialRole }: { roleId: string | null; initialRole: Role | null }) {
  const router = useRouter();
  const isNew = roleId === null;

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [name, setName] = useState(initialRole?.name ?? '');
  const [permissions, setPermissions] = useState<RolePermissions>(
    initialRole?.permissions ?? DEFAULT_PERMISSIONS,
  );
  const [error, setError] = useState<string | null>(null);

  const setPerm = <K extends keyof RolePermissions>(key: K, value: RolePermissions[K]) => {
    setPermissions((prev) => ({ ...prev, [key]: value }));
  };

  const isSaving = createRole.isPending || updateRole.isPending;

  const onSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Give this role a name.');
      return;
    }
    try {
      if (isNew) {
        await createRole.mutateAsync({ name: name.trim(), permissions });
      } else {
        await updateRole.mutateAsync({ roleId, name: name.trim(), permissions });
      }
      router.back();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const onDelete = () => {
    if (!roleId) return;
    Alert.alert('Delete role', `Delete "${initialRole?.name}"? Members will need to be reassigned.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRole.mutateAsync(roleId);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 p-4">
      <Stack.Screen options={{ title: isNew ? 'New Role' : initialRole?.name }} />

      <View className="gap-1.5">
        <Text variant="caption1" color="tertiary">
          ROLE NAME
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sales"
          className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
        />
      </View>

      <PermissionGroup title="Inbox">
        <SegmentedChoice<InboxAccess>
          value={permissions.inbox}
          options={[
            { key: 'all_chats', label: 'All chats' },
            { key: 'assigned_only', label: 'Assigned chats only' },
          ]}
          onChange={(v) => setPerm('inbox', v)}
        />
      </PermissionGroup>

      <PermissionGroup title="Calendar">
        <SegmentedChoice<CalendarAccess>
          value={permissions.calendar}
          options={[
            { key: 'full_access', label: 'Full access' },
            { key: 'view_only', label: 'View only' },
          ]}
          onChange={(v) => setPerm('calendar', v)}
        />
      </PermissionGroup>

      <PermissionGroup title="Finance">
        <ToggleRow
          label="Quotes create/edit"
          value={permissions.financeQuotesCreateEdit}
          onChange={(v) => setPerm('financeQuotesCreateEdit', v)}
        />
        <ToggleRow
          label="Payments view"
          value={permissions.financePaymentsView}
          onChange={(v) => setPerm('financePaymentsView', v)}
        />
        <ToggleRow
          label="Payments edit"
          value={permissions.financePaymentsEdit}
          onChange={(v) => setPerm('financePaymentsEdit', v)}
        />
        <ToggleRow
          label="Full finance access"
          value={permissions.financeFullAccess}
          onChange={(v) => setPerm('financeFullAccess', v)}
          last
        />
      </PermissionGroup>

      <PermissionGroup title="Studio">
        <ToggleRow
          label="Profile edit"
          value={permissions.studioProfileEdit}
          onChange={(v) => setPerm('studioProfileEdit', v)}
        />
        <ToggleRow
          label="Automation edit"
          value={permissions.studioAutomationEdit}
          onChange={(v) => setPerm('studioAutomationEdit', v)}
          last
        />
      </PermissionGroup>

      <PermissionGroup title="Growth">
        <ToggleRow
          label="Ads access"
          value={permissions.growthAdsAccess}
          onChange={(v) => setPerm('growthAdsAccess', v)}
        />
        <ToggleRow
          label="Analytics access"
          value={permissions.growthAnalyticsAccess}
          onChange={(v) => setPerm('growthAnalyticsAccess', v)}
          last
        />
      </PermissionGroup>

      <PermissionGroup title="Admin">
        <ToggleRow
          label="Team management"
          value={permissions.adminTeamManagement}
          onChange={(v) => setPerm('adminTeamManagement', v)}
          last
        />
      </PermissionGroup>

      {error ? (
        <Text variant="footnote" className="text-destructive">
          {error}
        </Text>
      ) : null}

      <Button onPress={onSave} disabled={isSaving}>
        <Text>{isSaving ? 'Saving…' : 'Save role'}</Text>
      </Button>

      {!isNew && !initialRole?.isBuiltIn ? (
        <Pressable onPress={onDelete} className="items-center py-2">
          <Text variant="footnote" className="text-destructive">
            Delete role
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function PermissionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text variant="caption2" color="tertiary" className="px-1">
        {title.toUpperCase()}
      </Text>
      <View className="overflow-hidden rounded-xl border border-border bg-card">{children}</View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  last,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between p-4 ${last ? '' : 'border-b border-border'}`}>
      <Text variant="subhead">{label}</Text>
      <Toggle value={value} onValueChange={onChange} />
    </View>
  );
}

function SegmentedChoice<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const { colors } = useColorScheme();
  return (
    <View className="flex-row flex-wrap gap-2 p-3">
      {options.map((opt) => {
        const selected = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            className={`rounded-full border px-3 py-1.5 ${
              selected ? 'border-primary bg-primary' : 'border-border'
            }`}>
            <Text
              variant="caption1"
              style={selected ? undefined : { color: colors.foreground }}
              className={selected ? 'font-medium text-white' : 'font-medium'}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
