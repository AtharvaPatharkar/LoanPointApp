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
import * as Linking from 'expo-linking';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  googleReviewsService,
  GooglePlaceReviewData,
  GoogleReviewItem,
} from '../../services/googleReviewsService';

interface AllReviewsScreenProps {
  onBack: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_SIZE = 20;

export const AllReviewsScreen: React.FC<AllReviewsScreenProps> = ({ onBack }) => {
  const [data, setData] = useState<GooglePlaceReviewData>(
    googleReviewsService.getVerifiedData()
  );
  // Pagination: currentPage is 1-based (20 reviews per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showAllAtOnce, setShowAllAtOnce] = useState<boolean>(false);

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

  const totalReviewsCount = data.reviews.length;
  const totalPages = Math.ceil(totalReviewsCount / PAGE_SIZE) || 1;

  // Sliced reviews based on pagination or show-all state
  const displayedReviews: GoogleReviewItem[] = showAllAtOnce
    ? data.reviews
    : data.reviews.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const startReviewIndex = showAllAtOnce ? 1 : (currentPage - 1) * PAGE_SIZE + 1;
  const endReviewIndex = showAllAtOnce
    ? totalReviewsCount
    : Math.min(currentPage * PAGE_SIZE, totalReviewsCount);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Hero Card with Modern Google Trust Badge & Live Ratings */}
      <View style={styles.heroCard}>
        <View style={styles.heroGlowCircle} />

        <View style={styles.heroTopRow}>
          <View style={styles.googleGLogoWrap}>
            <Ionicons name="logo-google" size={24} color="#ea4335" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={14} color="#38bdf8" />
              <Text style={styles.verifiedText}>Google Verified Business Reviews</Text>
            </View>
            <Text style={styles.businessTitle}>{data.name}</Text>
            <Text style={styles.businessSubtitle}>Customer Ratings & Verified Testimonials</Text>
          </View>
        </View>

        {/* Rating Breakdown Pill */}
        <View style={styles.ratingHighlightBox}>
          <View style={styles.ratingBigCol}>
            <Text style={styles.ratingBigNumber}>{data.rating.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              {[...Array(5)].map((_, i) => (
                <FontAwesome key={i} name="star" size={15} color="#fbbf24" style={{ marginHorizontal: 1 }} />
              ))}
            </View>
            <Text style={styles.totalRatingLabel}>
              {data.user_ratings_total.toLocaleString('en-IN')}+ Verified Reviews
            </Text>
          </View>

          <View style={styles.dividerVertical} />

          {/* Quick Trust Highlights */}
          <View style={styles.statsSummaryCol}>
            <View style={styles.metricRow}>
              <Ionicons name="shield-checkmark" size={15} color="#10b981" />
              <Text style={styles.metricText}>100% Authentic</Text>
            </View>
            <View style={styles.metricRow}>
              <Ionicons name="flash" size={15} color="#38bdf8" />
              <Text style={styles.metricText}>Fast Turnaround</Text>
            </View>
            <View style={styles.metricRow}>
              <Ionicons name="ribbon" size={15} color="#fbbf24" />
              <Text style={styles.metricText}>Nanded #1 Loan Partner</Text>
            </View>
          </View>
        </View>

        {/* Action Button: Open Live Google Business Page */}
        <TouchableOpacity
          style={styles.openGoogleBtn}
          onPress={handleOpenGoogleMaps}
          activeOpacity={0.88}
        >
          <Ionicons name="logo-google" size={16} color="#000000" style={{ marginRight: 6 }} />
          <Text style={styles.openGoogleBtnText}>View All 600+ Reviews on Google Maps</Text>
          <Ionicons name="open-outline" size={15} color="#000000" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {/* 2. Customer Reviews Section Title & Counter Banner */}
      <View style={styles.sectionHeaderBanner}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>Customer Reviews & Ratings</Text>
          <Text style={styles.sectionSubtitle}>
            Showing {startReviewIndex}–{endReviewIndex} of {totalReviewsCount} Reviews
          </Text>
        </View>

        {/* Toggle to view all reviews on page without pagination */}
        <TouchableOpacity
          style={[styles.viewAllToggleBtn, showAllAtOnce && styles.viewAllToggleBtnActive]}
          onPress={() => setShowAllAtOnce(!showAllAtOnce)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={showAllAtOnce ? 'layers' : 'layers-outline'}
            size={14}
            color={showAllAtOnce ? '#ffffff' : '#004aad'}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.viewAllToggleText, showAllAtOnce && styles.viewAllToggleTextActive]}>
            {showAllAtOnce ? 'Paginate (20)' : 'Show All'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. List of Reviews (20 per page or all) */}
      <View style={styles.reviewsList}>
        {displayedReviews.map((rev, index) => (
          <View key={rev.id || `rev_${index}`} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              {rev.profile_photo_url ? (
                <Image source={{ uri: rev.profile_photo_url }} style={styles.userPhoto} resizeMode="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {rev.author_name ? rev.author_name.charAt(0).toUpperCase() : 'G'}
                  </Text>
                </View>
              )}

              <View style={styles.userNameBlock}>
                <View style={styles.nameBadgeRow}>
                  <Text style={styles.authorName} numberOfLines={1}>{rev.author_name}</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={10} color="#16a34a" style={{ marginRight: 2 }} />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                </View>

                <View style={styles.ratingAndDateRow}>
                  <View style={styles.starsRowSmall}>
                    {[...Array(5)].map((_, i) => (
                      <FontAwesome
                        key={i}
                        name="star"
                        size={12}
                        color={i < rev.rating ? '#f59e0b' : '#e2e8f0'}
                        style={{ marginRight: 2 }}
                      />
                    ))}
                  </View>
                  <Text style={styles.timeAgoText}>· {rev.relative_time_description}</Text>
                  {rev.serviceCategory && (
                    <View style={styles.serviceCategoryPill}>
                      <Text style={styles.serviceCategoryText}>{rev.serviceCategory}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.googleVerifiedMiniBadge}>
                <Ionicons name="logo-google" size={13} color="#ea4335" />
              </View>
            </View>

            <Text style={styles.reviewBody}>"{rev.text}"</Text>
          </View>
        ))}
      </View>

      {/* 4. Pagination Navigation Bar with Horizontal Scroll Support */}
      {!showAllAtOnce && totalPages > 1 && (
        <View style={styles.paginationCard}>
          {/* Top Pagination Status Row */}
          <View style={styles.paginationStatusRow}>
            <Text style={styles.paginationStatusText}>
              Page <Text style={styles.paginationStatusBold}>{currentPage}</Text> of {totalPages}
            </Text>
            <Text style={styles.paginationRangeText}>
              ({startReviewIndex}–{endReviewIndex} of {totalReviewsCount})
            </Text>
          </View>

          {/* Controls Row: [Previous] + Horizontal Scrollable Page Pills + [Next] */}
          <View style={styles.paginationControlsRow}>
            {/* Previous Button */}
            <TouchableOpacity
              style={[styles.pageNavBtn, currentPage === 1 && styles.pageNavBtnDisabled]}
              onPress={() => {
                if (currentPage > 1) setCurrentPage((prev) => prev - 1);
              }}
              disabled={currentPage === 1}
              activeOpacity={0.8}
            >
              <Ionicons
                name="chevron-back"
                size={14}
                color={currentPage === 1 ? '#94a3b8' : '#0f172a'}
              />
              <Text style={[styles.pageNavBtnText, currentPage === 1 && styles.pageNavBtnTextDisabled]}>
                Prev
              </Text>
            </TouchableOpacity>

            {/* Scrollable Horizontal Page Number Pills */}
            <View style={styles.scrollablePillsWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pagePillsRow}
              >
                {Array.from({ length: totalPages }).map((_, pIdx) => {
                  const pNum = pIdx + 1;
                  const isActive = currentPage === pNum;
                  return (
                    <TouchableOpacity
                      key={pNum}
                      style={[styles.pageNumberPill, isActive && styles.pageNumberPillActive]}
                      onPress={() => setCurrentPage(pNum)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pageNumberText, isActive && styles.pageNumberTextActive]}>
                        {pNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              style={[styles.pageNavBtn, currentPage === totalPages && styles.pageNavBtnDisabled]}
              onPress={() => {
                if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
              }}
              disabled={currentPage === totalPages}
              activeOpacity={0.8}
            >
              <Text style={[styles.pageNavBtnText, currentPage === totalPages && styles.pageNavBtnTextDisabled]}>
                Next
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={currentPage === totalPages ? '#94a3b8' : '#0f172a'}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 5. Bottom Sticky Banner to Add/Read More on Google */}
      <View style={styles.bottomCtaCard}>
        <View style={styles.bottomCtaIconWrap}>
          <MaterialCommunityIcons name="star-face" size={26} color="#fbbf24" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bottomCtaTitle}>Are you a happy customer?</Text>
          <Text style={styles.bottomCtaSub}>Share your experience with Loan Point on Google.</Text>
        </View>
        <TouchableOpacity
          style={styles.writeReviewBtn}
          onPress={handleOpenGoogleMaps}
          activeOpacity={0.85}
        >
          <Text style={styles.writeReviewText}>Write Review</Text>
          <Ionicons name="arrow-forward" size={13} color="#000000" style={{ marginLeft: 3 }} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 36,
    backgroundColor: '#ffffff',
  },
  heroCard: {
    backgroundColor: '#0a3875',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0a3875',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  heroGlowCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  googleGLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  verifiedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#93c5fd',
  },
  businessTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  businessSubtitle: {
    fontSize: 11,
    color: '#e2e8f0',
    marginTop: 1,
  },

  /* Rating Highlight Box */
  ratingHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    marginBottom: 14,
  },
  ratingBigCol: {
    alignItems: 'center',
    paddingRight: 10,
  },
  ratingBigNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  totalRatingLabel: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  dividerVertical: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 10,
  },
  statsSummaryCol: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  openGoogleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbbf24',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 22,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  openGoogleBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#000000',
  },

  /* Section Header */
  sectionHeaderBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 2,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  viewAllToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  viewAllToggleBtnActive: {
    backgroundColor: '#004aad',
    borderColor: '#004aad',
  },
  viewAllToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#004aad',
  },
  viewAllToggleTextActive: {
    color: '#ffffff',
  },

  /* Reviews List */
  reviewsList: {
    gap: 12,
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1.5,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userPhoto: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  userNameBlock: {
    flex: 1,
    minWidth: 0,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16a34a',
  },
  ratingAndDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    flexWrap: 'wrap',
    gap: 4,
  },
  starsRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeAgoText: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  serviceCategoryPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 4,
  },
  serviceCategoryText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },
  googleVerifiedMiniBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  reviewBody: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '500',
  },

  /* Pagination */
  paginationCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  paginationStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  paginationStatusText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  paginationStatusBold: {
    fontWeight: '800',
    color: '#004aad',
  },
  paginationRangeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  paginationControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 3,
    flexShrink: 0,
  },
  pageNavBtnDisabled: {
    opacity: 0.45,
    borderColor: '#e2e8f0',
  },
  pageNavBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  pageNavBtnTextDisabled: {
    color: '#94a3b8',
  },
  scrollablePillsWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  pagePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  pageNumberPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pageNumberPillActive: {
    backgroundColor: '#004aad',
    borderColor: '#004aad',
  },
  pageNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  pageNumberTextActive: {
    color: '#ffffff',
  },

  /* Bottom CTA */
  bottomCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  bottomCtaIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCtaTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  bottomCtaSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  writeReviewText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
});
