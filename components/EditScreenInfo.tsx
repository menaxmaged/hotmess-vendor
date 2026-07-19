import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/nativewindui/Text';


import { useTranslation } from 'react-i18next';


export default function EditScreenInfo({ path }: { path: string }) {

  const { t } = useTranslation();
  const title = t('getStarted');
  const description = t('changeCode')

  return (
    <View style={styles.getStartedContainer}>
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      <View style={[styles.codeHighlightContainer, styles.homeScreenFilename]}>
        <Text>{path}</Text>
      </View>
      <Text variant="body" className="text-center">
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  codeHighlightContainer: {
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
});
