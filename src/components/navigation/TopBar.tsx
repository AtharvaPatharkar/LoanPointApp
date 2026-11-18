import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenSupport?: () => void;
  onOpenProfile?: () => void;
  userName?: string;
  userAvatar?: string;
  isHomeScreen?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showBack,
  onBack,
  unreadCount = 0,
  onOpenNotifications,
  onOpenSupport,
  onOpenProfile,
  userName = 'Rahul',
  userAvatar,
  isHomeScreen = true,
}) => {
  // Continuous breathing pulse animation for notifications and call buttons
  const notifPulse = useRef(new Animated.Value(1)).current;
  const callPulse = useRef(new Animated.Value(1)).current;
  const badgePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Notification bell gentle breathing loop
    const notifLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(notifPulse, {
          toValue: 1.08,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(notifPulse, {
          toValue: 0.96,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Call button staggered pulse
    const callLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(650),
        Animated.timing(callPulse, {
          toValue: 1.08,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(callPulse, {
          toValue: 0.96,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Unread notification badge heartbeat
    const badgeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulse, {
          toValue: 1.2,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(badgePulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    notifLoop.start();
    callLoop.start();
    badgeLoop.start();

    return () => {
      notifLoop.stop();
      callLoop.stop();
      badgeLoop.stop();
    };
  }, [notifPulse, callPulse, badgePulse]);

  return (
    <View style={styles.header}>
      {/* Top Accent Sky Cyan Highlight Line */}
      <View style={styles.topAccentBar} />

      <View style={styles.leftContainer}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandRow}>
            <Image
              source={require('../../../assets/logo/loan-point-logo.png')}
              style={styles.oldLogoImage}
              resizeMode="contain"
            />
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandTitle}>LOAN POINT</Text>
              <Text style={styles.brandSubtitle}>Your Loan, Our Support</Text>
            </View>
          </View>
        )}

        {showBack && (
          <View style={styles.titleContainer}>
            <Text style={styles.screenTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.rightActions}>
        {/* Notification Bell Button matching the Reference Image */}
        {onOpenNotifications && (
          <TouchableOpacity
            onPress={onOpenNotifications}
            activeOpacity={0.75}
            style={styles.actionBtnTouch}
          >
            <View style={styles.cleanNotifWrap}>
              <Ionicons name="notifications-outline" size={24} color="#0f172a" />
              {unreadCount > 0 && (
                <View style={styles.badgeCountPill}>
                  <Text style={styles.badgeCountText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* User Profile Avatar Pill matching the Reference Image Header */}
        {onOpenProfile && (
          <TouchableOpacity
            onPress={onOpenProfile}
            activeOpacity={0.8}
            style={styles.avatarTouch}
          >
            <View style={styles.avatarCircleWrap}>
              {userAvatar ? (
                <Image
                  source={{ uri: userAvatar }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={20} color="#008ecc" />
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Call Support Button (kept as compact optional action if provided) */}
        {onOpenSupport && !onOpenProfile && (
          <TouchableOpacity
            onPress={onOpenSupport}
            activeOpacity={0.75}
            style={styles.actionBtnTouch}
          >
            <Animated.View
              style={[
                styles.iconBtnPlatform,
                styles.callBtn,
                { transform: [{ scale: callPulse }] },
              ]}
            >
              <View style={styles.btnHalfSheen} />
              <Ionicons name="call" size={18} color="#008ecc" />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 64,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  topAccentBar: {
    display: 'none',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oldLogoImage: {
    width: 44,
    height: 40,
    marginRight: 8,
  },
  brandTextWrap: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0a1d37',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#008ecc',
    marginTop: -1,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexShrink: 0,
  },
  actionBtnTouch: {
    position: 'relative',
    padding: 2,
  },
  cleanNotifWrap: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTouch: {
    position: 'relative',
  },
  avatarCircleWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  badgeCountPill: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeCountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  iconBtnPlatform: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnHalfSheen: {
    display: 'none',
  },
  callBtn: {
    backgroundColor: '#e6f6fc',
  },
});
