/**
 * ConnectWorld AI — Social Content Calendar & First Batch Scripts
 * 
 * This system generates and schedules content for ConnectWorld AI's own
 * TikTok, Instagram Reels, and YouTube Shorts pages.
 * 
 * Strategy: Replicate proven formats from tracked creators (Omar-style phonetic,
 * Lola-style "Say THIS", Danny-style lifestyle) using our AI avatars.
 * 
 * Posting cadence: 3 posts/day across platforms (9 total pieces/week minimum)
 * Optimal times: 7am, 12pm, 7pm EST (peak engagement for bilingual US + Caribbean)
 */

// ============================================================
// CONTENT PILLARS — What we post about
// ============================================================

export type ContentPillar = 
  | 'pronunciation_challenge'    // Omar-style: phonetic spelling, pause-and-repeat
  | 'say_this_when'             // Lola-style: situational phrases with humor
  | 'confusing_words'           // Spider-Man meme comparisons (taught/thought/through)
  | 'slang_of_the_day'          // Trending slang with cultural context
  | 'ai_demo'                   // Show off ConnectWorld AI features (conversation, translation)
  | 'quiz_challenge'            // "Can you guess what this means?" engagement bait
  | 'cultural_moment'           // Food, music, holidays tied to language
  | 'cultural_history'          // ItsAI History-style: AI-generated historical/cultural recreations
  | 'creator_collab'            // Duets/stitches with partner creators
  | 'user_transformation'       // Before/after pronunciation recordings
  | 'trending_sound_remix';     // Use trending audio with language twist

export const CONTENT_PILLAR_MIX = {
  pronunciation_challenge: 20,   // 20% of content
  say_this_when: 15,            // 15%
  confusing_words: 8,           // 8%
  slang_of_the_day: 12,         // 12%
  ai_demo: 8,                   // 8%
  quiz_challenge: 8,            // 8%
  cultural_moment: 5,           // 5%
  cultural_history: 15,         // 15% — ItsAI History-style cultural/historical recreations
  creator_collab: 5,            // 5%
  user_transformation: 2,       // 2%
  trending_sound_remix: 2,      // 2%
} as const;

// ============================================================
// AI AVATARS — Who delivers the content
// ============================================================

export interface ContentAvatar {
  id: string;
  name: string;
  persona: string;
  voiceStyle: string;
  visualStyle: string;
  targetAudience: string;
  languagePair: string;
  region: string;
  productionTool: 'kling' | 'heygen' | 'elevenlabs';
}

export const CONTENT_AVATARS: ContentAvatar[] = [
  {
    id: 'sofia_dr',
    name: 'Sofía',
    persona: 'Young Dominican woman, energetic, uses local slang, relatable',
    voiceStyle: 'Energetic, Dominican accent, switches between Spanish and English naturally',
    visualStyle: 'Casual home setting, colorful outfits, text overlays with DR flag colors',
    targetAudience: 'Dominican/Caribbean Spanish speakers learning English',
    languagePair: 'ES→EN',
    region: 'Dominican Republic',
    productionTool: 'kling',
  },
  {
    id: 'carlos_mx',
    name: 'Carlos',
    persona: 'Mexican teacher, calm and clear, professional but friendly',
    voiceStyle: 'Clear Mexican Spanish, measured pace, good for beginners',
    visualStyle: 'Clean studio background, whiteboard style, Mexican flag accent',
    targetAudience: 'Mexican Spanish speakers learning English',
    languagePair: 'ES→EN',
    region: 'Mexico',
    productionTool: 'kling',
  },
  {
    id: 'maya_us',
    name: 'Maya',
    persona: 'US Latina, Gen-Z humor, sassy, uses memes and pop culture',
    voiceStyle: 'American English with Spanglish flair, fast-paced, funny',
    visualStyle: 'Trendy backgrounds, split screen, meme templates, green screen',
    targetAudience: 'English speakers learning Spanish (US market)',
    languagePair: 'EN→ES',
    region: 'United States',
    productionTool: 'heygen',
  },
  {
    id: 'james_us',
    name: 'James',
    persona: 'Black American learning Spanish, relatable struggle, authentic journey',
    voiceStyle: 'AAVE-influenced English, learning Spanish with real mistakes, encouraging',
    visualStyle: 'Street/urban settings, casual, reaction-style content',
    targetAudience: 'Black Americans interested in learning Spanish',
    languagePair: 'EN→ES',
    region: 'United States',
    productionTool: 'heygen',
  },
  {
    id: 'omar_clone',
    name: 'Omar (AI)',
    persona: 'AI clone of Inglés con Omar style (only if partnership signed)',
    voiceStyle: 'Omar-style delivery: slow, clear, phonetic emphasis',
    visualStyle: 'Omar-style: text overlay, phonetic in parentheses, American flag',
    targetAudience: 'Dominican/Caribbean Spanish speakers learning English',
    languagePair: 'ES→EN',
    region: 'Dominican Republic',
    productionTool: 'kling',
  },
  {
    id: 'narrator_history',
    name: 'The Narrator',
    persona: 'Authoritative documentary narrator, calm and scholarly, inspires curiosity',
    voiceStyle: 'Deep, measured, documentary tone — think David Attenborough meets Morgan Freeman',
    visualStyle: 'No face — AI-generated historical recreations with voiceover narration only',
    targetAudience: 'All language learners, history enthusiasts, culturally curious audiences',
    languagePair: 'ALL',
    region: 'Global',
    productionTool: 'kling',
  },
];

// ============================================================
// FIRST BATCH: 30 Content Scripts (Week 1 Launch)
// ============================================================

export interface ContentScript {
  id: string;
  pillar: ContentPillar;
  title: string;
  avatar: string;                  // Avatar ID
  platform: 'tiktok' | 'instagram_reels' | 'youtube_shorts' | 'all';
  duration: number;                // Target seconds
  
  // Script structure
  hook: string;                    // First 3 seconds (CRITICAL for retention)
  body: string;                    // Main teaching content
  cta: string;                     // Call to action
  
  // Visual/audio
  textOverlays: string[];          // On-screen text
  musicSuggestion: string;         // Background music/trending sound
  visualNotes: string;             // Production notes
  
  // Metadata
  hashtags: string[];
  targetLanguage: 'spanish' | 'english';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  scheduledDay: number;            // Day 1-7 of launch week
  scheduledTime: string;           // "7am" | "12pm" | "7pm"
}

export const WEEK_1_CONTENT_BATCH: ContentScript[] = [
  // ===== DAY 1: LAUNCH DAY =====
  {
    id: 'CMAI-001',
    pillar: 'pronunciation_challenge',
    title: 'How to say "water" like an American 🇺🇸',
    avatar: 'sofia_dr',
    platform: 'all',
    duration: 30,
    hook: '¿Sabías que los americanos NO dicen "water" como tú piensas? 🤯',
    body: 'Sofía demonstrates: "Water" → Americans say "wader" (warer). The T becomes a D sound between vowels. Shows mouth position. Repeats 3 times slowly. "Repeat after me: WAH-der. Not WAH-ter."',
    cta: 'Download ConnectWorld AI — it scores your pronunciation in real-time 🎯 Link in bio',
    textOverlays: ['Water ≠ "guater"', 'Water = "wader" (warer)', '🇺🇸 American pronunciation'],
    musicSuggestion: 'Soft lo-fi beat, low volume',
    visualNotes: 'Close-up of mouth for T→D transition. Text overlay: phonetic in parentheses. DR flag + US flag side by side.',
    hashtags: ['#learnEnglish', '#ingles', '#pronunciation', '#americanenglish', '#connectworldai', '#aprendeingles', '#dominicana'],
    targetLanguage: 'english',
    difficulty: 'beginner',
    scheduledDay: 1,
    scheduledTime: '7am',
  },
  {
    id: 'CMAI-002',
    pillar: 'say_this_when',
    title: 'Say THIS when you don\'t understand someone in English 🤷‍♀️',
    avatar: 'sofia_dr',
    platform: 'all',
    duration: 45,
    hook: 'STOP saying "I don\'t understand" — say THIS instead 👇',
    body: 'Sofía teaches 5 natural alternatives: 1) "Sorry, what was that?" (sori, wuat was dat) 2) "Come again?" (com aguen) 3) "I didn\'t catch that" (ai dident cach dat) 4) "Could you say that slower?" (cud yu sei dat slouer) 5) "My bad, one more time?" (mai bad, wuan mor taim). Each with phonetic guide and example scenario.',
    cta: 'Practice these with our AI teacher — she never judges 😂 ConnectWorld AI, link in bio',
    textOverlays: ['❌ "I don\'t understand"', '✅ "Sorry, what was that?"', '✅ "Come again?"', '✅ "I didn\'t catch that"', '✅ "Could you say that slower?"', '✅ "My bad, one more time?"'],
    musicSuggestion: 'Upbeat Caribbean beat',
    visualNotes: 'Split screen: wrong way (red X) vs right way (green check). Phonetic pronunciation in blue text below each phrase.',
    hashtags: ['#englishphrases', '#speakenglish', '#inglesparahispanos', '#connectworldai', '#aprendeingles', '#dominicana', '#caribbeanlife'],
    targetLanguage: 'english',
    difficulty: 'beginner',
    scheduledDay: 1,
    scheduledTime: '12pm',
  },
  {
    id: 'CMAI-003',
    pillar: 'ai_demo',
    title: 'I had a full conversation in Spanish with an AI teacher 🤖🇲🇽',
    avatar: 'maya_us',
    platform: 'all',
    duration: 60,
    hook: 'I\'ve been learning Spanish for 2 weeks and I just had my first FULL conversation... with an AI 🤯',
    body: 'Maya shows screen recording of ConnectWorld AI conversation: She asks the AI teacher a question in broken Spanish, AI responds naturally, corrects her gently, teaches the right way. Shows the pronunciation score feature. "It told me my R was only 60% — so I practiced until I got 85%"',
    cta: 'The app is free to start. My teacher is Sofia and she\'s savage 😂 Link in bio',
    textOverlays: ['Day 14 of learning Spanish', 'My pronunciation score: 60% → 85%', 'She corrected me 4 times 😭', 'But now I can actually SAY it'],
    musicSuggestion: 'Trending motivational sound',
    visualNotes: 'Screen recording style with Maya reacting in corner (picture-in-picture). Show real app UI. End with Maya speaking the phrase correctly.',
    hashtags: ['#learnspanish', '#spanishlearning', '#ailearning', '#connectworldai', '#spanishforbeginners', '#languagelearning'],
    targetLanguage: 'spanish',
    difficulty: 'beginner',
    scheduledDay: 1,
    scheduledTime: '7pm',
  },
  
  // ===== DAY 2 =====
  {
    id: 'CMAI-004',
    pillar: 'confusing_words',
    title: 'TAUGHT vs THOUGHT vs THROUGH vs THOUGH 🕷️',
    avatar: 'sofia_dr',
    platform: 'all',
    duration: 45,
    hook: 'These 4 words look ALMOST the same but sound COMPLETELY different 😵',
    body: 'Spider-Man pointing meme format. Sofía breaks down each: TAUGHT (tot) = enseñó, THOUGHT (zot) = pensó, THROUGH (zru) = a través de, THOUGH (dou) = aunque. Uses color coding: each word gets its own color. Repeats each 2x with phonetic guide.',
    cta: 'Our AI knows which ones YOU confuse and drills them until you get it 💪 ConnectWorld AI',
    textOverlays: ['TAUGHT = (tot) 🎓', 'THOUGHT = (zot) 🤔', 'THROUGH = (zru) ➡️', 'THOUGH = (dou) 🤷'],
    musicSuggestion: 'Spider-Man meme sound effect',
    visualNotes: 'Use Spider-Man pointing meme template with each word. Color code: taught=blue, thought=purple, through=green, though=orange. Omar-style phonetic in parentheses.',
    hashtags: ['#confusingwords', '#englishpronunciation', '#ingles', '#aprendeingles', '#connectworldai', '#taughtvsthought'],
    targetLanguage: 'english',
    difficulty: 'intermediate',
    scheduledDay: 2,
    scheduledTime: '7am',
  },
  {
    id: 'CMAI-005',
    pillar: 'slang_of_the_day',
    title: 'What does "no cap" mean? 🧢❌',
    avatar: 'maya_us',
    platform: 'all',
    duration: 30,
    hook: 'If an American says "no cap" they\'re NOT talking about hats 🧢',
    body: 'Maya explains: "No cap" = no lie, for real, I\'m being serious. Origin: Atlanta hip-hop culture. Examples: "That restaurant is fire, no cap" = "Ese restaurante está buenísimo, en serio". "She\'s the best teacher, no cap" = "Ella es la mejor profesora, sin mentira". Shows how to use it naturally.',
    cta: 'New slang every day in the app — stay current, not textbook 📚➡️🔥 ConnectWorld AI',
    textOverlays: ['🧢❌ NO CAP = No lie / For real', '"That food was amazing, no cap"', '= "Esa comida estaba increíble, en serio"'],
    musicSuggestion: 'Trending hip-hop beat',
    visualNotes: 'Cap emoji with X through it. Street style graphics. Show examples in text bubbles like iMessage conversation.',
    hashtags: ['#nocap', '#americanslang', '#learnspanish', '#slangoftheday', '#connectworldai', '#genzenglish', '#streetenglish'],
    targetLanguage: 'english',
    difficulty: 'intermediate',
    scheduledDay: 2,
    scheduledTime: '12pm',
  },
  {
    id: 'CMAI-006',
    pillar: 'quiz_challenge',
    title: 'Can you translate these 5 phrases? 🧠 (Most people get #4 wrong)',
    avatar: 'carlos_mx',
    platform: 'all',
    duration: 60,
    hook: 'Only 12% of people get ALL 5 right. Can you? 🤔 Pause and try!',
    body: 'Carlos shows 5 common phrases one at a time with 3-second pause: 1) "I\'m on my way" (easy), 2) "It\'s not a big deal" (medium), 3) "I couldn\'t care less" (tricky), 4) "Break a leg" (most miss this — it means good luck!), 5) "It\'s raining cats and dogs" (idiom). Reveals answers with explanations.',
    cta: 'Comment your score! 5/5 = genius 🧠 Practice idioms daily in ConnectWorld AI',
    textOverlays: ['#1: "I\'m on my way" = ?', '#2: "It\'s not a big deal" = ?', '#3: "I couldn\'t care less" = ?', '#4: "Break a leg" = ? 🦵', '#5: "It\'s raining cats and dogs" = ? 🐱🐶'],
    musicSuggestion: 'Quiz show countdown timer sound',
    visualNotes: 'Game show style with timer. Each phrase appears with countdown. Wrong answers in red, right answers in green. Dramatic reveal for #4.',
    hashtags: ['#englishquiz', '#testtuingles', '#idioms', '#connectworldai', '#aprendeingles', '#quiztime', '#englishchallenge'],
    targetLanguage: 'english',
    difficulty: 'intermediate',
    scheduledDay: 2,
    scheduledTime: '7pm',
  },
  
  // ===== DAY 3 =====
  {
    id: 'CMAI-007',
    pillar: 'pronunciation_challenge',
    title: 'The "TH" sound doesn\'t exist in Spanish — here\'s how to fake it 👅',
    avatar: 'sofia_dr',
    platform: 'all',
    duration: 40,
    hook: 'The #1 sound Spanish speakers CAN\'T make... until now 👅',
    body: 'Sofía shows tongue placement for TH: "Put your tongue between your teeth — yes, it feels weird. Now blow air. That\'s TH." Demonstrates with: THINK (not "tink"), THIS (not "dis"), THREE (not "tree"), THAT (not "dat"). Close-up of mouth. "Your tongue should be VISIBLE. If I can\'t see it, you\'re doing it wrong."',
    cta: 'Our AI can HEAR if your TH is wrong and shows you exactly how to fix it 🎯',
    textOverlays: ['❌ TINK → ✅ THINK', '❌ DIS → ✅ THIS', '❌ TREE → ✅ THREE', '👅 Tongue BETWEEN teeth!'],
    musicSuggestion: 'None — clean audio for pronunciation clarity',
    visualNotes: 'Extreme close-up of mouth showing tongue position. Side-by-side: wrong (tongue behind teeth) vs right (tongue between teeth). Slow motion replay.',
    hashtags: ['#thsound', '#pronunciation', '#ingles', '#aprendeingles', '#connectworldai', '#englishpronunciation', '#speakenglish'],
    targetLanguage: 'english',
    difficulty: 'beginner',
    scheduledDay: 3,
    scheduledTime: '7am',
  },
  {
    id: 'CMAI-008',
    pillar: 'say_this_when',
    title: 'Di ESTO cuando quieras pedir comida en español 🌮',
    avatar: 'maya_us',
    platform: 'all',
    duration: 45,
    hook: 'Ordering food in Spanish is EASY if you know these 5 phrases 🌮',
    body: 'Maya teaches restaurant Spanish: 1) "Me puede dar..." (Can I have...) 2) "¿Qué me recomienda?" (What do you recommend?) 3) "Sin picante, por favor" (No spice please) 4) "La cuenta, por favor" (The check please) 5) "¿Aceptan tarjeta?" (Do you take card?). Each with pronunciation guide and real scenario.',
    cta: 'Practice ordering with our AI waiter — he\'s patient and won\'t judge your accent 😂',
    textOverlays: ['🌮 Restaurant Spanish', '1. "Me puede dar..." = Can I have...', '2. "¿Qué me recomienda?" = What do you recommend?', '3. "La cuenta, por favor" = The check please'],
    musicSuggestion: 'Latin restaurant ambiance',
    visualNotes: 'Restaurant setting (green screen). Menu props. Maya role-plays ordering. Show phonetic pronunciation for English speakers.',
    hashtags: ['#learnspanish', '#restaurantspanish', '#spanishphrases', '#connectworldai', '#travelspanish', '#foodie', '#spanishforbeginners'],
    targetLanguage: 'spanish',
    difficulty: 'beginner',
    scheduledDay: 3,
    scheduledTime: '12pm',
  },
  {
    id: 'CMAI-009',
    pillar: 'cultural_moment',
    title: 'Why Dominicans say "vaina" for EVERYTHING 🇩🇴',
    avatar: 'sofia_dr',
    platform: 'all',
    duration: 45,
    hook: 'In DR, ONE word can mean literally ANYTHING 🇩🇴😂',
    body: 'Sofía explains "vaina": "Pásame esa vaina" (pass me that thing), "¿Qué vaina es esa?" (what is that?), "Esa vaina está buena" (that thing is good), "No me vengas con esa vaina" (don\'t come at me with that). Shows how context changes meaning completely. Compares to English "thing" or "stuff" but MORE versatile.',
    cta: 'Learn REAL Dominican Spanish — not textbook Spanish. ConnectWorld AI teaches you how people ACTUALLY talk 🗣️',
    textOverlays: ['🇩🇴 VAINA = thing/stuff/everything', '"Pásame esa vaina" = Pass me that thing', '"¿Qué vaina?" = What the...?', 'One word, infinite meanings 😂'],
    musicSuggestion: 'Dembow beat (Dominican music)',
    visualNotes: 'Dominican flag colors. Sofía in casual setting. Multiple quick cuts showing different scenarios where "vaina" is used. Funny reactions.',
    hashtags: ['#dominican', '#dominicanspanish', '#vaina', '#learnspanish', '#connectworldai', '#caribbean', '#rd', '#spanishslang'],
    targetLanguage: 'spanish',
    difficulty: 'intermediate',
    scheduledDay: 3,
    scheduledTime: '7pm',
  },
  
  // ===== DAY 4 =====
  {
    id: 'CMAI-010',
    pillar: 'pronunciation_challenge',
    title: 'BEACH vs B*TCH — One wrong sound and... 😳🏖️',
    avatar: 'carlos_mx',
    platform: 'all',
    duration: 35,
    hook: 'This pronunciation mistake has EMBARRASSED every Spanish speaker at least once 😳',
    body: 'Carlos explains the short I vs long E: BEACH (biich) = playa, vs the other word (bich). "The difference is how LONG you hold the E sound. BEEEACH = long. B-ich = short. Practice: SHEET vs... you know. SEAT vs... yeah." Makes it funny but educational.',
    cta: 'Our AI catches these mistakes BEFORE you make them in public 😅 ConnectWorld AI',
    textOverlays: ['🏖️ BEACH = "biiiich" (long E)', '😳 B*TCH = "bich" (short I)', '⚠️ Hold the E longer!', 'SHEET vs SH*T — same rule'],
    musicSuggestion: 'Comedy "uh oh" sound effect',
    visualNotes: 'Beach photo vs censored word. Exaggerated mouth showing long vs short vowel. Funny embarrassment reaction. Keep it PG-13 but relatable.',
    hashtags: ['#pronunciation', '#embarrassing', '#ingles', '#aprendeingles', '#connectworldai', '#beachvs', '#englishmistakes'],
    targetLanguage: 'english',
    difficulty: 'beginner',
    scheduledDay: 4,
    scheduledTime: '7am',
  },
  {
    id: 'CMAI-011',
    pillar: 'say_this_when',
    title: 'Say THIS at a job interview in English 💼',
    avatar: 'sofia_dr',
    platform: 'all',
    duration: 50,
    hook: 'You got the interview... now DON\'T blow it with bad English 💼',
    body: 'Sofía teaches interview phrases: 1) "I\'m passionate about..." (not "I like") 2) "In my previous role, I..." (not "Before, I...") 3) "I\'m a quick learner" (ai em a cuik lerner) 4) "I work well under pressure" (ai work uel under presher) 5) "When can I start?" (confident close). Each with phonetic guide and what NOT to say.',
    cta: 'Practice your interview with our AI — it asks real questions and gives feedback 💪',
    textOverlays: ['💼 Job Interview English', '❌ "I like work" → ✅ "I\'m passionate about..."', '❌ "Before I..." → ✅ "In my previous role..."', '💪 "When can I start?"'],
    musicSuggestion: 'Professional/corporate subtle beat',
    visualNotes: 'Office/interview setting. Split screen: wrong answer (casual) vs right answer (professional). Dress code visual cue (casual → suit).',
    hashtags: ['#jobinterview', '#inglesparatrabajo', '#careeradvice', '#connectworldai', '#aprendeingles', '#interviewtips', '#workabroad'],
    targetLanguage: 'english',
    difficulty: 'intermediate',
    scheduledDay: 4,
    scheduledTime: '12pm',
  },
  {
    id: 'CMAI-012',
    pillar: 'slang_of_the_day',
    title: '¿Qué significa "lowkey"? 🤫',
    avatar: 'sofia_dr',
    platform: 'all',
    duration: 30,
    hook: 'Americans say "lowkey" 50 times a day — here\'s what it ACTUALLY means 🤫',
    body: 'Sofía explains: "Lowkey" = secretamente, un poco, discretamente. "I lowkey love that song" = "Secretamente me encanta esa canción". "Lowkey hungry" = "Tengo un poco de hambre". Opposite: "Highkey" = openly, obviously. "I highkey need a vacation" = "Obviamente necesito vacaciones".',
    cta: 'New slang every single day in ConnectWorld AI — never feel lost in conversation again 🔥',
    textOverlays: ['🤫 LOWKEY = secretamente / un poco', '"I lowkey love it" = Me gusta en secreto', '📢 HIGHKEY = obviamente', '"I highkey need sleep" = Obvio necesito dormir'],
    musicSuggestion: 'Chill trap beat',
    visualNotes: 'Whisper visual for "lowkey" (finger on lips), megaphone visual for "highkey". Text message style examples.',
    hashtags: ['#lowkey', '#americanslang', '#ingles', '#slangoftheday', '#connectworldai', '#genzenglish', '#aprendeingles'],
    targetLanguage: 'english',
    difficulty: 'beginner',
    scheduledDay: 4,
    scheduledTime: '7pm',
  },
  
  // ===== DAY 5 =====
  {
    id: 'CMAI-013',
    pillar: 'pronunciation_challenge',
    title: 'How Americans ACTUALLY say "I\'m going to" 🇺🇸',
    avatar: 'sofia_dr',
    platform: 'all',
    duration: 35,
    hook: 'Nobody in America says "I am going to" — they say THIS 👇',
    body: 'Sofía demonstrates speech linking: "I\'m going to" → "I\'m gonna" → "Imma". Level 1: "I\'m gonna go" (aim gana gou). Level 2: "Imma head out" (aima jed aut). Level 3: "I\'mma tell you something" (aima tel yu somtin). Shows how formal → casual → street.',
    cta: 'Learn how Americans REALLY talk — not textbook English. ConnectWorld AI 🎯',
    textOverlays: ['📖 "I am going to" (textbook)', '🗣️ "I\'m gonna" (normal)', '😎 "Imma" (street)', 'Americans NEVER say the full version'],
    musicSuggestion: 'None — clean audio',
    visualNotes: 'Three levels shown as stairs: formal at top, street at bottom. Phonetic guide for each. Speed comparison showing how fast Americans actually speak.',
    hashtags: ['#gonna', '#imma', '#americanenglish', '#realspeech', '#connectworldai', '#aprendeingles', '#pronunciation'],
    targetLanguage: 'english',
    difficulty: 'beginner',
    scheduledDay: 5,
    scheduledTime: '7am',
  },
  {
    id: 'CMAI-014',
    pillar: 'say_this_when',
    title: 'Di ESTO cuando te pidan tu número en español 😏📱',
    avatar: 'maya_us',
    platform: 'all',
    duration: 40,
    hook: 'Someone cute asks for your number in Spanish... don\'t freeze 😏',
    body: 'Maya teaches flirty/social number exchange: "Mi número es..." (basic), "Te lo mando por WhatsApp" (I\'ll send it on WhatsApp — more natural), "Dame el tuyo primero" (Give me yours first — confident), "¿Tienes Instagram?" (Do you have IG? — modern alternative). Pronunciation for each.',
    cta: 'Practice flirting in Spanish with our AI — zero embarrassment, 100% confidence 😂',
    textOverlays: ['📱 "Mi número es..."', '💬 "Te lo mando por WhatsApp"', '😏 "Dame el tuyo primero"', '📸 "¿Tienes Instagram?"'],
    musicSuggestion: 'Reggaeton beat (low volume)',
    visualNotes: 'Bar/social setting (green screen). Maya role-plays both sides. Playful energy. Phone prop.',
    hashtags: ['#learnspanish', '#flirtinginspanish', '#spanishphrases', '#connectworldai', '#datinginspanish', '#spanishforbeginners'],
    targetLanguage: 'spanish',
    difficulty: 'beginner',
    scheduledDay: 5,
    scheduledTime: '12pm',
  },
  {
    id: 'CMAI-015',
    pillar: 'ai_demo',
    title: 'I translated a Bad Bunny song in REAL TIME 🐰🎵',
    avatar: 'maya_us',
    platform: 'all',
    duration: 60,
    hook: 'I finally understand what Bad Bunny is saying... and WOW 🐰🔥',
    body: 'Maya uses ConnectWorld AI song translation feature: plays a Bad Bunny clip, app shows line-by-line translation with slang explanations. "Wait — THAT\'S what \'perreo\' means?!" Shows vocabulary being added to her learning deck automatically. "Now when I hear the song, I actually understand every word."',
    cta: 'Translate ANY song and learn the slang. ConnectWorld AI — link in bio 🎵',
    textOverlays: ['🎵 Bad Bunny lyric: "Yo perreo sola"', '📖 Translation: "I dance alone"', '🤓 Cultural note: perreo = reggaeton dancing', '✅ Added to my vocabulary deck'],
    musicSuggestion: 'Bad Bunny instrumental (fair use clip)',
    visualNotes: 'Screen recording of app translating lyrics. Maya reacting to meanings. Split: Spanish lyric on left, English translation on right. Vocabulary cards popping up.',
    hashtags: ['#badbunny', '#spanishmusic', '#songtranslation', '#connectworldai', '#learnspanish', '#reggaeton', '#musiclearning'],
    targetLanguage: 'spanish',
    difficulty: 'intermediate',
    scheduledDay: 5,
    scheduledTime: '7pm',
  },
  
  // ===== DAY 6 =====
  {
    id: 'CMAI-016',
    pillar: 'confusing_words',
    title: 'KITCHEN vs CHICKEN — Why do Spanish speakers confuse these? 🍗🍳',
    avatar: 'sofia_dr',
    platform: 'all',
    duration: 35,
    hook: '"I\'m going to the chicken" — if you\'ve said this, this video is for you 😂🍗',
    body: 'Sofía explains: KITCHEN (kichen) = cocina, CHICKEN (chiken) = pollo. "The difference is the first sound: K vs CH. KITCHEN starts with K (like key). CHICKEN starts with CH (like church)." Practice pairs: kitchen/chicken, ship/chip, share/chair.',
    cta: 'Our AI drills these pairs until you NEVER confuse them again 💪',
    textOverlays: ['🍳 KITCHEN = (kichen) = cocina', '🍗 CHICKEN = (chiken) = pollo', 'K sound vs CH sound', '❌ "I\'m in the chicken" 😂'],
    musicSuggestion: 'Funny sound effect for the mistake',
    visualNotes: 'Kitchen photo vs chicken photo. Animated swap between them. Mouth close-up for K vs CH. Funny scenario of someone saying "I\'m in the chicken."',
    hashtags: ['#kitchenvschicken', '#pronunciation', '#ingles', '#aprendeingles', '#connectworldai', '#englishmistakes', '#funny'],
    targetLanguage: 'english',
    difficulty: 'beginner',
    scheduledDay: 6,
    scheduledTime: '7am',
  },
  {
    id: 'CMAI-017',
    pillar: 'quiz_challenge',
    title: '¿Puedes adivinar estos 5 modismos en español? 🧠🇲🇽',
    avatar: 'james_us',
    platform: 'all',
    duration: 55,
    hook: 'My Spanish teacher taught me these 5 idioms and I got 0 right the first time 😭',
    body: 'James shows 5 Spanish idioms: 1) "Estar en las nubes" (to be in the clouds = daydreaming), 2) "Meter la pata" (to put your foot in it = make a mistake), 3) "Ser pan comido" (to be eaten bread = easy/piece of cake), 4) "Tomar el pelo" (to take the hair = to joke/mess with someone), 5) "Dar en el clavo" (to hit the nail = to get it right). James guesses wrong, then learns.',
    cta: 'I practice idioms every day with ConnectWorld AI — my teacher Sofia is ruthless 😂',
    textOverlays: ['🌥️ "Estar en las nubes" = ?', '🦶 "Meter la pata" = ?', '🍞 "Ser pan comido" = ?', '💇 "Tomar el pelo" = ?', '🔨 "Dar en el clavo" = ?'],
    musicSuggestion: 'Game show music',
    visualNotes: 'James reacting to each idiom. Literal visual (clouds, bread, hair) vs actual meaning. Score counter. Funny wrong guesses.',
    hashtags: ['#spanishidioms', '#learnspanish', '#modismos', '#connectworldai', '#spanishquiz', '#languagelearning'],
    targetLanguage: 'spanish',
    difficulty: 'intermediate',
    scheduledDay: 6,
    scheduledTime: '12pm',
  },
  {
    id: 'CMAI-018',
    pillar: 'slang_of_the_day',
    title: 'What does "sus" mean? 🧐 (It\'s NOT what you think)',
    avatar: 'maya_us',
    platform: 'all',
    duration: 30,
    hook: 'If someone calls you "sus" in English... should you be worried? 🧐',
    body: 'Maya explains: "Sus" = suspicious, sketchy, not trustworthy. From Among Us game but now used everywhere. "That\'s sus" = "Eso es sospechoso". "He\'s acting sus" = "Está actuando raro/sospechoso". "Don\'t be sus" = "No seas raro". Shows real examples from texts/DMs.',
    cta: 'Gen-Z slang updated DAILY in ConnectWorld AI — stay relevant 🔥',
    textOverlays: ['🧐 SUS = suspicious / sospechoso', '"That\'s kinda sus" = Eso es sospechoso', 'Origin: Among Us 🎮', 'Now used for ANYTHING sketchy'],
    musicSuggestion: 'Among Us sound effect',
    visualNotes: 'Among Us character visual. Text message screenshots showing "sus" in context. Maya demonstrating in conversation.',
    hashtags: ['#sus', '#amongus', '#genzenglish', '#slangoftheday', '#connectworldai', '#americanslang', '#learnEnglish'],
    targetLanguage: 'english',
    difficulty: 'beginner',
    scheduledDay: 6,
    scheduledTime: '7pm',
  },
  
  // ===== DAY 7 =====
  {
    id: 'CMAI-019',
    pillar: 'pronunciation_challenge',
    title: 'How to roll your R\'s if you\'re American 🇺🇸→🇪🇸',
    avatar: 'james_us',
    platform: 'all',
    duration: 45,
    hook: 'I couldn\'t roll my R\'s for 6 MONTHS... then I learned this trick 👅',
    body: 'James teaches the rolled R for English speakers: "Say \'butter\' fast — that D sound in the middle? That\'s actually close to a Spanish R. Now say \'ladder\' fast. Feel that tap? Make it faster: la-la-la-la → rrrrr." Shows tongue position. Demonstrates progress from Day 1 (terrible) to now (decent).',
    cta: 'ConnectWorld AI scored my R at 45% on Day 1... now I\'m at 78% 📈 Link in bio',
    textOverlays: ['🇺🇸 Americans CAN roll R\'s', 'Trick: Say "butter" fast → hear the R?', 'Practice: la-la-la-la → rrrr', 'My score: 45% → 78% in 2 weeks'],
    musicSuggestion: 'Motivational beat',
    visualNotes: 'James practicing, failing, then succeeding. Progress bar graphic. Tongue diagram. Before/after audio comparison.',
    hashtags: ['#rolledR', '#spanishpronunciation', '#learnspanish', '#connectworldai', '#languagelearning', '#spanishforbeginners'],
    targetLanguage: 'spanish',
    difficulty: 'beginner',
    scheduledDay: 7,
    scheduledTime: '7am',
  },
  {
    id: 'CMAI-020',
    pillar: 'say_this_when',
    title: 'Say THIS when someone speaks too fast in English ⚡',
    avatar: 'sofia_dr',
    platform: 'all',
    duration: 40,
    hook: 'Americans talk SO FAST — here\'s how to slow them down WITHOUT sounding dumb 💪',
    body: 'Sofía teaches speed-control phrases: 1) "Could you slow down a bit?" (cud yu slou daun a bit) 2) "Sorry, you lost me at..." (sori, yu lost mi at...) 3) "One more time, slower?" (wuan mor taim, slouer) 4) "I got the first part but..." (ai got de ferst part bot...) 5) "Can you text me that?" (can yu text mi dat) — the modern solution!',
    cta: 'Practice with AI that adjusts speed to YOUR level. ConnectWorld AI 🎯',
    textOverlays: ['⚡ When Americans talk too fast:', '✅ "Could you slow down a bit?"', '✅ "Sorry, you lost me at..."', '✅ "Can you text me that?" 📱'],
    musicSuggestion: 'Fast-forwarded speech sound effect at start',
    visualNotes: 'Start with sped-up English (overwhelming). Then Sofía "pauses" it and teaches control phrases. Calm vs panicked visual contrast.',
    hashtags: ['#fastenglish', '#speakenglish', '#ingles', '#aprendeingles', '#connectworldai', '#englishphrases', '#confidence'],
    targetLanguage: 'english',
    difficulty: 'beginner',
    scheduledDay: 7,
    scheduledTime: '12pm',
  },
  {
    id: 'CMAI-021',
    pillar: 'ai_demo',
    title: 'Watch me learn 10 words in 60 seconds with AI flashcards ⚡📚',
    avatar: 'james_us',
    platform: 'all',
    duration: 60,
    hook: 'Can I learn 10 new Spanish words in 60 seconds? Let\'s find out ⏱️',
    body: 'James speed-runs ConnectWorld AI flashcard feature: Shows 10 vocabulary cards flipping rapidly. He pronounces each, gets instant score. Gets 7/10 right. "The ones I missed go into my weak words deck and come back tomorrow." Shows spaced repetition in action.',
    cta: 'Free flashcards that actually work. ConnectWorld AI — link in bio ⚡',
    textOverlays: ['⏱️ 60 SECOND CHALLENGE', '1. Mariposa = butterfly ✅', '2. Madrugada = dawn ✅', '3. Estrenar = to use for first time ❌', 'Score: 7/10 — not bad!'],
    musicSuggestion: 'Timer ticking sound, upbeat',
    visualNotes: 'Split screen: timer on top, flashcards flipping below. Green flash for correct, red for wrong. Final score reveal. Speed-run energy.',
    hashtags: ['#flashcards', '#learnspanish', '#vocabulary', '#connectworldai', '#60secondchallenge', '#spanishwords', '#languagelearning'],
    targetLanguage: 'spanish',
    difficulty: 'beginner',
    scheduledDay: 7,
    scheduledTime: '7pm',
  },
];

// ============================================================
// POSTING SCHEDULE & ALGORITHM OPTIMIZATION
// ============================================================

export const POSTING_STRATEGY = {
  // Frequency
  postsPerDay: 3,
  platforms: ['tiktok', 'instagram_reels', 'youtube_shorts'] as const,
  
  // Optimal posting times (EST — covers Caribbean + East Coast US)
  postingTimes: {
    morning: '7:00 AM EST',    // Caribbean waking up, US commute
    midday: '12:00 PM EST',    // Lunch break engagement peak
    evening: '7:00 PM EST',    // After work/school, prime scroll time
  },
  
  // Algorithm optimization (2026 TikTok/Reels best practices)
  algorithmRules: {
    hookWindow: 3,              // Must hook viewer in first 3 seconds
    idealDuration: { min: 30, max: 60 }, // Sweet spot for educational content
    completionRateTarget: 0.7,  // 70% watch-through = algorithm boost
    replayability: true,        // Content should be worth watching twice
    saveability: true,          // Content worth saving (bookmarking)
    commentBait: true,          // Ask questions to drive comments
    shareability: true,         // Make it easy to tag a friend
  },
  
  // Content rotation rules
  rotationRules: {
    neverPostSamePillarBackToBack: true,
    maxSameAvatarPerDay: 2,
    alwaysIncludeOneCTA: true,
    spanishAndEnglishAlternate: true, // Don't post 3 English lessons in a row
    weekendContent: 'lighter',  // More memes, slang, cultural on weekends
  },
  
  // Growth targets
  growthTargets: {
    week1: { followers: 500, views: 50000 },
    month1: { followers: 5000, views: 500000 },
    month3: { followers: 25000, views: 2000000 },
    month6: { followers: 100000, views: 10000000 },
  },
  
  // Engagement tactics
  engagementTactics: [
    'End every video with a question (drives comments)',
    'Use "Comment your score" for quiz content',
    'Reply to EVERY comment in first hour (algorithm boost)',
    'Pin a comment with the app link',
    'Create response videos to top comments',
    'Duet/stitch with partner creators',
    'Use trending sounds when they fit naturally',
    'Post behind-the-scenes of AI avatar creation',
  ],
  
  // Hashtag strategy
  hashtagStrategy: {
    branded: ['#connectworldai'],
    primary: ['#learnspanish', '#learnenglish', '#aprendeingles'],
    secondary: ['#languagelearning', '#bilingual', '#spanishteacher'],
    trending: [], // Updated weekly based on platform trends
    niche: ['#dominicanspanish', '#mexicanspanish', '#americanslang'],
    maxPerPost: 7, // Don't over-hashtag (looks spammy)
  },
};

// ============================================================
// CONTENT GENERATION PIPELINE
// ============================================================

export interface ContentGenerationJob {
  scriptId: string;
  avatar: ContentAvatar;
  script: ContentScript;
  productionTool: 'kling' | 'heygen' | 'elevenlabs';
  estimatedCost: number;
  priority: 'urgent' | 'normal' | 'batch';
  status: 'queued' | 'generating' | 'review' | 'approved' | 'posted';
}

/**
 * Generate production jobs for a batch of content scripts
 */
export function generateProductionJobs(scripts: ContentScript[]): ContentGenerationJob[] {
  return scripts.map(script => {
    const avatar = CONTENT_AVATARS.find(a => a.id === script.avatar);
    if (!avatar) throw new Error(`Avatar not found: ${script.avatar}`);
    
    // Cost estimation per video
    const baseCost = avatar.productionTool === 'heygen' ? 0.50 :
                     avatar.productionTool === 'elevenlabs' ? 0.35 :
                     0.25; // kling
    const durationMultiplier = script.duration / 30; // 30 sec = 1x, 60 sec = 2x
    
    return {
      scriptId: script.id,
      avatar,
      script,
      productionTool: avatar.productionTool,
      estimatedCost: baseCost * durationMultiplier,
      priority: script.scheduledDay <= 2 ? 'urgent' : 'normal',
      status: 'queued' as const,
    };
  });
}

/**
 * Calculate total production cost for a batch
 */
export function calculateBatchCost(scripts: ContentScript[]): {
  totalCost: number;
  costPerVideo: number;
  totalDuration: number;
  videoCount: number;
} {
  const jobs = generateProductionJobs(scripts);
  const totalCost = jobs.reduce((sum, job) => sum + job.estimatedCost, 0);
  const totalDuration = scripts.reduce((sum, s) => sum + s.duration, 0);
  
  return {
    totalCost: Math.round(totalCost * 100) / 100,
    costPerVideo: Math.round((totalCost / scripts.length) * 100) / 100,
    totalDuration,
    videoCount: scripts.length,
  };
}

// Week 1 cost estimate
export const WEEK_1_COST_ESTIMATE = calculateBatchCost(WEEK_1_CONTENT_BATCH);
// Expected: ~$15-20 for 21 videos (very affordable content production)
