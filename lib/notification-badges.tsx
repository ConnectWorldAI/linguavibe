/**
 * Notification Badge System
 * Provides badge counts for tabs: connections, messages, calls, assignments.
 * Bell icon turns red with unread count, green when all read.
 * Phone icon turns red with missed calls count.
 * Includes notification items for the notification center.
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

export interface BadgeCounts {
  connections: number; // new connection requests
  messages: number; // unread messages
  calls: number; // missed calls
  assignments: number; // ungraded/new homework
  notifications: number; // general notifications (bell)
  referrals: number; // new referral redemptions
}

export type NotificationType = "connection" | "message" | "assignment" | "system" | "call";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  icon: string; // Ionicons name
  color: string;
}

interface NotificationBadgeContextType {
  badges: BadgeCounts;
  totalUnread: number;
  allRead: boolean;
  notifications: NotificationItem[];
  setBadge: (key: keyof BadgeCounts, count: number) => void;
  incrementBadge: (key: keyof BadgeCounts) => void;
  clearBadge: (key: keyof BadgeCounts) => void;
  clearAll: () => void;
  getBellColor: () => string;
  getCallsColor: () => string;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
}

const DEFAULT_BADGES: BadgeCounts = {
  connections: 3,
  messages: 5,
  calls: 2,
  assignments: 1,
  notifications: 4,
  referrals: 0,
};

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    type: "connection",
    title: "New Connection Request",
    body: "Maria Garcia wants to practice English with you",
    time: "2m ago",
    read: false,
    icon: "person-add",
    color: "#8B5CF6",
  },
  {
    id: "n2",
    type: "message",
    title: "New Message",
    body: "Carlos: Hey! Are you free for a call tonight?",
    time: "15m ago",
    read: false,
    icon: "chatbubble",
    color: "#06B6D4",
  },
  {
    id: "n3",
    type: "assignment",
    title: "Homework Graded",
    body: "Your pronunciation drill scored 92% — great improvement!",
    time: "1h ago",
    read: false,
    icon: "school",
    color: "#F59E0B",
  },
  {
    id: "n4",
    type: "system",
    title: "Streak Milestone! 🔥",
    body: "You've reached a 30-day streak! Keep it up!",
    time: "2h ago",
    read: false,
    icon: "flame",
    color: "#EF4444",
  },
  {
    id: "n5",
    type: "connection",
    title: "Connection Accepted",
    body: "Kenji Tanaka accepted your connection request",
    time: "3h ago",
    read: true,
    icon: "checkmark-circle",
    color: "#22C55E",
  },
  {
    id: "n6",
    type: "call",
    title: "Missed Call",
    body: "You missed a practice call from Amara Diallo",
    time: "4h ago",
    read: true,
    icon: "call",
    color: "#EF4444",
  },
  {
    id: "n7",
    type: "connection",
    title: "New Connection Request",
    body: "Park Ji-hoon wants to exchange Korean ↔ English",
    time: "5h ago",
    read: true,
    icon: "person-add",
    color: "#8B5CF6",
  },
  {
    id: "n8",
    type: "system",
    title: "New Feature Available",
    body: "Try Quick Match — instantly pair with an online partner!",
    time: "1d ago",
    read: true,
    icon: "sparkles",
    color: "#FFD700",
  },
  {
    id: "n9",
    type: "message",
    title: "Study Group Update",
    body: "Dominican Spanish Speakers: 3 new messages",
    time: "1d ago",
    read: true,
    icon: "people",
    color: "#06B6D4",
  },
  {
    id: "n10",
    type: "call",
    title: "Missed Call",
    body: "You missed a practice call from Marco Rossi",
    time: "2d ago",
    read: true,
    icon: "call",
    color: "#EF4444",
  },
];

const NotificationBadgeContext = createContext<NotificationBadgeContextType | null>(null);

export function NotificationBadgeProvider({ children }: { children: React.ReactNode }) {
  const [badges, setBadges] = useState<BadgeCounts>(DEFAULT_BADGES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);

  const totalUnread = useMemo(
    () => Object.values(badges).reduce((sum, v) => sum + v, 0),
    [badges]
  );

  const allRead = totalUnread === 0;

  const setBadge = useCallback((key: keyof BadgeCounts, count: number) => {
    setBadges((prev) => ({ ...prev, [key]: Math.max(0, count) }));
  }, []);

  const incrementBadge = useCallback((key: keyof BadgeCounts) => {
    setBadges((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  }, []);

  const clearBadge = useCallback((key: keyof BadgeCounts) => {
    setBadges((prev) => ({ ...prev, [key]: 0 }));
  }, []);

  const clearAll = useCallback(() => {
    setBadges({ connections: 0, messages: 0, calls: 0, assignments: 0, notifications: 0, referrals: 0 });
  }, []);

  const getBellColor = useCallback(() => {
    if (badges.notifications > 0) return "#EF4444"; // red
    if (allRead) return "#22C55E"; // green
    return "#9BA1A6"; // default muted
  }, [badges.notifications, allRead]);

  const getCallsColor = useCallback(() => {
    if (badges.calls > 0) return "#EF4444"; // red
    return "#9BA1A6"; // default muted
  }, [badges.calls]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setBadges((prev) => ({ ...prev, notifications: 0 }));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      badges,
      totalUnread,
      allRead,
      notifications,
      setBadge,
      incrementBadge,
      clearBadge,
      clearAll,
      getBellColor,
      getCallsColor,
      markNotificationRead,
      markAllNotificationsRead,
      dismissNotification,
    }),
    [badges, totalUnread, allRead, notifications, setBadge, incrementBadge, clearBadge, clearAll, getBellColor, getCallsColor, markNotificationRead, markAllNotificationsRead, dismissNotification]
  );

  return (
    <NotificationBadgeContext.Provider value={value}>
      {children}
    </NotificationBadgeContext.Provider>
  );
}

export function useNotificationBadges() {
  const context = useContext(NotificationBadgeContext);
  if (!context) {
    throw new Error("useNotificationBadges must be used within NotificationBadgeProvider");
  }
  return context;
}
