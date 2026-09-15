import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  SF_SYMBOLS_TO_MATERIAL_COMMUNITY_ICONS,
  SF_SYMBOLS_TO_MATERIAL_ICONS,
} from 'rn-icon-mapper';

import type { IconProps } from './types';

import { useIsRTL } from '@/lib/rtl';
import { useColorScheme } from '@/lib/useColorScheme';

// Material glyphs don't mirror in RTL the way SF Symbols do on iOS.
const RTL_MIRROR: Record<string, string> = {
  'chevron.left': 'chevron.right',
  'chevron.right': 'chevron.left',
  'arrow.left': 'arrow.right',
  'arrow.right': 'arrow.left',
};

function Icon({
  name: rawName,
  materialCommunityIcon,
  materialIcon,
  sfSymbol: _sfSymbol,
  size = 24,
  ...props
}: IconProps) {
  const { colors } = useColorScheme();
  const isRTL = useIsRTL();
  const name = (isRTL && rawName ? (RTL_MIRROR[rawName] ?? rawName) : rawName) as typeof rawName;
  const defaultColor = colors.foreground;

  if (materialCommunityIcon) {
    return (
      <MaterialCommunityIcons
        size={size}
        color={defaultColor}
        {...props}
        {...materialCommunityIcon}
      />
    );
  }
  if (materialIcon) {
    return <MaterialIcons size={size} color={defaultColor} {...props} {...materialIcon} />;
  }
  const materialCommunityIconName =
    SF_SYMBOLS_TO_MATERIAL_COMMUNITY_ICONS[
      name as keyof typeof SF_SYMBOLS_TO_MATERIAL_COMMUNITY_ICONS
    ];
  if (materialCommunityIconName) {
    return (
      <MaterialCommunityIcons
        name={materialCommunityIconName}
        size={size}
        color={defaultColor}
        {...props}
      />
    );
  }
  const materialIconName =
    SF_SYMBOLS_TO_MATERIAL_ICONS[name as keyof typeof SF_SYMBOLS_TO_MATERIAL_ICONS];
  if (materialIconName) {
    return <MaterialIcons name={materialIconName} size={size} color={defaultColor} {...props} />;
  }
  return <MaterialCommunityIcons name="help" size={size} color={defaultColor} {...props} />;
}

export { Icon };