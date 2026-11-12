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
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import {
  googleReviewsService,
  GooglePlaceReviewData,
} from '../../services/googleReviewsService';
import { colors } from '../../theme/colors';

interface AllReviewsScreenProps {
  onBack: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AllReviewsScreen: React.FC<AllReviewsScreenProps> = ({ onBack }) => {
  const [data, setData] = useState<GooglePlaceReviewData>(
    googleReviewsService.getVerifiedData()
  );
  const [selectedFilter, setSelectedFilter] = useState<number | 'all'>('all');

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

  const filteredReviews = data.reviews.filter((r) => {
    if (selectedFilter === 'all') return true;
    return r.rating === selectedFilter;
  });

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Banner with Google Trust Badge */}
      <View style={styles.heroCard}>
        <View style={styles.heroGlowCircle} />

        <View style={styles.heroTopRow}>
          <View style={styles.googleGLogoWrap}>
            <Text style={styles.googleGText}>G</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={14} color="#38bdf8" />
              <Text style={styles.verifiedText}>Google Verified Business</Text>
            </View>
            <Text style={styles.businessTitle}>{data.name} (Nanded)</Text>
            <Text style={styles.businessSubtitle}>Customer Ratings & Verified Testimonials</Text>
          </View>
        </View>

        {/* Rating Breakdown Pill */}
        <View style={styles.ratingHighlightBox}>
          <View style={styles.ratingBigCol}>
            <Text style={styles.ratingBigNumber}>{data.rating.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              {[...Array(5)].map((_, i) => (
                <FontAwesome key={i} name="star" size={14} color="#f59e0b" style={{ marginHorizontal: 1 }} />
              ))}
            </View>
            <Text style={styles.totalRatingLabel}>
              Based on {data.user_ratings_total.toLocaleString('en-IN')}+ reviews
            </Text>
          </View>

          <View style={styles.dividerVertical} />

          {/* Quick Stats */}
          <View style={styles.statsSummaryCol}>
            <View style={styles.metricRow}>
              <Ionicons name="shield-checkmark" size={15} color="#10b981" />
              <Text style={styles.metricText}>100% Genuine</Text>
            </View>
            <View style={styles.metricRow}>
              <Ionicons name="time" size={15} color="#38bdf8" />
              <Text style={styles.metricText}>Fast Approval</Text>
            </View>
            <View style={styles.metricRow}>
              <Ionicons name="thumbs-up" size={15} color="#fbbf24" />
              <Text style={styles.metricText}>Top Rated in Nanded</Text>
            </View>
          </View>
        </View>

        {/* Action Button: View on Official Google Maps */}
        <TouchableOpacity
          style={styles.openGoogleBtn}
          onPress={handleOpenGoogleMaps}
          activeOpacity={0.85}
        >
          <Text style={styles.openGoogleBtnText}>Open in Google Maps App</Text>
          <Ionicons name="open-outline" size={15} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* 2. Rating Filters Row */}
      <View style={styles.filtersSection}>
        <Text style={styles.filtersLabel}>Filter by rating:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'all' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, selectedFilter === 'all' && styles.filterPillTextActive]}>
              All ({data.reviews.length})
            </Text>
          </TouchableOpacity>

          {[5, 4, 3].map((star) => {
            const count = data.reviews.filter((r) => r.rating === star).length;
            if (count === 0 && selectedFilter !== star) return null;
            return (
              <TouchableOpacity
                key={star}
                style={[styles.filterPill, selectedFilter === star && styles.filterPillActive]}
                onPress={() => setSelectedFilter(star)}
                activeOpacity={0.8}
              >
                <FontAwesome name="star" size={11} color={selectedFilter === star ? '#ffffff' : '#f59e0b'} />
                <Text style={[styles.filterPillText, selectedFilter === star && styles.filterPillTextActive]}>
                  {star} Star ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. List of Reviews in Full Vertical View */}
      <View style={styles.reviewsList}>
        {filteredReviews.map((rev) => (
          <View key={rev.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              {rev.profile_photo_url ? (
                <Image source={{ uri: rev.profile_photo_url }} style={styles.userPhoto} resizeMode="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{rev.author_name.charAt(0).toUpperCase()}</Text>
                </View>
              )}

              <View style={styles.userNameBlock}>
                <View style={styles.nameBadgeRow}>
                  <Text style={styles.authorName}>{rev.author_name}</Text>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>Verified Customer</Text>
                  </View>
                </View>
                <View style={styles.ratingAndDateRow}>
                  <View style={styles.starsRowSmall}>
                    {[...Array(5)].map((_, i) => (
                      <FontAwesome
                        key={i}
                        name="star"
                        size={11}
                        color={i < rev.rating ? '#f59e0b' : '#e2e8f0'}
                        style={{ marginRight: 2 }}
                      />
                    ))}
                  </View>
                  <Text style={styles.timeAgoText}>{rev.relative_time_description}</Text>
                </View>
              </View>

              <View style={styles.googleVerifiedMiniBadge}>
                <Text style={styles.googleMiniGText}>G</Text>
              </View>
            </View>

            <Text style={styles.reviewBody}>"{rev.text}"</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 36,
    backgroundColor: colors.background,
  },
  heroCard: {
    backgroundColor: '#07162c',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#07162c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
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
    backgroundColor: '#008ecc',
    opacity: 0.18,
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
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  googleGText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#4285F4',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  businessTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  businessSubtitle: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: 1,
  },
  ratingHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  ratingBigCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBigNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: -1,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  totalRatingLabel: {
    fontSize: 10.5,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  dividerVertical: {
    width: 1,
    height: 54,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
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
    fontSize: 11,
    fontWeight: '700',
    color: '#f8fafc',
  },
  openGoogleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#008ecc',
    paddingVertical: 11,
    borderRadius: 10,
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  openGoogleBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* Filters */
  filtersSection: {
    marginBottom: 14,
  },
  filtersLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  filterPillsRow: {
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: '#008ecc',
    borderColor: '#008ecc',
  },
  filterPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },

  /* Review Cards List */
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    padding: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#bae6fd',
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '800',
    color: '#008ecc',
  },
  userNameBlock: {
    flex: 1,
    minWidth: 0,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  authorName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  verifiedBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  verifiedBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#059669',
  },
  ratingAndDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  starsRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeAgoText: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginLeft: 6,
    fontWeight: '500',
  },
  googleVerifiedMiniBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  googleMiniGText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#4285F4',
  },
  reviewBody: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '500',
  },
});

