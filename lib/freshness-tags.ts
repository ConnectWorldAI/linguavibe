/**
 * Regional Freshness Tags — Mark vocabulary as current/trending/classic/outdated
 * so learners know what's actually used TODAY vs. textbook-only language.
 *
 * Tags:
 * - 🔥 TRENDING: Currently popular, especially among young people (e.g., "bruh", "slay")
 * - ✅ CURRENT: Widely used in everyday speech right now
 * - 📚 CLASSIC: Still understood but sounds formal/old-fashioned
 * - ⚠️ OUTDATED: Rarely used, may confuse native speakers if you use it
 * - 🌍 REGIONAL: Only used in specific regions/countries
 * - 📖 TEXTBOOK: Taught in schools but rarely used in real conversation
 */

export type FreshnessLevel = "trending" | "current" | "classic" | "outdated" | "regional" | "textbook";

export interface FreshnessTag {
  word: string;              // The word/phrase in target language
  translation: string;       // English translation
  freshness: FreshnessLevel;
  region?: string;           // Which region/country this applies to
  alternative?: string;      // What people actually say instead (for outdated/textbook)
  note?: string;             // Context about usage
  yearPopularized?: number;  // When it became popular (for trending)
  ageGroup?: string;         // Which age group uses it (e.g., "Gen Z", "30+", "all ages")
}

export interface RegionalVocabulary {
  languageCode: string;
  region: string;
  vocabulary: FreshnessTag[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPANISH FRESHNESS TAGS
// ═══════════════════════════════════════════════════════════════════════════════

const SPANISH_DOMINICAN_TAGS: FreshnessTag[] = [
  // TRENDING
  { word: "tá to'", translation: "everything's cool / it's all good", freshness: "trending", region: "DR", note: "Shortened from 'está todo bien'. Used constantly in casual speech.", ageGroup: "Gen Z / Millennials" },
  { word: "klok", translation: "cool / understood", freshness: "trending", region: "DR", note: "From English 'clock' — means 'on time' / 'got it'. Social media slang.", ageGroup: "Gen Z", yearPopularized: 2020 },
  { word: "toy loco/a", translation: "I'm crazy about it / I love it", freshness: "trending", region: "DR", note: "Used to express excitement. 'Toy loco con esa canción'", ageGroup: "all ages" },
  { word: "jevi", translation: "cool / awesome", freshness: "trending", region: "DR", note: "From English 'heavy'. Very common in DR slang.", ageGroup: "Millennials / Gen Z" },
  // CURRENT
  { word: "¿Qué lo que?", translation: "What's up?", freshness: "current", region: "DR", note: "THE Dominican greeting. Used by everyone, everywhere.", ageGroup: "all ages" },
  { word: "vaina", translation: "thing / stuff / situation", freshness: "current", region: "DR", note: "Universal word for anything. 'Pásame esa vaina' = 'Pass me that thing'", ageGroup: "all ages" },
  { word: "tigre/tiguere", translation: "street-smart person / hustler", freshness: "current", region: "DR", note: "Can be compliment or insult depending on context.", ageGroup: "all ages" },
  { word: "chin", translation: "a little bit", freshness: "current", region: "DR", note: "'Dame un chin' = 'Give me a little'. Very Dominican.", ageGroup: "all ages" },
  { word: "colmado", translation: "corner store / bodega", freshness: "current", region: "DR", note: "Social hub of every neighborhood. Where you buy everything.", ageGroup: "all ages" },
  { word: "guagua", translation: "bus", freshness: "current", region: "DR", note: "In Spain 'guagua' means baby. In DR/Cuba/PR it means bus.", ageGroup: "all ages" },
  // CLASSIC
  { word: "pariguayo", translation: "boring person / party pooper", freshness: "classic", region: "DR", note: "From 'party watcher' (American soldiers who watched but didn't dance). Still used but less common.", ageGroup: "30+", alternative: "aburrido" },
  { word: "bacano", translation: "cool / great", freshness: "classic", region: "DR", note: "Still understood but 'jevi' and 'klok' are more current.", ageGroup: "30+", alternative: "jevi" },
  // OUTDATED
  { word: "¡Coño!", translation: "damn! / wow!", freshness: "current", region: "DR", note: "Still very current in DR (unlike Spain where it's vulgar). Used as exclamation.", ageGroup: "all ages" },
  // TEXTBOOK
  { word: "¿Cómo está usted?", translation: "How are you? (formal)", freshness: "textbook", region: "DR", note: "Textbooks teach this but Dominicans say '¿Qué lo que?' or '¿Cómo tú tá?'", alternative: "¿Qué lo que? / ¿Cómo tú tá?" },
  { word: "autobús", translation: "bus", freshness: "textbook", region: "DR", note: "Textbook Spanish. In DR everyone says 'guagua'.", alternative: "guagua" },
];

const SPANISH_COLOMBIAN_TAGS: FreshnessTag[] = [
  // TRENDING
  { word: "parcero/a", translation: "buddy / friend", freshness: "trending", region: "CO", note: "Short form 'parce' is even more current. Medellín origin, now nationwide.", ageGroup: "Gen Z / Millennials" },
  { word: "gonorrea", translation: "awesome / terrible (context-dependent)", freshness: "trending", region: "CO", note: "Vulgar but extremely common in Medellín. Can mean great or terrible.", ageGroup: "Gen Z", yearPopularized: 2018 },
  { word: "visaje", translation: "showing off / being extra", freshness: "trending", region: "CO", note: "'No sea visajoso' = 'Don't be extra'", ageGroup: "Gen Z / Millennials" },
  // CURRENT
  { word: "¿Qué más?", translation: "What's up? / How are you?", freshness: "current", region: "CO", note: "THE Colombian greeting. Equivalent to DR's '¿Qué lo que?'", ageGroup: "all ages" },
  { word: "bacano", translation: "cool / awesome", freshness: "current", region: "CO", note: "Very Colombian. Used constantly.", ageGroup: "all ages" },
  { word: "chimba", translation: "awesome / cool (vulgar)", freshness: "current", region: "CO", note: "Vulgar origin but widely used. '¡Qué chimba!' = 'How awesome!'", ageGroup: "Millennials / Gen Z" },
  { word: "parce", translation: "dude / bro", freshness: "current", region: "CO", note: "Short for 'parcero'. Used in every sentence in Medellín.", ageGroup: "all ages" },
  { word: "a la orden", translation: "at your service / you're welcome", freshness: "current", region: "CO", note: "Said by shopkeepers, taxi drivers, everyone. Very polite Colombian culture.", ageGroup: "all ages" },
  // CLASSIC
  { word: "chévere", translation: "cool / great", freshness: "classic", region: "CO", note: "Still used but 'bacano' is more Colombian. 'Chévere' is pan-Latin.", ageGroup: "30+", alternative: "bacano" },
  // TEXTBOOK
  { word: "¿Cómo está?", translation: "How are you?", freshness: "textbook", region: "CO", note: "Textbook. Colombians say '¿Qué más?' or '¿Qué hubo?' (shortened to '¿Quiubo?')", alternative: "¿Qué más? / ¿Quiubo?" },
];

const SPANISH_CUBAN_TAGS: FreshnessTag[] = [
  // TRENDING
  { word: "asere", translation: "dude / bro", freshness: "current", region: "CU", note: "THE Cuban word for friend. 'Asere, ¿qué bolá?' = 'Dude, what's up?'", ageGroup: "all ages" },
  { word: "¿Qué bolá?", translation: "What's up?", freshness: "current", region: "CU", note: "THE Cuban greeting. Everyone uses it.", ageGroup: "all ages" },
  { word: "acere", translation: "friend / buddy", freshness: "current", region: "CU", note: "Variant of 'asere'. Afro-Cuban origin (Abakuá secret society).", ageGroup: "all ages" },
  // CURRENT
  { word: "yuma", translation: "foreigner / American / abroad", freshness: "current", region: "CU", note: "'Irse pa' la yuma' = 'To leave for the US'. From the movie '3:10 to Yuma'.", ageGroup: "all ages" },
  { word: "jama", translation: "food", freshness: "current", region: "CU", note: "'Vamos a jamar' = 'Let's eat'. Very Cuban.", ageGroup: "all ages" },
  { word: "pinchar", translation: "to work", freshness: "current", region: "CU", note: "'Voy a pinchar' = 'I'm going to work'. Standard in Cuba.", ageGroup: "all ages" },
  { word: "guagua", translation: "bus", freshness: "current", region: "CU", note: "Same as DR and PR. Not used in other Latin American countries.", ageGroup: "all ages" },
  // TEXTBOOK
  { word: "trabajar", translation: "to work", freshness: "textbook", region: "CU", note: "Correct but Cubans say 'pinchar' in everyday speech.", alternative: "pinchar" },
];

const SPANISH_COSTA_RICAN_TAGS: FreshnessTag[] = [
  // TRENDING
  { word: "mae", translation: "dude / bro", freshness: "current", region: "CR", note: "Used in EVERY sentence. 'Mae, ¿qué mae?' Both greeting and filler word.", ageGroup: "all ages" },
  { word: "tuanis", translation: "cool / awesome", freshness: "current", region: "CR", note: "From Malespín code (reversed syllables of 'buenas'). Very Tico.", ageGroup: "all ages" },
  { word: "pura vida", translation: "pure life / everything's great / hello / goodbye / thanks", freshness: "current", region: "CR", note: "THE Costa Rican phrase. Used for everything. National motto.", ageGroup: "all ages" },
  // CURRENT
  { word: "diay", translation: "well... / so... / what can you do", freshness: "current", region: "CR", note: "Filler word. 'Diay, mae, ¿qué hacemos?' = 'So, dude, what do we do?'", ageGroup: "all ages" },
  { word: "tico/a", translation: "Costa Rican person", freshness: "current", region: "CR", note: "Self-identifier. From the diminutive '-tico' (instead of '-tito').", ageGroup: "all ages" },
  { word: "brete", translation: "work / job", freshness: "current", region: "CR", note: "'Tengo brete' = 'I have work'. Very Tico.", ageGroup: "all ages" },
  { word: "jupa", translation: "head", freshness: "current", region: "CR", note: "'Me duele la jupa' = 'My head hurts'.", ageGroup: "all ages" },
  // TEXTBOOK
  { word: "amigo", translation: "friend", freshness: "textbook", region: "CR", note: "Correct but Ticos say 'mae' for everything.", alternative: "mae" },
];

const SPANISH_ARGENTINE_TAGS: FreshnessTag[] = [
  // TRENDING
  { word: "re", translation: "very / super (intensifier)", freshness: "trending", region: "AR", note: "'Está re bueno' = 'It's super good'. Used before any adjective.", ageGroup: "Gen Z / Millennials", yearPopularized: 2015 },
  { word: "flashear", translation: "to trip out / to be delusional", freshness: "trending", region: "AR", note: "'Estás flasheando' = 'You're tripping'. From English 'flash'.", ageGroup: "Gen Z", yearPopularized: 2019 },
  // CURRENT
  { word: "che", translation: "hey / dude (attention-getter)", freshness: "current", region: "AR", note: "THE Argentine word. Used to get attention. 'Che, vení acá'.", ageGroup: "all ages" },
  { word: "boludo/a", translation: "dude / idiot (context-dependent)", freshness: "current", region: "AR", note: "Between friends = 'dude'. To strangers = insult. Used every 3 words.", ageGroup: "all ages" },
  { word: "laburo", translation: "work / job", freshness: "current", region: "AR", note: "From Italian 'lavoro'. 'Tengo mucho laburo' = 'I have a lot of work'.", ageGroup: "all ages" },
  { word: "morfi", translation: "food", freshness: "current", region: "AR", note: "Lunfardo (Buenos Aires slang). 'Vamos a morfar' = 'Let's eat'.", ageGroup: "all ages" },
  { word: "afanar", translation: "to steal / to work hard", freshness: "current", region: "AR", note: "Two meanings! Context matters. 'Me afanaron el celular' = 'They stole my phone'.", ageGroup: "all ages" },
  { word: "vos", translation: "you (informal)", freshness: "current", region: "AR", note: "Argentina uses 'vos' instead of 'tú'. 'Vos sabés' not 'Tú sabes'.", ageGroup: "all ages" },
  // CLASSIC
  { word: "pibe/piba", translation: "kid / young person", freshness: "current", region: "AR", note: "Still very current. 'El pibe de al lado' = 'The kid next door'.", ageGroup: "all ages" },
  // TEXTBOOK
  { word: "tú", translation: "you (informal)", freshness: "textbook", region: "AR", note: "Textbooks teach 'tú' but Argentines ONLY use 'vos'. Using 'tú' sounds foreign.", alternative: "vos" },
  { word: "trabajo", translation: "work", freshness: "textbook", region: "AR", note: "Correct but Argentines say 'laburo' in everyday speech.", alternative: "laburo" },
];

const SPANISH_PERUVIAN_TAGS: FreshnessTag[] = [
  // TRENDING
  { word: "causa", translation: "buddy / friend", freshness: "current", region: "PE", note: "'¿Qué tal, causa?' = 'What's up, buddy?' Very Peruvian.", ageGroup: "all ages" },
  { word: "pata", translation: "friend / buddy", freshness: "current", region: "PE", note: "'Es mi pata' = 'He's my friend'. Universal in Peru.", ageGroup: "all ages" },
  // CURRENT
  { word: "chévere", translation: "cool / great", freshness: "current", region: "PE", note: "Still very current in Peru (unlike Colombia where 'bacano' replaced it).", ageGroup: "all ages" },
  { word: "jato", translation: "house / home", freshness: "current", region: "PE", note: "'Vamos a mi jato' = 'Let's go to my house'.", ageGroup: "Millennials / Gen Z" },
  { word: "chamba", translation: "work / job", freshness: "current", region: "PE", note: "'Tengo chamba' = 'I have work'. Very common.", ageGroup: "all ages" },
  { word: "al toque", translation: "right away / immediately", freshness: "current", region: "PE", note: "'Vengo al toque' = 'I'm coming right now'.", ageGroup: "all ages" },
  // TEXTBOOK
  { word: "inmediatamente", translation: "immediately", freshness: "textbook", region: "PE", note: "Correct but Peruvians say 'al toque' in conversation.", alternative: "al toque" },
];

const SPANISH_CHILEAN_TAGS: FreshnessTag[] = [
  // TRENDING
  { word: "la wea", translation: "the thing (vulgar, universal)", freshness: "trending", region: "CL", note: "Chileans use 'wea/weá/huevá' for EVERYTHING. 'Pásame la wea' = 'Pass me the thing'.", ageGroup: "all ages" },
  { word: "fome", translation: "boring / lame", freshness: "current", region: "CL", note: "'Está fome' = 'It's boring'. Very Chilean.", ageGroup: "all ages" },
  // CURRENT
  { word: "cachai", translation: "you know? / you get it?", freshness: "current", region: "CL", note: "From English 'to catch'. Used at the end of every sentence. '¿Cachai?'", ageGroup: "all ages" },
  { word: "po", translation: "emphatic particle (pues)", freshness: "current", region: "CL", note: "Added to everything. 'Sí po', 'No po', 'Ya po'. THE Chilean marker.", ageGroup: "all ages" },
  { word: "pololo/a", translation: "boyfriend/girlfriend", freshness: "current", region: "CL", note: "Only in Chile. From Mapuche language.", ageGroup: "all ages" },
  { word: "al tiro", translation: "right away", freshness: "current", region: "CL", note: "'Lo hago al tiro' = 'I'll do it right away'.", ageGroup: "all ages" },
  { word: "bacán", translation: "cool / awesome", freshness: "current", region: "CL", note: "Chilean version of 'bacano'. Very common.", ageGroup: "all ages" },
  // TEXTBOOK
  { word: "novio/a", translation: "boyfriend/girlfriend", freshness: "textbook", region: "CL", note: "Textbook Spanish. Chileans say 'pololo/a'.", alternative: "pololo/a" },
  { word: "¿Entiendes?", translation: "Do you understand?", freshness: "textbook", region: "CL", note: "Textbook. Chileans say '¿Cachai?'", alternative: "¿Cachai?" },
];

const SPANISH_PUERTO_RICAN_TAGS: FreshnessTag[] = [
  // TRENDING
  { word: "brutal", translation: "awesome / amazing", freshness: "trending", region: "PR", note: "'Eso está brutal' = 'That's amazing'. Very current.", ageGroup: "Gen Z / Millennials" },
  { word: "gufear", translation: "to joke around / to mess around", freshness: "trending", region: "PR", note: "From English 'goof'. 'Estamos gufeando' = 'We're just messing around'.", ageGroup: "Gen Z / Millennials" },
  // CURRENT
  { word: "wepa", translation: "awesome! / let's go!", freshness: "current", region: "PR", note: "THE Puerto Rican exclamation. Used for excitement. '¡Wepa!'", ageGroup: "all ages" },
  { word: "boricua", translation: "Puerto Rican", freshness: "current", region: "PR", note: "Self-identifier from Taíno 'Borikén'. '¡Yo soy boricua!'", ageGroup: "all ages" },
  { word: "chavos", translation: "money", freshness: "current", region: "PR", note: "'No tengo chavos' = 'I don't have money'.", ageGroup: "all ages" },
  { word: "janguear", translation: "to hang out", freshness: "current", region: "PR", note: "From English 'hang out'. 'Vamos a janguear' = 'Let's hang out'.", ageGroup: "all ages" },
  { word: "corillo", translation: "group of friends / crew", freshness: "current", region: "PR", note: "'Mi corillo' = 'My crew/squad'.", ageGroup: "Millennials / Gen Z" },
  { word: "nítido", translation: "cool / clear / perfect", freshness: "current", region: "PR", note: "'Todo nítido' = 'Everything's perfect'.", ageGroup: "all ages" },
  // TEXTBOOK
  { word: "dinero", translation: "money", freshness: "textbook", region: "PR", note: "Correct but Puerto Ricans say 'chavos'.", alternative: "chavos" },
  { word: "salir con amigos", translation: "to go out with friends", freshness: "textbook", region: "PR", note: "Textbook. Puerto Ricans say 'janguear con el corillo'.", alternative: "janguear con el corillo" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// FRENCH FRESHNESS TAGS
// ═══════════════════════════════════════════════════════════════════════════════

const FRENCH_TAGS: FreshnessTag[] = [
  // TRENDING
  { word: "c'est ouf", translation: "that's crazy", freshness: "trending", region: "FR", note: "Verlan (reversed slang) of 'fou'. Extremely common in youth speech.", ageGroup: "Gen Z", yearPopularized: 2018 },
  { word: "chanmé", translation: "amazing / fire", freshness: "trending", region: "FR", note: "From 'méchant' reversed (verlan). 'C'est chanmé!' = 'That's fire!'", ageGroup: "Gen Z", yearPopularized: 2020 },
  { word: "sah", translation: "seriously / for real", freshness: "trending", region: "FR", note: "From Arabic. 'Sah, c'est vrai?' = 'For real, is that true?'", ageGroup: "Gen Z", yearPopularized: 2019 },
  // CURRENT
  { word: "kiffer", translation: "to love / to be into", freshness: "current", region: "FR", note: "From Arabic 'kif'. 'Je kiffe ce film' = 'I love this movie'.", ageGroup: "Millennials / Gen Z" },
  { word: "meuf", translation: "woman / girl", freshness: "current", region: "FR", note: "Verlan of 'femme'. Very common. 'C'est ma meuf' = 'That's my girlfriend'.", ageGroup: "all ages" },
  { word: "mec", translation: "guy / dude", freshness: "current", region: "FR", note: "'Ce mec est sympa' = 'That guy is nice'. Universal.", ageGroup: "all ages" },
  { word: "bouffer", translation: "to eat (informal)", freshness: "current", region: "FR", note: "'On va bouffer?' = 'Shall we eat?' More casual than 'manger'.", ageGroup: "all ages" },
  // CLASSIC
  { word: "chouette", translation: "nice / cool", freshness: "classic", region: "FR", note: "Still used by older generations. Younger people say 'cool' or 'chanmé'.", ageGroup: "40+", alternative: "cool / chanmé" },
  // TEXTBOOK
  { word: "Comment allez-vous?", translation: "How are you? (formal)", freshness: "textbook", region: "FR", note: "Textbook French. People say 'Ça va?' or just 'Salut!'", alternative: "Ça va? / Salut!" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// JAPANESE FRESHNESS TAGS
// ═══════════════════════════════════════════════════════════════════════════════

const JAPANESE_TAGS: FreshnessTag[] = [
  // TRENDING
  { word: "エモい (emoi)", translation: "emotional / aesthetic / nostalgic", freshness: "trending", region: "JP", note: "From English 'emo'. Used for anything that evokes feelings. Very Gen Z.", ageGroup: "Gen Z", yearPopularized: 2020 },
  { word: "それな (sore na)", translation: "that's so true / exactly", freshness: "trending", region: "JP", note: "Agreement phrase. Like 'fr fr' in English.", ageGroup: "Gen Z", yearPopularized: 2019 },
  { word: "ガチ (gachi)", translation: "for real / seriously", freshness: "trending", region: "JP", note: "'ガチでやばい' = 'Seriously crazy'. From wrestling term.", ageGroup: "Gen Z / Millennials" },
  // CURRENT
  { word: "やばい (yabai)", translation: "amazing / terrible / crazy (context-dependent)", freshness: "current", region: "JP", note: "Universal word. Can mean good OR bad. 'やばい！' = 'Wow!' or 'Oh no!'", ageGroup: "all ages" },
  { word: "マジ (maji)", translation: "seriously / for real", freshness: "current", region: "JP", note: "'マジで？' = 'Seriously?' Used constantly.", ageGroup: "all ages" },
  { word: "めっちゃ (meccha)", translation: "very / super", freshness: "current", region: "JP", note: "Kansai origin but now nationwide. 'めっちゃ美味しい' = 'Super delicious'.", ageGroup: "all ages" },
  // TEXTBOOK
  { word: "とても (totemo)", translation: "very", freshness: "textbook", region: "JP", note: "Textbook Japanese. People say 'めっちゃ' or 'すごく' in conversation.", alternative: "めっちゃ / すごく" },
  { word: "お元気ですか (o-genki desu ka)", translation: "How are you?", freshness: "textbook", region: "JP", note: "Textbook. Japanese people rarely ask this directly — they just say 'お疲れ様' (otsukaresama) at work.", alternative: "お疲れ様です" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// KOREAN FRESHNESS TAGS
// ═══════════════════════════════════════════════════════════════════════════════

const KOREAN_TAGS: FreshnessTag[] = [
  // TRENDING
  { word: "갓생 (gat-saeng)", translation: "living your best life / productive life", freshness: "trending", region: "KR", note: "God + 생활(life). Living like a god = being productive. Very Gen Z.", ageGroup: "Gen Z", yearPopularized: 2022 },
  { word: "킹받다 (king-batda)", translation: "to be annoyed / triggered", freshness: "trending", region: "KR", note: "King + 받다(receive). Receiving king-level annoyance.", ageGroup: "Gen Z", yearPopularized: 2021 },
  { word: "쩔어 (jjeoreo)", translation: "amazing / fire / lit", freshness: "trending", region: "KR", note: "'이거 쩔어!' = 'This is fire!' From hip-hop culture.", ageGroup: "Gen Z / Millennials" },
  // CURRENT
  { word: "대박 (daebak)", translation: "amazing / jackpot / wow", freshness: "current", region: "KR", note: "THE Korean exclamation. '대박!' = 'Wow!' Used by everyone.", ageGroup: "all ages" },
  { word: "화이팅 (hwaiting)", translation: "fighting! / you can do it!", freshness: "current", region: "KR", note: "From English 'fighting'. Korean encouragement. '화이팅!'", ageGroup: "all ages" },
  { word: "맛집 (mat-jip)", translation: "famous restaurant / must-eat place", freshness: "current", region: "KR", note: "맛(taste) + 집(house). Koreans are obsessed with finding 맛집.", ageGroup: "all ages" },
  // TEXTBOOK
  { word: "어떻게 지내세요? (eotteoke jinaeseyo)", translation: "How are you?", freshness: "textbook", region: "KR", note: "Textbook. Koreans usually just say '밥 먹었어?' (Have you eaten?) as a greeting.", alternative: "밥 먹었어?" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ITALIAN FRESHNESS TAGS
// ═══════════════════════════════════════════════════════════════════════════════

const ITALIAN_TAGS: FreshnessTag[] = [
  // TRENDING
  { word: "spaccare", translation: "to kill it / to be amazing", freshness: "trending", region: "IT", note: "'Spacca!' = 'It rocks!' Literally 'to break'.", ageGroup: "Gen Z / Millennials" },
  { word: "cringe", translation: "cringe / embarrassing", freshness: "trending", region: "IT", note: "Borrowed directly from English. 'Che cringe!' = 'How cringe!'", ageGroup: "Gen Z", yearPopularized: 2020 },
  // CURRENT
  { word: "boh", translation: "I don't know / who knows", freshness: "current", region: "IT", note: "THE Italian filler. Shoulder shrug + 'Boh!' = 'I dunno'.", ageGroup: "all ages" },
  { word: "dai", translation: "come on / really? / let's go", freshness: "current", region: "IT", note: "Multi-purpose. 'Dai, andiamo!' = 'Come on, let's go!'", ageGroup: "all ages" },
  { word: "figo/a", translation: "cool / hot (person)", freshness: "current", region: "IT", note: "'Che figo!' = 'How cool!' Also means attractive person.", ageGroup: "all ages" },
  // TEXTBOOK
  { word: "Come sta?", translation: "How are you? (formal)", freshness: "textbook", region: "IT", note: "Textbook. Italians say 'Come stai?' (informal) or just 'Tutto bene?'", alternative: "Tutto bene? / Come stai?" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// GERMAN FRESHNESS TAGS
// ═══════════════════════════════════════════════════════════════════════════════

const GERMAN_TAGS: FreshnessTag[] = [
  // TRENDING
  { word: "cringe", translation: "cringe / embarrassing", freshness: "trending", region: "DE", note: "Jugendwort 2021 (Youth Word of the Year). Borrowed from English.", ageGroup: "Gen Z", yearPopularized: 2021 },
  { word: "sus", translation: "suspicious / sketchy", freshness: "trending", region: "DE", note: "From Among Us game. 'Das ist sus' = 'That's sus'.", ageGroup: "Gen Z", yearPopularized: 2021 },
  // CURRENT
  { word: "geil", translation: "awesome / cool", freshness: "current", region: "DE", note: "'Das ist geil!' = 'That's awesome!' Originally vulgar, now mainstream.", ageGroup: "all ages" },
  { word: "krass", translation: "crazy / intense / wow", freshness: "current", region: "DE", note: "'Krass!' = 'Wow!' / 'That's intense!'", ageGroup: "all ages" },
  { word: "Alter", translation: "dude / bro", freshness: "current", region: "DE", note: "'Alter, was machst du?' = 'Dude, what are you doing?'", ageGroup: "Millennials / Gen Z" },
  // TEXTBOOK
  { word: "Wie geht es Ihnen?", translation: "How are you? (formal)", freshness: "textbook", region: "DE", note: "Textbook. People say 'Wie geht's?' or just 'Na?' in conversation.", alternative: "Wie geht's? / Na?" },
  { word: "Auf Wiedersehen", translation: "Goodbye (formal)", freshness: "textbook", region: "DE", note: "Textbook. People say 'Tschüss' or 'Ciao' in everyday life.", alternative: "Tschüss / Ciao" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS & HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const ALL_FRESHNESS_TAGS: Record<string, FreshnessTag[]> = {
  "es-DO": SPANISH_DOMINICAN_TAGS,
  "es-CO": SPANISH_COLOMBIAN_TAGS,
  "es-CU": SPANISH_CUBAN_TAGS,
  "es-CR": SPANISH_COSTA_RICAN_TAGS,
  "es-AR": SPANISH_ARGENTINE_TAGS,
  "es-PE": SPANISH_PERUVIAN_TAGS,
  "es-CL": SPANISH_CHILEAN_TAGS,
  "es-PR": SPANISH_PUERTO_RICAN_TAGS,
  "fr": FRENCH_TAGS,
  "ja": JAPANESE_TAGS,
  "ko": KOREAN_TAGS,
  "it": ITALIAN_TAGS,
  "de": GERMAN_TAGS,
};

/**
 * Get freshness tags for a specific language/dialect.
 */
export function getFreshnessTags(languageCode: string): FreshnessTag[] {
  return ALL_FRESHNESS_TAGS[languageCode] || [];
}

/**
 * Get only trending vocabulary for a language.
 */
export function getTrendingVocabulary(languageCode: string): FreshnessTag[] {
  return getFreshnessTags(languageCode).filter(t => t.freshness === "trending");
}

/**
 * Get textbook words that have real-world alternatives.
 */
export function getTextbookAlternatives(languageCode: string): FreshnessTag[] {
  return getFreshnessTags(languageCode).filter(t => t.freshness === "textbook" && t.alternative);
}

/**
 * Get vocabulary by freshness level.
 */
export function getVocabularyByFreshness(languageCode: string, level: FreshnessLevel): FreshnessTag[] {
  return getFreshnessTags(languageCode).filter(t => t.freshness === level);
}

/**
 * Get the freshness badge emoji and label for display.
 */
export function getFreshnessBadge(level: FreshnessLevel): { emoji: string; label: string; color: string } {
  switch (level) {
    case "trending": return { emoji: "🔥", label: "Trending", color: "#FF6B35" };
    case "current": return { emoji: "✅", label: "Current", color: "#22C55E" };
    case "classic": return { emoji: "📚", label: "Classic", color: "#8B5CF6" };
    case "outdated": return { emoji: "⚠️", label: "Outdated", color: "#F59E0B" };
    case "regional": return { emoji: "🌍", label: "Regional", color: "#3B82F6" };
    case "textbook": return { emoji: "📖", label: "Textbook Only", color: "#6B7280" };
  }
}

/**
 * Get all supported language codes that have freshness tags.
 */
export function getSupportedFreshnessLanguages(): string[] {
  return Object.keys(ALL_FRESHNESS_TAGS);
}
