import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export type TabType = 'home' | 'applications' | 'services' | 'profile';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingDocsCount?: number;
}

interface TabItemConfig {
  id: TabType;
  label: string;
  family: 'MaterialCommunityIcons' | 'FontAwesome5';
  iconName: string;
  fillColor: string;
  lightBg: string;
}

/**
 * Clean Upright FinTech Bottom Navigation Bar with ALL-TIME Continuous Micro-Animations
 * Features:
 * - Straight upright standard orientation (NO 45-degree tilt)
 * - ALL 4 buttons continuously animate with staggered Zoom-In / Zoom-Out pulse ALL THE TIME
 * - Specular half-circle light sheen on every platform
 * - Active tab elevated with vivid color and under-pill indicator
 * - Notification badge with continuous heartbeat pulse
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  pendingDocsCount = 0,
}) => {
  // 4 Independent continuous zoom animations for ALL buttons (staggered for an organic rhythm)
  const homeZoom = useRef(new Animated.Value(1)).current;
  const appsZoom = useRef(new Animated.Value(1)).current;
  const servicesZoom = useRef(new Animated.Value(1)).current;
  const profileZoom = useRef(new Animated.Value(1)).current;
  const badgePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Helper to create smooth infinite zoom-in / zoom-out breathing loop
    const createZoomLoop = (anim: Animated.Value, delayMs: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.timing(anim, {
            toValue: 1.08,
            duration: 1300,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.95,
            duration: 1300,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Stagger start times so all buttons pulse continuously and rhythmically
    const homeLoop = createZoomLoop(homeZoom, 0);
    const appsLoop = createZoomLoop(appsZoom, 400);
    const servicesLoop = createZoomLoop(servicesZoom, 800);
    const profileLoop = createZoomLoop(profileZoom, 1200);

    // Alert badge heartbeat pulse
    const badgeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulse, {
          toValue: 1.22,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(badgePulse, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    homeLoop.start();
    appsLoop.start();
    servicesLoop.start();
    profileLoop.start();
    badgeLoop.start();

    return () => {
      homeLoop.stop();
      appsLoop.stop();
      servicesLoop.stop();
      profileLoop.stop();
      badgeLoop.stop();
    };
  }, [homeZoom, appsZoom, servicesZoom, profileZoom, badgePulse]);

  const tabs: TabItemConfig[] = [
    {
      id: 'home',
      label: 'Home',
      family: 'MaterialCommunityIcons',
      iconName: 'home-variant',
      fillColor: '#008ecc', // Sky Cyan
      lightBg: '#e6f6fc',
    },
    {
      id: 'applications',
      label: 'Applications',
      family: 'MaterialCommunityIcons',
      iconName: 'file-document-check',
      fillColor: '#ee1c25', // Crimson Red
      lightBg: '#fef2f2',
    },
    {
      id: 'services',
      label: 'Services',
      family: 'MaterialCommunityIcons',
      iconName: 'view-grid',
      fillColor: '#2d3091', // Indigo Navy
      lightBg: '#eef0fa',
    },
    {
      id: 'profile',
      label: 'Profile',
      family: 'FontAwesome5',
      iconName: 'user-alt',
      fillColor: '#075665', // Petrol Teal
      lightBg: '#e2f0f4',
    },
  ];

  // Map each tab to its continuous zoom animation
  const getTabAnimation = (id: TabType) => {
    switch (id) {
      case 'home':
        return homeZoom;
      case 'applications':
        return appsZoom;
      case 'services':
        return servicesZoom;
      case 'profile':
        return profileZoom;
      default:
        return homeZoom;
    }
  };

  // Upright icons (NO 45° rotation)
  const renderIcon = (tab: TabItemConfig, isActive: boolean) => {
    const iconColor = isActive ? '#ffffff' : tab.fillColor;

    if (tab.family === 'FontAwesome5') {
      return (
        <View style={styles.iconStraightWrap}>
          <FontAwesome5 name={tab.iconName} size={16} color={iconColor} />
        </View>
      );
    }

    return (
      <View style={styles.iconStraightWrap}>
        <MaterialCommunityIcons
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name={tab.iconName as any}
          size={22}
          color={iconColor}
        />
      </View>
    );
  };

  return (
    <View style={styles.navBar}>
      {/* Top Accent Sky Cyan Highlight Line */}
      <View style={styles.topAccentBar} />

      <View style={styles.innerContainer}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const anim = getTabAnimation(tab.id);

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onSelectTab(tab.id)}
              style={styles.tabButton}
              activeOpacity={0.75}
            >
              {/* Tile Platform Container */}
              <View style={styles.tabPlatformContainer}>
                {/* Specular Platform with ALL-TIME Continuous Zoom-In Zoom-Out Animation */}
                <Animated.View
                  style={[
                    styles.iconTilePlatform,
                    {
                      backgroundColor: isActive ? tab.fillColor : tab.lightBg,
                      shadowColor: tab.fillColor,
                      borderColor: isActive ? '#ffffff' : '#e2e8f0',
                      elevation: isActive ? 6 : 2,
                      shadowOpacity: isActive ? 0.38 : 0.12,
                      transform: [{ scale: anim }], // ALWAYS active for all buttons!
                    },
                  ]}
                >
                  {/* Half-Circle Specular Top Sheen */}
                  <View style={styles.halfCircleSheen} />

                  {/* Upright Straight Icon */}
                  {renderIcon(tab, isActive)}
                </Animated.View>

                {/* Applications Alert Badge outside overflow:hidden with Heartbeat Pulse */}
                {tab.id === 'applications' && pendingDocsCount > 0 && (
                  <Animated.View
                    style={[
                      styles.badge,
                      { transform: [{ scale: badgePulse }] },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {pendingDocsCount > 9 ? '9+' : pendingDocsCount}
                    </Text>
                  </Animated.View>
                )}
              </View>

              {/* Tab Label */}
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? tab.fillColor : '#64748b',
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {tab.label}
              </Text>

              {/* Active Indicator Underline Pill */}
              {isActive ? (
                <View
                  style={[styles.activeUnderlineDot, { backgroundColor: tab.fillColor }]}
                />
              ) : (
                <View style={styles.inactiveDotPlaceholder} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 6,
    paddingTop: 4,
    elevation: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'relative',
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#008ecc', // Vivid Sky Cyan Top Line
  },
  innerContainer: {
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabPlatformContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  iconTilePlatform: {
    width: 48,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2.5 },
    shadowRadius: 5,
  },
  halfCircleSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  iconStraightWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    // Straight standard orientation (no 45° tilt)
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ee1c25', // Logo Crimson Red
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
    zIndex: 999,
    elevation: 8,
    shadowColor: '#ee1c25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 12,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: -0.2,
    marginTop: 1,
  },
  activeUnderlineDot: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    marginTop: 2,
  },
  inactiveDotPlaceholder: {
    width: 14,
    height: 3,
    marginTop: 2,
  },
});
