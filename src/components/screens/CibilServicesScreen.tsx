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
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../../types';
import { colors } from '../../theme/colors';

interface CibilServicesScreenProps {
  user: UserProfile | null;
  onRequestConsultation: () => void;
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

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.card}>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>CREDIT ADVISORY</Text>
        </View>
        <Text style={styles.screenHeading}>CIBIL & Credit Services</Text>
        <Text style={styles.screenSub}>
          Credit report assistance, error guidance & CIBIL score enhancement
        </Text>
      </View>

      {/* Credit Meter Card */}
      <View style={styles.meterCard}>
        <View style={styles.meterTopRow}>
          <View>
            <Text style={styles.meterSub}>Estimated Credit Health</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreVal}>{score}</Text>
              <Text style={styles.scoreBand}>Prime Score</Text>
            </View>
          </View>
          <View style={styles.rangeBadge}>
            <Text style={styles.rangeText}>Score Range: 300–900</Text>
          </View>
        </View>

        {/* Visual Score Track */}
        <View style={styles.scoreBarTrack}>
          <View style={[styles.barSegment, { flex: 25, backgroundColor: '#ef4444' }]} />
          <View style={[styles.barSegment, { flex: 20, backgroundColor: '#f59e0b' }]} />
          <View style={[styles.barSegment, { flex: 25, backgroundColor: '#3b82f6' }]} />
          <View style={[styles.barSegment, { flex: 30, backgroundColor: '#10b981' }]} />
        </View>

        <View style={styles.scoreLegendRow}>
          <Text style={styles.scoreLegendText}>300 (Poor)</Text>
          <Text style={styles.scoreLegendText}>650 (Fair)</Text>
          <Text style={styles.scoreLegendText}>750+ (Prime)</Text>
          <Text style={styles.scoreLegendText}>900</Text>
        </View>
      </View>

      {/* Clean Sub Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {[
          { id: 'education', label: 'Score Education' },
          { id: 'errors', label: 'Report Errors' },
          { id: 'pan_aadhaar', label: 'PAN–Aadhaar Link' },
          { id: 'consult', label: 'Book Advisory' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveTab(tab.id as typeof activeTab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab 1: Education */}
      {activeTab === 'education' && (
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>What Influences Your CIBIL Score?</Text>
          <View style={styles.factorsList}>
            <View style={styles.factorItem}>
              <Text style={styles.factorTitle}>1. Repayment History (35%)</Text>
              <Text style={styles.factorDesc}>
                Timely payment of credit card dues and loan EMIs has the single highest impact.
              </Text>
            </View>
            <View style={styles.factorItem}>
              <Text style={styles.factorTitle}>2. Credit Utilization (30%)</Text>
              <Text style={styles.factorDesc}>
                Keep monthly credit card balances under 30% of total limit.
              </Text>
            </View>
            <View style={styles.factorItem}>
              <Text style={styles.factorTitle}>3. Credit Mix & Inquiries (20%)</Text>
              <Text style={styles.factorDesc}>
                A healthy balance of secured (home/car) and unsecured (personal) loans avoids multiple hard inquiries.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Tab 2: Error Guidance */}
      {activeTab === 'errors' && (
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Common Credit Report Errors</Text>
          <View style={styles.factorsList}>
            <View style={styles.factorItem}>
              <Text style={styles.factorTitle}>Closed Loans Shown as Active (DPD)</Text>
              <Text style={styles.factorDesc}>
                Lenders sometimes delay updating settlement files. Always collect your physical No Objection Certificate (NOC).
              </Text>
            </View>
            <View style={styles.factorItem}>
              <Text style={styles.factorTitle}>Identity & PAN Mismatch</Text>
              <Text style={styles.factorDesc}>
                Typographical errors can merge someone else's default entries into your bureau file. Loan Point assists with bureau dispute filings.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Tab 3: PAN-Aadhaar Linking */}
      {activeTab === 'pan_aadhaar' && (
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>PAN–Aadhaar Linking Status</Text>

          <View style={styles.panStatusBox}>
            <Ionicons name="shield-checkmark" size={24} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.panStatusTitle}>Aadhaar Linked: Verified</Text>
              <Text style={styles.panStatusSub}>
                Your PAN is verified and active for bank loan disbursement under Income Tax compliance.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.stepTitle}>How to Link PAN with Aadhaar Online:</Text>
          <Text style={styles.stepText}>1. Visit the Income Tax e-Filing portal.</Text>
          <Text style={styles.stepText}>2. Enter your 10-digit PAN and 12-digit Aadhaar Number.</Text>
          <Text style={styles.stepText}>3. Verify with OTP sent to your Aadhaar-registered mobile.</Text>

          <TouchableOpacity
            style={styles.govLinkBtn}
            onPress={handleOpenGovPortal}
            activeOpacity={0.8}
          >
            <Text style={styles.govLinkText}>Open Income Tax Portal</Text>
            <Ionicons name="open-outline" size={15} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Tab 4: Consultation with Fee & Consent */}
      {activeTab === 'consult' && (
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Schedule CIBIL Advisory Session</Text>
          <Text style={styles.factorDesc}>
            Speak with Loan Point's lead credit advisory team in Shivaji Nagar, Nanded for personalized credit score restoration.
          </Text>

          {/* Fee Transparency Box */}
          <View style={styles.feeBox}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Preliminary Assessment</Text>
              <Text style={styles.feeValueFree}>FREE</Text>
            </View>
            <View style={[styles.feeRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.feeLabel}>Bureau Dispute & Legal Rectification</Text>
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
              <Text style={styles.bookBtnText}>Book Credit Consultation</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.bookedSuccess}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
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
    paddingBottom: 32,
    backgroundColor: colors.background,
    gap: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  tagBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  screenHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  screenSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  meterCard: {
    backgroundColor: colors.cardNavyFrom,
    borderRadius: 12,
    padding: 14,
  },
  meterTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  meterSub: {
    fontSize: 11,
    color: '#93c5fd',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  scoreVal: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
  },
  scoreBand: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34d399',
  },
  rangeBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rangeText: {
    fontSize: 10,
    color: '#dbeafe',
  },
  scoreBarTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 8,
  },
  barSegment: {
    height: '100%',
  },
  scoreLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreLegendText: {
    fontSize: 9,
    color: '#93c5fd',
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  factorsList: {
    gap: 10,
  },
  factorItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
    paddingBottom: 8,
  },
  factorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  factorDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  panStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ecfdf5',
    padding: 10,
    borderRadius: 8,
  },
  panStatusTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  panStatusSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  stepText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 18,
  },
  govLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
    marginTop: 12,
  },
  govLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  feeBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginVertical: 10,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  feeLabel: {
    fontSize: 11,
    color: colors.text,
  },
  feeValueFree: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  feeValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  consentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceSubtle,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  consentLabel: {
    flex: 1,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 11,
    gap: 6,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  bookedSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
  },
  bookedText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#065f46',
  },
});
