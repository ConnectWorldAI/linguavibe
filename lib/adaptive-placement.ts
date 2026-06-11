/**
 * Adaptive Placement Engine
 *
 * Implements a Computer Adaptive Testing (CAT) approach for the placement test.
 * Uses Item Response Theory (IRT) principles to:
 *   1. Estimate ability in real-time as the user answers
 *   2. Select the next question at the optimal difficulty
 *   3. Converge on a CEFR level with fewer questions
 *   4. Route the user to a personalized learning path
 *
 * The engine maintains a running ability estimate (theta) and selects
 * questions that maximize information at the current estimate.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Constants ───────────────────────────────────────────────────────────────
const PLACEMENT_RESULT_KEY = "@placement_result";
const LEARNING_PATH_KEY = "@learning_path";
const CEFR_LEVEL_KEY = "@cefr_level";

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type SkillArea = "vocabulary" | "grammar" | "reading" | "listening" | "speaking";

export const CEFR_ORDER: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Map CEFR levels to IRT difficulty (theta) values
export const CEFR_THETA: Record<CEFRLevel, number> = {
  A1: -2.0,
  A2: -1.0,
  B1: 0.0,
  B2: 1.0,
  C1: 2.0,
  C2: 3.0,
};

// ─── IRT Functions ───────────────────────────────────────────────────────────

/**
 * 2-Parameter Logistic (2PL) IRT model
 * P(correct | theta, a, b) = 1 / (1 + exp(-a * (theta - b)))
 * where:
 *   theta = ability estimate
 *   a = discrimination (how well the item differentiates)
 *   b = difficulty (theta value at 50% probability)
 */
export function irtProbability(theta: number, difficulty: number, discrimination: number = 1.0): number {
  return 1 / (1 + Math.exp(-discrimination * (theta - difficulty)));
}

/**
 * Fisher information for a 2PL item at a given theta
 * I(theta) = a^2 * P * (1 - P)
 * Higher information = more useful for estimating ability at this level
 */
export function fisherInformation(theta: number, difficulty: number, discrimination: number = 1.0): number {
  const p = irtProbability(theta, difficulty, discrimination);
  return discrimination * discrimination * p * (1 - p);
}

/**
 * Maximum Likelihood Estimate (MLE) of theta given responses
 * Uses Newton-Raphson iteration
 */
export function estimateAbility(
  responses: { correct: boolean; difficulty: number; discrimination: number }[]
): number {
  if (responses.length === 0) return 0; // Prior: average ability

  let theta = 0; // Start at average
  const maxIter = 20;
  const tolerance = 0.01;

  for (let iter = 0; iter < maxIter; iter++) {
    let numerator = 0;
    let denominator = 0;

    for (const r of responses) {
      const p = irtProbability(theta, r.difficulty, r.discrimination);
      const observed = r.correct ? 1 : 0;
      numerator += r.discrimination * (observed - p);
      denominator += r.discrimination * r.discrimination * p * (1 - p);
    }

    if (denominator === 0) break;
    const delta = numerator / denominator;
    theta += delta;

    // Clamp to reasonable range
    theta = Math.max(-3, Math.min(4, theta));

    if (Math.abs(delta) < tolerance) break;
  }

  return theta;
}

/**
 * Convert theta to CEFR level
 */
export function thetaToCEFR(theta: number): CEFRLevel {
  if (theta < -1.5) return "A1";
  if (theta < -0.5) return "A2";
  if (theta < 0.5) return "B1";
  if (theta < 1.5) return "B2";
  if (theta < 2.5) return "C1";
  return "C2";
}

/**
 * Get confidence interval for the ability estimate
 * Returns the standard error of the estimate
 */
export function getStandardError(
  theta: number,
  responses: { difficulty: number; discrimination: number }[]
): number {
  let totalInfo = 0;
  for (const r of responses) {
    totalInfo += fisherInformation(theta, r.difficulty, r.discrimination);
  }
  return totalInfo > 0 ? 1 / Math.sqrt(totalInfo) : 10; // Large SE if no info
}

// ─── Adaptive Question Selection ─────────────────────────────────────────────

export interface AdaptiveQuestion {
  id: string;
  type: SkillArea;
  level: CEFRLevel;
  difficulty: number; // IRT difficulty (theta scale)
  discrimination: number; // IRT discrimination
  prompt: string;
  context?: string;
  options: string[];
  correctIndex: number;
}

/**
 * Select the next optimal question based on current ability estimate
 * Picks the question that maximizes Fisher information at current theta
 */
export function selectNextQuestion(
  theta: number,
  availableQuestions: AdaptiveQuestion[],
  answeredIds: Set<string>,
  skillBalance?: Record<SkillArea, number>
): AdaptiveQuestion | null {
  const unanswered = availableQuestions.filter((q) => !answeredIds.has(q.id));
  if (unanswered.length === 0) return null;

  // Score each question by information value
  const scored = unanswered.map((q) => {
    let score = fisherInformation(theta, q.difficulty, q.discrimination);

    // Bonus for underrepresented skill areas
    if (skillBalance) {
      const totalAnswered = Object.values(skillBalance).reduce((s, v) => s + v, 0);
      if (totalAnswered > 0) {
        const proportion = (skillBalance[q.type] || 0) / totalAnswered;
        const targetProportion = 1 / Object.keys(skillBalance).length;
        if (proportion < targetProportion) {
          score *= 1.3; // 30% bonus for underrepresented skills
        }
      }
    }

    return { question: q, score };
  });

  // Sort by score (highest first) and pick top
  scored.sort((a, b) => b.score - a.score);
  return scored[0].question;
}

// ─── Placement Result & Learning Path ────────────────────────────────────────

export interface PlacementResult {
  level: CEFRLevel;
  theta: number;
  standardError: number;
  confidence: number; // 0-100%
  totalQuestions: number;
  correctAnswers: number;
  skillBreakdown: Record<SkillArea, { correct: number; total: number; level: CEFRLevel }>;
  strengths: SkillArea[];
  weaknesses: SkillArea[];
  completedAt: string;
}

export interface LearningPath {
  level: CEFRLevel;
  focusAreas: SkillArea[];
  dailyGoalMinutes: number;
  weeklyLessons: number;
  recommendedContent: {
    type: "lesson" | "flashcards" | "conversation" | "reading" | "listening";
    title: string;
    priority: "high" | "medium" | "low";
  }[];
  milestones: {
    level: CEFRLevel;
    estimatedWeeks: number;
    description: string;
  }[];
}

/**
 * Generate a placement result from adaptive test responses
 */
export function generatePlacementResult(
  responses: { questionId: string; correct: boolean; question: AdaptiveQuestion }[]
): PlacementResult {
  const irtResponses = responses.map((r) => ({
    correct: r.correct,
    difficulty: r.question.difficulty,
    discrimination: r.question.discrimination,
  }));

  const theta = estimateAbility(irtResponses);
  const se = getStandardError(
    theta,
    responses.map((r) => ({ difficulty: r.question.difficulty, discrimination: r.question.discrimination }))
  );
  const level = thetaToCEFR(theta);

  // Skill breakdown
  const skillBreakdown: Record<string, { correct: number; total: number; responses: typeof irtResponses }> = {};
  for (const r of responses) {
    const skill = r.question.type;
    if (!skillBreakdown[skill]) {
      skillBreakdown[skill] = { correct: 0, total: 0, responses: [] };
    }
    skillBreakdown[skill].total++;
    if (r.correct) skillBreakdown[skill].correct++;
    skillBreakdown[skill].responses.push({
      correct: r.correct,
      difficulty: r.question.difficulty,
      discrimination: r.question.discrimination,
    });
  }

  const skillResult: Record<SkillArea, { correct: number; total: number; level: CEFRLevel }> = {
    vocabulary: { correct: 0, total: 0, level: "A1" },
    grammar: { correct: 0, total: 0, level: "A1" },
    reading: { correct: 0, total: 0, level: "A1" },
    listening: { correct: 0, total: 0, level: "A1" },
    speaking: { correct: 0, total: 0, level: "A1" },
  };

  const strengths: SkillArea[] = [];
  const weaknesses: SkillArea[] = [];

  for (const [skill, data] of Object.entries(skillBreakdown)) {
    const skillTheta = estimateAbility(data.responses);
    const skillLevel = thetaToCEFR(skillTheta);
    skillResult[skill as SkillArea] = {
      correct: data.correct,
      total: data.total,
      level: skillLevel,
    };

    const accuracy = data.total > 0 ? data.correct / data.total : 0;
    if (accuracy >= 0.7) strengths.push(skill as SkillArea);
    else if (accuracy < 0.5) weaknesses.push(skill as SkillArea);
  }

  const totalCorrect = responses.filter((r) => r.correct).length;
  const confidence = Math.round(Math.max(0, Math.min(100, (1 - se / 2) * 100)));

  return {
    level,
    theta: Math.round(theta * 100) / 100,
    standardError: Math.round(se * 100) / 100,
    confidence,
    totalQuestions: responses.length,
    correctAnswers: totalCorrect,
    skillBreakdown: skillResult,
    strengths,
    weaknesses,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Generate a personalized learning path based on placement result
 */
export function generateLearningPath(result: PlacementResult): LearningPath {
  const levelIdx = CEFR_ORDER.indexOf(result.level);

  // Focus on weaknesses first, then general improvement
  const focusAreas = result.weaknesses.length > 0
    ? result.weaknesses
    : ["vocabulary", "grammar"] as SkillArea[];

  // Daily goal scales with level
  const dailyGoalMinutes = [10, 15, 20, 25, 30, 30][levelIdx];
  const weeklyLessons = [3, 4, 5, 5, 6, 6][levelIdx];

  // Recommended content based on level and weaknesses
  const recommendedContent: LearningPath["recommendedContent"] = [];

  if (result.weaknesses.includes("vocabulary") || result.level === "A1") {
    recommendedContent.push({ type: "flashcards", title: `${result.level} Core Vocabulary`, priority: "high" });
  }
  if (result.weaknesses.includes("grammar")) {
    recommendedContent.push({ type: "lesson", title: `${result.level} Grammar Essentials`, priority: "high" });
  }
  if (result.weaknesses.includes("listening") || levelIdx >= 2) {
    recommendedContent.push({ type: "listening", title: "Podcast Comprehension", priority: levelIdx >= 2 ? "high" : "medium" });
  }
  if (result.weaknesses.includes("speaking") || levelIdx >= 1) {
    recommendedContent.push({ type: "conversation", title: "AI Conversation Practice", priority: levelIdx >= 1 ? "high" : "medium" });
  }
  recommendedContent.push({ type: "reading", title: `${result.level} Reading Passages`, priority: "medium" });

  // Milestones
  const milestones: LearningPath["milestones"] = [];
  for (let i = levelIdx + 1; i < CEFR_ORDER.length && i <= levelIdx + 3; i++) {
    const weeksPerLevel = [4, 8, 12, 16, 24, 32];
    milestones.push({
      level: CEFR_ORDER[i],
      estimatedWeeks: weeksPerLevel[i] - weeksPerLevel[levelIdx],
      description: `Reach ${CEFR_ORDER[i]} proficiency`,
    });
  }

  return {
    level: result.level,
    focusAreas,
    dailyGoalMinutes,
    weeklyLessons,
    recommendedContent,
    milestones,
  };
}

// ─── Persistence ─────────────────────────────────────────────────────────────

export async function savePlacementResult(result: PlacementResult): Promise<void> {
  await AsyncStorage.setItem(PLACEMENT_RESULT_KEY, JSON.stringify(result));
  await AsyncStorage.setItem(CEFR_LEVEL_KEY, result.level);
}

export async function getPlacementResult(): Promise<PlacementResult | null> {
  try {
    const raw = await AsyncStorage.getItem(PLACEMENT_RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveLearningPath(path: LearningPath): Promise<void> {
  await AsyncStorage.setItem(LEARNING_PATH_KEY, JSON.stringify(path));
}

export async function getLearningPath(): Promise<LearningPath | null> {
  try {
    const raw = await AsyncStorage.getItem(LEARNING_PATH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Check if the user should retake the placement test
 * Returns true if the test was taken more than 30 days ago
 */
export async function shouldRetakePlacement(): Promise<boolean> {
  const result = await getPlacementResult();
  if (!result) return true;
  const daysSince = (Date.now() - new Date(result.completedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > 30;
}
