import { ClaimStatus, ClaimType } from '../types';

export const getClaimTypeIcon = (type: ClaimType): string => {
  return getClaimTypeInitial(type);
};
// ─── Color Palette ────────────────────────────────────────


export const Colors = {
  // Brand
  primary: '#0A1628',        // Deep navy — authority, trust
  primaryMid: '#1E3A5F',     // Mid navy
  accent: '#2563EB',         // Electric blue — CTAs only
  accentLight: '#EFF6FF',    // Blue tint backgrounds

  // Status — muted, professional
  statusDraft: '#9CA3AF',
  statusSubmitted: '#2563EB',
  statusReview: '#D97706',
  statusInfoRequired: '#DC2626',
  statusApproved: '#059669',
  statusRejected: '#DC2626',
  statusPaid: '#059669',

  // Neutrals
  white: '#FFFFFF',
  background: '#F7F8FA',
  cardBg: '#FFFFFF',
  surface: '#F0F2F5',
  border: '#E4E7EB',
  borderLight: '#F3F4F6',
  divider: '#EAEDF0',

  // Text
  textPrimary: '#0A1628',
  textSecondary: '#5C6B82',
  textTertiary: '#9CAAB8',
  textInverse: '#FFFFFF',
  textAccent: '#2563EB',

  // Claim type — desaturated, professional
  motor: '#1D4ED8',
  home: '#6D28D9',
  life: '#065F46',
  travel: '#92400E',
  health: '#991B1B',

  // Functional
  success: '#059669',
  successLight: '#ECFDF5',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  error: '#DC2626',
  errorLight: '#FEF2F2',
  info: '#2563EB',
  infoLight: '#EFF6FF',
};

// ─── Typography ───────────────────────────────────────────
export const Typography = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 34,
};

// ─── Spacing ──────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// ─── Border Radius ────────────────────────────────────────
export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// ─── Shadows ──────────────────────────────────────────────
export const Shadow = {
  xs: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },
};

// ─── Helpers ──────────────────────────────────────────────

export const getStatusColor = (status: ClaimStatus): string => {
  const map: Record<ClaimStatus, string> = {
    draft: Colors.statusDraft,
    submitted: Colors.statusSubmitted,
    under_review: Colors.statusReview,
    info_required: Colors.statusInfoRequired,
    approved: Colors.statusApproved,
    rejected: Colors.statusRejected,
    paid: Colors.statusPaid,
  };
  return map[status];
};

export const getStatusLabel = (status: ClaimStatus): string => {
  const map: Record<ClaimStatus, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    info_required: 'Info Required',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Payment Sent',
  };
  return map[status];
};

export const getStatusBg = (status: ClaimStatus): string => {
  const map: Record<ClaimStatus, string> = {
    draft: Colors.surface,
    submitted: Colors.infoLight,
    under_review: Colors.warningLight,
    info_required: Colors.errorLight,
    approved: Colors.successLight,
    rejected: Colors.errorLight,
    paid: Colors.successLight,
  };
  return map[status];
};

export const getClaimTypeColor = (type: ClaimType): string => {
  return Colors[type] || Colors.accent;
};

// Clean geometric type indicators
export const getClaimTypeLabel = (type: ClaimType): string => {
  const map: Record<ClaimType, string> = {
    motor: 'Motor',
    home: 'Home',
    life: 'Life',
    travel: 'Travel',
    health: 'Health',
  };
  return map[type];
};

// Single letter abbreviation for avatar-style type indicators
export const getClaimTypeInitial = (type: ClaimType): string => {
  const map: Record<ClaimType, string> = {
    motor: 'M',
    home: 'H',
    life: 'L',
    travel: 'T',
    health: 'Hl',
  };
  return map[type];
};