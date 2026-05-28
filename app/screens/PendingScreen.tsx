import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from '../../services/auth';
import { useTheme } from '../theme';

export default function PendingScreen() {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const handleSignOut = async () => {
    try {
      console.log('Pending screen sign-out pressed');
      await signOut();
      console.log('Pending screen sign-out: signOut() returned');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="hourglass" size={42} color="#0f766e" />
      </View>
      <Text style={styles.title}>Verification pending</Text>
      <Text style={styles.message}>
        Your ID is being reviewed by our team. This usually takes 24-48 hours, and you will get
        marketplace access once approved.
      </Text>
      <View style={styles.statusPanel}>
        <View style={styles.statusRow}>
          <Ionicons name="checkmark-circle" size={18} color="#0f766e" />
          <Text style={styles.statusText}>ID submitted securely</Text>
        </View>
        <View style={styles.statusRow}>
          <Ionicons name="time" size={18} color="#0f766e" />
          <Text style={styles.statusText}>Manual review in progress</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.82}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      gap: 15,
    },
    iconWrap: {
      width: 82,
      height: 82,
      borderRadius: 8,
      backgroundColor: theme.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 5,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: theme.text,
      textAlign: 'center',
    },
    message: {
      fontSize: 15,
      color: theme.subtext,
      textAlign: 'center',
      lineHeight: 23,
    },
    statusPanel: {
      alignSelf: 'stretch',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.primarySoft,
      backgroundColor: theme.surface,
      padding: 16,
      gap: 10,
      marginTop: 4,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    statusText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '700',
    },
    signOutButton: {
      marginTop: 10,
      paddingVertical: 13,
      paddingHorizontal: 34,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    signOutText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '800',
    },
  });
