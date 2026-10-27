import { NotificationItem, NotificationPreferences } from '../types';
import { INITIAL_NOTIFICATIONS, DEFAULT_NOTIFICATION_PREFS } from '../data/mockData';

class NotificationService {
  private notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
  private preferences: NotificationPreferences = { ...DEFAULT_NOTIFICATION_PREFS };

  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  public markAsRead(id: string): void {
    const item = this.notifications.find((n) => n.id === id);
    if (item) item.read = true;
  }

  public markAllAsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
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
