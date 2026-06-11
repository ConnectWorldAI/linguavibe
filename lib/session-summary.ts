/**
 * Session-End Summary & Next Steps
 * 
 * After each study session, generates a brief "teacher's note" —
 * what the student did well, what needs work, and exactly what
 * to practice tomorrow. Like a tutor writing notes after a lesson.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SessionActivity {
  type: string;               // e.g., "flashcard", "pronunciation", "conversation", "grammar_drill"
  domain: string;             // e.g., "vocabulary", "grammar", "pronunciation"
  skillId?: string;           // Optional link to knowledge gap map
  score: number;              // 0-100
  correct: number;
  total: number;
  timeSpentMs: number;
  details?: string;           // Additional context
}

export interface SessionSummary {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  activities: SessionActivity[];
  // Performance metrics
  overallScore: number;       // 0-100 weighted average
  totalCorrect: number;
  totalAttempts: number;
  accuracy: number;           // 0-100
  // Teacher's note
  strengths: string[];        // What went well
  weaknesses: string[];       // What needs work
  teacherNote: string;        // Personalized message from the AI teacher
  // Next steps
  nextSteps: NextStep[];
  tomorrowFocus: string;      // One-line summary of what to do tomorrow
  // Comparison
  comparedToAverage: "better" | "same" | "worse";
  improvementAreas: string[];
}

export interface NextStep {
  action: string;             // What to do
  reason: string;             // Why it helps
  priority: "high" | "medium" | "low";
  estimatedMinutes: number;
  screenRoute?: string;       // Deep link to the relevant screen
}

export interface ActiveSession {
  id: string;
  startTime: string;
  activities: SessionActivity[];
}

// ─── Storage Keys ───────────────────────────────────────────────────────────

const ACTIVE_SESSION_KEY = "@session_active";
const HISTORY_KEY = "@session_history";
const STREAK_KEY = "@session_streak";

// ─── Session Management ─────────────────────────────────────────────────────

/**
 * Start a new study session
 */
export async function startSession(): Promise<ActiveSession> {
  const session: ActiveSession = {
    id: `session_${Date.now()}`,
    startTime: new Date().toISOString(),
    activities: [],
  };
  await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  return session;
}

/**
 * Record an activity within the current session
 */
export async function recordActivity(activity: SessionActivity): Promise<void> {
  const raw = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
  if (!raw) {
    // Auto-start session if none exists
    const session = await startSession();
    session.activities.push(activity);
    await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    return;
  }
  
  const session: ActiveSession = JSON.parse(raw);
  session.activities.push(activity);
  await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
}

/**
 * End the current session and generate summary
 */
export async function endSession(): Promise<SessionSummary | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
  if (!raw) return null;
  
  const session: ActiveSession = JSON.parse(raw);
  if (session.activities.length === 0) {
    await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
    return null;
  }
  
  const summary = generateSummary(session);
  
  // Save to history
  const history = await getSessionHistory();
  history.push(summary);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-50)));
  
  // Update streak
  await updateSessionStreak();
  
  // Clear active session
  await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
  
  return summary;
}

/**
 * Get the current active session (if any)
 */
export async function getActiveSession(): Promise<ActiveSession | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Get session history
 */
export async function getSessionHistory(): Promise<SessionSummary[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Get the most recent session summary
 */
export async function getLastSessionSummary(): Promise<SessionSummary | null> {
  const history = await getSessionHistory();
  return history.length > 0 ? history[history.length - 1] : null;
}

/**
 * Get session streak (consecutive days with sessions)
 */
export async function getSessionStreak(): Promise<number> {
  const raw = await AsyncStorage.getItem(STREAK_KEY);
  if (!raw) return 0;
  const data = JSON.parse(raw);
  return data.streak || 0;
}

/**
 * Get weekly session stats
 */
export async function getWeeklyStats(): Promise<{
  sessionsThisWeek: number;
  totalMinutes: number;
  averageScore: number;
  bestDay: string;
  improvementTrend: "improving" | "stable" | "declining";
}> {
  const history = await getSessionHistory();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thisWeek = history.filter(s => s.startTime >= weekAgo);
  
  if (thisWeek.length === 0) {
    return {
      sessionsThisWeek: 0,
      totalMinutes: 0,
      averageScore: 0,
      bestDay: "None",
      improvementTrend: "stable",
    };
  }
  
  const totalMinutes = thisWeek.reduce((sum, s) => sum + s.durationMinutes, 0);
  const averageScore = Math.round(
    thisWeek.reduce((sum, s) => sum + s.overallScore, 0) / thisWeek.length
  );
  
  // Find best day
  const bestSession = thisWeek.reduce((best, s) => s.overallScore > best.overallScore ? s : best);
  const bestDay = new Date(bestSession.startTime).toLocaleDateString("en-US", { weekday: "long" });
  
  // Improvement trend
  const firstHalf = thisWeek.slice(0, Math.ceil(thisWeek.length / 2));
  const secondHalf = thisWeek.slice(Math.ceil(thisWeek.length / 2));
  const firstAvg = firstHalf.reduce((sum, s) => sum + s.overallScore, 0) / firstHalf.length;
  const secondAvg = secondHalf.length > 0
    ? secondHalf.reduce((sum, s) => sum + s.overallScore, 0) / secondHalf.length
    : firstAvg;
  
  let improvementTrend: "improving" | "stable" | "declining" = "stable";
  if (secondAvg - firstAvg > 5) improvementTrend = "improving";
  else if (firstAvg - secondAvg > 5) improvementTrend = "declining";
  
  return {
    sessionsThisWeek: thisWeek.length,
    totalMinutes,
    averageScore,
    bestDay,
    improvementTrend,
  };
}

// ─── Summary Generation ─────────────────────────────────────────────────────

function generateSummary(session: ActiveSession): SessionSummary {
  const endTime = new Date().toISOString();
  const startMs = new Date(session.startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const durationMinutes = Math.round((endMs - startMs) / 60000);
  
  const activities = session.activities;
  const totalCorrect = activities.reduce((sum, a) => sum + a.correct, 0);
  const totalAttempts = activities.reduce((sum, a) => sum + a.total, 0);
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  
  // Weighted overall score (weight by time spent)
  const totalTime = activities.reduce((sum, a) => sum + a.timeSpentMs, 0);
  const overallScore = totalTime > 0
    ? Math.round(activities.reduce((sum, a) => sum + a.score * (a.timeSpentMs / totalTime), 0))
    : Math.round(activities.reduce((sum, a) => sum + a.score, 0) / activities.length);
  
  // Identify strengths and weaknesses
  const { strengths, weaknesses } = identifyStrengthsWeaknesses(activities);
  
  // Generate teacher's note
  const teacherNote = generateTeacherNote(activities, overallScore, accuracy, durationMinutes);
  
  // Generate next steps
  const nextSteps = generateNextSteps(activities, weaknesses);
  
  // Tomorrow's focus
  const tomorrowFocus = generateTomorrowFocus(weaknesses, activities);
  
  return {
    id: session.id,
    startTime: session.startTime,
    endTime,
    durationMinutes,
    activities,
    overallScore,
    totalCorrect,
    totalAttempts,
    accuracy,
    strengths,
    weaknesses,
    teacherNote,
    nextSteps,
    tomorrowFocus,
    comparedToAverage: "same", // Will be updated with historical comparison
    improvementAreas: weaknesses.slice(0, 3),
  };
}

function identifyStrengthsWeaknesses(activities: SessionActivity[]): {
  strengths: string[];
  weaknesses: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // Group by domain
  const byDomain: Record<string, SessionActivity[]> = {};
  for (const a of activities) {
    if (!byDomain[a.domain]) byDomain[a.domain] = [];
    byDomain[a.domain].push(a);
  }
  
  for (const [domain, domainActivities] of Object.entries(byDomain)) {
    const avgScore = domainActivities.reduce((sum, a) => sum + a.score, 0) / domainActivities.length;
    const avgAccuracy = domainActivities.reduce((sum, a) => sum + (a.total > 0 ? a.correct / a.total : 0), 0) / domainActivities.length * 100;
    
    if (avgScore >= 80) {
      strengths.push(getStrengthMessage(domain, avgScore));
    } else if (avgScore < 60) {
      weaknesses.push(getWeaknessMessage(domain, avgScore));
    }
  }
  
  // Activity-specific strengths
  const perfectActivities = activities.filter(a => a.score >= 95);
  if (perfectActivities.length > 0) {
    strengths.push(`Perfect scores on ${perfectActivities.length} exercise${perfectActivities.length > 1 ? "s" : ""}`);
  }
  
  // Speed analysis
  const fastActivities = activities.filter(a => a.timeSpentMs < 5000 && a.score >= 80);
  if (fastActivities.length >= 3) {
    strengths.push("Quick and accurate responses — showing strong recall");
  }
  
  // Struggle detection
  const struggles = activities.filter(a => a.score < 40);
  if (struggles.length > 0) {
    const types = [...new Set(struggles.map(a => a.type))];
    weaknesses.push(`Struggled with ${types.join(", ")} — needs more practice`);
  }
  
  return {
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
  };
}

function getStrengthMessage(domain: string, score: number): string {
  const messages: Record<string, string[]> = {
    vocabulary: [
      "Strong vocabulary recall — words are sticking!",
      "Excellent word recognition and usage",
    ],
    grammar: [
      "Grammar rules are clicking — great structural understanding",
      "Solid grasp of sentence patterns",
    ],
    pronunciation: [
      "Clear pronunciation — your accent is improving",
      "Good phonetic awareness and articulation",
    ],
    comprehension: [
      "Strong listening/reading comprehension",
      "Understanding context and meaning well",
    ],
    writing: [
      "Writing skills are developing nicely",
      "Good sentence construction and expression",
    ],
  };
  
  const domainMessages = messages[domain] || [`Strong performance in ${domain} (${score}%)`];
  return domainMessages[Math.floor(Math.random() * domainMessages.length)];
}

function getWeaknessMessage(domain: string, score: number): string {
  const messages: Record<string, string[]> = {
    vocabulary: [
      "Some vocabulary gaps — review flashcards for these words",
      "A few words didn't stick — spaced repetition will help",
    ],
    grammar: [
      "Grammar patterns need more practice — try targeted drills",
      "Some structural errors — focus on the rules that tripped you up",
    ],
    pronunciation: [
      "Pronunciation needs attention — practice the sounds that were difficult",
      "Some sounds were unclear — slow down and focus on mouth position",
    ],
    comprehension: [
      "Comprehension was challenging — try easier content first, then build up",
      "Some passages were missed — re-read/re-listen at a slower pace",
    ],
    writing: [
      "Writing needs more practice — start with shorter sentences",
      "Some expression errors — review the grammar rules involved",
    ],
  };
  
  const domainMessages = messages[domain] || [`${domain} needs attention (${score}%)`];
  return domainMessages[Math.floor(Math.random() * domainMessages.length)];
}

function generateTeacherNote(
  activities: SessionActivity[],
  overallScore: number,
  accuracy: number,
  durationMinutes: number
): string {
  // Determine tone based on performance
  if (overallScore >= 85) {
    const notes = [
      `Excellent session! You spent ${durationMinutes} minutes and scored ${overallScore}% overall. Your accuracy of ${accuracy}% shows real progress. Keep this momentum going — you're building strong foundations.`,
      `Great work today! ${durationMinutes} minutes well spent with ${accuracy}% accuracy. You're clearly retaining what you've learned. Tomorrow, try pushing into slightly harder material.`,
      `Impressive focus! ${overallScore}% overall with ${accuracy}% accuracy in ${durationMinutes} minutes. You're ready to level up on the areas you aced today.`,
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  } else if (overallScore >= 65) {
    const notes = [
      `Solid session — ${durationMinutes} minutes with ${overallScore}% overall. You got ${accuracy}% right, which means the material is at the right difficulty level. Focus on the items you missed — they're your growth edge.`,
      `Good effort today! ${overallScore}% shows you're in the learning zone. The mistakes you made are actually valuable — they show exactly what to review tomorrow.`,
      `Nice work putting in ${durationMinutes} minutes. Your ${accuracy}% accuracy tells me the difficulty is well-matched. Review tonight's weak spots and you'll see improvement tomorrow.`,
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  } else {
    const notes = [
      `I noticed today was challenging — ${overallScore}% overall. That's okay! Struggling means you're pushing your boundaries. Let's slow down tomorrow and reinforce the basics before moving forward.`,
      `Today's material was tough (${overallScore}%), but showing up is what matters. Tomorrow, let's revisit the fundamentals and build confidence before tackling harder content.`,
      `${durationMinutes} minutes of effort counts, even when the scores are lower (${overallScore}%). The areas that were hardest today are exactly where growth happens. Let's approach them differently tomorrow.`,
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  }
}

function generateNextSteps(activities: SessionActivity[], weaknesses: string[]): NextStep[] {
  const steps: NextStep[] = [];
  
  // Find lowest-scoring domains
  const byDomain: Record<string, number[]> = {};
  for (const a of activities) {
    if (!byDomain[a.domain]) byDomain[a.domain] = [];
    byDomain[a.domain].push(a.score);
  }
  
  const domainAvgs = Object.entries(byDomain)
    .map(([domain, scores]) => ({
      domain,
      avg: scores.reduce((s, v) => s + v, 0) / scores.length,
    }))
    .sort((a, b) => a.avg - b.avg);
  
  // Targeted practice for weakest area
  if (domainAvgs.length > 0 && domainAvgs[0].avg < 70) {
    const weakest = domainAvgs[0];
    steps.push({
      action: `Practice ${weakest.domain} for 10 minutes`,
      reason: `Your ${weakest.domain} score was ${Math.round(weakest.avg)}% — focused practice will bring it up quickly`,
      priority: "high",
      estimatedMinutes: 10,
      screenRoute: getRouteForDomain(weakest.domain),
    });
  }
  
  // Review mistakes
  const wrongItems = activities.filter(a => a.score < 50);
  if (wrongItems.length > 0) {
    steps.push({
      action: "Review today's mistakes with flashcards",
      reason: `${wrongItems.length} items scored below 50% — reviewing them tonight will improve retention by 40%`,
      priority: "high",
      estimatedMinutes: 5,
      screenRoute: "/flashcard-srs",
    });
  }
  
  // Spaced repetition reminder
  steps.push({
    action: "Complete your spaced repetition cards tomorrow morning",
    reason: "Reviewing within 24 hours locks in today's learning",
    priority: "medium",
    estimatedMinutes: 8,
    screenRoute: "/flashcard-srs",
  });
  
  // Variety suggestion
  const usedTypes = [...new Set(activities.map(a => a.type))];
  if (!usedTypes.includes("pronunciation") && !usedTypes.includes("conversation")) {
    steps.push({
      action: "Add speaking practice to tomorrow's session",
      reason: "Balanced practice across all skills accelerates fluency",
      priority: "medium",
      estimatedMinutes: 10,
      screenRoute: "/voice-conversation",
    });
  }
  
  // Comprehension check
  if (!usedTypes.includes("reading") && !usedTypes.includes("listening")) {
    steps.push({
      action: "Try a comprehension exercise tomorrow",
      reason: "Input skills (reading/listening) reinforce output skills (speaking/writing)",
      priority: "low",
      estimatedMinutes: 10,
      screenRoute: "/conversation-sim",
    });
  }
  
  return steps.slice(0, 4);
}

function generateTomorrowFocus(weaknesses: string[], activities: SessionActivity[]): string {
  if (weaknesses.length === 0) {
    return "Keep the momentum! Try slightly harder material in your strongest area.";
  }
  
  const weakDomains = activities
    .filter(a => a.score < 60)
    .map(a => a.domain);
  
  const uniqueWeak = [...new Set(weakDomains)];
  if (uniqueWeak.length > 0) {
    return `Focus on ${uniqueWeak.slice(0, 2).join(" and ")} — review today's mistakes, then try fresh exercises.`;
  }
  
  return "Review today's challenging items, then push into new material.";
}

function getRouteForDomain(domain: string): string {
  const routes: Record<string, string> = {
    vocabulary: "/flashcard-srs",
    grammar: "/flashcard-srs",
    pronunciation: "/voice-conversation",
    comprehension: "/conversation-sim",
    writing: "/journal",
    culture: "/creator-feed",
  };
  return routes[domain] || "/flashcard-srs";
}

// ─── Streak Management ──────────────────────────────────────────────────────

async function updateSessionStreak(): Promise<void> {
  const raw = await AsyncStorage.getItem(STREAK_KEY);
  const data = raw ? JSON.parse(raw) : { streak: 0, lastSessionDate: null };
  
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  
  if (data.lastSessionDate === today) {
    // Already counted today
    return;
  } else if (data.lastSessionDate === yesterday) {
    // Consecutive day
    data.streak++;
  } else if (data.lastSessionDate !== today) {
    // Streak broken (or first session)
    data.streak = 1;
  }
  
  data.lastSessionDate = today;
  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
}
