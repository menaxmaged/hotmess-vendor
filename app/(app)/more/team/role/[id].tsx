import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { Toggle } from '@/components/nativewindui/Toggle';
import { getErrorMessage } from '@/lib/api-client';
import { useColorScheme } from '@/lib/useColorScheme';
import { useCreateRole, useDeleteRole, useRoles, useUpdateRole } from '@/Modules/roles/hooks';
import { DEFAULT_PERMISSIONS } from '@/Modules/roles/types';
import type {
    CalendarAccess,
    FinanceAccess,
    GrowthPermission,
    InboxAccess,
    Role,
    RolePermissions,
    StudioPermission,
} from '@/Modules/roles/types';

export default function RoleEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation('studio');
  const isNew = id === 'new';

  const { data: roles, isLoading } = useRoles();
  const existingRole = !isNew ? roles?.find((r) => r.id === id) : undefined;

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
        <Text color="tertiary">{t('role.notFound')}</Text>
      </View>
    );
  }

  return <RoleForm roleId={isNew ? null : (id as string)} initialRole={existingRole ?? null} />;
}

function RoleForm({ roleId, initialRole }: { roleId: string | null; initialRole: Role | null }) {
  const router = useRouter();
  const { t } = useTranslation(['studio', 'common']);
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

  const toggleListPerm = <T extends string>(key: 'studio' | 'growth', value: T) => {
    setPermissions((prev) => {
      const list = prev[key] as T[];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  };

  const isSaving = createRole.isPending || updateRole.isPending;
  const isBuiltIn = initialRole?.isBuiltIn ?? false;

  const onSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError(t('role.nameRequired'));
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
    Alert.alert(t('role.deleteTitle'), t('role.deleteBody', { name: initialRole?.name ?? '' }), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      {
        text: t('common:actions.delete'),
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
      <Stack.Screen options={{ title: isNew ? t('role.newTitle') : initialRole?.name }} />

      <View className="gap-1.5">
        <Text variant="caption1" color="tertiary">
          {t('role.name')}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          editable={!isBuiltIn}
          placeholder={t('role.namePlaceholder')}
          className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
        />
        {isBuiltIn ? (
          <Text variant="caption2" color="tertiary">
            {t('role.builtInNote')}
          </Text>
        ) : null}
      </View>

      <PermissionGroup title={t('role.groups.inbox')}>
        <SegmentedChoice<InboxAccess>
          value={permissions.inbox}
          disabled={isBuiltIn}
          options={[
            { key: 'none', label: t('role.access.none') },
            { key: 'assigned', label: t('role.access.assigned') },
            { key: 'all', label: t('role.access.all') },
          ]}
          onChange={(v) => setPerm('inbox', v)}
        />
      </PermissionGroup>

      <PermissionGroup title={t('role.groups.calendar')}>
        <SegmentedChoice<CalendarAccess>
          value={permissions.calendar}
          disabled={isBuiltIn}
          options={[
            { key: 'none', label: t('role.access.none') },
            { key: 'view', label: t('role.access.view') },
            { key: 'full', label: t('role.access.full') },
          ]}
          onChange={(v) => setPerm('calendar', v)}
        />
      </PermissionGroup>

      <PermissionGroup title={t('role.groups.finance')}>
        <SegmentedChoice<FinanceAccess>
          value={permissions.finance}
          disabled={isBuiltIn}
          options={[
            { key: 'none', label: t('role.access.none') },
            { key: 'quotes', label: t('role.access.quotes') },
            { key: 'payments_view', label: t('role.access.payments_view') },
            { key: 'payments_edit', label: t('role.access.payments_edit') },
            { key: 'full', label: t('role.access.full') },
          ]}
          onChange={(v) => setPerm('finance', v)}
        />
      </PermissionGroup>

      <PermissionGroup title={t('role.groups.studio')}>
        <ToggleRow
          label={t('role.perms.profileEdit')}
          value={permissions.studio.includes('profile_edit')}
          disabled={isBuiltIn}
          onChange={() => toggleListPerm<StudioPermission>('studio', 'profile_edit')}
        />
        <ToggleRow
          label={t('role.perms.automationEdit')}
          value={permissions.studio.includes('automation_edit')}
          disabled={isBuiltIn}
          onChange={() => toggleListPerm<StudioPermission>('studio', 'automation_edit')}
          last
        />
      </PermissionGroup>

      <PermissionGroup title={t('role.groups.growth')}>
        <ToggleRow
          label={t('role.perms.ads')}
          value={permissions.growth.includes('ads')}
          disabled={isBuiltIn}
          onChange={() => toggleListPerm<GrowthPermission>('growth', 'ads')}
        />
        <ToggleRow
          label={t('role.perms.analytics')}
          value={permissions.growth.includes('analytics')}
          disabled={isBuiltIn}
          onChange={() => toggleListPerm<GrowthPermission>('growth', 'analytics')}
          last
        />
      </PermissionGroup>

      <PermissionGroup title={t('role.groups.admin')}>
        <ToggleRow
          label={t('role.perms.team')}
          value={permissions.admin}
          disabled={isBuiltIn}
          onChange={(v) => setPerm('admin', v)}
          last
        />
      </PermissionGroup>

      {error ? (
        <Text variant="footnote" className="text-destructive">
          {error}
        </Text>
      ) : null}

      {!isBuiltIn ? (
        <Button onPress={onSave} disabled={isSaving}>
          <Text>{isSaving ? t('saving') : t('role.save')}</Text>
        </Button>
      ) : null}

      {!isNew && !isBuiltIn ? (
        <Pressable onPress={onDelete} className="items-center py-2">
          <Text variant="footnote" className="text-destructive">
            {t('role.delete')}
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
  disabled,
  last,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between p-4 ${last ? '' : 'border-b border-border'}`}>
      <Text variant="subhead">{label}</Text>
      <Toggle value={value} onValueChange={onChange} disabled={disabled} />
    </View>
  );
}

function SegmentedChoice<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const { colors } = useColorScheme();
  return (
    <View className="flex-row flex-wrap gap-2 p-3">
      {options.map((opt) => {
        const selected = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => !disabled && onChange(opt.key)}
            disabled={disabled}
            className={`rounded-full border px-3 py-1.5 ${
              selected ? 'border-primary bg-primary' : 'border-border'
            } ${disabled ? 'opacity-50' : ''}`}>
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
