import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../../types';
import { colors } from '../../theme/colors';

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
  const hasPan = !!user?.panNumber && user.panNumber.length > 5;
  const hasAadhaar = !!user?.aadhaarLinked;
  const hasCity = !!user?.city && user.city.length > 1;
  const hasIncome = (user?.monthlyIncome || 0) > 0;

  const completedCount = [hasCity, hasIncome, hasPan, hasAadhaar].filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>

          {/* Celebration / Prompt Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="person-circle" size={54} color="#2563eb" />
          </View>

          <Text style={styles.modalTitle}>Complete Your Profile</Text>
          <Text style={styles.modalSubtitle}>
            Welcome, <Text style={{ fontWeight: '800', color: '#0f172a' }}>{user?.name || 'Customer'}</Text>! Complete your profile & KYC documents to get instant loan approvals and faster disbursements.
          </Text>

          {/* Profile Progress Bar */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressLabel}>Profile Strength</Text>
              <Text style={styles.progressValueText}>{progressPercent}% Completed</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.max(progressPercent, 25)}%` }]} />
            </View>
          </View>

          {/* Pending Checklist */}
          <View style={styles.checklistCard}>
            <View style={styles.checkItem}>
              <Ionicons
                name={hasCity ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={hasCity ? '#16a34a' : '#94a3b8'}
              />
              <Text style={[styles.checkItemText, hasCity && styles.checkItemTextDone]}>
                City & Residence ({user?.city || 'Not specified'})
              </Text>
            </View>

            <View style={styles.checkItem}>
              <Ionicons
                name={hasIncome ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={hasIncome ? '#16a34a' : '#94a3b8'}
              />
              <Text style={[styles.checkItemText, hasIncome && styles.checkItemTextDone]}>
                Employment & Income Status
              </Text>
            </View>

            <View style={styles.checkItem}>
              <Ionicons
                name={hasPan ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={hasPan ? '#16a34a' : '#d97706'}
              />
              <Text style={[styles.checkItemText, hasPan && styles.checkItemTextDone]}>
                PAN & Identity Verification {hasPan ? '' : '(Pending)'}
              </Text>
            </View>

            <View style={styles.checkItem}>
              <Ionicons
                name={hasAadhaar ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={hasAadhaar ? '#16a34a' : '#d97706'}
              />
              <Text style={[styles.checkItemText, hasAadhaar && styles.checkItemTextDone]}>
                Aadhaar e-KYC Linkage {hasAadhaar ? '' : '(Pending)'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={onCompleteNow}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={18} color="#ffffff" />
            <Text style={styles.completeBtnText}>Complete Profile & KYC Now</Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>

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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  progressCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  progressValueText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  checklistCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 18,
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  checkItemTextDone: {
    color: '#16a34a',
  },
  completeBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  completeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  laterBtn: {
    paddingVertical: 10,
    marginTop: 4,
  },
  laterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
});
