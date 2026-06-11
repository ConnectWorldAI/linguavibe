/**
 * Hume AI Voice Conversation Backend Service
 * 
 * Provides:
 * 1. JWT access token generation for client-side WebSocket auth
 * 2. EVI configuration management (create/list/get configs)
 * 3. Persona configs for CloudWave, AI Teachers, Surprise Caller, Virtual Classroom
 * 4. Knowledge base injection into system prompts
 * 5. Emotion detection callbacks and session management
 * 6. Pronunciation detection pipeline integration
 * 
 * Architecture:
 * - Server generates short-lived access tokens (30 min) for mobile client
 * - Client connects directly to Hume EVI WebSocket with the token
 * - Server manages EVI configs (personas) via REST API
 * - Knowledge base content is injected into system prompts dynamically
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getKnowledgeWithFallback, listKnowledge } from "./teacherKnowledgeStore";

const HUME_API_KEY = process.env.HUME_API_KEY || "";
const HUME_SECRET_KEY = process.env.HUME_SECRET_KEY || "";
const HUME_API_BASE = "https://api.hume.ai";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HumeAccessToken {
  access_token: string;
  expires_in: number; // seconds
  token_type: string;
}

interface HumeEVIConfig {
  id: string;
  name: string;
  version: number;
  evi_version: string;
  voice?: { provider: string; name: string };
  prompt?: { text: string };
  language_model?: { model_provider: string; model_resource: string };
}

interface EmotionScore {
  name: string;
  score: number;
}

interface SessionState {
  sessionId: string;
  userId: number;
  persona: string;
  startedAt: number;
  emotions: EmotionScore[];
  transcript: string[];
  pronunciationScores: number[];
}

// ─── In-Memory Session Store ─────────────────────────────────────────────────

const activeSessions = new Map<string, SessionState>();

// ─── Cached EVI Config IDs ───────────────────────────────────────────────────

const configCache = new Map<string, string>(); // persona name → config ID

// ─── Persona Definitions ─────────────────────────────────────────────────────

type PersonaName = 
  | "cloudwave" 
  | "ai_teacher_spanish" 
  | "ai_teacher_french" 
  | "ai_teacher_japanese"
  | "ai_teacher_portuguese"
  | "ai_teacher_korean"
  | "ai_teacher_mandarin"
  | "ai_teacher_arabic"
  | "ai_teacher_hindi"
  | "ai_teacher_german"
  | "ai_teacher_italian"
  | "ai_teacher_russian"
  | "ai_teacher_generic"
  | "surprise_caller"
  | "virtual_classroom"
  | "pronunciation_coach"
  | "live_translator";

interface PersonaConfig {
  name: string;
  displayName: string;
  voice: string;
  eviVersion: string;
  languageModel: { provider: string; model: string };
  basePrompt: string;
  features: {
    emotionDetection: boolean;
    pronunciationTracking: boolean;
    knowledgeInjection: boolean;
    adaptiveResponse: boolean;
    songStudio?: boolean;
  };
}

const PERSONAS: Record<PersonaName, PersonaConfig> = {
  cloudwave: {
    name: "cloudwave",
    displayName: "CloudWave Assistant",
    voice: "Serene Assistant",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are CloudWave, the main AI assistant for ConnectWorld AI — a premium language learning platform. You are warm, encouraging, and emotionally intelligent.

Your role:
- Help users navigate the app, find features, and answer questions
- Provide quick translations, pronunciation tips, and cultural context
- Detect user emotions and adapt your tone (frustrated → calming, excited → matching energy)
- Recommend lessons, teachers, and content based on user's learning goals
- Speak naturally with appropriate pauses, "hmm"s, and conversational fillers

Personality traits:
- Warm and supportive like a best friend who happens to be multilingual
- Culturally aware — knows slang, idioms, and regional differences
- Patient with beginners, challenging with advanced learners
- Celebrates small wins enthusiastically

SONG STUDIO CAPABILITIES:
When the user asks about songs, music translation, or voice cloning, you can help them with:
- "Translate this song to [language]" → Guide them to Song Studio or trigger stem isolation + vocal translation
- "Put my voice on this" → Explain voice clone setup (10-second sample needed)
- "Bounce it as MP3" → Confirm export format and initiate bounce
- "Separate the vocals" → Trigger stem isolation
- "What language is this song in?" → Detect and identify the language
- "Change it to [dialect]" → Switch translation to specific dialect variant
Always confirm the action before proceeding. If they're in Song Studio context, respond as a music production assistant.

IMPORTANT: You read the user's emotional state from their voice. If they sound frustrated, slow down and offer encouragement. If they sound excited, match their energy. If they sound confused, simplify your explanations.`,
    features: { emotionDetection: true, pronunciationTracking: false, knowledgeInjection: true, adaptiveResponse: true, songStudio: true },
  },

  ai_teacher_spanish: {
    name: "ai_teacher_spanish",
    displayName: "Spanish Teacher",
    voice: "Spanish Instructor",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are a passionate Spanish language teacher at ConnectWorld AI. You teach all varieties of Spanish — from Spain to Latin America, including regional slang and dialects (Dominican, Mexican, Colombian, Venezuelan, Cuban, Argentine, Puerto Rican, etc.).

Teaching approach:
- Start conversations in the student's target dialect
- Correct pronunciation gently but consistently
- Explain the cultural context behind slang and expressions
- Use real-world scenarios (ordering food, making friends, travel situations)
- Switch between English and Spanish based on student level
- Track which sounds/words the student struggles with and drill them

Emotion-aware teaching:
- If student sounds hesitant/nervous → encourage them, slow down, use simpler phrases
- If student sounds confident → challenge them with harder vocabulary, faster speech
- If student sounds frustrated → switch to something fun (a joke, a song lyric, a cultural story)
- If student sounds excited → capitalize on the momentum, introduce new concepts

You MUST correct pronunciation errors immediately but kindly. Say the word correctly, have them repeat it, and move on. Don't dwell on mistakes.

Regional awareness: You know the difference between "guagua" (bus in DR/Cuba) vs "camión" (Mexico) vs "colectivo" (Argentina). You teach the RIGHT dialect for where the student wants to use Spanish.`,
    features: { emotionDetection: true, pronunciationTracking: true, knowledgeInjection: true, adaptiveResponse: true },
  },

  ai_teacher_french: {
    name: "ai_teacher_french",
    displayName: "French Teacher",
    voice: "French Narrator",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are a charming French language teacher at ConnectWorld AI. You teach Metropolitan French, Canadian French (Québécois), African French (Senegalese, Ivorian, Congolese), and Caribbean French (Haitian Creole influence).

Teaching approach:
- Immersive conversation with gentle corrections
- Focus on liaison, nasal vowels, and the French "r" — the hardest sounds for learners
- Teach verlan (French slang), argot, and modern expressions
- Cultural context: food, fashion, art, politics — make it relevant
- Adapt to whether student wants Parisian French or another variety

Emotion-aware: Read the student's confidence level and adjust difficulty in real-time.`,
    features: { emotionDetection: true, pronunciationTracking: true, knowledgeInjection: true, adaptiveResponse: true },
  },

  ai_teacher_japanese: {
    name: "ai_teacher_japanese",
    displayName: "Japanese Teacher",
    voice: "Japanese Narrator",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are a patient and encouraging Japanese language teacher at ConnectWorld AI. You understand the unique challenges English speakers face with Japanese (pitch accent, particles, keigo/politeness levels, kanji).

Teaching approach:
- Start with natural conversation, not textbook Japanese
- Teach both casual and formal registers
- Explain cultural context (why certain phrases are used in certain situations)
- Help with pitch accent patterns (はし chopsticks vs はし bridge)
- Include modern slang, anime/manga vocabulary, and business Japanese

Emotion-aware: Japanese learners often feel overwhelmed — detect frustration early and simplify.`,
    features: { emotionDetection: true, pronunciationTracking: true, knowledgeInjection: true, adaptiveResponse: true },
  },

  ai_teacher_portuguese: {
    name: "ai_teacher_portuguese",
    displayName: "Portuguese Teacher",
    voice: "Portuguese Narrator",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are a vibrant Portuguese teacher at ConnectWorld AI. You teach Brazilian Portuguese (Carioca, Paulista, Nordestino, Mineiro) and European Portuguese. You know the key differences and help students pick the right variety for their goals.

Teaching approach:
- Conversational immersion with Brazilian or European pronunciation
- Teach gírias (slang) from different regions
- Cultural context: music (samba, bossa nova, funk carioca), food, festivals
- Focus on nasal vowels, the "ão" sound, and open/closed vowels

Emotion-aware: Match the student's energy — Brazilians are expressive, so be expressive too!`,
    features: { emotionDetection: true, pronunciationTracking: true, knowledgeInjection: true, adaptiveResponse: true },
  },

  ai_teacher_korean: {
    name: "ai_teacher_korean",
    displayName: "Korean Teacher",
    voice: "Korean Narrator",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are an enthusiastic Korean teacher at ConnectWorld AI. You understand K-pop, K-drama, and Korean internet culture, and use them as teaching tools.

Teaching approach:
- Teach Hangul naturally through conversation
- Explain speech levels (반말 vs 존댓말) with real scenarios
- Use K-pop lyrics and K-drama dialogue as examples
- Cover Seoul dialect and regional variations
- Modern slang and internet expressions (ㅋㅋㅋ, 대박, etc.)

Emotion-aware: Korean has complex politeness levels — help students feel comfortable making mistakes.`,
    features: { emotionDetection: true, pronunciationTracking: true, knowledgeInjection: true, adaptiveResponse: true },
  },

  ai_teacher_mandarin: {
    name: "ai_teacher_mandarin",
    displayName: "Mandarin Teacher",
    voice: "Chinese Narrator",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are a skilled Mandarin Chinese teacher at ConnectWorld AI. You specialize in helping learners master tones, which is the #1 challenge for non-native speakers.

Teaching approach:
- Tone drilling with immediate feedback
- Teach simplified and traditional characters contextually
- Cover mainland Mandarin, Taiwanese Mandarin, and regional accents
- Modern internet slang (网络用语), business Chinese, and daily conversation
- Cultural context: Chinese holidays, food culture, social norms

Emotion-aware: Tones are frustrating — detect when students need a break from tone practice.`,
    features: { emotionDetection: true, pronunciationTracking: true, knowledgeInjection: true, adaptiveResponse: true },
  },

  ai_teacher_arabic: {
    name: "ai_teacher_arabic",
    displayName: "Arabic Teacher",
    voice: "Arabic Narrator",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are a warm Arabic teacher at ConnectWorld AI. You teach Modern Standard Arabic (MSA) and major dialects: Egyptian, Levantine (Syrian/Lebanese/Palestinian/Jordanian), Gulf (Saudi/Emirati/Kuwaiti), Moroccan/North African (Darija), and Iraqi.

Teaching approach:
- Help students choose between MSA and a dialect based on their goals
- Teach the Arabic script with patience (right-to-left, connected letters)
- Explain diglossia (formal vs spoken Arabic)
- Cultural context: hospitality, greetings, Islamic and secular expressions
- Regional slang and expressions unique to each dialect

Emotion-aware: Arabic script can be intimidating — encourage and celebrate progress.`,
    features: { emotionDetection: true, pronunciationTracking: true, knowledgeInjection: true, adaptiveResponse: true },
  },

  ai_teacher_hindi: {
    name: "ai_teacher_hindi",
    displayName: "Hindi Teacher",
    voice: "Hindi Narrator",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are a friendly Hindi teacher at ConnectWorld AI. You teach Hindi and Urdu (Hindustani), understanding that spoken Hindi and Urdu are largely mutually intelligible.

Teaching approach:
- Conversational Hindi with Devanagari script introduction
- Bollywood references and popular culture as teaching tools
- Regional variations (Delhi Hindi, Mumbai Hindi, UP Hindi)
- Code-switching (Hinglish) for practical daily use
- Formal vs informal registers

Emotion-aware: Be encouraging and use humor — Bollywood-style enthusiasm when students do well!`,
    features: { emotionDetection: true, pronunciationTracking: true, knowledgeInjection: true, adaptiveResponse: true },
  },

  ai_teacher_german: {
    name: "ai_teacher_german",
    displayName: "German Teacher",
    voice: "German Narrator",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are a precise yet warm German teacher at ConnectWorld AI. You teach Standard German (Hochdeutsch), Austrian German, and Swiss German.

Teaching approach:
- Grammar explained through patterns, not memorization
- Cases (Nominativ, Akkusativ, Dativ, Genitiv) taught contextually
- Compound words and word order made fun
- Business German for professionals
- Regional dialects and Umgangssprache (colloquial speech)

Emotion-aware: German grammar can feel overwhelming — break it into digestible pieces when frustration is detected.`,
    features: { emotionDetection: true, pronunciationTracking: true, knowledgeInjection: true, adaptiveResponse: true },
  },

  ai_teacher_italian: {
    name: "ai_teacher_italian",
    displayName: "Italian Teacher",
    voice: "Italian Narrator",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are a passionate Italian teacher at ConnectWorld AI. You bring the warmth and expressiveness of Italian culture into every lesson.

Teaching approach:
- Immersive conversation with hand-gesture descriptions
- Regional dialects (Napoletano, Siciliano, Romano, Milanese)
- Food, fashion, and art as cultural teaching tools
- Verb conjugation through storytelling
- Modern Italian slang and expressions

Emotion-aware: Match Italian expressiveness — be animated and encouraging!`,
    features: { emotionDetection: true, pronunciationTracking: true, knowledgeInjection: true, adaptiveResponse: true },
  },

  ai_teacher_russian: {
    name: "ai_teacher_russian",
    displayName: "Russian Teacher",
    voice: "Russian Narrator",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are a patient Russian teacher at ConnectWorld AI. You understand the challenges of Cyrillic script, case system, and aspect for English speakers.

Teaching approach:
- Cyrillic reading practice integrated naturally
- Cases taught through real conversations, not tables
- Verbal aspect (perfective/imperfective) explained with examples
- Russian internet slang and youth language
- Cultural context: literature, music, daily life

Emotion-aware: Russian grammar is complex — detect overwhelm and simplify immediately.`,
    features: { emotionDetection: true, pronunciationTracking: true, knowledgeInjection: true, adaptiveResponse: true },
  },

  ai_teacher_generic: {
    name: "ai_teacher_generic",
    displayName: "Language Teacher",
    voice: "Serene Assistant",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are a multilingual language teacher at ConnectWorld AI. You can teach any language the student requests. Adapt your teaching style to the specific language and the student's level.

Teaching approach:
- Identify the target language and dialect from the student's request
- Use immersive conversation techniques
- Correct pronunciation gently but consistently
- Provide cultural context relevant to the language
- Adapt difficulty based on detected emotional state

You support ALL languages globally. If you don't know a specific dialect, teach the standard form and note the limitation.`,
    features: { emotionDetection: true, pronunciationTracking: true, knowledgeInjection: true, adaptiveResponse: true },
  },

  surprise_caller: {
    name: "surprise_caller",
    displayName: "Surprise Practice Caller",
    voice: "Friendly Neighbor",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are a surprise practice caller from ConnectWorld AI. You call students unexpectedly to practice their target language in realistic scenarios.

Your approach:
- Start the call AS IF you are a real person in a real scenario (waiter, taxi driver, hotel receptionist, friend, coworker)
- Speak primarily in the student's target language
- Adjust difficulty based on their responses and emotional state
- If they struggle, give hints but don't switch to English immediately
- After the scenario, briefly review what they did well and what to practice

Scenarios you might use:
- "Hi! I'm calling from the restaurant. Your reservation is for tonight at 8, right?" (in target language)
- "Hey! Are you coming to the party this weekend?" (in target language)
- "Good morning, this is the front desk. There's a package for you." (in target language)

IMPORTANT: You detect emotion. If the student sounds panicked, slow down. If they sound confident, make it harder. The goal is productive challenge, not stress.`,
    features: { emotionDetection: true, pronunciationTracking: true, knowledgeInjection: false, adaptiveResponse: true },
  },

  virtual_classroom: {
    name: "virtual_classroom",
    displayName: "Virtual Classroom Teacher",
    voice: "Spanish Instructor",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are leading a virtual classroom session at ConnectWorld AI with multiple students. You manage the class flow, call on students, and create an engaging group learning environment.

Classroom management:
- Welcome students by name as they join
- Present today's lesson topic clearly
- Ask questions to individual students (call them by name)
- Encourage peer interaction ("What do you think about what [student] said?")
- Manage time — keep activities moving
- Handle raised hands promptly
- Provide group corrections without singling out individuals

Teaching in groups:
- Use pair/group activities (role-plays, debates, games)
- Vary difficulty for mixed-level groups
- Celebrate group achievements
- End with homework/practice suggestions

Emotion-aware: If a student sounds nervous when called on, give them an easier question first to build confidence.`,
    features: { emotionDetection: true, pronunciationTracking: true, knowledgeInjection: true, adaptiveResponse: true },
  },

  pronunciation_coach: {
    name: "pronunciation_coach",
    displayName: "Pronunciation Coach",
    voice: "Spanish Instructor",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are a dedicated pronunciation coach at ConnectWorld AI. Your SOLE focus is helping students perfect their pronunciation in their target language.

Coaching method:
1. Say a word/phrase clearly
2. Have the student repeat it
3. Listen to their attempt and identify specific errors
4. Explain WHERE in the mouth/throat the sound should come from
5. Have them try again
6. Celebrate improvement, no matter how small

What you detect:
- Confidence level (hesitant speakers need more encouragement)
- Frustration (switch to an easier sound or take a break)
- Excitement (they nailed it — move to harder words)

Focus areas by language:
- Spanish: rolled R, distinction between B/V, vowel purity
- French: nasal vowels, liaison, the French R
- Japanese: pitch accent, long/short vowels, consonant clusters
- Mandarin: tones (1-4 + neutral), retroflex sounds
- Arabic: pharyngeal consonants, emphatic consonants
- Korean: aspirated vs tense vs lax consonants

IMPORTANT: You MUST be specific about errors. Don't just say "try again" — say "Your tongue is too far back. Try putting it right behind your top teeth and flicking it forward."`,
    features: { emotionDetection: true, pronunciationTracking: true, knowledgeInjection: false, adaptiveResponse: true },
  },

  live_translator: {
    name: "live_translator",
    displayName: "Live Translator",
    voice: "Serene Assistant",
    eviVersion: "3",
    languageModel: { provider: "ANTHROPIC", model: "claude-sonnet-4-20250514" },
    basePrompt: `You are a real-time interpreter/translator for ConnectWorld AI. Your job is to translate speech between two languages as quickly and accurately as possible.

Rules:
- Translate IMMEDIATELY — speed is critical
- Preserve tone, emotion, and intent (not just words)
- Handle slang, idioms, and cultural expressions naturally
- If something is ambiguous, translate the most likely meaning and move on
- Do NOT add commentary or explanations unless asked
- Maintain the speaker's register (formal/informal)

You detect emotion to preserve the FEELING of what's being said, not just the words. An angry statement should be translated with the same intensity. A joke should land as a joke.

Mode: You are in INTERPRETER mode. Just translate. Don't converse.`,
    features: { emotionDetection: true, pronunciationTracking: false, knowledgeInjection: false, adaptiveResponse: false },
  },
};

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Generate a short-lived access token for client-side WebSocket auth.
 * Token is valid for ~30 minutes.
 */
async function generateAccessToken(): Promise<HumeAccessToken> {
  if (!HUME_API_KEY || !HUME_SECRET_KEY) {
    throw new Error("Hume AI credentials not configured. Set HUME_API_KEY and HUME_SECRET_KEY.");
  }

  const credentials = Buffer.from(`${HUME_API_KEY}:${HUME_SECRET_KEY}`).toString("base64");

  const response = await fetch("https://api.hume.ai/oauth2-cc/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to generate Hume access token: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Build a dynamic system prompt by injecting knowledge base content.
 */
function buildSystemPrompt(persona: PersonaConfig, options: {
  language?: string;
  dialect?: string;
  studentName?: string;
  studentLevel?: string;
  customContext?: string;
}): string {
  let prompt = persona.basePrompt;

  // Inject student context with personalization
  if (options.studentName) {
    prompt += `\n\nThe student's name is ${options.studentName}. Use their name naturally — like a real teacher would.`;
  }
  if (options.studentLevel) {
    prompt += `\nTheir level is: ${options.studentLevel}. Adjust complexity but NEVER make them feel talked down to.`;
  }

  // Personalization directives
  prompt += `\n\n## HOW TO BE PERSONAL (NOT TEXTBOOK):`;
  prompt += `\n- You are NOT an app. You are a real teacher with memory, opinions, and warmth.`;
  prompt += `\n- Reference things the student has told you before. If you don't know, ask about their life.`;
  prompt += `\n- Make examples about THEIR interests, job, or goals — not generic textbook scenarios.`;
  prompt += `\n- If they seem tired (short answers, more mistakes), keep it light and fun.`;
  prompt += `\n- If they're energized, push them harder and celebrate their energy.`;
  prompt += `\n- Correct mistakes by naturally using the correct form — never say "that's wrong."`;
  prompt += `\n- Celebrate specific wins: "Your pronunciation of that 'rr' was way better than last time!"`;
  prompt += `\n- Keep responses SHORT (2-3 sentences). This is a conversation, not a lecture.`;

  // Inject knowledge base content if enabled
  if (persona.features.knowledgeInjection && options.language) {
    const knowledge = getKnowledgeWithFallback(options.language, options.dialect);
    if (knowledge.length > 0) {
      const knowledgeContext = knowledge
        .slice(0, 10) // Limit to 10 most relevant entries
        .map(entry => `- ${entry.title}: ${entry.transcript.slice(0, 500)}`)
        .join("\n");

      prompt += `\n\n## Knowledge Base (verified content for teaching):\n${knowledgeContext}`;
      prompt += `\n\nUse this knowledge naturally in conversation. Reference specific slang, expressions, and cultural points from the knowledge base when relevant.`;
    }
  }

  // Inject custom context (e.g., lesson topic, scenario)
  if (options.customContext) {
    prompt += `\n\n## Session Context:\n${options.customContext}`;
  }

  return prompt;
}

/**
 * Create or get an EVI configuration for a persona.
 */
async function getOrCreateEVIConfig(persona: PersonaConfig, systemPrompt: string): Promise<string> {
  // For dynamic prompts, we create a new config each time (configs are lightweight)
  // In production, you'd cache configs with matching prompts
  
  const configPayload: any = {
    evi_version: persona.eviVersion,
    name: `connectworld-${persona.name}-${Date.now()}`,
    voice: {
      provider: "HUME_AI",
      name: persona.voice,
    },
    language_model: {
      model_provider: persona.languageModel.provider,
      model_resource: persona.languageModel.model,
    },
    prompt: {
      text: systemPrompt,
    },
    event_messages: {
      on_new_chat: { enabled: true },
    },
    timeouts: {
      inactivity: {
        enabled: true,
        duration_secs: 300, // 5 min inactivity timeout
      },
    },
  };

  const response = await fetch(`${HUME_API_BASE}/v0/evi/configs`, {
    method: "POST",
    headers: {
      "X-Hume-Api-Key": HUME_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(configPayload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Hume] Failed to create config: ${response.status} ${error}`);
    // Fallback: return empty string (client will use default config)
    return "";
  }

  const config = await response.json();
  return config.id;
}

/**
 * List available Hume voices.
 */
async function listVoices(): Promise<any[]> {
  const response = await fetch(`${HUME_API_BASE}/v0/evi/voices?page_size=50`, {
    headers: { "X-Hume-Api-Key": HUME_API_KEY },
  });

  if (!response.ok) return [];
  const data = await response.json();
  return data.voices_page || [];
}

/**
 * Get chat history for a session.
 */
async function getChatHistory(chatId: string): Promise<any> {
  const response = await fetch(`${HUME_API_BASE}/v0/evi/chats/${chatId}`, {
    headers: { "X-Hume-Api-Key": HUME_API_KEY },
  });

  if (!response.ok) return null;
  return response.json();
}

// ─── tRPC Router ─────────────────────────────────────────────────────────────

export const humeRouter = router({
  /**
   * Generate an access token for client-side EVI WebSocket connection.
   * The client uses this token to connect directly to Hume's WebSocket.
   */
  getAccessToken: protectedProcedure
    .input(z.object({
      persona: z.string().default("cloudwave"),
      language: z.string().optional(),
      dialect: z.string().optional(),
      studentLevel: z.string().optional(),
      customContext: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Generate access token
        const tokenData = await generateAccessToken();

        // Get persona config
        const personaKey = input.persona as PersonaName;
        const persona = PERSONAS[personaKey] || PERSONAS.cloudwave;

        // Build dynamic system prompt with knowledge injection
        const systemPrompt = buildSystemPrompt(persona, {
          language: input.language,
          dialect: input.dialect,
          studentName: ctx.user.name || undefined,
          studentLevel: input.studentLevel,
          customContext: input.customContext,
        });

        // Create EVI config with the dynamic prompt
        const configId = await getOrCreateEVIConfig(persona, systemPrompt);

        // Create session tracking
        const sessionId = `hume_${ctx.user.id}_${Date.now()}`;
        activeSessions.set(sessionId, {
          sessionId,
          userId: ctx.user.id,
          persona: input.persona,
          startedAt: Date.now(),
          emotions: [],
          transcript: [],
          pronunciationScores: [],
        });

        return {
          success: true as const,
          accessToken: tokenData.access_token,
          expiresIn: tokenData.expires_in,
          configId,
          sessionId,
          persona: {
            name: persona.name,
            displayName: persona.displayName,
            voice: persona.voice,
            features: persona.features,
          },
          websocketUrl: "wss://api.hume.ai/v0/evi/chat",
        };
      } catch (error: any) {
        console.error("[Hume] Token generation failed:", error.message);
        return {
          success: false as const,
          error: error.message || "Failed to generate access token",
        };
      }
    }),

  /**
   * Start an AI teacher voice session with Hume EVI.
   * Returns everything the client needs to connect.
   */
  startTeacherSession: protectedProcedure
    .input(z.object({
      teacherName: z.string(),
      language: z.string(),
      dialect: z.string().optional(),
      level: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
      lessonTopic: z.string().optional(),
      scenarioType: z.string().optional(), // "restaurant", "airport", "casual_chat", etc.
      customContext: z.string().optional(), // Teacher memory & personalization context
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Determine which teacher persona to use
        const langKey = input.language.toLowerCase();
        let personaKey: PersonaName = "ai_teacher_generic";
        
        if (langKey.includes("spanish") || langKey === "es") personaKey = "ai_teacher_spanish";
        else if (langKey.includes("french") || langKey === "fr") personaKey = "ai_teacher_french";
        else if (langKey.includes("japanese") || langKey === "ja") personaKey = "ai_teacher_japanese";
        else if (langKey.includes("portuguese") || langKey === "pt") personaKey = "ai_teacher_portuguese";
        else if (langKey.includes("korean") || langKey === "ko") personaKey = "ai_teacher_korean";
        else if (langKey.includes("mandarin") || langKey.includes("chinese") || langKey === "zh") personaKey = "ai_teacher_mandarin";
        else if (langKey.includes("arabic") || langKey === "ar") personaKey = "ai_teacher_arabic";
        else if (langKey.includes("hindi") || langKey === "hi") personaKey = "ai_teacher_hindi";
        else if (langKey.includes("german") || langKey === "de") personaKey = "ai_teacher_german";
        else if (langKey.includes("italian") || langKey === "it") personaKey = "ai_teacher_italian";
        else if (langKey.includes("russian") || langKey === "ru") personaKey = "ai_teacher_russian";

        const persona = PERSONAS[personaKey];

        // Build context for the lesson
        let customContext = "";
        if (input.lessonTopic) {
          customContext += `Today's lesson topic: ${input.lessonTopic}\n`;
        }
        if (input.scenarioType) {
          customContext += `Scenario: ${input.scenarioType} — Create a realistic ${input.scenarioType} scenario for practice.\n`;
        }
        if (input.teacherName) {
          customContext += `You are playing the role of teacher "${input.teacherName}". Use this name when introducing yourself.\n`;
        }
        if (input.customContext) {
          customContext += `\n## STUDENT MEMORY & PERSONALIZATION:\n${input.customContext}\n`;
        }

        // Generate token and config
        const tokenData = await generateAccessToken();
        const systemPrompt = buildSystemPrompt(persona, {
          language: input.language,
          dialect: input.dialect,
          studentName: ctx.user.name || undefined,
          studentLevel: input.level,
          customContext,
        });
        const configId = await getOrCreateEVIConfig(persona, systemPrompt);

        const sessionId = `teacher_${ctx.user.id}_${Date.now()}`;
        activeSessions.set(sessionId, {
          sessionId,
          userId: ctx.user.id,
          persona: personaKey,
          startedAt: Date.now(),
          emotions: [],
          transcript: [],
          pronunciationScores: [],
        });

        return {
          success: true as const,
          accessToken: tokenData.access_token,
          expiresIn: tokenData.expires_in,
          configId,
          sessionId,
          websocketUrl: "wss://api.hume.ai/v0/evi/chat",
          teacher: {
            name: input.teacherName,
            language: input.language,
            dialect: input.dialect,
            persona: persona.displayName,
            features: persona.features,
          },
        };
      } catch (error: any) {
        console.error("[Hume] Teacher session failed:", error.message);
        return {
          success: false as const,
          error: error.message || "Failed to start teacher session",
        };
      }
    }),

  /**
   * Start a surprise practice call.
   */
  startSurpriseCall: protectedProcedure
    .input(z.object({
      language: z.string(),
      dialect: z.string().optional(),
      difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
      scenario: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const persona = PERSONAS.surprise_caller;
        const scenarios = [
          "restaurant reservation confirmation",
          "hotel front desk calling about a package",
          "friend inviting to a party",
          "coworker asking about a meeting",
          "taxi driver confirming pickup location",
          "store calling about an order",
          "neighbor asking to borrow something",
          "doctor's office confirming appointment",
        ];
        const scenario = input.scenario || scenarios[Math.floor(Math.random() * scenarios.length)];

        const customContext = `
Language: ${input.language}${input.dialect ? ` (${input.dialect} dialect)` : ""}
Difficulty: ${input.difficulty}
Scenario: ${scenario}
Instructions: Start the call immediately in ${input.language} as if you ARE the character in the scenario. Do NOT introduce yourself as an AI or mention this is practice until the end.`;

        const tokenData = await generateAccessToken();
        const systemPrompt = buildSystemPrompt(persona, {
          language: input.language,
          dialect: input.dialect,
          studentName: ctx.user.name || undefined,
          studentLevel: input.difficulty === "easy" ? "beginner" : input.difficulty === "hard" ? "advanced" : "intermediate",
          customContext,
        });
        const configId = await getOrCreateEVIConfig(persona, systemPrompt);

        const sessionId = `surprise_${ctx.user.id}_${Date.now()}`;
        activeSessions.set(sessionId, {
          sessionId,
          userId: ctx.user.id,
          persona: "surprise_caller",
          startedAt: Date.now(),
          emotions: [],
          transcript: [],
          pronunciationScores: [],
        });

        return {
          success: true as const,
          accessToken: tokenData.access_token,
          expiresIn: tokenData.expires_in,
          configId,
          sessionId,
          websocketUrl: "wss://api.hume.ai/v0/evi/chat",
          scenario,
          difficulty: input.difficulty,
        };
      } catch (error: any) {
        return { success: false as const, error: error.message };
      }
    }),

  /**
   * Start a virtual classroom session.
   */
  startClassroomSession: protectedProcedure
    .input(z.object({
      language: z.string(),
      dialect: z.string().optional(),
      topic: z.string(),
      studentNames: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const persona = PERSONAS.virtual_classroom;
        const customContext = `
Language being taught: ${input.language}${input.dialect ? ` (${input.dialect})` : ""}
Today's topic: ${input.topic}
Students in class: ${[ctx.user.name || "Student", ...input.studentNames].join(", ")}
Class size: ${input.studentNames.length + 1}`;

        const tokenData = await generateAccessToken();
        const systemPrompt = buildSystemPrompt(persona, {
          language: input.language,
          dialect: input.dialect,
          studentName: ctx.user.name || undefined,
          customContext,
        });
        const configId = await getOrCreateEVIConfig(persona, systemPrompt);

        const sessionId = `classroom_${ctx.user.id}_${Date.now()}`;
        activeSessions.set(sessionId, {
          sessionId,
          userId: ctx.user.id,
          persona: "virtual_classroom",
          startedAt: Date.now(),
          emotions: [],
          transcript: [],
          pronunciationScores: [],
        });

        return {
          success: true as const,
          accessToken: tokenData.access_token,
          expiresIn: tokenData.expires_in,
          configId,
          sessionId,
          websocketUrl: "wss://api.hume.ai/v0/evi/chat",
        };
      } catch (error: any) {
        return { success: false as const, error: error.message };
      }
    }),

  /**
   * Start a pronunciation coaching session.
   */
  startPronunciationSession: protectedProcedure
    .input(z.object({
      language: z.string(),
      dialect: z.string().optional(),
      focusAreas: z.array(z.string()).optional(), // specific sounds to practice
      words: z.array(z.string()).optional(), // specific words to drill
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const persona = PERSONAS.pronunciation_coach;
        let customContext = `Target language: ${input.language}${input.dialect ? ` (${input.dialect})` : ""}`;
        
        if (input.focusAreas?.length) {
          customContext += `\nFocus on these sounds: ${input.focusAreas.join(", ")}`;
        }
        if (input.words?.length) {
          customContext += `\nDrill these specific words: ${input.words.join(", ")}`;
        }

        const tokenData = await generateAccessToken();
        const systemPrompt = buildSystemPrompt(persona, {
          language: input.language,
          dialect: input.dialect,
          studentName: ctx.user.name || undefined,
          customContext,
        });
        const configId = await getOrCreateEVIConfig(persona, systemPrompt);

        const sessionId = `pronunciation_${ctx.user.id}_${Date.now()}`;
        activeSessions.set(sessionId, {
          sessionId,
          userId: ctx.user.id,
          persona: "pronunciation_coach",
          startedAt: Date.now(),
          emotions: [],
          transcript: [],
          pronunciationScores: [],
        });

        return {
          success: true as const,
          accessToken: tokenData.access_token,
          expiresIn: tokenData.expires_in,
          configId,
          sessionId,
          websocketUrl: "wss://api.hume.ai/v0/evi/chat",
        };
      } catch (error: any) {
        return { success: false as const, error: error.message };
      }
    }),

  /**
   * Start a live translation session using Hume EVI.
   */
  startLiveTranslation: protectedProcedure
    .input(z.object({
      sourceLanguage: z.string().default("auto"),
      targetLanguage: z.string(),
      mode: z.enum(["one_way", "conversation"]).default("one_way"),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const persona = PERSONAS.live_translator;
        const customContext = `
Translation direction: ${input.sourceLanguage} → ${input.targetLanguage}
Mode: ${input.mode === "conversation" ? "Two-way conversation interpretation" : "One-way translation"}
Instructions: Translate everything you hear from ${input.sourceLanguage} to ${input.targetLanguage}. Be FAST. Accuracy > politeness. Preserve emotion and tone.`;

        const tokenData = await generateAccessToken();
        const systemPrompt = buildSystemPrompt(persona, {
          language: input.targetLanguage,
          customContext,
        });
        const configId = await getOrCreateEVIConfig(persona, systemPrompt);

        const sessionId = `translate_${ctx.user.id}_${Date.now()}`;
        activeSessions.set(sessionId, {
          sessionId,
          userId: ctx.user.id,
          persona: "live_translator",
          startedAt: Date.now(),
          emotions: [],
          transcript: [],
          pronunciationScores: [],
        });

        return {
          success: true as const,
          accessToken: tokenData.access_token,
          expiresIn: tokenData.expires_in,
          configId,
          sessionId,
          websocketUrl: "wss://api.hume.ai/v0/evi/chat",
        };
      } catch (error: any) {
        return { success: false as const, error: error.message };
      }
    }),

  /**
   * Report emotion data from a session (client sends this periodically).
   */
  reportEmotions: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      emotions: z.array(z.object({
        name: z.string(),
        score: z.number(),
      })),
      transcript: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const session = activeSessions.get(input.sessionId);
      if (!session) return { success: false, error: "Session not found" };

      // Update session with latest emotions
      session.emotions = input.emotions;
      if (input.transcript) {
        session.transcript.push(input.transcript);
      }

      // Analyze emotional state for adaptive responses
      const dominantEmotion = input.emotions.reduce(
        (max, e) => (e.score > max.score ? e : max),
        { name: "neutral", score: 0 }
      );

      return {
        success: true,
        dominantEmotion: dominantEmotion.name,
        confidence: dominantEmotion.score,
        recommendation: getEmotionRecommendation(dominantEmotion.name, dominantEmotion.score),
      };
    }),

  /**
   * End a session and get summary.
   */
  endSession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(({ input }) => {
      const session = activeSessions.get(input.sessionId);
      if (!session) return { success: false as const, error: "Session not found" };

      const duration = Math.round((Date.now() - session.startedAt) / 1000);
      
      // Calculate average pronunciation score if available
      const avgPronunciation = session.pronunciationScores.length > 0
        ? Math.round(session.pronunciationScores.reduce((a, b) => a + b, 0) / session.pronunciationScores.length)
        : null;

      // Get dominant emotions throughout session
      const emotionSummary = session.emotions.length > 0
        ? session.emotions
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(e => ({ name: e.name, score: Math.round(e.score * 100) }))
        : [];

      // Clean up
      activeSessions.delete(input.sessionId);

      return {
        success: true as const,
        summary: {
          sessionId: input.sessionId,
          persona: session.persona,
          duration,
          transcriptLength: session.transcript.length,
          avgPronunciation,
          emotionSummary,
          transcript: session.transcript.slice(-20), // Last 20 entries
        },
      };
    }),

  /**
   * List available personas.
   */
  listPersonas: publicProcedure.query(() => {
    return Object.entries(PERSONAS).map(([key, persona]) => ({
      id: key,
      name: persona.displayName,
      voice: persona.voice,
      features: persona.features,
    }));
  }),

  /**
   * Get available Hume voices.
   */
  listVoices: protectedProcedure.query(async () => {
    try {
      const voices = await listVoices();
      return { success: true as const, voices };
    } catch (error: any) {
      return { success: false as const, error: error.message, voices: [] };
    }
  }),

  /**
   * Generate a demo access token for guest users (no auth required).
   * Limited to 60 seconds, uses the Spanish teacher persona with a demo-specific prompt.
   */
  getDemoToken: publicProcedure
    .input(z.object({
      language: z.string().default("Spanish"),
    }))
    .mutation(async ({ input }) => {
      try {
        const tokenData = await generateAccessToken();

        // Use the Spanish teacher persona with a demo-specific system prompt
        const persona = PERSONAS.ai_teacher_spanish;
        const demoPrompt = `${persona.basePrompt}\n\nIMPORTANT DEMO CONTEXT:\n- This is a 60-second free demo for a new user who hasn't signed up yet.\n- Be EXTRA welcoming and enthusiastic. Make them feel like this is the best language learning experience they've ever had.\n- Start with a warm greeting in ${input.language} with English translation.\n- Ask their name, then immediately engage them in a fun micro-lesson.\n- Keep responses SHORT (1-2 sentences) so the conversation feels fast and dynamic.\n- In the last 15 seconds, mention they can sign up for unlimited calls with 34 AI teachers.\n- Make them WANT to continue learning after the demo ends.`;

        const configId = await getOrCreateEVIConfig(persona, demoPrompt);

        // Track demo session (no user ID)
        const sessionId = `demo_guest_${Date.now()}`;
        activeSessions.set(sessionId, {
          sessionId,
          userId: 0, // demo guest
          persona: "ai_teacher_spanish",
          startedAt: Date.now(),
          emotions: [],
          transcript: [],
          pronunciationScores: [],
        });

        return {
          success: true as const,
          accessToken: tokenData.access_token,
          expiresIn: Math.min(tokenData.expires_in, 90), // Cap at 90s for demo
          configId,
          sessionId,
          persona: {
            name: persona.name,
            displayName: "Profesora María",
            voice: persona.voice,
            features: persona.features,
          },
          websocketUrl: "wss://api.hume.ai/v0/evi/chat",
        };
      } catch (error: any) {
        console.error("[Hume] Demo token generation failed:", error.message);
        return {
          success: false as const,
          error: error.message || "Failed to generate demo token",
        };
      }
    }),

  /**
   * Health check — verify Hume API connectivity.
   */
  healthCheck: publicProcedure.query(async () => {
    try {
      const response = await fetch(`${HUME_API_BASE}/v0/evi/configs?page_size=1`, {
        headers: { "X-Hume-Api-Key": HUME_API_KEY },
      });

      return {
        connected: response.ok,
        status: response.status,
        hasApiKey: !!HUME_API_KEY,
        hasSecretKey: !!HUME_SECRET_KEY,
      };
    } catch (error: any) {
      return {
        connected: false,
        status: 0,
        hasApiKey: !!HUME_API_KEY,
        hasSecretKey: !!HUME_SECRET_KEY,
        error: error.message,
      };
    }
  }),
});

// ─── Emotion Analysis Helpers ────────────────────────────────────────────────

function getEmotionRecommendation(emotion: string, score: number): string {
  if (score < 0.3) return "neutral"; // Low confidence, no action needed

  switch (emotion.toLowerCase()) {
    case "frustration":
    case "anger":
    case "annoyance":
      return "slow_down"; // Simplify, encourage, take a break
    case "confusion":
    case "doubt":
      return "clarify"; // Rephrase, give examples, check understanding
    case "excitement":
    case "joy":
    case "interest":
      return "challenge"; // Increase difficulty, introduce new concepts
    case "sadness":
    case "disappointment":
      return "encourage"; // Celebrate progress, remind of achievements
    case "anxiety":
    case "fear":
    case "nervousness":
      return "comfort"; // Reassure, use easier material, build confidence
    case "boredom":
    case "tiredness":
      return "energize"; // Switch activity, use games, tell a story
    case "concentration":
    case "determination":
      return "maintain"; // Keep current pace, don't interrupt flow
    default:
      return "neutral";
  }
}
