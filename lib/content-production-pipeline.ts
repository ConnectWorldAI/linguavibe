/**
 * ConnectWorld AI — Content Production Pipeline
 * 
 * Takes inspiration from creator pages, classifies content type,
 * generates original video scripts with unique twists, assigns avatars/languages,
 * and outputs ready-to-produce content briefs for mass production.
 * 
 * Flow:
 * 1. User sends creator page/video URL
 * 2. System analyzes and classifies content
 * 3. Routes to appropriate output channels
 * 4. Generates original content briefs with different angle/twist
 * 5. Assigns avatar, language, platform, and monetization strategy
 */

// ─── Content Classification ─────────────────────────────────────────────────

export type ContentCategory =
  | 'slang_teaching'      // Someone teaching slang/phrases
  | 'restaurant_food'     // Restaurant visit, food review, ordering
  | 'cooking'             // Cooking a dish, recipe walkthrough
  | 'travel_city'         // Traveling, showing a city, spots to visit
  | 'culture_history'     // Explaining traditions, history, holidays
  | 'music_dance'         // Music, dancing, concerts, artists
  | 'nightlife'           // Clubs, bars, nightlife scenes
  | 'shopping_market'     // Markets, shopping, haggling
  | 'daily_life'          // Day-in-the-life, routines, conversations
  | 'sports_fitness'      // Sports, gym, outdoor activities
  | 'education_school'    // School, university, study tips
  | 'business_work'       // Work, office, professional settings
  | 'family_relationships' // Family dynamics, dating, friendships
  | 'humor_comedy'        // Comedy, jokes, funny situations
  | 'fashion_beauty';     // Fashion, beauty, style

export type OutputChannel =
  | 'slang_database'      // Feeds into slang/phrase database
  | 'agent_knowledge'     // Enriches AI agent knowledge base
  | 'video_youtube'       // Full video for YouTube (3-10 min)
  | 'video_shorts'        // Short-form for TikTok/Reels/Shorts (15-60 sec)
  | 'video_app_tv'        // ConnectWorld AI TV in-app content
  | 'lesson_material'     // Structured lesson content
  | 'scenario_mode'       // Dream Vacation / scenario practice
  | 'cultural_knowledge'  // Cultural knowledge base enrichment
  | 'city_guide'          // City guide / travel content
  | 'music_lesson';       // Song/music breakdown lesson

export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'in_app' | 'all';

export type VideoLength = 'short' | 'medium' | 'long'; // short: 15-60 sec, medium: 3-5 min, long: 5-10 min

// ─── Source Ingestion ────────────────────────────────────────────────────────

export interface ContentSource {
  id: string;
  url: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'other';
  creatorHandle: string;
  creatorName: string;
  dateIngested: string; // ISO date
  
  // Analysis results
  category: ContentCategory;
  subcategory?: string;
  language: string;           // Primary language in content
  region: string;             // Country/city/region
  topics: string[];           // Key topics extracted
  vocabulary: string[];       // Key words/phrases spotted
  culturalElements: string[]; // Cultural references
  musicReferences?: string[]; // Songs/artists mentioned
  locations?: string[];       // Specific places mentioned
  
  // Routing decisions
  outputChannels: OutputChannel[];
  priority: 'high' | 'medium' | 'low';
  processed: boolean;
}

// ─── Content Brief (Output) ──────────────────────────────────────────────────

export interface ContentBrief {
  id: string;
  sourceId: string;          // Which source inspired this
  createdAt: string;
  
  // What to produce
  title: string;
  hook: string;              // First 3 seconds / opening line
  concept: string;           // 1-2 sentence summary of the video concept
  twist: string;             // How we differentiate from the source
  
  // Script
  script: VideoScript;
  
  // Assignment
  avatar: string;            // Which ConnectWorld AI avatar hosts this
  language: string;          // Primary teaching language
  secondaryLanguage: string; // Usually English (for explanations)
  region: string;            // Cultural region
  
  // Production
  platform: Platform;
  videoLength: VideoLength;
  visualStyle: string;       // Description of visual approach
  musicSuggestion?: string;  // Background music style/genre
  
  // Monetization
  monetization: MonetizationStrategy;
  
  // Vocabulary taught
  vocabularyTargets: VocabularyTarget[];
  
  // Status
  status: 'draft' | 'approved' | 'in_production' | 'published';
}

export interface VideoScript {
  openingHook: string;       // First 3 seconds (critical for retention)
  introduction: string;      // Set up the scenario (10-15 sec)
  segments: ScriptSegment[]; // Main content segments
  callToAction: string;      // End CTA (download app, subscribe, etc.)
  closingLine: string;       // Avatar's signature sign-off
  
  // Teaching moments embedded in script
  teachingMoments: TeachingMoment[];
}

export interface ScriptSegment {
  timestamp: string;         // Approximate timing
  action: string;            // What's happening visually
  dialogue: string;          // What avatar says (in target language)
  translation: string;       // English translation shown on screen
  culturalNote?: string;     // Pop-up cultural context
}

export interface TeachingMoment {
  word: string;              // Target vocabulary word
  translation: string;
  context: string;           // How it's used in the video
  pronunciation: string;    // Phonetic guide
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface VocabularyTarget {
  word: string;
  translation: string;
  category: string;          // food, greetings, directions, etc.
  difficulty: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

export interface MonetizationStrategy {
  platforms: Platform[];
  revenueStreams: string[];  // 'youtube_ads', 'app_subscription', 'sponsored', etc.
  sponsorOpportunity?: string; // What brand could sponsor this
  affiliateLinks?: string[];   // Relevant affiliate opportunities
  estimatedReach: string;      // Low/Medium/High potential
}

// ─── Twist Engine ────────────────────────────────────────────────────────────
// Takes a source topic and generates a unique angle

export interface TwistTemplate {
  id: string;
  name: string;
  description: string;
  applicableCategories: ContentCategory[];
  twistFormula: string; // Template for how to twist the content
}

export const TWIST_TEMPLATES: TwistTemplate[] = [
  {
    id: 'order_challenge',
    name: 'The Ordering Challenge',
    description: 'Avatar tries to order at the same type of place but in the target language, making mistakes and learning',
    applicableCategories: ['restaurant_food', 'shopping_market', 'nightlife'],
    twistFormula: 'Our avatar visits a similar [place_type] and attempts to [action] entirely in [language]. They make common mistakes that viewers learn from.',
  },
  {
    id: 'history_behind',
    name: 'The Story Behind It',
    description: 'Take the same dish/place/tradition and tell its origin story while teaching vocabulary',
    applicableCategories: ['cooking', 'restaurant_food', 'culture_history', 'music_dance'],
    twistFormula: 'While showing [topic], our avatar tells the fascinating history of why [cultural_element] exists, teaching [X] vocabulary words along the way.',
  },
  {
    id: 'compare_countries',
    name: 'Same Thing, Different Country',
    description: 'Take the same concept and show how 3-5 countries do it differently',
    applicableCategories: ['cooking', 'restaurant_food', 'culture_history', 'daily_life', 'music_dance'],
    twistFormula: 'Our avatar shows how [topic] is done in [country_1] vs [country_2] vs [country_3], highlighting the vocabulary differences in each.',
  },
  {
    id: 'teach_me_to',
    name: 'Teach Me To...',
    description: 'Avatar is a student learning how to do the thing, asking questions in target language',
    applicableCategories: ['cooking', 'sports_fitness', 'music_dance', 'shopping_market'],
    twistFormula: 'Our avatar asks a local (AI character) to teach them how to [action]. The conversation teaches viewers real phrases they\'d need.',
  },
  {
    id: 'survival_phrases',
    name: 'Survival Phrases For...',
    description: 'Extract the essential phrases you need for that specific situation',
    applicableCategories: ['restaurant_food', 'travel_city', 'shopping_market', 'nightlife', 'daily_life'],
    twistFormula: '\"10 phrases you NEED to know before [situation] in [country].\" Quick-fire vocabulary with real scenarios.',
  },
  {
    id: 'day_in_life',
    name: 'A Day In The Life',
    description: 'Avatar lives a full day in that city/culture, narrating in target language',
    applicableCategories: ['travel_city', 'daily_life', 'culture_history'],
    twistFormula: 'Our avatar spends a full day in [city], narrating everything in [language] with English subtitles. Viewers learn 30+ words naturally.',
  },
  {
    id: 'what_they_dont_teach',
    name: 'What Textbooks Don\'t Teach You',
    description: 'Focus on the real/street version vs the textbook version',
    applicableCategories: ['slang_teaching', 'daily_life', 'humor_comedy', 'restaurant_food'],
    twistFormula: 'Textbook says [formal_version]. But in [country], people actually say [real_version]. Here\'s [X] things your textbook got wrong.',
  },
  {
    id: 'roleplay_scenario',
    name: 'Roleplay: You\'re There',
    description: 'Put the viewer in the situation as if they\'re the one doing it',
    applicableCategories: ['restaurant_food', 'travel_city', 'shopping_market', 'nightlife', 'business_work'],
    twistFormula: 'POV: You just walked into [place] in [city]. Here\'s exactly what to say, what they\'ll say back, and how to respond.',
  },
  {
    id: 'music_breakdown',
    name: 'Song Breakdown',
    description: 'Take a popular song and break down what the lyrics actually mean (slang, culture)',
    applicableCategories: ['music_dance'],
    twistFormula: 'This [genre] song by [artist] is everywhere right now. Here\'s what the lyrics ACTUALLY mean (not the Google Translate version).',
  },
  {
    id: 'mistake_correction',
    name: 'Stop Saying This Wrong',
    description: 'Common mistakes foreigners make in that language/situation',
    applicableCategories: ['slang_teaching', 'restaurant_food', 'travel_city', 'daily_life'],
    twistFormula: 'Tourists in [country] always say [wrong_thing]. Here\'s what to say instead — and why locals cringe at the textbook version.',
  },
  {
    id: 'cook_and_learn',
    name: 'Cook & Learn',
    description: 'Cook a traditional dish while teaching every ingredient and step in target language',
    applicableCategories: ['cooking'],
    twistFormula: 'Our avatar cooks [dish] step by step, teaching every ingredient, action, and kitchen phrase in [language]. By the end, you know [X] new words AND a recipe.',
  },
  {
    id: 'local_vs_tourist',
    name: 'Local vs Tourist',
    description: 'Show how a local handles a situation vs how a tourist would (language + behavior)',
    applicableCategories: ['restaurant_food', 'travel_city', 'shopping_market', 'nightlife'],
    twistFormula: 'A tourist would say [tourist_version]. A local says [local_version]. Here\'s how to sound like you belong in [city].',
  },
];

// ─── Content Classification Engine ──────────────────────────────────────────

/**
 * Auto-classify content from a creator page based on keywords and context.
 * In production, this would use GPT-4o for analysis.
 * This is the rule-based fallback.
 */
export function classifyContent(
  description: string,
  hashtags: string[],
  captions: string[]
): { category: ContentCategory; confidence: number; outputChannels: OutputChannel[] } {
  const text = [description, ...hashtags, ...captions].join(' ').toLowerCase();
  
  const rules: { category: ContentCategory; keywords: string[]; outputs: OutputChannel[] }[] = [
    {
      category: 'restaurant_food',
      keywords: ['restaurant', 'food', 'eat', 'menu', 'order', 'dish', 'plate', 'dining', 'brunch', 'dinner', 'lunch', 'cafe', 'bar'],
      outputs: ['video_youtube', 'video_shorts', 'scenario_mode', 'city_guide', 'lesson_material'],
    },
    {
      category: 'cooking',
      keywords: ['cook', 'recipe', 'kitchen', 'ingredient', 'homemade', 'bake', 'fry', 'boil', 'stew', 'prep'],
      outputs: ['video_youtube', 'video_app_tv', 'lesson_material', 'cultural_knowledge'],
    },
    {
      category: 'slang_teaching',
      keywords: ['slang', 'phrase', 'expression', 'how to say', 'word of the day', 'vocabulary', 'idiom', 'meaning'],
      outputs: ['slang_database', 'agent_knowledge', 'video_shorts', 'lesson_material'],
    },
    {
      category: 'travel_city',
      keywords: ['travel', 'city', 'visit', 'explore', 'trip', 'tour', 'guide', 'spots', 'places', 'neighborhood', 'street'],
      outputs: ['video_youtube', 'video_app_tv', 'scenario_mode', 'city_guide', 'cultural_knowledge'],
    },
    {
      category: 'culture_history',
      keywords: ['culture', 'history', 'tradition', 'holiday', 'festival', 'heritage', 'ancestor', 'origin', 'celebration'],
      outputs: ['cultural_knowledge', 'video_youtube', 'video_app_tv', 'agent_knowledge', 'lesson_material'],
    },
    {
      category: 'music_dance',
      keywords: ['music', 'song', 'dance', 'artist', 'concert', 'beat', 'rhythm', 'genre', 'dembow', 'reggaeton', 'kompa', 'salsa', 'bachata'],
      outputs: ['music_lesson', 'video_youtube', 'video_shorts', 'cultural_knowledge', 'agent_knowledge'],
    },
    {
      category: 'nightlife',
      keywords: ['club', 'nightlife', 'party', 'bar', 'drinks', 'dj', 'vibe', 'night out'],
      outputs: ['video_shorts', 'scenario_mode', 'city_guide', 'lesson_material'],
    },
    {
      category: 'shopping_market',
      keywords: ['market', 'shop', 'buy', 'price', 'haggle', 'vendor', 'store', 'mall', 'bargain'],
      outputs: ['video_youtube', 'scenario_mode', 'lesson_material', 'city_guide'],
    },
    {
      category: 'daily_life',
      keywords: ['day in the life', 'routine', 'morning', 'daily', 'lifestyle', 'apartment', 'commute'],
      outputs: ['video_youtube', 'video_app_tv', 'lesson_material', 'cultural_knowledge'],
    },
    {
      category: 'sports_fitness',
      keywords: ['gym', 'workout', 'sport', 'soccer', 'basketball', 'run', 'fitness', 'game', 'match'],
      outputs: ['video_shorts', 'lesson_material', 'scenario_mode'],
    },
    {
      category: 'humor_comedy',
      keywords: ['funny', 'comedy', 'joke', 'humor', 'meme', 'prank', 'skit', 'hilarious'],
      outputs: ['video_shorts', 'slang_database', 'agent_knowledge'],
    },
    {
      category: 'business_work',
      keywords: ['business', 'work', 'office', 'meeting', 'professional', 'career', 'job', 'interview', 'entrepreneur'],
      outputs: ['video_youtube', 'lesson_material', 'scenario_mode'],
    },
    {
      category: 'family_relationships',
      keywords: ['family', 'mom', 'dad', 'dating', 'relationship', 'wedding', 'kids', 'abuela', 'grandmother'],
      outputs: ['video_youtube', 'cultural_knowledge', 'lesson_material', 'agent_knowledge'],
    },
    {
      category: 'fashion_beauty',
      keywords: ['fashion', 'style', 'outfit', 'beauty', 'makeup', 'hair', 'clothes', 'designer'],
      outputs: ['video_shorts', 'lesson_material', 'cultural_knowledge'],
    },
    {
      category: 'education_school',
      keywords: ['school', 'university', 'study', 'class', 'teacher', 'student', 'learn', 'exam', 'degree'],
      outputs: ['lesson_material', 'video_youtube', 'scenario_mode'],
    },
  ];

  let bestMatch: { category: ContentCategory; score: number; outputs: OutputChannel[] } = {
    category: 'daily_life',
    score: 0,
    outputs: ['video_youtube', 'cultural_knowledge'],
  };

  for (const rule of rules) {
    const score = rule.keywords.filter(kw => text.includes(kw)).length;
    if (score > bestMatch.score) {
      bestMatch = { category: rule.category, score, outputs: rule.outputs };
    }
  }

  return {
    category: bestMatch.category,
    confidence: Math.min(bestMatch.score / 3, 1), // Normalize to 0-1
    outputChannels: bestMatch.outputs,
  };
}

// ─── Twist Generator ─────────────────────────────────────────────────────────

/**
 * Given a content category and source details, select appropriate twists
 * and generate content brief concepts.
 */
export function generateTwists(
  category: ContentCategory,
  sourceTopic: string,
  region: string,
  language: string,
): { twist: TwistTemplate; concept: string }[] {
  const applicableTwists = TWIST_TEMPLATES.filter(t => 
    t.applicableCategories.includes(category)
  );

  return applicableTwists.map(twist => {
    const concept = twist.twistFormula
      .replace('[place_type]', sourceTopic)
      .replace('[topic]', sourceTopic)
      .replace('[action]', 'navigate the situation')
      .replace('[language]', language)
      .replace('[country]', region)
      .replace('[city]', region)
      .replace('[country_1]', region)
      .replace('[country_2]', 'Mexico')
      .replace('[country_3]', 'Spain')
      .replace('[cultural_element]', sourceTopic)
      .replace('[situation]', sourceTopic)
      .replace('[dish]', sourceTopic)
      .replace('[genre]', 'popular')
      .replace('[artist]', 'a trending artist')
      .replace('[wrong_thing]', 'the textbook phrase')
      .replace('[formal_version]', 'the formal phrase')
      .replace('[real_version]', 'the street version')
      .replace('[tourist_version]', 'the tourist phrase')
      .replace('[local_version]', 'the local phrase')
      .replace(/\[X\]/g, '10-15');

    return { twist, concept };
  });
}

// ─── Avatar Assignment ───────────────────────────────────────────────────────

/**
 * Assign the best avatar for a content brief based on language and region.
 */
export function assignAvatar(language: string, region: string): string {
  const avatarMap: Record<string, string[]> = {
    'dominican_spanish': ['Carlos', 'Sofia'],
    'colombian_spanish': ['Valentina'],
    'venezuelan_spanish': ['Luis'],
    'panamanian_spanish': ['Paola'],
    'mexican_spanish': ['Sofia'],
    'spanish': ['Sofia', 'Carlos', 'Valentina'],
    'haitian_creole': ['Mireille', 'DeShawn'],
    'french': ['Pierre', 'Mireille'],
    'japanese': ['Yuki', 'Maya'],
    'korean': ['Jin', 'Maya'],
    'italian': ['Alessia'],
    'portuguese': ['Camila'],
    'english': ['Jaylen', 'Maya', 'DeShawn', 'Alex'],
    'german': ['Marcus'],
    'arabic': ['Jin'],
  };

  const key = `${region.toLowerCase()}_${language.toLowerCase()}`.replace(/\s+/g, '_');
  const candidates = avatarMap[key] || avatarMap[language.toLowerCase()] || ['Sofia'];
  
  // Random selection from candidates for variety
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ─── Brief Generator ─────────────────────────────────────────────────────────

/**
 * Generate a full content brief from a source and selected twist.
 */
export function generateContentBrief(
  source: ContentSource,
  twist: TwistTemplate,
  concept: string,
): ContentBrief {
  const avatar = assignAvatar(source.language, source.region);
  
  const brief: ContentBrief = {
    id: `brief_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sourceId: source.id,
    createdAt: new Date().toISOString(),
    title: `${twist.name}: ${source.topics[0] || source.region}`,
    hook: generateHook(source.category, source.topics[0], source.region),
    concept,
    twist: twist.description,
    script: {
      openingHook: '',   // Filled by AI generation
      introduction: '',
      segments: [],
      callToAction: 'Download ConnectWorld AI to practice these phrases with a real AI tutor!',
      closingLine: getAvatarSignoff(avatar),
      teachingMoments: [],
    },
    avatar,
    language: source.language,
    secondaryLanguage: 'English',
    region: source.region,
    platform: determinePlatform(source.category),
    videoLength: determineLength(source.category, twist.id),
    visualStyle: getVisualStyle(source.category),
    monetization: {
      platforms: ['youtube', 'instagram', 'tiktok', 'in_app'],
      revenueStreams: ['youtube_ads', 'app_subscription', 'affiliate_links'],
      sponsorOpportunity: getSponsorOpportunity(source.category),
      estimatedReach: 'medium',
    },
    vocabularyTargets: source.vocabulary.map(word => ({
      word,
      translation: '', // Filled by translation service
      category: source.category,
      difficulty: 'A2' as const,
    })),
    status: 'draft',
  };

  return brief;
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function generateHook(category: ContentCategory, topic: string, region: string): string {
  const hooks: Record<ContentCategory, string[]> = {
    restaurant_food: [
      `You walk into a restaurant in ${region}. Do you know what to say?`,
      `This is what locals ACTUALLY order in ${region}...`,
      `Stop embarrassing yourself at restaurants in ${region}. Here's how to order like a local.`,
    ],
    cooking: [
      `This dish is famous in ${region}. Can you name every ingredient in ${region}'s language?`,
      `Cook with me and learn 15 new words in 3 minutes.`,
      `Your abuela's recipe, but make it a language lesson.`,
    ],
    slang_teaching: [
      `Your textbook would NEVER teach you this...`,
      `If you say this in ${region}, people will know you're not from there.`,
      `3 words that mean completely different things in different countries.`,
    ],
    travel_city: [
      `First time in ${region}? Here's what nobody tells you.`,
      `I spent a day in ${region} speaking ONLY the local language. Here's what happened.`,
      `${region} locals share the spots tourists never find.`,
    ],
    culture_history: [
      `The real reason ${region} celebrates this...`,
      `This tradition is 500 years old and still alive in ${region}.`,
      `You've been saying this wrong. Here's the cultural context.`,
    ],
    music_dance: [
      `This song is #1 in ${region} right now. Here's what the lyrics ACTUALLY mean.`,
      `Learn ${region}'s language through its music. This hit teaches you 10 words.`,
      `The dance moves AND the vocabulary. Let's go.`,
    ],
    nightlife: [
      `Going out in ${region}? Here's everything you need to say.`,
      `The phrases you need to survive a night out in ${region}.`,
    ],
    shopping_market: [
      `How to haggle in ${region} without getting ripped off.`,
      `Market vocabulary that will save you money in ${region}.`,
    ],
    daily_life: [
      `A typical morning in ${region} — narrated in the local language.`,
      `This is how people ACTUALLY talk in ${region}. Not what your textbook says.`,
    ],
    sports_fitness: [
      `Sports vocabulary you need to know in ${region}.`,
      `Watching the game in ${region}? Here's what everyone's yelling.`,
    ],
    education_school: [
      `School in ${region} is NOTHING like what you'd expect.`,
      `How to talk about your studies in ${region}'s language.`,
    ],
    business_work: [
      `Business meeting in ${region}? Don't say THIS.`,
      `Professional phrases that will impress in ${region}.`,
    ],
    family_relationships: [
      `Family vocabulary in ${region} goes WAY deeper than "mom" and "dad."`,
      `How to talk about relationships in ${region} (the REAL way, not textbook).`,
    ],
    humor_comedy: [
      `This joke only works in ${region}'s language. Here's why.`,
      `The funniest expressions in ${region} that don't translate.`,
    ],
    fashion_beauty: [
      `Fashion vocabulary in ${region} — from the streets, not the classroom.`,
      `How to compliment someone's style in ${region} (without being weird).`,
    ],
  };

  const options = hooks[category] || [`Learn something new about ${region} today.`];
  return options[Math.floor(Math.random() * options.length)];
}

function getAvatarSignoff(avatar: string): string {
  const signoffs: Record<string, string> = {
    'Sofia': '¡Nos vemos! Keep practicing, you\'re doing amazing.',
    'Carlos': 'Klok! Eso e\' to\'. See you next time, familia.',
    'Valentina': '¡Parcero, lo hiciste genial! Nos vemos pronto.',
    'Luis': '¡Chamo, estuviste arrecho! Until next time.',
    'Paola': 'Xopa! That was fire. Come back for more.',
    'Mireille': 'Kenbe la! Keep going, you\'re getting stronger every day.',
    'Pierre': 'À bientôt! Your French is getting better every day.',
    'Yuki': 'また会おうね！You\'re making great progress!',
    'Jin': '다음에 또 만나요! See you next time!',
    'Alessia': 'Ci vediamo! You\'re sounding more Italian every day.',
    'Camila': 'Tchau! Você está arrasando! See you soon.',
    'Marcus': 'Great work on your pronunciation today. Keep at it!',
    'Jaylen': 'Aight, that\'s a wrap! You killed it today.',
    'Maya': 'That was so fun! See you next time!',
    'DeShawn': 'Bet! You\'re leveling up for real. Peace!',
    'Alex': 'Thanks for learning with ConnectWorld AI. See you tomorrow!',
  };
  return signoffs[avatar] || 'See you next time! Keep practicing.';
}

function determinePlatform(category: ContentCategory): Platform {
  const shortFormCategories: ContentCategory[] = ['slang_teaching', 'humor_comedy', 'nightlife', 'fashion_beauty'];
  if (shortFormCategories.includes(category)) return 'all'; // Works on all platforms
  return 'all';
}

function determineLength(category: ContentCategory, twistId: string): VideoLength {
  if (['survival_phrases', 'mistake_correction'].includes(twistId)) return 'short';
  if (['day_in_life', 'cook_and_learn', 'compare_countries'].includes(twistId)) return 'long';
  return 'medium';
}

function getVisualStyle(category: ContentCategory): string {
  const styles: Record<ContentCategory, string> = {
    restaurant_food: 'Warm lighting, close-up food shots, split-screen with vocabulary overlay',
    cooking: 'Overhead kitchen cam, ingredient labels in target language, step-by-step captions',
    slang_teaching: 'Bold text overlays, street/urban background, quick cuts',
    travel_city: 'Cinematic city shots, walking POV, location labels in dual language',
    culture_history: 'Documentary style, historical images/footage, timeline graphics',
    music_dance: 'Music video aesthetic, lyrics on screen, rhythm-synced cuts',
    nightlife: 'Neon/dark aesthetic, energetic cuts, phrase pop-ups',
    shopping_market: 'Handheld camera feel, price tags in target language, haggling subtitles',
    daily_life: 'Vlog style, natural lighting, narration subtitles',
    sports_fitness: 'Dynamic angles, scoreboard vocabulary, action replays with vocab',
    education_school: 'Clean whiteboard aesthetic, organized layouts, quiz format',
    business_work: 'Professional setting, formal tone, email/document overlays',
    family_relationships: 'Warm/cozy setting, conversation format, emotional moments',
    humor_comedy: 'Quick cuts, meme-style text, exaggerated reactions',
    fashion_beauty: 'Clean aesthetic, outfit labels, style vocabulary overlays',
  };
  return styles[category] || 'Clean, modern, dual-language subtitles';
}

function getSponsorOpportunity(category: ContentCategory): string {
  const sponsors: Record<ContentCategory, string> = {
    restaurant_food: 'Food delivery apps, restaurant booking platforms, cooking brands',
    cooking: 'Kitchen appliance brands, grocery delivery, spice companies',
    travel_city: 'Airlines, hotel chains, travel insurance, SIM card companies',
    music_dance: 'Streaming platforms, headphone brands, music apps',
    nightlife: 'Alcohol brands (21+ only), rideshare apps, event platforms',
    shopping_market: 'Payment apps, shipping services, marketplace platforms',
    slang_teaching: 'Language learning competitors (unlikely), book publishers',
    culture_history: 'Tourism boards, cultural organizations, museums',
    daily_life: 'Lifestyle brands, VPN services, phone carriers',
    sports_fitness: 'Athletic brands, fitness apps, sports streaming',
    education_school: 'EdTech companies, tutoring platforms, book publishers',
    business_work: 'LinkedIn, professional tools, coworking spaces',
    family_relationships: 'Family apps, dating platforms, gift services',
    humor_comedy: 'Entertainment brands, social media platforms',
    fashion_beauty: 'Fashion brands, beauty products, style apps',
  };
  return sponsors[category] || 'General lifestyle brands';
}

// ─── Pipeline Orchestrator ───────────────────────────────────────────────────

/**
 * Main pipeline function: takes a creator URL/content, classifies it,
 * generates multiple content briefs with different twists.
 * 
 * Returns an array of ready-to-produce content briefs.
 */
export function runContentPipeline(
  url: string,
  creatorHandle: string,
  description: string,
  hashtags: string[],
  captions: string[],
  language: string,
  region: string,
  topics: string[],
  vocabulary: string[],
): ContentBrief[] {
  // 1. Classify content
  const classification = classifyContent(description, hashtags, captions);
  
  // 2. Create source record
  const source: ContentSource = {
    id: `src_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    url,
    platform: url.includes('instagram') ? 'instagram' : url.includes('tiktok') ? 'tiktok' : url.includes('youtube') ? 'youtube' : 'other',
    creatorHandle,
    creatorName: creatorHandle,
    dateIngested: new Date().toISOString(),
    category: classification.category,
    language,
    region,
    topics,
    vocabulary,
    culturalElements: [],
    outputChannels: classification.outputChannels,
    priority: classification.confidence > 0.7 ? 'high' : classification.confidence > 0.4 ? 'medium' : 'low',
    processed: true,
  };

  // 3. Generate twists
  const twists = generateTwists(classification.category, topics[0] || region, region, language);

  // 4. Generate content briefs (one per twist, max 5)
  const briefs = twists.slice(0, 5).map(({ twist, concept }) => 
    generateContentBrief(source, twist, concept)
  );

  return briefs;
}

// ─── Export Types for External Use ───────────────────────────────────────────

export type {
  ContentSource as Source,
  ContentBrief as Brief,
  VideoScript as Script,
  TwistTemplate as Twist,
};
