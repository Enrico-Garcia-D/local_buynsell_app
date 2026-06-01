// ─────────────────────────────────────────────────────────────────────────────
// Stack layout for all screens under app/screens/
// This file is REQUIRED for Expo Router to recognize /screens/chat as a valid route.
// ─────────────────────────────────────────────────────────────────────────────

import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}