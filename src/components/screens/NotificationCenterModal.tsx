import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationItem, UserProfile } from '../../types';
import { notificationService } from '../../services/notificationService';
import { authService } from '../../services/authService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateScreen: (screen: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateScreen,
}) => {
  const currentUser: UserProfile | null = authService.getUser();
  const userId = currentUser?.id || 'guest_user';
  const userName = currentUser?.name || 'Customer';
  const userMobile = currentUser?.mobile || '';

  const [activeTab, setActiveTab] = useState<'received' | 'send'>('received');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [quota, setQuota] = useState<{ used: number; remaining: number; max: number }>({
    used: 0,
    remaining: 5,
    max: 5,
  });

  // Message form state
  const [messageText, setMessageText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);

  const refreshData = async () => {
    setNotifications(notificationService.getUserNotifications(userId));
    const currentQuota = await notificationService.getDailyQuota(userId);
    setQuota(currentQuota);
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      const unsubscribe = notificationService.subscribe(() => {
        refreshData();
      });
      return unsubscribe;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    refreshData();
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(userId);
    refreshData();
  };

  const handleItemClick = (item: NotificationItem) => {
    handleMarkAsRead(item.id);
    if (item.actionScreen) {
      onNavigateScreen(item.actionScreen);
      onClose();
    }
  };

  const handleSendMessage = async () => {
    const trimmed = messageText.trim();
    if (!trimmed) {
      Alert.alert('Message Required', 'Please enter your message or query.');
      return;
    }

    if (quota.remaining <= 0) {
      Alert.alert(
        'Daily Limit Reached',
        'You have used all 5 messages for today. Your daily limit resets at midnight.'
      );
      return;
    }

    setIsSending(true);
    try {
      const res = await notificationService.sendUserMessage(
        userId,
        userName,
        userMobile,
        trimmed,
        'Customer Support & Loan Enquiry'
      );

      if (res.success) {
        setMessageText('');
        setSendSuccessMsg('Message sent directly to Loan Point Admin!');
        refreshData();
        setTimeout(() => {
          setSendSuccessMsg(null);
        }, 3000);
      } else {
        Alert.alert('Notice', res.error || 'Failed to send message.');
      }
    } catch {
      Alert.alert('Error', 'Unable to dispatch message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.bellIconBox}>
                <Ionicons name="notifications" size={18} color="#059669" />
              </View>
              <View>
                <Text style={styles.sheetTitle}>Notification & Messaging</Text>
                <Text style={styles.sheetSub}>
                  {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {activeTab === 'received' && unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7} style={styles.markAllBtn}>
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Segmented Two-Way Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'received' && styles.tabBtnActive]}
              onPress={() => setActiveTab('received')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="mail-outline"
                size={15}
                color={activeTab === 'received' ? '#0f172a' : '#64748b'}
              />
              <Text style={[styles.tabBtnText, activeTab === 'received' && styles.tabBtnTextActive]}>
                From Admin {unreadCount > 0 ? `(+${unreadCount})` : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'send' && styles.tabBtnActive]}
              onPress={() => setActiveTab('send')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chatbox-ellipses-outline"
                size={15}
                color={activeTab === 'send' ? '#0f172a' : '#64748b'}
              />
              <Text style={[styles.tabBtnText, activeTab === 'send' && styles.tabBtnTextActive]}>
                Send Message ({quota.remaining}/5 left)
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: NOTIFICATIONS FROM ADMIN */}
          {activeTab === 'received' ? (
            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="notifications-off-outline" size={38} color="#cbd5e1" />
                  <Text style={styles.emptyTitle}>No Notifications Yet</Text>
                  <Text style={styles.emptySubtitle}>Updates and alerts from admin will appear here.</Text>
                </View>
              ) : (
                notifications.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.itemCard, !item.read && styles.itemUnread]}
                    onPress={() => handleItemClick(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.itemIconBox, !item.read && styles.itemIconBoxUnread]}>
                      <Ionicons
                        name={
                          item.type === 'admin_direct'
                            ? 'shield-checkmark'
                            : item.type === 'application'
                            ? 'document-text-outline'
                            : item.type === 'offer'
                            ? 'sparkles-outline'
                            : 'notifications-outline'
                        }
                        size={18}
                        color={!item.read ? '#059669' : '#64748b'}
                      />
                    </View>

                    <View style={styles.itemBody}>
                      <View style={styles.itemTopRow}>
                        <Text style={[styles.itemTitle, !item.read && styles.itemTitleBold]}>
                          {item.title}
                        </Text>
                        <Text style={styles.itemTimestamp}>{item.timestamp}</Text>
                      </View>
                      <Text style={styles.itemMessage}>{item.message}</Text>
                      {item.sender === 'admin' && (
                        <View style={styles.adminSenderBadge}>
                          <Ionicons name="shield-checkmark" size={10} color="#059669" />
                          <Text style={styles.adminSenderBadgeText}>Verified Loan Point Admin</Text>
                        </View>
                      )}
                    </View>

                    {!item.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          ) : (
            /* TAB 2: SEND MESSAGE TO ADMIN (UP TO 5 MESSAGES DAILY) */
            <ScrollView contentContainerStyle={styles.sendTabContent} showsVerticalScrollIndicator={false}>
              {/* Daily Limit Tracker Pill */}
              <View style={styles.quotaBanner}>
                <View style={styles.quotaIconBox}>
                  <Ionicons name="speedometer-outline" size={18} color="#d97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quotaTitle}>
                    Daily Messaging Allowance: {quota.used} / {quota.max} Used
                  </Text>
                  <Text style={styles.quotaSub}>
                    {quota.remaining > 0
                      ? `You can send ${quota.remaining} more message${quota.remaining > 1 ? 's' : ''} to Loan Point Admin today.`
                      : 'You have reached the maximum 5 messages for today. Allowance resets at midnight.'}
                  </Text>
                </View>
                <View style={[styles.quotaRemainingBadge, quota.remaining === 0 && styles.quotaBadgeZero]}>
                  <Text style={[styles.quotaRemainingText, quota.remaining === 0 && styles.quotaRemainingTextZero]}>
                    {quota.remaining} Left
                  </Text>
                </View>
              </View>

              {sendSuccessMsg && (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.successText}>{sendSuccessMsg}</Text>
                </View>
              )}

              {/* Message Composer */}
              <View style={styles.composerCard}>
                <Text style={styles.composerLabel}>Write to Branch Head / Admin</Text>
                <TextInput
                  style={[styles.composerInput, quota.remaining === 0 && styles.composerInputDisabled]}
                  placeholder={
                    quota.remaining > 0
                      ? 'Type your loan query, documents enquiry, or personal message to the manager...'
                      : 'Daily limit reached. Please check back tomorrow or call support.'
                  }
                  placeholderTextColor="#94a3b8"
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  numberOfLines={4}
                  editable={quota.remaining > 0 && !isSending}
                  maxLength={500}
                />
                <View style={styles.charCountRow}>
                  <Text style={styles.charCountText}>{messageText.length}/500 chars</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    (quota.remaining === 0 || !messageText.trim() || isSending) && styles.sendBtnDisabled,
                  ]}
                  onPress={handleSendMessage}
                  disabled={quota.remaining === 0 || !messageText.trim() || isSending}
                  activeOpacity={0.85}
                >
                  {isSending ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane" size={16} color="#ffffff" />
                      <Text style={styles.sendBtnText}>Send Message to Admin</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.supportHintBox}>
                <Ionicons name="information-circle-outline" size={16} color="#64748b" />
                <Text style={styles.supportHintText}>
                  Admins actively review queries during working hours (9:30 AM – 6:30 PM). For urgent disbursement
                  emergencies, use direct Phone Call or WhatsApp.
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '82%',
    paddingTop: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  sheetSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  markAllText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 36,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemUnread: {
    backgroundColor: '#fcfdfd',
    borderColor: '#a7f3d0',
    borderLeftWidth: 3.5,
    borderLeftColor: '#059669',
  },
  itemIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemIconBoxUnread: {
    backgroundColor: '#ecfdf5',
  },
  itemBody: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 6,
  },
  itemTitleBold: {
    fontWeight: '900',
    color: '#0f172a',
  },
  itemTimestamp: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  itemMessage: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  adminSenderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  adminSenderBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#059669',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
    marginTop: 6,
  },
  sendTabContent: {
    padding: 16,
    paddingBottom: 36,
  },
  quotaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 10,
    marginBottom: 14,
  },
  quotaIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quotaTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
  },
  quotaSub: {
    fontSize: 10.5,
    color: '#b45309',
    marginTop: 2,
    lineHeight: 15,
  },
  quotaRemainingBadge: {
    backgroundColor: '#d97706',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quotaBadgeZero: {
    backgroundColor: '#dc2626',
  },
  quotaRemainingText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  quotaRemainingTextZero: {
    color: '#ffffff',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 6,
    marginBottom: 12,
  },
  successText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#065f46',
  },
  composerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  composerLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  composerInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  composerInputDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  charCountRow: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 10,
  },
  charCountText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  sendBtnDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  supportHintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  supportHintText: {
    fontSize: 11,
    color: '#64748b',
    flex: 1,
    lineHeight: 16,
  },
});
