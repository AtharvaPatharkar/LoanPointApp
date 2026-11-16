import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { LoanApplication } from '../../types';

interface ApplicationsScreenProps {
  applications: LoanApplication[];
  onSelectApplication: (app: LoanApplication) => void;
  onApplyNew: () => void;
  onTopUpLoan?: () => void;
  onUploadDocForApp?: (app: LoanApplication, docName: string) => void;
  onOpenCall?: (phone: string) => void;
  onOpenWhatsApp?: (phone: string, text?: string) => void;
}

type TabType = 'in_progress' | 'disbursed' | 'top_up' | 'rejected';

interface StepMilestone {
  key: string;
  label: string;
}

const MILESTONES: StepMilestone[] = [
  { key: 'received', label: 'Received' },
  { key: 'documents', label: 'Documents' },
  { key: 'assessment', label: 'Lender\nAssessment' },
  { key: 'approval', label: 'Approval' },
];

const TOP_UP_MILESTONES = [
  { key: 'request_received', label: 'Request\nReceived' },
  { key: 'eligibility_check', label: 'Eligibility\nCheck' },
  { key: 'lender_assessment', label: 'Lender\nAssessment' },
  { key: 'approval_disbursement', label: 'Approval\n& Disbursement' },
];

export const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({
  applications,
  onSelectApplication,
  onApplyNew,
  onTopUpLoan,
  onOpenCall,
  onOpenWhatsApp,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('rejected');

  // Categorize applications
  const inProgressList = applications.filter(
    (app) =>
      !app.isTopUp &&
      (app.status === 'Processing' ||
        app.status === 'Documents Pending' ||
        app.status === 'Application Submitted' ||
        app.status === 'Enquiry Received')
  );

  const disbursedList = applications.filter((app) => !app.isTopUp && app.status === 'Disbursed');
  const rejectedList = applications.filter((app) => app.status === 'Rejected');
  const topUpList = applications.filter((app) => app.isTopUp);
  const topUpCount = topUpList.length > 0 ? topUpList.length : 1;

  const currentList =
    activeTab === 'in_progress'
      ? inProgressList
      : activeTab === 'disbursed'
        ? disbursedList
        : activeTab === 'top_up'
          ? topUpList
          : activeTab === 'rejected'
            ? rejectedList
            : [];

  const getStageIndex = (app: LoanApplication): number => {
    if (app.status === 'Disbursed' || app.status === 'Approved') return 3;
    if (app.status === 'Processing') return 2;
    if (app.status === 'Documents Pending' || app.status === 'Application Submitted') return 1;
    return 0;
  };

  const formatAmountINR = (num: number): string => {
    return '₹' + num.toLocaleString('en-IN');
  };

  // Check if a loan is eligible to reapply based on its reapplyDate
  const checkIsReapplyEligible = (reapplyDateStr?: string): boolean => {
    if (!reapplyDateStr) return true;
    try {
      const parsedDate = new Date(reapplyDateStr);
      if (isNaN(parsedDate.getTime())) return true;
      const today = new Date();
      // Eligible if today is on or after the specified reapply date
      return today.getTime() >= parsedDate.getTime();
    } catch {
      return true;
    }
  };

  const handleCallRM = (phone: string) => {
    if (onOpenCall) {
      onOpenCall(phone);
    } else {
      Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
    }
  };

  const handleWhatsAppRM = (phone: string, name: string, appId: string) => {
    const text = `Hello ${name}, I am following up on my loan application (${appId}).`;
    if (onOpenWhatsApp) {
      onOpenWhatsApp(phone, text);
    } else {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`);
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Card Title with File-Check Badge */}
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIconBox}>
            <View style={styles.headerIconLineTop} />
            <View style={styles.headerIconLineMid} />
            <View style={styles.headerIconLineBot} />
            <View style={styles.headerIconPenTip} />
          </View>
          <Text style={styles.headerTitleText}>My Loans</Text>
        </View>

        {/* 4 Custom Segmented Tabs matching exact colors & badges */}
        <View style={styles.tabsGridRow}>
          {/* 1. In Progress (Light Blue / Cyan Tint) */}
          <TouchableOpacity
            style={[
              styles.tabCard,
              activeTab === 'in_progress'
                ? styles.tabCardInProgressActive
                : styles.tabCardInProgressDefault,
            ]}
            onPress={() => setActiveTab('in_progress')}
            activeOpacity={0.85}
          >
            <View style={styles.tabIconRow}>
              <MaterialCommunityIcons
                name="timer-sand"
                size={18}
                color={activeTab === 'in_progress' ? '#ffffff' : '#0284c7'}
              />
            </View>
            <Text
              style={[
                styles.tabCardText,
                activeTab === 'in_progress'
                  ? styles.tabCardTextActive
                  : styles.tabCardTextInProgress,
              ]}
              numberOfLines={1}
            >
              In Progress ({inProgressList.length})
            </Text>
          </TouchableOpacity>

          {/* 2. Disbursed (Glossy Vibrant Green) */}
          <TouchableOpacity
            style={[
              styles.tabCard,
              activeTab === 'disbursed'
                ? styles.tabCardDisbursedActive
                : styles.tabCardDisbursedDefault,
            ]}
            onPress={() => setActiveTab('disbursed')}
            activeOpacity={0.85}
          >
            <View style={styles.tabIconRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={activeTab === 'disbursed' ? '#ffffff' : '#16a34a'}
              />
            </View>
            <Text
              style={[
                styles.tabCardText,
                activeTab === 'disbursed'
                  ? styles.tabCardTextActive
                  : styles.tabCardTextDisbursed,
              ]}
              numberOfLines={1}
            >
              Disbursed ({disbursedList.length})
            </Text>
          </TouchableOpacity>

          {/* 3. Top Up (Soft Warm Peach / Amber Tint) */}
          <TouchableOpacity
            style={[
              styles.tabCard,
              activeTab === 'top_up'
                ? styles.tabCardTopUpActive
                : styles.tabCardTopUpDefault,
            ]}
            onPress={() => setActiveTab('top_up')}
            activeOpacity={0.85}
          >
            <View style={styles.tabIconRow}>
              <MaterialCommunityIcons
                name="cash-plus"
                size={18}
                color={activeTab === 'top_up' ? '#ffffff' : '#d97706'}
              />
            </View>
            <Text
              style={[
                styles.tabCardText,
                activeTab === 'top_up'
                  ? styles.tabCardTextActive
                  : styles.tabCardTextTopUp,
              ]}
              numberOfLines={1}
            >
              Top Up ({topUpCount})
            </Text>
          </TouchableOpacity>

          {/* 4. Rejected (Vibrant Glossy Red with Golden Glow active state) */}
          <TouchableOpacity
            style={[
              styles.tabCard,
              activeTab === 'rejected'
                ? styles.tabCardRejectedActive
                : styles.tabCardRejectedDefault,
            ]}
            onPress={() => setActiveTab('rejected')}
            activeOpacity={0.85}
          >
            <View style={styles.tabIconRow}>
              <Ionicons
                name="close-circle-outline"
                size={18}
                color={activeTab === 'rejected' ? '#ffffff' : '#dc2626'}
              />
            </View>
            <Text
              style={[
                styles.tabCardText,
                activeTab === 'rejected'
                  ? styles.tabCardTextActive
                  : styles.tabCardTextRejected,
              ]}
              numberOfLines={1}
            >
              Rejected ({rejectedList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- ACTIVE TAB CONTENT ---------------- */}
        {activeTab === 'rejected' ? (
          /* REJECTED TAB SPECIFIC VIEW (MATCHING USER REFERENCE IMAGE) */
          <View>
            {rejectedList.map((app) => {
              const isHome = app.loanType === 'home';
              const bankName = app.bankName || (isHome ? 'ICICI Bank' : 'HDFC Bank');
              const appliedOn = app.submissionDate || (isHome ? '05 Oct 2026' : '28 Sep 2026');
              const rejectedOn = app.rejectedOn || (isHome ? '10 Oct 2026' : '02 Oct 2026');
              const reapplyDate = app.reapplyDate || (isHome ? '10 Jan 2027' : '02 Nov 2026');
              const isEligibleToReapply = checkIsReapplyEligible(reapplyDate);
              const loanAmount = formatAmountINR(app.requestedAmount || (isHome ? 8000000 : 5000000));
              const rejectionReason =
                app.rejectionReason ||
                (isHome
                  ? "CIBIL Score is below lender's required criteria."
                  : 'Insufficient business income documentation.');
              const nextStep =
                app.nextStepText ||
                (isHome
                  ? 'Improve your CIBIL score and reapply.'
                  : 'Upload updated income & business documents and reapply.');

              return (
                <View key={app.id} style={styles.rejectedCardWrapper}>
                  {/* Row 1: Header (Icon in Squircle + Title/ID + Bank Name on right) */}
                  <View style={styles.rejectedCardHeaderRow}>
                    <View
                      style={[
                        styles.rejectedIconBox,
                        isHome ? styles.rejectedHomeBox : styles.rejectedBriefcaseBox,
                      ]}
                    >
                      {isHome ? (
                        <Ionicons name="home-outline" size={26} color="#002e75" />
                      ) : (
                        <Ionicons name="briefcase-outline" size={24} color="#991b1b" />
                      )}
                    </View>

                    <View style={styles.rejectedTitleCol}>
                      <Text style={styles.rejectedTitleText}>{app.loanTypeName}</Text>
                      <View style={styles.rejectedAppIdPill}>
                        <Text style={styles.rejectedAppIdText}>Application ID: {app.id}</Text>
                      </View>
                    </View>

                    {/* Bank Name Col on the Right */}
                    <View style={styles.rejectedBankCol}>
                      <Text style={styles.rejectedBankSubLabel}>Bank Name</Text>
                      <View style={styles.rejectedBankBrandRow}>
                        {bankName.includes('ICICI') ? (
                          <View style={styles.iciciBrandWrap}>
                            <Ionicons name="flame" size={17} color="#c2410c" />
                            <Text style={styles.iciciBrandText}>ICICI Bank</Text>
                          </View>
                        ) : (
                          <View style={styles.hdfcBrandWrap}>
                            <View style={styles.hdfcLogoBox}>
                              <View style={styles.hdfcSquareRed} />
                              <View style={styles.hdfcBlueHBar} />
                              <View style={styles.hdfcBlueVBar} />
                            </View>
                            <Text style={styles.hdfcBrandText}>{bankName}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Row 2: 3 Metrics Row (Loan Amount | Applied On | Rejected Badge) */}
                  <View style={styles.rejectedMetricsRow}>
                    {/* Metric 1: Loan Amount */}
                    <View style={styles.rejectedMetricItem}>
                      <View style={styles.rejectedMetricLabelRow}>
                        <View style={styles.moneyBagIconCircle}>
                          <Text style={styles.moneyBagSymbol}>₹</Text>
                        </View>
                        <Text style={styles.rejectedMetricLabel}>Loan Amount</Text>
                      </View>
                      <Text style={styles.rejectedMetricBoldValue}>{loanAmount}</Text>
                    </View>

                    <View style={styles.rejectedVerticalDivider} />

                    {/* Metric 2: Applied On */}
                    <View style={styles.rejectedMetricItem}>
                      <View style={styles.rejectedMetricLabelRow}>
                        <Ionicons name="calendar-outline" size={16} color="#d97706" />
                        <Text style={styles.rejectedMetricLabel}>Applied On</Text>
                      </View>
                      <Text style={styles.rejectedMetricBoldValue}>{appliedOn}</Text>
                    </View>

                    <View style={styles.rejectedVerticalDivider} />

                    {/* Metric 3: Rejected Status Badge */}
                    <View style={styles.rejectedStatusItem}>
                      <View style={styles.rejectedRedPillSolid}>
                        <Ionicons name="close-circle" size={15} color="#ffffff" style={{ marginRight: 4 }} />
                        <Text style={styles.rejectedRedPillSolidText}>Rejected</Text>
                      </View>
                      <Text style={styles.rejectedOnDateText}>On: {rejectedOn}</Text>
                    </View>
                  </View>

                  {/* Row 3: Rejection Reason Callout Banner (Soft Red Tint) */}
                  <View style={styles.rejectionReasonBanner}>
                    <View style={styles.docCancelIconWrap}>
                      <Ionicons name="document-text-outline" size={20} color="#dc2626" />
                      <View style={styles.miniRedCrossBadge}>
                        <Ionicons name="close" size={10} color="#ffffff" />
                      </View>
                    </View>
                    <View style={styles.rejectionReasonContent}>
                      <Text style={styles.rejectionReasonTitle}>Rejection Reason</Text>
                      <Text style={styles.rejectionReasonText}>{rejectionReason}</Text>
                    </View>
                  </View>

                  {/* Row 4: Next Step Row + Reapply Date / Button */}
                  <View style={styles.nextStepRow}>
                    <View style={styles.personIconCircleWrap}>
                      <Ionicons name="person-outline" size={20} color="#004aad" />
                    </View>
                    <View style={styles.nextStepContent}>
                      <Text style={styles.nextStepTitle}>Next Step</Text>
                      <Text style={styles.nextStepText}>{nextStep}</Text>
                    </View>

                    <View style={styles.nextStepDivider} />

                    {/* Reapply Button (Shows Reapply Date & Enabled only on/after the specified date) */}
                    <TouchableOpacity
                      style={[
                        styles.reapplyNowBtn,
                        isEligibleToReapply ? styles.reapplyBtnEnabled : styles.reapplyBtnDisabled,
                      ]}
                      onPress={() => {
                        if (isEligibleToReapply) {
                          onApplyNew();
                        } else {
                          Alert.alert(
                            'Reapplication Cooldown Active',
                            `You can reapply for this ${app.loanTypeName} on or after ${reapplyDate}. In the meantime, please contact your Relationship Manager for assistance.`,
                            [
                              { text: 'OK' },
                              { text: 'Contact RM', onPress: () => handleCallRM('+91 9545555999') },
                            ]
                          );
                        }
                      }}
                      activeOpacity={isEligibleToReapply ? 0.82 : 0.95}
                    >
                      <Ionicons
                        name={isEligibleToReapply ? 'sync-outline' : 'calendar-outline'}
                        size={14}
                        color={isEligibleToReapply ? '#002e75' : '#64748b'}
                        style={{ marginRight: 4 }}
                      />
                      <View style={{ alignItems: 'center' }}>
                        <Text
                          style={[
                            styles.reapplyNowBtnText,
                            isEligibleToReapply ? styles.reapplyBtnTextEnabled : styles.reapplyBtnTextDisabled,
                          ]}
                        >
                          {isEligibleToReapply ? 'Reapply Now' : 'Reapply On'}
                        </Text>
                        <Text
                          style={[
                            styles.reapplyDateSubText,
                            isEligibleToReapply ? styles.reapplyDateSubTextEnabled : styles.reapplyDateSubTextDisabled,
                          ]}
                        >
                          {reapplyDate}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Need Help Getting Approved? Banner Card */}
            <View style={styles.needHelpBannerCard}>
              <View style={styles.needHelpIconWrap}>
                <Ionicons name="trending-up" size={26} color="#dc2626" />
              </View>
              <View style={styles.needHelpTextWrap}>
                <Text style={styles.needHelpTitle}>Need Help Getting Approved?</Text>
                <Text style={styles.needHelpSub}>
                  Our experts will help you resolve the issue and reapply.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.contactRmBtn}
                onPress={() => handleCallRM('+91 9545555999')}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={14} color="#ffffff" style={{ marginRight: 5 }} />
                <Text style={styles.contactRmBtnText}>Contact RM</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : activeTab === 'top_up' ? (
          /* Top Up Tab Specific View */
          <View>
            {topUpList.map((app) => {
              const bankName = app.bankName || 'HDFC Bank';
              const rmName = app.assignedManager?.name || 'Arvind Patil';
              const rmPhone = app.assignedManager?.phone || '+91 9545555999';
              const tenureTotal = app.tenureYears || '20 Years';
              const existingLoan = formatAmountINR(app.existingLoanAmount || 5000000);
              const topUpRequested = formatAmountINR(app.topUpRequestedAmount || 1500000);
              const currentEmi = app.currentEmi || '₹43,476';
              const afterTopUpEmi = app.afterTopUpEmi || '₹56,200 (Est.)';
              const stageIdx = app.topUpStageIndex !== undefined ? app.topUpStageIndex : 1;

              return (
                <View key={app.id} style={styles.topUpCard}>
                  {/* Row 1: Header (Golden Home Box, Title + App ID, Golden Pill Button + Arrow) */}
                  <View style={styles.topUpHeaderRow}>
                    <View style={styles.topUpHomeIconBox}>
                      <Ionicons name="home-outline" size={26} color="#002e75" />
                    </View>

                    <View style={styles.topUpTitleCol}>
                      <Text style={styles.topUpTitleText}>{app.loanTypeName || 'Home Loan'}</Text>
                      <View style={styles.topUpAppIdPill}>
                        <Text style={styles.topUpAppIdText}>Application ID: {app.id}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.topUpRequestBadge}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (onTopUpLoan) onTopUpLoan();
                        else onSelectApplication(app);
                      }}
                    >
                      <MaterialCommunityIcons name="cash-plus" size={17} color="#d97706" style={{ marginRight: 4 }} />
                      <Text style={styles.topUpRequestBadgeText}>Top Up Request</Text>
                      <Ionicons name="chevron-forward" size={16} color="#002e75" style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                  </View>

                  {/* 2x3 Grid Table with 1px border dividers */}
                  <View style={styles.topUpGrid}>
                    <View style={styles.gridRow}>
                      <View style={[styles.gridCell, styles.cellBorderRight]}>
                        <View style={styles.cellHeaderRow}>
                          <Ionicons name="business-outline" size={15} color="#004aad" />
                          <Text style={styles.cellLabel}>Bank Name</Text>
                        </View>
                        <View style={styles.bankValueRow}>
                          <View style={styles.hdfcLogoBox}>
                            <View style={styles.hdfcSquareRed} />
                            <View style={styles.hdfcBlueHBar} />
                            <View style={styles.hdfcBlueVBar} />
                          </View>
                          <Text style={styles.cellBoldValue} numberOfLines={1}>
                            {bankName}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.gridCell, styles.cellBorderRight]}>
                        <View style={styles.cellHeaderRow}>
                          <View style={styles.moneyBagIconCircle}>
                            <Text style={styles.moneyBagSymbol}>₹</Text>
                          </View>
                          <Text style={styles.cellLabel}>Existing Loan</Text>
                        </View>
                        <Text style={styles.cellBoldValue}>{existingLoan}</Text>
                      </View>

                      <View style={styles.gridCell}>
                        <View style={styles.cellHeaderRow}>
                          <MaterialCommunityIcons name="cash-plus" size={16} color="#d97706" />
                          <Text style={styles.cellLabel} numberOfLines={1}>Top Up Requested</Text>
                        </View>
                        <Text style={styles.cellBoldValue} numberOfLines={1}>{topUpRequested}</Text>
                      </View>
                    </View>

                    <View style={styles.gridHorizontalDivider} />

                    <View style={styles.gridRow}>
                      <View style={[styles.gridCell, styles.cellBorderRight]}>
                        <View style={styles.cellHeaderRow}>
                          <Ionicons name="calendar-outline" size={15} color="#d97706" />
                          <Text style={styles.cellLabel}>Tenure (Total)</Text>
                        </View>
                        <Text style={styles.cellBoldValue}>{tenureTotal}</Text>
                      </View>

                      <View style={[styles.gridCell, styles.cellBorderRight]}>
                        <View style={styles.cellHeaderRow}>
                          <Ionicons name="calendar-outline" size={15} color="#d97706" />
                          <Text style={styles.cellLabel} numberOfLines={1}>EMI Amount (Current)</Text>
                        </View>
                        <Text style={styles.cellBoldValue}>{currentEmi}</Text>
                      </View>

                      <View style={styles.gridCell}>
                        <View style={styles.cellHeaderRow}>
                          <Ionicons name="calendar-outline" size={15} color="#d97706" />
                          <Text style={styles.cellLabel} numberOfLines={1}>EMI Amount (After Top Up)</Text>
                        </View>
                        <Text style={styles.cellBoldValue} numberOfLines={1}>{afterTopUpEmi}</Text>
                      </View>
                    </View>
                  </View>

                  {/* 4-Step Stepper Progress Bar */}
                  <View style={styles.stepperContainer}>
                    {TOP_UP_MILESTONES.map((milestone, idx) => {
                      const isCompleted = idx <= stageIdx;

                      return (
                        <React.Fragment key={milestone.key}>
                          <View style={styles.nodeItem}>
                            {isCompleted ? (
                              <View style={styles.greenCheckCircle}>
                                <Ionicons name="checkmark" size={13} color="#ffffff" />
                              </View>
                            ) : (
                              <View style={styles.grayOutlineCircle} />
                            )}

                            <Text
                              style={[
                                styles.milestoneLabel,
                                isCompleted
                                  ? styles.milestoneLabelDark
                                  : styles.milestoneLabelGray,
                              ]}
                            >
                              {milestone.label}
                            </Text>
                          </View>

                          {idx < TOP_UP_MILESTONES.length - 1 && (
                            <View
                              style={[
                                styles.connectorLine,
                                idx < stageIdx
                                  ? styles.connectorLineGreen
                                  : styles.connectorLineGray,
                              ]}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </View>

                  {/* RM Bottom Bar Row */}
                  <View style={styles.rmPillContainer}>
                    <View style={styles.rmNameSection}>
                      <Ionicons name="person-outline" size={17} color="#004aad" style={{ marginRight: 6 }} />
                      <Text style={styles.rmNameText}>
                        RM: <Text style={styles.rmNameBold}>{rmName}</Text>
                      </Text>
                    </View>

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
                      onPress={() => handleWhatsAppRM(rmPhone, rmName, app.id)}
                      activeOpacity={0.75}
                    >
                      <FontAwesome5 name="whatsapp" size={17} color="#16a34a" style={{ marginRight: 5 }} />
                      <Text style={styles.rmWhatsappText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Need More Funds Banner Card */}
            <TouchableOpacity
              style={styles.needMoreFundsCard}
              onPress={() => {
                if (onTopUpLoan) onTopUpLoan();
              }}
              activeOpacity={0.88}
            >
              <View style={styles.needFundsHeaderRow}>
                <MaterialCommunityIcons name="cash-plus" size={26} color="#d97706" style={{ marginRight: 8 }} />
                <Text style={styles.needFundsTitle}>Need More Funds?</Text>
              </View>
              <Text style={styles.needFundsSubtitle}>
                Get a Top Up on your existing loan at attractive rates.
              </Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'disbursed' ? (
          /* Disbursed Tab Specific View */
          <View>
            {disbursedList.map((app) => {
              const bankName = app.bankName || 'HDFC Bank';
              const rmName = app.assignedManager?.name || 'Arvind Patil';
              const rmPhone = app.assignedManager?.phone || '+91 9545555999';
              const disbursementDate = app.disbursementDate || '20 Sep 2026';
              const tenure = app.tenureYears || (app.tenureMonths ? `${Math.round(app.tenureMonths / 12)} Years` : '20 Years');
              const interestRate = app.interestRate || '7.80% p.a.';
              const emiAmount = app.emiAmount || '₹43,476 / Month';
              const loanAmount = formatAmountINR(app.requestedAmount || 5000000);

              return (
                <View key={app.id} style={styles.disbursedCard}>
                  <View style={styles.disbursedHeaderRow}>
                    <View style={styles.disbursedHomeIconBox}>
                      <Ionicons name="home-outline" size={26} color="#15803d" />
                    </View>

                    <View style={styles.disbursedTitleCol}>
                      <Text style={styles.disbursedTitleText}>{app.loanTypeName || 'Home Loan'}</Text>
                      <View style={styles.disbursedAppIdPill}>
                        <Text style={styles.disbursedAppIdText}>Application ID: {app.id}</Text>
                      </View>
                    </View>

                    <View style={styles.disbursedBadgePill}>
                      <Ionicons name="checkmark-circle" size={16} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.disbursedBadgeText}>Disbursed</Text>
                    </View>
                  </View>

                  <View style={styles.disbursedGrid}>
                    <View style={styles.gridRow}>
                      <View style={[styles.gridCell, styles.cellBorderRight]}>
                        <View style={styles.cellHeaderRow}>
                          <Ionicons name="business-outline" size={16} color="#004aad" />
                          <Text style={styles.cellLabel}>Bank Name</Text>
                        </View>
                        <View style={styles.bankValueRow}>
                          <View style={styles.hdfcLogoBox}>
                            <View style={styles.hdfcSquareRed} />
                            <View style={styles.hdfcBlueHBar} />
                            <View style={styles.hdfcBlueVBar} />
                          </View>
                          <Text style={styles.cellBoldValue} numberOfLines={1}>
                            {bankName}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.gridCell, styles.cellBorderRight]}>
                        <View style={styles.cellHeaderRow}>
                          <View style={styles.moneyBagIconCircle}>
                            <Text style={styles.moneyBagSymbol}>₹</Text>
                          </View>
                          <Text style={styles.cellLabel}>Loan Amount</Text>
                        </View>
                        <Text style={styles.cellBoldValue}>{loanAmount}</Text>
                      </View>

                      <View style={styles.gridCell}>
                        <View style={styles.cellHeaderRow}>
                          <Ionicons name="calendar-outline" size={16} color="#d97706" />
                          <Text style={styles.cellLabel} numberOfLines={1}>Disbursement Date</Text>
                        </View>
                        <Text style={styles.cellBoldValue} numberOfLines={1}>{disbursementDate}</Text>
                      </View>
                    </View>

                    <View style={styles.gridHorizontalDivider} />

                    <View style={styles.gridRow}>
                      <View style={[styles.gridCell, styles.cellBorderRight]}>
                        <View style={styles.cellHeaderRow}>
                          <Ionicons name="calendar-outline" size={16} color="#d97706" />
                          <Text style={styles.cellLabel}>Tenure</Text>
                        </View>
                        <Text style={styles.cellBoldValue}>{tenure}</Text>
                      </View>

                      <View style={[styles.gridCell, styles.cellBorderRight]}>
                        <View style={styles.cellHeaderRow}>
                          <View style={styles.percentIconCircle}>
                            <Text style={styles.percentSymbol}>%</Text>
                          </View>
                          <Text style={styles.cellLabel}>Interest Rate</Text>
                        </View>
                        <Text style={styles.cellBoldValue}>{interestRate}</Text>
                      </View>

                      <View style={styles.gridCell}>
                        <View style={styles.cellHeaderRow}>
                          <View style={styles.calendarCoinBox}>
                            <Text style={styles.calendarCoinSymbol}>₹</Text>
                          </View>
                          <Text style={styles.cellLabel}>EMI Amount</Text>
                        </View>
                        <Text style={styles.cellBoldValue} numberOfLines={1}>{emiAmount}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.rmPillContainer}>
                    <View style={styles.rmNameSection}>
                      <Ionicons name="person-outline" size={17} color="#004aad" style={{ marginRight: 6 }} />
                      <Text style={styles.rmNameText}>
                        RM: <Text style={styles.rmNameBold}>{rmName}</Text>
                      </Text>
                    </View>

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
                      onPress={() => handleWhatsAppRM(rmPhone, rmName, app.id)}
                      activeOpacity={0.75}
                    >
                      <FontAwesome5 name="whatsapp" size={17} color="#16a34a" style={{ marginRight: 5 }} />
                      <Text style={styles.rmWhatsappText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <View style={styles.noMoreSection}>
              <View style={styles.stampOuterContainer}>
                <View style={styles.stampSunburstCircle}>
                  <Ionicons name="checkmark" size={28} color="#ffffff" />
                </View>
                <View style={[styles.stampRay, styles.rayLeft]} />
                <View style={[styles.stampRay, styles.rayTopLeft]} />
                <View style={[styles.stampRay, styles.rayTopRight]} />
                <View style={[styles.stampRay, styles.rayRight]} />
              </View>

              <Text style={styles.noMoreTitle}>No More Disbursed Loans</Text>
              <Text style={styles.noMoreSubtitle}>
                Your successfully disbursed loans will appear here.
              </Text>
            </View>
          </View>
        ) : currentList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={44} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No loans in this section</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Apply for New Loan" below or explore "Top Up My Loan" for instant cash.
            </Text>
          </View>
        ) : (
          currentList.map((app) => {
            const stageIndex = getStageIndex(app);
            const isHome = app.loanType === 'home';
            const bankName = app.bankName || (isHome ? 'HDFC Bank' : 'ICICI Bank');
            const rmName = app.assignedManager?.name || (isHome ? 'Arvind Patil' : 'Disha Bhure');
            const rmPhone = app.assignedManager?.phone || (isHome ? '+91 9545555999' : '+91 90216 78901');

            return (
              <TouchableOpacity
                key={app.id}
                style={styles.loanCardWrapper}
                onPress={() => onSelectApplication(app)}
                activeOpacity={0.92}
              >
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.loanIconSquare,
                      isHome ? styles.homeIconBox : styles.carIconBox,
                    ]}
                  >
                    {isHome ? (
                      <Ionicons name="home-outline" size={24} color="#0f172a" />
                    ) : (
                      <Ionicons name="car-outline" size={24} color="#004aad" />
                    )}
                  </View>

                  <View style={styles.loanTitleCol}>
                    <Text style={styles.loanTitleText}>{app.loanTypeName}</Text>
                    <View style={styles.appIdBadgePill}>
                      <Text style={styles.appIdText}>Application ID: {app.id}</Text>
                    </View>
                  </View>

                  <View
                    style={
                      app.status === 'Rejected'
                        ? styles.rejectedRedPill
                        : styles.inProgressYellowPill
                    }
                  >
                    <Text
                      style={
                        app.status === 'Rejected'
                          ? styles.rejectedRedPillText
                          : styles.inProgressYellowPillText
                      }
                    >
                      {app.status === 'Rejected' ? 'Rejected' : 'In Progress'}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color="#0f172a" />
                </View>

                <View style={styles.infoThreeColsRow}>
                  <View style={styles.infoColItem}>
                    <View style={styles.colHeaderMiniRow}>
                      <Ionicons name="business-outline" size={16} color="#004aad" />
                      <Text style={styles.colHeaderLabel}>Bank Name</Text>
                    </View>
                    <View style={styles.bankValueRow}>
                      {bankName.includes('HDFC') ? (
                        <View style={styles.hdfcLogoBox}>
                          <View style={styles.hdfcSquareRed} />
                          <View style={styles.hdfcBlueHBar} />
                          <View style={styles.hdfcBlueVBar} />
                        </View>
                      ) : (
                        <View style={styles.iciciLogoBox}>
                          <Ionicons name="flame" size={15} color="#ea580c" />
                        </View>
                      )}
                      <Text style={styles.bankNameText} numberOfLines={1}>
                        {bankName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.colVerticalDivider} />

                  <View style={styles.infoColItem}>
                    <View style={styles.colHeaderMiniRow}>
                      <View style={styles.moneyBagIconCircle}>
                        <Text style={styles.moneyBagSymbol}>₹</Text>
                      </View>
                      <Text style={styles.colHeaderLabel}>Loan Amount</Text>
                    </View>
                    <Text style={styles.loanAmountValue}>
                      {formatAmountINR(app.requestedAmount)}
                    </Text>
                  </View>

                  <View style={styles.colVerticalDivider} />

                  <View style={styles.infoColItemRM}>
                    <View style={styles.colHeaderMiniRow}>
                      <Ionicons name="person-outline" size={14} color="#d97706" />
                      <Text style={styles.colHeaderLabel} numberOfLines={1}>
                        RM: {rmName}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.rmContactPill}
                      onPress={() => handleCallRM(rmPhone)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.rmPhoneCallCircle}>
                        <Ionicons name="call" size={10} color="#ffffff" />
                      </View>
                      <Text style={styles.rmPhoneText} numberOfLines={1}>
                        {rmPhone}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.stepperContainer}>
                  {MILESTONES.map((milestone, idx) => {
                    const isPassed = stageIndex > idx;
                    const isCurrent = stageIndex === idx;

                    return (
                      <React.Fragment key={milestone.key}>
                        <View style={styles.nodeItem}>
                          {isPassed ? (
                            <View style={styles.greenCheckCircle}>
                              <Ionicons name="checkmark" size={13} color="#ffffff" />
                            </View>
                          ) : isCurrent ? (
                            <View style={styles.yellowActiveRing}>
                              <View style={styles.yellowActiveInnerDot} />
                            </View>
                          ) : (
                            <View style={styles.grayOutlineCircle} />
                          )}

                          <Text
                            style={[
                              styles.milestoneLabel,
                              isPassed || isCurrent
                                ? styles.milestoneLabelDark
                                : styles.milestoneLabelGray,
                            ]}
                          >
                            {milestone.label}
                          </Text>
                        </View>

                        {idx < MILESTONES.length - 1 && (
                          <View
                            style={[
                              styles.connectorLine,
                              stageIndex > idx
                                ? styles.connectorLineGreen
                                : styles.connectorLineGray,
                            ]}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Bottom Floating Actions Container */}
      <View style={styles.bottomBarContainer}>
        {activeTab === 'top_up' ? (
          <TouchableOpacity
            style={styles.requestLoanTopUpBtn}
            onPress={() => {
              if (onTopUpLoan) onTopUpLoan();
            }}
            activeOpacity={0.88}
          >
            <View style={styles.requestPlusCircle}>
              <Ionicons name="add" size={20} color="#002e75" />
            </View>
            <Text style={styles.requestLoanTopUpBtnText}>Request Loan Top Up</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.applyNewLoanBtn}
              onPress={onApplyNew}
              activeOpacity={0.88}
            >
              <View style={styles.applyPlusCircle}>
                <Ionicons name="add" size={18} color="#002e75" />
              </View>
              <Text style={styles.applyNewLoanBtnText}>Apply for New Loan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topUpLoanBtn}
              onPress={() => {
                if (onTopUpLoan) onTopUpLoan();
              }}
              activeOpacity={0.88}
            >
              <View style={styles.topUpCoinsIcon}>
                <MaterialCommunityIcons name="cash-plus" size={20} color="#d97706" />
              </View>
              <Text style={styles.topUpLoanBtnText}>Top Up My Loan</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 170,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    marginTop: 4,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#ffd700',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    position: 'relative',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  headerIconLineTop: {
    width: 18,
    height: 2.5,
    backgroundColor: '#002e75',
    borderRadius: 1,
    marginBottom: 3,
  },
  headerIconLineMid: {
    width: 14,
    height: 2.5,
    backgroundColor: '#002e75',
    borderRadius: 1,
    marginBottom: 3,
    alignSelf: 'flex-start',
    marginLeft: 3,
  },
  headerIconLineBot: {
    width: 18,
    height: 2.5,
    backgroundColor: '#002e75',
    borderRadius: 1,
  },
  headerIconPenTip: {
    position: 'absolute',
    right: 5,
    top: 14,
    width: 4,
    height: 10,
    backgroundColor: '#002e75',
    borderRadius: 2,
  },
  headerTitleText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#002e75',
    letterSpacing: -0.3,
  },
  tabsGridRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconRow: {
    marginBottom: 4,
  },
  tabCardText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabCardTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  // In Progress Tab (Light Cyan)
  tabCardInProgressDefault: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  tabCardInProgressActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0369a1',
  },
  tabCardTextInProgress: {
    color: '#0369a1',
  },

  // Disbursed Tab (Green)
  tabCardDisbursedDefault: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  tabCardDisbursedActive: {
    backgroundColor: '#16a34a',
    borderColor: '#eab308',
    borderWidth: 2,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  tabCardTextDisbursed: {
    color: '#15803d',
  },

  // Top Up Tab (Warm Peach / Amber)
  tabCardTopUpDefault: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  tabCardTopUpActive: {
    backgroundColor: '#d97706',
    borderColor: '#ffffff',
    borderWidth: 2.5,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 5,
  },
  tabCardTextTopUp: {
    color: '#b45309',
  },

  // Rejected Tab (Glossy Vibrant Red with Gold/White Active Border)
  tabCardRejectedDefault: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  tabCardRejectedActive: {
    backgroundColor: '#dc2626',
    borderColor: '#eab308',
    borderWidth: 2,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 5,
  },
  tabCardTextRejected: {
    color: '#dc2626',
  },

  // ---------------- REJECTED CARD STYLING (MATCHING EXACT USER REFERENCE IMAGE) ----------------
  rejectedCardWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  rejectedCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rejectedIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rejectedHomeBox: {
    backgroundColor: '#fee2e2',
  },
  rejectedBriefcaseBox: {
    backgroundColor: '#fee2e2',
  },
  rejectedTitleCol: {
    flex: 1,
  },
  rejectedTitleText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#002e75',
    marginBottom: 2,
  },
  rejectedAppIdPill: {
    backgroundColor: '#e0f2fe',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rejectedAppIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004aad',
  },
  rejectedBankCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rejectedBankSubLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  rejectedBankBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iciciBrandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iciciBrandText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#002e75',
  },
  hdfcBrandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hdfcBrandText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#002e75',
  },

  // Rejected Metrics Row
  rejectedMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafbfc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  rejectedMetricItem: {
    flex: 1,
    paddingHorizontal: 4,
  },
  rejectedMetricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  rejectedMetricLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748b',
  },
  rejectedMetricBoldValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
  },
  rejectedVerticalDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e2e8f0',
  },
  rejectedStatusItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  rejectedRedPillSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  rejectedRedPillSolidText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  rejectedOnDateText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 3,
  },

  // Rejection Reason Callout Banner
  rejectionReasonBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    gap: 8,
  },
  docCancelIconWrap: {
    position: 'relative',
    marginTop: 1,
  },
  miniRedCrossBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectionReasonContent: {
    flex: 1,
  },
  rejectionReasonTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b91c1c',
    marginBottom: 2,
  },
  rejectionReasonText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 15,
  },

  // Next Step Row + Reapply Now Button
  nextStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  personIconCircleWrap: {
    marginRight: 8,
  },
  nextStepContent: {
    flex: 1,
  },
  nextStepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#002e75',
    marginBottom: 2,
  },
  nextStepText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 14,
  },
  nextStepDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#94a3b8',
    marginHorizontal: 8,
  },
  reapplyNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 5,
    paddingHorizontal: 9,
    minWidth: 95,
    justifyContent: 'center',
  },
  reapplyBtnEnabled: {
    backgroundColor: '#fef08a',
    borderWidth: 1.2,
    borderColor: '#fde047',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  reapplyBtnDisabled: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    opacity: 0.9,
  },
  reapplyNowBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  reapplyBtnTextEnabled: {
    color: '#002e75',
  },
  reapplyBtnTextDisabled: {
    color: '#64748b',
  },
  reapplyDateSubText: {
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: -1,
  },
  reapplyDateSubTextEnabled: {
    color: '#15803d',
  },
  reapplyDateSubTextDisabled: {
    color: '#0f172a',
  },

  // Need Help Getting Approved? Card
  needHelpBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fde047',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  needHelpIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  needHelpTextWrap: {
    flex: 1,
  },
  needHelpTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#002e75',
    marginBottom: 2,
  },
  needHelpSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 14,
  },
  contactRmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#003399',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  contactRmBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
  },

  // ---------------- TOP UP CARD STYLING ----------------
  topUpCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#fde047',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  topUpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topUpHomeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fef08a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  topUpTitleCol: {
    flex: 1,
  },
  topUpTitleText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#002e75',
    marginBottom: 2,
  },
  topUpAppIdPill: {
    backgroundColor: '#e0f2fe',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  topUpAppIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004aad',
  },
  topUpRequestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1.2,
    borderColor: '#fde68a',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
  },
  topUpRequestBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#002e75',
  },
  topUpGrid: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  needMoreFundsCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fde047',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  needFundsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  needFundsTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#002e75',
  },
  needFundsSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },

  // ---------------- DISBURSED CARD STYLING ----------------
  disbursedCard: {
    backgroundColor: '#f6fdf7',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#86efac',
    padding: 14,
    marginBottom: 20,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  disbursedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  disbursedHomeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  disbursedTitleCol: {
    flex: 1,
  },
  disbursedTitleText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#002e75',
    marginBottom: 2,
  },
  disbursedAppIdPill: {
    backgroundColor: '#e0f2fe',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  disbursedAppIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004aad',
  },
  disbursedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  disbursedBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Common Grid Table
  disbursedGrid: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  gridCell: {
    flex: 1,
    paddingHorizontal: 8,
  },
  cellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  gridHorizontalDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
    marginHorizontal: 8,
  },
  cellHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  cellBoldValue: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0f172a',
  },

  bankValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hdfcLogoBox: {
    width: 14,
    height: 14,
    position: 'relative',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#004aad',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hdfcSquareRed: {
    width: 6,
    height: 6,
    backgroundColor: '#dc2626',
  },
  hdfcBlueHBar: {
    position: 'absolute',
    width: 10,
    height: 2,
    backgroundColor: '#004aad',
  },
  hdfcBlueVBar: {
    position: 'absolute',
    height: 10,
    width: 2,
    backgroundColor: '#004aad',
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
  percentIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentSymbol: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#d97706',
  },
  calendarCoinBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCoinSymbol: {
    fontSize: 9,
    fontWeight: '900',
    color: '#d97706',
  },

  rmPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  rmNameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.2,
  },
  rmNameText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#002e75',
  },
  rmNameBold: {
    fontWeight: '800',
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
    height: 14,
    backgroundColor: '#94a3b8',
    marginHorizontal: 8,
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

  noMoreSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  stampOuterContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stampSunburstCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4ade80',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stampRay: {
    position: 'absolute',
    width: 3,
    height: 8,
    backgroundColor: '#4ade80',
    borderRadius: 1.5,
  },
  rayLeft: {
    left: 2,
    top: 26,
    transform: [{ rotate: '-80deg' }],
  },
  rayTopLeft: {
    left: 8,
    top: 6,
    transform: [{ rotate: '-45deg' }],
  },
  rayTopRight: {
    right: 8,
    top: 6,
    transform: [{ rotate: '45deg' }],
  },
  rayRight: {
    right: 2,
    top: 26,
    transform: [{ rotate: '80deg' }],
  },
  noMoreTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#002e75',
    marginBottom: 4,
    textAlign: 'center',
  },
  noMoreSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
  },

  // ---------------- IN PROGRESS / REJECTED CARD STYLING ----------------
  loanCardWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  loanIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIconBox: {
    backgroundColor: '#fef08a',
  },
  carIconBox: {
    backgroundColor: '#e0f2fe',
  },
  loanTitleCol: {
    flex: 1,
  },
  loanTitleText: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#002e75',
    marginBottom: 2,
  },
  appIdBadgePill: {
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  appIdText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  inProgressYellowPill: {
    backgroundColor: '#fef08a',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#fde047',
  },
  inProgressYellowPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#854d0e',
  },
  rejectedRedPill: {
    backgroundColor: '#fee2e2',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  rejectedRedPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b91c1c',
  },
  infoThreeColsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafbfc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  infoColItem: {
    flex: 1,
    paddingHorizontal: 4,
  },
  infoColItemRM: {
    flex: 1.15,
    paddingHorizontal: 4,
  },
  colVerticalDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e2e8f0',
  },
  colHeaderMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  colHeaderLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
  },
  iciciLogoBox: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankNameText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  loanAmountValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#002e75',
  },
  rmContactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  rmPhoneCallCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 12,
  },
  nodeItem: {
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
  yellowActiveRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#eab308',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  yellowActiveInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#eab308',
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
  connectorLine: {
    flex: 1,
    height: 3,
    marginTop: 10,
    marginHorizontal: -4,
  },
  connectorLineGreen: {
    backgroundColor: '#16a34a',
  },
  connectorLineGray: {
    backgroundColor: '#cbd5e1',
  },
  milestoneLabel: {
    fontSize: 10.5,
    textAlign: 'center',
    lineHeight: 13,
  },
  milestoneLabelDark: {
    fontWeight: '700',
    color: '#0f172a',
  },
  milestoneLabelGray: {
    fontWeight: '500',
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },

  // ---------------- BOTTOM BUTTONS ----------------
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
    gap: 8,
  },
  requestLoanTopUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#003399',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#eab308',
    paddingVertical: 14,
    gap: 10,
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  requestPlusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestLoanTopUpBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  applyNewLoanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#003399',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#eab308',
    paddingVertical: 13,
    gap: 8,
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  applyPlusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyNewLoanBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  topUpLoanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 28,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  topUpCoinsIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topUpLoanBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#002e75',
    letterSpacing: 0.2,
  },
});
