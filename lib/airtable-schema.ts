/**
 * ConnectWorld AI — Airtable Creator Intelligence Schema
 * 
 * This defines the complete 6-table Airtable base structure for tracking
 * creators, content, audience data, outreach, teaching patterns, and social strategy.
 * 
 * Setup: Create a new Airtable base called "ConnectWorld AI Creator Intelligence"
 * and use this schema to create all tables and fields.
 * 
 * Integration: Use Airtable API (https://airtable.com/developers/web/api/introduction)
 * with the base ID and API key to read/write data programmatically.
 */

// ============================================================
// TABLE 1: CREATORS
// Tracks all potential and active creator partners
// ============================================================

export interface CreatorsTable {
  // Primary fields
  name: string;                    // "Omar" 
  handle: string;                  // "@inglesconomar"
  platform: 'tiktok' | 'instagram' | 'youtube' | 'multi-platform';
  profileUrl: string;              // Full URL to their profile
  
  // Audience metrics
  followers: number;               // Total followers (primary platform)
  followersSecondary: number;      // Followers on secondary platform
  totalLikes: number;              // Lifetime likes/hearts
  avgEngagementRate: number;       // Percentage (e.g., 4.5 = 4.5%)
  avgViewsPerPost: number;         // Average views on recent posts
  
  // Classification
  niche: 'language_teacher' | 'bilingual_lifestyle' | 'travel' | 'culture' | 'entertainment';
  direction: string;               // "ES→EN", "EN→ES", "EN→FR", "bilingual"
  targetLanguages: string[];       // ["spanish", "english"]
  region: string;                  // "Dominican Republic", "El Paso TX", "Los Angeles"
  audienceCountries: string[];     // ["DR", "PR", "US", "CO"]
  
  // Business intel
  currentMonetization: string;     // "TikTok subs ($5.09/mo, 8 subs), website course"
  estimatedMonthlyRevenue: number; // Current estimated monthly revenue
  competitorAffiliates: string[];  // ["Airlearn", "Duolingo"] — who they already promote
  hasOwnCourse: boolean;           // Do they sell their own course?
  courseUrl: string;                // URL to their course/website
  
  // Partnership scoring
  partnershipScore: number;        // 0-100 (calculated by scoring algorithm)
  pitchAngle: string;              // "struggling_monetizer", "steal_from_competitor", "big_fish"
  estimatedRevenuePotential: number; // Projected monthly revenue if they partner with us
  
  // Status tracking
  status: 'prospect' | 'researched' | 'contacted' | 'negotiating' | 'signed' | 'active' | 'churned';
  priority: 'high' | 'medium' | 'low';
  assignedTo: string;              // Who's handling outreach
  notes: string;                   // Free-form notes
  
  // Dates
  discoveredDate: string;          // When we first found them
  contactedDate: string;           // When we first reached out
  signedDate: string;              // When they signed partnership
  lastActivityDate: string;        // Last time we interacted
}

// Field configuration for Airtable
export const CREATORS_TABLE_FIELDS = [
  { name: 'Name', type: 'singleLineText' },
  { name: 'Handle', type: 'singleLineText' },
  { name: 'Platform', type: 'singleSelect', options: ['TikTok', 'Instagram', 'YouTube', 'Multi-Platform'] },
  { name: 'Profile URL', type: 'url' },
  { name: 'Followers (Primary)', type: 'number', format: 'integer' },
  { name: 'Followers (Secondary)', type: 'number', format: 'integer' },
  { name: 'Total Likes', type: 'number', format: 'integer' },
  { name: 'Avg Engagement Rate (%)', type: 'percent' },
  { name: 'Avg Views/Post', type: 'number', format: 'integer' },
  { name: 'Niche', type: 'singleSelect', options: ['Language Teacher', 'Bilingual Lifestyle', 'Travel', 'Culture', 'Entertainment'] },
  { name: 'Direction', type: 'singleLineText' },
  { name: 'Language', type: 'singleSelect', options: ['Spanish', 'English', 'French', 'Portuguese', 'Japanese', 'Korean', 'Mandarin', 'German', 'Italian', 'Arabic'] },
  { name: 'Target Languages', type: 'multipleSelects', options: ['Spanish', 'English', 'French', 'Portuguese', 'Japanese', 'Korean', 'Mandarin', 'German', 'Italian', 'Arabic'] },
  { name: 'Region', type: 'singleLineText' },
  { name: 'Audience Countries', type: 'multipleSelects', options: ['US', 'DR', 'MX', 'CO', 'PR', 'VE', 'AR', 'CL', 'PE', 'ES', 'BR', 'FR', 'JP', 'KR', 'Other'] },
  { name: 'Current Monetization', type: 'longText' },
  { name: 'Est. Monthly Revenue', type: 'currency', symbol: '$' },
  { name: 'Competitor Affiliates', type: 'multipleSelects', options: ['Duolingo', 'Babbel', 'Rosetta Stone', 'Airlearn', 'Busuu', 'Preply', 'iTalki', 'None'] },
  { name: 'Has Own Course', type: 'checkbox' },
  { name: 'Course URL', type: 'url' },
  { name: 'Partnership Score', type: 'number', format: 'integer' },
  { name: 'Pitch Angle', type: 'singleSelect', options: ['Struggling Monetizer', 'Steal from Competitor', 'Big Fish', 'Local Hero', 'Engagement King', 'Rising Star'] },
  { name: 'Est. Revenue Potential', type: 'currency', symbol: '$' },
  { name: 'Status', type: 'singleSelect', options: ['Prospect', 'Researched', 'Contacted', 'Negotiating', 'Signed', 'Active', 'Churned'] },
  { name: 'Priority', type: 'singleSelect', options: ['High', 'Medium', 'Low'] },
  { name: 'Assigned To', type: 'singleLineText' },
  { name: 'Notes', type: 'longText' },
  { name: 'Discovered Date', type: 'date' },
  { name: 'Contacted Date', type: 'date' },
  { name: 'Signed Date', type: 'date' },
  { name: 'Last Activity', type: 'date' },
  // Linked fields
  { name: 'Content (linked)', type: 'linkedRecord', table: 'Content' },
  { name: 'Outreach (linked)', type: 'linkedRecord', table: 'Outreach' },
  { name: 'Teaching Patterns (linked)', type: 'linkedRecord', table: 'Teaching Patterns' },
];

// ============================================================
// TABLE 2: CONTENT
// Tracks individual posts/videos scraped from creators
// ============================================================

export interface ContentTable {
  title: string;                   // Post caption or title
  creator: string;                 // Linked to Creators table
  platform: string;                // TikTok, Instagram, YouTube
  postUrl: string;                 // Direct URL to the post
  postDate: string;                // When it was posted
  
  // Performance metrics
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;          // (likes+comments+shares) / views * 100
  
  // Content classification
  formatType: 'tutorial' | 'challenge' | 'meme' | 'comparison' | 'quiz' | 'pronunciation' | 'conversation' | 'vocabulary' | 'grammar' | 'live_clip';
  topic: string;                   // "pronunciation_linking", "vocabulary_kitchen", "grammar_that"
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'all';
  
  // Extracted teaching content
  extractedPhrases: string[];      // ["If you want", "Am I doing it right?"]
  extractedVocabulary: string[];   // ["fork", "spoon", "knife", "silverware"]
  phoneticGuides: string[];        // ["(izerokei)", "(ji tot mi)"]
  grammarPoints: string[];         // ["conditional if", "subject pronoun it"]
  
  // Visual/format analysis
  hasTextOverlay: boolean;
  hasPhoneticSpelling: boolean;
  hasBilingualCaption: boolean;
  usesProps: boolean;              // Physical objects, whiteboard, etc.
  usesMemes: boolean;              // Spider-Man style comparisons, etc.
  hasCallToAction: boolean;        // "Download my app", "Use code X"
  
  // AI replication readiness
  replicable: boolean;             // Can our AI avatar replicate this format?
  replicationNotes: string;        // How to replicate
  avatarScriptGenerated: boolean;  // Have we generated an AI avatar script from this?
}

export const CONTENT_TABLE_FIELDS = [
  { name: 'Title/Caption', type: 'singleLineText' },
  { name: 'Creator', type: 'linkedRecord', table: 'Creators' },
  { name: 'Platform', type: 'singleSelect', options: ['TikTok', 'Instagram', 'YouTube'] },
  { name: 'Post URL', type: 'url' },
  { name: 'Post Date', type: 'date' },
  { name: 'Views', type: 'number', format: 'integer' },
  { name: 'Likes', type: 'number', format: 'integer' },
  { name: 'Comments', type: 'number', format: 'integer' },
  { name: 'Shares', type: 'number', format: 'integer' },
  { name: 'Engagement Rate (%)', type: 'percent' },
  { name: 'Format Type', type: 'singleSelect', options: ['Tutorial', 'Challenge', 'Meme', 'Comparison', 'Quiz', 'Pronunciation', 'Conversation', 'Vocabulary', 'Grammar', 'Live Clip'] },
  { name: 'Topic', type: 'singleLineText' },
  { name: 'Target Level', type: 'singleSelect', options: ['Beginner', 'Intermediate', 'Advanced', 'All'] },
  { name: 'Extracted Phrases', type: 'longText' },
  { name: 'Extracted Vocabulary', type: 'longText' },
  { name: 'Phonetic Guides', type: 'longText' },
  { name: 'Grammar Points', type: 'longText' },
  { name: 'Has Text Overlay', type: 'checkbox' },
  { name: 'Has Phonetic Spelling', type: 'checkbox' },
  { name: 'Has Bilingual Caption', type: 'checkbox' },
  { name: 'Uses Props', type: 'checkbox' },
  { name: 'Uses Memes', type: 'checkbox' },
  { name: 'Has CTA', type: 'checkbox' },
  { name: 'Replicable', type: 'checkbox' },
  { name: 'Replication Notes', type: 'longText' },
  { name: 'Avatar Script Generated', type: 'checkbox' },
  { name: 'Teaching Patterns (linked)', type: 'linkedRecord', table: 'Teaching Patterns' },
];

// ============================================================
// TABLE 3: AUDIENCE
// Demographics and overlap analysis for each creator's audience
// ============================================================

export interface AudienceTable {
  creator: string;                 // Linked to Creators table
  analysisDate: string;            // When this analysis was run
  
  // Demographics
  primaryAgeRange: string;         // "18-24", "25-34"
  genderSplit: string;             // "60% female, 40% male"
  topCountries: string[];          // ["DR", "US", "CO", "MX"]
  topCities: string[];             // ["Santo Domingo", "New York", "Miami"]
  primaryLanguage: string;         // "Spanish"
  secondaryLanguage: string;       // "English"
  
  // Audience quality
  estimatedRealFollowers: number;  // After removing bots/inactive
  activeEngagers: number;          // People who regularly interact
  conversionPotential: number;     // 0-100 score
  estimatedCPA: number;            // Cost per acquisition if we partner
  
  // Overlap analysis
  overlapWithOtherCreators: string[]; // ["@dannycashhout (15%)", "@espanol.w.lola (8%)"]
  overlapWithOurUsers: number;     // Percentage already using ConnectWorld AI
  
  // Revenue potential
  estimatedSubscribers: number;    // How many would subscribe via this creator
  estimatedMonthlyRevenue: number; // Projected revenue from this audience
  estimatedLTV: number;            // Lifetime value per subscriber from this audience
  pricingRegion: string;           // "Caribbean ($2.99)", "Standard ($13.99)"
}

export const AUDIENCE_TABLE_FIELDS = [
  { name: 'Creator', type: 'linkedRecord', table: 'Creators' },
  { name: 'Analysis Date', type: 'date' },
  { name: 'Primary Age Range', type: 'singleSelect', options: ['13-17', '18-24', '25-34', '35-44', '45-54', '55+'] },
  { name: 'Gender Split', type: 'singleLineText' },
  { name: 'Top Countries', type: 'multipleSelects', options: ['US', 'DR', 'MX', 'CO', 'PR', 'VE', 'AR', 'CL', 'PE', 'ES', 'BR', 'FR', 'JP', 'KR', 'Other'] },
  { name: 'Top Cities', type: 'longText' },
  { name: 'Primary Language', type: 'singleSelect', options: ['Spanish', 'English', 'French', 'Portuguese', 'Other'] },
  { name: 'Secondary Language', type: 'singleSelect', options: ['Spanish', 'English', 'French', 'Portuguese', 'None', 'Other'] },
  { name: 'Est. Real Followers', type: 'number', format: 'integer' },
  { name: 'Active Engagers', type: 'number', format: 'integer' },
  { name: 'Conversion Potential (0-100)', type: 'number', format: 'integer' },
  { name: 'Est. CPA', type: 'currency', symbol: '$' },
  { name: 'Overlap with Other Creators', type: 'longText' },
  { name: 'Overlap with Our Users (%)', type: 'percent' },
  { name: 'Est. Subscribers', type: 'number', format: 'integer' },
  { name: 'Est. Monthly Revenue', type: 'currency', symbol: '$' },
  { name: 'Est. LTV', type: 'currency', symbol: '$' },
  { name: 'Pricing Region', type: 'singleSelect', options: ['Standard ($13.99)', 'South America ($6.99)', 'Caribbean ($2.99)', 'Central America ($3.99)', 'Southeast Asia ($2.49)', 'South Asia ($1.99)', 'Africa ($1.49)', 'Middle East ($5.99)'] },
];

// ============================================================
// TABLE 4: OUTREACH
// Tracks all communication and deal-making with creators
// ============================================================

export interface OutreachTable {
  creator: string;                 // Linked to Creators table
  
  // Contact info
  contactMethod: 'dm' | 'email' | 'whatsapp' | 'manager' | 'mutual_contact';
  contactDetails: string;          // Email, phone, manager name
  mutualContact: string;           // "DR contact (user's friend)"
  
  // Outreach tracking
  firstContactDate: string;
  firstContactMessage: string;     // What we sent
  responseDate: string;
  responseContent: string;         // What they said back
  
  // Follow-ups
  followUp1Date: string;
  followUp1Content: string;
  followUp2Date: string;
  followUp2Content: string;
  followUp3Date: string;
  followUp3Content: string;
  
  // Deal terms
  offeredTier: 'standard' | 'exclusive' | 'co_branded';
  offeredCommission: string;       // "25% first month, 10% recurring"
  counterOffer: string;            // What they asked for
  finalTerms: string;              // Agreed terms
  contractSigned: boolean;
  contractUrl: string;             // Link to signed contract
  
  // Status
  outreachStatus: 'draft' | 'sent' | 'opened' | 'replied' | 'meeting_scheduled' | 'negotiating' | 'closed_won' | 'closed_lost' | 'ghosted';
  lostReason: string;              // Why they said no (if applicable)
  nextAction: string;              // "Follow up in 3 days", "Send contract"
  nextActionDate: string;
  
  // Notes
  callNotes: string;               // Notes from video/phone calls
  internalNotes: string;           // Team discussion notes
}

export const OUTREACH_TABLE_FIELDS = [
  { name: 'Creator', type: 'linkedRecord', table: 'Creators' },
  { name: 'Contact Method', type: 'singleSelect', options: ['DM', 'Email', 'WhatsApp', 'Manager', 'Mutual Contact'] },
  { name: 'Contact Details', type: 'singleLineText' },
  { name: 'Mutual Contact', type: 'singleLineText' },
  { name: 'First Contact Date', type: 'date' },
  { name: 'First Contact Message', type: 'longText' },
  { name: 'Response Date', type: 'date' },
  { name: 'Response Content', type: 'longText' },
  { name: 'Follow-up 1 Date', type: 'date' },
  { name: 'Follow-up 1 Content', type: 'longText' },
  { name: 'Follow-up 2 Date', type: 'date' },
  { name: 'Follow-up 2 Content', type: 'longText' },
  { name: 'Follow-up 3 Date', type: 'date' },
  { name: 'Follow-up 3 Content', type: 'longText' },
  { name: 'Offered Tier', type: 'singleSelect', options: ['Standard', 'Exclusive', 'Co-Branded'] },
  { name: 'Offered Commission', type: 'singleLineText' },
  { name: 'Counter Offer', type: 'longText' },
  { name: 'Final Terms', type: 'longText' },
  { name: 'Contract Signed', type: 'checkbox' },
  { name: 'Contract URL', type: 'url' },
  { name: 'Outreach Status', type: 'singleSelect', options: ['Draft', 'Sent', 'Opened', 'Replied', 'Meeting Scheduled', 'Negotiating', 'Closed Won', 'Closed Lost', 'Ghosted'] },
  { name: 'Lost Reason', type: 'singleLineText' },
  { name: 'Next Action', type: 'singleLineText' },
  { name: 'Next Action Date', type: 'date' },
  { name: 'Call Notes', type: 'longText' },
  { name: 'Internal Notes', type: 'longText' },
];

// ============================================================
// TABLE 5: TEACHING PATTERNS
// Extracted teaching methodologies from creator content
// ============================================================

export interface TeachingPatternsTable {
  creator: string;                 // Linked to Creators table
  patternName: string;             // "Phonetic Pronunciation Guide"
  
  // Format classification
  formatCategory: 'phonetic_spelling' | 'visual_comparison' | 'pause_and_repeat' | 'physical_demo' | 'meme_format' | 'whiteboard' | 'conversation_sim' | 'vocabulary_cards' | 'grammar_rule' | 'speech_linking';
  
  // Visual style
  visualElements: string[];        // ["text_overlay", "color_coded", "american_flag", "props"]
  textOverlayStyle: string;        // "Red=English, Blue=Spanish, Purple=Phonetic"
  backgroundStyle: string;         // "home_setting", "studio", "outdoor"
  propsUsed: string[];             // ["whiteboard", "book", "phone", "food_items"]
  
  // Audio/delivery style
  speakingPace: 'slow' | 'normal' | 'fast';
  repetitions: number;             // How many times they repeat the phrase
  pauseForViewer: boolean;         // Do they pause for viewer to repeat?
  usesMusic: boolean;              // Background music?
  
  // Teaching methodology
  explanationLanguage: string;     // "Spanish with English target words"
  phoneticSystem: string;          // "Spanish phonetic rules applied to English"
  exampleType: string;             // "real_life_scenario", "isolated_word", "full_sentence"
  culturalContext: boolean;        // Does it include cultural explanation?
  
  // Replication data
  avgDuration: number;             // Seconds (typically 30-60)
  hookStyle: string;               // "question", "challenge", "mistake_correction"
  ctaStyle: string;                // "follow_for_more", "download_app", "visit_website"
  
  // Performance correlation
  avgViewsForPattern: number;      // How well this pattern performs
  avgEngagementForPattern: number; // Engagement rate for this pattern type
  viralPotential: 'high' | 'medium' | 'low';
  
  // AI avatar replication
  replicableByAI: boolean;
  aiAvatarScript: string;          // Generated script for our AI avatar
  requiredAssets: string[];        // ["text_overlay_template", "phonetic_font", "flag_graphic"]
}

export const TEACHING_PATTERNS_TABLE_FIELDS = [
  { name: 'Creator', type: 'linkedRecord', table: 'Creators' },
  { name: 'Pattern Name', type: 'singleLineText' },
  { name: 'Format Category', type: 'singleSelect', options: ['Phonetic Spelling', 'Visual Comparison', 'Pause & Repeat', 'Physical Demo', 'Meme Format', 'Whiteboard', 'Conversation Sim', 'Vocabulary Cards', 'Grammar Rule', 'Speech Linking'] },
  { name: 'Visual Elements', type: 'multipleSelects', options: ['Text Overlay', 'Color Coded', 'Flag/National Symbol', 'Props', 'Split Screen', 'Green Screen', 'Subtitles', 'Animations'] },
  { name: 'Text Overlay Style', type: 'singleLineText' },
  { name: 'Background Style', type: 'singleSelect', options: ['Home Setting', 'Studio', 'Outdoor', 'Classroom', 'Green Screen'] },
  { name: 'Props Used', type: 'longText' },
  { name: 'Speaking Pace', type: 'singleSelect', options: ['Slow', 'Normal', 'Fast'] },
  { name: 'Repetitions', type: 'number', format: 'integer' },
  { name: 'Pause for Viewer', type: 'checkbox' },
  { name: 'Uses Music', type: 'checkbox' },
  { name: 'Explanation Language', type: 'singleLineText' },
  { name: 'Phonetic System', type: 'singleLineText' },
  { name: 'Example Type', type: 'singleSelect', options: ['Real Life Scenario', 'Isolated Word', 'Full Sentence', 'Dialogue', 'Song Lyric'] },
  { name: 'Cultural Context', type: 'checkbox' },
  { name: 'Avg Duration (sec)', type: 'number', format: 'integer' },
  { name: 'Hook Style', type: 'singleSelect', options: ['Question', 'Challenge', 'Mistake Correction', 'Trending Sound', 'Duet/Stitch', 'Shock Fact'] },
  { name: 'CTA Style', type: 'singleSelect', options: ['Follow for More', 'Download App', 'Visit Website', 'Comment Answer', 'Share with Friend', 'None'] },
  { name: 'Avg Views', type: 'number', format: 'integer' },
  { name: 'Avg Engagement (%)', type: 'percent' },
  { name: 'Viral Potential', type: 'singleSelect', options: ['High', 'Medium', 'Low'] },
  { name: 'Replicable by AI', type: 'checkbox' },
  { name: 'AI Avatar Script', type: 'longText' },
  { name: 'Required Assets', type: 'longText' },
  { name: 'Content (linked)', type: 'linkedRecord', table: 'Content' },
];

// ============================================================
// TABLE 6: SOCIAL STRATEGY
// Content calendar and posting strategy for ConnectWorld AI's own pages
// ============================================================

export interface SocialStrategyTable {
  contentId: string;               // "CMAI-TT-001"
  
  // Content details
  title: string;                   // "Say THIS when you're confused in Spanish"
  platform: 'tiktok' | 'instagram_reels' | 'youtube_shorts' | 'all';
  contentType: 'pronunciation_challenge' | 'say_this' | 'word_comparison' | 'quiz' | 'meme' | 'tutorial' | 'ai_demo' | 'creator_collab' | 'trending_sound';
  
  // Script
  script: string;                  // Full script for the video
  hookLine: string;                // First 3 seconds (most important)
  ctaLine: string;                 // Call to action at end
  hashtags: string[];              // ["#learnspanish", "#spanishforbeginners"]
  
  // Production
  avatarUsed: string;              // Which AI avatar delivers this
  voiceStyle: string;              // "energetic", "calm_teacher", "funny"
  visualStyle: string;             // "omar_style_phonetic", "split_screen", "green_screen"
  duration: number;                // Target duration in seconds
  musicTrack: string;              // Background music (trending sound or original)
  
  // Scheduling
  scheduledDate: string;           // When to post
  scheduledTime: string;           // Optimal time for engagement
  timezone: string;                // Target audience timezone
  status: 'idea' | 'scripted' | 'in_production' | 'ready' | 'posted' | 'analyzing';
  
  // Performance (filled after posting)
  actualPostDate: string;
  postUrl: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  newFollowers: number;            // Followers gained from this post
  appDownloads: number;            // Attributed app downloads
  
  // Inspiration source
  inspiredBy: string;              // Linked to Content table (which creator post inspired this)
  patternUsed: string;             // Linked to Teaching Patterns table
}

export const SOCIAL_STRATEGY_TABLE_FIELDS = [
  { name: 'Content ID', type: 'singleLineText' },
  { name: 'Title', type: 'singleLineText' },
  { name: 'Platform', type: 'singleSelect', options: ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'All Platforms'] },
  { name: 'Content Type', type: 'singleSelect', options: ['Pronunciation Challenge', 'Say This', 'Word Comparison', 'Quiz', 'Meme', 'Tutorial', 'AI Demo', 'Creator Collab', 'Trending Sound'] },
  { name: 'Script', type: 'longText' },
  { name: 'Hook Line', type: 'singleLineText' },
  { name: 'CTA Line', type: 'singleLineText' },
  { name: 'Hashtags', type: 'longText' },
  { name: 'Avatar Used', type: 'singleSelect', options: ['Sofia (Dominican)', 'Carlos (Mexican)', 'Lola (US Latina)', 'Omar Clone', 'Generic Male', 'Generic Female'] },
  { name: 'Voice Style', type: 'singleSelect', options: ['Energetic', 'Calm Teacher', 'Funny', 'Serious', 'Conversational'] },
  { name: 'Visual Style', type: 'singleSelect', options: ['Omar-Style Phonetic', 'Split Screen', 'Green Screen', 'Street Interview', 'Whiteboard', 'Text-Only', 'Meme Template'] },
  { name: 'Duration (sec)', type: 'number', format: 'integer' },
  { name: 'Music Track', type: 'singleLineText' },
  { name: 'Scheduled Date', type: 'date' },
  { name: 'Scheduled Time', type: 'singleLineText' },
  { name: 'Timezone', type: 'singleSelect', options: ['EST', 'CST', 'PST', 'AST (Caribbean)', 'CET (Europe)', 'JST (Japan)'] },
  { name: 'Status', type: 'singleSelect', options: ['Idea', 'Scripted', 'In Production', 'Ready', 'Posted', 'Analyzing'] },
  { name: 'Actual Post Date', type: 'date' },
  { name: 'Post URL', type: 'url' },
  { name: 'Views', type: 'number', format: 'integer' },
  { name: 'Likes', type: 'number', format: 'integer' },
  { name: 'Comments', type: 'number', format: 'integer' },
  { name: 'Shares', type: 'number', format: 'integer' },
  { name: 'New Followers', type: 'number', format: 'integer' },
  { name: 'App Downloads', type: 'number', format: 'integer' },
  { name: 'Inspired By', type: 'linkedRecord', table: 'Content' },
  { name: 'Pattern Used', type: 'linkedRecord', table: 'Teaching Patterns' },
];

// ============================================================
// SEED DATA: Initial creators to populate the base
// ============================================================

export const SEED_CREATORS = [
  {
    name: 'Omar',
    handle: '@inglesconomar',
    platform: 'tiktok' as const,
    profileUrl: 'https://www.tiktok.com/@inglesconomar',
    followers: 2100000,
    totalLikes: 16000000,
    niche: 'language_teacher' as const,
    direction: 'ES→EN',
    region: 'Dominican Republic',
    currentMonetization: 'TikTok subs ($5.09/mo, 8 subs), website course (inglesconomar.com)',
    estimatedMonthlyRevenue: 20,
    competitorAffiliates: [] as string[],
    hasOwnCourse: true,
    courseUrl: 'https://www.inglesconomar.com',
    partnershipScore: 92,
    pitchAngle: 'struggling_monetizer',
    estimatedRevenuePotential: 3145,
    status: 'researched' as const,
    priority: 'high' as const,
    // ═══ ENRICHED PROFILE: Social Links ═══
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@inglesconomar',
      instagram: 'https://www.instagram.com/inglesconomar',
      website: 'https://www.inglesconomar.com',
    },
    // ═══ ENRICHED PROFILE: Teaching Method Notes ═══
    // These keywords drive resolveCreatorTemplate() classification
    notes: [
      'whiteboard teaching — uses whiteboard/marker to write out grammar rules, verb conjugations, sentence structures side-by-side in English and Spanish',
      'phonetic pronunciation — writes phonetic spelling in Spanish for English words (e.g., "He taught me" → "(ji tot mi)")',
      'confusing words comparison — Spider-Man meme style side-by-side of similar words (taught/thought/through/tough/thorough/throughout)',
      'bilingual text overlay — every clip has both English and Spanish text on screen simultaneously',
      'natural speech linking — teaches how native speakers connect words ("wanna", "gonna", "lemme")',
      'short-form clips — 15-60 second TikTok format, one concept per clip',
      'LIVE Q&A sessions — regular interactive sessions answering viewer questions',
      'real-world corrections — catches common Dominican Spanish speaker mistakes in English',
      'vocabulary drills — rapid-fire word cards with pronunciation',
      'grammar comparison — side-by-side English vs Spanish grammar on whiteboard',
      'cultural context — explains WHY English works differently than Spanish',
      'progressive difficulty — starts simple, builds complexity across clips',
    ].join('; '),
    // ═══ ENRICHED PROFILE: Teaching Patterns ═══
    teachingPatterns: [
      {
        patternName: 'Whiteboard Grammar Breakdown',
        formatCategory: 'Whiteboard',
        description: 'Omar writes on a whiteboard, breaking down grammar rules with color-coded markers. Shows English structure on one side, Spanish equivalent on the other. Circles key differences, draws arrows connecting related concepts.',
        visualElements: ['Text Overlay', 'Color Coded', 'Whiteboard'],
        speakingPace: 'Normal',
        hookStyle: 'Mistake Correction',
        avgDuration: 45,
        viralPotential: 'High',
        replicableByAI: true,
      },
      {
        patternName: 'Phonetic Pronunciation Card',
        formatCategory: 'Phonetic Spelling',
        description: 'Shows English word/phrase prominently, then reveals phonetic spelling using Spanish sounds underneath. Omar pronounces slowly, then at natural speed. Viewers repeat.',
        visualElements: ['Text Overlay', 'Color Coded'],
        speakingPace: 'Slow',
        hookStyle: 'Challenge',
        avgDuration: 20,
        viralPotential: 'High',
        replicableByAI: true,
      },
      {
        patternName: 'Confusing Words Spider-Man',
        formatCategory: 'Visual Comparison',
        description: 'Uses Spider-Man pointing meme or split-screen to compare words that sound similar but mean different things. Shows pronunciation difference, meaning difference, and example sentences for each.',
        visualElements: ['Split Screen', 'Text Overlay', 'Color Coded'],
        speakingPace: 'Normal',
        hookStyle: 'Shock Fact',
        avgDuration: 35,
        viralPotential: 'High',
        replicableByAI: true,
      },
      {
        patternName: 'Speech Linking Drill',
        formatCategory: 'Speech Linking',
        description: 'Teaches how native English speakers connect words in natural speech. Shows formal version vs. how it actually sounds ("want to" → "wanna", "going to" → "gonna"). Whiteboard with arrows showing the linking.',
        visualElements: ['Whiteboard', 'Text Overlay', 'Animations'],
        speakingPace: 'Fast',
        hookStyle: 'Question',
        avgDuration: 30,
        viralPotential: 'Medium',
        replicableByAI: true,
      },
    ],
  },
  {
    name: 'Lola',
    handle: '@espanol.w.lola',
    platform: 'multi-platform' as const,
    profileUrl: 'https://www.instagram.com/espanol.w.lola',
    followers: 421000,
    followersSecondary: 369000,
    niche: 'language_teacher' as const,
    direction: 'EN→ES',
    region: 'United States',
    currentMonetization: 'Airlearn affiliate, brand deals',
    competitorAffiliates: ['Airlearn'],
    hasOwnCourse: false,
    partnershipScore: 78,
    pitchAngle: 'steal_from_competitor',
    estimatedRevenuePotential: 1800,
    status: 'researched' as const,
    priority: 'high' as const,
  },
  {
    name: 'Daniel',
    handle: '@dannycashhout',
    platform: 'multi-platform' as const,
    profileUrl: 'https://www.instagram.com/dannycashhout',
    followers: 1000000,
    followersSecondary: 323000,
    niche: 'bilingual_lifestyle' as const,
    direction: 'bilingual',
    region: 'El Paso, TX',
    currentMonetization: 'Brand deals, lifestyle content',
    competitorAffiliates: [] as string[],
    hasOwnCourse: false,
    partnershipScore: 72,
    pitchAngle: 'big_fish',
    estimatedRevenuePotential: 2500,
    status: 'researched' as const,
    priority: 'medium' as const,
  },
  {
    name: 'Aprende Inglés en 7 Meses',
    handle: '@aprendeinglesen7meses',
    platform: 'instagram' as const,
    profileUrl: 'https://www.instagram.com/aprendeinglesen7meses',
    followers: 0, // Unknown - need Apify scrape
    niche: 'language_teacher' as const,
    direction: 'ES→EN',
    region: 'Dominican Republic',
    currentMonetization: 'Website course, call center English training',
    hasOwnCourse: true,
    courseUrl: 'https://ingles7meses.com',
    partnershipScore: 65,
    pitchAngle: 'local_hero',
    status: 'prospect' as const,
    priority: 'medium' as const,
  },
  {
    name: 'Spanish Over Tea',
    handle: '@spanishovertea',
    platform: 'instagram' as const,
    profileUrl: 'https://www.instagram.com/spanishovertea',
    niche: 'language_teacher' as const,
    direction: 'EN→ES',
    region: 'United States',
    partnershipScore: 60,
    pitchAngle: 'local_hero',
    status: 'prospect' as const,
    priority: 'medium' as const,
  },
  {
    name: 'AI Spanish Tutor',
    handle: '@ai_spanish_tutor',
    platform: 'instagram' as const,
    profileUrl: 'https://www.instagram.com/ai_spanish_tutor',
    niche: 'language_teacher' as const,
    direction: 'EN→ES',
    region: 'Unknown',
    partnershipScore: 55,
    pitchAngle: 'steal_from_competitor',
    status: 'prospect' as const,
    priority: 'low' as const,
    notes: 'AI-based competitor — study their format, may not be a partner candidate',
  },
  {
    name: 'Byond Language',
    handle: '@byondlanguage',
    platform: 'instagram' as const,
    profileUrl: 'https://www.instagram.com/byondlanguage',
    niche: 'language_teacher' as const,
    direction: 'EN→ES',
    region: 'Unknown',
    partnershipScore: 58,
    pitchAngle: 'local_hero',
    status: 'prospect' as const,
    priority: 'medium' as const,
  },
  {
    name: 'En Dos Idiomas',
    handle: '@endosidiomas',
    platform: 'instagram' as const,
    profileUrl: 'https://www.instagram.com/endosidiomas',
    niche: 'language_teacher' as const,
    direction: 'bilingual',
    region: 'Unknown',
    partnershipScore: 60,
    pitchAngle: 'local_hero',
    status: 'prospect' as const,
    priority: 'medium' as const,
  },
  {
    name: 'BWill Memphis',
    handle: '@bwill_memphis10',
    platform: 'instagram' as const,
    profileUrl: 'https://www.instagram.com/bwill_memphis10',
    niche: 'bilingual_lifestyle' as const,
    direction: 'EN→ES',
    region: 'Memphis, TN',
    partnershipScore: 62,
    pitchAngle: 'engagement_king',
    status: 'prospect' as const,
    priority: 'medium' as const,
    notes: 'Black American learning/teaching Spanish — great for diversity representation',
  },
  {
    name: 'That Bilingual Chick',
    handle: '@thatbilingualchick',
    platform: 'instagram' as const,
    profileUrl: 'https://www.instagram.com/thatbilingualchick',
    niche: 'bilingual_lifestyle' as const,
    direction: 'bilingual',
    region: 'United States',
    partnershipScore: 68,
    pitchAngle: 'engagement_king',
    status: 'prospect' as const,
    priority: 'medium' as const,
  },
  {
    name: 'Rocky Rodriguez',
    handle: '@sevendayspanish',
    platform: 'multi-platform' as const,
    profileUrl: 'https://www.sevendayspanish.com',
    niche: 'pronunciation_phonetics' as const,
    direction: 'EN→ES',
    region: 'United States (Puerto Rican)',
    partnershipScore: 90,
    pitchAngle: 'course_creator',
    status: 'researched' as const,
    priority: 'high' as const,
    followers: 500000,
    notes: `Former US government interpreter. College degree in Spanish. Self-taught polyglot (2+ languages to fluency in <6 months). Featured in The New York Times for phonetic analysis and pronunciation methods. Creator of Seven Day Spanish course.\n\nTEACHING METHODS:\n1. ALPHABET MASTERY FIRST — Learn to pronounce every letter perfectly before vocab/grammar. Foundation-first approach. If you can say every letter like a native, you can pronounce every word.\n2. RHYTHMIC REINFORCEMENT TRAINING (RRT) — Proprietary 4-step method: (a) Take relevant conversational words/phrases, (b) Master proper pronunciation, (c) Hear at normal speed, (d) Hear at native speed with letter cutting and word merging. Progressive speed training.\n3. ARTIFICIAL IMMERSION — Create immersion at home. Netflix Dictation Exercise: listen without subtitles → write what you hear → rewind until figured out → imitate the speaker → check subtitles. Active learning, not passive.\n4. SPEED TRIALS — Timed response exercises to eliminate "think in English first" habit. Train to respond without translating back to English.\n5. LIVE DECODING — Decode difficult accents and dialects from different Spanish-speaking countries. Government interpreter training applied to language learning.\n6. PERFORMANCE ANXIETY PREVENTION — Addresses the gap where students know grammar/vocab but freeze in real conversations.\n\nKEY DIFFERENTIATORS: Pronunciation-first (not grammar-first), progressive speed training, real conversation focus over test prep, conjugation taught AFTER speaking basics, dialect decoding expertise.\n\nSOCIAL LINKS: Website: sevendayspanish.com`,
    teachingPatterns: [
      {
        patternName: 'Rhythmic Reinforcement Training (RRT)',
        description: 'Proprietary 4-step progressive speed training: learn pronunciation → hear at normal speed → hear at native speed with contractions/letter cutting → respond without translating to English first',
        exerciseTypes: ['pronunciation_drill', 'speed_trial', 'listening_comprehension', 'native_speed_decode'],
        difficultyRange: 'A1-C1',
        effectiveness: 'high',
      },
      {
        patternName: 'Alphabet Mastery Foundation',
        description: 'Master every letter pronunciation before any vocab or grammar. Foundation-first approach that schools and apps skip.',
        exerciseTypes: ['alphabet_drill', 'letter_pronunciation', 'phonetic_comparison'],
        difficultyRange: 'A1-A2',
        effectiveness: 'high',
      },
      {
        patternName: 'Netflix Dictation Exercise',
        description: '6-step active immersion: listen to Spanish show without subtitles → write what you hear → rewind and repeat → imitate speaker → check subtitles → match English to Spanish',
        exerciseTypes: ['dictation', 'listening_comprehension', 'pronunciation_imitation', 'translation_matching'],
        difficultyRange: 'A2-C1',
        effectiveness: 'high',
      },
      {
        patternName: 'Speed Trials',
        description: 'Timed response exercises that train students to respond in Spanish without translating back to English first. Eliminates Performance Anxiety.',
        exerciseTypes: ['timed_response', 'conversation_chain', 'rapid_fire_vocab'],
        difficultyRange: 'A2-B2',
        effectiveness: 'high',
      },
      {
        patternName: 'Live Decoding Sessions',
        description: 'Decode difficult-to-understand Spanish from different dialects, fast speech, background noise. Based on government interpreter training.',
        exerciseTypes: ['dialect_decode', 'accent_recognition', 'noisy_listening'],
        difficultyRange: 'B1-C2',
        effectiveness: 'medium',
      },
    ],
  },
  {
    name: 'Teachers From Brazil',
    handle: '@teachersfrombrazil',
    platform: 'multi-platform' as const,
    profileUrl: 'https://www.instagram.com/teachersfrombrazil',
    followers: 5000, // Growing presence across platforms
    followersSecondary: 345, // YouTube subscribers
    totalLikes: 14100, // TikTok likes
    niche: 'language_teacher' as const,
    direction: 'PT→EN',
    targetLanguages: ['portuguese', 'english'],
    region: 'Brazil',
    audienceCountries: ['US', 'BR', 'Other'],
    currentMonetization: 'Private lessons, group classes, free trial classes',
    estimatedMonthlyRevenue: 500,
    competitorAffiliates: [] as string[],
    hasOwnCourse: true,
    courseUrl: 'https://www.instagram.com/teachersfrombrazil',
    partnershipScore: 68,
    pitchAngle: 'struggling_monetizer',
    estimatedRevenuePotential: 1200,
    status: 'researched' as const,
    priority: 'medium' as const,
    // ═══ ENRICHED PROFILE: Social Links ═══
    socialLinks: {
      instagram: 'https://www.instagram.com/teachersfrombrazil',
      youtube: 'https://www.youtube.com/@TeachersFromBrazil',
      tiktok: 'https://www.tiktok.com/@teachersfrombrazil',
    },
    // ═══ ENRICHED PROFILE: Teaching Method Notes ═══
    notes: [
      'native Brazilian teachers — multiple teachers from Brazil, school format with private and group classes',
      'slang explainers — decodes Brazilian slang with cultural context (X-9, Papo Reto, Virar Saudade, Já É, Já Era, Migué, Vacilo)',
      'cultural immersion — teaches through real Brazilian scenarios (dating, food, family, beaches, street food, capoeira)',
      'grammar breakdowns — clear explanations of confusing grammar (Ser vs Estar, Ficar, prepositions, adverbs with -mente)',
      'pronunciation focus — highlights sounds that change meaning, common foreigner mistakes',
      'travel phrases — practical Portuguese for restaurants, airports, meeting family',
      'idioms and expressions — teaches phrases that make learners sound native',
      'music and culture — connects language learning to Brazilian music, songs that became worldwide hits',
      'short-form video — 5-8 minute YouTube videos, short TikToks, one concept per clip',
      'real Brazilian Portuguese — how Brazilians actually speak, not textbook Portuguese',
      'live 1:1 sessions — offers personal tutoring with native speakers',
      'cross-platform content — consistent presence on Instagram, YouTube, TikTok',
    ].join('; '),
    // ═══ ENRICHED PROFILE: Teaching Patterns ═══
    teachingPatterns: [
      {
        patternName: 'Brazilian Slang Decoder',
        formatCategory: 'Slang Explainer',
        description: 'Breaks down Brazilian slang words and expressions with cultural context. Shows the literal meaning, actual usage, and situations where Brazilians use each expression. Multiple examples per slang term.',
        visualElements: ['Text Overlay', 'Color Coded', 'Examples'],
        speakingPace: 'Normal',
        hookStyle: 'Question',
        avgDuration: 360,
        viralPotential: 'High',
        replicableByAI: true,
      },
      {
        patternName: 'Cultural Scenario Immersion',
        formatCategory: 'Cultural Context',
        description: 'Teaches Portuguese through real Brazilian cultural scenarios — dating a Brazilian, ordering street food, meeting the family, going to the beach. Language is embedded in authentic cultural situations.',
        visualElements: ['Scenario Based', 'Text Overlay', 'Cultural Visuals'],
        speakingPace: 'Normal',
        hookStyle: 'Story',
        avgDuration: 400,
        viralPotential: 'High',
        replicableByAI: true,
      },
      {
        patternName: 'Confusing Verb Breakdown',
        formatCategory: 'Grammar Visual',
        description: 'Tackles the most confusing Portuguese verbs and grammar (Ser vs Estar, Ficar, prepositions). Uses clear side-by-side comparisons with multiple example sentences showing when to use each form.',
        visualElements: ['Split Screen', 'Text Overlay', 'Color Coded'],
        speakingPace: 'Slow',
        hookStyle: 'Mistake Correction',
        avgDuration: 420,
        viralPotential: 'Medium',
        replicableByAI: true,
      },
      {
        patternName: 'Pronunciation Danger Zone',
        formatCategory: 'Pronunciation Drill',
        description: 'Highlights Portuguese sounds that foreigners struggle with most, and sounds where one mistake changes the entire meaning. Demonstrates correct vs incorrect pronunciation with native speaker examples.',
        visualElements: ['Text Overlay', 'Audio Focus', 'Comparison'],
        speakingPace: 'Slow',
        hookStyle: 'Shock Fact',
        avgDuration: 380,
        viralPotential: 'High',
        replicableByAI: true,
      },
      {
        patternName: 'Travel Survival Phrases',
        formatCategory: 'Practical Phrases',
        description: 'Teaches essential Portuguese phrases for specific real-world situations in Brazil — ordering at restaurants, asking for directions, meeting family, navigating airports. Phrases Brazilians actually use, not textbook versions.',
        visualElements: ['Text Overlay', 'Scenario Based'],
        speakingPace: 'Normal',
        hookStyle: 'Challenge',
        avgDuration: 350,
        viralPotential: 'Medium',
        replicableByAI: true,
      },
    ],
  },
  // ─── @spanishwithdiana_ (Diana Hernandez) ───────────────────────────────────
  {
    name: 'Spanish with Diana Hernandez',
    handle: '@spanishwithdiana_',
    platform: 'Instagram' as const,
    followerCount: 492000,
    engagementRate: 4.2,
    niche: 'Colombian Spanish',
    targetLanguages: ['Spanish'],
    teachingStyle: 'Conversational & Cultural Immersion',
    contentFormat: 'Short-form video (Reels)',
    postingFrequency: 'Daily',
    audienceDemo: '18-35, English speakers learning Spanish, travel enthusiasts',
    courseUrl: 'https://www.instagram.com/spanishwithdiana_',
    notes: `TEACHING METHOD: Conversational Practice + Cultural Immersion
- PRONUNCIATION CORRECTION: Points out common pronunciation mistakes that change word meaning
- CULTURAL IMMERSION: Connects language learning to Colombian culture, food, and travel
- CONVERSATIONAL PRACTICE: Conversation-based method to overcome fear of speaking
- COMMON MISTAKES: Highlights words that sound similar but mean different things in Spanish
- REAL-LIFE PHRASES: Practical everyday Spanish for travel and daily life situations
- Offers immersion trips to Colombia for hands-on practice
- Focus on Colombian dialect and regional expressions`,
    socialLinks: {
      instagram: 'https://www.instagram.com/spanishwithdiana_',
      youtube: 'https://www.youtube.com/@spanishwithdiana',
      tiktok: 'https://www.tiktok.com/@spanishwithdiana_',
    },
    teachingPatterns: [
      {
        patternName: 'Pronunciation Correction',
        description: 'Points out common pronunciation mistakes that change word meaning, with before/after examples',
        contentType: 'pronunciation_drill',
        speakingPace: 'Slow',
        hookStyle: 'Warning/Caution',
        avgDuration: 45,
        viralPotential: 'High',
        replicableByAI: true,
      },
      {
        patternName: 'Cultural Immersion Phrases',
        description: 'Teaches phrases in context of Colombian culture, food, music, and travel scenarios',
        contentType: 'cultural_context',
        speakingPace: 'Normal',
        hookStyle: 'Story/Scenario',
        avgDuration: 60,
        viralPotential: 'High',
        replicableByAI: true,
      },
      {
        patternName: 'Conversational Fear Breaker',
        description: 'Simulates real conversations to help overcome speaking anxiety with guided responses',
        contentType: 'conversation_practice',
        speakingPace: 'Normal',
        hookStyle: 'Challenge',
        avgDuration: 90,
        viralPotential: 'Medium',
        replicableByAI: true,
      },
      {
        patternName: 'Common Mistakes Alert',
        description: 'Highlights confusing word pairs and false friends with humorous examples',
        contentType: 'error_correction',
        speakingPace: 'Normal',
        hookStyle: 'Warning/Caution',
        avgDuration: 40,
        viralPotential: 'Very High',
        replicableByAI: true,
      },
      {
        patternName: 'Travel Spanish Essentials',
        description: 'Must-know phrases for traveling in Colombia and Latin America with cultural tips',
        contentType: 'travel_phrases',
        speakingPace: 'Slow',
        hookStyle: 'List/Countdown',
        avgDuration: 55,
        viralPotential: 'High',
        replicableByAI: true,
      },
    ],
  },
  // ─── @jonahjgomez (Jonah Gomez) ────────────────────────────────────────────
  {
    name: 'Jonah Gomez',
    handle: '@jonahjgomez',
    platform: 'Instagram' as const,
    followerCount: 60000,
    engagementRate: 5.8,
    niche: 'Dominican Spanish & Culture',
    targetLanguages: ['Spanish'],
    teachingStyle: 'Street Immersion & Cultural Storytelling',
    contentFormat: 'Short-form video (Reels/TikTok)',
    postingFrequency: 'Daily',
    audienceDemo: '20-40, Dominican diaspora, travelers to DR, heritage speakers',
    courseUrl: 'https://www.instagram.com/jonahjgomez',
    notes: `TEACHING METHOD: Street Immersion + Dominican Cultural Context
- STREET SPANISH: Real Dominican slang, phrases, and expressions used on the street
- CULTURAL CONTEXT: Explains Dominican culture, lifestyle, and social norms
- TRAVEL PREPARATION: "Make sure your Spanish is on point when you travel to DR"
- COMPARISON CONTENT: Compares US vs DR life, education, culture to teach through contrast
- IMMERSIVE STORYTELLING: Shows real-life scenarios in DR requiring Spanish comprehension
- Dominican-American who moved back to DR - authentic bilingual perspective
- Focus on Dominican dialect, slang, and regional expressions`,
    socialLinks: {
      instagram: 'https://www.instagram.com/jonahjgomez',
      tiktok: 'https://www.tiktok.com/@jonahjgomez',
      youtube: 'https://www.youtube.com/@JGivesBack',
    },
    teachingPatterns: [
      {
        patternName: 'Dominican Street Spanish',
        description: 'Teaches real Dominican slang and street phrases with context and usage examples',
        contentType: 'slang_vocabulary',
        speakingPace: 'Fast',
        hookStyle: 'POV/Scenario',
        avgDuration: 45,
        viralPotential: 'Very High',
        replicableByAI: true,
      },
      {
        patternName: 'DR Travel Prep',
        description: 'Essential Spanish phrases and cultural knowledge for traveling to Dominican Republic',
        contentType: 'travel_phrases',
        speakingPace: 'Normal',
        hookStyle: 'Direct Address',
        avgDuration: 60,
        viralPotential: 'High',
        replicableByAI: true,
      },
      {
        patternName: 'Cultural Comparison',
        description: 'Teaches language through comparing US vs DR culture, education, and daily life',
        contentType: 'cultural_context',
        speakingPace: 'Normal',
        hookStyle: 'Debate/Opinion',
        avgDuration: 120,
        viralPotential: 'Very High',
        replicableByAI: true,
      },
      {
        patternName: 'Real-Life DR Scenarios',
        description: 'Shows authentic situations in DR that require Spanish comprehension and response',
        contentType: 'conversation_practice',
        speakingPace: 'Fast',
        hookStyle: 'POV/Scenario',
        avgDuration: 90,
        viralPotential: 'High',
        replicableByAI: true,
      },
      {
        patternName: 'Dominican Expressions Decoded',
        description: 'Breaks down uniquely Dominican expressions with English equivalents and cultural background',
        contentType: 'slang_vocabulary',
        speakingPace: 'Normal',
        hookStyle: 'Education/Explainer',
        avgDuration: 50,
        viralPotential: 'High',
        replicableByAI: true,
      },
    ],
  },
  // ─── @acariocateacher (Melissa) ────────────────────────────────────────────
  {
    name: 'A Carioca Teacher (Melissa)',
    handle: '@acariocateacher',
    platform: 'Instagram' as const,
    followerCount: 10000,
    engagementRate: 6.5,
    niche: 'Brazilian Portuguese (Carioca)',
    targetLanguages: ['Portuguese'],
    teachingStyle: 'Practical & Slang-Forward',
    contentFormat: 'Short-form video (Reels/TikTok)',
    postingFrequency: 'Daily',
    audienceDemo: '20-35, English speakers learning Portuguese, travelers to Brazil',
    courseUrl: 'https://www.instagram.com/acariocateacher',
    notes: `TEACHING METHOD: Carioca Practical Immersion
- CARIOCA SLANG: Rio de Janeiro specific slang and expressions locals actually use
- VOCABULARY OPPOSITES: Teaching through contrasting word pairs for faster retention
- ESSENTIAL EXPRESSIONS: Must-know phrases for daily life in Brazil
- CHALLENGE-BASED LEARNING: Portuguese learning challenges with progress checks
- PRACTICAL CONVERSATION: Real phrases for real situations (dating, shopping, ordering food)
- Based in Rio de Janeiro - authentic Carioca accent and culture
- Focus on speaking Portuguese like a local, not textbook Portuguese`,
    socialLinks: {
      instagram: 'https://www.instagram.com/acariocateacher',
      tiktok: 'https://www.tiktok.com/@acariocateacher',
    },
    teachingPatterns: [
      {
        patternName: 'Carioca Slang Spotlight',
        description: 'Teaches Rio de Janeiro slang with usage context, pronunciation, and cultural meaning',
        contentType: 'slang_vocabulary',
        speakingPace: 'Normal',
        hookStyle: 'Question/Quiz',
        avgDuration: 40,
        viralPotential: 'High',
        replicableByAI: true,
      },
      {
        patternName: 'Vocabulary Opposites',
        description: 'Teaches word pairs through opposites for faster retention and association',
        contentType: 'vocabulary_drill',
        speakingPace: 'Slow',
        hookStyle: 'Education/Explainer',
        avgDuration: 35,
        viralPotential: 'Medium',
        replicableByAI: true,
      },
      {
        patternName: 'Essential Brazilian Expressions',
        description: 'Must-know expressions for surviving and thriving in Brazil with real-world context',
        contentType: 'travel_phrases',
        speakingPace: 'Normal',
        hookStyle: 'List/Countdown',
        avgDuration: 50,
        viralPotential: 'High',
        replicableByAI: true,
      },
      {
        patternName: 'Portuguese Challenge',
        description: 'Interactive learning challenges with progress tracking and daily goals',
        contentType: 'challenge_exercise',
        speakingPace: 'Normal',
        hookStyle: 'Challenge',
        avgDuration: 60,
        viralPotential: 'Medium',
        replicableByAI: true,
      },
      {
        patternName: 'Real Situation Portuguese',
        description: 'Practical phrases for specific real situations like dating, ordering food, or shopping in Brazil',
        contentType: 'conversation_practice',
        speakingPace: 'Normal',
        hookStyle: 'POV/Scenario',
        avgDuration: 55,
        viralPotential: 'High',
        replicableByAI: true,
      },
    ],
  },
];

// ============================================================
// AIRTABLE API INTEGRATION HELPERS
// ============================================================

/**
 * Airtable API configuration
 * To set up:
 * 1. Create account at airtable.com
 * 2. Create new base: "ConnectWorld AI Creator Intelligence"
 * 3. Create tables using the field definitions above
 * 4. Get API key from https://airtable.com/account
 * 5. Get Base ID from https://airtable.com/api
 * 6. Set env vars: AIRTABLE_API_KEY, AIRTABLE_BASE_ID
 */
export const AIRTABLE_CONFIG = {
  baseUrl: 'https://api.airtable.com/v0',
  tables: {
    creators: 'Creators',
    content: 'Content',
    audience: 'Audience',
    outreach: 'Outreach',
    teachingPatterns: 'Teaching Patterns',
    socialStrategy: 'Social Strategy',
  },
};

/**
 * Create a record in Airtable
 */
export async function createAirtableRecord(
  tableName: string,
  fields: Record<string, unknown>,
  apiKey: string,
  baseId: string
): Promise<{ id: string; fields: Record<string, unknown> }> {
  const response = await fetch(
    `${AIRTABLE_CONFIG.baseUrl}/${baseId}/${encodeURIComponent(tableName)}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json() as Promise<{ id: string; fields: Record<string, unknown> }>;
}

/**
 * Query records from Airtable with optional filter
 */
export async function queryAirtableRecords(
  tableName: string,
  options: {
    filterByFormula?: string;
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    maxRecords?: number;
    view?: string;
  },
  apiKey: string,
  baseId: string
): Promise<Array<{ id: string; fields: Record<string, unknown> }>> {
  const params = new URLSearchParams();
  if (options.filterByFormula) params.set('filterByFormula', options.filterByFormula);
  if (options.maxRecords) params.set('maxRecords', options.maxRecords.toString());
  if (options.view) params.set('view', options.view);
  if (options.sort) {
    options.sort.forEach((s, i) => {
      params.set(`sort[${i}][field]`, s.field);
      params.set(`sort[${i}][direction]`, s.direction);
    });
  }
  
  const response = await fetch(
    `${AIRTABLE_CONFIG.baseUrl}/${baseId}/${encodeURIComponent(tableName)}?${params.toString()}`,
    {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json() as { records: Array<{ id: string; fields: Record<string, unknown> }> };
  return data.records;
}

/**
 * Seed the Airtable base with initial creator data
 */
export async function seedAirtableBase(apiKey: string, baseId: string): Promise<void> {
  console.log('Seeding Airtable base with initial creator data...');
  
  for (const creator of SEED_CREATORS) {
    const creatorRecord = await createAirtableRecord(
      AIRTABLE_CONFIG.tables.creators,
      {
        'Name': creator.name,
        'Handle': creator.handle,
        'Platform': creator.platform === 'multi-platform' ? 'Multi-Platform' : 
                    creator.platform.charAt(0).toUpperCase() + creator.platform.slice(1),
        'Profile URL': creator.profileUrl,
        'Followers (Primary)': creator.followers || 0,
        'Niche': creator.niche.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        'Direction': creator.direction,
        'Region': creator.region || 'Unknown',
        'Status': ((creator.status || 'active').charAt(0).toUpperCase() + (creator.status || 'active').slice(1)) as string,
        'Priority': ((creator.priority || 'medium').charAt(0).toUpperCase() + (creator.priority || 'medium').slice(1)) as string,
        'Partnership Score': creator.partnershipScore,
        'Notes': (creator as any).notes || '',
        'Language': creator.targetLanguages?.[0] ? creator.targetLanguages[0].charAt(0).toUpperCase() + creator.targetLanguages[0].slice(1) : 'Spanish',
        'Target Languages': (creator.targetLanguages || ['spanish']).map((l: string) => l.charAt(0).toUpperCase() + l.slice(1)),
      },
      apiKey,
      baseId
    );
    
    console.log(`  ✓ Added ${creator.name} (${creator.handle})`);

    // Push teaching patterns if the creator has them
    const patterns = (creator as any).teachingPatterns;
    if (patterns && Array.isArray(patterns)) {
      for (const pattern of patterns) {
        try {
          await createAirtableRecord(
            AIRTABLE_CONFIG.tables.teachingPatterns || 'Teaching Patterns',
            {
              'Creator': [creatorRecord.id],
              'Pattern Name': pattern.patternName,
              'Format Category': pattern.formatCategory,
              'Visual Elements': pattern.visualElements || [],
              'Speaking Pace': pattern.speakingPace || 'Normal',
              'Hook Style': pattern.hookStyle || 'Question',
              'Avg Duration (sec)': pattern.avgDuration || 30,
              'Viral Potential': pattern.viralPotential || 'Medium',
              'Replicable by AI': pattern.replicableByAI ?? true,
              'AI Avatar Script': pattern.description || '',
            },
            apiKey,
            baseId
          );
          console.log(`    ✓ Pattern: ${pattern.patternName}`);
        } catch (err) {
          console.warn(`    ⚠ Failed to push pattern ${pattern.patternName}:`, err);
        }
      }
    }
  }
  
  console.log(`\nSeeded ${SEED_CREATORS.length} creators into Airtable.`);
}
