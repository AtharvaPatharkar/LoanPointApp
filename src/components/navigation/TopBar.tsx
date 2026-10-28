import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
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
  return (
    <View style={styles.header}>
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
            <Text style={styles.candidateName} numberOfLines={1}>
              {userName}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightActions}>
        {onOpenNotifications && (
          <TouchableOpacity
            onPress={onOpenNotifications}
            style={[styles.iconBtn, styles.notifBtn]}
            accessibilityLabel="Notifications"
            activeOpacity={0.75}
          >
            <Ionicons name="notifications" size={20} color="#d97706" />
            {unreadCount > 0 && (
              <View style={styles.badgeCountPill}>
                <Text style={styles.badgeCountText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {onOpenSupport && (
          <TouchableOpacity
            onPress={onOpenSupport}
            style={[styles.iconBtn, styles.callBtn]}
            accessibilityLabel="Call Support"
            activeOpacity={0.75}
          >
            <Ionicons name="call" size={18} color="#008ecc" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 58,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginLeft: -4,
  },
  logoBadgeContainer: {
    width: 48,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  simpleLogo: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
  },
  notifBtn: {
    backgroundColor: '#fef3c7', // Warm Amber Gold Tint
    borderColor: '#fde68a',
  },
  callBtn: {
    backgroundColor: '#e6f6fc', // Logo Sky Cyan Tint
    borderColor: '#bae6f7',
  },
  badgeCountPill: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#ee1c25', // Logo Crimson Red
    borderWidth: 1.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeCountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
});
