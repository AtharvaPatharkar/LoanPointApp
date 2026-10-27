import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationItem } from '../../types';
import { notificationService } from '../../services/notificationService';
import { colors } from '../../theme/colors';

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
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    notificationService.getNotifications()
  );

  if (!isOpen) return null;

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
    setNotifications(notificationService.getNotifications());
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getNotifications());
  };

  const handleItemClick = (item: NotificationItem) => {
    handleMarkAsRead(item.id);
    if (item.actionScreen) {
      onNavigateScreen(item.actionScreen);
      onClose();
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.bellIconBox}>
                <Ionicons name="notifications" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.sheetTitle}>Notifications</Text>
                <Text style={styles.sheetSub}>
                  {notifications.filter((n) => !n.read).length} unread updates
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* List */}
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No notifications at this time.</Text>
              </View>
            ) : (
              notifications.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, !item.read && styles.itemUnread]}
                  onPress={() => handleItemClick(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemIconBox}>
                    <Ionicons
                      name={
                        item.type === 'application'
                          ? 'document-text-outline'
                          : item.type === 'offer'
                          ? 'sparkles-outline'
                          : 'time-outline'
                      }
                      size={18}
                      color={colors.primary}
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
                  </View>

                  {!item.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  sheetSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  itemUnread: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  itemIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemBody: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 12,
    color: colors.text,
  },
  itemTitleBold: {
    fontWeight: '800',
    color: colors.primaryDark,
  },
  itemTimestamp: {
    fontSize: 9,
    color: colors.textLight,
  },
  itemMessage: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
});
