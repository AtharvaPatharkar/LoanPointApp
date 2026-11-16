import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { UserProfile } from '../../types';

interface CompleteProfileModalProps {
  visible: boolean;
  user: UserProfile | null;
  onCompleteNow: () => void;
  onDismiss: () => void;
}

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  visible,
  user,
  onCompleteNow,
  onDismiss,
}) => {
  if (!visible) return null;

  // Calculate profile completeness items
  const hasName = !!user?.name && user.name.length > 2 && user.name !== 'Valued Customer';
  const hasCity = !!user?.city && user.city.length > 1;
  const hasIncome = (user?.monthlyIncome || 0) > 0;
  const hasPan = !!user?.panNumber && user.panNumber.length > 5;
  const hasAadhaar = !!user?.aadhaarLinked;

  const completedCount = [hasName, hasCity, hasIncome, hasPan, hasAadhaar].filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 5) * 100);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Top Decorative Gold/Cyan Accent Bar */}
          <View style={styles.topAccentBar} />

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>

          {/* Celebration / Avatar Shield Graphic */}
          <View style={styles.avatarWrap}>
            <View style={styles.iconCircleOuter}>
              <View style={styles.iconCircleInner}>
                <Ionicons name="person" size={32} color="#004aad" />
              </View>
            </View>
            <View style={styles.sparkleBadge}>
              <Ionicons name="sparkles" size={14} color="#ffffff" />
            </View>
          </View>

          {/* Header & Welcoming Text */}
          <Text style={styles.modalTitle}>Complete Your Profile</Text>
          <Text style={styles.modalSubtitle}>
            Welcome to Loan Point, <Text style={styles.userNameHighlight}>{user?.name || 'Valued Customer'}</Text>! Complete your 3-step profile to unlock pre-approved loan offers, faster disbursals, and instant eligibility.
          </Text>

          {/* Profile Strength Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeaderRow}>
              <View style={styles.progressLabelWrap}>
                <Ionicons name="shield-checkmark" size={15} color="#004aad" />
                <Text style={styles.progressLabel}>Profile Strength</Text>
              </View>
              <View style={styles.progressValueBadge}>
                <Text style={styles.progressValueText}>{progressPercent}% Done</Text>
              </View>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.max(progressPercent, 20)}%` }]} />
            </View>
            <Text style={styles.progressSubHint}>
              {completedCount} of 5 key profile parameters verified
            </Text>
          </View>

          {/* 3 Steps Overview Checklist */}
          <View style={styles.checklistCard}>
            {/* Step 1 */}
            <View style={styles.checkItem}>
              <View style={[styles.stepNumberBadge, (hasName && hasCity) && styles.stepNumberBadgeDone]}>
                {(hasName && hasCity) ? (
                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                ) : (
                  <Text style={styles.stepNumberText}>1</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkItemTitle}>Personal & City Details</Text>
                <Text style={styles.checkItemSub}>
                  {user?.city ? `City: ${user.city}` : 'Add full name & current residence city'}
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.checkItem}>
              <View style={[styles.stepNumberBadge, hasIncome && styles.stepNumberBadgeDone]}>
                {hasIncome ? (
                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                ) : (
                  <Text style={styles.stepNumberText}>2</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkItemTitle}>Income & Employment</Text>
                <Text style={styles.checkItemSub}>
                  {user?.employmentType ? `${user.employmentType} (₹${(user.monthlyIncome || 0).toLocaleString('en-IN')}/mo)` : 'Select employment type & monthly earnings'}
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.checkItem}>
              <View style={[styles.stepNumberBadge, (hasPan || hasAadhaar) && styles.stepNumberBadgeDone]}>
                {(hasPan || hasAadhaar) ? (
                  <Ionicons name="checkmark" size={12} color="#ffffff" />
                ) : (
                  <Text style={styles.stepNumberText}>3</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkItemTitle}>Identity & KYC Verification</Text>
                <Text style={styles.checkItemSub}>
                  {hasPan ? `PAN: ${user?.panNumber}` : 'Link PAN & Aadhaar for 100% paperless loan approval'}
                </Text>
              </View>
            </View>
          </View>

          {/* Main Action Button */}
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={onCompleteNow}
            activeOpacity={0.88}
          >
            <View style={styles.completeBtnIconWrap}>
              <Ionicons name="arrow-forward" size={17} color="#004aad" />
            </View>
            <Text style={styles.completeBtnText}>Complete Profile in 2 Minutes</Text>
          </TouchableOpacity>

          {/* Dismiss / Later Button */}
          <TouchableOpacity
            style={styles.laterBtn}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.laterBtnText}>I'll Complete Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: '#004aad',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  avatarWrap: {
    position: 'relative',
    marginTop: 6,
    marginBottom: 10,
  },
  iconCircleOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#eff6ff',
    borderWidth: 2.5,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  userNameHighlight: {
    fontWeight: '800',
    color: '#004aad',
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 6,
  },
  progressCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    padding: 12,
    marginTop: 14,
    marginBottom: 12,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  progressValueBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  progressValueText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#004aad',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#004aad',
    borderRadius: 4,
  },
  progressSubHint: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 6,
    fontWeight: '500',
  },
  checklistCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 10,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberBadgeDone: {
    backgroundColor: '#16a34a',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  checkItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  checkItemSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  completeBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#004aad',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 10,
    shadowColor: '#004aad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  completeBtnIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  laterBtn: {
    paddingVertical: 10,
    marginTop: 4,
  },
  laterBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748b',
  },
});
