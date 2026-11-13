import React, { useState, useEffect } from 'react';
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
import { UserProfile, LoanCategory, LoanType } from '../../types';
import { googleReviewsService, GooglePlaceReviewData } from '../../services/googleReviewsService';

interface HomeScreenProps {
  user?: UserProfile | null;
  categories?: LoanCategory[];
  applications?: any[];
  onSelectCategory: (id: LoanType) => void;
  onNavigate: (screen: string, params?: Record<string, unknown>) => void;
  onOpenCall: () => void;
  onOpenWhatsApp: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  categories,
  onSelectCategory,
  onNavigate,
  onOpenCall,
  onOpenWhatsApp,
}) => {
  const [reviewData, setReviewData] = useState<GooglePlaceReviewData>(
    googleReviewsService.getVerifiedData()
  );

  useEffect(() => {
    let isMounted = true;
    googleReviewsService.fetchReviews().then((fetched) => {
      if (isMounted && fetched) {
        setReviewData(fetched);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Welcome to Loan Point 👋 */}
      <View style={styles.welcomeRow}>
        <Text style={styles.welcomeTitle}>Welcome to Loan Point 👋</Text>
      </View>

      {/* 2. Hero Banner: Need Extra Funds? */}
      <TouchableOpacity
        style={styles.heroBannerImageTouchable}
        onPress={() => onNavigate('top_up_loan')}
        activeOpacity={0.9}
      >
        <Image
          source={require('../../../assets/banner/need-extra-funds-banner.png')}
          style={styles.heroFullBannerImage}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* 3. Four Quick Action Cards using Solid Vibrant Filled Icons */}
      <View style={styles.quickActionsGrid}>
        {/* Card 1: Check Eligibility */}
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => onNavigate('eligibility_checker')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#f59e0b' }]}>
            <MaterialCommunityIcons name="speedometer" size={26} color="#ffffff" />
          </View>
          <Text style={styles.quickActionText}>Check{'\n'}Eligibility</Text>
        </TouchableOpacity>

        {/* Card 2: EMI Calculator */}
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => onNavigate('emi_calculator')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#2563eb' }]}>
            <MaterialCommunityIcons name="calculator-variant" size={25} color="#ffffff" />
          </View>
          <Text style={styles.quickActionText}>EMI{'\n'}Calculator</Text>
        </TouchableOpacity>

        {/* Card 3: Chat on WhatsApp */}
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={onOpenWhatsApp}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#16a34a' }]}>
            <Ionicons name="logo-whatsapp" size={26} color="#ffffff" />
          </View>
          <Text style={styles.quickActionText}>Chat on{'\n'}WhatsApp</Text>
        </TouchableOpacity>

        {/* Card 4: Request Callback */}
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={onOpenCall}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: '#0284c7' }]}>
            <Ionicons name="call" size={23} color="#ffffff" />
          </View>
          <Text style={styles.quickActionText}>Request{'\n'}Callback</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Our Loan Products Header */}
      <View style={styles.loanProductsHeader}>
        <Text style={styles.loanProductsTitle}>Our Loan Products</Text>
        <TouchableOpacity
          onPress={() => onNavigate('services')}
          style={styles.exploreAllBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.exploreAllText}>Explore All</Text>
          <Ionicons name="arrow-forward" size={14} color="#004aad" style={{ marginLeft: 3 }} />
        </TouchableOpacity>
      </View>

      {/* 5. Five Loan Product Cards with Solid Vibrant Filled Icons */}
      <View style={styles.loanProductsRow}>
        {/* Product 1: Home Loan */}
        <TouchableOpacity
          style={styles.loanProductCard}
          onPress={() => onSelectCategory('home')}
          activeOpacity={0.8}
        >
          <View style={[styles.prodIconCircle, { backgroundColor: '#e11d48' }]}>
            <FontAwesome5 name="home" size={18} color="#ffffff" />
          </View>
          <Text style={styles.loanProductText}>Home{'\n'}Loan</Text>
        </TouchableOpacity>

        {/* Product 2: Personal Loan */}
        <TouchableOpacity
          style={styles.loanProductCard}
          onPress={() => onSelectCategory('personal')}
          activeOpacity={0.8}
        >
          <View style={[styles.prodIconCircle, { backgroundColor: '#ca8a04' }]}>
            <FontAwesome5 name="hand-holding-usd" size={17} color="#ffffff" />
          </View>
          <Text style={styles.loanProductText}>Personal{'\n'}Loan</Text>
        </TouchableOpacity>

        {/* Product 3: Business Loan */}
        <TouchableOpacity
          style={styles.loanProductCard}
          onPress={() => onSelectCategory('business')}
          activeOpacity={0.8}
        >
          <View style={[styles.prodIconCircle, { backgroundColor: '#dc2626' }]}>
            <FontAwesome5 name="store" size={16} color="#ffffff" />
          </View>
          <Text style={styles.loanProductText}>Business{'\n'}Loan</Text>
        </TouchableOpacity>

        {/* Product 4: Car Loan */}
        <TouchableOpacity
          style={styles.loanProductCard}
          onPress={() => onSelectCategory('car')}
          activeOpacity={0.8}
        >
          <View style={[styles.prodIconCircle, { backgroundColor: '#2563eb' }]}>
            <FontAwesome5 name="car" size={17} color="#ffffff" />
          </View>
          <Text style={styles.loanProductText}>Car{'\n'}Loan</Text>
        </TouchableOpacity>

        {/* Product 5: Education Loan */}
        <TouchableOpacity
          style={styles.loanProductCard}
          onPress={() => onSelectCategory('education')}
          activeOpacity={0.8}
        >
          <View style={[styles.prodIconCircle, { backgroundColor: '#0284c7' }]}>
            <FontAwesome5 name="graduation-cap" size={17} color="#ffffff" />
          </View>
          <Text style={styles.loanProductText}>Education{'\n'}Loan</Text>
        </TouchableOpacity>
      </View>

      {/* 6. Google Reviews Strip */}
      <TouchableOpacity
        style={styles.googleReviewsCard}
        onPress={() => onNavigate('all_reviews')}
        activeOpacity={0.88}
      >
        <FontAwesome5 name="award" size={20} color="#eab308" />

        <View style={styles.googleIconCircle}>
          <Ionicons name="logo-google" size={19} color="#ea4335" />
        </View>

        <View style={styles.googleReviewsContent}>
          <Text style={styles.googleReviewsTitle}>Google Reviews</Text>
          <View style={styles.googleRatingRow}>
            <Text style={styles.googleReviewCount}>
              {reviewData.user_ratings_total.toLocaleString('en-IN')} Reviews
            </Text>
            <Text style={styles.googleDivider}>|</Text>
            <Ionicons name="star" size={13} color="#eab308" style={{ marginRight: 3 }} />
            <Text style={styles.googleRatingScore}>
              <Text style={styles.googleRatingBold}>
                {reviewData.rating.toFixed(1)} / 5.0
              </Text>{' '}
              Average Rating
            </Text>
          </View>
        </View>

        <FontAwesome5 name="award" size={20} color="#eab308" />
      </TouchableOpacity>

      {/* 7. Insurance with Loan Point Strip */}
      <View style={styles.insuranceCard}>
        <View style={styles.insuranceShieldWrap}>
          <MaterialCommunityIcons name="shield-account" size={32} color="#0284c7" />
        </View>

        <View style={styles.insuranceContent}>
          <Text style={styles.insuranceTitle}>Insurance with Loan Point</Text>
          <Text style={styles.insuranceSubtitle}>Health Insurance | Life Insurance</Text>
        </View>

        <TouchableOpacity
          style={styles.getQuoteBtn}
          onPress={() => onNavigate('insurance')}
          activeOpacity={0.85}
        >
          <Text style={styles.getQuoteText}>Get Quote</Text>
          <Ionicons name="arrow-forward" size={12} color="#000000" style={{ marginLeft: 3 }} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },

  // 1. Welcome to Loan Point 👋
  welcomeRow: {
    marginBottom: 12,
    marginTop: 4,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },

  // 2. Hero Banner: Need Extra Funds?
  heroBannerImageTouchable: {
    width: '100%',
    aspectRatio: 2.22,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#053e92',
    shadowColor: '#0a3875',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  heroFullBannerImage: {
    width: '100%',
    height: '100%',
  },

  // 3. Four Quick Action Cards
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e8f0fe',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 14,
  },

  // 4. Our Loan Products Header
  loanProductsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loanProductsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  exploreAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exploreAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#004aad',
  },

  // 5. Five Loan Product Cards
  loanProductsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 16,
  },
  loanProductCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  prodIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  loanProductText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 13,
  },

  // 6. Google Reviews Strip
  googleReviewsCard: {
    backgroundColor: '#fffdf0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fef08a',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fef08a',
    marginRight: 8,
  },
  googleReviewsContent: {
    flex: 1,
    justifyContent: 'center',
  },
  googleReviewsTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  googleRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  googleReviewCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
  },
  googleDivider: {
    marginHorizontal: 6,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  googleRatingScore: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  googleRatingBold: {
    fontWeight: '800',
    color: '#0f172a',
  },

  // 7. Insurance with Loan Point Strip
  insuranceCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 10,
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
  insuranceShieldWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  insuranceContent: {
    flex: 1,
    justifyContent: 'center',
  },
  insuranceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  insuranceSubtitle: {
    fontSize: 10.5,
    color: '#475569',
    fontWeight: '500',
  },
  getQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#facc15',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  getQuoteText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#000000',
  },
});
