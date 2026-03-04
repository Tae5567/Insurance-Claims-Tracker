import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { logoutUser } from '../../services/firebase';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../theme';
import Button from '../../components/Button';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logoutUser();
          setUser(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || '?'}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        <View style={styles.infoCard}>
          {[
            { label: 'Policy Number', value: user?.policyNumber },
            { label: 'Phone', value: user?.phone || 'Not set' },
            { label: 'Email', value: user?.email },
          ].map(({ label, value }) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </View>
        <Button label="Sign Out" onPress={handleLogout} variant="danger" style={styles.logoutBtn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.xl, paddingBottom: Spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  content: { padding: Spacing.xl },
  avatarContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md, ...Shadow.md,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: Colors.primary },
  name: { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  email: { fontSize: Typography.base, color: Colors.textSecondary, marginTop: 4 },
  infoCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.base, marginBottom: Spacing.xl, ...Shadow.sm,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  infoLabel: { fontSize: Typography.base, color: Colors.textSecondary },
  infoValue: { fontSize: Typography.base, fontWeight: '600', color: Colors.textPrimary },
  logoutBtn: { width: '100%' },
});