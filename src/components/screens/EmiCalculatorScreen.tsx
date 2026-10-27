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
import { Ionicons } from '@expo/vector-icons';
import { calculateEMI, calculateTotalInterest, calculateTotalPayment, formatINR } from '../../utils/calculator';
import { LoanType } from '../../types';
import { colors } from '../../theme/colors';
import { CustomSlider } from '../common/CustomSlider';

interface EmiCalculatorScreenProps {
  initialLoanType?: LoanType;
  onApplyWithValues?: (amount: number, tenure: number) => void;
}

export const EmiCalculatorScreen: React.FC<EmiCalculatorScreenProps> = ({
  onApplyWithValues,
}) => {
  const [loanAmount, setLoanAmount] = useState<number>(500000);
  const [interestRate, setInterestRate] = useState<number>(10.5);

  // Tenure Mode: 'years' or 'months'
  const [tenureType, setTenureType] = useState<'years' | 'months'>('years');
  const [tenureYears, setTenureYears] = useState<number>(3);
  const [tenureMonths, setTenureMonths] = useState<number>(36);

  // Editable direct input text state so user can type freely without fixed rigid constraints
  const [amountInput, setAmountInput] = useState<string>('500000');
  const [rateInput, setRateInput] = useState<string>('10.5');
  const [tenureInput, setTenureInput] = useState<string>('3');

  // Unified Total Months for EMI calculations
  const totalTenureMonths = tenureType === 'years'
    ? Math.max(1, Math.round(tenureYears * 12))
    : Math.max(1, Math.round(tenureMonths));

  const emi = calculateEMI(loanAmount, interestRate, totalTenureMonths);
  const totalPayment = calculateTotalPayment(emi, totalTenureMonths);
  const totalInterest = calculateTotalInterest(loanAmount, totalPayment);

  // Percentage breakdown for visual bar
  const safeTotalPayment = totalPayment > 0 ? totalPayment : 1;
  const principalPercent = Math.min(100, Math.max(0, (loanAmount / safeTotalPayment) * 100));
  const interestPercent = Math.max(0, 100 - principalPercent);

  // Amount Handlers
  const handleAmountSlider = (val: number) => {
    setLoanAmount(val);
    setAmountInput(val.toString());
  };

  const handleAmountInputChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmountInput(cleaned);
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed)) {
      setLoanAmount(Math.min(10000000, Math.max(10000, parsed)));
    }
  };

  const handleAmountBlur = () => {
    const parsed = parseInt(amountInput, 10);
    if (isNaN(parsed) || parsed < 10000) {
      setLoanAmount(10000);
      setAmountInput('10000');
    } else if (parsed > 10000000) {
      setLoanAmount(10000000);
      setAmountInput('10000000');
    } else {
      setLoanAmount(parsed);
      setAmountInput(parsed.toString());
    }
  };

  // Interest Rate Handlers
  const handleRateSlider = (val: number) => {
    const rounded = parseFloat(val.toFixed(2));
    setInterestRate(rounded);
    setRateInput(rounded.toString());
  };

  const handleRateInputChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setRateInput(cleaned);
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      setInterestRate(Math.min(30, Math.max(1, parsed)));
    }
  };

  const handleRateBlur = () => {
    const parsed = parseFloat(rateInput);
    if (isNaN(parsed) || parsed < 1) {
      setInterestRate(1);
      setRateInput('1');
    } else if (parsed > 30) {
      setInterestRate(30);
      setRateInput('30');
    } else {
      const rounded = parseFloat(parsed.toFixed(2));
      setInterestRate(rounded);
      setRateInput(rounded.toString());
    }
  };

  // Mode Switch Handler (Years <-> Months)
  const handleSwitchTenureType = (type: 'years' | 'months') => {
    if (type === tenureType) return;
    setTenureType(type);
    if (type === 'years') {
      const yrs = Math.max(0.5, Math.min(30, parseFloat((totalTenureMonths / 12).toFixed(1))));
      setTenureYears(yrs);
      setTenureInput(yrs.toString());
    } else {
      const mos = Math.max(6, Math.min(360, Math.round(tenureYears * 12)));
      setTenureMonths(mos);
      setTenureInput(mos.toString());
    }
  };

  // Tenure Handlers
  const handleTenureSlider = (val: number) => {
    if (tenureType === 'years') {
      setTenureYears(val);
      setTenureInput(val.toString());
    } else {
      setTenureMonths(val);
      setTenureInput(val.toString());
    }
  };

  const handleTenureInputChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setTenureInput(cleaned);
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      if (tenureType === 'years') {
        setTenureYears(Math.min(30, Math.max(0.5, parsed)));
      } else {
        setTenureMonths(Math.min(360, Math.max(1, Math.round(parsed))));
      }
    }
  };

  const handleTenureBlur = () => {
    const parsed = parseFloat(tenureInput);
    if (tenureType === 'years') {
      if (isNaN(parsed) || parsed < 0.5) {
        setTenureYears(1);
        setTenureInput('1');
      } else if (parsed > 30) {
        setTenureYears(30);
        setTenureInput('30');
      } else {
        setTenureYears(parsed);
        setTenureInput(parsed.toString());
      }
    } else {
      if (isNaN(parsed) || parsed < 6) {
        setTenureMonths(6);
        setTenureInput('6');
      } else if (parsed > 360) {
        setTenureMonths(360);
        setTenureInput('360');
      } else {
        const rounded = Math.round(parsed);
        setTenureMonths(rounded);
        setTenureInput(rounded.toString());
      }
    }
  };

  const handleReset = () => {
    setLoanAmount(500000);
    setAmountInput('500000');
    setInterestRate(10.5);
    setRateInput('10.5');
    setTenureType('years');
    setTenureYears(3);
    setTenureMonths(36);
    setTenureInput('3');
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Premium EMI Result Header Card */}
        <View style={styles.resultCard}>
          {/* Subtle Background Glow Accent */}
          <View style={styles.glowCircle} />

          <View style={styles.resultHeader}>
            <View style={styles.badgeRow}>
              <View style={styles.badgeDot} />
              <Text style={styles.resultLabel}>ESTIMATED MONTHLY INSTALLMENT</Text>
            </View>
            <TouchableOpacity onPress={handleReset} activeOpacity={0.7} style={styles.resetBtn}>
              <Ionicons name="refresh" size={13} color="#bfdbfe" />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* EMI Big Figure */}
          <View style={styles.emiHighlightRow}>
            <Text style={styles.emiValue}>{formatINR(emi)}</Text>
            <Text style={styles.emiUnit}>/ month</Text>
          </View>
          <Text style={styles.emiPeriod}>
            Payable for {tenureType === 'years' ? `${tenureYears} ${tenureYears === 1 ? 'Year' : 'Years'}` : `${tenureMonths} Months`} ({totalTenureMonths} installments)
          </Text>

          {/* Visual Ratio Bar */}
          <View style={styles.ratioBarContainer}>
            <View
              style={[
                styles.ratioPrincipal,
                { width: `${principalPercent.toFixed(1)}%` },
              ]}
            />
            <View
              style={[
                styles.ratioInterest,
                { width: `${interestPercent.toFixed(1)}%` },
              ]}
            />
          </View>

          <View style={styles.ratioLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#38bdf8' }]} />
              <Text style={styles.legendText}>Principal ({principalPercent.toFixed(0)}%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#fbbf24' }]} />
              <Text style={styles.legendText}>Interest ({interestPercent.toFixed(0)}%)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Breakdown Totals */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownCol}>
              <Text style={styles.breakdownLabel}>Principal Amount</Text>
              <Text style={styles.breakdownVal}>{formatINR(loanAmount)}</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownCol}>
              <Text style={styles.breakdownLabel}>Total Interest</Text>
              <Text style={[styles.breakdownVal, { color: '#fde047' }]}>
                {formatINR(totalInterest)}
              </Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownCol}>
              <Text style={styles.breakdownLabel}>Total Payable</Text>
              <Text style={styles.breakdownVal}>{formatINR(totalPayment)}</Text>
            </View>
          </View>
        </View>

        {/* 1. Loan Amount Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <Ionicons name="wallet-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.cardTitleBox}>
              <Text style={styles.cardLabel}>Loan Amount</Text>
              <Text style={styles.cardSubLabel}>Min ₹10K • Max ₹1 Cr</Text>
            </View>
            {/* Interactive Editable Input Box */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>₹</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={amountInput}
                onChangeText={handleAmountInputChange}
                onBlur={handleAmountBlur}
                selectTextOnFocus
              />
            </View>
          </View>

          {/* Interactive Bar Adjustment */}
          <View style={styles.sliderSection}>
            <CustomSlider
              value={loanAmount}
              min={10000}
              max={5000000}
              step={10000}
              onValueChange={handleAmountSlider}
              minLabel="₹10K"
              maxLabel="₹50L+"
              accentColor={colors.primary}
            />
          </View>

          {/* Quick Select Quick Chips */}
          <View style={styles.chipRow}>
            {[100000, 300000, 500000, 1000000, 2000000].map((amt) => {
              const isSelected = loanAmount === amt;
              return (
                <TouchableOpacity
                  key={amt}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => {
                    setLoanAmount(amt);
                    setAmountInput(amt.toString());
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    ₹{amt >= 100000 ? `${amt / 100000}L` : `${amt / 1000}K`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Interest Rate Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="trending-up-outline" size={18} color="#d97706" />
            </View>
            <View style={styles.cardTitleBox}>
              <Text style={styles.cardLabel}>Interest Rate (% p.a.)</Text>
              <Text style={styles.cardSubLabel}>Annual reducing balance</Text>
            </View>
            {/* Interactive Editable Input Box */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={rateInput}
                onChangeText={handleRateInputChange}
                onBlur={handleRateBlur}
                selectTextOnFocus
              />
              <Text style={styles.inputSuffix}>%</Text>
            </View>
          </View>

          {/* Interactive Bar Adjustment */}
          <View style={styles.sliderSection}>
            <CustomSlider
              value={interestRate}
              min={6.5}
              max={24}
              step={0.1}
              onValueChange={handleRateSlider}
              minLabel="6.5%"
              maxLabel="24%"
              accentColor="#d97706"
            />
          </View>

          {/* Quick Select Quick Chips */}
          <View style={styles.chipRow}>
            {[8.5, 9.5, 10.5, 12.0, 14.5].map((rate) => {
              const isSelected = Math.abs(interestRate - rate) < 0.05;
              return (
                <TouchableOpacity
                  key={rate}
                  style={[styles.chip, isSelected && styles.chipActiveGold]}
                  onPress={() => {
                    setInterestRate(rate);
                    setRateInput(rate.toString());
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {rate}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Tenure Section with Years & Months Toggle */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="calendar-outline" size={18} color="#16a34a" />
            </View>
            <View style={styles.cardTitleBox}>
              <Text style={styles.cardLabel}>Loan Tenure</Text>
              <Text style={styles.cardSubLabel}>
                {tenureType === 'years'
                  ? `${totalTenureMonths} total months`
                  : `${(totalTenureMonths / 12).toFixed(1)} approx years`}
              </Text>
            </View>

            {/* Editable Direct Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={tenureInput}
                onChangeText={handleTenureInputChange}
                onBlur={handleTenureBlur}
                selectTextOnFocus
              />
              <Text style={styles.inputSuffix}>{tenureType === 'years' ? 'Yr' : 'Mo'}</Text>
            </View>
          </View>

          {/* Two Option Toggle: Years vs Months */}
          <View style={styles.tabToggleRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tenureType === 'years' && styles.tabBtnActive]}
              onPress={() => handleSwitchTenureType('years')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="calendar"
                size={14}
                color={tenureType === 'years' ? colors.white : colors.textMuted}
              />
              <Text style={[styles.tabBtnText, tenureType === 'years' && styles.tabBtnTextActive]}>
                Years (Yr)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, tenureType === 'months' && styles.tabBtnActive]}
              onPress={() => handleSwitchTenureType('months')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={tenureType === 'months' ? colors.white : colors.textMuted}
              />
              <Text style={[styles.tabBtnText, tenureType === 'months' && styles.tabBtnTextActive]}>
                Months (Mo)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Bar Adjustment depending on selected mode */}
          <View style={styles.sliderSection}>
            {tenureType === 'years' ? (
              <CustomSlider
                value={tenureYears}
                min={1}
                max={20}
                step={0.5}
                onValueChange={handleTenureSlider}
                minLabel="1 Yr"
                maxLabel="20 Yrs"
                accentColor="#16a34a"
              />
            ) : (
              <CustomSlider
                value={tenureMonths}
                min={6}
                max={240}
                step={6}
                onValueChange={handleTenureSlider}
                minLabel="6 Mos"
                maxLabel="240 Mos"
                accentColor="#16a34a"
              />
            )}
          </View>

          {/* Quick Select Quick Chips based on Mode */}
          <View style={styles.chipRow}>
            {tenureType === 'years'
              ? [1, 2, 3, 5, 7, 10].map((yr) => {
                  const isSelected = tenureYears === yr;
                  return (
                    <TouchableOpacity
                      key={yr}
                      style={[styles.chip, isSelected && styles.chipActiveGreen]}
                      onPress={() => {
                        setTenureYears(yr);
                        setTenureInput(yr.toString());
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {yr} {yr === 1 ? 'Year' : 'Years'}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              : [6, 12, 24, 36, 48, 60, 84, 120].map((mo) => {
                  const isSelected = tenureMonths === mo;
                  return (
                    <TouchableOpacity
                      key={mo}
                      style={[styles.chip, isSelected && styles.chipActiveGreen]}
                      onPress={() => {
                        setTenureMonths(mo);
                        setTenureInput(mo.toString());
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {mo} Mos
                      </Text>
                    </TouchableOpacity>
                  );
                })}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Apply Button */}
      {onApplyWithValues && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => onApplyWithValues(loanAmount, totalTenureMonths)}
            activeOpacity={0.8}
          >
            <View style={styles.applyBtnInfo}>
              <Text style={styles.applyBtnTitle}>Apply for {formatINR(loanAmount)}</Text>
              <Text style={styles.applyBtnSubtitle}>
                EMI: {formatINR(emi)}/mo • {tenureType === 'years' ? `${tenureYears} Yrs` : `${tenureMonths} Mos`}
              </Text>
            </View>
            <View style={styles.applyBtnAction}>
              <Text style={styles.applyBtnActionText}>Proceed</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 96,
  },
  resultCard: {
    backgroundColor: '#1e3a8a',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  glowCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  resetText: {
    fontSize: 11,
    color: '#dbeafe',
    fontWeight: '600',
  },
  emiHighlightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  emiValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  emiUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#93c5fd',
  },
  emiPeriod: {
    fontSize: 12,
    color: '#bfdbfe',
    marginTop: 2,
    fontWeight: '500',
  },
  ratioBarContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    marginTop: 14,
  },
  ratioPrincipal: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  ratioInterest: {
    height: '100%',
    backgroundColor: '#fbbf24',
  },
  ratioLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#dbeafe',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    marginVertical: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  breakdownDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 8,
  },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#93c5fd',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
    marginTop: 3,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitleBox: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    padding: 3,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#16a34a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabBtnTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 6 : 2,
    minWidth: 90,
    justifyContent: 'center',
  },
  inputPrefix: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginRight: 2,
  },
  inputSuffix: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginLeft: 2,
  },
  textInput: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    minWidth: 40,
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },

  sliderSection: {
    marginVertical: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipActiveGold: {
    backgroundColor: '#d97706',
    borderColor: '#d97706',
  },
  chipActiveGreen: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  applyBtnInfo: {
    flex: 1,
  },
  applyBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  applyBtnSubtitle: {
    fontSize: 11,
    color: '#bfdbfe',
    marginTop: 1,
  },
  applyBtnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyBtnActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
});
