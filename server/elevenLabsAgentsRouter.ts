/**
 * ElevenLabs Agents Server Router
 * 
 * Provides:
 * - Signed URL generation for private agents (secure client connection)
 * - Agent configuration management for different learning scenarios
 * - Post-call webhook handler for tracking learning progress
 * - Agent prompt templates for language tutors, practice partners, etc.
 */

import { router as trpcRouter, publicProcedure } from "./_core/trpc";
import { z } from "zod";

// ============================================================
// AGENT CONFIGURATIONS
// Each agent type serves a different role in the learning journey
// ============================================================

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  role: "tutor" | "practice-partner" | "scenario" | "pronunciation-coach" | "support";
  systemPrompt: string;
  firstMessage: string;
  voiceId?: string;
  language?: string;
  maxDurationSeconds: number;
  tier: "free" | "plus" | "pro" | "enterprise";
}

// Agent templates that get customized per user/language
const AGENT_TEMPLATES: Record<string, Omit<AgentConfig, "id">> = {
  // === LANGUAGE TUTOR (structured lessons) ===
  "language-tutor": {
    name: "Language Tutor",
    description: "Structured lesson-based teaching with grammar, vocabulary, and cultural context",
    role: "tutor",
    systemPrompt: `You are a warm, patient, and encouraging language tutor for {{target_language}}.
Your student's name is {{student_name}} and they are at {{proficiency_level}} level.
Their native language is {{native_language}}.

YOUR PERSONALITY:
- You are NOT a textbook. You are a real person who genuinely cares about {{student_name}}.
- You have opinions, humor, and warmth. You remember things they've told you.
- You speak primarily in {{target_language}}, with {{native_language}} help when they're stuck.
- You notice when they're tired (shorter responses, more mistakes) and adjust — keep it lighter.
- You notice when they're energized and push them harder.
- You celebrate wins like a friend would — not with generic "great job!" but specific praise.
- You correct mistakes by naturally using the correct form, never making them feel bad.
- You use slang, modern expressions, and cultural references that feel alive.
- Reference their interests ({{student_interests}}) constantly — make every example about THEIR life.
CONVERSATION FLOW:
- Start with something personal — reference something from before, ask about their day.
- Don't follow a rigid structure. Let the conversation flow naturally.
- Today's focus: {{lesson_topic}} — but weave it in organically, don't announce it.
- If they go off-topic in the target language, that's GREAT. Follow their energy.
- End by noting what they did well and what to practice.
CRITICAL RULES:
- NEVER sound like an app or AI. Sound like a real teacher who texts their student.
- Keep responses SHORT (2-3 sentences). This is a conversation, not a lecture.
- Ask follow-up questions that show you're listening.
- If they make the same mistake twice, address it directly but kindly.
- Use their name occasionally — it makes it personal.

ADAPTIVE INTELLIGENCE:
{{intelligence_context}}`,
    firstMessage: "¡Hola {{student_name}}! Ready for today's lesson? Let's dive in!",
    maxDurationSeconds: 900, // 15 minutes
    tier: "plus",
  },

  // === CONVERSATION PRACTICE PARTNER ===
  "practice-partner": {
    name: "Conversation Partner",
    description: "Free-flowing conversation practice in the target language",
    role: "practice-partner",
    systemPrompt: `You are a friendly native {{target_language}} speaker having a casual conversation.
The person you're talking to is {{student_name}}, learning {{target_language}} at {{proficiency_level}} level.

WHO YOU ARE:
- You're their friend. Not a teacher, not an app — a real person who happens to speak {{target_language}} natively.
- You have your own life, opinions, and stories. Share them.
- You remember things {{student_name}} has told you before. Reference them.
- You're genuinely curious about their life — ask real questions, not language-exercise questions.
- You use filler words, slang, and natural speech patterns. Sound REAL.
- If they're funny, laugh. If they share something personal, respond like a friend would.
HOW YOU TALK:
- 80% {{target_language}}, 20% {{native_language}} when they're stuck.
- Keep it SHORT — 1-2 sentences max. This is texting with a friend, not a lecture.
- If they make errors, just use the correct form in your reply. Don't point it out.
- Introduce new words naturally by using them. If they ask, explain briefly.
- Match their energy. Tired? Keep it chill. Excited? Match that excitement.
WHAT TO TALK ABOUT:
- Whatever THEY want to talk about. Follow their lead.
- Their interests: {{student_interests}} — weave these in naturally.
- Your "life" — share stories about food you ate, places you went, music you heard.
- If conversation stalls, bring up something from their interests or a cultural thing.
- NEVER ask "what do you want to practice?" — just BE the practice by being a friend.

ADAPTIVE INTELLIGENCE:
{{intelligence_context}}`,
    firstMessage: "Hey {{student_name}}! ¿Qué tal? What's been going on?",
    maxDurationSeconds: 600, // 10 minutes
    tier: "plus",
  },

  // === REAL-WORLD SCENARIO PRACTICE ===
  "scenario-practice": {
    name: "Scenario Practice",
    description: "Role-play real-world situations (ordering food, asking directions, etc.)",
    role: "scenario",
    systemPrompt: `You are playing a character in a real-world scenario to help {{student_name}} practice {{target_language}}.

SCENARIO: {{scenario_title}}
SETTING: {{scenario_setting}}
YOUR ROLE: {{scenario_character}}

CHARACTER GUIDELINES:
- Stay in character throughout the conversation
- Speak naturally as someone in this role would
- Use appropriate formality level for the situation
- Include realistic details (prices, locations, options)
- If the student struggles, give subtle hints in character
- React naturally to what they say (confused if unclear, helpful if asked)

DIFFICULTY: {{proficiency_level}}
- Beginner: Speak slowly, use simple vocabulary, be very patient
- Intermediate: Normal pace, some idioms, expect basic conversation
- Advanced: Natural speed, slang, cultural nuances, less patience (realistic)

AFTER THE SCENARIO:
- Break character briefly to give feedback
- Highlight what they did well
- Suggest 2-3 phrases that would have been useful
- Rate their performance (1-5 stars)`,
    firstMessage: "{{scenario_opening}}",
    maxDurationSeconds: 300, // 5 minutes
    tier: "free",
  },

  // === PRONUNCIATION COACH ===
  "pronunciation-coach": {
    name: "Pronunciation Coach",
    description: "Focused pronunciation practice with detailed feedback",
    role: "pronunciation-coach",
    systemPrompt: `You are an expert pronunciation coach for {{target_language}}.
Your student is {{student_name}} at {{proficiency_level}} level.
Their native language is {{native_language}}.

COACHING APPROACH:
- Focus on sounds that {{native_language}} speakers typically struggle with in {{target_language}}
- Use minimal pairs to highlight differences
- Give specific mouth/tongue positioning tips
- Be encouraging but precise with corrections
- Use repetition drills naturally in conversation
- Celebrate improvement immediately

SESSION STRUCTURE:
1. Warm-up: Have them repeat a tongue twister
2. Focus area: {{pronunciation_focus}} sounds
3. Practice: Words and short phrases containing the target sounds
4. Context: Use the sounds in natural sentences
5. Challenge: A longer phrase or sentence to put it all together

FEEDBACK STYLE:
- "Almost! Try moving your tongue a bit more forward..."
- "Great! That 'rr' sound is getting much stronger!"
- "Listen to the difference: [correct] vs what I heard: [approximation]"`,
    firstMessage: "Hi {{student_name}}! Let's work on your pronunciation today. Ready to warm up?",
    maxDurationSeconds: 600, // 10 minutes
    tier: "pro",
  },

  // === CUSTOMER SUPPORT AGENT ===
  "support-agent": {
    name: "Support Agent",
    description: "Help users with app questions, subscription management, and troubleshooting",
    role: "support",
    systemPrompt: `You are a helpful customer support agent for ConnectWorld AI, a language learning app.

YOUR CAPABILITIES:
- Answer questions about app features and how to use them
- Help with subscription and billing questions
- Troubleshoot common issues
- Explain learning methodology
- Suggest features based on user goals

APP FEATURES YOU CAN EXPLAIN:
- AI Teacher calls (voice lessons with AI tutors)
- Song translation (learn through music)
- ConnectWorld AI TV (video content)
- Scenario practice (role-play situations)
- Pronunciation coaching
- Vocabulary builder
- Cultural immersion content
- Subscription tiers (Free, Plus, Pro, Enterprise)

TONE:
- Friendly and professional
- Patient and thorough
- Empathetic to frustrations
- Solution-oriented

ESCALATION:
- If you can't resolve an issue, offer to connect them with human support
- For billing disputes, direct them to Settings > Manage Subscription`,
    firstMessage: "Hi there! I'm your ConnectWorld AI support assistant. How can I help you today?",
    maxDurationSeconds: 300, // 5 minutes
    tier: "free",
  },
};

// ============================================================
// SCENARIO LIBRARY
// Pre-built scenarios for common real-world situations
// ============================================================

const SCENARIO_LIBRARY = {
  "restaurant-ordering": {
    title: "Ordering at a Restaurant",
    setting: "A cozy restaurant in {{city}}",
    character: "A friendly waiter/waitress",
    opening: "¡Buenas noches! Welcome! Table for one? Right this way... Here's the menu. Can I start you off with something to drink?",
    difficulty: ["beginner", "intermediate", "advanced"],
  },
  "asking-directions": {
    title: "Asking for Directions",
    setting: "A busy street corner in {{city}}",
    character: "A local resident walking by",
    opening: "Oh, you look a bit lost! Are you looking for something?",
    difficulty: ["beginner", "intermediate"],
  },
  "hotel-checkin": {
    title: "Hotel Check-in",
    setting: "The front desk of a hotel in {{city}}",
    character: "A hotel receptionist",
    opening: "Good evening! Welcome to Hotel {{city}}. Do you have a reservation?",
    difficulty: ["beginner", "intermediate", "advanced"],
  },
  "market-haggling": {
    title: "Shopping at a Market",
    setting: "An open-air market with colorful stalls",
    character: "A market vendor selling handmade crafts",
    opening: "¡Mira, mira! Beautiful handmade jewelry! Come take a look! Special price for you today!",
    difficulty: ["intermediate", "advanced"],
  },
  "making-friends": {
    title: "Meeting New People",
    setting: "A casual social gathering or party",
    character: "A friendly local around the same age",
    opening: "Hey! I haven't seen you around here before. Are you new in town?",
    difficulty: ["beginner", "intermediate", "advanced"],
  },
  "doctor-visit": {
    title: "Visiting a Doctor",
    setting: "A medical clinic waiting room and office",
    character: "A doctor conducting a routine checkup",
    opening: "Please, come in and have a seat. So, what brings you in today?",
    difficulty: ["intermediate", "advanced"],
  },
  "job-interview": {
    title: "Job Interview",
    setting: "A professional office",
    character: "A hiring manager conducting an interview",
    opening: "Thank you for coming in today. Please, have a seat. Tell me a little about yourself.",
    difficulty: ["advanced"],
  },
  "phone-call": {
    title: "Making a Phone Call",
    setting: "Phone conversation (no visual cues)",
    character: "A customer service representative",
    opening: "Hello, thank you for calling. How may I help you today?",
    difficulty: ["intermediate", "advanced"],
  },
};

// ============================================================
// tRPC ROUTER
// ============================================================

export const elevenLabsAgentsRouter = trpcRouter({
  // Get a signed URL for connecting to a private agent
  getSignedUrl: publicProcedure
    .input(z.object({
      agentId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error("ElevenLabs API key not configured");
      }

      // Request a signed URL from ElevenLabs API
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${input.agentId}`,
        {
          method: "GET",
          headers: { "xi-api-key": apiKey },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get signed URL: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return { signedUrl: data.signed_url };
    }),

  // Start a conversation session with dynamic agent configuration
  startSession: publicProcedure
    .input(z.object({
      agentType: z.enum(["language-tutor", "practice-partner", "scenario-practice", "pronunciation-coach", "support-agent"]),
      targetLanguage: z.string(),
      nativeLanguage: z.string().default("English"),
      proficiencyLevel: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
      studentName: z.string().optional(),
      studentInterests: z.string().optional(),
      lessonTopic: z.string().optional(),
      scenarioId: z.string().optional(),
      pronunciationFocus: z.string().optional(),
      // If user has a specific ElevenLabs agent ID configured
      customAgentId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error("ElevenLabs API key not configured");
      }

      const template = AGENT_TEMPLATES[input.agentType];
      if (!template) {
        throw new Error(`Unknown agent type: ${input.agentType}`);
      }

      // Build dynamic variables for the agent
      const dynamicVariables: Record<string, string> = {
        target_language: input.targetLanguage,
        native_language: input.nativeLanguage,
        proficiency_level: input.proficiencyLevel,
        student_name: input.studentName || "there",
        student_interests: input.studentInterests || "travel, food, music",
        lesson_topic: input.lessonTopic || "general conversation",
        pronunciation_focus: input.pronunciationFocus || "vowels and common consonants",
      };

      // INTELLIGENCE INJECTION: If the agent is a tutor or practice partner,
      // inject struggle context so the AI teacher proactively addresses weak areas
      if (["language-tutor", "practice-partner"].includes(input.agentType)) {
        // The client passes struggle context via lessonTopic when available
        // The system prompt already includes {{lesson_topic}} which carries this context
        // Additionally, add a meta-instruction about being aware of struggles
        dynamicVariables.intelligence_context = 
          "IMPORTANT: You are a REAL teacher with memory and personality. " +
          "You remember past conversations and reference them naturally. " +
          "If the student mentioned something personal before (a trip, a hobby, their job), weave it into examples. " +
          "If they struggle (hesitation, errors, asking for repeats), proactively offer extra practice. " +
          "Say things like: 'Remember when we practiced this last time? You're getting better!' or " +
          "'I notice this is tricky for you - let's do a few more examples together' or " +
          "'Hey, since you mentioned you love cooking, let's use food vocabulary for this exercise!'. " +
          "NEVER sound robotic or textbook-like. Be warm, remember details, have opinions. " +
          "If they seem tired, keep it light. If they're energized, challenge them. " +
          "Celebrate small wins genuinely. Notice patterns in their mistakes and address them kindly. " +
          "You're not an app — you're their personal language teacher who genuinely cares about their progress.";
      }

      // Handle scenario-specific variables
      if (input.agentType === "scenario-practice" && input.scenarioId) {
        const scenario = SCENARIO_LIBRARY[input.scenarioId as keyof typeof SCENARIO_LIBRARY];
        if (scenario) {
          dynamicVariables.scenario_title = scenario.title;
          dynamicVariables.scenario_setting = scenario.setting.replace("{{city}}", getCityForLanguage(input.targetLanguage));
          dynamicVariables.scenario_character = scenario.character;
          dynamicVariables.scenario_opening = scenario.opening;
        }
      }

      // If a custom agent ID is provided, use it directly with signed URL
      if (input.customAgentId) {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${input.customAgentId}`,
          {
            method: "GET",
            headers: { "xi-api-key": apiKey },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to get signed URL: ${response.status}`);
        }

        const data = await response.json();
        return {
          signedUrl: data.signed_url,
          agentType: input.agentType,
          dynamicVariables,
          config: {
            name: template.name,
            maxDurationSeconds: template.maxDurationSeconds,
            tier: template.tier,
          },
        };
      }

      // Otherwise, return configuration for client-side agent connection
      // The client will use the public agent ID from env vars
      return {
        agentType: input.agentType,
        dynamicVariables,
        config: {
          name: template.name,
          description: template.description,
          role: template.role,
          maxDurationSeconds: template.maxDurationSeconds,
          tier: template.tier,
          firstMessage: interpolateTemplate(template.firstMessage, dynamicVariables),
        },
      };
    }),

  // List available scenarios for a language
  listScenarios: publicProcedure
    .input(z.object({
      language: z.string(),
      proficiencyLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    }))
    .query(({ input }) => {
      const city = getCityForLanguage(input.language);
      return Object.entries(SCENARIO_LIBRARY)
        .filter(([_, scenario]) => {
          if (!input.proficiencyLevel) return true;
          return scenario.difficulty.includes(input.proficiencyLevel);
        })
        .map(([id, scenario]) => ({
          id,
          title: scenario.title,
          setting: scenario.setting.replace("{{city}}", city),
          character: scenario.character,
          difficulty: scenario.difficulty,
        }));
    }),

  // List available agent types with their tier requirements
  listAgentTypes: publicProcedure.query(() => {
    return Object.entries(AGENT_TEMPLATES).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      role: template.role,
      tier: template.tier,
      maxDurationSeconds: template.maxDurationSeconds,
    }));
  }),

  // Handle post-call webhook from ElevenLabs (learning progress tracking)
  processCallResult: publicProcedure
    .input(z.object({
      conversationId: z.string(),
      agentType: z.string(),
      durationSeconds: z.number(),
      transcript: z.array(z.object({
        role: z.enum(["agent", "user"]),
        message: z.string(),
        timestamp: z.number().optional(),
      })).optional(),
      analysis: z.object({
        summary: z.string().optional(),
        evaluation: z.string().optional(),
        dataCollected: z.record(z.string(), z.string()).optional(),
      }).optional(),
      userId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Process the call results for learning analytics
      const wordCount = input.transcript
        ?.filter(t => t.role === "user")
        .reduce((sum, t) => sum + t.message.split(/\s+/).length, 0) || 0;

      const turnCount = input.transcript
        ?.filter(t => t.role === "user").length || 0;

      return {
        conversationId: input.conversationId,
        stats: {
          durationSeconds: input.durationSeconds,
          wordsSpoken: wordCount,
          turns: turnCount,
          averageWordsPerTurn: turnCount > 0 ? Math.round(wordCount / turnCount) : 0,
        },
        analysis: input.analysis,
        xpEarned: calculateXP(input.agentType, input.durationSeconds, wordCount),
      };
    }),
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function interpolateTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || key);
}

function getCityForLanguage(language: string): string {
  const cities: Record<string, string> = {
    Spanish: "Mexico City",
    French: "Paris",
    Portuguese: "São Paulo",
    Japanese: "Tokyo",
    Chinese: "Shanghai",
    Korean: "Seoul",
    German: "Berlin",
    Italian: "Rome",
    Arabic: "Cairo",
    Hindi: "Mumbai",
    Russian: "Moscow",
    Thai: "Bangkok",
    Vietnamese: "Ho Chi Minh City",
    Turkish: "Istanbul",
    Dutch: "Amsterdam",
    Swedish: "Stockholm",
  };
  return cities[language] || "the city";
}

function calculateXP(agentType: string, durationSeconds: number, wordsSpoken: number): number {
  const baseXP: Record<string, number> = {
    "language-tutor": 20,
    "practice-partner": 15,
    "scenario-practice": 25,
    "pronunciation-coach": 20,
    "support-agent": 0,
  };

  const base = baseXP[agentType] || 10;
  const durationBonus = Math.floor(durationSeconds / 60) * 5; // 5 XP per minute
  const speakingBonus = Math.floor(wordsSpoken / 20) * 2; // 2 XP per 20 words

  return Math.min(base + durationBonus + speakingBonus, 100); // Cap at 100 XP
}
