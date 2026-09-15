import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { getErrorMessage } from '@/lib/api-client';
import { localeTag } from '@/lib/i18n';
import { useColorScheme } from '@/lib/useColorScheme';
import { useStorageUsage } from '@/Modules/files/hooks';
import {
    useDeleteFile,
    useDeletePackage,
    useUploadFile,
    useUpsertPackage,
} from '@/Modules/profile/hooks';
import type { ProfileFiles } from '@/Modules/profile/types';
import { FieldLabel } from './FieldLabel';

export function FilesTab({ initial }: { initial: ProfileFiles }) {
  const { colors } = useColorScheme();
  const { t } = useTranslation(['studio', 'common']);
  const upsertPackage = useUpsertPackage();
  const deletePackage = useDeletePackage();
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();
  const usage = useStorageUsage();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
  };

  const onEdit = (id: string) => {
    const pkg = initial.packages.find((p) => p.id === id);
    if (!pkg) return;
    setEditingId(pkg.id);
    setName(pkg.name);
    setPrice(pkg.price.toString());
  };

  const onSubmit = async () => {
    if (!name.trim() || !price) return;
    await upsertPackage.mutateAsync({
      id: editingId ?? undefined,
      name: name.trim(),
      price: Number(price),
    });
    resetForm();
  };

  const onDeletePackage = (id: string, packageName: string) => {
    Alert.alert(t('files.deletePackageTitle'), t('files.deletePackageBody', { name: packageName }), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      { text: t('common:actions.delete'), style: 'destructive', onPress: () => deletePackage.mutate(id) },
    ]);
  };

  // Files used to delete on a single tap; packages already asked first.
  const onDeleteFile = (id: string, fileName: string) => {
    Alert.alert(t('files.deleteFileTitle'), t('files.deleteFileBody', { name: fileName }), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      {
        text: t('common:actions.delete'),
        style: 'destructive',
        onPress: () => deleteFile.mutate(id, { onSuccess: () => void usage.refetch() }),
      },
    ]);
  };

  const onUploadFile = async () => {
    // POST /files refuses anything but jpeg/png/webp/gif/pdf.
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    uploadFile.mutate(
      {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'application/octet-stream',
      },
      {
        onSuccess: () => void usage.refetch(),
        onError: (err) => Alert.alert(t('files.uploadFailed'), getErrorMessage(err)),
      },
    );
  };

  return (
    <ScrollView contentContainerClassName="gap-6 p-4">
      <View className="gap-3">
        <FieldLabel>{t('files.packages')}</FieldLabel>
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          {initial.packages.length === 0 ? (
            <Text variant="footnote" color="tertiary" className="p-4">
              {t('files.noPackages')}
            </Text>
          ) : (
            initial.packages.map((pkg, index) => (
              <View
                key={pkg.id}
                className={`flex-row items-center gap-3 p-4 ${
                  index < initial.packages.length - 1 ? 'border-b border-border' : ''
                }`}>
                <Pressable onPress={() => onEdit(pkg.id)} className="flex-1">
                  <Text variant="subhead" className="font-medium">
                    {pkg.name}
                  </Text>
                  <Text variant="caption1" color="tertiary">
                    {t('files.packageLine', { price: pkg.price.toLocaleString(localeTag()), sold: pkg.soldCount })}
                  </Text>
                </Pressable>
                <Pressable onPress={() => onDeletePackage(pkg.id, pkg.name)} className="p-2">
                  <Icon name="trash.fill" size={16} color={colors.grey} />
                </Pressable>
              </View>
            ))
          )}
        </View>

        <View className="gap-2 rounded-xl border border-border bg-card p-4">
          <Text variant="caption1" color="tertiary">
            {editingId ? t('files.editPackage') : t('files.addPackage')}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('files.packageName')}
            placeholderTextColor={colors.grey}
            className="rounded-lg border border-border px-3 py-2.5 text-foreground"
          />
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder={t('files.price')}
            placeholderTextColor={colors.grey}
            keyboardType="numeric"
            className="rounded-lg border border-border px-3 py-2.5 text-foreground"
          />
          <View className="flex-row gap-2">
            <Button
              className="flex-1"
              onPress={onSubmit}
              disabled={!name.trim() || !price || upsertPackage.isPending}>
              <Text>{editingId ? t('files.update') : t('files.add')}</Text>
            </Button>
            {editingId ? (
              <Button variant="secondary" onPress={resetForm}>
                <Text>{t('common:actions.cancel')}</Text>
              </Button>
            ) : null}
          </View>
        </View>
      </View>

      <View className="gap-3">
        <FieldLabel>{t('files.supplementary')}</FieldLabel>
        {usage.data && usage.data.capBytes > 0 ? (
          <View className="gap-1">
            <View className="h-2 overflow-hidden rounded-full bg-muted">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, (usage.data.usedBytes / usage.data.capBytes) * 100)}%` }}
              />
            </View>
            <Text variant="caption2" color="tertiary">
              {t('files.storage', { used: formatBytes(usage.data.usedBytes), cap: formatBytes(usage.data.capBytes) })}
            </Text>
          </View>
        ) : null}
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          {initial.files.length === 0 ? (
            <Text variant="footnote" color="tertiary" className="p-4">
              {t('files.noFiles')}
            </Text>
          ) : (
            initial.files.map((file, index) => (
              <View
                key={file.id}
                className={`flex-row items-center gap-3 p-4 ${
                  index < initial.files.length - 1 ? 'border-b border-border' : ''
                }`}>
                <Icon name="doc.fill" size={18} color={colors.foreground} />
                <View className="flex-1">
                  <Text variant="subhead" numberOfLines={1}>
                    {file.label || t('files.untitled')}
                  </Text>
                  <Text variant="caption1" color="tertiary">
                    {`${file.kind} · ${(file.byteSize / 1024).toFixed(0)} KB`}
                  </Text>
                </View>
                <Pressable
                  onPress={() => onDeleteFile(file.id, file.label || t('files.untitled'))}
                  className="p-2">
                  <Icon name="trash.fill" size={16} color={colors.grey} />
                </Pressable>
              </View>
            ))
          )}
        </View>
        <Button variant="secondary" onPress={onUploadFile} disabled={uploadFile.isPending}>
          <Text>{uploadFile.isPending ? t('files.uploading') : t('files.upload')}</Text>
        </Button>
      </View>
    </ScrollView>
  );
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
