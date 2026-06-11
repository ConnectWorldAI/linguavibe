/**
 * Universal Multilingual Slang & Expressions Database
 * Adapts to the user's target language and dialect.
 * Auto-grows as the AI ingest pipeline discovers new content.
 */

export interface SlangEntry {
  id: string;
  expression: string;
  literal: string;
  meaning: string;
  usage: string;
  example: string;
  exampleTranslation: string;
  formality: "very informal" | "informal" | "neutral" | "formal";
  category: string;
  source: string;
  audioAvailable: boolean;
}

export interface SlangLanguageConfig {
  languageCode: string;
  languageName: string;
  flag: string;
  dialects: { code: string; name: string; flag: string }[];
  categories: string[];
  entries: SlangEntry[];
}

// ─── Spanish (Dominican) ─────────────────────────────────────────────────────

const SPANISH_DOMINICAN: SlangEntry[] = [
  { id: "es_do_1", expression: "¿Qué lo que?", literal: "What the what?", meaning: "What's up? / How's it going?", usage: "Universal Dominican greeting among friends", example: "¡Oye! ¿Qué lo que, mi pana?", exampleTranslation: "Hey! What's up, my friend?", formality: "very informal", category: "Greetings", source: "spanishovertea", audioAvailable: true },
  { id: "es_do_2", expression: "Tá to'", literal: "Está todo", meaning: "Everything is fine / It's all good", usage: "Casual response to greetings or to confirm something is okay", example: "¿Cómo tú tá? — Tá to', mi loco", exampleTranslation: "How are you? — All good, bro", formality: "very informal", category: "Responses", source: "spanishovertea", audioAvailable: true },
  { id: "es_do_3", expression: "Vaina", literal: "Thing/stuff", meaning: "Thing, situation, or problem (universal filler word)", usage: "Can mean literally anything depending on context", example: "Pásame esa vaina", exampleTranslation: "Pass me that thing", formality: "very informal", category: "Everyday", source: "spanishovertea", audioAvailable: true },
  { id: "es_do_4", expression: "Pana", literal: "Breadfruit", meaning: "Close friend / buddy / bro", usage: "Term of endearment for close friends", example: "Ese es mi pana desde chiquito", exampleTranslation: "That's been my buddy since we were kids", formality: "informal", category: "People", source: "spanishovertea", audioAvailable: true },
  { id: "es_do_5", expression: "Tigueraje", literal: "Tiger-ness", meaning: "Street smarts / hustle / swagger", usage: "Describes someone who's clever and resourceful", example: "Él tiene mucho tigueraje", exampleTranslation: "He's got a lot of street smarts", formality: "very informal", category: "Slang", source: "bilingueblogs", audioAvailable: true },
  { id: "es_do_6", expression: "Jevi", literal: "Heavy (from English)", meaning: "Cool / awesome / great", usage: "Positive adjective for anything impressive", example: "Esa fiesta estuvo jevi", exampleTranslation: "That party was awesome", formality: "informal", category: "Adjectives", source: "spanishovertea", audioAvailable: true },
  { id: "es_do_7", expression: "Guagua", literal: "Bus", meaning: "Public bus / any vehicle", usage: "Dominican word for bus (not baby like in other countries)", example: "Voy a coger la guagua", exampleTranslation: "I'm going to take the bus", formality: "neutral", category: "Transport", source: "bilingueblogs", audioAvailable: true },
  { id: "es_do_8", expression: "Chin", literal: "A little bit", meaning: "A small amount / just a little", usage: "Used to minimize requests or describe small quantities", example: "Dame un chin de agua", exampleTranslation: "Give me a little water", formality: "informal", category: "Quantities", source: "spanishovertea", audioAvailable: true },
  { id: "es_do_9", expression: "Klok", literal: "Clock (English)", meaning: "I understand / Got it / Cool", usage: "Quick acknowledgment in text or speech", example: "Nos vemos a las 8 — Klok", exampleTranslation: "See you at 8 — Got it", formality: "very informal", category: "Texting", source: "bilingueblogs", audioAvailable: true },
  { id: "es_do_10", expression: "Colmado", literal: "Corner store", meaning: "Small neighborhood grocery/convenience store", usage: "The social hub of every Dominican neighborhood", example: "Voy al colmado a buscar una fría", exampleTranslation: "I'm going to the corner store to get a cold beer", formality: "neutral", category: "Places", source: "spanishovertea", audioAvailable: true },
  { id: "es_do_11", expression: "Diablo", literal: "Devil", meaning: "Damn! / Wow! (exclamation)", usage: "Expression of surprise, frustration, or emphasis", example: "¡Diablo! Ese carro tá jevi", exampleTranslation: "Damn! That car is awesome", formality: "very informal", category: "Exclamations", source: "spanishovertea", audioAvailable: true },
  { id: "es_do_12", expression: "Vamo' a darle", literal: "Let's give it", meaning: "Let's do it / Let's go!", usage: "Motivational phrase to start something", example: "¿Listo? ¡Vamo' a darle!", exampleTranslation: "Ready? Let's do it!", formality: "informal", category: "Actions", source: "spanishovertea", audioAvailable: true },
  { id: "es_do_13", expression: "Mangú", literal: "Mashed plantains", meaning: "Traditional Dominican breakfast dish", usage: "Boiled and mashed green plantains, often with onions", example: "Hoy desayuné mangú con los tres golpes", exampleTranslation: "Today I had mangú with the three hits (eggs, salami, cheese)", formality: "neutral", category: "Food", source: "bilingueblogs", audioAvailable: true },
  { id: "es_do_14", expression: "Pariguayo", literal: "Party watcher", meaning: "Lame person / buzzkill / wallflower", usage: "Someone who doesn't participate or is boring", example: "No sea' pariguayo, ven a bailar", exampleTranslation: "Don't be lame, come dance", formality: "very informal", category: "People", source: "bilingueblogs", audioAvailable: true },
  { id: "es_do_15", expression: "Motoconcho", literal: "Motorcycle taxi", meaning: "Motorcycle taxi service", usage: "Cheap and fast transportation in Dominican cities", example: "Coge un motoconcho que es más rápido", exampleTranslation: "Take a motorcycle taxi, it's faster", formality: "neutral", category: "Transport", source: "spanishovertea", audioAvailable: true },
];

// ─── Spanish (Mexican) ───────────────────────────────────────────────────────

const SPANISH_MEXICAN: SlangEntry[] = [
  { id: "es_mx_1", expression: "¿Qué onda?", literal: "What wave?", meaning: "What's up? / What's going on?", usage: "Casual Mexican greeting", example: "¡Hey! ¿Qué onda, güey?", exampleTranslation: "Hey! What's up, dude?", formality: "very informal", category: "Greetings", source: "community", audioAvailable: true },
  { id: "es_mx_2", expression: "Güey / Wey", literal: "Ox", meaning: "Dude / bro / man", usage: "Universal term of address among friends (originally an insult, now friendly)", example: "No manches, güey", exampleTranslation: "No way, dude", formality: "very informal", category: "People", source: "community", audioAvailable: true },
  { id: "es_mx_3", expression: "No manches", literal: "Don't stain", meaning: "No way! / You're kidding! / Come on!", usage: "Expression of disbelief or surprise (clean version of 'no mames')", example: "¡No manches! ¿En serio te ganaste la lotería?", exampleTranslation: "No way! Did you seriously win the lottery?", formality: "informal", category: "Exclamations", source: "community", audioAvailable: true },
  { id: "es_mx_4", expression: "Chido", literal: "Cool", meaning: "Cool / awesome / nice", usage: "Positive adjective for anything good", example: "Está bien chido tu carro nuevo", exampleTranslation: "Your new car is really cool", formality: "informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "es_mx_5", expression: "Neta", literal: "Net/truth", meaning: "Really? / For real / The truth", usage: "Emphasizes truthfulness or asks for confirmation", example: "¿Neta te vas a mudar a Cancún?", exampleTranslation: "For real, you're moving to Cancún?", formality: "informal", category: "Responses", source: "community", audioAvailable: true },
  { id: "es_mx_6", expression: "Chela", literal: "Beer", meaning: "Beer (informal)", usage: "Casual word for beer", example: "Vamos por unas chelas después del trabajo", exampleTranslation: "Let's grab some beers after work", formality: "informal", category: "Food", source: "community", audioAvailable: true },
  { id: "es_mx_7", expression: "Órale", literal: "Pray to it", meaning: "Alright! / Let's go! / Wow!", usage: "Multi-purpose exclamation (agreement, surprise, encouragement)", example: "¿Vamos al cine? — ¡Órale!", exampleTranslation: "Shall we go to the movies? — Let's go!", formality: "informal", category: "Exclamations", source: "community", audioAvailable: true },
  { id: "es_mx_8", expression: "Fresa", literal: "Strawberry", meaning: "Preppy / snobby / posh person", usage: "Describes someone who acts rich or entitled", example: "Esa chava es bien fresa", exampleTranslation: "That girl is really preppy", formality: "informal", category: "People", source: "community", audioAvailable: true },
  { id: "es_mx_9", expression: "Chamba", literal: "Work/job", meaning: "Work / job / hustle", usage: "Informal word for employment", example: "Tengo mucha chamba esta semana", exampleTranslation: "I have a lot of work this week", formality: "informal", category: "Everyday", source: "community", audioAvailable: true },
  { id: "es_mx_10", expression: "Pedo", literal: "Fart", meaning: "Problem / situation / drunk", usage: "Context-dependent: '¿Qué pedo?' = What's up? / 'Ando pedo' = I'm drunk", example: "¿Cuál es el pedo?", exampleTranslation: "What's the problem?", formality: "very informal", category: "Slang", source: "community", audioAvailable: true },
];

// ─── English (American) ──────────────────────────────────────────────────────

const ENGLISH_AMERICAN: SlangEntry[] = [
  { id: "en_us_1", expression: "No cap", literal: "No cap/lie", meaning: "For real / I'm not lying", usage: "Emphasizes you're being truthful (Gen Z slang)", example: "That concert was insane, no cap", exampleTranslation: "Ese concierto fue increíble, en serio", formality: "very informal", category: "Emphasis", source: "community", audioAvailable: true },
  { id: "en_us_2", expression: "Slay", literal: "Kill/dominate", meaning: "To do something exceptionally well / look amazing", usage: "Complimenting someone's appearance or achievement", example: "You slayed that presentation!", exampleTranslation: "¡La rompiste en esa presentación!", formality: "very informal", category: "Compliments", source: "community", audioAvailable: true },
  { id: "en_us_3", expression: "Bet", literal: "Bet (gambling)", meaning: "Okay / Sure / Deal / I agree", usage: "Quick agreement or acknowledgment", example: "Wanna grab food? — Bet.", exampleTranslation: "¿Quieres ir a comer? — Dale.", formality: "very informal", category: "Responses", source: "community", audioAvailable: true },
  { id: "en_us_4", expression: "Lowkey", literal: "Low key", meaning: "Secretly / somewhat / a little bit", usage: "Downplaying how much you feel something", example: "I lowkey want to skip class today", exampleTranslation: "Medio quiero faltar a clase hoy", formality: "informal", category: "Modifiers", source: "community", audioAvailable: true },
  { id: "en_us_5", expression: "Highkey", literal: "High key", meaning: "Openly / very much / obviously", usage: "Opposite of lowkey — being obvious about something", example: "I'm highkey obsessed with this song", exampleTranslation: "Estoy súper obsesionado con esta canción", formality: "informal", category: "Modifiers", source: "community", audioAvailable: true },
  { id: "en_us_6", expression: "Vibe check", literal: "Checking the vibe", meaning: "Assessing someone's mood or energy", usage: "Checking if someone or a situation feels right", example: "Let me do a vibe check on this party", exampleTranslation: "Déjame ver cómo está el ambiente de esta fiesta", formality: "very informal", category: "Social", source: "community", audioAvailable: true },
  { id: "en_us_7", expression: "It's giving...", literal: "It's giving off...", meaning: "It looks like / It has the energy of...", usage: "Describing the vibe or aesthetic of something", example: "That outfit? It's giving main character energy", exampleTranslation: "¿Ese outfit? Tiene energía de protagonista", formality: "very informal", category: "Descriptions", source: "community", audioAvailable: true },
  { id: "en_us_8", expression: "Bussin'", literal: "Busting", meaning: "Really good / delicious (especially food)", usage: "Describing food or experiences that are excellent", example: "These tacos are bussin'!", exampleTranslation: "¡Estos tacos están buenísimos!", formality: "very informal", category: "Food", source: "community", audioAvailable: true },
  { id: "en_us_9", expression: "Ghosting", literal: "Being a ghost", meaning: "Suddenly cutting off all communication", usage: "When someone stops replying to messages without explanation", example: "He ghosted me after three dates", exampleTranslation: "Me dejó de hablar después de tres citas", formality: "informal", category: "Relationships", source: "community", audioAvailable: true },
  { id: "en_us_10", expression: "Rizz", literal: "Charisma (shortened)", meaning: "Charm / ability to attract someone", usage: "Describing someone's flirting ability", example: "Bro has unspoken rizz", exampleTranslation: "El tipo tiene un carisma natural", formality: "very informal", category: "People", source: "community", audioAvailable: true },
  { id: "en_us_11", expression: "Finna", literal: "Fixing to", meaning: "About to / going to", usage: "Southern/AAVE expression for immediate future action", example: "I'm finna head out", exampleTranslation: "Ya me voy", formality: "very informal", category: "Actions", source: "community", audioAvailable: true },
  { id: "en_us_12", expression: "Sus", literal: "Suspicious (shortened)", meaning: "Suspicious / sketchy / untrustworthy", usage: "Calling out something that seems off (from Among Us game)", example: "That excuse sounds kinda sus", exampleTranslation: "Esa excusa suena medio sospechosa", formality: "very informal", category: "Adjectives", source: "community", audioAvailable: true },
];

// ─── English (British) ───────────────────────────────────────────────────────

const ENGLISH_BRITISH: SlangEntry[] = [
  { id: "en_gb_1", expression: "Innit", literal: "Isn't it", meaning: "Right? / Isn't it? / Don't you think?", usage: "Tag question added to any statement for emphasis", example: "Weather's proper rubbish today, innit?", exampleTranslation: "El clima está horrible hoy, ¿no?", formality: "very informal", category: "Responses", source: "community", audioAvailable: true },
  { id: "en_gb_2", expression: "Cheeky", literal: "Impudent", meaning: "Playfully bold / sneaky in a fun way", usage: "Describes something slightly naughty but harmless", example: "Fancy a cheeky Nando's?", exampleTranslation: "¿Te apetece un Nando's rápido?", formality: "informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "en_gb_3", expression: "Gutted", literal: "Gutted (emptied)", meaning: "Extremely disappointed / devastated", usage: "Strong expression of disappointment", example: "I'm absolutely gutted we lost the match", exampleTranslation: "Estoy destrozado porque perdimos el partido", formality: "informal", category: "Emotions", source: "community", audioAvailable: true },
  { id: "en_gb_4", expression: "Mate", literal: "Friend/partner", meaning: "Friend / buddy / pal", usage: "Universal term of address (like 'dude' in American)", example: "Alright, mate? How's it going?", exampleTranslation: "¿Qué tal, amigo? ¿Cómo va?", formality: "informal", category: "People", source: "community", audioAvailable: true },
  { id: "en_gb_5", expression: "Knackered", literal: "Broken/exhausted", meaning: "Extremely tired / exhausted", usage: "Describing being very tired after a long day", example: "I'm absolutely knackered after that shift", exampleTranslation: "Estoy muerto de cansancio después de ese turno", formality: "informal", category: "States", source: "community", audioAvailable: true },
  { id: "en_gb_6", expression: "Bloke", literal: "Man/guy", meaning: "A man / a guy", usage: "Casual way to refer to a male person", example: "That bloke over there looks familiar", exampleTranslation: "Ese tipo de allá me parece conocido", formality: "informal", category: "People", source: "community", audioAvailable: true },
  { id: "en_gb_7", expression: "Peng", literal: "Attractive", meaning: "Very attractive / hot / good-looking", usage: "London slang for someone who looks great", example: "She's proper peng, bruv", exampleTranslation: "Ella está buenísima, hermano", formality: "very informal", category: "Compliments", source: "community", audioAvailable: true },
  { id: "en_gb_8", expression: "Buzzing", literal: "Vibrating with excitement", meaning: "Very excited / thrilled", usage: "Expressing high excitement about something", example: "I'm buzzing for the festival this weekend!", exampleTranslation: "¡Estoy emocionadísimo por el festival este fin de semana!", formality: "informal", category: "Emotions", source: "community", audioAvailable: true },
];

// ─── French ──────────────────────────────────────────────────────────────────

const FRENCH_SLANG: SlangEntry[] = [
  { id: "fr_1", expression: "Kiffer", literal: "To get high on", meaning: "To really love / enjoy something", usage: "Expressing strong liking (from Arabic 'kif')", example: "Je kiffe trop cette chanson!", exampleTranslation: "I absolutely love this song!", formality: "very informal", category: "Emotions", source: "community", audioAvailable: true },
  { id: "fr_2", expression: "Meuf", literal: "Femme (reversed)", meaning: "Girl / woman / girlfriend", usage: "Verlan (reversed French) for 'femme'", example: "C'est qui cette meuf?", exampleTranslation: "Who's that girl?", formality: "very informal", category: "People", source: "community", audioAvailable: true },
  { id: "fr_3", expression: "Ouf", literal: "Fou (reversed)", meaning: "Crazy / insane / amazing", usage: "Verlan for 'fou' — can be positive or negative", example: "Ce film est ouf!", exampleTranslation: "This movie is insane!", formality: "very informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "fr_4", expression: "Relou", literal: "Lourd (reversed)", meaning: "Annoying / heavy / tiresome", usage: "Verlan for 'lourd' — describing annoying people or situations", example: "Il est trop relou ce mec", exampleTranslation: "That guy is so annoying", formality: "very informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "fr_5", expression: "Grave", literal: "Serious/grave", meaning: "Totally / seriously / very much", usage: "Intensifier used like 'totally' in English", example: "T'as grave raison!", exampleTranslation: "You're totally right!", formality: "informal", category: "Modifiers", source: "community", audioAvailable: true },
  { id: "fr_6", expression: "Chanmé", literal: "Méchant (reversed)", meaning: "Awesome / wicked / incredible", usage: "Verlan for 'méchant' used positively", example: "La soirée était chanmé!", exampleTranslation: "The party was incredible!", formality: "very informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "fr_7", expression: "Thune", literal: "Money", meaning: "Money / cash", usage: "Slang for money (like 'dough' in English)", example: "J'ai plus de thune", exampleTranslation: "I'm out of money", formality: "informal", category: "Money", source: "community", audioAvailable: true },
  { id: "fr_8", expression: "Galère", literal: "Galley (ship)", meaning: "Struggle / hassle / nightmare", usage: "Describing a difficult or annoying situation", example: "C'est la galère pour trouver un appart à Paris", exampleTranslation: "It's a nightmare finding an apartment in Paris", formality: "informal", category: "Situations", source: "community", audioAvailable: true },
  { id: "fr_9", expression: "Bouffer", literal: "To puff up", meaning: "To eat (informal)", usage: "Casual/vulgar way to say 'eat'", example: "On va bouffer où ce soir?", exampleTranslation: "Where are we eating tonight?", formality: "informal", category: "Food", source: "community", audioAvailable: true },
  { id: "fr_10", expression: "Flemme", literal: "Phlegm/laziness", meaning: "Can't be bothered / too lazy", usage: "Expressing laziness or lack of motivation", example: "J'ai la flemme de sortir", exampleTranslation: "I can't be bothered to go out", formality: "informal", category: "States", source: "community", audioAvailable: true },
];

// ─── Portuguese (Brazilian) ──────────────────────────────────────────────────

const PORTUGUESE_BRAZILIAN: SlangEntry[] = [
  { id: "pt_br_1", expression: "E aí?", literal: "And there?", meaning: "What's up? / Hey!", usage: "Universal Brazilian greeting", example: "E aí, mano? Tudo bem?", exampleTranslation: "What's up, bro? All good?", formality: "informal", category: "Greetings", source: "community", audioAvailable: true },
  { id: "pt_br_2", expression: "Mano", literal: "Brother", meaning: "Bro / dude / man", usage: "Casual term of address among friends", example: "Mano, tu viu o jogo ontem?", exampleTranslation: "Bro, did you see the game yesterday?", formality: "very informal", category: "People", source: "community", audioAvailable: true },
  { id: "pt_br_3", expression: "Massa", literal: "Dough/mass", meaning: "Cool / awesome / great", usage: "Positive adjective (especially in Northeast Brazil)", example: "Que massa! Vamos lá!", exampleTranslation: "How cool! Let's go!", formality: "informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "pt_br_4", expression: "Tá ligado?", literal: "Are you connected?", meaning: "You know? / You feel me?", usage: "Checking if someone understands or agrees", example: "A gente se encontra às 8, tá ligado?", exampleTranslation: "We meet at 8, you know?", formality: "very informal", category: "Responses", source: "community", audioAvailable: true },
  { id: "pt_br_5", expression: "Rolê", literal: "Roll/stroll", meaning: "Hangout / outing / going out", usage: "Any casual social activity or going somewhere", example: "Bora dar um rolê no shopping?", exampleTranslation: "Wanna go hang out at the mall?", formality: "informal", category: "Social", source: "community", audioAvailable: true },
  { id: "pt_br_6", expression: "Saudade", literal: "Longing/missing", meaning: "Deep longing for someone or something", usage: "Famous untranslatable word — a nostalgic yearning", example: "Tô com saudade de casa", exampleTranslation: "I miss home (with deep longing)", formality: "neutral", category: "Emotions", source: "community", audioAvailable: true },
  { id: "pt_br_7", expression: "Gato/Gata", literal: "Cat", meaning: "Hot / attractive person", usage: "Calling someone good-looking", example: "Aquela mina é muito gata", exampleTranslation: "That girl is really hot", formality: "informal", category: "Compliments", source: "community", audioAvailable: true },
  { id: "pt_br_8", expression: "Vacilou", literal: "Hesitated", meaning: "Messed up / made a mistake / let someone down", usage: "When someone does something wrong or disappointing", example: "Você vacilou comigo, mano", exampleTranslation: "You let me down, bro", formality: "informal", category: "Actions", source: "community", audioAvailable: true },
  { id: "pt_br_9", expression: "Firmeza", literal: "Firmness", meaning: "Alright / cool / deal", usage: "Quick agreement or acknowledgment", example: "Amanhã às 3? — Firmeza!", exampleTranslation: "Tomorrow at 3? — Deal!", formality: "informal", category: "Responses", source: "community", audioAvailable: true },
  { id: "pt_br_10", expression: "Paia", literal: "Straw/boring", meaning: "Lame / boring / uncool", usage: "Describing something or someone that's not interesting", example: "Essa festa tá muito paia", exampleTranslation: "This party is really lame", formality: "very informal", category: "Adjectives", source: "community", audioAvailable: true },
];

// ─── Japanese ────────────────────────────────────────────────────────────────

const JAPANESE_SLANG: SlangEntry[] = [
  { id: "ja_1", expression: "やばい (Yabai)", literal: "Dangerous", meaning: "Amazing / terrible / crazy (context-dependent)", usage: "Universal reaction word — can be positive or negative", example: "このラーメン、やばい！", exampleTranslation: "This ramen is insanely good!", formality: "very informal", category: "Exclamations", source: "community", audioAvailable: true },
  { id: "ja_2", expression: "マジ (Maji)", literal: "Serious", meaning: "Seriously? / For real? / Very", usage: "Emphasizer or expression of disbelief", example: "マジで？信じられない！", exampleTranslation: "Seriously? I can't believe it!", formality: "informal", category: "Responses", source: "community", audioAvailable: true },
  { id: "ja_3", expression: "ウケる (Ukeru)", literal: "To receive", meaning: "That's hilarious / LOL", usage: "Reacting to something funny", example: "その話ウケる！", exampleTranslation: "That story is hilarious!", formality: "informal", category: "Reactions", source: "community", audioAvailable: true },
  { id: "ja_4", expression: "草 (Kusa)", literal: "Grass", meaning: "LOL / haha (internet slang)", usage: "Like 'www' which looks like grass — means laughing", example: "それ草", exampleTranslation: "That's so funny lol", formality: "very informal", category: "Texting", source: "community", audioAvailable: true },
  { id: "ja_5", expression: "エモい (Emoi)", literal: "Emotional", meaning: "Emotional / nostalgic / moving", usage: "Describing something that evokes deep feelings", example: "この曲エモい", exampleTranslation: "This song is so emotional/nostalgic", formality: "informal", category: "Emotions", source: "community", audioAvailable: true },
  { id: "ja_6", expression: "推し (Oshi)", literal: "To push/support", meaning: "Your favorite (idol, character, person)", usage: "The person you stan/support the most", example: "私の推しは...", exampleTranslation: "My favorite (idol) is...", formality: "informal", category: "People", source: "community", audioAvailable: true },
  { id: "ja_7", expression: "ガチ (Gachi)", literal: "Serious/real", meaning: "Seriously / genuinely / for real", usage: "Stronger version of マジ", example: "ガチで美味しい！", exampleTranslation: "It's genuinely delicious!", formality: "informal", category: "Modifiers", source: "community", audioAvailable: true },
  { id: "ja_8", expression: "ダサい (Dasai)", literal: "Uncool", meaning: "Lame / uncool / tacky", usage: "Describing something outdated or embarrassing", example: "その服ダサくない？", exampleTranslation: "Isn't that outfit kind of lame?", formality: "informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "ja_9", expression: "ワンチャン (Wan-chan)", literal: "One chance", meaning: "Maybe / there's a chance / possibly", usage: "Expressing slim possibility (from English 'one chance')", example: "ワンチャン間に合うかも", exampleTranslation: "There's a chance we might make it", formality: "informal", category: "Modifiers", source: "community", audioAvailable: true },
  { id: "ja_10", expression: "それな (Sore na)", literal: "That, right", meaning: "Exactly / That's so true / I agree", usage: "Strong agreement with what someone just said", example: "「今日暑すぎ」「それな」", exampleTranslation: "'It's too hot today' 'Exactly!'", formality: "informal", category: "Responses", source: "community", audioAvailable: true },
];

// ─── Mandarin Chinese ────────────────────────────────────────────────────────

const MANDARIN_SLANG: SlangEntry[] = [
  { id: "zh_1", expression: "666", literal: "Six six six", meaning: "Awesome / skilled / impressive", usage: "Internet slang praising someone's skill (sounds like 溜 liù = smooth)", example: "你打游戏太666了！", exampleTranslation: "You're so skilled at gaming!", formality: "very informal", category: "Compliments", source: "community", audioAvailable: true },
  { id: "zh_2", expression: "牛逼 (Niúbī)", literal: "Cow's... (vulgar)", meaning: "Badass / amazing / incredible", usage: "Strong praise (slightly vulgar but very common)", example: "这个设计太牛逼了", exampleTranslation: "This design is incredible", formality: "very informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "zh_3", expression: "佛系 (Fó xì)", literal: "Buddhist style", meaning: "Chill / unbothered / go with the flow", usage: "Describing a laid-back attitude toward life", example: "我现在很佛系，随缘吧", exampleTranslation: "I'm very chill now, whatever happens happens", formality: "informal", category: "States", source: "community", audioAvailable: true },
  { id: "zh_4", expression: "内卷 (Nèi juǎn)", literal: "Involution", meaning: "Rat race / toxic competition / overwork culture", usage: "Describing excessive competition in society", example: "现在的内卷太严重了", exampleTranslation: "The rat race is too intense now", formality: "informal", category: "Society", source: "community", audioAvailable: true },
  { id: "zh_5", expression: "躺平 (Tǎng píng)", literal: "Lie flat", meaning: "Giving up the hustle / opting out of rat race", usage: "Rejecting overwork culture, choosing minimal effort", example: "我决定躺平了", exampleTranslation: "I've decided to just lie flat (give up hustling)", formality: "informal", category: "States", source: "community", audioAvailable: true },
  { id: "zh_6", expression: "yyds", literal: "永远的神 (yǒngyuǎn de shén)", meaning: "GOAT / the greatest of all time", usage: "Internet abbreviation for 'eternal god' — highest praise", example: "梅西yyds！", exampleTranslation: "Messi is the GOAT!", formality: "very informal", category: "Compliments", source: "community", audioAvailable: true },
  { id: "zh_7", expression: "摸鱼 (Mō yú)", literal: "Touch fish", meaning: "Slacking off at work / pretending to work", usage: "Doing personal stuff during work hours", example: "今天上班一直在摸鱼", exampleTranslation: "I was slacking off all day at work", formality: "informal", category: "Actions", source: "community", audioAvailable: true },
  { id: "zh_8", expression: "凡尔赛 (Fán'ěrsài)", literal: "Versailles", meaning: "Humble bragging / showing off subtly", usage: "Complaining about good things to flex", example: "他又在凡尔赛了", exampleTranslation: "He's humble bragging again", formality: "informal", category: "People", source: "community", audioAvailable: true },
  { id: "zh_9", expression: "绝绝子 (Jué jué zi)", literal: "Absolutely absolute", meaning: "Absolutely amazing / the best", usage: "Extreme praise for food, looks, or experiences", example: "这个蛋糕绝绝子！", exampleTranslation: "This cake is absolutely amazing!", formality: "very informal", category: "Compliments", source: "community", audioAvailable: true },
  { id: "zh_10", expression: "社死 (Shè sǐ)", literal: "Social death", meaning: "Dying of embarrassment / cringe moment", usage: "When something so embarrassing happens you want to disappear", example: "我今天在公司社死了", exampleTranslation: "I died of embarrassment at work today", formality: "informal", category: "Emotions", source: "community", audioAvailable: true },
];

// ─── Hindi ───────────────────────────────────────────────────────────────────

const HINDI_SLANG: SlangEntry[] = [
  { id: "hi_1", expression: "यार (Yaar)", literal: "Friend", meaning: "Dude / bro / man", usage: "Universal term of address among friends", example: "यार, क्या हो रहा है?", exampleTranslation: "Dude, what's going on?", formality: "informal", category: "People", source: "community", audioAvailable: true },
  { id: "hi_2", expression: "जुगाड़ (Jugaad)", literal: "Hack/fix", meaning: "Creative workaround / improvised solution", usage: "Finding clever solutions with limited resources", example: "कोई जुगाड़ लगाओ!", exampleTranslation: "Find some hack/workaround!", formality: "informal", category: "Actions", source: "community", audioAvailable: true },
  { id: "hi_3", expression: "चिल (Chill)", literal: "Chill (English)", meaning: "Relax / calm down / take it easy", usage: "Telling someone to relax (borrowed from English)", example: "चिल कर भाई, सब ठीक हो जाएगा", exampleTranslation: "Chill bro, everything will be fine", formality: "informal", category: "Responses", source: "community", audioAvailable: true },
  { id: "hi_4", expression: "बकवास (Bakwas)", literal: "Nonsense", meaning: "Nonsense / rubbish / BS", usage: "Dismissing something as worthless or untrue", example: "ये सब बकवास है", exampleTranslation: "This is all nonsense", formality: "informal", category: "Responses", source: "community", audioAvailable: true },
  { id: "hi_5", expression: "फ़ुल्टू (Phaaltoo)", literal: "Useless/free", meaning: "Useless / pointless / lame", usage: "Describing something or someone worthless", example: "वो फ़िल्म बिल्कुल फ़ुल्टू थी", exampleTranslation: "That movie was completely pointless", formality: "informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "hi_6", expression: "झक्कास (Jhakkas)", literal: "Fantastic", meaning: "Fantastic / superb / amazing", usage: "Expressing that something is excellent", example: "खाना झक्कास था!", exampleTranslation: "The food was fantastic!", formality: "informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "hi_7", expression: "पटाना (Patana)", literal: "To convince/woo", meaning: "To flirt with / win over / charm someone", usage: "Successfully attracting someone romantically", example: "उसने उसे पटा लिया", exampleTranslation: "He charmed her / won her over", formality: "informal", category: "Relationships", source: "community", audioAvailable: true },
  { id: "hi_8", expression: "मस्त (Mast)", literal: "Intoxicated/happy", meaning: "Cool / great / awesome / carefree", usage: "Describing something enjoyable or a carefree state", example: "आज मौसम बहुत मस्त है", exampleTranslation: "The weather is really great today", formality: "informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "hi_9", expression: "चक दे (Chak de)", literal: "Lift it up", meaning: "Let's go! / Come on! / Bring it!", usage: "Motivational phrase (popularized by the movie)", example: "चक दे इंडिया!", exampleTranslation: "Let's go India! / Come on!", formality: "informal", category: "Exclamations", source: "community", audioAvailable: true },
  { id: "hi_10", expression: "बिंदास (Bindaas)", literal: "Carefree", meaning: "Carefree / bold / fearless", usage: "Describing someone who doesn't care what others think", example: "वो बहुत बिंदास लड़की है", exampleTranslation: "She's a very carefree/bold girl", formality: "informal", category: "People", source: "community", audioAvailable: true },
];

// ─── Korean ──────────────────────────────────────────────────────────────────

const KOREAN_SLANG: SlangEntry[] = [
  { id: "ko_1", expression: "대박 (Daebak)", literal: "Big hit/jackpot", meaning: "Amazing / awesome / no way!", usage: "Expressing surprise or admiration", example: "대박! 진짜야?", exampleTranslation: "No way! Is that for real?", formality: "informal", category: "Exclamations", source: "community", audioAvailable: true },
  { id: "ko_2", expression: "ㅋㅋㅋ (kkk)", literal: "Haha sounds", meaning: "Haha / LOL", usage: "Text laughing (ㅋ = 'k' sound = laughing)", example: "너무 웃겨 ㅋㅋㅋ", exampleTranslation: "So funny lol", formality: "very informal", category: "Texting", source: "community", audioAvailable: true },
  { id: "ko_3", expression: "꿀잼 (Kkul-jaem)", literal: "Honey fun", meaning: "Super fun / entertaining / addictive", usage: "Describing content or activities that are really enjoyable", example: "이 드라마 꿀잼이야!", exampleTranslation: "This drama is so addictive!", formality: "informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "ko_4", expression: "존맛 (Jon-mat)", literal: "Crazy delicious", meaning: "Incredibly delicious", usage: "Extreme praise for food (shortened from 존나 맛있다)", example: "이 떡볶이 존맛!", exampleTranslation: "This tteokbokki is insanely delicious!", formality: "very informal", category: "Food", source: "community", audioAvailable: true },
  { id: "ko_5", expression: "갑분싸 (Gap-bun-ssa)", literal: "Suddenly cold atmosphere", meaning: "Awkward silence / mood killer", usage: "When the vibe suddenly gets awkward", example: "갑분싸... 누가 그런 말을 해", exampleTranslation: "Awkward silence... who says that", formality: "informal", category: "Social", source: "community", audioAvailable: true },
  { id: "ko_6", expression: "인싸 (In-ssa)", literal: "Insider", meaning: "Popular person / social butterfly", usage: "Someone who's always in the center of social groups", example: "그 사람 완전 인싸야", exampleTranslation: "That person is totally a social butterfly", formality: "informal", category: "People", source: "community", audioAvailable: true },
  { id: "ko_7", expression: "아싸 (A-ssa)", literal: "Outsider", meaning: "Loner / introvert / outsider", usage: "Someone who prefers being alone (not always negative)", example: "나는 아싸라서 집에 있을래", exampleTranslation: "I'm a loner so I'll stay home", formality: "informal", category: "People", source: "community", audioAvailable: true },
  { id: "ko_8", expression: "TMI", literal: "Too Much Information", meaning: "TMI / oversharing", usage: "When someone shares unnecessary details (borrowed from English)", example: "그건 좀 TMI인데...", exampleTranslation: "That's a bit TMI though...", formality: "informal", category: "Responses", source: "community", audioAvailable: true },
];

// ─── Arabic ──────────────────────────────────────────────────────────────────

const ARABIC_SLANG: SlangEntry[] = [
  { id: "ar_1", expression: "يلا (Yalla)", literal: "Oh God", meaning: "Let's go / Come on / Hurry up", usage: "Universal Arabic expression to urge action", example: "!يلا نروح", exampleTranslation: "Let's go!", formality: "informal", category: "Actions", source: "community", audioAvailable: true },
  { id: "ar_2", expression: "حبيبي (Habibi)", literal: "My love", meaning: "My dear / buddy / sweetheart", usage: "Term of endearment for anyone (friends, family, strangers)", example: "كيفك حبيبي؟", exampleTranslation: "How are you, my dear?", formality: "informal", category: "People", source: "community", audioAvailable: true },
  { id: "ar_3", expression: "والله (Wallah)", literal: "By God", meaning: "I swear / For real / Honestly", usage: "Emphasizing truthfulness or expressing surprise", example: "والله ما كنت أعرف!", exampleTranslation: "I swear I didn't know!", formality: "informal", category: "Emphasis", source: "community", audioAvailable: true },
  { id: "ar_4", expression: "خلاص (Khalas)", literal: "Enough/done", meaning: "That's it / Enough / Done / Stop", usage: "Ending a discussion or expressing finality", example: "خلاص، ما بدي أحكي", exampleTranslation: "That's it, I don't want to talk", formality: "neutral", category: "Responses", source: "community", audioAvailable: true },
  { id: "ar_5", expression: "إن شاء الله (Inshallah)", literal: "God willing", meaning: "God willing / Hopefully / Maybe (sometimes = no)", usage: "Can mean genuine hope OR a polite way to say 'probably not'", example: "بكرا إن شاء الله", exampleTranslation: "Tomorrow, God willing (maybe)", formality: "neutral", category: "Responses", source: "community", audioAvailable: true },
  { id: "ar_6", expression: "زلمة (Zalameh)", literal: "Man", meaning: "Dude / man / guy", usage: "Levantine Arabic term of address", example: "شو بدك يا زلمة؟", exampleTranslation: "What do you want, man?", formality: "informal", category: "People", source: "community", audioAvailable: true },
  { id: "ar_7", expression: "أشكرة (Ashkara)", literal: "Openly", meaning: "Obviously / blatantly / clearly", usage: "When something is too obvious to ignore", example: "أشكرة بتكذب!", exampleTranslation: "You're obviously lying!", formality: "informal", category: "Modifiers", source: "community", audioAvailable: true },
  { id: "ar_8", expression: "طز (Tuz)", literal: "Salt (Turkish origin)", meaning: "I don't care / Whatever / Screw it", usage: "Expressing indifference or dismissal (slightly vulgar)", example: "طز فيهم!", exampleTranslation: "Screw them! / I don't care about them!", formality: "very informal", category: "Exclamations", source: "community", audioAvailable: true },
];

// ─── Italian ─────────────────────────────────────────────────────────────────

const ITALIAN_SLANG: SlangEntry[] = [
  { id: "it_1", expression: "Boh", literal: "(shrug sound)", meaning: "I don't know / Who knows / Whatever", usage: "Universal Italian expression of uncertainty", example: "Dove andiamo stasera? — Boh!", exampleTranslation: "Where are we going tonight? — No idea!", formality: "informal", category: "Responses", source: "community", audioAvailable: true },
  { id: "it_2", expression: "Figo/a", literal: "Fig", meaning: "Cool / hot / awesome", usage: "Describing something or someone attractive/cool", example: "Che macchina figa!", exampleTranslation: "What a cool car!", formality: "informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "it_3", expression: "Che palle!", literal: "What balls!", meaning: "How annoying! / This sucks!", usage: "Expressing frustration or boredom (mildly vulgar)", example: "Che palle, piove di nuovo!", exampleTranslation: "Ugh, it's raining again!", formality: "very informal", category: "Exclamations", source: "community", audioAvailable: true },
  { id: "it_4", expression: "Magari", literal: "Maybe/if only", meaning: "I wish! / If only / Maybe (hopefully)", usage: "Expressing a strong wish or hopeful agreement", example: "Vuoi venire in vacanza? — Magari!", exampleTranslation: "Want to come on vacation? — I wish!", formality: "neutral", category: "Responses", source: "community", audioAvailable: true },
  { id: "it_5", expression: "Sbronza", literal: "Drunk state", meaning: "Getting wasted / very drunk", usage: "Describing heavy drinking or being very drunk", example: "Ieri sera mi sono preso una sbronza", exampleTranslation: "Last night I got wasted", formality: "informal", category: "Nightlife", source: "community", audioAvailable: true },
  { id: "it_6", expression: "Basta!", literal: "Enough!", meaning: "Stop! / That's enough! / I've had it!", usage: "Firmly ending something or expressing you've had enough", example: "Basta con queste bugie!", exampleTranslation: "Enough with these lies!", formality: "neutral", category: "Exclamations", source: "community", audioAvailable: true },
  { id: "it_7", expression: "Dai!", literal: "Give!", meaning: "Come on! / Really? / Let's go!", usage: "Multi-purpose exclamation (encouragement, disbelief, urging)", example: "Dai, non fare il pigro!", exampleTranslation: "Come on, don't be lazy!", formality: "informal", category: "Exclamations", source: "community", audioAvailable: true },
  { id: "it_8", expression: "Figurati", literal: "Figure yourself", meaning: "Don't mention it / No problem / You're welcome", usage: "Polite response when someone thanks you", example: "Grazie mille! — Ma figurati!", exampleTranslation: "Thank you so much! — Don't mention it!", formality: "neutral", category: "Responses", source: "community", audioAvailable: true },
];

// ─── German ──────────────────────────────────────────────────────────────────

const GERMAN_SLANG: SlangEntry[] = [
  { id: "de_1", expression: "Geil", literal: "Horny (originally)", meaning: "Awesome / cool / amazing", usage: "Lost its sexual meaning in casual speech — now just means 'great'", example: "Das Konzert war mega geil!", exampleTranslation: "The concert was mega awesome!", formality: "very informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "de_2", expression: "Alter!", literal: "Old one!", meaning: "Dude! / Man! / Bro!", usage: "Exclamation of surprise or addressing a friend", example: "Alter, hast du das gesehen?!", exampleTranslation: "Dude, did you see that?!", formality: "very informal", category: "Exclamations", source: "community", audioAvailable: true },
  { id: "de_3", expression: "Krass", literal: "Crass/extreme", meaning: "Crazy / intense / wild", usage: "Expressing that something is extreme (positive or negative)", example: "Das ist echt krass!", exampleTranslation: "That's really crazy/intense!", formality: "informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "de_4", expression: "Digga", literal: "Thick one", meaning: "Bro / dude / mate", usage: "Hamburg slang that spread nationwide — term of address", example: "Was geht, Digga?", exampleTranslation: "What's up, bro?", formality: "very informal", category: "People", source: "community", audioAvailable: true },
  { id: "de_5", expression: "Bock haben", literal: "To have a buck/goat", meaning: "To feel like doing something / to be in the mood", usage: "Expressing desire or motivation to do something", example: "Hast du Bock auf Kino?", exampleTranslation: "Do you feel like going to the movies?", formality: "informal", category: "Actions", source: "community", audioAvailable: true },
  { id: "de_6", expression: "Kein Bock", literal: "No buck", meaning: "Can't be bothered / don't feel like it", usage: "Expressing lack of motivation (opposite of Bock haben)", example: "Ich hab kein Bock auf Arbeit", exampleTranslation: "I can't be bothered to work", formality: "informal", category: "States", source: "community", audioAvailable: true },
  { id: "de_7", expression: "Läuft bei dir", literal: "It's running for you", meaning: "Things are going well for you / Good for you", usage: "Can be genuine praise or sarcastic", example: "Neue Freundin und Beförderung? Läuft bei dir!", exampleTranslation: "New girlfriend and promotion? Things are going great for you!", formality: "informal", category: "Responses", source: "community", audioAvailable: true },
  { id: "de_8", expression: "Ehrenmann/Ehrenfrau", literal: "Honor man/woman", meaning: "Legend / stand-up person / real one", usage: "Praising someone who did something admirable", example: "Er hat für alle bezahlt — Ehrenmann!", exampleTranslation: "He paid for everyone — what a legend!", formality: "informal", category: "Compliments", source: "community", audioAvailable: true },
];

// ─── Jamaican Patois ───────────────────────────────────────────────────────
// Source: @lingotwin (polyglot, Jamaican heritage)

const JAMAICAN_PATOIS: SlangEntry[] = [
  { id: "jm_1", expression: "Wah gwaan", literal: "What's going on", meaning: "What's up? / How are you?", usage: "Universal Jamaican greeting", example: "Wah gwaan, bredren?", exampleTranslation: "What's up, brother?", formality: "informal", category: "Greetings", source: "lingotwin", audioAvailable: true },
  { id: "jm_2", expression: "Mi deh yah", literal: "I am here", meaning: "I'm here / I'm good / I'm alive", usage: "Response to 'wah gwaan' — means everything is fine", example: "—Wah gwaan? —Mi deh yah, yuh know", exampleTranslation: "—What's up? —I'm good, you know", formality: "informal", category: "Responses", source: "lingotwin", audioAvailable: true },
  { id: "jm_3", expression: "Irie", literal: "Alright/good", meaning: "Everything is good / I'm feeling great / Cool", usage: "Positive state of being, also used as greeting response", example: "Everything irie, man", exampleTranslation: "Everything's good, man", formality: "informal", category: "States", source: "lingotwin", audioAvailable: true },
  { id: "jm_4", expression: "Bredren / Bredda", literal: "Brother", meaning: "Brother / close male friend / bro", usage: "Addressing a male friend or any man respectfully", example: "Yo bredren, come yah", exampleTranslation: "Yo bro, come here", formality: "informal", category: "People", source: "lingotwin", audioAvailable: true },
  { id: "jm_5", expression: "Sistren", literal: "Sister", meaning: "Sister / close female friend / girl", usage: "Addressing a female friend", example: "Mi sistren dem a come", exampleTranslation: "My girls are coming", formality: "informal", category: "People", source: "lingotwin", audioAvailable: true },
  { id: "jm_6", expression: "Bumbaclaat", literal: "(expletive)", meaning: "Extreme exclamation of surprise/anger (very strong)", usage: "The strongest Jamaican exclamation — use with extreme caution", example: "Bumbaclaat! Yuh see dat?", exampleTranslation: "Holy sh*t! Did you see that?", formality: "very informal", category: "Exclamations", source: "lingotwin", audioAvailable: true },
  { id: "jm_7", expression: "Yuh zimmi", literal: "You see me", meaning: "You know what I mean? / You feel me?", usage: "Checking if someone understands you", example: "Life hard but we push through, yuh zimmi", exampleTranslation: "Life is hard but we push through, you feel me", formality: "very informal", category: "Responses", source: "lingotwin", audioAvailable: true },
  { id: "jm_8", expression: "Big up", literal: "Big up/raise up", meaning: "Respect / shout out / props to", usage: "Giving someone respect or acknowledgment", example: "Big up yuhself, king", exampleTranslation: "Respect to you, king", formality: "informal", category: "Compliments", source: "lingotwin", audioAvailable: true },
  { id: "jm_9", expression: "Likkle more", literal: "A little more", meaning: "See you later / Goodbye (casual)", usage: "Casual farewell — implies you'll see them again soon", example: "Aight, likkle more, bredren", exampleTranslation: "Alright, see you later, bro", formality: "informal", category: "Farewells", source: "lingotwin", audioAvailable: true },
  { id: "jm_10", expression: "Nyam", literal: "Eat (from African languages)", meaning: "To eat / food", usage: "Informal word for eating", example: "Mi hungry, mi want fi nyam", exampleTranslation: "I'm hungry, I want to eat", formality: "informal", category: "Food", source: "lingotwin", audioAvailable: true },
  { id: "jm_11", expression: "Yard", literal: "Yard/home", meaning: "Jamaica / home / house", usage: "Refers to Jamaica itself or someone's home", example: "Mi soon reach back a yard", exampleTranslation: "I'll be back home soon", formality: "informal", category: "Places", source: "lingotwin", audioAvailable: true },
  { id: "jm_12", expression: "Dutty", literal: "Dirty", meaning: "Dirty / nasty / also: amazing (context-dependent)", usage: "Can be negative (dirty) or positive (that beat is dutty = fire)", example: "Dat riddim dutty!", exampleTranslation: "That beat is fire!", formality: "very informal", category: "Adjectives", source: "lingotwin", audioAvailable: true },
];

// ─── Haitian Creole ────────────────────────────────────────────────────────
// Source: @lingotwin, native speakers

const HAITIAN_CREOLE: SlangEntry[] = [
  { id: "ht_1", expression: "Sak pase", literal: "What's happening", meaning: "What's up? / How's it going?", usage: "The #1 Haitian greeting — everyone uses it", example: "Sak pase, zanmi!", exampleTranslation: "What's up, friend!", formality: "informal", category: "Greetings", source: "lingotwin", audioAvailable: true },
  { id: "ht_2", expression: "N ap boule", literal: "We are burning", meaning: "We're good / We're thriving / All good", usage: "Standard response to 'sak pase'", example: "—Sak pase? —N ap boule!", exampleTranslation: "—What's up? —We're good!", formality: "informal", category: "Responses", source: "lingotwin", audioAvailable: true },
  { id: "ht_3", expression: "Zanmi", literal: "Friend (from French 'ami')", meaning: "Friend / buddy", usage: "Addressing or referring to a friend", example: "Li se zanmi mwen", exampleTranslation: "He/she is my friend", formality: "informal", category: "People", source: "lingotwin", audioAvailable: true },
  { id: "ht_4", expression: "Pa gen pwoblem", literal: "No problem (from French)", meaning: "No problem / No worries / It's all good", usage: "Reassuring someone or accepting thanks", example: "—Mèsi anpil! —Pa gen pwoblem!", exampleTranslation: "—Thanks a lot! —No problem!", formality: "neutral", category: "Responses", source: "lingotwin", audioAvailable: true },
  { id: "ht_5", expression: "Degage", literal: "To manage (from French)", meaning: "To hustle / figure it out / make it work", usage: "Core Haitian concept — making things work despite obstacles", example: "Mwen ap degage", exampleTranslation: "I'm figuring it out / I'm hustling", formality: "informal", category: "Actions", source: "lingotwin", audioAvailable: true },
  { id: "ht_6", expression: "Mwen renmen ou", literal: "I love you", meaning: "I love you", usage: "Expressing love — romantic or familial", example: "Mwen renmen ou anpil", exampleTranslation: "I love you a lot", formality: "neutral", category: "Romance", source: "lingotwin", audioAvailable: true },
  { id: "ht_7", expression: "Kisa ou vle", literal: "What do you want", meaning: "What do you want? / What would you like?", usage: "Asking what someone wants (can be friendly or confrontational)", example: "Kisa ou vle manje?", exampleTranslation: "What do you want to eat?", formality: "neutral", category: "Questions", source: "lingotwin", audioAvailable: true },
  { id: "ht_8", expression: "Mesi anpil", literal: "Thanks a lot", meaning: "Thank you very much", usage: "Expressing gratitude", example: "Mesi anpil pou èd ou", exampleTranslation: "Thank you very much for your help", formality: "neutral", category: "Politeness", source: "lingotwin", audioAvailable: true },
  { id: "ht_9", expression: "Kouman ou ye", literal: "How are you", meaning: "How are you? (slightly more formal than sak pase)", usage: "Greeting — a bit more respectful than sak pase", example: "Bonjou! Kouman ou ye?", exampleTranslation: "Good morning! How are you?", formality: "neutral", category: "Greetings", source: "lingotwin", audioAvailable: true },
  { id: "ht_10", expression: "Ale", literal: "Go", meaning: "Go / Let's go / Get out", usage: "Telling someone to go or suggesting leaving", example: "Ann ale lakay", exampleTranslation: "Let's go home", formality: "informal", category: "Actions", source: "lingotwin", audioAvailable: true },
];

// ─── Spanish (Colombian) ───────────────────────────────────────────────────
// Source: @bilingueblogs, native speakers

const SPANISH_COLOMBIAN: SlangEntry[] = [
  { id: "es_co_1", expression: "¿Qué más, parce?", literal: "What more, partner?", meaning: "What's up, bro?", usage: "Universal Colombian greeting among friends", example: "¡Ey! ¿Qué más, parce? ¿Todo bien?", exampleTranslation: "Hey! What's up, bro? Everything good?", formality: "informal", category: "Greetings", source: "bilingueblogs", audioAvailable: true },
  { id: "es_co_2", expression: "Bacano", literal: "Cool", meaning: "Cool / awesome / great", usage: "Positive adjective — very Medellín/paisa", example: "¡Qué bacano que viniste!", exampleTranslation: "How awesome that you came!", formality: "informal", category: "Adjectives", source: "bilingueblogs", audioAvailable: true },
  { id: "es_co_3", expression: "De una", literal: "Of one", meaning: "Let's do it / Right away / For sure", usage: "Enthusiastic agreement", example: "—¿Vamos por cerveza? —¡De una!", exampleTranslation: "—Let's get beer? —Let's do it!", formality: "informal", category: "Responses", source: "bilingueblogs", audioAvailable: true },
  { id: "es_co_4", expression: "Chimba", literal: "(vulgar origin)", meaning: "Awesome / amazing (or terrible — tone-dependent)", usage: "Very paisa — context and tone change meaning completely", example: "¡Qué chimba de película!", exampleTranslation: "What an awesome movie!", formality: "very informal", category: "Adjectives", source: "bilingueblogs", audioAvailable: true },
  { id: "es_co_5", expression: "Paila", literal: "Pan/pot", meaning: "Too bad / tough luck / screwed", usage: "When something goes wrong", example: "¿No hay más entradas? Paila.", exampleTranslation: "No more tickets? Tough luck.", formality: "informal", category: "Responses", source: "bilingueblogs", audioAvailable: true },
  { id: "es_co_6", expression: "Marica", literal: "(offensive elsewhere)", meaning: "Dude / bro (between friends in Bogotá)", usage: "Completely normal in Bogotá between friends — offensive elsewhere!", example: "Marica, ¿viste lo que pasó?", exampleTranslation: "Dude, did you see what happened?", formality: "very informal", category: "People", source: "bilingueblogs", audioAvailable: true },
  { id: "es_co_7", expression: "Parcero/a", literal: "Partner", meaning: "Close friend / buddy", usage: "THE Colombian word for friend", example: "Ella es mi parcera del colegio", exampleTranslation: "She's my friend from school", formality: "informal", category: "People", source: "bilingueblogs", audioAvailable: true },
  { id: "es_co_8", expression: "Estoy mamado", literal: "I'm sucked", meaning: "I'm exhausted / I'm fed up", usage: "Being tired or fed up — WARNING: sexual meaning in other countries", example: "Estoy mamado de este trabajo", exampleTranslation: "I'm fed up with this job", formality: "informal", category: "States", source: "bilingueblogs", audioAvailable: true },
];

// ─── Spanish (Venezuelan) ──────────────────────────────────────────────────
// Source: @bilingueblogs, native speakers

const SPANISH_VENEZUELAN: SlangEntry[] = [
  { id: "es_ve_1", expression: "¿Qué fue, chamo?", literal: "What was, kid?", meaning: "What's up, dude?", usage: "Universal Venezuelan greeting", example: "¡Chamo! ¿Qué fue? ¿Todo bien?", exampleTranslation: "Dude! What's up? Everything good?", formality: "informal", category: "Greetings", source: "bilingueblogs", audioAvailable: true },
  { id: "es_ve_2", expression: "Chévere", literal: "Cool", meaning: "Cool / great / nice", usage: "THE Venezuelan positive word — used 50 times a day", example: "¡Qué chévere que llegaste!", exampleTranslation: "How cool that you made it!", formality: "informal", category: "Adjectives", source: "bilingueblogs", audioAvailable: true },
  { id: "es_ve_3", expression: "Estoy arrecho", literal: "I'm aroused (elsewhere)", meaning: "I'm furious / I'm pissed (in Venezuela ONLY)", usage: "WARNING: In Colombia/Central America = horny. In VZ = angry!", example: "Estoy arrecho con el gobierno", exampleTranslation: "I'm furious with the government", formality: "very informal", category: "Emotions", source: "bilingueblogs", audioAvailable: true },
  { id: "es_ve_4", expression: "Pana", literal: "Buddy", meaning: "Close friend / buddy", usage: "Referring to a close friend", example: "Él es mi pana desde el colegio", exampleTranslation: "He's been my buddy since school", formality: "informal", category: "People", source: "bilingueblogs", audioAvailable: true },
  { id: "es_ve_5", expression: "Burda", literal: "A lot", meaning: "Very / extremely / a lot", usage: "Intensifier — young Venezuelans use this constantly", example: "Esa comida está burda de buena", exampleTranslation: "That food is extremely good", formality: "informal", category: "Modifiers", source: "bilingueblogs", audioAvailable: true },
  { id: "es_ve_6", expression: "Ladilla", literal: "Crab louse", meaning: "Annoying person / pest / nuisance", usage: "Describing someone or something annoying", example: "No seas ladilla, déjame en paz", exampleTranslation: "Don't be annoying, leave me alone", formality: "informal", category: "People", source: "bilingueblogs", audioAvailable: true },
  { id: "es_ve_7", expression: "Coño", literal: "(vulgar)", meaning: "Damn / wow (filler exclamation in VZ)", usage: "Almost a filler word in Venezuela — much less vulgar than in Spain", example: "¡Coño, qué calor hace!", exampleTranslation: "Damn, it's so hot!", formality: "very informal", category: "Exclamations", source: "bilingueblogs", audioAvailable: true },
  { id: "es_ve_8", expression: "Verga", literal: "(vulgar)", meaning: "Damn / expression of frustration or surprise", usage: "Very common Venezuelan exclamation — vulgar but universal", example: "¡Ah verga! Se me olvidó", exampleTranslation: "Damn! I forgot", formality: "very informal", category: "Exclamations", source: "bilingueblogs", audioAvailable: true },
];

// ─── Spanish (Panamanian) ──────────────────────────────────────────────────
// Source: native speakers

const SPANISH_PANAMANIAN: SlangEntry[] = [
  { id: "es_pa_1", expression: "¿Qué xopá, fren?", literal: "What happened, friend?", meaning: "What's up, friend?", usage: "Casual Panamanian greeting — 'xopá' is reversed 'pasó'", example: "¡Xopá, loco! ¿Cómo estás?", exampleTranslation: "What's up, man! How are you?", formality: "very informal", category: "Greetings", source: "community", audioAvailable: true },
  { id: "es_pa_2", expression: "Fren", literal: "Friend (English)", meaning: "Friend / buddy", usage: "From English 'friend' — Panama mixes lots of English due to Canal Zone", example: "¿Qué xopá, fren?", exampleTranslation: "What's up, friend?", formality: "informal", category: "People", source: "community", audioAvailable: true },
  { id: "es_pa_3", expression: "Pelao / Pelá", literal: "Peeled", meaning: "Kid / young person / dude", usage: "Referring to a young person casually", example: "Ese pelao es bien chill", exampleTranslation: "That kid is really chill", formality: "informal", category: "People", source: "community", audioAvailable: true },
  { id: "es_pa_4", expression: "Juega vivo", literal: "Play alive", meaning: "Be street smart / watch out / play it smart", usage: "Warning someone to be careful or praising street smarts", example: "Juega vivo con esa gente", exampleTranslation: "Be smart with those people", formality: "informal", category: "Advice", source: "community", audioAvailable: true },
  { id: "es_pa_5", expression: "Yeye", literal: "Fancy", meaning: "Bougie / fancy / stuck up", usage: "Describing someone or something pretentious", example: "Ese restaurante es muy yeye", exampleTranslation: "That restaurant is very bougie", formality: "informal", category: "Adjectives", source: "community", audioAvailable: true },
  { id: "es_pa_6", expression: "Sort", literal: "Sorted (English)", meaning: "Cool / nice / all good", usage: "From English 'sorted' — Panama City youth slang", example: "Todo sort, no te preocupes", exampleTranslation: "Everything's cool, don't worry", formality: "informal", category: "Responses", source: "community", audioAvailable: true },
  { id: "es_pa_7", expression: "Vaina", literal: "Thing", meaning: "Thing / stuff (shared with DR and other Caribbean)", usage: "Universal filler word — same as Dominican usage", example: "Pásame esa vaina", exampleTranslation: "Pass me that thing", formality: "informal", category: "Everyday", source: "community", audioAvailable: true },
  { id: "es_pa_8", expression: "Chuleta", literal: "Pork chop", meaning: "Damn! / Wow! (exclamation)", usage: "Clean exclamation of surprise", example: "¡Chuleta! Eso estuvo bueno", exampleTranslation: "Damn! That was good", formality: "informal", category: "Exclamations", source: "community", audioAvailable: true },
];

// ─── Egyptian Arabic (Colloquial) ──────────────────────────────────────────
// Source: @lingotwin (learning Egyptian Arabic for 19+ months)

const EGYPTIAN_ARABIC: SlangEntry[] = [
  { id: "ar_eg_1", expression: "إزيك (Ezzayak)", literal: "How are you", meaning: "How are you? (Egyptian dialect)", usage: "Standard Egyptian greeting — NOT MSA", example: "إزيك يا حبيبي؟", exampleTranslation: "How are you, my dear?", formality: "informal", category: "Greetings", source: "lingotwin", audioAvailable: true },
  { id: "ar_eg_2", expression: "تمام (Tamam)", literal: "Perfect/fine", meaning: "Good / fine / okay / perfect", usage: "Universal response — everything is good", example: "—إزيك؟ —تمام الحمد لله", exampleTranslation: "—How are you? —Good, thank God", formality: "neutral", category: "Responses", source: "lingotwin", audioAvailable: true },
  { id: "ar_eg_3", expression: "يا سلام (Ya salam)", literal: "Oh peace", meaning: "Wow! / Amazing! / How wonderful!", usage: "Exclamation of admiration or surprise", example: "يا سلام! الأكل ده جميل", exampleTranslation: "Wow! This food is beautiful", formality: "informal", category: "Exclamations", source: "lingotwin", audioAvailable: true },
  { id: "ar_eg_4", expression: "يلا بينا (Yalla bina)", literal: "Let's go with us", meaning: "Let's go! / Come on, let's do it!", usage: "Urging action — let's move/start", example: "يلا بينا نروح السينما", exampleTranslation: "Let's go to the movies", formality: "informal", category: "Actions", source: "lingotwin", audioAvailable: true },
  { id: "ar_eg_5", expression: "حلو أوي (Helw awi)", literal: "Very sweet/nice", meaning: "Very nice / beautiful / great", usage: "Complimenting something or someone", example: "المكان ده حلو أوي", exampleTranslation: "This place is really nice", formality: "informal", category: "Compliments", source: "lingotwin", audioAvailable: true },
  { id: "ar_eg_6", expression: "مش فاهم (Mish fahem)", literal: "Not understanding", meaning: "I don't understand", usage: "Essential phrase for learners", example: "آسف، مش فاهم. ممكن تاني؟", exampleTranslation: "Sorry, I don't understand. Can you repeat?", formality: "neutral", category: "Learning", source: "lingotwin", audioAvailable: true },
  { id: "ar_eg_7", expression: "إيه ده (Eih da)", literal: "What's this", meaning: "What is this?! / What the...?!", usage: "Exclamation of confusion or disbelief", example: "إيه ده! مش معقول!", exampleTranslation: "What is this?! Unbelievable!", formality: "informal", category: "Exclamations", source: "lingotwin", audioAvailable: true },
  { id: "ar_eg_8", expression: "عيب (Eib)", literal: "Shame/fault", meaning: "That's shameful / inappropriate / rude", usage: "Calling out bad behavior — cultural concept", example: "عيب تعمل كده!", exampleTranslation: "It's shameful to do that!", formality: "neutral", category: "Culture", source: "lingotwin", audioAvailable: true },
];

// ─── Language Config Registry ────────────────────────────────────────────────

export const SLANG_LANGUAGES: SlangLanguageConfig[] = [
  {
    languageCode: "es",
    languageName: "Spanish",
    flag: "\ud83c\uddea\ud83c\uddf8",
    dialects: [
      { code: "dominican", name: "Dominican", flag: "\ud83c\udde9\ud83c\uddf4" },
      { code: "mexican", name: "Mexican", flag: "\ud83c\uddf2\ud83c\uddfd" },
      { code: "colombian", name: "Colombian", flag: "\ud83c\udde8\ud83c\uddf4" },
      { code: "venezuelan", name: "Venezuelan", flag: "\ud83c\uddfb\ud83c\uddea" },
      { code: "panamanian", name: "Panamanian", flag: "\ud83c\uddf5\ud83c\udde6" },
      { code: "standard", name: "Standard", flag: "\ud83c\uddea\ud83c\uddf8" },
    ],
    categories: ["All", "Greetings", "Responses", "Everyday", "People", "Slang", "Adjectives", "Actions", "Exclamations", "Food", "Places", "Transport", "Texting", "Quantities", "Conversation", "States", "Nightlife"],
    entries: SPANISH_DOMINICAN, // Default, overridden by dialect
  },
  {
    languageCode: "en",
    languageName: "English",
    flag: "\ud83c\uddfa\ud83c\uddf8",
    dialects: [
      { code: "american", name: "American", flag: "\ud83c\uddfa\ud83c\uddf8" },
      { code: "british", name: "British", flag: "\ud83c\uddec\ud83c\udde7" },
      { code: "australian", name: "Australian", flag: "\ud83c\udde6\ud83c\uddfa" },
    ],
    categories: ["All", "Responses", "Compliments", "Adjectives", "Modifiers", "Social", "Descriptions", "Food", "Relationships", "People", "Actions", "Emphasis"],
    entries: ENGLISH_AMERICAN,
  },
  {
    languageCode: "fr",
    languageName: "French",
    flag: "\ud83c\uddeb\ud83c\uddf7",
    dialects: [
      { code: "standard", name: "Parisian", flag: "\ud83c\uddeb\ud83c\uddf7" },
      { code: "quebec", name: "Québécois", flag: "\ud83c\udde8\ud83c\udde6" },
    ],
    categories: ["All", "Emotions", "People", "Adjectives", "Modifiers", "Money", "Situations", "Food", "States"],
    entries: FRENCH_SLANG,
  },
  {
    languageCode: "pt",
    languageName: "Portuguese",
    flag: "\ud83c\udde7\ud83c\uddf7",
    dialects: [
      { code: "brazilian", name: "Brazilian", flag: "\ud83c\udde7\ud83c\uddf7" },
      { code: "european", name: "European", flag: "\ud83c\uddf5\ud83c\uddf9" },
    ],
    categories: ["All", "Greetings", "People", "Adjectives", "Responses", "Social", "Emotions", "Compliments", "Actions"],
    entries: PORTUGUESE_BRAZILIAN,
  },
  {
    languageCode: "ja",
    languageName: "Japanese",
    flag: "\ud83c\uddef\ud83c\uddf5",
    dialects: [
      { code: "standard", name: "Standard", flag: "\ud83c\uddef\ud83c\uddf5" },
      { code: "kansai", name: "Kansai", flag: "\ud83c\uddef\ud83c\uddf5" },
    ],
    categories: ["All", "Exclamations", "Responses", "Reactions", "Texting", "Emotions", "People", "Modifiers", "Adjectives"],
    entries: JAPANESE_SLANG,
  },
  {
    languageCode: "zh",
    languageName: "Mandarin",
    flag: "\ud83c\udde8\ud83c\uddf3",
    dialects: [
      { code: "standard", name: "Mainland", flag: "\ud83c\udde8\ud83c\uddf3" },
      { code: "taiwanese", name: "Taiwanese", flag: "\ud83c\uddf9\ud83c\uddfc" },
    ],
    categories: ["All", "Compliments", "Adjectives", "States", "Society", "Actions", "People", "Emotions"],
    entries: MANDARIN_SLANG,
  },
  {
    languageCode: "hi",
    languageName: "Hindi",
    flag: "\ud83c\uddee\ud83c\uddf3",
    dialects: [
      { code: "standard", name: "Standard", flag: "\ud83c\uddee\ud83c\uddf3" },
      { code: "mumbai", name: "Mumbai/Bambaiya", flag: "\ud83c\uddee\ud83c\uddf3" },
    ],
    categories: ["All", "People", "Actions", "Responses", "Adjectives", "Relationships", "Exclamations"],
    entries: HINDI_SLANG,
  },
  {
    languageCode: "ko",
    languageName: "Korean",
    flag: "\ud83c\uddf0\ud83c\uddf7",
    dialects: [
      { code: "standard", name: "Standard", flag: "\ud83c\uddf0\ud83c\uddf7" },
      { code: "busan", name: "Busan", flag: "\ud83c\uddf0\ud83c\uddf7" },
    ],
    categories: ["All", "Exclamations", "Texting", "Adjectives", "Food", "Social", "People", "Responses"],
    entries: KOREAN_SLANG,
  },
  {
    languageCode: "ar",
    languageName: "Arabic",
    flag: "\ud83c\uddf8\ud83c\udde6",
    dialects: [
      { code: "levantine", name: "Levantine", flag: "\ud83c\uddf1\ud83c\udde7" },
      { code: "egyptian", name: "Egyptian", flag: "\ud83c\uddea\ud83c\uddec" },
      { code: "gulf", name: "Gulf", flag: "\ud83c\udde6\ud83c\uddea" },
    ],
    categories: ["All", "Actions", "People", "Emphasis", "Responses", "Modifiers", "Exclamations"],
    entries: ARABIC_SLANG,
  },
  {
    languageCode: "it",
    languageName: "Italian",
    flag: "\ud83c\uddee\ud83c\uddf9",
    dialects: [
      { code: "standard", name: "Standard", flag: "\ud83c\uddee\ud83c\uddf9" },
      { code: "roman", name: "Roman", flag: "\ud83c\uddee\ud83c\uddf9" },
    ],
    categories: ["All", "Responses", "Adjectives", "Exclamations", "Nightlife"],
    entries: ITALIAN_SLANG,
  },
  {
    languageCode: "de",
    languageName: "German",
    flag: "\ud83c\udde9\ud83c\uddea",
    dialects: [
      { code: "standard", name: "Standard", flag: "\ud83c\udde9\ud83c\uddea" },
      { code: "austrian", name: "Austrian", flag: "\ud83c\udde6\ud83c\uddf9" },
      { code: "swiss", name: "Swiss", flag: "\ud83c\udde8\ud83c\udded" },
    ],
    categories: ["All", "Adjectives", "Exclamations", "People", "Actions", "States", "Responses", "Compliments"],
    entries: GERMAN_SLANG,
  },
  {
    languageCode: "jm",
    languageName: "Jamaican Patois",
    flag: "\ud83c\uddef\ud83c\uddf2",
    dialects: [
      { code: "standard", name: "Standard", flag: "\ud83c\uddef\ud83c\uddf2" },
    ],
    categories: ["All", "Greetings", "Responses", "States", "People", "Exclamations", "Compliments", "Farewells", "Food", "Places", "Adjectives"],
    entries: JAMAICAN_PATOIS,
  },
  {
    languageCode: "ht",
    languageName: "Haitian Creole",
    flag: "\ud83c\udded\ud83c\uddf9",
    dialects: [
      { code: "standard", name: "Standard", flag: "\ud83c\udded\ud83c\uddf9" },
    ],
    categories: ["All", "Greetings", "Responses", "People", "Actions", "Romance", "Questions", "Politeness"],
    entries: HAITIAN_CREOLE,
  },
];

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Get slang entries for a specific language and optional dialect.
 */
export function getSlangForLanguage(languageCode: string, dialect?: string): SlangEntry[] {
  const config = SLANG_LANGUAGES.find(l => l.languageCode === languageCode);
  if (!config) return [];

  // Dialect-specific entries
  if (dialect) {
    switch (`${languageCode}_${dialect}`) {
      case "es_dominican": return SPANISH_DOMINICAN;
      case "es_mexican": return SPANISH_MEXICAN;
      case "es_colombian": return SPANISH_COLOMBIAN;
      case "es_venezuelan": return SPANISH_VENEZUELAN;
      case "es_panamanian": return SPANISH_PANAMANIAN;
      case "ar_egyptian": return EGYPTIAN_ARABIC;
      case "jm_standard": return JAMAICAN_PATOIS;
      case "ht_standard": return HAITIAN_CREOLE;
      case "en_american": return ENGLISH_AMERICAN;
      case "en_british": return ENGLISH_BRITISH;
      case "pt_brazilian": return PORTUGUESE_BRAZILIAN;
      default: return config.entries;
    }
  }

  return config.entries;
}

/**
 * Get the language config for a given language code.
 */
export function getSlangLanguageConfig(languageCode: string): SlangLanguageConfig | undefined {
  return SLANG_LANGUAGES.find(l => l.languageCode === languageCode);
}

/**
 * Get all available language codes that have slang data.
 */
export function getAvailableSlangLanguages(): { code: string; name: string; flag: string; count: number }[] {
  return SLANG_LANGUAGES.map(l => ({
    code: l.languageCode,
    name: l.languageName,
    flag: l.flag,
    count: l.entries.length,
  }));
}

/**
 * Map a language name (from AsyncStorage) to a language code.
 */
export function languageNameToCode(name: string): string {
  const map: Record<string, string> = {
    "spanish": "es", "español": "es",
    "english": "en", "inglés": "en",
    "french": "fr", "français": "fr",
    "portuguese": "pt", "português": "pt",
    "japanese": "ja", "日本語": "ja",
    "mandarin": "zh", "chinese": "zh", "中文": "zh",
    "hindi": "hi", "हिन्दी": "hi",
    "korean": "ko", "한국어": "ko",
    "arabic": "ar", "العربية": "ar",
    "italian": "it", "italiano": "it",
    "german": "de", "deutsch": "de",
    "jamaican patois": "jm", "patois": "jm", "patwa": "jm",
    "haitian creole": "ht", "creole": "ht", "kreyol": "ht",
  };
  return map[name.toLowerCase()] || "es"; // Default to Spanish
}

/**
 * Get the TTS language code for a given language + dialect.
 */
export function getSlangTTSCode(languageCode: string, dialect?: string): string {
  const ttsMap: Record<string, string> = {
    "es_dominican": "es-DO",
    "es_mexican": "es-MX",
    "es_colombian": "es-CO",
    "es_venezuelan": "es-VE",
    "es_panamanian": "es-PA",
    "es_standard": "es-ES",
    "jm_standard": "en-JM",
    "ht_standard": "ht-HT",
    "en_american": "en-US",
    "en_british": "en-GB",
    "en_australian": "en-AU",
    "fr_standard": "fr-FR",
    "fr_quebec": "fr-CA",
    "pt_brazilian": "pt-BR",
    "pt_european": "pt-PT",
    "ja_standard": "ja-JP",
    "zh_standard": "zh-CN",
    "zh_taiwanese": "zh-TW",
    "hi_standard": "hi-IN",
    "ko_standard": "ko-KR",
    "ar_levantine": "ar-SA",
    "ar_egyptian": "ar-EG",
    "it_standard": "it-IT",
    "de_standard": "de-DE",
    "de_austrian": "de-AT",
  };
  const key = dialect ? `${languageCode}_${dialect}` : `${languageCode}_standard`;
  return ttsMap[key] || `${languageCode}`;
}
