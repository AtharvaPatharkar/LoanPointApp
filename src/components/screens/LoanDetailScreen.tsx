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
import * as Linking from 'expo-linking';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { LoanCategory } from '../../types';
import { formatINR } from '../../utils/calculator';
import { COMPANY_INFO } from '../../data/mockData';

interface LoanDetailScreenProps {
  category: LoanCategory;
  onApplyNow: (category: LoanCategory) => void;
  onOpenCalculator: (category: LoanCategory) => void;
  onOpenWhatsApp?: (phone?: string, text?: string) => void;
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

// Map each loan category id to its hero banner image in assets/banner
const LOAN_HERO_BANNERS: Record<string, any> = {
  personal: require('../../../assets/banner/personal-loan-hero-banner.png'),
  home: require('../../../assets/banner/home-loan-hero-banner.png'),
  business: require('../../../assets/banner/business-loan-hero-banner.png'),
  car: require('../../../assets/banner/car-loan-hero-banner.png'),
  education: require('../../../assets/banner/education-loan-hero-banner.png'),
  agriculture: require('../../../assets/banner/agriculture-loan-hero-banner.png'),
  mortgage: require('../../../assets/banner/martgage-loan-hero-banner.png'),
  mudra: require('../../../assets/banner/mudra-loan-hero-banner.png'),
};

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
      case 'mudra':
        return [
          {
            id: 'b1',
            title: 'Govt Scheme\n0% Collateral',
            iconName: 'shield-check',
            iconFamily: 'mci',
            iconColor: '#ea580c',
            iconBg: '#ffedd5',
          },
          {
            id: 'b2',
            title: 'Shishu, Kishore\n& Tarun Tiers',
            iconName: 'layers-outline',
            iconFamily: 'mci',
            iconColor: '#0284c7',
            iconBg: '#e0f2fe',
          },
          {
            id: 'b3',
            title: 'Up to ₹10 Lakh\nFunding',
            iconName: 'hand-holding-usd',
            iconFamily: 'fa5',
            iconColor: '#16a34a',
            iconBg: '#dcfce7',
          },
          {
            id: 'b4',
            title: 'Subsidized\nInterest Rate',
            iconName: 'percent',
            iconFamily: 'mci',
            iconColor: '#ca8a04',
            iconBg: '#fef08a',
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

  const handleWhatsAppChat = () => {
    const rawPhone = COMPANY_INFO.contactPhoneRaw || '9545555999';
    const message = `Hello Loan Point, I want to talk to a loan expert regarding ${category.title} options. Please assist me.`;
    if (typeof onOpenWhatsApp === 'function') {
      try {
        onOpenWhatsApp(`91${rawPhone}`, message);
        return;
      } catch (err) {
        console.warn('onOpenWhatsApp error:', err);
      }
    }
    const cleanPhone = `91${rawPhone}`;
    const encoded = encodeURIComponent(message);
    Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${encoded}`).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`).catch(() => {});
    });
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Top Hero Banner for each loan type using images from assets/banner */}
      {LOAN_HERO_BANNERS[category.id] ? (
        <View style={styles.heroBannerImageWrap}>
          <Image
            source={LOAN_HERO_BANNERS[category.id]}
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

      {/* Supermarket Header & Banking / NBFC Partners Banner */}
      <View style={styles.supermarketCard}>
        {/* Blue Top Header Strip */}
        <View style={styles.supermarketHeader}>
          <MaterialCommunityIcons name="cart-variant" size={28} color="#eab308" style={styles.supermarketCartIcon} />
          <View style={styles.supermarketTextWrap}>
            <Text style={styles.supermarketTitle}>
              A Supermarket <Text style={styles.supermarketTitleHighlight}>for {category.title}</Text>
            </Text>
            <Text style={styles.supermarketSubtitle}>
              Multiple Banks &amp; Top NBFCs – All Loan Options Under One Roof!
            </Text>
          </View>
        </View>

        {/* Banking and NBFC Partners Image */}
        <View style={styles.supermarketImageWrap}>
          <Image
            source={require('../../../assets/bank logo/banking-partners.png')}
            style={styles.partnerBannerImage}
            resizeMode="contain"
          />
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
          onPress={handleWhatsAppChat}
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
    aspectRatio: 2.357,
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

  // Supermarket Card & Banking Partners Banner
  supermarketCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbeafe',
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  supermarketHeader: {
    backgroundColor: '#0256b8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  supermarketCartIcon: {
    marginRight: 10,
  },
  supermarketTextWrap: {
    flex: 1,
  },
  supermarketTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  supermarketTitleHighlight: {
    color: '#facc15',
    fontWeight: '900',
  },
  supermarketSubtitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#e0f2fe',
    marginTop: 2,
  },
  supermarketImageWrap: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerBannerImage: {
    width: '100%',
    height: 165,
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
