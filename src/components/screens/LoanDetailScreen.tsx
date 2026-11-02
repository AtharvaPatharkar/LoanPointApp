import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LoanCategory } from '../../types';
import { formatINR } from '../../utils/calculator';
import { colors } from '../../theme/colors';
import { IsometricTile } from '../common/IsometricTile';

interface LoanDetailScreenProps {
  category: LoanCategory;
  onApplyNow: (category: LoanCategory) => void;
  onOpenCalculator: (category: LoanCategory) => void;
  onBack: () => void;
}

const LOAN_PRODUCT_META: Record<
  string,
  {
    type:
      | 'personal'
      | 'business'
      | 'home'
      | 'mortgage'
      | 'car'
      | 'education'
      | 'agriculture'
      | 'mudra';
    badgeTag?: string;
    badgeColor?: string;
    glowColor?: string;
  }
> = {
  personal: {
    type: 'personal',
    badgeTag: 'Highest Approval',
    badgeColor: '#10b981',
    glowColor: '#fed7aa',
  },
  home: {
    type: 'home',
    badgeTag: 'Lowest 8.40%',
    badgeColor: '#0284c7',
    glowColor: '#fecdd3',
  },
  business: {
    type: 'business',
    badgeTag: 'No Collateral',
    badgeColor: '#6366f1',
    glowColor: '#ddd6fe',
  },
  mortgage: {
    type: 'mortgage',
    badgeTag: 'Max Funding',
    badgeColor: '#0d9488',
    glowColor: '#bae6fd',
  },
  car: {
    type: 'car',
    badgeTag: 'Up to 90%',
    badgeColor: '#2563eb',
    glowColor: '#bfdbfe',
  },
  education: {
    type: 'education',
    badgeTag: 'Study India/Abroad',
    badgeColor: '#c026d3',
    glowColor: '#fbcfe8',
  },
  agriculture: {
    type: 'agriculture',
    badgeTag: 'Govt Subsidy',
    badgeColor: '#16a34a',
    glowColor: '#bbf7d0',
  },
  mudra: {
    type: 'mudra',
    badgeTag: 'PMMY 0% Security',
    badgeColor: '#ea580c',
    glowColor: '#fde68a',
  },
};

export const LoanDetailScreen: React.FC<LoanDetailScreenProps> = ({
  category,
  onApplyNow,
  onOpenCalculator,
}) => {
  const meta = LOAN_PRODUCT_META[category.id] || {
    type: 'personal',
    badgeTag: 'Verified Product',
    badgeColor: '#008ecc',
    glowColor: '#bae6fd',
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. 3D Premium Hero Spotlight Card */}
        <View style={styles.headerHeroCard}>
          <View style={styles.heroGlowCircle} />

          <View style={styles.topRow}>
            {/* 3D Isometric FinTech Tile with Specular Sheen Platform */}
            <View style={styles.icon3DWrap}>
              <View style={styles.icon3DSheen} />
              <IsometricTile
                type={meta.type}
                size={70}
                badgeTag={meta.badgeTag}
                badgeColor={meta.badgeColor}
                animated={true}
              />
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

          {/* Quick Metrics Hero Row with 3D Specular Elevation */}
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

        {/* 2. Key Benefits & Features Card with 3D Embossed Style */}
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionIconBox3D, { backgroundColor: '#e0f2fe', borderColor: '#bae6fd' }]}>
              <View style={styles.iconSheenHighlight} />
              <Ionicons name="sparkles" size={17} color="#008ecc" />
            </View>
            <View style={styles.headingTextGroup}>
              <Text style={styles.cardHeading}>Key Benefits & Features</Text>
              <Text style={styles.cardSubheading}>Instant perks tailored for this borrowing tier</Text>
            </View>
          </View>
          {category.features.map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <View style={styles.checkIconWrap3D}>
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* 3. Required Documents Checklist Card with 3D Style */}
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionIconBox3D, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
              <View style={styles.iconSheenHighlight} />
              <Ionicons name="documents" size={17} color="#dc2626" />
            </View>
            <View style={styles.headingTextGroup}>
              <Text style={[styles.cardHeading, { color: '#991b1b' }]}>
                Required Documents Checklist
              </Text>
              <Text style={styles.cardSubheading}>Keep digital or physical copies ready</Text>
            </View>
          </View>
          {category.requiredDocuments.map((doc, idx) => (
            <View key={idx} style={styles.docRow}>
              <View style={styles.docIconWrap3D}>
                <Ionicons name="document-text" size={15} color="#008ecc" />
              </View>
              <Text style={styles.docText}>{doc}</Text>
            </View>
          ))}
        </View>

        {/* 4. Quick Calculator Action Card with 3D Elevation */}
        <TouchableOpacity
          style={styles.calcBtn}
          onPress={() => onOpenCalculator(category)}
          activeOpacity={0.8}
        >
          <View style={styles.calcIconWrap3D}>
            <View style={styles.iconSheenHighlight} />
            <Ionicons name="calculator" size={20} color="#008ecc" />
          </View>
          <View style={styles.calcBtnTextWrap}>
            <Text style={styles.calcBtnText}>Calculate EMI for {category.title}</Text>
            <Text style={styles.calcBtnSub}>Interactive installment & interest breakdown</Text>
          </View>
          <View style={styles.calcChevronWrap}>
            <Ionicons name="chevron-forward" size={16} color="#008ecc" />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Bottom Apply CTA with Specular Sheen & Attractive FinTech Color */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={() => onApplyNow(category)}
          activeOpacity={0.85}
        >
          <View style={styles.btnTopSheen} />
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
    backgroundColor: '#f8fafc',
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
    padding: 18,
    shadowColor: colors.cardNavyFrom,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 7,
  },
  heroGlowCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  icon3DWrap: {
    width: 78,
    height: 78,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  icon3DSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  titleBox: {
    flex: 1,
    minWidth: 0,
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

  /* 2 & 3. Structured 3D Content Cards */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionIconBox3D: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  iconSheenHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  headingTextGroup: {
    flex: 1,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  cardSubheading: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  checkIconWrap3D: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    lineHeight: 18,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  docIconWrap3D: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    lineHeight: 18,
  },

  /* 4. Calculator Card Link with 3D Elevation */
  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  calcIconWrap3D: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  calcBtnTextWrap: {
    flex: 1,
  },
  calcBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  calcBtnSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#008ecc',
    marginTop: 2,
  },
  calcChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Floating Bottom Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
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
    backgroundColor: '#008ecc',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  btnTopSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
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
