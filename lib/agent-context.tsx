import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  PanResponder,
  Animated,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/Colors";
import { BrandName } from "@/components/brand-name";
import { vanillaClient } from "@/lib/trpc";
import { WellbeingCheckIn } from "@/components/wellbeing-check-in";
import type { WellbeingEntry } from "@/lib/wave-cloud-memory";

// Lazy-loaded memory/intelligence modules (avoid circular deps)
const loadMemory = () => import("@/lib/wave-cloud-memory");
const loadOutreach = () => import("@/lib/wave-cloud-outreach");
const loadTeacherMemory = () => import("@/lib/teacher-memory");
const loadIntelligence = () => import("@/lib/learning-intelligence");
const loadGamification = () => import("@/lib/srs-gamification");

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Types ───────────────────────────────────────────────────────────────────

type AgentMode = "idle" | "listening" | "thinking" | "speaking" | "awake";

interface AgentMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  action?: string;
  timestamp: number;
}

interface AgentState {
  visible: boolean;
  expanded: boolean;
  mode: AgentMode;
  messages: AgentMessage[];
  transcript: string;
  voiceMode: boolean;
  floatingText: string;
  isAwake: boolean;
  showWellbeingCheckIn: boolean;
}

interface AgentContextType {
  agentState: AgentState;
  showAgent: () => void;
  hideAgent: () => void;
  toggleExpand: () => void;
  sendCommand: (text: string) => void;
  startListening: () => void;
  stopListening: () => void;
  wakeAgent: () => void;
  toggleVoiceMode: () => void;
}

// ─── Proactive Suggestions Engine ────────────────────────────────────────────

interface ScheduleItem {
  type: "class" | "test" | "flashcards" | "call";
  title: string;
  time: string;
  route: string;
}

function getUpcomingSchedule(): ScheduleItem[] {
  const hour = new Date().getHours();
  const items: ScheduleItem[] = [];
  if (hour < 12) {
    items.push({ type: "class", title: "Spanish Basics - Lesson 4", time: "in 2 hours", route: "/classroom" });
    items.push({ type: "flashcards", title: "Review 15 flashcards due today", time: "anytime", route: "/flashcards" });
  } else if (hour < 18) {
    items.push({ type: "test", title: "Vocabulary Quiz - Chapter 3", time: "in 1 hour", route: "/classroom" });
    items.push({ type: "call", title: "Practice call with tutor", time: "at 4 PM", route: "/voice-call" });
  } else {
    items.push({ type: "flashcards", title: "Evening review - 8 cards remaining", time: "before bed", route: "/flashcards" });
  }
  return items;
}

function getProactiveGreeting(): string {
  const hour = new Date().getHours();
  const schedule = getUpcomingSchedule();
  const greetings: string[] = [];
  if (hour < 6) greetings.push("You're up early! I admire the dedication.");
  else if (hour < 9) greetings.push("Good morning! Fresh brain = best learning time.");
  else if (hour < 12) greetings.push("Hey! Ready to pick up where we left off?");
  else if (hour < 14) greetings.push("Afternoon practice session? Love it.");
  else if (hour < 18) greetings.push("Hey! Good time for a quick session.");
  else if (hour < 21) greetings.push("Evening study mode — let's make it count.");
  else greetings.push("Late night learner! Let's keep it light and fun.");
  if (schedule.length > 0) {
    const first = schedule[0];
    greetings.push(`You've got "${first.title}" coming up ${first.time}.`);
  }
  const personalMessages = [
    "I've been thinking about your progress — you're doing better than you realize.",
    "I noticed some patterns in your recent practice. Want me to show you what I see?",
    "I have some exercises picked out just for you based on what we've been working on.",
    "Remember that topic you struggled with last time? I've got a new approach for you.",
    "Your consistency is impressive. Let's build on that momentum.",
    "I put together some practice that connects to things you're interested in.",
    "Quick check — how are you feeling about your progress? I'm here to adjust if needed.",
    "I've been tracking your weak spots. Want me to give you targeted homework?",
  ];
  if (Math.random() < 0.5) {
    greetings.push(personalMessages[Math.floor(Math.random() * personalMessages.length)]);
  }
  return greetings.join(" ");
}

const FEATURE_SUGGESTIONS = [
  { text: "Have you tried learning through music? You can translate songs word-by-word!", route: "/song-library" },
  { text: "Did you know you can practice pronunciation with AI scoring?", route: "/practice-pronunciation" },
  { text: "You can video call a tutor for real-time practice!", route: "/video-call" },
  { text: "Try Battle Mode — compete with other learners!", route: "/battle-mode" },
  { text: "The Recording Studio lets you record covers in your target language!", route: "/recording-studio" },
  { text: "Check out the Time Capsule to see how far you've come!", route: "/time-capsule" },
  { text: "Did you try the URL Translator? Paste any webpage link and get it translated instantly!", route: "/url-translate" },
  { text: "Have you trained your voice yet? You can send voice memos and get real-time translation in YOUR voice!", route: "/name-recording" },
  { text: "Got a video in another language? Paste the URL and we'll translate the whole thing for you!", route: "/url-translate" },
  { text: "Try a live translation call! Both of you speak your own language and hear each other translated in real-time.", route: "/call-translator" },
];

const SLANG_WORDS = [
  { word: "guay", language: "Spanish", meaning: "cool/awesome", example: "¡Qué guay!" },
  { word: "kiffer", language: "French", meaning: "to really like something", example: "Je kiffe cette chanson!" },
  { word: "geil", language: "German", meaning: "awesome/cool", example: "Das ist geil!" },
  { word: "figo", language: "Portuguese", meaning: "cool/nice", example: "Isso é muito figo!" },
  { word: "fico", language: "Italian", meaning: "cool/trendy", example: "Che fico!" },
];

// ─── Action Mapping (commands → routes/actions) ──────────────────────────────

const ACTION_MAP: Record<string, { route?: string; action?: string; response: string }> = {
  "go to settings": { route: "/settings", response: "Taking you to Settings..." },
  "open settings": { route: "/settings", response: "Opening Settings..." },
  "go to profile": { route: "/(tabs)/profile", response: "Going to your Profile..." },
  "open profile": { route: "/(tabs)/profile", response: "Going to your Profile..." },
  "go home": { route: "/(tabs)", response: "Going to Home..." },
  "go to home": { route: "/(tabs)", response: "Going to Home..." },
  "open messages": { route: "/(tabs)/messages", response: "Opening Messages..." },
  "open calls": { route: "/(tabs)/phone", response: "Opening Phone..." },
  "open explore": { route: "/(tabs)/explore", response: "Opening Explore..." },
  "open translate": { route: "/translate", response: "Opening Translator..." },
  "open songs": { route: "/song-library", response: "Opening Song Library..." },
  "open learn": { route: "/(tabs)/learn", response: "Opening Learning Hub..." },
  "open lessons": { route: "/classroom", response: "Opening Classroom..." },
  "open calendar": { route: "/class-schedule", response: "Opening Calendar..." },
  "open subscription": { route: "/subscription", response: "Opening Subscription..." },
  "upgrade plan": { route: "/subscription", response: "Let's upgrade your plan..." },
  "open studio": { route: "/recording-studio", response: "Opening Recording Studio..." },
  "record a cover": { route: "/recording-studio", response: "Let's record a cover!" },
  "open classroom": { route: "/classroom", response: "Opening AI Classroom..." },
  "open jobs": { route: "/jobs", response: "Opening Job Board..." },
  "find jobs": { route: "/jobs", response: "Searching for language jobs..." },
  "translate url": { route: "/url-translator", response: "Opening URL Translator..." },
  "battle mode": { route: "/battle-mode", response: "Entering Battle Mode!" },
  "vacation mode": { route: "/vacation-mode", response: "Entering Virtual World..." },
  "time capsule": { route: "/time-capsule", response: "Opening Time Capsule..." },
  "practice pronunciation": { route: "/practice-pronunciation", response: "Opening Pronunciation Practice..." },
  "video call": { route: "/video-call", response: "Starting Video Call..." },
  "voice call": { route: "/voice-call", response: "Starting Voice Call..." },
  "start recording": { action: "start_recording", response: "Starting recording..." },
  "stop recording": { action: "stop_recording", response: "Recording stopped." },
  "add reverb": { action: "add_reverb", response: "Adding reverb effect..." },
  "add echo": { action: "add_echo", response: "Adding echo effect..." },
  "mute": { action: "mute", response: "Muted." },
  "unmute": { action: "unmute", response: "Unmuted." },
  "change language": { action: "change_language", response: "What language would you like to switch to?" },
  "dark mode": { action: "toggle_theme", response: "Toggling dark mode..." },
  "light mode": { action: "toggle_theme", response: "Toggling light mode..." },
  "check credits": { action: "check_credits", response: "You have 250 credits remaining." },
  "my streak": { action: "check_streak", response: "" },
  "schedule class": { route: "/class-schedule", response: "Let me help you schedule a class..." },
  "book tutor": { route: "/class-schedule", response: "Opening tutor booking..." },
  "upload song": { route: "/upload-song", response: "Opening song upload..." },
  "what's new": { action: "whats_new", response: "" },
  "what do i have today": { action: "schedule_check", response: "" },
  "what's on my schedule": { action: "schedule_check", response: "" },
  "show me something new": { action: "suggest_feature", response: "" },
  "teach me slang": { action: "slang_word", response: "" },
  "connect me": { action: "wake_up", response: "" },
  "separate stems": { route: "/stem-separator", response: "Opening Stem Separator..." },
  "stem separation": { route: "/stem-separator", response: "Opening Stem Separator..." },
  "split tracks": { route: "/stem-separator", response: "Opening Stem Separator..." },
  "bounce out": { action: "bounce_out", response: "What format? WAV, MP3, or FLAC?" },
  "bounce as wav": { action: "bounce_wav", response: "Bouncing out as WAV..." },
  "bounce as mp3": { action: "bounce_mp3", response: "Bouncing out as MP3..." },
  "translate vocals": { route: "/vocal-translator", response: "Opening Vocal Translator..." },
  "open library": { route: "/studio-library", response: "Opening Studio Library..." },
  "studio library": { route: "/studio-library", response: "Opening Studio Library..." },
  "my files": { route: "/studio-library", response: "Opening your files..." },
  "open stem separator": { route: "/stem-separator", response: "Opening Stem Separator..." },
  "employer portal": { route: "/employer-portal", response: "Opening Employer Portal..." },
  "hire real": { route: "/employer-portal", response: "Opening Employer Portal... Hire Real." },
  "post job": { route: "/employer-job-post", response: "Opening Job Post form..." },
  "search candidates": { route: "/candidate-search", response: "Opening Candidate Search..." },
  "start interview": { route: "/interview-detection", response: "Starting AI-Verified Interview..." },
  "interview detection": { route: "/interview-detection", response: "Opening Interview Detection..." },
  "what should i practice": { route: "/smart-practice", response: "Let me check your performance data... Taking you to Smart Practice." },
  "what am i struggling with": { route: "/smart-practice", response: "Let me analyze your progress... I'll show you exactly where you need more practice." },
  "give me homework": { route: "/smart-practice", response: "Opening your personalized homework..." },
  "extra practice": { route: "/smart-practice", response: "I've got targeted exercises ready for you. Let's go!" },
  "help me improve": { route: "/smart-practice", response: "I know exactly where you need help. Let me show you." },
  "smart practice": { route: "/smart-practice", response: "Opening Smart Practice..." },
  "where am i weak": { route: "/smart-practice", response: "Let me show you your struggle areas..." },
  "open analytics": { route: "/exercise-analytics", response: "Opening your exercise analytics dashboard..." },
  "my progress": { route: "/exercise-analytics", response: "Here's your detailed progress analytics..." },
  "set up translator": { action: "agent_translator_setup", response: "" },
  "set up my translator": { action: "agent_translator_setup", response: "" },
  "configure translator": { action: "agent_translator_setup", response: "" },
  "setup default translator": { action: "agent_translator_setup", response: "" },
  "make connectworld default": { action: "agent_translator_setup", response: "" },
  // ─── Companion quick actions ─────────────────────────────────────────────
  "motivate me": { action: "companion_motivate", response: "" },
  "i need motivation": { action: "companion_motivate", response: "" },
  "life advice": { action: "companion_advice", response: "" },
  "give me advice": { action: "companion_advice", response: "" },
  "how am i doing": { action: "companion_progress", response: "" },
  "my tasks": { action: "companion_tasks", response: "" },
  "what are my tasks": { action: "companion_tasks", response: "" },
  "check in": { action: "companion_wellbeing", response: "" },
  "wellbeing check": { action: "companion_wellbeing", response: "" },
  "how to make friends": { action: "companion_social", response: "" },
  "help me with people": { action: "companion_social", response: "" },
  "call wave cloud": { action: "companion_call", response: "" },
};

// ─── Fuzzy match helper ──────────────────────────────────────────────────────

function findBestAction(input: string): { route?: string; action?: string; response: string } | null {
  const normalized = input.toLowerCase().trim();
  if (normalized.includes("connect me") || normalized === "connect me") {
    return { action: "wake_up", response: "" };
  }
  if (ACTION_MAP[normalized]) return ACTION_MAP[normalized];
  for (const [key, value] of Object.entries(ACTION_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  const keywords: Record<string, string> = {
    setting: "go to settings",
    profile: "go to profile",
    home: "go home",
    message: "open messages",
    call: "open calls",
    explore: "open explore",
    translat: "open translate",
    song: "open songs",
    learn: "open learn",
    lesson: "open lessons",
    calendar: "open calendar",
    subscri: "open subscription",
    upgrade: "upgrade plan",
    studio: "open studio",
    record: "open studio",
    cover: "record a cover",
    class: "open classroom",
    job: "open jobs",
    career: "open jobs",
    url: "translate url",
    battle: "battle mode",
    vacation: "vacation mode",
    capsule: "time capsule",
    pronunc: "practice pronunciation",
    video: "video call",
    voice: "voice call",
    reverb: "add reverb",
    mute: "mute",
    unmute: "unmute",
    credit: "check credits",
    streak: "my streak",
    schedule: "schedule class",
    tutor: "book tutor",
    upload: "upload song",
    "what's new": "what's new",
    slang: "teach me slang",
    today: "what do i have today",
    "set up": "set up translator",
    "configure": "configure translator",
    "default translator": "set up translator",
    stem: "separate stems",
    separate: "separate stems",
    bounce: "bounce out",
    "vocal translat": "translate vocals",
    library: "open library",
    employer: "employer portal",
    recruit: "employer portal",
    "hire real": "hire real",
    candidate: "search candidates",
    interview: "start interview",
    "post job": "post job",
    motivat: "motivate me",
    advice: "life advice",
    progress: "how am i doing",
    task: "my tasks",
    wellbeing: "wellbeing check",
    "check in": "check in",
    "make friend": "how to make friends",
    social: "how to make friends",
    influence: "how to make friends",
  };
  for (const [keyword, actionKey] of Object.entries(keywords)) {
    if (normalized.includes(keyword)) {
      return ACTION_MAP[actionKey];
    }
  }
  return null;
}

// ─── AI Context Builder ─────────────────────────────────────────────────────

const MOOD_MAP: Record<string, "great" | "good" | "okay" | "tired" | "stressed" | "sad" | "anxious" | "unknown"> = {
  energized: "great",
  excited: "great",
  calm: "good",
  neutral: "okay",
  tired: "tired",
  stressed: "stressed",
  frustrated: "stressed",
};

/**
 * Build a summary string of journal analytics insights for Cloud Wave to reference.
 * Reads recent journal entries and computes trends.
 */
async function buildJournalInsightsString(): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem("@student_journal_entries");
    if (!raw) return "";
    const entries = JSON.parse(raw) as Array<{
      timestamp: number;
      overallScore: number;
      corrections: Array<{ original: string; corrected: string; explanation: string }>;
      newVocab: Array<{ word: string; meaning: string }>;
      text: string;
    }>;
    if (entries.length < 2) return "";

    // Sort by most recent
    const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    const recent = sorted.slice(0, 10);
    const older = sorted.slice(10, 20);

    // Calculate trends
    const recentAvgScore = recent.reduce((sum, e) => sum + (e.overallScore || 0), 0) / recent.length;
    const recentAvgErrors = recent.reduce((sum, e) => sum + (e.corrections?.length || 0), 0) / recent.length;
    const totalVocab = recent.reduce((sum, e) => sum + (e.newVocab?.length || 0), 0);
    const totalEntries = entries.length;

    let insights = `Journal stats: ${totalEntries} entries total, avg score ${recentAvgScore.toFixed(1)}/10, avg ${recentAvgErrors.toFixed(1)} corrections per entry, ${totalVocab} new words learned recently.`;

    // Compare to older entries if available
    if (older.length >= 3) {
      const olderAvgScore = older.reduce((sum, e) => sum + (e.overallScore || 0), 0) / older.length;
      const olderAvgErrors = older.reduce((sum, e) => sum + (e.corrections?.length || 0), 0) / older.length;
      const scoreDiff = recentAvgScore - olderAvgScore;
      const errorDiff = olderAvgErrors - recentAvgErrors;

      if (scoreDiff > 0.5) insights += ` Score improved by ${scoreDiff.toFixed(1)} points recently!`;
      if (errorDiff > 0.5) insights += ` Errors dropped by ${(errorDiff / olderAvgErrors * 100).toFixed(0)}% compared to earlier entries!`;
      if (scoreDiff < -0.5) insights += ` Score dipped slightly recently — might need encouragement.`;
    }

    // Common error categories
    const allCorrections = recent.flatMap(e => e.corrections || []);
    const explanations = allCorrections.map(c => c.explanation?.toLowerCase() || "");
    const verbErrors = explanations.filter(e => e.includes("verb") || e.includes("conjugat")).length;
    const genderErrors = explanations.filter(e => e.includes("gender") || e.includes("masculine") || e.includes("feminine")).length;
    const spellingErrors = explanations.filter(e => e.includes("spell") || e.includes("accent")).length;

    if (verbErrors > 2) insights += ` Most common mistake: verb conjugation (${verbErrors} recent errors).`;
    else if (genderErrors > 2) insights += ` Most common mistake: gender agreement (${genderErrors} recent errors).`;
    else if (spellingErrors > 2) insights += ` Most common mistake: spelling/accents (${spellingErrors} recent errors).`;

    // Recent vocab mastered
    const recentWords = recent.flatMap(e => (e.newVocab || []).map(v => v.word)).slice(0, 5);
    if (recentWords.length > 0) insights += ` Recently learned words: ${recentWords.join(", ")}.`;

    return insights;
  } catch {
    return "";
  }
}

async function buildAIContext(): Promise<{
  studentName: string;
  studentMood: "great" | "good" | "okay" | "tired" | "stressed" | "sad" | "anxious" | "unknown";
  memoryContext: string;
  targetLanguage: string;
  nativeLanguage: string;
  targetDialect: string;
  learningLevel: string;
  daysSinceStart: number;
  currentStreak: number;
  recentStruggles: string[];
  recentWins: string[];
  journalInsights: string;
}> {
  try {
    const [memory, teacherMem, intelligence, gamification] = await Promise.all([
      loadMemory(),
      loadTeacherMemory(),
      loadIntelligence(),
      loadGamification(),
    ]);
    const [name, moodCtx, relationship, streakInfo, struggles, profile, companionCtx] = await Promise.all([
      teacherMem.getStudentName(),
      teacherMem.getMoodContext(),
      teacherMem.getRelationship(),
      gamification.getStreakInfo(),
      intelligence.getStruggles(),
      intelligence.getStudentProfile(),
      memory.getCompanionContext(),
    ]);
    const targetLang = (await AsyncStorage.getItem("@target_language")) || "Spanish";
    const nativeLang = (await AsyncStorage.getItem("@native_language")) || "English";
    const targetDialect = (await AsyncStorage.getItem("@target_dialect")) || "";
    const level = (await AsyncStorage.getItem("@cefr_level")) || "beginner";
    const mappedMood = moodCtx.currentMood ? (MOOD_MAP[moodCtx.currentMood] || "unknown") : "unknown";
    const recentStruggles = struggles.slice(0, 5).map((s) => `${s.topic} (${s.category}, ${s.accuracy}% accuracy)`);
    const recentWins: string[] = [];
    if (profile.strongAreas.length > 0) recentWins.push(`Strong in: ${profile.strongAreas.slice(0, 3).join(", ")}`);
    if (streakInfo.current > 0) recentWins.push(`${streakInfo.current}-day streak`);
    if (profile.overallAccuracy > 70) recentWins.push(`${profile.overallAccuracy}% overall accuracy`);
    if (profile.improvementRate > 0) recentWins.push(`Improving ${profile.improvementRate}% this week`);
    return {
      studentName: name,
      studentMood: mappedMood,
      memoryContext: companionCtx,
      targetLanguage: targetLang,
      nativeLanguage: nativeLang,
      targetDialect,
      learningLevel: level,
      daysSinceStart: relationship.daysSinceStart,
      currentStreak: streakInfo.current,
      recentStruggles,
      recentWins,
      journalInsights: await buildJournalInsightsString(),
    };
  } catch {
    return {
      studentName: "there",
      studentMood: "unknown",
      memoryContext: "",
      targetLanguage: "Spanish",
      nativeLanguage: "English",
      targetDialect: "",
      learningLevel: "beginner",
      daysSinceStart: 0,
      currentStreak: 0,
      recentStruggles: [],
      recentWins: [],
      journalInsights: "",
    };
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const defaultState: AgentState = {
  visible: true,
  expanded: false,
  mode: "idle",
  transcript: "",
  voiceMode: true,
  floatingText: "",
  isAwake: false,
  showWellbeingCheckIn: false,
  messages: [
    {
      id: "welcome",
      role: "agent",
      text: "Hey! Say \"Connect me\" to wake me up. I'm your personal companion — I'll help with school, life, motivation, and anything you need. Always here for you.",
      timestamp: Date.now(),
    },
  ],
};

const AgentContext = createContext<AgentContextType>({
  agentState: defaultState,
  showAgent: () => {},
  hideAgent: () => {},
  toggleExpand: () => {},
  sendCommand: () => {},
  startListening: () => {},
  stopListening: () => {},
  wakeAgent: () => {},
  toggleVoiceMode: () => {},
});

export function useAgent() {
  return useContext(AgentContext);
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agentState, setAgentState] = useState<AgentState>({ ...defaultState, visible: true });
  const transcriptTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const floatingTextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageCountRef = useRef(0); // Track messages for periodic memory extraction
  const cachedContextRef = useRef<Awaited<ReturnType<typeof buildAIContext>> | null>(null);
  const contextLoadedRef = useRef(false);

  // Pre-load AI context on mount
  useEffect(() => {
    buildAIContext().then((ctx) => {
      cachedContextRef.current = ctx;
      contextLoadedRef.current = true;
    });
  }, []);

  // Load voice mode preference
  useEffect(() => {
    AsyncStorage.getItem("agent_voice_mode").then((val) => {
      if (val !== null) {
        setAgentState((prev) => ({ ...prev, voiceMode: val === "true" }));
      }
    });
  }, []);

  const showAgent = useCallback(() => {
    setAgentState((prev) => ({ ...prev, visible: true }));
  }, []);

  const hideAgent = useCallback(() => {
    setAgentState((prev) => ({ ...prev, expanded: false }));
  }, []);

  const toggleExpand = useCallback(() => {
    setAgentState((prev) => ({ ...prev, expanded: !prev.expanded }));
  }, []);

  const toggleVoiceMode = useCallback(() => {
    setAgentState((prev) => {
      const newMode = !prev.voiceMode;
      AsyncStorage.setItem("agent_voice_mode", String(newMode));
      return { ...prev, voiceMode: newMode };
    });
  }, []);

  const showFloatingText = useCallback((text: string, duration = 4000) => {
    if (floatingTextTimerRef.current) clearTimeout(floatingTextTimerRef.current);
    setAgentState((prev) => ({ ...prev, floatingText: text }));
    floatingTextTimerRef.current = setTimeout(() => {
      setAgentState((prev) => ({ ...prev, floatingText: "" }));
    }, duration);
  }, []);

  // ─── Companion Action Handlers ─────────────────────────────────────────────

  const handleCompanionAction = useCallback(async (action: string): Promise<string> => {
    const ctx = cachedContextRef.current || await buildAIContext();
    if (action === "companion_motivate") {
      // Send a motivational prompt to the AI
      try {
        const result = await vanillaClient.waveCloudChat.chat.mutate({
          message: "I need some motivation right now. Pump me up and remind me why I started this journey.",
          conversationHistory: [],
          memoryContext: ctx.memoryContext,
          personalityMode: "motivator",
          studentName: ctx.studentName,
          studentMood: ctx.studentMood,
          recentStruggles: ctx.recentStruggles,
          recentWins: ctx.recentWins,
          targetLanguage: ctx.targetLanguage,
          nativeLanguage: ctx.nativeLanguage,
          targetDialect: ctx.targetDialect,
          learningLevel: ctx.learningLevel,
          daysSinceStart: ctx.daysSinceStart,
          currentStreak: ctx.currentStreak,
          journalInsights: ctx.journalInsights,
        });
        return result.response as string;
      } catch {
        return `You've got this, ${ctx.studentName}! Every single day you show up is a win. Keep going!`;
      }
    }
    if (action === "companion_advice") {
      try {
        const result = await vanillaClient.waveCloudChat.chat.mutate({
          message: "I could use some life advice. Help me think about what's going on and how to handle things better.",
          conversationHistory: [],
          memoryContext: ctx.memoryContext,
          personalityMode: "life_advisor",
          studentName: ctx.studentName,
          studentMood: ctx.studentMood,
          recentStruggles: ctx.recentStruggles,
          recentWins: ctx.recentWins,
          targetLanguage: ctx.targetLanguage,
          nativeLanguage: ctx.nativeLanguage,
          targetDialect: ctx.targetDialect,
          learningLevel: ctx.learningLevel,
          daysSinceStart: ctx.daysSinceStart,
          currentStreak: ctx.currentStreak,
          journalInsights: ctx.journalInsights,
        });
        return result.response as string;
      } catch {
        return `Hey ${ctx.studentName}, I'm here for you. What's on your mind? Let's talk through it together.`;
      }
    }
    if (action === "companion_progress") {
      const parts: string[] = [];
      parts.push(`Hey ${ctx.studentName}! Here's how you're doing:`);
      if (ctx.currentStreak > 0) parts.push(`You're on a ${ctx.currentStreak}-day streak!`);
      if (ctx.recentWins.length > 0) parts.push(`Wins: ${ctx.recentWins.join(", ")}.`);
      if (ctx.recentStruggles.length > 0) parts.push(`Areas to work on: ${ctx.recentStruggles.slice(0, 2).map(s => s.split(" (")[0]).join(", ")}.`);
      if (ctx.daysSinceStart > 0) parts.push(`You've been on this journey for ${ctx.daysSinceStart} days. That's commitment!`);
      if (parts.length <= 1) parts.push("You're just getting started — every step counts. I'm tracking everything for you.");
      return parts.join(" ");
    }
    if (action === "companion_tasks") {
      try {
        const memory = await loadMemory();
        const [pending, overdue] = await Promise.all([
          memory.getPendingTasks(),
          memory.getOverdueTasks(),
        ]);
        if (pending.length === 0 && overdue.length === 0) {
          return `You're all caught up, ${ctx.studentName}! No pending tasks. Want me to help you set some goals?`;
        }
        const parts: string[] = [`Here's what's on your plate, ${ctx.studentName}:`];
        if (overdue.length > 0) {
          parts.push(`Overdue: ${overdue.map(t => t.task).join(", ")}.`);
        }
        if (pending.length > 0) {
          parts.push(`Pending: ${pending.slice(0, 5).map(t => t.task).join(", ")}.`);
        }
        parts.push("Want me to help you prioritize?");
        return parts.join(" ");
      } catch {
        return "Let me check your tasks... I'm having a moment. Try again in a sec!";
      }
    }
    if (action === "companion_social") {
      try {
        const result = await vanillaClient.waveCloudChat.chat.mutate({
          message: "I want to get better at making friends and connecting with people. Give me real, practical advice on how to make friends and influence people.",
          conversationHistory: [],
          memoryContext: ctx.memoryContext,
          personalityMode: "life_advisor",
          studentName: ctx.studentName,
          studentMood: ctx.studentMood,
          recentStruggles: [],
          recentWins: [],
          targetLanguage: ctx.targetLanguage,
          nativeLanguage: ctx.nativeLanguage,
          targetDialect: ctx.targetDialect,
          learningLevel: ctx.learningLevel,
          daysSinceStart: ctx.daysSinceStart,
          currentStreak: ctx.currentStreak,
          journalInsights: ctx.journalInsights,
        });
        return result.response as string;
      } catch {
        return `${ctx.studentName}, the secret to making friends is genuine interest. Ask people about themselves, remember what they say, and follow up. People love someone who truly listens.`;
      }
    }
    if (action === "companion_call") {
      setTimeout(() => {
        router.push({ pathname: "/hume-call", params: { mode: "cloudwave", persona: "cloudwave" } } as any);
      }, 500);
      return `Starting a voice call with me now! We can talk about anything — school, life, goals, or just hang out.`;
    }
    return "";
  }, []);

  // ─── Proactive response handler ────────────────────────────────────────────

  const handleProactiveAction = useCallback((action: string): string => {
    if (action === "wake_up") {
      const greeting = getProactiveGreeting();
      const schedule = getUpcomingSchedule();
      let response = greeting;
      if (schedule.length > 1) {
        response += ` Also, "${schedule[1].title}" is ${schedule[1].time}.`;
      }
      response += " What would you like to do?";
      return response;
    }
    if (action === "schedule_check") {
      const schedule = getUpcomingSchedule();
      if (schedule.length === 0) return "Your schedule is clear! Want me to suggest something to learn?";
      return `Here's what's coming up: ${schedule.map((s) => `"${s.title}" (${s.time})`).join(", ")}. Want me to take you to any of these?`;
    }
    if (action === "suggest_feature") {
      const suggestion = FEATURE_SUGGESTIONS[Math.floor(Math.random() * FEATURE_SUGGESTIONS.length)];
      return `${suggestion.text} Want me to take you there?`;
    }
    if (action === "slang_word") {
      const slang = SLANG_WORDS[Math.floor(Math.random() * SLANG_WORDS.length)];
      return `Today's slang: "${slang.word}" (${slang.language}) means "${slang.meaning}". Example: "${slang.example}"`;
    }
    if (action === "whats_new") {
      return "Here's what's new: Daily challenges rotate with 7 types now, you can earn milestone bonuses, and the leaderboard has new categories. Want me to show you?";
    }
    if (action === "agent_translator_setup") {
      return "I can set up ConnectWorld AI as your default iOS translator automatically! Taking you to the setup now...";
    }
    if (action === "check_streak") {
      // Will be replaced with real data in sendCommand
      return "";
    }
    return "";
  }, []);

  // ─── Wake the agent ────────────────────────────────────────────────────────

  const wakeAgent = useCallback(() => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAgentState((prev) => ({ ...prev, isAwake: true, mode: "awake" }));
    setTimeout(() => {
      const greeting = handleProactiveAction("wake_up");
      const agentMsg: AgentMessage = {
        id: `agent-wake-${Date.now()}`,
        role: "agent",
        text: greeting,
        timestamp: Date.now(),
      };
      setAgentState((prev) => ({
        ...prev,
        messages: [...prev.messages, agentMsg],
        mode: "speaking",
      }));
      showFloatingText(greeting, 6000);
      setTimeout(() => {
        setAgentState((prev) => ({ ...prev, mode: "listening" }));
        setTimeout(() => {
          setAgentState((prev) => {
            if (prev.mode === "listening") return { ...prev, mode: "idle" };
            return prev;
          });
        }, 5000);
      }, 2000);
    }, 500);
  }, [handleProactiveAction, showFloatingText]);

  // ─── Send Command (AI-powered) ─────────────────────────────────────────────

  const sendCommand = useCallback(async (text: string) => {
    const userMsg: AgentMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      timestamp: Date.now(),
    };
    setAgentState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      mode: "thinking",
      transcript: "",
    }));

    // Record user message in memory (fire-and-forget)
    loadMemory().then((m) => m.recordMessage("user", text)).catch(() => {});

    // Check for direct action match first
    const result = findBestAction(text);
    let agentResponse: AgentMessage;

    if (result) {
      // Companion actions (async AI calls)
      const companionActions = ["companion_motivate", "companion_advice", "companion_progress", "companion_tasks", "companion_social", "companion_call"];
      if (result.action && companionActions.includes(result.action)) {
        try {
          const responseText = await handleCompanionAction(result.action);
          agentResponse = {
            id: `agent-${Date.now()}`,
            role: "agent",
            text: responseText as string,
            action: result.action,
            timestamp: Date.now(),
          };
        } catch {
          agentResponse = {
            id: `agent-${Date.now()}`,
            role: "agent",
            text: "I'm having a moment — give me a second and try again.",
            timestamp: Date.now(),
          };
        }
      } else if (result.action === "companion_wellbeing") {
        // Open wellbeing check-in modal
        setAgentState((prev) => ({ ...prev, showWellbeingCheckIn: true }));
        agentResponse = {
          id: `agent-${Date.now()}`,
          role: "agent",
          text: "Let's do a quick check-in! How are you feeling?",
          action: "wellbeing_check",
          timestamp: Date.now(),
        };
      } else if (result.action && ["wake_up", "schedule_check", "suggest_feature", "slang_word", "whats_new", "agent_translator_setup", "check_streak"].includes(result.action)) {
        let proactiveText = handleProactiveAction(result.action);
        if (result.action === "check_streak") {
          try {
            const gamification = await loadGamification();
            const streak = await gamification.getStreakInfo();
            proactiveText = streak.current > 0
              ? `You're on a ${streak.current}-day streak! Your longest is ${streak.longest} days. Keep it up!`
              : "No active streak yet — start one today! Even 5 minutes counts.";
          } catch {
            proactiveText = "Let me check your streak... Try again in a moment!";
          }
        }
        agentResponse = {
          id: `agent-${Date.now()}`,
          role: "agent",
          text: proactiveText,
          action: result.action,
          timestamp: Date.now(),
        };
        if (result.action === "wake_up") {
          setAgentState((prev) => ({ ...prev, isAwake: true }));
        }
        if (result.action === "agent_translator_setup") {
          setTimeout(() => router.push("/cloudwave-translator-setup" as any), 1200);
        }
      } else {
        agentResponse = {
          id: `agent-${Date.now()}`,
          role: "agent",
          text: result.response as string,
          action: result.route || result.action,
          timestamp: Date.now(),
        };
        if (result.route) {
          showFloatingText("Taking you there...", 2000);
          setTimeout(() => router.push(result.route as any), 800);
        }
      }
    } else {
      // ─── AI Conversational Fallback (real LLM call) ──────────────────────
      try {
        const ctx = cachedContextRef.current || await buildAIContext();
        // Build conversation history from recent messages
        const recentMsgs = agentState.messages.slice(-10);
        const conversationHistory = recentMsgs
          .filter((m) => m.id !== "welcome")
          .map((m) => ({
            role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
            content: m.text,
          }));
        const aiResult = await vanillaClient.waveCloudChat.chat.mutate({
          message: text,
          conversationHistory,
          memoryContext: ctx.memoryContext,
          personalityMode: "auto",
          studentName: ctx.studentName,
          studentMood: ctx.studentMood,
          recentStruggles: ctx.recentStruggles,
          recentWins: ctx.recentWins,
          targetLanguage: ctx.targetLanguage,
          nativeLanguage: ctx.nativeLanguage,
          targetDialect: ctx.targetDialect,
          learningLevel: ctx.learningLevel,
          daysSinceStart: ctx.daysSinceStart,
          currentStreak: ctx.currentStreak,
          journalInsights: ctx.journalInsights,
        });
        let responseText = aiResult.response;
        if (aiResult.suggestedFollowUp) {
          responseText += `\n\n${aiResult.suggestedFollowUp}`;
        }
        agentResponse = {
          id: `agent-${Date.now()}`,
          role: "agent",
          text: responseText as string,
          timestamp: Date.now(),
        };
        // Record AI response in memory
        loadMemory().then((m) => m.recordMessage("wave_cloud", responseText as string, {
          companionMode: aiResult.mode as any,
          isMemoryWorthy: aiResult.shouldRemember,
        })).catch(() => {});
        // Periodic memory extraction (every 6 messages)
        messageCountRef.current += 1;
        if (messageCountRef.current % 6 === 0) {
          const extractHistory = [...conversationHistory, { role: "user" as const, content: text }, { role: "assistant" as const, content: responseText as string }];
          vanillaClient.waveCloudChat.extractMemories.mutate({
            conversation: extractHistory,
            existingMemories: ctx.memoryContext,
          }).then(async (extracted) => {
            if (extracted.memories && extracted.memories.length > 0) {
              const memory = await loadMemory();
              for (const mem of extracted.memories) {
                if (mem.type === "goal") await memory.recordLifeGoal(mem.content);
                else if (mem.type === "struggle") await memory.recordLifeChallenge(mem.content);
                else if (mem.type === "personal_detail" || mem.type === "preference") {
                  await memory.recordCoachingInsight(
                    "growth",
                    mem.content,
                    "conversation_extraction"
                  );
                }
              }
            }
          }).catch(() => {});
        }
        // Refresh cached context after AI call
        buildAIContext().then((ctx) => { cachedContextRef.current = ctx; }).catch(() => {});
      } catch {
        // Graceful fallback if AI call fails
        const lowerText = text.toLowerCase();
        let fallbackText = "";
        if (lowerText.includes("yes") || lowerText.includes("yeah") || lowerText.includes("sure")) {
          const suggestion = FEATURE_SUGGESTIONS[Math.floor(Math.random() * FEATURE_SUGGESTIONS.length)];
          fallbackText = "Let me take you there!";
          setTimeout(() => router.push(suggestion.route as any), 800);
        } else if (lowerText.includes("no") || lowerText.includes("nah")) {
          fallbackText = "No problem! Let me know if you need anything else.";
        } else {
          fallbackText = "I'm here for you! Try asking me anything — about school, life, motivation, or just say what's on your mind. I'm also great at navigating the app for you.";
        }
        agentResponse = {
          id: `agent-${Date.now()}`,
          role: "agent",
          text: fallbackText,
          timestamp: Date.now(),
        };
      }
    }

    setAgentState((prev) => ({
      ...prev,
      messages: [...prev.messages, agentResponse],
      mode: "speaking",
    }));
    if (agentResponse.text) {
      showFloatingText(agentResponse.text, 5000);
    }
    setTimeout(() => {
      setAgentState((prev) => ({ ...prev, mode: "idle" }));
    }, 2000);
  }, [handleProactiveAction, handleCompanionAction, showFloatingText, agentState.messages]);

  // ─── Voice Listening (simulated) ───────────────────────────────────────────

  const startListening = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAgentState((prev) => ({ ...prev, mode: "listening", transcript: "" }));
    const phrases = [
      "Connect me...",
      "What's on my schedule...",
      "Open the song library...",
      "Show me something new...",
      "Motivate me...",
      "How am I doing...",
      "Teach me some slang...",
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    const words = phrase.split(" ");
    let wordIndex = 0;
    transcriptTimerRef.current = setInterval(() => {
      wordIndex++;
      if (wordIndex <= words.length) {
        setAgentState((prev) => ({
          ...prev,
          transcript: words.slice(0, wordIndex).join(" "),
        }));
      } else {
        if (transcriptTimerRef.current) clearInterval(transcriptTimerRef.current);
        const finalText = phrase.replace("...", "").trim();
        if (finalText.toLowerCase().includes("connect me")) {
          setAgentState((prev) => ({ ...prev, transcript: "", mode: "awake" }));
          setTimeout(() => wakeAgent(), 300);
        } else {
          setAgentState((prev) => ({ ...prev, mode: "thinking" }));
          setTimeout(() => {
            sendCommand(finalText);
          }, 400);
        }
      }
    }, 500);
  }, [wakeAgent, sendCommand]);

  const stopListening = useCallback(() => {
    if (transcriptTimerRef.current) {
      clearInterval(transcriptTimerRef.current);
      transcriptTimerRef.current = null;
    }
    setAgentState((prev) => ({ ...prev, mode: "idle", transcript: "" }));
  }, []);

  // ─── Wellbeing Check-In Handlers ───────────────────────────────────────────

  const handleWellbeingComplete = useCallback(async (entry: Omit<WellbeingEntry, "timestamp">) => {
    setAgentState((prev) => ({ ...prev, showWellbeingCheckIn: false }));
    try {
      const [memory, outreach] = await Promise.all([loadMemory(), loadOutreach()]);
      await memory.recordWellbeing(entry);
      await outreach.recordCheckInCompleted();
      // Refresh context
      buildAIContext().then((ctx) => { cachedContextRef.current = ctx; }).catch(() => {});
    } catch {}
    // Add a supportive message based on the check-in
    const moodText = entry.overallMood >= 7 ? "glad you're doing well" : entry.overallMood >= 4 ? "thanks for sharing" : "I'm here for you";
    const agentMsg: AgentMessage = {
      id: `agent-checkin-${Date.now()}`,
      role: "agent",
      text: `Check-in recorded! I'm ${moodText}. I'll remember this and check back with you later. Anything you want to talk about?`,
      timestamp: Date.now(),
    };
    setAgentState((prev) => ({ ...prev, messages: [...prev.messages, agentMsg] }));
  }, []);

  const handleWellbeingDismiss = useCallback(async () => {
    setAgentState((prev) => ({ ...prev, showWellbeingCheckIn: false }));
    try {
      const outreach = await loadOutreach();
      await outreach.recordCheckInDismissed();
    } catch {}
  }, []);

  return (
    <AgentContext.Provider
      value={{ agentState, showAgent, hideAgent, toggleExpand, sendCommand, startListening, stopListening, wakeAgent, toggleVoiceMode }}
    >
      {children}
      <AgentOverlay />
      <WellbeingCheckIn
        visible={agentState.showWellbeingCheckIn}
        onComplete={handleWellbeingComplete}
        onDismiss={handleWellbeingDismiss}
        studentName={cachedContextRef.current?.studentName}
      />
    </AgentContext.Provider>
  );
}

// ─── Siri-like Orb Glow Component ───────────────────────────────────────────

function SiriOrb({ mode, size = "small" }: { mode: AgentMode; size?: "small" | "large" }) {
  const orbSize = size === "small" ? 52 : 80;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mode === "idle") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.5, duration: 2000, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: false }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.03, duration: 2000, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
      Animated.timing(ringAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    } else if (mode === "listening") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.6, duration: 400, useNativeDriver: false }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.12, duration: 300, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1.04, duration: 300, useNativeDriver: true }),
        ])
      ).start();
      Animated.timing(ringAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    } else if (mode === "thinking") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.8, duration: 600, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 600, useNativeDriver: false }),
        ])
      ).start();
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 200, useNativeDriver: true }).start();
      Animated.timing(ringAnim, { toValue: 0.5, duration: 200, useNativeDriver: false }).start();
    } else if (mode === "speaking") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.9, duration: 250, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.5, duration: 250, useNativeDriver: false }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.08, duration: 250, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ])
      ).start();
      Animated.timing(ringAnim, { toValue: 0.7, duration: 200, useNativeDriver: false }).start();
    } else if (mode === "awake") {
      Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 300, useNativeDriver: true }).start();
      Animated.timing(ringAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
      setTimeout(() => {
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 300, useNativeDriver: true }).start();
      }, 400);
    }
  }, [mode]);

  const glowColor = mode === "listening" ? Colors.secondary
    : mode === "speaking" ? Colors.gold
    : mode === "thinking" ? Colors.glow
    : mode === "awake" ? "#00FF88"
    : Colors.secondary;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <Animated.View
        style={{
          position: "absolute",
          width: orbSize + 20,
          height: orbSize + 20,
          borderRadius: (orbSize + 20) / 2,
          top: -10,
          left: -10,
          borderWidth: 2,
          borderColor: glowColor,
          opacity: ringAnim,
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 15,
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          width: orbSize + 10,
          height: orbSize + 10,
          borderRadius: (orbSize + 10) / 2,
          top: -5,
          left: -5,
          borderWidth: 1.5,
          borderColor: glowColor,
          opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.5] }),
        }}
      />
      <Animated.View
        style={{
          width: orbSize,
          height: orbSize,
          borderRadius: orbSize / 2,
          backgroundColor: "rgba(10, 22, 40, 0.95)",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: glowColor,
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: glowAnim,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        <WaveformBars mode={mode} size={size} />
      </Animated.View>
    </Animated.View>
  );
}

// ─── Waveform Bars Component ─────────────────────────────────────────────────

function WaveformBars({ mode, size = "small" }: { mode: AgentMode; size?: "small" | "large" }) {
  const barCount = size === "small" ? 9 : 11;
  const barHeight = size === "small" ? 24 : 30;
  const barWidth = size === "small" ? 2.5 : 3.5;
  const gap = size === "small" ? 1.5 : 2;

  const animatedHeights = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.3))
  ).current;

  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  React.useEffect(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }

    if (mode === "idle") {
      const animations = animatedHeights.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 0.2 + (i % 2 === 0 ? 0.15 : 0.25), duration: 1200 + i * 100, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0.3 + (i % 3 === 0 ? 0.1 : 0.05), duration: 1200 + i * 100, useNativeDriver: false }),
          ])
        )
      );
      animationRef.current = Animated.parallel(animations);
      animationRef.current.start();
    } else if (mode === "listening" || mode === "awake") {
      const animations = animatedHeights.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 0.5 + Math.random() * 0.5, duration: 200 + i * 50, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0.2 + Math.random() * 0.3, duration: 200 + i * 50, useNativeDriver: false }),
          ])
        )
      );
      animationRef.current = Animated.parallel(animations);
      animationRef.current.start();
    } else if (mode === "speaking") {
      const animations = animatedHeights.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 0.7 + Math.random() * 0.3, duration: 150 + i * 30, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0.1 + Math.random() * 0.3, duration: 150 + i * 30, useNativeDriver: false }),
          ])
        )
      );
      animationRef.current = Animated.parallel(animations);
      animationRef.current.start();
    } else if (mode === "thinking") {
      const animations = animatedHeights.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 0.4 + (i / barCount) * 0.4, duration: 600, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0.2, duration: 600, useNativeDriver: false }),
          ])
        )
      );
      animationRef.current = Animated.parallel(animations);
      animationRef.current.start();
    }

    return () => {
      if (animationRef.current) animationRef.current.stop();
    };
  }, [mode]);

  const BAR_COLORS = [Colors.gold, Colors.secondary, "#FFFFFF", Colors.gold, Colors.secondary, "#FFFFFF", Colors.gold, Colors.secondary, "#FFFFFF", Colors.gold, Colors.secondary];

  const getWaveformScale = (index: number, total: number) => {
    const center = (total - 1) / 2;
    const distance = Math.abs(index - center) / center;
    return 1 - distance * 0.5;
  };

  return (
    <View style={[waveStyles.container, { height: barHeight, gap }]}>
      {animatedHeights.map((anim, i) => {
        const waveScale = getWaveformScale(i, barCount);
        return (
          <Animated.View
            key={i}
            style={[
              waveStyles.bar,
              {
                width: barWidth,
                backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                height: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [3, barHeight * waveScale],
                }),
                borderRadius: barWidth / 2,
                opacity: mode === "idle" ? 0.8 : 1,
                shadowColor: BAR_COLORS[i % BAR_COLORS.length],
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: mode === "idle" ? 0.3 : 0.7,
                shadowRadius: 3,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {},
});

// ─── Agent Overlay ───────────────────────────────────────────────────────────

function AgentOverlay() {
  const { agentState, toggleExpand, sendCommand, startListening, stopListening, hideAgent, wakeAgent, toggleVoiceMode } = useAgent();
  const pan = useRef(new Animated.ValueXY({ x: 8, y: SCREEN_HEIGHT - 200 })).current;
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const lastTapRef = useRef<number>(0);

  const handleBubblePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      lastTapRef.current = 0;
      toggleExpand();
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (Date.now() - now >= DOUBLE_TAP_DELAY - 10) {
          if (agentState.mode === "listening") {
            stopListening();
          } else if (agentState.mode === "idle" && !agentState.isAwake) {
            wakeAgent();
          } else if (agentState.mode === "idle") {
            startListening();
          }
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        const currentX = (pan.x as any)._value;
        const snapX = currentX < SCREEN_WIDTH / 2 ? 12 : SCREEN_WIDTH - 72;
        Animated.spring(pan.x, { toValue: snapX, useNativeDriver: false, friction: 7 }).start();
        const currentY = (pan.y as any)._value;
        const clampedY = Math.max(80, Math.min(currentY, SCREEN_HEIGHT - 120));
        Animated.spring(pan.y, { toValue: clampedY, useNativeDriver: false, friction: 7 }).start();
      },
    })
  ).current;

  const handleSend = () => {
    if (inputText.trim()) {
      sendCommand(inputText.trim());
      setInputText("");
    }
  };

  const handleMicPress = () => {
    if (agentState.mode === "listening") {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleCallPress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/hume-call", params: { mode: "cloudwave", persona: "cloudwave" } } as any);
  };

  // ─── Collapsed: Siri-like Orb with Floating Cloud Text ────────────────────
  if (!agentState.expanded) {
    return (
      <Animated.View
        style={[
          styles.bubbleContainer,
          { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
        ]}
        {...panResponder.panHandlers}
      >
        {agentState.floatingText !== "" && !agentState.voiceMode && (
          <View style={styles.floatingCloudBubble}>
            <Text style={styles.floatingCloudText} numberOfLines={3}>{agentState.floatingText}</Text>
            <View style={styles.floatingCloudArrow} />
          </View>
        )}
        {agentState.transcript !== "" && (
          <View style={styles.transcriptBubble}>
            <Text style={styles.transcriptText}>{agentState.transcript}</Text>
            <View style={styles.transcriptArrow} />
          </View>
        )}
        {agentState.mode !== "idle" && agentState.transcript === "" && agentState.floatingText === "" && (
          <View style={styles.modeLabel}>
            <Text style={styles.modeLabelText}>
              {agentState.mode === "listening" ? "Listening..."
                : agentState.mode === "thinking" ? "Thinking..."
                : agentState.mode === "speaking" ? "Speaking..."
                : agentState.mode === "awake" ? "Hey!"
                : ""}
            </Text>
          </View>
        )}
        {!agentState.isAwake && agentState.mode === "idle" && (
          <View style={styles.wakeHint}>
            <Text style={styles.wakeHintText}>Say "Connect me"</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.bubble}
          onPress={handleBubblePress}
          activeOpacity={0.85}
        >
          <View style={styles.bubbleGlowRing} />
          <SiriOrb mode={agentState.mode} size="small" />
          <View
            style={[
              styles.modeDot,
              {
                backgroundColor:
                  agentState.mode === "listening" ? Colors.secondary
                    : agentState.mode === "speaking" ? Colors.gold
                    : agentState.mode === "thinking" ? Colors.glow
                    : agentState.mode === "awake" ? "#00FF88"
                    : agentState.isAwake ? Colors.success
                    : Colors.textMuted,
              },
            ]}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ─── Expanded: Chat Panel with Siri Orb Header ────────────────────────────
  return (
    <View style={styles.expandedOverlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.expandedContainer}
      >
        {/* Header */}
        <View style={styles.expandedHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.headerWaveform}>
              <SiriOrb mode={agentState.mode} size="small" />
            </View>
            <View>
              <BrandName size="lg" glow />
              <Text style={styles.headerSubtitle}>
                {agentState.mode === "listening" ? "Listening..."
                  : agentState.mode === "thinking" ? "Thinking..."
                  : agentState.mode === "speaking" ? "Speaking..."
                  : agentState.mode === "awake" ? "Ready!"
                  : agentState.isAwake ? "Your personal companion" : 'Say "Connect me" to start'}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {/* Call Wave Cloud button */}
            <TouchableOpacity style={styles.callBtn} onPress={handleCallPress}>
              <Ionicons name="call" size={16} color={Colors.success} />
            </TouchableOpacity>
            {/* Voice/Text mode toggle */}
            <TouchableOpacity style={styles.headerBtn} onPress={toggleVoiceMode}>
              <Ionicons
                name={agentState.voiceMode ? "volume-high" : "text"}
                size={16}
                color={agentState.voiceMode ? Colors.secondary : Colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={toggleExpand}>
              <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Transcript Area */}
        {agentState.mode === "listening" && agentState.transcript !== "" && (
          <View style={styles.liveTranscriptBar}>
            <View style={styles.liveTranscriptDot} />
            <Text style={styles.liveTranscriptText}>{agentState.transcript}</Text>
          </View>
        )}

        {/* Thinking indicator */}
        {agentState.mode === "thinking" && (
          <View style={styles.thinkingBar}>
            <ActivityIndicator size="small" color={Colors.secondary} />
            <Text style={styles.thinkingText}>Wave Cloud is thinking...</Text>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={agentState.messages}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.role === "user" ? styles.userBubble : styles.agentBubble,
              ]}
            >
              {item.role === "agent" && (
                <View style={styles.agentIcon}>
                  <WaveformBars mode="idle" size="small" />
                </View>
              )}
              <View
                style={[
                  styles.messageContent,
                  item.role === "user" ? styles.userContent : styles.agentContent,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.role === "user" ? styles.userText : styles.agentText,
                  ]}
                >
                  {item.text}
                </Text>
                {item.action && (
                  <View style={styles.actionTag}>
                    <Ionicons name="arrow-forward-circle" size={12} color={Colors.secondary} />
                    <Text style={styles.actionTagText}>
                      {item.action.startsWith("/") ? "Navigating..." : item.action === "wake_up" ? "Awake!" : item.action.startsWith("companion_") ? "Companion" : "Processing..."}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        />

        {/* Quick Actions — Companion-focused */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.quickBtn, styles.quickBtnHighlight]} onPress={() => sendCommand("motivate me")}>
              <Ionicons name="flash-outline" size={14} color={Colors.gold} />
              <Text style={[styles.quickBtnText, { color: Colors.gold }]}>Motivate Me</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => sendCommand("life advice")}>
              <Ionicons name="bulb-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.quickBtnText}>Life Advice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => sendCommand("how am i doing")}>
              <Ionicons name="trending-up-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.quickBtnText}>My Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => sendCommand("my tasks")}>
              <Ionicons name="checkbox-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.quickBtnText}>My Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => sendCommand("check in")}>
              <Ionicons name="heart-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.quickBtnText}>Check In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => sendCommand("how to make friends")}>
              <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.quickBtnText}>Social Skills</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => sendCommand("what's on my schedule")}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.quickBtnText}>Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => sendCommand("teach me slang")}>
              <Ionicons name="chatbubble-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.quickBtnText}>Slang</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder={agentState.isAwake ? "Talk to me about anything..." : 'Type "Connect me" to start...'}
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                styles.micButton,
                agentState.mode === "listening" && styles.micButtonActive,
              ]}
              onPress={handleMicPress}
            >
              <Ionicons
                name={agentState.mode === "listening" ? "radio" : "mic"}
                size={20}
                color={agentState.mode === "listening" ? Colors.secondary : Colors.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={18} color={inputText.trim() ? Colors.textPrimary : Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.inputHint}>
            Therapist · Coach · Motivator · Friend — I remember everything
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bubbleContainer: {
    position: "absolute",
    zIndex: 9998,
    elevation: 9998,
    alignItems: "center",
  },
  bubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleGlowRing: {
    position: "absolute",
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1.5,
    borderColor: "rgba(0, 170, 255, 0.25)",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  modeDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#0A1628",
  },
  floatingCloudBubble: {
    position: "absolute",
    bottom: 76,
    backgroundColor: "rgba(10, 22, 40, 0.95)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    maxWidth: 220,
    alignSelf: "center",
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  floatingCloudText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
    textAlign: "center",
  },
  floatingCloudArrow: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    left: "50%",
    marginLeft: -6,
    width: 12,
    height: 12,
    backgroundColor: "rgba(10, 22, 40, 0.95)",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.goldBorder,
    transform: [{ rotate: "45deg" }],
  },
  transcriptBubble: {
    position: "absolute",
    bottom: 76,
    backgroundColor: "rgba(10, 22, 40, 0.95)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    maxWidth: 200,
    alignSelf: "center",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  transcriptText: {
    fontSize: FontSize.sm,
    color: Colors.glow,
    fontWeight: "600",
    textAlign: "center",
  },
  transcriptArrow: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    left: "50%",
    marginLeft: -6,
    width: 12,
    height: 12,
    backgroundColor: "rgba(10, 22, 40, 0.95)",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.glowBorder,
    transform: [{ rotate: "45deg" }],
  },
  modeLabel: {
    position: "absolute",
    bottom: 76,
    backgroundColor: "rgba(10, 22, 40, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeLabelText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  wakeHint: {
    position: "absolute",
    bottom: 76,
    backgroundColor: "rgba(10, 22, 40, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.3)",
  },
  wakeHintText: {
    fontSize: 10,
    color: "#00FF88",
    fontWeight: "600",
  },
  expandedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
    elevation: 9998,
    backgroundColor: "rgba(2, 4, 6, 0.85)",
  },
  expandedContainer: {
    flex: 1,
    marginTop: Platform.OS === "ios" ? 60 : 40,
    marginHorizontal: 12,
    marginBottom: Platform.OS === "ios" ? 34 : 12,
    backgroundColor: "rgba(10, 22, 40, 0.98)",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.glowBorder,
    overflow: "hidden",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  expandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: "rgba(14, 30, 56, 0.6)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerWaveform: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "400",
    fontFamily: "GreatVibes-Regular",
    color: Colors.textPrimary,
  },
  headerAiScript: {
    fontStyle: "italic",
    fontWeight: "300",
    fontSize: 18,
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(126, 184, 224, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  callBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 255, 136, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.35)",
  },
  liveTranscriptBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(0, 170, 255, 0.06)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 170, 255, 0.15)",
  },
  liveTranscriptDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  liveTranscriptText: {
    fontSize: FontSize.sm,
    color: Colors.glow,
    fontWeight: "600",
    fontStyle: "italic",
  },
  thinkingBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(0, 170, 255, 0.04)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 170, 255, 0.10)",
  },
  thinkingText: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontStyle: "italic",
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    flexDirection: "row",
    gap: 8,
    maxWidth: "90%",
  },
  userBubble: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  agentBubble: {
    alignSelf: "flex-start",
  },
  agentIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 170, 255, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.25)",
    marginTop: 2,
  },
  messageContent: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "85%",
  },
  userContent: {
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: 4,
  },
  agentContent: {
    backgroundColor: "rgba(14, 30, 56, 0.8)",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  userText: {
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  agentText: {
    color: Colors.textSecondary,
  },
  actionTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 170, 255, 0.15)",
  },
  actionTagText: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: "600",
  },
  quickActionsScroll: {
    maxHeight: 44,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(0, 170, 255, 0.06)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickBtnHighlight: {
    backgroundColor: "rgba(255, 184, 0, 0.08)",
    borderColor: Colors.goldBorder,
  },
  quickBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  inputArea: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 12 : 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: "rgba(14, 30, 56, 0.4)",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: "rgba(4, 8, 16, 0.6)",
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  micButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0, 170, 255, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.glowBorder,
  },
  micButtonActive: {
    backgroundColor: "rgba(0, 170, 255, 0.25)",
    borderColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(0, 170, 255, 0.15)",
  },
  inputHint: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 6,
  },
});
