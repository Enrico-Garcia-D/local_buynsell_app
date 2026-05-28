import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthRedirect } from './hooks/useAuthRedirect';
import { useTheme } from './theme';

export default function RootLayout() {
  const isReady = useAuthRedirect();
  const theme = useTheme();

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="screens" />
      <Stack.Screen name="my-listings" />
    </Stack>
  );
}