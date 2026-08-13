import { useActionSheet } from '@expo/react-native-action-sheet';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { useCategoryOptions, useUpdateCategories, useUpdateCoverage } from '@/Modules/profile/hooks';
import type { ProfileCategories, ProfileCoverage } from '@/Modules/profile/types';
import { Chip } from './Chip';
import { FieldLabel } from './FieldLabel';

export function CategoriesTab({
  initial,
  coverage,
}: {
  initial: ProfileCategories;
  coverage: ProfileCoverage;
}) {
  const { data: options, isLoading } = useCategoryOptions();
  const updateCategories = useUpdateCategories();
  const updateCoverage = useUpdateCoverage();
  const { showActionSheetWithOptions } = useActionSheet();

  const [mainCategoryId, setMainCategoryId] = useState(initial.mainCategoryId);
  const [subcategoryIds, setSubcategoryIds] = useState<string[]>(
    initial.categoryIds.filter((id) => id !== initial.mainCategoryId),
  );
  const [cityIds, setCityIds] = useState<string[]>(coverage.cityIds);
  const [occasionTypeIds, setOccasionTypeIds] = useState<string[]>(coverage.occasionTypeIds);

  const toggle = (list: string[], value: string, setList: (v: string[]) => void) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const openMainCategoryPicker = () => {
    if (!options) return;
    const sheetOptions = [...options.categories.map((c) => c.nameEn), 'Cancel'];
    showActionSheetWithOptions(
      { options: sheetOptions, cancelButtonIndex: sheetOptions.length - 1, title: 'Main category' },
      (index) => {
        if (index === undefined || index === sheetOptions.length - 1) return;
        const next = options.categories[index]!;
        setMainCategoryId(next.id);
        setSubcategoryIds([]);
      },
    );
  };

  const onSaveCategories = () => {
    const categoryIds = mainCategoryId
      ? Array.from(new Set([mainCategoryId, ...subcategoryIds]))
      : subcategoryIds;
    updateCategories.mutate({ mainCategoryId, categoryIds });
  };

  const onSaveCoverage = () => {
    const marketIds = Array.from(
      new Set(
        (options?.cities ?? [])
          .filter((c) => cityIds.includes(c.id))
          .map((c) => c.marketId),
      ),
    );
    updateCoverage.mutate({ cityIds, marketIds, occasionTypeIds });
  };

  if (isLoading || !options) {
    return (
      <View className="items-center justify-center p-10">
        <ActivityIndicator />
      </View>
    );
  }

  const mainCategory = options.categories.find((c) => c.id === mainCategoryId);
  const subcategoryOptions = mainCategory?.children ?? [];

  return (
    <ScrollView contentContainerClassName="gap-5 p-4">
      <View className="gap-1.5">
        <FieldLabel>MAIN CATEGORY</FieldLabel>
        <Pressable
          onPress={openMainCategoryPicker}
          className="rounded-xl border border-border bg-card px-4 py-3">
          <Text className={mainCategory ? undefined : 'text-muted-foreground'}>
            {mainCategory?.nameEn ?? 'Choose a category'}
          </Text>
        </Pressable>
      </View>

      {subcategoryOptions.length > 0 ? (
        <View className="gap-1.5">
          <FieldLabel>SUBCATEGORIES</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {subcategoryOptions.map((sub) => (
              <Chip
                key={sub.id}
                label={sub.nameEn}
                selected={subcategoryIds.includes(sub.id)}
                onPress={() => toggle(subcategoryIds, sub.id, setSubcategoryIds)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <Button onPress={onSaveCategories} disabled={updateCategories.isPending}>
        <Text>{updateCategories.isPending ? 'Saving…' : 'Save categories'}</Text>
      </Button>

      <View className="gap-1.5">
        <FieldLabel>CITIES SERVED</FieldLabel>
        <View className="flex-row flex-wrap gap-2">
          {options.cities.map((city) => (
            <Chip
              key={city.id}
              label={city.nameEn}
              selected={cityIds.includes(city.id)}
              onPress={() => toggle(cityIds, city.id, setCityIds)}
            />
          ))}
        </View>
      </View>

      <View className="gap-1.5">
        <FieldLabel>OCCASIONS COVERED</FieldLabel>
        <View className="flex-row flex-wrap gap-2">
          {options.occasions.map((occasion) => (
            <Chip
              key={occasion.id}
              label={occasion.nameEn}
              selected={occasionTypeIds.includes(occasion.id)}
              onPress={() => toggle(occasionTypeIds, occasion.id, setOccasionTypeIds)}
            />
          ))}
        </View>
      </View>

      <Button onPress={onSaveCoverage} disabled={updateCoverage.isPending}>
        <Text>{updateCoverage.isPending ? 'Saving…' : 'Save coverage'}</Text>
      </Button>
    </ScrollView>
  );
}
