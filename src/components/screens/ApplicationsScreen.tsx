import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
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

export const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({
  applications,
  onSelectApplication,
  onApplyNew,
  onTopUpLoan,
  onOpenCall,
  onOpenWhatsApp,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('in_progress');

  // Categorize applications
  const inProgressList = applications.filter(
    (app) =>
      app.status === 'Processing' ||
      app.status === 'Documents Pending' ||
      app.status === 'Application Submitted' ||
      app.status === 'Enquiry Received'
  );

  const disbursedList = applications.filter((app) => app.status === 'Disbursed');
  const rejectedList = applications.filter((app) => app.status === 'Rejected');
  const topUpCount = 0; // Top Up is 0 in reference image

  const currentList =
    activeTab === 'in_progress'
      ? inProgressList
      : activeTab === 'disbursed'
      ? disbursedList
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
          {/* 1. In Progress (Green) */}
          <TouchableOpacity
            style={[
              styles.tabCard,
              activeTab === 'in_progress' ? styles.tabCardGreenActive : styles.tabCardDefault,
            ]}
            onPress={() => setActiveTab('in_progress')}
            activeOpacity={0.85}
          >
            <View style={styles.tabIconRow}>
              <MaterialCommunityIcons
                name="timer-sand"
                size={18}
                color={activeTab === 'in_progress' ? '#ffffff' : '#15803d'}
              />
            </View>
            <Text
              style={[
                styles.tabCardText,
                activeTab === 'in_progress' ? styles.tabCardTextActive : styles.tabCardTextDark,
              ]}
              numberOfLines={1}
            >
              In Progress ({inProgressList.length})
            </Text>
          </TouchableOpacity>

          {/* 2. Disbursed (Soft Blue) */}
          <TouchableOpacity
            style={[
              styles.tabCard,
              activeTab === 'disbursed' ? styles.tabCardBlueActive : styles.tabCardBlueTint,
            ]}
            onPress={() => setActiveTab('disbursed')}
            activeOpacity={0.85}
          >
            <View style={styles.tabIconRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={activeTab === 'disbursed' ? '#ffffff' : '#004aad'}
              />
            </View>
            <Text
              style={[
                styles.tabCardText,
                activeTab === 'disbursed' ? styles.tabCardTextActive : styles.tabCardTextBlue,
              ]}
              numberOfLines={1}
            >
              Disbursed ({disbursedList.length})
            </Text>
          </TouchableOpacity>

          {/* 3. Top Up (Soft Warm Peach) */}
          <TouchableOpacity
            style={[
              styles.tabCard,
              activeTab === 'top_up' ? styles.tabCardPeachActive : styles.tabCardPeachTint,
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
                activeTab === 'top_up' ? styles.tabCardTextActive : styles.tabCardTextPeach,
              ]}
              numberOfLines={1}
            >
              Top Up ({topUpCount})
            </Text>
          </TouchableOpacity>

          {/* 4. Rejected (Soft Red) */}
          <TouchableOpacity
            style={[
              styles.tabCard,
              activeTab === 'rejected' ? styles.tabCardRedActive : styles.tabCardRedTint,
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
                activeTab === 'rejected' ? styles.tabCardTextActive : styles.tabCardTextRed,
              ]}
              numberOfLines={1}
            >
              Rejected ({rejectedList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Applications List */}
        {currentList.length === 0 ? (
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
            const rmName = app.assignedManager?.name || (isHome ? 'Aasma Shaikh' : 'Disha Bhure');
            const rmPhone = app.assignedManager?.phone || (isHome ? '+91 98230 45678' : '+91 90216 78901');

            return (
              <TouchableOpacity
                key={app.id}
                style={styles.loanCardWrapper}
                onPress={() => onSelectApplication(app)}
                activeOpacity={0.92}
              >
                {/* 1. Card Top Row: Left Icon Box + Title/ID + Yellow In Progress Pill + Arrow */}
                <View style={styles.cardHeaderRow}>
                  {/* Icon Box (Peach for Home, Sky Blue for Car) */}
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

                  {/* Title & App ID */}
                  <View style={styles.loanTitleCol}>
                    <Text style={styles.loanTitleText}>{app.loanTypeName}</Text>
                    <View style={styles.appIdBadgePill}>
                      <Text style={styles.appIdText}>Application ID: {app.id}</Text>
                    </View>
                  </View>

                  {/* Yellow Status Pill */}
                  <View style={styles.inProgressYellowPill}>
                    <Text style={styles.inProgressYellowPillText}>
                      {app.status === 'Disbursed' ? 'Disbursed' : 'In Progress'}
                    </Text>
                  </View>

                  {/* Right Arrow */}
                  <Ionicons name="chevron-forward" size={18} color="#0f172a" />
                </View>

                {/* 2. Three Information Columns: Bank Name | Loan Amount | RM */}
                <View style={styles.infoThreeColsRow}>
                  {/* Column 1: Bank Name */}
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

                  {/* Divider */}
                  <View style={styles.colVerticalDivider} />

                  {/* Column 2: Loan Amount */}
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

                  {/* Divider */}
                  <View style={styles.colVerticalDivider} />

                  {/* Column 3: Relationship Manager & Contact */}
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

                {/* 3. 4-Step Stepper Progress Bar */}
                <View style={styles.stepperContainer}>
                  {MILESTONES.map((milestone, idx) => {
                    const isPassed = stageIndex > idx;
                    const isCurrent = stageIndex === idx;

                    return (
                      <React.Fragment key={milestone.key}>
                        {/* Node */}
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
                              (isPassed || isCurrent)
                                ? styles.milestoneLabelDark
                                : styles.milestoneLabelGray,
                            ]}
                          >
                            {milestone.label}
                          </Text>
                        </View>

                        {/* Line */}
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

      {/* Bottom Floating Actions Container matching exact 2 buttons */}
      <View style={styles.bottomBarContainer}>
        {/* Button 1: [+ Apply for New Loan] (Deep Royal Navy Blue) */}
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

        {/* Button 2: [🪙 Top Up My Loan] (Light Gold Tint with Gold Border) */}
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
    paddingBottom: 160,
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
    marginBottom: 18,
  },
  tabCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  tabIconRow: {
    marginBottom: 4,
  },
  tabCardText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Green Tab
  tabCardGreenActive: {
    backgroundColor: '#16a34a',
    borderColor: '#15803d',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabCardDefault: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  tabCardTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  tabCardTextDark: {
    color: '#15803d',
  },
  // Blue Tab
  tabCardBlueActive: {
    backgroundColor: '#004aad',
    borderColor: '#002e75',
  },
  tabCardBlueTint: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  tabCardTextBlue: {
    color: '#004aad',
  },
  // Peach Tab
  tabCardPeachActive: {
    backgroundColor: '#d97706',
    borderColor: '#b45309',
  },
  tabCardPeachTint: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  tabCardTextPeach: {
    color: '#b45309',
  },
  // Red Tab
  tabCardRedActive: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
  },
  tabCardRedTint: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  tabCardTextRed: {
    color: '#dc2626',
  },
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
  moneyBagIconCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moneyBagSymbol: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#d97706',
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
  rmPhoneText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  nodeItem: {
    alignItems: 'center',
    width: 68,
  },
  greenCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94a3b8',
    backgroundColor: '#ffffff',
    marginBottom: 6,
  },
  connectorLine: {
    flex: 1,
    height: 2.5,
    marginTop: 9,
    marginHorizontal: -6,
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
  applyNewLoanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#002e75',
    borderRadius: 28,
    paddingVertical: 13,
    gap: 8,
    shadowColor: '#002e75',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  applyPlusCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyNewLoanBtnText: {
    fontSize: 15,
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
    borderColor: '#fde047',
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
    fontSize: 15,
    fontWeight: '800',
    color: '#002e75',
    letterSpacing: 0.2,
  },
});
