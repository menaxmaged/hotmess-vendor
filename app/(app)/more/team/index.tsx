import { useActionSheet } from '@expo/react-native-action-sheet';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { InitialsAvatar } from '@/components/InitialsAvatar';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Icon } from '@/components/nativewindui/Icon';
import { ProgressIndicator } from '@/components/nativewindui/ProgressIndicator';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { useColorScheme } from '@/lib/useColorScheme';
import { useRemoveMember, useTeamOverview, useUpdateMemberRole } from '@/Modules/team/hooks';
import type { Role, TeamMember } from '@/Modules/team/types';

export default function TeamOverviewScreen() {
  const router = useRouter();
  const { colors } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const { data, isLoading, isError, error, refetch } = useTeamOverview();
  const removeMember = useRemoveMember();
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
          <Text className="text-primary">Try again</Text>
        </Pressable>
      </View>
    );
  }

  const { members, roles, seatLimits } = data;
  const isFree = seatLimits.plan === 'free';
  const seatsFull = seatLimits.used >= seatLimits.total;
  const canInvite = !isFree && !seatsFull;

  const openMemberSheet = (member: TeamMember) => {
    if (member.status === 'pending') {
      showActionSheetWithOptions(
        { options: ['Cancel invite', 'Dismiss'], cancelButtonIndex: 1, destructiveButtonIndex: 0 },
        (index) => {
          if (index === 0) removeMember.mutate(member.id);
        },
      );
      return;
    }

    const assignableRoles = roles.filter((r) => r.id !== member.roleId);
    const options = [...assignableRoles.map((r) => `Change role to ${r.name}`), 'Remove from team', 'Dismiss'];
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
            {`${seatLimits.used} of ${seatLimits.total} seats used`}
          </Text>
          <Text variant="caption1" color="tertiary" className="capitalize">
            {seatLimits.plan}
          </Text>
        </View>
        <ProgressIndicator value={seatLimits.used} max={seatLimits.total} />
      </View>

      {isFree ? (
        <Pressable
          onPress={() => router.push('/(app)/more/premium')}
          className="gap-1 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <Text variant="footnote" className="font-medium text-amber-800 dark:text-amber-300">
            Upgrade to Premium
          </Text>
          <Text variant="caption1" className="text-amber-700 dark:text-amber-400">
            Invite up to 10 team members and create unlimited custom roles.
          </Text>
        </Pressable>
      ) : null}

      <View className="gap-2">
        <Text variant="caption2" color="tertiary" className="px-1">
          MEMBERS
        </Text>
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          {members.map((member, index) => (
            <Pressable
              key={member.id}
              onPress={() => openMemberSheet(member)}
              className={`flex-row items-center gap-3 p-4 ${
                index < members.length - 1 ? 'border-b border-border' : ''
              }`}>
              <View>
                <InitialsAvatar name={member.name} size={36} />
                {member.status === 'active' ? (
                  <View
                    className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${
                      member.online ? 'bg-green-500' : 'bg-neutral-400'
                    }`}
                  />
                ) : null}
              </View>
              <View className="flex-1">
                <Text variant="subhead" className="font-medium" numberOfLines={1}>
                  {member.name}
                </Text>
                <Text variant="caption1" color="tertiary" numberOfLines={1}>
                  {member.roleName}
                </Text>
              </View>
              {member.status === 'pending' ? (
                <View className="rounded-full bg-muted px-2 py-0.5">
                  <Text variant="caption2" className="font-medium text-muted-foreground">
                    Pending
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
            ROLES
          </Text>
          <Pressable
            onPress={() => router.push('/(app)/more/team/role/new')}
            disabled={!seatLimits.customRolesAllowed}>
            <Text
              variant="caption1"
              className={seatLimits.customRolesAllowed ? 'text-primary' : 'text-muted-foreground'}>
              New role
            </Text>
          </Pressable>
        </View>
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          {roles.map((role, index) => (
            <RoleRow
              key={role.id}
              role={role}
              last={index === roles.length - 1}
              onPress={() => router.push(`/(app)/more/team/role/${role.id}`)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function RoleRow({ role, last, onPress }: { role: Role; last: boolean; onPress: () => void }) {
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
                Built-in
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="caption1" color="tertiary">
          {`${role.memberCount} ${role.memberCount === 1 ? 'member' : 'members'}`}
        </Text>
      </View>
      <Icon name="chevron.right" size={14} color={colors.grey} />
    </Pressable>
  );
}
