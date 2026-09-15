import { useActionSheet } from '@expo/react-native-action-sheet';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { InitialsAvatar } from '@/components/InitialsAvatar';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { useColorScheme } from '@/lib/useColorScheme';
import { useRoles } from '@/Modules/roles/hooks';
import type { Role } from '@/Modules/roles/types';
import { useRemoveMember, useRevokeInvite, useTeamOverview, useUpdateMemberRole } from '@/Modules/team/hooks';
import type { TeamMember } from '@/Modules/team/types';

export default function TeamOverviewScreen() {
  const router = useRouter();
  const { t } = useTranslation(['studio', 'common']);
  const { colors } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const { data, isLoading, isError, error, refetch } = useTeamOverview();
  const { data: roles } = useRoles();
  const removeMember = useRemoveMember();
  const revokeInvite = useRevokeInvite();
  const updateMemberRole = useUpdateMemberRole();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background p-6">
        <Text color="tertiary" className="text-center">
          {getErrorMessage(error)}
        </Text>
        <Pressable onPress={() => refetch()}>
          <Text className="text-primary">{t('common:actions.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  const { members, seatLimits } = data;
  const seatsUsed = seatLimits.seated + seatLimits.liveInvites;
  const seatsFull = seatLimits.max != null && seatsUsed >= seatLimits.max;
  const canInvite = !seatsFull;

  const openMemberSheet = (member: TeamMember) => {
    if (member.status === 'pending') {
      showActionSheetWithOptions(
        { options: [t('team.cancelInvite'), t('team.dismiss')], cancelButtonIndex: 1, destructiveButtonIndex: 0 },
        (index) => {
          if (index === 0) revokeInvite.mutate(member.id);
        },
      );
      return;
    }

    if (member.isOwner) return;

    const assignableRoles = (roles ?? []).filter((r) => r.id !== member.roleId);
    const options = [...assignableRoles.map((r) => t('team.changeRole', { role: r.name })), t('team.remove'), t('team.dismiss')];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: options.length - 2 },
      (index) => {
        if (index === undefined) return;
        if (index < assignableRoles.length) {
          updateMemberRole.mutate({ memberId: member.id, roleId: assignableRoles[index]!.id });
        } else if (index === assignableRoles.length) {
          removeMember.mutate(member.id);
        }
      },
    );
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 p-4">
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/(app)/more/team/invite')}
              disabled={!canInvite}
              className="p-2">
              <Icon
                name="person.badge.plus"
                color={canInvite ? colors.primary : colors.grey}
              />
            </Pressable>
          ),
        }}
      />

      <View className="gap-2 rounded-xl border border-border bg-card p-4">
        <View className="flex-row items-center justify-between">
          <Text variant="subhead" className="font-semibold">
            {seatLimits.max != null
              ? t('team.seatsOf', { used: seatsUsed, max: seatLimits.max })
              : t('team.seats', { used: seatsUsed })}
          </Text>
        </View>
        {seatLimits.max != null ? (
          // Plain bar: ProgressIndicator's reanimated %-width never painted on web.
          <View className="h-1.5 overflow-hidden rounded-full bg-muted">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, (seatsUsed / Math.max(1, seatLimits.max)) * 100)}%` }}
            />
          </View>
        ) : null}
      </View>

      {seatsFull ? (
        <Pressable
          onPress={() => router.push('/(app)/more/premium')}
          className="gap-1 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <Text variant="footnote" className="font-medium text-amber-800 dark:text-amber-300">
            {t('team.noSeats')}
          </Text>
          <Text variant="caption1" className="text-amber-700 dark:text-amber-400">
            {t('team.noSeatsBody')}
          </Text>
        </Pressable>
      ) : null}

      <View className="gap-2">
        <Text variant="caption2" color="tertiary" className="px-1">
          {t('team.members')}
        </Text>
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          {members.map((member, index) => (
            <Pressable
              key={member.id}
              onPress={() => openMemberSheet(member)}
              className={`flex-row items-center gap-3 p-4 ${
                index < members.length - 1 ? 'border-b border-border' : ''
              }`}>
              <InitialsAvatar name={member.name} size={36} />
              <View className="flex-1">
                <Text variant="subhead" className="font-medium" numberOfLines={1}>
                  {member.name}
                </Text>
                <Text variant="caption1" color="tertiary" numberOfLines={1}>
                  {member.roleName ?? t('team.noRole')}
                </Text>
              </View>
              {member.status === 'pending' ? (
                <View className="rounded-full bg-muted px-2 py-0.5">
                  <Text variant="caption2" className="font-medium text-muted-foreground">
                    {t('team.pending')}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between px-1">
          <Text variant="caption2" color="tertiary">
            {t('team.roles')}
          </Text>
          <Pressable onPress={() => router.push('/(app)/more/team/role/new')}>
            <Text variant="caption1" className="text-primary">
              {t('team.newRole')}
            </Text>
          </Pressable>
        </View>
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          {(roles ?? []).map((role, index) => (
            <RoleRow
              key={role.id}
              role={role}
              last={index === (roles ?? []).length - 1}
              onPress={() => router.push(`/(app)/more/team/role/${role.id}`)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function RoleRow({ role, last, onPress }: { role: Role; last: boolean; onPress: () => void }) {
  const { t } = useTranslation('studio');
  const { colors } = useColorScheme();
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 p-4 ${last ? '' : 'border-b border-border'}`}>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text variant="subhead" className="font-medium">
            {role.name}
          </Text>
          {role.isBuiltIn ? (
            <View className="rounded-full bg-muted px-2 py-0.5">
              <Text variant="caption2" className="text-muted-foreground">
                {t('team.builtIn')}
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="caption1" color="tertiary">
          {t('team.memberCount', { count: role.memberCount })}
        </Text>
      </View>
      <Icon name="chevron.right" size={14} color={colors.grey} />
    </Pressable>
  );
}
