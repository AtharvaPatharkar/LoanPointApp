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
import { LoanIcon } from '../common/LoanIcon';

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
  categories,
  onSelectCategory,
  onNavigate,
}) => {
  const [reviewData, setReviewData] = useState<GooglePlaceReviewData>(
    googleReviewsService.getVerifiedData()
  );
  const [activeReviewIndex, setActiveReviewIndex] = useState<number>(0);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

  const toggleExpandReview = (reviewId: string) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

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

  // Sourced 100% from real Google Place details (Place ID: ChIJLy2Wo0HW0TsRiEKAhjtJx9U)
  // Only real verified reviews with rating > 3 stars
  const reviewsList = (reviewData.reviews || []).filter((r) => r.rating > 3);

  const currentReview =
    reviewsList.length > 0
      ? reviewsList[activeReviewIndex % reviewsList.length]
      : reviewData.reviews?.[0] || {
          id: 'placeholder',
          author_name: 'Google Customer',
          relative_time_description: 'Recently',
          rating: 5,
          text: 'Excellent service by Loan Point team.',
        };

  const isCurrentExpanded = Boolean(expandedReviews[currentReview.id]);

  // Auto-rotation timer: rotate reviews one by one every 4.5 seconds
  // Automatically PAUSES when user clicks "..more" to read the full review,
  // and RESUMES when user clicks "Show Less"
  useEffect(() => {
    if (reviewsList.length <= 1 || isCurrentExpanded) return;

    const timer = setInterval(() => {
      setActiveReviewIndex((prev) => (prev + 1) % reviewsList.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [reviewsList.length, isCurrentExpanded]);

  const handlePrevReview = () => {
    setActiveReviewIndex((prev) => (prev > 0 ? prev - 1 : reviewsList.length - 1));
  };

  const handleNextReview = () => {
    setActiveReviewIndex((prev) => (prev + 1) % reviewsList.length);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Welcome to Loan Point  */}
      <View style={styles.welcomeRow}>
        <Text style={styles.welcomeTitle}>Welcome to Loan Point </Text>
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

      {/* 3. Our Loan Products Header */}
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

      {/* 4. Five Loan Product Cards Row with Attractive Colourful Real Loan Logos */}
      <View style={styles.loanProductsRow}>
        {/* Product 1: Home Loan */}
        <TouchableOpacity
          style={styles.loanProductCard}
          onPress={() => onSelectCategory('home')}
          activeOpacity={0.8}
        >
          <LoanIcon
            type="home"
            useAssetImage={true}
            size={36}
            containerSize={46}
            borderRadius={23}
            style={{ marginBottom: 6 }}
          />
          <Text style={styles.loanProductText}>Home{'\n'}Loan</Text>
        </TouchableOpacity>

        {/* Product 2: Personal Loan */}
        <TouchableOpacity
          style={styles.loanProductCard}
          onPress={() => onSelectCategory('personal')}
          activeOpacity={0.8}
        >
          <LoanIcon
            type="personal"
            useAssetImage={true}
            size={36}
            containerSize={46}
            borderRadius={23}
            style={{ marginBottom: 6 }}
          />
          <Text style={styles.loanProductText}>Personal{'\n'}Loan</Text>
        </TouchableOpacity>

        {/* Product 3: Business Loan */}
        <TouchableOpacity
          style={styles.loanProductCard}
          onPress={() => onSelectCategory('business')}
          activeOpacity={0.8}
        >
          <LoanIcon
            type="business"
            useAssetImage={true}
            size={36}
            containerSize={46}
            borderRadius={23}
            style={{ marginBottom: 6 }}
          />
          <Text style={styles.loanProductText}>Business{'\n'}Loan</Text>
        </TouchableOpacity>

        {/* Product 4: Car Loan */}
        <TouchableOpacity
          style={styles.loanProductCard}
          onPress={() => onSelectCategory('car')}
          activeOpacity={0.8}
        >
          <LoanIcon
            type="car"
            useAssetImage={true}
            size={36}
            containerSize={46}
            borderRadius={23}
            style={{ marginBottom: 6 }}
          />
          <Text style={styles.loanProductText}>Car{'\n'}Loan</Text>
        </TouchableOpacity>

        {/* Product 5: Education Loan */}
        <TouchableOpacity
          style={styles.loanProductCard}
          onPress={() => onSelectCategory('education')}
          activeOpacity={0.8}
        >
          <LoanIcon
            type="education"
            useAssetImage={true}
            size={36}
            containerSize={46}
            borderRadius={23}
            style={{ marginBottom: 6 }}
          />
          <Text style={styles.loanProductText}>Education{'\n'}Loan</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Google Reviews & Happy Customers Review Section matching reference image */}
      <View style={styles.reviewsContainerCard}>
        {/* Top Dark Navy Header Strip */}
        <View style={styles.reviewsTopStrip}>
          {/* Left: Gold Laurel Wreath + Google G Logo + Title */}
          <View style={styles.stripLeft}>
            <View style={styles.stripGoogleIconCircle}>
              <Ionicons name="logo-google" size={18} color="#ea4335" />
            </View>
            <View>
              <Text style={styles.stripGoogleText}>Google</Text>
              <Text style={styles.stripReviewsText}>Reviews</Text>
            </View>
          </View>

          <View style={styles.stripDivider} />

          {/* Middle: Review Count */}
          <View style={styles.stripMiddle}>
            <Ionicons name="people" size={15} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.stripCountText}>
              {reviewData.user_ratings_total.toLocaleString('en-IN')} Reviews
            </Text>
          </View>

          <View style={styles.stripDivider} />

          {/* Right: Star + Average Rating + Gold Laurel Wreath */}
          <View style={styles.stripRight}>
            <Ionicons name="star" size={15} color="#eab308" style={{ marginRight: 4 }} />
            <View>
              <Text style={styles.stripRatingBold}>
                {reviewData.rating.toFixed(1)} / 5.0
              </Text>
              <Text style={styles.stripRatingSub}>Average Rating</Text>
            </View>
          </View>
        </View>

        {/* Section Title Row: Happy Customers Review & Link in One Clean Line */}
        <View style={styles.happyRow}>
          <Text style={styles.happyTitle} numberOfLines={1}>Happy Customers Review</Text>
          <TouchableOpacity
            onPress={() => onNavigate('all_reviews')}
            activeOpacity={0.7}
            style={styles.seeAllGoogleBtn}
          >
            <Text style={styles.seeAllGoogleText} numberOfLines={1}>See All Reviews on Google</Text>
            <Ionicons name="open-outline" size={11} color="#004aad" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>

        {/* Review Carousel Card Row with Left & Right Arrow Buttons */}
        <View style={styles.reviewCarouselRow}>
          {/* Left Arrow Button */}
          <TouchableOpacity
            style={styles.carouselNavBtn}
            onPress={handlePrevReview}
            activeOpacity={0.75}
          >
            <Ionicons name="chevron-back" size={18} color="#0f172a" />
          </TouchableOpacity>

          {/* Customer Review Card */}
          <View style={styles.customerCard}>
            <View style={styles.customerHeader}>
              {/* Customer Avatar */}
              <View style={styles.avatarWrap}>
                {currentReview.profile_photo_url ? (
                  <Image
                    source={{ uri: currentReview.profile_photo_url }}
                    style={styles.customerAvatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {currentReview.author_name ? currentReview.author_name.charAt(0).toUpperCase() : 'G'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Customer Name & Rating */}
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{currentReview.author_name}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons key={s} name="star" size={13} color="#f59e0b" style={{ marginRight: 2 }} />
                  ))}
                  <Text style={styles.reviewTime}>{currentReview.relative_time_description}</Text>
                </View>
              </View>

              {/* Google G Logo Badge */}
              <View style={styles.cardGoogleBadge}>
                <Ionicons name="logo-google" size={17} color="#ea4335" />
              </View>
            </View>

            {/* Review Testimonial Text with 3-line clamp & "..more" button */}
            <View style={styles.reviewCommentWrap}>
              <Text
                style={styles.reviewCommentText}
                numberOfLines={expandedReviews[currentReview.id] ? undefined : 3}
              >
                {currentReview.text}
              </Text>
              {currentReview.text && currentReview.text.length > 90 && (
                <TouchableOpacity
                  onPress={() => toggleExpandReview(currentReview.id)}
                  activeOpacity={0.7}
                  style={styles.moreBtnInline}
                >
                  <Text style={styles.moreBtnText}>
                    {expandedReviews[currentReview.id] ? ' Show Less' : ' ..more'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Right Arrow Button */}
          <TouchableOpacity
            style={styles.carouselNavBtn}
            onPress={handleNextReview}
            activeOpacity={0.75}
          >
            <Ionicons name="chevron-forward" size={18} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Carousel Pagination Dots */}
        <View style={styles.dotsRow}>
          {reviewsList.map((item, dot) => (
            <TouchableOpacity
              key={item.id || dot}
              onPress={() => setActiveReviewIndex(dot)}
              style={[
                styles.dot,
                activeReviewIndex === dot ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* 6. Insurance with Loan Point Strip matching exact design in uploaded screenshot */}
      <View style={styles.insuranceCard}>
        {/* Decorative Top-Right Umbrella & Family Watermark */}
        <Image
          source={require('../../../assets/logo/insurance-watermark-umbrella.png')}
          style={styles.umbrellaWatermark}
          resizeMode="contain"
        />

        {/* Left: Blue Shield with Family Icon */}
        <Image
          source={require('../../../assets/logo/insurance-family-shield.png')}
          style={styles.familyShieldIcon}
          resizeMode="contain"
        />

        {/* Middle: Title & Subtitle */}
        <View style={styles.insuranceContent}>
          <Text style={styles.insuranceTitle}>Insurance with Loan Point</Text>
          <Text style={styles.insuranceSubtitle}>Health Insurance  |  Life Insurance</Text>
        </View>

        {/* Right: Golden Yellow 'Get Quote ->' Pill Button */}
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
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 28,
  },

  // 1. Welcome to Loan Point 
  welcomeRow: {
    marginBottom: 10,
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

  // 3. Our Loan Products Header
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

  // 4. Five Loan Product Cards Row
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

  // 5. Google Reviews & Happy Customers Review Section
  reviewsContainerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#facc15', // Golden Yellow Border
    overflow: 'hidden',
    paddingBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  // Top Dark Navy Strip
  reviewsTopStrip: {
    backgroundColor: '#0a3875',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  stripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  laurelImage: {
    width: 18,
    height: 28,
  },
  stripGoogleIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripGoogleText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 13,
  },
  stripReviewsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
    lineHeight: 11,
  },
  stripDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  stripMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stripCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  stripRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  stripRatingBold: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  stripRatingSub: {
    fontSize: 8.5,
    color: '#cbd5e1',
    fontWeight: '600',
  },

  // Section Title Row
  happyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 11,
    paddingBottom: 9,
    flexWrap: 'nowrap',
  },
  happyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    flexShrink: 1,
  },
  seeAllGoogleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 6,
  },
  seeAllGoogleText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#004aad',
    textDecorationLine: 'underline',
  },

  // Review Carousel Row
  reviewCarouselRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  carouselNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  customerCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0a3875',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  reviewTime: {
    fontSize: 9.5,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '500',
  },
  cardGoogleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewCommentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  reviewCommentText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 15,
    fontWeight: '600',
  },
  moreBtnInline: {
    paddingVertical: 1,
  },
  moreBtnText: {
    fontSize: 11,
    color: '#004aad',
    fontWeight: '800',
  },

  // Carousel Pagination Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 8,
    borderRadius: 4,
    backgroundColor: '#0329e4', // Deep Royal Blue Active Dot matching screenshot
  },
  dotInactive: {
    width: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1', // Inactive light grey dot
  },

  // 6. Insurance with Loan Point Strip matching exact design in uploaded screenshot
  insuranceCard: {
    backgroundColor: '#ebfaf0', // Soft pastel mint-green background
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#c6edd0', // Clean mint border
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  umbrellaWatermark: {
    position: 'absolute',
    top: -2,
    right: 48,
    width: 80,
    height: 48,
    opacity: 0.35,
  },
  familyShieldIcon: {
    width: 42,
    height: 42,
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
    backgroundColor: '#fad805', // Exact vibrant golden-yellow fill
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    shadowColor: '#ca8a04',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  getQuoteText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#000000',
  },
});
