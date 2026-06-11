/**
 * Tests for:
 * 1. Swipe-to-unpin gesture in Manage Pins
 * 2. Scoring/XP system for Try Exercise
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── Swipe-to-Unpin Tests ───────────────────────────────────────────────────────
describe("Swipe-to-Unpin in Manage Pins", () => {
  const managePinsPath = path.resolve(__dirname, "../app/manage-pins.tsx");
  const managePinsCode = fs.readFileSync(managePinsPath, "utf-8");

  it("should have a SwipeableRow component", () => {
    expect(managePinsCode).toContain("function SwipeableRow");
  });

  it("should accept onSwipeUnpin callback prop", () => {
    expect(managePinsCode).toContain("onSwipeUnpin");
  });

  it("should have swipe threshold constant", () => {
    expect(managePinsCode).toContain("SWIPE_THRESHOLD");
  });

  it("should render red background with Unpin text on swipe", () => {
    expect(managePinsCode).toContain("swipeBackground");
    expect(managePinsCode).toContain("Unpin");
  });

  it("should use Animated.Value for translateX", () => {
    expect(managePinsCode).toContain("translateX");
    expect(managePinsCode).toContain("new Animated.Value(0)");
  });

  it("should only allow left swipe (negative direction)", () => {
    expect(managePinsCode).toContain("diff < -10");
  });

  it("should snap back if swipe is below threshold", () => {
    expect(managePinsCode).toContain("Animated.spring(translateX");
  });

  it("should animate off-screen on full swipe", () => {
    expect(managePinsCode).toContain("-SCREEN_WIDTH");
  });

  it("should trigger haptic feedback on successful swipe", () => {
    expect(managePinsCode).toContain("Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)");
  });

  it("should call unpinFeature on swipe unpin", () => {
    expect(managePinsCode).toContain("handleSwipeUnpin");
    expect(managePinsCode).toContain("await unpinFeature(id)");
  });

  it("should disable swipe during selection mode", () => {
    expect(managePinsCode).toContain("enabled={!isSelecting && draggingIndex === null}");
  });

  it("should wrap rows in SwipeableRow when not selecting", () => {
    expect(managePinsCode).toContain("<SwipeableRow");
  });

  it("should show updated hint text mentioning swipe", () => {
    expect(managePinsCode).toContain("Swipe left to unpin");
  });

  it("should have swipeContainer style with overflow hidden", () => {
    expect(managePinsCode).toContain("swipeContainer");
    expect(managePinsCode).toContain("overflow: \"hidden\"");
  });

  it("should use responder events for swipe gesture", () => {
    expect(managePinsCode).toContain("onStartShouldSetResponder");
    expect(managePinsCode).toContain("onResponderGrant");
    expect(managePinsCode).toContain("onResponderMove");
    expect(managePinsCode).toContain("onResponderRelease");
  });

  it("should still have drag-to-reorder functionality", () => {
    expect(managePinsCode).toContain("handleDragStart");
    expect(managePinsCode).toContain("handleDragMove");
    expect(managePinsCode).toContain("handleDragEnd");
    expect(managePinsCode).toContain("reorder-three");
  });

  it("should have trash icon in swipe background", () => {
    expect(managePinsCode).toContain("trash-outline");
  });
});

// ─── Exercise Scoring Module Tests ──────────────────────────────────────────────
describe("Exercise Scoring Module (lib/exercise-scoring.ts)", () => {
  const scoringPath = path.resolve(__dirname, "../lib/exercise-scoring.ts");
  const scoringCode = fs.readFileSync(scoringPath, "utf-8");

  it("should export calculateExercisePoints function", () => {
    expect(scoringCode).toContain("export function calculateExercisePoints");
  });

  it("should export saveSessionScores function", () => {
    expect(scoringCode).toContain("export async function saveSessionScores");
  });

  it("should export getOverallXP function", () => {
    expect(scoringCode).toContain("export async function getOverallXP");
  });

  it("should export getCreatorScore function", () => {
    expect(scoringCode).toContain("export async function getCreatorScore");
  });

  it("should export clearAllScores function", () => {
    expect(scoringCode).toContain("export async function clearAllScores");
  });

  it("should define ExerciseScore interface", () => {
    expect(scoringCode).toContain("export interface ExerciseScore");
    expect(scoringCode).toContain("creatorId: string");
    expect(scoringCode).toContain("points: number");
  });

  it("should define CreatorScoreSummary interface", () => {
    expect(scoringCode).toContain("export interface CreatorScoreSummary");
    expect(scoringCode).toContain("totalPoints: number");
    expect(scoringCode).toContain("sessionsCompleted: number");
  });

  it("should define OverallXP interface", () => {
    expect(scoringCode).toContain("export interface OverallXP");
    expect(scoringCode).toContain("totalXP: number");
    expect(scoringCode).toContain("totalExercisesCompleted: number");
  });

  it("should use AsyncStorage for persistence", () => {
    expect(scoringCode).toContain("AsyncStorage");
    expect(scoringCode).toContain("@linguavibe_exercise_scores");
  });

  it("should award 3 points for first try correct without hint", () => {
    expect(scoringCode).toContain("if (attempts === 1 && !hintUsed) return 3");
  });

  it("should award 2 points when hint was used", () => {
    expect(scoringCode).toContain("if (hintUsed) return 2");
  });

  it("should award 0 points when answer was revealed", () => {
    expect(scoringCode).toContain("if (wasRevealed) return 0");
  });

  it("should award 1 point for 2+ attempts without hint", () => {
    expect(scoringCode).toContain("if (attempts >= 2) return 1");
  });

  it("should track scores per creator", () => {
    expect(scoringCode).toContain("creatorMap");
    expect(scoringCode).toContain("creatorScores");
  });

  it("should count unique sessions by timestamp", () => {
    expect(scoringCode).toContain("uniqueTimestamps");
    expect(scoringCode).toContain("totalSessionsCompleted");
  });
});

// ─── Creator Exercise Screen Scoring Integration Tests ──────────────────────────
describe("Scoring Integration in Creator Exercise Screen", () => {
  const exercisePath = path.resolve(__dirname, "../app/creator-exercise.tsx");
  const exerciseCode = fs.readFileSync(exercisePath, "utf-8");

  it("should import scoring functions", () => {
    expect(exerciseCode).toContain("import { calculateExercisePoints, saveSessionScores }");
  });

  it("should track hintUsed in ExerciseProgress", () => {
    expect(exerciseCode).toContain("hintUsed: boolean");
  });

  it("should track wasRevealed in ExerciseProgress", () => {
    expect(exerciseCode).toContain("wasRevealed: boolean");
  });

  it("should set hintUsed to true when hint is shown", () => {
    expect(exerciseCode).toContain("hintUsed: true");
  });

  it("should set wasRevealed to true when answer is revealed", () => {
    expect(exerciseCode).toContain("wasRevealed: true");
  });

  it("should calculate scores on finish", () => {
    expect(exerciseCode).toContain("calculateExercisePoints({");
    expect(exerciseCode).toContain("wasRevealed: p.wasRevealed");
    expect(exerciseCode).toContain("hintUsed: p.hintUsed");
    expect(exerciseCode).toContain("attempts: p.attempts");
  });

  it("should save session scores with creator info", () => {
    expect(exerciseCode).toContain("saveSessionScores(creator.id, creator.name, exerciseScores)");
  });

  it("should track sessionXP state", () => {
    expect(exerciseCode).toContain("const [sessionXP, setSessionXP] = useState<number | null>(null)");
  });

  it("should display XP badge in results", () => {
    expect(exerciseCode).toContain("xpBadge");
    expect(exerciseCode).toContain("XP earned");
  });

  it("should show points out of max possible", () => {
    expect(exerciseCode).toContain("{exercises.length * 3} possible");
  });

  it("should reset sessionXP on retry", () => {
    expect(exerciseCode).toContain("setSessionXP(null)");
  });

  it("should have xpBadge styles defined", () => {
    expect(exerciseCode).toContain("xpBadge:");
    expect(exerciseCode).toContain("xpBadgeText:");
  });

  it("should initialize progress with hintUsed and wasRevealed as false", () => {
    expect(exerciseCode).toContain("hintUsed: false, wasRevealed: false");
  });
});
