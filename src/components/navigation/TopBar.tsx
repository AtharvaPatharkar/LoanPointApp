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
          <Image
            source={require('../../../assets/loan-point-logo.png')}
            style={styles.simpleLogo}
            resizeMode="contain"
          />
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
            style={styles.iconBtn}
            accessibilityLabel="Notifications"
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            {unreadCount > 0 && <View style={styles.badgeDot} />}
          </TouchableOpacity>
        )}

        {onOpenSupport && (
          <TouchableOpacity
            onPress={onOpenSupport}
            style={styles.iconBtn}
            accessibilityLabel="Call Support"
            activeOpacity={0.7}
          >
            <Ionicons name="call-outline" size={20} color={colors.primary} />
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
  simpleLogo: {
    width: 38,
    height: 38,
    marginRight: 10,
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
    backgroundColor: colors.surfaceSubtle,
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});
