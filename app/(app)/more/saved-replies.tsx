import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Button } from '@/components/nativewindui/Button';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { useColorScheme } from '@/lib/useColorScheme';
import { useCreateSavedReply, useDeleteSavedReply, useSavedReplies } from '@/Modules/saved-replies/hooks';
import { useSubscription } from '@/Modules/subscription/hooks';

export default function SavedRepliesScreen() {
  const { colors } = useColorScheme();
  const { t } = useTranslation(['studio', 'common']);
  const { data: sub } = useSubscription();
  const isPremium = sub?.isPremium ?? false;

  const { data: replies, isLoading, isError, error } = useSavedReplies(isPremium);
  const createReply = useCreateSavedReply();
  const deleteReply = useDeleteSavedReply();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const onCreate = () => {
    if (!title.trim() || !body.trim()) return;
    createReply.mutate(
      { title: title.trim(), body: body.trim() },
      {
        onSuccess: () => {
          setTitle('');
          setBody('');
        },
        onError: (err) => Alert.alert(t('saveFailed'), getErrorMessage(err)),
      },
    );
  };

  const onDelete = (id: string, replyTitle: string) => {
    Alert.alert(t('savedReplies.deleteTitle'), t('savedReplies.deleteBody', { title: replyTitle }), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      { text: t('common:actions.delete'), style: 'destructive', onPress: () => deleteReply.mutate(id) },
    ]);
  };

  if (!isPremium) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background p-6">
        <Icon name="lock.fill" size={24} color={colors.grey} />
        <Text variant="subhead" className="text-center font-medium">
          {t('savedReplies.lockedTitle')}
        </Text>
        <Text variant="footnote" color="tertiary" className="text-center">
          {t('savedReplies.lockedBody')}
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text color="tertiary">{getErrorMessage(error)}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4">
      <View className="overflow-hidden rounded-xl border border-border bg-card">
        {(replies ?? []).length === 0 ? (
          <Text variant="footnote" color="tertiary" className="p-4">
            {t('savedReplies.empty')}
          </Text>
        ) : (
          (replies ?? []).map((reply, index) => (
            <View
              key={reply.id}
              className={`flex-row items-start gap-3 p-4 ${
                index < (replies?.length ?? 0) - 1 ? 'border-b border-border' : ''
              }`}>
              <View className="flex-1">
                <Text variant="subhead" className="font-medium">
                  {reply.title}
                </Text>
                <Text variant="caption1" color="tertiary" numberOfLines={2}>
                  {reply.body}
                </Text>
              </View>
              <Pressable onPress={() => onDelete(reply.id, reply.title)} className="p-1">
                <Icon name="trash.fill" size={16} color={colors.grey} />
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View className="gap-2 rounded-xl border border-border bg-card p-4">
        <Text variant="caption1" color="tertiary" className="font-bold">
          {t('savedReplies.newTitle')}
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('savedReplies.titlePlaceholder')}
          placeholderTextColor={colors.grey}
          className="rounded-lg border border-border px-3 py-2.5 text-foreground"
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={t('savedReplies.bodyPlaceholder')}
          placeholderTextColor={colors.grey}
          multiline
          className="min-h-20 rounded-lg border border-border px-3 py-2.5 text-foreground"
          style={{ textAlignVertical: 'top' }}
        />
        <Button onPress={onCreate} disabled={!title.trim() || !body.trim() || createReply.isPending}>
          <Text>{createReply.isPending ? t('saving') : t('savedReplies.add')}</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
