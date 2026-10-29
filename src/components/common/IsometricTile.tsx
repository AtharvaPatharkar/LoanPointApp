import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export interface IsometricIconProps {
  type:
    | 'personal'
    | 'business'
    | 'home'
    | 'mortgage'
    | 'car'
    | 'education'
    | 'agriculture'
    | 'mudra'
    | 'cibil'
    | 'credit_card';
  size?: number;
  badgeTag?: string;
  badgeColor?: string;
  animated?: boolean;
}

/**
 * 3D Isometric FinTech Product Icon
 * Matches user's exact Paisabazaar reference:
 * - 45-degree isometric projection angle on all 3D models
 * - Circular / Soft Pill backdrop platform with dual-tone ring
 * - Continuous smooth Zoom-in / Zoom-out (breathe pulse) animation
 * - Specular gleam sheen reflection
 * - Floating promotional ribbon badge on top ("Highest Approval", "Lowest Rate")
 */
export const IsometricTile: React.FC<IsometricIconProps> = ({
  type,
  size = 64,
  badgeTag,
  badgeColor = '#10b981',
  animated = true,
}) => {
  // Animation values: Zoom-in / Zoom-out & float levitation
  const zoomAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const sheenAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    // 1. Zoom In - Zoom Out continuous pulsing loop (1.0 -> 1.08 -> 1.0)
    const zoomLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(zoomAnim, {
          toValue: 1.08,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(zoomAnim, {
          toValue: 0.96,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Micro levitation loop (-2.5px to +1.5px)
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -2.5,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 1.5,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Sheen light pass
    const sheenLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sheenAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(sheenAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    zoomLoop.start();
    floatLoop.start();
    sheenLoop.start();

    return () => {
      zoomLoop.stop();
      floatLoop.stop();
      sheenLoop.stop();
    };
  }, [animated, zoomAnim, floatAnim, sheenAnim]);

  // Sheen light line translation
  const sheenTranslateX = sheenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-size, size * 1.5],
  });

  // 45-degree isometric 3D artwork renderer
  const render45DegreeArt = () => {
    switch (type) {
      case 'personal':
        // 45° 3D Isometric Money Bag with Rupee + Gold Coin Stack (Exact Paisabazaar match)
        return (
          <View style={styles.isoArtBox}>
            {/* Soft Ambient Ground Shadow */}
            <View style={[styles.groundShadow, { width: 32, height: 10 }]} />

            {/* 3D Money Pouch at 45 degree tilt */}
            <View style={styles.pouchWrapper}>
              <View style={styles.pouchNeckTie} />
              <View style={styles.pouchBody}>
                <View style={styles.pouchFacetLeft} />
                <View style={styles.pouchFacetRight} />
                <Text style={styles.pouchRupeeSign}>₹</Text>
              </View>
            </View>

            {/* 45-degree Stacked Golden Coins */}
            <View style={styles.coinStack45}>
              <View style={[styles.coinLayer, { bottom: 0, left: 0 }]}>
                <Text style={styles.coinLayerText}>₹</Text>
              </View>
              <View style={[styles.coinLayer, { bottom: 4, left: 3 }]}>
                <Text style={styles.coinLayerText}>₹</Text>
              </View>
              <View style={[styles.coinLayer, { bottom: 8, left: 6, backgroundColor: '#fde047' }]}>
                <Text style={styles.coinLayerText}>₹</Text>
              </View>
            </View>
          </View>
        );

      case 'business':
        // 45° Isometric Executive Briefcase with 3D Depth Faces + Gold Coin
        return (
          <View style={styles.isoArtBox}>
            <View style={[styles.groundShadow, { width: 36, height: 10, bottom: 2 }]} />
            <View style={styles.briefcaseHandle45} />
            {/* 45-degree briefcase 3D block (Front, Top, and Side Faces) */}
            <View style={styles.briefcaseContainer45}>
              {/* Front Darker Face */}
              <View style={styles.briefcaseFrontFace}>
                <View style={styles.briefcaseStrap1} />
                <View style={styles.briefcaseStrap2} />
                <View style={styles.briefcaseBrassLock} />
              </View>
              {/* 3D Side depth corner */}
              <View style={styles.briefcaseSideFace} />
            </View>
            {/* Floating Gold Coin leaning at 45° */}
            <View style={styles.bizCoin45}>
              <Text style={styles.bizCoin45Symbol}>₹</Text>
            </View>
          </View>
        );

      case 'home':
        // 45° Isometric Villa House with 3D Chimney, Gable Roof & Garden Ground
        return (
          <View style={styles.isoArtBox}>
            <View style={[styles.groundShadow, { width: 38, height: 12, bottom: 1 }]} />
            {/* 3D Chimney */}
            <View style={styles.chimney45} />
            {/* 45° 3D Roof with Left Terracotta Face and Right Shaded Face */}
            <View style={styles.roof45Wrapper}>
              <View style={styles.roofFaceLeft} />
              <View style={styles.roofFaceRight} />
            </View>
            {/* 45° 3D Wall Base (Front wall + Side wall) */}
            <View style={styles.walls45Wrapper}>
              <View style={styles.wallFaceFront}>
                <View style={styles.door45} />
              </View>
              <View style={styles.wallFaceSide}>
                <View style={styles.window45} />
              </View>
            </View>
          </View>
        );

      case 'mortgage':
        // 45° Isometric Loan Against Property: Blue Document with Green Approval Seal + Mini House
        return (
          <View style={styles.isoArtBox}>
            <View style={[styles.groundShadow, { width: 34, height: 10 }]} />
            {/* 45° 3D Document Sheet */}
            <View style={styles.docSheet45}>
              <View style={styles.docTopFold} />
              <View style={styles.docCheckCircle}>
                <Ionicons name="checkmark" size={11} color="#ffffff" />
              </View>
              <View style={styles.docLineBlue} />
              <View style={styles.docLineBlueShort} />
            </View>
            {/* Miniature 3D house at bottom right corner */}
            <View style={styles.miniHome45}>
              <View style={styles.miniRoof45} />
              <View style={styles.miniWall45} />
            </View>
          </View>
        );

      case 'car':
        // 45° Isometric Modern Passenger Car
        return (
          <View style={styles.isoArtBox}>
            <View style={[styles.groundShadow, { width: 36, height: 10, bottom: 2 }]} />
            <View style={styles.car45Wrap}>
              {/* Top Cabin */}
              <View style={styles.carCabin45}>
                <View style={styles.carWindshield45} />
              </View>
              {/* Body chassis at 45 degree tilt */}
              <View style={styles.carBody45}>
                <View style={styles.carGrill45} />
                <View style={styles.carLight45} />
              </View>
              {/* 3D Wheels */}
              <View style={styles.carWheelFront} />
              <View style={styles.carWheelBack} />
            </View>
          </View>
        );

      case 'education':
        // 45° Isometric Mortarboard Cap + Rolled Gold Diploma
        return (
          <View style={styles.isoArtBox}>
            <View style={[styles.groundShadow, { width: 32, height: 10 }]} />
            <View style={styles.eduCapTop45}>
              <View style={styles.capCenterButton} />
              <View style={styles.capGoldTassel} />
            </View>
            <View style={styles.eduCapSkull45} />
            <View style={styles.eduScroll45}>
              <View style={styles.scrollRibbon} />
            </View>
          </View>
        );

      case 'agriculture':
        // 45° Isometric Sprout with Dual-Tone Farm Sheaves
        return (
          <View style={styles.isoArtBox}>
            <View style={[styles.groundShadow, { width: 30, height: 9 }]} />
            <View style={styles.sproutStem45} />
            <View style={styles.leafLeft45} />
            <View style={styles.leafRight45} />
            <View style={styles.earthSoilPot}>
              <FontAwesome5 name="seedling" size={15} color="#15803d" />
            </View>
          </View>
        );

      case 'mudra':
        // 45° Isometric Golden Coin Treasury Stack
        return (
          <View style={styles.isoArtBox}>
            <View style={[styles.groundShadow, { width: 34, height: 10 }]} />
            <View style={[styles.mudraCoin45, { bottom: 2, left: 6 }]}>
              <Text style={styles.mudraCoinText}>₹</Text>
            </View>
            <View style={[styles.mudraCoin45, { bottom: 8, right: 6, backgroundColor: '#f59e0b' }]}>
              <Text style={styles.mudraCoinText}>₹</Text>
            </View>
            <View style={[styles.mudraCoin45, { bottom: 14, left: 12, backgroundColor: '#fbbf24' }]}>
              <FontAwesome5 name="coins" size={13} color="#92400e" />
            </View>
          </View>
        );

      case 'cibil':
        // 45° Isometric Credit Gauge Speedometer
        return (
          <View style={styles.isoArtBox}>
            <View style={[styles.groundShadow, { width: 34, height: 10 }]} />
            <View style={styles.gaugeArc3D}>
              <View style={styles.arcRed} />
              <View style={styles.arcYellow} />
              <View style={styles.arcGreen} />
            </View>
            <View style={styles.gaugeCenterPin} />
            <View style={styles.gaugeNeedle45} />
            <View style={styles.freePill45}>
              <Text style={styles.freePillText}>FREE</Text>
            </View>
          </View>
        );

      case 'credit_card':
        // 45° Isometric Floating Metallic Credit Card
        return (
          <View style={styles.isoArtBox}>
            <View style={[styles.groundShadow, { width: 34, height: 10 }]} />
            <View style={styles.card45Base}>
              <View style={styles.card45Chip} />
              <View style={styles.card45Circles}>
                <View style={[styles.cardDot, { backgroundColor: '#ea580c' }]} />
                <View style={[styles.cardDot, { backgroundColor: '#facc15', marginLeft: -3 }]} />
              </View>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.isoArtBox}>
            <Ionicons name="sparkles" size={24} color="#008ecc" />
          </View>
        );
    }
  };

  return (
    <View style={[styles.wrapper, { width: size, height: size + (badgeTag ? 10 : 0) }]}>
      {/* 1. Top Promotional Ribbon Badge (e.g., "Highest Approval", "Lowest Rate") */}
      {badgeTag && (
        <View style={[styles.ribbonBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.ribbonText} numberOfLines={1}>
            {badgeTag}
          </Text>
          <View style={[styles.ribbonEarLeft, { borderTopColor: badgeColor }]} />
          <View style={[styles.ribbonEarRight, { borderTopColor: badgeColor }]} />
        </View>
      )}

      {/* 2. Half-Circle / Zoom-In Zoom-Out Animated Platform */}
      <Animated.View
        style={[
          styles.halfCirclePlatform,
          {
            width: size,
            height: size,
            transform: [
              { scale: zoomAnim }, // Continuous Zoom In - Zoom Out Pulse
              { translateY: floatAnim }, // Subtle 3D Levitation
            ],
          },
        ]}
      >
        {/* Soft Specular White Sheen Overlay (Top Half) */}
        <View style={styles.specularHalfSheen} />

        {/* Dynamic Light Sheen Streak */}
        {animated && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sheenStreak,
              {
                transform: [
                  { translateX: sheenTranslateX },
                  { rotate: '35deg' },
                ],
              },
            ]}
          />
        )}

        {/* 3. 45-Degree Isometric 3D Model Artwork */}
        {render45DegreeArt()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  ribbonBadge: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 106,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  ribbonText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  ribbonEarLeft: {
    position: 'absolute',
    bottom: -3,
    left: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    borderTopWidth: 3,
  },
  ribbonEarRight: {
    position: 'absolute',
    bottom: -3,
    right: 2,
    width: 0,
    height: 0,
    borderRightWidth: 3,
    borderRightColor: 'transparent',
    borderTopWidth: 3,
  },

  // Half Circle / Circular Porcelain Platform
  halfCirclePlatform: {
    borderRadius: 18,
    backgroundColor: '#f1f5f9', // Smooth ceramic porcelain
    borderWidth: 1.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 4,
  },
  specularHalfSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
  },
  sheenStreak: {
    position: 'absolute',
    top: -20,
    width: 20,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    zIndex: 6,
  },

  isoArtBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  groundShadow: {
    position: 'absolute',
    bottom: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
    borderRadius: 10,
    alignSelf: 'center',
  },

  // 1. Personal Loan - 45° Money Bag & Gold Stack
  pouchWrapper: {
    alignItems: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  pouchNeckTie: {
    width: 13,
    height: 5,
    backgroundColor: '#ea580c',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#fdba74',
    marginBottom: -2,
    zIndex: 2,
  },
  pouchBody: {
    width: 26,
    height: 25,
    backgroundColor: '#f97316',
    borderRadius: 12,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 1,
    borderColor: '#fb923c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9a3412',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 3,
  },
  pouchFacetLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 14,
  },
  pouchFacetRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '45%',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 14,
  },
  pouchRupeeSign: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    zIndex: 3,
  },
  coinStack45: {
    position: 'absolute',
    bottom: 2,
    left: 4,
    width: 20,
    height: 20,
  },
  coinLayer: {
    position: 'absolute',
    width: 14,
    height: 10,
    borderRadius: 7,
    backgroundColor: '#f59e0b',
    borderWidth: 1,
    borderColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.5,
  },
  coinLayerText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#78350f',
  },

  // 2. Business Loan - 45° Isometric Briefcase
  briefcaseHandle45: {
    width: 11,
    height: 4,
    borderWidth: 1.8,
    borderColor: '#78350f',
    borderBottomWidth: 0,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    marginBottom: -1,
  },
  briefcaseContainer45: {
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ rotate: '-12deg' }],
  },
  briefcaseFrontFace: {
    width: 26,
    height: 20,
    backgroundColor: '#92400e',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#b45309',
    position: 'relative',
    shadowColor: '#451a03',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  briefcaseSideFace: {
    width: 4,
    height: 18,
    backgroundColor: '#78350f',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    marginLeft: -1,
  },
  briefcaseStrap1: {
    position: 'absolute',
    left: 5,
    top: 0,
    bottom: 0,
    width: 2.2,
    backgroundColor: '#78350f',
  },
  briefcaseStrap2: {
    position: 'absolute',
    right: 5,
    top: 0,
    bottom: 0,
    width: 2.2,
    backgroundColor: '#78350f',
  },
  briefcaseBrassLock: {
    position: 'absolute',
    top: 3,
    alignSelf: 'center',
    width: 4,
    height: 4,
    backgroundColor: '#facc15',
    borderRadius: 1,
  },
  bizCoin45: {
    position: 'absolute',
    bottom: 1,
    right: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#eab308',
    borderWidth: 1.2,
    borderColor: '#fef08a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#854d0e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.5,
  },
  bizCoin45Symbol: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#713f12',
  },

  // 3. Home Loan - 45° Isometric Gable House
  chimney45: {
    position: 'absolute',
    top: 4,
    right: 12,
    width: 3.5,
    height: 8,
    backgroundColor: '#991b1b',
    borderRadius: 1,
    zIndex: 1,
  },
  roof45Wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    transform: [{ rotate: '-8deg' }],
    zIndex: 2,
  },
  roofFaceLeft: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ea580c', // Bright Terracotta
  },
  roofFaceRight: {
    width: 8,
    height: 12,
    backgroundColor: '#c2410c', // Shaded side
    borderTopRightRadius: 2,
    marginLeft: -4,
  },
  walls45Wrapper: {
    flexDirection: 'row',
    marginTop: -1,
    transform: [{ rotate: '-8deg' }],
  },
  wallFaceFront: {
    width: 21,
    height: 15,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderBottomLeftRadius: 3,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  wallFaceSide: {
    width: 8,
    height: 15,
    backgroundColor: '#e2e8f0', // Shaded side
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderBottomRightRadius: 3,
    marginLeft: -1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  door45: {
    width: 6,
    height: 10,
    backgroundColor: '#0284c7',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  window45: {
    width: 5,
    height: 5,
    backgroundColor: '#fde047',
    borderWidth: 0.8,
    borderColor: '#ca8a04',
    borderRadius: 1,
  },

  // 4. Mortgage Loan - 45° Blue Document + House
  docSheet45: {
    width: 21,
    height: 27,
    backgroundColor: '#ffffff',
    borderRadius: 3,
    borderWidth: 1.2,
    borderColor: '#94a3b8',
    padding: 3,
    transform: [{ rotate: '-12deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1.5 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
  },
  docTopFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopColor: '#cbd5e1',
    borderRightColor: 'transparent',
  },
  docCheckCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 2,
  },
  docLineBlue: {
    width: 11,
    height: 1.8,
    backgroundColor: '#0284c7',
    borderRadius: 1,
    marginBottom: 2,
  },
  docLineBlueShort: {
    width: 8,
    height: 1.8,
    backgroundColor: '#94a3b8',
    borderRadius: 1,
  },
  miniHome45: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    alignItems: 'center',
  },
  miniRoof45: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#f97316',
  },
  miniWall45: {
    width: 10,
    height: 7,
    backgroundColor: '#f8fafc',
    borderWidth: 0.8,
    borderColor: '#cbd5e1',
  },

  // 5. Car Loan - 45° Sports Car
  car45Wrap: {
    transform: [{ rotate: '-12deg' }],
    alignItems: 'center',
  },
  carCabin45: {
    width: 16,
    height: 8,
    backgroundColor: '#0284c7',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carWindshield45: {
    width: 12,
    height: 5,
    backgroundColor: '#bae6fd',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 2,
  },
  carBody45: {
    width: 28,
    height: 10,
    backgroundColor: '#0369a1',
    borderRadius: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  carGrill45: {
    width: 4,
    height: 5,
    backgroundColor: '#075985',
  },
  carLight45: {
    width: 4,
    height: 3,
    backgroundColor: '#fde047',
    borderRadius: 1,
  },
  carWheelFront: {
    position: 'absolute',
    bottom: -3,
    left: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#94a3b8',
  },
  carWheelBack: {
    position: 'absolute',
    bottom: -3,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#94a3b8',
  },

  // 6. Education Loan - 45° Cap & Scroll
  eduCapTop45: {
    width: 25,
    height: 12,
    backgroundColor: '#9333ea',
    borderRadius: 2,
    transform: [{ rotate: '-14deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#581c87',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.3,
  },
  capCenterButton: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#facc15',
  },
  capGoldTassel: {
    position: 'absolute',
    right: 2,
    bottom: -5,
    width: 2,
    height: 8,
    backgroundColor: '#facc15',
    borderRadius: 1,
  },
  eduCapSkull45: {
    width: 14,
    height: 7,
    backgroundColor: '#7e22ce',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginTop: -2,
  },
  eduScroll45: {
    position: 'absolute',
    bottom: 3,
    right: 4,
    width: 14,
    height: 6,
    backgroundColor: '#fef08a',
    borderRadius: 3,
    borderWidth: 0.8,
    borderColor: '#ca8a04',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollRibbon: {
    width: 3,
    height: '100%',
    backgroundColor: '#dc2626',
  },

  // 7. Agriculture - 45° Sprout
  sproutStem45: {
    width: 3,
    height: 16,
    backgroundColor: '#15803d',
    borderRadius: 1.5,
    transform: [{ rotate: '-6deg' }],
  },
  leafLeft45: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 10,
    height: 7,
    backgroundColor: '#22c55e',
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
    transform: [{ rotate: '-12deg' }],
  },
  leafRight45: {
    position: 'absolute',
    top: 6,
    right: 10,
    width: 12,
    height: 8,
    backgroundColor: '#4ade80',
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    transform: [{ rotate: '8deg' }],
  },
  earthSoilPot: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
  },

  // 8. Mudra - 45° Gold Coins
  mudraCoin45: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#d97706',
    borderWidth: 1.3,
    borderColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  mudraCoinText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#ffffff',
  },

  // 9. CIBIL - 45° Gauge
  gaugeArc3D: {
    width: 32,
    height: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: '#e2e8f0',
    transform: [{ rotate: '-8deg' }],
  },
  arcRed: {
    flex: 1,
    backgroundColor: '#ef4444',
  },
  arcYellow: {
    flex: 1,
    backgroundColor: '#eab308',
  },
  arcGreen: {
    flex: 1.2,
    backgroundColor: '#10b981',
  },
  gaugeCenterPin: {
    position: 'absolute',
    bottom: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0f172a',
  },
  gaugeNeedle45: {
    position: 'absolute',
    bottom: 14,
    left: 21,
    width: 12,
    height: 2.5,
    backgroundColor: '#0f172a',
    borderRadius: 1,
    transform: [{ rotate: '-35deg' }],
  },
  freePill45: {
    position: 'absolute',
    top: 2,
    backgroundColor: '#0284c7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  freePillText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#ffffff',
  },

  // 10. Credit Card - 45°
  card45Base: {
    width: 29,
    height: 19,
    backgroundColor: '#0f766e',
    borderRadius: 3.5,
    borderWidth: 0.8,
    borderColor: '#2dd4bf',
    padding: 2.5,
    transform: [{ rotate: '-18deg' }],
    justifyContent: 'space-between',
    shadowColor: '#134e4a',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
  },
  card45Chip: {
    width: 5,
    height: 4,
    backgroundColor: '#fbbf24',
    borderRadius: 1,
  },
  card45Circles: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
  },
  cardDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
