import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LoanCategory } from '../../types';
import { LoanIcon } from '../common/LoanIcon';
import { formatINR } from '../../utils/calculator';
import { colors } from '../../theme/colors';

interface LoanDetailScreenProps {
  category: LoanCategory;
  onApplyNow: (category: LoanCategory) => void;
  onOpenCalculator: (category: LoanCategory) => void;
  onBack: () => void;
}

export const LoanDetailScreen: React.FC<LoanDetailScreenProps> = ({
  category,
  onApplyNow,
  onOpenCalculator,
}) => {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Header Summary Spotlight Card */}
        <View style={styles.headerHeroCard}>
          <View style={styles.heroGlowCircle} />

          <View style={styles.topRow}>
            <View style={styles.iconBox}>
              <LoanIcon name={category.iconName} size={28} />
            </View>
            <View style={styles.titleBox}>
              <View style={styles.categoryBadge}>
                <View style={styles.badgeDot} />
                <Text style={styles.categoryBadgeText}>OFFICIAL LOAN PRODUCT</Text>
              </View>
              <Text style={styles.title}>{category.title}</Text>
              <Text style={styles.desc}>{category.shortDescription}</Text>
            </View>
          </View>

          {/* Quick Metrics Hero Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <View style={styles.metricLabelRow}>
                <MaterialCommunityIcons name="percent" size={12} color="#93c5fd" />
                <Text style={styles.metricLabel}>Interest Rate</Text>
              </View>
              <Text style={styles.metricVal}>{category.indicativeInterestRate}</Text>
            </View>
            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <View style={styles.metricLabelRow}>
                <FontAwesome5 name="wallet" size={11} color="#93c5fd" />
                <Text style={styles.metricLabel}>Max Amount</Text>
              </View>
              <Text style={styles.metricVal}>{formatINR(category.maxAmount)}</Text>
            </View>
            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="calendar-outline" size={12} color="#93c5fd" />
                <Text style={styles.metricLabel}>Max Tenure</Text>
              </View>
              <Text style={styles.metricVal}>{category.tenureRange}</Text>
            </View>
          </View>
        </View>

        {/* 2. Key Features Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
            </View>
            <Text style={styles.cardHeading}>Key Benefits & Features</Text>
          </View>
          {category.features.map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <View style={styles.checkIconWrap}>
                <Ionicons name="checkmark-circle" size={17} color={colors.success} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* 3. Required Documents Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.secondaryRedLight }]}>
              <Ionicons name="documents-outline" size={16} color={colors.secondaryRed} />
            </View>
            <Text style={[styles.cardHeading, { color: colors.secondaryRedDark }]}>
              Required Documents Checklist
            </Text>
          </View>
          {category.requiredDocuments.map((doc, idx) => (
            <View key={idx} style={styles.docRow}>
              <View style={styles.docIconWrap}>
                <Ionicons name="document-text" size={15} color={colors.primary} />
              </View>
              <Text style={styles.docText}>{doc}</Text>
            </View>
          ))}
        </View>

        {/* 4. Quick Calculator Action */}
        <TouchableOpacity
          style={styles.calcBtn}
          onPress={() => onOpenCalculator(category)}
          activeOpacity={0.7}
        >
          <View style={styles.calcIconWrap}>
            <Ionicons name="calculator" size={17} color={colors.primary} />
          </View>
          <View style={styles.calcBtnTextWrap}>
            <Text style={styles.calcBtnText}>Calculate EMI for {category.title}</Text>
            <Text style={styles.calcBtnSub}>Interactive installment & interest breakdown</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Bottom Apply CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={() => onApplyNow(category)}
          activeOpacity={0.8}
        >
          <View style={styles.applyIconWrap}>
            <Ionicons name="flash" size={15} color="#ffffff" />
          </View>
          <Text style={styles.applyBtnText}>Apply for {category.title}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
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
    gap: 16,
  },

  /* 1. Header Hero Spotlight Card */
  headerHeroCard: {
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  titleBox: {
    flex: 1,
  },
  categoryBadge: {
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
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#38bdf8',
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#bae6fd',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: 12,
    color: '#e0f2fe',
    marginTop: 3,
    lineHeight: 17,
  },

  /* Metrics Hero Row */
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginTop: 18,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#bae6fd',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.2,
  },

  /* 2 & 3. Structured Content Cards */
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDeep,
    letterSpacing: 0.5,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  checkIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  docIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },

  /* 4. Calculator Card Link */
  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  calcIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcBtnTextWrap: {
    flex: 1,
  },
  calcBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  calcBtnSub: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },

  /* Floating Bottom Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
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
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.3,
  },
});
