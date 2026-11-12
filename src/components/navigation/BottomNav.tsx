import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export type TabType = 'home' | 'applications' | 'apply' | 'insurance' | 'refer';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingDocsCount?: number;
}

/**
 * 5-Button Bottom Navigation Bar matching the Reference Architecture:
 * [Home] | [My Loans] | ( [+] Apply Loan FAB ) | [My Insurance] | [Refer & Earn]
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  pendingDocsCount = 0,
}) => {
  // Center FAB pulse animation
  const fabPulse = useRef(new Animated.Value(1)).current;
  const badgePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Subtle breathing pulse for the center golden FAB
    const fabLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, {
          toValue: 1.05,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fabPulse, {
          toValue: 0.98,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // Continuous badge alert pulse
    const badgeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulse, {
          toValue: 1.15,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(badgePulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    fabLoop.start();
    badgeLoop.start();

    return () => {
      fabLoop.stop();
      badgeLoop.stop();
    };
  }, [fabPulse, badgePulse]);

  return (
    <View style={styles.navBarWrapper}>
      {/* Top Border Line */}
      <View style={styles.topBorderLine} />

      <View style={styles.container}>
        {/* TAB 1: Home */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onSelectTab('home')}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrap}>
            <Feather
              name="home"
              size={22}
              color={currentTab === 'home' ? '#0f172a' : '#64748b'}
            />
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              currentTab === 'home' && styles.tabLabelActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* TAB 2: My Loans (Applications) */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onSelectTab('applications')}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={24}
              color={currentTab === 'applications' ? '#0f172a' : '#64748b'}
            />
            {/* Live docs pending alert badge */}
            {pendingDocsCount > 0 && (
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
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              currentTab === 'applications' && styles.tabLabelActive,
            ]}
          >
            My Loans
          </Text>
        </TouchableOpacity>

        {/* TAB 3 (CENTER FAB): Apply Loan */}
        <TouchableOpacity
          style={styles.centerFabItem}
          onPress={() => onSelectTab('apply')}
          activeOpacity={0.88}
        >
          <Animated.View
            style={[
              styles.fabButton,
              { transform: [{ scale: fabPulse }] },
            ]}
          >
            {/* Specular curved light sheen */}
            <View style={styles.fabSheen} />
            <Feather name="plus" size={30} color="#0f172a" strokeWidth={2.8} />
          </Animated.View>
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              styles.centerFabLabel,
              currentTab === 'apply' && styles.tabLabelActive,
            ]}
          >
            Apply Loan
          </Text>
        </TouchableOpacity>

        {/* TAB 4: My Insurance */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onSelectTab('insurance')}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="shield-plus-outline"
              size={24}
              color={currentTab === 'insurance' ? '#0f172a' : '#64748b'}
            />
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              currentTab === 'insurance' && styles.tabLabelActive,
            ]}
          >
            My Insurance
          </Text>
        </TouchableOpacity>

        {/* TAB 5: Refer & Earn */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onSelectTab('refer')}
          activeOpacity={0.7}
        >
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={24}
              color={currentTab === 'refer' ? '#0f172a' : '#64748b'}
            />
            {/* Gift Box Indicator Dot */}
            <View style={styles.giftMiniDot}>
              <MaterialCommunityIcons name="gift" size={10} color="#ffffff" />
            </View>
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              currentTab === 'refer' && styles.tabLabelActive,
            ]}
          >
            Refer & Earn
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navBarWrapper: {
    backgroundColor: '#ffffff',
    position: 'relative',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 16,
    paddingBottom: Platform.OS === 'ios' ? 14 : 6,
    paddingTop: 4,
  },
  topBorderLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#f1f5f9',
  },
  container: {
    flexDirection: 'row',
    height: 62,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconWrap: {
    width: 32,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerFabItem: {
    flex: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22, // Elevated floating above navbar line
  },
  fabButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fbbf24', // Rich Golden Yellow matching reference image
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: '#ffffff',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  fabSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  centerFabLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -8,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#ee1c25',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  giftMiniDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#ffffff',
  },
});
