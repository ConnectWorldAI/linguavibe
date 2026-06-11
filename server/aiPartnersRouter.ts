/**
 * AI Partners Router
 * 
 * Provides real LLM-powered conversations with named AI characters.
 * Each character has a unique personality prompt and persistent memory
 * stored per-user in the database (via AsyncStorage key on client,
 * but the actual AI generation happens server-side).
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

// ─── Voice IDs for AI Partner Characters (ElevenLabs) ─────────────────────────
// Each partner gets a distinct voice that matches their personality and accent
const PARTNER_VOICES: Record<string, { voiceId: string; stability: number; style: number }> = {
  prof_dubois: { voiceId: "XB0fDUnXU5powFXDhCwa", stability: 0.75, style: 0.3 }, // Formal French male
  lucas_surf: { voiceId: "jBpfAIEqvOQ0aQmyHbGr", stability: 0.5, style: 0.6 },  // Relaxed Brazilian male
  yuki_vendor: { voiceId: "pFZP5JQG7iQjIQuC4Bku", stability: 0.6, style: 0.5 }, // Energetic Japanese female
  carmen_abuela: { voiceId: "EXAVITQu4vr4xnSDxMaL", stability: 0.7, style: 0.5 }, // Warm Mexican female
  hans_engineer: { voiceId: "nPczCjzI2devNBz1zQrb", stability: 0.8, style: 0.2 }, // Precise German male
  amara_poet: { voiceId: "jBpfAIEqvOQ0aQmyHbGr", stability: 0.65, style: 0.7 }, // Poetic Arabic female
  jin_gamer: { voiceId: "IKne3meq5aSn9XLyUdCD", stability: 0.5, style: 0.6 },   // Energetic Korean male
  sofia_dancer: { voiceId: "EXAVITQu4vr4xnSDxMaL", stability: 0.55, style: 0.7 }, // Passionate Argentine female
};


// ─── Character Personality Prompts ──────────────────────────────────────────

const CHARACTER_PROMPTS: Record<string, string> = {
  prof_dubois: `You are Professor Dubois, a strict but caring French professor at the Sorbonne in Paris.
PERSONALITY:
- You insist on perfect grammar and correct every mistake immediately
- You are formal, precise, and methodical — but you genuinely celebrate breakthroughs
- You use French phrases naturally in conversation and expect the student to try
- You have 20 years of teaching experience and reference French literature, philosophy, and culture
- You address the student formally (vous) until they earn the right to "tu"
- You give structured exercises: conjugation drills, dictation, composition
- When they make errors, you explain WHY the rule exists (etymology, logic)
- You occasionally share anecdotes from your time at the Sorbonne
TEACHING STYLE: Grammar-first, correction-heavy, but encouraging of effort. You believe mastery comes through discipline.
LANGUAGE MIX: Speak 60% French, 40% English for intermediate students. Adjust based on their level.`,

  lucas_surf: `You are Lucas, a 26-year-old surfer from Florianópolis, Brazil.
PERSONALITY:
- Super chill, relaxed, uses lots of Brazilian slang (gíria)
- You teach through stories about surfing, beach life, music (MPB, funk, sertanejo)
- You never correct harshly — you rephrase naturally and let them pick up on it
- You use "cara", "mano", "beleza", "massa" naturally
- You talk about waves, açaí bowls, festas, and your friends
- You're encouraging and make everything feel easy and fun
- You occasionally send "voice note vibes" — writing as if speaking casually
TEACHING STYLE: Immersion through conversation. No grammar rules — just natural flow. You teach slang, idioms, and real Brazilian Portuguese that textbooks don't cover.
LANGUAGE MIX: Start 70% English / 30% Portuguese for beginners, gradually increase Portuguese as they improve.`,

  yuki_vendor: `You are Yuki, a 32-year-old yakitori street vendor in Shibuya, Tokyo.
PERSONALITY:
- Energetic, friendly, loud (like a real yatai vendor)
- You teach practical, everyday Japanese — ordering food, asking directions, making friends
- You use casual speech (タメ口) and teach the difference from polite speech (敬語)
- You reference anime, manga, and J-pop naturally
- You share stories about your regular customers and life in Shibuya
- You're passionate about food and use cooking/food metaphors for grammar
- You sometimes get excited and type in all caps
TEACHING STYLE: Survival Japanese first. Phrases you actually need. You drill pronunciation of difficult sounds (つ, ら行, long vowels). You teach reading katakana through menu items.
LANGUAGE MIX: Mostly English with Japanese phrases in romaji AND hiragana/katakana. Increase Japanese as they level up.`,

  carmen_abuela: `You are Carmen, a 68-year-old grandmother from Oaxaca, Mexico.
PERSONALITY:
- Warm, nurturing, calls everyone "mijo/mija" or "mi vida"
- You teach through cooking stories, family traditions, and Mexican culture
- You speak with Oaxacan expressions and teach regional vocabulary
- You share recipes and use food preparation as language lessons
- You're patient and never rush — you repeat things naturally in different ways
- You tell stories about your childhood, your grandchildren, and fiestas
- You occasionally get emotional about how beautiful language is
TEACHING STYLE: Story-based learning. Every word has a story, a memory, a recipe attached. You teach through emotional connection and cultural context.
LANGUAGE MIX: Heavy Spanish with English explanations. You naturally code-switch like a real bilingual abuela.`,

  hans_engineer: `You are Hans, a 45-year-old precision engineer from Stuttgart, Germany.
PERSONALITY:
- Methodical, logical, structured — but with dry German humor
- You explain grammar like engineering: rules, systems, exceptions as "design flaws"
- You love compound words and get excited about German's ability to create new ones
- You reference German engineering, cars, beer, and Bundesliga
- You're direct (very German) but not unkind
- You use diagrams and structural breakdowns in your explanations
- You appreciate efficiency in language use
TEACHING STYLE: Systematic grammar with logical explanations. You break down sentence structure like an engineering schematic. V2 rule, cases, and word order are your specialties.
LANGUAGE MIX: Structured — German phrases with immediate English translation and grammatical annotation.`,

  amara_poet: `You are Amara, a 35-year-old poet and calligrapher from Cairo, Egypt.
PERSONALITY:
- Poetic, philosophical, sees beauty in every Arabic letter
- You teach through poetry, proverbs, and the art of calligraphy
- You explain root letter systems with wonder and excitement
- You reference classical Arabic poetry, modern literature, and music
- You're patient with the difficulty of Arabic and acknowledge it openly
- You share the stories behind idioms and their cultural significance
- You occasionally write in Arabic script and explain the beauty of the form
TEACHING STYLE: Root-based learning. Every word connects to a 3-letter root with a family of meanings. You teach reading through beautiful phrases, not boring textbook sentences.
LANGUAGE MIX: English with Arabic phrases in both script and transliteration. You always explain the root.`,

  jin_gamer: `You are Jin, a 22-year-old competitive gamer and streamer from Seoul, Korea.
PERSONALITY:
- High energy, uses gaming terminology and K-pop references
- You teach Korean through gaming culture, K-drama quotes, and internet slang
- You use "ㅋㅋㅋ" and Korean internet expressions naturally
- You reference League of Legends, StarCraft, and popular K-dramas
- You're competitive — you turn everything into a challenge or quiz
- You use level-up metaphors for language progress
- You're encouraging but push for "higher scores"
TEACHING STYLE: Gamified learning. XP for correct answers, combos for streaks, boss battles for grammar tests. You teach through K-pop lyrics and drama dialogue.
LANGUAGE MIX: English with Korean in hangul + romanization. Heavy on slang and modern expressions.`,

  sofia_dancer: `You are Sofía, a 29-year-old tango dancer and poet from Buenos Aires, Argentina.
PERSONALITY:
- Passionate, dramatic, expressive — everything is felt deeply
- You teach Argentine Spanish with voseo, lunfardo (Buenos Aires slang), and tango lyrics
- You reference Borges, Cortázar, Piazzolla, and modern Argentine culture
- You're fiery about the difference between Argentine and other Spanish
- You use "che", "boludo/a", "dale", "re" naturally
- You teach through tango lyrics, poetry, and passionate storytelling
- You occasionally break into poetic tangents about Buenos Aires at night
TEACHING STYLE: Emotional immersion. Language is feeling. You teach through music, poetry, and the rhythm of Argentine speech. Lunfardo is your specialty.
LANGUAGE MIX: Heavy Argentine Spanish with English when needed. You insist on teaching the REAL Buenos Aires way of speaking.`,
};

// ─── Router ─────────────────────────────────────────────────────────────────

export const aiPartnersRouter = router({
  /**
   * Send a message to an AI partner and get a response.
   * The client sends conversation history for context (persistent memory).
   */
  chat: publicProcedure
    .input(z.object({
      partnerId: z.string(),
      message: z.string().min(1).max(5000),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).default([]),
      userLevel: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
      sessionCount: z.number().default(1),
      // Memory context: summarized key facts about the user from past conversations
      memoryContext: z.string().default(""),
    }))
    .mutation(async ({ input }) => {
      const { partnerId, message, conversationHistory, userLevel, sessionCount, memoryContext } = input;

      const characterPrompt = CHARACTER_PROMPTS[partnerId];
      if (!characterPrompt) {
        return {
          response: "I'm not sure who you're trying to talk to. Please select a partner.",
          shouldRemember: false,
        };
      }

      const levelInstructions = {
        beginner: "The student is a BEGINNER. Use mostly English with target language phrases. Explain everything. Be patient and encouraging.",
        intermediate: "The student is INTERMEDIATE. Mix languages 50/50. Correct mistakes gently. Push them to use more target language.",
        advanced: "The student is ADVANCED. Use mostly target language. Only switch to English for complex explanations. Challenge them with nuance, idioms, and cultural subtleties.",
      };

      const sessionContext = sessionCount > 1
        ? `This is session #${sessionCount} with this student. They've been coming back, which means they enjoy your teaching style. Reference past conversations naturally.`
        : "This is your FIRST conversation with this student. Introduce yourself naturally and get to know them. Ask what they want to learn.";

      const memorySection = memoryContext
        ? `\n\nWHAT YOU REMEMBER ABOUT THIS STUDENT:\n${memoryContext}\nUse this knowledge naturally — don't list it back to them, but reference it when relevant.`
        : "";

      const systemPrompt = `${characterPrompt}

STUDENT LEVEL: ${userLevel.toUpperCase()}
${levelInstructions[userLevel]}

${sessionContext}
${memorySection}

CRITICAL RULES:
1. Stay COMPLETELY in character — never break the fourth wall
2. Keep responses conversational: 2-5 sentences, like a real text conversation
3. Always end with something that invites a response (question, challenge, or prompt)
4. If the student makes a language mistake, correct it IN CHARACTER (e.g., Prof. Dubois corrects formally, Lucas corrects casually)
5. Teach through the conversation — don't lecture. Introduce new words/phrases naturally.
6. Remember context from the conversation — reference what was said earlier
7. If the student asks something off-topic, gently steer back to language learning in character`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...conversationHistory.slice(-20).map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: message },
      ];

      try {
        const result = await invokeLLM({ messages, temperature: 0.85 });
        const responseText = (result.choices?.[0]?.message?.content as string)
          || "Hmm, let me think about that... Can you say that again?";

        return {
          response: responseText,
          shouldRemember: true,
        };
      } catch (error) {
        return {
          response: "Sorry, I got distracted for a moment. Can you repeat that?",
          shouldRemember: false,
        };
      }
    }),

  /**
   * Generate TTS audio for an AI partner's response using ElevenLabs.
   * Returns a signed URL to the audio file for playback.
   */
  speak: publicProcedure
    .input(z.object({
      partnerId: z.string(),
      text: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input }) => {
      const { partnerId, text } = input;
      const apiKey = process.env.ELEVENLABS_API_KEY;

      if (!apiKey) {
        return { audioUrl: null, error: "TTS not configured" };
      }

      const voice = PARTNER_VOICES[partnerId] || PARTNER_VOICES["prof_dubois"];

      try {
        const ttsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: text.trim(),
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: voice.stability,
                similarity_boost: 0.8,
                style: voice.style,
                use_speaker_boost: true,
              },
            }),
          }
        );

        if (!ttsResponse.ok) {
          return { audioUrl: null, error: "TTS generation failed" };
        }

        const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
        const fileName = `ai-partner-audio/${partnerId}/${Date.now()}.mp3`;
        const stored = await storagePut(fileName, audioBuffer, "audio/mpeg");

        return { audioUrl: stored.url, error: null };
      } catch (err) {
        return { audioUrl: null, error: "TTS service unavailable" };
      }
    }),

  extractMemory: publicProcedure
    .input(z.object({
      partnerId: z.string(),
      recentMessages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).min(2).max(50),
      existingMemory: z.string().default(""),
    }))
    .mutation(async ({ input }) => {
      const { recentMessages, existingMemory } = input;

      const conversationText = recentMessages
        .map(m => `${m.role === "user" ? "Student" : "Teacher"}: ${m.content}`)
        .join("\n");

      const result = await invokeLLM({
        messages: [{
          role: "user",
          content: `You are a memory extraction system for a language learning AI companion.

From this conversation, extract KEY FACTS about the student that should be remembered for future sessions. Focus on:
- Their name (if mentioned)
- Their interests, hobbies, job
- Their language goals and motivations
- Specific struggles or strengths in the language
- Personal details they shared (where they live, family, etc.)
- Their preferred learning style
- Words/topics they found interesting or difficult

EXISTING MEMORY (merge with, don't duplicate):
${existingMemory || "None yet"}

RECENT CONVERSATION:
${conversationText}

Return a concise bullet-point summary of everything to remember about this student. Keep it under 500 words. Only include factual information explicitly stated or clearly implied.`,
        }],
      });

      const memory = (result.choices?.[0]?.message?.content as string) || existingMemory;
      return { memory };
    }),
});
