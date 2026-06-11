import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure foreground notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Storage keys
const NOTIF_PREFS_KEY = "@connectworld_notification_prefs";
const DND_KEY = "@connectworld_dnd_state";

// Types
export type NotificationType =
  | "streak_reminder"
  | "assignment_deadline"
  | "connection_request"
  | "daily_goal"
  | "weekly_recap"
  | "practice_reminder";

export interface NotificationPreferences {
  enabled: boolean;
  streakReminder: { enabled: boolean; hour: number; minute: number };
  assignmentDeadline: { enabled: boolean; minutesBefore: number };
  connectionRequests: { enabled: boolean };
  dailyGoal: { enabled: boolean; hour: number; minute: number };
  weeklyRecap: { enabled: boolean; dayOfWeek: number; hour: number };
  practiceReminder: { enabled: boolean; hour: number; minute: number };
}

export interface DNDState {
  active: boolean;
  expiresAt: number | null; // timestamp
  resumeAutomatically: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: true,
  streakReminder: { enabled: true, hour: 20, minute: 0 }, // 8 PM
  assignmentDeadline: { enabled: true, minutesBefore: 60 },
  connectionRequests: { enabled: true },
  dailyGoal: { enabled: true, hour: 9, minute: 0 }, // 9 AM
  weeklyRecap: { enabled: true, dayOfWeek: 0, hour: 10 }, // Sunday 10 AM
  practiceReminder: { enabled: true, hour: 14, minute: 0 }, // 2 PM
};

const DEFAULT_DND: DNDState = {
  active: false,
  expiresAt: null,
  resumeAutomatically: true,
};

// Context
interface NotificationSchedulerContextType {
  preferences: NotificationPreferences;
  dndState: DNDState;
  permissionGranted: boolean;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  updateStreakReminder: (update: Partial<NotificationPreferences["streakReminder"]>) => Promise<void>;
  updateAssignmentDeadline: (update: Partial<NotificationPreferences["assignmentDeadline"]>) => Promise<void>;
  updateDailyGoal: (update: Partial<NotificationPreferences["dailyGoal"]>) => Promise<void>;
  updatePracticeReminder: (update: Partial<NotificationPreferences["practiceReminder"]>) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  scheduleStreakReminder: () => Promise<void>;
  scheduleAssignmentReminder: (title: string, dueDate: Date) => Promise<string | undefined>;
  triggerConnectionRequest: (fromUser: string) => Promise<void>;
  cancelAllScheduled: () => Promise<void>;
  activateDND: (durationMinutes: number) => Promise<void>;
  deactivateDND: () => Promise<void>;
  isDNDActive: () => boolean;
  dndTimeRemaining: () => number; // minutes remaining
}

const NotificationSchedulerContext = createContext<NotificationSchedulerContextType | null>(null);

export function useNotificationScheduler() {
  const ctx = useContext(NotificationSchedulerContext);
  if (!ctx) {
    // Return safe defaults when outside provider
    return {
      preferences: DEFAULT_PREFS,
      dndState: DEFAULT_DND,
      permissionGranted: false,
      updatePreferences: async () => {},
      updateStreakReminder: async () => {},
      updateAssignmentDeadline: async () => {},
      updateDailyGoal: async () => {},
      updatePracticeReminder: async () => {},
      requestPermission: async () => false,
      scheduleStreakReminder: async () => {},
      scheduleAssignmentReminder: async () => undefined,
      triggerConnectionRequest: async () => {},
      cancelAllScheduled: async () => {},
      activateDND: async () => {},
      deactivateDND: async () => {},
      isDNDActive: () => false,
      dndTimeRemaining: () => 0,
    } as NotificationSchedulerContextType;
  }
  return ctx;
}

export function NotificationSchedulerProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [dndState, setDndState] = useState<DNDState>(DEFAULT_DND);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Load saved preferences
  useEffect(() => {
    loadPreferences();
    loadDNDState();
    checkPermission();
    setupAndroidChannel();
  }, []);

  // DND auto-resume timer
  useEffect(() => {
    if (!dndState.active || !dndState.expiresAt) return;

    const remaining = dndState.expiresAt - Date.now();
    if (remaining <= 0) {
      deactivateDND();
      return;
    }

    const timer = setTimeout(() => {
      if (dndState.resumeAutomatically) {
        deactivateDND();
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [dndState]);

  const setupAndroidChannel = async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#00AAFF",
      });
      await Notifications.setNotificationChannelAsync("streak", {
        name: "Streak Reminders",
        importance: Notifications.AndroidImportance.HIGH,
      });
      await Notifications.setNotificationChannelAsync("assignments", {
        name: "Assignment Deadlines",
        importance: Notifications.AndroidImportance.HIGH,
      });
      await Notifications.setNotificationChannelAsync("social", {
        name: "Social",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  };

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIF_PREFS_KEY);
      if (stored) setPreferences(JSON.parse(stored));
    } catch {}
  };

  const loadDNDState = async () => {
    try {
      const stored = await AsyncStorage.getItem(DND_KEY);
      if (stored) {
        const parsed: DNDState = JSON.parse(stored);
        // Check if DND has expired
        if (parsed.active && parsed.expiresAt && parsed.expiresAt < Date.now()) {
          const expired = { ...DEFAULT_DND };
          setDndState(expired);
          await AsyncStorage.setItem(DND_KEY, JSON.stringify(expired));
        } else {
          setDndState(parsed);
        }
      }
    } catch {}
  };

  const savePreferences = async (prefs: NotificationPreferences) => {
    try {
      await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
    } catch {}
  };

  const saveDNDState = async (state: DNDState) => {
    try {
      await AsyncStorage.setItem(DND_KEY, JSON.stringify(state));
    } catch {}
  };

  const checkPermission = async () => {
    if (Platform.OS === "web") {
      setPermissionGranted(true);
      return;
    }
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionGranted(status === "granted");
  };

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === "web") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === "granted";
    setPermissionGranted(granted);
    return granted;
  };

  const updatePreferences = async (update: Partial<NotificationPreferences>) => {
    const newPrefs = { ...preferences, ...update };
    setPreferences(newPrefs);
    await savePreferences(newPrefs);
    // Reschedule notifications based on new preferences
    if (newPrefs.enabled && newPrefs.streakReminder.enabled) {
      await scheduleStreakReminder();
    }
  };

  const updateStreakReminder = async (update: Partial<NotificationPreferences["streakReminder"]>) => {
    const newPrefs = {
      ...preferences,
      streakReminder: { ...preferences.streakReminder, ...update },
    };
    setPreferences(newPrefs);
    await savePreferences(newPrefs);
  };

  const updateAssignmentDeadline = async (update: Partial<NotificationPreferences["assignmentDeadline"]>) => {
    const newPrefs = {
      ...preferences,
      assignmentDeadline: { ...preferences.assignmentDeadline, ...update },
    };
    setPreferences(newPrefs);
    await savePreferences(newPrefs);
  };

  const updateDailyGoal = async (update: Partial<NotificationPreferences["dailyGoal"]>) => {
    const newPrefs = {
      ...preferences,
      dailyGoal: { ...preferences.dailyGoal, ...update },
    };
    setPreferences(newPrefs);
    await savePreferences(newPrefs);
  };

  const updatePracticeReminder = async (update: Partial<NotificationPreferences["practiceReminder"]>) => {
    const newPrefs = {
      ...preferences,
      practiceReminder: { ...preferences.practiceReminder, ...update },
    };
    setPreferences(newPrefs);
    await savePreferences(newPrefs);
  };

  const scheduleStreakReminder = async () => {
    if (Platform.OS === "web") return;
    if (!preferences.enabled || !preferences.streakReminder.enabled) return;
    if (dndState.active) return;

    // Cancel existing streak reminders
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === "streak_reminder") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // Schedule daily recurring
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔥 Don't break your streak!",
        body: "You haven't practiced today. Keep your streak alive!",
        data: { type: "streak_reminder" },
        sound: true,
      },
      trigger: {
        type: "daily" as any,
        hour: preferences.streakReminder.hour,
        minute: preferences.streakReminder.minute,
        repeats: true,
      },
    });
  };

  const scheduleAssignmentReminder = async (title: string, dueDate: Date): Promise<string | undefined> => {
    if (Platform.OS === "web") return undefined;
    if (!preferences.enabled || !preferences.assignmentDeadline.enabled) return undefined;
    if (dndState.active) return undefined;

    const triggerDate = new Date(dueDate);
    triggerDate.setMinutes(triggerDate.getMinutes() - preferences.assignmentDeadline.minutesBefore);

    // Don't schedule if trigger is in the past
    if (triggerDate.getTime() <= Date.now()) return undefined;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "📚 Assignment Due Soon",
        body: `"${title}" is due in ${preferences.assignmentDeadline.minutesBefore} minutes`,
        data: { type: "assignment_deadline" },
        sound: true,
      },
      trigger: { type: "date" as any, date: triggerDate },
    });

    return id;
  };

  const triggerConnectionRequest = async (fromUser: string) => {
    if (Platform.OS === "web") return;
    if (!preferences.enabled || !preferences.connectionRequests.enabled) return;
    if (dndState.active) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🤝 New Connection Request",
        body: `${fromUser} wants to practice with you!`,
        data: { type: "connection_request" },
        sound: true,
      },
      trigger: { type: "timeInterval" as any, seconds: 1 },
    });
  };

  const cancelAllScheduled = async () => {
    if (Platform.OS === "web") return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const activateDND = async (durationMinutes: number) => {
    const newState: DNDState = {
      active: true,
      expiresAt: Date.now() + durationMinutes * 60 * 1000,
      resumeAutomatically: true,
    };
    setDndState(newState);
    await saveDNDState(newState);

    // Cancel all pending notifications during DND
    if (Platform.OS !== "web") {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const deactivateDND = async () => {
    const newState = { ...DEFAULT_DND };
    setDndState(newState);
    await saveDNDState(newState);

    // Reschedule notifications
    if (preferences.streakReminder.enabled) {
      await scheduleStreakReminder();
    }
  };

  const isDNDActive = (): boolean => {
    if (!dndState.active) return false;
    if (dndState.expiresAt && dndState.expiresAt < Date.now()) return false;
    return true;
  };

  const dndTimeRemaining = (): number => {
    if (!dndState.active || !dndState.expiresAt) return 0;
    const remaining = dndState.expiresAt - Date.now();
    return Math.max(0, Math.ceil(remaining / 60000));
  };

  return (
    <NotificationSchedulerContext.Provider
      value={{
        preferences,
        dndState,
        permissionGranted,
        updatePreferences,
        updateStreakReminder,
        updateAssignmentDeadline,
        updateDailyGoal,
        updatePracticeReminder,
        requestPermission,
        scheduleStreakReminder,
        scheduleAssignmentReminder,
        triggerConnectionRequest,
        cancelAllScheduled,
        activateDND,
        deactivateDND,
        isDNDActive,
        dndTimeRemaining,
      }}
    >
      {children}
    </NotificationSchedulerContext.Provider>
  );
}
