/**
 * Creator-to-Curriculum Pipeline
 * 
 * Reads creators from Airtable, extracts their teaching methods and content styles,
 * and converts them into exercise generation parameters that shape how lessons are taught.
 * 
 * Flow: Airtable Creators → Teaching Method Registry → AI Exercise Prompt Injection
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

// ─── Airtable Config ────────────────────────────────────────────────────────

const AIRTABLE_API = "https://api.airtable.com/v0";

function getAirtableHeaders() {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) throw new Error("AIRTABLE_API_KEY not set");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function getBaseId() {
  const id = process.env.AIRTABLE_BASE_ID;
  if (!id) throw new Error("AIRTABLE_BASE_ID not set");
  return id;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreatorRecord {
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

export interface TeachingMethod {
  id: string;
  creatorName: string;
  creatorHandle: string;
  /** The core teaching approach */
  method: string;
  /** How this translates to exercise generation */
  exerciseStyle: string;
  /** What kind of content this creator inspires */
  contentType: "music" | "visual" | "conversational" | "cultural" | "entertainment" | "hybrid";
  /** Specific prompt injection for the AI exercise generator */
  promptInjection: string;
  /** Exercise types this method favors */
  preferredExerciseTypes: string[];
  /** Visual description style for image generation */
  visualStyle?: string;
  /** Music genre for song-based exercises */
  musicGenre?: string;
  /** Target vocabulary domains */
  vocabDomains: string[];
}

// ─── Teaching Method Registry ───────────────────────────────────────────────
// Maps known creator styles to exercise generation parameters.
// This is the bridge between "who we study" and "how we teach."

const TEACHING_METHOD_MAP: Record<string, Partial<TeachingMethod>> = {
  // CK Learns Spanish — CIA Visual Association Method
  "ck.learnsspanish": {
    method: "Visual Association (CIA Method) — pair every word with a vivid cultural scene image",
    exerciseStyle: "image_association",
    contentType: "visual",
    promptInjection: `TEACHING STYLE: Visual Association (CIA Method)
- Every vocabulary word MUST be paired with a vivid, specific image description
- Use "imagePrompt" field: describe a culturally-authentic scene that makes the word unforgettable
- Example: "mercado" → imagePrompt: "A bustling Dominican street market at golden hour, wooden stalls overflowing with tropical fruits, a vendor holding up a bright yellow mango"
- The image should tell a STORY, not just show the object
- Include sensory details (colors, sounds, smells described visually)
- Each exercise step should have an "imagePrompt" field describing what the learner should visualize`,
    preferredExerciseTypes: ["cultural_discovery", "match_pairs", "visual_vocab"],
    visualStyle: "Cinematic cultural scenes, warm lighting, authentic locations, vibrant colors",
    vocabDomains: ["everyday objects", "food", "places", "cultural items"],
  },

  // Lenexx — Funketón music-based learning
  "lenexxmusic": {
    method: "Music-based learning — teach through catchy Funketón songs (Baile Funk + Reggaeton)",
    exerciseStyle: "music_rhythm",
    contentType: "music",
    promptInjection: `TEACHING STYLE: Music-Based Learning (Funketón)
- Frame exercises as if the student is learning lyrics to a catchy song
- Use rhythm and repetition: present phrases in a pattern that feels like a chorus
- Include "singAlong" hints: mark which words fall on the beat
- Vocabulary should be street-level, Caribbean, danceable
- Wrong answers should feel "off-beat" — the character says "that doesn't flow right"
- Cultural context: Dominican/Caribbean party culture, dance moves, street life`,
    preferredExerciseTypes: ["fill_the_order", "conversation_chain", "story_choice"],
    musicGenre: "Funketón (Baile Funk + Reggaeton)",
    vocabDomains: ["slang", "party", "dance", "street talk", "Caribbean expressions"],
  },

  // Valerie Luh — Flamenco Soul emotional vocabulary
  "valerieluh": {
    method: "Emotional/acoustic music — teach feelings and deep expression through Flamenco Soul",
    exerciseStyle: "emotional_expression",
    contentType: "music",
    promptInjection: `TEACHING STYLE: Emotional Expression (Flamenco Soul)
- Focus on FEELINGS and emotional vocabulary
- Frame exercises as poetic/lyrical scenarios — love letters, heartfelt conversations, self-reflection
- Use acoustic, intimate tone in character dialogue
- Vocabulary: emotions, relationships, self-expression, romantic phrases
- Characters should be warm, introspective, artistic
- Include "mood" context: what emotion is being expressed and why
- Cultural context: Flamenco tradition, Spanish poetry, Latin romance`,
    preferredExerciseTypes: ["story_choice", "conversation_chain", "cultural_discovery"],
    musicGenre: "Flamenco Soul (Flamenco + Soul + Blues)",
    vocabDomains: ["emotions", "relationships", "self-expression", "romantic phrases", "poetry"],
  },

  // Spanish with Sofis — Colombian conversational warmth
  "spanish_with_sofis": {
    method: "Warm conversational teaching — Colombian style, like learning from a friend",
    exerciseStyle: "conversational_warmth",
    contentType: "conversational",
    promptInjection: `TEACHING STYLE: Conversational Warmth (Colombian)
- Teach like a warm Colombian friend, not a textbook
- Use real Colombian expressions and slang naturally in dialogue
- Characters should be encouraging, patient, and use diminutives (amorcito, mijita)
- Frame exercises as real conversations you'd have in Medellín or Bogotá
- Include Colombian-specific cultural references (coffee culture, salsa, arepa making)
- Corrections should feel like a friend gently helping, not a teacher grading
- Use "parce" and other Colombian colloquialisms naturally`,
    preferredExerciseTypes: ["conversation_chain", "story_choice", "fill_the_order"],
    vocabDomains: ["everyday conversation", "Colombian slang", "food", "social situations"],
  },

  // Speak Spanish Faster (Rocky) — Practical speed challenges
  "speakspanishfaster": {
    method: "Speed challenge teaching — practical everyday phrases with timed pressure",
    exerciseStyle: "speed_challenge",
    contentType: "conversational",
    promptInjection: `TEACHING STYLE: Speed Challenge (Practical Everyday)
- Frame exercises as CHALLENGES: "Can you understand this?" "How fast can you respond?"
- Use real-world speed: native speakers talk fast, train the ear
- Include "speedRound" flag on exercises that should be timed
- Vocabulary is PRACTICAL: ordering food, asking directions, understanding natives
- Characters speak at natural speed, not textbook-slow
- Include "nativeSpeed" audio hints: how a real native would say it vs textbook pronunciation
- Corrections include "what you heard" vs "what was actually said"`,
    preferredExerciseTypes: ["conversation_chain", "fill_the_order", "story_choice"],
    vocabDomains: ["practical phrases", "street Spanish", "fast speech", "listening comprehension"],
  },

  // Masaka Kids Africana — Joyful entertainment-first learning
  "masakakidsafricana": {
    method: "Joy-first entertainment — learn through dance, music, celebration, pure fun",
    exerciseStyle: "joyful_entertainment",
    contentType: "entertainment",
    promptInjection: `TEACHING STYLE: Joyful Entertainment (Masaka Kids Style)
- Make EVERY exercise feel like a celebration, not a test
- Characters are energetic, dancing, celebrating correct answers
- Use movement cues: "Dance to the beat while you say it!"
- Wrong answers get encouraging "Try again! You almost got it! 💃🕺"
- Include "celebration" moments after each correct answer
- Frame vocabulary as part of a dance/song/game
- Cultural context: celebration, community, joy, togetherness
- This style is for keeping users ENTERTAINED — learning is the side effect`,
    preferredExerciseTypes: ["match_pairs", "fill_the_order", "story_choice"],
    vocabDomains: ["celebration", "music", "dance", "community", "greetings", "fun phrases"],
  },

  // Spanish with Tuta — Daily phrase-based conversational learning
  "spanishwithtuta": {
    method: "Daily Phrase Immersion — teach one practical phrase per lesson with natural bilingual delivery",
    exerciseStyle: "phrase_immersion",
    contentType: "conversational",
    promptInjection: `TEACHING STYLE: Daily Phrase Immersion (Spanish with Tuta Style)
- Focus on ONE practical phrase or expression per exercise
- Present alternatives to overused words (e.g., "instead of always saying Si, try...")
- Use natural bilingual code-switching between English and Spanish
- Keep tone casual, relatable, and encouraging — like a cool friend teaching you
- Include pronunciation tips and context for WHEN to use each phrase
- Frame exercises as "sound more natural" rather than "learn grammar rules"
- Cultural context: Colombian/Latin American everyday speech
- Target heritage speakers reconnecting AND new learners wanting to sound natural`,
    preferredExerciseTypes: ["conversation_chain", "story_choice", "fill_the_order"],
    vocabDomains: ["daily phrases", "alternatives to common words", "informal speech", "slang", "expressions"],
  },

  // HelloTalk / Langbeats — Cinematic single-phrase scenes
  "hellotalk_spanish": {
    method: "Cinematic phrase cards — one phrase per beautiful illustrated scene",
    exerciseStyle: "cinematic_cards",
    contentType: "visual",
    promptInjection: `TEACHING STYLE: Cinematic Phrase Cards (HelloTalk/Langbeats Style)
- Each vocabulary item gets a CINEMATIC scene description
- One phrase per scene — don't overload
- Scenes should be Instagram-worthy: beautiful, aspirational, culturally rich
- Include "sceneDescription" for each vocab item: a full visual scene in 1-2 sentences
- The phrase should feel like a movie subtitle over a beautiful shot
- Characters are stylish, modern, urban
- Mix everyday phrases with aspirational lifestyle content`,
    preferredExerciseTypes: ["cultural_discovery", "match_pairs", "visual_vocab"],
    visualStyle: "Cinematic illustrations, pop art, urban scenes, golden hour lighting",
    vocabDomains: ["everyday phrases", "urban life", "lifestyle", "travel"],
  },
};

// ─── Airtable Reader ────────────────────────────────────────────────────────

async function fetchCreatorsFromAirtable(): Promise<CreatorRecord[]> {
  const baseId = getBaseId();
  const url = `${AIRTABLE_API}/${baseId}/Creators?maxRecords=100`;
  
  const res = await fetch(url, { headers: getAirtableHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable fetch failed: ${res.status} ${text}`);
  }
  
  const data = await res.json();
  return (data.records || []).map((rec: any) => ({
    id: rec.id,
    name: rec.fields["Name"] || "",
    handle: rec.fields["Handle"] || "",
    platform: rec.fields["Platform"] || "",
    language: rec.fields["Language"] || "",
    region: rec.fields["Country/Region"] || rec.fields["Region"] || "",
    contentStyle: Array.isArray(rec.fields["Content Style"]) 
      ? rec.fields["Content Style"] 
      : [rec.fields["Content Style"] || ""],
    notes: rec.fields["Notes"] || "",
    profileUrl: rec.fields["Profile URL"] || "",
  }));
}

// ─── Teaching Method Resolver ───────────────────────────────────────────────

function resolveTeachingMethods(creators: CreatorRecord[]): TeachingMethod[] {
  const methods: TeachingMethod[] = [];
  
  for (const creator of creators) {
    // Try to match by handle (strip @)
    const cleanHandle = creator.handle.replace("@", "").toLowerCase();
    const mapped = TEACHING_METHOD_MAP[cleanHandle];
    
    if (mapped) {
      methods.push({
        id: creator.id,
        creatorName: creator.name,
        creatorHandle: creator.handle,
        method: mapped.method || "General teaching",
        exerciseStyle: mapped.exerciseStyle || "general",
        contentType: mapped.contentType || "hybrid",
        promptInjection: mapped.promptInjection || "",
        preferredExerciseTypes: mapped.preferredExerciseTypes || [],
        visualStyle: mapped.visualStyle,
        musicGenre: mapped.musicGenre,
        vocabDomains: mapped.vocabDomains || [],
      });
    } else {
      // For creators without a pre-mapped method, derive from their notes
      methods.push({
        id: creator.id,
        creatorName: creator.name,
        creatorHandle: creator.handle,
        method: `Teaching style derived from ${creator.name}: ${creator.notes.slice(0, 200)}`,
        exerciseStyle: "general",
        contentType: deriveContentType(creator),
        promptInjection: buildDynamicPromptInjection(creator),
        preferredExerciseTypes: ["story_choice", "conversation_chain"],
        vocabDomains: deriveVocabDomains(creator),
      });
    }
  }
  
  return methods;
}

function deriveContentType(creator: CreatorRecord): TeachingMethod["contentType"] {
  const styles = creator.contentStyle.map(s => s.toLowerCase());
  const notes = creator.notes.toLowerCase();
  if (styles.includes("music") || notes.includes("music") || notes.includes("song")) return "music";
  if (notes.includes("visual") || notes.includes("image") || notes.includes("cia")) return "visual";
  if (styles.includes("educational") || notes.includes("teach")) return "conversational";
  if (styles.includes("entertainment")) return "entertainment";
  return "hybrid";
}

function deriveVocabDomains(creator: CreatorRecord): string[] {
  const domains: string[] = [];
  const notes = creator.notes.toLowerCase();
  if (notes.includes("slang")) domains.push("slang");
  if (notes.includes("grammar")) domains.push("grammar");
  if (notes.includes("conversation")) domains.push("conversation");
  if (notes.includes("food") || notes.includes("cook")) domains.push("food");
  if (notes.includes("travel") || notes.includes("vacation")) domains.push("travel");
  if (notes.includes("music") || notes.includes("song")) domains.push("music vocabulary");
  if (notes.includes("culture") || notes.includes("tradition")) domains.push("cultural terms");
  if (notes.includes("emotion") || notes.includes("feeling")) domains.push("emotions");
  if (domains.length === 0) domains.push("everyday vocabulary");
  return domains;
}

function buildDynamicPromptInjection(creator: CreatorRecord): string {
  const region = creator.region || "general";
  const styles = creator.contentStyle.join(", ");
  return `TEACHING STYLE: Inspired by ${creator.name} (${region})
- Content style: ${styles}
- Key approach: ${creator.notes.slice(0, 300)}
- Use authentic ${region} cultural references and expressions
- Make exercises feel like content from this creator's page — engaging, authentic, not textbook`;
}

// ─── Blend Multiple Creator Styles ──────────────────────────────────────────

function blendTeachingStyles(
  methods: TeachingMethod[],
  language: string,
  lessonCategory: string,
): string {
  // Pick the most relevant methods for this lesson
  const relevant = methods.filter(m => {
    // Music creators for vocabulary/speaking lessons
    if (m.contentType === "music" && ["vocabulary", "speaking"].includes(lessonCategory)) return true;
    // Visual creators for vocabulary lessons
    if (m.contentType === "visual" && lessonCategory === "vocabulary") return true;
    // Conversational creators for grammar/speaking
    if (m.contentType === "conversational" && ["grammar", "speaking", "listening"].includes(lessonCategory)) return true;
    // Entertainment creators always add flavor
    if (m.contentType === "entertainment") return true;
    // Hybrid creators are always relevant
    if (m.contentType === "hybrid") return true;
    return false;
  });

  if (relevant.length === 0) return "";

  // Pick up to 2 styles to blend (avoid overwhelming the prompt)
  const selected = relevant.slice(0, 2);
  
  const blendedPrompt = selected.map((m, i) => {
    return `\n--- CREATOR STYLE ${i + 1}: ${m.creatorName} ---\n${m.promptInjection}`;
  }).join("\n");

  return `\n\n=== CREATOR-INSPIRED TEACHING METHODS ===
The following teaching styles are inspired by real content creators we study.
BLEND these approaches into your exercises — don't just use one, combine them creatively.
${blendedPrompt}
=== END CREATOR STYLES ===\n`;
}

// ─── Visual Association Exercise Type ───────────────────────────────────────

const VISUAL_VOCAB_PROMPT_ADDITION = `
7. visual_vocab: CIA-style visual association exercise. Present a vivid cultural scene description (imagePrompt), 
   then ask the student to identify/match vocabulary from the scene. Each vocab item gets its own imagePrompt 
   describing a specific, memorable visual. The student taps objects in the "scene" to learn words.
   Include fields: imagePrompts (array of {word, imagePrompt, pronunciation, meaning})`;

// ─── tRPC Router ────────────────────────────────────────────────────────────

export const creatorPipelineRouter = router({
  /** Fetch all creators from Airtable with their resolved teaching methods */
  getCreators: publicProcedure.query(async () => {
    try {
      const creators = await fetchCreatorsFromAirtable();
      const methods = resolveTeachingMethods(creators);
      return { success: true, creators, methods, count: creators.length };
    } catch (error: any) {
      return { success: false, creators: [], methods: [], count: 0, error: error.message };
    }
  }),

  /** Get teaching methods for a specific language (filters by language field) */
  getMethodsForLanguage: publicProcedure
    .input(z.object({ language: z.string() }))
    .query(async ({ input }) => {
      try {
        const creators = await fetchCreatorsFromAirtable();
        const filtered = creators.filter(c => 
          c.language.toLowerCase().includes(input.language.toLowerCase())
        );
        const methods = resolveTeachingMethods(filtered);
        return { success: true, methods, count: methods.length };
      } catch (error: any) {
        return { success: false, methods: [], count: 0, error: error.message };
      }
    }),

  /** Generate a creator-inspired lesson — the main pipeline endpoint */
  generateCreatorLesson: publicProcedure
    .input(z.object({
      language: z.string(),
      dialect: z.string().optional(),
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
      lessonTopic: z.string(),
      lessonCategory: z.string(),
      culturalFocus: z.string().optional(),
      previousErrors: z.array(z.string()).optional(),
      /** Specific creator handles to use as style inspiration */
      creatorStyles: z.array(z.string()).optional(),
      /** Include visual association exercises */
      includeVisualVocab: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { language, dialect, level, lessonTopic, lessonCategory, culturalFocus, previousErrors, creatorStyles, includeVisualVocab } = input;

      // 1. Fetch creators from Airtable
      let methods: TeachingMethod[] = [];
      try {
        const creators = await fetchCreatorsFromAirtable();
        const langCreators = creators.filter(c =>
          c.language.toLowerCase().includes(language.toLowerCase()) || 
          c.contentStyle.some(s => s.toLowerCase().includes("entertainment"))
        );
        methods = resolveTeachingMethods(langCreators);
        
        // If specific creator styles requested, filter to those
        if (creatorStyles?.length) {
          const requested = methods.filter(m => 
            creatorStyles.some(cs => 
              m.creatorHandle.toLowerCase().includes(cs.toLowerCase()) ||
              m.creatorName.toLowerCase().includes(cs.toLowerCase())
            )
          );
          if (requested.length > 0) methods = requested;
        }
      } catch {
        // If Airtable fails, continue without creator styles
        methods = [];
      }

      // 2. Build the creator-inspired prompt injection
      const creatorStylePrompt = blendTeachingStyles(methods, language, lessonCategory);
      const visualVocabType = includeVisualVocab ? VISUAL_VOCAB_PROMPT_ADDITION : "";

      const dialectNote = dialect ? `The student is learning the ${dialect} dialect/variant.` : "";
      const errorContext = previousErrors?.length
        ? `The student previously struggled with: ${previousErrors.join(", ")}. Reinforce these.`
        : "";

      // 3. Build the enhanced system prompt
      const systemPrompt = `You are an immersive language teacher creating culturally-rich exercises for a ${level} level student learning ${language}${dialect ? ` (${dialect} dialect)` : ""}.

RULES:
1. ALL exercises teach vocabulary IN ${language} with pronunciation guides
2. Every exercise is rooted in REAL cultural scenarios (real foods, dances, holidays, traditions)
3. NEVER create generic "translate this word" exercises - make them EXPERIENCES
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
${visualVocabType}
${creatorStylePrompt}`;

      const userPrompt = `Generate an adaptive lesson for: "${lessonTopic}" (category: ${lessonCategory}).
${culturalFocus ? `Cultural focus: ${culturalFocus}` : "Include authentic cultural content."}

IMPORTANT: Apply the creator-inspired teaching styles above. The exercises should FEEL like content from those creators — not generic textbook exercises.

Return JSON:
{
  "lessonTitle": "string - engaging title with cultural hook",
  "culturalContext": "string - 1-2 sentences setting the scene",
  "inspiredBy": ["creator names that influenced this lesson"],
  "exercises": [
    {
      "type": "exercise type",
      "title": "string",
      "scenario": "string - scene description",
      "character": { "name": "string", "role": "string", "emoji": "string" },
      "steps": [
        {
          "prompt": "string - in ${language}",
          "promptTranslation": "string - English",
          "pronunciation": "string",
          "options": ["option1", "option2", "option3", "option4"],
          "correctIndex": 0,
          "correctFeedback": "string - in ${language}",
          "wrongFeedback": "string - correction",
          "culturalNote": "string",
          "imagePrompt": "string - vivid scene description for visual association (if visual_vocab type)"
        }
      ],
      "vocabularyLearned": [
        { "word": "string", "pronunciation": "string", "meaning": "string", "imagePrompt": "string - optional visual scene" }
      ]
    }
  ],
  "totalXP": number,
  "culturalInsight": "string - fascinating cultural fact",
  "creatorMethodsUsed": ["description of teaching methods applied"]
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
        
        const lesson = JSON.parse(textContent);
        return { 
          success: true, 
          lesson,
          methodsApplied: methods.map(m => ({ name: m.creatorName, method: m.method })),
        };
      } catch (error: any) {
        // Fallback to basic lesson if AI fails
        return { 
          success: false, 
          lesson: getFallbackCreatorLesson(language, level, lessonTopic),
          methodsApplied: [],
          error: error.message,
        };
      }
    }),

  /** Generate visual vocabulary cards with image prompts for a topic */
  generateVisualVocab: publicProcedure
    .input(z.object({
      language: z.string(),
      dialect: z.string().optional(),
      level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
      topic: z.string(),
      wordCount: z.number().min(5).max(20).optional(),
    }))
    .mutation(async ({ input }) => {
      const { language, dialect, level, topic, wordCount = 10 } = input;

      const prompt = `Generate ${wordCount} visual vocabulary cards for a ${level} ${language}${dialect ? ` (${dialect})` : ""} learner.
Topic: "${topic}"

For EACH word, create a vivid, culturally-authentic image description that makes the word UNFORGETTABLE.
This is the CIA's visual association method — the image should create a strong mental link to the word.

Return JSON:
{
  "topic": "${topic}",
  "cards": [
    {
      "word": "string in ${language}",
      "pronunciation": "string phonetic guide",
      "meaning": "string English meaning",
      "imagePrompt": "string - 2-3 sentence vivid scene description. Be SPECIFIC: colors, lighting, cultural details, emotional tone. This will be used to generate an AI image.",
      "memoryHook": "string - a memorable association or mnemonic",
      "exampleSentence": "string in ${language}",
      "exampleTranslation": "string English",
      "culturalNote": "string - optional cultural context"
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
        return { success: false, topic, cards: [], error: error.message };
      }
    }),
});

// ─── Fallback ───────────────────────────────────────────────────────────────

function getFallbackCreatorLesson(language: string, level: string, topic: string) {
  return {
    lessonTitle: `${topic} — Creator-Inspired Lesson`,
    culturalContext: `An immersive ${language} experience focused on ${topic}, inspired by real content creators.`,
    inspiredBy: ["ConnectWorld AI"],
    exercises: [
      {
        type: "story_choice",
        title: "Street Scene",
        scenario: `You're walking through a vibrant neighborhood and encounter a local.`,
        character: { name: "Local Guide", role: "friendly neighbor", emoji: "🙋‍♀️" },
        steps: [{
          prompt: language === "Spanish" ? "¡Hola! ¿Eres nuevo por aquí?" : "Hello! Are you new around here?",
          promptTranslation: "Hello! Are you new around here?",
          pronunciation: "OH-la EH-res NWEH-vo por ah-KEE",
          options: ["Sí, acabo de llegar", "No entiendo", "¿Dónde está el baño?", "Me llamo..."],
          correctIndex: 0,
          correctFeedback: "¡Bienvenido! Te va a encantar este barrio.",
          wrongFeedback: "Hmm, try again — they asked if you're new here.",
          culturalNote: "In Latin America, neighbors often greet newcomers warmly.",
        }],
        vocabularyLearned: [
          { word: "nuevo", pronunciation: "NWEH-vo", meaning: "new" },
          { word: "barrio", pronunciation: "BAH-ree-oh", meaning: "neighborhood" },
        ],
      },
    ],
    totalXP: 30,
    culturalInsight: "Community and neighborliness are core values across Latin American cultures.",
    creatorMethodsUsed: ["Conversational warmth", "Cultural immersion"],
  };
}
