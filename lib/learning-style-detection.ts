/**
 * Learning Style Detection System
 * 
 * Tracks which modality (visual, auditory, reading, kinesthetic) produces
 * the best retention for each student and weights future lessons toward
 * their strongest learning channel.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export type LearningModality = "visual" | "auditory" | "reading" | "kinesthetic";

export type ActivityModality = {
  activity: string;
  primaryModality: LearningModality;
  secondaryModality?: LearningModality;
};

export interface ModalityPerformance {
  modality: LearningModality;
  totalAttempts: number;
  correctAttempts: number;
  averageScore: number;
  averageRetention: number;    // How well they remember after 24h
  averageResponseTime: number; // ms
  engagementMinutes: number;   // Total time spent in this modality
  lastUsed: string;
}

export interface LearningStyleProfile {
  primaryStyle: LearningModality;
  secondaryStyle: LearningModality;
  styleConfidence: number;      // 0-100, how confident we are in the detection
  modalityScores: Record<LearningModality, number>; // 0-100 effectiveness
  performances: Record<LearningModality, ModalityPerformance>;
  detectionHistory: Array<{
    timestamp: string;
    primaryStyle: LearningModality;
    confidence: number;
  }>;
  recommendations: StyleRecommendation[];
  lastUpdated: string;
}

export interface StyleRecommendation {
  modality: LearningModality;
  weight: number;              // 0-1, how much of the lesson should use this modality
  reason: string;
  activities: string[];        // Suggested activity types
}

export interface LearningEvent {
  timestamp: string;
  activity: string;
  modality: LearningModality;
  score: number;               // 0-100
  responseTimeMs: number;
  completed: boolean;
  retentionScore?: number;     // 0-100, measured later
}

export interface ContentMix {
  visual: number;    // 0-1, percentage of content that should be visual
  auditory: number;  // 0-1
  reading: number;   // 0-1
  kinesthetic: number; // 0-1
}

// ─── Storage Keys ───────────────────────────────────────────────────────────

const PROFILE_KEY = "@learning_style_profile";
const EVENTS_KEY = "@learning_style_events";

// ─── Activity → Modality Mapping ────────────────────────────────────────────

const ACTIVITY_MODALITIES: ActivityModality[] = [
  { activity: "flashcard_image", primaryModality: "visual" },
  { activity: "flashcard_text", primaryModality: "reading" },
  { activity: "video_lesson", primaryModality: "visual", secondaryModality: "auditory" },
  { activity: "audio_lesson", primaryModality: "auditory" },
  { activity: "pronunciation", primaryModality: "auditory", secondaryModality: "kinesthetic" },
  { activity: "conversation", primaryModality: "auditory", secondaryModality: "kinesthetic" },
  { activity: "reading_passage", primaryModality: "reading" },
  { activity: "writing_exercise", primaryModality: "kinesthetic", secondaryModality: "reading" },
  { activity: "fill_blank", primaryModality: "kinesthetic" },
  { activity: "drag_drop", primaryModality: "kinesthetic", secondaryModality: "visual" },
  { activity: "matching_game", primaryModality: "visual", secondaryModality: "kinesthetic" },
  { activity: "listening_quiz", primaryModality: "auditory" },
  { activity: "picture_vocab", primaryModality: "visual" },
  { activity: "dictation", primaryModality: "auditory", secondaryModality: "kinesthetic" },
  { activity: "translation", primaryModality: "reading", secondaryModality: "kinesthetic" },
  { activity: "grammar_drill", primaryModality: "reading", secondaryModality: "kinesthetic" },
  { activity: "song_lyrics", primaryModality: "auditory", secondaryModality: "reading" },
  { activity: "story_reading", primaryModality: "reading", secondaryModality: "visual" },
];

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Record a learning event and update style detection
 */
export async function recordLearningEvent(event: Omit<LearningEvent, "timestamp">): Promise<LearningStyleProfile> {
  const fullEvent: LearningEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };
  
  // Save event
  const events = await getEvents();
  events.push(fullEvent);
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-300)));
  
  // Update profile
  const profile = await getOrCreateProfile();
  updateProfileFromEvents(profile, events.slice(-100));
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  
  return profile;
}

/**
 * Get the current learning style profile
 */
export async function getLearningStyleProfile(): Promise<LearningStyleProfile> {
  return getOrCreateProfile();
}

/**
 * Get recommended content mix for the next lesson
 */
export async function getRecommendedContentMix(): Promise<ContentMix> {
  const profile = await getOrCreateProfile();
  const scores = profile.modalityScores;
  
  // Normalize scores to create a weighted mix
  const total = Object.values(scores).reduce((sum, s) => sum + s, 0);
  if (total === 0) {
    // No data yet — equal distribution
    return { visual: 0.25, auditory: 0.25, reading: 0.25, kinesthetic: 0.25 };
  }
  
  // Weight toward strengths but maintain minimum exposure to all modalities
  const MIN_EXPOSURE = 0.1; // At least 10% of each modality
  const remaining = 1 - (MIN_EXPOSURE * 4);
  
  const mix: ContentMix = {
    visual: MIN_EXPOSURE + (scores.visual / total) * remaining,
    auditory: MIN_EXPOSURE + (scores.auditory / total) * remaining,
    reading: MIN_EXPOSURE + (scores.reading / total) * remaining,
    kinesthetic: MIN_EXPOSURE + (scores.kinesthetic / total) * remaining,
  };
  
  return mix;
}

/**
 * Get the modality for a specific activity type
 */
export function getActivityModality(activity: string): LearningModality {
  const mapping = ACTIVITY_MODALITIES.find(m => m.activity === activity);
  return mapping?.primaryModality || "reading";
}

/**
 * Get style-based activity suggestions
 */
export async function getSuggestedActivities(count: number = 5): Promise<string[]> {
  const profile = await getOrCreateProfile();
  const primaryActivities = ACTIVITY_MODALITIES
    .filter(a => a.primaryModality === profile.primaryStyle)
    .map(a => a.activity);
  const secondaryActivities = ACTIVITY_MODALITIES
    .filter(a => a.primaryModality === profile.secondaryStyle || a.secondaryModality === profile.primaryStyle)
    .map(a => a.activity);
  
  // Mix: 60% primary, 40% secondary
  const primaryCount = Math.ceil(count * 0.6);
  const secondaryCount = count - primaryCount;
  
  return [
    ...shuffleArray(primaryActivities).slice(0, primaryCount),
    ...shuffleArray(secondaryActivities).slice(0, secondaryCount),
  ];
}

/**
 * Record a retention check (measured 24h+ after learning)
 */
export async function recordRetentionCheck(
  originalEventTimestamp: string,
  retentionScore: number
): Promise<void> {
  const events = await getEvents();
  const event = events.find(e => e.timestamp === originalEventTimestamp);
  if (event) {
    event.retentionScore = retentionScore;
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    
    // Re-analyze with retention data
    const profile = await getOrCreateProfile();
    updateProfileFromEvents(profile, events.slice(-100));
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
}

/**
 * Get a human-readable style description
 */
export async function getStyleDescription(): Promise<{
  primary: string;
  secondary: string;
  description: string;
  tips: string[];
}> {
  const profile = await getOrCreateProfile();
  
  const descriptions: Record<LearningModality, string> = {
    visual: "You learn best through images, diagrams, and visual patterns. You remember what you see.",
    auditory: "You learn best through listening and speaking. Conversations and audio stick with you.",
    reading: "You learn best through reading and writing. Text-based content resonates with you.",
    kinesthetic: "You learn best by doing. Interactive exercises and hands-on practice work best for you.",
  };
  
  const tips: Record<LearningModality, string[]> = {
    visual: [
      "Use flashcards with images",
      "Watch videos with subtitles",
      "Create mental pictures for new words",
      "Use color-coding for grammar rules",
    ],
    auditory: [
      "Listen to podcasts in your target language",
      "Practice speaking aloud daily",
      "Use song lyrics for vocabulary",
      "Record yourself and listen back",
    ],
    reading: [
      "Read short stories at your level",
      "Keep a vocabulary journal",
      "Write sentences with new words",
      "Use grammar reference sheets",
    ],
    kinesthetic: [
      "Practice writing by hand",
      "Use drag-and-drop exercises",
      "Act out dialogues",
      "Type responses instead of selecting",
    ],
  };
  
  return {
    primary: capitalize(profile.primaryStyle),
    secondary: capitalize(profile.secondaryStyle),
    description: descriptions[profile.primaryStyle],
    tips: tips[profile.primaryStyle],
  };
}

/**
 * Check if we have enough data to confidently detect style
 */
export async function hasEnoughData(): Promise<boolean> {
  const events = await getEvents();
  return events.length >= 20;
}

/**
 * Reset style detection (start fresh)
 */
export async function resetStyleDetection(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_KEY);
  await AsyncStorage.removeItem(EVENTS_KEY);
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

async function getEvents(): Promise<LearningEvent[]> {
  const raw = await AsyncStorage.getItem(EVENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function getOrCreateProfile(): Promise<LearningStyleProfile> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (raw) return JSON.parse(raw);
  
  const defaultProfile: LearningStyleProfile = {
    primaryStyle: "visual",
    secondaryStyle: "auditory",
    styleConfidence: 0,
    modalityScores: { visual: 25, auditory: 25, reading: 25, kinesthetic: 25 },
    performances: {
      visual: createDefaultPerformance("visual"),
      auditory: createDefaultPerformance("auditory"),
      reading: createDefaultPerformance("reading"),
      kinesthetic: createDefaultPerformance("kinesthetic"),
    },
    detectionHistory: [],
    recommendations: [],
    lastUpdated: new Date().toISOString(),
  };
  
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(defaultProfile));
  return defaultProfile;
}

function createDefaultPerformance(modality: LearningModality): ModalityPerformance {
  return {
    modality,
    totalAttempts: 0,
    correctAttempts: 0,
    averageScore: 0,
    averageRetention: 0,
    averageResponseTime: 0,
    engagementMinutes: 0,
    lastUsed: new Date().toISOString(),
  };
}

function updateProfileFromEvents(profile: LearningStyleProfile, events: LearningEvent[]): void {
  // Group events by modality
  const byModality: Record<LearningModality, LearningEvent[]> = {
    visual: [], auditory: [], reading: [], kinesthetic: [],
  };
  
  for (const event of events) {
    byModality[event.modality].push(event);
  }
  
  // Calculate performance for each modality
  for (const [modality, modalityEvents] of Object.entries(byModality)) {
    const m = modality as LearningModality;
    if (modalityEvents.length === 0) continue;
    
    const perf = profile.performances[m];
    perf.totalAttempts = modalityEvents.length;
    perf.correctAttempts = modalityEvents.filter(e => e.score >= 70).length;
    perf.averageScore = Math.round(
      modalityEvents.reduce((sum, e) => sum + e.score, 0) / modalityEvents.length
    );
    perf.averageResponseTime = Math.round(
      modalityEvents.reduce((sum, e) => sum + e.responseTimeMs, 0) / modalityEvents.length
    );
    perf.engagementMinutes = Math.round(
      modalityEvents.reduce((sum, e) => sum + e.responseTimeMs, 0) / 60000
    );
    perf.lastUsed = modalityEvents[modalityEvents.length - 1].timestamp;
    
    // Retention (if available)
    const withRetention = modalityEvents.filter(e => e.retentionScore !== undefined);
    if (withRetention.length > 0) {
      perf.averageRetention = Math.round(
        withRetention.reduce((sum, e) => sum + (e.retentionScore || 0), 0) / withRetention.length
      );
    }
  }
  
  // Calculate modality effectiveness scores
  // Weighted: 40% accuracy, 30% retention, 20% engagement, 10% speed
  for (const modality of Object.keys(profile.performances) as LearningModality[]) {
    const perf = profile.performances[modality];
    if (perf.totalAttempts === 0) {
      profile.modalityScores[modality] = 25; // Default neutral
      continue;
    }
    
    const accuracyScore = perf.averageScore;
    const retentionScore = perf.averageRetention || perf.averageScore * 0.8;
    const engagementScore = Math.min(100, perf.engagementMinutes * 2);
    const speedScore = perf.averageResponseTime > 0
      ? Math.max(0, 100 - (perf.averageResponseTime / 500))
      : 50;
    
    profile.modalityScores[modality] = Math.round(
      accuracyScore * 0.4 + retentionScore * 0.3 + engagementScore * 0.2 + speedScore * 0.1
    );
  }
  
  // Determine primary and secondary styles
  const sorted = Object.entries(profile.modalityScores)
    .sort((a, b) => b[1] - a[1]);
  
  profile.primaryStyle = sorted[0][0] as LearningModality;
  profile.secondaryStyle = sorted[1][0] as LearningModality;
  
  // Calculate confidence based on data volume and score separation
  const totalEvents = events.length;
  const scoreDiff = sorted[0][1] - sorted[1][1];
  profile.styleConfidence = Math.min(100, Math.round(
    (Math.min(totalEvents, 50) / 50) * 60 + // Volume factor (max 60)
    Math.min(scoreDiff, 20) * 2              // Separation factor (max 40)
  ));
  
  // Generate recommendations
  profile.recommendations = generateRecommendations(profile);
  
  // Add to detection history
  profile.detectionHistory.push({
    timestamp: new Date().toISOString(),
    primaryStyle: profile.primaryStyle,
    confidence: profile.styleConfidence,
  });
  profile.detectionHistory = profile.detectionHistory.slice(-20);
  
  profile.lastUpdated = new Date().toISOString();
}

function generateRecommendations(profile: LearningStyleProfile): StyleRecommendation[] {
  const recs: StyleRecommendation[] = [];
  const sorted = Object.entries(profile.modalityScores).sort((a, b) => b[1] - a[1]);
  
  // Primary style recommendation
  recs.push({
    modality: sorted[0][0] as LearningModality,
    weight: 0.4,
    reason: `Your strongest learning channel (${sorted[0][1]}% effectiveness)`,
    activities: ACTIVITY_MODALITIES
      .filter(a => a.primaryModality === sorted[0][0])
      .map(a => a.activity)
      .slice(0, 4),
  });
  
  // Secondary style
  recs.push({
    modality: sorted[1][0] as LearningModality,
    weight: 0.3,
    reason: `Your secondary strength (${sorted[1][1]}% effectiveness)`,
    activities: ACTIVITY_MODALITIES
      .filter(a => a.primaryModality === sorted[1][0])
      .map(a => a.activity)
      .slice(0, 3),
  });
  
  // Weakest style (still include for balanced development)
  recs.push({
    modality: sorted[3][0] as LearningModality,
    weight: 0.15,
    reason: `Developing this channel will make you a more rounded learner`,
    activities: ACTIVITY_MODALITIES
      .filter(a => a.primaryModality === sorted[3][0])
      .map(a => a.activity)
      .slice(0, 2),
  });
  
  return recs;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
