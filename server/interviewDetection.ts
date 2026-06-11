import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

function extractText(result: any): string {
  const raw = result.choices?.[0]?.message?.content;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  const textPart = raw.find((p: any) => p.type === "text");
  return textPart?.text ?? "";
}

export const interviewDetectionRouter = router({
  analyzeVoice: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        audioUrl: z.string(),
        timestamp: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // In a real scenario, we would download the audio and process it.
      // Here we simulate an LLM call for voice authenticity detection.
      const prompt = `You are an AI voice authenticity detector. Analyze audio characteristics for: pitch consistency, formant patterns, breathing artifacts, micro-pauses, spectral envelope naturalness. Return JSON: {authenticity_level: verified_real|suspicious|likely_ai, confidence_score: 0-100, indicators: string[], risk_flags: string[]}`;
      
      const result = await invokeLLM({
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Analyze audio from URL: ${input.audioUrl}` }
        ]
      });
      
      // Mock response for demonstration
      return {
        authenticity_level: "verified_real",
        confidence_score: 94,
        indicators: ["natural breathing artifacts", "consistent pitch variations", "normal micro-pauses"],
        risk_flags: []
      };
    }),

  analyzeVideo: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        frameUrl: z.string(),
        timestamp: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const prompt = `You are an AI deepfake detector. Analyze the video frame for: facial artifacts, lighting inconsistencies, unnatural blinking, blending errors. Return JSON: {authenticity_level: verified_real|suspicious|likely_ai, confidence_score: 0-100, indicators: string[], risk_flags: string[]}`;
      
      const result = await invokeLLM({
        messages: [
          { role: "system", content: prompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: "Analyze this video frame for deepfake artifacts." },
              { type: "image_url", image_url: { url: input.frameUrl } }
            ] 
          }
        ]
      });
      
      // Mock response for demonstration
      return {
        authenticity_level: "verified_real",
        confidence_score: 91,
        indicators: ["natural lighting", "consistent facial features", "no blending errors"],
        risk_flags: []
      };
    }),

  analyzeAnswer: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        answerText: z.string(),
        questionText: z.string(),
        responseTimeMs: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const prompt = `You are an AI-generated text detector. Analyze the answer for: response timing, structure, vocabulary patterns, robotic phrasing. Return JSON: {authenticity_level: verified_real|suspicious|likely_ai, confidence_score: 0-100, indicators: string[], risk_flags: string[]}`;
      
      const result = await invokeLLM({
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Question: ${input.questionText}\nAnswer: ${input.answerText}\nResponse Time: ${input.responseTimeMs}ms` }
        ]
      });
      
      // Mock response for demonstration
      return {
        authenticity_level: "verified_real",
        confidence_score: 88,
        indicators: ["natural phrasing", "appropriate response time", "conversational structure"],
        risk_flags: []
      };
    }),

  generatePresenceChallenge: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const phrases = [
        "The quick brown fox jumps over the lazy dog",
        "She sells seashells by the seashore",
        "How much wood would a woodchuck chuck",
        "Peter Piper picked a peck of pickled peppers"
      ];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      
      return {
        challengeId: `chal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: "repeat_phrase",
        phrase: randomPhrase,
        timeLimit: 5
      };
    }),

  getInterviewReport: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ input }) => {
      // In a real scenario, we would fetch all analyses for the session from the database.
      // Here we return a mock aggregated report.
      return {
        sessionId: input.sessionId,
        overall_authenticity_score: 91,
        status: "verified",
        summary: "The candidate shows high authenticity across voice, video, and text analyses. No significant risk flags detected.",
        details: {
          voice: { score: 94, status: "verified_real" },
          video: { score: 91, status: "verified_real" },
          text: { score: 88, status: "verified_real" }
        }
      };
    }),
});
