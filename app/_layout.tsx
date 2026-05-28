import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthRedirect } from './hooks/useAuthRedirect';

export default function RootLayout() {
  const isReady = useAuthRedirect();

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#0f766e" />
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