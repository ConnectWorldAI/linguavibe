/**
 * Comprehension Check System
 * 
 * After each lesson/activity, presents 2-3 quick verification questions.
 * If the user fails, re-teaches with a different approach.
 * Tracks comprehension rates to identify topics that need re-teaching.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export type QuestionType = "true_false" | "multiple_choice" | "fill_blank" | "reorder" | "match";

export type TeachingApproach = "visual" | "example_based" | "rule_based" | "contextual" | "comparison" | "story";

export interface ComprehensionQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  concept: string;          // What concept this tests
  difficulty: 1 | 2 | 3;
}

export interface LessonConcept {
  id: string;
  name: string;
  category: "grammar" | "vocabulary" | "pronunciation" | "culture" | "listening" | "reading";
  level: string;            // CEFR level
  prerequisites: string[];  // concept IDs that should be understood first
}

export interface ComprehensionResult {
  id: string;
  lessonId: string;
  conceptId: string;
  timestamp: string;
  questions: ComprehensionQuestion[];
  answers: Array<{ questionId: string; userAnswer: string; correct: boolean }>;
  score: number;            // 0-100
  passed: boolean;          // score >= 70
  approachUsed: TeachingApproach;
  retryCount: number;       // How many times user has been re-taught this
}

export interface ConceptMastery {
  conceptId: string;
  conceptName: string;
  category: string;
  attempts: number;
  bestScore: number;
  lastScore: number;
  averageScore: number;
  mastered: boolean;        // Passed at least twice with score >= 80
  approachesTried: TeachingApproach[];
  bestApproach: TeachingApproach | null;
  lastAttempt: string;
}

export interface ReTeachPlan {
  conceptId: string;
  conceptName: string;
  previousApproach: TeachingApproach;
  nextApproach: TeachingApproach;
  reason: string;
  microLesson: {
    title: string;
    content: string;
    examples: string[];
    practicePrompt: string;
  };
}

export interface ComprehensionStats {
  totalChecks: number;
  passRate: number;
  conceptsMastered: number;
  conceptsStruggling: number;
  averageScore: number;
  bestApproachOverall: TeachingApproach;
  recentTrend: "improving" | "stable" | "declining";
}

// ─── Storage Keys ───────────────────────────────────────────────────────────

const RESULTS_KEY = "@comprehension_results";
const MASTERY_KEY = "@concept_mastery";

// ─── Teaching Approaches ────────────────────────────────────────────────────

const APPROACH_ORDER: TeachingApproach[] = [
  "rule_based",
  "example_based",
  "visual",
  "contextual",
  "comparison",
  "story",
];

const APPROACH_DESCRIPTIONS: Record<TeachingApproach, string> = {
  rule_based: "Clear rules and formulas",
  example_based: "Learning through many examples",
  visual: "Diagrams, charts, and visual aids",
  contextual: "Real-world situations and dialogues",
  comparison: "Comparing with native language patterns",
  story: "Narrative and storytelling approach",
};

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Generate comprehension check questions for a lesson concept
 */
export function generateComprehensionCheck(
  concept: LessonConcept,
  content: { key_points: string[]; examples: string[] },
  count: number = 3
): ComprehensionQuestion[] {
  const questions: ComprehensionQuestion[] = [];
  
  // Generate diverse question types
  const types: QuestionType[] = ["true_false", "multiple_choice", "fill_blank"];
  
  for (let i = 0; i < count && i < content.key_points.length; i++) {
    const keyPoint = content.key_points[i];
    const type = types[i % types.length];
    
    questions.push({
      id: `cq_${concept.id}_${i}_${Date.now()}`,
      type,
      prompt: generatePromptForType(type, keyPoint, content.examples[i]),
      options: type === "multiple_choice" ? generateMCOptions(keyPoint) : undefined,
      correctAnswer: extractCorrectAnswer(type, keyPoint),
      explanation: `This tests your understanding of: ${keyPoint}`,
      concept: concept.name,
      difficulty: Math.min(3, Math.ceil((i + 1) / 1)) as 1 | 2 | 3,
    });
  }
  
  return questions;
}

/**
 * Record comprehension check results
 */
export async function recordComprehensionResult(
  result: Omit<ComprehensionResult, "id" | "timestamp">
): Promise<ComprehensionResult> {
  const fullResult: ComprehensionResult = {
    ...result,
    id: `cr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  
  // Save result
  const results = await getResults();
  results.push(fullResult);
  await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(results.slice(-200)));
  
  // Update concept mastery
  await updateConceptMastery(fullResult);
  
  return fullResult;
}

/**
 * Check if a concept needs re-teaching based on comprehension results
 */
export async function needsReTeaching(conceptId: string): Promise<boolean> {
  const mastery = await getConceptMastery(conceptId);
  if (!mastery) return false;
  return !mastery.mastered && mastery.lastScore < 70;
}

/**
 * Generate a re-teaching plan with a different approach
 */
export async function generateReTeachPlan(conceptId: string, conceptName: string): Promise<ReTeachPlan | null> {
  const mastery = await getConceptMastery(conceptId);
  if (!mastery) return null;
  
  // Find the next approach that hasn't been tried
  const triedApproaches = mastery.approachesTried;
  const nextApproach = APPROACH_ORDER.find(a => !triedApproaches.includes(a)) || "story";
  const previousApproach = triedApproaches[triedApproaches.length - 1] || "rule_based";
  
  return {
    conceptId,
    conceptName,
    previousApproach,
    nextApproach,
    reason: `The ${APPROACH_DESCRIPTIONS[previousApproach]} approach didn't work well (score: ${mastery.lastScore}%). Let's try ${APPROACH_DESCRIPTIONS[nextApproach]} instead.`,
    microLesson: generateMicroLesson(conceptName, nextApproach),
  };
}

/**
 * Get mastery status for a specific concept
 */
export async function getConceptMastery(conceptId: string): Promise<ConceptMastery | null> {
  const allMastery = await getAllConceptMastery();
  return allMastery.find(m => m.conceptId === conceptId) || null;
}

/**
 * Get all concept mastery records
 */
export async function getAllConceptMastery(): Promise<ConceptMastery[]> {
  const raw = await AsyncStorage.getItem(MASTERY_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Get concepts that are struggling (not mastered, low scores)
 */
export async function getStrugglingConcepts(): Promise<ConceptMastery[]> {
  const all = await getAllConceptMastery();
  return all
    .filter(m => !m.mastered && m.attempts >= 2 && m.averageScore < 70)
    .sort((a, b) => a.averageScore - b.averageScore);
}

/**
 * Get comprehensive comprehension statistics
 */
export async function getComprehensionStats(): Promise<ComprehensionStats> {
  const results = await getResults();
  const mastery = await getAllConceptMastery();
  
  if (results.length === 0) {
    return {
      totalChecks: 0,
      passRate: 0,
      conceptsMastered: 0,
      conceptsStruggling: 0,
      averageScore: 0,
      bestApproachOverall: "example_based",
      recentTrend: "stable",
    };
  }
  
  const passCount = results.filter(r => r.passed).length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  
  // Find best approach
  const approachScores: Record<TeachingApproach, number[]> = {
    visual: [], example_based: [], rule_based: [],
    contextual: [], comparison: [], story: [],
  };
  for (const r of results) {
    approachScores[r.approachUsed].push(r.score);
  }
  let bestApproach: TeachingApproach = "example_based";
  let bestAvg = 0;
  for (const [approach, scores] of Object.entries(approachScores)) {
    if (scores.length > 0) {
      const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestApproach = approach as TeachingApproach;
      }
    }
  }
  
  // Trend
  const recent = results.slice(-10);
  const older = results.slice(-20, -10);
  const recentAvg = recent.length > 0 ? recent.reduce((s, r) => s + r.score, 0) / recent.length : 0;
  const olderAvg = older.length > 0 ? older.reduce((s, r) => s + r.score, 0) / older.length : 0;
  let trend: "improving" | "stable" | "declining" = "stable";
  if (recentAvg - olderAvg > 5) trend = "improving";
  else if (olderAvg - recentAvg > 5) trend = "declining";
  
  return {
    totalChecks: results.length,
    passRate: Math.round((passCount / results.length) * 100),
    conceptsMastered: mastery.filter(m => m.mastered).length,
    conceptsStruggling: mastery.filter(m => !m.mastered && m.attempts >= 2).length,
    averageScore: Math.round(avgScore),
    bestApproachOverall: bestApproach,
    recentTrend: trend,
  };
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

async function getResults(): Promise<ComprehensionResult[]> {
  const raw = await AsyncStorage.getItem(RESULTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function updateConceptMastery(result: ComprehensionResult): Promise<void> {
  const allMastery = await getAllConceptMastery();
  const idx = allMastery.findIndex(m => m.conceptId === result.conceptId);
  
  if (idx >= 0) {
    const existing = allMastery[idx];
    existing.attempts++;
    existing.lastScore = result.score;
    existing.bestScore = Math.max(existing.bestScore, result.score);
    existing.averageScore = Math.round(
      (existing.averageScore * (existing.attempts - 1) + result.score) / existing.attempts
    );
    if (!existing.approachesTried.includes(result.approachUsed)) {
      existing.approachesTried.push(result.approachUsed);
    }
    if (result.score >= 80 && existing.bestScore >= 80 && existing.attempts >= 2) {
      existing.mastered = true;
    }
    if (result.score === existing.bestScore) {
      existing.bestApproach = result.approachUsed;
    }
    existing.lastAttempt = result.timestamp;
    allMastery[idx] = existing;
  } else {
    allMastery.push({
      conceptId: result.conceptId,
      conceptName: result.questions[0]?.concept || "Unknown",
      category: "grammar",
      attempts: 1,
      bestScore: result.score,
      lastScore: result.score,
      averageScore: result.score,
      mastered: false,
      approachesTried: [result.approachUsed],
      bestApproach: result.approachUsed,
      lastAttempt: result.timestamp,
    });
  }
  
  await AsyncStorage.setItem(MASTERY_KEY, JSON.stringify(allMastery));
}

function generatePromptForType(type: QuestionType, keyPoint: string, example?: string): string {
  switch (type) {
    case "true_false":
      return `True or False: ${keyPoint}`;
    case "multiple_choice":
      return `Which of the following is correct? (${keyPoint})`;
    case "fill_blank":
      return example ? `Complete: ${example.replace(/\b\w+\b/, "___")}` : `Fill in: ${keyPoint}`;
    default:
      return keyPoint;
  }
}

function generateMCOptions(keyPoint: string): string[] {
  return [keyPoint, `Not ${keyPoint}`, "Neither", "Both A and B"];
}

function extractCorrectAnswer(type: QuestionType, keyPoint: string): string {
  switch (type) {
    case "true_false":
      return "True";
    case "multiple_choice":
      return keyPoint;
    default:
      return keyPoint;
  }
}

function generateMicroLesson(conceptName: string, approach: TeachingApproach): ReTeachPlan["microLesson"] {
  const templates: Record<TeachingApproach, (name: string) => ReTeachPlan["microLesson"]> = {
    visual: (name) => ({
      title: `${name} — Visual Guide`,
      content: `Let's look at ${name} through diagrams and visual patterns.`,
      examples: [`Visual pattern for ${name}`, `Color-coded breakdown`],
      practicePrompt: `Look at the pattern and identify the correct form.`,
    }),
    example_based: (name) => ({
      title: `${name} — By Example`,
      content: `Here are many examples of ${name} in action. Notice the pattern.`,
      examples: [`Example 1 of ${name}`, `Example 2 of ${name}`, `Example 3 of ${name}`],
      practicePrompt: `Based on the examples above, apply the same pattern.`,
    }),
    rule_based: (name) => ({
      title: `${name} — The Rule`,
      content: `Here's the clear rule for ${name}. Memorize this formula.`,
      examples: [`Rule application 1`, `Rule application 2`],
      practicePrompt: `Apply the rule to this new sentence.`,
    }),
    contextual: (name) => ({
      title: `${name} — In Context`,
      content: `Imagine you're in a real conversation. Here's how ${name} works naturally.`,
      examples: [`Dialogue using ${name}`, `Real-world scenario`],
      practicePrompt: `How would you use this in a conversation at a café?`,
    }),
    comparison: (name) => ({
      title: `${name} — Compare & Contrast`,
      content: `Let's compare ${name} with how it works in English to spot the differences.`,
      examples: [`English vs target language`, `Common confusion points`],
      practicePrompt: `Translate this, paying attention to the difference from English.`,
    }),
    story: (name) => ({
      title: `${name} — A Story`,
      content: `Let me tell you a short story that demonstrates ${name} in a memorable way.`,
      examples: [`Story paragraph 1`, `Story paragraph 2`],
      practicePrompt: `Retell the story using the correct form.`,
    }),
  };
  
  return templates[approach](conceptName);
}
