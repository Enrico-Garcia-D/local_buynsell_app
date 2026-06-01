import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SignOutConfirmationProps {
  visible: boolean;
  theme: any;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function SignOutConfirmation({
  visible,
  theme,
  onConfirm,
  onCancel,
  loading = false,
}: SignOutConfirmationProps) {
  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: 24 }]}>
      <View style={{ backgroundColor: theme.surface, padding: 24, borderRadius: 20, width: '100%', alignItems: 'center' }}>
        
        {/* CLOSE BUTTON */}
        <TouchableOpacity 
          onPress={onCancel}
          disabled={loading}
          style={{ position: 'absolute', top: 15, right: 15 }}
        >
          <Ionicons name="close" size={24} color={theme.subtext} />
        </TouchableOpacity>

        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Ionicons name="log-out-outline" size={32} color="#dc2626" />
        </View>
        
        <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text, textAlign: 'center', marginBottom: 8 }}>
          Sign Out?
        </Text>
        
        <Text style={{ fontSize: 14, color: theme.subtext, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
          You'll need to sign in again to access your listings and messages.
        </Text>

        <View style={{ width: '100%', gap: 10 }}>
          <TouchableOpacity 
            style={{ backgroundColor: '#dc2626', paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' }}
            onPress={onConfirm}
            disabled={loading}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>
              {loading ? 'Signing Out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ backgroundColor: theme.background, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: theme.border }}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={{ color: theme.text, fontWeight: '800' }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
