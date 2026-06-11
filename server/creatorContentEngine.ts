/**
 * Creator Content Engine
 * 
 * The UNIVERSAL engine that reads Airtable creators and drives EVERYTHING:
 * - Lesson generation (teaching methods from creators applied to any language)
 * - Song generation (music styles from creators → Suno prompts for any language)
 * - Content production queue (auto-generates batches of songs + lessons)
 * - Level placement matrix (what creator method works at which CEFR level)
 * - Visual association exercises (CIA method from @ck.learnsspanish)
 * 
 * KEY PRINCIPLE: Creator styles are LANGUAGE-AGNOSTIC templates.
 * A teaching method from a Spanish creator works for Hindi, Japanese, Arabic, etc.
 * The creator provides the HOW, the language provides the WHAT.
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { vault } from "./knowledgeVault";
import {
  buildLLMGuardrailPrompt,
  validateLLMOutput,
  enforceGuardrails,
  buildAirtableLanguageFilter,
  buildSafeAirtableUrl,
  type GuardrailContext,
} from "./languageGuardrails";
import { feedCache, FEED_CACHE_TTL, LANGUAGE_COUNTRY_MAP, type CulturalFeedItem } from "./culturalIntelligence";

// ─── Airtable Config ────────────────────────────────────────────────────────

const AIRTABLE_API = "https://api.airtable.com/v0";

function getAirtableHeaders() {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) throw new Error("AIRTABLE_API_KEY not set");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

function getBaseId() {
  const id = process.env.AIRTABLE_BASE_ID;
  if (!id) throw new Error("AIRTABLE_BASE_ID not set");
  return id;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface AirtableCreator {
  id: string;
  name: string;
  handle: string;
  platform: string;
  language: string;
  region: string;
  contentStyle: string[];
  notes: string;
  profileUrl: string;
}

interface CreatorTemplate {
  creatorId: string;
  creatorName: string;
  handle: string;
  /** The teaching/content approach — language-agnostic */
  method: string;
  /** What type: music, visual, conversational, entertainment, whiteboard, hybrid */
  contentType: "music" | "visual" | "conversational" | "entertainment" | "whiteboard" | "rrt" | "netflix_dictation" | "hybrid";
  /** Which CEFR levels this method works best for */
  bestForLevels: string[];
  /** Which lesson categories this method enhances */
  bestForCategories: string[];
  /** The prompt injection for AI exercise generation — works for ANY language */
  exercisePromptTemplate: string;
  /** The prompt template for song generation — works for ANY language */
  songPromptTemplate: string;
  /** The prompt template for content/reel creation */
  contentPromptTemplate: string;
  /** Genre/style tags for music generation */
  musicTags: string[];
  /** Visual style tags for image generation */
  visualTags: string[];
}

// ─── Level Placement Matrix ─────────────────────────────────────────────────
// Maps teaching methods to CEFR levels — what works WHERE

const LEVEL_PLACEMENT_MATRIX: Record<string, {
  levels: string[];
  reason: string;
  exerciseTypes: string[];
  complexity: string;
}> = {
  "visual_association": {
    levels: ["A1", "A2", "B1"],
    reason: "Visual association (CIA method) is most effective for building initial vocabulary. At B2+ students need contextual/abstract learning.",
    exerciseTypes: ["visual_vocab", "match_pairs", "cultural_discovery"],
    complexity: "A1: single objects with images. A2: scenes with 3-5 objects. B1: complex cultural scenes with abstract concepts.",
  },
  "music_immersion": {
    levels: ["A1", "A2", "B1", "B2", "C1"],
    reason: "Music works at ALL levels. A1 gets simple repetitive hooks, C1 gets complex lyrics with slang and metaphor.",
    exerciseTypes: ["fill_the_order", "conversation_chain", "story_choice"],
    complexity: "A1: 4-word chorus lines. A2: simple verse phrases. B1: full verses with grammar. B2: slang-heavy lyrics. C1: metaphor and wordplay.",
  },
  "conversational_warmth": {
    levels: ["A1", "A2", "B1", "B2"],
    reason: "Warm, encouraging teaching style works especially for beginners who need confidence. Less needed at C1+ where students are self-directed.",
    exerciseTypes: ["conversation_chain", "story_choice", "fill_the_order"],
    complexity: "A1: greetings and basic exchanges. A2: everyday situations. B1: opinions and feelings. B2: debates and nuanced conversation.",
  },
  "speed_challenge": {
    levels: ["A2", "B1", "B2", "C1", "C2"],
    reason: "Speed challenges require baseline vocabulary. Not for absolute beginners. Best for intermediate+ who need to process faster.",
    exerciseTypes: ["match_pairs", "fill_the_order", "conversation_chain"],
    complexity: "A2: rapid word recognition. B1: fast sentence completion. B2: speed listening comprehension. C1+: native-speed dialogue parsing.",
  },
  "entertainment_gamified": {
    levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
    reason: "Entertainment and gamification work at EVERY level. It's about engagement, not difficulty.",
    exerciseTypes: ["story_choice", "cultural_discovery", "match_pairs", "conversation_chain"],
    complexity: "A1: simple games with celebration. A2: story-based games. B1: competitive challenges. B2+: complex narrative games.",
  },
  "cinematic_phrase": {
    levels: ["A1", "A2", "B1"],
    reason: "One phrase per cinematic scene is perfect for beginners. Advanced students need more context per scene.",
    exerciseTypes: ["visual_vocab", "cultural_discovery", "match_pairs"],
    complexity: "A1: single everyday phrase + scene. A2: 2-3 related phrases per scene. B1: mini-dialogue in scene context.",
  },
  "flamenco_soul_emotional": {
    levels: ["B1", "B2", "C1"],
    reason: "Emotional/acoustic music teaches feelings vocabulary and deeper expression. Requires intermediate+ base.",
    exerciseTypes: ["story_choice", "conversation_chain", "cultural_discovery"],
    complexity: "B1: basic emotions vocabulary. B2: nuanced feelings, reflexive verbs. C1: poetic expression, metaphor.",
  },
  "whiteboard_teaching": {
    levels: ["A1", "A2", "B1", "B2", "C1"],
    reason: "Whiteboard teaching works at all levels — visual step-by-step writing makes grammar rules, conjugations, and sentence structures tangible. Omar-style: teacher writes on board, explains, asks student to complete the next part.",
    exerciseTypes: ["whiteboard_fill", "whiteboard_conjugate", "whiteboard_translate", "whiteboard_correct"],
    complexity: "A1: single word completion, basic verb forms. A2: fill missing word in sentence on board. B1: conjugate verbs, translate short phrases. B2: correct grammar errors on board, rewrite sentences. C1: complex sentence restructuring, idiomatic expressions.",
  },
  "rhythmic_reinforcement": {
    levels: ["A1", "A2", "B1", "B2"],
    reason: "Rocky's RRT (Rhythmic Reinforcement Training) uses progressive speed-up repetition to build muscle memory. Teacher says phrase → student repeats → speed increases each round. Works from absolute beginners to intermediate. At B2+ students need more contextual practice.",
    exerciseTypes: ["rrt_repeat", "rrt_speedup", "rrt_alphabet", "rrt_immersion_burst"],
    complexity: "A1: single words and alphabet sounds at slow pace. A2: short phrases (3-5 words) with gradual speed increase. B1: full sentences with natural speed target. B2: rapid-fire conversational exchanges at native speed.",
  },
  "netflix_dictation": {
    levels: ["A2", "B1", "B2", "C1", "C2"],
    reason: "Netflix Dictation trains real-world listening comprehension. Listen to authentic audio → write what you hear → compare with transcript → imitate pronunciation. Requires baseline vocabulary (not for A1). Best for intermediate+ who need to bridge the gap between textbook and real speech.",
    exerciseTypes: ["dictation_listen", "dictation_write", "dictation_compare", "dictation_imitate"],
    complexity: "A2: slow, clear single sentences from simple content. B1: natural-speed dialogue, 2-3 sentences. B2: fast speech with slang and contractions. C1: complex monologues with idioms. C2: rapid native speech with background noise and multiple speakers.",
  },
};

// ─── Creator → Template Resolution ──────────────────────────────────────────

function resolveCreatorTemplate(creator: AirtableCreator): CreatorTemplate {
  const notes = (creator.notes || "").toLowerCase();
  const styles = creator.contentStyle.map(s => s.toLowerCase());
  
  // Determine content type
  let contentType: CreatorTemplate["contentType"] = "hybrid";
  if (notes.includes("rrt") || notes.includes("rhythmic reinforcement") || notes.includes("speed-up repetition") || notes.includes("alphabet mastery")) {
    contentType = "rrt";
  } else if (notes.includes("netflix dictation") || notes.includes("dictation") || notes.includes("listen and write")) {
    contentType = "netflix_dictation";
  } else if (styles.includes("music") || notes.includes("music") || notes.includes("song") || notes.includes("funketón") || notes.includes("flamenco")) {
    contentType = "music";
  } else if (notes.includes("whiteboard") || notes.includes("marker") || notes.includes("grammar comparison") || notes.includes("conjugation")) {
    contentType = "whiteboard";
  } else if (notes.includes("visual") || notes.includes("cia") || notes.includes("image") || notes.includes("cinematic")) {
    contentType = "visual";
  } else if (styles.includes("educational") || notes.includes("teacher") || notes.includes("teach")) {
    contentType = "conversational";
  } else if (styles.includes("entertainment") || notes.includes("dance") || notes.includes("viral")) {
    contentType = "entertainment";
  }

  // Determine best levels based on content type
  const methodKey = getMethodKey(contentType, notes);
  const placement = LEVEL_PLACEMENT_MATRIX[methodKey] || LEVEL_PLACEMENT_MATRIX["entertainment_gamified"];

  // Build music tags
  const musicTags: string[] = [];
  if (notes.includes("funketón") || notes.includes("baile funk")) musicTags.push("Funketón", "Baile Funk", "Reggaeton");
  if (notes.includes("flamenco")) musicTags.push("Flamenco Soul", "Acoustic", "Emotional");
  if (notes.includes("afrobeat") || notes.includes("african")) musicTags.push("Afrobeats", "Dancehall", "World Music");
  if (notes.includes("reggaeton")) musicTags.push("Reggaeton", "Latin Urban");
  if (notes.includes("pop")) musicTags.push("Latin Pop", "Pop");
  if (musicTags.length === 0) musicTags.push("World Music", "Educational");

  // Build visual tags
  const visualTags: string[] = [];
  if (notes.includes("cinematic")) visualTags.push("cinematic", "illustrated", "scene-based");
  if (notes.includes("cia") || notes.includes("visual association")) visualTags.push("object-labeled", "memory-hook", "cultural-scene");
  if (notes.includes("colorful") || notes.includes("bright")) visualTags.push("vibrant", "colorful", "outdoor");
  if (visualTags.length === 0) visualTags.push("authentic", "cultural");

  return {
    creatorId: creator.id,
    creatorName: creator.name,
    handle: creator.handle || "",
    method: describeMethod(contentType, creator),
    contentType,
    bestForLevels: placement.levels,
    bestForCategories: placement.exerciseTypes,
    exercisePromptTemplate: buildExerciseTemplate(contentType, creator, placement),
    songPromptTemplate: buildSongTemplate(contentType, creator, musicTags),
    contentPromptTemplate: buildContentTemplate(contentType, creator),
    musicTags,
    visualTags,
  };
}

function getMethodKey(contentType: string, notes: string): string {
  if (notes.includes("rrt") || notes.includes("rhythmic reinforcement") || notes.includes("speed-up repetition") || notes.includes("alphabet mastery")) return "rhythmic_reinforcement";
  if (notes.includes("netflix dictation") || notes.includes("dictation") || notes.includes("listen and write")) return "netflix_dictation";
  if (notes.includes("whiteboard") || notes.includes("marker") || notes.includes("grammar comparison")) return "whiteboard_teaching";
  if (notes.includes("cia") || notes.includes("visual association")) return "visual_association";
  if (notes.includes("funketón") || notes.includes("reggaeton") || notes.includes("baile funk")) return "music_immersion";
  if (notes.includes("flamenco") || notes.includes("emotional") || notes.includes("soul")) return "flamenco_soul_emotional";
  if (notes.includes("speed") || notes.includes("fast") || notes.includes("challenge")) return "speed_challenge";
  if (notes.includes("cinematic") || notes.includes("phrase card")) return "cinematic_phrase";
  if (notes.includes("dance") || notes.includes("viral") || notes.includes("joy")) return "entertainment_gamified";
  if (contentType === "rrt") return "rhythmic_reinforcement";
  if (contentType === "netflix_dictation") return "netflix_dictation";
  if (contentType === "whiteboard") return "whiteboard_teaching";
  if (contentType === "conversational") return "conversational_warmth";
  return "entertainment_gamified";
}

function describeMethod(contentType: string, creator: AirtableCreator): string {
  const region = creator.region || "global";
  switch (contentType) {
    case "rrt": return `Rhythmic Reinforcement Training inspired by ${creator.name}'s ${region} style — progressive speed-up repetition drills that build muscle memory through rhythm and pacing`;
    case "netflix_dictation": return `Netflix Dictation method inspired by ${creator.name}'s ${region} style — listen to authentic content, write what you hear, compare, then imitate pronunciation`;
    case "music": return `Music-based learning inspired by ${creator.name}'s ${region} style — teach through rhythm, melody, and catchy hooks`;
    case "visual": return `Visual association learning inspired by ${creator.name} — pair vivid cultural images with vocabulary for instant memory`;
    case "whiteboard": return `Whiteboard teaching inspired by ${creator.name}'s ${region} style — step-by-step writing on board, grammar breakdowns, verb conjugations, interactive Q&A where student writes answers`;
    case "conversational": return `Warm conversational teaching inspired by ${creator.name}'s ${region} style — practical, encouraging, real-world scenarios`;
    case "entertainment": return `Entertainment-first learning inspired by ${creator.name} — joy, energy, games that make learning feel like play`;
    default: return `Hybrid teaching inspired by ${creator.name} — combining multiple approaches for maximum engagement`;
  }
}

function buildExerciseTemplate(contentType: string, creator: AirtableCreator, placement: typeof LEVEL_PLACEMENT_MATRIX[string]): string {
  const base = `CREATOR STYLE: ${creator.name} (${creator.region || "global"})
Teaching method: ${describeMethod(contentType, creator)}
Best for levels: ${placement.levels.join(", ")}
Complexity guide: ${placement.complexity}`;

  switch (contentType) {
    case "music":
      return `${base}
MUSIC-BASED EXERCISES:
- Create exercises around song lyrics and musical phrases
- Use rhythm and repetition to reinforce vocabulary
- Include "complete the lyrics" and "sing-along fill-in" exercise types
- Make exercises feel like learning a song, not studying a textbook
- Reference ${creator.region || "Latin"} music culture and dance`;
    case "visual":
      return `${base}
VISUAL ASSOCIATION EXERCISES (CIA Method):
- Every vocabulary word gets a vivid, culturally-specific scene description (imagePrompt)
- Create "spot the word in the scene" exercises
- Use the dual-coding principle: visual + verbal encoding
- Scenes should be SPECIFIC (not generic): real markets, real streets, real kitchens from the culture
- Include memory hooks that create unforgettable associations`;
    case "conversational":
      return `${base}
CONVERSATIONAL EXERCISES:
- Warm, encouraging tone — like a patient friend teaching you
- Focus on PRACTICAL phrases people actually use daily
- Include natural corrections (not harsh "wrong!" — more like "almost! try...")
- Use real-world scenarios: ordering food, asking directions, meeting people
- Teach ${creator.region || "regional"} expressions and slang naturally`;
    case "entertainment":
      return `${base}
ENTERTAINMENT-FIRST EXERCISES:
- Make every exercise feel like a GAME, not homework
- Include celebration moments (confetti, cheers, dance references)
- Use challenges and competitions ("Can you beat this?")
- High energy, positive vibes, joy in learning
- Reference dance, music, celebration from the culture`;
    case "rrt":
      return `${base}
RHYTHMIC REINFORCEMENT TRAINING (Rocky-Style RRT):
- Progressive speed-up repetition drill: teacher says phrase → student repeats → speed increases each round
- 4 exercise types: rrt_repeat (echo the phrase), rrt_speedup (repeat at increasing BPM),
  rrt_alphabet (master individual sounds/letters), rrt_immersion_burst (rapid-fire Q&A at native speed)
- Start SLOW (0.5x speed), build to NATURAL (1.0x), then push to FAST (1.3x)
- Each round has 3-5 repetitions before speed increases
- Use audio pacing cues (metronome-style) to set rhythm
- Include Rocky's signature encouragement: "Again!", "Faster!", "You got this!", "One more time!"
- Focus on ${creator.region || "regional"} pronunciation and natural speech patterns
- Alphabet exercises: isolate difficult sounds, minimal pairs, tongue twisters
- Immersion bursts: simulate being dropped into a conversation — respond in 2 seconds or less`;
    case "netflix_dictation":
      return `${base}
NETFLIX DICTATION EXERCISES (Rocky-Style):
- 4-step dictation cycle: LISTEN → WRITE → COMPARE → IMITATE
- Step 1 (Listen): Play authentic audio clip (movie/show dialogue, podcast, song lyric) — student just listens
- Step 2 (Write): Replay audio — student writes exactly what they hear (dictation)
- Step 3 (Compare): Show correct transcript — highlight differences, explain contractions/slang
- Step 4 (Imitate): Student records themselves saying the same phrase — compare rhythm and pronunciation
- Use REAL content: movie quotes, TV show dialogues, podcast clips, song lyrics
- Highlight speech linking, contractions, and sounds that disappear in fast speech
- Include difficulty tiers: "Clear Speech" (news anchors), "Natural Speech" (conversations), "Street Speech" (slang-heavy)
- Focus on ${creator.region || "regional"} accent and pronunciation patterns
- After each dictation, teach 1-2 vocabulary items or grammar points from the clip`;
    case "whiteboard":
      return `${base}
WHITEBOARD TEACHING EXERCISES (Omar-Style):
- Teacher writes step-by-step on a whiteboard — grammar rules, verb conjugations, sentence structures
- After each teaching step, teacher asks a QUESTION that the student must answer by writing on the board
- Exercise types: whiteboard_fill (complete the missing word), whiteboard_conjugate (write the correct verb form),
  whiteboard_translate (translate the phrase), whiteboard_correct (find and fix the error)
- Use color-coded text: teacher writes in blue/black, key terms in red, student answers in green
- Include phonetic pronunciation guides for ${creator.region || "regional"} accent
- Side-by-side comparisons: show target language structure vs native language structure
- Progressive: start with simple fill-in, build to full sentence construction
- Confusing words: Spider-Man style comparison of similar-sounding words
- Speech linking: show how native speakers connect words naturally`;
    default:
      return base;
  }
}

function buildSongTemplate(contentType: string, creator: AirtableCreator, musicTags: string[]): string {
  const tags = musicTags.join(", ");
  return `SONG GENERATION TEMPLATE — Inspired by ${creator.name}
Genre/Style: ${tags}
Region: ${creator.region || "global"}
Energy: ${contentType === "entertainment" ? "high energy, danceable" : contentType === "music" && creator.notes?.toLowerCase().includes("flamenco") ? "intimate, acoustic, emotional" : "medium energy, catchy"}

RULES FOR SONG CREATION (apply to ANY language):
1. The song must teach vocabulary/grammar naturally through lyrics
2. Chorus should be simple and repetitive (easy to memorize)
3. Verses introduce new vocabulary in context
4. Bridge can include a "challenge" section (faster, more complex)
5. Include pronunciation-friendly phrasing (clear syllables, not mumbled)
6. Cultural references from the TARGET language's culture (not ${creator.region} unless matching)
7. The song should sound like a REAL song people would listen to, not an educational jingle

LEVEL ADAPTATION:
- A1: 4-6 unique words per song, very repetitive chorus, simple melody
- A2: 10-15 words, verse-chorus structure, everyday phrases
- B1: 20-30 words, storytelling lyrics, some slang
- B2: Complex lyrics, metaphor, regional expressions
- C1+: Native-level lyrics with wordplay, double meanings, cultural depth`;
}

function buildContentTemplate(contentType: string, creator: AirtableCreator): string {
  return `CONTENT/REEL TEMPLATE — Inspired by ${creator.name} (@${creator.handle || "unknown"})
Platform style: ${creator.platform || "Instagram/TikTok"}
Content approach: ${creator.contentStyle?.join(", ") || "educational entertainment"}
Region: ${creator.region || "global"}

CONTENT CREATION RULES (apply to ANY language):
1. Hook in first 2 seconds (question, challenge, or surprising fact)
2. Teach ONE concept per piece of content (not a full lesson)
3. Use the creator's visual/audio style as inspiration
4. Include a call-to-action ("Try saying this!", "Tag someone learning [language]!")
5. Make it shareable — people should want to send this to friends
6. Cultural authenticity — use real cultural references from the target language

CONTENT IDEAS TO GENERATE:
- "Did you know?" cultural facts with vocabulary
- "Say this, not that" — common mistakes
- "How to sound like a local" — slang/idiom of the day
- Challenge format — "Can you understand this native speaker?"
- Song snippet with lyrics breakdown`;
}

// ─── Fetch from Airtable ────────────────────────────────────────────────────

// ─── Local Fallback Creators (used when Airtable is unavailable) ─────────────
const LOCAL_FALLBACK_CREATORS: AirtableCreator[] = [
  {
    id: "local-rocky-rrt",
    name: "Rocky Rodriguez",
    handle: "sevendayspanish",
    platform: "multi-platform",
    language: "spanish",
    region: "United States",
    contentStyle: ["RRT", "Speed Drills"],
    notes: "RHYTHMIC REINFORCEMENT TRAINING (RRT) — progressive speed-up repetition drills. Alphabet Mastery — isolate difficult sounds. Artificial Immersion — simulate being dropped into conversation. Speed Trials — rapid-fire Q&A. Netflix Dictation Exercise — listen, write, compare, imitate.",
    profileUrl: "https://www.instagram.com/sevendayspanish",
  },
  {
    id: "local-teachersfrombrazil",
    name: "Teachers From Brazil",
    handle: "teachersfrombrazil",
    platform: "multi-platform",
    language: "portuguese",
    region: "Brazil",
    contentStyle: ["Cultural Immersion", "Conversational"],
    notes: "Contextual Immersion — teaches Portuguese through real Brazilian cultural scenarios (dating, ordering street food, meeting the family, going to the beach). Cultural Storytelling — connects language learning to Brazilian music, Carnival, samba, and cultural traditions. Visual Vocabulary — uses vivid Brazilian scenes for word association. Pronunciation Drills — Brazilian Portuguese sounds, nasal vowels, rhythm. Grammar Through Conversation — natural grammar acquisition through dialogue, not rules.",
    profileUrl: "https://www.instagram.com/teachersfrombrazil",
  },
  {
    id: "local-spanishwithdiana",
    name: "Spanish with Diana Hernandez",
    handle: "spanishwithdiana_",
    platform: "Instagram",
    language: "spanish",
    region: "Colombia",
    contentStyle: ["Conversational", "Cultural Immersion", "Pronunciation"],
    notes: "PRONUNCIATION CORRECTION — points out common mistakes that change word meaning. CULTURAL IMMERSION — connects language to Colombian culture, food, travel. CONVERSATIONAL PRACTICE — conversation-based method to overcome speaking fear. COMMON MISTAKES — highlights confusing word pairs and false friends. REAL-LIFE PHRASES — practical everyday Spanish for travel.",
    profileUrl: "https://www.instagram.com/spanishwithdiana_",
  },
  {
    id: "local-jonahjgomez",
    name: "Jonah Gomez",
    handle: "jonahjgomez",
    platform: "Instagram",
    language: "spanish",
    region: "Dominican Republic",
    contentStyle: ["Street Immersion", "Dominican Slang", "Cultural Storytelling"],
    notes: "STREET SPANISH — real Dominican slang and street phrases. CULTURAL CONTEXT — explains Dominican culture and lifestyle. TRAVEL PREPARATION — make sure your Spanish is on point for DR. COMPARISON CONTENT — US vs DR life and culture. IMMERSIVE STORYTELLING — real-life DR scenarios requiring Spanish.",
    profileUrl: "https://www.instagram.com/jonahjgomez",
  },
  {
    id: "local-acariocateacher",
    name: "A Carioca Teacher (Melissa)",
    handle: "acariocateacher",
    platform: "Instagram",
    language: "portuguese",
    region: "Brazil (Rio de Janeiro)",
    contentStyle: ["Carioca Slang", "Practical Portuguese", "Challenge-Based"],
    notes: "CARIOCA SLANG — Rio de Janeiro specific slang and expressions. VOCABULARY OPPOSITES — teaching through contrasting word pairs. ESSENTIAL EXPRESSIONS — must-know phrases for daily life in Brazil. CHALLENGE-BASED LEARNING — Portuguese challenges with progress checks. PRACTICAL CONVERSATION — real phrases for real situations.",
    profileUrl: "https://www.instagram.com/acariocateacher",
  },
  {
    id: "local-spanishwithtuta",
    name: "Spanish with Tuta",
    handle: "spanishwithtuta",
    platform: "multi-platform",
    language: "spanish",
    region: "Nashville, USA (Colombian heritage)",
    contentStyle: ["Daily Phrases", "Bilingual Code-Switching", "Family Immersion"],
    notes: "DAILY PHRASE IMMERSION — one practical phrase per lesson with natural bilingual delivery. CODE-SWITCHING — models natural English-Spanish mixing for heritage speakers. FAMILY IMMERSION — real-life scenarios teaching Spanish to children and partners. ALTERNATIVES METHOD — teaches synonyms and alternatives to overused words (e.g., alternatives to 'si'). COUNTRY COMPARISONS — how different Latin American countries say the same thing. Cross-platform: Instagram (@spanishwithtuta, 690K+), TikTok (@spanishwithtuta), Facebook (Spanish with Tuta page).",
    profileUrl: "https://www.instagram.com/spanishwithtuta",
  },
];

async function fetchCreators(language?: string): Promise<AirtableCreator[]> {
  // Build URL with optional language filter — STRICT: only return creators for the requested language
  try {
    let url = `${AIRTABLE_API}/${getBaseId()}/Creators?maxRecords=100`;
    if (language) {
      // Use Airtable filterByFormula for server-side filtering
      const formula = encodeURIComponent(`LOWER({Language}) = '${language.toLowerCase()}'`);
      url += `&filterByFormula=${formula}`;
    }
    const res = await fetch(url, { headers: getAirtableHeaders() });
    if (!res.ok) throw new Error(`Airtable error: ${res.status}`);
    const data = await res.json();
    const creators = (data.records || []).map((r: any) => ({
      id: r.id,
      name: r.fields?.Name || "",
      handle: r.fields?.["Profile URL"]?.match(/@?(\w+)/)?.[1] || r.fields?.Name || "",
      platform: Array.isArray(r.fields?.Platform) ? r.fields.Platform[0] : r.fields?.Platform || "",
      language: Array.isArray(r.fields?.Language) ? r.fields.Language[0] : r.fields?.Language || "",
      region: r.fields?.["Country/Region"] || "",
      contentStyle: Array.isArray(r.fields?.["Content Style"]) ? r.fields["Content Style"] : [r.fields?.["Content Style"] || ""],
      notes: r.fields?.Notes || "",
      profileUrl: r.fields?.["Profile URL"] || "",
    }));
    // Double-check client-side: NEVER return creators from a different language
    if (language) {
      const filtered = creators.filter((c: any) => c.language.toLowerCase() === language.toLowerCase());
      // If Airtable returned results, use them
      if (filtered.length > 0) return filtered;
      // Otherwise fall through to local fallback
    } else if (creators.length > 0) {
      return creators;
    }
  } catch (err) {
    console.warn("[CreatorEngine] Airtable fetch failed, using local fallback:", err);
  }

  // ─── LOCAL FALLBACK: Use built-in creator data when Airtable is unavailable ───
  if (language) {
    return LOCAL_FALLBACK_CREATORS.filter(c => c.language.toLowerCase() === language.toLowerCase());
  }
  return LOCAL_FALLBACK_CREATORS;
}

// ─── Content Production Queue ───────────────────────────────────────────────
// Generates a batch of songs + lessons + content ideas from creator data

interface ProductionItem {
  type: "song" | "lesson" | "content_reel";
  title: string;
  targetLanguage: string;
  targetLevel: string;
  topic: string;
  creatorInspiration: string;
  prompt: string;
  musicStyle?: string;
  exerciseTypes?: string[];
}

async function generateProductionQueue(
  creators: AirtableCreator[],
  targetLanguage: string,
  targetLevel: string,
  count: number = 10,
): Promise<ProductionItem[]> {
  const templates = creators.map(resolveCreatorTemplate);
  
  // Filter templates that work for this level
  const levelTemplates = templates.filter(t => t.bestForLevels.includes(targetLevel));
  if (levelTemplates.length === 0) return [];

  // Build production items from each relevant creator
  const items: ProductionItem[] = [];
  
  for (const template of levelTemplates) {
    if (items.length >= count) break;

    // Song production item (from music creators)
    if (template.contentType === "music" || template.musicTags.length > 1) {
      items.push({
        type: "song",
        title: `${targetLanguage} learning song — ${template.musicTags[0]} style`,
        targetLanguage,
        targetLevel,
        topic: `Vocabulary and phrases for ${targetLevel} learners`,
        creatorInspiration: template.creatorName,
        prompt: template.songPromptTemplate,
        musicStyle: template.musicTags.join(", "),
      });
    }

    // Lesson production item (from all creators)
    items.push({
      type: "lesson",
      title: `${targetLanguage} lesson — ${template.method.split("—")[0].trim()}`,
      targetLanguage,
      targetLevel,
      topic: `${targetLevel} curriculum topic`,
      creatorInspiration: template.creatorName,
      prompt: template.exercisePromptTemplate,
      exerciseTypes: template.bestForCategories,
    });

    // Content reel production item
    items.push({
      type: "content_reel",
      title: `${targetLanguage} reel — ${template.creatorName} style`,
      targetLanguage,
      targetLevel,
      topic: `Viral content for ${targetLanguage} learners`,
      creatorInspiration: template.creatorName,
      prompt: template.contentPromptTemplate,
    });
  }

  return items.slice(0, count);
}

// ─── tRPC Router ────────────────────────────────────────────────────────────

export const creatorContentEngineRouter = router({
  
  /** Get all creator templates with their resolved methods, levels, and prompt templates */
  getCreatorTemplates: publicProcedure
    .input(z.object({ language: z.string().optional() }).optional())
    .query(async ({ input }) => {
    try {
      const creators = await fetchCreators(input?.language);
      const templates = creators.map(resolveCreatorTemplate);
      return { 
        success: true, 
        templates, 
        count: templates.length,
        levelMatrix: LEVEL_PLACEMENT_MATRIX,
      };
    } catch (error: any) {
      return { success: false, templates: [], count: 0, error: error.message };
    }
  }),

  /** Get creator templates filtered for a specific language + level */
  getTemplatesForContext: publicProcedure
    .input(z.object({ 
      language: z.string(), 
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
    }))
    .query(async ({ input }) => {
      try {
        // STRICT: only fetch creators for the requested language from Airtable
        const creators = await fetchCreators(input.language);
        const templates = creators.map(resolveCreatorTemplate);
        // Filter: only creators for this EXACT language + level match
        const relevant = templates.filter(t => {
          const langMatch = creators.find(c => c.id === t.creatorId)?.language.toLowerCase() === input.language.toLowerCase();
          const levelMatch = t.bestForLevels.includes(input.level);
          return langMatch && levelMatch;
        });
        return { success: true, templates: relevant, count: relevant.length };
      } catch (error: any) {
        return { success: false, templates: [], count: 0, error: error.message };
      }
    }),

  /** Generate a full production queue — songs + lessons + content for a language/level */
  generateProductionQueue: publicProcedure
    .input(z.object({
      language: z.string(),
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
      count: z.number().min(1).max(50).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // STRICT: only fetch creators matching the target language
        const creators = await fetchCreators(input.language);
        const queue = await generateProductionQueue(creators, input.language, input.level, input.count || 10);
        return { success: true, queue, count: queue.length };
      } catch (error: any) {
        return { success: false, queue: [], count: 0, error: error.message };
      }
    }),

  /** Generate a creator-inspired lesson for ANY language — the main teaching endpoint */
  generateLesson: publicProcedure
    .input(z.object({
      language: z.string(),
      dialect: z.string().optional(),
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
      lessonTopic: z.string(),
      lessonCategory: z.string(),
      culturalFocus: z.string().optional(),
      previousErrors: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { language, dialect, level, lessonTopic, lessonCategory, culturalFocus, previousErrors } = input;

      // 1. Fetch creators from Airtable — STRICT: only for the target language
      let templates: CreatorTemplate[] = [];
      try {
        const creators = await fetchCreators(language);
        const allTemplates = creators.map(resolveCreatorTemplate);
        // Get templates that work for this level
        templates = allTemplates.filter(t => t.bestForLevels.includes(level));
      } catch {
        templates = [];
      }

      // 2. Pick the best 2-3 creator styles to blend for this lesson
      const musicCreators = templates.filter(t => t.contentType === "music");
      const visualCreators = templates.filter(t => t.contentType === "visual");
      const conversationalCreators = templates.filter(t => t.contentType === "conversational");
      const entertainmentCreators = templates.filter(t => t.contentType === "entertainment");
      const rrtCreators = templates.filter(t => t.contentType === "rrt");
      const netflixDictationCreators = templates.filter(t => t.contentType === "netflix_dictation");

      // Smart blending: pick based on lesson category
      const blended: CreatorTemplate[] = [];
      if (["vocabulary", "speaking"].includes(lessonCategory) && visualCreators.length) {
        blended.push(visualCreators[0]); // CIA visual method for vocab
      }
      if (["vocabulary", "speaking", "listening"].includes(lessonCategory) && musicCreators.length) {
        blended.push(musicCreators[0]); // Music method for audio-heavy lessons
      }
      if (["grammar", "speaking", "writing"].includes(lessonCategory) && conversationalCreators.length) {
        blended.push(conversationalCreators[0]); // Warm conversational for grammar
      }
      if (["speaking", "listening", "pronunciation"].includes(lessonCategory) && rrtCreators.length) {
        blended.push(rrtCreators[0]); // Rocky-style RRT for speaking/listening drills
      }
      if (["listening", "writing", "comprehension"].includes(lessonCategory) && netflixDictationCreators.length) {
        blended.push(netflixDictationCreators[0]); // Netflix Dictation for listening/writing
      }
      if (entertainmentCreators.length) {
        blended.push(entertainmentCreators[0]); // Always add entertainment flavor
      }
      // Limit to 3 styles max
      const selectedTemplates = blended.slice(0, 3);

      // 3. Build the creator-enhanced prompt
      const creatorInjection = selectedTemplates.length > 0
        ? `\n\n=== CREATOR-INSPIRED TEACHING METHODS (from real content creators we study) ===
${selectedTemplates.map((t, i) => `
--- STYLE ${i + 1}: ${t.creatorName} ---
${t.exercisePromptTemplate}`).join("\n")}

IMPORTANT: BLEND these creator styles into your exercises. The lesson should FEEL like content from these creators — engaging, authentic, not textbook. These methods work for ANY language — adapt them to ${language}.
=== END CREATOR STYLES ===`
        : "";

      const dialectNote = dialect ? `The student is learning the ${dialect} dialect/variant.` : "";
      const errorContext = previousErrors?.length
        ? `The student previously struggled with: ${previousErrors.join(", ")}. Reinforce these.`
        : "";

      // ═══ CULTURAL INTELLIGENCE: Inject trending content into lesson prompt ═══
      let culturalMomentInjection = "";
      try {
        // Try to find cached cultural feed for this language
        const langCodes = Object.keys(LANGUAGE_COUNTRY_MAP).filter(code =>
          code.startsWith(language.substring(0, 2).toLowerCase())
        );
        let feedItems: CulturalFeedItem[] = [];
        for (const code of langCodes) {
          const cached = feedCache.get(code);
          if (cached && Date.now() - cached.timestamp < FEED_CACHE_TTL) {
            feedItems = cached.data.items;
            break;
          }
        }
        if (feedItems.length > 0) {
          const topItems = feedItems.slice(0, 3);
          culturalMomentInjection = `\n\n=== REAL-TIME CULTURAL INTELLIGENCE (use these in exercises!) ===
Here are REAL trending topics from ${language}-speaking countries RIGHT NOW. Weave these into your exercises naturally:
${topItems.map((item, i) => `
${i + 1}. [${item.type.toUpperCase()}] ${item.title}
   ${item.body.substring(0, 200)}
   Vocabulary: ${item.vocabulary.map(v => `${v.word} (${v.translation})`).join(", ")}
   Cultural context: ${item.culturalContext}`).join("\n")}

IMPORTANT: Reference at least ONE of these trending topics in your exercises. Make the student feel connected to what's happening RIGHT NOW in ${language}-speaking cultures.
=== END CULTURAL INTELLIGENCE ===`;
        }
      } catch (err) {
        // Cultural intelligence is optional — don't block lesson generation
        console.warn("[CreatorEngine] Cultural moment injection failed:", err);
      }

      // ═══ GUARDRAIL: Enforce language/dialect validation and inject into prompt ═══
      const guardrailCtx: GuardrailContext = { targetLanguage: language, targetDialect: dialect, sourceSystem: "creator_engine" };
      const guardrailCheck = enforceGuardrails(guardrailCtx);
      const guardrailPrompt = buildLLMGuardrailPrompt(language, dialect);

      const systemPrompt = `You are an immersive language teacher creating culturally-rich exercises for a ${level} level student learning ${language}${dialect ? ` (${dialect} dialect)` : ""}.

${guardrailPrompt}

RULES:
1. ALL exercises teach vocabulary IN ${language} with pronunciation guides
2. Every exercise is rooted in REAL cultural scenarios from ${language}-speaking cultures
3. NEVER create generic "translate this word" exercises — make them EXPERIENCES
4. Wrong answers get culturally-aware corrections (character reacts naturally)
5. Difficulty matches ${level}: A1=single words/basic phrases, A2=simple sentences, B1=paragraphs, B2+=complex scenarios
6. Include pronunciation for EVERY target-language word/phrase
${dialectNote}
${errorContext}

EXERCISE TYPES (generate 4-6, mix these):
1. story_choice: Interactive scenario where character speaks in ${language}, student picks correct response
2. cultural_discovery: Present a cultural tradition/food/dance, teach vocabulary around it
3. conversation_chain: Back-and-forth dialogue, student picks responses
4. fill_the_order: Complete a real-world task (order food, fill form, write message)
5. match_pairs: Match cultural items with meanings/descriptions
6. grammar_comparison: Whiteboard-style side-by-side grammar table comparing English and ${language}
7. visual_vocab: CIA-style visual association — vivid scene description + vocabulary items with imagePrompts
8. whiteboard_teaching: Teacher writes on whiteboard step-by-step, asks student to complete/answer, grades response
9. rrt: Rhythmic Reinforcement Training — progressive speed-up repetition drill (slow→normal→fast), student echoes phrases at increasing speed
10. netflix_dictation: 4-step dictation cycle (listen→write→compare→imitate) using authentic dialogue clips
${creatorInjection}${culturalMomentInjection}`;

      const userPrompt = `Generate an adaptive lesson for: "${lessonTopic}" (category: ${lessonCategory}).
${culturalFocus ? `Cultural focus: ${culturalFocus}` : "Include authentic cultural content."}

Return JSON:
{
  "lessonTitle": "string",
  "culturalContext": "string",
  "inspiredBy": ["creator names"],
  "exercises": [
    {
      "type": "exercise type",
      "title": "string",
      "scenario": "string",
      "character": { "name": "string", "role": "string", "emoji": "string" },
      "steps": [
        {
          "prompt": "string in ${language}",
          "promptTranslation": "string English",
          "pronunciation": "string",
          "options": ["opt1", "opt2", "opt3", "opt4"],
          "correctIndex": 0,
          "correctFeedback": "string in ${language}",
          "wrongFeedback": "string correction",
          "culturalNote": "string",
          "imagePrompt": "string vivid scene (for visual_vocab type)"
        }
      ],
      "vocabularyLearned": [
        { "word": "string", "pronunciation": "string", "meaning": "string", "imagePrompt": "string optional" }
      ],
      "rrtPhrases": [
        { "phrase": "target language phrase", "translation": "English", "pronunciation": "phonetic guide", "encouragement": "Rocky-style cheer" }
      ],
      "dictationClips": [
        { "transcript": "correct text in target language", "translation": "English", "pronunciation": "phonetic", "source": "Movie/Show name", "explanation": "notes on contractions/slang" }
      ]
    }
  ],
  "totalXP": number,
  "culturalInsight": "string",
  "creatorMethodsUsed": ["descriptions of methods applied"]
}`;

      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          responseFormat: { type: "json_object" },
          maxTokens: 4000,
        });

        const content = result.choices[0]?.message?.content;
        const textContent = typeof content === "string" ? content :
          Array.isArray(content) ? (content.find((c: any) => c.type === "text") as any)?.text || "{}" : "{}";
        
        const parsedLesson = JSON.parse(textContent);

        // ═══ GUARDRAIL: Validate LLM output for cross-language contamination ═══
        const outputValidation = validateLLMOutput(textContent, language, guardrailCtx);
        if (outputValidation.violations.length > 0) {
          console.warn(`[CreatorEngine] Guardrail violations in lesson output:`, outputValidation.violations.map(v => v.message));
        }

        // ═══ KNOWLEDGE VAULT: Store the generated lesson + all vocab ═══
        try {
          const allVocab: Array<{ word: string; pronunciation?: string; meaning: string }> = [];
          if (parsedLesson.exercises) {
            for (const ex of parsedLesson.exercises) {
              if (ex.vocabularyLearned) {
                allVocab.push(...ex.vocabularyLearned);
              }
            }
          }
          await vault.storeLesson({
            title: parsedLesson.lessonTitle || lessonTopic,
            language,
            dialect,
            cefrLevel: level,
            category: lessonCategory,
            topic: lessonTopic,
            culturalContext: parsedLesson.culturalContext || parsedLesson.culturalInsight,
            exercises: parsedLesson.exercises,
            vocabTaught: allVocab,
            creatorMethodsUsed: selectedTemplates.map(t => ({ creatorName: t.creatorName, method: t.method })),
            inspiredByCreators: selectedTemplates.map(t => t.creatorName),
            totalXP: parsedLesson.totalXP || 100,
          });

          // Store creator knowledge — what methods we used from each creator
          for (const tmpl of selectedTemplates) {
            await vault.storeCreatorKnowledge({
              creatorName: tmpl.creatorName,
              handle: tmpl.handle,
              platform: "instagram",
              teachingMethods: [{ method: tmpl.method, description: tmpl.contentType }],
              contentType: tmpl.contentType,
            });
          }
        } catch (vaultErr) {
          console.error("[CreatorEngine] Vault storage error (non-fatal):", vaultErr);
        }
        // ═══ END KNOWLEDGE VAULT ═══

        return { 
          success: true, 
          lesson: parsedLesson,
          creatorsUsed: selectedTemplates.map(t => ({ name: t.creatorName, method: t.method, type: t.contentType })),
        };
      } catch (error: any) {
        return { success: false, lesson: null, error: error.message, creatorsUsed: [] };
      }
    }),

  /** Generate a Suno song prompt from creator music styles — for ANY language */
  generateSongPrompt: publicProcedure
    .input(z.object({
      language: z.string(),
      dialect: z.string().optional(),
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
      topic: z.string(),
      vocabWords: z.array(z.string()).optional(),
      preferredStyle: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { language, dialect, level, topic, vocabWords, preferredStyle } = input;

      // Fetch music-style creators from Airtable — STRICT: only for the target language
      let musicTemplates: CreatorTemplate[] = [];
      try {
        const creators = await fetchCreators(language);
        const allTemplates = creators.map(resolveCreatorTemplate);
        musicTemplates = allTemplates.filter(t => 
          t.contentType === "music" || t.musicTags.length > 1
        );
        // If preferred style specified, prioritize matching
        if (preferredStyle) {
          const preferred = musicTemplates.filter(t => 
            t.musicTags.some(tag => tag.toLowerCase().includes(preferredStyle.toLowerCase())) ||
            t.creatorName.toLowerCase().includes(preferredStyle.toLowerCase())
          );
          if (preferred.length > 0) musicTemplates = preferred;
        }
      } catch {
        musicTemplates = [];
      }

      const styleContext = musicTemplates.length > 0
        ? `Music style inspiration from creators: ${musicTemplates.map(t => `${t.creatorName} (${t.musicTags.join(", ")})`).join("; ")}`
        : "Create a catchy, modern song";

      const vocabContext = vocabWords?.length
        ? `MUST include these vocabulary words naturally in the lyrics: ${vocabWords.join(", ")}`
        : "";

      // ═══ GUARDRAIL: Enforce language safety for song generation ═══
      const songGuardrailCtx: GuardrailContext = { targetLanguage: language, targetDialect: dialect, sourceSystem: "creator_engine" };
      const songGuardrailPrompt = buildLLMGuardrailPrompt(language, dialect);

      const prompt = `Generate a song for ${language}${dialect ? ` (${dialect})` : ""} learners at ${level} level.

${songGuardrailPrompt}

Topic: ${topic}
${styleContext}
${vocabContext}

The song should:
1. Be a REAL song people would listen to (not a children's jingle)
2. Teach vocabulary naturally through lyrics
3. Have a catchy, repetitive chorus (easy to memorize)
4. Match ${level} complexity
5. Include cultural references from ${language}-speaking cultures

Return JSON:
{
  "title": "song title in ${language}",
  "titleEnglish": "English translation of title",
  "genre": "genre tags for Suno",
  "mood": "mood description",
  "tempo": "BPM range",
  "lyrics": "full song lyrics in ${language} with [Verse], [Chorus], [Bridge] markers",
  "lyricsTranslation": "English translation of lyrics",
  "vocabTaught": [{ "word": "string", "meaning": "string", "lineReference": "which lyric line" }],
  "sunoPrompt": "the style/genre prompt to send to Suno API",
  "sunoTags": "comma-separated tags for Suno",
  "teachingNotes": "what this song teaches and at what level"
}`;

      try {
        const result = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          responseFormat: { type: "json_object" },
          maxTokens: 3000,
        });

        const content = result.choices[0]?.message?.content;
        const textContent = typeof content === "string" ? content :
          Array.isArray(content) ? (content.find((c: any) => c.type === "text") as any)?.text || "{}" : "{}";
        
        const parsedSong = JSON.parse(textContent);

        // ═══ GUARDRAIL: Validate song output for cross-language contamination ═══
        const songOutputValidation = validateLLMOutput(textContent, language, songGuardrailCtx);
        if (songOutputValidation.violations.length > 0) {
          console.warn(`[CreatorEngine] Guardrail violations in song output:`, songOutputValidation.violations.map(v => v.message));
        }

        // ═══ KNOWLEDGE VAULT: Store the generated song + vocab ═══
        try {
          await vault.storeSong({
            title: parsedSong.title || topic,
            titleEnglish: parsedSong.titleEnglish,
            language,
            dialect,
            genre: parsedSong.genre || parsedSong.sunoTags,
            mood: parsedSong.mood,
            tempo: parsedSong.tempo,
            cefrLevel: level,
            lyrics: parsedSong.lyrics,
            lyricsTranslation: parsedSong.lyricsTranslation,
            vocabTaught: parsedSong.vocabTaught,
            sunoPrompt: parsedSong.sunoPrompt,
            sunoTags: parsedSong.sunoTags,
            inspiredByCreator: musicTemplates.map(t => t.creatorName).join(", "),
            musicStyle: musicTemplates.flatMap(t => t.musicTags).join(", "),
            teachingNotes: parsedSong.teachingNotes,
          });
        } catch (vaultErr) {
          console.error("[CreatorEngine] Song vault storage error (non-fatal):", vaultErr);
        }
        // ═══ END KNOWLEDGE VAULT ═══

        return { 
          success: true, 
          song: parsedSong,
          musicCreatorsUsed: musicTemplates.map(t => t.creatorName),
        };
      } catch (error: any) {
        return { success: false, song: null, error: error.message };
      }
    }),

  /** Generate content/reel ideas from creator styles — for ANY language */
  generateContentIdeas: publicProcedure
    .input(z.object({
      language: z.string(),
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
      count: z.number().min(1).max(20).optional(),
      platform: z.enum(["instagram", "tiktok", "youtube", "all"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { language, level, count = 5, platform = "all" } = input;

      let templates: CreatorTemplate[] = [];
      try {
        // STRICT: only fetch creators for the target language
        const creators = await fetchCreators(language);
        templates = creators.map(resolveCreatorTemplate);
      } catch {
        templates = [];
      }

      const creatorContext = templates.length > 0
        ? `Content creators we study for inspiration:\n${templates.map(t => `- ${t.creatorName}: ${t.contentPromptTemplate.split("\n")[0]}`).join("\n")}`
        : "";

      // ═══ GUARDRAIL: Enforce language safety for content ideas ═══
      const contentGuardrailPrompt = buildLLMGuardrailPrompt(language);

      const prompt = `Generate ${count} viral content/reel ideas for teaching ${language} to ${level} learners.

${contentGuardrailPrompt}

Platform: ${platform}
${creatorContext}

Each idea should be inspired by the creator styles above but adapted for ${language}.
The content must be ENTERTAINMENT FIRST — learning happens naturally.

Return JSON:
{
  "ideas": [
    {
      "title": "string — catchy hook",
      "format": "reel|carousel|story|short",
      "duration": "seconds",
      "hook": "first 2 seconds — what grabs attention",
      "concept": "what the content shows/teaches",
      "script": "brief script outline",
      "vocabTaught": ["words taught"],
      "inspiredBy": "which creator style",
      "viralPotential": "why this would get shared",
      "hashtags": ["relevant hashtags"]
    }
  ]
}`;

      try {
        const result = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          responseFormat: { type: "json_object" },
          maxTokens: 3000,
        });

        const content = result.choices[0]?.message?.content;
        const textContent = typeof content === "string" ? content :
          Array.isArray(content) ? (content.find((c: any) => c.type === "text") as any)?.text || "{}" : "{}";
        
        return { success: true, ...JSON.parse(textContent) };
      } catch (error: any) {
        return { success: false, ideas: [], error: error.message };
      }
    }),

  /** Get the level placement matrix — shows what teaching method works at which level */
  getLevelMatrix: publicProcedure.query(() => {
    return { 
      success: true, 
      matrix: LEVEL_PLACEMENT_MATRIX,
      description: "Maps teaching methods to CEFR levels. Each method has optimal levels, exercise types, and complexity guides.",
    };
  }),

  /**
   * Generate Visual Association (CIA method) vocabulary pack
   * Returns vocab items with AI-generated scene image URLs + distractor words for Spot the Word game
   */
  generateVisualVocab: publicProcedure
    .input(z.object({
      language: z.string(),
      dialect: z.string().optional(),
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
      topic: z.string(),
      wordCount: z.number().min(4).max(12).optional(),
    }))
    .mutation(async ({ input }) => {
      const { language, dialect, level, topic, wordCount = 6 } = input;

      // ═══ GUARDRAIL ═══
      const guardrailCtx: GuardrailContext = { targetLanguage: language, targetDialect: dialect, sourceSystem: "creator_engine" };
      enforceGuardrails(guardrailCtx);
      const guardrailPrompt = buildLLMGuardrailPrompt(language, dialect);

      // 1. Generate vocabulary items with image scene descriptions via LLM
      const systemPrompt = `You are a visual language learning expert implementing the CIA visual association method.
You create vivid, culturally authentic scene descriptions that pair with vocabulary words.

${guardrailPrompt}

RULES:
- ALL words must be in ${language}${dialect ? ` (${dialect} dialect)` : ""}
- Each word gets a vivid scene description that visually represents the word's meaning
- Scene descriptions should be culturally authentic (real places, real scenarios from ${language}-speaking cultures)
- Include 3 plausible distractor words for each item (wrong answers for the Spot the Word game)
- Distractors must be real ${language} words at the same ${level} level, NOT random gibberish
- Difficulty: ${level === "A1" ? "single concrete nouns/verbs" : level === "A2" ? "everyday objects and actions" : level === "B1" ? "abstract concepts and compound phrases" : "complex vocabulary and idiomatic expressions"}`;

      const userPrompt = `Generate ${wordCount} visual association vocabulary items for the topic: "${topic}"

Return JSON:
{
  "vocabItems": [
    {
      "word": "word in ${language}",
      "translation": "English meaning",
      "pronunciation": "phonetic guide",
      "gender": "masculine/feminine/neutral or null",
      "sceneDescription": "A vivid 1-2 sentence description of a culturally authentic scene that visually represents this word. Be specific about colors, people, setting.",
      "imagePrompt": "Detailed image generation prompt: a photorealistic scene showing [the concept]. Include specific cultural details, warm lighting, vibrant colors. Style: editorial photography, 4K quality.",
      "distractors": ["wrong1 in ${language}", "wrong2 in ${language}", "wrong3 in ${language}"],
      "culturalNote": "Brief cultural context about this word",
      "example": "Example sentence using this word in ${language}"
    }
  ],
  "theme": "${topic}",
  "culturalContext": "Brief overview of the cultural setting for this vocabulary pack"
}`;

      try {
        const llmResult = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          responseFormat: { type: "json_object" },
          maxTokens: 3000,
        });

        const content = llmResult.choices[0]?.message?.content;
        const textContent = typeof content === "string" ? content :
          Array.isArray(content) ? (content.find((c: any) => c.type === "text") as any)?.text || "{}" : "{}";
        const parsed = JSON.parse(textContent);

        // ═══ GUARDRAIL: Validate output ═══
        const outputValidation = validateLLMOutput(textContent, language, guardrailCtx);
        if (outputValidation.violations.length > 0) {
          console.warn(`[VisualVocab] Guardrail violations:`, outputValidation.violations.map(v => v.message));
        }

        // 2. Generate images for each vocab item (in parallel, max 3 at a time)
        const vocabItems = parsed.vocabItems || [];
        const itemsWithImages = [];

        for (let i = 0; i < vocabItems.length; i++) {
          const item = vocabItems[i];
          let imageUrl = "";
          try {
            const imgResult = await generateImage({
              prompt: item.imagePrompt || `A vivid, culturally authentic scene representing the concept of "${item.translation}". ${item.sceneDescription}. Style: colorful illustration, warm lighting, educational, suitable for language learning.`,
            });
            imageUrl = imgResult.url || "";
          } catch (imgErr) {
            console.warn(`[VisualVocab] Image generation failed for "${item.word}":`, imgErr);
            // Continue without image — client will show a placeholder
          }

          itemsWithImages.push({
            ...item,
            imageUrl,
            id: `va_${Date.now()}_${i}`,
          });
        }

        // 3. Store vocab in Knowledge Vault
        try {
          for (const item of itemsWithImages) {
            await vault.storeVocab({
              word: item.word,
              meaning: item.translation,
              pronunciation: item.pronunciation,
              language,
              dialect,
              cefrLevel: level,
              category: topic,
              sourceCreator: "visual_association_cia",
              exampleSentence: item.example,
              culturalNote: item.culturalNote,
            });
          }
        } catch (vaultErr) {
          console.error("[VisualVocab] Vault storage error (non-fatal):", vaultErr);
        }

        return {
          success: true,
          vocabItems: itemsWithImages,
          theme: parsed.theme || topic,
          culturalContext: parsed.culturalContext || "",
          level,
          language,
          dialect,
        };
      } catch (error: any) {
        return { success: false, vocabItems: [], error: error.message };
      }
    }),

  /**
   * Generate an interactive whiteboard lesson (Omar-style)
   * Returns step-by-step teacher writing + questions with expected answers + multiple choice options
   * Supports dual input: student can WRITE/SCRIBBLE answer or TAP multiple choice
   */
  generateWhiteboardLesson: publicProcedure
    .input(z.object({
      language: z.string(),
      dialect: z.string().optional(),
      nativeLanguage: z.string().optional(),
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
      topic: z.string(),
      lessonType: z.enum(["grammar", "conjugation", "vocabulary", "pronunciation", "confusing_words"]).optional(),
      stepCount: z.number().min(3).max(8).optional(),
    }))
    .mutation(async ({ input }) => {
      const { language, dialect, nativeLanguage = "English", level, topic, lessonType = "grammar", stepCount = 5 } = input;

      // Guardrails
      const guardrailCtx: GuardrailContext = { targetLanguage: language, targetDialect: dialect, sourceSystem: "creator_engine" };
      enforceGuardrails(guardrailCtx);
      const guardrailPrompt = buildLLMGuardrailPrompt(language, dialect);

      const systemPrompt = `You are an expert language teacher giving a whiteboard lesson, inspired by @inglesconomar's teaching style.
You write step-by-step on a whiteboard, explaining grammar rules, verb conjugations, and sentence structures.
After each teaching step, you ask the student a question they must answer.

${guardrailPrompt}

TEACHING STYLE:
- Write clearly on the whiteboard, one concept at a time
- Use color coding: "blue" for teacher writing, "red" for key terms/rules, "green" for correct answers
- After explaining, ask a question that tests what was just taught
- Provide 4 multiple choice options (1 correct, 3 plausible distractors) as fallback
- Also provide the expected written answer for scribble/write mode
- Include phonetic pronunciation in parentheses for ${language} words
- For confusing words: show side-by-side comparison like Spider-Man meme
- Show ${nativeLanguage} translation alongside ${language} for clarity
- Progressive difficulty: start easy, build up within the lesson
- Be warm and encouraging like a patient teacher`;

      const userPrompt = `Create a ${stepCount}-step whiteboard lesson on: "${topic}"
Language: ${language}${dialect ? ` (${dialect})` : ""}
Level: ${level}
Lesson type: ${lessonType}
Student's native language: ${nativeLanguage}

Return JSON:
{
  "lessonTitle": "string",
  "teacherName": "Profe Omar",
  "estimatedMinutes": number,
  "steps": [
    {
      "stepNumber": 1,
      "type": "teach | question",
      "boardContent": [
        {
          "text": "what appears on the whiteboard",
          "color": "blue | red | green | orange",
          "size": "large | medium | small",
          "position": "left | center | right",
          "underline": false
        }
      ],
      "teacherSays": "what the teacher says while writing (in ${nativeLanguage})",
      "pronunciation": "phonetic pronunciation guide if applicable",
      "question": {
        "prompt": "the question asked to student",
        "expectedAnswer": "the correct written answer",
        "acceptableAnswers": ["other acceptable written forms"],
        "multipleChoice": [
          { "text": "option A", "correct": true },
          { "text": "option B", "correct": false },
          { "text": "option C", "correct": false },
          { "text": "option D", "correct": false }
        ],
        "explanation": "shown after answering, explains why the answer is correct",
        "hint": "optional hint if student is stuck"
      }
    }
  ],
  "summary": {
    "keyRule": "the main rule/concept taught",
    "practicePhrase": "a phrase to remember",
    "nextTopic": "what to study next"
  }
}`;

      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          responseFormat: { type: "json_object" },
          maxTokens: 4000,
        });

        const content = result.choices[0]?.message?.content;
        const textContent = typeof content === "string" ? content :
          Array.isArray(content) ? (content.find((c: any) => c.type === "text") as any)?.text || "{}" : "{}";
        const parsed = JSON.parse(textContent);

        // Validate output language
        if (parsed.steps) {
          const validation = validateLLMOutput(textContent, language, guardrailCtx);
          if (!validation.allowed && validation.violations.length > 0) {
            console.warn("[WhiteboardLesson] Language validation warnings:", validation.violations.map(v => v.message));
          }
        }

        // Shuffle multiple choice options for each question step
        if (parsed.steps) {
          for (const step of parsed.steps) {
            if (step.question?.multipleChoice) {
              step.question.multipleChoice = step.question.multipleChoice
                .sort(() => Math.random() - 0.5);
            }
          }
        }

        // Store vocab in Knowledge Vault
        try {
          for (const step of (parsed.steps || [])) {
            if (step.question?.expectedAnswer) {
              await vault.storeVocab({
                word: step.question.expectedAnswer,
                meaning: step.question.prompt,
                pronunciation: step.pronunciation || "",
                language,
                dialect,
                cefrLevel: level,
                category: topic,
                sourceCreator: "whiteboard_lesson",
                exampleSentence: step.boardContent?.map((b: any) => b.text).join(" ") || "",
              });
            }
          }
        } catch (vaultErr) {
          console.error("[WhiteboardLesson] Vault storage error (non-fatal):", vaultErr);
        }

        return {
          success: true,
          ...parsed,
          level,
          language,
          dialect,
          lessonType,
        };
      } catch (error: any) {
        return { success: false, steps: [], error: error.message };
      }
    }),
});
