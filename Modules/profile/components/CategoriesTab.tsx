import { useActionSheet } from '@expo/react-native-action-sheet';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { useCategoryOptions, useUpdateCategories } from '@/Modules/profile/hooks';
import type { ProfileCategories } from '@/Modules/profile/types';
import { Chip } from './Chip';
import { FieldLabel } from './FieldLabel';

export function CategoriesTab({ initial }: { initial: ProfileCategories }) {
  const { data: options, isLoading } = useCategoryOptions();
  const updateCategories = useUpdateCategories();
  const { showActionSheetWithOptions } = useActionSheet();

  const [mainCategory, setMainCategory] = useState(initial.mainCategory);
  const [subcategories, setSubcategories] = useState<string[]>(initial.subcategories);
  const [cities, setCities] = useState<string[]>(initial.citiesServed);
  const [occasions, setOccasions] = useState<string[]>(initial.occasionsCovered);

  const toggle = (list: string[], value: string, setList: (v: string[]) => void) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const openMainCategoryPicker = () => {
    if (!options) return;
    const sheetOptions = [...options.mainCategories, 'Cancel'];
    showActionSheetWithOptions(
      { options: sheetOptions, cancelButtonIndex: sheetOptions.length - 1, title: 'Main category' },
      (index) => {
        if (index === undefined || index === sheetOptions.length - 1) return;
        const next = options.mainCategories[index]!;
        setMainCategory(next);
        setSubcategories([]);
      },
    );
  };

  const onSave = () => {
    updateCategories.mutate({
      mainCategory,
      subcategories,
      citiesServed: cities,
      occasionsCovered: occasions,
    });
  };

  if (isLoading || !options) {
    return (
      <View className="items-center justify-center p-10">
        <ActivityIndicator />
      </View>
    );
  }

  const subcategoryOptions = mainCategory ? (options.subcategoriesByMain[mainCategory] ?? []) : [];

  return (
    <ScrollView contentContainerClassName="gap-5 p-4">
      <View className="gap-1.5">
        <FieldLabel>MAIN CATEGORY</FieldLabel>
        <Pressable
          onPress={openMainCategoryPicker}
          className="rounded-xl border border-border bg-card px-4 py-3">
          <Text className={mainCategory ? undefined : 'text-muted-foreground'}>
            {mainCategory ?? 'Choose a category'}
          </Text>
        </Pressable>
      </View>

      {subcategoryOptions.length > 0 ? (
        <View className="gap-1.5">
          <FieldLabel>SUBCATEGORIES</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {subcategoryOptions.map((sub) => (
              <Chip
                key={sub}
                label={sub}
                selected={subcategories.includes(sub)}
                onPress={() => toggle(subcategories, sub, setSubcategories)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View className="gap-1.5">
        <FieldLabel>CITIES SERVED</FieldLabel>
        <View className="flex-row flex-wrap gap-2">
          {options.cities.map((city) => (
            <Chip
              key={city}
              label={city}
              selected={cities.includes(city)}
              onPress={() => toggle(cities, city, setCities)}
            />
          ))}
        </View>
      </View>

      <View className="gap-1.5">
        <FieldLabel>OCCASIONS COVERED</FieldLabel>
        <View className="flex-row flex-wrap gap-2">
          {options.occasions.map((occasion) => (
            <Chip
              key={occasion}
              label={occasion}
              selected={occasions.includes(occasion)}
              onPress={() => toggle(occasions, occasion, setOccasions)}
            />
          ))}
        </View>
      </View>

      <Button onPress={onSave} disabled={updateCategories.isPending}>
        <Text>{updateCategories.isPending ? 'Saving…' : 'Save categories'}</Text>
      </Button>
    </ScrollView>
  );
}
