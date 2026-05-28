import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from '../../services/auth';

export default function HomeScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      console.log('Home screen sign-out pressed');
      await signOut();
      console.log('Home screen sign-out: signOut() returned');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={46} color="#0f766e" />
      </View>
      <Text style={styles.title}>Welcome to M-Place</Text>
      <Text style={styles.subtitle}>
        Your account is verified. You can now buy and sell with trusted people nearby.
      </Text>
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.82}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 14,
  },
  iconWrap: {
    width: 82,
    height: 82,
    borderRadius: 8,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 23,
  },
  signOutButton: {
    marginTop: 14,
    paddingVertical: 13,
    paddingHorizontal: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  signOutText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '800',
  },
});
