import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [expectedRate, setExpectedRate] = useState<number>(10.5);

  const tenureMonths = tenureYears * 12;
  const result = calculateEligibility(monthlyIncome, existingEmis, tenureMonths, expectedRate);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.card}>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>PRELIMINARY ESTIMATOR</Text>
        </View>
        <Text style={styles.screenHeading}>Loan Eligibility Calculator</Text>
        <Text style={styles.screenSub}>
          Based on standard Indian banking debt-to-income (FOIR ≤ 50%) parameters
        </Text>
      </View>

      {/* Result Card */}
      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>Estimated Max Loan Capacity</Text>
        <Text style={styles.resultVal}>{formatINR(result.estimatedEligibleLoan)}</Text>
        <Text style={styles.resultSub}>
          Preliminary estimate based on ₹{monthlyIncome.toLocaleString('en-IN')}/mo income
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Max Affordable New EMI</Text>
            <Text style={styles.metaVal}>{formatINR(result.availableMonthlyEmi)}/mo</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Existing Obligation Ratio</Text>
            <Text style={styles.metaVal}>{result.foirPercentage}% FOIR</Text>
          </View>
        </View>
      </View>

      {/* Inputs Form */}
      <View style={styles.card}>
        <Text style={styles.sectionHeading}>FINANCIAL PARAMETERS</Text>

        <Text style={styles.inputLabel}>Net Monthly Salary / Income (₹)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={monthlyIncome.toString()}
          onChangeText={(v) => setMonthlyIncome(Number(v.replace(/\D/g, '')) || 0)}
        />

        <Text style={styles.inputLabel}>Existing Monthly Loan EMIs (₹)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={existingEmis.toString()}
          onChangeText={(v) => setExistingEmis(Number(v.replace(/\D/g, '')) || 0)}
        />

        <View style={styles.twoColRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Desired Tenure (Yrs)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tenureYears.toString()}
              onChangeText={(v) => setTenureYears(Number(v.replace(/\D/g, '')) || 0)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Expected Rate (%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={expectedRate.toString()}
              onChangeText={(v) => setExpectedRate(parseFloat(v) || 0)}
            />
          </View>
        </View>
      </View>

      {/* Notice Banner */}
      <View style={styles.noticeBox}>
        <Ionicons name="warning-outline" size={16} color="#b45309" />
        <Text style={styles.noticeText}>
          <Text style={styles.boldText}>Important Notice: </Text>
          This eligibility calculation is a preliminary guide and not a formal loan sanction decision. Approvals depend on bank underwriting, verified ITR/salary slips, property valuation, and credit bureau track record.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.advisorBtn}
          onPress={onOpenAdvisorCall}
          activeOpacity={0.8}
        >
          <Ionicons name="call-outline" size={14} color={colors.primary} />
          <Text style={styles.advisorBtnText}>Discuss with Arvind Patil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.applyBtn}
          onPress={() => onApplyForLoan(result.estimatedEligibleLoan)}
          activeOpacity={0.8}
        >
          <Text style={styles.applyBtnText}>Apply for Loan</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.white} />
        </TouchableOpacity>
      </View>
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    elevation: 1,
  },
  tagBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065f46',
  },
  screenHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  screenSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  resultCard: {
    backgroundColor: '#064e3b',
    borderRadius: 18,
    padding: 16,
    elevation: 2,
  },
  resultLabel: {
    fontSize: 11,
    color: '#a7f3d0',
    fontWeight: '500',
  },
  resultVal: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    marginTop: 2,
  },
  resultSub: {
    fontSize: 11,
    color: '#6ee7b7',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    color: '#a7f3d0',
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: colors.text,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  noticeText: {
    fontSize: 11,
    color: '#92400e',
    lineHeight: 16,
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  advisorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  advisorBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  applyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
});
