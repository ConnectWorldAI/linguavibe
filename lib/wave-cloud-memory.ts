/**
 * Wave Cloud Companion Memory System
 * 
 * This is the "brain" that makes Wave Cloud feel like a real person who knows you deeply.
 * Unlike teacher-memory.ts (which focuses on learning context), this stores EVERYTHING:
 * - Full conversation threads (summarized for efficiency)
 * - Life context (goals, problems, relationships, schedule)
 * - Wellbeing tracking (emotional patterns, stress levels, energy)
 * - Task/reminder management (things Wave Cloud promised to follow up on)
 * - Coaching notes (what advice was given, what worked)
 * - Social/friendship guidance history
 * 
 * Architecture:
 * - Short-term: Last 20 messages in full detail (for immediate context)
 * - Medium-term: Summarized conversation threads from past 30 days
 * - Long-term: Key facts, patterns, and relationship milestones (permanent)
 * - Active threads: Ongoing topics Wave Cloud is tracking (wellbeing, goals, tasks)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export type CompanionRole = "therapist" | "coach" | "motivator" | "advisor" | "friend" | "accountability";

export interface CompanionMessage {
  id: string;
  timestamp: number;
  role: "user" | "wave_cloud";
  text: string;
  /** What mode Wave Cloud was in when this was said */
  companionMode?: CompanionRole;
  /** Detected emotion/tone from the user */
  detectedEmotion?: string;
  /** Topics discussed */
  topics?: string[];
  /** Whether this message contained something important to remember */
  isMemoryWorthy?: boolean;
}

export interface ConversationThread {
  id: string;
  startedAt: number;
  lastMessageAt: number;
  /** AI-generated summary of the conversation */
  summary: string;
  /** Key topics covered */
  topics: string[];
  /** What mode(s) Wave Cloud was in */
  modes: CompanionRole[];
  /** Any commitments made (follow-ups, reminders) */
  commitments: string[];
  /** Emotional arc of the conversation */
  emotionalArc: string;
  /** Number of messages in this thread */
  messageCount: number;
}

export interface LifeContext {
  /** Current life situation/challenges */
  currentChallenges: LifeItem[];
  /** Goals they're working toward (not just language) */
  lifeGoals: LifeItem[];
  /** Important relationships mentioned */
  relationships: RelationshipItem[];
  /** School/work situation */
  schoolWork: LifeItem[];
  /** Hobbies and interests beyond language */
  interests: string[];
  /** Things that make them happy */
  joyTriggers: string[];
  /** Things that stress them out */
  stressTriggers: string[];
  /** Daily routine patterns */
  routineNotes: string[];
}

export interface LifeItem {
  id: string;
  description: string;
  addedAt: number;
  lastMentioned: number;
  status: "active" | "resolved" | "ongoing";
  /** Wave Cloud's notes about this */
  coachingNotes?: string;
}

export interface RelationshipItem {
  name: string;
  relation: string; // "friend", "parent", "partner", "classmate", "coworker", etc.
  context: string; // What we know about this relationship
  lastMentioned: number;
}

export interface WellbeingEntry {
  timestamp: number;
  overallMood: number; // 1-10
  energyLevel: number; // 1-10
  stressLevel: number; // 1-10
  sleepQuality?: number; // 1-10
  socialConnection?: number; // 1-10
  notes?: string;
  source: "check_in" | "inferred" | "conversation";
}

export interface ActiveThread {
  id: string;
  type: "wellbeing_followup" | "goal_check" | "task_reminder" | "accountability" | "friendship_advice" | "motivation" | "custom";
  title: string;
  description: string;
  createdAt: number;
  nextFollowUp: number; // When Wave Cloud should bring this up again
  followUpCount: number;
  lastFollowUp: number;
  status: "active" | "resolved" | "paused";
  /** Context for the follow-up */
  context: string;
}

export interface TaskReminder {
  id: string;
  task: string;
  createdAt: number;
  dueAt?: number;
  reminderAt?: number;
  status: "pending" | "done" | "overdue" | "cancelled";
  category: "study" | "personal" | "health" | "social" | "work" | "other";
  /** Why Wave Cloud suggested/created this */
  reason?: string;
}

export interface CoachingInsight {
  id: string;
  timestamp: number;
  category: "motivation" | "habit" | "social" | "emotional" | "academic" | "health" | "growth";
  insight: string;
  /** What triggered this insight */
  trigger: string;
  /** Whether the student found it helpful */
  wasHelpful?: boolean;
}

export interface CompanionState {
  /** Short-term: recent messages */
  recentMessages: CompanionMessage[];
  /** Medium-term: summarized conversation threads */
  conversationThreads: ConversationThread[];
  /** Long-term: life context */
  lifeContext: LifeContext;
  /** Wellbeing history */
  wellbeingHistory: WellbeingEntry[];
  /** Active follow-up threads */
  activeThreads: ActiveThread[];
  /** Tasks and reminders Wave Cloud is tracking */
  tasks: TaskReminder[];
  /** Coaching insights given */
  coachingInsights: CoachingInsight[];
  /** How many total conversations we've had */
  totalConversations: number;
  /** First interaction date */
  firstInteraction: string;
  /** Student's preferred name for Wave Cloud to use */
  preferredName: string;
  /** What the student calls Wave Cloud */
  waveCloudNickname: string;
  /** Communication preferences */
  communicationPrefs: {
    preferredCheckInTime: string; // "morning" | "afternoon" | "evening"
    checkInFrequency: "daily" | "every_other_day" | "weekly";
    tonePreference: "casual" | "warm" | "professional" | "playful";
    proactiveLevel: "high" | "medium" | "low"; // How often Wave Cloud reaches out
  };
}

// ─── Storage ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "@wave_cloud_companion_state";
const MAX_RECENT_MESSAGES = 50;
const MAX_THREADS = 100;
const MAX_WELLBEING_ENTRIES = 90; // 3 months
const MAX_COACHING_INSIGHTS = 50;

function getDefaultState(): CompanionState {
  return {
    recentMessages: [],
    conversationThreads: [],
    lifeContext: {
      currentChallenges: [],
      lifeGoals: [],
      relationships: [],
      schoolWork: [],
      interests: [],
      joyTriggers: [],
      stressTriggers: [],
      routineNotes: [],
    },
    wellbeingHistory: [],
    activeThreads: [],
    tasks: [],
    coachingInsights: [],
    totalConversations: 0,
    firstInteraction: new Date().toISOString(),
    preferredName: "",
    waveCloudNickname: "Wave Cloud",
    communicationPrefs: {
      preferredCheckInTime: "morning",
      checkInFrequency: "daily",
      tonePreference: "warm",
      proactiveLevel: "high",
    },
  };
}

let cachedState: CompanionState | null = null;

export async function getCompanionState(): Promise<CompanionState> {
  if (cachedState) return cachedState;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      cachedState = JSON.parse(raw);
      return cachedState!;
    }
  } catch {}
  cachedState = getDefaultState();
  return cachedState;
}

async function saveState(state: CompanionState): Promise<void> {
  cachedState = state;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Message Recording ──────────────────────────────────────────────────────

/**
 * Record a message in the conversation. This is called every time
 * the user or Wave Cloud says something.
 */
export async function recordMessage(
  role: "user" | "wave_cloud",
  text: string,
  options?: {
    companionMode?: CompanionRole;
    detectedEmotion?: string;
    topics?: string[];
    isMemoryWorthy?: boolean;
  }
): Promise<void> {
  const state = await getCompanionState();
  
  const message: CompanionMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    role,
    text,
    ...options,
  };
  
  state.recentMessages.push(message);
  
  // Keep only recent messages
  if (state.recentMessages.length > MAX_RECENT_MESSAGES) {
    // Before trimming, summarize the oldest batch into a thread
    const toSummarize = state.recentMessages.slice(0, 20);
    await summarizeToThread(state, toSummarize);
    state.recentMessages = state.recentMessages.slice(20);
  }
  
  state.totalConversations += role === "user" ? 1 : 0;
  await saveState(state);
}

/**
 * Summarize a batch of messages into a conversation thread.
 */
async function summarizeToThread(state: CompanionState, messages: CompanionMessage[]): Promise<void> {
  if (messages.length === 0) return;
  
  const topics = new Set<string>();
  const modes = new Set<CompanionRole>();
  const commitments: string[] = [];
  let emotionalArc = "neutral";
  
  for (const msg of messages) {
    msg.topics?.forEach(t => topics.add(t));
    if (msg.companionMode) modes.add(msg.companionMode);
    if (msg.detectedEmotion) emotionalArc = msg.detectedEmotion;
  }
  
  // Generate a simple summary from the messages
  const userMessages = messages.filter(m => m.role === "user").map(m => m.text);
  const summary = userMessages.length > 0
    ? `Discussed: ${userMessages.slice(0, 3).map(t => t.slice(0, 60)).join("; ")}${userMessages.length > 3 ? ` (+${userMessages.length - 3} more)` : ""}`
    : "Brief interaction";
  
  const thread: ConversationThread = {
    id: `thread_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    startedAt: messages[0].timestamp,
    lastMessageAt: messages[messages.length - 1].timestamp,
    summary,
    topics: Array.from(topics),
    modes: Array.from(modes),
    commitments,
    emotionalArc,
    messageCount: messages.length,
  };
  
  state.conversationThreads.push(thread);
  
  // Keep max threads
  if (state.conversationThreads.length > MAX_THREADS) {
    state.conversationThreads = state.conversationThreads.slice(-MAX_THREADS);
  }
}

// ─── Life Context Management ────────────────────────────────────────────────

/**
 * Add or update a life challenge the student is dealing with.
 */
export async function recordLifeChallenge(description: string, coachingNotes?: string): Promise<void> {
  const state = await getCompanionState();
  
  // Check if similar challenge exists
  const existing = state.lifeContext.currentChallenges.find(
    c => c.description.toLowerCase().includes(description.toLowerCase().slice(0, 20))
  );
  
  if (existing) {
    existing.lastMentioned = Date.now();
    if (coachingNotes) existing.coachingNotes = coachingNotes;
  } else {
    state.lifeContext.currentChallenges.push({
      id: `challenge_${Date.now()}`,
      description,
      addedAt: Date.now(),
      lastMentioned: Date.now(),
      status: "active",
      coachingNotes,
    });
  }
  
  // Keep max 20 challenges
  if (state.lifeContext.currentChallenges.length > 20) {
    state.lifeContext.currentChallenges = state.lifeContext.currentChallenges
      .sort((a, b) => b.lastMentioned - a.lastMentioned)
      .slice(0, 20);
  }
  
  await saveState(state);
}

/**
 * Add or update a life goal.
 */
export async function recordLifeGoal(description: string, coachingNotes?: string): Promise<void> {
  const state = await getCompanionState();
  
  const existing = state.lifeContext.lifeGoals.find(
    g => g.description.toLowerCase().includes(description.toLowerCase().slice(0, 20))
  );
  
  if (existing) {
    existing.lastMentioned = Date.now();
    if (coachingNotes) existing.coachingNotes = coachingNotes;
  } else {
    state.lifeContext.lifeGoals.push({
      id: `goal_${Date.now()}`,
      description,
      addedAt: Date.now(),
      lastMentioned: Date.now(),
      status: "active",
      coachingNotes,
    });
  }
  
  await saveState(state);
}

/**
 * Record a relationship the student mentioned.
 */
export async function recordRelationship(name: string, relation: string, context: string): Promise<void> {
  const state = await getCompanionState();
  
  const existing = state.lifeContext.relationships.find(
    r => r.name.toLowerCase() === name.toLowerCase()
  );
  
  if (existing) {
    existing.context = context;
    existing.lastMentioned = Date.now();
  } else {
    state.lifeContext.relationships.push({
      name,
      relation,
      context,
      lastMentioned: Date.now(),
    });
  }
  
  // Keep max 30 relationships
  if (state.lifeContext.relationships.length > 30) {
    state.lifeContext.relationships = state.lifeContext.relationships
      .sort((a, b) => b.lastMentioned - a.lastMentioned)
      .slice(0, 30);
  }
  
  await saveState(state);
}

/**
 * Add a school/work item.
 */
export async function recordSchoolWork(description: string): Promise<void> {
  const state = await getCompanionState();
  
  state.lifeContext.schoolWork.push({
    id: `sw_${Date.now()}`,
    description,
    addedAt: Date.now(),
    lastMentioned: Date.now(),
    status: "active",
  });
  
  if (state.lifeContext.schoolWork.length > 15) {
    state.lifeContext.schoolWork = state.lifeContext.schoolWork.slice(-15);
  }
  
  await saveState(state);
}

// ─── Wellbeing Tracking ─────────────────────────────────────────────────────

/**
 * Record a wellbeing check-in.
 */
export async function recordWellbeing(entry: Omit<WellbeingEntry, "timestamp">): Promise<void> {
  const state = await getCompanionState();
  
  state.wellbeingHistory.push({
    ...entry,
    timestamp: Date.now(),
  });
  
  if (state.wellbeingHistory.length > MAX_WELLBEING_ENTRIES) {
    state.wellbeingHistory = state.wellbeingHistory.slice(-MAX_WELLBEING_ENTRIES);
  }
  
  await saveState(state);
}

/**
 * Get wellbeing trends (last 7 days).
 */
export function getWellbeingTrends(state: CompanionState): {
  avgMood: number;
  avgEnergy: number;
  avgStress: number;
  trend: "improving" | "declining" | "stable";
  concernAreas: string[];
} {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = state.wellbeingHistory.filter(e => e.timestamp > weekAgo);
  
  if (recent.length === 0) {
    return { avgMood: 7, avgEnergy: 7, avgStress: 3, trend: "stable", concernAreas: [] };
  }
  
  const avgMood = recent.reduce((s, e) => s + e.overallMood, 0) / recent.length;
  const avgEnergy = recent.reduce((s, e) => s + e.energyLevel, 0) / recent.length;
  const avgStress = recent.reduce((s, e) => s + e.stressLevel, 0) / recent.length;
  
  // Determine trend by comparing first half to second half
  const mid = Math.floor(recent.length / 2);
  const firstHalf = recent.slice(0, mid);
  const secondHalf = recent.slice(mid);
  
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, e) => s + e.overallMood, 0) / firstHalf.length : avgMood;
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, e) => s + e.overallMood, 0) / secondHalf.length : avgMood;
  
  const trend = secondAvg - firstAvg > 0.5 ? "improving" : secondAvg - firstAvg < -0.5 ? "declining" : "stable";
  
  const concernAreas: string[] = [];
  if (avgStress > 7) concernAreas.push("high stress levels");
  if (avgMood < 4) concernAreas.push("low mood");
  if (avgEnergy < 4) concernAreas.push("low energy");
  const socialEntries = recent.filter(e => e.socialConnection !== undefined);
  if (socialEntries.length > 0) {
    const avgSocial = socialEntries.reduce((s, e) => s + (e.socialConnection || 5), 0) / socialEntries.length;
    if (avgSocial < 4) concernAreas.push("feeling isolated");
  }
  
  return { avgMood, avgEnergy, avgStress, trend, concernAreas };
}

// ─── Active Threads (Follow-ups) ────────────────────────────────────────────

/**
 * Create a follow-up thread. Wave Cloud will bring this up at the scheduled time.
 */
export async function createFollowUp(
  type: ActiveThread["type"],
  title: string,
  context: string,
  followUpInHours: number = 24
): Promise<void> {
  const state = await getCompanionState();
  
  state.activeThreads.push({
    id: `thread_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    title,
    description: title,
    createdAt: Date.now(),
    nextFollowUp: Date.now() + followUpInHours * 60 * 60 * 1000,
    followUpCount: 0,
    lastFollowUp: Date.now(),
    status: "active",
    context,
  });
  
  // Keep max 20 active threads
  const active = state.activeThreads.filter(t => t.status === "active");
  if (active.length > 20) {
    // Resolve oldest ones
    active.sort((a, b) => a.createdAt - b.createdAt);
    active[0].status = "resolved";
  }
  
  await saveState(state);
}

/**
 * Get threads that are due for follow-up NOW.
 */
export async function getDueFollowUps(): Promise<ActiveThread[]> {
  const state = await getCompanionState();
  return state.activeThreads.filter(
    t => t.status === "active" && t.nextFollowUp <= Date.now()
  );
}

/**
 * Mark a follow-up as done and schedule the next one.
 */
export async function completeFollowUp(threadId: string, rescheduleHours?: number): Promise<void> {
  const state = await getCompanionState();
  const thread = state.activeThreads.find(t => t.id === threadId);
  if (!thread) return;
  
  thread.followUpCount += 1;
  thread.lastFollowUp = Date.now();
  
  if (rescheduleHours) {
    thread.nextFollowUp = Date.now() + rescheduleHours * 60 * 60 * 1000;
  } else {
    thread.status = "resolved";
  }
  
  await saveState(state);
}

// ─── Task Management ────────────────────────────────────────────────────────

/**
 * Add a task/reminder that Wave Cloud is tracking.
 */
export async function addTask(
  task: string,
  category: TaskReminder["category"],
  options?: { dueAt?: number; reminderAt?: number; reason?: string }
): Promise<string> {
  const state = await getCompanionState();
  
  const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  state.tasks.push({
    id,
    task,
    createdAt: Date.now(),
    status: "pending",
    category,
    ...options,
  });
  
  await saveState(state);
  return id;
}

/**
 * Complete a task.
 */
export async function completeTask(taskId: string): Promise<void> {
  const state = await getCompanionState();
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = "done";
    await saveState(state);
  }
}

/**
 * Get pending tasks, optionally filtered by category.
 */
export async function getPendingTasks(category?: TaskReminder["category"]): Promise<TaskReminder[]> {
  const state = await getCompanionState();
  return state.tasks.filter(t => {
    if (t.status !== "pending") return false;
    if (category && t.category !== category) return false;
    return true;
  });
}

/**
 * Get overdue tasks.
 */
export async function getOverdueTasks(): Promise<TaskReminder[]> {
  const state = await getCompanionState();
  return state.tasks.filter(t => t.status === "pending" && t.dueAt && t.dueAt < Date.now());
}

// ─── Coaching Insights ──────────────────────────────────────────────────────

/**
 * Record a coaching insight Wave Cloud gave.
 */
export async function recordCoachingInsight(
  category: CoachingInsight["category"],
  insight: string,
  trigger: string
): Promise<void> {
  const state = await getCompanionState();
  
  state.coachingInsights.push({
    id: `insight_${Date.now()}`,
    timestamp: Date.now(),
    category,
    insight,
    trigger,
  });
  
  if (state.coachingInsights.length > MAX_COACHING_INSIGHTS) {
    state.coachingInsights = state.coachingInsights.slice(-MAX_COACHING_INSIGHTS);
  }
  
  await saveState(state);
}

// ─── Context Generation (for AI prompts) ────────────────────────────────────

/**
 * Generate the full companion context for AI prompts.
 * This is what makes Wave Cloud feel like it truly knows you.
 */
export async function getCompanionContext(): Promise<string> {
  const state = await getCompanionState();
  const parts: string[] = [];
  
  // Relationship duration
  const daysSinceStart = Math.floor(
    (Date.now() - new Date(state.firstInteraction).getTime()) / (1000 * 60 * 60 * 24)
  );
  parts.push(`## RELATIONSHIP\nYou've known this person for ${daysSinceStart} days across ${state.totalConversations} conversations.`);
  if (state.preferredName) {
    parts.push(`Their name is ${state.preferredName}. Always use it naturally.`);
  }
  
  // Recent conversation context (last 10 messages for immediate continuity)
  const recentMsgs = state.recentMessages.slice(-10);
  if (recentMsgs.length > 0) {
    const recentSummary = recentMsgs
      .filter(m => m.role === "user")
      .map(m => m.text.slice(0, 80))
      .slice(-5)
      .join(" | ");
    parts.push(`## RECENT CONVERSATION\nThey recently said: ${recentSummary}`);
  }
  
  // Life context
  const lc = state.lifeContext;
  if (lc.currentChallenges.filter(c => c.status === "active").length > 0) {
    const challenges = lc.currentChallenges
      .filter(c => c.status === "active")
      .slice(0, 5)
      .map(c => c.description);
    parts.push(`## CURRENT CHALLENGES (be sensitive about these)\n${challenges.join("\n- ")}`);
  }
  
  if (lc.lifeGoals.filter(g => g.status === "active").length > 0) {
    const goals = lc.lifeGoals
      .filter(g => g.status === "active")
      .slice(0, 5)
      .map(g => g.description);
    parts.push(`## THEIR GOALS (encourage progress on these)\n${goals.join("\n- ")}`);
  }
  
  if (lc.relationships.length > 0) {
    const rels = lc.relationships
      .sort((a, b) => b.lastMentioned - a.lastMentioned)
      .slice(0, 8)
      .map(r => `${r.name} (${r.relation}): ${r.context}`);
    parts.push(`## PEOPLE IN THEIR LIFE (reference naturally)\n${rels.join("\n- ")}`);
  }
  
  if (lc.schoolWork.filter(s => s.status === "active").length > 0) {
    const sw = lc.schoolWork.filter(s => s.status === "active").slice(0, 5).map(s => s.description);
    parts.push(`## SCHOOL/WORK\n${sw.join("\n- ")}`);
  }
  
  if (lc.joyTriggers.length > 0) {
    parts.push(`## WHAT MAKES THEM HAPPY\n${lc.joyTriggers.slice(0, 5).join(", ")}`);
  }
  
  if (lc.stressTriggers.length > 0) {
    parts.push(`## STRESS TRIGGERS (be careful around these)\n${lc.stressTriggers.slice(0, 5).join(", ")}`);
  }
  
  // Wellbeing trends
  const trends = getWellbeingTrends(state);
  parts.push(`## WELLBEING STATUS\nMood: ${trends.avgMood.toFixed(1)}/10 | Energy: ${trends.avgEnergy.toFixed(1)}/10 | Stress: ${trends.avgStress.toFixed(1)}/10 | Trend: ${trends.trend}${trends.concernAreas.length > 0 ? `\n⚠️ Concerns: ${trends.concernAreas.join(", ")}` : ""}`);
  
  // Active follow-ups
  const dueThreads = state.activeThreads.filter(t => t.status === "active" && t.nextFollowUp <= Date.now());
  if (dueThreads.length > 0) {
    const followUps = dueThreads.slice(0, 3).map(t => `${t.title}: ${t.context}`);
    parts.push(`## THINGS TO FOLLOW UP ON (bring these up naturally)\n${followUps.join("\n- ")}`);
  }
  
  // Pending tasks
  const pendingTasks = state.tasks.filter(t => t.status === "pending").slice(0, 5);
  if (pendingTasks.length > 0) {
    const taskList = pendingTasks.map(t => {
      const due = t.dueAt ? ` (due ${new Date(t.dueAt).toLocaleDateString()})` : "";
      return `${t.task}${due}`;
    });
    parts.push(`## TASKS YOU'RE TRACKING FOR THEM\n${taskList.join("\n- ")}`);
  }
  
  // Overdue tasks
  const overdue = state.tasks.filter(t => t.status === "pending" && t.dueAt && t.dueAt < Date.now());
  if (overdue.length > 0) {
    parts.push(`## ⚠️ OVERDUE TASKS (gently remind them)\n${overdue.map(t => t.task).join("\n- ")}`);
  }
  
  // Recent conversation threads (for referencing past conversations)
  const recentThreads = state.conversationThreads.slice(-5);
  if (recentThreads.length > 0) {
    const threadSummaries = recentThreads.map(t => {
      const daysAgo = Math.floor((Date.now() - t.lastMessageAt) / (1000 * 60 * 60 * 24));
      return `${daysAgo}d ago: ${t.summary}`;
    });
    parts.push(`## PAST CONVERSATIONS (reference naturally, don't list)\n${threadSummaries.join("\n")}`);
  }
  
  // Communication preferences
  const prefs = state.communicationPrefs;
  parts.push(`## COMMUNICATION STYLE\nTone: ${prefs.tonePreference} | They prefer check-ins in the ${prefs.preferredCheckInTime}`);
  
  return parts.join("\n\n");
}

/**
 * Get a short context summary for quick interactions (floating bubble responses).
 */
export async function getQuickContext(): Promise<string> {
  const state = await getCompanionState();
  const parts: string[] = [];
  
  if (state.preferredName) parts.push(`Name: ${state.preferredName}`);
  
  const trends = getWellbeingTrends(state);
  if (trends.avgMood < 5) parts.push("They seem down lately — be extra warm");
  if (trends.avgStress > 7) parts.push("High stress — keep it light and supportive");
  
  const dueThreads = state.activeThreads.filter(t => t.status === "active" && t.nextFollowUp <= Date.now());
  if (dueThreads.length > 0) parts.push(`Follow up on: ${dueThreads[0].title}`);
  
  const overdue = state.tasks.filter(t => t.status === "pending" && t.dueAt && t.dueAt < Date.now());
  if (overdue.length > 0) parts.push(`Remind about: ${overdue[0].task}`);
  
  return parts.join(" | ");
}

/**
 * Initialize companion state from onboarding data.
 */
export async function initFromOnboarding(data: {
  name?: string;
  interests?: string[];
  goals?: string[];
  schedule?: string;
}): Promise<void> {
  const state = await getCompanionState();
  
  if (data.name) state.preferredName = data.name;
  if (data.interests) state.lifeContext.interests = data.interests;
  if (data.goals) {
    for (const goal of data.goals) {
      state.lifeContext.lifeGoals.push({
        id: `goal_init_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`,
        description: goal,
        addedAt: Date.now(),
        lastMentioned: Date.now(),
        status: "active",
      });
    }
  }
  if (data.schedule) state.lifeContext.routineNotes.push(data.schedule);
  
  await saveState(state);
}

/**
 * Set the student's preferred name.
 */
export async function setPreferredName(name: string): Promise<void> {
  const state = await getCompanionState();
  state.preferredName = name;
  await saveState(state);
}

/**
 * Update communication preferences.
 */
export async function updateCommunicationPrefs(
  prefs: Partial<CompanionState["communicationPrefs"]>
): Promise<void> {
  const state = await getCompanionState();
  state.communicationPrefs = { ...state.communicationPrefs, ...prefs };
  await saveState(state);
}
