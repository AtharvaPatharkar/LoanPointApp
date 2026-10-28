import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { COMPANY_INFO } from '../../data/mockData';

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  duration = 2600,
}) => {
  // Container overall fade out when exiting
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;

  // Background ambient circles pulse & expand
  const bgRingScale1 = useRef(new Animated.Value(0.4)).current;
  const bgRingOpacity1 = useRef(new Animated.Value(0)).current;
  const bgRingScale2 = useRef(new Animated.Value(0.3)).current;
  const bgRingOpacity2 = useRef(new Animated.Value(0)).current;

  // Logo / Icon Card reveal
  const logoCardScale = useRef(new Animated.Value(0.6)).current;
  const logoCardOpacity = useRef(new Animated.Value(0)).current;
  const logoCardRotate = useRef(new Animated.Value(0)).current;

  // Shimmer / Glow wave over logo
  const shimmerPosition = useRef(new Animated.Value(-120)).current;

  // Badge / Pill animation
  const badgeTranslateY = useRef(new Animated.Value(12)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;

  // Title & Tagline typography entrance
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(18)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(14)).current;

  // Features / Trust badges row
  const featuresOpacity = useRef(new Animated.Value(0)).current;
  const featuresTranslateY = useRef(new Animated.Value(10)).current;

  // Loading indicator pulse & bar
  const progressWidth = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Initial background pulse
    Animated.parallel([
      Animated.timing(bgRingOpacity1, {
        toValue: 0.85,
        duration: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(bgRingScale1, {
        toValue: 1,
        friction: 6,
        tension: 30,
        useNativeDriver: true,
      }),
      Animated.timing(bgRingOpacity2, {
        toValue: 0.6,
        duration: 1100,
        delay: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(bgRingScale2, {
        toValue: 1,
        friction: 7,
        tension: 25,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Logo Card entrance with spring bounce & subtle rotation
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(logoCardScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(logoCardOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoCardRotate, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Shimmer sweep across the logo card
    Animated.sequence([
      Animated.delay(650),
      Animated.timing(shimmerPosition, {
        toValue: 260,
        duration: 950,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 3. City Badge Slide in
    Animated.sequence([
      Animated.delay(450),
      Animated.parallel([
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(badgeTranslateY, {
          toValue: 0,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 4. Main Title & Subtitle reveal
    Animated.sequence([
      Animated.delay(550),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 5. Trust Badges ("Quick Approval", "Lowest Rates", "100% Safe")
    Animated.sequence([
      Animated.delay(850),
      Animated.parallel([
        Animated.timing(featuresOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(featuresTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 6. Loading progress bar and footer
    Animated.parallel([
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 400,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: duration - 350,
        delay: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false,
      }),
    ]).start();

    // 7. Graceful Exit Transition
    const exitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 380,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(containerScale, {
          toValue: 1.04,
          duration: 380,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish();
      });
    }, duration);

    return () => {
      clearTimeout(exitTimer);
    };
  }, [duration, onFinish]);

  // Interpolate rotation for smooth wobble bounce
  const rotateSpin = logoCardRotate.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-6deg', '3deg', '0deg'],
  });

  const progressInterpolate = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
    >
      {/* Decorative Modern Gradient Orb 1 */}
      <Animated.View
        style={[
          styles.glowOrb1,
          {
            opacity: bgRingOpacity1,
            transform: [{ scale: bgRingScale1 }],
          },
        ]}
      />

      {/* Decorative Modern Gradient Orb 2 */}
      <Animated.View
        style={[
          styles.glowOrb2,
          {
            opacity: bgRingOpacity2,
            transform: [{ scale: bgRingScale2 }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.glowOrb3,
          {
            opacity: bgRingOpacity1,
            transform: [{ scale: bgRingScale2 }],
          },
        ]}
      />

      {/* Central Interactive Content */}
      <View style={styles.centerContent}>
        {/* Animated Brand Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoCardOpacity,
              transform: [
                { scale: logoCardScale },
                { rotate: rotateSpin },
              ],
            },
          ]}
        >
          {/* Subtle Outer Glow Shadow Ring */}
          <View style={styles.logoRingWrapper}>
            <View style={styles.logoCard}>
              <Image
                source={require('../../../assets/loan-point-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              {/* Shimmer light sweep */}
              <Animated.View
                style={[
                  styles.shimmerEffect,
                  {
                    transform: [{ translateX: shimmerPosition }],
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>

        {/* Category Badge */}
        <Animated.View
          style={[
            styles.cityBadge,
            {
              opacity: badgeOpacity,
              transform: [{ translateY: badgeTranslateY }],
            },
          ]}
        >
          <View style={styles.cityBadgeDot} />
          <Text style={styles.cityBadgeText}>TRUSTED FINANCIAL ADVISORY</Text>
        </Animated.View>

        {/* Company Title */}
        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.brandTitle}>
            LOAN <Text style={styles.brandTitleHighlight}>POINT</Text>
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={[
            styles.subtextBlock,
            {
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleTranslateY }],
            },
          ]}
        >
          <Text style={styles.taglineMain}>Fast, Easy & Trusted Loans</Text>
          <Text style={styles.taglineSecondary}>
            Serving customers with trust since 2010
          </Text>
        </Animated.View>

        {/* 3 Quick Value Feature Pills */}
        <Animated.View
          style={[
            styles.featureRow,
            {
              opacity: featuresOpacity,
              transform: [{ translateY: featuresTranslateY }],
            },
          ]}
        >
          <View style={styles.featurePill}>
            <Ionicons name="flash" size={13} color="#2563eb" />
            <Text style={styles.featurePillText}>Instant Approval</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="trending-down" size={13} color="#059669" />
            <Text style={styles.featurePillText}>Lowest Rates</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="shield-checkmark" size={13} color="#d97706" />
            <Text style={styles.featurePillText}>100% Safe</Text>
          </View>
        </Animated.View>
      </View>

      {/* Modern Sleek Progress Bar & Footer */}
      <Animated.View style={[styles.bottomSection, { opacity: footerOpacity }]}>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressInterpolate,
              },
            ]}
          />
        </View>

        <View style={styles.footerRow}>
          <Ionicons name="shield-checkmark-outline" size={13} color={colors.textLight} />
          <Text style={styles.footerLabel}>
            {COMPANY_INFO.contactNumber} • Government & Bank Authorized Partner
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ffffff',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 99999,
    paddingTop: height * 0.12,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  glowOrb1: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#dbeafe', // soft blue
    opacity: 0.7,
  },
  glowOrb2: {
    position: 'absolute',
    bottom: -80,
    left: -90,
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: '#e0e7ff', // soft indigo
    opacity: 0.6,
  },
  glowOrb3: {
    position: 'absolute',
    top: height * 0.38,
    left: -120,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#fef3c7', // gentle warm amber tint
    opacity: 0.45,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoRingWrapper: {
    padding: 6,
    borderRadius: 26,
    backgroundColor: 'rgba(239, 246, 255, 0.7)',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  logoCard: {
    width: Math.min(width * 0.72, 250),
    height: 116,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  shimmerEffect: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    transform: [{ skewX: '-25deg' }],
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 12,
    gap: 6,
  },
  cityBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563eb',
  },
  cityBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: 1.2,
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  brandTitleHighlight: {
    color: '#2563eb',
  },
  subtextBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  taglineMain: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  taglineSecondary: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 3,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 5,
  },
  featurePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  progressBarBg: {
    width: '100%',
    maxWidth: 220,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#94a3b8',
    textAlign: 'center',
  },
});
