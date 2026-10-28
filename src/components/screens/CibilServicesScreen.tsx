import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { UserProfile } from '../../types';
import { colors } from '../../theme/colors';

interface CibilServicesScreenProps {
  user: UserProfile | null;
  onRequestConsultation?: () => void;
}

export const CibilServicesScreen: React.FC<CibilServicesScreenProps> = ({
  user,
}) => {
  const [activeTab, setActiveTab] = useState<'education' | 'errors' | 'pan_aadhaar' | 'consult'>('education');
  const [consentAccepted, setConsentAccepted] = useState<boolean>(false);
  const [consultationSubmitted, setConsultationSubmitted] = useState<boolean>(false);

  const score = user?.cibilEstimateScore || 768;

  const handleBookConsultation = () => {
    if (!consentAccepted) {
      Alert.alert('Consent Required', 'Please accept the data consent terms to proceed with credit consultation.');
      return;
    }
    setConsultationSubmitted(true);
  };

  const handleOpenGovPortal = () => {
    Linking.openURL('https://eportal.incometax.gov.in/iec/foservices/#/pre-login/bl-link-aadhaar').catch(() => {
      Alert.alert('Link', 'Could not open Income Tax e-filing portal');
    });
  };

  const subTabs = [
    { id: 'education', label: 'Score Education', icon: 'school', iconType: 'ion', activeColor: '#008ecc', lightColor: '#e0f2fe' },
    { id: 'errors', label: 'Report Errors', icon: 'shield-alert', iconType: 'mci', activeColor: '#ee1c25', lightColor: '#fee2e2' },
    { id: 'pan_aadhaar', label: 'PAN–Aadhaar Link', icon: 'id-card', iconType: 'fa5', activeColor: '#16a34a', lightColor: '#dcfce7' },
    { id: 'consult', label: 'Book Advisory', icon: 'calendar-check', iconType: 'mci', activeColor: '#2d3091', lightColor: '#e0e7ff' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerIconBadge}>
            <MaterialCommunityIcons name="finance" size={24} color="#ffffff" />
          </View>
          <View style={styles.headerTitleWrap}>
            <View style={styles.tagBadge}>
              <View style={styles.tagDot} />
              <Text style={styles.tagText}>OFFICIAL CREDIT ADVISORY</Text>
            </View>
            <Text style={styles.screenHeading}>CIBIL & Credit Services</Text>
          </View>
        </View>
        <Text style={styles.screenSub}>
          Understand your CIBIL health score, correct credit bureau report errors, and unlock pre-approved bank loans.
        </Text>
      </View>

      {/* 2. Credit Meter Hero Card */}
      <View style={styles.meterCard}>
        <View style={styles.heroGlowCircle} />

        <View style={styles.meterTopRow}>
          <View>
            <View style={styles.meterBadgeRow}>
              <Ionicons name="speedometer-outline" size={13} color="#93c5fd" />
              <Text style={styles.meterSub}>ESTIMATED CREDIT HEALTH</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreVal}>{score}</Text>
              <View style={styles.primePill}>
                <Ionicons name="checkmark-circle" size={13} color="#86efac" />
                <Text style={styles.scoreBand}>Prime Tier</Text>
              </View>
            </View>
          </View>

          <View style={styles.rangeBadge}>
            <Text style={styles.rangeText}>Scale: 300 – 900</Text>
          </View>
        </View>

        {/* Visual High-Contrast Score Track */}
        <View style={styles.scoreBarTrack}>
          <View style={[styles.barSegment, { flex: 25, backgroundColor: '#ef4444' }]} />
          <View style={[styles.barSegment, { flex: 20, backgroundColor: '#f59e0b' }]} />
          <View style={[styles.barSegment, { flex: 25, backgroundColor: '#38bdf8' }]} />
          <View style={[styles.barSegment, { flex: 30, backgroundColor: '#22c55e' }]} />
        </View>

        <View style={styles.scoreLegendRow}>
          <Text style={styles.scoreLegendText}>300 (Poor)</Text>
          <Text style={styles.scoreLegendText}>650 (Fair)</Text>
          <Text style={styles.scoreLegendText}>750+ (Prime)</Text>
          <Text style={styles.scoreLegendText}>900</Text>
        </View>

        {/* CIBIL Insights Quick Pill */}
        <View style={styles.cibilInsightBox}>
          <Ionicons name="shield-checkmark" size={14} color="#86efac" />
          <Text style={styles.cibilInsightText}>
            Your score qualifies for lower interest rates and fast-track loan sanctions!
          </Text>
        </View>
      </View>

      {/* 3. Sub Tabs Row (Distinct Colorful Category Chips) */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {subTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterChip,
                  isActive && {
                    backgroundColor: tab.activeColor,
                    borderColor: tab.activeColor,
                    shadowColor: tab.activeColor,
                  },
                ]}
                onPress={() => setActiveTab(tab.id as typeof activeTab)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.filterChipIconWrap,
                    {
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : tab.lightColor,
                    },
                  ]}
                >
                  {tab.iconType === 'mci' ? (
                    <MaterialCommunityIcons
                      name={tab.icon as any}
                      size={14}
                      color={isActive ? '#ffffff' : tab.activeColor}
                    />
                  ) : tab.iconType === 'fa5' ? (
                    <FontAwesome5
                      name={tab.icon as any}
                      size={11}
                      color={isActive ? '#ffffff' : tab.activeColor}
                    />
                  ) : (
                    <Ionicons
                      name={tab.icon as any}
                      size={13}
                      color={isActive ? '#ffffff' : tab.activeColor}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab 1: Education */}
      {activeTab === 'education' && (
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="school" size={16} color={colors.primary} />
            </View>
            <Text style={styles.sectionHeading}>What Influences Your CIBIL Score?</Text>
          </View>

          <View style={styles.factorsList}>
            <View style={styles.factorItem}>
              <View style={[styles.factorIconBadge, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="calendar-outline" size={15} color="#16a34a" />
              </View>
              <View style={styles.factorContent}>
                <Text style={styles.factorTitle}>1. Repayment History (35% Weightage)</Text>
                <Text style={styles.factorDesc}>
                  Timely payment of credit card dues and loan EMIs has the single highest impact on your score.
                </Text>
              </View>
            </View>

            <View style={styles.factorItem}>
              <View style={[styles.factorIconBadge, { backgroundColor: '#fef3c7' }]}>
                <MaterialCommunityIcons name="credit-card-check-outline" size={16} color="#d97706" />
              </View>
              <View style={styles.factorContent}>
                <Text style={styles.factorTitle}>2. Credit Utilization (30% Weightage)</Text>
                <Text style={styles.factorDesc}>
                  Keep monthly credit card balances under 30% of total sanctioned limits.
                </Text>
              </View>
            </View>

            <View style={styles.factorItem}>
              <View style={[styles.factorIconBadge, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="pie-chart-outline" size={15} color="#4338ca" />
              </View>
              <View style={styles.factorContent}>
                <Text style={styles.factorTitle}>3. Credit Mix & Inquiries (20% Weightage)</Text>
                <Text style={styles.factorDesc}>
                  A balanced mix of secured (home/car) and unsecured (personal) loans without excessive loan applications.
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Tab 2: Error Guidance */}
      {activeTab === 'errors' && (
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.secondaryRedLight }]}>
              <MaterialCommunityIcons name="alert-octagon" size={16} color={colors.secondaryRed} />
            </View>
            <Text style={[styles.sectionHeading, { color: colors.secondaryRedDark }]}>
              Common Credit Bureau Report Errors
            </Text>
          </View>

          <View style={styles.factorsList}>
            <View style={styles.factorItem}>
              <View style={[styles.factorIconBadge, { backgroundColor: '#fee2e2' }]}>
                <MaterialCommunityIcons name="clock-alert-outline" size={16} color="#dc2626" />
              </View>
              <View style={styles.factorContent}>
                <Text style={styles.factorTitle}>Closed Loans Shown as Active (DPD)</Text>
                <Text style={styles.factorDesc}>
                  Lenders sometimes delay submitting settlement updates to TransUnion CIBIL. Always preserve your physical No Objection Certificate (NOC).
                </Text>
              </View>
            </View>

            <View style={styles.factorItem}>
              <View style={[styles.factorIconBadge, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="person-remove-outline" size={15} color="#d97706" />
              </View>
              <View style={styles.factorContent}>
                <Text style={styles.factorTitle}>Identity & PAN Mismatch Errors</Text>
                <Text style={styles.factorDesc}>
                  Clerical errors can accidentally merge another individual's overdue accounts into your bureau record. Loan Point assists with formal bureau disputes.
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Tab 3: PAN-Aadhaar Linking */}
      {activeTab === 'pan_aadhaar' && (
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#dcfce7' }]}>
              <FontAwesome5 name="id-card" size={14} color="#16a34a" />
            </View>
            <Text style={[styles.sectionHeading, { color: '#166534' }]}>
              PAN–Aadhaar Linking Status
            </Text>
          </View>

          <View style={styles.panStatusBox}>
            <View style={styles.panStatusIconWrap}>
              <Ionicons name="shield-checkmark" size={24} color="#16a34a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.panStatusTitle}>Aadhaar Linked & Verified</Text>
              <Text style={styles.panStatusSub}>
                Your PAN is fully compliant and active for commercial bank loan disbursements under Income Tax directives.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.stepTitle}>How to Verify or Link Online:</Text>
          <View style={styles.stepsGuidanceBlock}>
            <View style={styles.guideStepRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Visit the official Income Tax e-Filing portal.</Text>
            </View>

            <View style={styles.guideStepRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Enter your 10-digit PAN and 12-digit Aadhaar Number.</Text>
            </View>

            <View style={styles.guideStepRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Authorize with OTP received on your Aadhaar registered mobile.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.govLinkBtn}
            onPress={handleOpenGovPortal}
            activeOpacity={0.8}
          >
            <View style={styles.govIconWrap}>
              <FontAwesome5 name="globe" size={13} color="#ffffff" />
            </View>
            <Text style={styles.govLinkText}>Open Income Tax Portal</Text>
            <Ionicons name="open-outline" size={15} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Tab 4: Consultation with Fee & Consent */}
      {activeTab === 'consult' && (
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#e0e7ff' }]}>
              <MaterialCommunityIcons name="handshake" size={17} color="#2d3091" />
            </View>
            <Text style={[styles.sectionHeading, { color: '#2d3091' }]}>
              Schedule CIBIL Advisory Session
            </Text>
          </View>

          <Text style={styles.factorDesc}>
            Speak with Loan Point's lead credit advisory team at Alibhai Tower, Shivaji Nagar, Nanded for one-on-one credit score optimization.
          </Text>

          {/* Fee Transparency Box */}
          <View style={styles.feeBox}>
            <View style={styles.feeRow}>
              <View style={styles.feeLabelRow}>
                <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                <Text style={styles.feeLabel}>Preliminary Assessment</Text>
              </View>
              <Text style={styles.feeValueFree}>FREE</Text>
            </View>

            <View style={[styles.feeRow, { borderBottomWidth: 0 }]}>
              <View style={styles.feeLabelRow}>
                <Ionicons name="document-text" size={14} color={colors.primary} />
                <Text style={styles.feeLabel}>Bureau Dispute & Legal Rectification</Text>
              </View>
              <Text style={styles.feeValue}>₹499 (Disclosed before payment)</Text>
            </View>
          </View>

          {/* Explicit User Consent Checkbox */}
          <View style={styles.consentBox}>
            <Switch
              value={consentAccepted}
              onValueChange={setConsentAccepted}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
            <Text style={styles.consentLabel}>
              I authorize Loan Point Nanded to examine my credit report for consultation and advisory purposes as per RBI fair practices.
            </Text>
          </View>

          {!consultationSubmitted ? (
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={handleBookConsultation}
              activeOpacity={0.8}
            >
              <View style={styles.bookIconWrap}>
                <Ionicons name="calendar" size={15} color="#ffffff" />
              </View>
              <Text style={styles.bookBtnText}>Book Credit Consultation</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.bookedSuccess}>
              <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
              <Text style={styles.bookedText}>
                Consultation Request Logged! Arvind Patil will contact you on WhatsApp within 2–4 hours.
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 36,
    gap: 16,
  },

  /* 1. Header Card */
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  tagDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16a34a',
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
  },
  screenHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  screenSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 17,
  },

  /* 2. Credit Meter Hero Card */
  meterCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.cardNavyFrom,
    borderRadius: 18,
    padding: 20,
    shadowColor: colors.cardNavyFrom,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  heroGlowCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  meterTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  meterBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meterSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93c5fd',
    letterSpacing: 0.6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  scoreVal: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.5,
  },
  primePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.35)',
  },
  scoreBand: {
    fontSize: 12,
    fontWeight: '800',
    color: '#86efac',
  },
  rangeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  rangeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e0f2fe',
  },
  scoreBarTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 6,
    gap: 2,
  },
  barSegment: {
    height: '100%',
    borderRadius: 2,
  },
  scoreLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreLegendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#93c5fd',
  },
  cibilInsightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cibilInsightText: {
    fontSize: 11.5,
    color: '#e0f2fe',
    fontWeight: '600',
    flex: 1,
  },

  /* 3. Sub Tabs Row */
  filterSection: {
    marginVertical: -2,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
    paddingRight: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '800',
  },

  /* Content Cards */
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDeep,
    letterSpacing: 0.5,
  },
  factorsList: {
    gap: 12,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 12,
  },
  factorIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  factorContent: {
    flex: 1,
  },
  factorTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
  },
  factorDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16.5,
    marginTop: 3,
  },

  /* PAN-Aadhaar View */
  panStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    padding: 14,
    borderRadius: 14,
  },
  panStatusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panStatusTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065f46',
  },
  panStatusSub: {
    fontSize: 11.5,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  stepTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  stepsGuidanceBlock: {
    gap: 8,
  },
  guideStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceSubtle,
    padding: 10,
    borderRadius: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },
  stepText: {
    fontSize: 11.5,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  govLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 13,
    gap: 8,
    marginTop: 14,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  govIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  govLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.2,
  },

  /* Fee Box */
  feeBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginVertical: 14,
    gap: 8,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  feeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  feeValueFree: {
    fontSize: 12,
    fontWeight: '900',
    color: '#16a34a',
  },
  feeValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  consentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  consentLabel: {
    flex: 1,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    fontWeight: '500',
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.indigoNavy,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: colors.indigoNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  bookIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.2,
  },
  bookedSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 14,
    borderRadius: 14,
  },
  bookedText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
    lineHeight: 17,
  },
});
