/**
 * Viral Creator Content Templates
 * 
 * Analyzes the format/style of viral creators and generates content briefs
 * for producing similar-style educational reels.
 */

export interface CreatorProfile {
  id: string;
  handle: string;
  name: string;
  platform: "instagram" | "tiktok" | "youtube";
  location: string;
  language: string;
  dialect?: string;
  niche: string;
  followers: number;
  format: CreatorFormat;
  themes: string[];
  signatureExpressions: string[];
  educationalAdaptation: EducationalAdaptation;
}

export interface CreatorFormat {
  visualStyle: "talking_head" | "music_mix" | "street_interview" | "reaction" | "tutorial" | "montage" | "duet";
  hookStyle: "bold_statement" | "question" | "controversy" | "reveal" | "sound_hook" | "visual_hook";
  hookExample: string;
  durationRange: [number, number];
  textOverlay: "bold_captions" | "subtitles" | "key_phrases" | "none";
  ctaPattern: string;
  engagementDrivers: string[];
  audioStyle: "original_voice" | "trending_audio" | "background_beat" | "music_focused";
  postingFrequency: "daily" | "2-3_per_week" | "weekly";
  visualElements: string[];
}

export interface EducationalAdaptation {
  contentTypes: ("vocabulary" | "grammar" | "slang" | "pronunciation" | "culture" | "music_lyrics")[];
  targetLevel: "beginner" | "intermediate" | "advanced" | "all";
  hookAdaptation: string;
  ctaAdaptation: string;
  suggestedTeacherId?: string;
}

export interface ContentBrief {
  id: string;
  creatorProfileId: string;
  creatorHandle?: string;
  title: string;
  topic: string;
  language: string;
  script: ScriptSection[];
  visualDirection: string;
  audioDirection: string;
  textOverlays: string[];
  targetDuration: number;
  hashtags: string[];
  platformNotes: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface ScriptSection {
  timestamp: string;
  type: "hook" | "content" | "example" | "cta";
  text: string;
  visualNote?: string;
}

// ─── Creator Registry ─────────────────────────────────────────────────────────

const CREATOR_PROFILES: CreatorProfile[] = [
  {
    id: "chrishpro",
    handle: "@chrishpro",
    name: "Christian Hernández (Chris H)",
    platform: "instagram",
    location: "Medellín, Colombia",
    language: "Spanish",
    dialect: "Colombian (Paisa)",
    niche: "Music industry marketing",
    followers: 69000,
    format: {
      visualStyle: "talking_head",
      hookStyle: "bold_statement",
      hookExample: "Lanzar música no es solo subir un archivo y ya, parce.",
      durationRange: [15, 30],
      textOverlay: "bold_captions",
      ctaPattern: "Seguime para más códigos",
      engagementDrivers: ["contrarian takes", "insider knowledge", "industry secrets"],
      audioStyle: "original_voice",
      postingFrequency: "2-3_per_week",
      visualElements: ["close-up face", "bold text overlay", "dark background", "confident posture"],
    },
    themes: ["music marketing", "artist branding", "digital strategy", "industry economics"],
    signatureExpressions: ["parce", "códigos", "la ruta", "posicionar"],
    educationalAdaptation: {
      contentTypes: ["vocabulary", "slang", "culture"],
      targetLevel: "intermediate",
      hookAdaptation: "Replace music tip with language tip using same confident authority tone",
      ctaAdaptation: "Seguí aprendiendo en LinguaVibe — link in bio",
      suggestedTeacherId: "carlos_medellin",
    },
  },
  {
    id: "jeffer17",
    handle: "@jeffer__17",
    name: "Jeffer",
    platform: "instagram",
    location: "Dominican Republic",
    language: "Spanish",
    dialect: "Dominican",
    niche: "Dominican culture & humor",
    followers: 50000,
    format: {
      visualStyle: "street_interview",
      hookStyle: "question",
      hookExample: "¿Tú sabe' lo que significa...?",
      durationRange: [15, 45],
      textOverlay: "subtitles",
      ctaPattern: "Comenta si sabías esto",
      engagementDrivers: ["relatable humor", "cultural pride", "slang education"],
      audioStyle: "trending_audio",
      postingFrequency: "daily",
      visualElements: ["outdoor setting", "natural lighting", "casual style", "hand gestures"],
    },
    themes: ["Dominican slang", "cultural moments", "street humor", "music culture"],
    signatureExpressions: ["tú sabe'", "dime a ver", "e' verdad", "klok"],
    educationalAdaptation: {
      contentTypes: ["slang", "pronunciation", "culture"],
      targetLevel: "intermediate",
      hookAdaptation: "Ask viewers if they know a Dominican expression, then teach it",
      ctaAdaptation: "Aprende más jerga dominicana en LinguaVibe",
      suggestedTeacherId: "rosa_santo_domingo",
    },
  },
  {
    id: "djramny",
    handle: "@djramny",
    name: "DJ Ramny",
    platform: "instagram",
    location: "Dominican Republic",
    language: "Spanish",
    dialect: "Dominican",
    niche: "Dembow & urban music",
    followers: 100000,
    format: {
      visualStyle: "music_mix",
      hookStyle: "sound_hook",
      hookExample: "[Beat drop] + crowd reaction",
      durationRange: [15, 60],
      textOverlay: "key_phrases",
      ctaPattern: "Tag someone who needs to hear this",
      engagementDrivers: ["viral beats", "nostalgia", "party energy", "music discovery"],
      audioStyle: "music_focused",
      postingFrequency: "daily",
      visualElements: ["DJ booth", "crowd shots", "neon lighting", "track names on screen"],
    },
    themes: ["dembow", "reggaeton", "urban music", "party culture", "throwbacks"],
    signatureExpressions: ["prende", "dale", "fuego", "activo"],
    educationalAdaptation: {
      contentTypes: ["music_lyrics", "slang", "vocabulary"],
      targetLevel: "all",
      hookAdaptation: "Play viral song clip, then break down lyrics word by word",
      ctaAdaptation: "Learn the full lyrics breakdown in LinguaVibe",
      suggestedTeacherId: "rosa_santo_domingo",
    },
  },
  {
    id: "zeta93fm",
    handle: "@zeta93fm",
    name: "Zeta 93 FM",
    platform: "instagram",
    location: "Puerto Rico",
    language: "Spanish",
    dialect: "Puerto Rican",
    niche: "Salsa & tropical music radio",
    followers: 200000,
    format: {
      visualStyle: "montage",
      hookStyle: "visual_hook",
      hookExample: "[Classic salsa intro] + artist photo reveal",
      durationRange: [15, 30],
      textOverlay: "key_phrases",
      ctaPattern: "¿Cuál es tu favorita? Comenta 👇",
      engagementDrivers: ["nostalgia", "cultural identity", "music trivia", "community polls"],
      audioStyle: "music_focused",
      postingFrequency: "daily",
      visualElements: ["album art", "artist photos", "radio branding", "tropical colors"],
    },
    themes: ["salsa classics", "tropical music", "Puerto Rican culture", "artist spotlights"],
    signatureExpressions: ["boricua", "wepa", "salsa pa'l mundo"],
    educationalAdaptation: {
      contentTypes: ["music_lyrics", "culture", "vocabulary"],
      targetLevel: "intermediate",
      hookAdaptation: "Play classic salsa hook, ask 'Do you know what this means?'",
      ctaAdaptation: "Aprende español con la mejor salsa en LinguaVibe",
      suggestedTeacherId: "maria_san_juan",
    },
  },
  {
    id: "classicalmusicreel",
    handle: "@classicalmusicreel",
    name: "Classical Music | Stories & Reels",
    platform: "instagram",
    location: "Global",
    language: "English",
    dialect: undefined,
    niche: "Classical music education & appreciation",
    followers: 1000000,
    format: {
      visualStyle: "montage",
      hookStyle: "visual_hook",
      hookExample: "[Dramatic orchestral opening] + composer portrait",
      durationRange: [15, 60],
      textOverlay: "subtitles",
      ctaPattern: "Follow for daily classical music",
      engagementDrivers: ["emotional music", "historical stories", "beautiful visuals", "educational facts"],
      audioStyle: "music_focused",
      postingFrequency: "daily",
      visualElements: ["orchestral footage", "composer portraits", "sheet music", "concert halls"],
    },
    themes: ["classical composers", "orchestral music", "music history", "instrument spotlights"],
    signatureExpressions: ["masterpiece", "genius", "timeless"],
    educationalAdaptation: {
      contentTypes: ["vocabulary", "culture", "music_lyrics"],
      targetLevel: "all",
      hookAdaptation: "Play famous classical piece, teach musical terms in target language",
      ctaAdaptation: "Learn music vocabulary in 14 languages on LinguaVibe",
    },
  },
];

// ─── Content Brief Generator ──────────────────────────────────────────────────

export function generateContentBrief(
  creatorId: string,
  topic: string,
  language: string,
  options?: { targetDuration?: number; platform?: "instagram" | "tiktok" | "youtube_shorts" }
): ContentBrief | null {
  const creator = CREATOR_PROFILES.find(c => c.id === creatorId);
  if (!creator) return null;

  const duration = options?.targetDuration ?? Math.round(
    (creator.format.durationRange[0] + creator.format.durationRange[1]) / 2
  );

  return {
    id: `brief_${creatorId}_${Date.now()}`,
    creatorProfileId: creatorId,
    title: `${topic} — ${creator.format.visualStyle} style`,
    topic,
    language,
    script: buildScript(creator, topic, duration),
    visualDirection: `Style: ${creator.format.visualStyle}. Elements: ${creator.format.visualElements.join(", ")}. Text: ${creator.format.textOverlay}.`,
    audioDirection: getAudioDirection(creator.format.audioStyle),
    textOverlays: getTextOverlays(creator.format.textOverlay, language),
    targetDuration: duration,
    hashtags: generateHashtags(creator, topic, language),
    platformNotes: getPlatformNotes(options?.platform ?? "instagram"),
    difficulty: creator.format.visualStyle === "talking_head" ? "easy" : "medium",
  };
}

function buildScript(creator: CreatorProfile, topic: string, duration: number): ScriptSection[] {
  return [
    {
      timestamp: "0:00-0:03",
      type: "hook",
      text: `[${creator.format.hookStyle} style: "${creator.format.hookExample}" adapted for "${topic}"]`,
      visualNote: creator.format.visualElements[0],
    },
    {
      timestamp: `0:03-0:${Math.floor(duration * 0.7)}`,
      type: "content",
      text: `[Teach "${topic}" using ${creator.niche} context. Use expressions: "${creator.signatureExpressions[0]}"]`,
      visualNote: `${creator.format.textOverlay} with key vocabulary highlighted`,
    },
    {
      timestamp: `0:${Math.floor(duration * 0.7)}-0:${Math.floor(duration * 0.85)}`,
      type: "example",
      text: `[Real-world usage example from ${creator.themes[0]} context]`,
      visualNote: "Split screen: original + translation",
    },
    {
      timestamp: `0:${Math.floor(duration * 0.85)}-0:${duration}`,
      type: "cta",
      text: creator.educationalAdaptation.ctaAdaptation,
      visualNote: "App logo + download CTA",
    },
  ];
}

function getAudioDirection(style: string): string {
  const directions: Record<string, string> = {
    original_voice: "Clear voice, confident tone. No background music needed.",
    trending_audio: "Use trending audio from target language. Voice over the beat.",
    background_beat: "Subtle lo-fi beat underneath narration.",
    music_focused: "Lead with music. Let song play 2-3s before narration.",
  };
  return directions[style] || "Match audio to creator reference.";
}

function getTextOverlays(style: string, language: string): string[] {
  if (style === "bold_captions") return ["Topic in bold at top", "Key word large + centered", "Translation below", "@LinguaVibe watermark"];
  if (style === "subtitles") return [`Dual-language subtitles (${language} + English)`, "Highlight current word", "@LinguaVibe watermark"];
  if (style === "key_phrases") return ["Song title + artist", "Key phrase translation pop-up", "Learn more CTA at end"];
  return ["@LinguaVibe watermark"];
}

function generateHashtags(creator: CreatorProfile, topic: string, language: string): string[] {
  return [
    "#LinguaVibe", "#LearnLanguages", `#Learn${language}`,
    `#${creator.niche.replace(/\s+/g, "")}`, "#LanguageLearning", "#Polyglot",
  ].slice(0, 10);
}

function getPlatformNotes(platform: string): string {
  if (platform === "tiktok") return "9:16 vertical, hook in first 1.5s. Use trending sounds.";
  if (platform === "youtube_shorts") return "9:16 vertical, 60s max. Title matters for search.";
  return "Reels: 9:16 vertical, 15-30s optimal. Use 3-5 hashtags.";
}

export function generateWeeklyBriefs(creatorId: string, language: string, topics: string[]): ContentBrief[] {
  return topics.slice(0, 7).map(t => generateContentBrief(creatorId, t, language)).filter((b): b is ContentBrief => b !== null);
}

export function getAllCreatorProfiles(): CreatorProfile[] { return [...CREATOR_PROFILES]; }
export function getCreatorProfile(id: string): CreatorProfile | undefined { return CREATOR_PROFILES.find(c => c.id === id); }
export function getCreatorsByLanguage(language: string, dialect?: string): CreatorProfile[] {
  return CREATOR_PROFILES.filter(c => {
    if (c.language.toLowerCase() !== language.toLowerCase()) return false;
    if (dialect && c.dialect && !c.dialect.toLowerCase().includes(dialect.toLowerCase())) return false;
    return true;
  });
}

export function generateLLMPrompt(creatorId: string, topic: string, language: string): string | null {
  const creator = CREATOR_PROFILES.find(c => c.id === creatorId);
  if (!creator) return null;
  return `You are a viral content creator making educational ${language} language content.

CREATOR STYLE: @${creator.handle.replace("@", "")}
- Visual: ${creator.format.visualStyle} | Hook: ${creator.format.hookStyle}
- Example: "${creator.format.hookExample}"
- Duration: ${creator.format.durationRange[0]}-${creator.format.durationRange[1]}s
- Signature: ${creator.signatureExpressions.join(", ")}

TASK: Write a ${creator.format.durationRange[1]}s reel script teaching "${topic}" in ${language}.

STRUCTURE:
1. HOOK (0-3s): ${creator.format.hookStyle} style
2. CONTENT (3-20s): Teach naturally using ${creator.dialect || language} dialect
3. EXAMPLE (20-25s): Real-world usage (song lyric, conversation)
4. CTA (25-30s): "${creator.educationalAdaptation.ctaAdaptation}"

Write in ${language} with English translation in [brackets]. Casual, authentic tone.`;
}
