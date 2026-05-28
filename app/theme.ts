import { useColorScheme } from 'react-native';

export const lightTheme = {
  background: '#f8fafc',
  surface: '#fff',
  card: '#f1f5f9',
  text: '#111827',
  subtext: '#475569',
  muted: '#64748b',
  border: '#e2e8f0',
  primary: '#0f766e',
  primarySoft: '#ccfbf1',
  primaryText: '#fff',
  secondary: '#94a3b8',
  danger: '#dc2626',
  success: '#16a34a',
  placeholder: '#94a3b8',
  tabBarBackground: '#fff',
  tabBarBorder: '#e2e8f0',
  tabBarActive: '#0f766e',
  tabBarInactive: '#94a3b8',
  shadow: '#0f766e',
};

export const darkTheme = {
  background: '#020617',
  surface: '#0f172a',
  card: '#111827',
  text: '#e2e8f0',
  subtext: '#94a3b8',
  muted: '#94a3b8',
  border: '#334155',
  primary: '#5eead4',
  primarySoft: '#0f766e',
  primaryText: '#0f172a',
  secondary: '#64748b',
  danger: '#fda4af',
  success: '#4ade80',
  placeholder: '#94a3b8',
  tabBarBackground: '#020617',
  tabBarBorder: '#334155',
  tabBarActive: '#5eead4',
  tabBarInactive: '#64748b',
  shadow: '#000',
};

export type ThemeColors = typeof lightTheme;

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
