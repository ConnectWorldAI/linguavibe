/**
 * Teacher Voice Memo Router
 * 
 * When the intelligence engine detects a struggle pattern, this router:
 * 1. Uses LLM to generate a personalized, encouraging message from the teacher
 * 2. Converts it to speech via ElevenLabs TTS (the teacher's voice)
 * 3. Stores the audio file and returns it for playback
 * 4. Can trigger push notifications to alert the student
 * 
 * The teacher voice memo feels like a real teacher reaching out:
 * "Hey Maria! I noticed you've been working hard on past tense conjugations.
 *  Let me give you a quick tip that'll make it click..."
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

// Voice IDs for different teacher personas
const TEACHER_VOICES: Record<string, { voiceId: string; name: string; language: string }> = {
  "sofia": { voiceId: "EXAVITQu4vr4xnSDxMaL", name: "Sofia", language: "Spanish" },
  "carlos": { voiceId: "IKne3meq5aSn9XLyUdCD", name: "Carlos", language: "Spanish" },
  "marie": { voiceId: "XB0fDUnXU5powFXDhCwa", name: "Marie", language: "French" },
  "yuki": { voiceId: "pFZP5JQG7iQjIQuC4Bku", name: "Yuki", language: "Japanese" },
  "ana": { voiceId: "jBpfAIEqvOQ0aQmyHbGr", name: "Ana", language: "Portuguese" },
  "hans": { voiceId: "nPczCjzI2devNBz1zQrb", name: "Hans", language: "German" },
  "default": { voiceId: "EXAVITQu4vr4xnSDxMaL", name: "Teacher", language: "English" },
};

export const teacherVoiceMemoRouter = router({
  /**
   * Generate a personalized voice memo from the teacher
   * Called when the intelligence engine detects a struggle pattern
   */
  generateVoiceMemo: publicProcedure
    .input(z.object({
      studentName: z.string(),
      targetLanguage: z.string(),
      teacherPersona: z.string().default("default"),
      proficiencyLevel: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
      struggleArea: z.object({
        topic: z.string(),
        subtopic: z.string().optional(),
        accuracy: z.number(),
        attempts: z.number(),
        trend: z.enum(["improving", "declining", "stable"]),
      }),
      memoType: z.enum([
        "encouragement",      // General encouragement when struggling
        "tip",                // Quick teaching tip for the struggle area
        "homework_assigned",  // Notifying about new homework
        "milestone",          // Celebrating a milestone/improvement
        "check_in",          // Periodic check-in when student hasn't practiced
      ]).default("encouragement"),
      // Optional: include specific words/phrases the student is struggling with
      problemWords: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      
      // Step 1: Generate the voice memo script using LLM
      const prompt = buildMemoPrompt(input);
      
      const llmResult = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        responseFormat: { type: "json_object" },
      });

      let memoScript: { message: string; targetLanguagePhrase?: string; tip?: string };
      try {
        const content = llmResult.choices?.[0]?.message?.content;
        const text = typeof content === "string" ? content : "";
        memoScript = JSON.parse(text);
      } catch {
        // Fallback script
        memoScript = {
          message: `Hey ${input.studentName}! I noticed you've been working on ${input.struggleArea.topic}. Keep going — you're making progress! Let me share a quick tip that might help.`,
          tip: "Practice makes perfect. Try using this in a real conversation today.",
        };
      }

      // Step 2: Convert to speech via ElevenLabs TTS
      const voice = TEACHER_VOICES[input.teacherPersona] || TEACHER_VOICES["default"];
      let audioUrl: string | null = null;

      if (apiKey) {
        try {
          const fullText = [
            memoScript.message,
            memoScript.targetLanguagePhrase ? `\n${memoScript.targetLanguagePhrase}` : "",
            memoScript.tip ? `\nHere's my tip: ${memoScript.tip}` : "",
          ].join(" ");

          const ttsResponse = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}`,
            {
              method: "POST",
              headers: {
                "xi-api-key": apiKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: fullText.trim(),
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                  stability: 0.6,
                  similarity_boost: 0.8,
                  style: 0.4, // Warm, encouraging tone
                  use_speaker_boost: true,
                },
              }),
            }
          );

          if (ttsResponse.ok) {
            const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
            const fileName = `voice-memos/${Date.now()}-${input.teacherPersona}-${input.memoType}.mp3`;
            const stored = await storagePut(fileName, audioBuffer, "audio/mpeg");
            audioUrl = stored.url;
          }
        } catch (err) {
          console.warn("TTS generation failed:", err);
        }
      }

      // Step 3: Return the memo data
      return {
        success: true,
        memo: {
          id: `memo_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          teacherName: voice.name,
          teacherPersona: input.teacherPersona,
          memoType: input.memoType,
          transcript: memoScript.message,
          targetLanguagePhrase: memoScript.targetLanguagePhrase || null,
          tip: memoScript.tip || null,
          audioUrl,
          struggleArea: input.struggleArea.topic,
          createdAt: new Date().toISOString(),
          duration: null, // Would need audio analysis to determine
        },
      };
    }),

  /**
   * Generate a batch of voice memos for multiple struggle areas
   * Used by the scheduled intelligence check
   */
  generateBatchMemos: publicProcedure
    .input(z.object({
      studentName: z.string(),
      targetLanguage: z.string(),
      teacherPersona: z.string().default("default"),
      proficiencyLevel: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
      struggles: z.array(z.object({
        topic: z.string(),
        subtopic: z.string().optional(),
        accuracy: z.number(),
        attempts: z.number(),
        trend: z.enum(["improving", "declining", "stable"]),
      })),
    }))
    .mutation(async ({ input }) => {
      // Only generate memos for the top 2 most critical struggles
      const topStruggles = input.struggles
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 2);

      const memos = [];
      for (const struggle of topStruggles) {
        try {
          // Determine memo type based on trend
          const memoType = struggle.trend === "declining" ? "encouragement" 
            : struggle.trend === "improving" ? "milestone" 
            : "tip";

          const prompt = buildMemoPrompt({
            ...input,
            struggleArea: struggle,
            memoType,
          });

          const llmResult = await invokeLLM({
            messages: [{ role: "user", content: prompt }],
            responseFormat: { type: "json_object" },
          });

          const content = llmResult.choices?.[0]?.message?.content;
          const text = typeof content === "string" ? content : "";
          const parsed = JSON.parse(text);

          memos.push({
            id: `memo_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            teacherName: (TEACHER_VOICES[input.teacherPersona] || TEACHER_VOICES["default"]).name,
            memoType,
            transcript: parsed.message || "Keep practicing!",
            tip: parsed.tip || null,
            targetLanguagePhrase: parsed.targetLanguagePhrase || null,
            struggleArea: struggle.topic,
            audioUrl: null, // Batch doesn't generate audio to save API calls
            createdAt: new Date().toISOString(),
          });
        } catch {
          // Skip failed memos
        }
      }

      return { success: true, memos };
    }),

  /**
   * Get available teacher voices for the student's target language
   */
  getTeacherVoices: publicProcedure
    .input(z.object({ language: z.string() }))
    .query(({ input }) => {
      const voices = Object.entries(TEACHER_VOICES)
        .filter(([key, v]) => v.language === input.language || key === "default")
        .map(([key, v]) => ({ id: key, name: v.name, language: v.language }));
      return { voices };
    }),
});

/**
 * Build the LLM prompt for generating voice memo scripts
 */
function buildMemoPrompt(input: {
  studentName: string;
  targetLanguage: string;
  proficiencyLevel: string;
  struggleArea: { topic: string; subtopic?: string; accuracy: number; attempts: number; trend: string };
  memoType: string;
  problemWords?: string[];
}): string {
  const typeInstructions: Record<string, string> = {
    encouragement: `Generate a warm, encouraging voice memo. The student is struggling but you believe in them. 
    Acknowledge their effort, normalize the difficulty, and end with motivation.`,
    tip: `Generate a helpful teaching tip voice memo. Give ONE specific, actionable tip 
    that will help them with ${input.struggleArea.topic}. Include a phrase in ${input.targetLanguage} as an example.`,
    homework_assigned: `Generate a brief voice memo letting the student know you've assigned them 
    extra practice. Frame it positively — not as punishment but as a shortcut to mastery.`,
    milestone: `Generate a celebratory voice memo! The student is improving in ${input.struggleArea.topic}. 
    Acknowledge their progress, mention specific improvement, and encourage them to keep going.`,
    check_in: `Generate a friendly check-in voice memo. The student hasn't practiced recently. 
    Be warm and non-judgmental. Remind them why they started learning and offer a quick 2-minute exercise.`,
  };

  return `You are ${input.studentName}'s ${input.targetLanguage} teacher. Generate a personalized voice memo script.

STUDENT CONTEXT:
- Name: ${input.studentName}
- Level: ${input.proficiencyLevel}
- Target language: ${input.targetLanguage}
- Struggling with: ${input.struggleArea.topic}${input.struggleArea.subtopic ? ` (${input.struggleArea.subtopic})` : ""}
- Current accuracy: ${input.struggleArea.accuracy}%
- Attempts: ${input.struggleArea.attempts}
- Trend: ${input.struggleArea.trend}
${input.problemWords ? `- Problem words: ${input.problemWords.join(", ")}` : ""}

MEMO TYPE: ${input.memoType}
${typeInstructions[input.memoType] || typeInstructions.encouragement}

VOICE MEMO RULES:
- Keep it SHORT (30-60 seconds when spoken, about 80-150 words)
- Sound natural and conversational, like a real teacher texting a voice note
- Use the student's name
- Include at least one phrase in ${input.targetLanguage} (with translation)
- Be specific to their struggle area — don't be generic
- End with a clear next step or call to action
- Tone: warm, patient, slightly playful, like a cool older sibling who's fluent

Respond in JSON format:
{
  "message": "The main voice memo text (80-150 words)",
  "targetLanguagePhrase": "A phrase in ${input.targetLanguage} relevant to their struggle (with translation in parentheses)",
  "tip": "One specific actionable tip (1-2 sentences)"
}`;
}
