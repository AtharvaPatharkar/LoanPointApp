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

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.card}>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>REFINANCING & CLOSURE</Text>
        </View>
        <Text style={styles.screenHeading}>Balance Transfer & Foreclosure</Text>
        <Text style={styles.screenSub}>
          Reduce your monthly financial burden or close existing debts systematically
        </Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedRow}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSubTab === 'transfer' && styles.segmentBtnActive]}
          onPress={() => setActiveSubTab('transfer')}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentText, activeSubTab === 'transfer' && styles.segmentTextActive]}>
            Transfer Calculator
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSubTab === 'foreclosure' && styles.segmentBtnActive]}
          onPress={() => setActiveSubTab('foreclosure')}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentText, activeSubTab === 'foreclosure' && styles.segmentTextActive]}>
            Foreclosure Assistance
          </Text>
        </TouchableOpacity>
      </View>

      {activeSubTab === 'transfer' ? (
        <>
          {/* Savings Highlight Card */}
          <View style={styles.savingsHeroCard}>
            <Text style={styles.savingsHeroLabel}>Potential Lifetime Savings</Text>
            <Text style={styles.savingsHeroVal}>{formatINR(savings.netLifetimeSavings)}</Text>
            <Text style={styles.savingsHeroSub}>
              Save approximately <Text style={styles.boldText}>{formatINR(savings.monthlySavings)}</Text> on every monthly installment!
            </Text>

            <View style={styles.comparisonGridRow}>
              <View style={styles.comparisonBox}>
                <Text style={styles.compLabel}>Current Loan EMI</Text>
                <Text style={styles.compVal}>{formatINR(savings.currentEmi)}/mo</Text>
                <Text style={styles.compRate}>@ {currentRate}%</Text>
              </View>
              <View style={styles.comparisonBox}>
                <Text style={styles.compLabel}>Proposed New EMI</Text>
                <Text style={styles.compVal}>{formatINR(savings.newEmi)}/mo</Text>
                <Text style={[styles.compRate, { color: '#a7f3d0' }]}>@ {newRate}% (Bank Offer)</Text>
              </View>
            </View>
          </View>

          {/* Stepper Inputs */}
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>LOAN DETAILS</Text>

            <Text style={styles.inputLabel}>Outstanding Principal: {formatINR(outstandingPrincipal)}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={outstandingPrincipal.toString()}
              onChangeText={(v) => setOutstandingPrincipal(Number(v.replace(/\D/g, '')) || 0)}
            />

            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Current Rate (% p.a.)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={currentRate.toString()}
                  onChangeText={(v) => setCurrentRate(parseFloat(v) || 0)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Remaining Tenure (Mo)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={remainingTenureMonths.toString()}
                  onChangeText={(v) => setRemainingTenureMonths(Number(v.replace(/\D/g, '')) || 0)}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>New Interest Rate (% p.a.)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={newRate.toString()}
              onChangeText={(v) => setNewRate(parseFloat(v) || 0)}
            />

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => onApplyForTransfer(outstandingPrincipal)}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>Apply for Balance Transfer</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* Foreclosure Guidance View */
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>LOAN FORECLOSURE ASSISTANCE</Text>
          <Text style={styles.bodyText}>
            Thinking of closing your personal, business, or housing loan before tenure? Loan Point helps you obtain the official foreclosure quote, verify penalty waivers under RBI guidelines, and retrieve your original property documents / NOC from lenders.
          </Text>

          <View style={styles.foreclosureStepsList}>
            <View style={styles.stepItem}>
              <Ionicons name="document-text-outline" size={16} color={colors.primary} />
              <Text style={styles.stepItemText}>
                Step 1: Request Foreclosure / Outstanding Statement from your existing lender.
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Ionicons name="calculator-outline" size={16} color={colors.primary} />
              <Text style={styles.stepItemText}>
                Step 2: Check for Zero Foreclosure Penalty applicability on floating-rate individual loans.
              </Text>
            </View>
            <View style={styles.stepItem}>
              <Ionicons name="checkmark-done-circle-outline" size={16} color="#059669" />
              <Text style={styles.stepItemText}>
                Step 3: Collect No Objection Certificate (NOC) and verify lien release.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.advisorCtaBtn}
            onPress={onRequestAssistance}
            activeOpacity={0.8}
          >
            <Ionicons name="headset-outline" size={16} color={colors.white} />
            <Text style={styles.advisorCtaText}>Speak with Foreclosure Desk</Text>
          </TouchableOpacity>
        </View>
      )}
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
    backgroundColor: colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400e',
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
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: colors.white,
    elevation: 1,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  savingsHeroCard: {
    backgroundColor: '#b45309',
    borderRadius: 18,
    padding: 16,
    elevation: 2,
  },
  savingsHeroLabel: {
    fontSize: 11,
    color: '#fef3c7',
    fontWeight: '500',
  },
  savingsHeroVal: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    marginTop: 2,
  },
  savingsHeroSub: {
    fontSize: 11,
    color: '#fde68a',
    marginTop: 2,
    lineHeight: 15,
  },
  boldText: {
    fontWeight: '700',
    color: colors.white,
  },
  comparisonGridRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  comparisonBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    borderRadius: 10,
    padding: 8,
  },
  compLabel: {
    fontSize: 9,
    color: '#fef3c7',
  },
  compVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
    marginTop: 2,
  },
  compRate: {
    fontSize: 9,
    color: '#fde68a',
    marginTop: 1,
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
  applyBtn: {
    flexDirection: 'row',
    backgroundColor: colors.accentGold,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  bodyText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 12,
  },
  foreclosureStepsList: {
    gap: 10,
    marginBottom: 14,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surfaceSubtle,
    padding: 10,
    borderRadius: 10,
  },
  stepItemText: {
    fontSize: 11,
    color: colors.text,
    flex: 1,
    lineHeight: 15,
  },
  advisorCtaBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  advisorCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
});
