/**
 * Methodology Data Ingestion Router
 *
 * Pushes language learning methodology research data into Airtable tables,
 * structured by teaching style, method name, source, and applicable languages.
 * Enables curriculum planning sorted by teaching style per language.
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";

const AIRTABLE_API = "https://api.airtable.com/v0";

function getApiKey(): string {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) throw new Error("AIRTABLE_API_KEY not set");
  return key;
}

function getBaseId(): string {
  const id = process.env.AIRTABLE_BASE_ID;
  if (!id) throw new Error("AIRTABLE_BASE_ID not set");
  return id;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface MethodologyRecord {
  methodName: string;
  teachingStyle: string;
  applicableLanguages: string[];
  source: string;
  description: string;
  keyPrinciples: string[];
  difficultyLevel: string;
  bestFor: string;
  exampleActivities: string[];
  researchBasis: string;
}

// ─── Airtable Helpers ───────────────────────────────────────────────────────

async function ensureMethodologyTable(): Promise<boolean> {
  // Check if the table exists by trying to list records
  try {
    const res = await fetch(
      `${AIRTABLE_API}/${getBaseId()}/Teaching%20Methodologies?maxRecords=1`,
      {
        headers: { Authorization: `Bearer ${getApiKey()}` },
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function pushRecordsToAirtable(
  tableName: string,
  records: Array<{ fields: Record<string, any> }>
): Promise<{ success: boolean; created: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;

  // Airtable allows max 10 records per request
  const batches = [];
  for (let i = 0; i < records.length; i += 10) {
    batches.push(records.slice(i, i + 10));
  }

  for (const batch of batches) {
    try {
      const res = await fetch(
        `${AIRTABLE_API}/${getBaseId()}/${encodeURIComponent(tableName)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getApiKey()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ records: batch }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        created += data.records?.length || 0;
      } else {
        const errText = await res.text();
        errors.push(`Batch failed: ${res.status} - ${errText}`);
      }
    } catch (err: any) {
      errors.push(`Network error: ${err.message}`);
    }
  }

  return { success: errors.length === 0, created, errors };
}

async function fetchMethodologyRecords(
  filters?: { teachingStyle?: string; language?: string }
): Promise<any[]> {
  let url = `${AIRTABLE_API}/${getBaseId()}/Teaching%20Methodologies?maxRecords=100`;

  // Build filter formula
  const filterParts: string[] = [];
  if (filters?.teachingStyle) {
    filterParts.push(`{Teaching Style} = '${filters.teachingStyle}'`);
  }
  if (filters?.language) {
    filterParts.push(`FIND('${filters.language}', {Applicable Languages})`);
  }
  if (filterParts.length > 0) {
    const formula = filterParts.length === 1
      ? filterParts[0]
      : `AND(${filterParts.join(", ")})`;
    url += `&filterByFormula=${encodeURIComponent(formula)}`;
  }

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${getApiKey()}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.records || [];
  } catch {
    return [];
  }
}

// ─── Built-in Methodology Data ──────────────────────────────────────────────

const METHODOLOGY_DATABASE: MethodologyRecord[] = [
  {
    methodName: "Comprehensible Input (Krashen)",
    teachingStyle: "Immersive",
    applicableLanguages: ["All"],
    source: "Stephen Krashen - The Input Hypothesis (1985)",
    description: "Language acquisition occurs when learners receive input slightly above their current level (i+1). Focus on understanding messages rather than drilling grammar rules.",
    keyPrinciples: ["i+1 input level", "Low affective filter", "Natural order of acquisition", "Monitor hypothesis"],
    difficultyLevel: "Beginner to Advanced",
    bestFor: "Students who learn best through listening and reading, prefer natural acquisition over explicit study",
    exampleActivities: ["Story listening", "Free voluntary reading", "Conversation with native speakers", "Watching target-language media"],
    researchBasis: "Supported by SLA research showing implicit learning outperforms explicit instruction for fluency",
  },
  {
    methodName: "Total Physical Response (TPR)",
    teachingStyle: "Kinesthetic",
    applicableLanguages: ["All"],
    source: "James Asher - Total Physical Response (1969)",
    description: "Students learn language through physical actions. The teacher gives commands and students respond with body movements, connecting language to physical memory.",
    keyPrinciples: ["Action-based learning", "Stress-free environment", "Right-brain activation", "Delayed speech production"],
    difficultyLevel: "Beginner",
    bestFor: "Young learners, kinesthetic learners, absolute beginners who need low-pressure entry",
    exampleActivities: ["Simon Says in target language", "Action commands", "Movement storytelling", "Gesture vocabulary drills"],
    researchBasis: "Based on child L1 acquisition patterns; reduces anxiety and increases retention through motor memory",
  },
  {
    methodName: "Communicative Language Teaching (CLT)",
    teachingStyle: "Conversational",
    applicableLanguages: ["All"],
    source: "Dell Hymes - Communicative Competence (1972)",
    description: "Focus on real communication rather than grammar perfection. Students practice meaningful interactions in authentic contexts.",
    keyPrinciples: ["Communication over accuracy", "Authentic materials", "Meaningful interaction", "Functional language use"],
    difficultyLevel: "All levels",
    bestFor: "Students preparing for real-world conversations, travel, or professional use",
    exampleActivities: ["Role plays", "Information gap activities", "Problem-solving tasks", "Real-world simulations"],
    researchBasis: "Dominant approach in modern language teaching; proven effective for developing communicative competence",
  },
  {
    methodName: "Task-Based Language Teaching (TBLT)",
    teachingStyle: "Project-Based",
    applicableLanguages: ["All"],
    source: "Peter Skehan, Rod Ellis - Task-Based Approach (1990s)",
    description: "Students complete meaningful tasks (ordering food, planning a trip) that require using the target language. Grammar is taught as needed to complete tasks.",
    keyPrinciples: ["Task completion drives learning", "Focus on meaning first", "Grammar emerges from need", "Real-world relevance"],
    difficultyLevel: "Intermediate to Advanced",
    bestFor: "Goal-oriented learners who want practical skills, professionals needing specific language tasks",
    exampleActivities: ["Plan a vacation itinerary", "Negotiate a business deal", "Write a restaurant review", "Give directions to a location"],
    researchBasis: "Strong evidence for developing procedural knowledge and real-world language skills",
  },
  {
    methodName: "Spaced Repetition System (SRS)",
    teachingStyle: "Memory-Optimized",
    applicableLanguages: ["All"],
    source: "Piotr Wozniak - SuperMemo Algorithm (1987)",
    description: "Vocabulary and grammar are reviewed at scientifically-optimized intervals to maximize long-term retention while minimizing study time.",
    keyPrinciples: ["Forgetting curve exploitation", "Active recall", "Increasing intervals", "Minimum effective dose"],
    difficultyLevel: "All levels",
    bestFor: "Vocabulary building, kanji/character memorization, grammar pattern retention",
    exampleActivities: ["Flashcard reviews", "Cloze deletion exercises", "Audio recognition drills", "Writing practice with timed intervals"],
    researchBasis: "Extensively validated by cognitive science; Ebbinghaus forgetting curve research",
  },
  {
    methodName: "Immersion Method",
    teachingStyle: "Immersive",
    applicableLanguages: ["All"],
    source: "Canadian French Immersion Programs (1960s)",
    description: "100% target language environment. No native language allowed. Students are forced to think and communicate entirely in the new language.",
    keyPrinciples: ["Target language only", "Sink or swim", "Contextual learning", "Natural acquisition through necessity"],
    difficultyLevel: "Intermediate to Advanced",
    bestFor: "Committed learners ready for intensive practice, those preparing for life abroad",
    exampleActivities: ["Full conversations in target language", "Thinking exercises", "Dream journaling in L2", "Media consumption only in target"],
    researchBasis: "Canadian immersion programs show superior outcomes vs. traditional instruction",
  },
  {
    methodName: "Suggestopedia",
    teachingStyle: "Relaxation-Based",
    applicableLanguages: ["All"],
    source: "Georgi Lozanov - Suggestopedia (1978)",
    description: "Uses relaxation techniques, music, and positive suggestion to lower anxiety and accelerate learning. Lessons are presented in a comfortable, artistic environment.",
    keyPrinciples: ["Relaxed alertness", "Peripheral learning", "Music-enhanced memory", "Positive suggestion"],
    difficultyLevel: "Beginner to Intermediate",
    bestFor: "Anxious learners, creative types, those who respond to music and atmosphere",
    exampleActivities: ["Baroque music background study", "Dramatic text readings", "Visualization exercises", "Art-based vocabulary"],
    researchBasis: "Some evidence for reduced anxiety and improved retention; particularly effective for vocabulary",
  },
  {
    methodName: "Audio-Lingual Method",
    teachingStyle: "Drill-Based",
    applicableLanguages: ["All"],
    source: "US Army Language Programs (1940s-1960s)",
    description: "Pattern drills and repetition to build automatic language habits. Heavy emphasis on pronunciation and oral skills through mimicry and memorization.",
    keyPrinciples: ["Habit formation", "Pattern drills", "Oral before written", "Error prevention"],
    difficultyLevel: "Beginner",
    bestFor: "Pronunciation mastery, building automatic responses, military/professional rapid training",
    exampleActivities: ["Substitution drills", "Transformation drills", "Repetition exercises", "Dialogue memorization"],
    researchBasis: "Based on behaviorist psychology; effective for pronunciation but limited for creative language use",
  },
  {
    methodName: "Content and Language Integrated Learning (CLIL)",
    teachingStyle: "Content-Based",
    applicableLanguages: ["All"],
    source: "European Commission Language Policy (1994)",
    description: "Students learn academic subjects (history, science, art) through the target language. Language is acquired as a byproduct of learning interesting content.",
    keyPrinciples: ["Dual-focused learning", "Authentic content", "Cognitive engagement", "Language as medium not subject"],
    difficultyLevel: "Intermediate to Advanced",
    bestFor: "Academic learners, professionals learning domain-specific language, curious minds",
    exampleActivities: ["History lessons in target language", "Science experiments described in L2", "Art criticism in target language", "Current events discussion"],
    researchBasis: "Widely adopted in European education; strong outcomes for both content and language learning",
  },
  {
    methodName: "The Natural Approach",
    teachingStyle: "Immersive",
    applicableLanguages: ["All"],
    source: "Tracy Terrell & Stephen Krashen (1983)",
    description: "Emphasizes natural communication over grammar study. Students go through a silent period before speaking, focusing on comprehension first.",
    keyPrinciples: ["Silent period respected", "Comprehension before production", "Error correction minimized", "Affective filter lowered"],
    difficultyLevel: "Beginner",
    bestFor: "Beginners who feel pressured to speak too early, naturalistic learners",
    exampleActivities: ["Picture-based comprehension", "TPR activities", "Yes/No questions", "Either/or choices"],
    researchBasis: "Aligned with L1 acquisition research; effective for building comprehension foundation",
  },
  {
    methodName: "Lexical Approach",
    teachingStyle: "Vocabulary-First",
    applicableLanguages: ["All"],
    source: "Michael Lewis - The Lexical Approach (1993)",
    description: "Language is taught through chunks, collocations, and fixed expressions rather than individual words or grammar rules. Focus on how words naturally combine.",
    keyPrinciples: ["Chunks over words", "Collocations are key", "Grammar emerges from lexis", "Notice and collect patterns"],
    difficultyLevel: "Intermediate to Advanced",
    bestFor: "Students who sound 'textbook-ish', those wanting natural-sounding speech",
    exampleActivities: ["Collocation matching", "Chunk identification in texts", "Phrase journals", "Native speaker corpus analysis"],
    researchBasis: "Corpus linguistics research shows native speakers rely heavily on prefabricated chunks",
  },
  {
    methodName: "Dogme / Teaching Unplugged",
    teachingStyle: "Conversational",
    applicableLanguages: ["All"],
    source: "Scott Thornbury - Teaching Unplugged (2000)",
    description: "Materials-free, conversation-driven teaching. Lessons emerge from what students want to talk about. Teacher facilitates rather than lectures.",
    keyPrinciples: ["Student-generated content", "Emergent language", "Minimal materials", "Conversation as curriculum"],
    difficultyLevel: "Intermediate to Advanced",
    bestFor: "Confident learners who want personalized conversation practice, those bored by textbooks",
    exampleActivities: ["Free conversation with feedback", "Student-chosen topics", "Real-life problem discussion", "Spontaneous role plays"],
    researchBasis: "Aligns with learner autonomy research and communicative competence theory",
  },
  {
    methodName: "Grammar-Translation Method",
    teachingStyle: "Academic",
    applicableLanguages: ["All"],
    source: "Classical Language Teaching (19th century)",
    description: "Traditional method focusing on reading, writing, grammar rules, and translation between L1 and L2. Heavy emphasis on accuracy and literary texts.",
    keyPrinciples: ["Grammar rules explicit", "Translation exercises", "Reading/writing focus", "Accuracy over fluency"],
    difficultyLevel: "All levels",
    bestFor: "Academic study, reading literature, passing written exams, understanding grammar deeply",
    exampleActivities: ["Translation passages", "Grammar rule memorization", "Sentence parsing", "Literary text analysis"],
    researchBasis: "Oldest method; effective for reading/writing but limited for speaking/listening",
  },
  {
    methodName: "Shadowing Technique",
    teachingStyle: "Pronunciation-Focused",
    applicableLanguages: ["All"],
    source: "Alexander Arguelles - Shadowing Method (2000s)",
    description: "Students listen to native audio and repeat simultaneously (shadowing) or with a slight delay. Builds pronunciation, rhythm, and intonation through mimicry.",
    keyPrinciples: ["Simultaneous repetition", "Prosody acquisition", "Muscle memory", "Native model imitation"],
    difficultyLevel: "Intermediate to Advanced",
    bestFor: "Pronunciation improvement, accent reduction, developing natural rhythm and intonation",
    exampleActivities: ["Podcast shadowing", "Movie dialogue repetition", "News broadcast mimicry", "Song lyric shadowing"],
    researchBasis: "Used in interpreter training; effective for prosody and phonological development",
  },
  {
    methodName: "Tandem Learning / Language Exchange",
    teachingStyle: "Peer-Based",
    applicableLanguages: ["All"],
    source: "European Tandem Network (1990s)",
    description: "Two learners of different native languages teach each other. Each person is both student and teacher, practicing their target language with a native speaker.",
    keyPrinciples: ["Reciprocity", "Autonomy", "Native speaker interaction", "Mutual benefit"],
    difficultyLevel: "Intermediate to Advanced",
    bestFor: "Social learners, those wanting authentic conversation, cultural exchange enthusiasts",
    exampleActivities: ["Conversation exchange sessions", "Correction partnerships", "Cultural sharing", "Joint projects in both languages"],
    researchBasis: "Strong evidence for motivation and authentic language use; builds intercultural competence",
  },
];

// ─── Router ─────────────────────────────────────────────────────────────────

export const methodologyIngestionRouter = router({
  /**
   * Check if the Airtable methodology table exists and is accessible
   */
  checkStatus: publicProcedure.query(async () => {
    try {
      const tableExists = await ensureMethodologyTable();
      return {
        connected: true,
        tableExists,
        apiKeySet: !!process.env.AIRTABLE_API_KEY,
        baseIdSet: !!process.env.AIRTABLE_BASE_ID,
      };
    } catch (err: any) {
      return {
        connected: false,
        tableExists: false,
        apiKeySet: !!process.env.AIRTABLE_API_KEY,
        baseIdSet: !!process.env.AIRTABLE_BASE_ID,
        error: err.message,
      };
    }
  }),

  /**
   * Push all methodology research data to Airtable
   */
  ingestAll: publicProcedure.mutation(async () => {
    const records = METHODOLOGY_DATABASE.map((m) => ({
      fields: {
        "Method Name": m.methodName,
        "Teaching Style": m.teachingStyle,
        "Applicable Languages": m.applicableLanguages.join(", "),
        "Source": m.source,
        "Description": m.description,
        "Key Principles": m.keyPrinciples.join("; "),
        "Difficulty Level": m.difficultyLevel,
        "Best For": m.bestFor,
        "Example Activities": m.exampleActivities.join("; "),
        "Research Basis": m.researchBasis,
      },
    }));

    const result = await pushRecordsToAirtable("Teaching Methodologies", records);
    return {
      ...result,
      totalMethods: METHODOLOGY_DATABASE.length,
    };
  }),

  /**
   * Push a single custom methodology record
   */
  ingestOne: publicProcedure
    .input(
      z.object({
        methodName: z.string(),
        teachingStyle: z.string(),
        applicableLanguages: z.array(z.string()),
        source: z.string(),
        description: z.string(),
        keyPrinciples: z.array(z.string()),
        difficultyLevel: z.string(),
        bestFor: z.string(),
        exampleActivities: z.array(z.string()),
        researchBasis: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const records = [
        {
          fields: {
            "Method Name": input.methodName,
            "Teaching Style": input.teachingStyle,
            "Applicable Languages": input.applicableLanguages.join(", "),
            "Source": input.source,
            "Description": input.description,
            "Key Principles": input.keyPrinciples.join("; "),
            "Difficulty Level": input.difficultyLevel,
            "Best For": input.bestFor,
            "Example Activities": input.exampleActivities.join("; "),
            "Research Basis": input.researchBasis,
          },
        },
      ];
      return pushRecordsToAirtable("Teaching Methodologies", records);
    }),

  /**
   * Query methodology records by teaching style or language
   */
  query: publicProcedure
    .input(
      z.object({
        teachingStyle: z.string().optional(),
        language: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const records = await fetchMethodologyRecords(input);
      return {
        records: records.map((r: any) => ({
          id: r.id,
          ...r.fields,
        })),
        total: records.length,
      };
    }),

  /**
   * Get all available teaching styles from the built-in database
   */
  getTeachingStyles: publicProcedure.query(() => {
    const styles = [...new Set(METHODOLOGY_DATABASE.map((m) => m.teachingStyle))];
    return {
      styles,
      methods: METHODOLOGY_DATABASE.map((m) => ({
        name: m.methodName,
        style: m.teachingStyle,
        languages: m.applicableLanguages,
        level: m.difficultyLevel,
        bestFor: m.bestFor,
      })),
    };
  }),

  /**
   * Get methodology recommendations for a specific language and student profile
   */
  recommend: publicProcedure
    .input(
      z.object({
        targetLanguage: z.string(),
        proficiencyLevel: z.string(),
        learningGoal: z.string().optional(),
        preferredStyle: z.string().optional(),
        quizPerformance: z.object({
          totalQuestions: z.number(),
          correctAnswers: z.number(),
          bestStreak: z.number(),
          averageTimePerQuestion: z.number().optional(),
        }).optional(),
        learningPace: z.enum(["slow", "moderate", "fast", "unknown"]).optional(),
        struggles: z.array(z.string()).optional(),
      })
    )
    .query(({ input }) => {
      let methods = [...METHODOLOGY_DATABASE];

      // Filter by difficulty level compatibility
      const levelMap: Record<string, string[]> = {
        A1: ["Beginner", "All levels"],
        A2: ["Beginner", "Beginner to Intermediate", "All levels"],
        B1: ["Intermediate to Advanced", "Beginner to Intermediate", "All levels"],
        B2: ["Intermediate to Advanced", "All levels"],
        C1: ["Intermediate to Advanced", "All levels"],
        C2: ["Intermediate to Advanced", "All levels"],
      };
      const validLevels = levelMap[input.proficiencyLevel] || ["All levels"];
      methods = methods.filter(
        (m) =>
          m.difficultyLevel === "All levels" ||
          validLevels.some((l) => m.difficultyLevel.includes(l.split(" ")[0]))
      );

      // Score each method based on student profile
      const scored = methods.map((m) => {
        let score = 0;
        // Boost preferred style
        if (input.preferredStyle && m.teachingStyle === input.preferredStyle) score += 30;
        // Quiz performance analysis
        if (input.quizPerformance) {
          const accuracy = input.quizPerformance.totalQuestions > 0
            ? input.quizPerformance.correctAnswers / input.quizPerformance.totalQuestions
            : 0;
          if (accuracy < 0.5) {
            if (m.teachingStyle.includes("Immersive") || m.teachingStyle.includes("Kinesthetic")) score += 20;
          }
          if (accuracy > 0.8) {
            if (m.teachingStyle.includes("Conversational") || m.teachingStyle.includes("Project")) score += 20;
          }
          if (input.quizPerformance.bestStreak > 5) {
            if (m.teachingStyle.includes("Memory") || m.teachingStyle.includes("Competitive")) score += 15;
          }
        }
        // Learning pace matching
        if (input.learningPace === "slow") {
          if (m.difficultyLevel.includes("Beginner") || m.teachingStyle.includes("Relaxation")) score += 15;
        } else if (input.learningPace === "fast") {
          if (m.teachingStyle.includes("Immersive") || m.teachingStyle.includes("Drill")) score += 15;
        }
        // Struggle-based boosting
        if (input.struggles?.length) {
          const struggleStr = input.struggles.join(" ").toLowerCase();
          if (struggleStr.includes("pronunciation") && m.bestFor.toLowerCase().includes("speaking")) score += 20;
          if (struggleStr.includes("grammar") && m.bestFor.toLowerCase().includes("grammar")) score += 20;
          if (struggleStr.includes("vocabulary") && m.bestFor.toLowerCase().includes("vocab")) score += 20;
          if (struggleStr.includes("listening") && m.bestFor.toLowerCase().includes("listen")) score += 20;
          if (struggleStr.includes("writing") && m.bestFor.toLowerCase().includes("writ")) score += 20;
        }
        // Build reasoning
        const reasons: string[] = [];
        if (input.preferredStyle && m.teachingStyle === input.preferredStyle) reasons.push("Matches your preferred learning style");
        if (input.quizPerformance) {
          const acc = input.quizPerformance.correctAnswers / Math.max(input.quizPerformance.totalQuestions, 1);
          if (acc > 0.8) reasons.push("Suited for your strong quiz performance");
          if (acc < 0.5) reasons.push("Designed to strengthen weak areas");
        }
        if (input.learningPace === "fast") reasons.push("Keeps up with your fast learning pace");
        if (input.learningPace === "slow") reasons.push("Gentle progression for steady growth");
        if (input.struggles?.some(s => m.bestFor.toLowerCase().includes(s.toLowerCase().slice(0, 4)))) {
          reasons.push("Targets your specific struggle areas");
        }
        if (!reasons.length) reasons.push("Good fit for your current level");
        return { method: m, score, reasons };
      });

      scored.sort((a, b) => b.score - a.score);

      return {
        recommendations: scored.slice(0, 5).map((s) => ({
          methodName: s.method.methodName,
          teachingStyle: s.method.teachingStyle,
          description: s.method.description,
          bestFor: s.method.bestFor,
          exampleActivities: s.method.exampleActivities,
          matchScore: s.score,
          reasons: s.reasons,
        })),
        totalAvailable: methods.length,
      };
    }),
});
