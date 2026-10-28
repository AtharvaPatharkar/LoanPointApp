import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { LoanApplication, ApplicationStatus } from '../../types';
import { formatINR } from '../../utils/calculator';
import { loanService } from '../../services/loanService';
import { COMPANY_INFO } from '../../data/mockData';
import { colors } from '../../theme/colors';

interface ApplicationDetailScreenProps {
  application: LoanApplication;
  onBack: () => void;
  onApplicationUpdated?: (updated: LoanApplication) => void;
}

export const ApplicationDetailScreen: React.FC<ApplicationDetailScreenProps> = ({
  application,
  onBack,
  onApplicationUpdated,
}) => {
  const [currentApp, setCurrentApp] = useState<LoanApplication>(application);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const STATUS_STEPS: ApplicationStatus[] = [
    'Enquiry Received',
    'Documents Pending',
    'Application Submitted',
    'Processing',
    'Approved',
    'Disbursed',
  ];

  const currentStepIndex = STATUS_STEPS.indexOf(currentApp.status);

  const handleSimulateDocUpload = async (docName: string) => {
    try {
      setUploadingDoc(docName);
      await new Promise((r) => setTimeout(r, 600));

      const updated = await loanService.attachDocumentToApplication(currentApp.id, docName);
      setCurrentApp(updated);
      if (onApplicationUpdated) onApplicationUpdated(updated);
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleShareReceipt = async () => {
    const textContent = `
LOAN POINT — FINANCIAL SERVICES (NANDED)
Customer Service Acknowledgment Receipt
Date: ${new Date().toLocaleDateString('en-IN')}
Reference ID: ${currentApp.id}
Product: ${currentApp.loanTypeName}
Requested Amount: ${formatINR(currentApp.requestedAmount)}
Status: ${currentApp.status}
Advisor: ${COMPANY_INFO.leadRelationshipManager} (${COMPANY_INFO.contactNumber})
Office: Shop 57, Alibhai Tower, Shivaji Nagar, Nanded
`.trim();

    try {
      await Share.share({
        message: textContent,
        title: `LoanPoint_Acknowledgment_${currentApp.id}`,
      });
    } catch {
      Alert.alert('Share', 'Could not open share sheet');
    }
  };

  const handleCallAdvisor = () => {
    Linking.openURL(`tel:${COMPANY_INFO.contactPhoneRaw}`).catch(() => {
      Alert.alert('Calling Advisor', `Call Arvind Patil at ${COMPANY_INFO.contactNumber}`);
    });
  };

  const handleWhatsAppAdvisor = () => {
    const msg = encodeURIComponent(
      `Hello ${COMPANY_INFO.leadRelationshipManager}, regarding my application ${currentApp.id} for ${currentApp.loanTypeName}.`
    );
    Linking.openURL(`whatsapp://send?phone=91${COMPANY_INFO.contactPhoneRaw}&text=${msg}`).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=91${COMPANY_INFO.contactPhoneRaw}&text=${msg}`);
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Banner Card */}
      <View style={styles.card}>
        <View style={styles.bannerHeaderRow}>
          <View>
            <View style={styles.idRow}>
              <Text style={styles.appIdText}>{currentApp.id}</Text>
              <View style={styles.demoBadge}>
                <Text style={styles.demoBadgeText}>DEMO RECORD</Text>
              </View>
            </View>
            <Text style={styles.loanHeading}>{currentApp.loanTypeName}</Text>
            <Text style={styles.datesSub}>
              Submitted on {currentApp.submissionDate} · Updated {currentApp.statusUpdatedDate}
            </Text>
          </View>

          <View style={styles.amountCol}>
            <Text style={styles.metaLabel}>Requested</Text>
            <Text style={styles.amountVal}>{formatINR(currentApp.requestedAmount)}</Text>
            <Text style={styles.tenureVal}>{currentApp.tenureMonths} Months</Text>
          </View>
        </View>
      </View>

      {/* Progress Stepper Timeline */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>APPLICATION STATUS TIMELINE</Text>

        <View style={styles.timelineList}>
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <View key={step} style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    isCompleted && styles.dotCompleted,
                    isCurrent && styles.dotCurrent,
                  ]}
                >
                  <Text style={[styles.dotNumber, (isCompleted || isCurrent) && styles.textWhite]}>
                    {isCompleted ? '✓' : idx + 1}
                  </Text>
                </View>

                <View style={styles.timelineContent}>
                  <View style={styles.stepTitleRow}>
                    <Text
                      style={[
                        styles.stepTitle,
                        isCurrent && styles.stepTitleCurrent,
                        isCompleted && styles.stepTitleCompleted,
                      ]}
                    >
                      {step}
                    </Text>
                    {isCurrent && (
                      <View style={styles.currentStageBadge}>
                        <Text style={styles.currentStageText}>Current Stage</Text>
                      </View>
                    )}
                  </View>

                  {isCurrent && (
                    <View style={styles.currentActionBox}>
                      <Text style={styles.currentActionText}>{currentApp.nextAction}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Assigned Relationship Manager Card */}
      {currentApp.assignedManager && (
        <View style={styles.card}>
          <View style={styles.advisorHeaderRow}>
            <Text style={styles.sectionTitle}>ASSIGNED LOAN ADVISOR</Text>
            <View style={styles.branchTag}>
              <Text style={styles.branchTagText}>Shivaji Nagar Branch</Text>
            </View>
          </View>

          <View style={styles.advisorProfileRow}>
            <View style={styles.advisorAvatar}>
              <Ionicons name="person" size={20} color={colors.primary} />
            </View>
            <View style={styles.advisorInfo}>
              <Text style={styles.advisorName}>{currentApp.assignedManager.name}</Text>
              <Text style={styles.advisorRole}>{currentApp.assignedManager.role}</Text>
              <Text style={styles.advisorHours}>Available: Mon–Sat 10:00 AM – 7:00 PM</Text>
            </View>
          </View>

          <View style={styles.advisorActionsRow}>
            <TouchableOpacity
              style={styles.callAdvisorBtn}
              onPress={handleCallAdvisor}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={14} color={colors.white} />
              <Text style={styles.actionBtnText}>Call Advisor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappAdvisorBtn}
              onPress={handleWhatsAppAdvisor}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={14} color={colors.white} />
              <Text style={styles.actionBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Pending Documents Verification Checklist */}
      <View style={styles.card}>
        <View style={styles.pendingHeaderRow}>
          <Text style={styles.sectionTitle}>REQUIRED DOCUMENTS</Text>
          <Text style={styles.pendingCountText}>
            {currentApp.pendingDocuments.length} pending
          </Text>
        </View>

        {currentApp.pendingDocuments.length === 0 ? (
          <View style={styles.allDoneBox}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.allDoneText}>All primary documents submitted & verified!</Text>
          </View>
        ) : (
          <View style={styles.docsList}>
            {currentApp.pendingDocuments.map((doc) => (
              <View key={doc} style={styles.docItemRow}>
                <View style={styles.docItemLeft}>
                  <Ionicons name="alert-circle" size={16} color="#d97706" />
                  <Text style={styles.docItemName}>{doc}</Text>
                </View>

                <TouchableOpacity
                  style={styles.quickUploadBtn}
                  onPress={() => handleSimulateDocUpload(doc)}
                  disabled={uploadingDoc === doc}
                  activeOpacity={0.7}
                >
                  {uploadingDoc === doc ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={12} color={colors.primary} />
                      <Text style={styles.quickUploadText}>Upload</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Submitted Documents */}
        {currentApp.submittedDocuments.length > 0 && (
          <View style={styles.submittedBox}>
            <Text style={styles.submittedTitle}>Submitted Documents ({currentApp.submittedDocuments.length}):</Text>
            {currentApp.submittedDocuments.map((doc, idx) => (
              <View key={idx} style={styles.submittedItemRow}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={styles.submittedItemText}>{doc}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Share / Download Receipt CTA */}
      <TouchableOpacity
        style={styles.shareReceiptBtn}
        onPress={handleShareReceipt}
        activeOpacity={0.8}
      >
        <Ionicons name="share-social-outline" size={16} color={colors.primary} />
        <Text style={styles.shareReceiptText}>Share / Export Acknowledgment Receipt</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    elevation: 1,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  demoBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  demoBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textLight,
  },
  loanHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  datesSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  amountVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 1,
  },
  tenureVal: {
    fontSize: 10,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  timelineList: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 10,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCompleted: {
    backgroundColor: '#059669',
  },
  dotCurrent: {
    backgroundColor: colors.primary,
  },
  dotNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  textWhite: {
    color: colors.white,
  },
  timelineContent: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  stepTitleCurrent: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  stepTitleCompleted: {
    color: colors.text,
    fontWeight: '700',
  },
  currentStageBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  currentStageText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  currentActionBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  currentActionText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  advisorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  branchTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  branchTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  advisorProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  advisorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisorInfo: {
    flex: 1,
  },
  advisorName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  advisorRole: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  advisorHours: {
    fontSize: 9,
    color: colors.textLight,
    marginTop: 1,
  },
  advisorActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  callAdvisorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  whatsappAdvisorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  pendingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingCountText: {
    fontSize: 10,
    color: colors.accentGold,
    fontWeight: '700',
  },
  allDoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  allDoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  docsList: {
    gap: 8,
  },
  docItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 8,
  },
  docItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 6,
  },
  docItemName: {
    fontSize: 11,
    color: colors.text,
    flex: 1,
  },
  quickUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  quickUploadText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  submittedBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  submittedTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 2,
  },
  submittedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submittedItemText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  shareReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  shareReceiptText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
