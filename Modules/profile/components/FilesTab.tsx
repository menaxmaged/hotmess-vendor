import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { Icon } from '@/components/nativewindui/Icon';
import { Text } from '@/components/nativewindui/Text';
import { formatDate } from '@/lib/format';
import { useColorScheme } from '@/lib/useColorScheme';
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
  const upsertPackage = useUpsertPackage();
  const deletePackage = useDeletePackage();
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();

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
    Alert.alert('Delete package', `Delete "${packageName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePackage.mutate(id) },
    ]);
  };

  const onUploadFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    uploadFile.mutate({
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType ?? 'application/octet-stream',
    });
  };

  return (
    <ScrollView contentContainerClassName="gap-6 p-4">
      <View className="gap-3">
        <FieldLabel>PACKAGES</FieldLabel>
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          {initial.packages.length === 0 ? (
            <Text variant="footnote" color="tertiary" className="p-4">
              No packages yet.
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
                    {`EGP ${pkg.price.toLocaleString()} · ${pkg.soldCount} sold`}
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
            {editingId ? 'EDIT PACKAGE' : 'ADD PACKAGE'}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Package name"
            placeholderTextColor={colors.grey}
            className="rounded-lg border border-border px-3 py-2.5 text-foreground"
          />
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="Price (EGP)"
            placeholderTextColor={colors.grey}
            keyboardType="numeric"
            className="rounded-lg border border-border px-3 py-2.5 text-foreground"
          />
          <View className="flex-row gap-2">
            <Button
              className="flex-1"
              onPress={onSubmit}
              disabled={!name.trim() || !price || upsertPackage.isPending}>
              <Text>{editingId ? 'Update' : 'Add'}</Text>
            </Button>
            {editingId ? (
              <Button variant="secondary" onPress={resetForm}>
                <Text>Cancel</Text>
              </Button>
            ) : null}
          </View>
        </View>
      </View>

      <View className="gap-3">
        <FieldLabel>SUPPLEMENTARY FILES</FieldLabel>
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          {initial.files.length === 0 ? (
            <Text variant="footnote" color="tertiary" className="p-4">
              No files uploaded yet.
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
                    {file.name}
                  </Text>
                  <Text variant="caption1" color="tertiary">
                    {formatDate(file.uploadedAt)}
                  </Text>
                </View>
                <Pressable onPress={() => deleteFile.mutate(file.id)} className="p-2">
                  <Icon name="trash.fill" size={16} color={colors.grey} />
                </Pressable>
              </View>
            ))
          )}
        </View>
        <Button variant="secondary" onPress={onUploadFile} disabled={uploadFile.isPending}>
          <Text>{uploadFile.isPending ? 'Uploading…' : 'Upload file'}</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
