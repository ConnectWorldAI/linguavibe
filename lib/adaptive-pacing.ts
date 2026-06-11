/**
 * Adaptive Difficulty Pacing Engine
 * 
 * Monitors response time, accuracy trends, and frustration signals
 * (rapid wrong answers, long pauses, repeated skips). Automatically
 * adjusts content difficulty without manual level changes.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PaceState = "flow" | "struggling" | "breezing" | "frustrated" | "warming_up";

export type DifficultyAction = "maintain" | "decrease" | "increase" | "micro_decrease" | "micro_increase";

export interface ResponseMetric {
  timestamp: string;
  responseTimeMs: number;
  correct: boolean;
  skipped: boolean;
  difficulty: number;         // 1-10 scale
  activity: string;           // flashcard, quiz, conversation, etc.
}

export interface FrustrationSignals {
  rapidWrongAnswers: number;  // 3+ wrong in a row
  longPauses: number;         // Response > 30s
  skipsInRow: number;         // Consecutive skips
  backtracking: number;       // Going back to review
  sessionAbandonments: number; // Left mid-session
  errorRate: number;          // 0-1, recent error rate
}

export interface PacingProfile {
  currentDifficulty: number;  // 1-10
  paceState: PaceState;
  confidenceScore: number;    // 0-100, how confident the user seems
  averageResponseTime: number; // ms
  accuracyTrend: number[];    // Last 20 accuracy values (0 or 1)
  frustrationLevel: number;   // 0-100
  optimalDifficulty: number;  // Calculated ideal difficulty
  lastAdjustment: string;     // ISO timestamp
  adjustmentHistory: Array<{
    timestamp: string;
    from: number;
    to: number;
    reason: string;
  }>;
}

export interface PacingRecommendation {
  action: DifficultyAction;
  newDifficulty: number;
  reason: string;
  confidence: number;         // 0-100 how sure we are
  suggestion: string;         // Human-readable suggestion for the UI
}

export interface SessionPacingStats {
  questionsAnswered: number;
  correctAnswers: number;
  averageResponseTime: number;
  difficultyRange: [number, number];
  paceChanges: number;
  frustrationPeaks: number;
  flowMinutes: number;        // Time spent in "flow" state
}

// ─── Storage Keys ───────────────────────────────────────────────────────────

const METRICS_KEY = "@pacing_response_metrics";
const PROFILE_KEY = "@pacing_profile";
const SESSION_KEY = "@pacing_current_session";

// ─── Constants ──────────────────────────────────────────────────────────────

const FRUSTRATION_THRESHOLD = 60;
const FLOW_ACCURACY_MIN = 0.65;
const FLOW_ACCURACY_MAX = 0.85;
const BREEZING_THRESHOLD = 0.90;
const STRUGGLING_THRESHOLD = 0.45;
const RAPID_WRONG_THRESHOLD = 3;
const LONG_PAUSE_MS = 30000;
const ADJUSTMENT_COOLDOWN_MS = 60000; // Don't adjust more than once per minute

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Record a response and get real-time pacing recommendation
 */
export async function recordResponse(metric: Omit<ResponseMetric, "timestamp">): Promise<PacingRecommendation> {
  const fullMetric: ResponseMetric = {
    ...metric,
    timestamp: new Date().toISOString(),
  };
  
  // Save metric
  const metrics = await getMetrics();
  metrics.push(fullMetric);
  await AsyncStorage.setItem(METRICS_KEY, JSON.stringify(metrics.slice(-200)));
  
  // Analyze and recommend
  const profile = await getOrCreateProfile();
  const recommendation = analyzeAndRecommend(profile, metrics.slice(-20), fullMetric);
  
  // Apply recommendation if significant
  if (recommendation.action !== "maintain") {
    profile.currentDifficulty = recommendation.newDifficulty;
    profile.lastAdjustment = new Date().toISOString();
    profile.adjustmentHistory.push({
      timestamp: new Date().toISOString(),
      from: metric.difficulty,
      to: recommendation.newDifficulty,
      reason: recommendation.reason,
    });
    // Keep last 50 adjustments
    profile.adjustmentHistory = profile.adjustmentHistory.slice(-50);
  }
  
  // Update profile state
  profile.paceState = determinePaceState(metrics.slice(-10));
  profile.confidenceScore = calculateConfidence(metrics.slice(-15));
  profile.frustrationLevel = calculateFrustration(metrics.slice(-10));
  profile.accuracyTrend = metrics.slice(-20).map(m => m.correct ? 1 : 0);
  profile.averageResponseTime = calculateAvgResponseTime(metrics.slice(-10));
  
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  
  return recommendation;
}

/**
 * Get current pacing profile
 */
export async function getPacingProfile(): Promise<PacingProfile> {
  return getOrCreateProfile();
}

/**
 * Get the recommended difficulty for the next question
 */
export async function getRecommendedDifficulty(): Promise<number> {
  const profile = await getOrCreateProfile();
  return profile.currentDifficulty;
}

/**
 * Get session pacing statistics
 */
export async function getSessionPacingStats(): Promise<SessionPacingStats> {
  const metrics = await getMetrics();
  const sessionStart = await AsyncStorage.getItem(SESSION_KEY);
  const startTime = sessionStart ? new Date(sessionStart).getTime() : Date.now() - 3600000;
  
  const sessionMetrics = metrics.filter(m => new Date(m.timestamp).getTime() >= startTime);
  
  if (sessionMetrics.length === 0) {
    return {
      questionsAnswered: 0,
      correctAnswers: 0,
      averageResponseTime: 0,
      difficultyRange: [5, 5],
      paceChanges: 0,
      frustrationPeaks: 0,
      flowMinutes: 0,
    };
  }
  
  const difficulties = sessionMetrics.map(m => m.difficulty);
  const profile = await getOrCreateProfile();
  
  return {
    questionsAnswered: sessionMetrics.length,
    correctAnswers: sessionMetrics.filter(m => m.correct).length,
    averageResponseTime: calculateAvgResponseTime(sessionMetrics),
    difficultyRange: [Math.min(...difficulties), Math.max(...difficulties)],
    paceChanges: profile.adjustmentHistory.filter(a => new Date(a.timestamp).getTime() >= startTime).length,
    frustrationPeaks: countFrustrationPeaks(sessionMetrics),
    flowMinutes: estimateFlowMinutes(sessionMetrics),
  };
}

/**
 * Start a new pacing session
 */
export async function startPacingSession(): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, new Date().toISOString());
}

/**
 * Reset difficulty to default (user-initiated)
 */
export async function resetDifficulty(level: number = 5): Promise<void> {
  const profile = await getOrCreateProfile();
  profile.currentDifficulty = level;
  profile.frustrationLevel = 0;
  profile.paceState = "warming_up";
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

/**
 * Get frustration signals for display
 */
export async function getFrustrationSignals(): Promise<FrustrationSignals> {
  const metrics = await getMetrics();
  const recent = metrics.slice(-15);
  
  let rapidWrong = 0;
  let maxRapidWrong = 0;
  let longPauses = 0;
  let skipsInRow = 0;
  let maxSkips = 0;
  
  for (const m of recent) {
    if (!m.correct && !m.skipped) {
      rapidWrong++;
      maxRapidWrong = Math.max(maxRapidWrong, rapidWrong);
    } else {
      rapidWrong = 0;
    }
    
    if (m.skipped) {
      skipsInRow++;
      maxSkips = Math.max(maxSkips, skipsInRow);
    } else {
      skipsInRow = 0;
    }
    
    if (m.responseTimeMs > LONG_PAUSE_MS) longPauses++;
  }
  
  const errorRate = recent.length > 0
    ? recent.filter(m => !m.correct).length / recent.length
    : 0;
  
  return {
    rapidWrongAnswers: maxRapidWrong,
    longPauses,
    skipsInRow: maxSkips,
    backtracking: 0,
    sessionAbandonments: 0,
    errorRate,
  };
}

// ─── Internal Analysis ──────────────────────────────────────────────────────

function analyzeAndRecommend(
  profile: PacingProfile,
  recentMetrics: ResponseMetric[],
  latest: ResponseMetric
): PacingRecommendation {
  // Check cooldown
  const timeSinceLastAdjust = Date.now() - new Date(profile.lastAdjustment).getTime();
  if (timeSinceLastAdjust < ADJUSTMENT_COOLDOWN_MS) {
    return {
      action: "maintain",
      newDifficulty: profile.currentDifficulty,
      reason: "Cooldown period — observing",
      confidence: 50,
      suggestion: "Keep going at this pace",
    };
  }
  
  const accuracy = recentMetrics.length > 0
    ? recentMetrics.filter(m => m.correct).length / recentMetrics.length
    : 0.5;
  
  const frustration = calculateFrustration(recentMetrics);
  const avgTime = calculateAvgResponseTime(recentMetrics);
  
  // FRUSTRATED: Rapid wrong answers or high frustration
  if (frustration > FRUSTRATION_THRESHOLD || countConsecutiveWrong(recentMetrics) >= RAPID_WRONG_THRESHOLD) {
    const newDiff = Math.max(1, profile.currentDifficulty - 2);
    return {
      action: "decrease",
      newDifficulty: newDiff,
      reason: `Frustration detected (${Math.round(frustration)}%). Easing difficulty.`,
      confidence: 85,
      suggestion: "Let's slow down and build confidence with easier material.",
    };
  }
  
  // STRUGGLING: Low accuracy
  if (accuracy < STRUGGLING_THRESHOLD && recentMetrics.length >= 5) {
    const newDiff = Math.max(1, profile.currentDifficulty - 1);
    return {
      action: "micro_decrease",
      newDifficulty: newDiff,
      reason: `Accuracy at ${Math.round(accuracy * 100)}% — slightly too hard.`,
      confidence: 75,
      suggestion: "Adjusting to slightly easier content to help you build momentum.",
    };
  }
  
  // BREEZING: Very high accuracy + fast responses
  if (accuracy > BREEZING_THRESHOLD && avgTime < 5000 && recentMetrics.length >= 5) {
    const newDiff = Math.min(10, profile.currentDifficulty + 1);
    return {
      action: "increase",
      newDifficulty: newDiff,
      reason: `You're acing this (${Math.round(accuracy * 100)}% accuracy, fast responses). Leveling up.`,
      confidence: 80,
      suggestion: "You're ready for a challenge! Increasing difficulty.",
    };
  }
  
  // MICRO INCREASE: Good accuracy, moderate speed
  if (accuracy > FLOW_ACCURACY_MAX && recentMetrics.length >= 8) {
    const newDiff = Math.min(10, profile.currentDifficulty + 0.5);
    return {
      action: "micro_increase",
      newDifficulty: Math.round(newDiff),
      reason: `Steady performance at ${Math.round(accuracy * 100)}%. Gentle increase.`,
      confidence: 60,
      suggestion: "Great work! Nudging difficulty up slightly.",
    };
  }
  
  // FLOW: Accuracy in the sweet spot
  return {
    action: "maintain",
    newDifficulty: profile.currentDifficulty,
    reason: `In the flow zone (${Math.round(accuracy * 100)}% accuracy). Perfect pace.`,
    confidence: 70,
    suggestion: "You're in the zone! Keep going.",
  };
}

function determinePaceState(metrics: ResponseMetric[]): PaceState {
  if (metrics.length < 3) return "warming_up";
  
  const accuracy = metrics.filter(m => m.correct).length / metrics.length;
  const frustration = calculateFrustration(metrics);
  
  if (frustration > FRUSTRATION_THRESHOLD) return "frustrated";
  if (accuracy < STRUGGLING_THRESHOLD) return "struggling";
  if (accuracy > BREEZING_THRESHOLD) return "breezing";
  if (accuracy >= FLOW_ACCURACY_MIN && accuracy <= FLOW_ACCURACY_MAX) return "flow";
  return "warming_up";
}

function calculateConfidence(metrics: ResponseMetric[]): number {
  if (metrics.length === 0) return 50;
  const accuracy = metrics.filter(m => m.correct).length / metrics.length;
  const consistency = 1 - calculateVariance(metrics.map(m => m.correct ? 1 : 0));
  return Math.round((accuracy * 0.7 + consistency * 0.3) * 100);
}

function calculateFrustration(metrics: ResponseMetric[]): number {
  if (metrics.length === 0) return 0;
  
  let score = 0;
  const consecutiveWrong = countConsecutiveWrong(metrics);
  const skips = metrics.filter(m => m.skipped).length;
  const longPauses = metrics.filter(m => m.responseTimeMs > LONG_PAUSE_MS).length;
  const errorRate = metrics.filter(m => !m.correct).length / metrics.length;
  
  score += consecutiveWrong * 15;
  score += skips * 10;
  score += longPauses * 8;
  score += errorRate * 30;
  
  return Math.min(100, score);
}

function calculateAvgResponseTime(metrics: ResponseMetric[]): number {
  if (metrics.length === 0) return 0;
  const total = metrics.reduce((sum, m) => sum + m.responseTimeMs, 0);
  return Math.round(total / metrics.length);
}

function countConsecutiveWrong(metrics: ResponseMetric[]): number {
  let count = 0;
  let maxCount = 0;
  for (let i = metrics.length - 1; i >= 0; i--) {
    if (!metrics[i].correct && !metrics[i].skipped) {
      count++;
      maxCount = Math.max(maxCount, count);
    } else {
      break; // Only count from the end
    }
  }
  return maxCount;
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  return variance;
}

function countFrustrationPeaks(metrics: ResponseMetric[]): number {
  let peaks = 0;
  for (let i = 5; i < metrics.length; i++) {
    const window = metrics.slice(i - 5, i);
    if (calculateFrustration(window) > FRUSTRATION_THRESHOLD) peaks++;
  }
  return peaks;
}

function estimateFlowMinutes(metrics: ResponseMetric[]): number {
  let flowMs = 0;
  for (let i = 5; i < metrics.length; i++) {
    const window = metrics.slice(i - 5, i);
    const state = determinePaceState(window);
    if (state === "flow") {
      flowMs += metrics[i].responseTimeMs;
    }
  }
  return Math.round(flowMs / 60000);
}

async function getMetrics(): Promise<ResponseMetric[]> {
  const raw = await AsyncStorage.getItem(METRICS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function getOrCreateProfile(): Promise<PacingProfile> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (raw) return JSON.parse(raw);
  
  const defaultProfile: PacingProfile = {
    currentDifficulty: 5,
    paceState: "warming_up",
    confidenceScore: 50,
    averageResponseTime: 0,
    accuracyTrend: [],
    frustrationLevel: 0,
    optimalDifficulty: 5,
    lastAdjustment: new Date(0).toISOString(),
    adjustmentHistory: [],
  };
  
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(defaultProfile));
  return defaultProfile;
}
