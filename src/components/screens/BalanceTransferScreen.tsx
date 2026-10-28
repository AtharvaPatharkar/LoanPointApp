import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { calculateBalanceTransferSavings, formatINR } from '../../utils/calculator';
import { COMPANY_INFO } from '../../data/mockData';
import { colors } from '../../theme/colors';

interface BalanceTransferScreenProps {
  onApplyForTransfer: (amount: number) => void;
  onRequestAssistance: () => void;
}

export const BalanceTransferScreen: React.FC<BalanceTransferScreenProps> = ({
  onApplyForTransfer,
  onRequestAssistance,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'transfer' | 'foreclosure'>('transfer');

  const [outstandingPrincipal, setOutstandingPrincipal] = useState<number>(1500000);
  const [currentRate, setCurrentRate] = useState<number>(12.5);
  const [remainingTenureMonths, setRemainingTenureMonths] = useState<number>(48);
  const [newRate, setNewRate] = useState<number>(9.5);

  const savings = calculateBalanceTransferSavings(
    outstandingPrincipal,
    currentRate,
    remainingTenureMonths,
    newRate
  );

  const handleReset = () => {
    setOutstandingPrincipal(1500000);
    setCurrentRate(12.5);
    setRemainingTenureMonths(48);
    setNewRate(9.5);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerIconBadge}>
            <MaterialCommunityIcons name="swap-horizontal-bold" size={24} color="#ffffff" />
          </View>
          <View style={styles.headerTitleWrap}>
            <View style={styles.tagBadge}>
              <View style={styles.tagDot} />
              <Text style={styles.tagText}>REFINANCING & DEBT CLOSURE</Text>
            </View>
            <Text style={styles.screenHeading}>Balance Transfer & Foreclosure</Text>
          </View>
        </View>
        <Text style={styles.screenSub}>
          Reduce your monthly EMI burden or close existing debts systematically under RBI guidelines.
        </Text>
      </View>

      {/* 2. Modern Segmented Tab Switcher */}
      <View style={styles.segmentedRow}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSubTab === 'transfer' && styles.segmentBtnActive]}
          onPress={() => setActiveSubTab('transfer')}
          activeOpacity={0.7}
        >
          <View style={[styles.segmentIconWrap, activeSubTab === 'transfer' && styles.segmentIconWrapActive]}>
            <MaterialCommunityIcons
              name="calculator"
              size={15}
              color={activeSubTab === 'transfer' ? '#ffffff' : colors.textMuted}
            />
          </View>
          <Text style={[styles.segmentText, activeSubTab === 'transfer' && styles.segmentTextActive]}>
            Transfer Calculator
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSubTab === 'foreclosure' && styles.segmentBtnActive]}
          onPress={() => setActiveSubTab('foreclosure')}
          activeOpacity={0.7}
        >
          <View style={[styles.segmentIconWrap, activeSubTab === 'foreclosure' && styles.segmentIconWrapActive]}>
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={activeSubTab === 'foreclosure' ? '#ffffff' : colors.textMuted}
            />
          </View>
          <Text style={[styles.segmentText, activeSubTab === 'foreclosure' && styles.segmentTextActive]}>
            Foreclosure Desk
          </Text>
        </TouchableOpacity>
      </View>

      {activeSubTab === 'transfer' ? (
        <>
          {/* 3. Potential Lifetime Savings Hero Card */}
          <View style={styles.savingsHeroCard}>
            <View style={styles.heroGlowCircle} />

            <View style={styles.savingsHeroHeader}>
              <View style={styles.badgeRow}>
                <View style={styles.badgeDot} />
                <Text style={styles.savingsHeroLabel}>POTENTIAL LIFETIME SAVINGS</Text>
              </View>
              <TouchableOpacity onPress={handleReset} activeOpacity={0.7} style={styles.resetBtn}>
                <View style={styles.resetIconWrap}>
                  <Ionicons name="refresh" size={11} color="#ffffff" />
                </View>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.savingsHeroVal}>{formatINR(savings.netLifetimeSavings)}</Text>
            <Text style={styles.savingsHeroSub}>
              Save approximately <Text style={styles.boldText}>{formatINR(savings.monthlySavings)}/mo</Text> on every single installment!
            </Text>

            <View style={styles.comparisonGridRow}>
              <View style={styles.comparisonBox}>
                <View style={styles.compHeader}>
                  <Ionicons name="time-outline" size={12} color="#fca5a5" />
                  <Text style={styles.compLabel}>Current Loan EMI</Text>
                </View>
                <Text style={styles.compVal}>{formatINR(savings.currentEmi)}/mo</Text>
                <Text style={styles.compRate}>@ {currentRate}% p.a.</Text>
              </View>

              <View style={[styles.comparisonBox, styles.comparisonBoxNew]}>
                <View style={styles.compHeader}>
                  <Ionicons name="checkmark-circle" size={12} color="#86efac" />
                  <Text style={[styles.compLabel, { color: '#86efac' }]}>Proposed New EMI</Text>
                </View>
                <Text style={[styles.compVal, { color: '#ffffff' }]}>{formatINR(savings.newEmi)}/mo</Text>
                <Text style={[styles.compRate, { color: '#a7f3d0' }]}>@ {newRate}% (New Bank Offer)</Text>
              </View>
            </View>
          </View>

          {/* 4. Financial Parameters Input Section */}
          <View style={styles.card}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.sectionIconBox}>
                <Ionicons name="options-outline" size={16} color={colors.primary} />
              </View>
              <Text style={styles.sectionHeading}>LOAN & REFINANCE DETAILS</Text>
            </View>

            {/* Outstanding Principal Field */}
            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <View style={[styles.fieldIconBox, { backgroundColor: colors.primary }]}>
                  <FontAwesome5 name="wallet" size={11} color="#ffffff" />
                </View>
                <Text style={styles.inputLabel}>
                  Outstanding Principal ({formatINR(outstandingPrincipal)})
                </Text>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>₹</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={outstandingPrincipal.toString()}
                  onChangeText={(v) => setOutstandingPrincipal(Number(v.replace(/\D/g, '')) || 0)}
                  placeholder="1500000"
                  placeholderTextColor={colors.textLight}
                />
              </View>
            </View>

            {/* Current Rate & Remaining Tenure */}
            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.fieldLabelRow}>
                  <View style={[styles.fieldIconBox, { backgroundColor: colors.secondaryRed }]}>
                    <MaterialCommunityIcons name="percent" size={12} color="#ffffff" />
                  </View>
                  <Text style={styles.inputLabel}>Current Rate</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={currentRate.toString()}
                    onChangeText={(v) => setCurrentRate(parseFloat(v) || 0)}
                    placeholder="12.5"
                    placeholderTextColor={colors.textLight}
                  />
                  <Text style={styles.inputSuffix}>%</Text>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.fieldLabelRow}>
                  <View style={[styles.fieldIconBox, { backgroundColor: colors.indigoNavy }]}>
                    <Ionicons name="calendar-outline" size={12} color="#ffffff" />
                  </View>
                  <Text style={styles.inputLabel}>Tenure Left</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={remainingTenureMonths.toString()}
                    onChangeText={(v) => setRemainingTenureMonths(Number(v.replace(/\D/g, '')) || 0)}
                    placeholder="48"
                    placeholderTextColor={colors.textLight}
                  />
                  <Text style={styles.inputSuffix}>Mos</Text>
                </View>
              </View>
            </View>

            {/* Proposed New Rate */}
            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <View style={[styles.fieldIconBox, { backgroundColor: '#16a34a' }]}>
                  <MaterialCommunityIcons name="trending-down" size={14} color="#ffffff" />
                </View>
                <Text style={styles.inputLabel}>Proposed New Interest Rate</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={newRate.toString()}
                  onChangeText={(v) => setNewRate(parseFloat(v) || 0)}
                  placeholder="9.5"
                  placeholderTextColor={colors.textLight}
                />
                <Text style={styles.inputSuffix}>% p.a.</Text>
              </View>
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => onApplyForTransfer(outstandingPrincipal)}
              activeOpacity={0.8}
            >
              <View style={styles.applyIconWrap}>
                <Ionicons name="flash" size={14} color="#ffffff" />
              </View>
              <Text style={styles.applyBtnText}>Apply for Balance Transfer</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* Foreclosure Guidance View */
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.secondaryRedLight }]}>
              <Ionicons name="document-lock-outline" size={16} color={colors.secondaryRed} />
            </View>
            <Text style={[styles.sectionHeading, { color: colors.secondaryRedDark }]}>
              LOAN FORECLOSURE GUIDELINES & PROCESS
            </Text>
          </View>

          <Text style={styles.bodyText}>
            Planning to close your personal, business, or housing loan before tenure? Loan Point helps you obtain the official foreclosure quote, verify penalty waivers under RBI rules, and retrieve your original property documents / NOC from lenders.
          </Text>

          <View style={styles.foreclosureStepsList}>
            <View style={styles.stepItem}>
              <View style={[styles.stepIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="document-text" size={17} color={colors.primary} />
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepTitle}>Step 1: Request Foreclosure Quote</Text>
                <Text style={styles.stepItemText}>
                  Obtain the official outstanding statement with principal balance and daily interest calculation.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={[styles.stepIconWrap, { backgroundColor: '#fef3c7' }]}>
                <MaterialCommunityIcons name="shield-check" size={18} color="#d97706" />
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepTitle}>Step 2: RBI Penalty Verification</Text>
                <Text style={styles.stepItemText}>
                  Ensure ZERO foreclosure penalty applies on all floating-rate individual loans per RBI circulars.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={[styles.stepIconWrap, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="checkmark-done-circle" size={18} color="#16a34a" />
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepTitle}>Step 3: NOC & Original Deed Retrieval</Text>
                <Text style={styles.stepItemText}>
                  Collect your No Objection Certificate (NOC) and verify formal lien removal from registry.
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.advisorCtaBtn}
            onPress={onRequestAssistance}
            activeOpacity={0.8}
          >
            <View style={styles.advisorCtaIconWrap}>
              <Ionicons name="headset" size={16} color="#ffffff" />
            </View>
            <Text style={styles.advisorCtaText}>Speak with Foreclosure Desk</Text>
            <Ionicons name="chevron-forward" size={16} color="#ffffff" />
          </TouchableOpacity>
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
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
    backgroundColor: colors.primaryLight,
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
    backgroundColor: colors.primary,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDeep,
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

  /* 2. Modern Segmented Tab Switcher */
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 7,
  },
  segmentBtnActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentIconWrapActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.text,
    fontWeight: '800',
  },

  /* 3. Savings Spotlight Hero Card */
  savingsHeroCard: {
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
    backgroundColor: 'rgba(0, 142, 204, 0.18)',
  },
  savingsHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
  },
  savingsHeroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93c5fd',
    letterSpacing: 0.6,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  resetIconWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  savingsHeroVal: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  savingsHeroSub: {
    fontSize: 12,
    color: '#bae6fd',
    marginTop: 3,
    lineHeight: 17,
  },
  boldText: {
    fontWeight: '800',
    color: '#ffffff',
  },
  comparisonGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
  },
  comparisonBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  comparisonBoxNew: {
    backgroundColor: 'rgba(22, 163, 74, 0.25)',
    borderColor: 'rgba(134, 239, 172, 0.35)',
  },
  compHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  compLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  compVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
  compRate: {
    fontSize: 10,
    color: '#93c5fd',
    marginTop: 2,
    fontWeight: '600',
  },

  /* 4. Form Cards */
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
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDeep,
    letterSpacing: 0.8,
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fieldIconBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputPrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    marginRight: 6,
  },
  inputSuffix: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginLeft: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },

  /* Apply CTA */
  applyBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  applyIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.2,
  },

  /* Foreclosure Screen Elements */
  bodyText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  foreclosureStepsList: {
    gap: 12,
    marginBottom: 18,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 12,
  },
  stepIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  stepTextWrap: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 3,
  },
  stepItemText: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16,
  },
  advisorCtaBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  advisorCtaIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisorCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.2,
  },
});
