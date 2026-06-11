/**
 * Adaptive Engine Hooks
 * 
 * Middleware that wires the adaptive learning engines into existing lesson flows.
 * Call these hooks at key moments (answer, session start, session end) to automatically
 * feed data into error detection, pacing, comprehension checks, and session summaries.
 */
import { logError, detectPatterns, type ErrorEntry } from "./error-pattern-detection";
import { recordResponse, startPacingSession, getRecommendedDifficulty, type ResponseMetric } from "./adaptive-pacing";
import { recordActivity, startSession, endSession, getActiveSession, type SessionActivity } from "./session-summary";
import { recordComprehensionResult, getStrugglingConcepts } from "./comprehension-check";
import { updateSkillMastery } from "./knowledge-gap-map";
import { recordLearningEvent } from "./learning-style-detection";
import { logPronunciationError } from "./pronunciation-error-categorization";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ADAPTIVE_SESSION_KEY = "@adaptive_session_active";

// ─── Session Lifecycle ──────────────────────────────────────────────────────

/**
 * Call when a study session begins (flashcard review, lesson, etc.)
 * Initializes all adaptive engines for the session.
 */
export async function onSessionStart(sessionType: "flashcard" | "lesson" | "conversation" | "quiz" | "drill"): Promise<void> {
  await startPacingSession();
  await startSession();
  await AsyncStorage.setItem(ADAPTIVE_SESSION_KEY, JSON.stringify({
    type: sessionType,
    startedAt: Date.now(),
    interactions: 0,
    correctCount: 0,
    incorrectCount: 0,
  }));
}

/**
 * Call when a study session ends.
 * Triggers pattern detection, session summary generation, and skill updates.
 * Returns the session summary for display.
 */
export async function onSessionEnd(sessionType: "flashcard" | "lesson" | "conversation" | "quiz" | "drill"): Promise<{
  patternsDetected: number;
  strugglingConcepts: number;
  recommendedDifficulty: number;
}> {
  // Detect error patterns from accumulated errors
  const patterns = await detectPatterns();
  
  // End the session summary
  await endSession();
  
  // Get struggling concepts for potential re-teaching
  const struggling = await getStrugglingConcepts();
  
  // Get recommended difficulty for next session
  const difficulty = await getRecommendedDifficulty();
  
  // Clear session state
  await AsyncStorage.removeItem(ADAPTIVE_SESSION_KEY);
  
  return {
    patternsDetected: patterns.length,
    strugglingConcepts: struggling.length,
    recommendedDifficulty: difficulty,
  };
}

// ─── Flashcard Answer Hook ──────────────────────────────────────────────────

/**
 * Call after every flashcard answer.
 * Feeds data into error detection, pacing, session tracking, and skill mastery.
 */
export async function onFlashcardAnswer(params: {
  cardId: string;
  front: string;        // Target language
  back: string;         // Native language
  correct: boolean;
  responseTimeMs: number;
  category?: string;    // grammar, vocabulary, etc.
}): Promise<{
  pacingAction: string;
  confidence: number;
}> {
  const { cardId, front, back, correct, responseTimeMs, category } = params;
  
  // 1. Record error if incorrect
  if (!correct) {
    await logError({
      source: "flashcard",
      category: (category as any) || "vocabulary",
      targetWord: front,
      userAnswer: "incorrect_response",
      correctAnswer: back,
      context: `Flashcard review: "${front}" → "${back}"`,
      language: "Spanish",
      severity: responseTimeMs > 10000 ? 3 : responseTimeMs > 5000 ? 2 : 1,
    });
  }
  
  // 2. Record pacing metric
  const pacingResult = await recordResponse({
    correct,
    responseTimeMs,
    difficulty: 5,
    skipped: false,
    activity: "flashcard",
  });
  
  // 3. Record session activity
  await recordActivity({
    type: "flashcard_review",
    domain: category || "vocabulary",
    score: correct ? 100 : 0,
    correct: correct ? 1 : 0,
    total: 1,
    timeSpentMs: responseTimeMs,
    details: `Card: "${front}" → "${back}"`,
  });
  
  // 4. Update skill mastery
  await updateSkillMastery(
    `${category || "vocabulary"}_${cardId}`,
    correct ? 85 : 30,
    correct,
  );
  
  // 5. Record learning event (modality = reading for flashcards)
  await recordLearningEvent({
    activity: "flashcard",
    modality: "reading",
    score: correct ? 100 : 0,
    responseTimeMs,
    completed: true,
  });
  
  // Update session counters
  const sessionData = await AsyncStorage.getItem(ADAPTIVE_SESSION_KEY);
  if (sessionData) {
    const session = JSON.parse(sessionData);
    session.interactions++;
    if (correct) session.correctCount++;
    else session.incorrectCount++;
    await AsyncStorage.setItem(ADAPTIVE_SESSION_KEY, JSON.stringify(session));
  }
  
  return {
    pacingAction: pacingResult.action,
    confidence: pacingResult.confidence,
  };
}

// ─── Lesson Quiz Answer Hook ────────────────────────────────────────────────

/**
 * Call after each quiz answer in a lesson.
 * Feeds into comprehension tracking and error detection.
 */
export async function onLessonQuizAnswer(params: {
  lessonId: string;
  questionId: string;
  conceptId: string;
  conceptName: string;
  correct: boolean;
  responseTimeMs: number;
  category?: string;
}): Promise<void> {
  const { lessonId, questionId, conceptId, conceptName, correct, responseTimeMs, category } = params;
  
  // Record comprehension result
  await recordComprehensionResult({
    lessonId,
    conceptId,
    questions: [{ id: questionId, text: conceptName, type: "multiple_choice", options: [], correctAnswer: "" }],
    answers: [{ questionId, userAnswer: correct ? "correct" : "wrong", correct }],
    score: correct ? 100 : 0,
    passed: correct,
    approachUsed: "explain_then_test",
    retryCount: 0,
  });
  
  // Record error if incorrect
  if (!correct) {
    await logError({
      source: "quiz",
      category: (category as any) || "grammar",
      targetWord: conceptName,
      userAnswer: "wrong_answer",
      correctAnswer: "correct_answer",
      context: `Lesson quiz: ${conceptName}`,
      language: "Spanish",
      severity: 2,
    });
  }
  
  // Record pacing
  await recordResponse({
    correct,
    responseTimeMs,
    difficulty: 5,
    skipped: false,
    activity: "quiz",
  });
  
  // Record activity
  await recordActivity({
    type: "quiz_answer",
    domain: category || "grammar",
    score: correct ? 100 : 0,
    correct: correct ? 1 : 0,
    total: 1,
    timeSpentMs: responseTimeMs,
    details: `Lesson ${lessonId}: ${conceptName}`,
  });
}

// ─── Lesson Complete Hook ───────────────────────────────────────────────────

/**
 * Call when a lesson is completed.
 * Records the overall lesson performance and triggers adaptive adjustments.
 */
export async function onLessonComplete(params: {
  lessonId: string;
  quizScore: number;      // 0-100
  durationSeconds: number;
  vocabLearned?: number;
}): Promise<void> {
  const { lessonId, quizScore, durationSeconds, vocabLearned } = params;
  
  // Record activity
  await recordActivity({
    type: "lesson_complete",
    domain: "general",
    score: quizScore,
    correct: quizScore >= 70 ? 1 : 0,
    total: 1,
    timeSpentMs: durationSeconds * 1000,
    details: `Lesson ${lessonId}, score: ${quizScore}, vocab: ${vocabLearned || 0}`,
  });
  
  // Update skill mastery based on quiz score
  await updateSkillMastery(`lesson_${lessonId}_grammar`, quizScore, quizScore >= 70);
  await updateSkillMastery(`lesson_${lessonId}_vocab`, quizScore, quizScore >= 70);
  
  // Record learning event
  await recordLearningEvent({
    activity: "lesson",
    modality: "reading",
    score: quizScore,
    responseTimeMs: durationSeconds * 1000,
    completed: true,
  });
}

// ─── Conversation Hook ──────────────────────────────────────────────────────

/**
 * Call after each conversation turn in AI voice practice.
 */
export async function onConversationTurn(params: {
  userMessage: string;
  aiResponse: string;
  pronunciationScore?: number;
  grammarErrors?: string[];
  durationMs: number;
}): Promise<void> {
  const { userMessage, pronunciationScore, grammarErrors, durationMs } = params;
  
  // Log grammar errors
  if (grammarErrors && grammarErrors.length > 0) {
    for (const error of grammarErrors) {
      await logError({
        source: "conversation",
        category: "grammar",
        targetWord: userMessage.split(" ")[0] || userMessage,
        userAnswer: userMessage,
        correctAnswer: error,
        context: `Voice conversation: "${userMessage}"`,
        language: "Spanish",
        severity: 2,
      });
    }
  }
  
  // Log pronunciation issues with specific categorization
  if (pronunciationScore !== undefined && pronunciationScore < 70) {
    await logError({
      source: "pronunciation",
      category: "pronunciation",
      targetWord: userMessage.split(" ")[0] || userMessage,
      userAnswer: `score_${pronunciationScore}`,
      correctAnswer: "clear_pronunciation",
      context: `Voice conversation pronunciation: ${pronunciationScore}%`,
      language: "Spanish",
      severity: pronunciationScore < 40 ? 3 : 2,
    });
    // Categorize pronunciation error for targeted drills
    await logPronunciationError({
      word: userMessage.split(" ")[0] || userMessage,
      userAttempt: `score_${pronunciationScore}`,
      expected: "clear_pronunciation",
      language: "Spanish",
      score: pronunciationScore,
      context: `Voice conversation: "${userMessage}"`,
      source: "conversation",
    });
  }
  
  // Record activity
  const convScore = pronunciationScore !== undefined ? pronunciationScore : 70;
  await recordActivity({
    type: "conversation_turn",
    domain: "pronunciation",
    score: convScore,
    correct: convScore >= 70 ? 1 : 0,
    total: 1,
    timeSpentMs: durationMs,
    details: `Pronunciation: ${convScore}%`,
  });
  
  // Update pronunciation mastery
  if (pronunciationScore !== undefined) {
    await updateSkillMastery(
      `pronunciation_${userMessage.slice(0, 20)}`,
      pronunciationScore,
      pronunciationScore >= 70,
    );
  }
  
  // Record learning event (auditory modality for conversation)
  await recordLearningEvent({
    activity: "conversation",
    modality: "auditory",
    score: convScore,
    responseTimeMs: durationMs,
    completed: true,
  });
}

// ─── Utility ────────────────────────────────────────────────────────────────

/**
 * Get current session info for UI display
 */
export async function getAdaptiveSessionInfo(): Promise<{
  active: boolean;
  type: string;
  duration: number;
  interactions: number;
  accuracy: number;
} | null> {
  const data = await AsyncStorage.getItem(ADAPTIVE_SESSION_KEY);
  if (!data) return null;
  const session = JSON.parse(data);
  const duration = Math.floor((Date.now() - session.startedAt) / 1000);
  const accuracy = session.interactions > 0
    ? Math.round((session.correctCount / session.interactions) * 100)
    : 0;
  return {
    active: true,
    type: session.type,
    duration,
    interactions: session.interactions,
    accuracy,
  };
}
