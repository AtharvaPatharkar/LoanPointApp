import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Image,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { LoanApplication, ApplicationStatus } from '../../types';
import { formatINR } from '../../utils/calculator';
import { BankLogo } from '../common/BankLogo';
import { LoanIcon } from '../common/LoanIcon';

interface ApplicationDetailScreenProps {
  application: LoanApplication;
  onBack: () => void;
  onApplicationUpdated?: (updated: LoanApplication) => void;
}

interface StepMilestone {
  key: string;
  stepNumber: string;
  title: string;
  description: string;
}

const TIMELINE_STEPS: StepMilestone[] = [
  {
    key: 'sent',
    stepNumber: '1',
    title: 'Application Sent',
    description: 'Loan application submitted successfully from mobile app',
  },
  {
    key: 'received',
    stepNumber: '2',
    title: 'Enquiry Received',
    description: 'Application received and verified by Loan Point executive',
  },
  {
    key: 'verification',
    stepNumber: '3',
    title: 'Document & Assessment',
    description: 'Underwriting and lender eligibility evaluation in progress',
  },
  {
    key: 'approval',
    stepNumber: '4',
    title: 'Bank Approval & Sanction',
    description: 'Sanction letter issued by partner lending institution',
  },
  {
    key: 'disbursed',
    stepNumber: '5',
    title: 'Loan Disbursed',
    description: 'Funds successfully credited into applicant bank account',
  },
];

export const ApplicationDetailScreen: React.FC<ApplicationDetailScreenProps> = ({
  application,
  onBack,
}) => {
  const [currentApp] = useState<LoanApplication>(application);

  const getStageIndex = (status: ApplicationStatus): number => {
    if (status === 'Disbursed') return 4;
    if (status === 'Approved') return 3;
    if (status === 'Processing') return 2;
    if (status === 'Documents Pending' || status === 'Application Submitted') return 2;
    if (status === 'Enquiry Received') return 1;
    return 0; // Sent
  };

  const currentStepIndex = getStageIndex(currentApp.status);

  const handleShareReceipt = async () => {
    const textContent = `
LOAN POINT FINANCIAL SERVICES
Application Reference: ${currentApp.id}
Loan Type: ${currentApp.loanTypeName}
Requested Amount: ${formatINR(currentApp.requestedAmount)}
Current Status: ${currentApp.status}
Submission Date: ${currentApp.submissionDate || 'N/A'}
Contact Support: +91 95455 55999
`.trim();

    try {
      await Share.share({
        message: textContent,
        title: `LoanPoint_Application_${currentApp.id}`,
      });
    } catch {
      Alert.alert('Share', 'Could not open share sheet');
    }
  };

  const handleCallAdvisor = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Calling Support', `Please call ${phone}`);
    });
  };

  const handleWhatsAppAdvisor = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${name || 'Team'}, I am inquiring regarding my loan application (${currentApp.id}) for ${currentApp.loanTypeName}.`
    );
    Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${text}`).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`);
    });
  };

  const managerName = currentApp.assignedManager?.name || 'Loan Officer';
  const managerPhone = currentApp.assignedManager?.phone || '+91 95455 55999';
  const managerRole = currentApp.assignedManager?.role || 'Relationship Advisor';

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Main Application Card */}
      <View style={styles.card}>
        <View style={styles.topHeaderRow}>
          <LoanIcon
            type={currentApp.loanType}
            name={currentApp.loanTypeName}
            useAssetImage={true}
            size={34}
            containerSize={48}
            borderRadius={12}
          />

          <View style={styles.headerInfoCol}>
            <Text style={styles.loanHeading}>{currentApp.loanTypeName}</Text>
            <View style={styles.idBadgePill}>
              <Text style={styles.appIdText}>Application ID: {currentApp.id}</Text>
            </View>
          </View>

          <View
            style={
              currentApp.status === 'Disbursed'
                ? styles.disbursedPill
                : currentApp.status === 'Rejected'
                ? styles.rejectedPill
                : styles.inProgressPill
            }
          >
            <Text
              style={
                currentApp.status === 'Disbursed'
                  ? styles.disbursedPillText
                  : currentApp.status === 'Rejected'
                  ? styles.rejectedPillText
                  : styles.inProgressPillText
              }
            >
              {currentApp.status}
            </Text>
          </View>
        </View>

        {/* 3-Column Financial Overview Grid */}
        <View style={styles.summaryGrid}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>Loan Amount</Text>
            <Text style={styles.gridValueHighlight}>{formatINR(currentApp.requestedAmount)}</Text>
          </View>

          <View style={styles.gridDivider} />

          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>Tenure</Text>
            <Text style={styles.gridValue}>
              {currentApp.tenureYears
                ? currentApp.tenureYears
                : currentApp.tenureMonths
                ? `${Math.round(currentApp.tenureMonths / 12)} Years`
                : '—'}
            </Text>
          </View>

          <View style={styles.gridDivider} />

          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>Bank / Partner</Text>
            {currentApp.bankName ? (
              <View style={styles.bankValueRow}>
                <BankLogo bank={currentApp.bankName} width={16} height={16} />
                <Text style={styles.gridValue} numberOfLines={1}>
                  {currentApp.bankName}
                </Text>
              </View>
            ) : (
              <Text style={styles.gridValueMuted}>Under Partner Review</Text>
            )}
          </View>
        </View>

        {/* Date Row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color="#64748b" />
            <Text style={styles.metaText}>Submitted: {currentApp.submissionDate || 'Recently'}</Text>
          </View>
          {currentApp.statusUpdatedDate ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color="#64748b" />
              <Text style={styles.metaText}>Updated: {currentApp.statusUpdatedDate}</Text>
            </View>
          ) : null}
        </View>

        {/* Next Action / Remarks Banner */}
        {(currentApp.remarks || currentApp.nextAction) ? (
          <View style={styles.actionNoteBox}>
            <Ionicons name="information-circle" size={17} color="#0284c7" />
            <Text style={styles.actionNoteText}>
              {currentApp.remarks || currentApp.nextAction}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Application Status Timeline */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="git-commit-outline" size={18} color="#003399" />
          <Text style={styles.sectionTitle}>APPLICATION STATUS TIMELINE</Text>
        </View>

        <View style={styles.timelineList}>
          {TIMELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isLast = idx === TIMELINE_STEPS.length - 1;

            return (
              <View key={step.key} style={styles.timelineRow}>
                {/* Left Indicator Column */}
                <View style={styles.timelineIndicatorCol}>
                  {isCompleted ? (
                    <View style={styles.dotCompleted}>
                      <Ionicons name="checkmark" size={13} color="#ffffff" />
                    </View>
                  ) : isCurrent ? (
                    <View style={styles.dotCurrentRing}>
                      <View style={styles.dotCurrentCenter} />
                    </View>
                  ) : (
                    <View style={styles.dotUpcoming}>
                      <Text style={styles.dotUpcomingNumber}>{step.stepNumber}</Text>
                    </View>
                  )}

                  {!isLast && (
                    <View
                      style={[
                        styles.timelineConnector,
                        isCompleted ? styles.connectorCompleted : styles.connectorPending,
                      ]}
                    />
                  )}
                </View>

                {/* Right Content Column */}
                <View style={[styles.timelineBody, !isLast && { paddingBottom: 20 }]}>
                  <View style={styles.stepTitleRow}>
                    <Text
                      style={[
                        styles.stepTitleText,
                        isCurrent && styles.stepTitleCurrent,
                        isCompleted && styles.stepTitleCompleted,
                      ]}
                    >
                      {step.stepNumber}. {step.title}
                    </Text>

                    {isCurrent && (
                      <View style={styles.currentStageTag}>
                        <Text style={styles.currentStageTagText}>Current Stage</Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.stepDescriptionText,
                      (isCurrent || isCompleted) && styles.stepDescActive,
                    ]}
                  >
                    {step.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Assigned Relationship Manager Card */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="person-circle-outline" size={18} color="#003399" />
          <Text style={styles.sectionTitle}>ASSIGNED RELATIONSHIP ADVISOR</Text>
        </View>

        <View style={styles.advisorProfileRow}>
          <View style={styles.advisorAvatar}>
            <Image
              source={require('../../../assets/logo/arvind_patil.png')}
              style={styles.advisorAvatarImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.advisorInfo}>
            <Text style={styles.advisorName}>{managerName}</Text>
            <Text style={styles.advisorRole}>{managerRole}</Text>
            <Text style={styles.advisorHours}>Available: 24/7 (Always Available for Assistance)</Text>
          </View>
        </View>

        <View style={styles.advisorActionsRow}>
          <TouchableOpacity
            style={styles.callAdvisorBtn}
            onPress={() => handleCallAdvisor(managerPhone)}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={15} color="#ffffff" />
            <Text style={styles.actionBtnText}>Call {managerPhone}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsappAdvisorBtn}
            onPress={() => handleWhatsAppAdvisor(managerPhone, managerName)}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="whatsapp" size={16} color="#ffffff" />
            <Text style={styles.actionBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Share / Export Receipt Button */}
      <TouchableOpacity
        style={styles.shareReceiptBtn}
        onPress={handleShareReceipt}
        activeOpacity={0.8}
      >
        <Ionicons name="share-social-outline" size={18} color="#003399" />
        <Text style={styles.shareReceiptText}>Share / Export Loan Application Details</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 36,
    gap: 14,
    backgroundColor: '#f8fafc',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerInfoCol: {
    flex: 1,
  },
  loanHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002e75',
    marginBottom: 4,
  },
  idBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  appIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  inProgressPill: {
    backgroundColor: '#fef08a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fde047',
  },
  inProgressPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#854d0e',
  },
  disbursedPill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  disbursedPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  rejectedPill: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  rejectedPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b91c1c',
  },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginTop: 14,
  },
  gridCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e2e8f0',
  },
  gridLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 3,
  },
  gridValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  gridValueHighlight: {
    fontSize: 13,
    fontWeight: '900',
    color: '#003399',
  },
  gridValueMuted: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
  },
  bankValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  actionNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  actionNoteText: {
    fontSize: 11.5,
    color: '#0369a1',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#002e75',
    letterSpacing: 0.5,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  dotCompleted: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCurrentRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#eab308',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCurrentCenter: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#eab308',
  },
  dotUpcoming: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotUpcomingNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    minHeight: 28,
  },
  connectorCompleted: {
    backgroundColor: '#16a34a',
  },
  connectorPending: {
    backgroundColor: '#e2e8f0',
  },
  timelineBody: {
    flex: 1,
    paddingLeft: 12,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  stepTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  stepTitleCurrent: {
    color: '#002e75',
    fontWeight: '800',
  },
  stepTitleCompleted: {
    color: '#0f172a',
    fontWeight: '700',
  },
  currentStageTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  currentStageTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#92400e',
  },
  stepDescriptionText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 15,
  },
  stepDescActive: {
    color: '#475569',
  },
  advisorProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  advisorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#003399',
  },
  advisorAvatarImage: {
    width: '100%',
    height: '100%',
  },
  advisorInfo: {
    flex: 1,
  },
  advisorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  advisorRole: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  advisorHours: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  advisorActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callAdvisorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#003399',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  whatsappAdvisorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  shareReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#003399',
    borderRadius: 12,
    paddingVertical: 13,
    gap: 8,
  },
  shareReceiptText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#003399',
  },
});
