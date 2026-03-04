import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, Linking
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { listenToClaim } from '../../services/firebase';
import {
  Colors, Spacing, Typography, Radius, Shadow,
  getStatusColor, getStatusLabel, getClaimTypeIcon, getClaimTypeColor
} from '../../theme';
import { Claim } from '../../types';
import Button from '../../components/Button';
import { format } from 'date-fns';

const STATUS_ORDER: Claim['status'][] = [
  'submitted', 'under_review', 'info_required', 'approved', 'paid'
];

export default function ClaimDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { claimId } = route.params;
  const [claim, setClaim] = useState<Claim | null>(null);

  useEffect(() => {
    const unsubscribe = listenToClaim(claimId, (updatedClaim) => {
      setClaim(updatedClaim);
    });
    return unsubscribe;
  }, [claimId]);

  if (!claim) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading claim...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(claim.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{claim.title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status hero */}
        <View style={[styles.statusHero, { backgroundColor: `${statusColor}12` }]}>
          <View style={[styles.statusIconBg, { backgroundColor: `${statusColor}20` }]}>
            <Text style={styles.statusIcon}>{getClaimTypeIcon(claim.type)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusBadgeText}>{getStatusLabel(claim.status)}</Text>
          </View>
          <Text style={styles.statusRef}>Ref: {claim.referenceNumber}</Text>
          <Text style={styles.statusAmount}>
            ${claim.estimatedAmount.toLocaleString()}
          </Text>
          <Text style={styles.statusAmountLabel}>Estimated Claim Value</Text>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claim Progress</Text>
          <View style={styles.timeline}>
            {STATUS_ORDER.filter(s => s !== 'info_required').map((status, index) => {
              const stepStatuses = STATUS_ORDER.filter(s => s !== 'info_required');
              const currentIndex = stepStatuses.indexOf(claim.status === 'info_required' ? 'under_review' : claim.status);
              const isDone = index < currentIndex;
              const isActive = index === currentIndex;
              const historyItem = claim.statusHistory?.find(h => h.key === status);

              return (
                <View key={status} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        isDone && styles.timelineDotDone,
                        isActive && styles.timelineDotActive,
                      ]}
                    >
                      {isDone && <Text style={styles.timelineCheck}>✓</Text>}
                      {isActive && <View style={styles.timelinePulse} />}
                    </View>
                    {index < stepStatuses.length - 1 && (
                      <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        (isDone || isActive) && styles.timelineLabelActive,
                      ]}
                    >
                      {getStatusLabel(status)}
                    </Text>
                    {historyItem?.timestamp && (
                      <Text style={styles.timelineDate}>
                        {format(new Date(historyItem.timestamp), 'dd MMM yyyy, HH:mm')}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {claim.status === 'info_required' && (
            <View style={styles.infoRequiredBanner}>
              <Text style={styles.infoRequiredIcon}>⚠️</Text>
              <View style={styles.infoRequiredText}>
                <Text style={styles.infoRequiredTitle}>Action Required</Text>
                <Text style={styles.infoRequiredBody}>
                  {claim.adjusterNote || 'Please provide additional information to continue processing your claim.'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Adjuster info */}
        {claim.adjusterName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Claims Adjuster</Text>
            <View style={styles.adjusterCard}>
              <View style={styles.adjusterAvatar}>
                <Text style={styles.adjusterInitial}>
                  {claim.adjusterName.charAt(0)}
                </Text>
              </View>
              <View style={styles.adjusterInfo}>
                <Text style={styles.adjusterName}>{claim.adjusterName}</Text>
                <Text style={styles.adjusterRole}>Claims Specialist</Text>
              </View>
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() =>
                  navigation.navigate('Chat', {
                    claimId: claim.id,
                    claimTitle: claim.title,
                  })
                }
              >
                <Text style={styles.chatBtnText}>💬 Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Claim details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claim Information</Text>
          <View style={styles.detailCard}>
            <DetailRow label="Type" value={`${getClaimTypeIcon(claim.type)} ${claim.type.charAt(0).toUpperCase() + claim.type.slice(1)}`} />
            <DetailRow label="Policy Number" value={claim.policyNumber} />
            <DetailRow label="Incident Date" value={format(new Date(claim.incidentDate), 'dd MMMM yyyy')} />
            <DetailRow label="Submitted" value={format(new Date(claim.createdAt), 'dd MMM yyyy')} />
            <DetailRow label="Description" value={claim.description} isLast />
          </View>
        </View>

        {/* Documents */}
        {claim.documents && claim.documents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documents ({claim.documents.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.docsRow}>
                {claim.documents.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    style={styles.docCard}
                    onPress={() => doc.cloudUrl && Linking.openURL(doc.cloudUrl)}
                  >
                    {doc.type === 'image' ? (
                      <Image
                        source={{ uri: doc.cloudUrl || doc.uri }}
                        style={styles.docImage}
                      />
                    ) : (
                      <View style={styles.docPdfIcon}>
                        <Text style={{ fontSize: 28 }}>📄</Text>
                      </View>
                    )}
                    <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Actions */}
        <View style={[styles.section, styles.actionsSection]}>
          <Button
            label="💬 Message Adjuster"
            variant="outline"
            onPress={() =>
              navigation.navigate('Chat', {
                claimId: claim.id,
                claimTitle: claim.title,
              })
            }
            style={styles.actionBtn}
          />
          {claim.status === 'info_required' && (
            <Button
              label="📎 Upload Documents"
              onPress={() => {}}
              style={styles.actionBtn}
            />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[detailStyles.row, !isLast && detailStyles.border]}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value} numberOfLines={isLast ? undefined : 1}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { paddingVertical: Spacing.md, flexDirection: 'row', gap: Spacing.md },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  label: { width: 110, fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '500' },
  value: { flex: 1, fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: '600', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.textSecondary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { flex: 1, fontSize: Typography.md, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: Typography.xl, color: Colors.primary },
  statusHero: {
    alignItems: 'center', padding: Spacing.xxl, margin: Spacing.xl,
    borderRadius: Radius.xl, ...Shadow.sm,
  },
  statusIconBg: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  statusIcon: { fontSize: 32 },
  statusBadge: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, marginBottom: Spacing.md,
  },
  statusBadgeText: { color: Colors.white, fontWeight: '700', fontSize: Typography.sm },
  statusRef: { fontSize: Typography.sm, color: Colors.textTertiary, marginBottom: Spacing.xs },
  statusAmount: { fontSize: Typography.xxxl, fontWeight: '800', color: Colors.textPrimary },
  statusAmountLabel: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
  timeline: { paddingLeft: Spacing.sm },
  timelineItem: { flexDirection: 'row', marginBottom: 0 },
  timelineLeft: { alignItems: 'center', marginRight: Spacing.md },
  timelineDot: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    borderColor: Colors.border, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  timelineDotDone: { borderColor: Colors.success, backgroundColor: Colors.success },
  timelineDotActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  timelinePulse: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.white,
  },
  timelineCheck: { color: Colors.white, fontSize: 11, fontWeight: '800' },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border, minHeight: 32 },
  timelineLineDone: { backgroundColor: Colors.success },
  timelineContent: { flex: 1, paddingBottom: Spacing.lg, paddingTop: 2 },
  timelineLabel: { fontSize: Typography.base, fontWeight: '600', color: Colors.textTertiary },
  timelineLabelActive: { color: Colors.textPrimary },
  timelineDate: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  infoRequiredBanner: {
    flexDirection: 'row', gap: Spacing.md, backgroundColor: `${Colors.error}10`,
    borderRadius: Radius.md, padding: Spacing.md, borderLeftWidth: 3,
    borderLeftColor: Colors.error, marginTop: Spacing.sm,
  },
  infoRequiredIcon: { fontSize: 18 },
  infoRequiredText: { flex: 1 },
  infoRequiredTitle: { fontWeight: '700', color: Colors.error, marginBottom: 4 },
  infoRequiredBody: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18 },
  adjusterCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.md, ...Shadow.sm,
  },
  adjusterAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryLighter, alignItems: 'center', justifyContent: 'center',
  },
  adjusterInitial: { fontSize: Typography.lg, fontWeight: '800', color: Colors.primary },
  adjusterInfo: { flex: 1 },
  adjusterName: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  adjusterRole: { fontSize: Typography.sm, color: Colors.textSecondary },
  chatBtn: {
    backgroundColor: Colors.primaryLighter, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderRadius: Radius.full,
  },
  chatBtnText: { color: Colors.primary, fontWeight: '700', fontSize: Typography.sm },
  detailCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.base, ...Shadow.sm,
  },
  docsRow: { flexDirection: 'row', gap: Spacing.md, paddingBottom: Spacing.sm },
  docCard: { width: 100, alignItems: 'center' },
  docImage: { width: 100, height: 100, borderRadius: Radius.md, marginBottom: 6 },
  docPdfIcon: {
    width: 100, height: 100, borderRadius: Radius.md,
    backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  docName: {
    fontSize: Typography.xs, color: Colors.textSecondary,
    textAlign: 'center', fontWeight: '500',
  },
  actionsSection: { gap: Spacing.sm },
  actionBtn: { width: '100%' },
});