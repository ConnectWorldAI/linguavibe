/**
 * Knowledge Gap Map — Visual Skill Tree
 * 
 * Tracks exactly what the student knows vs. doesn't know across
 * grammar, vocabulary, pronunciation, and comprehension.
 * The AI uses this to decide what to teach next — not a fixed
 * curriculum, but a dynamic one.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export type SkillDomain = "grammar" | "vocabulary" | "pronunciation" | "comprehension" | "writing" | "culture";

export type MasteryLevel = "unknown" | "introduced" | "practicing" | "familiar" | "mastered";

export interface SkillNode {
  id: string;
  name: string;
  domain: SkillDomain;
  level: string;              // CEFR level: A1, A2, B1, B2, C1, C2
  mastery: MasteryLevel;
  masteryScore: number;       // 0-100
  attempts: number;
  lastPracticed: string | null;
  prerequisites: string[];    // Skill IDs that should be learned first
  dependents: string[];       // Skills that depend on this one
  subSkills: string[];        // Child skill IDs
  parentSkill: string | null; // Parent skill ID
}

export interface SkillTree {
  domains: Record<SkillDomain, SkillNode[]>;
  totalSkills: number;
  masteredSkills: number;
  inProgressSkills: number;
  unknownSkills: number;
  overallMastery: number;     // 0-100
  lastUpdated: string;
}

export interface GapAnalysis {
  criticalGaps: SkillNode[];      // Skills that block progress
  readyToLearn: SkillNode[];      // Prerequisites met, ready to start
  almostMastered: SkillNode[];    // Close to mastery, need a little more practice
  suggestedNext: SkillNode[];     // AI-recommended next skills
  strengthAreas: SkillDomain[];   // Domains where user excels
  weakAreas: SkillDomain[];       // Domains needing attention
}

export interface LearningPriority {
  skillId: string;
  skillName: string;
  domain: SkillDomain;
  priority: number;           // 1-10, higher = more urgent
  reason: string;
  estimatedMinutes: number;   // Estimated time to learn
}

// ─── Storage Keys ───────────────────────────────────────────────────────────

const SKILL_TREE_KEY = "@knowledge_gap_skill_tree";
const PRACTICE_LOG_KEY = "@knowledge_gap_practice_log";

// ─── Default Skill Definitions ──────────────────────────────────────────────

const DEFAULT_SKILLS: Record<SkillDomain, Array<{ id: string; name: string; level: string; prerequisites: string[]; subSkills?: string[] }>> = {
  grammar: [
    { id: "g_present_tense", name: "Present Tense", level: "A1", prerequisites: [] },
    { id: "g_articles", name: "Articles (el/la/un/una)", level: "A1", prerequisites: [] },
    { id: "g_gender_agreement", name: "Gender Agreement", level: "A1", prerequisites: ["g_articles"] },
    { id: "g_plural_forms", name: "Plural Forms", level: "A1", prerequisites: ["g_gender_agreement"] },
    { id: "g_ser_estar", name: "Ser vs Estar", level: "A2", prerequisites: ["g_present_tense"] },
    { id: "g_past_preterite", name: "Past Tense (Preterite)", level: "A2", prerequisites: ["g_present_tense"] },
    { id: "g_past_imperfect", name: "Past Tense (Imperfect)", level: "A2", prerequisites: ["g_past_preterite"] },
    { id: "g_reflexive_verbs", name: "Reflexive Verbs", level: "A2", prerequisites: ["g_present_tense"] },
    { id: "g_subjunctive_present", name: "Present Subjunctive", level: "B1", prerequisites: ["g_present_tense", "g_ser_estar"] },
    { id: "g_conditional", name: "Conditional Tense", level: "B1", prerequisites: ["g_past_imperfect"] },
    { id: "g_future_tense", name: "Future Tense", level: "B1", prerequisites: ["g_present_tense"] },
    { id: "g_subjunctive_past", name: "Past Subjunctive", level: "B2", prerequisites: ["g_subjunctive_present", "g_past_imperfect"] },
    { id: "g_passive_voice", name: "Passive Voice", level: "B2", prerequisites: ["g_past_preterite"] },
    { id: "g_relative_clauses", name: "Relative Clauses", level: "B2", prerequisites: ["g_subjunctive_present"] },
    { id: "g_advanced_subjunctive", name: "Advanced Subjunctive", level: "C1", prerequisites: ["g_subjunctive_past"] },
    { id: "g_literary_tenses", name: "Literary Tenses", level: "C2", prerequisites: ["g_advanced_subjunctive"] },
  ],
  vocabulary: [
    { id: "v_greetings", name: "Greetings & Basics", level: "A1", prerequisites: [] },
    { id: "v_numbers", name: "Numbers & Counting", level: "A1", prerequisites: [] },
    { id: "v_colors_shapes", name: "Colors & Shapes", level: "A1", prerequisites: [] },
    { id: "v_family", name: "Family & Relationships", level: "A1", prerequisites: ["v_greetings"] },
    { id: "v_food_drink", name: "Food & Drink", level: "A2", prerequisites: ["v_greetings"] },
    { id: "v_travel", name: "Travel & Directions", level: "A2", prerequisites: ["v_numbers"] },
    { id: "v_daily_routine", name: "Daily Routine", level: "A2", prerequisites: ["v_family"] },
    { id: "v_work_profession", name: "Work & Professions", level: "B1", prerequisites: ["v_daily_routine"] },
    { id: "v_health_body", name: "Health & Body", level: "B1", prerequisites: ["v_food_drink"] },
    { id: "v_emotions", name: "Emotions & Feelings", level: "B1", prerequisites: ["v_family"] },
    { id: "v_technology", name: "Technology & Media", level: "B2", prerequisites: ["v_work_profession"] },
    { id: "v_politics_society", name: "Politics & Society", level: "B2", prerequisites: ["v_emotions"] },
    { id: "v_idioms_expressions", name: "Idioms & Expressions", level: "C1", prerequisites: ["v_emotions", "v_daily_routine"] },
    { id: "v_academic_formal", name: "Academic & Formal", level: "C1", prerequisites: ["v_politics_society"] },
    { id: "v_slang_colloquial", name: "Slang & Colloquial", level: "C1", prerequisites: ["v_idioms_expressions"] },
  ],
  pronunciation: [
    { id: "p_vowels", name: "Vowel Sounds", level: "A1", prerequisites: [] },
    { id: "p_consonants", name: "Consonant Sounds", level: "A1", prerequisites: [] },
    { id: "p_syllable_stress", name: "Syllable Stress", level: "A2", prerequisites: ["p_vowels"] },
    { id: "p_intonation", name: "Intonation Patterns", level: "A2", prerequisites: ["p_syllable_stress"] },
    { id: "p_linking", name: "Word Linking", level: "B1", prerequisites: ["p_intonation"] },
    { id: "p_rhythm", name: "Speech Rhythm", level: "B1", prerequisites: ["p_linking"] },
    { id: "p_regional_accents", name: "Regional Accents", level: "B2", prerequisites: ["p_rhythm"] },
    { id: "p_native_speed", name: "Native Speed", level: "C1", prerequisites: ["p_regional_accents"] },
  ],
  comprehension: [
    { id: "c_basic_phrases", name: "Basic Phrases", level: "A1", prerequisites: [] },
    { id: "c_simple_sentences", name: "Simple Sentences", level: "A1", prerequisites: ["c_basic_phrases"] },
    { id: "c_short_dialogues", name: "Short Dialogues", level: "A2", prerequisites: ["c_simple_sentences"] },
    { id: "c_paragraph_reading", name: "Paragraph Reading", level: "A2", prerequisites: ["c_short_dialogues"] },
    { id: "c_audio_comprehension", name: "Audio Comprehension", level: "B1", prerequisites: ["c_short_dialogues"] },
    { id: "c_news_articles", name: "News Articles", level: "B1", prerequisites: ["c_paragraph_reading"] },
    { id: "c_native_conversations", name: "Native Conversations", level: "B2", prerequisites: ["c_audio_comprehension"] },
    { id: "c_movies_media", name: "Movies & Media", level: "B2", prerequisites: ["c_native_conversations"] },
    { id: "c_academic_texts", name: "Academic Texts", level: "C1", prerequisites: ["c_news_articles"] },
    { id: "c_nuance_subtext", name: "Nuance & Subtext", level: "C2", prerequisites: ["c_academic_texts", "c_movies_media"] },
  ],
  writing: [
    { id: "w_basic_words", name: "Basic Words", level: "A1", prerequisites: [] },
    { id: "w_simple_sentences", name: "Simple Sentences", level: "A1", prerequisites: ["w_basic_words"] },
    { id: "w_short_messages", name: "Short Messages", level: "A2", prerequisites: ["w_simple_sentences"] },
    { id: "w_paragraphs", name: "Paragraphs", level: "B1", prerequisites: ["w_short_messages"] },
    { id: "w_essays", name: "Essays & Arguments", level: "B2", prerequisites: ["w_paragraphs"] },
    { id: "w_creative_writing", name: "Creative Writing", level: "C1", prerequisites: ["w_essays"] },
    { id: "w_formal_documents", name: "Formal Documents", level: "C1", prerequisites: ["w_essays"] },
  ],
  culture: [
    { id: "cu_basic_etiquette", name: "Basic Etiquette", level: "A1", prerequisites: [] },
    { id: "cu_food_customs", name: "Food & Customs", level: "A2", prerequisites: ["cu_basic_etiquette"] },
    { id: "cu_holidays_traditions", name: "Holidays & Traditions", level: "A2", prerequisites: ["cu_basic_etiquette"] },
    { id: "cu_music_art", name: "Music & Art", level: "B1", prerequisites: ["cu_food_customs"] },
    { id: "cu_history_geography", name: "History & Geography", level: "B1", prerequisites: ["cu_holidays_traditions"] },
    { id: "cu_humor_idioms", name: "Humor & Idioms", level: "B2", prerequisites: ["cu_music_art"] },
    { id: "cu_regional_differences", name: "Regional Differences", level: "C1", prerequisites: ["cu_humor_idioms", "cu_history_geography"] },
  ],
};

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Initialize or get the skill tree
 */
export async function getSkillTree(): Promise<SkillTree> {
  const raw = await AsyncStorage.getItem(SKILL_TREE_KEY);
  if (raw) return JSON.parse(raw);
  return initializeSkillTree();
}

/**
 * Initialize skill tree with default skills
 */
export async function initializeSkillTree(): Promise<SkillTree> {
  const domains: Record<SkillDomain, SkillNode[]> = {
    grammar: [],
    vocabulary: [],
    pronunciation: [],
    comprehension: [],
    writing: [],
    culture: [],
  };
  
  for (const [domain, skills] of Object.entries(DEFAULT_SKILLS)) {
    domains[domain as SkillDomain] = skills.map(s => ({
      id: s.id,
      name: s.name,
      domain: domain as SkillDomain,
      level: s.level,
      mastery: "unknown" as MasteryLevel,
      masteryScore: 0,
      attempts: 0,
      lastPracticed: null,
      prerequisites: s.prerequisites,
      dependents: [],
      subSkills: s.subSkills || [],
      parentSkill: null,
    }));
  }
  
  // Build dependents (reverse of prerequisites)
  for (const domainSkills of Object.values(domains)) {
    for (const skill of domainSkills) {
      for (const prereq of skill.prerequisites) {
        const prereqSkill = findSkillInDomains(domains, prereq);
        if (prereqSkill && !prereqSkill.dependents.includes(skill.id)) {
          prereqSkill.dependents.push(skill.id);
        }
      }
    }
  }
  
  const allSkills = Object.values(domains).flat();
  const tree: SkillTree = {
    domains,
    totalSkills: allSkills.length,
    masteredSkills: 0,
    inProgressSkills: 0,
    unknownSkills: allSkills.length,
    overallMastery: 0,
    lastUpdated: new Date().toISOString(),
  };
  
  await AsyncStorage.setItem(SKILL_TREE_KEY, JSON.stringify(tree));
  return tree;
}

/**
 * Update a skill's mastery based on practice results
 */
export async function updateSkillMastery(
  skillId: string,
  score: number,      // 0-100 on the practice
  correct: boolean
): Promise<SkillNode | null> {
  const tree = await getSkillTree();
  const skill = findSkillInDomains(tree.domains, skillId);
  if (!skill) return null;
  
  skill.attempts++;
  skill.lastPracticed = new Date().toISOString();
  
  // Update mastery score with exponential moving average
  const alpha = 0.3; // Weight for new score
  skill.masteryScore = Math.round(skill.masteryScore * (1 - alpha) + score * alpha);
  
  // Determine mastery level
  if (skill.masteryScore >= 90 && skill.attempts >= 5) {
    skill.mastery = "mastered";
  } else if (skill.masteryScore >= 70 && skill.attempts >= 3) {
    skill.mastery = "familiar";
  } else if (skill.masteryScore >= 40 && skill.attempts >= 2) {
    skill.mastery = "practicing";
  } else if (skill.attempts >= 1) {
    skill.mastery = "introduced";
  }
  
  // Recalculate tree stats
  const allSkills = Object.values(tree.domains).flat();
  tree.masteredSkills = allSkills.filter(s => s.mastery === "mastered").length;
  tree.inProgressSkills = allSkills.filter(s => ["introduced", "practicing", "familiar"].includes(s.mastery)).length;
  tree.unknownSkills = allSkills.filter(s => s.mastery === "unknown").length;
  tree.overallMastery = Math.round(
    allSkills.reduce((sum, s) => sum + s.masteryScore, 0) / allSkills.length
  );
  tree.lastUpdated = new Date().toISOString();
  
  await AsyncStorage.setItem(SKILL_TREE_KEY, JSON.stringify(tree));
  
  // Log practice
  await logPractice(skillId, score, correct);
  
  return skill;
}

/**
 * Perform gap analysis — identify what needs attention
 */
export async function analyzeGaps(): Promise<GapAnalysis> {
  const tree = await getSkillTree();
  const allSkills = Object.values(tree.domains).flat();
  
  // Critical gaps: skills that are prerequisites for many others but not mastered
  const criticalGaps = allSkills.filter(s => {
    return s.mastery !== "mastered" && s.dependents.length >= 2;
  }).sort((a, b) => b.dependents.length - a.dependents.length).slice(0, 5);
  
  // Ready to learn: prerequisites met, but not yet started
  const readyToLearn = allSkills.filter(s => {
    if (s.mastery !== "unknown") return false;
    return s.prerequisites.every(prereqId => {
      const prereq = findSkillInDomains(tree.domains, prereqId);
      return prereq && (prereq.mastery === "mastered" || prereq.mastery === "familiar");
    });
  }).slice(0, 8);
  
  // Almost mastered: high score but not quite there
  const almostMastered = allSkills.filter(s => {
    return s.mastery === "familiar" && s.masteryScore >= 75;
  }).sort((a, b) => b.masteryScore - a.masteryScore).slice(0, 5);
  
  // Domain strength analysis
  const domainScores: Record<SkillDomain, number> = {} as any;
  for (const [domain, skills] of Object.entries(tree.domains)) {
    const practiced = skills.filter(s => s.mastery !== "unknown");
    domainScores[domain as SkillDomain] = practiced.length > 0
      ? practiced.reduce((sum, s) => sum + s.masteryScore, 0) / practiced.length
      : 0;
  }
  
  const sortedDomains = Object.entries(domainScores).sort((a, b) => b[1] - a[1]);
  const strengthAreas = sortedDomains.filter(([, score]) => score >= 70).map(([d]) => d as SkillDomain);
  const weakAreas = sortedDomains.filter(([, score]) => score < 50 && score > 0).map(([d]) => d as SkillDomain);
  
  // Suggested next: combine ready-to-learn with gap-filling priority
  const suggestedNext = [...criticalGaps.slice(0, 2), ...readyToLearn.slice(0, 3)].slice(0, 5);
  
  return {
    criticalGaps,
    readyToLearn,
    almostMastered,
    suggestedNext,
    strengthAreas,
    weakAreas,
  };
}

/**
 * Get prioritized learning recommendations
 */
export async function getLearningPriorities(count: number = 5): Promise<LearningPriority[]> {
  const gaps = await analyzeGaps();
  const priorities: LearningPriority[] = [];
  
  // Critical gaps get highest priority
  for (const skill of gaps.criticalGaps.slice(0, 2)) {
    priorities.push({
      skillId: skill.id,
      skillName: skill.name,
      domain: skill.domain,
      priority: 10,
      reason: `Blocks ${skill.dependents.length} other skills. Focus here first.`,
      estimatedMinutes: 15,
    });
  }
  
  // Almost mastered — quick wins
  for (const skill of gaps.almostMastered.slice(0, 2)) {
    priorities.push({
      skillId: skill.id,
      skillName: skill.name,
      domain: skill.domain,
      priority: 8,
      reason: `Almost there (${skill.masteryScore}%). A few more practices to master.`,
      estimatedMinutes: 5,
    });
  }
  
  // Ready to learn — expand knowledge
  for (const skill of gaps.readyToLearn.slice(0, 3)) {
    priorities.push({
      skillId: skill.id,
      skillName: skill.name,
      domain: skill.domain,
      priority: 6,
      reason: `Prerequisites complete. Ready to start learning.`,
      estimatedMinutes: 20,
    });
  }
  
  return priorities.sort((a, b) => b.priority - a.priority).slice(0, count);
}

/**
 * Get skill tree summary for a specific domain
 */
export async function getDomainSummary(domain: SkillDomain): Promise<{
  total: number;
  mastered: number;
  inProgress: number;
  unknown: number;
  averageMastery: number;
  nextToLearn: SkillNode | null;
}> {
  const tree = await getSkillTree();
  const skills = tree.domains[domain];
  
  const mastered = skills.filter(s => s.mastery === "mastered").length;
  const inProgress = skills.filter(s => ["introduced", "practicing", "familiar"].includes(s.mastery)).length;
  const unknown = skills.filter(s => s.mastery === "unknown").length;
  const avgMastery = skills.length > 0
    ? Math.round(skills.reduce((sum, s) => sum + s.masteryScore, 0) / skills.length)
    : 0;
  
  // Find next skill to learn
  const nextToLearn = skills.find(s => {
    if (s.mastery !== "unknown") return false;
    return s.prerequisites.every(prereqId => {
      const prereq = findSkillInDomains(tree.domains, prereqId);
      return prereq && prereq.mastery === "mastered";
    });
  }) || null;
  
  return {
    total: skills.length,
    mastered,
    inProgress,
    unknown,
    averageMastery: avgMastery,
    nextToLearn,
  };
}

/**
 * Get all skills for a specific CEFR level
 */
export async function getSkillsByLevel(level: string): Promise<SkillNode[]> {
  const tree = await getSkillTree();
  return Object.values(tree.domains).flat().filter(s => s.level === level);
}

/**
 * Mark a skill as introduced (user has seen the content)
 */
export async function markSkillIntroduced(skillId: string): Promise<void> {
  const tree = await getSkillTree();
  const skill = findSkillInDomains(tree.domains, skillId);
  if (skill && skill.mastery === "unknown") {
    skill.mastery = "introduced";
    skill.masteryScore = 10;
    skill.attempts = 1;
    skill.lastPracticed = new Date().toISOString();
    tree.lastUpdated = new Date().toISOString();
    await AsyncStorage.setItem(SKILL_TREE_KEY, JSON.stringify(tree));
  }
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

function findSkillInDomains(domains: Record<SkillDomain, SkillNode[]>, skillId: string): SkillNode | null {
  for (const skills of Object.values(domains)) {
    const found = skills.find(s => s.id === skillId);
    if (found) return found;
  }
  return null;
}

async function logPractice(skillId: string, score: number, correct: boolean): Promise<void> {
  const raw = await AsyncStorage.getItem(PRACTICE_LOG_KEY);
  const log: Array<{ skillId: string; score: number; correct: boolean; timestamp: string }> = raw ? JSON.parse(raw) : [];
  log.push({ skillId, score, correct, timestamp: new Date().toISOString() });
  await AsyncStorage.setItem(PRACTICE_LOG_KEY, JSON.stringify(log.slice(-500)));
}
