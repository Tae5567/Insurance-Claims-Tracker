import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuthStore } from '../../store/useAuthStore';
import { createClaim, uploadDocument } from '../../services/firebase';
import {
  Colors,
  Spacing,
  Typography,
  Radius,
  Shadow,
  getClaimTypeColor,
  getClaimTypeLabel,
} from '../../theme';
import { ClaimType, Document } from '../../types';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { format } from 'date-fns';

// ─── Type-specific placeholder copy ──────────────────────

const TYPE_PLACEHOLDERS: Record<
  ClaimType,
  { title: string; description: string; amount: string }
> = {
  motor: {
    title: 'e.g. Rear-end collision on Victoria Island',
    description:
      'Describe the accident: where it happened, vehicles involved, damage sustained, any injuries, and whether police were notified...',
    amount: 'e.g. 450000',
  },
  home: {
    title: 'e.g. Burst pipe flooding in kitchen',
    description:
      'Describe the damage: what happened, which rooms or areas are affected, when you discovered it, and any emergency repairs already done...',
    amount: 'e.g. 120000',
  },
  health: {
    title: 'e.g. Emergency surgery at Lagos Island Hospital',
    description:
      'Describe the medical event: diagnosis, treatment received, hospital name, dates of admission and discharge, and the attending physician...',
    amount: 'e.g. 85000',
  },
  travel: {
    title: 'e.g. Flight cancellation — Lagos to London',
    description:
      'Describe the incident: flight details, reason for cancellation or delay, any baggage lost, and costs incurred (hotel, rebooking, etc.)...',
    amount: 'e.g. 200000',
  },
  life: {
    title: 'e.g. Life insurance benefit claim for John Doe',
    description:
      'Provide details of the policyholder: date of passing, cause of death, relationship to the claimant, and any supporting medical documentation available...',
    amount: 'e.g. 5000000',
  },
};

// ─── Claim type options ───────────────────────────────────

const CLAIM_TYPES: { type: ClaimType; label: string; description: string }[] = [
  { type: 'motor', label: 'Motor', description: 'Vehicle accidents & damage' },
  { type: 'home', label: 'Home', description: 'Property damage & burglary' },
  { type: 'health', label: 'Health', description: 'Medical bills & treatment' },
  { type: 'travel', label: 'Travel', description: 'Trip cancellation & luggage' },
  { type: 'life', label: 'Life', description: 'Life insurance claim' },
];

const STEPS = ['Type', 'Details', 'Documents', 'Review'];

export default function NewClaimScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [claimType, setClaimType] = useState<ClaimType>(
    route.params?.preselectedType || 'motor'
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const placeholders = TYPE_PLACEHOLDERS[claimType];

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to upload documents.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newDocs = result.assets.map((asset, index) => ({
        id: `doc_${Date.now()}_${index}`,
        uri: asset.uri,
        name: `Document_${documents.length + index + 1}.jpg`,
        type: 'image' as const,
        size: asset.fileSize || 0,
      }));
      setDocuments((prev) => [...prev, ...newDocs]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled) {
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      setDocuments((prev) => [
        ...prev,
        {
          id: `doc_${Date.now()}`,
          uri: compressed.uri,
          name: `Photo_${prev.length + 1}.jpg`,
          type: 'image',
          size: 0,
        },
      ]);
    }
  };

  const removeDocument = (id: string) =>
    setDocuments((prev) => prev.filter((d) => d.id !== id));

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const refNumber = `CLM-${Date.now().toString().slice(-8)}`;

      const uploadedDocs: Document[] = [];
      for (const doc of documents) {
        const path = `claims/${user.id}/${refNumber}/${doc.name}`;
        const cloudUrl = await uploadDocument(doc.uri, path, (progress) => {
          setUploadProgress((prev) => ({ ...prev, [doc.id]: progress }));
        });
        uploadedDocs.push({ ...doc, cloudUrl });
      }

      await createClaim({
        userId: user.id,
        type: claimType,
        title,
        description,
        incidentDate,
        estimatedAmount: parseFloat(estimatedAmount) || 0,
        status: 'submitted',
        statusHistory: [
          {
            key: 'submitted',
            label: 'Submitted',
            timestamp: new Date().toISOString(),
          },
        ],
        documents: uploadedDocs,
        messages: [],
        policyNumber: user.policyNumber,
        referenceNumber: refNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      Alert.alert(
        'Claim Submitted',
        `Reference: ${refNumber}\n\nYour claim has been received. You'll be notified as it progresses.`,
        [
          {
            text: 'View Claims',
            onPress: () => {
              // ✅ Fix: navigate to the nested tab screen correctly
              navigation.navigate('Main', { screen: 'Claims' });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Submission Failed', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!claimType;
    if (step === 1)
      return title.length > 3 && description.length > 10 && !!estimatedAmount;
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Claim</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepsRow}>
        {STEPS.map((s, i) => {
          const isDone = i < step;
          const isActive = i === step;
          return (
            <React.Fragment key={s}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isDone && styles.stepCircleDone,
                    isActive && styles.stepCircleActive,
                  ]}
                >
                  {isDone ? (
                    <Text style={styles.stepCheck}>✓</Text>
                  ) : (
                    <Text
                      style={[
                        styles.stepNum,
                        isActive && styles.stepNumActive,
                      ]}
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                  ]}
                >
                  {s}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View
                  style={[styles.stepLine, isDone && styles.stepLineDone]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Step 0: Type ── */}
        {step === 0 && (
          <View>
            <Text style={styles.stepTitle}>What type of claim?</Text>
            <Text style={styles.stepSubtitle}>
              Select the insurance category that applies
            </Text>
            {CLAIM_TYPES.map(({ type, label, description }) => {
              const color = getClaimTypeColor(type);
              const selected = claimType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeCard,
                    selected && { borderColor: color, borderWidth: 2 },
                  ]}
                  onPress={() => setClaimType(type)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.typeInitialBox,
                      { backgroundColor: `${color}12` },
                    ]}
                  >
                    <Text style={[styles.typeInitial, { color }]}>
                      {label.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.typeInfo}>
                    <Text style={styles.typeLabel}>{label} Insurance</Text>
                    <Text style={styles.typeDesc}>{description}</Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      selected && { borderColor: color },
                    ]}
                  >
                    {selected && (
                      <View style={[styles.radioDot, { backgroundColor: color }]} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Step 1: Details ── */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Claim Details</Text>
            <Text style={styles.stepSubtitle}>
              Provide information about the incident
            </Text>

            <Input
              label="Claim Title"
              value={title}
              onChangeText={setTitle}
              // ✅ Type-specific placeholder
              placeholder={placeholders.title}
            />

            {/* ✅ Fixed description field — standalone TextInput with proper styling */}
            <View style={styles.descContainer}>
              <Text style={styles.descLabel}>DESCRIPTION</Text>
              <TextInput
                style={styles.descInput}
                value={description}
                onChangeText={setDescription}
                placeholder={placeholders.description}
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <Input
              label="Date of Incident"
              value={incidentDate}
              onChangeText={setIncidentDate}
              placeholder="YYYY-MM-DD"
              hint="Format: YYYY-MM-DD"
            />
            <Input
              label="Estimated Amount (₦)"
              value={estimatedAmount}
              onChangeText={setEstimatedAmount}
              keyboardType="numeric"
              // ✅ Type-specific amount placeholder
              placeholder={placeholders.amount}
            />
          </View>
        )}

        {/* ── Step 2: Documents ── */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Supporting Documents</Text>
            <Text style={styles.stepSubtitle}>
              Upload photos of damage, receipts, or relevant documents.
              This helps speed up processing.
            </Text>

            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                <View style={styles.uploadBtnIcon}>
                  <View style={styles.cameraLens} />
                </View>
                <Text style={styles.uploadBtnLabel}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                <View style={styles.uploadBtnIcon}>
                  <View style={styles.galleryGrid}>
                    {[0, 1, 2, 3].map((i) => (
                      <View key={i} style={styles.galleryCell} />
                    ))}
                  </View>
                </View>
                <Text style={styles.uploadBtnLabel}>Gallery</Text>
              </TouchableOpacity>
            </View>

            {documents.length > 0 ? (
              <View style={styles.docList}>
                <Text style={styles.docListTitle}>
                  {documents.length} file{documents.length !== 1 ? 's' : ''} attached
                </Text>
                {documents.map((doc) => (
                  <View key={doc.id} style={styles.docRow}>
                    {doc.type === 'image' && (
                      <Image source={{ uri: doc.uri }} style={styles.docThumb} />
                    )}
                    <View style={styles.docMeta}>
                      <Text style={styles.docName} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      {uploadProgress[doc.id] !== undefined && (
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${uploadProgress[doc.id]}%` },
                            ]}
                          />
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => removeDocument(doc.id)}
                      style={styles.removeBtn}
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDocsBox}>
                <View style={styles.noDocsIcon}>
                  <View style={styles.noDocsLine} />
                  <View style={[styles.noDocsLine, { width: 28 }]} />
                  <View style={[styles.noDocsLine, { width: 20 }]} />
                </View>
                <Text style={styles.noDocsTitle}>No files attached</Text>
                <Text style={styles.noDocsText}>
                  Documents are optional but significantly speed up your claim
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Review & Submit</Text>
            <Text style={styles.stepSubtitle}>
              Confirm your claim details before submitting
            </Text>

            <View style={styles.reviewCard}>
              <ReviewRow
                label="Type"
                value={`${getClaimTypeLabel(claimType)} Insurance`}
              />
              <ReviewRow label="Title" value={title} />
              <ReviewRow label="Incident Date" value={incidentDate} />
              <ReviewRow
                label="Est. Amount"
                value={`₦${parseFloat(estimatedAmount || '0').toLocaleString()}`}
              />
              <ReviewRow
                label="Documents"
                value={`${documents.length} attached`}
              />
              <ReviewRow
                label="Policy"
                value={user?.policyNumber || ''}
                isLast
              />
            </View>

            <View style={styles.disclaimer}>
              <View style={styles.disclaimerDot} />
              <Text style={styles.disclaimerText}>
                By submitting, you confirm that all information provided is
                accurate. False or misleading claims may result in policy
                cancellation.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer navigation */}
      <View style={styles.footer}>
        {step > 0 && (
          <Button
            label="Back"
            onPress={() => setStep((s) => s - 1)}
            variant="outline"
            style={styles.footerBack}
          />
        )}
        {step < STEPS.length - 1 ? (
          <Button
            label="Continue →"
            onPress={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            style={styles.footerNext}
          />
        ) : (
          <Button
            label="Submit Claim"
            onPress={handleSubmit}
            loading={submitting}
            style={styles.footerNext}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Review row ───────────────────────────────────────────

function ReviewRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        reviewStyles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: Colors.divider },
      ]}
    >
      <Text style={reviewStyles.label}>{label}</Text>
      <Text style={reviewStyles.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  row: {
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  label: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    width: 90,
  },
  value: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'right',
  },
});

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // Steps
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  stepCircleDone: {
    borderColor: Colors.success,
    backgroundColor: Colors.success,
  },
  stepNum: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    fontWeight: '700',
  },
  stepNumActive: {
    color: Colors.white,
  },
  stepCheck: {
    fontSize: Typography.xs,
    color: Colors.white,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
    marginBottom: 16,
  },
  stepLineDone: {
    backgroundColor: Colors.success,
  },

  // Content
  content: {
    padding: Spacing.xl,
    paddingBottom: 120,
  },
  stepTitle: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },

  // Type selection
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: Spacing.md,
    ...Shadow.xs,
  },
  typeInitialBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  typeInitial: {
    fontSize: Typography.lg,
    fontWeight: '800',
  },
  typeInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  typeDesc: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // ✅ Fixed description field
  descContainer: {
    marginBottom: Spacing.base,
  },
  descLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  descInput: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
  },

  // Documents
  uploadRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  uploadBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderStyle: 'dashed',
  },
  uploadBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraLens: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 18,
    height: 18,
    gap: 2,
  },
  galleryCell: {
    width: 7,
    height: 7,
    borderRadius: 1,
    backgroundColor: Colors.accent,
  },
  uploadBtnLabel: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.accent,
  },
  docList: {
    gap: Spacing.sm,
  },
  docListTitle: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  docThumb: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
  },
  docMeta: {
    flex: 1,
  },
  docName: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.divider,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  noDocsBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  noDocsIcon: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  noDocsLine: {
    width: 36,
    height: 3,
    backgroundColor: Colors.divider,
    borderRadius: 2,
  },
  noDocsTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  noDocsText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: 20,
  },

  // Review
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  disclaimerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.warning,
    marginTop: 5,
    flexShrink: 0,
  },
  disclaimerText: {
    flex: 1,
    fontSize: Typography.xs,
    color: Colors.warning,
    lineHeight: 18,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  footerBack: {
    flex: 1,
  },
  footerNext: {
    flex: 2,
  },
});