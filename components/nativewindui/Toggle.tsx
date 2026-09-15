import { Platform, Switch, View } from 'react-native';

import { useIsRTL } from '@/lib/rtl';
import { useColorScheme } from '@/lib/useColorScheme';
import { COLORS } from '@/theme/colors';

/** The app's only switch: brand track colours, white thumb, RTL-safe on web. */
function Toggle(props: React.ComponentProps<typeof Switch>) {
  const { colors } = useColorScheme();
  const isRTL = useIsRTL();
  const control = (
    <Switch
      trackColor={{
        true: colors.primary,
        false: colors.grey,
      }}
      thumbColor={COLORS.white}
      // react-native-web ignores thumbColor while on; it defaults to teal.
      {...({ activeThumbColor: COLORS.white } as object)}
      {...props}
    />
  );
  // react-native-web places the thumb with physical offsets, so under dir="rtl" an
  // "on" thumb escapes the track. Lay it out LTR and mirror it: the thumb stays in
  // the track and "on" sits at the end (left) edge, as native RTL switches do.
  if (Platform.OS === 'web' && isRTL) {
    return <View style={{ direction: 'ltr', transform: [{ scaleX: -1 }] }}>{control}</View>;
  }
  return control;
}

export { Toggle };
