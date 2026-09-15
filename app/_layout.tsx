import '../global.css';
import '@/lib/i18n';
import 'expo-dev-client';
import { ThemeProvider as NavThemeProvider } from 'expo-router/react-navigation';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import {
  Fraunces_400Regular,
  Fraunces_700Bold,
  Fraunces_800ExtraBold_Italic,
  useFonts,
} from '@expo-google-fonts/fraunces';
import { QueryClientProvider } from '@tanstack/react-query';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { AuthProvider, useAuth } from '@/Modules/auth/context';
import { queryClient } from '@/lib/query-client';
import { installWebAlert } from '@/lib/web-alert';
import { useColorScheme } from '@/lib/useColorScheme';
import { NAV_THEME } from '@/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

installWebAlert();

export default function RootLayout() {
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_700Bold,
    Fraunces_800ExtraBold_Italic,
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <AuthProvider>
            <StatusBar
              key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
              style={isDarkColorScheme ? 'light' : 'dark'}
            />
            <ActionSheetProvider>
              <NavThemeProvider value={NAV_THEME[colorScheme]}>
                <RootNavigator />
              </NavThemeProvider>
            </ActionSheetProvider>
          </AuthProvider>
        </KeyboardProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack screenOptions={SCREEN_OPTIONS}>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" options={GROUP_OPTIONS} />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" options={GROUP_OPTIONS} />
      </Stack.Protected>
    </Stack>
  );
}

const SCREEN_OPTIONS = {
  animation: 'ios_from_right', // for android
} as const;

const GROUP_OPTIONS = {
  headerShown: false,
} as const;
