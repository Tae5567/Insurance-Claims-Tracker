import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Claim } from '../types';
import {
  Colors,
  Spacing,
  Radius,
  Shadow,
  Typography,
  getStatusColor,
  getStatusLabel,
  getStatusBg,
  getClaimTypeColor,
  getClaimTypeLabel,
  getClaimTypeInitial,
} from '../theme';
import { format } from 'date-fns';

interface Props {
  claim: Claim;
  onPress: () => void;
}

const STATUS_PROGRESS: Record<string, number> = {
  draft: 0,
  submitted: 1,
  under_review: 2,
  info_required: 2,
  approved: 3,
  paid: 4,
  rejected: 0,
};

export default function ClaimCard({ claim, onPress }: Props) {
  const statusColor = getStatusColor(claim.status);
  const statusBg = getStatusBg(claim.status);
  const typeColor = getClaimTypeColor(claim.type);
  const progressSteps = 4;
  const progressFilled = STATUS_PROGRESS[claim.status] || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.72}>
      <View style={styles.row}>
        {/* Type badge — letter initial, colored */}
        <View style={[styles.typeBadge, { backgroundColor: `${typeColor}12` }]}>
          <Text style={[styles.typeInitial, { color: typeColor }]}>
            {getClaimTypeInitial(claim.type)}
          </Text>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.typeLabel}>{getClaimTypeLabel(claim.type)} Insurance</Text>
            <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(claim.status)}
              </Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={1}>{claim.title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.ref}>{claim.referenceNumber}</Text>
            <Text style={styles.separator}>·</Text>
            <Text style={styles.date}>
              {format(new Date(claim.createdAt), 'dd MMM yyyy')}
            </Text>
            <View style={styles.spacer} />
            <Text style={styles.amount}>
              ${claim.estimatedAmount.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress track */}
      {claim.status !== 'draft' && claim.status !== 'rejected' && (
        <View style={styles.progressRow}>
          {Array.from({ length: progressSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                { backgroundColor: i < progressFilled ? typeColor : Colors.divider },
              ]}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    padding: Spacing.base,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  typeInitial: {
    fontSize: Typography.md,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  typeLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  title: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ref: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  separator: {
    color: Colors.textTertiary,
    fontSize: Typography.xs,
  },
  date: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
  },
  spacer: { flex: 1 },
  amount: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: Spacing.md,
  },
  progressSegment: {
    flex: 1,
    height: 2,
    borderRadius: 2,
  },
});