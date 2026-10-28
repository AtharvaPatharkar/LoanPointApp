import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
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

  const filterTabs: {
    id: LoanType;
    label: string;
    icon: string;
    iconType: 'ion' | 'mci' | 'fa5';
    activeColor: string;
    lightColor: string;
  }[] = [
    {
      id: 'home',
      label: 'Home Loan',
      icon: 'home-variant',
      iconType: 'mci',
      activeColor: '#008ecc', // Brand Cyan
      lightColor: '#e0f2fe',
    },
    {
      id: 'personal',
      label: 'Personal Loan',
      icon: 'wallet',
      iconType: 'fa5',
      activeColor: '#ee1c25', // Logo Crimson Red
      lightColor: '#fee2e2',
    },
    {
      id: 'business',
      label: 'Business Loan',
      icon: 'storefront',
      iconType: 'ion',
      activeColor: '#d97706', // Warm Amber Gold
      lightColor: '#fef3c7',
    },
    {
      id: 'mortgage',
      label: 'Mortgage (LAP)',
      icon: 'office-building',
      iconType: 'mci',
      activeColor: '#2d3091', // Royal Indigo Navy
      lightColor: '#e0e7ff',
    },
  ];

  const filteredRates = BANK_RATE_COMPARISONS.filter(
    (item) => item.loanType === selectedLoanType
  );

  // Dedicated Bank Brand Colors and Initial Badges
  const getBankBranding = (lenderName: string, isPublicSector: boolean) => {
    const name = lenderName.toLowerCase();
    if (name.includes('sbi') || name.includes('state bank')) {
      return {
        bg: '#280071',
        text: '#ffffff',
        short: 'SBI',
        accent: '#00a5ec',
      };
    }
    if (name.includes('hdfc')) {
      return {
        bg: '#004c8f',
        text: '#ffffff',
        short: 'HDFC',
        accent: '#ed232a',
      };
    }
    if (name.includes('baroda') || name.includes('bob')) {
      return {
        bg: '#f26522', // BoB Vermillion Orange
        text: '#ffffff',
        short: 'BOB',
        accent: '#f26522',
      };
    }
    if (name.includes('icici')) {
      return {
        bg: '#b02a30', // ICICI Maroon Red
        text: '#ffffff',
        short: 'ICICI',
        accent: '#f37024',
      };
    }
    if (name.includes('union')) {
      return {
        bg: '#e31e24', // Union Bank Red & Blue
        text: '#ffffff',
        short: 'UBI',
        accent: '#00529b',
      };
    }
    if (name.includes('axis')) {
      return {
        bg: '#97144d', // Axis Bank Burgundy
        text: '#ffffff',
        short: 'AXIS',
        accent: '#97144d',
      };
    }
    return {
      bg: isPublicSector ? '#075665' : '#2d3091',
      text: '#ffffff',
      short: 'BANK',
      accent: colors.primary,
    };
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerIconBadge}>
            <MaterialCommunityIcons name="scale-balance" size={24} color="#ffffff" />
          </View>
          <View style={styles.headerTitleWrap}>
            <View style={styles.tagBadge}>
              <View style={styles.tagDot} />
              <Text style={styles.tagText}>LIVE MARKET BENCHMARKS</Text>
            </View>
            <Text style={styles.screenHeading}>Bank Rate Comparison</Text>
          </View>
        </View>
        <Text style={styles.screenSub}>
          Compare indicative interest rates, processing charges, and tenure limits across verified public & private commercial lenders.
        </Text>
      </View>

      {/* 2. Loan Type Filter Tabs (Distinct Color Badges per Category) */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterTabs.map((tab) => {
            const isActive = selectedLoanType === tab.id;
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
                onPress={() => setSelectedLoanType(tab.id)}
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

      {/* 3. Lender Rates List */}
      <View style={styles.listBlock}>
        {filteredRates.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.textLight} />
            <Text style={styles.emptyText}>
              No specific benchmarks loaded for this category. Contact Loan Point advisor for real-time bank quotes.
            </Text>
          </View>
        ) : (
          filteredRates.map((bank, idx) => {
            const branding = getBankBranding(bank.lenderName, bank.isPublicSector);
            return (
              <View key={idx} style={styles.bankCard}>
                <View style={styles.bankHeaderRow}>
                  <View style={styles.bankIdentityWrap}>
                    {/* Colorful Bank Logo Badge */}
                    <View style={[styles.bankAvatar, { backgroundColor: branding.bg }]}>
                      <Text style={[styles.bankAvatarText, { color: branding.text }]}>
                        {branding.short}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.bankTitleRow}>
                        <Text style={styles.bankName}>{bank.lenderName}</Text>
                        <View
                          style={[
                            styles.bankSectorBadge,
                            {
                              backgroundColor: bank.isPublicSector ? '#ecfdf5' : '#eef2ff',
                              borderColor: bank.isPublicSector ? '#a7f3d0' : '#c7d2fe',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.bankSectorText,
                              { color: bank.isPublicSector ? '#047857' : '#4338ca' },
                            ]}
                          >
                            {bank.isPublicSector ? 'Public Sector' : 'Private Bank'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.bankMetaRow}>
                        <Ionicons name="pricetag" size={11} color="#0284c7" />
                        <Text style={styles.bankFeeSub}>
                          Fee: {bank.processingFee} • Max {bank.maxTenureYears} Yrs
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Attractive Indicative Rate Box */}
                  <View style={styles.rateBadgeBox}>
                    <View style={styles.rateLabelRow}>
                      <MaterialCommunityIcons name="trending-down" size={12} color="#0284c7" />
                      <Text style={styles.rateLabel}>Indicative Rate</Text>
                    </View>
                    <Text style={styles.rateVal}>
                      {bank.indicativeRateMin.toFixed(2)}% – {bank.indicativeRateMax.toFixed(2)}%
                    </Text>
                    <View style={styles.rateTagRow}>
                      <Text style={styles.rateSub}>Annual reducing</Text>
                    </View>
                  </View>
                </View>

                {/* Bank Special Scheme Note with Colorful Badge */}
                <View style={styles.bankNoteBox}>
                  <View style={styles.noteIconWrap}>
                    <Ionicons name="checkmark-done" size={13} color="#16a34a" />
                  </View>
                  <Text style={styles.bankNoteText}>{bank.note}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* 4. Disclaimer Box */}
      <View style={styles.disclaimerBox}>
        <View style={styles.disclaimerIconWrap}>
          <Ionicons name="information-circle" size={18} color="#d97706" />
        </View>
        <Text style={styles.disclaimerText}>
          <Text style={styles.boldText}>Verification Disclaimer: </Text>
          Interest rates listed are indicative market benchmarks compiled for guidance. Actual sanctioned rates are determined by respective lending banks after assessing customer CIBIL score, income stability, and loan-to-value ratio.
        </Text>
      </View>

      {/* 5. Bottom Action CTA */}
      <TouchableOpacity
        style={styles.applyBtn}
        onPress={() => onApplyForLoan(selectedLoanType)}
        activeOpacity={0.8}
      >
        <View style={styles.applyIconWrap}>
          <Ionicons name="flash" size={15} color="#ffffff" />
        </View>
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

  /* 2. Filter Tabs */
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
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChipIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipIconWrapActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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

  /* 3. Lender Rates Cards */
  listBlock: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  bankCard: {
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
    gap: 12,
  },
  bankHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  bankIdentityWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bankAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bankAvatarText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bankTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  bankName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
  },
  bankSectorBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  bankSectorText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bankMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  bankFeeSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },

  /* Rate Badge Spotlight */
  rateBadgeBox: {
    alignItems: 'flex-end',
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#7dd3fc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  rateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  rateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369a1',
    letterSpacing: 0.4,
  },
  rateVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0c4a6e',
    letterSpacing: 0.2,
  },
  rateTagRow: {
    marginTop: 2,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  rateSub: {
    fontSize: 9,
    color: '#0284c7',
    fontWeight: '700',
  },

  /* Note Box */
  bankNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  noteIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bankNoteText: {
    fontSize: 11.5,
    color: colors.text,
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },

  /* 4. Disclaimer Box */
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffdf5',
    borderWidth: 1.5,
    borderColor: '#fcd34d',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    width: '100%',
    overflow: 'hidden',
  },
  disclaimerIconWrap: {
    marginTop: 2,
    flexShrink: 0,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#92400e',
    lineHeight: 16.5,
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  boldText: {
    fontWeight: '800',
  },

  /* 5. Bottom Action CTA */
  applyBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
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
});
