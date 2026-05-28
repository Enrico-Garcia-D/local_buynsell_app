import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../services/firebase';
import { useTheme } from './theme';

export default function Index() {
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/screens/LoginScreen');
      }
    });
    return unsubscribe;
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}