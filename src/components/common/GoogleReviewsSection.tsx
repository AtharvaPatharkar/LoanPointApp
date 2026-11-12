import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import {
  googleReviewsService,
  GooglePlaceReviewData,
} from '../../services/googleReviewsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
interface GoogleReviewsSectionProps {
  onViewAll?: () => void;
}

// Compact, crisp card width that fits properly on both small (320-360px) and standard (390-430px) screens
const CARD_WIDTH = Math.min(Math.max(SCREEN_WIDTH - 76, 260), 300);

export const GoogleReviewsSection: React.FC<GoogleReviewsSectionProps> = ({ onViewAll }) => {
  const [data, setData] = useState<GooglePlaceReviewData>(
    googleReviewsService.getVerifiedData()
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    googleReviewsService.fetchReviews().then((fetched) => {
      if (isMounted && fetched) {
        setData(fetched);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenGoogleMaps = () => {
    Linking.openURL(data.googleMapsUrl || 'https://maps.app.goo.gl/iYig6psGSP5hQYdS9');
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (CARD_WIDTH + 12));
    setActiveIndex(Math.max(0, Math.min(index, data.reviews.length - 1)));
  };

  const scrollToIndex = (index: number) => {
    const targetIndex = Math.max(0, Math.min(index, data.reviews.length - 1));
    setActiveIndex(targetIndex);
    scrollRef.current?.scrollTo({
      x: targetIndex * (CARD_WIDTH + 12),
      animated: true,
    });
  };

  return (
    <View style={styles.sectionContainer}>
      {/* 1. Top Trust Stats Bar matching Reference Design */}
      <View style={styles.topStatsBar}>
        {/* Left: Google Logo & Label */}
        <View style={styles.statsCol}>
          <View style={styles.googleGLogoWrap}>
            <Text style={styles.googleGText}>G</Text>
          </View>
          <View>
            <Text style={styles.statsHeaderTitle}>Google</Text>
            <Text style={styles.statsHeaderSub}>Reviews</Text>
          </View>
        </View>

        <View style={styles.verticalDivider} />

        {/* Center: Total Reviews Count */}
        <View style={styles.statsColCenter}>
          <Ionicons name="people" size={17} color="#bae6fd" style={{ marginRight: 6 }} />
          <Text style={styles.statsReviewsCount}>
            {data.user_ratings_total.toLocaleString('en-IN')}+ Reviews
          </Text>
        </View>

        <View style={styles.verticalDivider} />

        {/* Right: Star Rating & Laurel */}
        <View style={styles.statsColRight}>
          <FontAwesome name="star" size={14} color="#f59e0b" style={{ marginRight: 4 }} />
          <View>
            <Text style={styles.ratingScore}>{data.rating.toFixed(1)} / 5.0</Text>
            <Text style={styles.ratingScoreSub}>Average Rating</Text>
          </View>
        </View>
      </View>

      {/* 2. Section Header with View All Button & Direct Google Link */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeading}>Happy Customers Reviews</Text>
        <View style={styles.headerRightActions}>
          {onViewAll && (
            <TouchableOpacity
              onPress={onViewAll}
              style={styles.viewAllPill}
              activeOpacity={0.75}
            >
              <Text style={styles.viewAllPillText}>View All ({data.reviews.length})</Text>
              <Ionicons name="arrow-forward" size={11} color="#ffffff" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleOpenGoogleMaps}
            style={styles.seeAllGoogleLink}
            activeOpacity={0.7}
          >
            <Ionicons name="open-outline" size={13} color="#008ecc" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Horizontal Carousel with Navigation Chevrons */}
      <View style={styles.carouselWrapper}>
        {/* Left Arrow Button */}
        <TouchableOpacity
          style={[styles.navArrowBtn, styles.navArrowLeft, activeIndex === 0 && styles.navArrowDisabled]}
          onPress={() => scrollToIndex(activeIndex - 1)}
          disabled={activeIndex === 0}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={16} color={activeIndex === 0 ? '#cbd5e1' : '#0f172a'} />
        </TouchableOpacity>

        {/* Reviews Cards Scroll View */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsScrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + 12}
        >
          {data.reviews.map((rev) => (
            <View key={rev.id} style={[styles.reviewCard, { width: CARD_WIDTH }]}>
              {/* User Avatar + Name + Google Mini Badge */}
              <View style={styles.reviewUserRow}>
                {rev.profile_photo_url ? (
                  <Image
                    source={{ uri: rev.profile_photo_url }}
                    style={styles.userPhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>
                      {rev.author_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.userNameBlock}>
                  <Text style={styles.authorName} numberOfLines={1}>
                    {rev.author_name}
                  </Text>
                  {/* Star Rating & Time */}
                  <View style={styles.starsRow}>
                    {[...Array(5)].map((_, i) => (
                      <FontAwesome
                        key={i}
                        name="star"
                        size={12}
                        color={i < rev.rating ? '#f59e0b' : '#e2e8f0'}
                        style={{ marginRight: 2 }}
                      />
                    ))}
                    <Text style={styles.timeAgoText}>{rev.relative_time_description}</Text>
                  </View>
                </View>

                {/* Google Mini Brand G Badge */}
                <View style={styles.googleVerifiedMiniBadge}>
                  <Text style={styles.googleMiniGText}>G</Text>
                </View>
              </View>

              {/* Review Testimonial Text */}
              <Text style={styles.reviewComment} numberOfLines={4}>
                "{rev.text}"
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Right Arrow Button */}
        <TouchableOpacity
          style={[
            styles.navArrowBtn,
            styles.navArrowRight,
            activeIndex >= data.reviews.length - 1 && styles.navArrowDisabled,
          ]}
          onPress={() => scrollToIndex(activeIndex + 1)}
          disabled={activeIndex >= data.reviews.length - 1}
          activeOpacity={0.75}
        >
          <Ionicons
            name="chevron-forward"
            size={16}
            color={activeIndex >= data.reviews.length - 1 ? '#cbd5e1' : '#0f172a'}
          />
        </TouchableOpacity>
      </View>

      {/* 4. Carousel Pagination Dots Indicator */}
      <View style={styles.paginationRow}>
        {data.reviews.map((_, i) => {
          const isActive = i === activeIndex;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => scrollToIndex(i)}
              style={[styles.dot, isActive && styles.dotActive]}
              activeOpacity={0.7}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  /* 1. Top Trust Stats Bar */
  topStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#07162c', // Deep Navy Banner matching screenshot
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  statsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  googleGLogoWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  googleGText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4285F4',
  },
  statsHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 14,
  },
  statsHeaderSub: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  statsColCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsReviewsCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  statsColRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScore: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fbbf24',
    lineHeight: 14,
  },
  ratingScoreSub: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
  },

  /* 2. Header Row */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
    flexWrap: 'wrap',
    gap: 6,
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008ecc',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  viewAllPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  seeAllGoogleLink: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllGoogleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#008ecc',
  },

  /* 3. Carousel */
  carouselWrapper: {
    position: 'relative',
    marginHorizontal: -4,
  },
  navArrowBtn: {
    position: 'absolute',
    top: '38%',
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 4,
  },
  navArrowLeft: {
    left: 2,
  },
  navArrowRight: {
    right: 2,
  },
  navArrowDisabled: {
    opacity: 0.45,
    elevation: 0,
    shadowOpacity: 0,
  },
  cardsScrollContent: {
    paddingHorizontal: 28,
    paddingVertical: 4,
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  reviewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#bae6fd',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '800',
    color: '#008ecc',
  },
  userNameBlock: {
    flex: 1,
    minWidth: 0,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeAgoText: {
    fontSize: 10,
    color: '#94a3b8',
    marginLeft: 6,
    fontWeight: '500',
  },
  googleVerifiedMiniBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  googleMiniGText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#4285F4',
  },
  reviewComment: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
    fontWeight: '500',
  },

  /* 4. Pagination Dots */
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#008ecc',
  },
});
