/**
 * Teacher Memory & Personality System
 * 
 * Makes the AI teacher feel like a real person who remembers you:
 * - Stores conversation highlights and student-shared personal details
 * - Tracks mood patterns and what motivates the student
 * - Builds a "relationship timeline" so the teacher can reference past interactions
 * - Adapts encouragement style based on what works for this specific student
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PersonalDetail {
  id: string;
  category: "interest" | "goal" | "life_event" | "preference" | "family" | "work" | "travel" | "culture";
  detail: string;
  learnedAt: number;
  source: "onboarding" | "conversation" | "lesson" | "profile";
  confidence: number; // 0-1, how sure we are this is still relevant
}

export interface ConversationMemory {
  id: string;
  timestamp: number;
  type: "breakthrough" | "struggle" | "personal_share" | "joke" | "milestone" | "preference";
  summary: string;
  topic?: string;
  emotion?: "happy" | "frustrated" | "excited" | "tired" | "confused" | "proud";
  teacherResponse?: string;
}

export interface MoodEntry {
  timestamp: number;
  mood: "energized" | "calm" | "tired" | "stressed" | "excited" | "frustrated" | "neutral";
  source: "check_in" | "inferred" | "conversation";
  sessionPerformance?: number; // 0-100, how well they did after this mood
}

export interface EncouragementProfile {
  /** What style of encouragement works best */
  preferredStyle: "warm" | "challenging" | "playful" | "direct" | "gentle";
  /** How they respond to different approaches (0-1 effectiveness) */
  styleEffectiveness: Record<string, number>;
  /** Phrases that have worked well in the past */
  effectivePhrases: string[];
  /** Things to avoid (student got annoyed or disengaged) */
  avoidPatterns: string[];
  /** Last updated */
  lastUpdated: number;
}

export interface TeacherRelationship {
  /** Days since first interaction */
  daysSinceStart: number;
  /** Total conversations had */
  totalConversations: number;
  /** Student's preferred teacher */
  preferredTeacherId: string;
  /** Relationship "warmth" level (0-10) */
  warmthLevel: number;
  /** Things the teacher "knows" about the student */
  personalDetails: PersonalDetail[];
  /** Conversation highlights to reference */
  memories: ConversationMemory[];
  /** Mood history */
  moodHistory: MoodEntry[];
  /** What encouragement style works */
  encouragementProfile: EncouragementProfile;
  /** Student's learning anniversary */
  startDate: string;
  /** Milestones the teacher has celebrated with them */
  celebratedMilestones: string[];
}

// ─── Storage Keys ───────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  RELATIONSHIP: "@teacher_relationship",
  MOOD_HISTORY: "@teacher_mood_history",
  PERSONAL_DETAILS: "@teacher_personal_details",
  MEMORIES: "@teacher_memories",
  ENCOURAGEMENT: "@teacher_encouragement_profile",
};

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Get the full teacher-student relationship context.
 */
export async function getRelationship(): Promise<TeacherRelationship> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.RELATIONSHIP);
    if (raw) return JSON.parse(raw);
  } catch {}
  
  // Initialize with defaults
  const startDate = await AsyncStorage.getItem("@onboarding_date") || new Date().toISOString();
  const daysSinceStart = Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    daysSinceStart,
    totalConversations: 0,
    preferredTeacherId: "maria",
    warmthLevel: 3,
    personalDetails: [],
    memories: [],
    moodHistory: [],
    encouragementProfile: {
      preferredStyle: "warm",
      styleEffectiveness: { warm: 0.7, challenging: 0.5, playful: 0.6, direct: 0.5, gentle: 0.6 },
      effectivePhrases: [],
      avoidPatterns: [],
      lastUpdated: Date.now(),
    },
    startDate,
    celebratedMilestones: [],
  };
}

/**
 * Save the relationship state.
 */
async function saveRelationship(rel: TeacherRelationship): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.RELATIONSHIP, JSON.stringify(rel));
}

/**
 * Record a personal detail the student shared.
 */
export async function learnAboutStudent(
  category: PersonalDetail["category"],
  detail: string,
  source: PersonalDetail["source"] = "conversation"
): Promise<void> {
  const rel = await getRelationship();
  
  // Don't duplicate
  const exists = rel.personalDetails.find(d => d.detail.toLowerCase() === detail.toLowerCase());
  if (exists) {
    exists.confidence = Math.min(1, exists.confidence + 0.1);
    exists.learnedAt = Date.now();
    await saveRelationship(rel);
    return;
  }
  
  rel.personalDetails.push({
    id: `pd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    category,
    detail,
    learnedAt: Date.now(),
    source,
    confidence: source === "onboarding" ? 0.9 : 0.7,
  });
  
  // Keep max 50 details, remove lowest confidence
  if (rel.personalDetails.length > 50) {
    rel.personalDetails.sort((a, b) => b.confidence - a.confidence);
    rel.personalDetails = rel.personalDetails.slice(0, 50);
  }
  
  await saveRelationship(rel);
}

/**
 * Record a conversation memory (highlight moment).
 */
export async function recordMemory(
  type: ConversationMemory["type"],
  summary: string,
  options?: { topic?: string; emotion?: ConversationMemory["emotion"]; teacherResponse?: string }
): Promise<void> {
  const rel = await getRelationship();
  
  rel.memories.push({
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    type,
    summary,
    ...options,
  });
  
  // Keep last 100 memories
  if (rel.memories.length > 100) {
    rel.memories = rel.memories.slice(-100);
  }
  
  rel.totalConversations += 1;
  rel.warmthLevel = Math.min(10, rel.warmthLevel + 0.1);
  
  await saveRelationship(rel);
}

/**
 * Record a mood check-in.
 */
export async function recordMood(
  mood: MoodEntry["mood"],
  source: MoodEntry["source"] = "check_in"
): Promise<void> {
  const rel = await getRelationship();
  
  rel.moodHistory.push({
    timestamp: Date.now(),
    mood,
    source,
  });
  
  // Keep last 30 entries
  if (rel.moodHistory.length > 30) {
    rel.moodHistory = rel.moodHistory.slice(-30);
  }
  
  await saveRelationship(rel);
}

/**
 * Update mood entry with session performance (how well they did after that mood).
 */
export async function updateMoodPerformance(accuracy: number): Promise<void> {
  const rel = await getRelationship();
  const lastMood = rel.moodHistory[rel.moodHistory.length - 1];
  if (lastMood && Date.now() - lastMood.timestamp < 2 * 60 * 60 * 1000) {
    lastMood.sessionPerformance = accuracy;
    await saveRelationship(rel);
  }
}

/**
 * Record that a particular encouragement style worked (or didn't).
 */
export async function recordEncouragementResult(
  style: string,
  worked: boolean,
  phrase?: string
): Promise<void> {
  const rel = await getRelationship();
  const profile = rel.encouragementProfile;
  
  const current = profile.styleEffectiveness[style] || 0.5;
  profile.styleEffectiveness[style] = worked
    ? Math.min(1, current + 0.05)
    : Math.max(0, current - 0.05);
  
  if (worked && phrase) {
    if (!profile.effectivePhrases.includes(phrase)) {
      profile.effectivePhrases.push(phrase);
      if (profile.effectivePhrases.length > 20) {
        profile.effectivePhrases = profile.effectivePhrases.slice(-20);
      }
    }
  }
  
  if (!worked && phrase) {
    if (!profile.avoidPatterns.includes(phrase)) {
      profile.avoidPatterns.push(phrase);
      if (profile.avoidPatterns.length > 10) {
        profile.avoidPatterns = profile.avoidPatterns.slice(-10);
      }
    }
  }
  
  // Determine preferred style
  const styles = Object.entries(profile.styleEffectiveness);
  styles.sort((a, b) => b[1] - a[1]);
  profile.preferredStyle = styles[0][0] as EncouragementProfile["preferredStyle"];
  profile.lastUpdated = Date.now();
  
  rel.encouragementProfile = profile;
  await saveRelationship(rel);
}

/**
 * Mark a milestone as celebrated so the teacher doesn't repeat it.
 */
export async function celebrateMilestone(milestoneId: string): Promise<void> {
  const rel = await getRelationship();
  if (!rel.celebratedMilestones.includes(milestoneId)) {
    rel.celebratedMilestones.push(milestoneId);
    await saveRelationship(rel);
  }
}

// ─── Context Generators (for AI prompts) ────────────────────────────────────

/**
 * Get the current mood and recommended lesson tone.
 */
export async function getMoodContext(): Promise<{
  currentMood: MoodEntry["mood"] | null;
  recommendedTone: string;
  energyLevel: "low" | "medium" | "high";
}> {
  const rel = await getRelationship();
  const recentMood = rel.moodHistory.filter(m => Date.now() - m.timestamp < 4 * 60 * 60 * 1000);
  const lastMood = recentMood[recentMood.length - 1];
  
  if (!lastMood) {
    return { currentMood: null, recommendedTone: "balanced and encouraging", energyLevel: "medium" };
  }
  
  const toneMap: Record<MoodEntry["mood"], { tone: string; energy: "low" | "medium" | "high" }> = {
    energized: { tone: "challenging and fast-paced — push them harder today", energy: "high" },
    excited: { tone: "match their energy — be enthusiastic and introduce new concepts", energy: "high" },
    calm: { tone: "steady and focused — good for deep practice", energy: "medium" },
    neutral: { tone: "balanced and encouraging", energy: "medium" },
    tired: { tone: "gentle and short — keep exercises light, use games and music", energy: "low" },
    stressed: { tone: "calming and fun — no pressure, make it feel like a break from stress", energy: "low" },
    frustrated: { tone: "patient and supportive — acknowledge the frustration, celebrate tiny wins", energy: "low" },
  };
  
  const { tone, energy } = toneMap[lastMood.mood];
  return { currentMood: lastMood.mood, recommendedTone: tone, energyLevel: energy };
}

/**
 * Generate a "teacher memory context" string for AI prompts.
 * This makes the AI feel like it remembers past interactions.
 */
export async function getTeacherMemoryContext(): Promise<string> {
  const rel = await getRelationship();
  const parts: string[] = [];
  
  // Relationship duration
  if (rel.daysSinceStart > 0) {
    parts.push(`You've been teaching this student for ${rel.daysSinceStart} days (${rel.totalConversations} conversations).`);
  }
  
  // Personal details the teacher "knows"
  const recentDetails = rel.personalDetails
    .filter(d => d.confidence > 0.5)
    .slice(0, 10);
  
  if (recentDetails.length > 0) {
    const detailStrings = recentDetails.map(d => {
      switch (d.category) {
        case "interest": return `They enjoy ${d.detail}`;
        case "goal": return `Their goal is: ${d.detail}`;
        case "life_event": return `Recently: ${d.detail}`;
        case "work": return `They work in/as: ${d.detail}`;
        case "travel": return `Travel plans: ${d.detail}`;
        case "family": return `Family: ${d.detail}`;
        case "culture": return `Cultural interest: ${d.detail}`;
        default: return d.detail;
      }
    });
    parts.push(`THINGS YOU KNOW ABOUT THEM: ${detailStrings.join(". ")}.`);
  }
  
  // Recent memories to reference naturally
  const recentMemories = rel.memories
    .filter(m => Date.now() - m.timestamp < 14 * 24 * 60 * 60 * 1000) // Last 2 weeks
    .slice(-5);
  
  if (recentMemories.length > 0) {
    const memStrings = recentMemories.map(m => {
      const daysAgo = Math.floor((Date.now() - m.timestamp) / (1000 * 60 * 60 * 24));
      const timeRef = daysAgo === 0 ? "earlier today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`;
      return `${timeRef}: ${m.summary}`;
    });
    parts.push(`RECENT MEMORIES (reference these naturally, don't list them): ${memStrings.join(". ")}.`);
  }
  
  // Encouragement style
  const style = rel.encouragementProfile;
  parts.push(`ENCOURAGEMENT STYLE: Use "${style.preferredStyle}" tone. ${
    style.effectivePhrases.length > 0
      ? `Phrases that work well with them: "${style.effectivePhrases.slice(-3).join('", "')}".`
      : ""
  }${
    style.avoidPatterns.length > 0
      ? ` AVOID: "${style.avoidPatterns.slice(-3).join('", "')}".`
      : ""
  }`);
  
  // Mood context
  const moodCtx = await getMoodContext();
  if (moodCtx.currentMood) {
    parts.push(`CURRENT MOOD: ${moodCtx.currentMood}. Recommended approach: ${moodCtx.recommendedTone}.`);
  }
  
  // Upcoming milestones
  const uncelebrated = getUpcomingMilestones(rel);
  if (uncelebrated.length > 0) {
    parts.push(`CELEBRATE: ${uncelebrated[0]} — mention this naturally and congratulate them!`);
  }
  
  return parts.join("\n");
}

/**
 * Get milestones that should be celebrated.
 */
function getUpcomingMilestones(rel: TeacherRelationship): string[] {
  const milestones: string[] = [];
  
  // Day milestones
  const dayMilestones = [7, 14, 30, 60, 90, 180, 365];
  for (const days of dayMilestones) {
    const id = `days_${days}`;
    if (rel.daysSinceStart >= days && !rel.celebratedMilestones.includes(id)) {
      if (days === 7) milestones.push("It's been one week since they started learning!");
      else if (days === 14) milestones.push("Two weeks of learning — they're building a habit!");
      else if (days === 30) milestones.push("One month anniversary! They've stuck with it for a whole month!");
      else if (days === 60) milestones.push("Two months of dedication!");
      else if (days === 90) milestones.push("Three months — they're truly committed!");
      else if (days === 180) milestones.push("Six months! Half a year of language learning!");
      else if (days === 365) milestones.push("ONE YEAR ANNIVERSARY! Incredible dedication!");
    }
  }
  
  // Conversation milestones
  const convMilestones = [10, 25, 50, 100, 200, 500];
  for (const count of convMilestones) {
    const id = `conversations_${count}`;
    if (rel.totalConversations >= count && !rel.celebratedMilestones.includes(id)) {
      milestones.push(`They've had ${count} conversations with you!`);
    }
  }
  
  return milestones;
}

/**
 * Generate a personalized "teacher note" after a lesson.
 * This is the handwritten-style note specific to what they struggled with.
 */
export async function generateTeacherNote(
  lessonTopic: string,
  accuracy: number,
  struggles: string[],
  wins: string[]
): Promise<{ note: string; tone: string; signoff: string }> {
  const rel = await getRelationship();
  const style = rel.encouragementProfile.preferredStyle;
  
  // Get student name
  let studentName = "there";
  try {
    const authRaw = await AsyncStorage.getItem("@auth_user");
    if (authRaw) {
      const auth = JSON.parse(authRaw);
      studentName = auth.name?.split(" ")[0] || auth.username || "there";
    }
  } catch {}
  
  // Build note based on style and performance
  let note = "";
  let tone = style;
  let signoff = "";
  
  if (accuracy >= 90) {
    // Excellent performance
    switch (style) {
      case "warm":
        note = `${studentName}, I'm so proud of you today! Your work on "${lessonTopic}" was outstanding. ${wins.length > 0 ? `Especially how you nailed ${wins[0]}.` : ""} Keep this energy going — you're making real progress.`;
        signoff = "So proud of you! 💛";
        break;
      case "challenging":
        note = `Strong session, ${studentName}. ${accuracy}% on "${lessonTopic}" — that's the standard I expect from you. ${wins.length > 0 ? `${wins[0]} was sharp.` : ""} Tomorrow, let's push harder. You're ready for the next level.`;
        signoff = "Keep pushing.";
        break;
      case "playful":
        note = `Okay ${studentName}, who are you and what did you do with my student?! ${accuracy}% accuracy?! On "${lessonTopic}"?! ${wins.length > 0 ? `And the way you handled ${wins[0]} — chef's kiss.` : ""} I'm running out of things to teach you at this rate!`;
        signoff = "You're a star ⭐";
        break;
      case "direct":
        note = `${accuracy}% on "${lessonTopic}". Solid work, ${studentName}. ${wins.length > 0 ? `${wins[0]} — good.` : ""} You're on track.`;
        signoff = "— Your teacher";
        break;
      default:
        note = `Beautiful work today, ${studentName}. "${lessonTopic}" is clearly clicking for you. ${wins.length > 0 ? `I noticed how naturally you used ${wins[0]}.` : ""} Take a moment to feel good about this.`;
        signoff = "You've got this 🌟";
    }
  } else if (accuracy >= 60) {
    // Good but room to improve
    switch (style) {
      case "warm":
        note = `Hey ${studentName}, good effort today on "${lessonTopic}". ${struggles.length > 0 ? `I noticed ${struggles[0]} was tricky — that's completely normal at this stage.` : ""} ${wins.length > 0 ? `But you did great with ${wins[0]}!` : ""} We'll keep working on this together.`;
        signoff = "One step at a time 💪";
        break;
      case "challenging":
        note = `${studentName}, ${accuracy}% on "${lessonTopic}" — I know you can do better. ${struggles.length > 0 ? `${struggles[0]} needs more work.` : ""} I'm assigning extra practice because I believe in your potential. Show me what you've got tomorrow.`;
        signoff = "I expect more from you.";
        break;
      case "playful":
        note = `Alright ${studentName}, "${lessonTopic}" put up a fight today, huh? ${struggles.length > 0 ? `${struggles[0]} was being stubborn, but we'll tame it.` : ""} ${wins.length > 0 ? `At least ${wins[0]} surrendered to your brilliance!` : ""} Round 2 tomorrow?`;
        signoff = "We'll get 'em next time 🥊";
        break;
      default:
        note = `Good session, ${studentName}. "${lessonTopic}" has some tricky parts. ${struggles.length > 0 ? `Focus on ${struggles[0]} — a little extra practice will make it click.` : ""} You're making progress even when it doesn't feel like it.`;
        signoff = "Keep going 🌱";
    }
  } else {
    // Struggled significantly
    switch (style) {
      case "warm":
        note = `${studentName}, I want you to know — today was hard, and that's okay. "${lessonTopic}" is genuinely challenging. ${struggles.length > 0 ? `${struggles[0]} trips up a lot of learners.` : ""} The fact that you showed up and tried matters more than any score. We'll tackle this together, bit by bit.`;
        signoff = "I'm here for you 💛";
        break;
      case "challenging":
        note = `Tough day, ${studentName}. ${accuracy}% on "${lessonTopic}". ${struggles.length > 0 ? `${struggles[0]} needs serious attention.` : ""} But here's the thing — the best learners are the ones who push through the hard days. I'm giving you targeted practice. Come back stronger.`;
        signoff = "This is where growth happens.";
        break;
      case "playful":
        note = `Okay ${studentName}, "${lessonTopic}" absolutely wrecked us today 😅 ${struggles.length > 0 ? `${struggles[0]} was like a final boss we weren't ready for.` : ""} But you know what? Every expert was once a beginner who refused to quit. Let's level up and try again!`;
        signoff = "We'll beat this level 🎮";
        break;
      default:
        note = `${studentName}, today's lesson on "${lessonTopic}" was challenging. ${struggles.length > 0 ? `${struggles[0]} is a common difficulty — you're not alone in finding it hard.` : ""} I've prepared some gentler exercises to build your confidence. Take it easy on yourself.`;
        signoff = "Tomorrow is a new day 🌅";
    }
  }
  
  return { note, tone, signoff };
}

/**
 * Get the student's name for personalized greetings.
 */
export async function getStudentName(): Promise<string> {
  try {
    const authRaw = await AsyncStorage.getItem("@auth_user");
    if (authRaw) {
      const auth = JSON.parse(authRaw);
      return auth.name?.split(" ")[0] || auth.username || "there";
    }
  } catch {}
  return "there";
}

/**
 * Initialize personal details from onboarding data.
 */
export async function initFromOnboarding(): Promise<void> {
  const rel = await getRelationship();
  if (rel.personalDetails.length > 0) return; // Already initialized
  
  try {
    const targetLang = await AsyncStorage.getItem("@target_language");
    if (targetLang) {
      await learnAboutStudent("goal", `Learning ${targetLang}`, "onboarding");
    }
    
    const schedule = await AsyncStorage.getItem("@learning_schedule");
    if (schedule) {
      const s = JSON.parse(schedule);
      await learnAboutStudent("preference", `Prefers ${s.minutesPerDay} minutes/day, ${s.daysPerWeek} days/week`, "onboarding");
    }
    
    const level = await AsyncStorage.getItem("@proficiency_level");
    if (level) {
      await learnAboutStudent("goal", `Currently at ${level} level`, "onboarding");
    }
  } catch {}
}

/**
 * Infer mood from session behavior (time of day, response speed, accuracy).
 */
export async function inferMoodFromBehavior(
  timeOfDay: number,
  averageResponseTimeMs: number,
  accuracy: number
): Promise<MoodEntry["mood"]> {
  // Late night + slow responses = tired
  if ((timeOfDay >= 22 || timeOfDay <= 5) && averageResponseTimeMs > 5000) {
    return "tired";
  }
  
  // Fast responses + high accuracy = energized
  if (averageResponseTimeMs < 2000 && accuracy > 80) {
    return "energized";
  }
  
  // Slow responses + low accuracy = frustrated or stressed
  if (averageResponseTimeMs > 4000 && accuracy < 50) {
    return "frustrated";
  }
  
  // Fast responses + moderate accuracy = excited
  if (averageResponseTimeMs < 2500 && accuracy > 60) {
    return "excited";
  }
  
  return "neutral";
}
