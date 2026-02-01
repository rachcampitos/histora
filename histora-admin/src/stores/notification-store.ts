import { create } from 'zustand';
import { AdminNotification } from '@/types';

interface NotificationState {
  notifications: AdminNotification[];
  unreadCount: number;
  isOpen: boolean;
  setNotifications: (notifications: AdminNotification[]) => void;
  addNotification: (notification: AdminNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  setOpen: (isOpen) => set({ isOpen }),

  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
