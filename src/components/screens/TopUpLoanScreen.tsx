import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { UserProfile, LoanApplication } from '../../types';

interface TopUpLoanScreenProps {
  user?: UserProfile | null;
  application?: LoanApplication | null;
  onBack: () => void;
  onApplySuccess?: () => void;
  onTrackRequest?: (reqId: string) => void;
  onOpenCall?: (phone: string) => void;
  onOpenWhatsApp?: (phone: string, text?: string) => void;
}

const PURPOSE_OPTIONS = [
  'Home Renovation',
  'Business Expansion',
  'Medical Emergency',
  'Debt Consolidation',
  'Education Expenses',
  'Wedding / Family Function',
  'Personal Expenses',
];

export const TopUpLoanScreen: React.FC<TopUpLoanScreenProps> = ({
  user,
  application,
  onBack,
  onApplySuccess,
  onTrackRequest,
  onOpenCall,
  onOpenWhatsApp,
}) => {
  // Existing Loan details from reference image
  const existingAppId = application?.id || 'HL-20260915-0087';
  const loanTypeName = application?.loanTypeName || 'Home Loan';
  const bankName = application?.bankName || 'HDFC Bank';
  const currentLoanAmount = '₹50,00,000';
  const balanceTenure = '18 Years';
  const currentEmi = '₹43,476';

  const rmName = application?.assignedManager?.name || 'Arvind Patil';
  const rmPhone = application?.assignedManager?.phone || '+91 9545555999';

  // Screen View: 'form' | 'submitted' | 'track_status'
  const [screenView, setScreenView] = useState<'form' | 'submitted' | 'track_status'>('form');

  // Top Up Form State
  const [topUpAmount, setTopUpAmount] = useState<string>('15,00,000');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('Home Renovation');
  const [showPurposeModal, setShowPurposeModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const topUpRequestId = 'TU-20261112-0045';
  const submissionTimestamp = '12 Nov 2026, 09:41 AM';

  // Formatting amount
  const handleAmountChange = (text: string) => {
    const cleanDigits = text.replace(/[^0-9]/g, '');
    if (!cleanDigits) {
      setTopUpAmount('');
      return;
    }
    const num = parseInt(cleanDigits, 10);
    setTopUpAmount(num.toLocaleString('en-IN'));
  };

  const handleCallRM = (phone: string) => {
    if (onOpenCall) {
      onOpenCall(phone);
    } else {
      Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
    }
  };

  const handleWhatsAppRM = (phone: string, name: string) => {
    const text = `Hello ${name}, I am following up on my Top Up Request for ${loanTypeName} (${existingAppId}).`;
    if (onOpenWhatsApp) {
      onOpenWhatsApp(phone, text);
    } else {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`);
    }
  };

  const handleCopyRequestId = () => {
    setCopiedNotification(true);
    setTimeout(() => {
      setCopiedNotification(false);
    }, 2000);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      // Transition directly to "Top Up Request Submitted" screen
      setScreenView('submitted');
    }, 500);
  };

  const handleTrack = () => {
    // Transition to the Track Status view matching the user's latest reference image
    setScreenView('track_status');
  };

  const handleBackToMyLoans = () => {
    if (onApplySuccess) onApplySuccess();
    else onBack();
  };

  // =========================================================================
  // VIEW 3: TRACK STATUS SCREEN (MATCHING USER REFERENCE IMAGE "Top Up Request - Track Status")
  // =========================================================================
  if (screenView === 'track_status') {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.scrollContentTrack}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Title with Back button and Coin Icon */}
          <View style={styles.trackStatusHeaderRow}>
            <TouchableOpacity
              style={styles.trackBackArrowBtn}
              onPress={() => setScreenView('submitted')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#002e75" />
            </TouchableOpacity>

            <View style={styles.trackTitleCoinsWrap}>
              <MaterialCommunityIcons name="cash-plus" size={26} color="#d97706" />
            </View>
            <Text style={styles.trackStatusHeaderTitle}>Top Up Request – Track Status</Text>
          </View>

          {/* 1. Home Loan – Top Up Summary Card */}
          <View style={styles.trackSummaryCard}>
            {/* Header: House in Squircle + Home Loan - Top Up / Request ID + In Process Pill */}
            <View style={styles.trackCardHeaderRow}>
              <View style={styles.homeIconBox}>
                <Ionicons name="home-outline" size={26} color="#002e75" />
              </View>

              <View style={styles.trackTitleCol}>
                <Text style={styles.trackMainTitleText}>Home Loan – Top Up</Text>
                <View style={styles.trackRequestIdPill}>
                  <Text style={styles.trackRequestIdPillText}>Request ID: {topUpRequestId}</Text>
                </View>
              </View>

              {/* Green In Process Pill with circular sync arrows */}
              <View style={styles.inProcessGreenPill}>
                <Ionicons name="sync-outline" size={14} color="#15803d" style={{ marginRight: 4 }} />
                <Text style={styles.inProcessGreenPillText}>In Process</Text>
              </View>
            </View>

            {/* 3 Metric Columns: Bank Name | Top Up Amount | Requested On */}
            <View style={styles.trackThreeMetricsRow}>
              {/* Col 1: Bank Name */}
              <View style={[styles.trackMetricCell, styles.cellBorderRight]}>
                <Ionicons name="business-outline" size={24} color="#004aad" style={{ alignSelf: 'center', marginBottom: 2 }} />
                <Text style={styles.trackBankNameText}>{bankName}</Text>
              </View>

              {/* Col 2: Top Up Amount */}
              <View style={[styles.trackMetricCell, styles.cellBorderRight]}>
                <View style={styles.trackMetricHeaderRow}>
                  <View style={styles.moneyBagIconCircle}>
                    <Text style={styles.moneyBagSymbol}>₹</Text>
                  </View>
                  <Text style={styles.trackMetricLabel}>Top Up Amount</Text>
                </View>
                <Text style={styles.trackMetricBoldValue}>₹{topUpAmount || '15,00,000'}</Text>
              </View>

              {/* Col 3: Requested On */}
              <View style={styles.trackMetricCell}>
                <View style={styles.trackMetricHeaderRow}>
                  <Ionicons name="calendar-outline" size={16} color="#d97706" />
                  <Text style={styles.trackMetricLabel}>Requested On</Text>
                </View>
                <Text style={styles.trackMetricBoldValue}>12 Nov 2026</Text>
              </View>
            </View>

            {/* Current Loan >> Revised Loan (Est.) Banner Strip */}
            <View style={styles.loanComparisonStrip}>
              {/* Left: Current Loan */}
              <View style={styles.comparisonItem}>
                <View style={styles.comparisonCoinsIconWrap}>
                  <MaterialCommunityIcons name="cash-multiple" size={22} color="#d97706" />
                </View>
                <View>
                  <Text style={styles.comparisonLabel}>Current Loan</Text>
                  <Text style={styles.comparisonAmountBold}>₹50,00,000</Text>
                </View>
              </View>

              {/* Center: >> Arrow */}
              <Text style={styles.comparisonArrow}>»</Text>

              {/* Right: Revised Loan (Est.) */}
              <View style={styles.comparisonItem}>
                <View style={styles.comparisonCoinsIconWrap}>
                  <MaterialCommunityIcons name="cash-plus" size={22} color="#d97706" />
                </View>
                <View>
                  <Text style={styles.comparisonLabel}>Revised Loan (Est.)</Text>
                  <Text style={styles.comparisonAmountBold}>₹65,00,000</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 2. Application Progress Card */}
          <View style={styles.sectionCard}>
            {/* Overlapping Pill: Application Progress */}
            <View style={styles.sectionHeaderTab}>
              <Text style={styles.sectionHeaderText}>Application Progress</Text>
            </View>

            {/* 4-Step Stepper with Active Highlighting on Step 3: Lender Assessment (In Process) */}
            <View style={styles.trackStepperRow}>
              {/* Node 1: Request Submitted (Green Check) */}
              <View style={styles.trackNodeItem}>
                <View style={styles.greenCheckCircle}>
                  <Ionicons name="checkmark" size={13} color="#ffffff" />
                </View>
                <Text style={styles.trackNodeLabelBold}>Request{'\n'}Submitted</Text>
                <Text style={styles.trackNodeTimestamp}>12 Nov, 09:41 AM</Text>
              </View>

              {/* Green Connector 1 */}
              <View style={styles.stepperLineGreen} />

              {/* Node 2: Eligibility Check (Green Check) */}
              <View style={styles.trackNodeItem}>
                <View style={styles.greenCheckCircle}>
                  <Ionicons name="checkmark" size={13} color="#ffffff" />
                </View>
                <Text style={styles.trackNodeLabelBold}>Eligibility{'\n'}Check</Text>
                <Text style={styles.trackNodeTimestamp}>12 Nov, 11:30 AM</Text>
              </View>

              {/* Green Connector 2 */}
              <View style={styles.stepperLineGreen} />

              {/* Node 3: Lender Assessment (Active Light Blue Pill) */}
              <View style={styles.trackNodeItemActive}>
                <View style={styles.blueActiveOuterCircle}>
                  <View style={styles.blueActiveInnerDot} />
                </View>
                <View style={styles.inProcessPillBadge}>
                  <Text style={styles.inProcessPillLabel}>Lender{'\n'}Assessment</Text>
                  <Text style={styles.inProcessPillSub}>(In Process)</Text>
                </View>
              </View>

              {/* Gray Connector 3 */}
              <View style={styles.stepperLineGray} />

              {/* Node 4: Approval & Disbursement */}
              <View style={styles.trackNodeItem}>
                <View style={styles.grayOutlineCircle} />
                <Text style={styles.trackNodeLabelGray}>Approval &{'\n'}Disbursement</Text>
              </View>
            </View>

            {/* Current Update Callout Banner */}
            <View style={styles.currentUpdateBanner}>
              <View style={styles.updateDocIconCircle}>
                <Ionicons name="document-text" size={18} color="#ffffff" />
              </View>
              <View style={styles.updateContentCol}>
                <Text style={styles.updateTitle}>Current Update</Text>
                <Text style={styles.updateDescription}>
                  Your top up request is under lender assessment. We will update you once the decision is received.
                </Text>
              </View>
            </View>
          </View>

          {/* 3. Relationship Manager (RM) Bar */}
          <View style={styles.rmPillContainer}>
            <View style={styles.rmNameSection}>
              <Ionicons name="person-outline" size={18} color="#004aad" style={{ marginRight: 6 }} />
              <View>
                <Text style={styles.rmRoleSmallText}>Relationship Manager (RM)</Text>
                <Text style={styles.rmNameBold}>{rmName}</Text>
              </View>
            </View>

            <View style={styles.rmVerticalDivider} />

            <TouchableOpacity
              style={styles.rmCallAction}
              onPress={() => handleCallRM(rmPhone)}
              activeOpacity={0.75}
            >
              <View style={styles.rmCallCircle}>
                <Ionicons name="call" size={11} color="#ffffff" />
              </View>
              <Text style={styles.rmPhoneText}>{rmPhone}</Text>
            </TouchableOpacity>

            <View style={styles.rmVerticalDivider} />

            <TouchableOpacity
              style={styles.rmWhatsappAction}
              onPress={() => handleWhatsAppRM(rmPhone, rmName)}
              activeOpacity={0.75}
            >
              <FontAwesome5 name="whatsapp" size={18} color="#16a34a" style={{ marginRight: 5 }} />
              <Text style={styles.rmWhatsappText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {/* 4. 4 Quick Action Buttons Grid */}
          <View style={styles.quickActionsGridRow}>
            {/* Action 1: View Request Details */}
            <TouchableOpacity
              style={styles.actionGridButton}
              activeOpacity={0.75}
              onPress={() => setScreenView('submitted')}
            >
              <Ionicons name="document-text-outline" size={20} color="#002e75" />
              <Text style={styles.actionGridButtonText}>View Request{'\n'}Details</Text>
            </TouchableOpacity>

            {/* Action 2: Upload Documents */}
            <TouchableOpacity
              style={styles.actionGridButton}
              activeOpacity={0.75}
              onPress={() => {
                Alert.alert('Upload Documents', 'All required documents have been uploaded for this top up request.');
              }}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#002e75" />
              <Text style={styles.actionGridButtonText}>Upload{'\n'}Documents</Text>
            </TouchableOpacity>

            {/* Action 3: Message to RM */}
            <TouchableOpacity
              style={styles.actionGridButton}
              activeOpacity={0.75}
              onPress={() => handleWhatsAppRM(rmPhone, rmName)}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#002e75" />
              <Text style={styles.actionGridButtonText}>Message to{'\n'}RM</Text>
            </TouchableOpacity>

            {/* Action 4: Cancel Request */}
            <TouchableOpacity
              style={styles.actionGridButton}
              activeOpacity={0.75}
              onPress={() => {
                Alert.alert(
                  'Cancel Top Up Request',
                  'Are you sure you want to cancel this Top Up Request?',
                  [
                    { text: 'No', style: 'cancel' },
                    { text: 'Yes, Cancel', style: 'destructive', onPress: handleBackToMyLoans },
                  ]
                );
              }}
            >
              <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
              <Text style={[styles.actionGridButtonText, { color: '#dc2626' }]}>Cancel{'\n'}Request</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Floating Button: [< Back to My Loans] */}
        <View style={styles.bottomBarContainer}>
          <TouchableOpacity
            style={styles.backToMyLoansLargeBtn}
            onPress={handleBackToMyLoans}
            activeOpacity={0.88}
          >
            <Ionicons name="chevron-back" size={18} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.backToMyLoansLargeBtnText}>Back to My Loans</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =========================================================================
  // VIEW 2: SUBMITTED SUCCESS SCREEN (MATCHING USER REFERENCE IMAGE)
  // =========================================================================
  if (screenView === 'submitted') {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.scrollContentSuccess}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Large Circular Green Checkmark Stamp with Golden Burst Sparks */}
          <View style={styles.successStampContainer}>
            <View style={styles.successBadgeStamp}>
              <Ionicons name="checkmark" size={38} color="#ffffff" />
            </View>

            {/* Golden Festive Rays/Confetti Sparks */}
            <View style={[styles.goldSpark, styles.sparkLeftTop]} />
            <View style={[styles.goldSpark, styles.sparkLeftMid]} />
            <View style={[styles.goldSpark, styles.sparkRightTop]} />
            <View style={[styles.goldSpark, styles.sparkRightMid]} />
            <View style={[styles.goldSpark, styles.sparkTopLeft]} />
            <View style={[styles.goldSpark, styles.sparkTopRight]} />
          </View>

          {/* 2. Success Title & Subtitle */}
          <Text style={styles.successTitle}>Top Up Request Submitted!</Text>
          <Text style={styles.successSubtitle}>
            Your loan top up request has been successfully received and is now under process.
          </Text>

          {/* 3. Top Up Request ID Golden Card with Copy Icon */}
          <TouchableOpacity
            style={styles.requestIdCard}
            onPress={handleCopyRequestId}
            activeOpacity={0.8}
          >
            <View style={styles.requestIdCol}>
              <Text style={styles.requestIdLabel}>Top Up Request ID</Text>
              <Text style={styles.requestIdValue}>{topUpRequestId}</Text>
            </View>
            <View style={styles.copyIconWrap}>
              <Ionicons name="copy-outline" size={26} color="#002e75" />
            </View>
          </TouchableOpacity>

          {copiedNotification && (
            <View style={styles.copiedToast}>
              <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
              <Text style={styles.copiedToastText}>Request ID copied!</Text>
            </View>
          )}

          {/* 4. Request Summary Card */}
          <View style={styles.sectionCard}>
            {/* Overlapping Section Pill Header */}
            <View style={styles.sectionHeaderTab}>
              <Text style={styles.sectionHeaderText}>Request Summary</Text>
            </View>

            <View style={styles.summaryGridContainer}>
              {/* Row 1: Loan Type | Top Up Amount */}
              <View style={styles.summaryRow}>
                {/* Cell 1: Loan Type */}
                <View style={[styles.summaryCell, styles.cellBorderRight]}>
                  <View style={styles.homeIconBoxSmall}>
                    <Ionicons name="home-outline" size={22} color="#002e75" />
                  </View>
                  <View style={styles.summaryTextCol}>
                    <Text style={styles.summaryLabel}>Loan Type</Text>
                    <Text style={styles.summaryBoldText}>{loanTypeName}</Text>
                  </View>
                </View>

                {/* Cell 2: Top Up Amount */}
                <View style={styles.summaryCell}>
                  <View style={styles.summaryIconWrap}>
                    <MaterialCommunityIcons name="cash-plus" size={24} color="#d97706" />
                  </View>
                  <View style={styles.summaryTextCol}>
                    <Text style={styles.summaryLabel}>Top Up Amount</Text>
                    <Text style={styles.summaryBoldText}>₹{topUpAmount || '15,00,000'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.summaryHorizontalDivider} />

              {/* Row 2: Bank Name | Purpose */}
              <View style={styles.summaryRow}>
                {/* Cell 3: Bank Name */}
                <View style={[styles.summaryCell, styles.cellBorderRight]}>
                  <View style={styles.summaryIconWrap}>
                    <Ionicons name="business-outline" size={24} color="#004aad" />
                  </View>
                  <View style={styles.summaryTextCol}>
                    <Text style={styles.summaryLabel}>Bank Name</Text>
                    <Text style={styles.summaryBoldText}>{bankName}</Text>
                  </View>
                </View>

                {/* Cell 4: Purpose */}
                <View style={styles.summaryCell}>
                  <View style={styles.summaryIconWrap}>
                    <Ionicons name="disc-outline" size={24} color="#d97706" />
                  </View>
                  <View style={styles.summaryTextCol}>
                    <Text style={styles.summaryLabel}>Purpose</Text>
                    <Text style={styles.summaryBoldText}>{selectedPurpose}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 5. Current Status Card with Stepper & Information Notice */}
          <View style={styles.sectionCard}>
            {/* Overlapping Section Pill Header */}
            <View style={styles.sectionHeaderTab}>
              <Text style={styles.sectionHeaderText}>Current Status</Text>
            </View>

            {/* Stepper Progress Bar */}
            <View style={styles.stepperContainer}>
              {/* Step 1: Request Submitted (Active Green) */}
              <View style={styles.stepperNode}>
                <View style={styles.greenCheckCircle}>
                  <Ionicons name="checkmark" size={13} color="#ffffff" />
                </View>
                <Text style={styles.stepperLabelBold}>Request{'\n'}Submitted</Text>
                <Text style={styles.stepperTimestamp}>{submissionTimestamp}</Text>
              </View>

              {/* Connector line 1 (Solid Green) */}
              <View style={styles.stepperLineGreen} />

              {/* Step 2: Eligibility Check */}
              <View style={styles.stepperNode}>
                <View style={styles.grayOutlineCircle} />
                <Text style={styles.stepperLabelGray}>Eligibility{'\n'}Check</Text>
              </View>

              {/* Connector line 2 (Gray) */}
              <View style={styles.stepperLineGray} />

              {/* Step 3: Lender Assessment */}
              <View style={styles.stepperNode}>
                <View style={styles.grayOutlineCircle} />
                <Text style={styles.stepperLabelGray}>Lender{'\n'}Assessment</Text>
              </View>

              {/* Connector line 3 (Gray) */}
              <View style={styles.stepperLineGray} />

              {/* Step 4: Approval & Disbursement */}
              <View style={styles.stepperNode}>
                <View style={styles.grayOutlineCircle} />
                <Text style={styles.stepperLabelGray}>Approval{'\n'}& Disbursement</Text>
              </View>
            </View>

            {/* Information Notice Pill */}
            <View style={styles.infoNoticePill}>
              <View style={styles.infoNoticeIcon}>
                <Ionicons name="information-circle" size={26} color="#004aad" />
              </View>
              <Text style={styles.infoNoticeText}>
                We will keep you updated on your request.{'\n'}
                You can track the status anytime in <Text style={styles.infoNoticeBold}>My Loans &gt; Top Up tab.</Text>
              </Text>
            </View>
          </View>

          {/* 6. Relationship Manager Bar */}
          <View style={styles.rmPillContainer}>
            <View style={styles.rmNameSection}>
              <Ionicons name="person-outline" size={18} color="#004aad" style={{ marginRight: 6 }} />
              <View>
                <Text style={styles.rmRoleSmallText}>Relationship Manager (RM)</Text>
                <Text style={styles.rmNameBold}>{rmName}</Text>
              </View>
            </View>

            <View style={styles.rmVerticalDivider} />

            <TouchableOpacity
              style={styles.rmCallAction}
              onPress={() => handleCallRM(rmPhone)}
              activeOpacity={0.75}
            >
              <View style={styles.rmCallCircle}>
                <Ionicons name="call" size={11} color="#ffffff" />
              </View>
              <Text style={styles.rmPhoneText}>{rmPhone}</Text>
            </TouchableOpacity>

            <View style={styles.rmVerticalDivider} />

            <TouchableOpacity
              style={styles.rmWhatsappAction}
              onPress={() => handleWhatsAppRM(rmPhone, rmName)}
              activeOpacity={0.75}
            >
              <FontAwesome5 name="whatsapp" size={18} color="#16a34a" style={{ marginRight: 5 }} />
              <Text style={styles.rmWhatsappText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* 7. Bottom Dual Actions: [< Back to My Loans] | [👁 Track Request] */}
        <View style={styles.bottomBarDualContainer}>
          <TouchableOpacity
            style={styles.backToMyLoansBtn}
            onPress={handleBackToMyLoans}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={16} color="#002e75" />
            <Text style={styles.backToMyLoansBtnText}>Back to My Loans</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.trackRequestBtn}
            onPress={handleTrack}
            activeOpacity={0.88}
          >
            <Ionicons name="eye-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.trackRequestBtnText}>Track Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =========================================================================
  // VIEW 1: TOP UP REQUEST FORM
  // =========================================================================
  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Card: Golden Pill Header matching reference image */}
        <View style={styles.topHeaderPill}>
          <View style={styles.topHeaderIconRow}>
            <View style={styles.topHeaderCoinsWrap}>
              <MaterialCommunityIcons name="cash-plus" size={32} color="#d97706" />
            </View>
            <Text style={styles.topHeaderTitle}>Top Up Request</Text>
          </View>
          <Text style={styles.topHeaderSubtitle}>
            Request additional loan on your existing loan
          </Text>
        </View>

        {/* 1. Existing Loan Details Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderTab}>
            <Text style={styles.sectionHeaderText}>Existing Loan Details</Text>
          </View>

          <View style={styles.existingLoanHeaderRow}>
            <View style={styles.homeIconBox}>
              <Ionicons name="home-outline" size={26} color="#002e75" />
            </View>

            <View style={styles.loanTitleCol}>
              <Text style={styles.loanTitleText}>{loanTypeName}</Text>
              <View style={styles.appIdBadgePill}>
                <Text style={styles.appIdBadgeText}>Application ID: {existingAppId}</Text>
              </View>
            </View>

            <View style={styles.bankNameCol}>
              <Ionicons name="business-outline" size={26} color="#004aad" style={{ alignSelf: 'center' }} />
              <Text style={styles.bankNameText}>{bankName}</Text>
            </View>
          </View>

          <View style={styles.metricsThreeColRow}>
            <View style={styles.metricCol}>
              <View style={styles.metricLabelRow}>
                <View style={styles.moneyBagIconCircle}>
                  <Text style={styles.moneyBagSymbol}>₹</Text>
                </View>
                <Text style={styles.metricLabel}>Current Loan Amount</Text>
              </View>
              <Text style={styles.metricBoldValue}>{currentLoanAmount}</Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.metricCol}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="calendar-outline" size={16} color="#d97706" />
                <Text style={styles.metricLabel}>Balance Tenure</Text>
              </View>
              <Text style={styles.metricBoldValue}>{balanceTenure}</Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.metricCol}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="calendar-outline" size={16} color="#d97706" />
                <Text style={styles.metricLabel}>Current EMI</Text>
              </View>
              <Text style={styles.metricBoldValue}>{currentEmi}</Text>
            </View>
          </View>
        </View>

        {/* 2. Top Up Request Details Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderTab}>
            <Text style={styles.sectionHeaderText}>Top Up Request Details</Text>
          </View>

          <View style={styles.formRow}>
            <Text style={styles.inputFieldLabel}>
              Top Up Required Amount<Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.amountInputWrap}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountTextInput}
                value={topUpAmount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="15,00,000"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <Text style={styles.inputFieldLabel}>
              Purpose of Top Up<Text style={styles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownInputWrap}
              onPress={() => setShowPurposeModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownSelectedText} numberOfLines={1}>
                {selectedPurpose}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#002e75" />
            </TouchableOpacity>
          </View>

          <View style={styles.estimatedEmiBox}>
            <View style={styles.calcIconBox}>
              <Ionicons name="calculator" size={24} color="#004aad" />
            </View>
            <Text style={styles.estimatedEmiLabel}>
              Estimated EMI{'\n'}After Top Up
            </Text>

            <View style={styles.estimatedEmiDivider} />

            <View style={styles.estimatedEmiPill}>
              <Text style={styles.estimatedEmiValue}>₹56,200 / Month</Text>
            </View>
          </View>
        </View>

        {/* 3. Relationship Manager Bar */}
        <View style={styles.rmPillContainer}>
          <View style={styles.rmNameSection}>
            <Ionicons name="person-outline" size={18} color="#004aad" style={{ marginRight: 6 }} />
            <View>
              <Text style={styles.rmRoleSmallText}>Relationship Manager (RM)</Text>
              <Text style={styles.rmNameBold}>{rmName}</Text>
            </View>
          </View>

          <View style={styles.rmVerticalDivider} />

          <TouchableOpacity
            style={styles.rmCallAction}
            onPress={() => handleCallRM(rmPhone)}
            activeOpacity={0.75}
          >
            <View style={styles.rmCallCircle}>
              <Ionicons name="call" size={11} color="#ffffff" />
            </View>
            <Text style={styles.rmPhoneText}>{rmPhone}</Text>
          </TouchableOpacity>

          <View style={styles.rmVerticalDivider} />

          <TouchableOpacity
            style={styles.rmWhatsappAction}
            onPress={() => handleWhatsAppRM(rmPhone, rmName)}
            activeOpacity={0.75}
          >
            <FontAwesome5 name="whatsapp" size={18} color="#16a34a" style={{ marginRight: 5 }} />
            <Text style={styles.rmWhatsappText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Button: [➤ Submit Top Up Request] */}
      <View style={styles.bottomBarContainer}>
        <TouchableOpacity
          style={styles.submitTopUpBtn}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.88}
        >
          <View style={styles.sendIconCircle}>
            <Ionicons name="paper-plane" size={15} color="#002e75" />
          </View>
          <Text style={styles.submitTopUpBtnText}>
            {isSubmitting ? 'Submitting Request...' : 'Submit Top Up Request'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Purpose Picker Modal */}
      <Modal
        visible={showPurposeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPurposeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPurposeModal(false)}
        >
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Purpose of Top Up</Text>
              <TouchableOpacity onPress={() => setShowPurposeModal(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={PURPOSE_OPTIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = selectedPurpose === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalOptionItem,
                      isSelected && styles.modalOptionItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedPurpose(item);
                      setShowPurposeModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  scrollContentSuccess: {
    padding: 16,
    paddingTop: 18,
    paddingBottom: 110,
    alignItems: 'center',
  },
  scrollContentTrack: {
    padding: 16,
    paddingBottom: 110,
  },

  // ---------------- TRACK STATUS HEADER (TOP BAR) ----------------
  trackStatusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  trackBackArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackTitleCoinsWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackStatusHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#002e75',
    letterSpacing: -0.2,
  },

  // ---------------- TRACK STATUS: TOP CARD ----------------
  trackSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#fde047',
    padding: 14,
    marginBottom: 20,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  trackCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackTitleCol: {
    flex: 1,
  },
  trackMainTitleText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#002e75',
    marginBottom: 2,
  },
  trackRequestIdPill: {
    backgroundColor: '#e0f2fe',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  trackRequestIdPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004aad',
  },
  inProcessGreenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderWidth: 1.2,
    borderColor: '#86efac',
    borderRadius: 18,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  inProcessGreenPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  trackThreeMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafbfc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  trackMetricCell: {
    flex: 1,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  trackBankNameText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#002e75',
  },
  trackMetricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  trackMetricLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748b',
  },
  trackMetricBoldValue: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0f172a',
  },

  // Current Loan >> Revised Loan Strip
  loanComparisonStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#fde68a',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  comparisonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comparisonCoinsIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  comparisonAmountBold: {
    fontSize: 14,
    fontWeight: '900',
    color: '#002e75',
  },
  comparisonArrow: {
    fontSize: 18,
    fontWeight: '900',
    color: '#002e75',
  },

  // ---------------- APPLICATION PROGRESS STEPPER (VIEW 3) ----------------
  trackStepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 14,
    width: '100%',
  },
  trackNodeItem: {
    alignItems: 'center',
    width: 66,
  },
  trackNodeItemActive: {
    alignItems: 'center',
    width: 82,
  },
  blueActiveOuterCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#0284c7',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  blueActiveInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284c7',
  },
  inProcessPillBadge: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  inProcessPillLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0369a1',
    textAlign: 'center',
    lineHeight: 12,
  },
  inProcessPillSub: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 1,
  },
  trackNodeLabelBold: {
    fontSize: 10,
    fontWeight: '800',
    color: '#002e75',
    textAlign: 'center',
    lineHeight: 12,
  },
  trackNodeTimestamp: {
    fontSize: 8,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginTop: 2,
  },
  trackNodeLabelGray: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 12,
  },

  // Current Update Banner
  currentUpdateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#fde68a',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  updateDocIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateContentCol: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#002e75',
    marginBottom: 2,
  },
  updateDescription: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 15,
  },

  // Quick Action Buttons Grid (4 buttons)
  quickActionsGridRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionGridButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#bae6fd',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionGridButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#002e75',
    textAlign: 'center',
    lineHeight: 12,
  },

  backToMyLoansLargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#003399',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#eab308',
    paddingVertical: 14,
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  backToMyLoansLargeBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },

  // ---------------- SUCCESS STAMP / GRAPHIC ----------------
  successStampContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  successBadgeStamp: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  goldSpark: {
    position: 'absolute',
    width: 4,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#f59e0b',
  },
  sparkLeftTop: {
    left: 4,
    top: 18,
    transform: [{ rotate: '-45deg' }],
  },
  sparkLeftMid: {
    left: 0,
    top: 40,
    transform: [{ rotate: '-80deg' }],
  },
  sparkRightTop: {
    right: 4,
    top: 18,
    transform: [{ rotate: '45deg' }],
  },
  sparkRightMid: {
    right: 0,
    top: 40,
    transform: [{ rotate: '80deg' }],
  },
  sparkTopLeft: {
    left: 22,
    top: 0,
    transform: [{ rotate: '-20deg' }],
  },
  sparkTopRight: {
    right: 22,
    top: 0,
    transform: [{ rotate: '20deg' }],
  },

  successTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#002e75',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  successSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 18,
  },

  // Top Up Request ID Card
  requestIdCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fde047',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  requestIdCol: {
    alignItems: 'flex-start',
  },
  requestIdLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  requestIdValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#002e75',
    letterSpacing: 0.4,
  },
  copyIconWrap: {
    padding: 4,
  },
  copiedToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: -14,
    marginBottom: 14,
  },
  copiedToastText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },

  // Summary Card Grid
  summaryGridContainer: {
    width: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  cellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  summaryHorizontalDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  homeIconBoxSmall: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#fef08a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  summaryBoldText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#002e75',
  },

  // Stepper inside Current Status Card
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 14,
    width: '100%',
  },
  stepperNode: {
    alignItems: 'center',
    width: 72,
  },
  greenCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  grayOutlineCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94a3b8',
    backgroundColor: '#ffffff',
    marginBottom: 6,
  },
  stepperLineGreen: {
    flex: 1,
    height: 3,
    backgroundColor: '#16a34a',
    marginTop: 10,
    marginHorizontal: -4,
  },
  stepperLineGray: {
    flex: 1,
    height: 3,
    backgroundColor: '#cbd5e1',
    marginTop: 10,
    marginHorizontal: -4,
  },
  stepperLabelBold: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#002e75',
    textAlign: 'center',
    lineHeight: 13,
  },
  stepperTimestamp: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginTop: 2,
  },
  stepperLabelGray: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 13,
  },

  // Information Notice Pill
  infoNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
    gap: 10,
    width: '100%',
  },
  infoNoticeIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoNoticeText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1e3a8a',
    lineHeight: 16,
  },
  infoNoticeBold: {
    fontWeight: '800',
    color: '#002e75',
  },

  // Dual Bottom Buttons
  bottomBarDualContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    gap: 12,
  },
  backToMyLoansBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#002e75',
    borderRadius: 28,
    paddingVertical: 13,
    gap: 4,
  },
  backToMyLoansBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#002e75',
  },
  trackRequestBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#003399',
    borderWidth: 1.5,
    borderColor: '#eab308',
    borderRadius: 28,
    paddingVertical: 13,
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  trackRequestBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },

  // ---------------- TOP HEADER CARD (GOLD GRADIENT PILL) ----------------
  topHeaderPill: {
    backgroundColor: '#fffbeb',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#fde047',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  topHeaderIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    gap: 8,
  },
  topHeaderCoinsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#002e75',
    letterSpacing: -0.2,
  },
  topHeaderSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },

  // ---------------- SECTION CARD WITH OVERLAPPING TAB ----------------
  sectionCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    padding: 14,
    paddingTop: 22,
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#004aad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeaderTab: {
    position: 'absolute',
    top: -12,
    left: 14,
    backgroundColor: '#004aad',
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Existing Loan Header Row
  existingLoanHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  homeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fef08a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  loanTitleCol: {
    flex: 1,
  },
  loanTitleText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#002e75',
    marginBottom: 3,
  },
  appIdBadgePill: {
    backgroundColor: '#e0f2fe',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  appIdBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004aad',
  },
  bankNameCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
  },
  bankNameText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#002e75',
    marginTop: 2,
  },

  // 3 Metric Columns Row
  metricsThreeColRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafbfc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  metricCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  moneyBagIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moneyBagSymbol: {
    fontSize: 9,
    fontWeight: '900',
    color: '#d97706',
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748b',
  },
  metricBoldValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
  },
  verticalDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e2e8f0',
  },

  // ---------------- FORM ROW STYLING ----------------
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  inputFieldLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#002e75',
    flex: 1.1,
  },
  requiredStar: {
    color: '#dc2626',
    fontWeight: '900',
  },
  amountInputWrap: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    marginRight: 6,
  },
  amountTextInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
    padding: 0,
  },
  dropdownInputWrap: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  dropdownSelectedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },

  // Estimated EMI After Top Up Box
  estimatedEmiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1.2,
    borderColor: '#bae6fd',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  calcIconBox: {
    marginRight: 8,
  },
  estimatedEmiLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#002e75',
    lineHeight: 15,
    flex: 1,
  },
  estimatedEmiDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#94a3b8',
    marginHorizontal: 10,
  },
  estimatedEmiPill: {
    backgroundColor: '#fef08a',
    borderWidth: 1.2,
    borderColor: '#fde047',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  estimatedEmiValue: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#002e75',
  },

  // ---------------- RM BOTTOM BAR ----------------
  rmPillContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  rmNameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.4,
  },
  rmRoleSmallText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748b',
  },
  rmNameBold: {
    fontSize: 12,
    fontWeight: '900',
    color: '#002e75',
  },
  rmCallAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  rmCallCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rmPhoneText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  rmVerticalDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#94a3b8',
    marginHorizontal: 6,
  },
  rmWhatsappAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  rmWhatsappText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
  },

  // ---------------- FLOATING BOTTOM BUTTON ----------------
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  submitTopUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#003399',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#eab308',
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  sendIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitTopUpBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  // ---------------- MODAL STYLING ----------------
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentCard: {
    width: '100%',
    maxHeight: '60%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002e75',
  },
  modalOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  modalOptionItemSelected: {
    backgroundColor: '#eff6ff',
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  modalOptionTextSelected: {
    color: '#004aad',
    fontWeight: '800',
  },
});
