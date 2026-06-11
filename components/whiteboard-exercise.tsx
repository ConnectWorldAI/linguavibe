/**
 * WhiteboardExercise — Reusable interactive whiteboard teaching component
 * 
 * Inspired by @inglesconomar's whiteboard teaching style.
 * Used across ALL curriculum classes: grammar, conjugation, vocabulary, pronunciation.
 * 
 * Features:
 * - Animated teacher writing on whiteboard (text appears letter-by-letter)
 * - Dual input: scribble/write on phone OR tap multiple choice
 * - Smart grading: fuzzy match for written answers, exact for MC
 * - Smart pacing: auto-advances on correct, pauses + explains on wrong
 * - Color-coded board: blue=teacher, red=key terms, green=correct, orange=hints
 * - Progress bar showing lesson advancement
 */
import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { trpc } from "@/lib/trpc";
import { ActivityIndicator } from "react-native";
import { captureRef } from "react-native-view-shot";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Types ──────────────────────────────────────────────────────────────────
export interface BoardContentItem {
  text: string;
  color: "blue" | "red" | "green" | "orange";
  size: "large" | "medium" | "small";
  position: "left" | "center" | "right";
  underline?: boolean;
}

export interface WhiteboardQuestion {
  prompt: string;
  expectedAnswer: string;
  acceptableAnswers?: string[];
  multipleChoice: Array<{ text: string; correct: boolean }>;
  explanation: string;
  hint?: string;
}

export interface WhiteboardStep {
  stepNumber: number;
  type: "teach" | "question";
  boardContent: BoardContentItem[];
  teacherSays: string;
  pronunciation?: string;
  question?: WhiteboardQuestion;
}

export interface WhiteboardLessonData {
  lessonTitle: string;
  teacherName: string;
  estimatedMinutes: number;
  steps: WhiteboardStep[];
  summary?: {
    keyRule: string;
    practicePhrase: string;
    nextTopic: string;
  };
}

interface WhiteboardExerciseProps {
  lesson: WhiteboardLessonData;
  onComplete: (results: WhiteboardResults) => void;
  onExit?: () => void;
  /** If true, auto-speak teacher lines */
  speakEnabled?: boolean;
  /** Language code for TTS */
  ttsLanguage?: string;
}

export interface WhiteboardResults {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  timeSpent: number;
  inputModeUsed: "write" | "tap" | "mixed";
  stepResults: Array<{
    stepNumber: number;
    correct: boolean;
    userAnswer: string;
    expectedAnswer: string;
    inputMode: "write" | "tap";
    timeMs: number;
  }>;
}

// ─── Colors ─────────────────────────────────────────────────────────────────
const WB = {
  board: "#1B4332",        // Dark green chalkboard
  boardLight: "#2D6A4F",   // Lighter green
  boardBorder: "#40916C",  // Board frame
  chalk: "#FFFFFF",        // White chalk
  chalkBlue: "#74C0FC",    // Blue marker
  chalkRed: "#FF6B6B",     // Red marker
  chalkGreen: "#51CF66",   // Green marker
  chalkOrange: "#FFA94D",  // Orange marker
  bg: "#0A0A0F",           // Screen bg
  card: "#1A1A2E",         // Card bg
  cardLight: "#252540",    // Light card
  primary: "#6C63FF",      // Brand purple
  primaryLight: "#8B83FF",
  success: "#22C55E",
  successBg: "rgba(34,197,94,0.15)",
  error: "#EF4444",
  errorBg: "rgba(239,68,68,0.15)",
  warning: "#F59E0B",
  text: "#FFFFFF",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",
  border: "#2A2A4A",
  inputBg: "#F8F9FA",
  inputText: "#1A1A2E",
  drawingBg: "#FFFEF5",    // Warm white for drawing area
  drawingStroke: "#1A1A2E",
};

const BOARD_COLOR_MAP: Record<string, string> = {
  blue: WB.chalkBlue,
  red: WB.chalkRed,
  green: WB.chalkGreen,
  orange: WB.chalkOrange,
};

const FONT_SIZE_MAP: Record<string, number> = {
  large: 22,
  medium: 17,
  small: 14,
};

// ─── Fuzzy Match Grading ────────────────────────────────────────────────────
function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"¡¿\-()]/g, "")
    .replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function gradeWrittenAnswer(
  userAnswer: string,
  expectedAnswer: string,
  acceptableAnswers?: string[]
): { correct: boolean; closeness: number } {
  const normUser = normalizeAnswer(userAnswer);
  const normExpected = normalizeAnswer(expectedAnswer);

  // Exact match
  if (normUser === normExpected) return { correct: true, closeness: 1 };

  // Check acceptable alternatives
  if (acceptableAnswers) {
    for (const alt of acceptableAnswers) {
      if (normalizeAnswer(alt) === normUser) return { correct: true, closeness: 1 };
    }
  }

  // Fuzzy match — allow small typos (distance <= 2 for short, <= 3 for long)
  const dist = levenshtein(normUser, normExpected);
  const maxLen = Math.max(normUser.length, normExpected.length);
  const threshold = maxLen <= 5 ? 1 : maxLen <= 10 ? 2 : 3;
  const closeness = 1 - dist / maxLen;

  if (dist <= threshold) return { correct: true, closeness };

  // Check acceptable alternatives with fuzzy
  if (acceptableAnswers) {
    for (const alt of acceptableAnswers) {
      const altDist = levenshtein(normUser, normalizeAnswer(alt));
      const altMax = Math.max(normUser.length, normalizeAnswer(alt).length);
      const altThreshold = altMax <= 5 ? 1 : altMax <= 10 ? 2 : 3;
      if (altDist <= altThreshold) return { correct: true, closeness: 1 - altDist / altMax };
    }
  }

  return { correct: false, closeness };
}

// ─── Drawing Canvas Component ───────────────────────────────────────────────
interface DrawingCanvasProps {
  onTextRecognized?: (text: string) => void;
  height?: number;
  disabled?: boolean;
  expectedAnswer?: string;
  targetLanguage?: string;
}

function DrawingCanvas({
  height = 150,
  disabled = false,
  onTextRecognized,
  expectedAnswer,
  targetLanguage,
}: DrawingCanvasProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [recognizing, setRecognizing] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const canvasRef = useRef<View>(null);
  const canvasWidth = useRef(SCREEN_WIDTH - 64);

  const recognizeMutation = trpc.translate.recognizeHandwriting.useMutation();

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .runOnJS(true)
      .enabled(!disabled && !recognizing)
      .onStart((e) => {
        setCurrentPath(`M${e.x.toFixed(1)},${e.y.toFixed(1)}`);
        setRecognizedText(null); // Clear previous recognition
      })
      .onUpdate((e) => {
        setCurrentPath((prev) => `${prev} L${e.x.toFixed(1)},${e.y.toFixed(1)}`);
      })
      .onEnd(() => {
        setPaths((prev) => [...prev, currentPath]);
        setCurrentPath("");
      });
  }, [disabled, recognizing, currentPath]);

  const clearCanvas = useCallback(() => {
    setPaths([]);
    setCurrentPath("");
    setRecognizedText(null);
  }, []);

  const undoLastStroke = useCallback(() => {
    setPaths((prev) => prev.slice(0, -1));
    setRecognizedText(null);
  }, []);

  const handleRecognize = useCallback(async () => {
    if (paths.length === 0 || recognizing) return;
    setRecognizing(true);
    try {
      // Attempt to capture the canvas as a base64 PNG for vision-based recognition
      let base64Image: string | undefined;
      try {
        if (canvasRef.current) {
          const uri = await captureRef(canvasRef, {
            format: "png",
            quality: 1,
            result: "base64",
          });
          if (uri && typeof uri === "string" && uri.length > 100) {
            base64Image = uri;
          }
        }
      } catch {
        // View-shot capture failed (e.g., on some web environments) — fall back to path analysis
      }

      const result = await recognizeMutation.mutateAsync({
        paths,
        canvasWidth: canvasWidth.current,
        canvasHeight: height,
        expectedAnswer,
        targetLanguage,
        ...(base64Image ? { base64Image, mimeType: "image/png" } : {}),
      });
      if (result.success && result.text) {
        setRecognizedText(result.text);
        onTextRecognized?.(result.text);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setRecognizedText("(Could not read — try again or type it)");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    } catch {
      setRecognizedText("(Recognition failed — try typing instead)");
    } finally {
      setRecognizing(false);
    }
  }, [paths, height, expectedAnswer, targetLanguage, recognizing]);

  return (
    <View style={[drawStyles.canvasContainer, { height: height + 44 }]}>
      {/* Canvas toolbar */}
      <View style={drawStyles.toolbar}>
        <Text style={drawStyles.toolbarLabel}>
          <Ionicons name="pencil" size={14} color={WB.textMuted} /> Draw your answer
        </Text>
        <View style={drawStyles.toolbarActions}>
          {paths.length > 0 && !disabled && (
            <>
              <TouchableOpacity style={drawStyles.toolbarBtn} onPress={undoLastStroke}>
                <Ionicons name="arrow-undo" size={16} color={WB.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={drawStyles.toolbarBtn} onPress={clearCanvas}>
                <Ionicons name="trash-outline" size={16} color={WB.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Drawing surface */}
      <GestureDetector gesture={panGesture}>
        <View
          ref={canvasRef}
          style={[drawStyles.canvas, { height }, disabled && drawStyles.canvasDisabled]}
          onLayout={(e) => { canvasWidth.current = e.nativeEvent.layout.width; }}
        >
          <Svg width="100%" height="100%">
            {paths.map((d, i) => (
              <Path
                key={i}
                d={d}
                stroke={WB.drawingStroke}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {currentPath ? (
              <Path
                d={currentPath}
                stroke={WB.drawingStroke}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </Svg>
          {paths.length === 0 && !currentPath && !disabled && (
            <View style={drawStyles.placeholder}>
              <Ionicons name="finger-print" size={24} color="#CCC" />
              <Text style={drawStyles.placeholderText}>Write with your finger</Text>
            </View>
          )}
        </View>
      </GestureDetector>

      {/* Recognize button + result */}
      {paths.length > 0 && !disabled && (
        <View style={drawStyles.recognizeRow}>
          <TouchableOpacity
            style={[
              drawStyles.recognizeBtn,
              recognizing && drawStyles.recognizeBtnDisabled,
            ]}
            onPress={handleRecognize}
            disabled={recognizing}
          >
            {recognizing ? (
              <ActivityIndicator size="small" color={WB.text} />
            ) : (
              <>
                <Ionicons name="scan" size={16} color={WB.text} />
                <Text style={drawStyles.recognizeBtnText}>Recognize</Text>
              </>
            )}
          </TouchableOpacity>
          {recognizedText && (
            <Text
              style={[
                drawStyles.recognizedText,
                recognizedText.startsWith("(") && drawStyles.recognizedTextError,
              ]}
              numberOfLines={1}
            >
              {recognizedText}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Animated Board Text ────────────────────────────────────────────────────
function AnimatedBoardLine({
  item,
  delay = 0,
  onFinish,
}: {
  item: BoardContentItem;
  delay?: number;
  onFinish?: () => void;
}) {
  const [visibleChars, setVisibleChars] = useState(0);
  const fullText = item.text;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      let idx = 0;
      timerRef.current = setInterval(() => {
        idx++;
        setVisibleChars(idx);
        if (idx >= fullText.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          onFinish?.();
        }
      }, 35); // 35ms per character — feels like writing
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fullText, delay]);

  const color = BOARD_COLOR_MAP[item.color] || WB.chalk;
  const fontSize = FONT_SIZE_MAP[item.size] || 17;
  const textAlign = item.position === "left" ? "left" : item.position === "right" ? "right" : "center";

  return (
    <Text
      style={[
        boardStyles.boardText,
        {
          color,
          fontSize,
          textAlign,
          textDecorationLine: item.underline ? "underline" : "none",
        },
      ]}
    >
      {fullText.substring(0, visibleChars)}
      {visibleChars < fullText.length && (
        <Text style={{ opacity: 0.5 }}>|</Text>
      )}
    </Text>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function WhiteboardExercise({
  lesson,
  onComplete,
  onExit,
  speakEnabled = true,
  ttsLanguage,
}: WhiteboardExerciseProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [inputMode, setInputMode] = useState<"write" | "tap">("tap"); // default to tap
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [selectedMCIndex, setSelectedMCIndex] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<"waiting" | "correct" | "wrong" | "hint">("waiting");
  const [showExplanation, setShowExplanation] = useState(false);
  const [boardAnimDone, setBoardAnimDone] = useState(false);
  const [teacherSpeaking, setTeacherSpeaking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [stepResults, setStepResults] = useState<WhiteboardResults["stepResults"]>([]);
  const [stepStartTime, setStepStartTime] = useState(Date.now());
  const [lessonStartTime] = useState(Date.now());
  const [inputModesUsed, setInputModesUsed] = useState<Set<"write" | "tap">>(new Set());

  const progressAnim = useSharedValue(0);
  const shakeAnim = useSharedValue(0);
  const scrollRef = useRef<ScrollView>(null);

  const currentStep = lesson.steps[currentStepIndex];
  const totalSteps = lesson.steps.length;
  const questionSteps = lesson.steps.filter((s) => s.type === "question" || s.question);
  const totalQuestions = questionSteps.length;

  // ─── Progress Animation ─────────────────────────────────────────────────
  useEffect(() => {
    progressAnim.value = withTiming((currentStepIndex + 1) / totalSteps, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentStepIndex, totalSteps]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnim.value }],
  }));

  // ─── Board Animation Callback ──────────────────────────────────────────
  const handleBoardAnimDone = useCallback(() => {
    setBoardAnimDone(true);
  }, []);

  // ─── Reset on step change ─────────────────────────────────────────────
  useEffect(() => {
    setWrittenAnswer("");
    setSelectedMCIndex(null);
    setAnswerState("waiting");
    setShowExplanation(false);
    setBoardAnimDone(false);
    setShowHint(false);
    setStepStartTime(Date.now());
    scrollRef.current?.scrollTo({ y: 0, animated: true });

    // Speak teacher line
    if (speakEnabled && currentStep?.teacherSays) {
      setTeacherSpeaking(true);
      Speech.speak(currentStep.teacherSays, {
        language: "en",
        rate: 0.9,
        onDone: () => setTeacherSpeaking(false),
        onError: () => setTeacherSpeaking(false),
      });
    }
  }, [currentStepIndex]);

  // ─── Auto-advance for teach steps ─────────────────────────────────────
  useEffect(() => {
    if (currentStep?.type === "teach" && !currentStep.question && boardAnimDone) {
      const timer = setTimeout(() => {
        advanceStep();
      }, 2500); // Wait 2.5s after board finishes writing, then auto-advance
      return () => clearTimeout(timer);
    }
  }, [boardAnimDone, currentStep]);

  // ─── Submit Answer ────────────────────────────────────────────────────
  const submitAnswer = useCallback(
    (answer: string, mode: "write" | "tap") => {
      if (!currentStep?.question || answerState !== "waiting") return;

      setInputModesUsed((prev) => new Set(prev).add(mode));
      const q = currentStep.question;
      let isCorrect = false;

      if (mode === "tap") {
        const selectedOption = q.multipleChoice[parseInt(answer)];
        isCorrect = selectedOption?.correct ?? false;
      } else {
        const result = gradeWrittenAnswer(answer, q.expectedAnswer, q.acceptableAnswers);
        isCorrect = result.correct;
      }

      const timeMs = Date.now() - stepStartTime;

      if (isCorrect) {
        setAnswerState("correct");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setStepResults((prev) => [
          ...prev,
          {
            stepNumber: currentStep.stepNumber,
            correct: true,
            userAnswer: mode === "tap" ? q.multipleChoice[parseInt(answer)]?.text || answer : answer,
            expectedAnswer: q.expectedAnswer,
            inputMode: mode,
            timeMs,
          },
        ]);
        // Auto-advance after 1.8s on correct
        setTimeout(() => {
          setShowExplanation(true);
          setTimeout(() => advanceStep(), 1500);
        }, 800);
      } else {
        setAnswerState("wrong");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        // Shake animation
        shakeAnim.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        setStepResults((prev) => [
          ...prev,
          {
            stepNumber: currentStep.stepNumber,
            correct: false,
            userAnswer: mode === "tap" ? q.multipleChoice[parseInt(answer)]?.text || answer : answer,
            expectedAnswer: q.expectedAnswer,
            inputMode: mode,
            timeMs,
          },
        ]);
        // Show explanation after wrong
        setTimeout(() => {
          setShowExplanation(true);
        }, 1000);
      }
    },
    [currentStep, answerState, stepStartTime]
  );

  // ─── Advance Step ─────────────────────────────────────────────────────
  const advanceStep = useCallback(() => {
    Speech.stop();
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Lesson complete
      const correctCount = stepResults.filter((r) => r.correct).length + (answerState === "correct" ? 0 : 0);
      const finalResults: WhiteboardResults = {
        totalQuestions,
        correctAnswers: stepResults.filter((r) => r.correct).length,
        wrongAnswers: stepResults.filter((r) => !r.correct).length,
        accuracy: totalQuestions > 0 ? stepResults.filter((r) => r.correct).length / totalQuestions : 1,
        timeSpent: Math.round((Date.now() - lessonStartTime) / 1000),
        inputModeUsed: inputModesUsed.size > 1 ? "mixed" : inputModesUsed.has("write") ? "write" : "tap",
        stepResults,
      };
      onComplete(finalResults);
    }
  }, [currentStepIndex, totalSteps, stepResults, totalQuestions, answerState, inputModesUsed, lessonStartTime, onComplete]);

  // ─── Handle MC Selection ──────────────────────────────────────────────
  const handleMCSelect = useCallback(
    (index: number) => {
      if (answerState !== "waiting") return;
      setSelectedMCIndex(index);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      submitAnswer(String(index), "tap");
    },
    [answerState, submitAnswer]
  );

  // ─── Handle Written Submit ────────────────────────────────────────────
  const handleWrittenSubmit = useCallback(() => {
    if (!writtenAnswer.trim() || answerState !== "waiting") return;
    submitAnswer(writtenAnswer.trim(), "write");
  }, [writtenAnswer, answerState, submitAnswer]);

  // ─── Render ───────────────────────────────────────────────────────────
  const isQuestionStep = currentStep?.type === "question" || !!currentStep?.question;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Speech.stop();
            onExit?.();
          }}
        >
          <Ionicons name="close" size={24} color={WB.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {lesson.lessonTitle}
          </Text>
          <Text style={styles.headerSub}>
            {lesson.teacherName} · Step {currentStepIndex + 1}/{totalSteps}
          </Text>
        </View>
        {/* Input mode toggle */}
        {isQuestionStep && (
          <TouchableOpacity
            style={styles.modeToggle}
            onPress={() => {
              setInputMode((prev) => (prev === "write" ? "tap" : "write"));
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons
              name={inputMode === "write" ? "pencil" : "grid"}
              size={18}
              color={WB.primary}
            />
            <Text style={styles.modeToggleText}>
              {inputMode === "write" ? "Write" : "Tap"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Whiteboard */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.whiteboard}>
            <View style={styles.boardFrame}>
              <View style={styles.boardSurface}>
                {/* Board content — animated writing */}
                {currentStep?.boardContent?.map((item, idx) => (
                  <AnimatedBoardLine
                    key={`${currentStepIndex}-${idx}`}
                    item={item}
                    delay={idx * 600}
                    onFinish={idx === (currentStep.boardContent.length - 1) ? handleBoardAnimDone : undefined}
                  />
                ))}

                {/* Correct answer reveal on board */}
                {answerState === "correct" && currentStep?.question && (
                  <Animated.View entering={FadeInDown.duration(300)}>
                    <Text style={boardStyles.correctReveal}>
                      ✓ {currentStep.question.expectedAnswer}
                    </Text>
                  </Animated.View>
                )}
                {answerState === "wrong" && currentStep?.question && showExplanation && (
                  <Animated.View entering={FadeInDown.duration(300)}>
                    <Text style={boardStyles.wrongReveal}>
                      ✗ Correct: {currentStep.question.expectedAnswer}
                    </Text>
                  </Animated.View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Teacher Speech Bubble */}
          {currentStep?.teacherSays && boardAnimDone && (
            <Animated.View entering={FadeInUp.duration(300)} style={styles.speechBubble}>
              <View style={styles.speechIcon}>
                <Ionicons
                  name={teacherSpeaking ? "volume-high" : "chatbubble-ellipses"}
                  size={18}
                  color={WB.primary}
                />
              </View>
              <Text style={styles.speechText}>{currentStep.teacherSays}</Text>
              {currentStep.pronunciation && (
                <Text style={styles.pronunciationText}>🔊 {currentStep.pronunciation}</Text>
              )}
            </Animated.View>
          )}

          {/* Question Area */}
          {isQuestionStep && currentStep?.question && boardAnimDone && (
            <Animated.View entering={SlideInRight.duration(400)} style={styles.questionArea}>
              {/* Question prompt */}
              <Text style={styles.questionPrompt}>{currentStep.question.prompt}</Text>

              {/* Hint button */}
              {currentStep.question.hint && answerState === "waiting" && !showHint && (
                <TouchableOpacity
                  style={styles.hintBtn}
                  onPress={() => {
                    setShowHint(true);
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons name="bulb-outline" size={16} color={WB.warning} />
                  <Text style={styles.hintBtnText}>Need a hint?</Text>
                </TouchableOpacity>
              )}
              {showHint && currentStep.question.hint && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.hintBox}>
                  <Ionicons name="bulb" size={16} color={WB.warning} />
                  <Text style={styles.hintText}>{currentStep.question.hint}</Text>
                </Animated.View>
              )}

              {/* Dual Input Area */}
              <Animated.View style={shakeStyle}>
                {inputMode === "tap" ? (
                  /* Multiple Choice Mode */
                  <View style={styles.mcContainer}>
                    {currentStep.question.multipleChoice.map((opt, idx) => {
                      const isSelected = selectedMCIndex === idx;
                      const isCorrect = opt.correct;
                      const showResult = answerState !== "waiting";
                      let optStyle = styles.mcOption;
                      let optTextStyle = styles.mcOptionText;

                      if (showResult && isSelected && isCorrect) {
                        optStyle = { ...styles.mcOption, ...styles.mcCorrect };
                        optTextStyle = { ...styles.mcOptionText, color: WB.success };
                      } else if (showResult && isSelected && !isCorrect) {
                        optStyle = { ...styles.mcOption, ...styles.mcWrong };
                        optTextStyle = { ...styles.mcOptionText, color: WB.error };
                      } else if (showResult && !isSelected && isCorrect) {
                        optStyle = { ...styles.mcOption, ...styles.mcCorrectReveal };
                        optTextStyle = { ...styles.mcOptionText, color: WB.success };
                      }

                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[optStyle, isSelected && answerState === "waiting" && styles.mcSelected]}
                          onPress={() => handleMCSelect(idx)}
                          disabled={answerState !== "waiting"}
                          activeOpacity={0.7}
                        >
                          <View style={styles.mcLetter}>
                            <Text style={styles.mcLetterText}>
                              {String.fromCharCode(65 + idx)}
                            </Text>
                          </View>
                          <Text style={optTextStyle}>{opt.text}</Text>
                          {showResult && isCorrect && (
                            <Ionicons name="checkmark-circle" size={20} color={WB.success} style={{ marginLeft: "auto" }} />
                          )}
                          {showResult && isSelected && !isCorrect && (
                            <Ionicons name="close-circle" size={20} color={WB.error} style={{ marginLeft: "auto" }} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  /* Write Mode — Text Input + Drawing Canvas */
                  <View style={styles.writeContainer}>
                    {/* Text input */}
                    <View style={styles.writeInputRow}>
                      <TextInput
                        style={[
                          styles.writeInput,
                          answerState === "correct" && styles.writeInputCorrect,
                          answerState === "wrong" && styles.writeInputWrong,
                        ]}
                        placeholder="Type your answer..."
                        placeholderTextColor="#999"
                        value={writtenAnswer}
                        onChangeText={setWrittenAnswer}
                        editable={answerState === "waiting"}
                        returnKeyType="done"
                        onSubmitEditing={handleWrittenSubmit}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        style={[
                          styles.submitBtn,
                          (!writtenAnswer.trim() || answerState !== "waiting") && styles.submitBtnDisabled,
                        ]}
                        onPress={handleWrittenSubmit}
                        disabled={!writtenAnswer.trim() || answerState !== "waiting"}
                      >
                        <Ionicons name="send" size={20} color={WB.text} />
                      </TouchableOpacity>
                    </View>

                    {/* Drawing canvas */}
                    <Text style={styles.orText}>or draw it:</Text>
                    <DrawingCanvas
                      height={130}
                      disabled={answerState !== "waiting"}
                      expectedAnswer={currentStep?.question?.expectedAnswer}
                      targetLanguage={ttsLanguage}
                      onTextRecognized={(text) => {
                        setWrittenAnswer(text);
                        // Auto-submit recognized text
                        if (text && answerState === "waiting") {
                          submitAnswer(text, "write");
                        }
                      }}
                    />
                  </View>
                )}
              </Animated.View>

              {/* Explanation */}
              {showExplanation && currentStep.question.explanation && (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.explanationBox}>
                  <Ionicons
                    name={answerState === "correct" ? "checkmark-circle" : "information-circle"}
                    size={20}
                    color={answerState === "correct" ? WB.success : WB.chalkBlue}
                  />
                  <Text style={styles.explanationText}>{currentStep.question.explanation}</Text>
                </Animated.View>
              )}

              {/* Continue button after wrong answer */}
              {answerState === "wrong" && showExplanation && (
                <Animated.View entering={FadeIn.duration(200)}>
                  <TouchableOpacity style={styles.continueBtn} onPress={advanceStep}>
                    <Text style={styles.continueBtnText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={18} color={WB.text} />
                  </TouchableOpacity>
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* Teach step — tap to continue */}
          {!isQuestionStep && boardAnimDone && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.tapContinue}>
              <TouchableOpacity style={styles.continueBtn} onPress={advanceStep}>
                <Text style={styles.continueBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={WB.text} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WB.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: WB.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: WB.text,
  },
  headerSub: {
    fontSize: 12,
    color: WB.textMuted,
    marginTop: 1,
  },
  modeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: WB.card,
    borderWidth: 1,
    borderColor: WB.primary,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: WB.primary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: WB.card,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: WB.primary,
    borderRadius: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },

  // Whiteboard
  whiteboard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  boardFrame: {
    backgroundColor: "#5C4033",
    padding: 8,
    borderRadius: 16,
  },
  boardSurface: {
    backgroundColor: WB.board,
    borderRadius: 12,
    padding: 20,
    minHeight: 180,
    gap: 8,
  },

  // Speech bubble
  speechBubble: {
    backgroundColor: WB.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: "column",
    gap: 6,
    borderWidth: 1,
    borderColor: WB.border,
  },
  speechIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${WB.primary}20`,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  speechText: {
    fontSize: 15,
    color: WB.text,
    lineHeight: 22,
  },
  pronunciationText: {
    fontSize: 13,
    color: WB.chalkOrange,
    fontStyle: "italic",
  },

  // Question area
  questionArea: {
    gap: 12,
  },
  questionPrompt: {
    fontSize: 17,
    fontWeight: "700",
    color: WB.text,
    textAlign: "center",
    lineHeight: 24,
  },

  // Hint
  hintBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: `${WB.warning}15`,
  },
  hintBtnText: {
    fontSize: 13,
    color: WB.warning,
    fontWeight: "500",
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: `${WB.warning}10`,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: `${WB.warning}30`,
  },
  hintText: {
    flex: 1,
    fontSize: 14,
    color: WB.warning,
    lineHeight: 20,
  },

  // Multiple Choice
  mcContainer: {
    gap: 10,
  },
  mcOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: WB.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: WB.border,
  },
  mcSelected: {
    borderColor: WB.primary,
    backgroundColor: `${WB.primary}15`,
  },
  mcCorrect: {
    borderColor: WB.success,
    backgroundColor: WB.successBg,
  },
  mcWrong: {
    borderColor: WB.error,
    backgroundColor: WB.errorBg,
  },
  mcCorrectReveal: {
    borderColor: WB.success,
    backgroundColor: WB.successBg,
    borderStyle: "dashed" as any,
  },
  mcLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: WB.cardLight,
    alignItems: "center",
    justifyContent: "center",
  },
  mcLetterText: {
    fontSize: 13,
    fontWeight: "700",
    color: WB.textSecondary,
  },
  mcOptionText: {
    fontSize: 16,
    color: WB.text,
    flex: 1,
  },

  // Write mode
  writeContainer: {
    gap: 8,
  },
  writeInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  writeInput: {
    flex: 1,
    backgroundColor: WB.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: WB.text,
    borderWidth: 1.5,
    borderColor: WB.border,
  },
  writeInputCorrect: {
    borderColor: WB.success,
    backgroundColor: WB.successBg,
  },
  writeInputWrong: {
    borderColor: WB.error,
    backgroundColor: WB.errorBg,
  },
  submitBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: WB.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  orText: {
    fontSize: 12,
    color: WB.textMuted,
    textAlign: "center",
    marginTop: 4,
  },

  // Explanation
  explanationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: WB.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: WB.border,
  },
  explanationText: {
    flex: 1,
    fontSize: 14,
    color: WB.textSecondary,
    lineHeight: 20,
  },

  // Continue
  tapContinue: {
    alignItems: "center",
    marginTop: 8,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: WB.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    alignSelf: "center",
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: WB.text,
  },
});

const boardStyles = StyleSheet.create({
  boardText: {
    fontFamily: Platform.OS === "ios" ? "Chalkduster" : "monospace",
    lineHeight: 28,
  },
  correctReveal: {
    fontFamily: Platform.OS === "ios" ? "Chalkduster" : "monospace",
    fontSize: 20,
    color: WB.chalkGreen,
    textAlign: "center",
    marginTop: 8,
  },
  wrongReveal: {
    fontFamily: Platform.OS === "ios" ? "Chalkduster" : "monospace",
    fontSize: 18,
    color: WB.chalkRed,
    textAlign: "center",
    marginTop: 8,
  },
});

const drawStyles = StyleSheet.create({
  canvasContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: WB.border,
    borderStyle: "dashed",
  },
  canvas: {
    flex: 1,
    backgroundColor: WB.drawingBg,
  },
  canvasDisabled: {
    opacity: 0.5,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: "#CCC",
  },
  clearBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: WB.card,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: WB.border,
  },
  toolbarLabel: {
    fontSize: 12,
    color: WB.textMuted,
  },
  toolbarActions: {
    flexDirection: "row",
    gap: 8,
  },
  toolbarBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: WB.cardLight,
    alignItems: "center",
    justifyContent: "center",
  },
  recognizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: WB.card,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: WB.border,
  },
  recognizeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: WB.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  recognizeBtnDisabled: {
    opacity: 0.5,
  },
  recognizeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: WB.text,
  },
  recognizedText: {
    flex: 1,
    fontSize: 14,
    color: WB.success,
    fontWeight: "600",
  },
  recognizedTextError: {
    color: WB.textMuted,
    fontWeight: "400",
    fontStyle: "italic",
  },
});
