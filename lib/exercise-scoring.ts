/**
 * Exercise Scoring / XP System
 *
 * Points per exercise:
 * - First try correct (no hint): 3 pts
 * - Correct with hint shown: 2 pts
 * - Correct after 2+ attempts (no reveal): 1 pt
 * - Revealed answer: 0 pts
 *
 * Tracks cumulative scores per creator and overall XP.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const SCORES_KEY = "@linguavibe_exercise_scores";

export interface ExerciseScore {
  creatorId: string;
  creatorName: string;
  exerciseIndex: number;
  points: number;
  maxPoints: number;
  timestamp: number;
}

export interface CreatorScoreSummary {
  creatorId: string;
  creatorName: string;
  totalPoints: number;
  maxPossiblePoints: number;
  sessionsCompleted: number;
  lastPlayed: number;
}

export interface OverallXP {
  totalXP: number;
  totalExercisesCompleted: number;
  totalSessionsCompleted: number;
  creatorScores: CreatorScoreSummary[];
}

/**
 * Calculate points for a single exercise based on how it was answered.
 */
export function calculateExercisePoints(params: {
  wasRevealed: boolean;
  hintUsed: boolean;
  attempts: number;
}): number {
  const { wasRevealed, hintUsed, attempts } = params;

  if (wasRevealed) return 0;
  if (attempts === 1 && !hintUsed) return 3;
  if (hintUsed) return 2;
  if (attempts >= 2) return 1;
  return 3; // Default first try
}

/**
 * Save a completed session's scores.
 */
export async function saveSessionScores(
  creatorId: string,
  creatorName: string,
  exerciseScores: Array<{ points: number; maxPoints: number }>
): Promise<number> {
  try {
    const existing = await getStoredScores();
    const timestamp = Date.now();

    const newScores: ExerciseScore[] = exerciseScores.map((s, i) => ({
      creatorId,
      creatorName,
      exerciseIndex: i,
      points: s.points,
      maxPoints: s.maxPoints,
      timestamp,
    }));

    const allScores = [...existing, ...newScores];
    await AsyncStorage.setItem(SCORES_KEY, JSON.stringify(allScores));

    // Return total points earned this session
    return exerciseScores.reduce((sum, s) => sum + s.points, 0);
  } catch {
    return 0;
  }
}

/**
 * Get all stored exercise scores.
 */
export async function getStoredScores(): Promise<ExerciseScore[]> {
  try {
    const raw = await AsyncStorage.getItem(SCORES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ExerciseScore[];
  } catch {
    return [];
  }
}

/**
 * Get overall XP summary.
 */
export async function getOverallXP(): Promise<OverallXP> {
  const scores = await getStoredScores();

  if (scores.length === 0) {
    return {
      totalXP: 0,
      totalExercisesCompleted: 0,
      totalSessionsCompleted: 0,
      creatorScores: [],
    };
  }

  const totalXP = scores.reduce((sum, s) => sum + s.points, 0);
  const totalExercisesCompleted = scores.length;

  // Group by creator
  const creatorMap = new Map<string, ExerciseScore[]>();
  for (const score of scores) {
    const existing = creatorMap.get(score.creatorId) || [];
    existing.push(score);
    creatorMap.set(score.creatorId, existing);
  }

  // Count unique sessions (by timestamp)
  const uniqueTimestamps = new Set(scores.map((s) => s.timestamp));
  const totalSessionsCompleted = uniqueTimestamps.size;

  const creatorScores: CreatorScoreSummary[] = [];
  for (const [creatorId, creatorExercises] of creatorMap) {
    const creatorTimestamps = new Set(creatorExercises.map((s) => s.timestamp));
    creatorScores.push({
      creatorId,
      creatorName: creatorExercises[0].creatorName,
      totalPoints: creatorExercises.reduce((sum, s) => sum + s.points, 0),
      maxPossiblePoints: creatorExercises.reduce((sum, s) => sum + s.maxPoints, 0),
      sessionsCompleted: creatorTimestamps.size,
      lastPlayed: Math.max(...creatorExercises.map((s) => s.timestamp)),
    });
  }

  // Sort by most recently played
  creatorScores.sort((a, b) => b.lastPlayed - a.lastPlayed);

  return {
    totalXP,
    totalExercisesCompleted,
    totalSessionsCompleted,
    creatorScores,
  };
}

/**
 * Get score summary for a specific creator.
 */
export async function getCreatorScore(creatorId: string): Promise<CreatorScoreSummary | null> {
  const overall = await getOverallXP();
  return overall.creatorScores.find((c) => c.creatorId === creatorId) || null;
}

/**
 * Clear all scores (for testing/reset).
 */
export async function clearAllScores(): Promise<void> {
  await AsyncStorage.removeItem(SCORES_KEY);
}
