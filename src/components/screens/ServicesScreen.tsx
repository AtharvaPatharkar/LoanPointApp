import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LOAN_CATEGORIES } from '../../data/mockData';
import { LoanType } from '../../types';
import { IsometricTile } from '../common/IsometricTile';
import { colors } from '../../theme/colors';

interface ServicesScreenProps {
  onSelectCategory: (id: LoanType) => void;
  onNavigate: (screen: string, params?: Record<string, unknown>) => void;
}

interface ToolItem {
  id: string;
  title: string;
  desc: string;
  badge: string;
  badgeColor: string;
  icon: string;
  iconFamily: 'mci' | 'ion' | 'fa5';
  color: string;
  iconBg: string;
  rowCardBg: string;
  rowBorderColor: string;
}

/**
 * Services & Financial Tools Screen with DISTINCT Animations:
 * 1. Gentle Pendulum Balance Tilt (±2.5°) on tool cards & loan icons
 * 2. Rotating Radiant Star / Sparkle Pulse on the Hub badge
 * 3. Dynamic Chevron Horizontal Arrow Bounce (0 -> 4px -> 0)
 * 4. 45° 3D Isometric loan models with specular half-sheen
 */
export const ServicesScreen: React.FC<ServicesScreenProps> = ({
  onSelectCategory,
  onNavigate,
}) => {
  // Animation Values
  const pendulumAnim = useRef(new Animated.Value(0)).current;
  const chevronBounceAnim = useRef(new Animated.Value(0)).current;
  const hubRotateAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Subtle Pendulum Sway (-2.5 deg to +2.5 deg)
    const pendulumLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pendulumAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pendulumAnim, {
          toValue: -1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Chevron Forward Slide Bounce (0px to 4px)
    const chevronLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(chevronBounceAnim, {
          toValue: 4,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(chevronBounceAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // 3. 360-degree slow ambient rotation on the smart hub badge
    const rotateLoop = Animated.loop(
      Animated.timing(hubRotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 4. Subtle card breathing scale (1.0 to 1.03)
    const scaleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cardScaleAnim, {
          toValue: 1.04,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cardScaleAnim, {
          toValue: 0.98,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    pendulumLoop.start();
    chevronLoop.start();
    rotateLoop.start();
    scaleLoop.start();

    return () => {
      pendulumLoop.stop();
      chevronLoop.stop();
      rotateLoop.stop();
      scaleLoop.stop();
    };
  }, [pendulumAnim, chevronBounceAnim, hubRotateAnim, cardScaleAnim]);

  // Interpolations
  const pendulumRotation = pendulumAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  });

  const hubSpin = hubRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const tools: ToolItem[] = [
    {
      id: 'emi_calculator',
      title: 'EMI Calculator',
      desc: 'Plan monthly payments & interest breakdown',
      badge: 'POPULAR',
      badgeColor: '#0284c7',
      icon: 'calculator-variant',
      iconFamily: 'mci',
      color: '#008ecc', // Vivid Brand Sky Cyan
      iconBg: '#e0f2fe',
      rowCardBg: '#f0f9ff', // Light Sky Blue Tint
      rowBorderColor: '#bae6fd',
    },
    {
      id: 'eligibility_checker',
      title: 'Loan Eligibility Estimator',
      desc: 'Check borrowing power by salary & FOIR ratio',
      badge: 'INSTANT',
      badgeColor: '#16a34a',
      icon: 'speedometer',
      iconFamily: 'ion',
      color: '#16a34a', // Emerald Green
      iconBg: '#dcfce7',
      rowCardBg: '#f0fdf4', // Light Mint Green Tint
      rowBorderColor: '#bbf7d0',
    },
    {
      id: 'balance_transfer',
      title: 'Balance Transfer & Foreclosure',
      desc: 'Lower existing EMI or close debts with RBI NOC',
      badge: 'SAVE LAKHS',
      badgeColor: '#ee1c25',
      icon: 'swap-horizontal-bold',
      iconFamily: 'mci',
      color: '#ee1c25', // Logo Ruby Red
      iconBg: '#fee2e2',
      rowCardBg: '#fef2f2', // Light Rose Red Tint
      rowBorderColor: '#fecaca',
    },
    {
      id: 'rate_comparison',
      title: 'Bank Rate Comparison',
      desc: 'Compare rates across SBI, HDFC, BoB, ICICI & Axis',
      badge: '6 TOP BANKS',
      badgeColor: '#4338ca',
      icon: 'scale-balance',
      iconFamily: 'mci',
      color: '#2d3091', // Royal Indigo Navy
      iconBg: '#e0e7ff',
      rowCardBg: '#faf8ff', // Light Lavender Indigo Tint
      rowBorderColor: '#ddd6fe',
    },
    {
      id: 'cibil_services',
      title: 'CIBIL Credit Advisory',
      desc: 'Credit score check, bureau dispute & PAN link',
      badge: '100% FREE',
      badgeColor: '#059669',
      icon: 'shield-checkmark',
      iconFamily: 'ion',
      color: '#075665', // Slate Petrol
      iconBg: '#e2f0f4',
      rowCardBg: '#f0fdfa', // Light Aqua Teal Tint
      rowBorderColor: '#99f6e4',
    },
    {
      id: 'documents',
      title: 'My Documents Vault',
      desc: 'Encrypted storage for PAN, Aadhaar & ITR proofs',
      badge: '256-BIT SECURE',
      badgeColor: '#d97706',
      icon: 'folder-lock',
      iconFamily: 'mci',
      color: '#d97706', // Warm Amber Gold
      iconBg: '#fef3c7',
      rowCardBg: '#fffdf5', // Light Golden Tint
      rowBorderColor: '#fde68a',
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Hero Card with Rotating Sunburst & Specular Glow */}
      <View style={styles.headerHeroCard}>
        <View style={styles.heroGlowCircle} />

        <View style={styles.headerTopRow}>
          <Animated.View
            style={[
              styles.headerIconBadge,
              { transform: [{ rotate: hubSpin }] },
            ]}
          >
            <MaterialCommunityIcons name="compass-rose" size={26} color="#ffffff" />
          </Animated.View>

          <View style={styles.headerTitleWrap}>
            <View style={styles.tagBadge}>
              <View style={styles.tagDot} />
              <Text style={styles.tagText}>SMART FINANCIAL DESK</Text>
            </View>
            <Text style={styles.screenHeading}>Services & Financial Tools</Text>
            <Text style={styles.screenSub}>
              Interactive EMI calculators, bank rate comparisons & official loan categories
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Calculators & Tools Section with Pendulum Swing & Dynamic Bouncing Chevron */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBox}>
            <Ionicons name="construct" size={15} color="#008ecc" />
          </View>
          <Text style={styles.sectionTitle}>Financial Tools & Calculators</Text>
        </View>

        <View style={styles.toolsGrid}>
          {tools.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.toolCard,
                {
                  backgroundColor: item.rowCardBg,
                  borderColor: item.rowBorderColor,
                },
              ]}
              onPress={() => onNavigate(item.id)}
              activeOpacity={0.82}
            >
              {/* Pendulum-Swaying Specular Icon Platform */}
              <Animated.View
                style={[
                  styles.toolIconWrap,
                  {
                    backgroundColor: item.iconBg,
                    transform: [{ rotate: pendulumRotation }],
                  },
                ]}
              >
                {/* Half-Circle Specular Top Sheen */}
                <View style={styles.toolHalfSheen} />

                {item.iconFamily === 'mci' ? (
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={23}
                    color={item.color}
                  />
                ) : item.iconFamily === 'fa5' ? (
                  <FontAwesome5
                    name={item.icon as any}
                    size={19}
                    color={item.color}
                  />
                ) : (
                  <Ionicons
                    name={item.icon as any}
                    size={21}
                    color={item.color}
                  />
                )}
              </Animated.View>

              <View style={styles.toolText}>
                <View style={styles.toolTitleRow}>
                  <Text style={styles.toolTitle}>{item.title}</Text>
                  <View style={[styles.toolMicroBadge, { backgroundColor: item.iconBg }]}>
                    <Text style={[styles.toolMicroBadgeText, { color: item.badgeColor }]}>
                      {item.badge}
                    </Text>
                  </View>
                </View>
                <Text style={styles.toolDesc}>{item.desc}</Text>
              </View>

              {/* Dynamic Forward Bouncing Chevron */}
              <Animated.View
                style={[
                  styles.chevronBox,
                  {
                    backgroundColor: item.iconBg,
                    transform: [{ translateX: chevronBounceAnim }],
                  },
                ]}
              >
                <Ionicons name="chevron-forward" size={16} color={item.color} />
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 3. Loan Categories Section with 45° Isometric Tiles */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBox, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="wallet" size={15} color="#ee1c25" />
          </View>
          <Text style={styles.sectionTitle}>Loan Products & Categories</Text>
        </View>

        <View style={styles.categoriesList}>
          {LOAN_CATEGORIES.map((cat, index) => {
            const isoType =
              cat.id === 'home'
                ? 'home'
                : cat.id === 'business'
                ? 'business'
                : cat.id === 'mortgage'
                ? 'mortgage'
                : cat.id === 'car'
                ? 'car'
                : cat.id === 'education'
                ? 'education'
                : cat.id === 'agriculture'
                ? 'agriculture'
                : cat.id === 'mudra'
                ? 'mudra'
                : 'personal';

            // Distinct light row background styling for each loan product
            const loanRowStyles = [
              { bg: '#fffbf5', border: '#fed7aa', accent: '#008ecc' }, // 1. Personal
              { bg: '#faf8ff', border: '#ddd6fe', accent: '#2d3091' }, // 2. Business
              { bg: '#fff8f8', border: '#fecdd3', accent: '#ee1c25' }, // 3. Home
              { bg: '#f7fbff', border: '#bae6fd', accent: '#075665' }, // 4. Mortgage
              { bg: '#f6faff', border: '#bfdbfe', accent: '#0284c7' }, // 5. Car
              { bg: '#fdf8fa', border: '#fbcfe8', accent: '#c026d3' }, // 6. Education
              { bg: '#f7fdf9', border: '#bbf7d0', accent: '#16a34a' }, // 7. Agriculture
              { bg: '#fffdf5', border: '#fde68a', accent: '#d97706' }, // 8. Mudra
            ];
            const currentStyle = loanRowStyles[index % loanRowStyles.length];

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catRow,
                  {
                    backgroundColor: currentStyle.bg,
                    borderColor: currentStyle.border,
                  },
                ]}
                onPress={() => onSelectCategory(cat.id)}
                activeOpacity={0.82}
              >
                {/* 45° Isometric 3D Model with Specular Half-Sheen */}
                <View style={styles.catIconWrap}>
                  <IsometricTile type={isoType} size={46} animated={false} />
                </View>

                <View style={styles.catText}>
                  <Text style={styles.catTitle}>{cat.title}</Text>
                  <Text style={styles.catRate}>
                    From <Text style={[styles.catRateBold, { color: currentStyle.accent }]}>{cat.indicativeInterestRate}</Text>
                  </Text>
                </View>

                <Animated.View
                  style={[
                    styles.applyBtnSmall,
                    {
                      backgroundColor: currentStyle.accent,
                      shadowColor: currentStyle.accent,
                      transform: [{ scale: cardScaleAnim }],
                    },
                  ]}
                >
                  <Text style={styles.applyBtnText}>Apply Fast</Text>
                  <Ionicons name="arrow-forward" size={11} color="#ffffff" />
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 36,
    backgroundColor: colors.background,
    gap: 16,
  },

  /* 1. Header Hero Card */
  headerHeroCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#075665', // Deep Banking Petrol Teal
    borderRadius: 18,
    padding: 18,
    shadowColor: '#075665',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  heroGlowCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 142, 204, 0.25)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#008ecc', // Vivid Sky Cyan
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#bae6fd',
    letterSpacing: 0.5,
  },
  screenHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 11.5,
    color: '#e0f2fe',
    marginTop: 3,
    lineHeight: 16,
  },

  /* Section Styling */
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.2,
  },

  /* 2. Tools Grid */
  toolsGrid: {
    gap: 11,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 13,
    gap: 12,
    shadowColor: '#2d3091',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  toolIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  toolHalfSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  toolText: {
    flex: 1,
  },
  toolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  toolTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  toolMicroBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  toolMicroBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  toolDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  chevronBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 3. Loan Categories Section */
  categoriesList: {
    gap: 10,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  catIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  catText: {
    flex: 1,
  },
  catTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  catRate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  catRateBold: {
    fontWeight: '800',
    color: '#008ecc',
  },
  applyBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008ecc', // Sky Cyan
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    shadowColor: '#008ecc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  applyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
});
