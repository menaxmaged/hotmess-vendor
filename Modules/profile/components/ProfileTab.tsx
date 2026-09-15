import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';

import { CircularProgress } from '@/components/CircularProgress';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Button } from '@/components/nativewindui/Button';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { useColorScheme } from '@/lib/useColorScheme';
import { useProfilePreview, useUpdateProfileCore, useUploadCoverImage } from '@/Modules/profile/hooks';
import type { ProfileCore } from '@/Modules/profile/types';
import { FieldLabel } from './FieldLabel';

export function ProfileTab({ initial }: { initial: ProfileCore }) {
  const { colors } = useColorScheme();
  const { t } = useTranslation('studio');
  const updateCore = useUpdateProfileCore();
  const uploadCoverImage = useUploadCoverImage();

  const [tagline, setTagline] = useState(initial.tagline);
  const [bio, setBio] = useState(initial.bio);
  const [startingPrice, setStartingPrice] = useState(initial.startingPrice?.toString() ?? '');
  const [previewOpen, setPreviewOpen] = useState(false);

  const onPickCoverImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    uploadCoverImage.mutate(
      {
        uri: asset.uri,
        name: asset.fileName ?? 'cover.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      },
      { onError: (err) => Alert.alert(t('profile.uploadFailed'), getErrorMessage(err)) },
    );
  };

  const onSave = () => {
    updateCore.mutate(
      {
        tagline,
        bio,
        startingPrice: startingPrice ? Number(startingPrice) : null,
      },
      {
        onSuccess: () => Alert.alert(t('profile.saved')),
        onError: (err) => Alert.alert(t('saveFailed'), getErrorMessage(err)),
      },
    );
  };

  return (
    <ScrollView contentContainerClassName="gap-5 p-4">
      <Pressable onPress={onPickCoverImage} className="overflow-hidden rounded-xl bg-muted">
        {initial.coverImageUrl ? (
          <Image source={{ uri: initial.coverImageUrl }} className="h-40 w-full" />
        ) : (
          <View className="h-40 w-full items-center justify-center">
            <Icon name="photo.fill" size={28} color={colors.grey} />
          </View>
        )}
        <View className="absolute bottom-2 right-2 flex-row items-center gap-1 rounded-full bg-black/60 px-2.5 py-1">
          <Icon name="camera.fill" size={12} color="#fff" />
          <Text variant="caption2" className="font-medium text-white">
            {uploadCoverImage.isPending ? t('profile.uploading') : t('profile.changeCover')}
          </Text>
        </View>
      </Pressable>

      <View className="flex-row items-center gap-4 rounded-xl border border-border bg-card p-4">
        <CircularProgress
          progress={initial.completenessPct / 100}
          label={`${initial.completenessPct}%`}
        />
        <View className="flex-1 gap-0.5">
          <Text variant="subhead" className="font-semibold">
            {t('profile.completeness')}
          </Text>
          <Text variant="caption1" color="tertiary" numberOfLines={2}>
            {initial.completenessMissing.length > 0
              ? initial.completenessMissing.slice(0, 3).join(' · ')
              : t('profile.fullyComplete')}
          </Text>
        </View>
      </View>

      <View className="gap-1.5">
        <FieldLabel>{t('profile.businessName')}</FieldLabel>
        <View className="rounded-xl border border-border bg-muted px-4 py-3">
          <Text className="text-foreground">{initial.businessName}</Text>
        </View>
        <Text variant="caption2" color="tertiary">
          {t('profile.businessNameLocked')}
        </Text>
      </View>

      <View className="gap-1.5">
        <FieldLabel>{t('profile.tagline')}</FieldLabel>
        <TextInput
          value={tagline}
          onChangeText={setTagline}
          maxLength={200}
          placeholder={t('profile.taglinePlaceholder')}
          placeholderTextColor={colors.grey}
          className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
        />
      </View>

      <View className="gap-1.5">
        <FieldLabel>{t('profile.bio')}</FieldLabel>
        <TextInput
          value={bio}
          onChangeText={setBio}
          maxLength={160}
          multiline
          numberOfLines={5}
          placeholder={t('profile.bioPlaceholder')}
          placeholderTextColor={colors.grey}
          className="min-h-28 rounded-xl border border-border bg-card px-4 py-3 text-foreground"
          textAlignVertical="top"
        />
      </View>

      <View className="gap-1.5">
        <FieldLabel>{t('profile.startingPrice')}</FieldLabel>
        <TextInput
          value={startingPrice}
          onChangeText={setStartingPrice}
          keyboardType="numeric"
          placeholderTextColor={colors.grey}
          className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
        />
      </View>

      <Button onPress={onSave} disabled={updateCore.isPending}>
        <Text>{updateCore.isPending ? t('saving') : t('profile.save')}</Text>
      </Button>

      <Button variant="secondary" onPress={() => setPreviewOpen(true)}>
        <Text>{t('profile.preview')}</Text>
      </Button>

      {previewOpen ? <ProfilePreviewSheet onClose={() => setPreviewOpen(false)} /> : null}
    </ScrollView>
  );
}

function ProfilePreviewSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('studio');
  const { data, isLoading, isError } = useProfilePreview();
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
        <Pressable onPress={() => {}} className="gap-3 rounded-t-3xl bg-background px-5 pb-8 pt-4">
          <View className="mb-1 h-1 w-10 self-center rounded-full bg-muted" />
          <Text variant="title3" className="font-bold">
            {t('profile.previewTitle')}
          </Text>
          {isLoading ? (
            <ActivityIndicator />
          ) : isError || !data ? (
            <Text color="tertiary">{t('profile.previewError')}</Text>
          ) : (
            <>
              <View
                className={`self-start rounded-full px-2.5 py-1 ${
                  data.isVisibleToBrides ? 'bg-green-100 dark:bg-green-950' : 'bg-amber-100 dark:bg-amber-950'
                }`}>
                <Text
                  variant="caption1"
                  className={`font-semibold ${
                    data.isVisibleToBrides ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'
                  }`}>
                  {data.isVisibleToBrides ? t('profile.visible') : t('profile.notVisible')}
                </Text>
              </View>
              <View className="gap-1 rounded-xl border border-border bg-card p-4">
                <Text variant="title3" className="font-bold">
                  {data.businessName}
                </Text>
                {data.tagline ? <Text color="tertiary">{data.tagline}</Text> : null}
                <Text variant="caption1" color="tertiary" className="mt-2">
                  {t('profile.previewMeta', {
                    score: data.completenessScore,
                    instagram: data.instagramConnected ? t('profile.igConnected') : t('profile.igNotConnected'),
                  })}
                </Text>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
