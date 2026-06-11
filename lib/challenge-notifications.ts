/**
 * Challenge Notification System
 * 
 * Handles sending and receiving grammar challenge notifications.
 * When a friend sends a challenge, a push notification is triggered
 * so the user can respond even when the app is closed.
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getNotificationPrefs } from "./notifications";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface ChallengeNotificationPayload {
  type: "grammar_challenge";
  challengeId: string;
  fromUser: string;
  fromUserId: string;
  category: string; // e.g., "verb_conjugation", "articles", "prepositions"
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  timestamp: number;
}

export interface PendingChallenge {
  id: string;
  fromUser: string;
  fromUserId: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  receivedAt: number;
  status: "pending" | "accepted" | "declined" | "expired";
}

// ─── Storage Keys ────────────────────────────────────────────────────────────
const PENDING_CHALLENGES_KEY = "@pending_grammar_challenges";
const CHALLENGE_HISTORY_KEY = "@grammar_challenge_notifications_history";

// ─── Send Challenge Notification ─────────────────────────────────────────────
/**
 * Send a grammar challenge notification to a friend.
 * In a real app, this would call the server to deliver a push notification
 * to the friend's device. For now, we simulate by storing the challenge
 * and triggering a local notification (for demo/testing purposes).
 */
export async function sendChallengeNotification(
  toUserId: string,
  toUserName: string,
  category: string,
  difficulty: "easy" | "medium" | "hard",
  questionCount: number
): Promise<string> {
  const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Store in sent challenges history
  const historyRaw = await AsyncStorage.getItem(CHALLENGE_HISTORY_KEY);
  const history: Array<{ id: string; toUser: string; sentAt: number; category: string }> = historyRaw ? JSON.parse(historyRaw) : [];
  history.unshift({ id: challengeId, toUser: toUserName, sentAt: Date.now(), category });
  // Keep last 50
  if (history.length > 50) history.length = 50;
  await AsyncStorage.setItem(CHALLENGE_HISTORY_KEY, JSON.stringify(history));

  // In production, this would call the server API to deliver a push notification
  // to the friend's device. For demo, we simulate receiving it locally after a delay.
  if (Platform.OS !== "web") {
    // Simulate receiving a challenge back (for testing the receive flow)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Challenge Sent! ⚔️",
        body: `Your ${category.replace(/_/g, " ")} challenge was sent to ${toUserName}!`,
        sound: true,
        data: {
          type: "challenge_sent_confirmation",
          challengeId,
          toUser: toUserName,
        },
      },
      trigger: null, // Immediate
    });
  }

  return challengeId;
}

// ─── Receive Challenge Notification ──────────────────────────────────────────
/**
 * Handle an incoming grammar challenge notification.
 * This is called when a push notification with type "grammar_challenge" is received.
 * Stores the challenge as pending and shows a local notification if app is in foreground.
 */
export async function handleIncomingChallenge(payload: ChallengeNotificationPayload): Promise<void> {
  const challenge: PendingChallenge = {
    id: payload.challengeId,
    fromUser: payload.fromUser,
    fromUserId: payload.fromUserId,
    category: payload.category,
    difficulty: payload.difficulty,
    questionCount: payload.questionCount,
    receivedAt: Date.now(),
    status: "pending",
  };

  // Store in pending challenges
  const pendingRaw = await AsyncStorage.getItem(PENDING_CHALLENGES_KEY);
  const pending: PendingChallenge[] = pendingRaw ? JSON.parse(pendingRaw) : [];
  pending.unshift(challenge);
  // Keep last 20 pending
  if (pending.length > 20) pending.length = 20;
  await AsyncStorage.setItem(PENDING_CHALLENGES_KEY, JSON.stringify(pending));

  // Trigger local notification for the user
  if (Platform.OS !== "web") {
    const prefs = await getNotificationPrefs();
    if (prefs.socialNotifs) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${payload.fromUser} challenged you! ⚔️`,
          body: `Beat their ${payload.category.replace(/_/g, " ")} quiz (${payload.questionCount} questions, ${payload.difficulty})`,
          sound: true,
          data: {
            type: "grammar_challenge",
            challengeId: payload.challengeId,
            fromUser: payload.fromUser,
            fromUserId: payload.fromUserId,
            category: payload.category,
            difficulty: payload.difficulty,
            route: "/grammar-challenge",
          },
        },
        trigger: null,
      });
    }
  }
}

// ─── Notification Response Handler ───────────────────────────────────────────
/**
 * Handle when user taps a grammar challenge notification.
 * Routes them directly to the grammar challenge screen.
 * Returns true if the notification was handled.
 */
export function handleChallengeNotificationTap(
  response: Notifications.NotificationResponse
): boolean {
  const data = response.notification.request.content.data;

  if (data?.type === "grammar_challenge") {
    const { challengeId, fromUser, fromUserId, category, difficulty } = data as unknown as ChallengeNotificationPayload & { route: string };

    // Navigate to grammar challenge screen with challenge params
    router.push({
      pathname: "/grammar-challenge",
      params: {
        challengeId: challengeId as string,
        friendId: (fromUserId || "friend") as string,
        friendName: (fromUser || "Friend") as string,
        category: (category || "mixed") as string,
        difficulty: (difficulty || "medium") as string,
        fromNotification: "true",
      },
    } as any);

    // Haptic feedback
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    return true;
  }

  return false;
}

// ─── Pending Challenges Management ──────────────────────────────────────────
/**
 * Get all pending challenges that haven't been accepted/declined.
 */
export async function getPendingChallenges(): Promise<PendingChallenge[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_CHALLENGES_KEY);
    if (!raw) return [];
    const challenges: PendingChallenge[] = JSON.parse(raw);
    // Filter out expired challenges (older than 24 hours)
    const now = Date.now();
    const active = challenges.filter(c => 
      c.status === "pending" && (now - c.receivedAt) < 24 * 60 * 60 * 1000
    );
    return active;
  } catch {
    return [];
  }
}

/**
 * Get the count of unread/pending challenges (for badge display).
 */
export async function getPendingChallengeCount(): Promise<number> {
  const pending = await getPendingChallenges();
  return pending.length;
}

/**
 * Accept a pending challenge — marks it as accepted and navigates to the quiz.
 */
export async function acceptChallenge(challengeId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(PENDING_CHALLENGES_KEY);
  if (!raw) return;
  const challenges: PendingChallenge[] = JSON.parse(raw);
  const idx = challenges.findIndex(c => c.id === challengeId);
  if (idx >= 0) {
    challenges[idx].status = "accepted";
    await AsyncStorage.setItem(PENDING_CHALLENGES_KEY, JSON.stringify(challenges));

    // Navigate to challenge
    router.push({
      pathname: "/grammar-challenge",
      params: {
        challengeId,
        friendId: challenges[idx].fromUserId,
        friendName: challenges[idx].fromUser,
        category: challenges[idx].category,
        difficulty: challenges[idx].difficulty,
        fromNotification: "true",
      },
    } as any);
  }
}

/**
 * Decline a pending challenge.
 */
export async function declineChallenge(challengeId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(PENDING_CHALLENGES_KEY);
  if (!raw) return;
  const challenges: PendingChallenge[] = JSON.parse(raw);
  const idx = challenges.findIndex(c => c.id === challengeId);
  if (idx >= 0) {
    challenges[idx].status = "declined";
    await AsyncStorage.setItem(PENDING_CHALLENGES_KEY, JSON.stringify(challenges));
  }
}

/**
 * Get sent challenge history.
 */
export async function getSentChallengeHistory(): Promise<Array<{ id: string; toUser: string; sentAt: number; category: string }>> {
  try {
    const raw = await AsyncStorage.getItem(CHALLENGE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Simulate Incoming Challenge (for demo/testing) ─────────────────────────
/**
 * Simulate receiving a challenge from a friend.
 * Used for demo purposes and testing the notification flow.
 */
export async function simulateIncomingChallenge(
  fromUser: string = "Maria Garcia",
  fromUserId: string = "friend_maria",
  category: string = "verb_conjugation",
  difficulty: "easy" | "medium" | "hard" = "medium",
  questionCount: number = 5,
  delayMs: number = 3000
): Promise<void> {
  setTimeout(async () => {
    const payload: ChallengeNotificationPayload = {
      type: "grammar_challenge",
      challengeId: `challenge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fromUser,
      fromUserId,
      category,
      difficulty,
      questionCount,
      timestamp: Date.now(),
    };
    await handleIncomingChallenge(payload);
  }, delayMs);
}
