/**
 * Learning Intelligence Engine
 * 
 * System-wide brain that monitors student performance across ALL exercise types,
 * detects struggles, and proactively generates personalized extra practice.
 * 
 * This is NOT just a teacher — the entire system (home screen, lessons, Wave Cloud,
 * teacher tab) is aware of where the student is struggling and offers help.
 * 
 * Architecture:
 * - Reads from exercise-analytics.ts (local) and server analytics
 * - Computes struggle scores per skill/topic/exercise-type
 * - Generates recommendations (what to practice, why, urgency)
 * - Surfaces recommendations across the app
 * - Auto-generates homework assignments when struggles are detected
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addVoiceMemo } from "@/lib/voice-memos";
import { sendVoiceMemoNotification } from "@/lib/notifications";
import { addCardsFromStruggles } from "@/lib/spaced-repetition";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StruggleArea {
  id: string;
  category: "grammar" | "vocabulary" | "pronunciation" | "listening" | "speaking" | "cultural" | "writing";
  topic: string;
  exerciseType: string;
  language: string;
  severity: "mild" | "moderate" | "severe"; // mild: <60%, moderate: <40%, severe: <25%
  accuracy: number; // 0-100
  attempts: number;
  lastAttemptAt: number;
  trend: "improving" | "stable" | "declining";
  detectedAt: number;
}

export interface PracticeRecommendation {
  id: string;
  type: "homework" | "quick_drill" | "review_lesson" | "pronunciation_check" | "conversation_practice";
  title: string;
  description: string;
  reason: string; // Why the system recommends this
  urgency: "low" | "medium" | "high" | "critical";
  estimatedMinutes: number;
  exerciseConfig: {
    exerciseType: string;
    topic: string;
    language: string;
    level: string;
    focusAreas: string[];
    phraseCount?: number;
  };
  createdAt: number;
  expiresAt: number; // Recommendations expire after 48h
  status: "pending" | "started" | "completed" | "dismissed";
  completedAt?: number;
  resultAccuracy?: number;
}

export interface HomeworkAssignment {
  id: string;
  title: string;
  description: string;
  assignedBy: "system" | "teacher" | "wave_cloud";
  reason: string;
  dueAt: number;
  exercises: HomeworkExercise[];
  status: "assigned" | "in_progress" | "completed" | "overdue";
  createdAt: number;
  completedAt?: number;
  overallAccuracy?: number;
  feedback?: string;
}

export interface HomeworkExercise {
  id: string;
  type: string;
  title: string;
  config: any;
  status: "pending" | "completed";
  accuracy?: number;
}

export interface IntelligenceInsight {
  type: "struggle_detected" | "improvement_noticed" | "homework_assigned" | "practice_suggested" | "milestone_reached";
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  actionParams?: Record<string, string>;
  priority: number; // 1-10, higher = more important
  createdAt: number;
  expiresAt: number;
  dismissed: boolean;
}

export interface StudentProfile {
  strongAreas: string[];
  weakAreas: StruggleArea[];
  preferredExerciseTypes: string[];
  averageSessionMinutes: number;
  totalExercisesCompleted: number;
  currentStreak: number;
  lastActiveAt: number;
  overallAccuracy: number;
  improvementRate: number; // % improvement over last 7 days
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY_STRUGGLES = "@intelligence_struggles";
const STORAGE_KEY_RECOMMENDATIONS = "@intelligence_recommendations";
const STORAGE_KEY_HOMEWORK = "@intelligence_homework";
const STORAGE_KEY_INSIGHTS = "@intelligence_insights";
const STORAGE_KEY_PROFILE = "@intelligence_profile";

const STRUGGLE_THRESHOLD_MILD = 60;
const STRUGGLE_THRESHOLD_MODERATE = 40;
const STRUGGLE_THRESHOLD_SEVERE = 25;
const MIN_ATTEMPTS_FOR_DETECTION = 3;
const RECOMMENDATION_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours
const HOMEWORK_DUE_HOURS = 24;
const MAX_ACTIVE_RECOMMENDATIONS = 5;
const MAX_ACTIVE_HOMEWORK = 3;

// ─── Core Intelligence Functions ─────────────────────────────────────────────

/**
 * Analyze recent exercise performance and detect struggles.
 * Called after every exercise completion.
 */
export async function analyzePerformance(
  exerciseType: string,
  topic: string,
  language: string,
  level: string,
  correct: number,
  total: number,
): Promise<{ struggles: StruggleArea[]; newRecommendations: PracticeRecommendation[] }> {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const struggles = await getStruggles();
  const existingStruggle = struggles.find(
    (s) => s.exerciseType === exerciseType && s.topic === topic && s.language === language
  );

  if (existingStruggle) {
    // Update existing struggle
    const prevAccuracy = existingStruggle.accuracy;
    existingStruggle.accuracy = Math.round((existingStruggle.accuracy * existingStruggle.attempts + accuracy) / (existingStruggle.attempts + 1));
    existingStruggle.attempts++;
    existingStruggle.lastAttemptAt = Date.now();
    existingStruggle.trend = accuracy > prevAccuracy + 5 ? "improving" : accuracy < prevAccuracy - 5 ? "declining" : "stable";
    existingStruggle.severity = getSeverity(existingStruggle.accuracy);

    // Remove from struggles if accuracy improved above threshold
    if (existingStruggle.accuracy >= STRUGGLE_THRESHOLD_MILD && existingStruggle.attempts >= MIN_ATTEMPTS_FOR_DETECTION) {
      const idx = struggles.indexOf(existingStruggle);
      struggles.splice(idx, 1);
    }
  } else if (accuracy < STRUGGLE_THRESHOLD_MILD && total >= 2) {
    // New struggle detected
    const category = inferCategory(exerciseType);
    struggles.push({
      id: `struggle_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      category,
      topic,
      exerciseType,
      language,
      severity: getSeverity(accuracy),
      accuracy,
      attempts: 1,
      lastAttemptAt: Date.now(),
      trend: "stable",
      detectedAt: Date.now(),
    });
  }

  await saveStruggles(struggles);

  // Generate recommendations for active struggles
  const newRecommendations = await generateRecommendations(struggles, language, level);

  // Update student profile
  await updateProfile(accuracy, exerciseType);

  // Check if a voice memo should be triggered for severe/declining struggles
  const severeStruggles = struggles.filter(
    (s) => s.severity === "severe" || (s.severity === "moderate" && s.trend === "declining")
  );
  if (severeStruggles.length >= 2) {
    // Fire-and-forget — don't block the return
    maybeTrigggerVoiceMemo(struggles, language).catch(() => {});
  }

  return { struggles, newRecommendations };
}

/**
 * Get all active practice recommendations for the student.
 * Used by home screen, lesson completion, and Wave Cloud.
 */
export async function getActiveRecommendations(): Promise<PracticeRecommendation[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_RECOMMENDATIONS);
    const all: PracticeRecommendation[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    // Filter out expired and completed
    return all.filter((r) => r.status === "pending" && r.expiresAt > now).slice(0, MAX_ACTIVE_RECOMMENDATIONS);
  } catch {
    return [];
  }
}

/**
 * Get all active homework assignments.
 */
export async function getActiveHomework(): Promise<HomeworkAssignment[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_HOMEWORK);
    const all: HomeworkAssignment[] = raw ? JSON.parse(raw) : [];
    return all.filter((h) => h.status === "assigned" || h.status === "in_progress").slice(0, MAX_ACTIVE_HOMEWORK);
  } catch {
    return [];
  }
}

/**
 * Get all homework (including completed) for history.
 */
export async function getAllHomework(): Promise<HomeworkAssignment[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_HOMEWORK);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get active insights/notifications for the student.
 */
export async function getActiveInsights(): Promise<IntelligenceInsight[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_INSIGHTS);
    const all: IntelligenceInsight[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    return all.filter((i) => !i.dismissed && i.expiresAt > now).sort((a, b) => b.priority - a.priority);
  } catch {
    return [];
  }
}

/**
 * Get the student's current profile/summary.
 */
export async function getStudentProfile(): Promise<StudentProfile> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    strongAreas: [],
    weakAreas: [],
    preferredExerciseTypes: [],
    averageSessionMinutes: 0,
    totalExercisesCompleted: 0,
    currentStreak: 0,
    lastActiveAt: 0,
    overallAccuracy: 0,
    improvementRate: 0,
  };
}

/**
 * Get current struggles.
 */
export async function getStruggles(): Promise<StruggleArea[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_STRUGGLES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Mark a recommendation as started.
 */
export async function startRecommendation(id: string): Promise<void> {
  const recs = await getAllRecommendations();
  const rec = recs.find((r) => r.id === id);
  if (rec) {
    rec.status = "started";
    await AsyncStorage.setItem(STORAGE_KEY_RECOMMENDATIONS, JSON.stringify(recs));
  }
}

/**
 * Mark a recommendation as completed with results.
 */
export async function completeRecommendation(id: string, accuracy: number): Promise<void> {
  const recs = await getAllRecommendations();
  const rec = recs.find((r) => r.id === id);
  if (rec) {
    rec.status = "completed";
    rec.completedAt = Date.now();
    rec.resultAccuracy = accuracy;
    await AsyncStorage.setItem(STORAGE_KEY_RECOMMENDATIONS, JSON.stringify(recs));
  }
}

/**
 * Dismiss a recommendation.
 */
export async function dismissRecommendation(id: string): Promise<void> {
  const recs = await getAllRecommendations();
  const rec = recs.find((r) => r.id === id);
  if (rec) {
    rec.status = "dismissed";
    await AsyncStorage.setItem(STORAGE_KEY_RECOMMENDATIONS, JSON.stringify(recs));
  }
}

/**
 * Mark a homework exercise as completed.
 */
export async function completeHomeworkExercise(homeworkId: string, exerciseId: string, accuracy: number): Promise<void> {
  const allHw = await getAllHomework();
  const hw = allHw.find((h) => h.id === homeworkId);
  if (!hw) return;

  const exercise = hw.exercises.find((e) => e.id === exerciseId);
  if (exercise) {
    exercise.status = "completed";
    exercise.accuracy = accuracy;
  }

  // Check if all exercises are done
  const allDone = hw.exercises.every((e) => e.status === "completed");
  if (allDone) {
    hw.status = "completed";
    hw.completedAt = Date.now();
    hw.overallAccuracy = Math.round(
      hw.exercises.reduce((sum, e) => sum + (e.accuracy || 0), 0) / hw.exercises.length
    );
    hw.feedback = generateHomeworkFeedback(hw.overallAccuracy);

    // Create insight for completion
    await addInsight({
      type: "milestone_reached",
      title: "Homework Complete! 🎉",
      message: `You finished "${hw.title}" with ${hw.overallAccuracy}% accuracy. ${hw.feedback}`,
      priority: 7,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      dismissed: false,
    });
  } else {
    hw.status = "in_progress";
  }

  await AsyncStorage.setItem(STORAGE_KEY_HOMEWORK, JSON.stringify(allHw));
}

/**
 * Dismiss an insight.
 */
export async function dismissInsight(index: number): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_INSIGHTS);
    const all: IntelligenceInsight[] = raw ? JSON.parse(raw) : [];
    const active = all.filter((i) => !i.dismissed && i.expiresAt > Date.now());
    if (active[index]) {
      active[index].dismissed = true;
    }
    await AsyncStorage.setItem(STORAGE_KEY_INSIGHTS, JSON.stringify(all));
  } catch {}
}

/**
 * Get a summary for Wave Cloud / AI Chat to use when talking to the student.
 * This gives the AI awareness of what the student is struggling with.
 */
export async function getWaveCloudContext(): Promise<string> {
  const struggles = await getStruggles();
  const profile = await getStudentProfile();
  const homework = await getActiveHomework();
  const recommendations = await getActiveRecommendations();

  if (struggles.length === 0 && homework.length === 0) {
    return "Student is performing well overall. No significant struggles detected. Encourage continued practice.";
  }

  let context = "STUDENT INTELLIGENCE SUMMARY:\n";
  
  if (struggles.length > 0) {
    context += "\n🔴 STRUGGLE AREAS:\n";
    for (const s of struggles.slice(0, 5)) {
      context += `- ${s.topic} (${s.category}): ${s.accuracy}% accuracy, ${s.severity} severity, trend: ${s.trend}\n`;
    }
  }

  if (homework.length > 0) {
    context += "\n📝 ACTIVE HOMEWORK:\n";
    for (const h of homework) {
      const done = h.exercises.filter((e) => e.status === "completed").length;
      context += `- "${h.title}" (${done}/${h.exercises.length} done, due: ${new Date(h.dueAt).toLocaleDateString()})\n`;
    }
  }

  if (recommendations.length > 0) {
    context += "\n💡 PENDING RECOMMENDATIONS:\n";
    for (const r of recommendations.slice(0, 3)) {
      context += `- ${r.title} (${r.urgency} urgency): ${r.reason}\n`;
    }
  }

  context += `\nOVERALL: ${profile.overallAccuracy}% accuracy, ${profile.totalExercisesCompleted} exercises completed, improvement rate: ${profile.improvementRate}%`;
  context += "\n\nUSE THIS CONTEXT to proactively offer help, suggest specific exercises, mention their struggles naturally, and encourage them. Be a smart system that KNOWS the student.";

  return context;
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function getAllRecommendations(): Promise<PracticeRecommendation[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_RECOMMENDATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveStruggles(struggles: StruggleArea[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_STRUGGLES, JSON.stringify(struggles));
}

async function addInsight(insight: IntelligenceInsight): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_INSIGHTS);
    const all: IntelligenceInsight[] = raw ? JSON.parse(raw) : [];
    all.push(insight);
    // Keep only last 50
    if (all.length > 50) all.splice(0, all.length - 50);
    await AsyncStorage.setItem(STORAGE_KEY_INSIGHTS, JSON.stringify(all));
  } catch {}
}

async function generateRecommendations(
  struggles: StruggleArea[],
  language: string,
  level: string,
): Promise<PracticeRecommendation[]> {
  const existing = await getActiveRecommendations();
  if (existing.length >= MAX_ACTIVE_RECOMMENDATIONS) return [];

  const newRecs: PracticeRecommendation[] = [];
  const severeStruggles = struggles.filter((s) => s.severity === "severe" || s.severity === "moderate");

  for (const struggle of severeStruggles.slice(0, 2)) {
    // Check if we already have a recommendation for this struggle
    const alreadyRecommended = existing.some(
      (r) => r.exerciseConfig.topic === struggle.topic && r.exerciseConfig.exerciseType === struggle.exerciseType
    );
    if (alreadyRecommended) continue;

    const rec = createRecommendationForStruggle(struggle, language, level);
    newRecs.push(rec);
  }

  if (newRecs.length > 0) {
    const allRecs = await getAllRecommendations();
    allRecs.push(...newRecs);
    await AsyncStorage.setItem(STORAGE_KEY_RECOMMENDATIONS, JSON.stringify(allRecs));

    // Also create insights
    for (const rec of newRecs) {
      await addInsight({
        type: "practice_suggested",
        title: `Extra Practice Available`,
        message: rec.reason,
        actionLabel: "Start Practice",
        actionRoute: "/smart-practice",
        actionParams: { recommendationId: rec.id },
        priority: rec.urgency === "critical" ? 9 : rec.urgency === "high" ? 7 : 5,
        createdAt: Date.now(),
        expiresAt: rec.expiresAt,
        dismissed: false,
      });
    }
  }

  // Auto-generate homework if severe struggles persist
  if (severeStruggles.length >= 2) {
    await maybeGenerateHomework(severeStruggles, language, level);
  }

  return newRecs;
}

function createRecommendationForStruggle(
  struggle: StruggleArea,
  language: string,
  level: string,
): PracticeRecommendation {
  const typeMap: Record<string, string> = {
    grammar: "grammar_comparison",
    vocabulary: "match_pairs",
    pronunciation: "rrt",
    listening: "netflix_dictation",
    speaking: "conversation_chain",
    cultural: "cultural_discovery",
    writing: "fill_order",
  };

  const bestExercise = typeMap[struggle.category] || struggle.exerciseType;
  const urgency = struggle.severity === "severe" ? "critical" : struggle.severity === "moderate" ? "high" : "medium";

  return {
    id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: struggle.severity === "severe" ? "homework" : "quick_drill",
    title: getRecommendationTitle(struggle),
    description: getRecommendationDescription(struggle),
    reason: `Your ${struggle.category} accuracy in "${struggle.topic}" is ${struggle.accuracy}% (${struggle.severity}). ${struggle.trend === "declining" ? "It's getting worse — let's fix this now." : "Extra practice will help solidify this."}`,
    urgency: urgency as any,
    estimatedMinutes: struggle.severity === "severe" ? 15 : 8,
    exerciseConfig: {
      exerciseType: bestExercise,
      topic: struggle.topic,
      language,
      level,
      focusAreas: [struggle.category, struggle.topic],
      phraseCount: struggle.severity === "severe" ? 8 : 5,
    },
    createdAt: Date.now(),
    expiresAt: Date.now() + RECOMMENDATION_EXPIRY_MS,
    status: "pending",
  };
}

async function maybeGenerateHomework(
  struggles: StruggleArea[],
  language: string,
  level: string,
): Promise<void> {
  const existingHw = await getActiveHomework();
  if (existingHw.length >= MAX_ACTIVE_HOMEWORK) return;

  // Only generate homework if struggles have persisted (3+ attempts)
  const persistentStruggles = struggles.filter((s) => s.attempts >= MIN_ATTEMPTS_FOR_DETECTION);
  if (persistentStruggles.length === 0) return;

  // Check if we already have homework for these topics
  const existingTopics = new Set(existingHw.flatMap((h) => h.exercises.map((e) => e.title)));
  const newStruggles = persistentStruggles.filter((s) => !existingTopics.has(s.topic));
  if (newStruggles.length === 0) return;

  const homework: HomeworkAssignment = {
    id: `hw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: `Practice: ${newStruggles.slice(0, 2).map((s) => s.topic).join(" & ")}`,
    description: `The system noticed you're struggling with ${newStruggles.map((s) => s.topic).join(", ")}. Here's targeted practice to help you improve.`,
    assignedBy: "system",
    reason: `Detected ${newStruggles.length} persistent struggle area(s) with declining or stable accuracy below ${STRUGGLE_THRESHOLD_MILD}%.`,
    dueAt: Date.now() + HOMEWORK_DUE_HOURS * 60 * 60 * 1000,
    exercises: newStruggles.slice(0, 4).map((s, i) => ({
      id: `hw_ex_${Date.now()}_${i}`,
      type: s.exerciseType,
      title: s.topic,
      config: {
        exerciseType: s.exerciseType,
        topic: s.topic,
        language,
        level,
        focusAreas: [s.category],
        phraseCount: 5,
      },
      status: "pending" as const,
    })),
    status: "assigned",
    createdAt: Date.now(),
  };

  const allHw = await getAllHomework();
  allHw.push(homework);
  await AsyncStorage.setItem(STORAGE_KEY_HOMEWORK, JSON.stringify(allHw));

  // Create insight for homework assignment
  await addInsight({
    type: "homework_assigned",
    title: "New Homework Assigned 📚",
    message: `The system generated practice for you: "${homework.title}". Complete it within 24 hours for best results.`,
    actionLabel: "View Homework",
    actionRoute: "/smart-practice",
    actionParams: { homeworkId: homework.id },
    priority: 8,
    createdAt: Date.now(),
    expiresAt: homework.dueAt,
    dismissed: false,
  });
}

function getSeverity(accuracy: number): "mild" | "moderate" | "severe" {
  if (accuracy < STRUGGLE_THRESHOLD_SEVERE) return "severe";
  if (accuracy < STRUGGLE_THRESHOLD_MODERATE) return "moderate";
  return "mild";
}

function inferCategory(exerciseType: string): StruggleArea["category"] {
  const map: Record<string, StruggleArea["category"]> = {
    grammar_comparison: "grammar",
    fill_order: "grammar",
    match_pairs: "vocabulary",
    story_choice: "vocabulary",
    rrt: "pronunciation",
    netflix_dictation: "listening",
    conversation_chain: "speaking",
    cultural_discovery: "cultural",
    whiteboard: "writing",
  };
  return map[exerciseType] || "vocabulary";
}

function getRecommendationTitle(struggle: StruggleArea): string {
  const titles: Record<string, string> = {
    grammar: `Grammar Drill: ${struggle.topic}`,
    vocabulary: `Vocabulary Review: ${struggle.topic}`,
    pronunciation: `Pronunciation Practice: ${struggle.topic}`,
    listening: `Listening Exercise: ${struggle.topic}`,
    speaking: `Speaking Practice: ${struggle.topic}`,
    cultural: `Cultural Review: ${struggle.topic}`,
    writing: `Writing Practice: ${struggle.topic}`,
  };
  return titles[struggle.category] || `Practice: ${struggle.topic}`;
}

function getRecommendationDescription(struggle: StruggleArea): string {
  if (struggle.severity === "severe") {
    return `You're scoring ${struggle.accuracy}% on this topic. Let's do focused practice to build your confidence.`;
  }
  if (struggle.trend === "declining") {
    return `Your accuracy is dropping in this area. A quick review session will help reinforce what you've learned.`;
  }
  return `A few more practice rounds will help solidify your understanding of this topic.`;
}

function generateHomeworkFeedback(accuracy: number): string {
  if (accuracy >= 90) return "Outstanding work! You've clearly mastered this material.";
  if (accuracy >= 75) return "Great job! You're making solid progress.";
  if (accuracy >= 60) return "Good effort! Keep practicing and you'll get there.";
  return "Don't worry — learning takes time. The system will adjust and give you more practice.";
}

async function updateProfile(latestAccuracy: number, exerciseType: string): Promise<void> {
  try {
    const profile = await getStudentProfile();
    const prevTotal = profile.totalExercisesCompleted;
    profile.totalExercisesCompleted++;
    profile.lastActiveAt = Date.now();
    
    // Rolling average accuracy
    profile.overallAccuracy = Math.round(
      (profile.overallAccuracy * prevTotal + latestAccuracy) / profile.totalExercisesCompleted
    );

    // Track preferred exercise types
    if (!profile.preferredExerciseTypes.includes(exerciseType)) {
      profile.preferredExerciseTypes.push(exerciseType);
      if (profile.preferredExerciseTypes.length > 5) {
        profile.preferredExerciseTypes.shift();
      }
    }

    // Update weak/strong areas from struggles
    const struggles = await getStruggles();
    profile.weakAreas = struggles;
    profile.strongAreas = profile.preferredExerciseTypes.filter(
      (t) => !struggles.some((s) => s.exerciseType === t)
    );

    await AsyncStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  } catch {}
}

// ─── Voice Memo Integration ─────────────────────────────────────────────────

const VOICE_MEMO_COOLDOWN_KEY = "linguavibe_voice_memo_cooldown";
const VOICE_MEMO_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours between memos

/**
 * Check if a voice memo should be triggered based on struggle patterns.
 * Called after analyzePerformance detects severe struggles.
 * 
 * Triggers when:
 * - Student has 2+ severe struggles
 * - Student's accuracy is declining
 * - Cooldown period has passed (no spam)
 */
export async function maybeTrigggerVoiceMemo(
  struggles: StruggleArea[],
  language: string,
  studentName: string = "Student",
): Promise<void> {
  // Check cooldown
  try {
    const lastSent = await AsyncStorage.getItem(VOICE_MEMO_COOLDOWN_KEY);
    if (lastSent && Date.now() - parseInt(lastSent) < VOICE_MEMO_COOLDOWN_MS) {
      return; // Too soon
    }
  } catch {}

  const severeStruggles = struggles.filter(
    (s) => s.severity === "severe" || (s.severity === "moderate" && s.trend === "declining")
  );

  if (severeStruggles.length === 0) return;

  // Pick the most critical struggle for the memo
  const topStruggle = severeStruggles.sort((a, b) => a.accuracy - b.accuracy)[0];

  // Determine memo type
  const memoType = topStruggle.trend === "declining" ? "encouragement" 
    : topStruggle.trend === "improving" ? "milestone"
    : "tip";

  // Create a local voice memo (transcript only — audio generated on demand)
  const transcript = generateLocalMemoTranscript(studentName, topStruggle, memoType, language);
  
  const memo = await addVoiceMemo({
    id: `memo_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    teacherName: getTeacherNameForLanguage(language),
    teacherPersona: getTeacherPersonaForLanguage(language),
    memoType: memoType as any,
    transcript,
    targetLanguagePhrase: generateTargetPhrase(topStruggle, language),
    tip: generateQuickTip(topStruggle),
    audioUrl: null, // Will be generated via server when user opens the memo
    struggleArea: topStruggle.topic,
    createdAt: new Date().toISOString(),
  });

  // Send push notification
  await sendVoiceMemoNotification({
    teacherName: memo.teacherName,
    memoType,
    struggleArea: topStruggle.topic,
    memoId: memo.id,
  });

  // Also add SRS cards for the struggle areas
  await addCardsFromStruggles(
    severeStruggles.slice(0, 3).map((s) => ({
      exerciseType: s.exerciseType,
      topic: s.topic,
      subtopic: s.category,
      language,
      difficulty: s.accuracy < 30 ? "beginner" as const : s.accuracy < 60 ? "intermediate" as const : "advanced" as const,
      reason: `Detected ${s.severity} struggle (${s.accuracy}% accuracy, trend: ${s.trend})`,
    }))
  );

  // Update cooldown
  await AsyncStorage.setItem(VOICE_MEMO_COOLDOWN_KEY, Date.now().toString());
}

function getTeacherNameForLanguage(language: string): string {
  const map: Record<string, string> = {
    Spanish: "Sofia", French: "Marie", Portuguese: "Ana",
    German: "Hans", Japanese: "Yuki", Italian: "Marco",
    Korean: "Jiwoo", Mandarin: "Li Wei",
  };
  return map[language] || "Teacher";
}

function getTeacherPersonaForLanguage(language: string): string {
  const map: Record<string, string> = {
    Spanish: "sofia", French: "marie", Portuguese: "ana",
    German: "hans", Japanese: "yuki",
  };
  return map[language] || "default";
}

function generateLocalMemoTranscript(
  studentName: string,
  struggle: StruggleArea,
  memoType: string,
  language: string,
): string {
  if (memoType === "encouragement") {
    return `Hey ${studentName}! I noticed you've been working really hard on ${struggle.topic}. I know it can feel tough when you're at ${struggle.accuracy}% accuracy, but that's completely normal at this stage. Every ${language} learner goes through this. Here's the thing — the fact that you keep trying means you're already on the right path. Let's do a quick targeted exercise together, and I promise it'll start clicking.`;
  }
  if (memoType === "milestone") {
    return `${studentName}! I have to tell you — I'm seeing real improvement in your ${struggle.topic} work! Your trend is going up, and that's exactly what I want to see. Keep this momentum going. You're building real ${language} muscle memory here.`;
  }
  // tip
  return `Quick tip for you, ${studentName}! For ${struggle.topic}, try this: instead of memorizing rules, practice with real examples. I've set up a short exercise that focuses specifically on the patterns you're missing. It's only 3 minutes — give it a try and you'll see the difference.`;
}

function generateTargetPhrase(struggle: StruggleArea, language: string): string | null {
  // Generate a contextual phrase based on the struggle area
  const phrases: Record<string, Record<string, string>> = {
    Spanish: {
      grammar: "¡Poco a poco se va lejos! (Little by little, you go far!)",
      vocabulary: "Cada palabra nueva es un paso adelante (Every new word is a step forward)",
      pronunciation: "La práctica hace al maestro (Practice makes the master)",
      listening: "Escucha con el corazón (Listen with your heart)",
    },
    Portuguese: {
      grammar: "Devagar se vai ao longe! (Slowly you go far!)",
      vocabulary: "Cada palavra conta (Every word counts)",
      pronunciation: "A prática leva à perfeição (Practice leads to perfection)",
      listening: "Ouvir é aprender (To listen is to learn)",
    },
    French: {
      grammar: "Petit à petit, l'oiseau fait son nid (Little by little, the bird builds its nest)",
      vocabulary: "Chaque mot est une victoire (Every word is a victory)",
      pronunciation: "C'est en forgeant qu'on devient forgeron (Practice makes perfect)",
      listening: "Écouter, c'est comprendre (To listen is to understand)",
    },
  };
  return phrases[language]?.[struggle.category] || null;
}

function generateQuickTip(struggle: StruggleArea): string {
  const tips: Record<string, string> = {
    grammar: "Focus on one grammar pattern at a time. Use it in 5 different sentences today.",
    vocabulary: "Create mental images for new words. Visual connections stick better than repetition.",
    pronunciation: "Record yourself and compare with native audio. Your ear trains faster than your mouth.",
    listening: "Listen to the same clip 3 times: first for gist, then for details, then for exact words.",
    speaking: "Talk to yourself in the target language for 2 minutes. No one's judging!",
    writing: "Write 3 sentences using today's struggle word. Keep them simple and natural.",
    cultural: "Watch a 2-minute clip from that culture. Context makes language stick.",
  };
  return tips[struggle.category] || "Practice for just 5 minutes today. Consistency beats intensity.";
}
