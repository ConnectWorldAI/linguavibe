/**
 * Apify → Airtable → Manus Creator Intelligence Pipeline
 *
 * Architecture:
 * 1. Apify scrapes creator profiles, content, and audience data from TikTok/Instagram/YouTube
 * 2. Data flows into Airtable (structured database with multiple linked tables)
 * 3. Manus processes the data: scores creators, extracts teaching patterns, generates pitches
 * 4. Results feed into ConnectWorld AI: avatar content replication + social page strategy
 *
 * This pipeline powers:
 * - Creator discovery and scoring
 * - Teaching pattern extraction for AI avatar replication
 * - Audience overlap analysis (avoid paying two affiliates for same audience)
 * - Competitor affiliate tracking (who promotes Duolingo, Airlearn, Babbel)
 * - Content calendar seeding from trending formats
 * - ConnectWorld AI social media page content strategy
 */

// ─── APIFY ACTORS ──────────────────────────────────────────────────────────────

export interface ApifyActorConfig {
  actorId: string;
  name: string;
  platform: "tiktok" | "instagram" | "youtube";
  dataPoints: string[];
  costPerRun: number; // USD
  runFrequency: "daily" | "weekly" | "monthly";
}

export const APIFY_ACTORS: ApifyActorConfig[] = [
  {
    actorId: "clockworks/tiktok-scraper",
    name: "TikTok Profile Scraper",
    platform: "tiktok",
    dataPoints: ["followers", "likes", "videos", "captions", "hashtags", "sounds", "engagement_rate"],
    costPerRun: 0.50,
    runFrequency: "weekly",
  },
  {
    actorId: "apify/instagram-profile-scraper",
    name: "Instagram Profile Scraper",
    platform: "instagram",
    dataPoints: ["followers", "posts", "reels", "stories_highlights", "bio", "links", "engagement_rate"],
    costPerRun: 0.30,
    runFrequency: "weekly",
  },
  {
    actorId: "bernardo/youtube-scraper",
    name: "YouTube Channel Scraper",
    platform: "youtube",
    dataPoints: ["subscribers", "videos", "views", "descriptions", "tags", "upload_frequency"],
    costPerRun: 0.25,
    runFrequency: "weekly",
  },
  {
    actorId: "clockworks/tiktok-comments-scraper",
    name: "TikTok Comments Scraper",
    platform: "tiktok",
    dataPoints: ["comments", "sentiment", "questions_asked", "language_detected"],
    costPerRun: 0.75,
    runFrequency: "monthly",
  },
  {
    actorId: "apify/instagram-comment-scraper",
    name: "Instagram Comments Scraper",
    platform: "instagram",
    dataPoints: ["comments", "sentiment", "follower_questions", "pain_points"],
    costPerRun: 0.60,
    runFrequency: "monthly",
  },
];

// ─── AIRTABLE SCHEMA ───────────────────────────────────────────────────────────

export interface AirtableSchema {
  bases: AirtableBase[];
}

export interface AirtableBase {
  name: string;
  tables: AirtableTable[];
}

export interface AirtableTable {
  name: string;
  fields: AirtableField[];
  description: string;
}

export interface AirtableField {
  name: string;
  type: "text" | "number" | "url" | "select" | "multiselect" | "date" | "checkbox" | "formula" | "link" | "attachment";
  options?: string[];
  linkedTable?: string;
  formula?: string;
}

export const AIRTABLE_SCHEMA: AirtableSchema = {
  bases: [
    {
      name: "ConnectWorld AI Creator Intelligence",
      tables: [
        {
          name: "Creators",
          description: "All tracked language teaching creators across platforms",
          fields: [
            { name: "Name", type: "text" },
            { name: "Handle", type: "text" },
            { name: "Platform", type: "select", options: ["TikTok", "Instagram", "YouTube", "Multi-platform"] },
            { name: "Followers", type: "number" },
            { name: "Engagement Rate", type: "number" },
            { name: "Teaching Direction", type: "select", options: ["EN→ES", "ES→EN", "EN→FR", "FR→EN", "Bilingual", "Multi"] },
            { name: "Region", type: "text" },
            { name: "Content Style", type: "multiselect", options: ["Whiteboard", "Text Overlay", "Direct Camera", "Skit", "Pronunciation Drill", "Comparison", "Visual Props", "Live Sessions"] },
            { name: "Niche", type: "multiselect", options: ["Slang", "Grammar", "Pronunciation", "Culture", "Business", "Travel", "Humor", "Music", "Food"] },
            { name: "Partnership Status", type: "select", options: ["Prospect", "Contacted", "Negotiating", "Signed", "Active", "Paused", "Declined"] },
            { name: "Commission Tier", type: "select", options: ["Standard (20%)", "Premium (25%)", "Elite (30%)", "Custom"] },
            { name: "Competitor Affiliates", type: "multiselect", options: ["Duolingo", "Babbel", "Airlearn", "Rosetta Stone", "Preply", "iTalki", "None"] },
            { name: "Avatar Created", type: "checkbox" },
            { name: "Content Ingested", type: "link", linkedTable: "Content" },
            { name: "Partnership Score", type: "formula", formula: "({Followers} * {Engagement Rate} * IF({Competitor Affiliates} = 'None', 1.5, 1)) / 10000" },
            { name: "Last Scraped", type: "date" },
            { name: "Profile URL", type: "url" },
            { name: "Contact Email", type: "text" },
            { name: "Notes", type: "text" },
          ],
        },
        {
          name: "Content",
          description: "Individual posts/videos scraped from creators for pattern analysis",
          fields: [
            { name: "Creator", type: "link", linkedTable: "Creators" },
            { name: "Platform", type: "select", options: ["TikTok", "Instagram", "YouTube"] },
            { name: "Post URL", type: "url" },
            { name: "Caption", type: "text" },
            { name: "Views", type: "number" },
            { name: "Likes", type: "number" },
            { name: "Comments", type: "number" },
            { name: "Shares", type: "number" },
            { name: "Engagement Rate", type: "number" },
            { name: "Teaching Topic", type: "text" },
            { name: "Format Type", type: "select", options: ["Whiteboard", "Text Overlay", "Direct Camera", "Skit", "Pronunciation", "Comparison", "Props", "Other"] },
            { name: "Extracted Phrases", type: "text" },
            { name: "Phonetic Approach", type: "text" },
            { name: "Avatar Replication Score", type: "number" },
            { name: "Classification", type: "select", options: ["Educational", "Viral", "Mixed"] },
            { name: "Posted Date", type: "date" },
            { name: "Duration (sec)", type: "number" },
            { name: "Thumbnail", type: "attachment" },
          ],
        },
        {
          name: "Audience Insights",
          description: "Audience demographics and overlap analysis per creator",
          fields: [
            { name: "Creator", type: "link", linkedTable: "Creators" },
            { name: "Primary Age Range", type: "select", options: ["13-17", "18-24", "25-34", "35-44", "45+"] },
            { name: "Primary Gender", type: "select", options: ["Male", "Female", "Mixed"] },
            { name: "Top Countries", type: "text" },
            { name: "Primary Language", type: "select", options: ["Spanish", "English", "Portuguese", "French", "Other"] },
            { name: "Audience Overlap With", type: "link", linkedTable: "Creators" },
            { name: "Overlap Percentage", type: "number" },
            { name: "Estimated Conversion Rate", type: "number" },
            { name: "Estimated Revenue Per Month", type: "formula", formula: "{Estimated Conversion Rate} * LOOKUP({Followers}, {Creator}) * 2.99 * 0.25" },
            { name: "Active Hours", type: "text" },
            { name: "Top Hashtags Followed", type: "text" },
            { name: "Last Updated", type: "date" },
          ],
        },
        {
          name: "Outreach",
          description: "Partnership outreach tracking and deal management",
          fields: [
            { name: "Creator", type: "link", linkedTable: "Creators" },
            { name: "Status", type: "select", options: ["Draft", "Sent", "Opened", "Replied", "Meeting Scheduled", "Negotiating", "Signed", "Declined"] },
            { name: "Pitch Type", type: "select", options: ["Affiliate", "Avatar Partner", "Content Collab", "Brand Ambassador"] },
            { name: "Offered Commission", type: "text" },
            { name: "Offered Perks", type: "text" },
            { name: "First Contact Date", type: "date" },
            { name: "Last Follow Up", type: "date" },
            { name: "Response", type: "text" },
            { name: "Deal Value (Monthly Est.)", type: "number" },
            { name: "Contract Link", type: "url" },
            { name: "Pitch Deck", type: "attachment" },
          ],
        },
        {
          name: "Teaching Patterns",
          description: "Extracted teaching formats for AI avatar replication",
          fields: [
            { name: "Creator", type: "link", linkedTable: "Creators" },
            { name: "Pattern Name", type: "text" },
            { name: "Format", type: "select", options: ["Whiteboard", "Text Overlay", "Direct Camera", "Visual Props", "Pronunciation Drill", "Comparison", "Skit"] },
            { name: "Visual Elements", type: "multiselect", options: ["Color-coded text", "Phonetic spelling", "Flags", "Mouth close-up", "Props", "Animations", "Split screen", "Subtitles"] },
            { name: "Phonetic System", type: "text" },
            { name: "Repetition Style", type: "select", options: ["Pause-and-repeat", "Call-and-response", "Listen-only", "None"] },
            { name: "Engagement Hooks", type: "text" },
            { name: "Avg Duration (sec)", type: "number" },
            { name: "Avg Engagement Rate", type: "number" },
            { name: "Replication Score", type: "number" },
            { name: "Avatar Implementation Notes", type: "text" },
            { name: "Sample Videos", type: "link", linkedTable: "Content" },
            { name: "Implemented in App", type: "checkbox" },
          ],
        },
        {
          name: "ConnectWorld AI Social Strategy",
          description: "Content calendar and strategy for ConnectWorld AI's own social pages",
          fields: [
            { name: "Content Idea", type: "text" },
            { name: "Inspired By", type: "link", linkedTable: "Content" },
            { name: "Platform", type: "select", options: ["TikTok", "Instagram Reels", "YouTube Shorts", "All"] },
            { name: "Format", type: "select", options: ["AI Avatar Teaching", "User Testimonial", "Before/After", "Challenge", "Duet/Stitch", "Behind the Scenes"] },
            { name: "Target Audience", type: "select", options: ["Spanish speakers learning English", "English speakers learning Spanish", "Bilingual", "All learners"] },
            { name: "Scheduled Date", type: "date" },
            { name: "Status", type: "select", options: ["Idea", "Scripted", "Produced", "Scheduled", "Posted", "Analyzing"] },
            { name: "Hook Text", type: "text" },
            { name: "CTA", type: "text" },
            { name: "Hashtags", type: "text" },
            { name: "Expected Reach", type: "number" },
            { name: "Actual Performance", type: "text" },
          ],
        },
      ],
    },
  ],
};

// ─── PIPELINE ORCHESTRATION ────────────────────────────────────────────────────

export interface PipelineRun {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: "running" | "completed" | "failed";
  creatorsScraped: number;
  contentExtracted: number;
  patternsIdentified: number;
  socialIdeasGenerated: number;
  errors: string[];
}

export interface CreatorScore {
  creatorHandle: string;
  partnershipScore: number; // 0-100
  audienceReach: number;
  engagementQuality: number; // Higher = more comments/saves vs just likes
  contentReplicability: number; // How easily our AI can replicate their style
  competitorRisk: number; // Are they already promoting a competitor?
  regionValue: number; // How valuable is their audience's region?
  recommendation: "high-priority" | "medium-priority" | "low-priority" | "skip";
  pitchAngle: string; // Suggested pitch approach
}

/**
 * Score a creator for partnership potential
 */
export function scoreCreator(data: {
  followers: number;
  engagementRate: number;
  contentReplicability: number; // 1-10
  hasCompetitorDeal: boolean;
  region: string;
  teachingDirection: string;
}): CreatorScore {
  const audienceReach = Math.min(data.followers / 100000, 30); // Max 30 points for 3M+ followers
  const engagementQuality = Math.min(data.engagementRate * 10, 25); // Max 25 points for 2.5%+ engagement
  const contentReplicability = data.contentReplicability * 2; // Max 20 points
  const competitorRisk = data.hasCompetitorDeal ? -10 : 10; // Penalty if already with competitor
  const regionValue = getRegionValue(data.region); // Max 15 points

  const total = Math.max(0, Math.min(100, audienceReach + engagementQuality + contentReplicability + competitorRisk + regionValue));

  let recommendation: CreatorScore["recommendation"];
  if (total >= 70) recommendation = "high-priority";
  else if (total >= 50) recommendation = "medium-priority";
  else if (total >= 30) recommendation = "low-priority";
  else recommendation = "skip";

  const pitchAngle = generatePitchAngle(data);

  return {
    creatorHandle: "",
    partnershipScore: total,
    audienceReach,
    engagementQuality,
    contentReplicability: data.contentReplicability * 2,
    competitorRisk: data.hasCompetitorDeal ? -10 : 10,
    regionValue,
    recommendation,
    pitchAngle,
  };
}

function getRegionValue(region: string): number {
  const highValue = ["United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "Japan"];
  const medValue = ["Mexico", "Spain", "Brazil", "Colombia", "Argentina", "South Korea", "Italy"];
  const growthValue = ["Dominican Republic", "Puerto Rico", "El Paso, TX", "Miami", "Los Angeles"];

  if (highValue.some((r) => region.includes(r))) return 12;
  if (growthValue.some((r) => region.includes(r))) return 15; // Growth markets get HIGHEST value
  if (medValue.some((r) => region.includes(r))) return 10;
  return 7;
}

function generatePitchAngle(data: {
  followers: number;
  engagementRate: number;
  hasCompetitorDeal: boolean;
  region: string;
  teachingDirection: string;
}): string {
  if (data.hasCompetitorDeal) {
    return "Steal from competitor: Offer better commission + AI avatar feature they can't get elsewhere. Emphasize passive income vs active teaching.";
  }
  if (data.followers > 1000000) {
    return "Big fish: Lead with revenue projections. Show them how 0.1% conversion at $2.99 = $X,XXX/month passive income. Emphasize their avatar teaches 24/7.";
  }
  if (data.region.includes("Dominican") || data.region.includes("Caribbean")) {
    return "Local hero: Emphasize affordable pricing for their audience ($2.99 vs $5.09 TikTok subs). Show them how to actually monetize their followers.";
  }
  if (data.engagementRate > 3) {
    return "Engagement king: Their audience LOVES them. Show how AI avatar extends their reach without more work. Commission on every subscriber, forever.";
  }
  return "Standard pitch: Passive income through affiliate commission. Their teaching style replicated by AI avatar. Better than any other language app partnership.";
}

// ─── CONNECTME AI SOCIAL PAGE STRATEGY ─────────────────────────────────────────

export interface SocialContentIdea {
  title: string;
  platform: "tiktok" | "instagram" | "youtube_shorts" | "all";
  format: "ai-avatar-teaching" | "user-testimonial" | "before-after" | "challenge" | "duet-stitch" | "behind-scenes" | "comparison";
  inspiredBy: string; // Creator handle whose format we're adapting
  hook: string; // First 3 seconds text/concept
  script: string; // Full script outline
  cta: string; // Call to action
  hashtags: string[];
  targetAudience: string;
  estimatedReach: string;
}

/**
 * Generate social content ideas based on scraped creator patterns
 */
export function generateSocialContentIdeas(patterns: {
  topFormats: string[];
  trendingTopics: string[];
  audiencePainPoints: string[];
  competitorGaps: string[];
}): SocialContentIdea[] {
  const ideas: SocialContentIdea[] = [];

  // Omar-style: Phonetic pronunciation clips
  if (patterns.topFormats.includes("pronunciation-drill") || patterns.topFormats.includes("text-overlay")) {
    ideas.push({
      title: "AI Avatar Pronunciation Challenge",
      platform: "all",
      format: "ai-avatar-teaching",
      inspiredBy: "@inglesconomar",
      hook: "Can you say this? 🤔 Most Spanish speakers get it wrong...",
      script: "AI avatar shows English word → phonetic spelling in Spanish → correct pronunciation → viewer repeats → 'Download ConnectWorld AI to practice with me!'",
      cta: "Link in bio - practice pronunciation with AI 24/7",
      hashtags: ["#ingles", "#pronunciacion", "#aprendeingles", "#connectworldai", "#englishpractice"],
      targetAudience: "Spanish speakers learning English (18-35, Caribbean/LatAm)",
      estimatedReach: "50K-200K views",
    });
  }

  // Lola-style: Situational phrases with humor
  if (patterns.topFormats.includes("skit") || patterns.trendingTopics.includes("situational")) {
    ideas.push({
      title: "Say THIS in Spanish when...",
      platform: "all",
      format: "ai-avatar-teaching",
      inspiredBy: "@espanol.w.lola",
      hook: "Say THIS in Spanish when your friend is being dramatic 💅",
      script: "Relatable scenario → Spanish phrase → pronunciation → usage context → 'Learn 100+ phrases like this on ConnectWorld AI'",
      cta: "Free app in bio - learn real Spanish, not textbook Spanish",
      hashtags: ["#spanish", "#learnspanish", "#spanishphrases", "#connectworldai", "#spanishforbeginners"],
      targetAudience: "English speakers learning Spanish (18-30, US)",
      estimatedReach: "30K-150K views",
    });
  }

  // Comparison/confusion format (Spider-Man meme style)
  if (patterns.topFormats.includes("comparison") || patterns.audiencePainPoints.includes("confusing words")) {
    ideas.push({
      title: "Words that sound the SAME but aren't",
      platform: "all",
      format: "comparison",
      inspiredBy: "@inglesconomar",
      hook: "These 3 words sound IDENTICAL to Spanish speakers... but they're completely different 🤯",
      script: "Show confusing word set (e.g., beach/bitch, sheet/shit) → AI avatar demonstrates correct pronunciation → Mouth position guide → 'Practice safely with AI - no embarrassment!'",
      cta: "Practice pronunciation privately with AI - link in bio",
      hashtags: ["#englishpronunciation", "#confusingwords", "#ingles", "#connectworldai", "#speakenglish"],
      targetAudience: "Spanish speakers afraid of mispronouncing (all ages)",
      estimatedReach: "100K-500K views (controversial/relatable topic)",
    });
  }

  // Behind-the-scenes: How our AI works
  ideas.push({
    title: "How our AI learns from real teachers",
    platform: "all",
    format: "behind-scenes",
    inspiredBy: "internal",
    hook: "We study the BEST language teachers on TikTok... then our AI learns their style 🤖",
    script: "Show real creator clips → Show AI avatar replicating the format → 'Same teaching style, available 24/7, in YOUR pocket' → Demo the app",
    cta: "Try it free - link in bio",
    hashtags: ["#ai", "#languagelearning", "#edtech", "#connectworldai", "#futureoflearning"],
    targetAudience: "Tech-curious language learners (18-35, global)",
    estimatedReach: "20K-100K views",
  });

  // User testimonial format
  if (patterns.competitorGaps.includes("affordable pricing")) {
    ideas.push({
      title: "I was paying $14/month for Duolingo... then I found this",
      platform: "all",
      format: "user-testimonial",
      inspiredBy: "user-generated",
      hook: "I canceled Duolingo after 3 years. Here's why... 👀",
      script: "User shows Duolingo subscription → Shows ConnectWorld AI → 'Same features + AI conversations + real slang for $2.99' → Before/after speaking clips",
      cta: "Switch today - save $11/month and learn faster",
      hashtags: ["#duolingo", "#languageapp", "#spanishlearning", "#connectworldai", "#affordable"],
      targetAudience: "Current Duolingo/Babbel users frustrated with progress (25-40)",
      estimatedReach: "50K-300K views (competitor comparison always performs)",
    });
  }

  return ideas;
}

// ─── PIPELINE SCHEDULING ───────────────────────────────────────────────────────

export interface PipelineSchedule {
  task: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly";
  description: string;
  estimatedCost: number; // USD per run
  actors: string[];
}

export const PIPELINE_SCHEDULE: PipelineSchedule[] = [
  {
    task: "scrape_tracked_creators",
    frequency: "weekly",
    description: "Pull latest posts, follower counts, and engagement from all tracked creators",
    estimatedCost: 5.00,
    actors: ["clockworks/tiktok-scraper", "apify/instagram-profile-scraper"],
  },
  {
    task: "extract_teaching_patterns",
    frequency: "weekly",
    description: "Analyze new content for teaching formats, phonetic approaches, and replicable patterns",
    estimatedCost: 2.00, // LLM costs
    actors: [],
  },
  {
    task: "audience_analysis",
    frequency: "monthly",
    description: "Deep audience demographics, overlap analysis, and conversion potential scoring",
    estimatedCost: 8.00,
    actors: ["clockworks/tiktok-comments-scraper", "apify/instagram-comment-scraper"],
  },
  {
    task: "competitor_monitoring",
    frequency: "biweekly",
    description: "Check which creators are promoting competitor apps (Duolingo, Airlearn, etc.)",
    estimatedCost: 3.00,
    actors: ["apify/instagram-profile-scraper"],
  },
  {
    task: "social_content_generation",
    frequency: "daily",
    description: "Generate content ideas for ConnectWorld AI's own social pages based on trending patterns",
    estimatedCost: 1.00, // LLM costs
    actors: [],
  },
  {
    task: "discover_new_creators",
    frequency: "weekly",
    description: "Find new language teaching creators via hashtag/keyword search",
    estimatedCost: 4.00,
    actors: ["clockworks/tiktok-scraper", "apify/instagram-profile-scraper"],
  },
];

/**
 * Calculate monthly pipeline costs
 */
export function calculateMonthlyCost(): { total: number; breakdown: { task: string; monthlyCost: number }[] } {
  const frequencyMultiplier: Record<string, number> = {
    daily: 30,
    weekly: 4,
    biweekly: 2,
    monthly: 1,
  };

  const breakdown = PIPELINE_SCHEDULE.map((s) => ({
    task: s.task,
    monthlyCost: s.estimatedCost * (frequencyMultiplier[s.frequency] || 1),
  }));

  return {
    total: breakdown.reduce((sum, b) => sum + b.monthlyCost, 0),
    breakdown,
  };
}

// Monthly cost estimate: ~$150-200/month for full pipeline
// ROI: If pipeline helps sign 1 creator with 500K followers → potential $1,500+/month revenue
