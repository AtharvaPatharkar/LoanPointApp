import { NotificationItem, NotificationPreferences } from '../types';
import { INITIAL_NOTIFICATIONS, DEFAULT_NOTIFICATION_PREFS } from '../data/mockData';
import { saveSecureItem, getSecureItem } from './securityStorage';

const NOTIF_STORAGE_KEY = 'lp_notif_v2';
const USER_MSG_DATE_KEY = 'lp_user_msg_date';
const USER_MSG_COUNT_KEY = 'lp_user_msg_count';
const MAX_DAILY_USER_MESSAGES = 5;

class NotificationService {
  private notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
  private preferences: NotificationPreferences = { ...DEFAULT_NOTIFICATION_PREFS };
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await getSecureItem(NOTIF_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.notifications = parsed;
          this.notifyListeners();
        }
      }
    } catch {
      // Fallback to initial mock notifications
    }
  }

  private async persist(): Promise<void> {
    try {
      await saveSecureItem(NOTIF_STORAGE_KEY, JSON.stringify(this.notifications));
      this.notifyListeners();
    } catch {
      // Ignore
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // ignore subscriber errors
      }
    });
  }

  // Get notifications applicable to user (user's direct notifications, broadcast/system, and their queries)
  public getUserNotifications(userId?: string): NotificationItem[] {
    return this.notifications.filter((n) => {
      if (!n.userId || n.userId === 'all') return true;
      if (userId && n.userId === userId) return true;
      return false;
    });
  }

  // Count unread notifications specifically from admin or system for user
  public getUnreadCount(userId?: string): number {
    return this.getUserNotifications(userId).filter((n) => !n.read && n.sender !== 'user').length;
  }

  // Admin gets all customer inquiry messages
  public getAdminInboxMessages(): NotificationItem[] {
    return this.notifications.filter((n) => n.sender === 'user' || n.type === 'user_query');
  }

  public async markAsRead(id: string): Promise<void> {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    await this.persist();
  }

  public async markAllAsRead(userId?: string): Promise<void> {
    this.notifications = this.notifications.map((n) => {
      if (!n.userId || n.userId === 'all' || (userId && n.userId === userId)) {
        return { ...n, read: true };
      }
      return n;
    });
    await this.persist();
  }

  public async deleteNotification(id: string): Promise<void> {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    await this.persist();
  }

  public async clearAll(userId?: string): Promise<void> {
    if (!userId) {
      this.notifications = [];
    } else {
      this.notifications = this.notifications.filter(
        (n) => n.userId && n.userId !== userId && n.userId !== 'all'
      );
    }
    await this.persist();
  }

  // ---------------- TWO-WAY DISPATCH METHODS ----------------

  // Admin sends notification to user
  public async sendAdminNotification(
    targetUserId: string,
    targetUserName: string,
    targetUserMobile: string,
    message: string,
    title: string = 'Loan Point Admin Update',
    actionRoute?: string
  ): Promise<NotificationItem> {
    const newItem: NotificationItem = {
      id: `notif_admin_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      type: 'admin_direct',
      read: false,
      sender: 'admin',
      userId: targetUserId,
      userName: targetUserName,
      userMobile: targetUserMobile,
      actionScreen: actionRoute || 'NotificationCenter',
    };

    this.notifications.unshift(newItem);
    await this.persist();
    return newItem;
  }

  // Customer sends personal query to Admin (Max 5 per day)
  public async sendUserMessage(
    userId: string,
    userName: string,
    userMobile: string,
    subject: string,
    message: string
  ): Promise<{ success: boolean; error?: string; item?: NotificationItem; remainingQuota?: number }> {
    const quota = await this.getDailyQuota(userId);
    if (quota.remaining <= 0) {
      return {
        success: false,
        error: 'You have reached the maximum limit of 5 messages for today. Please try again tomorrow.',
        remainingQuota: 0,
      };
    }

    const newMsg: NotificationItem = {
      id: `msg_user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: subject || 'User Inquiry',
      message: message.trim(),
      timestamp: new Date().toISOString(),
      type: 'user_query',
      read: false,
      sender: 'user',
      userId,
      userName,
      userMobile,
    };

    this.notifications.unshift(newMsg);
    await this.persist();

    // Increment today's count
    const today = new Date().toISOString().split('T')[0];
    const newCount = quota.used + 1;
    await saveSecureItem(`${USER_MSG_DATE_KEY}_${userId}`, today);
    await saveSecureItem(`${USER_MSG_COUNT_KEY}_${userId}`, newCount.toString());

    return {
      success: true,
      item: newMsg,
      remainingQuota: Math.max(0, MAX_DAILY_USER_MESSAGES - newCount),
    };
  }

  // Get daily quota: max 5 messages per day
  public async getDailyQuota(userId?: string): Promise<{ used: number; remaining: number; max: number }> {
    const today = new Date().toISOString().split('T')[0];
    const keySuffix = userId || 'default';
    const lastDate = await getSecureItem(`${USER_MSG_DATE_KEY}_${keySuffix}`);
    const storedCount = await getSecureItem(`${USER_MSG_COUNT_KEY}_${keySuffix}`);

    if (lastDate === today && storedCount) {
      const used = parseInt(storedCount, 10) || 0;
      return {
        used,
        remaining: Math.max(0, MAX_DAILY_USER_MESSAGES - used),
        max: MAX_DAILY_USER_MESSAGES,
      };
    }

    return {
      used: 0,
      remaining: MAX_DAILY_USER_MESSAGES,
      max: MAX_DAILY_USER_MESSAGES,
    };
  }

  public getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  public updatePreferences(updated: Partial<NotificationPreferences>): NotificationPreferences {
    this.preferences = { ...this.preferences, ...updated };
    return { ...this.preferences };
  }
}

export const notificationService = new NotificationService();
