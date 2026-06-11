/**
 * Wave Cloud Proactive Outreach Service
 * 
 * This is what makes Wave Cloud feel ALIVE — it doesn't just wait for the student
 * to come to it. It reaches out, checks in, follows up, and reminds.
 * 
 * Triggers:
 * - App open: Check if daily wellbeing check-in is due
 * - Background: Schedule push notifications for follow-ups
 * - After lessons: Generate personalized follow-up based on performance
 * - Time-based: Morning motivation, evening reflection
 * - Pattern-based: Detected decline in mood/activity
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDueFollowUps, getOverdueTasks, getCompanionState, completeFollowUp } from "./wave-cloud-memory";
import { generateProactiveMessages, type ProactiveMessage } from "./wave-cloud-personality";

const LAST_CHECK_IN_KEY = "@wave_cloud_last_check_in";
const LAST_OUTREACH_KEY = "@wave_cloud_last_outreach";
const CHECK_IN_COOLDOWN_HOURS = 20; // Don't check in more than once per 20 hours
const OUTREACH_COOLDOWN_HOURS = 4; // Don't send proactive messages more than every 4 hours

// ─── Check-In Scheduling ────────────────────────────────────────────────────

/**
 * Determine if a wellbeing check-in should be shown.
 * Called when the app opens.
 */
export async function shouldShowWellbeingCheckIn(): Promise<boolean> {
  try {
    const lastCheckIn = await AsyncStorage.getItem(LAST_CHECK_IN_KEY);
    if (!lastCheckIn) return true; // Never checked in before
    
    const lastTime = parseInt(lastCheckIn, 10);
    const hoursSince = (Date.now() - lastTime) / (1000 * 60 * 60);
    
    return hoursSince >= CHECK_IN_COOLDOWN_HOURS;
  } catch {
    return false;
  }
}

/**
 * Record that a check-in was completed.
 */
export async function recordCheckInCompleted(): Promise<void> {
  await AsyncStorage.setItem(LAST_CHECK_IN_KEY, Date.now().toString());
}

/**
 * Record that a check-in was dismissed (still counts as "shown").
 */
export async function recordCheckInDismissed(): Promise<void> {
  // Still record it so we don't show again too soon, but with a shorter cooldown
  const shorterCooldown = Date.now() - (CHECK_IN_COOLDOWN_HOURS - 8) * 60 * 60 * 1000;
  await AsyncStorage.setItem(LAST_CHECK_IN_KEY, shorterCooldown.toString());
}

// ─── Proactive Message Delivery ─────────────────────────────────────────────

/**
 * Get the next proactive message Wave Cloud should deliver.
 * Returns null if no message is due.
 */
export async function getNextProactiveMessage(): Promise<ProactiveMessage | null> {
  try {
    const lastOutreach = await AsyncStorage.getItem(LAST_OUTREACH_KEY);
    if (lastOutreach) {
      const hoursSince = (Date.now() - parseInt(lastOutreach, 10)) / (1000 * 60 * 60);
      if (hoursSince < OUTREACH_COOLDOWN_HOURS) return null;
    }
    
    const messages = await generateProactiveMessages();
    if (messages.length === 0) return null;
    
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    messages.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return messages[0];
  } catch {
    return null;
  }
}

/**
 * Mark a proactive message as delivered.
 */
export async function markProactiveMessageDelivered(): Promise<void> {
  await AsyncStorage.setItem(LAST_OUTREACH_KEY, Date.now().toString());
}

// ─── Follow-Up Management ───────────────────────────────────────────────────

/**
 * Process due follow-ups and generate messages for them.
 */
export async function processDueFollowUps(): Promise<{
  followUps: Array<{ threadId: string; message: string; type: string }>;
}> {
  const dueFollowUps = await getDueFollowUps();
  const followUps: Array<{ threadId: string; message: string; type: string }> = [];
  
  for (const thread of dueFollowUps.slice(0, 3)) {
    const state = await getCompanionState();
    const name = state.preferredName || "hey";
    
    let message = "";
    switch (thread.type) {
      case "wellbeing_followup":
        message = `${name}, I wanted to check back in about ${thread.title.toLowerCase()}. How are things now?`;
        break;
      case "goal_check":
        message = `Hey ${name}! Quick check — any progress on ${thread.title.toLowerCase()}?`;
        break;
      case "task_reminder":
        message = `Reminder: ${thread.context}. Still planning to do this?`;
        break;
      case "accountability":
        message = `${name}, checking in on your commitment: ${thread.context}. How'd it go?`;
        break;
      case "friendship_advice":
        message = `Hey! How did things go with ${thread.context}? I've been thinking about it.`;
        break;
      case "motivation":
        message = `${name}, just wanted to remind you — you're doing better than you think. ${thread.context}`;
        break;
      default:
        message = `Hey ${name}, following up on: ${thread.title}`;
    }
    
    followUps.push({ threadId: thread.id, message, type: thread.type });
  }
  
  return { followUps };
}

/**
 * Handle when a follow-up has been addressed.
 */
export async function resolveFollowUp(threadId: string, rescheduleHours?: number): Promise<void> {
  await completeFollowUp(threadId, rescheduleHours);
}

// ─── Notification Scheduling ────────────────────────────────────────────────

/**
 * Generate push notification content for Wave Cloud outreach.
 * These are scheduled via the notification system.
 */
export function generateNotificationContent(message: ProactiveMessage): {
  title: string;
  body: string;
  data: Record<string, string>;
} {
  const titleMap: Record<ProactiveMessage["type"], string> = {
    check_in: "Wave Cloud 💙",
    follow_up: "Wave Cloud remembered",
    celebration: "Wave Cloud 🎉",
    reminder: "Gentle reminder",
    motivation: "Wave Cloud 💪",
    random_care: "Wave Cloud",
  };
  
  return {
    title: titleMap[message.type] || "Wave Cloud",
    body: message.message,
    data: {
      type: "wave_cloud_outreach",
      messageType: message.type,
      mode: message.mode,
    },
  };
}

// ─── Post-Lesson Intelligence ───────────────────────────────────────────────

/**
 * Generate a Wave Cloud response after a lesson based on performance.
 * This makes Wave Cloud feel like it's watching and caring about progress.
 */
export async function generatePostLessonResponse(performance: {
  accuracy: number;
  exerciseType: string;
  duration: number;
  struggles: string[];
}): Promise<string> {
  const state = await getCompanionState();
  const name = state.preferredName || "you";
  
  if (performance.accuracy >= 90) {
    const celebrations = [
      `${name}, that was incredible! ${performance.accuracy}% accuracy — you're really getting this.`,
      `Look at you go! ${performance.accuracy}% on ${performance.exerciseType}. I'm genuinely impressed.`,
      `${name}! ${performance.accuracy}%! Remember when this used to be hard for you? Look how far you've come.`,
    ];
    return celebrations[Math.floor(Math.random() * celebrations.length)];
  } else if (performance.accuracy >= 70) {
    const encouragements = [
      `${performance.accuracy}% — solid work, ${name}. You're building something real here.`,
      `Good session! ${performance.accuracy}% on ${performance.exerciseType}. Every rep counts.`,
      `${name}, ${performance.accuracy}% and getting better. The fact that you showed up matters more than the score.`,
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  } else {
    const supports = [
      `Hey ${name}, ${performance.accuracy}% today — and that's okay. Tough days are part of the process. What matters is you showed up.`,
      `${name}, I noticed this one was harder. ${performance.struggles.length > 0 ? `Looks like ${performance.struggles[0]} tripped you up.` : ""} Want me to create some targeted practice for that?`,
      `Not your best day, and that's completely fine. ${name}, progress isn't linear. Rest up and we'll come back stronger.`,
    ];
    return supports[Math.floor(Math.random() * supports.length)];
  }
}

// ─── Morning/Evening Messages ───────────────────────────────────────────────

/**
 * Generate a time-of-day appropriate greeting.
 */
export async function getTimeBasedGreeting(): Promise<string> {
  const state = await getCompanionState();
  const name = state.preferredName || "hey";
  const hour = new Date().getHours();
  const overdue = await getOverdueTasks();
  
  if (hour < 12) {
    // Morning
    const mornings = [
      `Good morning, ${name}! Ready to make today count?`,
      `Morning, ${name}. What's one thing you want to accomplish today?`,
      `Hey ${name}! New day, new opportunities. What's the plan?`,
    ];
    let msg = mornings[Math.floor(Math.random() * mornings.length)];
    if (overdue.length > 0) {
      msg += ` Oh, and don't forget about "${overdue[0].task}" — still on your list!`;
    }
    return msg;
  } else if (hour < 17) {
    // Afternoon
    const afternoons = [
      `Hey ${name}, how's your day going so far?`,
      `${name}! Afternoon check-in — everything good?`,
      `How's the day treating you, ${name}?`,
    ];
    return afternoons[Math.floor(Math.random() * afternoons.length)];
  } else {
    // Evening
    const evenings = [
      `Hey ${name}, winding down? How was your day?`,
      `Evening, ${name}. What was the best part of today?`,
      `${name}! How are you feeling tonight?`,
    ];
    return evenings[Math.floor(Math.random() * evenings.length)];
  }
}
