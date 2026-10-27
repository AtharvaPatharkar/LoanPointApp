import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BANK_RATE_COMPARISONS } from '../../data/mockData';
import { LoanType } from '../../types';
import { colors } from '../../theme/colors';

interface RateComparisonScreenProps {
  onApplyForLoan: (loanType: LoanType) => void;
}

export const RateComparisonScreen: React.FC<RateComparisonScreenProps> = ({
  onApplyForLoan,
}) => {
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType>('home');

  const filterTabs: { id: LoanType; label: string }[] = [
    { id: 'home', label: 'Home Loan' },
    { id: 'personal', label: 'Personal Loan' },
    { id: 'business', label: 'Business Loan' },
    { id: 'mortgage', label: 'Mortgage (LAP)' },
  ];

  const filteredRates = BANK_RATE_COMPARISONS.filter(
    (item) => item.loanType === selectedLoanType
  );

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.card}>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>MARKET BENCHMARKS</Text>
        </View>
        <Text style={styles.screenHeading}>Interest Rate Comparison</Text>
        <Text style={styles.screenSub}>
          Indicative benchmark ranges from verified public & private commercial lenders
        </Text>
      </View>

      {/* Loan Type Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {filterTabs.map((tab) => {
          const isActive = selectedLoanType === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedLoanType(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Lender Rates List */}
      <View style={styles.listBlock}>
        {filteredRates.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No specific benchmarks loaded for this category. Contact Loan Point advisor for quotes.
            </Text>
          </View>
        ) : (
          filteredRates.map((bank, idx) => (
            <View key={idx} style={styles.bankCard}>
              <View style={styles.bankHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={styles.bankTitleRow}>
                    <Text style={styles.bankName}>{bank.lenderName}</Text>
                    <View style={styles.bankSectorBadge}>
                      <Text style={styles.bankSectorText}>
                        {bank.isPublicSector ? 'Public Sector' : 'Private Bank'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.bankFeeSub}>
                    Fee: {bank.processingFee} · Max {bank.maxTenureYears} Yrs
                  </Text>
                </View>

                <View style={styles.rateCol}>
                  <Text style={styles.rateLabel}>Indicative Rate</Text>
                  <Text style={styles.rateVal}>
                    {bank.indicativeRateMin.toFixed(2)}% – {bank.indicativeRateMax.toFixed(2)}%
                  </Text>
                </View>
              </View>

              <View style={styles.bankNoteBox}>
                <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
                <Text style={styles.bankNoteText}>{bank.note}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Disclaimer Box */}
      <View style={styles.disclaimerBox}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
        <Text style={styles.disclaimerText}>
          <Text style={styles.boldText}>Verification Disclaimer: </Text>
          Interest rates listed are indicative market benchmarks compiled for guidance. Actual sanctioned rates are determined by respective lending banks after assessing customer CIBIL score, income stability, and loan-to-value ratio.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.applyBtn}
        onPress={() => onApplyForLoan(selectedLoanType)}
        activeOpacity={0.8}
      >
        <Text style={styles.applyBtnText}>
          Apply for {filterTabs.find((t) => t.id === selectedLoanType)?.label}
        </Text>
        <Ionicons name="arrow-forward" size={16} color={colors.white} />
      </TouchableOpacity>
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
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3730a3',
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
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  listBlock: {
    gap: 10,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  bankCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    elevation: 1,
    gap: 8,
  },
  bankHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bankTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  bankName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  bankSectorBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bankSectorText: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
  },
  bankFeeSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  rateCol: {
    alignItems: 'flex-end',
  },
  rateLabel: {
    fontSize: 9,
    color: colors.textMuted,
  },
  rateVal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 1,
  },
  bankNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 8,
    gap: 6,
  },
  bankNoteText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  disclaimerText: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 15,
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
  },
  applyBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
});
