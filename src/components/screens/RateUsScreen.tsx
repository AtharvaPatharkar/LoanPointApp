import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { COMPANY_INFO } from '../../data/mockData';
import { colors } from '../../theme/colors';

export const RateUsScreen: React.FC = () => {
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = () => {
    if (!feedback.trim()) {
      Alert.alert('Feedback Required', 'Please enter your comments or suggestions.');
      return;
    }
    setSubmitted(true);
    setFeedback('');
  };

  const handleOpenGoogle = () => {
    Linking.openURL('https://search.google.com/local/writereview?placeid=ChIJLoanPointNanded').catch(() => {
      Alert.alert('Link', 'Could not open browser for review link.');
    });
  };

  const handleOpenWebsite = () => {
    Linking.openURL(COMPANY_INFO.website).catch(() => {
      Alert.alert('Link', 'Could not open website.');
    });
  };

  const handleOpenYouTube = () => {
    Linking.openURL('https://www.youtube.com/@loanpointnanded').catch(() => {
      Alert.alert('Link', 'Could not open YouTube channel.');
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.card}>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>FEEDBACK & COMMUNITY</Text>
        </View>
        <Text style={styles.screenHeading}>Rate Us & Connect</Text>
        <Text style={styles.screenSub}>
          Help us improve our loan advisory services or follow our financial updates
        </Text>
      </View>

      {/* Google Review Card */}
      <View style={styles.reviewHeroCard}>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons key={s} name="star" size={20} color="#fbbf24" />
          ))}
        </View>

        <Text style={styles.reviewHeroTitle}>Review Loan Point on Google</Text>
        <Text style={styles.reviewHeroDesc}>
          Your review helps borrowers across Nanded find transparent and ethical loan consultancy. It takes less than 1 minute!
        </Text>

        <TouchableOpacity
          style={styles.googleReviewBtn}
          onPress={handleOpenGoogle}
          activeOpacity={0.8}
        >
          <Text style={styles.googleReviewText}>Write a Google Review</Text>
          <Ionicons name="open-outline" size={14} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>

      {/* Social & Channel Links */}
      <View style={styles.card}>
        <Text style={styles.sectionHeading}>OFFICIAL MEDIA & CHANNELS</Text>

        <TouchableOpacity style={styles.channelRow} onPress={handleOpenWebsite} activeOpacity={0.7}>
          <View style={[styles.channelIconBox, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="globe-outline" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.channelTitle}>Official Website</Text>
            <Text style={styles.channelSub}>https://loanpoint.in/</Text>
          </View>
          <Ionicons name="open-outline" size={14} color={colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.channelRow} onPress={handleOpenYouTube} activeOpacity={0.7}>
          <View style={[styles.channelIconBox, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="logo-youtube" size={18} color="#dc2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.channelTitle}>YouTube Channel</Text>
            <Text style={styles.channelSub}>Loan Guidance & Banking Tips</Text>
          </View>
          <Ionicons name="open-outline" size={14} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* In-App Direct Feedback Form */}
      <View style={styles.card}>
        <Text style={styles.sectionHeading}>SHARE IN-APP FEEDBACK</Text>
        <Text style={styles.bodyText}>
          How was your experience with Loan Point and advisor Arvind Patil?
        </Text>

        {/* Interactive Star Picker */}
        <View style={styles.pickerRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={28}
                color={star <= rating ? '#f59e0b' : colors.textLight}
              />
            </TouchableOpacity>
          ))}
          <Text style={styles.ratingLabel}>
            {rating === 5 ? 'Exceptional' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : 'Needs Work'}
          </Text>
        </View>

        <Text style={styles.inputLabel}>Your Suggestions / Comments</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          multiline
          value={feedback}
          onChangeText={setFeedback}
          placeholder="Tell us what you liked or what we can improve..."
        />

        {submitted && (
          <View style={styles.submittedBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.submittedBannerText}>
              Thank you for your valuable feedback! Arvind Patil has received your note.
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
          <Ionicons name="send" size={14} color={colors.white} />
          <Text style={styles.submitBtnText}>Send Feedback</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    elevation: 1,
  },
  tagBadge: {
    backgroundColor: '#faf5ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7e22ce',
  },
  screenHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  screenSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  reviewHeroCard: {
    backgroundColor: colors.cardNavyFrom,
    borderRadius: 18,
    padding: 16,
    elevation: 2,
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  reviewHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
    marginTop: 2,
  },
  reviewHeroDesc: {
    fontSize: 11,
    color: '#dbeafe',
    lineHeight: 16,
  },
  googleReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginTop: 6,
  },
  googleReviewText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceSubtle,
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  channelIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  channelSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  bodyText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 10,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  ratingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: colors.text,
  },
  submittedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 10,
  },
  submittedBannerText: {
    fontSize: 11,
    color: '#065f46',
    flex: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
});
