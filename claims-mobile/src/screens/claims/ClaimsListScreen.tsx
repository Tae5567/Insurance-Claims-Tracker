import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useClaimsStore } from '../../store/useClaimsStore';
import { getUserClaims } from '../../services/firebase';
import ClaimCard from '../../components/ClaimCard';
import { Colors, Spacing, Typography } from '../../theme';

export default function ClaimsListScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const { claims, setClaims } = useClaimsStore();

  useEffect(() => {
    if (!user?.id) return;
    return getUserClaims(user.id, setClaims);
  }, [user?.id]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Claims</Text>
        <Text style={styles.subtitle}>{claims.length} total</Text>
      </View>
      <FlatList
        data={claims}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ClaimCard
            claim={item}
            onPress={() => navigation.navigate('ClaimDetail', { claimId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No claims yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.xl, paddingBottom: Spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  list: { paddingTop: Spacing.sm, paddingBottom: 80 },
  empty: { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
});