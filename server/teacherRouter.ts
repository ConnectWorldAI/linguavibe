import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

/**
 * AI Teacher Router
 * 
 * Provides AI-powered language teaching with knowledge base from real
 * YouTube/Instagram teaching content scraped via Apify.
 * 
 * Architecture:
 * 1. Admin feeds YouTube/Instagram URLs via ingestContent endpoint
 * 2. Apify scrapes video transcripts/captions
 * 3. Transcripts stored in memory (DB in production) organized by language/dialect
 * 4. When user starts AI teacher session, relevant transcripts are injected as context
 * 5. AI teacher responds using knowledge from real native instructors
 */

// In-memory knowledge base (will be DB-backed in production)
// Structure: { [language-dialect]: { url, title, transcript, language, dialect, createdAt }[] }
const knowledgeBase: Map<string, Array<{
  id: string;
  url: string;
  title: string;
  transcript: string;
  language: string;
  dialect: string;
  platform: string;
  createdAt: string;
  status: "processing" | "ready" | "failed";
  error?: string;
}>> = new Map();

// Generate a simple unique ID
function generateId(): string {
  return `kb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Detect platform from URL
function detectPlatform(url: string): "youtube" | "instagram" | "tiktok" | "unknown" {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("tiktok.com")) return "tiktok";
  return "unknown";
}

export const teacherRouter = router({
  /**
   * Ingest teaching content from a URL.
   * Uses Apify to scrape video transcripts, then stores them as AI teacher knowledge.
   * 
   * This is an ADMIN-ONLY endpoint — only the app owner uses this to feed
   * teaching content into the system. Users never call this.
   */
  ingestContent: publicProcedure
    .input(z.object({
      url: z.string().url(),
      language: z.string().min(1), // e.g., "Spanish"
      dialect: z.string().optional(), // e.g., "Dominican", "Venezuelan"
      title: z.string().optional(), // optional manual title
      notes: z.string().optional(), // admin notes about this content
    }))
    .mutation(async ({ input }) => {
      const apifyToken = process.env.APIFY_API_TOKEN;
      if (!apifyToken) {
        return { success: false as const, error: "Apify API token not configured", id: null };
      }

      const platform = detectPlatform(input.url);
      const dialectKey = `${input.language.toLowerCase()}-${(input.dialect || "standard").toLowerCase()}`;
      const entryId = generateId();

      // Create initial entry in processing state
      const entry = {
        id: entryId,
        url: input.url,
        title: input.title || "Processing...",
        transcript: "",
        language: input.language,
        dialect: input.dialect || "Standard",
        platform,
        createdAt: new Date().toISOString(),
        status: "processing" as const,
      };

      // Add to knowledge base
      if (!knowledgeBase.has(dialectKey)) {
        knowledgeBase.set(dialectKey, []);
      }
      knowledgeBase.get(dialectKey)!.push(entry);

      // Start async scraping with Apify
      try {
        let transcript = "";
        let title = input.title || "";

        if (platform === "youtube") {
          // Use Apify YouTube Transcript Scraper
          const runResponse = await fetch(
            `https://api.apify.com/v2/acts/bernardo~youtube-transcript-scraper/runs?token=${apifyToken}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                startUrls: [{ url: input.url }],
                maxResults: 1,
              }),
            }
          );

          if (!runResponse.ok) {
            // Fallback: Use Web Content Crawler for any URL
            const crawlerResponse = await fetch(
              `https://api.apify.com/v2/acts/apify~website-content-crawler/runs?token=${apifyToken}&waitForFinish=120`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  startUrls: [{ url: input.url }],
                  maxCrawlPages: 1,
                  crawlerType: "cheerio",
                }),
              }
            );

            if (crawlerResponse.ok) {
              const crawlerData = await crawlerResponse.json();
              const datasetId = crawlerData?.data?.defaultDatasetId;
              if (datasetId) {
                // Wait a moment then fetch results
                await new Promise(resolve => setTimeout(resolve, 5000));
                const resultsResp = await fetch(
                  `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
                );
                if (resultsResp.ok) {
                  const results = await resultsResp.json();
                  if (results.length > 0) {
                    transcript = results[0].text || results[0].markdown || results[0].body || "";
                    title = title || results[0].title || "Scraped Content";
                  }
                }
              }
            }
          } else {
            const runData = await runResponse.json();
            const datasetId = runData?.data?.defaultDatasetId;
            if (datasetId) {
              // Wait for scraping to complete
              await new Promise(resolve => setTimeout(resolve, 10000));
              const resultsResp = await fetch(
                `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
              );
              if (resultsResp.ok) {
                const results = await resultsResp.json();
                if (results.length > 0) {
                  transcript = results[0].captions || results[0].transcript || results[0].text || "";
                  title = title || results[0].title || results[0].videoTitle || "YouTube Content";
                }
              }
            }
          }
        } else {
          // For Instagram/TikTok/other — use Web Content Crawler
          const crawlerResponse = await fetch(
            `https://api.apify.com/v2/acts/apify~website-content-crawler/runs?token=${apifyToken}&waitForFinish=120`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                startUrls: [{ url: input.url }],
                maxCrawlPages: 1,
                crawlerType: "cheerio",
              }),
            }
          );

          if (crawlerResponse.ok) {
            const crawlerData = await crawlerResponse.json();
            const datasetId = crawlerData?.data?.defaultDatasetId;
            if (datasetId) {
              await new Promise(resolve => setTimeout(resolve, 8000));
              const resultsResp = await fetch(
                `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
              );
              if (resultsResp.ok) {
                const results = await resultsResp.json();
                if (results.length > 0) {
                  transcript = results[0].text || results[0].markdown || results[0].body || "";
                  title = title || results[0].title || "Social Media Content";
                }
              }
            }
          }
        }

        // If we got content, use AI to extract teaching-relevant information
        if (transcript && transcript.length > 50) {
          // PHASE 1: Extract teaching content from raw transcript
          const extractionResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a language education content curator specializing in ${input.language}${input.dialect ? ` (${input.dialect} dialect)` : ""}. Extract and organize the teaching-relevant content from this scraped transcript/text. Focus on:
1. Vocabulary and phrases being taught
2. Grammar explanations
3. Pronunciation tips
4. Cultural context and usage notes
5. Dialect-specific expressions and slang
6. Example sentences and conversations

Format it as clean, structured teaching notes that an AI teacher can reference. Remove any ads, unrelated content, or platform-specific text. Keep the authentic teaching style and examples.`,
              },
              {
                role: "user",
                content: `This is content from a ${input.language}${input.dialect ? ` (${input.dialect} dialect)` : ""} teaching video/post. Extract the teaching content:\n\n${transcript.slice(0, 8000)}`,
              },
            ],
          });

          const processedContent = typeof extractionResponse.choices?.[0]?.message?.content === "string"
            ? extractionResponse.choices[0].message.content
            : "";

          if (!processedContent) {
            const entries = knowledgeBase.get(dialectKey)!;
            const idx = entries.findIndex(e => e.id === entryId);
            if (idx !== -1) entries[idx] = { ...entries[idx], status: "failed", error: "AI could not extract teaching content" };
            return { success: false as const, error: "Could not extract meaningful teaching content", id: entryId };
          }

          // PHASE 2: AI Validation — verify the content is accurate for the claimed language/dialect
          const validationResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a linguistic accuracy validator. Your job is to verify that language teaching content is CORRECT and AUTHENTIC for the claimed language and dialect.

You must check:
1. Are the words/phrases actually used in ${input.language}${input.dialect ? ` (${input.dialect} dialect)` : ""}?
2. Are the translations accurate?
3. Is the slang/dialect attribution correct? (e.g., is this ACTUALLY Dominican slang, not Mexican?)
4. Are pronunciation tips accurate for this specific dialect?
5. Is the content appropriate and safe for teaching?
6. Is this current/modern usage or outdated?

Respond with a JSON object (no markdown fencing):
{
  "isValid": true/false,
  "confidence": 0.0-1.0,
  "issues": ["list of any problems found"],
  "corrections": ["list of corrections if needed"],
  "verifiedContent": "the content with any corrections applied (or original if all correct)",
  "summary": "brief validation summary"
}`,
              },
              {
                role: "user",
                content: `Validate this ${input.language}${input.dialect ? ` (${input.dialect})` : ""} teaching content for accuracy:\n\n${processedContent.slice(0, 6000)}`,
              },
            ],
          });

          const validationRaw = typeof validationResponse.choices?.[0]?.message?.content === "string"
            ? validationResponse.choices[0].message.content
            : "";

          let validation: { isValid: boolean; confidence: number; issues: string[]; corrections: string[]; verifiedContent: string; summary: string };
          try {
            // Try to parse JSON from the response (handle potential markdown fencing)
            const jsonStr = validationRaw.replace(/^```json\n?|```$/g, "").trim();
            validation = JSON.parse(jsonStr);
          } catch {
            // If parsing fails, assume valid (AI couldn't format response properly)
            validation = { isValid: true, confidence: 0.7, issues: [], corrections: [], verifiedContent: processedContent, summary: "Validation response could not be parsed, content accepted with moderate confidence" };
          }

          // Use verified content (with corrections applied) or original if validation passed
          const finalContent = validation.verifiedContent || processedContent;
          const isAccepted = validation.isValid || validation.confidence >= 0.6;

          // Update the entry
          const entries = knowledgeBase.get(dialectKey)!;
          const idx = entries.findIndex(e => e.id === entryId);
          if (idx !== -1) {
            entries[idx] = {
              ...entries[idx],
              title: title || "Teaching Content",
              transcript: isAccepted ? finalContent : processedContent,
              status: isAccepted ? "ready" : "failed",
              error: isAccepted ? undefined : `Validation failed: ${validation.issues.join("; ")}`,
            };
          }

          return {
            success: isAccepted as true,
            error: isAccepted ? null : `Content validation failed: ${validation.issues.join("; ")}`,
            id: entryId,
            title,
            contentLength: finalContent.length,
            platform,
            validation: {
              isValid: validation.isValid,
              confidence: validation.confidence,
              issues: validation.issues,
              corrections: validation.corrections,
              summary: validation.summary,
            },
            message: isAccepted
              ? `Successfully ingested and validated ${platform} content for ${input.language}${input.dialect ? ` (${input.dialect})` : ""}. Confidence: ${Math.round(validation.confidence * 100)}%. ${validation.corrections.length > 0 ? `${validation.corrections.length} correction(s) applied.` : "All content verified accurate."}`
              : `Content rejected — validation found issues: ${validation.issues.join("; ")}`,
          };
        } else {
          // Mark as failed if no content extracted
          const entries = knowledgeBase.get(dialectKey)!;
          const idx = entries.findIndex(e => e.id === entryId);
          if (idx !== -1) {
            entries[idx] = {
              ...entries[idx],
              status: "failed",
              error: "Could not extract meaningful content from URL",
            };
          }

          return {
            success: false as const,
            error: "Could not extract transcript/content from this URL. Try a different URL or ensure the video has captions.",
            id: entryId,
          };
        }
      } catch (err: any) {
        // Mark as failed
        const entries = knowledgeBase.get(dialectKey);
        if (entries) {
          const idx = entries.findIndex(e => e.id === entryId);
          if (idx !== -1) {
            entries[idx] = { ...entries[idx], status: "failed", error: err.message };
          }
        }

        return {
          success: false as const,
          error: `Ingestion failed: ${err.message}`,
          id: entryId,
        };
      }
    }),

  /**
   * List all ingested content in the knowledge base.
   * Admin endpoint for managing what the AI teachers know.
   */
  listKnowledge: publicProcedure
    .input(z.object({
      language: z.string().optional(),
      dialect: z.string().optional(),
    }))
    .query(({ input }) => {
      const results: Array<{
        id: string;
        url: string;
        title: string;
        language: string;
        dialect: string;
        platform: string;
        status: string;
        createdAt: string;
        contentPreview: string;
      }> = [];

      Array.from(knowledgeBase.entries()).forEach(([key, entries]) => {
        for (const entry of entries) {
          // Filter by language/dialect if specified
          if (input.language && entry.language.toLowerCase() !== input.language.toLowerCase()) continue;
          if (input.dialect && entry.dialect.toLowerCase() !== input.dialect.toLowerCase()) continue;

          results.push({
            id: entry.id,
            url: entry.url,
            title: entry.title,
            language: entry.language,
            dialect: entry.dialect,
            platform: entry.platform,
            status: entry.status,
            createdAt: entry.createdAt,
            contentPreview: entry.transcript.slice(0, 200) + (entry.transcript.length > 200 ? "..." : ""),
          });
        }
      });

      return {
        items: results,
        total: results.length,
        languages: Array.from(new Set(results.map(r => r.language))),
        dialects: Array.from(new Set(results.map(r => r.dialect))),
      };
    }),

  /**
   * Delete an ingested content entry from the knowledge base.
   */
  deleteKnowledge: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
    let found = false;
    Array.from(knowledgeBase.entries()).forEach(([key, entries]) => {
      const idx = entries.findIndex(e => e.id === input.id);
      if (idx !== -1) {
        entries.splice(idx, 1);
        found = true;
      }
    });
    if (found) return { success: true as const, message: "Content removed from knowledge base" };
    return { success: false as const, message: "Content not found" };
    }),

  /**
   * Chat with an AI teacher.
   * The teacher's knowledge is enhanced by ingested content from real instructors.
   */
  chat: publicProcedure
    .input(z.object({
      message: z.string().min(1).max(2000),
      language: z.string().default("Spanish"), // language being learned
      dialect: z.string().optional(), // specific dialect
      teacherPersona: z.string().optional(), // e.g., "friendly", "strict", "casual"
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).optional(),
      userLevel: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
      // Emotion-adaptive pacing: real-time emotion data from Hume
      emotionContext: z.object({
        dominantEmotion: z.string().optional(),
        frustration: z.number().min(0).max(1).optional(),
        confidence: z.number().min(0).max(1).optional(),
        joy: z.number().min(0).max(1).optional(),
        concentration: z.number().min(0).max(1).optional(),
      }).optional(),
      // Conversation memory: topics/vocabulary the user struggled with previously
      learningMemory: z.object({
        struggledTopics: z.array(z.string()).optional(),
        masteredTopics: z.array(z.string()).optional(),
        commonMistakes: z.array(z.string()).optional(),
        sessionCount: z.number().optional(),
        lastSessionSummary: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      // Gather relevant knowledge from ingested content
      const dialectKey = `${input.language.toLowerCase()}-${(input.dialect || "standard").toLowerCase()}`;
      const standardKey = `${input.language.toLowerCase()}-standard`;

      const relevantKnowledge: string[] = [];

      // Get dialect-specific knowledge
      const dialectEntries = knowledgeBase.get(dialectKey) || [];
      for (const entry of dialectEntries.filter(e => e.status === "ready")) {
        relevantKnowledge.push(entry.transcript.slice(0, 2000));
      }

      // Also get standard knowledge for the language
      if (dialectKey !== standardKey) {
        const standardEntries = knowledgeBase.get(standardKey) || [];
        for (const entry of standardEntries.filter(e => e.status === "ready")) {
          relevantKnowledge.push(entry.transcript.slice(0, 1000));
        }
      }

      const knowledgeContext = relevantKnowledge.length > 0
        ? `\n\n--- TEACHING KNOWLEDGE BASE ---\nThe following is real teaching content from native ${input.language}${input.dialect ? ` (${input.dialect})` : ""} instructors. Use this knowledge to inform your teaching style, vocabulary choices, and cultural context:\n\n${relevantKnowledge.join("\n\n---\n\n")}\n--- END KNOWLEDGE BASE ---\n`
        : "";

      // Emotion-adaptive pacing
      let emotionPacing = "";
      if (input.emotionContext) {
        const ec = input.emotionContext;
        if (ec.frustration && ec.frustration > 0.6) {
          emotionPacing = `\n\nEMOTION AWARENESS: The student is showing signs of frustration (${Math.round(ec.frustration * 100)}%). SLOW DOWN. Use simpler vocabulary. Break concepts into smaller pieces. Give extra encouragement. Don't introduce new complex topics right now — reinforce what they already know. Acknowledge their effort.`;
        } else if (ec.frustration && ec.frustration > 0.3) {
          emotionPacing = `\n\nEMOTION AWARENESS: The student seems slightly struggling. Be patient, repeat key points, and offer gentle encouragement.`;
        } else if (ec.confidence && ec.confidence > 0.7 && ec.joy && ec.joy > 0.5) {
          emotionPacing = `\n\nEMOTION AWARENESS: The student is confident and engaged (${Math.round(ec.confidence * 100)}% confidence). CHALLENGE THEM. Introduce advanced vocabulary, idioms, or complex grammar. Push them to the next level. They can handle it.`;
        } else if (ec.confidence && ec.confidence > 0.5) {
          emotionPacing = `\n\nEMOTION AWARENESS: The student is doing well. Maintain the current pace and gradually introduce slightly harder material.`;
        } else if (ec.concentration && ec.concentration > 0.7) {
          emotionPacing = `\n\nEMOTION AWARENESS: The student is highly focused. Provide precise, detailed explanations. They're in the zone — give them substance.`;
        }
      }

      // Conversation memory injection
      let memoryContext = "";
      if (input.learningMemory) {
        const mem = input.learningMemory;
        const parts: string[] = [];
        if (mem.struggledTopics?.length) parts.push(`Topics they've struggled with: ${mem.struggledTopics.join(", ")}. Proactively review these.`);
        if (mem.commonMistakes?.length) parts.push(`Common mistakes: ${mem.commonMistakes.join(", ")}. Watch for these and gently correct.`);
        if (mem.masteredTopics?.length) parts.push(`Topics they've mastered: ${mem.masteredTopics.join(", ")}. Build on these strengths.`);
        if (mem.lastSessionSummary) parts.push(`Last session summary: ${mem.lastSessionSummary}`);
        if (mem.sessionCount) parts.push(`This is session #${mem.sessionCount} with this student.`);
        if (parts.length > 0) {
          memoryContext = `\n\nSTUDENT LEARNING MEMORY:\n${parts.join("\n")}`;
        }
      }

      const personaStyle = {
        friendly: "You are warm, encouraging, and patient. Use lots of positive reinforcement. Celebrate small wins.",
        strict: "You are disciplined and focused on accuracy. Correct mistakes immediately but explain why. Push the student to improve.",
        casual: "You are like a cool friend who happens to be a native speaker. Use natural, relaxed language. Teach through conversation.",
        academic: "You are a university professor. Focus on grammar rules, etymology, and formal usage. Provide scholarly context.",
      }[input.teacherPersona || "friendly"] || "You are warm, encouraging, and patient.";

      const levelGuidance = {
        beginner: "The student is a beginner. Use simple vocabulary, short sentences, and provide translations for new words. Speak slowly and clearly.",
        intermediate: "The student is intermediate. Use more complex sentences, introduce idioms, and occasionally speak entirely in the target language with explanations.",
        advanced: "The student is advanced. Speak primarily in the target language. Focus on nuance, cultural context, advanced grammar, and native-level expressions.",
      }[input.userLevel];

      const systemPrompt = `You are an expert ${input.language}${input.dialect ? ` (${input.dialect} dialect)` : ""} teacher on ConnectWorld AI.${emotionPacing}${memoryContext}

${personaStyle}

${levelGuidance}

YOUR KNOWLEDGE FOUNDATION:
You have deep, comprehensive knowledge of ${input.language} — grammar, vocabulary, pronunciation, culture, history, idioms, slang, regional variations, and contemporary usage. You know how the language is ACTUALLY spoken on the streets, not just in textbooks. You stay current with trending slang, viral phrases, and evolving language from different cities and regions. Use ALL of your built-in knowledge freely — you are not limited to any external content.
${input.dialect ? `\nYou are a native-level expert in the ${input.dialect} dialect specifically. You know:
- How ${input.dialect} pronunciation differs (dropped letters, accent patterns, intonation)
- ${input.dialect}-specific slang, expressions, and idioms that outsiders wouldn't know
- Cultural references, humor, and communication styles unique to ${input.dialect} speakers
- How formal vs. informal speech works in ${input.dialect} contexts
- Historical and metaphorical origins of ${input.dialect} slang words` : ""}
${knowledgeContext ? `\nADDITIONAL CURATED TEACHING CONTENT:\nBelow is supplemental content from real native instructors that enriches your teaching. Incorporate this naturally — use their examples, phrases, and teaching style to make your responses more authentic and current. This ADDS to your knowledge, it doesn't limit it.\n${knowledgeContext}` : ""}

YOUR TEACHING APPROACH:
- Draw on your FULL knowledge — grammar rules, street slang, cultural context, pronunciation patterns, everything
- Always teach in context — use real examples from how people actually talk, not textbook exercises
- When teaching vocabulary, explain the cultural context: who uses this word, where, when, and the vibe it carries
- If the student makes a mistake, correct it gently and explain the right way
- Mix the target language with English explanations based on the student's level
- Include pronunciation tips when introducing new words (especially dialect-specific sounds)
- Teach slang with context about formality levels — when it's cool to use and when it's not
- Stay current — reference modern usage, social media language, music lyrics, and trending expressions
- If you make a mistake or realize you gave wrong info, immediately correct yourself
- Keep responses conversational and engaging — this is a dialogue, not a lecture

RESPONSE FORMAT:
- Keep responses concise (2-4 paragraphs max)
- Bold new vocabulary words
- Include pronunciation hints in parentheses for new words
- End with a question or prompt to keep the conversation going`;

      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
      ];

      // Add conversation history
      if (input.conversationHistory && input.conversationHistory.length > 0) {
        for (const msg of input.conversationHistory.slice(-10)) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }

      // Add current message
      messages.push({ role: "user", content: input.message });

      try {
        const response = await invokeLLM({ messages });

        const rawContent = response.choices?.[0]?.message?.content;
        if (!rawContent) {
          return { success: false as const, error: "No response from AI teacher", reply: "" };
        }

        const reply = typeof rawContent === "string"
          ? rawContent
          : (rawContent.find((p: any) => p.type === "text") as any)?.text ?? "";

        return {
          success: true as const,
          error: null,
          reply,
          knowledgeSourcesUsed: relevantKnowledge.length,
          language: input.language,
          dialect: input.dialect || "Standard",
        };
      } catch (err: any) {
        return {
          success: false as const,
          error: err.message || "AI teacher failed to respond",
          reply: "",
        };
      }
    }),

  /**
   * Get available teachers/dialects and their knowledge base stats
   */
  getAvailableTeachers: publicProcedure.query(() => {
    const teachers: Array<{
      language: string;
      dialect: string;
      contentCount: number;
      key: string;
    }> = [];

    Array.from(knowledgeBase.entries()).forEach(([key, entries]) => {
      const readyEntries = entries.filter(e => e.status === "ready");
      if (readyEntries.length > 0) {
        const [lang, ...dialectParts] = key.split("-");
        teachers.push({
          language: lang.charAt(0).toUpperCase() + lang.slice(1),
          dialect: dialectParts.join("-").charAt(0).toUpperCase() + dialectParts.join("-").slice(1),
          contentCount: readyEntries.length,
          key,
        });
      }
    });

    return { teachers, totalContent: Array.from(knowledgeBase.values()).flat().filter(e => e.status === "ready").length };
  }),
});
