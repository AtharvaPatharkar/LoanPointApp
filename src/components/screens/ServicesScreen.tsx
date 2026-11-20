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
import { LoanType } from '../../types';

interface ServicesScreenProps {
  onSelectCategory: (id: LoanType) => void;
  onNavigate: (screen: string, params?: Record<string, unknown>) => void;
  onOpenCall?: () => void;
}

interface ProductItem {
  id: string;
  isLoanType: boolean;
  loanTypeId?: LoanType;
  title: string;
  subtitle: string;
  imageSource: any;
  cardBg: string;
  cardBorder: string;
}

export const ServicesScreen: React.FC<ServicesScreenProps> = ({
  onSelectCategory,
  onNavigate,
  onOpenCall,
}) => {
  // Exclusively 8 Loan Types in 2 columns
  const loanProducts: ProductItem[] = [
    {
      id: 'home',
      isLoanType: true,
      loanTypeId: 'home',
      title: 'Home Loan',
      subtitle: 'Build or buy your dream home',
      imageSource: require('../../../assets/exploreAllLoanProducts/homeloan.png'),
      cardBg: '#fff5f5', // soft blush pink
      cardBorder: '#ffe4e6',
    },
    {
      id: 'personal',
      isLoanType: true,
      loanTypeId: 'personal',
      title: 'Personal Loan',
      subtitle: 'Fulfil your personal needs',
      imageSource: require('../../../assets/exploreAllLoanProducts/personalloan.png'),
      cardBg: '#f0f7ff', // soft ice blue
      cardBorder: '#e0f0fe',
    },
    {
      id: 'business',
      isLoanType: true,
      loanTypeId: 'business',
      title: 'Business Loan',
      subtitle: 'Grow your business further',
      imageSource: require('../../../assets/exploreAllLoanProducts/businessloan.png'),
      cardBg: '#fffaf5', // soft warm cream
      cardBorder: '#ffedd5',
    },
    {
      id: 'car',
      isLoanType: true,
      loanTypeId: 'car',
      title: 'Car Loan',
      subtitle: 'New or Used Car with easy EMI',
      imageSource: require('../../../assets/exploreAllLoanProducts/carloan.png'),
      cardBg: '#fdf9f2', // soft warm almond
      cardBorder: '#fef3c7',
    },
    {
      id: 'education',
      isLoanType: true,
      loanTypeId: 'education',
      title: 'Education Loan',
      subtitle: 'Fund your education dreams',
      imageSource: require('../../../assets/exploreAllLoanProducts/educationloan.png'),
      cardBg: '#f6faff', // soft sky blue
      cardBorder: '#e0f2fe',
    },
    {
      id: 'agriculture',
      isLoanType: true,
      loanTypeId: 'agriculture',
      title: 'Agriculture Loan',
      subtitle: 'Financial support for farming needs',
      imageSource: require('../../../assets/exploreAllLoanProducts/agriculatureloan.png'),
      cardBg: '#f4fbf7', // soft mint
      cardBorder: '#dcfce7',
    },
    {
      id: 'mortgage',
      isLoanType: true,
      loanTypeId: 'mortgage',
      title: 'Mortgage Loan',
      subtitle: 'Loan against your property',
      imageSource: require('../../../assets/exploreAllLoanProducts/mortgageloan.png'),
      cardBg: '#f5faf9', // soft pale aqua
      cardBorder: '#ccfbf1',
    },
    {
      id: 'mudra',
      isLoanType: true,
      loanTypeId: 'mudra',
      title: 'Mudra Loan',
      subtitle: 'Business loan under Govt. scheme',
      imageSource: require('../../../assets/exploreAllLoanProducts/mudraloan.png'),
      cardBg: '#fffdf5', // soft pale yellow
      cardBorder: '#fef9c3',
    },
  ];

  const handleCardPress = (item: ProductItem) => {
    if (item.isLoanType && item.loanTypeId) {
      onSelectCategory(item.loanTypeId);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Explore All Loan Products Hero Banner */}
      <TouchableOpacity
        style={styles.heroBannerTouchable}
        onPress={() => onNavigate('loan_apply', { loanType: 'personal' })}
        activeOpacity={0.9}
      >
        <Image
          source={require('../../../assets/banner/explore-all-loan-products-banner.png')}
          style={styles.heroBannerImage}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* 2. Section Header: Available Loan Categories */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>Loan Services</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>8 Types</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>Select a loan to view details & apply</Text>
      </View>

      {/* 3. Exactly 8 Loan Products Grid (2 Columns, Horizontal Row inside each card) */}
      <View style={styles.grid}>
        {loanProducts.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.productCard,
              {
                backgroundColor: item.cardBg,
                borderColor: item.cardBorder,
              },
            ]}
            onPress={() => handleCardPress(item)}
            activeOpacity={0.82}
          >
            {/* Left Image Graphic */}
            <View style={styles.imageBox}>
              <Image
                source={item.imageSource}
                style={styles.loanIconImage}
                resizeMode="contain"
              />
            </View>

            {/* Middle Title + Subtitle */}
            <View style={styles.cardInfo}>
              <Text style={styles.productTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.productSubtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
            </View>

            {/* Right Round Arrow Button */}
            <View style={styles.arrowCircle}>
              <Ionicons name="chevron-forward" size={13} color="#0f172a" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 4. Credit Card & CIBIL Services Action Buttons Section */}
      <View style={styles.specialServicesContainer}>
        <Text style={styles.specialServicesTitle}>Credit & Financial Advisory</Text>

        <View style={styles.specialServicesRow}>
          {/* Credit Card Button */}
          <TouchableOpacity
            style={styles.specialServiceBtn}
            onPress={() => onNavigate('credit_card')}
            activeOpacity={0.85}
          >
            <View style={[styles.specialServiceIconWrap, { backgroundColor: '#ede9fe' }]}>
              <Image
                source={require('../../../assets/exploreAllLoanProducts/credit-card.png')}
                style={styles.specialServiceImg}
                resizeMode="contain"
              />
            </View>
            <View style={styles.specialServiceTextWrap}>
              <Text style={styles.specialServiceBtnTitle}>Credit Cards</Text>
              <Text style={styles.specialServiceBtnSub}>Top bank cards & rewards</Text>
            </View>
            <Ionicons name="chevron-forward-circle" size={20} color="#6366f1" />
          </TouchableOpacity>

          {/* CIBIL Services Button */}
          <TouchableOpacity
            style={styles.specialServiceBtn}
            onPress={() => onNavigate('cibil_services')}
            activeOpacity={0.85}
          >
            <View style={[styles.specialServiceIconWrap, { backgroundColor: '#ffe4e6' }]}>
              <Image
                source={require('../../../assets/exploreAllLoanProducts/cibil-services.png')}
                style={styles.specialServiceImg}
                resizeMode="contain"
              />
            </View>
            <View style={styles.specialServiceTextWrap}>
              <Text style={styles.specialServiceBtnTitle}>CIBIL Services</Text>
              <Text style={styles.specialServiceBtnSub}>Score check & improvement</Text>
            </View>
            <Ionicons name="chevron-forward-circle" size={20} color="#e11d48" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Four Value Props Bar with Vertical Dividers */}
      <View style={styles.valuePropsBar}>
        <View style={styles.valuePropItem}>
          <Ionicons name="flash" size={20} color="#f59e0b" />
          <Text style={styles.valuePropTitle}>Competitive</Text>
          <Text style={styles.valuePropSub}>Interest Rates</Text>
        </View>

        <View style={styles.propDivider} />

        <View style={styles.valuePropItem}>
          <MaterialCommunityIcons name="file-document-outline" size={20} color="#2563eb" />
          <Text style={styles.valuePropTitle}>Minimal</Text>
          <Text style={styles.valuePropSub}>Documents</Text>
        </View>

        <View style={styles.propDivider} />

        <View style={styles.valuePropItem}>
          <MaterialCommunityIcons name="clock-fast" size={20} color="#0284c7" />
          <Text style={styles.valuePropTitle}>Quick</Text>
          <Text style={styles.valuePropSub}>Approval</Text>
        </View>

        <View style={styles.propDivider} />

        <View style={styles.valuePropItem}>
          <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
          <Text style={styles.valuePropTitle}>Multiple</Text>
          <Text style={styles.valuePropSub}>Bank Options</Text>
        </View>
      </View>

      {/* 4. Bottom Support CTA Strip with Headset, Text & Rounded Talk Now Button */}
      <View style={styles.supportStrip}>
        <View style={styles.supportLeft}>
          <View style={styles.headsetIconWrap}>
            <Ionicons name="headset" size={24} color="#ffffff" />
          </View>
          <View style={styles.supportTextWrap}>
            <Text style={styles.supportTitle} numberOfLines={1}>
              Need Help Choosing the Right Loan?
            </Text>
            <Text style={styles.supportSub} numberOfLines={1}>
              Talk to our Loan Expert now.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.talkNowBtn}
          onPress={() => (onOpenCall ? onOpenCall() : onNavigate('support'))}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={14} color="#000000" style={{ marginRight: 6 }} />
          <Text style={styles.talkNowText}>Talk Now</Text>
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
    paddingBottom: 28,
  },

  // 1. Hero Banner
  heroBannerTouchable: {
    width: '100%',
    aspectRatio: 2.36,
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

  // 2. Section Header: Available Loan Categories
  sectionHeaderRow: {
    marginBottom: 10,
    marginTop: 2,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
  },

  // 3. Exactly 8 Loan Products Grid (2 Columns, Horizontal Row Layout)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  productCard: {
    width: '48.6%',
    height: 76,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
  },
  imageBox: {
    width: 44,
    height: 44,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loanIconImage: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 2,
  },
  productTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  productSubtitle: {
    fontSize: 9.5,
    color: '#475569',
    lineHeight: 12.5,
    fontWeight: '500',
  },
  arrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    flexShrink: 0,
  },

  // 4. Special Services (Credit Cards & CIBIL) Action Buttons Section
  specialServicesContainer: {
    marginBottom: 16,
  },
  specialServicesTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  specialServicesRow: {
    flexDirection: 'column',
    gap: 10,
  },
  specialServiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  specialServiceIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  specialServiceImg: {
    width: 28,
    height: 28,
  },
  specialServiceTextWrap: {
    flex: 1,
  },
  specialServiceBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  specialServiceBtnSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },

  // 3. Value Props Bar with Vertical Dividers
  valuePropsBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e8eff7',
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  valuePropItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  propDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#e2e8f0',
  },
  valuePropTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
    textAlign: 'center',
  },
  valuePropSub: {
    fontSize: 9.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 1,
  },

  // 4. Bottom Support CTA Strip
  supportStrip: {
    backgroundColor: '#0a3875',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    shadowColor: '#0a3875',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 5,
  },
  supportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  headsetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  supportTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  supportTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  supportSub: {
    fontSize: 10.5,
    color: '#cbd5e1',
    marginTop: 2,
  },
  talkNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbbf24', // Rich Golden Yellow
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 22,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  talkNowText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#000000',
  },
});
