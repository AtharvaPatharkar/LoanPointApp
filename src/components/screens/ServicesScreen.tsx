import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LOAN_CATEGORIES } from '../../data/mockData';
import { LoanType } from '../../types';
import { LoanIcon } from '../common/LoanIcon';
import { colors } from '../../theme/colors';

interface ServicesScreenProps {
  onSelectCategory: (id: LoanType) => void;
  onNavigate: (screen: string, params?: Record<string, unknown>) => void;
}

export const ServicesScreen: React.FC<ServicesScreenProps> = ({
  onSelectCategory,
  onNavigate,
}) => {
  interface ToolItem {
    id: string;
    title: string;
    desc: string;
    icon: string;
    iconFamily: 'mci' | 'ion' | 'fa5';
    color: string;
    bg: string;
  }

  const tools: ToolItem[] = [
    {
      id: 'emi_calculator',
      title: 'EMI Calculator',
      desc: 'Plan monthly payments & interest breakdown',
      icon: 'calculator',
      iconFamily: 'mci',
      color: '#008ecc', // Vivid Brand Sky Cyan
      bg: '#e0f2fe',
    },
    {
      id: 'eligibility_checker',
      title: 'Loan Eligibility Estimator',
      desc: 'Check borrowing power by salary & FOIR ratio',
      icon: 'speedometer',
      iconFamily: 'ion',
      color: '#16a34a', // Emerald Green
      bg: '#dcfce7',
    },
    {
      id: 'balance_transfer',
      title: 'Balance Transfer & Foreclosure',
      desc: 'Lower existing EMI or close debts with RBI NOC',
      icon: 'swap-horizontal-bold',
      iconFamily: 'mci',
      color: '#ee1c25', // Logo Ruby Red
      bg: '#fee2e2',
    },
    {
      id: 'rate_comparison',
      title: 'Bank Rate Comparison',
      desc: 'Compare rates across SBI, HDFC, BoB, ICICI & Axis',
      icon: 'scale-balance',
      iconFamily: 'mci',
      color: '#2d3091', // Royal Indigo Navy
      bg: '#e0e7ff',
    },
    {
      id: 'cibil_services',
      title: 'CIBIL Credit Advisory',
      desc: 'Credit score check, bureau dispute & PAN link',
      icon: 'shield-checkmark',
      iconFamily: 'ion',
      color: '#075665', // Slate Petrol
      bg: '#e2f0f4',
    },
    {
      id: 'documents',
      title: 'My Documents & Vault',
      desc: 'Encrypted storage for PAN, Aadhaar & ITR proofs',
      icon: 'folder-lock',
      iconFamily: 'mci',
      color: '#d97706', // Warm Amber Gold
      bg: '#fef3c7',
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Hero Card */}
      <View style={styles.headerHeroCard}>
        <View style={styles.heroGlowCircle} />

        <View style={styles.headerTopRow}>
          <View style={styles.headerIconBadge}>
            <MaterialCommunityIcons name="calculator-variant" size={26} color="#ffffff" />
          </View>
          <View style={styles.headerTitleWrap}>
            <View style={styles.tagBadge}>
              <View style={styles.tagDot} />
              <Text style={styles.tagText}>SMART FINANCIAL HUB</Text>
            </View>
            <Text style={styles.screenHeading}>Services & Financial Tools</Text>
            <Text style={styles.screenSub}>
              Interactive calculators, bank rate comparisons, and loan eligibility estimators
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Calculators & Tools Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBox}>
            <Ionicons name="construct" size={15} color={colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Financial Tools & Calculators</Text>
        </View>

        <View style={styles.toolsGrid}>
          {tools.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.toolCard}
              onPress={() => onNavigate(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.toolIconWrap, { backgroundColor: item.bg }]}>
                {item.iconFamily === 'mci' ? (
                  <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
                ) : item.iconFamily === 'fa5' ? (
                  <FontAwesome5 name={item.icon as any} size={18} color={item.color} />
                ) : (
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                )}
              </View>

              <View style={styles.toolText}>
                <Text style={styles.toolTitle}>{item.title}</Text>
                <Text style={styles.toolDesc}>{item.desc}</Text>
              </View>

              <View style={styles.chevronBox}>
                <Ionicons name="chevron-forward" size={16} color={item.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 3. Loan Categories Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBox, { backgroundColor: colors.secondaryRedLight }]}>
            <Ionicons name="wallet" size={15} color={colors.secondaryRed} />
          </View>
          <Text style={styles.sectionTitle}>Loan Products & Categories</Text>
        </View>

        <View style={styles.categoriesList}>
          {LOAN_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.catRow}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.7}
            >
              <View style={styles.catIconWrap}>
                <LoanIcon name={cat.iconName} size={22} />
              </View>
              <View style={styles.catText}>
                <Text style={styles.catTitle}>{cat.title}</Text>
                <Text style={styles.catRate}>From {cat.indicativeInterestRate}</Text>
              </View>
              <View style={styles.applyBtnSmall}>
                <Text style={styles.applyBtnText}>Apply</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.white} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 36,
    backgroundColor: colors.background,
    gap: 16,
  },

  /* 1. Header Hero Card */
  headerHeroCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.cardNavyFrom,
    borderRadius: 18,
    padding: 18,
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
    backgroundColor: 'rgba(0, 142, 204, 0.2)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 48,
    height: 48,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
    backgroundColor: '#38bdf8',
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#bae6fd',
    letterSpacing: 0.5,
  },
  screenHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 11.5,
    color: '#e0f2fe',
    marginTop: 3,
    lineHeight: 16,
  },

  /* Section Styling */
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDeep,
    letterSpacing: 0.2,
  },

  /* 2. Tools Grid */
  toolsGrid: {
    gap: 10,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  toolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  toolText: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
  },
  toolDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  chevronBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 3. Loan Categories List */
  categoriesList: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
    gap: 12,
  },
  catIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catText: {
    flex: 1,
  },
  catTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
  },
  catRate: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  applyBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  applyBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.white,
  },
});
