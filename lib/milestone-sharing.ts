import { Share, Platform } from "react-native";
import type { Milestone } from "@/lib/streak-bonus";
import type { PerfectDayStreak } from "@/lib/perfect-day-streak";

export interface ShareableStats {
  milestoneCompleted: number;
  totalMilestones: number;
  creditsEarned: number;
  perfectDayStreak: number;
  longestStreak: number;
}

export async function shareMilestoneAchievement(milestone: Milestone): Promise<void> {
  const message = `🏆 I just unlocked "${milestone.title}" on ConnectWorld AI!\n\n${milestone.description}\n+${milestone.credits} credits earned 💰\n\n🌍 Learn languages through music, calls & AI — join me on ConnectWorld AI!`;

  try {
    await Share.share(
      Platform.OS === "ios"
        ? { message }
        : { message, title: `ConnectWorld AI - ${milestone.title}` }
    );
  } catch {}
}

export async function sharePerfectDay(stats: ShareableStats): Promise<void> {
  const streakText = stats.perfectDayStreak > 1
    ? `🔥 ${stats.perfectDayStreak}-day Perfect Day streak!`
    : "🌟 Perfect Day achieved!";

  const message = `${streakText}\n\n✅ ${stats.milestoneCompleted}/${stats.totalMilestones} milestones completed\n💰 ${stats.creditsEarned} credits earned today\n🏆 Longest streak: ${stats.longestStreak} days\n\n🌍 I'm learning languages on ConnectWorld AI — music, calls & AI teachers. Join me!`;

  try {
    await Share.share(
      Platform.OS === "ios"
        ? { message }
        : { message, title: "ConnectWorld AI - Perfect Day!" }
    );
  } catch {}
}

export async function shareWeeklyRecap(stats: {
  totalMilestones: number;
  totalCredits: number;
  perfectDays: number;
  bestDay: string;
  minutesLearned: number;
}): Promise<void> {
  const message = `📊 My ConnectWorld AI Weekly Recap:\n\n🎯 ${stats.totalMilestones} milestones completed\n💰 ${stats.totalCredits} credits earned\n⭐ ${stats.perfectDays} Perfect Days\n⏱️ ${stats.minutesLearned} minutes of learning\n🏆 Best day: ${stats.bestDay}\n\n🌍 Learning languages through music, calls & AI. Join me on ConnectWorld AI!`;

  try {
    await Share.share(
      Platform.OS === "ios"
        ? { message }
        : { message, title: "ConnectWorld AI - Weekly Recap" }
    );
  } catch {}
}
