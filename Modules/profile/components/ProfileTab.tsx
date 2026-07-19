import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';

import { CircularProgress } from '@/components/CircularProgress';
import { Button } from '@/components/nativewindui/Button';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';
import { useUpdateProfileCore, useUploadCoverImage } from '@/Modules/profile/hooks';
import type { ProfileCore } from '@/Modules/profile/types';
import { FieldLabel } from './FieldLabel';

export function ProfileTab({ initial }: { initial: ProfileCore }) {
  const { colors } = useColorScheme();
  const updateCore = useUpdateProfileCore();
  const uploadCoverImage = useUploadCoverImage();

  const [businessName, setBusinessName] = useState(initial.businessName);
  const [tagline, setTagline] = useState(initial.tagline);
  const [bio, setBio] = useState(initial.bio);
  const [startingPrice, setStartingPrice] = useState(initial.startingPrice?.toString() ?? '');

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
    uploadCoverImage.mutate({
      uri: asset.uri,
      name: asset.fileName ?? 'cover.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    });
  };

  const onSave = () => {
    updateCore.mutate({
      businessName,
      tagline,
      bio,
      startingPrice: startingPrice ? Number(startingPrice) : null,
    });
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
            {uploadCoverImage.isPending ? 'Uploading…' : 'Change cover'}
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
            Profile completeness
          </Text>
          <Text variant="caption1" color="tertiary" numberOfLines={2}>
            {initial.completenessMissing.length > 0
              ? initial.completenessMissing.slice(0, 3).join(' · ')
              : 'Fully complete — nice work'}
          </Text>
        </View>
      </View>

      <View className="gap-1.5">
        <FieldLabel>BUSINESS NAME</FieldLabel>
        <TextInput
          value={businessName}
          onChangeText={setBusinessName}
          className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
        />
      </View>

      <View className="gap-1.5">
        <FieldLabel>TAGLINE</FieldLabel>
        <TextInput
          value={tagline}
          onChangeText={setTagline}
          placeholder="One line that sums up your studio"
          placeholderTextColor={colors.grey}
          className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
        />
      </View>

      <View className="gap-1.5">
        <FieldLabel>BIO</FieldLabel>
        <TextInput
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={5}
          placeholder="Tell brides about your studio"
          placeholderTextColor={colors.grey}
          className="min-h-28 rounded-xl border border-border bg-card px-4 py-3 text-foreground"
          textAlignVertical="top"
        />
      </View>

      <View className="gap-1.5">
        <FieldLabel>STARTING PRICE (EGP)</FieldLabel>
        <TextInput
          value={startingPrice}
          onChangeText={setStartingPrice}
          keyboardType="numeric"
          placeholderTextColor={colors.grey}
          className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
        />
      </View>

      <Button onPress={onSave} disabled={updateCore.isPending}>
        <Text>{updateCore.isPending ? 'Saving…' : 'Save profile'}</Text>
      </Button>
    </ScrollView>
  );
}
