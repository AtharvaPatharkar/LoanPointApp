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
import { calculateEligibility, formatINR } from '../../utils/calculator';
import { COMPANY_INFO } from '../../data/mockData';
import { colors } from '../../theme/colors';

interface EligibilityScreenProps {
  onApplyForLoan: (eligibleAmount: number) => void;
  onOpenAdvisorCall: () => void;
}

export const EligibilityScreen: React.FC<EligibilityScreenProps> = ({
  onApplyForLoan,
  onOpenAdvisorCall,
}) => {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(65000);
  const [existingEmis, setExistingEmis] = useState<number>(10000);
  const [tenureYears, setTenureYears] = useState<number>(5);
  const [tenureMonthsValue, setTenureMonthsValue] = useState<number>(60);
  const [tenureType, setTenureType] = useState<'years' | 'months'>('years');
  const [expectedRate, setExpectedRate] = useState<number>(10.5);

  const tenureMonths = tenureType === 'years' ? tenureYears * 12 : tenureMonthsValue;
  const result = calculateEligibility(monthlyIncome, existingEmis, tenureMonths, expectedRate);

  const handleSwitchTenureType = (type: 'years' | 'months') => {
    if (type === tenureType) return;
    if (type === 'months') {
      setTenureMonthsValue(Math.round(tenureYears * 12));
    } else {
      setTenureYears(Math.max(1, Math.round(tenureMonthsValue / 12)));
    }
    setTenureType(type);
  };

  const handleReset = () => {
    setMonthlyIncome(65000);
    setExistingEmis(10000);
    setTenureYears(5);
    setTenureMonthsValue(60);
    setTenureType('years');
    setExpectedRate(10.5);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerIconBadge}>
            <MaterialCommunityIcons name="calculator-variant" size={24} color="#ffffff" />
          </View>
          <View style={styles.headerTitleWrap}>
            <View style={styles.tagBadge}>
              <View style={styles.tagDot} />
              <Text style={styles.tagText}>PRELIMINARY BANK ESTIMATOR</Text>
            </View>
            <Text style={styles.screenHeading}>Loan Eligibility Calculator</Text>
          </View>
        </View>
        <Text style={styles.screenSub}>
          Calculated using standard RBI & Indian bank debt-to-income benchmarks (FOIR ≤ 50%).
        </Text>
      </View>

      {/* 2. Primary Result Spotlight Card */}
      <View style={styles.resultCard}>
        <View style={styles.resultGlowCircle} />

        <View style={styles.resultHeader}>
          <View style={styles.badgeRow}>
            <View style={styles.badgeDot} />
            <Text style={styles.resultLabel}>ESTIMATED MAX LOAN CAPACITY</Text>
          </View>
          <TouchableOpacity onPress={handleReset} activeOpacity={0.7} style={styles.resetBtn}>
            <View style={styles.resetIconWrap}>
              <Ionicons name="refresh" size={11} color="#ffffff" />
            </View>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.resultVal}>{formatINR(result.estimatedEligibleLoan)}</Text>
        <Text style={styles.resultSub}>
          Based on net monthly income of ₹{monthlyIncome.toLocaleString('en-IN')}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <View style={styles.metaIconRow}>
              <Ionicons name="wallet-outline" size={13} color="#93c5fd" />
              <Text style={styles.metaLabel}>Max Affordable New EMI</Text>
            </View>
            <Text style={styles.metaVal}>{formatINR(result.availableMonthlyEmi)}/mo</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaCol}>
            <View style={styles.metaIconRow}>
              <MaterialCommunityIcons name="chart-pie" size={13} color="#93c5fd" />
              <Text style={styles.metaLabel}>Existing FOIR Obligation</Text>
            </View>
            <Text style={styles.metaVal}>{result.foirPercentage}% FOIR</Text>
          </View>
        </View>
      </View>

      {/* 3. Financial Parameters Input Section */}
      <View style={styles.card}>
        <View style={styles.sectionHeadingRow}>
          <View style={styles.sectionIconBox}>
            <Ionicons name="options-outline" size={16} color={colors.primary} />
          </View>
          <Text style={styles.sectionHeading}>FINANCIAL PARAMETERS</Text>
        </View>

        {/* Monthly Income Field */}
        <View style={styles.fieldBlock}>
          <View style={styles.fieldLabelRow}>
            <View style={[styles.fieldIconBox, { backgroundColor: colors.primary }]}>
              <FontAwesome5 name="money-bill-wave" size={12} color="#ffffff" />
            </View>
            <Text style={styles.inputLabel}>Net Monthly Income / Salary</Text>
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputPrefix}>₹</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={monthlyIncome.toString()}
              onChangeText={(v) => setMonthlyIncome(Number(v.replace(/\D/g, '')) || 0)}
              placeholder="e.g. 65000"
              placeholderTextColor={colors.textLight}
            />
          </View>
        </View>

        {/* Existing EMIs Field */}
        <View style={styles.fieldBlock}>
          <View style={styles.fieldLabelRow}>
            <View style={[styles.fieldIconBox, { backgroundColor: colors.secondaryRed }]}>
              <MaterialCommunityIcons name="credit-card-minus-outline" size={14} color="#ffffff" />
            </View>
            <Text style={styles.inputLabel}>Existing Monthly Loan EMIs</Text>
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputPrefix}>₹</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={existingEmis.toString()}
              onChangeText={(v) => setExistingEmis(Number(v.replace(/\D/g, '')) || 0)}
              placeholder="e.g. 10000"
              placeholderTextColor={colors.textLight}
            />
          </View>
        </View>

        {/* Tenure & Rate in 2-Column Grid */}
        <View style={styles.twoColRow}>
          {/* Desired Tenure with Yr / Mo switch */}
          <View style={{ flex: 1.15 }}>
            <View style={styles.fieldLabelRow}>
              <View style={[styles.fieldIconBox, { backgroundColor: colors.indigoNavy }]}>
                <Ionicons name="calendar-outline" size={12} color="#ffffff" />
              </View>
              <Text style={styles.inputLabel}>Tenure</Text>
            </View>

            {/* Two Option Toggle: Years vs Months */}
            <View style={styles.tenureToggleRow}>
              <TouchableOpacity
                style={[styles.tenureToggleBtn, tenureType === 'years' && styles.tenureToggleBtnActive]}
                onPress={() => handleSwitchTenureType('years')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tenureToggleBtnText,
                    tenureType === 'years' && styles.tenureToggleBtnTextActive,
                  ]}
                >
                  Yrs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tenureToggleBtn, tenureType === 'months' && styles.tenureToggleBtnActive]}
                onPress={() => handleSwitchTenureType('months')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tenureToggleBtnText,
                    tenureType === 'months' && styles.tenureToggleBtnTextActive,
                  ]}
                >
                  Mos
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={tenureType === 'years' ? tenureYears.toString() : tenureMonthsValue.toString()}
                onChangeText={(v) => {
                  const val = Number(v.replace(/\D/g, '')) || 0;
                  if (tenureType === 'years') {
                    setTenureYears(val);
                  } else {
                    setTenureMonthsValue(val);
                  }
                }}
                placeholder={tenureType === 'years' ? '5' : '60'}
                placeholderTextColor={colors.textLight}
              />
              <Text style={styles.inputSuffix}>{tenureType === 'years' ? 'Yrs' : 'Mos'}</Text>
            </View>
          </View>

          {/* Expected Rate */}
          <View style={{ flex: 0.85 }}>
            <View style={styles.fieldLabelRow}>
              <View style={[styles.fieldIconBox, { backgroundColor: '#d97706' }]}>
                <MaterialCommunityIcons name="percent" size={12} color="#ffffff" />
              </View>
              <Text style={styles.inputLabel}>Interest</Text>
            </View>
            <View style={[styles.inputWrapper, { marginTop: 34 }]}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={expectedRate.toString()}
                onChangeText={(v) => setExpectedRate(parseFloat(v) || 0)}
                placeholder="10.5"
                placeholderTextColor={colors.textLight}
              />
              <Text style={styles.inputSuffix}>%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 4. Notice Banner */}
      <View style={styles.noticeBox}>
        <View style={styles.noticeIconWrap}>
          <Ionicons name="shield-checkmark" size={18} color="#ffffff" />
        </View>
        <View style={styles.noticeContent}>
          <Text style={styles.noticeTitle}>IMPORTANT NOTE</Text>
          <Text style={styles.noticeText}>
            This is an indicative estimate. Formal loan sanction and final sanction limits depend on lender credit underwriting, income verification (ITR / Form 16 / pay slips), and CIBIL score.
          </Text>
        </View>
      </View>

      {/* 5. Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.advisorBtn}
          onPress={onOpenAdvisorCall}
          activeOpacity={0.8}
        >
          <View style={styles.advisorIconWrap}>
            <Ionicons name="call" size={16} color="#ffffff" />
          </View>
          <View style={styles.advisorBtnTextWrap}>
            <Text style={styles.advisorBtnTitle}>Speak with Advisor</Text>
            <Text style={styles.advisorBtnSub}>{COMPANY_INFO.leadRelationshipManager}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.applyBtn}
          onPress={() => onApplyForLoan(result.estimatedEligibleLoan)}
          activeOpacity={0.8}
        >
          <View style={styles.applyIconWrap}>
            <Ionicons name="flash" size={14} color="#ffffff" />
          </View>
          <Text style={styles.applyBtnText}>Apply for Loan</Text>
          <Ionicons name="arrow-forward" size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 36,
    gap: 16,
  },
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

  /* 2. Spotlight Result Card */
  resultCard: {
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
  resultGlowCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 142, 204, 0.18)',
  },
  resultHeader: {
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
  resultLabel: {
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
  resultVal: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  resultSub: {
    fontSize: 12,
    color: '#bae6fd',
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  metaCol: {
    flex: 1,
  },
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginHorizontal: 12,
  },
  metaIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  metaLabel: {
    fontSize: 10,
    color: '#93c5fd',
    fontWeight: '600',
  },
  metaVal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },

  /* 3. Inputs Form */
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
  },
  tenureToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 2,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tenureToggleBtn: {
    flex: 1,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  tenureToggleBtnActive: {
    backgroundColor: colors.indigoNavy,
    shadowColor: colors.indigoNavy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tenureToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tenureToggleBtnTextActive: {
    color: colors.white,
    fontWeight: '800',
  },

  /* 4. Notice Banner */
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fcd34d',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  noticeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  noticeContent: {
    flex: 1,
    flexShrink: 1,
  },
  noticeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  noticeText: {
    fontSize: 11.5,
    color: '#78350f',
    lineHeight: 16.5,
    fontWeight: '500',
    flexWrap: 'wrap',
  },

  /* 5. Action Buttons */
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  advisorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  advisorIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  advisorBtnTextWrap: {
    flex: 1,
  },
  advisorBtnTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  advisorBtnSub: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 1,
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.2,
  },
});
