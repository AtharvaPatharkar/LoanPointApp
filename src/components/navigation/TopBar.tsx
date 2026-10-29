import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { COMPANY_INFO } from '../../data/mockData';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenSupport?: () => void;
  userName?: string;
  isHomeScreen?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showBack,
  onBack,
  unreadCount = 0,
  onOpenNotifications,
  onOpenSupport,
  userName = 'Rahul',
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
          <View style={styles.logoBadgeContainer}>
            <Image
              source={require('../../../assets/loan-point-logo.png')}
              style={styles.simpleLogo}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={styles.titleContainer}>
          {showBack || title ? (
            <Text style={styles.screenTitle} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <View>
              <Text style={styles.welcomeSalute}>WELCOME TO LOAN POINT</Text>
              <Text style={styles.candidateName} numberOfLines={1}>
                {userName}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.rightActions}>
        {/* Notification Button with 3D Specular Sheen & Zoom-In Pulse */}
        {onOpenNotifications && (
          <TouchableOpacity
            onPress={onOpenNotifications}
            activeOpacity={0.75}
            style={styles.actionBtnTouch}
          >
            <Animated.View
              style={[
                styles.iconBtnPlatform,
                styles.notifBtn,
                { transform: [{ scale: notifPulse }] },
              ]}
            >
              {/* Top Half-Circle Specular Light Sheen */}
              <View style={styles.btnHalfSheen} />
              <Ionicons name="notifications" size={19} color="#d97706" />
            </Animated.View>

            {/* Notification Badge Floating Outside Overflow with Heartbeat Pulse */}
            {unreadCount > 0 && (
              <Animated.View
                style={[
                  styles.badgeCountPill,
                  { transform: [{ scale: badgePulse }] },
                ]}
              >
                <Text style={styles.badgeCountText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        )}

        {/* Call Support Button with 3D Specular Sheen & Zoom-In Pulse */}
        {onOpenSupport && (
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
    height: 60,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
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
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    marginLeft: -4,
  },
  logoBadgeContainer: {
    width: 48,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  simpleLogo: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  welcomeSalute: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#008ecc',
    letterSpacing: 0.5,
  },
  candidateName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  screenTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  actionBtnTouch: {
    position: 'relative',
  },
  iconBtnPlatform: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  btnHalfSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  notifBtn: {
    backgroundColor: '#fef3c7', // Warm Amber Gold Tint
    borderColor: '#fde68a',
    shadowColor: '#d97706',
    elevation: 3,
    shadowOpacity: 0.2,
  },
  callBtn: {
    backgroundColor: '#e6f6fc', // Logo Sky Cyan Tint
    borderColor: '#bae6f7',
    shadowColor: '#008ecc',
    elevation: 3,
    shadowOpacity: 0.2,
  },
  badgeCountPill: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ee1c25', // Logo Crimson Red
    borderWidth: 1.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    zIndex: 999,
    elevation: 6,
    shadowColor: '#ee1c25',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
  },
  badgeCountText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#ffffff',
    includeFontPadding: false,
    textAlign: 'center',
  },
});
