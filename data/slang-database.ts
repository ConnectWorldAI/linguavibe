/**
 * ConnectWorld AI — Regional Slang & Dialect Database
 * 
 * Seeded from real content creators:
 * - @spanishwithlinda (Dominican slang, daily phrases)
 * - @bilingueblogs (Caribbean Spanish, accent coaching, 7-dialect comparisons)
 * - Native speaker verification
 * 
 * This is NOT textbook Spanish. This is how people ACTUALLY talk.
 */

export type SlangEntry = {
  id: string;
  phrase: string;
  meaning: string;
  textbookEquivalent: string;
  region: string;
  country: string;
  city?: string;
  language: string;
  formality: 'street' | 'casual' | 'neutral' | 'formal';
  ageGroup: 'young' | 'all' | 'older';
  category: string;
  pronunciation: string;
  usageContext: string;
  example: string;
  exampleTranslation: string;
  culturalNote?: string;
  verified: boolean;
  source: string;
};

export type DialectComparison = {
  id: string;
  concept: string;
  conceptEnglish: string;
  category: string;
  variants: {
    region: string;
    phrase: string;
    pronunciation: string;
    note?: string;
  }[];
};

// ============================================================
// DOMINICAN REPUBLIC SLANG
// Source: @spanishwithlinda, @bilingueblogs, native speakers
// ============================================================

export const DOMINICAN_SLANG: SlangEntry[] = [
  {
    id: 'dr-001',
    phrase: 'un chin',
    meaning: 'a little bit',
    textbookEquivalent: 'un poco',
    region: 'Caribbean',
    country: 'Dominican Republic',
    city: 'Santo Domingo',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'quantity',
    pronunciation: 'oon cheen',
    usageContext: 'Everyday conversation, asking for small amounts',
    example: 'Dame un chin de agua',
    exampleTranslation: 'Give me a little water',
    culturalNote: 'Used constantly in DR. If you say "un poco" you sound like a textbook.',
    verified: true,
    source: '@spanishwithlinda',
  },
  {
    id: 'dr-002',
    phrase: 'tigeraje',
    meaning: 'hustle, grind, street smarts',
    textbookEquivalent: 'astucia / ingenio',
    region: 'Caribbean',
    country: 'Dominican Republic',
    city: 'Santo Domingo',
    language: 'Spanish',
    formality: 'street',
    ageGroup: 'young',
    category: 'lifestyle',
    pronunciation: 'tee-geh-RAH-heh',
    usageContext: 'Describing someone who hustles or is street smart',
    example: 'Ese tipo vive del tigeraje',
    exampleTranslation: 'That guy lives off his hustle',
    culturalNote: 'Comes from "tigre" (tiger) — a hustler. Very Dominican.',
    verified: true,
    source: '@spanishwithlinda',
  },
  {
    id: 'dr-003',
    phrase: 'toy arrebatao',
    meaning: "I'm furious / I'm heated",
    textbookEquivalent: 'Estoy muy enojado',
    region: 'Caribbean',
    country: 'Dominican Republic',
    language: 'Spanish',
    formality: 'street',
    ageGroup: 'all',
    category: 'emotions',
    pronunciation: 'toy ah-reh-bah-TAO',
    usageContext: 'When you are very angry or frustrated',
    example: 'Toy arrebatao con ese tipo',
    exampleTranslation: "I'm heated with that guy",
    culturalNote: '"Toy" = "Estoy" (dropped Es- is classic Dominican). "Arrebatao" drops the final -d.',
    verified: true,
    source: '@bilingueblogs',
  },
  {
    id: 'dr-004',
    phrase: 'vaina',
    meaning: 'thing / stuff / situation (universal filler word)',
    textbookEquivalent: 'cosa',
    region: 'Caribbean',
    country: 'Dominican Republic',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'general',
    pronunciation: 'VAI-nah',
    usageContext: 'Can replace almost any noun. The most Dominican word ever.',
    example: 'Pásame esa vaina',
    exampleTranslation: 'Pass me that thing',
    culturalNote: 'Dominicans use "vaina" for EVERYTHING. It can mean thing, situation, problem, or nothing specific.',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'dr-005',
    phrase: 'qué lo que',
    meaning: "what's up / what's good",
    textbookEquivalent: '¿Qué tal? / ¿Cómo estás?',
    region: 'Caribbean',
    country: 'Dominican Republic',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'greetings',
    pronunciation: 'keh lo keh (fast, almost "keloke")',
    usageContext: 'Greeting friends, casual hello',
    example: '¡Qué lo que, manito!',
    exampleTranslation: "What's good, bro!",
    culturalNote: 'The #1 Dominican greeting. Often shortened to just "klk" in texts.',
    verified: true,
    source: '@bilingueblogs',
  },
  {
    id: 'dr-006',
    phrase: 'ta to',
    meaning: "it's all good / everything's fine / okay",
    textbookEquivalent: 'Está todo bien',
    region: 'Caribbean',
    country: 'Dominican Republic',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'agreement',
    pronunciation: 'tah toh',
    usageContext: 'Agreeing, confirming, saying everything is fine',
    example: '—¿Nos vemos a las 8? —Ta to.',
    exampleTranslation: '—See you at 8? —All good.',
    culturalNote: 'Short for "está todo" — Dominicans compress everything.',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'dr-007',
    phrase: 'jevi',
    meaning: 'cool / awesome / nice',
    textbookEquivalent: 'genial / bueno',
    region: 'Caribbean',
    country: 'Dominican Republic',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'young',
    category: 'positive',
    pronunciation: 'HEH-vee',
    usageContext: 'Describing something cool or a good time',
    example: 'La fiesta estuvo jevi',
    exampleTranslation: 'The party was awesome',
    culturalNote: 'Comes from English "heavy" — adapted into Dominican slang.',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'dr-008',
    phrase: 'guapo/a',
    meaning: 'angry / mad (NOT handsome in DR!)',
    textbookEquivalent: 'enojado/a',
    region: 'Caribbean',
    country: 'Dominican Republic',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'emotions',
    pronunciation: 'GWAH-poh',
    usageContext: 'When someone is angry or in a bad mood',
    example: 'No me hables, toy guapo',
    exampleTranslation: "Don't talk to me, I'm mad",
    culturalNote: 'HUGE trap for learners! In most Spanish = handsome. In DR = angry. This confuses everyone.',
    verified: true,
    source: '@bilingueblogs',
  },
  {
    id: 'dr-009',
    phrase: 'tiguere',
    meaning: 'dude / player / street-smart person',
    textbookEquivalent: 'tipo / hombre',
    region: 'Caribbean',
    country: 'Dominican Republic',
    language: 'Spanish',
    formality: 'street',
    ageGroup: 'all',
    category: 'people',
    pronunciation: 'tee-GEH-reh',
    usageContext: 'Referring to a guy, especially one who is street-smart or a player',
    example: 'Ese tiguere sabe lo que hace',
    exampleTranslation: 'That dude knows what he is doing',
    culturalNote: 'From "tigre" (tiger). Can be positive (smart) or negative (shady) depending on context.',
    verified: true,
    source: '@spanishwithlinda',
  },
  {
    id: 'dr-010',
    phrase: 'dime a ver',
    meaning: 'tell me / go ahead / speak',
    textbookEquivalent: 'dime / cuéntame',
    region: 'Caribbean',
    country: 'Dominican Republic',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'conversation',
    pronunciation: 'DEE-meh ah vehr',
    usageContext: 'Inviting someone to speak or tell you something',
    example: '¿Qué pasó? Dime a ver.',
    exampleTranslation: 'What happened? Tell me.',
    verified: true,
    source: 'native speakers',
  },
];

// ============================================================
// COLOMBIAN SLANG
// Source: @bilingueblogs comparisons, native speakers
// ============================================================

export const COLOMBIAN_SLANG: SlangEntry[] = [
  {
    id: 'co-001',
    phrase: 'parce / parcero',
    meaning: 'dude / bro / friend',
    textbookEquivalent: 'amigo',
    region: 'South America',
    country: 'Colombia',
    city: 'Medellín',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'people',
    pronunciation: 'PAR-seh / par-SEH-roh',
    usageContext: 'Addressing friends, any casual conversation',
    example: '¿Qué más, parce?',
    exampleTranslation: "What's up, bro?",
    culturalNote: 'THE Colombian word. Everyone uses it. "Parcera" for women.',
    verified: true,
    source: '@bilingueblogs',
  },
  {
    id: 'co-002',
    phrase: 'qué más',
    meaning: "what's up / how's it going",
    textbookEquivalent: '¿Cómo estás?',
    region: 'South America',
    country: 'Colombia',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'greetings',
    pronunciation: 'keh mahs',
    usageContext: 'Greeting friends and acquaintances',
    example: '¡Ey, qué más! ¿Todo bien?',
    exampleTranslation: "Hey, what's up! Everything good?",
    culturalNote: 'The standard Colombian greeting. Much more common than "¿Cómo estás?"',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'co-003',
    phrase: 'bacano',
    meaning: 'cool / awesome / great',
    textbookEquivalent: 'genial / excelente',
    region: 'South America',
    country: 'Colombia',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'positive',
    pronunciation: 'bah-KAH-noh',
    usageContext: 'Describing something cool or expressing approval',
    example: '¡Qué bacano que viniste!',
    exampleTranslation: 'How awesome that you came!',
    culturalNote: 'Very Medellín/paisa. Bogotanos also use it but paisas own it.',
    verified: true,
    source: '@bilingueblogs',
  },
  {
    id: 'co-004',
    phrase: 'estoy mamado',
    meaning: "I'm exhausted / I'm fed up",
    textbookEquivalent: 'Estoy cansado / Estoy harto',
    region: 'South America',
    country: 'Colombia',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'emotions',
    pronunciation: 'es-TOY mah-MAH-doh',
    usageContext: 'When you are tired or fed up with something',
    example: 'Estoy mamado de este trabajo',
    exampleTranslation: "I'm fed up with this job",
    culturalNote: 'WARNING: In other countries this can mean something sexual. In Colombia = tired/fed up.',
    verified: true,
    source: '@bilingueblogs',
  },
  {
    id: 'co-005',
    phrase: 'chimba',
    meaning: 'awesome / amazing (or terrible, depending on tone)',
    textbookEquivalent: 'increíble',
    region: 'South America',
    country: 'Colombia',
    city: 'Medellín',
    language: 'Spanish',
    formality: 'street',
    ageGroup: 'young',
    category: 'positive',
    pronunciation: 'CHEEM-bah',
    usageContext: 'Expressing that something is amazing (positive tone) or terrible (negative tone)',
    example: '¡Qué chimba de película!',
    exampleTranslation: 'What an awesome movie!',
    culturalNote: 'Very paisa (Medellín). Can be vulgar in formal settings. Context and tone change the meaning completely.',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'co-006',
    phrase: 'marica',
    meaning: 'dude / bro (between friends)',
    textbookEquivalent: 'amigo / oye',
    region: 'South America',
    country: 'Colombia',
    city: 'Bogotá',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'young',
    category: 'people',
    pronunciation: 'mah-REE-kah',
    usageContext: 'Addressing close friends of any gender in Bogotá',
    example: 'Marica, ¿viste lo que pasó?',
    exampleTranslation: 'Dude, did you see what happened?',
    culturalNote: 'In Bogotá this is completely normal between friends. In other countries it is offensive. HUGE cultural difference.',
    verified: true,
    source: '@bilingueblogs',
  },
  {
    id: 'co-007',
    phrase: 'de una',
    meaning: "let's do it / right away / for sure",
    textbookEquivalent: 'de inmediato / claro que sí',
    region: 'South America',
    country: 'Colombia',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'agreement',
    pronunciation: 'deh OO-nah',
    usageContext: 'Agreeing enthusiastically or saying yes immediately',
    example: '—¿Vamos por cerveza? —¡De una!',
    exampleTranslation: "—Let's get beer? —Let's do it!",
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'co-008',
    phrase: 'paila',
    meaning: 'too bad / tough luck / screwed',
    textbookEquivalent: 'qué lástima / mala suerte',
    region: 'South America',
    country: 'Colombia',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'young',
    category: 'negative',
    pronunciation: 'PIE-lah',
    usageContext: 'When something goes wrong or someone is out of luck',
    example: '¿No hay más entradas? Paila.',
    exampleTranslation: 'No more tickets? Tough luck.',
    verified: true,
    source: 'native speakers',
  },
];

// ============================================================
// VENEZUELAN SLANG
// Source: @bilingueblogs comparisons, native speakers
// ============================================================

export const VENEZUELAN_SLANG: SlangEntry[] = [
  {
    id: 've-001',
    phrase: 'chamo / chama',
    meaning: 'dude / girl / friend',
    textbookEquivalent: 'amigo / amiga',
    region: 'Caribbean/South America',
    country: 'Venezuela',
    city: 'Caracas',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'people',
    pronunciation: 'CHAH-moh / CHAH-mah',
    usageContext: 'Addressing friends, anyone your age',
    example: '¡Chamo, qué fue!',
    exampleTranslation: 'Dude, what happened!',
    culturalNote: 'THE Venezuelan word. Like "bro" in English. Everyone uses it.',
    verified: true,
    source: '@bilingueblogs',
  },
  {
    id: 've-002',
    phrase: 'estoy arrecho',
    meaning: "I'm furious / I'm pissed off",
    textbookEquivalent: 'Estoy muy enojado',
    region: 'Caribbean/South America',
    country: 'Venezuela',
    language: 'Spanish',
    formality: 'street',
    ageGroup: 'all',
    category: 'emotions',
    pronunciation: 'es-TOY ah-RREH-choh',
    usageContext: 'When you are very angry',
    example: 'Estoy arrecho con el gobierno',
    exampleTranslation: "I'm furious with the government",
    culturalNote: 'WARNING: In Colombia/Central America "arrecho" means horny. In Venezuela = angry. Classic trap!',
    verified: true,
    source: '@bilingueblogs',
  },
  {
    id: 've-003',
    phrase: 'chevere',
    meaning: 'cool / great / nice',
    textbookEquivalent: 'genial / bueno',
    region: 'Caribbean/South America',
    country: 'Venezuela',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'positive',
    pronunciation: 'CHEH-veh-reh',
    usageContext: 'Describing something good or expressing approval',
    example: '¡Qué chévere que llegaste!',
    exampleTranslation: 'How cool that you made it!',
    culturalNote: 'Used across Latin America but OWNED by Venezuelans. They use it 50 times a day.',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 've-004',
    phrase: 'ladilla',
    meaning: 'annoying person / pest / nuisance',
    textbookEquivalent: 'persona molesta',
    region: 'Caribbean/South America',
    country: 'Venezuela',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'people',
    pronunciation: 'lah-DEE-yah',
    usageContext: 'Describing someone or something annoying',
    example: 'No seas ladilla, déjame en paz',
    exampleTranslation: "Don't be annoying, leave me alone",
    verified: true,
    source: 'native speakers',
  },
  {
    id: 've-005',
    phrase: 'burda',
    meaning: 'very / a lot / extremely',
    textbookEquivalent: 'muy / mucho',
    region: 'Caribbean/South America',
    country: 'Venezuela',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'young',
    category: 'quantity',
    pronunciation: 'BOOR-dah',
    usageContext: 'Intensifier — makes anything stronger',
    example: 'Esa comida está burda de buena',
    exampleTranslation: 'That food is extremely good',
    culturalNote: 'Young Venezuelans use this constantly. Older generations less so.',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 've-006',
    phrase: 'pana',
    meaning: 'close friend / buddy',
    textbookEquivalent: 'amigo cercano',
    region: 'Caribbean/South America',
    country: 'Venezuela',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'people',
    pronunciation: 'PAH-nah',
    usageContext: 'Referring to a close friend',
    example: 'Él es mi pana desde el colegio',
    exampleTranslation: "He's been my buddy since school",
    verified: true,
    source: 'native speakers',
  },
  {
    id: 've-007',
    phrase: 'coño',
    meaning: 'damn / wow / expression of surprise or frustration',
    textbookEquivalent: '¡Dios mío!',
    region: 'Caribbean/South America',
    country: 'Venezuela',
    language: 'Spanish',
    formality: 'street',
    ageGroup: 'all',
    category: 'exclamations',
    pronunciation: 'KOH-nyoh',
    usageContext: 'Exclamation for surprise, frustration, or emphasis',
    example: '¡Coño, qué calor hace!',
    exampleTranslation: 'Damn, it is so hot!',
    culturalNote: 'Very common in Venezuela (almost filler). In Spain it is much more vulgar.',
    verified: true,
    source: 'native speakers',
  },
];

// ============================================================
// PANAMANIAN SLANG
// Source: native speakers, regional research
// ============================================================

export const PANAMANIAN_SLANG: SlangEntry[] = [
  {
    id: 'pa-001',
    phrase: 'fren',
    meaning: 'friend / buddy',
    textbookEquivalent: 'amigo',
    region: 'Central America/Caribbean',
    country: 'Panama',
    city: 'Panama City',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'people',
    pronunciation: 'frehn (from English "friend")',
    usageContext: 'Addressing friends casually',
    example: '¿Qué xopá, fren?',
    exampleTranslation: "What's up, friend?",
    culturalNote: 'Panama mixes a LOT of English into their Spanish due to the Canal Zone history.',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'pa-002',
    phrase: 'xopá',
    meaning: "what's up (reversed 'pasó')",
    textbookEquivalent: '¿Qué pasó?',
    region: 'Central America/Caribbean',
    country: 'Panama',
    language: 'Spanish',
    formality: 'street',
    ageGroup: 'young',
    category: 'greetings',
    pronunciation: 'SHOH-pah',
    usageContext: 'Greeting friends, very casual',
    example: '¡Xopá, loco!',
    exampleTranslation: "What's up, man!",
    culturalNote: 'Reversed syllables of "pa-só" → "só-pa" → "xopá". Panamanians love reversing words.',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'pa-003',
    phrase: 'pelao / pelá',
    meaning: 'kid / young person / dude',
    textbookEquivalent: 'chico / joven',
    region: 'Central America/Caribbean',
    country: 'Panama',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'people',
    pronunciation: 'peh-LAO / peh-LAH',
    usageContext: 'Referring to a young person or addressing someone casually',
    example: 'Ese pelao es bien chill',
    exampleTranslation: 'That kid is really chill',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'pa-004',
    phrase: 'sort',
    meaning: 'cool / nice / sorted',
    textbookEquivalent: 'genial / bien',
    region: 'Central America/Caribbean',
    country: 'Panama',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'young',
    category: 'positive',
    pronunciation: 'sort (English pronunciation)',
    usageContext: 'Saying something is cool or everything is good',
    example: 'Todo sort, no te preocupes',
    exampleTranslation: "Everything's cool, don't worry",
    culturalNote: 'Another English loan word. Panama City youth mix English constantly.',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'pa-005',
    phrase: 'juega vivo',
    meaning: 'be street smart / watch out / play it smart',
    textbookEquivalent: 'ten cuidado / sé astuto',
    region: 'Central America/Caribbean',
    country: 'Panama',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'advice',
    pronunciation: 'HWEH-gah VEE-voh',
    usageContext: 'Warning someone to be careful or praising street smarts',
    example: 'Juega vivo con esa gente',
    exampleTranslation: 'Be smart with those people',
    culturalNote: 'Also used in DR and other Caribbean countries but very Panamanian.',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'pa-006',
    phrase: 'yeye',
    meaning: 'bougie / fancy / stuck up',
    textbookEquivalent: 'presumido / elegante',
    region: 'Central America/Caribbean',
    country: 'Panama',
    language: 'Spanish',
    formality: 'casual',
    ageGroup: 'all',
    category: 'people',
    pronunciation: 'YEH-yeh',
    usageContext: 'Describing someone or something fancy/pretentious',
    example: 'Ese restaurante es muy yeye',
    exampleTranslation: 'That restaurant is very bougie',
    verified: true,
    source: 'native speakers',
  },
];

// ============================================================
// HAITIAN CREOLE
// Source: native speakers, linguistic research
// ============================================================

export const HAITIAN_CREOLE_SLANG: SlangEntry[] = [
  {
    id: 'ht-001',
    phrase: 'sak pase',
    meaning: "what's up / what's happening",
    textbookEquivalent: 'Comment ça va? (French)',
    region: 'Caribbean',
    country: 'Haiti',
    city: 'Port-au-Prince',
    language: 'Haitian Creole',
    formality: 'casual',
    ageGroup: 'all',
    category: 'greetings',
    pronunciation: 'sahk pah-SEH',
    usageContext: 'Standard greeting between friends',
    example: 'Sak pase, zanmi!',
    exampleTranslation: "What's up, friend!",
    culturalNote: 'The response is always "N ap boule" (we are burning = we are doing well).',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'ht-002',
    phrase: 'n ap boule',
    meaning: "we're good / we're burning (doing well)",
    textbookEquivalent: 'Ça va bien (French)',
    region: 'Caribbean',
    country: 'Haiti',
    language: 'Haitian Creole',
    formality: 'casual',
    ageGroup: 'all',
    category: 'greetings',
    pronunciation: 'nahp boo-LEH',
    usageContext: 'Response to "sak pase" — means everything is good',
    example: '—Sak pase? —N ap boule!',
    exampleTranslation: "—What's up? —We're good!",
    culturalNote: 'Literally "we are burning" but means "we are thriving." Very positive.',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'ht-003',
    phrase: 'zanmi',
    meaning: 'friend',
    textbookEquivalent: 'ami (French)',
    region: 'Caribbean',
    country: 'Haiti',
    language: 'Haitian Creole',
    formality: 'casual',
    ageGroup: 'all',
    category: 'people',
    pronunciation: 'zahn-MEE',
    usageContext: 'Addressing or referring to a friend',
    example: 'Li se zanmi mwen',
    exampleTranslation: 'He/she is my friend',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'ht-004',
    phrase: 'pa gen pwoblem',
    meaning: 'no problem / no worries',
    textbookEquivalent: 'Pas de problème (French)',
    region: 'Caribbean',
    country: 'Haiti',
    language: 'Haitian Creole',
    formality: 'casual',
    ageGroup: 'all',
    category: 'agreement',
    pronunciation: 'pah jehn pwob-LEHM',
    usageContext: 'Reassuring someone, saying it is no issue',
    example: '—Mwen an reta. —Pa gen pwoblem!',
    exampleTranslation: "—I'm late. —No problem!",
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'ht-005',
    phrase: 'degage',
    meaning: 'to hustle / to figure it out / to manage',
    textbookEquivalent: 'se débrouiller (French)',
    region: 'Caribbean',
    country: 'Haiti',
    language: 'Haitian Creole',
    formality: 'casual',
    ageGroup: 'all',
    category: 'lifestyle',
    pronunciation: 'deh-gah-ZHEH',
    usageContext: 'Describing the act of making things work despite obstacles',
    example: 'Mwen ap degage',
    exampleTranslation: "I'm figuring it out / I'm hustling",
    culturalNote: 'Core Haitian concept — making it work no matter what. Resilience culture.',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'ht-006',
    phrase: 'kouman ou ye',
    meaning: 'how are you',
    textbookEquivalent: 'Comment allez-vous? (French)',
    region: 'Caribbean',
    country: 'Haiti',
    language: 'Haitian Creole',
    formality: 'neutral',
    ageGroup: 'all',
    category: 'greetings',
    pronunciation: 'koo-MAHN oo yeh',
    usageContext: 'Slightly more formal greeting than "sak pase"',
    example: 'Bonjou! Kouman ou ye?',
    exampleTranslation: 'Good morning! How are you?',
    verified: true,
    source: 'native speakers',
  },
  {
    id: 'ht-007',
    phrase: 'mwen renmen ou',
    meaning: 'I love you',
    textbookEquivalent: "Je t'aime (French)",
    region: 'Caribbean',
    country: 'Haiti',
    language: 'Haitian Creole',
    formality: 'neutral',
    ageGroup: 'all',
    category: 'romance',
    pronunciation: 'mwehn rehn-MEHN oo',
    usageContext: 'Expressing love to someone',
    example: 'Mwen renmen ou anpil',
    exampleTranslation: 'I love you a lot',
    verified: true,
    source: 'native speakers',
  },
];

// ============================================================
// DIALECT COMPARISONS
// "How to say the SAME thing in different countries"
// Source: @bilingueblogs "7 accents" series
// ============================================================

export const DIALECT_COMPARISONS: DialectComparison[] = [
  {
    id: 'comp-001',
    concept: 'Estoy enojado',
    conceptEnglish: "I'm angry / I'm mad",
    category: 'emotions',
    variants: [
      { region: 'Dominican Republic', phrase: 'Toy arrebatao', pronunciation: 'toy ah-reh-bah-TAO', note: 'Drops "Es-" and final "-d"' },
      { region: 'Colombia', phrase: 'Estoy mamado', pronunciation: 'es-TOY mah-MAH-doh', note: 'Can also mean exhausted' },
      { region: 'Venezuela', phrase: 'Estoy arrecho', pronunciation: 'es-TOY ah-RREH-choh', note: 'In Colombia this means horny!' },
      { region: 'Mexico', phrase: 'Estoy encabronado', pronunciation: 'es-TOY en-kah-broh-NAH-doh', note: 'Vulgar but very common' },
      { region: 'Argentina', phrase: 'Estoy re caliente', pronunciation: 'es-TOY reh kah-lee-EN-teh', note: '"Re" = very (Argentine intensifier)' },
      { region: 'Puerto Rico', phrase: 'Estoy emberracado', pronunciation: 'es-TOY em-beh-rah-KAH-doh', note: 'Strong anger' },
      { region: 'Spain', phrase: 'Estoy cabreado', pronunciation: 'es-TOY kah-breh-AH-doh', note: 'Standard Spain slang for angry' },
    ],
  },
  {
    id: 'comp-002',
    concept: '¿Qué tal? / Hola',
    conceptEnglish: "What's up / Hello (casual)",
    category: 'greetings',
    variants: [
      { region: 'Dominican Republic', phrase: '¿Qué lo que?', pronunciation: 'keh-lo-keh (fast)', note: 'Shortened to "klk" in texts' },
      { region: 'Colombia', phrase: '¿Qué más, parce?', pronunciation: 'keh mahs PAR-seh', note: '"Parce" = bro' },
      { region: 'Venezuela', phrase: '¿Qué fue, chamo?', pronunciation: 'keh fweh CHAH-moh', note: '"Chamo" = dude' },
      { region: 'Mexico', phrase: '¿Qué onda, güey?', pronunciation: 'keh OHN-dah GWEY', note: '"Güey" = dude (can be rude to strangers)' },
      { region: 'Argentina', phrase: '¿Qué onda, boludo?', pronunciation: 'keh OHN-dah boh-LOO-doh', note: '"Boludo" = dude (offensive elsewhere!)' },
      { region: 'Panama', phrase: '¿Qué xopá, fren?', pronunciation: 'keh SHOH-pah frehn', note: '"Xopá" = reversed "pasó"' },
      { region: 'Cuba', phrase: '¿Qué bolá, asere?', pronunciation: 'keh boh-LAH ah-SEH-reh', note: '"Asere" = friend (Afro-Cuban origin)' },
    ],
  },
  {
    id: 'comp-003',
    concept: 'Genial / Bueno',
    conceptEnglish: 'Cool / Awesome',
    category: 'positive',
    variants: [
      { region: 'Dominican Republic', phrase: 'Jevi', pronunciation: 'HEH-vee', note: 'From English "heavy"' },
      { region: 'Colombia', phrase: 'Bacano', pronunciation: 'bah-KAH-noh', note: 'Very paisa (Medellín)' },
      { region: 'Venezuela', phrase: 'Chévere', pronunciation: 'CHEH-veh-reh', note: 'Used everywhere but owned by VZ' },
      { region: 'Mexico', phrase: 'Chido', pronunciation: 'CHEE-doh', note: 'Casual, young people' },
      { region: 'Argentina', phrase: 'Copado', pronunciation: 'koh-PAH-doh', note: 'Buenos Aires slang' },
      { region: 'Spain', phrase: 'Mola', pronunciation: 'MOH-lah', note: '"Mola mucho" = so cool' },
      { region: 'Panama', phrase: 'Sort', pronunciation: 'sort', note: 'From English "sorted"' },
      { region: 'Chile', phrase: 'Bacán', pronunciation: 'bah-KAHN', note: 'Similar to Colombian but Chilean twist' },
    ],
  },
  {
    id: 'comp-004',
    concept: 'Amigo',
    conceptEnglish: 'Friend / Bro / Dude',
    category: 'people',
    variants: [
      { region: 'Dominican Republic', phrase: 'Tiguere / Manito', pronunciation: 'tee-GEH-reh / mah-NEE-toh', note: '"Tiguere" = street-smart dude' },
      { region: 'Colombia', phrase: 'Parce / Parcero', pronunciation: 'PAR-seh', note: 'THE Colombian word' },
      { region: 'Venezuela', phrase: 'Chamo / Pana', pronunciation: 'CHAH-moh / PAH-nah', note: '"Pana" = close friend' },
      { region: 'Mexico', phrase: 'Güey / Carnal', pronunciation: 'GWEY / kar-NAHL', note: '"Carnal" = blood brother' },
      { region: 'Argentina', phrase: 'Boludo / Che', pronunciation: 'boh-LOO-doh / cheh', note: '"Che" is iconic Argentine' },
      { region: 'Cuba', phrase: 'Asere / Acere', pronunciation: 'ah-SEH-reh', note: 'Afro-Cuban origin' },
      { region: 'Panama', phrase: 'Fren / Pelao', pronunciation: 'frehn / peh-LAO', note: 'English influence' },
      { region: 'Puerto Rico', phrase: 'Broki', pronunciation: 'BROH-kee', note: 'From English "bro"' },
    ],
  },
  {
    id: 'comp-005',
    concept: 'Un poco',
    conceptEnglish: 'A little bit',
    category: 'quantity',
    variants: [
      { region: 'Dominican Republic', phrase: 'Un chin', pronunciation: 'oon cheen', note: 'Most common DR word for "a little"' },
      { region: 'Colombia', phrase: 'Un poquito / Un tris', pronunciation: 'oon trees', note: '"Tris" = tiny amount' },
      { region: 'Venezuela', phrase: 'Un pelín', pronunciation: 'oon peh-LEEN', note: 'Very small amount' },
      { region: 'Mexico', phrase: 'Un chingo (a lot) / Tantito (a little)', pronunciation: 'tahn-TEE-toh', note: '"Tantito" = diminutive' },
      { region: 'Argentina', phrase: 'Un cachito', pronunciation: 'oon kah-CHEE-toh', note: 'Diminutive, cute' },
      { region: 'Spain', phrase: 'Un poquitín', pronunciation: 'oon poh-kee-TEEN', note: 'Double diminutive' },
    ],
  },
  {
    id: 'comp-006',
    concept: 'Dinero',
    conceptEnglish: 'Money',
    category: 'money',
    variants: [
      { region: 'Dominican Republic', phrase: 'Cuarto / Chelín', pronunciation: 'KWAR-toh', note: '"Cuarto" = quarter (old coin)' },
      { region: 'Colombia', phrase: 'Plata / Lucas', pronunciation: 'PLAH-tah / LOO-kahs', note: '"Lucas" = thousands of pesos' },
      { region: 'Venezuela', phrase: 'Real / Plata', pronunciation: 'reh-AHL', note: 'Old currency name stuck' },
      { region: 'Mexico', phrase: 'Lana / Feria / Varo', pronunciation: 'LAH-nah / FEH-ree-ah / VAH-roh', note: 'Multiple slang terms' },
      { region: 'Argentina', phrase: 'Guita / Mango', pronunciation: 'GEE-tah / MAHN-goh', note: '"Mango" = single peso' },
      { region: 'Spain', phrase: 'Pasta / Pelas', pronunciation: 'PAHS-tah', note: '"Pasta" = dough (like English)' },
      { region: 'Cuba', phrase: 'Fula / Baro', pronunciation: 'FOO-lah', note: '"Fula" = USD specifically' },
    ],
  },
];

// ============================================================
// SLANG OF THE DAY SYSTEM
// ============================================================

export type SlangOfTheDay = {
  date: string; // YYYY-MM-DD
  entry: SlangEntry;
  funFact?: string;
  challenge?: string;
};

/**
 * Get all slang entries combined
 */
export function getAllSlang(): SlangEntry[] {
  return [
    ...DOMINICAN_SLANG,
    ...COLOMBIAN_SLANG,
    ...VENEZUELAN_SLANG,
    ...PANAMANIAN_SLANG,
    ...HAITIAN_CREOLE_SLANG,
  ];
}

/**
 * Get slang by country
 */
export function getSlangByCountry(country: string): SlangEntry[] {
  return getAllSlang().filter(s => s.country.toLowerCase() === country.toLowerCase());
}

/**
 * Get slang by category
 */
export function getSlangByCategory(category: string): SlangEntry[] {
  return getAllSlang().filter(s => s.category === category);
}

/**
 * Get dialect comparison by concept
 */
export function getComparisonByConcept(concept: string): DialectComparison | undefined {
  return DIALECT_COMPARISONS.find(c => 
    c.conceptEnglish.toLowerCase().includes(concept.toLowerCase()) ||
    c.concept.toLowerCase().includes(concept.toLowerCase())
  );
}

/**
 * Get random slang of the day
 */
export function getSlangOfTheDay(date: string): SlangOfTheDay {
  const all = getAllSlang();
  // Deterministic based on date
  const dateNum = date.split('-').join('');
  const index = parseInt(dateNum) % all.length;
  const entry = all[index];
  
  return {
    date,
    entry,
    funFact: entry.culturalNote,
    challenge: `Try using "${entry.phrase}" in a sentence today!`,
  };
}
