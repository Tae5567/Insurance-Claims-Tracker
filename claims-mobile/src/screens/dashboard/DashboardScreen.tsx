import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useClaimsStore } from '../../store/useClaimsStore';
import { getUserClaims } from '../../services/firebase';
import { Colors, Spacing, Typography, Radius, Shadow, getClaimTypeColor } from '../../theme';
import ClaimCard from '../../components/ClaimCard';
import { format } from 'date-fns';

const CLAIM_TYPES = [
  { type: 'motor', label: 'Motor' },
  { type: 'home', label: 'Home' },
  { type: 'travel', label: 'Travel' },
  { type: 'health', label: 'Health' },
  { type: 'life', label: 'Life' },
] as const;

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const { claims, setClaims } = useClaimsStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = getUserClaims(user.id, setClaims);
    return unsubscribe;
  }, [user?.id]);

  const activeClaims = claims.filter(
    (c) => !['paid', 'rejected', 'draft'].includes(c.status)
  );
  const resolvedCount = claims.filter(
    (c) => c.status === 'approved' || c.status === 'paid'
  ).length;
  const totalValue = claims.reduce((sum, c) => sum + (c.estimatedAmount || 0), 0);
  const recentClaims = claims.slice(0, 3);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} tintColor={Colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
          <TouchableOpacity
            style={styles.newClaimBtn}
            onPress={() => navigation.navigate('NewClaim')}
            activeOpacity={0.85}
          >
            <Text style={styles.newClaimBtnText}>+ New Claim</Text>
          </TouchableOpacity>
        </View>

        {/* Policy card — dark, premium */}
        <View style={styles.policyCard}>
          <View style={styles.policyCardInner}>
            {/* Background geometric detail */}
            <View style={styles.policyCardCircle1} />
            <View style={styles.policyCardCircle2} />

            <Text style={styles.policyCardEyebrow}>Active Policy</Text>
            <Text style={styles.policyNumber}>{user?.policyNumber}</Text>
            <View style={styles.policyCardFooter}>
              <Text style={styles.policyCardDate}>
                Since {format(new Date(), 'MMMM yyyy')}
              </Text>
              <View style={styles.policyActivePill}>
                <View style={styles.policyActiveDot} />
                <Text style={styles.policyActiveText}>Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Total Claims" value={claims.length} accent={Colors.accent} />
          <StatCard label="In Progress" value={activeClaims.length} accent={Colors.warning} />
          <StatCard label="Resolved" value={resolvedCount} accent={Colors.success} />
        </View>

        {/* Total value strip */}
        {totalValue > 0 && (
          <View style={styles.valueStrip}>
            <Text style={styles.valueStripLabel}>Total claim value</Text>
            <Text style={styles.valueStripAmount}>${totalValue.toLocaleString()}</Text>
          </View>
        )}

        {/* New claim by type */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>File a Claim</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeRow}
        >
          {CLAIM_TYPES.map(({ type, label }) => {
            const color = getClaimTypeColor(type);
            return (
              <TouchableOpacity
                key={type}
                style={styles.typeChip}
                activeOpacity={0.75}
                onPress={() =>
                  navigation.navigate('NewClaim', { preselectedType: type })
                }
              >
                <View style={[styles.typeChipDot, { backgroundColor: `${color}20` }]}>
                  <Text style={[styles.typeChipInitial, { color }]}>
                    {label.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.typeChipLabel}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Recent claims */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Claims</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Claims')}>
            <Text style={styles.seeAll}>View all</Text>
          </TouchableOpacity>
        </View>

        {recentClaims.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <View style={styles.emptyIconLine} />
              <View style={[styles.emptyIconLine, { width: 32 }]} />
              <View style={[styles.emptyIconLine, { width: 20 }]} />
            </View>
            <Text style={styles.emptyTitle}>No claims yet</Text>
            <Text style={styles.emptySubtitle}>
              Use the button above to submit your first claim
            </Text>
          </View>
        ) : (
          recentClaims.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              onPress={() =>
                navigation.navigate('ClaimDetail', { claimId: claim.id })
              }
            />
          ))
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <View style={[statStyles.card, { borderTopColor: accent }]}>
      <Text style={[statStyles.value, { color: accent }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'flex-start',
    borderTopWidth: 2.5,
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadow.xs,
  },
  value: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  label: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    fontWeight: '500',
    lineHeight: 14,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: Typography.sm,
    color: Colors.textTertiary,
    fontWeight: '400',
  },
  userName: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  newClaimBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    ...Shadow.sm,
  },
  newClaimBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: Typography.sm,
    letterSpacing: 0.1,
  },
  // Policy card
  policyCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  policyCardInner: {
    backgroundColor: Colors.primary,
    padding: Spacing.xl,
    overflow: 'hidden',
  },
  policyCardCircle1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -40,
    right: -30,
  },
  policyCardCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -20,
    right: 80,
  },
  policyCardEyebrow: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  policyNumber: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
    marginBottom: Spacing.lg,
    fontVariant: ['tabular-nums'],
  },
  policyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  policyCardDate: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.5)',
  },
  policyActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  policyActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  policyActiveText: {
    fontSize: Typography.xs,
    color: '#34D399',
    fontWeight: '600',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  // Value strip
  valueStrip: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  valueStripLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  valueStripAmount: {
    fontSize: Typography.md,
    fontWeight: '800',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.1,
  },
  seeAll: {
    color: Colors.accent,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  // Type chips
  typeRow: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  typeChip: {
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    minWidth: 68,
    ...Shadow.xs,
  },
  typeChipDot: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipInitial: {
    fontSize: Typography.md,
    fontWeight: '800',
  },
  typeChipLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconBox: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    alignItems: 'flex-start',
  },
  emptyIconLine: {
    width: 44,
    height: 3,
    backgroundColor: Colors.divider,
    borderRadius: 2,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});