import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuthStore } from '../../store/useAuthStore';
import { createClaim, uploadDocument } from '../../services/firebase';
import { Colors, Spacing, Typography, Radius, Shadow, getClaimTypeColor, getClaimTypeIcon } from '../../theme';
import { ClaimType, Document } from '../../types';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { format } from 'date-fns';

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

  // Form state
  const [claimType, setClaimType] = useState<ClaimType>(
    route.params?.preselectedType || 'motor'
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

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
      // Compress the image
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const newDoc: Document = {
        id: `doc_${Date.now()}`,
        uri: compressed.uri,
        name: `Photo_${documents.length + 1}.jpg`,
        type: 'image',
        size: 0,
      };
      setDocuments((prev) => [...prev, newDoc]);
    }
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      const refNumber = `CLM-${Date.now().toString().slice(-8)}`;

      // Upload documents first
      const uploadedDocs: Document[] = [];
      for (const doc of documents) {
        const path = `claims/${user.id}/${refNumber}/${doc.name}`;
        const cloudUrl = await uploadDocument(doc.uri, path, (progress) => {
          setUploadProgress((prev) => ({ ...prev, [doc.id]: progress }));
        });
        uploadedDocs.push({ ...doc, cloudUrl });
      }

      const claimData = {
        userId: user.id,
        type: claimType,
        title,
        description,
        incidentDate,
        estimatedAmount: parseFloat(estimatedAmount) || 0,
        status: 'submitted' as const,
        statusHistory: [
          {
            key: 'submitted' as const,
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
      };

      await createClaim(claimData);

      Alert.alert(
        '✅ Claim Submitted!',
        `Your claim has been submitted successfully.\n\nReference: ${refNumber}\n\nYou'll receive notifications as your claim is processed.`,
        [{ text: 'View Claims', onPress: () => navigation.navigate('Claims') }]
      );
    } catch (error: any) {
      Alert.alert('Submission Failed', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!claimType;
    if (step === 1) return title.length > 3 && description.length > 10 && !!estimatedAmount;
    if (step === 2) return true; // Documents optional but recommended
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

      {/* Progress steps */}
      <View style={styles.stepsContainer}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                i < step && styles.stepDone,
                i === step && styles.stepActive,
              ]}
            >
              {i < step ? (
                <Text style={styles.stepCheckmark}>✓</Text>
              ) : (
                <Text style={[styles.stepNumber, i === step && { color: Colors.white }]}>
                  {i + 1}
                </Text>
              )}
            </View>
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, i < step && styles.stepLineDone]} />
            )}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Step 0: Claim Type */}
        {step === 0 && (
          <View>
            <Text style={styles.stepTitle}>What type of claim?</Text>
            <Text style={styles.stepSubtitle}>Select the insurance category that applies</Text>
            {CLAIM_TYPES.map(({ type, label, description }) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeCard,
                  claimType === type && styles.typeCardSelected,
                  claimType === type && { borderColor: getClaimTypeColor(type) },
                ]}
                onPress={() => setClaimType(type)}
              >
                <View
                  style={[
                    styles.typeIconContainer,
                    { backgroundColor: `${getClaimTypeColor(type)}15` },
                  ]}
                >
                  <Text style={styles.typeIcon}>{getClaimTypeIcon(type)}</Text>
                </View>
                <View style={styles.typeInfo}>
                  <Text style={styles.typeLabel}>{label} Insurance</Text>
                  <Text style={styles.typeDescription}>{description}</Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    claimType === type && { borderColor: getClaimTypeColor(type) },
                  ]}
                >
                  {claimType === type && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: getClaimTypeColor(type) },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Claim Details</Text>
            <Text style={styles.stepSubtitle}>Provide information about the incident</Text>
            <Input
              label="Claim Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Vehicle collision on Main St"
              icon="📝"
            />
            <View style={styles.textAreaContainer}>
              <Text style={styles.textAreaLabel}>DESCRIPTION</Text>
              <View style={styles.textArea}>
                <Input
                  label=""
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe what happened in detail..."
                  multiline
                  numberOfLines={5}
                  style={{ paddingTop: 12 } as any}
                />
              </View>
            </View>
            <Input
              label="Date of Incident"
              value={incidentDate}
              onChangeText={setIncidentDate}
              placeholder="YYYY-MM-DD"
              icon="📅"
            />
            <Input
              label="Estimated Claim Amount ($)"
              value={estimatedAmount}
              onChangeText={setEstimatedAmount}
              keyboardType="numeric"
              placeholder="0.00"
              icon="💰"
            />
          </View>
        )}

        {/* Step 2: Documents */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Supporting Documents</Text>
            <Text style={styles.stepSubtitle}>
              Upload photos of damage, receipts, or other relevant documents
            </Text>

            <View style={styles.uploadActions}>
              <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                <Text style={styles.uploadBtnIcon}>📷</Text>
                <Text style={styles.uploadBtnText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                <Text style={styles.uploadBtnIcon}>🖼️</Text>
                <Text style={styles.uploadBtnText}>From Gallery</Text>
              </TouchableOpacity>
            </View>

            {documents.length > 0 && (
              <View style={styles.documentList}>
                <Text style={styles.docListTitle}>{documents.length} document(s) selected</Text>
                {documents.map((doc) => (
                  <View key={doc.id} style={styles.docItem}>
                    {doc.type === 'image' && (
                      <Image source={{ uri: doc.uri }} style={styles.docThumb} />
                    )}
                    <View style={styles.docInfo}>
                      <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                      {uploadProgress[doc.id] !== undefined && (
                        <View style={styles.progressBar}>
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
                      style={styles.removeDoc}
                    >
                      <Text style={styles.removeDocText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {documents.length === 0 && (
              <View style={styles.noDocuments}>
                <Text style={styles.noDocIcon}>📎</Text>
                <Text style={styles.noDocText}>
                  No documents attached yet.{'\n'}
                  Documents help speed up your claim.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Review & Submit</Text>
            <Text style={styles.stepSubtitle}>Confirm your claim details before submitting</Text>

            <View style={styles.reviewCard}>
              <ReviewRow
                label="Claim Type"
                value={`${getClaimTypeIcon(claimType)} ${claimType.charAt(0).toUpperCase() + claimType.slice(1)} Insurance`}
              />
              <ReviewRow label="Title" value={title} />
              <ReviewRow label="Incident Date" value={incidentDate} />
              <ReviewRow label="Estimated Amount" value={`$${parseFloat(estimatedAmount || '0').toLocaleString()}`} />
              <ReviewRow label="Documents" value={`${documents.length} attached`} />
              <ReviewRow label="Policy Number" value={user?.policyNumber || ''} isLast />
            </View>

            <View style={styles.reviewNote}>
              <Text style={styles.reviewNoteIcon}>ℹ️</Text>
              <Text style={styles.reviewNoteText}>
                By submitting, you confirm that all information provided is accurate and complete.
                False claims may result in policy cancellation.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation footer */}
      <View style={styles.footer}>
        {step > 0 && (
          <Button
            label="Back"
            onPress={() => setStep((s) => s - 1)}
            variant="outline"
            style={{ flex: 1 }}
          />
        )}
        {step < STEPS.length - 1 ? (
          <Button
            label="Continue →"
            onPress={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            style={{ flex: 2 }}
          />
        ) : (
          <Button
            label={submitting ? 'Submitting...' : 'Submit Claim'}
            onPress={handleSubmit}
            loading={submitting}
            style={{ flex: 2 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function ReviewRow({
  label, value, isLast = false,
}: {
  label: string; value: string; isLast?: boolean;
}) {
  return (
    <View style={[reviewStyles.row, !isLast && reviewStyles.rowBorder]}>
      <Text style={reviewStyles.label}>{label}</Text>
      <Text style={reviewStyles.value}>{value}</Text>
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  row: { paddingVertical: Spacing.md, flexDirection: 'row', justifyContent: 'space-between' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  label: { color: Colors.textSecondary, fontSize: Typography.base },
  value: { color: Colors.textPrimary, fontWeight: '600', fontSize: Typography.base, flex: 1, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: Typography.md, color: Colors.textSecondary },
  stepsContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  stepItem: { flex: 1, alignItems: 'center', flexDirection: 'row', position: 'relative' },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  stepActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  stepDone: { borderColor: Colors.success, backgroundColor: Colors.success },
  stepNumber: { fontSize: Typography.sm, color: Colors.textTertiary, fontWeight: '700' },
  stepCheckmark: { fontSize: Typography.sm, color: Colors.white, fontWeight: '700' },
  stepLabel: {
    fontSize: 9, color: Colors.textTertiary, fontWeight: '600',
    position: 'absolute', top: 30, left: 0, width: 50,
  },
  stepLabelActive: { color: Colors.primary },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: Colors.success },
  content: { padding: Spacing.xl, paddingBottom: 100 },
  stepTitle: { fontSize: Typography.xxl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  stepSubtitle: { fontSize: Typography.base, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 22 },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border, ...Shadow.sm,
  },
  typeCardSelected: { borderWidth: 2 },
  typeIconContainer: {
    width: 48, height: 48, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  typeIcon: { fontSize: 24 },
  typeInfo: { flex: 1 },
  typeLabel: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  typeDescription: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  textAreaContainer: { marginBottom: Spacing.base },
  textAreaLabel: {
    fontSize: Typography.xs, fontWeight: '700', color: Colors.textSecondary,
    marginBottom: Spacing.xs, letterSpacing: 0.5,
  },
  textArea: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  uploadActions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  uploadBtn: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center', borderWidth: 1.5,
    borderColor: Colors.primary, borderStyle: 'dashed', ...Shadow.sm,
  },
  uploadBtnIcon: { fontSize: 28, marginBottom: Spacing.sm },
  uploadBtnText: { fontSize: Typography.base, fontWeight: '700', color: Colors.primary },
  documentList: { marginTop: Spacing.base },
  docListTitle: {
    fontSize: Typography.sm, fontWeight: '700', color: Colors.textSecondary,
    marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  docItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm,
    gap: Spacing.md, ...Shadow.sm,
  },
  docThumb: { width: 44, height: 44, borderRadius: Radius.sm },
  docInfo: { flex: 1 },
  docName: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  progressBar: {
    height: 4, backgroundColor: Colors.borderLight,
    borderRadius: 2, marginTop: 4, overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  removeDoc: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  removeDocText: { fontSize: Typography.sm, color: Colors.textSecondary },
  noDocuments: {
    alignItems: 'center', padding: Spacing.xxxl,
    backgroundColor: Colors.white, borderRadius: Radius.xl, ...Shadow.sm,
  },
  noDocIcon: { fontSize: 40, marginBottom: Spacing.md },
  noDocText: {
    fontSize: Typography.base, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },
  reviewCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadow.md,
  },
  reviewNote: {
    flexDirection: 'row', gap: Spacing.sm, backgroundColor: `${Colors.warning}15`,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  reviewNoteIcon: { fontSize: 16 },
  reviewNoteText: { flex: 1, fontSize: Typography.sm, color: Colors.warning, lineHeight: 18 },
  footer: {
    flexDirection: 'row', gap: Spacing.sm, padding: Spacing.xl,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
  },
});