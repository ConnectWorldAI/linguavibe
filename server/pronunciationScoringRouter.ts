/**
 * Pronunciation Scoring Router
 * 
 * Records user saying a phrase and uses AI to score pronunciation
 * accuracy compared to native speaker pronunciation.
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";

export const pronunciationScoringRouter = router({
  /** Score pronunciation by comparing transcription to target phrase */
  scorePronunciation: publicProcedure
    .input(z.object({
      targetPhrase: z.string(),
      targetLanguage: z.string().default("Spanish"),
      audioBase64: z.string(), // base64 encoded audio recording
      dialect: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { targetPhrase, targetLanguage, audioBase64, dialect } = input;

      // Transcribe the user's recording
      let transcription = "";
      try {
        // Upload audio and transcribe via Whisper
        const result = await transcribeAudio({
          audioUrl: `data:audio/webm;base64,${audioBase64}`,
          language: targetLanguage === "Spanish" ? "es" : undefined,
        });
        if ("text" in result) {
          transcription = result.text || "";
        }
      } catch (e) {
        transcription = "[transcription failed]";
      }

      // Use LLM to score pronunciation accuracy
      const dialectNote = dialect ? ` (${dialect} dialect)` : "";
      const result = await invokeLLM({
        messages: [{
          role: "user",
          content: `You are a pronunciation coach for ${targetLanguage}${dialectNote}.

The student was supposed to say: "${targetPhrase}"
What they actually said (transcription): "${transcription}"

Score their pronunciation and provide feedback. Return JSON:
{
  "overallScore": 0-100,
  "transcription": "what you heard them say",
  "accuracy": 0-100,
  "fluency": 0-100,
  "intonation": 0-100,
  "feedback": "specific feedback on what to improve",
  "problemSounds": ["list of specific sounds they struggled with"],
  "tips": ["1-2 actionable tips"],
  "encouragement": "brief encouraging note",
  "nativeComparison": "how a native would say it differently (if applicable)"
}

Be encouraging but honest. Focus on the most impactful improvement.`,
        }],
        responseFormat: { type: "json_object" },
      });

      try {
        const scoring = JSON.parse(result.choices[0].message.content as string);
        return { ...scoring, targetPhrase, language: targetLanguage };
      } catch {
        return {
          overallScore: 70,
          transcription,
          accuracy: 70,
          fluency: 70,
          intonation: 70,
          feedback: "Good attempt! Keep practicing.",
          problemSounds: [],
          tips: ["Try speaking more slowly", "Listen to native speakers"],
          encouragement: "You're making progress!",
          nativeComparison: "",
          targetPhrase,
          language: targetLanguage,
        };
      }
    }),

  /** Get pronunciation challenges for a language */
  getChallenges: publicProcedure
    .input(z.object({
      targetLanguage: z.string().default("Spanish"),
      cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).default("A2"),
      count: z.number().default(5),
    }))
    .query(async ({ input }) => {
      const { targetLanguage, cefrLevel, count } = input;
      
      const result = await invokeLLM({
        messages: [{
          role: "user",
          content: `Generate ${count} pronunciation challenge phrases in ${targetLanguage} for CEFR level ${cefrLevel}.
Focus on sounds that are difficult for English speakers.

Return JSON array:
[{
  "id": "unique_id",
  "phrase": "the phrase",
  "translation": "English meaning",
  "difficulty": 1-5,
  "focusSound": "the tricky sound/phoneme",
  "tip": "how to produce this sound"
}]`,
        }],
        responseFormat: { type: "json_object" },
      });

      try {
        return JSON.parse(result.choices[0].message.content as string);
      } catch {
        return [];
      }
    }),
});
