import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { LoanCategory } from '../../types';
import { formatINR } from '../../utils/calculator';

interface LoanDetailScreenProps {
  category: LoanCategory;
  onApplyNow: (category: LoanCategory) => void;
  onOpenCalculator: (category: LoanCategory) => void;
  onOpenWhatsApp?: () => void;
  onBack: () => void;
}

interface BenefitItem {
  id: string;
  title: string;
  iconName: string;
  iconFamily: 'mci' | 'ion' | 'fa5';
  iconColor: string;
  iconBg: string;
}

export const LoanDetailScreen: React.FC<LoanDetailScreenProps> = ({
  category,
  onApplyNow,
  onOpenCalculator,
  onOpenWhatsApp,
}) => {
  // Extract starting interest rate (e.g. "9.99%" or from category.indicativeInterestRate)
  const rateMatch = category.indicativeInterestRate.match(/[\d.]+/);
  const startingRate = rateMatch ? `${rateMatch[0]}%` : '9.99%';

  // Format min and max loan amounts
  const minAmtFormatted = formatINR(category.minAmount);
  const maxAmtFormatted = formatINR(category.maxAmount);

  // Dynamic Key Benefits for each loan type
  const getBenefits = (): BenefitItem[] => {
    switch (category.id) {
      case 'personal':
        return [
          {
            id: 'b1',
            title: 'Minimal\nDocuments',
            iconName: 'file-document-edit-outline',
            iconFamily: 'mci',
            iconColor: '#0284c7',
            iconBg: '#e0f2fe',
          },
          {
            id: 'b2',
            title: 'No\nCollateral',
            iconName: 'hand-holding-usd',
            iconFamily: 'fa5',
            iconColor: '#0284c7',
            iconBg: '#e0f2fe',
          },
          {
            id: 'b3',
            title: 'Quick\nDisbursement',
            iconName: 'speedometer',
            iconFamily: 'mci',
            iconColor: '#e11d48',
            iconBg: '#ffe4e6',
          },
          {
            id: 'b4',
            title: 'Flexible\nTenure',
            iconName: 'calendar-month-outline',
            iconFamily: 'mci',
            iconColor: '#0284c7',
            iconBg: '#e0f2fe',
          },
        ];
      case 'home':
        return [
          {
            id: 'b1',
            title: 'Lowest\nInterest Rate',
            iconName: 'percent',
            iconFamily: 'mci',
            iconColor: '#0284c7',
            iconBg: '#e0f2fe',
          },
          {
            id: 'b2',
            title: 'Up to 30 Yrs\nTenure',
            iconName: 'home',
            iconFamily: 'fa5',
            iconColor: '#e11d48',
            iconBg: '#ffe4e6',
          },
          {
            id: 'b3',
            title: 'Tax Benefit\nSec 80C & 24',
            iconName: 'shield-check-outline',
            iconFamily: 'mci',
            iconColor: '#16a34a',
            iconBg: '#dcfce7',
          },
          {
            id: 'b4',
            title: 'Fast Doorstep\nService',
            iconName: 'speedometer',
            iconFamily: 'mci',
            iconColor: '#0284c7',
            iconBg: '#e0f2fe',
          },
        ];
      case 'business':
        return [
          {
            id: 'b1',
            title: 'Collateral\nFree Loan',
            iconName: 'store',
            iconFamily: 'fa5',
            iconColor: '#dc2626',
            iconBg: '#fee2e2',
          },
          {
            id: 'b2',
            title: 'Working\nCapital / CC',
            iconName: 'cash-multiple',
            iconFamily: 'mci',
            iconColor: '#0284c7',
            iconBg: '#e0f2fe',
          },
          {
            id: 'b3',
            title: 'Up to ₹1 Cr\nFunding',
            iconName: 'trending-up',
            iconFamily: 'mci',
            iconColor: '#16a34a',
            iconBg: '#dcfce7',
          },
          {
            id: 'b4',
            title: '48 Hours\nDisbursal',
            iconName: 'clock-fast',
            iconFamily: 'mci',
            iconColor: '#0284c7',
            iconBg: '#e0f2fe',
          },
        ];
      case 'car':
        return [
          {
            id: 'b1',
            title: 'Up to 90%\nOn-Road Price',
            iconName: 'car',
            iconFamily: 'fa5',
            iconColor: '#2563eb',
            iconBg: '#dbeafe',
          },
          {
            id: 'b2',
            title: 'New & Used\nCars Financed',
            iconName: 'car-key',
            iconFamily: 'mci',
            iconColor: '#0284c7',
            iconBg: '#e0f2fe',
          },
          {
            id: 'b3',
            title: 'Lowest EMI\nTenure 7 Yrs',
            iconName: 'calendar-clock',
            iconFamily: 'mci',
            iconColor: '#ca8a04',
            iconBg: '#fef08a',
          },
          {
            id: 'b4',
            title: 'Same Day\nApproval',
            iconName: 'flash',
            iconFamily: 'ion',
            iconColor: '#eab308',
            iconBg: '#fef9c3',
          },
        ];
      default:
        return [
          {
            id: 'b1',
            title: 'Minimal\nDocuments',
            iconName: 'file-document-edit-outline',
            iconFamily: 'mci',
            iconColor: '#0284c7',
            iconBg: '#e0f2fe',
          },
          {
            id: 'b2',
            title: 'Lowest\nInterest Rate',
            iconName: 'percent',
            iconFamily: 'mci',
            iconColor: '#16a34a',
            iconBg: '#dcfce7',
          },
          {
            id: 'b3',
            title: 'Quick\nApproval',
            iconName: 'clock-fast',
            iconFamily: 'mci',
            iconColor: '#e11d48',
            iconBg: '#ffe4e6',
          },
          {
            id: 'b4',
            title: 'Flexible\nTenure',
            iconName: 'calendar-month-outline',
            iconFamily: 'mci',
            iconColor: '#0284c7',
            iconBg: '#e0f2fe',
          },
        ];
    }
  };

  const benefits = getBenefits();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Top Hero Banner (for Personal Loan, uses the exact reference image banner; for other loans uses dynamic rich card) */}
      {category.id === 'personal' ? (
        <View style={styles.heroBannerImageWrap}>
          <Image
            source={require('../../../assets/banner/personal-loan-hero-banner.png')}
            style={styles.heroBannerImage}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View style={styles.dynamicHeroBanner}>
          <View style={styles.heroDecoRing1} />
          <View style={styles.heroDecoRing2} />

          <View style={styles.heroContentLeft}>
            <Text style={styles.heroLoanTitle}>{category.title}</Text>
            <Text style={styles.heroLoanSub}>{category.shortDescription}</Text>

            <View style={styles.heroRateBadge}>
              <Text style={styles.heroRateTag}>Interest Rate Starting from</Text>
              <Text style={styles.heroRateNum}>
                {startingRate} <Text style={styles.heroRatePer}>p.a.</Text>
              </Text>
            </View>
          </View>

          <View style={styles.heroRightBadge}>
            <MaterialCommunityIcons name="shield-check" size={54} color="#facc15" />
          </View>
        </View>
      )}

      {/* 2. Three Metric Highlights Bar (Loan Amount | Tenure | Quick Approval) */}
      <View style={styles.metricsBar}>
        {/* Metric 1: Loan Amount */}
        <View style={styles.metricItem}>
          <MaterialCommunityIcons name="sack" size={24} color="#f59e0b" />
          <Text style={styles.metricLabel}>Loan Amount</Text>
          <Text style={styles.metricValue}>
            {minAmtFormatted} – {maxAmtFormatted}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        {/* Metric 2: Tenure */}
        <View style={styles.metricItem}>
          <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#0284c7" />
          <Text style={styles.metricLabel}>Tenure</Text>
          <Text style={styles.metricValue}>{category.tenureRange || '1 – 7 Years'}</Text>
        </View>

        <View style={styles.metricDivider} />

        {/* Metric 3: Quick Approval */}
        <View style={styles.metricItem}>
          <Ionicons name="flash" size={24} color="#eab308" />
          <Text style={styles.metricLabel}>Quick Approval</Text>
          <Text style={styles.metricValue}>24 – 48 Hours*</Text>
        </View>
      </View>

      {/* 3. Section Title: Key Benefits */}
      <View style={styles.sectionTitleRow}>
        <View style={styles.yellowIndicatorBar} />
        <Text style={styles.sectionHeading}>Key Benefits</Text>
      </View>

      {/* 4. 4 Key Benefit Cards Row */}
      <View style={styles.benefitsRow}>
        {benefits.map((b) => (
          <View key={b.id} style={styles.benefitCard}>
            <View style={[styles.benefitIconWrap, { backgroundColor: b.iconBg }]}>
              {b.iconFamily === 'fa5' ? (
                <FontAwesome5 name={b.iconName as any} size={18} color={b.iconColor} />
              ) : b.iconFamily === 'ion' ? (
                <Ionicons name={b.iconName as any} size={20} color={b.iconColor} />
              ) : (
                <MaterialCommunityIcons name={b.iconName as any} size={22} color={b.iconColor} />
              )}
            </View>
            <Text style={styles.benefitTitle}>{b.title}</Text>
          </View>
        ))}
      </View>

      {/* 5. Check Your EMI Interactive Card */}
      <TouchableOpacity
        style={styles.emiCard}
        onPress={() => onOpenCalculator(category)}
        activeOpacity={0.88}
      >
        <Image
          source={require('../../../assets/exploreAllLoanProducts/emi-calculator-3d.png')}
          style={styles.emiCalcImage}
          resizeMode="contain"
        />

        <View style={styles.emiContent}>
          <Text style={styles.emiCardTitle}>Check Your EMI</Text>
          <Text style={styles.emiCardSubtitle}>Know your monthly EMI{'\n'}in just 30 seconds.</Text>
        </View>

        <View style={styles.emiBtnPill}>
          <Text style={styles.emiBtnText}>EMI Calculator</Text>
          <Ionicons name="arrow-forward" size={13} color="#004aad" style={{ marginLeft: 4 }} />
        </View>
      </TouchableOpacity>

      {/* 6. Primary Action: Apply for Personal Loan Now Button */}
      <TouchableOpacity
        style={styles.primaryApplyBtn}
        onPress={() => onApplyNow(category)}
        activeOpacity={0.88}
      >
        <MaterialCommunityIcons
          name="file-document-edit-outline"
          size={22}
          color="#000000"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.primaryApplyText}>Apply for {category.title} Now</Text>
        <Ionicons name="arrow-forward" size={18} color="#000000" style={{ marginLeft: 6 }} />
      </TouchableOpacity>

      {/* 7. WhatsApp Guidance Strip */}
      <View style={styles.whatsAppCard}>
        <View style={styles.whatsAppLeft}>
          <Ionicons name="logo-whatsapp" size={32} color="#22c55e" />
          <View style={styles.whatsAppTextWrap}>
            <Text style={styles.whatsAppTitle}>Talk to Loan Expert on WhatsApp</Text>
            <Text style={styles.whatsAppSub}>Get instant help & guidance.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.chatNowBtn}
          onPress={onOpenWhatsApp}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={14} color="#16a34a" style={{ marginRight: 4 }} />
          <Text style={styles.chatNowText}>Chat Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 30,
  },

  // 1. Hero Banner
  heroBannerImageWrap: {
    width: '100%',
    aspectRatio: 2.32,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#0a3875',
    shadowColor: '#0a3875',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },
  dynamicHeroBanner: {
    backgroundColor: '#0a3875',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#0a3875',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  heroDecoRing1: {
    position: 'absolute',
    right: -25,
    top: -25,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
  },
  heroDecoRing2: {
    position: 'absolute',
    right: 40,
    bottom: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  heroContentLeft: {
    flex: 1,
    zIndex: 2,
  },
  heroLoanTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  heroLoanSub: {
    fontSize: 12,
    color: '#e2e8f0',
    marginTop: 4,
    marginBottom: 10,
    lineHeight: 16,
    fontWeight: '500',
  },
  heroRateBadge: {
    backgroundColor: '#fbbf24',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  heroRateTag: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  heroRateNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  heroRatePer: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  heroRightBadge: {
    zIndex: 2,
    paddingLeft: 8,
  },

  // 2. Metrics Bar (3 items with dividers)
  metricsBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e8eff7',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  metricDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#e2e8f0',
  },
  metricLabel: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
    textAlign: 'center',
  },

  // 3. Section Title
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  yellowIndicatorBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#f59e0b',
    marginRight: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },

  // 4. 4 Key Benefits Cards Row
  benefitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  benefitCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8eff7',
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
  },
  benefitIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  benefitTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 13,
  },

  // 5. Check Your EMI Interactive Card
  emiCard: {
    backgroundColor: '#fffdf5',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fef3c7',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  emiCalcImage: {
    width: 44,
    height: 44,
    marginRight: 10,
  },
  emiContent: {
    flex: 1,
  },
  emiCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  emiCardSubtitle: {
    fontSize: 10.5,
    color: '#475569',
    lineHeight: 14,
    fontWeight: '500',
  },
  emiBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#004aad',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  emiBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#004aad',
  },

  // 6. Primary Action: Apply for Personal Loan Now Button
  primaryApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbbf24', // Rich Golden Yellow
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    marginBottom: 14,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryApplyText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
  },

  // 7. WhatsApp Guidance Strip
  whatsAppCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  whatsAppLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  whatsAppTextWrap: {
    flex: 1,
  },
  whatsAppTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  whatsAppSub: {
    fontSize: 10,
    color: '#475569',
    marginTop: 1,
    fontWeight: '500',
  },
  chatNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#16a34a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  chatNowText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16a34a',
  },
});
