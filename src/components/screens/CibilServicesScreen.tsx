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
  Image,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { UserProfile } from '../../types';

interface CibilServicesScreenProps {
  user: UserProfile | null;
  onRequestConsultation?: () => void;
  onOpenCall?: (phone?: string) => void;
  onOpenWhatsApp?: (phone?: string, text?: string) => void;
}

export const CibilServicesScreen: React.FC<CibilServicesScreenProps> = ({
  user,
  onRequestConsultation,
  onOpenCall,
  onOpenWhatsApp,
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
    { id: 'education', label: 'Score Education', icon: 'school', iconType: 'ion', activeColor: '#004aad', lightColor: '#eff6ff' },
    { id: 'errors', label: 'Report Errors', icon: 'shield-alert', iconType: 'mci', activeColor: '#dc2626', lightColor: '#fee2e2' },
    { id: 'pan_aadhaar', label: 'PAN–Aadhaar Link', icon: 'id-card', iconType: 'fa5', activeColor: '#16a34a', lightColor: '#dcfce7' },
    { id: 'consult', label: 'Book Advisory', icon: 'calendar-check', iconType: 'mci', activeColor: '#7c3aed', lightColor: '#f3e8ff' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Top Hero Banner using cibil-inner.png */}
      <View style={styles.heroBannerImageContainer}>
        <Image
          source={require('../../../assets/inner-banner/cibil-inner.png')}
          style={styles.heroBannerImage}
          resizeMode="contain"
        />
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
          <Ionicons name="shield-checkmark" size={16} color="#86efac" />
          <Text style={styles.cibilInsightText}>
            Your score qualifies for lower interest rates and fast-track loan sanctions!
          </Text>
        </View>
      </View>

      {/* 3. Sub Tabs Row */}
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
                activeOpacity={0.75}
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
            <View style={[styles.sectionIconBox, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="school" size={16} color="#004aad" />
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
            <View style={[styles.sectionIconBox, { backgroundColor: '#fee2e2' }]}>
              <MaterialCommunityIcons name="alert-octagon" size={16} color="#dc2626" />
            </View>
            <Text style={[styles.sectionHeading, { color: '#dc2626' }]}>
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
            <Ionicons name="open-outline" size={15} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Tab 4: Consultation with Fee & Consent */}
      {activeTab === 'consult' && (
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#f3e8ff' }]}>
              <MaterialCommunityIcons name="handshake" size={17} color="#7c3aed" />
            </View>
            <Text style={[styles.sectionHeading, { color: '#7c3aed' }]}>
              Schedule CIBIL Advisory Session
            </Text>
          </View>

          <Text style={styles.factorDesc}>
            Speak with Loan Point's lead credit advisory team for one-on-one credit score optimization and consultation.
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
                <Ionicons name="document-text" size={14} color="#004aad" />
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
              trackColor={{ false: '#e2e8f0', true: '#004aad' }}
            />
            <Text style={styles.consentLabel}>
              I authorize Loan Point to examine my credit report for consultation and advisory purposes as per RBI fair practices.
            </Text>
          </View>

          {!consultationSubmitted ? (
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={handleBookConsultation}
              activeOpacity={0.88}
            >
              <View style={styles.bookIconWrap}>
                <Ionicons name="calendar" size={15} color="#000000" />
              </View>
              <Text style={styles.bookBtnText}>Book Credit Consultation</Text>
              <Ionicons name="arrow-forward" size={16} color="#000000" />
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

      {/* 4. Relationship Manager Contact Bar */}
      <View style={styles.rmBarContainer}>
        <Image
          source={require('../../../assets/logo/arvind_patil.png')}
          style={styles.rmAvatar}
          resizeMode="cover"
        />
        <View style={styles.rmInfoWrap}>
          <Text style={styles.rmRoleLabel}>Lead Credit & CIBIL Advisor</Text>
          <Text style={styles.rmName}>Arvind Patil</Text>
          <Text style={styles.rmContact}>+91 98200 12345 · Available</Text>
        </View>
        <TouchableOpacity
          style={styles.rmCallBtn}
          onPress={() => (onOpenCall ? onOpenCall('+91 98200 12345') : Linking.openURL('tel:9820012345'))}
        >
          <Ionicons name="call" size={16} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rmWaBtn}
          onPress={() => (onOpenWhatsApp ? onOpenWhatsApp('+919820012345', 'Hi Arvind, I need advice on my CIBIL score & credit report.') : null)}
        >
          <FontAwesome5 name="whatsapp" size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 36,
    gap: 14,
  },
  heroBannerImageContainer: {
    width: '100%',
    aspectRatio: 2.36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0a3875',
    shadowColor: '#0a3875',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },

  /* 2. Credit Meter Hero Card */
  meterCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0a3875',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#0a3875',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
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
    marginBottom: 12,
  },
  meterBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meterSub: {
    fontSize: 10.5,
    fontWeight: '800',
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
    color: '#ffffff',
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
    marginTop: 8,
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
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  cibilInsightText: {
    flex: 1,
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
    lineHeight: 15,
  },

  /* 3. Filter Section */
  filterSection: {
    marginTop: 2,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },

  /* Card block */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8eff7',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  factorsList: {
    gap: 10,
  },
  factorItem: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  factorIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factorContent: {
    flex: 1,
  },
  factorTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  factorDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },

  /* PAN status */
  panStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 12,
  },
  panStatusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panStatusTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  panStatusSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  stepsGuidanceBlock: {
    gap: 6,
    marginBottom: 14,
  },
  guideStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a',
  },
  stepText: {
    fontSize: 11.5,
    color: '#475569',
  },
  govLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#004aad',
    paddingVertical: 11,
    borderRadius: 20,
  },
  govIconWrap: {
    marginRight: 2,
  },
  govLinkText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* Fee box */
  feeBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 12,
    padding: 10,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  feeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feeLabel: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600',
  },
  feeValueFree: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#16a34a',
  },
  feeValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#004aad',
  },
  consentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  consentLabel: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fbbf24',
    paddingVertical: 12,
    borderRadius: 22,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  bookIconWrap: {
    marginRight: 2,
  },
  bookBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#000000',
  },
  bookedSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  bookedText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    lineHeight: 16,
  },

  /* RM Bar */
  rmBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginTop: 4,
  },
  rmAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  rmInfoWrap: {
    flex: 1,
  },
  rmRoleLabel: {
    fontSize: 9.5,
    color: '#0284c7',
    fontWeight: '700',
  },
  rmName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  rmContact: {
    fontSize: 10.5,
    color: '#475569',
    marginTop: 1,
  },
  rmCallBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  rmWaBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
