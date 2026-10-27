import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { colors } from '../../theme/colors';
import { COMPANY_INFO } from '../../data/mockData';

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  duration = 2000,
}) => {
  // Phase 1: App Name appears first
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameScale = useRef(new Animated.Value(0.9)).current;

  // Phase 2: Logo appears smoothly
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoTranslateY = useRef(new Animated.Value(15)).current;

  // Tagline and subtle badge
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  // Container fade out
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Initial appearance of App Name
    Animated.parallel([
      Animated.timing(nameOpacity, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(nameScale, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Shortly after, display the Logo with a smooth entrance
    const logoTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 600,
          delay: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, 600);

    // 3. Smooth fade out and transition to the app
    const finishTimer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, duration);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(finishTimer);
    };
  }, [duration, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      {/* Decorative gradient / background rings */}
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <View style={styles.content}>
        {/* Step 1: App Name Display */}
        <Animated.View
          style={[
            styles.titleWrapper,
            {
              opacity: nameOpacity,
              transform: [{ scale: nameScale }],
            },
          ]}
        >
          <Text style={styles.appName}>{COMPANY_INFO.name}</Text>
          <Text style={styles.subCity}>NANDED</Text>
        </Animated.View>

        {/* Step 2: Logo Appearance */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: logoTranslateY },
              ],
            },
          ]}
        >
          <View style={styles.logoCard}>
            <Image
              source={require('../../../assets/loan-point-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Subtle tagline */}
        <Animated.View
          style={[styles.taglineWrapper, { opacity: subtitleOpacity }]}
        >
          <Text style={styles.taglineText}>Fast, Easy & Reliable Loans</Text>
          <Text style={styles.estText}>Serving Nanded Since 2010</Text>
        </Animated.View>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure Banking & Loan Facilitator</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#eff6ff',
    opacity: 0.8,
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#f1f5f9',
    opacity: 0.7,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  titleWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.primaryDark,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subCity: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 4,
    marginTop: 2,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoCard: {
    width: Math.min(width * 0.7, 240),
    height: 110,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  taglineWrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
  taglineText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  estText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textLight,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: colors.textLight,
    letterSpacing: 0.5,
  },
});
