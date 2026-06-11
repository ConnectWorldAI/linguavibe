// ─── Multi-Language Curriculum Data ──────────────────────────────────────────
// Structured learning paths for each supported language with CEFR-aligned progression
// Each language has its own culturally-relevant content, dialect variants, and exercises

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type LessonCategory = "grammar" | "vocabulary" | "reading" | "writing" | "speaking" | "listening";
export type LessonStatus = "locked" | "available" | "in_progress" | "completed";

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: LessonCategory;
  level: CEFRLevel;
  duration: number; // minutes
  xp: number;
  order: number;
  culturalHint?: string;
}

export interface Unit {
  id: string;
  title: string;
  level: CEFRLevel;
  description: string;
  lessons: Lesson[];
  order: number;
}

export interface LanguageCurriculum {
  code: string;
  name: string;
  flag: string;
  dialect?: string;
  totalLessons: number;
  totalUnits: number;
  estimatedHours: number;
  units: Unit[];
}

// ─── Helper to generate lesson IDs ─────────────────────────────────────────
function lid(lang: string, level: string, unit: number, lesson: number): string {
  return `${lang}_${level.toLowerCase()}_u${unit}_l${lesson}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPANISH — DOMINICAN VARIANT
// ═══════════════════════════════════════════════════════════════════════════════
export const SPANISH_DOMINICAN: LanguageCurriculum = {
  code: "es-DO",
  name: "Spanish",
  flag: "🇩🇴",
  dialect: "Dominican",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 85,
  units: [
    {
      id: "es_do_a1_u1", title: "¿Qué Lo Que? — First Steps", level: "A1", order: 1,
      description: "Dominican greetings, introductions, and essential street phrases",
      lessons: [
        { id: lid("esdo","A1",1,1), title: "Greetings Dominican Style", description: "¿Qué lo que?, Dime a ver, Klk — how Dominicans really say hello", category: "vocabulary", level: "A1", duration: 5, xp: 20, order: 1, culturalHint: "Dominican greeting culture — learn 'Klk' (Qué lo que), 'Dime a ver', and the tradition of greeting everyone when entering a room. In DR, not greeting is considered rude." },
        { id: lid("esdo","A1",1,2), title: "Introducing Yourself", description: "Yo soy de... — name, origin, and personality", category: "speaking", level: "A1", duration: 8, xp: 25, order: 2, culturalHint: "Dominican identity — Dominicans often introduce themselves by barrio/city. Learn 'Soy de la Capital' vs 'Soy del campo'. Family name and hometown define you." },
        { id: lid("esdo","A1",1,3), title: "Ser vs Estar — Dominican Way", description: "When to use each with DR pronunciation patterns", category: "grammar", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Dominican pronunciation drops the 's' — 'estás' becomes 'etá'. Practice with food: 'El mangú está bueno' vs 'El mangú es dominicano'." },
        { id: lid("esdo","A1",1,4), title: "Numbers & Money", description: "Counting pesos and understanding Dominican prices", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 4, culturalHint: "Dominican money culture — learn to count in pesos dominicanos. A colmado lunch costs ~300 pesos. Practice: 'Cuánto e?' (How much?) at the mercado." },
        { id: lid("esdo","A1",1,5), title: "At the Colmado", description: "Understand a conversation at the corner store", category: "listening", level: "A1", duration: 6, xp: 25, order: 5, culturalHint: "The colmado is the heart of Dominican neighborhoods — a corner store where people gather, play dominoes, and listen to bachata. Order 'una fría' (cold beer) or 'un jugo de chinola' (passion fruit juice)." },
      ],
    },
    {
      id: "es_do_a1_u2", title: "La Familia — Daily Life", level: "A1", order: 2,
      description: "Family, home life, and Dominican daily routines",
      lessons: [
        { id: lid("esdo","A1",2,1), title: "Mi Familia Dominicana", description: "Family terms including tío/tía, primo, compadre", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1, culturalHint: "Dominican family culture — 'compadre/comadre' (godparent bond) is sacred. Sunday 'almuerzo familiar' brings everyone together for sancocho. Learn: abuela, tía, primo, vecino." },
        { id: lid("esdo","A1",2,2), title: "Present Tense — DR Style", description: "Regular verbs with dropped 's' pronunciation", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2, culturalHint: "Practice verbs with daily Dominican activities: 'Yo cocino mangú' (I cook mangú), 'Ella baila merengue' (She dances merengue), 'Nosotro' jugamo' dominó' (We play dominoes)." },
        { id: lid("esdo","A1",2,3), title: "Mi Día Típico", description: "Describe your daily routine Dominican-style", category: "writing", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Write about a typical Dominican day: desayuno con mangú y los tres golpes (mangú with salami, cheese, eggs), almuerzo with la bandera (rice, beans, meat), and merienda in the afternoon." },
        { id: lid("esdo","A1",2,4), title: "La Casa Dominicana", description: "Rooms, furniture, and household items", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Dominican homes — learn 'la terraza' (porch where families gather), 'el patio' (backyard with mango trees), 'la cocina' where abuela makes habichuelas con dulce." },
        { id: lid("esdo","A1",2,5), title: "Reading: A WhatsApp Chat", description: "Understand informal Dominican text messages", category: "reading", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "Dominican texting culture — 'Klk' = Qué lo que, 'Tamo activo' = We're on, 'Dpm' = Después. Dominicans use voice notes more than text. Read a chat about planning a parrillada (BBQ)." },
      ],
    },
    {
      id: "es_do_a2_u1", title: "En La Calle — Getting Around", level: "A2", order: 3,
      description: "Navigating Santo Domingo, transportation, and directions",
      lessons: [
        { id: lid("esdo","A2",1,1), title: "Asking for Directions", description: "Pa'llá, pa'cá — Dominican direction giving", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Dominican directions — 'Pa'llá' (over there), 'Pa'cá' (over here), 'Al lao' (next to). Practice navigating the Zona Colonial in Santo Domingo. Learn landmarks: El Malecón, Parque Colón, La Catedral." },
        { id: lid("esdo","A2",1,2), title: "Past Tense — What Happened", description: "Preterite with Dominican pronunciation", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2, culturalHint: "Tell stories about Dominican holidays: 'Fuimo' a la playa pa' Semana Santa' (We went to the beach for Holy Week). Semana Santa is the biggest vacation — everyone goes to Boca Chica or Cabarete." },
        { id: lid("esdo","A2",1,3), title: "Guaguas & Motoconchos", description: "Public transportation vocabulary in DR", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Dominican transport culture — 'la guagua' (bus), 'el motoconcho' (motorcycle taxi), 'el carro público' (shared taxi). The guagua driver plays bachata at full volume. Learn: 'Para aquí!' (Stop here!)" },
        { id: lid("esdo","A2",1,4), title: "Reading: A Neighborhood Map", description: "Follow directions to places in the barrio", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Navigate a Dominican barrio — find the colmado, la iglesia, el parque, la cancha de baloncesto. Every barrio has a 'play' (basketball court) where kids gather after school." },
        { id: lid("esdo","A2",1,5), title: "Write About Your Neighborhood", description: "Describe where you live and what's nearby", category: "writing", level: "A2", duration: 12, xp: 35, order: 5, culturalHint: "Describe your barrio Dominican-style: 'En mi barrio hay un colmado donde ponen música to' el día' (In my neighborhood there's a store that plays music all day). Include the sounds, smells, and people." },
      ],
    },
    {
      id: "es_do_a2_u2", title: "La Comida — Food & Drink", level: "A2", order: 4,
      description: "Dominican cuisine, ordering food, and cooking vocabulary",
      lessons: [
        { id: lid("esdo","A2",2,1), title: "Dominican Food Vocabulary", description: "Mangú, sancocho, mofongo — essential dishes", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1, culturalHint: "Dominican food culture — 'La Bandera' (the flag) = rice + beans + meat, eaten daily. Learn: mangú (mashed plantain), sancocho (7-meat stew for Sundays), mofongo, tostones, habichuelas guisadas." },
        { id: lid("esdo","A2",2,2), title: "Ordering at a Comedor", description: "How to order food at a Dominican restaurant", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "At a Dominican comedor: 'Dame la bandera con pollo' (Give me the flag with chicken). The waitress says '¿Con jugo o refresco?' (juice or soda?). Tip: 'morir soñando' = orange juice with milk, a DR classic." },
        { id: lid("esdo","A2",2,3), title: "Imperfect Tense", description: "Talking about what you used to eat growing up", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3, culturalHint: "Nostalgia food stories: 'Cuando era chiquito, mi abuela hacía habichuelas con dulce en Semana Santa' (When I was little, grandma made sweet beans for Easter). This dessert is only made during Holy Week." },
        { id: lid("esdo","A2",2,4), title: "Reading: A Recipe", description: "Follow a Dominican recipe for habichuelas con dulce", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Habichuelas con dulce recipe — a sacred Easter tradition. Ingredients: habichuelas rojas, leche de coco, azúcar, batata, canela, pasas, galletitas de leche. Every family has their own secret recipe." },
        { id: lid("esdo","A2",2,5), title: "Listening: At the Market", description: "Understand vendors at the mercado", category: "listening", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "At the Mercado Modelo in Santo Domingo — vendors shout '¡Lleve, lleve!' (Take it, take it!). Learn fruit names: chinola (passion fruit), lechosa (papaya), guanabana (soursop), zapote." },
      ],
    },
    {
      id: "es_do_b1_u1", title: "Cultura & Sociedad", level: "B1", order: 5,
      description: "Dominican culture, music, sports, and social life",
      lessons: [
        { id: lid("esdo","B1",1,1), title: "Merengue & Bachata", description: "Music vocabulary and cultural significance", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "Dominican music — Merengue: fast 2-beat rhythm danced with hip movement, born in DR. Bachata: romantic guitar-based music from the campos. Learn: 'el güiro' (scraper), 'la tambora' (drum), 'el acordeón'. Artists: Juan Luis Guerra, Romeo Santos, El Alfa." },
        { id: lid("esdo","B1",1,2), title: "Subjunctive Mood", description: "Expressing wishes, doubts, and emotions", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2, culturalHint: "Express wishes about Dominican traditions: 'Espero que llueva pa' que crezca el plátano' (I hope it rains so the plantain grows). 'Ojalá que ganen los Tigres del Licey' (I hope Licey Tigers win)." },
        { id: lid("esdo","B1",1,3), title: "Discussing Baseball", description: "Talk about Dominican baseball culture fluently", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3, culturalHint: "Baseball is religion in DR — 6 teams in LIDOM: Tigres del Licey, Águilas Cibaeñas, Estrellas, Toros, Gigantes, Leñadores. Learn: 'jonrón' (home run), 'ponche' (strikeout), 'pelotero' (player). DR produces more MLB players per capita than anywhere." },
        { id: lid("esdo","B1",1,4), title: "Reading: News Article", description: "Understand a Dominican news story", category: "reading", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Read about Carnaval de La Vega — every February, Dominicans celebrate with 'diablos cojuelos' (limping devils) wearing colorful masks and hitting people with vejigas (inflated bladders). It's the biggest carnival in the Caribbean." },
        { id: lid("esdo","B1",1,5), title: "Write an Opinion", description: "Express your views on a cultural topic", category: "writing", level: "B1", duration: 15, xp: 40, order: 5, culturalHint: "Write about Dominican cultural debates: Is dembow (Dominican urban music) art or noise? Should traditional merengue típico be preserved? Discuss using 'Yo creo que...', 'En mi opinión...', 'No estoy de acuerdo porque...'" },
      ],
    },
    {
      id: "es_do_b1_u2", title: "El Trabajo — Professional Life", level: "B1", order: 6,
      description: "Workplace communication, job interviews, and business Dominican",
      lessons: [
        { id: lid("esdo","B1",2,1), title: "Office Vocabulary", description: "Professional terms and workplace jargon", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1, culturalHint: "Dominican workplace culture — 'el jefe' (boss), 'la oficina' (office), 'el chin' (a little bit of work). In DR, relationships matter more than resumes. Learn: 'tener palanca' (having connections)." },
        { id: lid("esdo","B1",2,2), title: "Conditional Tense", description: "What would you do? Polite requests and hypotheticals", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2, culturalHint: "Polite Dominican requests: '¿Me podría dar un vasito de agua?' (Could you give me a glass of water?). Hypotheticals: 'Si ganara la lotería, me compraría una casa en Punta Cana'." },
        { id: lid("esdo","B1",2,3), title: "Job Interview Practice", description: "Role-play a Dominican job interview", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3, culturalHint: "Dominican job interviews start with small talk about family and neighborhood. 'Cuénteme de usted' (Tell me about yourself). Dress formally — Dominicans judge by appearance. Always say 'mucho gusto' with a firm handshake." },
        { id: lid("esdo","B1",2,4), title: "Reading: Job Posting", description: "Understand requirements in a Dominican job ad", category: "reading", level: "B1", duration: 10, xp: 30, order: 4, culturalHint: "Dominican job ads on LinkedIn and Trabajos.do — 'Se requiere' (Required), 'Experiencia mínima' (Minimum experience), 'Disponibilidad inmediata' (Available immediately). Many jobs found through 'boca a boca' (word of mouth)." },
        { id: lid("esdo","B1",2,5), title: "Write a Cover Letter", description: "Compose a professional cover letter in Spanish", category: "writing", level: "B1", duration: 15, xp: 45, order: 5, culturalHint: "Dominican cover letter format: 'Estimado/a Señor/a' (Dear Sir/Madam), mention your university (INTEC, PUCMM, UASD are top schools), end with 'Quedo a su disposición' (I remain at your disposal)." },
      ],
    },
    {
      id: "es_do_b2_u1", title: "Dominicanismos Avanzados", level: "B2", order: 7,
      description: "Advanced Dominican expressions, humor, and nuanced communication",
      lessons: [
        { id: lid("esdo","B2",1,1), title: "Advanced Slang & Idioms", description: "Tigueraje, vaina, jevi — deep Dominican expressions", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1, culturalHint: "Deep Dominican slang — 'vaina' (thing/situation, used in every sentence), 'tigueraje' (street smarts), 'jevi' (cool), 'ta' to' (everything's fine), 'guayar' (to dance close). These words define Dominican identity." },
        { id: lid("esdo","B2",1,2), title: "Complex Subjunctive", description: "Past subjunctive and hypothetical scenarios", category: "grammar", level: "B2", duration: 15, xp: 50, order: 2, culturalHint: "Hypothetical Dominican scenarios: 'Si yo hubiera nacido en Santiago, sería Águila' (If I'd been born in Santiago, I'd be an Águilas fan). Discuss what would have happened if Trujillo hadn't existed." },
        { id: lid("esdo","B2",1,3), title: "Dominican Humor & Storytelling", description: "Understand and tell Dominican jokes and anecdotes", category: "speaking", level: "B2", duration: 15, xp: 50, order: 3, culturalHint: "Dominican humor — 'cuentos de Juan Bobo' (folk tales), 'relajo' (playful teasing between friends), 'vacilando' (joking around). Dominicans use humor to cope with hardship. Learn to tell a 'cuento' with dramatic pauses." },
        { id: lid("esdo","B2",1,4), title: "Reading: Dominican Literature", description: "Analyze a passage from a Dominican author", category: "reading", level: "B2", duration: 15, xp: 45, order: 4, culturalHint: "Dominican literature — Juníot Díaz (Pulitzer winner, 'The Brief Wondrous Life of Oscar Wao'), Julia Alvarez ('In the Time of the Butterflies' about the Mirabal sisters who fought Trujillo), Pedro Mir (national poet)." },
        { id: lid("esdo","B2",1,5), title: "Write a Personal Essay", description: "Express complex ideas about identity and culture", category: "writing", level: "B2", duration: 18, xp: 55, order: 5, culturalHint: "Write about Dominican diaspora identity — 'dominicanyork' (Dominicans in NYC), code-switching between English and Spanish, the experience of 'volver a la tierra' (returning home). Explore what 'ser dominicano' means." },
      ],
    },
    {
      id: "es_do_c1_u1", title: "Maestría Dominicana", level: "C1", order: 8,
      description: "Near-native Dominican communication, register switching, and cultural depth",
      lessons: [
        { id: lid("esdo","C1",1,1), title: "Register Switching", description: "Move between formal, informal, and street Dominican", category: "vocabulary", level: "C1", duration: 15, xp: 50, order: 1, culturalHint: "Dominican register switching — same person speaks differently at church ('Que Dios le bendiga'), at the colmado ('Klk loco'), and at work ('Buenos días, licenciado'). Master all three registers to sound truly Dominican." },
        { id: lid("esdo","C1",1,2), title: "Rhetorical Devices", description: "Persuasion and emphasis in Dominican Spanish", category: "grammar", level: "C1", duration: 18, xp: 60, order: 2, culturalHint: "Dominican persuasion techniques — repetition ('mira, mira, mira'), exaggeration ('eso fue un millón de gente'), and the dramatic pause. Politicians use 'el pueblo dominicano merece...' (the Dominican people deserve...)." },
        { id: lid("esdo","C1",1,3), title: "Debate & Negotiation", description: "Argue and negotiate like a Dominican professional", category: "speaking", level: "C1", duration: 15, xp: 55, order: 3, culturalHint: "Dominican negotiation — 'regatear' (haggling) at the mercado is an art. Start at half price. Use: 'Ay no, eso ta' muy caro' (That's too expensive), 'Hágame un descuentito' (Give me a little discount)." },
        { id: lid("esdo","C1",1,4), title: "Reading: Political Analysis", description: "Understand Dominican political commentary", category: "reading", level: "C1", duration: 18, xp: 55, order: 4, culturalHint: "Dominican politics — understand commentary about 'la cosa pública' (public affairs). Learn political vocabulary: 'el presidente', 'el congreso', 'las elecciones', 'la corrupción'. Read opinion columns from Listin Diario or Diario Libre." },
        { id: lid("esdo","C1",1,5), title: "Write a Critical Review", description: "Compose a nuanced critique of Dominican media", category: "writing", level: "C1", duration: 20, xp: 60, order: 5, culturalHint: "Critique Dominican media — analyze a bachata song's lyrics, review a Dominican film (like 'Colao' or 'Perico Ripiao'), or write about how social media changed Dominican culture. Use academic language with Dominican flavor." },
      ],
    },
    {
      id: "es_do_c2_u1", title: "Fluidez Total", level: "C2", order: 9,
      description: "Complete mastery — think, dream, and create in Dominican Spanish",
      lessons: [
        { id: lid("esdo","C2",1,1), title: "Cultural Nuance Mastery", description: "Understand every layer of Dominican communication", category: "vocabulary", level: "C2", duration: 18, xp: 60, order: 1, culturalHint: "Master the unspoken rules — when a Dominican says 'ahorita' it could mean now, later, or never. 'Vamo' a ver' = probably not. Understanding tone, context, and body language is C2 mastery." },
        { id: lid("esdo","C2",1,2), title: "Stylistic Writing", description: "Use grammar for artistic and rhetorical effect", category: "grammar", level: "C2", duration: 20, xp: 70, order: 2, culturalHint: "Write like Juníot Díaz — mix English and Spanish, use Dominican rhythm in prose, break grammar rules intentionally for effect. Study how Dominican authors capture the music of everyday speech on paper." },
        { id: lid("esdo","C2",1,3), title: "Impromptu Storytelling", description: "Tell stories fluently in Dominican style", category: "speaking", level: "C2", duration: 15, xp: 65, order: 3, culturalHint: "Dominican storytelling tradition — every Dominican is a natural storyteller. Master 'el cuento largo' (the long story) with dramatic pauses, sound effects, character voices, and the punchline. Start with 'Mira, déjame decirte una vaina...'" },
        { id: lid("esdo","C2",1,4), title: "Reading: Satire & Irony", description: "Detect humor, sarcasm, and double meanings", category: "reading", level: "C2", duration: 18, xp: 60, order: 4, culturalHint: "Dominican satire — understand memes, political humor, and 'doble sentido' (double meanings). Read Dominican Twitter/X humor. Detect when 'Qué lindo' actually means the opposite." },
        { id: lid("esdo","C2",1,5), title: "Creative Writing", description: "Write a short story set in the Dominican Republic", category: "writing", level: "C2", duration: 25, xp: 75, order: 5, culturalHint: "Write a short story set in a Dominican barrio — capture the sounds (bachata from the colmado, motos, roosters at dawn), the smells (café colao, frying plátanos), and the characters (la vecina chismosa, el colmadero, el motoconchista)." },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPANISH — MEXICAN VARIANT
// ═══════════════════════════════════════════════════════════════════════════════
export const SPANISH_MEXICAN: LanguageCurriculum = {
  code: "es-MX",
  name: "Spanish",
  flag: "🇲🇽",
  dialect: "Mexican",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 85,
  units: [
    {
      id: "es_mx_a1_u1", title: "¡Órale! — First Steps", level: "A1", order: 1,
      description: "Mexican greetings, introductions, and essential phrases",
      lessons: [
        { id: lid("esmx","A1",1,1), title: "Mexican Greetings", description: "¿Qué onda?, ¿Qué pedo?, Buenas — how Mexicans say hello", category: "vocabulary", level: "A1", duration: 5, xp: 20, order: 1 , culturalHint: "In Mexico, '¿Qué onda?' is the casual 'What's up?' — literally 'What wave?' You'll hear it everywhere from CDMX to Guadalajara"},
        { id: lid("esmx","A1",1,2), title: "Introducing Yourself", description: "Me llamo... Soy de... — name and origin", category: "speaking", level: "A1", duration: 8, xp: 25, order: 2 , culturalHint: "Mexicans often greet with 'Buenas' any time of day. A handshake for men, a kiss on the cheek (un beso) for women — learn: el saludo, el beso, la mano"},
        { id: lid("esmx","A1",1,3), title: "Ser vs Estar", description: "The two 'to be' verbs with Mexican examples", category: "grammar", level: "A1", duration: 10, xp: 30, order: 3 , culturalHint: "Ser = permanent (Soy mexicano), Estar = temporary/location (Estoy en la Ciudad de México). Mexican saying: 'Ser o no ser, esa es la bronca'"},
        { id: lid("esmx","A1",1,4), title: "Numbers & Prices", description: "Counting pesos and understanding Mexican prices", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 4 , culturalHint: "Mexican currency: el peso mexicano. At tienditas, prices end in '.50' — learn: ¿Cuánto cuesta?, la feria (slang for money), el cambio"},
        { id: lid("esmx","A1",1,5), title: "At the Tiendita", description: "Understand a conversation at the corner store", category: "listening", level: "A1", duration: 6, xp: 25, order: 5 , culturalHint: "La tiendita (corner store) is the heart of every Mexican neighborhood — you buy everything from tortillas to phone credit (tiempo aire). Learn: la tiendita, el mandado, la cuenta"},
      ],
    },
    {
      id: "es_mx_a1_u2", title: "La Familia — Daily Life", level: "A1", order: 2,
      description: "Family, home, and Mexican daily routines",
      lessons: [
        { id: lid("esmx","A1",2,1), title: "Mi Familia Mexicana", description: "Family terms — abuelita, carnalito, compadre", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1 , culturalHint: "Mexican families are huge and close — la abuelita rules the kitchen, los primos are your best friends. Learn: la familia, el compadre, la madrina, el padrino"},
        { id: lid("esmx","A1",2,2), title: "Present Tense Verbs", description: "Regular -ar, -er, -ir conjugations", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2 , culturalHint: "Mexican daily verbs: desayunar (breakfast), comer (lunch at 2-3pm!), cenar (dinner at 8-9pm). The big meal is la comida, not dinner!"},
        { id: lid("esmx","A1",2,3), title: "Mi Rutina Diaria", description: "Describe your daily routine", category: "writing", level: "A1", duration: 10, xp: 30, order: 3 , culturalHint: "Mexican mornings start with café de olla (cinnamon coffee) or atole. Write about: mi rutina — me levanto, me baño, desayuno chilaquiles"},
        { id: lid("esmx","A1",2,4), title: "La Casa Mexicana", description: "Rooms, furniture, and household items", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4 , culturalHint: "La casa mexicana has a patio central, a cocina where abuela reigns, and la sala for telenovelas. Learn: el patio, la azotea, el zaguán"},
        { id: lid("esmx","A1",2,5), title: "Reading: A Text Message", description: "Understand informal Mexican texts", category: "reading", level: "A1", duration: 8, xp: 25, order: 5 , culturalHint: "Mexican texting: 'k' = que, 'x' = por, 'ntp' = no te preocupes, 'tkm' = te quiero mucho. Informal but universal among young Mexicans"},
      ],
    },
    {
      id: "es_mx_a2_u1", title: "En La Ciudad", level: "A2", order: 3,
      description: "Navigating Mexico City, transportation, and street life",
      lessons: [
        { id: lid("esmx","A2",1,1), title: "Asking for Directions", description: "Derecho, a la vuelta — Mexican direction giving", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1 , culturalHint: "In CDMX, directions use landmarks not street names: 'Pasando el Oxxo, antes del puente' — learn: la esquina, la cuadra, derecho, a la vuelta"},
        { id: lid("esmx","A2",1,2), title: "Past Tense — Preterite", description: "What happened yesterday — regular and irregular", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2 , culturalHint: "Mexican preterite is full of irregular gems: fui, hice, dije. Mexicans love storytelling — 'Ayer fui al tianguis y me encontré...'"},
        { id: lid("esmx","A2",1,3), title: "El Metro & Peseros", description: "Public transportation in Mexico", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3 , culturalHint: "El Metro de CDMX is one of the world's busiest. Each station has a symbol (not just a name) for literacy. Learn: la línea, el vagón, el pesero, el camión"},
        { id: lid("esmx","A2",1,4), title: "Reading: City Guide", description: "Follow a tourist guide to CDMX landmarks", category: "reading", level: "A2", duration: 10, xp: 30, order: 4 , culturalHint: "CDMX landmarks: el Zócalo, el Ángel de la Independencia, Chapultepec, Coyoacán (where Frida lived). Learn: el centro histórico, la plaza, el museo"},
        { id: lid("esmx","A2",1,5), title: "Write About Your City", description: "Describe your favorite places", category: "writing", level: "A2", duration: 12, xp: 35, order: 5 , culturalHint: "Describe your colonia (neighborhood) — every Mexican city has colonias with distinct personalities. Learn: la colonia, el barrio, la calle, la avenida"},
      ],
    },
    {
      id: "es_mx_a2_u2", title: "La Comida Mexicana", level: "A2", order: 4,
      description: "Mexican cuisine, street food, and ordering at taquerías",
      lessons: [
        { id: lid("esmx","A2",2,1), title: "Mexican Food Vocabulary", description: "Tacos, tamales, pozole — essential dishes", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1 , culturalHint: "Mexican food vocabulary: los tacos (al pastor, de suadero, de canasta), los tamales, el pozole, las enchiladas, el mole, los elotes, los esquites"},
        { id: lid("esmx","A2",2,2), title: "Ordering at a Taquería", description: "How to order food at Mexican street stands", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2 , culturalHint: "At a taquería: '¿De qué van a ser?' means 'What kind?' Reply: 'Deme tres de pastor con todo' (cilantro, cebolla, salsa). Learn: la orden, para llevar, para aquí"},
        { id: lid("esmx","A2",2,3), title: "Imperfect Tense", description: "Talking about what you used to eat as a kid", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3 , culturalHint: "Imperfect for childhood memories: 'Cuando era niño, mi abuela hacía tamales en diciembre' — Mexican Christmas tradition of making tamales together"},
        { id: lid("esmx","A2",2,4), title: "Reading: A Recipe", description: "Follow a recipe for mole poblano", category: "reading", level: "A2", duration: 10, xp: 30, order: 4 , culturalHint: "El mole poblano has 30+ ingredients including chocolate. Follow the recipe: los chiles secos, el ajonjolí, la tablilla de chocolate, el guajolote (turkey)"},
        { id: lid("esmx","A2",2,5), title: "Listening: At the Mercado", description: "Understand vendors at the market", category: "listening", level: "A2", duration: 8, xp: 25, order: 5 , culturalHint: "El mercado (like La Merced or Mercado de Jamaica) — vendors shout '¡Pásele, güerita!' Learn: el puesto, la marchanta, la báscula, el kilo"},
      ],
    },
    {
      id: "es_mx_b1_u1", title: "Cultura Mexicana", level: "B1", order: 5,
      description: "Mexican culture, traditions, and social dynamics",
      lessons: [
        { id: lid("esmx","B1",1,1), title: "Fiestas & Traditions", description: "Día de Muertos, quinceañeras, posadas", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1 , culturalHint: "Día de Muertos (Nov 1-2): la ofrenda, las calaveritas de azúcar, el pan de muerto, la flor de cempasúchil, los altares. NOT Halloween — it celebrates life!"},
        { id: lid("esmx","B1",1,2), title: "Subjunctive Mood", description: "Expressing wishes, doubts, and emotions", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2 , culturalHint: "Subjunctive in Mexican culture: 'Ojalá que llueva café' (Juan Luis Guerra). Mexicans use it constantly: 'Espero que estés bien', 'Que te vaya bien'"},
        { id: lid("esmx","B1",1,3), title: "Discussing Movies & Music", description: "Talk about Mexican cinema and music", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3 , culturalHint: "Mexican cinema: Alfonso Cuarón (Roma), Guillermo del Toro, Gael García Bernal. Music: mariachi, norteño, banda, corridos tumbados. Learn: la película, el cine, la canción"},
        { id: lid("esmx","B1",1,4), title: "Reading: News Article", description: "Understand a Mexican news story", category: "reading", level: "B1", duration: 12, xp: 35, order: 4 , culturalHint: "Mexican news sources: El Universal, Reforma, Proceso. Current issues: la migración, la seguridad, el medio ambiente. Learn: las noticias, el reportaje, la nota"},
        { id: lid("esmx","B1",1,5), title: "Write an Opinion Piece", description: "Express views on a cultural topic", category: "writing", level: "B1", duration: 15, xp: 40, order: 5 , culturalHint: "Write about quinceañeras, posadas, or el Grito de Independencia (Sept 15). Cultural opinion: '¿Se están perdiendo las tradiciones mexicanas?'"},
      ],
    },
    {
      id: "es_mx_b1_u2", title: "El Trabajo", level: "B1", order: 6,
      description: "Professional Mexican Spanish for the workplace",
      lessons: [
        { id: lid("esmx","B1",2,1), title: "Office & Business Terms", description: "Professional vocabulary and workplace jargon", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1 , culturalHint: "Mexican office culture: the jefe, la junta (meeting), el puente (long weekend). 'Hacer la barba' = to brown-nose. Learn: la chamba (work), el jale, la oficina"},
        { id: lid("esmx","B1",2,2), title: "Conditional Tense", description: "Polite requests and hypothetical situations", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2 , culturalHint: "Conditional for politeness: '¿Podría ayudarme?' is more Mexican than '¿Puede?' — Mexicans value indirect speech: 'Sería posible que...', 'Me gustaría...'"},
        { id: lid("esmx","B1",2,3), title: "Job Interview", description: "Practice a Mexican job interview", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3 , culturalHint: "Mexican job interviews: arrive 15 min early, use usted, bring copies of your INE and CURP. Learn: la entrevista, el puesto, las prestaciones, el aguinaldo"},
        { id: lid("esmx","B1",2,4), title: "Reading: Job Posting", description: "Understand a Mexican job advertisement", category: "reading", level: "B1", duration: 10, xp: 30, order: 4 , culturalHint: "Mexican job ads on OCC Mundial or LinkedIn: 'Se solicita', 'Requisitos', 'Ofrecemos'. Learn: el sueldo, las prestaciones de ley, el horario, el contrato"},
        { id: lid("esmx","B1",2,5), title: "Write a CV", description: "Compose a professional résumé in Spanish", category: "writing", level: "B1", duration: 15, xp: 45, order: 5 , culturalHint: "Mexican CV format: include photo, CURP, RFC. Different from US résumés! Learn: la experiencia laboral, la formación académica, las referencias"},
      ],
    },
    {
      id: "es_mx_b2_u1", title: "Mexicanismos", level: "B2", order: 7,
      description: "Advanced Mexican slang, humor, and nuanced expression",
      lessons: [
        { id: lid("esmx","B2",1,1), title: "Advanced Slang", description: "Neta, chido, güey, no mames — deep Mexican expressions", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1 , culturalHint: "Mexican slang deep dive: 'Neta' (truth/really), 'Chido' (cool), 'No mames' (no way!), 'Güey' (dude), 'Pedo' (problem/drunk/fart depending on context)"},
        { id: lid("esmx","B2",1,2), title: "Complex Subjunctive", description: "Past subjunctive and si clauses", category: "grammar", level: "B2", duration: 15, xp: 50, order: 2 , culturalHint: "Past subjunctive in Mexican speech: 'Si tuviera lana, me iba a Cancún' — Mexicans often use imperfect indicative instead: 'Si tenía...' (colloquial)"},
        { id: lid("esmx","B2",1,3), title: "Mexican Humor", description: "Understand albur, double meanings, and jokes", category: "speaking", level: "B2", duration: 15, xp: 50, order: 3 , culturalHint: "El albur: Mexican double-meaning wordplay, a cultural art form. Understanding it requires deep vocabulary and quick wit. Learn: el doble sentido, la picardía"},
        { id: lid("esmx","B2",1,4), title: "Reading: Mexican Literature", description: "Analyze a passage from a Mexican author", category: "reading", level: "B2", duration: 15, xp: 45, order: 4 , culturalHint: "Mexican literature: Octavio Paz (El Laberinto de la Soledad), Juan Rulfo (Pedro Páramo), Laura Esquivel (Como Agua para Chocolate). Learn: el autor, la novela, el cuento"},
        { id: lid("esmx","B2",1,5), title: "Write a Personal Essay", description: "Express complex ideas about identity", category: "writing", level: "B2", duration: 18, xp: 55, order: 5 , culturalHint: "Write about Mexican identity: mestizaje, la Malinche, el malinchismo, la mexicanidad. Complex cultural concepts that define modern Mexico"},
      ],
    },
    {
      id: "es_mx_c1_u1", title: "Dominio Avanzado", level: "C1", order: 8,
      description: "Near-native Mexican communication and professional mastery",
      lessons: [
        { id: lid("esmx","C1",1,1), title: "Register & Tone", description: "Formal vs informal vs street Mexican", category: "vocabulary", level: "C1", duration: 15, xp: 50, order: 1 , culturalHint: "Mexican registers: formal (usted, licenciado), informal (tú, güey), street (vato, carnal, morro). Code-switching between them is a social skill"},
        { id: lid("esmx","C1",1,2), title: "Advanced Rhetoric", description: "Persuasion techniques in Mexican Spanish", category: "grammar", level: "C1", duration: 18, xp: 60, order: 2 , culturalHint: "Mexican rhetoric: politicians use diminutives to seem humble ('un momentito'), repetition for emphasis, and cultural references (Benito Juárez quotes)"},
        { id: lid("esmx","C1",1,3), title: "Public Speaking", description: "Give a presentation in Mexican Spanish", category: "speaking", level: "C1", duration: 15, xp: 55, order: 3 , culturalHint: "Give a presentation Mexican-style: start with a joke or anecdote, use 'como bien sabemos...', end with 'quedo a sus órdenes'. Learn: la ponencia, la exposición"},
        { id: lid("esmx","C1",1,4), title: "Reading: Academic Text", description: "Understand Mexican academic writing", category: "reading", level: "C1", duration: 18, xp: 55, order: 4 , culturalHint: "Mexican academic writing: UNAM style, formal register, extensive citations. Learn: la tesis, el ensayo académico, las fuentes, la bibliografía"},
        { id: lid("esmx","C1",1,5), title: "Write a Research Summary", description: "Compose a formal academic summary", category: "writing", level: "C1", duration: 20, xp: 60, order: 5 , culturalHint: "Write a research summary on a Mexican topic: la economía informal, el sistema educativo, la migración, las lenguas indígenas (Náhuatl, Maya, Zapoteco)"},
      ],
    },
    {
      id: "es_mx_c2_u1", title: "Fluidez Nativa", level: "C2", order: 9,
      description: "Complete mastery of Mexican Spanish in all contexts",
      lessons: [
        { id: lid("esmx","C2",1,1), title: "Cultural Deep Dive", description: "Understand every layer of Mexican communication", category: "vocabulary", level: "C2", duration: 18, xp: 60, order: 1 , culturalHint: "Deep Mexican communication: the meaning behind 'ahorita' (could be now or never), 'sí' that means 'no', indirect refusals. Cultural pragmatics mastery"},
        { id: lid("esmx","C2",1,2), title: "Stylistic Mastery", description: "Use grammar for artistic effect", category: "grammar", level: "C2", duration: 20, xp: 70, order: 2 , culturalHint: "Stylistic mastery: write like Octavio Paz (poetic essays), Carlos Monsiváis (cultural criticism), Elena Poniatowska (testimonial literature)"},
        { id: lid("esmx","C2",1,3), title: "Impromptu Debate", description: "Debate any topic fluently in Mexican style", category: "speaking", level: "C2", duration: 15, xp: 65, order: 3 , culturalHint: "Debate Mexican-style: passionate but respectful, use of 'con todo respeto...', ability to navigate sensitive topics (politics, religion, football) with grace"},
        { id: lid("esmx","C2",1,4), title: "Reading: Satire", description: "Detect irony and humor in Mexican media", category: "reading", level: "C2", duration: 18, xp: 60, order: 4 , culturalHint: "Mexican media literacy: detect irony in El Deforma (satire), understand memes (el Pepe, la grasa), political cartoons. Learn: la sátira, el humor negro, la ironía"},
        { id: lid("esmx","C2",1,5), title: "Creative Writing", description: "Write a short story set in Mexico", category: "writing", level: "C2", duration: 25, xp: 75, order: 5 , culturalHint: "Write a short story set in Mexico: use regionalismos, capture the rhythm of Mexican speech, weave in cultural references (la Virgen de Guadalupe, el metro, la milpa)"},
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// FRENCH
// ═══════════════════════════════════════════════════════════════════════════════
export const FRENCH: LanguageCurriculum = {
  code: "fr",
  name: "French",
  flag: "🇫🇷",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 90,
  units: [
    {
      id: "fr_a1_u1", title: "Bonjour! — Premiers Pas", level: "A1", order: 1,
      description: "French greetings, introductions, and essential phrases",
      lessons: [
        { id: lid("fr","A1",1,1), title: "Greetings & Politeness", description: "Bonjour, bonsoir, s'il vous plaît, merci", category: "vocabulary", level: "A1", duration: 5, xp: 20, order: 1 , culturalHint: "French greetings change by time: Bonjour (morning/afternoon), Bonsoir (evening). ALWAYS say 'Bonjour' when entering a shop — it's rude not to! Learn: la politesse, la bise"},
        { id: lid("fr","A1",1,2), title: "Introducing Yourself", description: "Je m'appelle... Je suis... — name and nationality", category: "speaking", level: "A1", duration: 8, xp: 25, order: 2 , culturalHint: "La bise (cheek kiss) varies by region: 2 in Paris, 3 in Provence, 4 in some areas! Learn: se présenter, enchanté(e), je m'appelle, je suis de..."},
        { id: lid("fr","A1",1,3), title: "Être & Avoir", description: "The two essential verbs: to be and to have", category: "grammar", level: "A1", duration: 10, xp: 30, order: 3 , culturalHint: "Être (to be) & Avoir (to have) are the foundation. French saying: 'Avoir ou être, telle est la question.' Learn: je suis, j'ai, nous sommes, nous avons"},
        { id: lid("fr","A1",1,4), title: "Numbers 1-100", description: "French counting system (soixante-dix, quatre-vingts)", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 4 , culturalHint: "French numbers are famously complex: 70 = soixante-dix (60+10), 80 = quatre-vingts (4×20), 90 = quatre-vingt-dix (4×20+10). Belgian French uses septante, nonante!"},
        { id: lid("fr","A1",1,5), title: "At the Boulangerie", description: "Understand ordering bread and pastries", category: "listening", level: "A1", duration: 6, xp: 25, order: 5 , culturalHint: "La boulangerie is sacred in France. Every neighborhood has one. Learn: une baguette, un croissant, un pain au chocolat, une tarte aux fruits. 'Je voudrais une baguette, s'il vous plaît'"},
      ],
    },
    {
      id: "fr_a1_u2", title: "La Vie Quotidienne", level: "A1", order: 2,
      description: "Family, home, and French daily routines",
      lessons: [
        { id: lid("fr","A1",2,1), title: "Ma Famille", description: "Family vocabulary with gender rules", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1 , culturalHint: "French family: la famille is central. Sunday lunch (le déjeuner du dimanche) gathers everyone. Learn: les parents, les grands-parents, les enfants, le repas de famille"},
        { id: lid("fr","A1",2,2), title: "Present Tense -ER Verbs", description: "Regular first group verb conjugations", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2 , culturalHint: "French -ER verbs: parler, manger, danser, chanter. 80% of French verbs are -ER! Practice with: 'Je mange un croissant', 'Nous dansons la valse'"},
        { id: lid("fr","A1",2,3), title: "Ma Journée", description: "Describe your typical day in French", category: "writing", level: "A1", duration: 10, xp: 30, order: 3 , culturalHint: "French daily routine: le petit-déjeuner (café + tartine), le déjeuner (2-hour lunch!), le goûter (4pm snack), le dîner. Write about YOUR journée française"},
        { id: lid("fr","A1",2,4), title: "La Maison", description: "Rooms, furniture, and prepositions of place", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4 , culturalHint: "La maison française: le salon (living room), la cuisine (kitchen), la chambre (bedroom), la salle de bains. French apartments have un balcon for morning coffee"},
        { id: lid("fr","A1",2,5), title: "Reading: A Postcard", description: "Understand a simple French postcard", category: "reading", level: "A1", duration: 8, xp: 25, order: 5 , culturalHint: "French postcards (les cartes postales) are still popular! From vacation: 'Chers amis, je suis à Nice. Il fait beau. La mer est magnifique. Bisous!'"},
      ],
    },
    {
      id: "fr_a2_u1", title: "En Ville", level: "A2", order: 3,
      description: "Navigating a French city, shopping, and daily errands",
      lessons: [
        { id: lid("fr","A2",1,1), title: "Asking for Directions", description: "Tournez à gauche, allez tout droit", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1 , culturalHint: "French directions: 'Tournez à gauche au feu rouge, continuez tout droit, c'est sur votre droite.' Parisians walk fast — learn: le carrefour, le rond-point, le passage piéton"},
        { id: lid("fr","A2",1,2), title: "Passé Composé", description: "Talking about what you did — avoir vs être", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2 , culturalHint: "Passé composé with être: 16 verbs of motion (DR MRS VANDERTRAMP). 'Je suis allé(e) au marché' — agreement with subject! French grammar loves agreement"},
        { id: lid("fr","A2",1,3), title: "Shopping Vocabulary", description: "At the market, pharmacy, and clothing store", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3 , culturalHint: "French shopping: le marché (market), la pharmacie (green cross sign), le tabac (cigarettes + stamps + lotto). Learn: faire les courses, le caddie, la caisse"},
        { id: lid("fr","A2",1,4), title: "Reading: A Menu", description: "Understand a French restaurant menu", category: "reading", level: "A2", duration: 10, xp: 30, order: 4 , culturalHint: "French restaurant menu structure: l'entrée (starter, NOT main!), le plat principal, le fromage, le dessert. 'Le menu' = fixed price meal. 'La carte' = à la carte"},
        { id: lid("fr","A2",1,5), title: "Write About a Trip", description: "Describe a recent outing in passé composé", category: "writing", level: "A2", duration: 12, xp: 35, order: 5 , culturalHint: "Write about a trip using passé composé: 'Le week-end dernier, je suis allé(e) à Versailles. J'ai visité le château. C'était magnifique!'"},
      ],
    },
    {
      id: "fr_a2_u2", title: "À Table!", level: "A2", order: 4,
      description: "French cuisine, dining etiquette, and food culture",
      lessons: [
        { id: lid("fr","A2",2,1), title: "French Food Vocabulary", description: "Croissant, crêpe, coq au vin — essential dishes", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1 , culturalHint: "French cuisine vocabulary: le coq au vin, la ratatouille, le boeuf bourguignon, la quiche lorraine, les escargots, le foie gras, la crème brûlée, le soufflé"},
        { id: lid("fr","A2",2,2), title: "Ordering at a Restaurant", description: "Je voudrais... L'addition, s'il vous plaît", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2 , culturalHint: "Ordering in France: 'Je voudrais le menu à 25 euros' / 'L'addition, s'il vous plaît.' Never rush — dining is an event! Learn: le serveur, la serveuse, le pourboire"},
        { id: lid("fr","A2",2,3), title: "Imparfait", description: "Describing habits and states in the past", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3 , culturalHint: "L'imparfait for French memories: 'Quand j'étais petit(e), ma grand-mère faisait des crêpes le dimanche.' La Chandeleur (Feb 2) = crêpe day in France!"},
        { id: lid("fr","A2",2,4), title: "Reading: A Recipe", description: "Follow a French recipe for quiche lorraine", category: "reading", level: "A2", duration: 10, xp: 30, order: 4 , culturalHint: "La quiche lorraine recipe: la pâte brisée, les lardons, la crème fraîche, les oeufs, le gruyère. French cooking = precision + fresh ingredients + patience"},
        { id: lid("fr","A2",2,5), title: "Listening: At the Café", description: "Understand a conversation at a Parisian café", category: "listening", level: "A2", duration: 8, xp: 25, order: 5 , culturalHint: "Au café parisien: un express (espresso), un crème (latte), un chocolat chaud. Sitting at la terrasse costs more! Learn: le comptoir, la terrasse, l'intérieur"},
      ],
    },
    {
      id: "fr_b1_u1", title: "Culture & Société", level: "B1", order: 5,
      description: "French culture, cinema, art, and social issues",
      lessons: [
        { id: lid("fr","B1",1,1), title: "Art & Cinema", description: "Discuss French films, art movements, and museums", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1 , culturalHint: "French art: l'Impressionnisme (Monet, Renoir), le Louvre, le Musée d'Orsay. French cinema: la Nouvelle Vague (Godard, Truffaut). Learn: le réalisateur, le chef-d'oeuvre, l'exposition"},
        { id: lid("fr","B1",1,2), title: "Subjonctif", description: "Expressing necessity, doubt, and emotion", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2 , culturalHint: "Le subjonctif expresses doubt/emotion: 'Il faut que tu viennes', 'Je suis content que tu sois là.' French speakers debate whether it's dying — it's not!"},
        { id: lid("fr","B1",1,3), title: "Discussing Current Events", description: "Talk about news and social issues", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3 , culturalHint: "French current events: la laïcité, les gilets jaunes, la francophonie, l'écologie. Discuss: 'Je pense que...', 'À mon avis...', 'Il me semble que...'"},
        { id: lid("fr","B1",1,4), title: "Reading: Magazine Article", description: "Understand a French magazine feature", category: "reading", level: "B1", duration: 12, xp: 35, order: 4 , culturalHint: "French magazines: Paris Match, Le Point, L'Express, Elle. Reading style: longer sentences, more formal than English. Learn: l'article, le reportage, l'éditorial"},
        { id: lid("fr","B1",1,5), title: "Write a Review", description: "Review a film or book in French", category: "writing", level: "B1", duration: 15, xp: 40, order: 5 , culturalHint: "Write a film review: 'Amélie' (Le Fabuleux Destin d'Amélie Poulain) — discuss le scénario, la mise en scène, les acteurs, la bande originale"},
      ],
    },
    {
      id: "fr_b1_u2", title: "Le Monde du Travail", level: "B1", order: 6,
      description: "Professional French for the workplace",
      lessons: [
        { id: lid("fr","B1",2,1), title: "Business Vocabulary", description: "Office, meetings, and professional terms", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1 , culturalHint: "French workplace: les 35 heures (35-hour work week), les RTT (extra days off), la pause déjeuner (sacred!). Learn: le bureau, la réunion, le collègue, les congés"},
        { id: lid("fr","B1",2,2), title: "Conditionnel", description: "Polite requests and hypothetical situations", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2 , culturalHint: "Le conditionnel for politeness: 'Je voudrais...', 'Pourriez-vous...', 'Serait-il possible de...' — French business communication is VERY formal and indirect"},
        { id: lid("fr","B1",2,3), title: "Job Interview", description: "Practice a French job interview", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3 , culturalHint: "French job interview: 'Parlez-moi de vous', 'Quelles sont vos qualités/défauts?' Always use vous, dress formally. Learn: le poste, les compétences, l'expérience"},
        { id: lid("fr","B1",2,4), title: "Reading: Job Posting", description: "Understand a French job advertisement", category: "reading", level: "B1", duration: 10, xp: 30, order: 4 , culturalHint: "French job ads on Pôle Emploi or Indeed.fr: 'CDI' (permanent), 'CDD' (temporary), 'Stage' (internship). Learn: le salaire, les avantages, le télétravail"},
        { id: lid("fr","B1",2,5), title: "Write a Lettre de Motivation", description: "Compose a French cover letter", category: "writing", level: "B1", duration: 15, xp: 45, order: 5 , culturalHint: "La lettre de motivation: formal French letter format with city+date, 'Madame, Monsieur,' opening, 'Veuillez agréer...' closing. Very structured and formulaic"},
      ],
    },
    {
      id: "fr_b2_u1", title: "Nuances Françaises", level: "B2", order: 7,
      description: "Advanced French idioms, humor, and sophisticated expression",
      lessons: [
        { id: lid("fr","B2",1,1), title: "Idioms & Expressions", description: "Avoir le cafard, poser un lapin — French idioms", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1 , culturalHint: "French idioms: 'Avoir le cafard' (to feel down, literally 'have the cockroach'), 'Poser un lapin' (to stand someone up), 'Avoir la flemme' (to be lazy), 'C'est la galère' (it's a nightmare)"},
        { id: lid("fr","B2",1,2), title: "Plus-que-parfait & Concordance", description: "Complex tense sequences in narration", category: "grammar", level: "B2", duration: 15, xp: 50, order: 2 , culturalHint: "Plus-que-parfait in narration: 'J'avais déjà mangé quand il est arrivé.' French literature uses complex tense sequences — le passé simple, l'imparfait, le plus-que-parfait together"},
        { id: lid("fr","B2",1,3), title: "Debating in French", description: "Express and defend opinions with nuance", category: "speaking", level: "B2", duration: 15, xp: 50, order: 3 , culturalHint: "French debate culture: 'Je ne suis pas d'accord', 'Certes... mais...', 'En revanche...'. The French love intellectual debate — at dinner, at cafés, on TV. It's an art form"},
        { id: lid("fr","B2",1,4), title: "Reading: French Literature", description: "Analyze a passage from a French novel", category: "reading", level: "B2", duration: 15, xp: 45, order: 4 , culturalHint: "French literature: Victor Hugo, Albert Camus (L'Étranger), Simone de Beauvoir, Marcel Proust. Analyze: le style, le thème, la métaphore, le personnage"},
        { id: lid("fr","B2",1,5), title: "Write an Argumentative Essay", description: "Compose a structured dissertation", category: "writing", level: "B2", duration: 18, xp: 55, order: 5 , culturalHint: "La dissertation française: introduction (amorce + problématique + annonce du plan), thèse, antithèse, synthèse, conclusion. Very rigid structure!"},
      ],
    },
    {
      id: "fr_c1_u1", title: "Maîtrise", level: "C1", order: 8,
      description: "Near-native French communication and cultural depth",
      lessons: [
        { id: lid("fr","C1",1,1), title: "Registres de Langue", description: "Formal, familiar, argot, and verlan", category: "vocabulary", level: "C1", duration: 15, xp: 50, order: 1 , culturalHint: "French registers: soutenu (literary), courant (standard), familier (informal), argot (slang), verlan (reversed syllables: meuf=femme, ouf=fou, relou=lourd)"},
        { id: lid("fr","C1",1,2), title: "Subjonctif Passé & Style", description: "Advanced subjunctive and literary tenses", category: "grammar", level: "C1", duration: 18, xp: 60, order: 2 , culturalHint: "Le subjonctif passé + literary tenses: le passé simple (il alla, elle vit), l'imparfait du subjonctif (qu'il fût). Used in literature and formal speeches"},
        { id: lid("fr","C1",1,3), title: "Persuasive Speaking", description: "Convince and negotiate in French", category: "speaking", level: "C1", duration: 15, xp: 55, order: 3 , culturalHint: "French persuasion: 'Force est de constater que...', 'Il va sans dire que...', 'Nul ne peut nier que...' — master the art of French rhetorical elegance"},
        { id: lid("fr","C1",1,4), title: "Reading: Philosophy", description: "Understand French philosophical writing", category: "reading", level: "C1", duration: 18, xp: 55, order: 4 , culturalHint: "French philosophy: Descartes ('Je pense, donc je suis'), Sartre (l'existentialisme), Foucault, Derrida. Read: la pensée, le concept, l'argument, la thèse"},
        { id: lid("fr","C1",1,5), title: "Write a Critique", description: "Compose a literary or cultural critique", category: "writing", level: "C1", duration: 20, xp: 60, order: 5 , culturalHint: "Write a critique littéraire: analyze structure, style, themes, and cultural context. Use: 'L'auteur met en lumière...', 'On peut interpréter...', 'Cette oeuvre témoigne de...'"},
      ],
    },
    {
      id: "fr_c2_u1", title: "Perfection", level: "C2", order: 9,
      description: "Complete mastery — think and create in French",
      lessons: [
        { id: lid("fr","C2",1,1), title: "Cultural Mastery", description: "Understand every nuance of French communication", category: "vocabulary", level: "C2", duration: 18, xp: 60, order: 1 , culturalHint: "French cultural mastery: understand la politesse française (indirect communication), l'ironie, le second degré, les non-dits (what's left unsaid is as important as what's said)"},
        { id: lid("fr","C2",1,2), title: "Stylistic Grammar", description: "Use grammar for rhetorical and artistic effect", category: "grammar", level: "C2", duration: 20, xp: 70, order: 2 , culturalHint: "Stylistic grammar: use the passé simple for literary effect, the subjonctif imparfait for elegance, inversion for formal register. Write like Proust — long, layered sentences"},
        { id: lid("fr","C2",1,3), title: "Impromptu Discourse", description: "Speak fluently on any topic without preparation", category: "speaking", level: "C2", duration: 15, xp: 65, order: 3 , culturalHint: "Impromptu discourse: speak on philosophy, politics, art, gastronomy without preparation. Use: 'Il convient de souligner...', 'À bien y réfléchir...', 'Tout compte fait...'"},
        { id: lid("fr","C2",1,4), title: "Reading: Satire & Irony", description: "Detect humor and subtext in French media", category: "reading", level: "C2", duration: 18, xp: 60, order: 4 , culturalHint: "French satire: Le Canard Enchaîné, Les Guignols, Coluche. Detect: l'ironie, le sarcasme, la parodie, la caricature. French humor = intellectual + irreverent"},
        { id: lid("fr","C2",1,5), title: "Creative Writing", description: "Write a short story or poem in French", category: "writing", level: "C2", duration: 25, xp: 75, order: 5 , culturalHint: "Write a nouvelle (short story) or poem in French. Use literary devices: la métaphore, l'allégorie, le symbole, l'anaphore. Channel Maupassant, Baudelaire, or Prévert"},
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// PORTUGUESE (Brazilian)
// ═══════════════════════════════════════════════════════════════════════════════
export const PORTUGUESE: LanguageCurriculum = {
  code: "pt",
  name: "Portuguese",
  flag: "🇧🇷",
  dialect: "Brazilian",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 85,
  units: [
    {
      id: "pt_a1_u1", title: "E aí! — Primeiros Passos", level: "A1", order: 1,
      description: "Brazilian greetings, introductions, and essential phrases",
      lessons: [
        { id: lid("pt","A1",1,1), title: "Brazilian Greetings", description: "E aí, beleza, tudo bem? — how Brazilians say hello", category: "vocabulary", level: "A1", duration: 5, xp: 20, order: 1 , culturalHint: "Brazilian greetings are warm: 'E aí, beleza?' (Hey, all good?), 'Tudo bem?' (Everything well?), 'Oi, sumido!' (Hey, stranger!). Learn: o abraço, o beijo, a saudade"},
        { id: lid("pt","A1",1,2), title: "Introducing Yourself", description: "Meu nome é... Eu sou de...", category: "speaking", level: "A1", duration: 8, xp: 25, order: 2 , culturalHint: "Brazilians are physical greeters: men hug (abraço), women kiss cheeks (beijinho). In Rio it's 2 kisses, São Paulo 1. Learn: cumprimentar, se apresentar, prazer em conhecer"},
        { id: lid("pt","A1",1,3), title: "Ser vs Estar", description: "The two 'to be' verbs in Portuguese", category: "grammar", level: "A1", duration: 10, xp: 30, order: 3 , culturalHint: "Ser vs Estar in Brazilian life: 'Sou brasileiro' (permanent) vs 'Estou em São Paulo' (location). Brazilian saying: 'A vida é assim' (That's life)"},
        { id: lid("pt","A1",1,4), title: "Numbers & Money", description: "Counting reais and understanding prices", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 4 , culturalHint: "Brazilian currency: o real (plural: reais). At the padaria: 'Quanto custa?' / 'Tá quanto?' (informal). Learn: o troco, o cartão, o Pix (Brazil's instant payment system!)"},
        { id: lid("pt","A1",1,5), title: "At the Padaria", description: "Understand ordering at a Brazilian bakery", category: "listening", level: "A1", duration: 6, xp: 25, order: 5 , culturalHint: "A padaria (bakery) is Brazil's social hub — open early for café da manhã. Learn: o pão francês, o café com leite, o suco de laranja, a coxinha, o pão de queijo"},
      ],
    },
    {
      id: "pt_a1_u2", title: "Dia a Dia", level: "A1", order: 2,
      description: "Family, home, and Brazilian daily routines",
      lessons: [
        { id: lid("pt","A1",2,1), title: "Minha Família", description: "Family vocabulary — mãe, pai, irmão, tio", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1 , culturalHint: "Brazilian family is everything: a mãe (mom rules), o pai, os avós, os tios. Sunday = almoço de família (family lunch with feijoada or churrasco)"},
        { id: lid("pt","A1",2,2), title: "Present Tense", description: "Regular verb conjugations in Portuguese", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2 , culturalHint: "Brazilian present tense: eu falo, você fala (Brazilians use 'você' not 'tu' in most regions). Practice: 'Eu moro no Brasil', 'A gente vai à praia'"},
        { id: lid("pt","A1",2,3), title: "Minha Rotina", description: "Describe your daily routine", category: "writing", level: "A1", duration: 10, xp: 30, order: 3 , culturalHint: "Brazilian routine: acordar, tomar café, ir pro trabalho, almoçar (lunch is BIG — rice + beans + meat + salad), voltar pra casa, jantar, dormir"},
        { id: lid("pt","A1",2,4), title: "Em Casa", description: "Rooms and household items", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4 , culturalHint: "Brazilian home: a sala (living room with TV for novelas), a cozinha, o quarto, a varanda. Many homes have a churrasqueira (BBQ grill) in the backyard"},
        { id: lid("pt","A1",2,5), title: "Reading: WhatsApp Chat", description: "Understand informal Brazilian messages", category: "reading", level: "A1", duration: 8, xp: 25, order: 5 , culturalHint: "Brazilian WhatsApp culture: everyone uses it! 'Oi', 'Blz?', 'Tmj' (tamo junto = we're together), 'Flw' (falou = bye), voice messages are VERY common"},
      ],
    },
    { id: "pt_a2_u1", title: "Na Cidade", level: "A2", order: 3, description: "Navigating Brazilian cities and transportation", lessons: [
      { id: lid("pt","A2",1,1), title: "Directions", description: "Vira à esquerda, segue reto", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1 , culturalHint: "Brazilian directions: 'Segue reto, vira à esquerda no semáforo.' In Rio: 'Sobe o morro' / 'Desce pra praia.' Learn: a esquina, o sinal, a rotatória, o retorno"},
      { id: lid("pt","A2",1,2), title: "Pretérito Perfeito", description: "Simple past tense", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2 , culturalHint: "Pretérito perfeito: 'Ontem eu fui à praia e tomei uma água de coco.' Brazilian storytelling is animated — use gestures and expressions! Learn: aconteceu, foi, fiz"},
      { id: lid("pt","A2",1,3), title: "Transportation", description: "Ônibus, metrô, Uber vocabulary", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3 , culturalHint: "Brazilian transport: o ônibus, o metrô, o Uber (everyone uses it!), a van, a bicicleta. In São Paulo: 'Pegar o metrô na Paulista'. Learn: o ponto, a estação, o bilhete"},
      { id: lid("pt","A2",1,4), title: "Reading: City Guide", description: "Follow a guide to Rio landmarks", category: "reading", level: "A2", duration: 10, xp: 30, order: 4 , culturalHint: "Rio landmarks: o Cristo Redentor, o Pão de Açúcar, Copacabana, Lapa. São Paulo: a Avenida Paulista, o Ibirapuera, a Liberdade. Learn: o ponto turístico, a vista, o mirante"},
      { id: lid("pt","A2",1,5), title: "Write About Your Bairro", description: "Describe your neighborhood", category: "writing", level: "A2", duration: 12, xp: 35, order: 5 , culturalHint: "Describe your bairro (neighborhood): 'Moro num bairro tranquilo com padaria na esquina e uma praça bonita.' Learn: a vizinhança, o comércio, a feira"},
    ]},
    { id: "pt_a2_u2", title: "Comida Brasileira", level: "A2", order: 4, description: "Brazilian cuisine and food culture", lessons: [
      { id: lid("pt","A2",2,1), title: "Food Vocabulary", description: "Feijoada, açaí, pão de queijo", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1 , culturalHint: "Brazilian food: a feijoada (black bean stew with pork — Saturday tradition!), o açaí, o pão de queijo, a coxinha, o brigadeiro, a picanha, o pastel"},
      { id: lid("pt","A2",2,2), title: "Ordering Food", description: "At a lanchonete or restaurante por quilo", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2 , culturalHint: "Ordering in Brazil: 'Moço/Moça, por favor!' (waiter/waitress). 'Me vê uma caipirinha' / 'Quero o prato feito (PF)'. Learn: o cardápio, a conta, o garçom, a gorjeta"},
      { id: lid("pt","A2",2,3), title: "Imperfeito", description: "Describing past habits", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3 , culturalHint: "Imperfeito for Brazilian childhood: 'Quando eu era criança, minha avó fazia brigadeiro e a gente brincava na rua.' Nostalgia is big in Brazilian culture"},
      { id: lid("pt","A2",2,4), title: "Reading: A Recipe", description: "Follow a brigadeiro recipe", category: "reading", level: "A2", duration: 10, xp: 30, order: 4 , culturalHint: "Brigadeiro recipe: leite condensado, chocolate em pó, manteiga, granulado. Roll into balls — Brazil's most beloved sweet! Every birthday party has it"},
      { id: lid("pt","A2",2,5), title: "Listening: Na Feira", description: "Understand vendors at the street market", category: "listening", level: "A2", duration: 8, xp: 25, order: 5 , culturalHint: "Na feira (street market): 'Olha a banana! Olha o tomate!' Vendors shout prices. Learn: a barraca, o feirante, a sacola, pesar, o quilo, a dúzia"},
    ]},
    { id: "pt_b1_u1", title: "Cultura Brasileira", level: "B1", order: 5, description: "Brazilian culture, music, and social life", lessons: [
      { id: lid("pt","B1",1,1), title: "Samba & MPB", description: "Music genres and cultural significance", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1 , culturalHint: "Brazilian music: Samba (Rio, Carnaval), MPB (Música Popular Brasileira — Caetano Veloso, Gilberto Gil), Bossa Nova (Tom Jobim, João Gilberto), Funk (MC's), Sertanejo"},
      { id: lid("pt","B1",1,2), title: "Subjuntivo", description: "Expressing wishes and doubts", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2 , culturalHint: "Subjuntivo in Brazilian Portuguese: 'Espero que você venha', 'Tomara que dê certo!' Brazilians use it less formally than European Portuguese"},
      { id: lid("pt","B1",1,3), title: "Discussing Football", description: "Talk about Brazilian football culture", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3 , culturalHint: "Brazilian football culture: o Maracanã, a Seleção, Pelé, Neymar. 'Torcer' = to root for. Learn: o time, o gol, o campeonato, a torcida, o clássico"},
      { id: lid("pt","B1",1,4), title: "Reading: News", description: "Understand a Brazilian news article", category: "reading", level: "B1", duration: 12, xp: 35, order: 4 , culturalHint: "Brazilian news: Folha de São Paulo, O Globo, G1. Topics: a desigualdade, o meio ambiente, a Amazônia, a política. Learn: a manchete, a reportagem, o jornalista"},
      { id: lid("pt","B1",1,5), title: "Write an Opinion", description: "Express your views on a cultural topic", category: "writing", level: "B1", duration: 15, xp: 40, order: 5 , culturalHint: "Write an opinion about Brazilian culture: Carnaval (is it just a party or cultural expression?), futebol, novelas, música. Use: 'Na minha opinião...', 'Acredito que...'"},
    ]},
    { id: "pt_b1_u2", title: "Trabalho", level: "B1", order: 6, description: "Professional Brazilian Portuguese", lessons: [
      { id: lid("pt","B1",2,1), title: "Business Terms", description: "Office and professional vocabulary", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1 , culturalHint: "Brazilian workplace: 'O jeitinho brasileiro' (finding creative solutions), networking over cafezinho, less formal than European offices. Learn: a empresa, o chefe, a reunião"},
      { id: lid("pt","B1",2,2), title: "Futuro do Subjuntivo", description: "When/if clauses in Portuguese", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2 , culturalHint: "Futuro do subjuntivo (unique to Portuguese!): 'Quando eu tiver dinheiro, vou viajar.' / 'Se você quiser, a gente vai.' Used constantly in Brazilian speech"},
      { id: lid("pt","B1",2,3), title: "Job Interview", description: "Practice a Brazilian job interview", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3 , culturalHint: "Brazilian job interview: more relaxed than formal, but still use 'o senhor/a senhora' with older interviewers. Learn: a vaga, o salário, os benefícios, o contrato CLT"},
      { id: lid("pt","B1",2,4), title: "Reading: Job Ad", description: "Understand a Brazilian job posting", category: "reading", level: "B1", duration: 10, xp: 30, order: 4 , culturalHint: "Brazilian job sites: LinkedIn, Catho, Vagas.com. 'Vaga para...' / 'Requisitos:' / 'Oferecemos:'. Learn: a experiência, a formação, o diferencial, o home office"},
      { id: lid("pt","B1",2,5), title: "Write a Currículo", description: "Compose a professional CV", category: "writing", level: "B1", duration: 15, xp: 45, order: 5 , culturalHint: "Brazilian CV (currículo): include photo, CPF number, objective statement. Different format from American résumés. Learn: dados pessoais, objetivo, experiência profissional"},
    ]},
    { id: "pt_b2_u1", title: "Gírias & Expressões", level: "B2", order: 7, description: "Advanced Brazilian slang and idioms", lessons: [
      { id: lid("pt","B2",1,1), title: "Brazilian Slang", description: "Mano, da hora, show de bola", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1 , culturalHint: "Brazilian slang: 'Mano' (bro), 'Da hora' (awesome), 'Show de bola' (great), 'Tá ligado?' (you know?), 'Mó' (very, from 'maior'), 'Suave' (chill/easy)"},
      { id: lid("pt","B2",1,2), title: "Complex Tenses", description: "Mais-que-perfeito and compound tenses", category: "grammar", level: "B2", duration: 15, xp: 50, order: 2 , culturalHint: "Complex tenses: mais-que-perfeito ('Eu já tinha saído quando ele chegou'), futuro do pretérito ('Eu faria se pudesse'). Brazilian narration uses these layers"},
      { id: lid("pt","B2",1,3), title: "Brazilian Humor", description: "Understand jokes and cultural references", category: "speaking", level: "B2", duration: 15, xp: 50, order: 3 , culturalHint: "Brazilian humor: stand-up (Fábio Porchat, Whindersson), memes, zoeira (teasing). 'Zoar' = to joke/tease. Understanding humor = understanding the culture"},
      { id: lid("pt","B2",1,4), title: "Reading: Literature", description: "Analyze Brazilian literary prose", category: "reading", level: "B2", duration: 15, xp: 45, order: 4 , culturalHint: "Brazilian literature: Machado de Assis (Dom Casmurro), Clarice Lispector, Jorge Amado (Gabriela), Guimarães Rosa. Learn: o romance, o conto, a crônica, o poeta"},
      { id: lid("pt","B2",1,5), title: "Write a Crônica", description: "Compose a Brazilian-style chronicle", category: "writing", level: "B2", duration: 18, xp: 55, order: 5 , culturalHint: "A crônica brasileira: short literary essay about daily life (Rubem Braga, Luis Fernando Verissimo). Write one about: o trânsito, a praia, o domingo, a vizinhança"},
    ]},
    { id: "pt_c1_u1", title: "Domínio Avançado", level: "C1", order: 8, description: "Near-native Brazilian Portuguese", lessons: [
      { id: lid("pt","C1",1,1), title: "Register Switching", description: "Formal, informal, and regional variations", category: "vocabulary", level: "C1", duration: 15, xp: 50, order: 1 , culturalHint: "Brazilian register switching: formal (o senhor), standard (você), informal (cê, tu in some regions), slang (mano, véi). Regional: carioca vs paulista vs gaúcho vs nordestino"},
      { id: lid("pt","C1",1,2), title: "Advanced Structures", description: "Complex clause constructions", category: "grammar", level: "C1", duration: 18, xp: 60, order: 2 , culturalHint: "Advanced Portuguese structures: orações subordinadas, voz passiva sintética ('Vendem-se casas'), colocação pronominal. Written Portuguese is much more formal than spoken"},
      { id: lid("pt","C1",1,3), title: "Debate & Persuasion", description: "Argue effectively in Portuguese", category: "speaking", level: "C1", duration: 15, xp: 55, order: 3 , culturalHint: "Brazilian debate: 'Com todo respeito...', 'Discordo plenamente...', 'Os dados mostram que...' — persuasion in Portuguese requires balancing emotion and logic"},
      { id: lid("pt","C1",1,4), title: "Reading: Academic", description: "Understand Brazilian academic writing", category: "reading", level: "C1", duration: 18, xp: 55, order: 4 , culturalHint: "Brazilian academic writing: ABNT formatting rules, formal register, extensive use of passive voice. Learn: a dissertação, o artigo científico, as referências bibliográficas"},
      { id: lid("pt","C1",1,5), title: "Write a Dissertation", description: "Compose a formal academic text", category: "writing", level: "C1", duration: 20, xp: 60, order: 5 , culturalHint: "Write a formal text on a Brazilian topic: a desigualdade social, a preservação da Amazônia, a educação pública, a diversidade cultural brasileira"},
    ]},
    { id: "pt_c2_u1", title: "Fluência Total", level: "C2", order: 9, description: "Complete mastery of Brazilian Portuguese", lessons: [
      { id: lid("pt","C2",1,1), title: "Cultural Mastery", description: "Every nuance of Brazilian communication", category: "vocabulary", level: "C2", duration: 18, xp: 60, order: 1 , culturalHint: "Brazilian communication mastery: understand the 'jeitinho' in language (indirect requests, softeners), regional identity through speech, the poetry of everyday Brazilian Portuguese"},
      { id: lid("pt","C2",1,2), title: "Stylistic Writing", description: "Grammar for artistic effect", category: "grammar", level: "C2", duration: 20, xp: 70, order: 2 , culturalHint: "Stylistic writing: channel Clarice Lispector (stream of consciousness), Machado de Assis (irony and psychological depth), Guimarães Rosa (invented words from regional speech)"},
      { id: lid("pt","C2",1,3), title: "Impromptu Speech", description: "Speak fluently on any topic", category: "speaking", level: "C2", duration: 15, xp: 65, order: 3 , culturalHint: "Impromptu speech in Portuguese: discuss any topic with fluency — politics, philosophy, culture, economics. Use: 'Cabe ressaltar que...', 'É imperativo que...', 'Via de regra...'"},
      { id: lid("pt","C2",1,4), title: "Reading: Satire", description: "Detect humor and irony", category: "reading", level: "C2", duration: 18, xp: 60, order: 4 , culturalHint: "Brazilian satire and irony: Porta dos Fundos (YouTube), The Piauí Herald, political cartoons. Detect: a ironia, o sarcasmo, a crítica social, o humor negro"},
      { id: lid("pt","C2",1,5), title: "Creative Writing", description: "Write a short story in Portuguese", category: "writing", level: "C2", duration: 25, xp: 75, order: 5 , culturalHint: "Write a short story set in Brazil: capture the rhythm of Brazilian speech, use regionalismos, weave in cultural references (Carnaval, saudade, malandragem, a praia)"},
    ]},
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// JAPANESE
// ═══════════════════════════════════════════════════════════════════════════════
export const JAPANESE: LanguageCurriculum = {
  code: "ja",
  name: "Japanese",
  flag: "🇯🇵",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 120,
  units: [
    {
      id: "ja_a1_u1", title: "はじめまして — First Steps", level: "A1", order: 1,
      description: "Hiragana, basic greetings, and self-introduction",
      lessons: [
        { id: lid("ja","A1",1,1), title: "Hiragana あ-こ", description: "Learn the first 10 hiragana characters", category: "vocabulary", level: "A1", duration: 10, xp: 25, order: 1 , culturalHint: "Japanese greetings change by time: おはようございます (ohayou gozaimasu - morning), こんにちは (konnichiwa - afternoon), こんばんは (konbanwa - evening). Bow depth shows respect level!"},
        { id: lid("ja","A1",1,2), title: "Self-Introduction", description: "はじめまして、私は... — introduce yourself", category: "speaking", level: "A1", duration: 8, xp: 25, order: 2 , culturalHint: "Self-introduction ritual: はじめまして (hajimemashite - nice to meet you), 私は___です (watashi wa ___ desu), よろしくお願いします (yoroshiku onegaishimasu). ALWAYS end with this phrase!"},
        { id: lid("ja","A1",1,3), title: "です & ます Forms", description: "Polite sentence endings", category: "grammar", level: "A1", duration: 10, xp: 30, order: 3 , culturalHint: "です/ます (desu/masu) = polite form. Japanese has 3 politeness levels: casual (友達 tomodachi/friends), polite (普通 futsuu/normal), honorific (敬語 keigo/business). Start with polite!"},
        { id: lid("ja","A1",1,4), title: "Numbers 1-100", description: "Japanese counting systems (いち、に、さん)", category: "vocabulary", level: "A1", duration: 8, xp: 20, order: 4 , culturalHint: "Japanese counting uses different counters: 一つ、二つ (hitotsu, futatsu) for general things, 一人、二人 (hitori, futari) for people, 一本 (ippon) for long objects. Learn: 数える (kazoeru = to count)"},
        { id: lid("ja","A1",1,5), title: "At the Konbini", description: "Understand a convenience store interaction", category: "listening", level: "A1", duration: 6, xp: 25, order: 5 , culturalHint: "コンビニ (konbini = convenience store): 7-Eleven, Lawson, FamilyMart — open 24/7, you can pay bills, buy concert tickets, get onigiri (おにぎり). Learn: いらっしゃいませ (irasshaimase = welcome!)"},
      ],
    },
    {
      id: "ja_a1_u2", title: "日常生活 — Daily Life", level: "A1", order: 2,
      description: "Katakana, daily routines, and time expressions",
      lessons: [
        { id: lid("ja","A1",2,1), title: "Katakana ア-コ", description: "Learn katakana for foreign words", category: "vocabulary", level: "A1", duration: 10, xp: 25, order: 1 , culturalHint: "カタカナ (katakana) is for foreign words: コーヒー (koohii = coffee), パン (pan = bread, from Portuguese!), テレビ (terebi = TV). Many daily words are katakana!"},
        { id: lid("ja","A1",2,2), title: "Verb Groups", description: "る-verbs, う-verbs, and irregular verbs", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2 , culturalHint: "Japanese verb groups: る-verbs (食べる taberu = eat), う-verbs (飲む nomu = drink), irregular (する suru = do, 来る kuru = come). Conjugation is regular — no gender/number changes!"},
        { id: lid("ja","A1",2,3), title: "My Daily Schedule", description: "Describe your routine using time words", category: "writing", level: "A1", duration: 10, xp: 30, order: 3 , culturalHint: "Japanese daily schedule: 朝ごはん (asagohan = breakfast), 昼ごはん (hirugohan = lunch), 晩ごはん (bangohan = dinner). Write: 毎朝6時に起きます (maiasa rokuji ni okimasu = I wake at 6 every morning)"},
        { id: lid("ja","A1",2,4), title: "Family & Home", description: "家族 vocabulary and counters", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4 , culturalHint: "Japanese family: お父さん (otousan = father), お母さん (okaasan = mother), おばあちゃん (obaachan = grandma). Note: different words for YOUR family vs SOMEONE ELSE'S family!"},
        { id: lid("ja","A1",2,5), title: "Reading: A Schedule", description: "Read a simple Japanese timetable", category: "reading", level: "A1", duration: 8, xp: 25, order: 5 , culturalHint: "Reading a Japanese schedule (時刻表 jikokuhyou): trains run ON TIME to the second. Learn: 出発 (shuppatsu = departure), 到着 (touchaku = arrival), ホーム (hoomu = platform)"},
      ],
    },
    { id: "ja_a2_u1", title: "街で — Around Town", level: "A2", order: 3, description: "Navigating Japan, transportation, and shopping", lessons: [
      { id: lid("ja","A2",1,1), title: "Asking Directions", description: "すみません、駅はどこですか", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1 , culturalHint: "Japanese directions: まっすぐ (massugu = straight), 右 (migi = right), 左 (hidari = left). Ask: すみません、駅はどこですか？ (sumimasen, eki wa doko desu ka? = Excuse me, where is the station?)"},
      { id: lid("ja","A2",1,2), title: "て-Form", description: "Connecting actions and making requests", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2 , culturalHint: "て-form (te-form) connects actions: 起きて、シャワーを浴びて、朝ごはんを食べます (I wake up, shower, and eat breakfast). Also for requests: 待ってください (matte kudasai = please wait)"},
      { id: lid("ja","A2",1,3), title: "Train & Bus", description: "Transportation vocabulary and announcements", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3 , culturalHint: "Japanese trains: 電車 (densha), 新幹線 (shinkansen = bullet train), 地下鉄 (chikatetsu = subway). Learn: 切符 (kippu = ticket), IC card (Suica/Pasmo), 乗り換え (norikae = transfer)"},
      { id: lid("ja","A2",1,4), title: "Reading: Train Map", description: "Navigate a Japanese train route map", category: "reading", level: "A2", duration: 10, xp: 30, order: 4 , culturalHint: "Navigate a Japanese train map: 山手線 (Yamanote-sen = Tokyo loop line), stations in kanji. Learn: 次は (tsugi wa = next is), 終点 (shuuten = last stop), 各駅停車 (kakueki teisha = local train)"},
      { id: lid("ja","A2",1,5), title: "Write a Travel Plan", description: "Plan a day trip in Japanese", category: "writing", level: "A2", duration: 12, xp: 35, order: 5 , culturalHint: "Write a travel plan: 週末に京都に行きたいです (shuumatsu ni Kyoto ni ikitai desu = I want to go to Kyoto this weekend). Plan: お寺 (otera = temple), 神社 (jinja = shrine), 抹茶 (matcha)"},
    ]},
    { id: "ja_a2_u2", title: "食べ物 — Food", level: "A2", order: 4, description: "Japanese cuisine and restaurant culture", lessons: [
      { id: lid("ja","A2",2,1), title: "Food Vocabulary", description: "寿司、ラーメン、天ぷら — essential dishes", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1 , culturalHint: "Japanese food: 寿司 (sushi), ラーメン (raamen), 天ぷら (tempura), うどん (udon), 焼肉 (yakiniku = BBQ), たこ焼き (takoyaki = octopus balls), お好み焼き (okonomiyaki = savory pancake)"},
      { id: lid("ja","A2",2,2), title: "Ordering Food", description: "すみません、これをお願いします", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2 , culturalHint: "Ordering in Japan: すみません！(to get attention) → これをお願いします (kore o onegaishimasu = this please) → お会計お願いします (okaikei onegaishimasu = check please). No tipping!"},
      { id: lid("ja","A2",2,3), title: "Past Tense", description: "た-form for past actions", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3 , culturalHint: "Past tense (た-form): 食べた (tabeta = ate), 飲んだ (nonda = drank), 行った (itta = went). Tell about yesterday: 昨日、ラーメンを食べました (kinou, raamen o tabemashita)"},
      { id: lid("ja","A2",2,4), title: "Reading: A Menu", description: "Read a Japanese restaurant menu", category: "reading", level: "A2", duration: 10, xp: 30, order: 4 , culturalHint: "Japanese menu reading: 定食 (teishoku = set meal), 丼 (donburi = rice bowl), 刺身 (sashimi), 味噌汁 (misoshiru = miso soup). Sizes: 小 (shou = small), 中 (chuu = medium), 大 (dai = large)"},
      { id: lid("ja","A2",2,5), title: "Listening: At Izakaya", description: "Understand a conversation at a pub", category: "listening", level: "A2", duration: 8, xp: 25, order: 5 , culturalHint: "居酒屋 (izakaya = Japanese pub): order 飲み放題 (nomihoudai = all-you-can-drink), share 枝豆 (edamame), 唐揚げ (karaage = fried chicken). Say: とりあえずビール！(toriaezu biiru = beer first!)"},
    ]},
    { id: "ja_b1_u1", title: "文化 — Culture", level: "B1", order: 5, description: "Japanese culture, anime, and social customs", lessons: [
      { id: lid("ja","B1",1,1), title: "Keigo Basics", description: "Honorific and humble speech levels", category: "vocabulary", level: "B1", duration: 15, xp: 40, order: 1 , culturalHint: "敬語 (keigo = honorific language): 尊敬語 (sonkeigo = respect language for others), 謙譲語 (kenjougo = humble language for yourself). Example: 言う→おっしゃる (respect) / 申す (humble)"},
      { id: lid("ja","B1",1,2), title: "Passive & Causative", description: "受身形 and 使役形 constructions", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2 , culturalHint: "Passive (受身形 ukemikei): 雨に降られた (ame ni furareta = got rained on — adversity passive, unique to Japanese!). Causative (使役形): 食べさせる (tabesaseru = make/let someone eat)"},
      { id: lid("ja","B1",1,3), title: "Discussing Anime & Manga", description: "Talk about Japanese pop culture", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3 , culturalHint: "Japanese pop culture: アニメ (anime), 漫画 (manga), ゲーム (game). Discuss: 好きなアニメは何ですか？ Learn: 声優 (seiyuu = voice actor), 同人 (doujin = fan works), コスプレ (cosplay)"},
      { id: lid("ja","B1",1,4), title: "Reading: News Article", description: "Understand a Japanese news story", category: "reading", level: "B1", duration: 12, xp: 35, order: 4 , culturalHint: "Japanese news: NHK (public), 朝日新聞 (Asahi), 読売新聞 (Yomiuri). Learn: 記事 (kiji = article), ニュース (nyuusu), 事件 (jiken = incident), 政治 (seiji = politics)"},
      { id: lid("ja","B1",1,5), title: "Write a Blog Post", description: "Compose a Japanese blog entry", category: "writing", level: "B1", duration: 15, xp: 40, order: 5 , culturalHint: "Write a blog post: ブログ (burogu). Topic: 日本の文化について (nihon no bunka ni tsuite = about Japanese culture). Use: ～と思います (to omoimasu = I think), ～かもしれません (kamoshiremasen = maybe)"},
    ]},
    { id: "ja_b1_u2", title: "仕事 — Work", level: "B1", order: 6, description: "Business Japanese and workplace culture", lessons: [
      { id: lid("ja","B1",2,1), title: "Business Japanese", description: "ビジネス vocabulary and email phrases", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1 },
      { id: lid("ja","B1",2,2), title: "Conditional Forms", description: "たら、ば、なら — if/when expressions", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2 },
      { id: lid("ja","B1",2,3), title: "Job Interview", description: "Practice a Japanese job interview", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3 },
      { id: lid("ja","B1",2,4), title: "Reading: Business Email", description: "Understand a formal Japanese email", category: "reading", level: "B1", duration: 10, xp: 30, order: 4 },
      { id: lid("ja","B1",2,5), title: "Write a 履歴書", description: "Compose a Japanese résumé", category: "writing", level: "B1", duration: 15, xp: 45, order: 5 },
    ]},
    { id: "ja_b2_u1", title: "上級表現", level: "B2", order: 7, description: "Advanced Japanese expressions and nuance", lessons: [
      { id: lid("ja","B2",1,1), title: "Slang & Youth Language", description: "やばい、マジ、ウケる — modern Japanese", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1 , culturalHint: "Japanese youth slang: やばい (yabai = amazing/terrible), マジ (maji = seriously), ウケる (ukeru = hilarious), エモい (emoi = emotional/aesthetic), 推し (oshi = favorite idol/character)"},
      { id: lid("ja","B2",1,2), title: "Complex Grammar", description: "ものの、にもかかわらず — advanced connectors", category: "grammar", level: "B2", duration: 15, xp: 50, order: 2 , culturalHint: "Advanced connectors: ～にもかかわらず (nimokakawarazu = despite), ～ものの (monono = although), ～に伴い (ni tomonai = along with). JLPT N2 grammar patterns"},
      { id: lid("ja","B2",1,3), title: "Storytelling", description: "Tell stories with proper narrative structure", category: "speaking", level: "B2", duration: 15, xp: 50, order: 3 , culturalHint: "Japanese storytelling: use ～たら (tara = when/if), ～ている途中で (teiru tochuu de = in the middle of), 結局 (kekkyoku = in the end). Narrative structure: 起承転結 (kishoutenketsu)"},
      { id: lid("ja","B2",1,4), title: "Reading: Novel Excerpt", description: "Analyze Japanese literary prose", category: "reading", level: "B2", duration: 15, xp: 45, order: 4 , culturalHint: "Japanese literature: 村上春樹 (Murakami Haruki), 夏目漱石 (Natsume Souseki - 'こころ'), 芥川龍之介 (Akutagawa - '羅生門'). Learn: 小説 (shousetsu = novel), 作家 (sakka = author)"},
      { id: lid("ja","B2",1,5), title: "Write an Essay", description: "Compose a structured opinion essay", category: "writing", level: "B2", duration: 18, xp: 55, order: 5 , culturalHint: "Write an opinion essay (意見文 ikenbun): structure = 序論 (joron = intro), 本論 (honron = body), 結論 (ketsuron = conclusion). Use: ～べきだ (beki da = should), ～ではないだろうか (dewa nai darou ka = isn't it?)"},
    ]},
    { id: "ja_c1_u1", title: "熟達 — Mastery", level: "C1", order: 8, description: "Near-native Japanese communication", lessons: [
      { id: lid("ja","C1",1,1), title: "Advanced Keigo", description: "Full honorific system mastery", category: "vocabulary", level: "C1", duration: 18, xp: 55, order: 1 , culturalHint: "Advanced 敬語 mastery: 二重敬語 (nijuu keigo = double honorific — technically wrong but common), ビジネス敬語 (business keigo), メール敬語 (email keigo). Master: お忙しいところ恐れ入りますが..."},
      { id: lid("ja","C1",1,2), title: "Literary Grammar", description: "Classical and literary expressions", category: "grammar", level: "C1", duration: 18, xp: 60, order: 2 , culturalHint: "Literary grammar: ～であろう (de arou = probably, literary), ～ざるを得ない (zaru o enai = cannot help but), ～たる (taru = classical copula). Used in essays, speeches, formal writing"},
      { id: lid("ja","C1",1,3), title: "Formal Presentation", description: "Give a professional presentation", category: "speaking", level: "C1", duration: 15, xp: 55, order: 3 , culturalHint: "Japanese presentation style: 本日は～についてお話しさせていただきます (honjitsu wa ~ ni tsuite ohanashi sasete itadakimasu). End: ご清聴ありがとうございました (goseichou arigatou gozaimashita)"},
      { id: lid("ja","C1",1,4), title: "Reading: Academic Paper", description: "Understand Japanese academic writing", category: "reading", level: "C1", duration: 18, xp: 55, order: 4 , culturalHint: "Japanese academic writing: 論文 (ronbun = paper), ～と考えられる (to kangaerareru = it is thought that), ～について述べる (ni tsuite noberu = to discuss). Formal, passive, objective"},
      { id: lid("ja","C1",1,5), title: "Write a Report", description: "Compose a formal research report", category: "writing", level: "C1", duration: 20, xp: 60, order: 5 , culturalHint: "Write a formal report: 報告書 (houkokusho). Structure: 件名 (kenmei = subject), 概要 (gaiyou = summary), 詳細 (shousai = details), 結論 (ketsuron = conclusion), 以上 (ijou = end)"},
    ]},
    { id: "ja_c2_u1", title: "完璧 — Perfection", level: "C2", order: 9, description: "Complete mastery of Japanese", lessons: [
      { id: lid("ja","C2",1,1), title: "Nuance Mastery", description: "Every subtle layer of Japanese", category: "vocabulary", level: "C2", duration: 18, xp: 60, order: 1 , culturalHint: "Japanese communication mastery: 空気を読む (kuuki o yomu = read the air/room), 本音と建前 (honne to tatemae = true feelings vs public facade), 察する (sassuru = to sense/intuit without being told)"},
      { id: lid("ja","C2",1,2), title: "Stylistic Mastery", description: "Grammar for artistic expression", category: "grammar", level: "C2", duration: 20, xp: 70, order: 2 , culturalHint: "Stylistic mastery: write like Murakami (surreal, detached), Kawabata (poetic, visual), Mishima (dramatic, classical). Use: 体言止め (taigendome = ending with noun for effect)"},
      { id: lid("ja","C2",1,3), title: "Impromptu Speech", description: "Speak fluently on any topic", category: "speaking", level: "C2", duration: 15, xp: 65, order: 3 , culturalHint: "Impromptu speech: 即興スピーチ (sokkyou supiichi). On any topic — politics, philosophy, culture. Use: ～と言っても過言ではない (to ittemo kagon dewa nai = it's no exaggeration to say)"},
      { id: lid("ja","C2",1,4), title: "Reading: Classic Literature", description: "Understand pre-modern Japanese texts", category: "reading", level: "C2", duration: 18, xp: 60, order: 4 , culturalHint: "Classical Japanese (古文 kobun): understand texts from 源氏物語 (Genji Monogatari), 枕草子 (Makura no Soushi). Grammar: ～けり (past), ～なり (copula), ～べし (should/must)"},
      { id: lid("ja","C2",1,5), title: "Creative Writing", description: "Write a short story in Japanese", category: "writing", level: "C2", duration: 25, xp: 75, order: 5 , culturalHint: "Write a short story (短編小説 tanpen shousetsu) in Japanese: use literary techniques, cultural references (四季 shiki = four seasons, 侘び寂び wabi-sabi = beauty in imperfection)"},
    ]},
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// MANDARIN CHINESE
// ═══════════════════════════════════════════════════════════════════════════════
export const MANDARIN: LanguageCurriculum = {
  code: "zh",
  name: "Chinese",
  flag: "🇨🇳",
  dialect: "Mandarin",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 130,
  units: [
    {
      id: "zh_a1_u1", title: "你好! — First Steps", level: "A1", order: 1,
      description: "Pinyin, tones, basic greetings, and self-introduction",
      lessons: [
        { id: lid("zh","A1",1,1), title: "Tones & Pinyin", description: "The 4 tones and pinyin romanization system", category: "vocabulary", level: "A1", duration: 12, xp: 30, order: 1 , culturalHint: "Chinese tones change meaning completely: mā (妈 mom), má (麻 hemp), mǎ (马 horse), mà (骂 scold). Practice: 四是四，十是十 (sì shì sì, shí shì shí = 4 is 4, 10 is 10) — a tongue twister!"},
        { id: lid("zh","A1",1,2), title: "Self-Introduction", description: "你好，我叫... 我是... — introduce yourself", category: "speaking", level: "A1", duration: 8, xp: 25, order: 2 , culturalHint: "Chinese self-introduction: 你好，我叫___，我是___人 (nǐ hǎo, wǒ jiào ___, wǒ shì ___ rén). Add: 认识你很高兴 (rènshi nǐ hěn gāoxìng = nice to meet you). Exchange 名片 (míngpiàn = business card)"},
        { id: lid("zh","A1",1,3), title: "Basic Sentence Structure", description: "Subject-Verb-Object and 是 sentences", category: "grammar", level: "A1", duration: 10, xp: 30, order: 3 , culturalHint: "Chinese sentence structure is SVO like English: 我是学生 (wǒ shì xuéshēng = I am a student). No conjugation, no tenses, no gender — but word order and particles matter!"},
        { id: lid("zh","A1",1,4), title: "Numbers 1-100", description: "一、二、三 — Chinese number system", category: "vocabulary", level: "A1", duration: 8, xp: 20, order: 4 , culturalHint: "Chinese numbers are logical: 11 = 十一 (shíyī = ten-one), 20 = 二十 (èrshí = two-ten), 99 = 九十九 (jiǔshíjiǔ). Money: 块 (kuài = yuan colloquial), 毛 (máo = 0.1 yuan), 分 (fēn = 0.01)"},
        { id: lid("zh","A1",1,5), title: "At the Shop", description: "Understand a simple buying interaction", category: "listening", level: "A1", duration: 6, xp: 25, order: 5 , culturalHint: "Chinese shops: 超市 (chāoshì = supermarket), 便利店 (biànlìdiàn = convenience store), 菜市场 (càishìchǎng = wet market). Bargaining at markets: 太贵了！便宜一点！(tài guì le! piányi yīdiǎn! = too expensive! cheaper!)"},
      ],
    },
    {
      id: "zh_a1_u2", title: "日常生活 — Daily Life", level: "A1", order: 2,
      description: "Family, time, and daily routines in Chinese",
      lessons: [
        { id: lid("zh","A1",2,1), title: "Family Vocabulary", description: "爸爸、妈妈、哥哥 — family terms", category: "vocabulary", level: "A1", duration: 8, xp: 20, order: 1 , culturalHint: "Chinese family terms are VERY specific: 爸爸 (bàba = dad), 妈妈 (māma = mom), 哥哥 (gēge = older brother), 弟弟 (dìdi = younger brother), 姐姐 (jiějie = older sister), 妹妹 (mèimei = younger sister)"},
        { id: lid("zh","A1",2,2), title: "Time & Dates", description: "Telling time and expressing dates", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2 , culturalHint: "Chinese time: 现在几点？(xiànzài jǐ diǎn? = what time is it?). Structure: X点Y分 (X diǎn Y fēn). Dates: 年月日 (nián yuè rì = year-month-day). Today: 今天 (jīntiān), tomorrow: 明天 (míngtiān)"},
        { id: lid("zh","A1",2,3), title: "My Daily Routine", description: "Describe what you do each day", category: "writing", level: "A1", duration: 10, xp: 30, order: 3 , culturalHint: "Chinese daily routine: 起床 (qǐchuáng = get up), 刷牙 (shuāyá = brush teeth), 吃早饭 (chī zǎofàn = eat breakfast), 上班 (shàngbān = go to work), 下班 (xiàbān = leave work), 睡觉 (shuìjiào = sleep)"},
        { id: lid("zh","A1",2,4), title: "At Home", description: "Rooms and household items", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4 , culturalHint: "Chinese home: 客厅 (kètīng = living room), 卧室 (wòshì = bedroom), 厨房 (chúfáng = kitchen), 卫生间 (wèishēngjiān = bathroom). Many Chinese families live in 公寓 (gōngyù = apartments)"},
        { id: lid("zh","A1",2,5), title: "Reading: WeChat Message", description: "Understand a simple Chinese text", category: "reading", level: "A1", duration: 8, xp: 25, order: 5 , culturalHint: "WeChat (微信 Wēixìn) is China's everything app: messaging, payments, social media. Common messages: 在吗？(zài ma? = are you there?), 好的 (hǎo de = ok), 哈哈哈 (hāhāhā = hahaha)"},
      ],
    },
    { id: "zh_a2_u1", title: "出门 — Going Out", level: "A2", order: 3, description: "Navigating Chinese cities and transportation", lessons: [
      { id: lid("zh","A2",1,1), title: "Asking Directions", description: "请问，地铁站在哪儿？", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1 , culturalHint: "Chinese directions: 往前走 (wǎng qián zǒu = go forward), 左转 (zuǒ zhuǎn = turn left), 右转 (yòu zhuǎn = turn right). Ask: 请问，地铁站在哪儿？(qǐngwèn, dìtiězhàn zài nǎr? = where's the subway?)"},
      { id: lid("zh","A2",1,2), title: "了 & 过", description: "Expressing completed actions and experiences", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2 , culturalHint: "了 (le) marks completed actions: 我吃了 (wǒ chī le = I ate). 过 (guò) marks life experiences: 我去过中国 (wǒ qù guò Zhōngguó = I've been to China). These two particles are fundamental!"},
      { id: lid("zh","A2",1,3), title: "Transportation", description: "地铁、公交车、出租车 vocabulary", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3 , culturalHint: "Chinese transport: 地铁 (dìtiě = subway), 公交车 (gōngjiāochē = bus), 出租车 (chūzūchē = taxi), 高铁 (gāotiě = high-speed rail), 共享单车 (gòngxiǎng dānchē = bike share). Use 滴滴 (Dīdī = China's Uber)"},
      { id: lid("zh","A2",1,4), title: "Reading: Metro Map", description: "Navigate a Chinese subway map", category: "reading", level: "A2", duration: 10, xp: 30, order: 4 , culturalHint: "Navigate Chinese subway: 换乘 (huànchéng = transfer), 出口 (chūkǒu = exit), 站 (zhàn = station). Beijing: 1号线 (yī hào xiàn = Line 1). Learn: 刷卡 (shuākǎ = swipe card), 扫码 (sǎomǎ = scan QR code)"},
      { id: lid("zh","A2",1,5), title: "Write About Your City", description: "Describe your favorite places", category: "writing", level: "A2", duration: 12, xp: 35, order: 5 , culturalHint: "Describe your city: 我的城市很大，有很多高楼 (wǒ de chéngshì hěn dà, yǒu hěn duō gāolóu = my city is big with many tall buildings). Learn: 公园 (gōngyuán = park), 商场 (shāngchǎng = mall)"},
    ]},
    { id: "zh_a2_u2", title: "吃饭 — Food", level: "A2", order: 4, description: "Chinese cuisine and restaurant culture", lessons: [
      { id: lid("zh","A2",2,1), title: "Food Vocabulary", description: "饺子、面条、火锅 — essential dishes", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1 , culturalHint: "Chinese food: 饺子 (jiǎozi = dumplings), 面条 (miàntiáo = noodles), 火锅 (huǒguō = hot pot), 北京烤鸭 (Běijīng kǎoyā = Peking duck), 小笼包 (xiǎolóngbāo = soup dumplings), 麻婆豆腐 (mápó dòufu)"},
      { id: lid("zh","A2",2,2), title: "Ordering Food", description: "服务员，我要... 买单", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2 , culturalHint: "Ordering food: 服务员！(fúwùyuán! = waiter!) → 我要一个... (wǒ yào yī gè... = I want one...) → 买单 (mǎidān = check please). In China, one person usually pays for everyone!"},
      { id: lid("zh","A2",2,3), title: "Measure Words", description: "个、只、杯 — essential classifiers", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3 , culturalHint: "Measure words (量词 liàngcí): 个 (gè = general), 杯 (bēi = cups), 瓶 (píng = bottles), 碗 (wǎn = bowls), 盘 (pán = plates), 双 (shuāng = pairs). Every noun needs its specific measure word!"},
      { id: lid("zh","A2",2,4), title: "Reading: A Menu", description: "Read a Chinese restaurant menu", category: "reading", level: "A2", duration: 10, xp: 30, order: 4 , culturalHint: "Read a Chinese menu: 凉菜 (liángcài = cold dishes), 热菜 (rècài = hot dishes), 主食 (zhǔshí = staples), 汤 (tāng = soup), 饮料 (yǐnliào = drinks). Spice levels: 微辣/中辣/特辣 (wēi/zhōng/tè là)"},
      { id: lid("zh","A2",2,5), title: "Listening: At Restaurant", description: "Understand a dining conversation", category: "listening", level: "A2", duration: 8, xp: 25, order: 5 , culturalHint: "Chinese restaurant culture: 转桌 (zhuǎnzhuō = lazy Susan), 拼桌 (pīnzhuō = sharing tables with strangers), 打包 (dǎbāo = takeaway box). Fighting over the bill is a cultural sport!"},
    ]},
    { id: "zh_b1_u1", title: "文化 — Culture", level: "B1", order: 5, description: "Chinese culture, festivals, and social customs", lessons: [
      { id: lid("zh","B1",1,1), title: "Festivals & Traditions", description: "春节、中秋节 — cultural celebrations", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1 , culturalHint: "Chinese festivals: 春节 (Chūnjié = Chinese New Year — 15 days!), 中秋节 (Zhōngqiūjié = Mid-Autumn Festival — mooncakes!), 端午节 (Duānwǔjié = Dragon Boat Festival — zongzi rice dumplings!)"},
      { id: lid("zh","B1",1,2), title: "把 Construction", description: "The disposal construction and complex sentences", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2 , culturalHint: "把 (bǎ) construction: puts the object before the verb for emphasis on the action's result. 把门关上 (bǎ mén guānshàng = close the door). 把作业做完 (bǎ zuòyè zuòwán = finish the homework)"},
      { id: lid("zh","B1",1,3), title: "Discussing Culture", description: "Talk about Chinese traditions and values", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3 , culturalHint: "Discuss Chinese culture: 中国有五千年的历史 (Zhōngguó yǒu wǔqiān nián de lìshǐ = China has 5000 years of history). Topics: 功夫 (gōngfu), 书法 (shūfǎ = calligraphy), 茶道 (chádào = tea ceremony)"},
      { id: lid("zh","B1",1,4), title: "Reading: News", description: "Understand a Chinese news article", category: "reading", level: "B1", duration: 12, xp: 35, order: 4 , culturalHint: "Chinese news: 人民日报 (Rénmín Rìbào), 新华社 (Xīnhuáshè), CCTV. Learn: 新闻 (xīnwén = news), 报道 (bàodào = report), 社会 (shèhuì = society), 经济 (jīngjì = economy), 科技 (kējì = technology)"},
      { id: lid("zh","B1",1,5), title: "Write an Opinion", description: "Express views on a cultural topic", category: "writing", level: "B1", duration: 15, xp: 40, order: 5 , culturalHint: "Write an opinion: 我认为... (wǒ rènwéi = I think...), 一方面...另一方面... (yī fāngmiàn... lìng yī fāngmiàn = on one hand... on the other). Topic: 传统文化在现代社会的作用 (role of traditional culture in modern society)"},
    ]},
    { id: "zh_b1_u2", title: "工作 — Work", level: "B1", order: 6, description: "Business Chinese for the workplace", lessons: [
      { id: lid("zh","B1",2,1), title: "Business Terms", description: "Office and professional vocabulary", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1 , culturalHint: "Chinese business: 公司 (gōngsī = company), 老板 (lǎobǎn = boss), 同事 (tóngshì = colleague), 加班 (jiābān = overtime — very common!). Learn: 996 culture (9am-9pm, 6 days/week)"},
      { id: lid("zh","B1",2,2), title: "Formal Grammar", description: "被 passive and formal connectors", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2 , culturalHint: "被 (bèi) passive: 我被老板批评了 (wǒ bèi lǎobǎn pīpíng le = I was criticized by the boss). Formal connectors: 因此 (yīncǐ = therefore), 然而 (rán'ér = however), 此外 (cǐwài = moreover)"},
      { id: lid("zh","B1",2,3), title: "Job Interview", description: "Practice a Chinese job interview", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3 , culturalHint: "Chinese job interview: 请做一下自我介绍 (qǐng zuò yīxià zìwǒ jièshào = please introduce yourself). Key phrases: 我的优点是... (my strength is...), 我的目标是... (my goal is...)"},
      { id: lid("zh","B1",2,4), title: "Reading: Job Ad", description: "Understand a Chinese job posting", category: "reading", level: "B1", duration: 10, xp: 30, order: 4 , culturalHint: "Chinese job ads on 智联招聘 (Zhìlián Zhāopìn), 前程无忧 (Qiánchéng Wúyōu), BOSS直聘. Learn: 岗位 (gǎngwèi = position), 薪资 (xīnzī = salary), 五险一金 (wǔxiǎn yījīn = social insurance + housing fund)"},
      { id: lid("zh","B1",2,5), title: "Write a 简历", description: "Compose a Chinese résumé", category: "writing", level: "B1", duration: 15, xp: 45, order: 5 , culturalHint: "Chinese résumé (简历 jiǎnlì): include photo, 籍贯 (jíguàn = hometown), 政治面貌 (zhèngzhì miànmào = political status). Format: 基本信息, 教育背景, 工作经历, 技能特长"},
    ]},
    { id: "zh_b2_u1", title: "成语 — Idioms", level: "B2", order: 7, description: "Advanced Chinese idioms and literary expression", lessons: [
      { id: lid("zh","B2",1,1), title: "Chengyu (成语)", description: "Four-character idioms and their stories", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1 , culturalHint: "成语 (chéngyǔ = four-character idioms): 一举两得 (yī jǔ liǎng dé = kill two birds with one stone), 画蛇添足 (huà shé tiān zú = to gild the lily), 对牛弹琴 (duì niú tán qín = casting pearls before swine)"},
      { id: lid("zh","B2",1,2), title: "Complex Structures", description: "不但...而且, 虽然...但是 — advanced patterns", category: "grammar", level: "B2", duration: 15, xp: 50, order: 2 , culturalHint: "Advanced patterns: 不但...而且 (bùdàn...érqiě = not only...but also), 虽然...但是 (suīrán...dànshì = although...but), 既然...就 (jìrán...jiù = since...then), 无论...都 (wúlùn...dōu = no matter...all)"},
      { id: lid("zh","B2",1,3), title: "Debating", description: "Express and defend opinions in Chinese", category: "speaking", level: "B2", duration: 15, xp: 50, order: 3 , culturalHint: "Chinese debate: 我完全不同意 (wǒ wánquán bù tóngyì = I completely disagree), 恕我直言 (shù wǒ zhíyán = forgive my frankness), 让我换个角度说 (ràng wǒ huàn gè jiǎodù shuō = let me put it differently)"},
      { id: lid("zh","B2",1,4), title: "Reading: Literature", description: "Analyze Chinese literary prose", category: "reading", level: "B2", duration: 15, xp: 45, order: 4 , culturalHint: "Chinese literature: 鲁迅 (Lǔ Xùn — 'Diary of a Madman'), 莫言 (Mò Yán — Nobel Prize), 余华 (Yú Huá — 'To Live'), 张爱玲 (Zhāng Àilíng). Learn: 作品 (zuòpǐn = work), 主题 (zhǔtí = theme)"},
      { id: lid("zh","B2",1,5), title: "Write an Essay", description: "Compose a structured argumentative essay", category: "writing", level: "B2", duration: 18, xp: 55, order: 5 , culturalHint: "Write an argumentative essay (议论文 yìlùnwén): 论点 (lùndiǎn = thesis), 论据 (lùnjù = evidence), 论证 (lùnzhèng = reasoning). Structure: 提出问题 → 分析问题 → 解决问题"},
    ]},
    { id: "zh_c1_u1", title: "精通 — Proficiency", level: "C1", order: 8, description: "Near-native Chinese communication", lessons: [
      { id: lid("zh","C1",1,1), title: "Register & Formality", description: "书面语 vs 口语 — written vs spoken", category: "vocabulary", level: "C1", duration: 15, xp: 50, order: 1 , culturalHint: "Chinese register: 书面语 (shūmiànyǔ = written/formal) vs 口语 (kǒuyǔ = spoken/casual). Written: 因此、然而、鉴于. Spoken: 所以、但是、看在. Mastering both = true fluency"},
      { id: lid("zh","C1",1,2), title: "Classical Chinese Echoes", description: "文言文 elements in modern Chinese", category: "grammar", level: "C1", duration: 18, xp: 60, order: 2 , culturalHint: "Classical Chinese (文言文 wényánwén) echoes in modern Chinese: 之 (zhī = 的), 乎 (hū = 吗), 者 (zhě = 的人), 也 (yě = sentence-final particle). Found in: 成语, formal writing, poetry"},
      { id: lid("zh","C1",1,3), title: "Formal Speech", description: "Give a professional presentation", category: "speaking", level: "C1", duration: 15, xp: 55, order: 3 , culturalHint: "Chinese formal speech: 尊敬的各位来宾 (zūnjìng de gèwèi láibīn = respected guests), 我很荣幸... (wǒ hěn róngxìng = I'm honored to...), 谢谢大家的聆听 (xièxie dàjiā de língtīng = thank you for listening)"},
      { id: lid("zh","C1",1,4), title: "Reading: Academic", description: "Understand Chinese academic writing", category: "reading", level: "C1", duration: 18, xp: 55, order: 4 , culturalHint: "Chinese academic writing: 摘要 (zhāiyào = abstract), 关键词 (guānjiàncí = keywords), 引言 (yǐnyán = introduction), 结论 (jiélùn = conclusion). Style: objective, formal, evidence-based"},
      { id: lid("zh","C1",1,5), title: "Write a Report", description: "Compose a formal report", category: "writing", level: "C1", duration: 20, xp: 60, order: 5 , culturalHint: "Write a formal report: 报告 (bàogào). Structure: 标题 (biāotí = title), 正文 (zhèngwén = body), 建议 (jiànyì = recommendations). Use: 据调查... (jù diàochá = according to research...)"},
    ]},
    { id: "zh_c2_u1", title: "完美 — Perfection", level: "C2", order: 9, description: "Complete mastery of Mandarin Chinese", lessons: [
      { id: lid("zh","C2",1,1), title: "Cultural Mastery", description: "Every nuance of Chinese communication", category: "vocabulary", level: "C2", duration: 18, xp: 60, order: 1 , culturalHint: "Chinese communication mastery: 面子 (miànzi = face/reputation), 关系 (guānxi = relationships/connections), 含蓄 (hánxù = subtlety/indirectness). Understanding what's NOT said is as important as what IS said"},
      { id: lid("zh","C2",1,2), title: "Stylistic Writing", description: "Grammar for artistic and rhetorical effect", category: "grammar", level: "C2", duration: 20, xp: 70, order: 2 , culturalHint: "Stylistic writing: use 对仗 (duìzhàng = parallelism), 排比 (páibǐ = rhetorical repetition), 比喻 (bǐyù = metaphor). Write with the elegance of classical Chinese infused into modern prose"},
      { id: lid("zh","C2",1,3), title: "Impromptu Speech", description: "Speak fluently on any topic", category: "speaking", level: "C2", duration: 15, xp: 65, order: 3 , culturalHint: "Impromptu speech on any topic: 众所周知 (zhòngsuǒzhōuzhī = as everyone knows), 不言而喻 (bùyán'éryù = it goes without saying), 综上所述 (zōngshàngsuǒshù = to sum up)"},
      { id: lid("zh","C2",1,4), title: "Reading: Classical", description: "Understand classical Chinese texts", category: "reading", level: "C2", duration: 18, xp: 60, order: 4 , culturalHint: "Classical Chinese texts: 论语 (Lúnyǔ = Analerta of Confucius), 道德经 (Dàodéjīng), 唐诗 (Tángshī = Tang poetry). Understand: 子曰 (zǐ yuē = the Master said), 学而时习之 (xué ér shí xí zhī)"},
      { id: lid("zh","C2",1,5), title: "Creative Writing", description: "Write a short story in Chinese", category: "writing", level: "C2", duration: 25, xp: 75, order: 5 , culturalHint: "Write a short story in Chinese: use 修辞手法 (xiūcí shǒufǎ = rhetorical devices), cultural references (四大名著 sì dà míngzhù = Four Great Classical Novels), capture the rhythm of Chinese prose"},
    ]},
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SPANISH — STANDARD (generic, for users who don't pick a dialect)
// ═══════════════════════════════════════════════════════════════════════════════
export const SPANISH_STANDARD: LanguageCurriculum = {
  code: "es",
  name: "Spanish",
  flag: "🇪🇸",
  dialect: "Standard",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 85,
  units: [
    { id: "es_a1_u1", title: "¡Hola! — First Steps", level: "A1", order: 1, description: "Basic greetings, introductions, and essential phrases", lessons: [
      { id: lid("es","A1",1,1), title: "Hello & Goodbye", description: "Learn basic greetings and farewells", category: "vocabulary", level: "A1", duration: 5, xp: 20, order: 1 , culturalHint: "Spanish greetings vary by region: ¡Hola! is universal, but in Spain you'll hear '¿Qué tal?' while in Latin America '¿Cómo estás?' is more common. Learn: el saludo, la despedida, el abrazo"},
      { id: lid("es","A1",1,2), title: "I Am...", description: "Introduce yourself with name and nationality", category: "speaking", level: "A1", duration: 8, xp: 25, order: 2 , culturalHint: "In Spain, two kisses (dos besos) on the cheeks is standard greeting between friends. Learn: presentarse, encantado/a, mucho gusto, ¿de dónde eres?"},
      { id: lid("es","A1",1,3), title: "Ser vs Estar", description: "Present tense of 'to be'", category: "grammar", level: "A1", duration: 10, xp: 30, order: 3 , culturalHint: "Ser vs Estar: Ser = identity (Soy español), Estar = state/location (Estoy en Madrid). Spanish proverb: 'Ser o no ser, esa es la cuestión' (Shakespeare in Spanish!)"},
      { id: lid("es","A1",1,4), title: "Numbers 1-20", description: "Count and recognize numbers", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 4 , culturalHint: "Spanish numbers: learn to count euros and céntimos. At a café: '¿Cuánto es?' / 'Son dos euros con cincuenta.' Learn: la cuenta, el cambio, la propina (tip — not mandatory in Spain!)"},
      { id: lid("es","A1",1,5), title: "Listening: At the Café", description: "Understand a simple ordering conversation", category: "listening", level: "A1", duration: 6, xp: 25, order: 5 , culturalHint: "Spanish café culture: un café solo (espresso), un cortado (espresso + splash of milk), un café con leche. Order: '¡Perdona! Un café con leche, por favor.' The café is a social institution"},
    ]},
    { id: "es_a1_u2", title: "Daily Life", level: "A1", order: 2, description: "Family, home, and everyday routines", lessons: [
      { id: lid("es","A1",2,1), title: "My Family", description: "Family member vocabulary", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1 , culturalHint: "Spanish family: la familia is central to Hispanic culture. Sunday lunch together is sacred. Learn: los padres, los abuelos, los hermanos, los primos, la sobremesa (after-meal conversation)"},
      { id: lid("es","A1",2,2), title: "Present Tense Verbs", description: "Regular verb conjugations", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2 , culturalHint: "Spanish present tense: -AR (hablar → hablo), -ER (comer → como), -IR (vivir → vivo). Practice with daily life: 'Hablo español', 'Como paella los domingos', 'Vivo en Barcelona'"},
      { id: lid("es","A1",2,3), title: "My Daily Routine", description: "Describe what you do each day", category: "writing", level: "A1", duration: 10, xp: 30, order: 3 , culturalHint: "Spanish daily routine: desayunar (light breakfast), comer (big lunch 2-3pm), merendar (afternoon snack), cenar (late dinner 9-10pm!). Spain's schedule is unique in Europe!"},
      { id: lid("es","A1",2,4), title: "Around the House", description: "Rooms and furniture vocabulary", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4 , culturalHint: "Spanish home: el piso (apartment — most Spaniards live in flats), el salón, la cocina, el dormitorio. Learn: el balcón, la terraza, el portal, el ascensor"},
      { id: lid("es","A1",2,5), title: "Reading: A Postcard", description: "Read and understand a simple postcard", category: "reading", level: "A1", duration: 8, xp: 25, order: 5 , culturalHint: "Spanish postcards from vacation: 'Queridos amigos, estoy en Mallorca. Hace sol y la playa es preciosa. ¡Un abrazo!' Learn: las vacaciones, el viaje, el recuerdo"},
    ]},
    { id: "es_a2_u1", title: "Getting Around", level: "A2", order: 3, description: "Directions, transportation, and navigating a city", lessons: [
      { id: lid("es","A2",1,1), title: "Asking for Directions", description: "Navigate using basic direction words", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1 , culturalHint: "Spanish directions: 'Sigue todo recto, gira a la izquierda en el semáforo.' In Spain, people give directions using landmarks: 'Pasada la farmacia, al lado del Mercadona.' Learn: la calle, la plaza, la rotonda"},
      { id: lid("es","A2",1,2), title: "Past Tense Basics", description: "Talk about what happened yesterday", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2 , culturalHint: "Past tense (pretérito indefinido): Ayer fui, comí, salí. Irregular: fui, hice, dije, puse. Tell about yesterday: 'Ayer fui al centro y comí tapas en un bar'"},
      { id: lid("es","A2",1,3), title: "Transportation", description: "Bus, train, taxi vocabulary", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3 , culturalHint: "Spanish transportation: el metro, el autobús, el AVE (high-speed train), el taxi, BiciMad (bike share in Madrid). Learn: la parada, el billete, el abono, hacer transbordo"},
      { id: lid("es","A2",1,4), title: "Reading: City Map", description: "Follow written directions on a map", category: "reading", level: "A2", duration: 10, xp: 30, order: 4 , culturalHint: "Spanish cities: Madrid (la Gran Vía, el Retiro), Barcelona (la Sagrada Familia, las Ramblas), Sevilla (la Giralda, el Alcázar). Learn: el casco antiguo, la catedral, el museo"},
      { id: lid("es","A2",1,5), title: "Write a Travel Plan", description: "Describe your upcoming trip", category: "writing", level: "A2", duration: 12, xp: 35, order: 5 , culturalHint: "Write about a trip: 'El fin de semana pasado fui a Toledo. Visité la catedral y comí mazapán.' Learn: el destino, el alojamiento, la excursión, el recorrido"},
    ]},
    { id: "es_a2_u2", title: "Food & Drink", level: "A2", order: 4, description: "Cuisine, ordering food, and cooking vocabulary", lessons: [
      { id: lid("es","A2",2,1), title: "Food Vocabulary", description: "Essential dishes and ingredients", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1 , culturalHint: "Spanish food: la paella (Valencia), las tapas (everywhere!), el jamón ibérico, la tortilla española, el gazpacho, los churros con chocolate, el cocido madrileño"},
      { id: lid("es","A2",2,2), title: "Ordering at a Restaurant", description: "How to order food politely", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2 , culturalHint: "Ordering in Spain: '¡Perdona!' (to get attention) → 'Ponme una caña y una tapa de tortilla' → '¿Me cobras?' (check please). Tapas culture: small dishes shared with friends over drinks"},
      { id: lid("es","A2",2,3), title: "Imperfect Tense", description: "Talking about what you used to do", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3 , culturalHint: "Imperfect tense: 'Cuando era pequeño, mi abuela hacía paella los domingos.' Spanish grandmothers and their recipes are legendary! La receta de la abuela = sacred"},
      { id: lid("es","A2",2,4), title: "Reading: A Recipe", description: "Follow a Spanish recipe", category: "reading", level: "A2", duration: 10, xp: 30, order: 4 , culturalHint: "Follow a recipe for tortilla española: los huevos, las patatas, la cebolla, el aceite de oliva. 'Pelar y cortar las patatas, freír a fuego lento, batir los huevos...'"},
      { id: lid("es","A2",2,5), title: "Listening: At the Market", description: "Understand vendors at the market", category: "listening", level: "A2", duration: 8, xp: 25, order: 5 , culturalHint: "Spanish market (el mercado): Mercado de San Miguel (Madrid), La Boquería (Barcelona). Vendors: '¿Qué le pongo?' Learn: el puesto, la fruta, la verdura, el pescado, la carnicería"},
    ]},
    { id: "es_b1_u1", title: "Culture & Society", level: "B1", order: 5, description: "Spanish culture, music, and social life", lessons: [
      { id: lid("es","B1",1,1), title: "Music & Dance", description: "Cultural vocabulary and significance", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1 , culturalHint: "Spanish culture: el flamenco (Andalucía — cante, baile, guitarra), las fiestas (San Fermín, Las Fallas, La Tomatina), la siesta, la vida nocturna. Learn: la tradición, la costumbre, la fiesta"},
      { id: lid("es","B1",1,2), title: "Subjunctive Mood", description: "Expressing wishes, doubts, and emotions", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2 , culturalHint: "Subjunctive in Spanish: 'Quiero que vengas', 'Espero que estés bien', 'No creo que sea verdad.' Triggers: querer que, esperar que, no creer que, es posible que"},
      { id: lid("es","B1",1,3), title: "Discussing Culture", description: "Talk about traditions and customs", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3 , culturalHint: "Discuss Spanish culture: '¿Crees que la siesta es una buena tradición?' / 'En mi opinión, el flamenco es...' Learn: la identidad, el patrimonio cultural, las raíces"},
      { id: lid("es","B1",1,4), title: "Reading: News Article", description: "Understand a Spanish news story", category: "reading", level: "B1", duration: 12, xp: 35, order: 4 , culturalHint: "Spanish news: El País, El Mundo, La Vanguardia. Topics: la política, la economía, el cambio climático, la inmigración. Learn: el artículo, el titular, la opinión, el editorial"},
      { id: lid("es","B1",1,5), title: "Write an Opinion", description: "Express your views on a topic", category: "writing", level: "B1", duration: 15, xp: 40, order: 5 , culturalHint: "Write an opinion about Spanish traditions: '¿Se están perdiendo las tradiciones españolas?' Use: 'Creo que...', 'Por un lado... por otro...', 'En conclusión...'"},
    ]},
    { id: "es_b1_u2", title: "Professional Life", level: "B1", order: 6, description: "Workplace communication and business Spanish", lessons: [
      { id: lid("es","B1",2,1), title: "Office Vocabulary", description: "Professional terms and workplace jargon", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1 , culturalHint: "Spanish workplace: el horario partido (split schedule: 9-2, then 5-8), la pausa para el café, el compañero de trabajo. Learn: la empresa, el jefe, la reunión, el contrato, las vacaciones"},
      { id: lid("es","B1",2,2), title: "Conditional Tense", description: "Polite requests and hypotheticals", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2 , culturalHint: "Conditional for politeness: '¿Podría ayudarme?', 'Me gustaría...', '¿Sería posible...?' Spanish business communication values formality and indirect requests"},
      { id: lid("es","B1",2,3), title: "Job Interview", description: "Practice a job interview in Spanish", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3 , culturalHint: "Spanish job interview: use usted, dress formally, be prepared for personal questions (legal in Spain). Learn: la entrevista, el puesto, las competencias, la experiencia"},
      { id: lid("es","B1",2,4), title: "Reading: Job Posting", description: "Understand a job advertisement", category: "reading", level: "B1", duration: 10, xp: 30, order: 4 , culturalHint: "Spanish job ads on InfoJobs, LinkedIn: 'Se busca', 'Requisitos', 'Se ofrece'. Learn: el sueldo, el convenio, la jornada completa/parcial, el teletrabajo"},
      { id: lid("es","B1",2,5), title: "Write a Cover Letter", description: "Compose a professional cover letter", category: "writing", level: "B1", duration: 15, xp: 45, order: 5 , culturalHint: "Spanish cover letter (carta de presentación): formal structure with 'Estimado/a Sr./Sra.', express motivation, end with 'Quedo a su disposición.' Very formulaic!"},
    ]},
    { id: "es_b2_u1", title: "Advanced Expression", level: "B2", order: 7, description: "Advanced idioms, humor, and nuanced communication", lessons: [
      { id: lid("es","B2",1,1), title: "Idioms & Expressions", description: "Common Spanish idioms and their meanings", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1 , culturalHint: "Spanish idioms: 'Estar en las nubes' (daydreaming), 'No tener pelos en la lengua' (to be blunt), 'Meter la pata' (to put your foot in it), 'Ir al grano' (get to the point)"},
      { id: lid("es","B2",1,2), title: "Complex Subjunctive", description: "Past subjunctive and hypothetical scenarios", category: "grammar", level: "B2", duration: 15, xp: 50, order: 2 , culturalHint: "Complex subjunctive: 'Si tuviera dinero, viajaría por el mundo.' Past subjunctive + conditional = hypothetical situations. Also: 'Ojalá hubiera ido' (I wish I had gone)"},
      { id: lid("es","B2",1,3), title: "Debating", description: "Express and defend opinions with nuance", category: "speaking", level: "B2", duration: 15, xp: 50, order: 3 , culturalHint: "Spanish debate culture: 'Desde mi punto de vista...', 'Discrepo totalmente...', 'Permítame discrepar...' Spaniards are passionate debaters — interrupting is normal!"},
      { id: lid("es","B2",1,4), title: "Reading: Literature", description: "Analyze a passage from a Spanish author", category: "reading", level: "B2", duration: 15, xp: 45, order: 4 , culturalHint: "Spanish literature: Cervantes (Don Quijote), García Lorca (poeta), Pérez-Galdós, Ana María Matute. Learn: la obra, el autor, el estilo, la generación del 98, el Siglo de Oro"},
      { id: lid("es","B2",1,5), title: "Write a Personal Essay", description: "Express complex ideas about identity", category: "writing", level: "B2", duration: 18, xp: 55, order: 5 , culturalHint: "Write a personal essay about identity: la identidad cultural, las raíces, la globalización vs tradición. Use: 'Me identifico con...', 'Mi cultura me ha enseñado que...'"},
    ]},
    { id: "es_c1_u1", title: "Nuance & Precision", level: "C1", order: 8, description: "Near-native communication and cultural depth", lessons: [
      { id: lid("es","C1",1,1), title: "Register Switching", description: "Formal, informal, and colloquial Spanish", category: "vocabulary", level: "C1", duration: 15, xp: 50, order: 1 , culturalHint: "Spanish registers: formal (usted, estimado), standard (tú, normal), colloquial (tío, mola, flipar), vulgar. Regional: castellano vs andaluz vs canario. Code-switching is a social skill"},
      { id: lid("es","C1",1,2), title: "Rhetorical Devices", description: "Persuasion and emphasis techniques", category: "grammar", level: "C1", duration: 18, xp: 60, order: 2 , culturalHint: "Rhetorical devices in Spanish: la anáfora (repetition), la hipérbole (exaggeration), la ironía, el eufemismo. Politicians and writers use these constantly. Learn to detect and deploy them"},
      { id: lid("es","C1",1,3), title: "Persuasive Speaking", description: "Convince and negotiate effectively", category: "speaking", level: "C1", duration: 15, xp: 55, order: 3 , culturalHint: "Persuasive speaking: 'Permítanme argumentar que...', 'Los datos demuestran que...', 'No cabe duda de que...' Master the art of Spanish formal persuasion"},
      { id: lid("es","C1",1,4), title: "Reading: Academic Text", description: "Understand academic Spanish writing", category: "reading", level: "C1", duration: 18, xp: 55, order: 4 , culturalHint: "Spanish academic text: el ensayo académico, la tesis doctoral, el artículo de investigación. Style: formal, objective, with extensive citations. Learn: citar, argumentar, contrastar"},
      { id: lid("es","C1",1,5), title: "Write a Critique", description: "Compose a nuanced critical review", category: "writing", level: "C1", duration: 20, xp: 60, order: 5 , culturalHint: "Write a critique: analyze a cultural phenomenon (el turismo masivo, la gentrificación, la España vaciada). Use: 'Cabe señalar que...', 'Resulta evidente que...', 'A modo de conclusión...'"},
    ]},
    { id: "es_c2_u1", title: "Mastery & Fluency", level: "C2", order: 9, description: "Complete mastery of Spanish", lessons: [
      { id: lid("es","C2",1,1), title: "Cultural Deep Dive", description: "Every layer of Spanish communication", category: "vocabulary", level: "C2", duration: 18, xp: 60, order: 1 , culturalHint: "Spanish communication mastery: understand regional humor (el humor negro español), double meanings (el doble sentido), cultural references (Don Quijote, la Movida Madrileña), and the art of la sobremesa"},
      { id: lid("es","C2",1,2), title: "Stylistic Grammar", description: "Use grammar for rhetorical effect", category: "grammar", level: "C2", duration: 20, xp: 70, order: 2 , culturalHint: "Stylistic grammar: use the subjunctive for literary effect, master the pretérito anterior (hubo dicho), employ rhetorical questions and periodic sentences like Cervantes"},
      { id: lid("es","C2",1,3), title: "Impromptu Speech", description: "Speak fluently on any topic", category: "speaking", level: "C2", duration: 15, xp: 65, order: 3 , culturalHint: "Impromptu speech on any topic: 'Huelga decir que...', 'No es baladí que...', 'Dicho lo cual...', 'Sin ánimo de ser exhaustivo...' Speak with the elegance of a native intellectual"},
      { id: lid("es","C2",1,4), title: "Reading: Satire & Irony", description: "Detect humor and irony in media", category: "reading", level: "C2", duration: 18, xp: 60, order: 4 , culturalHint: "Spanish satire and irony: El Mundo Today, La Burbuja, political humor. Detect: la sátira, la parodia, el sarcasmo, la crítica social velada. Spanish humor is dark and self-deprecating"},
      { id: lid("es","C2",1,5), title: "Creative Writing", description: "Write a short story in Spanish", category: "writing", level: "C2", duration: 25, xp: 75, order: 5 , culturalHint: "Write a short story set in Spain: capture the rhythm of Spanish speech, use regionalismos, weave in cultural references (la Semana Santa, los toros, la tertulia, el pueblo)"},
    ]},
  ],
};


// ═══════════════════════════════════════════════════════════════════════════════
// KOREAN
// ═══════════════════════════════════════════════════════════════════════════════
export const KOREAN: LanguageCurriculum = {
  code: "ko",
  name: "Korean",
  flag: "🇰🇷",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 95,
  units: [
    {
      id: "ko_a1_u1", title: "안녕! — First Steps", level: "A1", order: 1,
      description: "Korean greetings, Hangul basics, and essential phrases",
      lessons: [
        { id: "ko_a1_u1_l1", title: "Hangul Consonants", description: "Learn the 14 basic consonants of the Korean alphabet", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "한글 (Hangul) was invented by King Sejong in 1443 to give common people literacy. It's considered one of the most scientific writing systems. Learn: ㄱ (g), ㄴ (n), ㄷ (d), ㄹ (r/l), ㅁ (m), ㅂ (b), ㅅ (s), ㅇ (ng), ㅈ (j), ㅊ (ch), ㅋ (k), ㅌ (t), ㅍ (p), ㅎ (h)" },
        { id: "ko_a1_u1_l2", title: "Hangul Vowels", description: "Learn the 10 basic vowels and form syllable blocks", category: "speaking", level: "A1", duration: 8, xp: 25, order: 2, culturalHint: "Korean vowels are based on three elements: heaven (ㆍ), earth (ㅡ), and human (ㅣ). Practice syllable blocks: 가 (ga), 나 (na), 다 (da). Every Korean child learns Hangul by age 5 — you can too!" },
        { id: "ko_a1_u1_l3", title: "Basic Greetings", description: "안녕하세요, 감사합니다, 죄송합니다 — essential polite phrases", category: "grammar", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Korean politeness levels: 존댓말 (formal) vs 반말 (casual). Always use 존댓말 with strangers and elders. Learn: 안녕하세요 (hello), 감사합니다 (thank you), 죄송합니다 (sorry). Bowing accompanies greetings — deeper bow = more respect." },
        { id: "ko_a1_u1_l4", title: "Numbers & Counting", description: "Native Korean and Sino-Korean number systems", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 4, culturalHint: "Korea has TWO number systems! 하나, 둘, 셋 (native Korean — for counting things, age) and 일, 이, 삼 (Sino-Korean — for dates, money, phone numbers). At a market: '이거 얼마예요?' (How much is this?)" },
        { id: "ko_a1_u1_l5", title: "At the Convenience Store", description: "Understand a conversation at a 편의점", category: "listening", level: "A1", duration: 6, xp: 25, order: 5, culturalHint: "편의점 (convenience store) culture — Korea has more convenience stores per capita than anywhere. Open 24/7, they sell 삼각김밥 (triangle kimbap), 라면 (ramen), 떡볶이 (tteokbokki). The cashier says '봉투 필요하세요?' (Need a bag?)" },
      ],
    },
    {
      id: "ko_a1_u2", title: "가족과 일상 — Family & Daily Life", level: "A1", order: 2,
      description: "Korean family terms, home life, and daily routines",
      lessons: [
        { id: "ko_a1_u2_l1", title: "My Korean Family", description: "Family terms including 할머니, 할아버지, 이모, 삼촌", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1, culturalHint: "Korean family terms are extremely specific — different words for older/younger siblings by gender: 오빠 (older brother, said by female), 형 (older brother, said by male), 언니 (older sister, said by female), 누나 (older sister, said by male). 효도 (filial piety) is central to Korean culture." },
        { id: "ko_a1_u2_l2", title: "Present Tense — Korean Style", description: "Basic verb conjugation with -아/어요 endings", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2, culturalHint: "Korean verbs go at the END of the sentence (SOV order). Practice with daily activities: '저는 김치를 먹어요' (I eat kimchi), '한국어를 공부해요' (I study Korean), '집에서 드라마를 봐요' (I watch dramas at home)." },
        { id: "ko_a1_u2_l3", title: "My Daily Routine", description: "Describe your day in Korean", category: "writing", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Write about a Korean daily routine: 아침에 밥을 먹어요 (eat rice for breakfast — yes, Koreans eat rice for breakfast!), 지하철을 타요 (take the subway), 회사에 가요 (go to work). Korean meals always include 반찬 (side dishes) and 김치." },
        { id: "ko_a1_u2_l4", title: "Korean Home Life", description: "Rooms, furniture, and 온돌 (heated floors)", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Korean homes have 온돌 (ondol) — heated floors! You sit, eat, and sleep on the floor. Learn: 방 (room), 부엌 (kitchen), 거실 (living room), 화장실 (bathroom). Always remove shoes at the door — 실내화 (indoor slippers) are provided." },
        { id: "ko_a1_u2_l5", title: "Reading: A KakaoTalk Chat", description: "Understand informal Korean text messages", category: "reading", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "카카오톡 (KakaoTalk) is Korea's #1 messaging app — everyone uses it. Text slang: ㅋㅋㅋ (hahaha), ㅠㅠ (crying), ㄱㄱ (let's go), ㅇㅇ (yes), ㄴㄴ (no). Read a chat about meeting for 치맥 (chicken + beer)." },
      ],
    },
    {
      id: "ko_a2_u1", title: "길 찾기 — Getting Around", level: "A2", order: 3,
      description: "Navigating Seoul, transportation, and directions",
      lessons: [
        { id: "ko_a2_u1_l1", title: "Asking for Directions", description: "Navigate Seoul using Korean direction words", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Seoul navigation: '직진하세요' (go straight), '왼쪽으로 가세요' (go left), '오른쪽으로 가세요' (go right). Landmarks: 강남역 (Gangnam Station), 명동 (Myeongdong), 홍대 (Hongdae). The subway announcements are in Korean, English, Chinese, and Japanese!" },
        { id: "ko_a2_u1_l2", title: "Past Tense — What Happened", description: "Past tense with -았/었어요 endings", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2, culturalHint: "Tell stories about Korean experiences: '어제 한강에서 치맥을 했어요' (Yesterday I had chicken and beer at the Han River). '설날에 할머니 댁에 갔어요' (I went to grandma's house for Lunar New Year)." },
        { id: "ko_a2_u1_l3", title: "Seoul Transportation", description: "지하철, 버스, 택시 vocabulary", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Korean transport: 지하철 (subway — Seoul has 23 lines!), 버스 (bus), 택시 (taxi), KTX (bullet train to Busan in 2.5 hours). Use T-money card (교통카드) for everything. Learn: '내려요!' (I'm getting off!)" },
        { id: "ko_a2_u1_l4", title: "Reading: A Subway Map", description: "Follow directions using Seoul's subway system", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Seoul subway: Line 2 (green, circular — goes through 강남, 홍대, 신촌), Line 1 (dark blue — to 인천). Transfer at 환승역. Each station has a number (e.g., 강남 = 222). Learn: 출구 (exit), 환승 (transfer), 방면 (direction)." },
        { id: "ko_a2_u1_l5", title: "Write About Your Neighborhood", description: "Describe where you live in Korean", category: "writing", level: "A2", duration: 12, xp: 35, order: 5, culturalHint: "Describe a Korean neighborhood: '우리 동네에 편의점이 세 개 있어요' (There are 3 convenience stores in my neighborhood). Include: 카페 (café), 노래방 (karaoke), PC방 (internet café), 찜질방 (jjimjilbang spa)." },
      ],
    },
    {
      id: "ko_a2_u2", title: "음식 — Food & Drink", level: "A2", order: 4,
      description: "Korean cuisine, ordering food, and cooking vocabulary",
      lessons: [
        { id: "ko_a2_u2_l1", title: "Korean Food Vocabulary", description: "김치, 비빔밥, 삼겹살 — essential dishes", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1, culturalHint: "Korean food culture: 김치 (kimchi — fermented cabbage, eaten with EVERY meal), 비빔밥 (bibimbap — mixed rice), 삼겹살 (pork belly BBQ), 떡볶이 (spicy rice cakes), 김밥 (Korean sushi roll), 된장찌개 (soybean stew). 밥 먹었어? (Have you eaten?) = 'How are you?'" },
        { id: "ko_a2_u2_l2", title: "Ordering at a Restaurant", description: "How to order food at a Korean restaurant", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "At a Korean restaurant: press the 벨 (bell button) to call the server. '여기요!' (Excuse me!). '삼겹살 2인분 주세요' (2 servings of pork belly please). Side dishes (반찬) are FREE and unlimited refills! '반찬 더 주세요' (More side dishes please)." },
        { id: "ko_a2_u2_l3", title: "Connective Endings", description: "Linking sentences with -고, -지만, -아서/어서", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3, culturalHint: "Connect ideas Korean-style: '김치는 맵지만 맛있어요' (Kimchi is spicy but delicious). '배가 고파서 라면을 먹었어요' (I was hungry so I ate ramen). Korean grandmothers say '많이 먹어!' (Eat a lot!) — refusing food is rude." },
        { id: "ko_a2_u2_l4", title: "Reading: A Recipe", description: "Follow a Korean recipe for 김치찌개", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "김치찌개 (kimchi stew) recipe — Korea's comfort food. Ingredients: 묵은지 (aged kimchi), 돼지고기 (pork), 두부 (tofu), 대파 (green onion), 고춧가루 (chili flakes). Every Korean learns this recipe from their 엄마 (mom)." },
        { id: "ko_a2_u2_l5", title: "Listening: At the Market", description: "Understand vendors at 시장", category: "listening", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "At 광장시장 (Gwangjang Market) or 남대문시장 (Namdaemun Market): vendors shout '맛보세요!' (Try it!). Street food: 호떡 (sweet pancake), 어묵 (fish cake), 붕어빵 (fish-shaped bread with red bean). Learn: '하나 주세요' (One please)." },
      ],
    },
    {
      id: "ko_b1_u1", title: "문화와 사회 — Culture & Society", level: "B1", order: 5,
      description: "Korean culture, K-pop, K-drama, and social dynamics",
      lessons: [
        { id: "ko_b1_u1_l1", title: "K-Pop & K-Drama", description: "Entertainment vocabulary and cultural significance", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "한류 (Hallyu/Korean Wave): K-pop groups like BTS (방탄소년단), BLACKPINK, K-dramas on Netflix. Learn: 아이돌 (idol), 팬미팅 (fan meeting), 컴백 (comeback), 음원 (music release), 대박 (jackpot/amazing). Fan culture: 응원봉 (light stick), 덕질 (fangirling)." },
        { id: "ko_b1_u1_l2", title: "Honorific System", description: "존댓말 levels and when to use each", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2, culturalHint: "Korean has 7 speech levels! Most important: 합쇼체 (most formal — news, business), 해요체 (polite — daily life), 해체/반말 (casual — close friends, younger people). Using wrong level = social disaster. Age determines everything: '몇 살이에요?' is asked immediately." },
        { id: "ko_b1_u1_l3", title: "Discussing Korean Traditions", description: "Talk about 설날, 추석, and seasonal customs", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3, culturalHint: "Korean holidays: 설날 (Lunar New Year) — wear 한복, do 세배 (deep bow to elders), eat 떡국 (rice cake soup, you age 1 year!), play 윷놀이. 추석 (Harvest Moon) — visit ancestors' graves, eat 송편 (half-moon rice cakes). Both cause massive traffic jams as everyone goes to their 고향 (hometown)." },
        { id: "ko_b1_u1_l4", title: "Reading: News Article", description: "Understand a Korean news story about society", category: "reading", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Korean social issues: 취업난 (job crisis), 주거 문제 (housing crisis in Seoul), 저출산 (low birth rate), 학벌 (educational background obsession). Read about 수능 (CSAT — the college entrance exam that stops the entire country, even planes are grounded!)." },
        { id: "ko_b1_u1_l5", title: "Write an Opinion", description: "Express your views on Korean culture", category: "writing", level: "B1", duration: 15, xp: 40, order: 5, culturalHint: "Write about Korean cultural debates: Is 빨리빨리 (hurry hurry) culture good or bad? Should 성형수술 (plastic surgery) be so normalized? Is the 재벌 (chaebol/conglomerate) system fair? Use: '제 생각에는...', '한편으로는...', '결론적으로...'" },
      ],
    },
    {
      id: "ko_b1_u2", title: "직장 생활 — Professional Life", level: "B1", order: 6,
      description: "Korean workplace culture, hierarchy, and business communication",
      lessons: [
        { id: "ko_b1_u2_l1", title: "Office Vocabulary", description: "Professional terms and workplace hierarchy", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1, culturalHint: "Korean workplace hierarchy: 사장님 (CEO), 부장님 (department head), 과장님 (section chief), 대리 (assistant manager), 사원 (employee). 회식 (team dinner with drinking) is mandatory. Learn: '수고하셨습니다' (good work today — said when leaving office)." },
        { id: "ko_b1_u2_l2", title: "Formal Speech Patterns", description: "Business Korean with -습니다/ㅂ니다 endings", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2, culturalHint: "Business Korean uses 합쇼체 (highest formality): '보고드리겠습니다' (I will report to you), '확인하겠습니다' (I will confirm), '죄송합니다만...' (I'm sorry but...). Email: '안녕하십니까' (formal hello), '감사드립니다' (formal thank you)." },
        { id: "ko_b1_u2_l3", title: "Job Interview Practice", description: "Role-play a Korean job interview", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3, culturalHint: "Korean job interviews: arrive 10 minutes early, bow 90 degrees, use 존댓말 throughout. '자기소개 해주세요' (Please introduce yourself). Mention your university (서울대, 연세대, 고려대 = SKY schools are most prestigious). Dress conservatively — appearance matters enormously." },
        { id: "ko_b1_u2_l4", title: "Reading: Job Posting", description: "Understand a Korean job advertisement on 잡코리아", category: "reading", level: "B1", duration: 10, xp: 30, order: 4, culturalHint: "Korean job ads on 잡코리아 or 사람인: '자격요건' (requirements), '우대사항' (preferred qualifications), '복리후생' (benefits). Many require 토익 (TOEIC) scores. '신입' (new graduate) vs '경력직' (experienced). The 스펙 (spec = qualifications) culture is intense." },
        { id: "ko_b1_u2_l5", title: "Write a Self-Introduction", description: "Compose a 자기소개서 for job applications", category: "writing", level: "B1", duration: 15, xp: 45, order: 5, culturalHint: "자기소개서 (self-introduction letter) is unique to Korean job applications — a long essay about your life, values, and why you fit the company. Sections: 성장과정 (upbringing), 지원동기 (motivation), 입사 후 포부 (future goals). Very personal and detailed." },
      ],
    },
    {
      id: "ko_b2_u1", title: "고급 표현 — Advanced Expression", level: "B2", order: 7,
      description: "Advanced Korean idioms, humor, and nuanced communication",
      lessons: [
        { id: "ko_b2_u1_l1", title: "사자성어 & Idioms", description: "Four-character idioms and Korean proverbs", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1, culturalHint: "사자성어 (4-character Chinese idioms used in Korean): 일석이조 (一石二鳥, kill two birds with one stone), 자업자득 (自業自得, reap what you sow). Korean proverbs: '원숭이도 나무에서 떨어진다' (Even monkeys fall from trees = everyone makes mistakes)." },
        { id: "ko_b2_u1_l2", title: "Complex Grammar Patterns", description: "Advanced connectors and nuanced expressions", category: "grammar", level: "B2", duration: 15, xp: 50, order: 2, culturalHint: "Advanced patterns: '-는 바람에' (because of/due to), '-기는커녕' (far from/let alone), '-는 셈이다' (it amounts to). These appear in TOPIK II (한국어능력시험) — the official Korean proficiency test. Master these to sound truly fluent." },
        { id: "ko_b2_u1_l3", title: "Korean Humor & 눈치", description: "Understand Korean social intelligence and humor", category: "speaking", level: "B2", duration: 15, xp: 50, order: 3, culturalHint: "눈치 (nunchi) — Korea's social superpower: reading the room, understanding unspoken feelings, knowing when to speak/stay silent. Korean humor: 아재개그 (dad jokes), 드립 (witty remarks), 셀프디스 (self-deprecation). Variety shows (예능) are the best way to learn Korean humor." },
        { id: "ko_b2_u1_l4", title: "Reading: Korean Literature", description: "Analyze a passage from a Korean author", category: "reading", level: "B2", duration: 15, xp: 45, order: 4, culturalHint: "Korean literature: 한강 (Han Kang — Nobel Prize winner, '채식주의자' The Vegetarian), 신경숙 ('엄마를 부탁해' Please Look After Mom), 조남주 ('82년생 김지영' Kim Ji-young, Born 1982 — about gender inequality). Korean literature often explores 한 (han) — collective grief and resilience." },
        { id: "ko_b2_u1_l5", title: "Write a Personal Essay", description: "Express complex ideas about identity and culture", category: "writing", level: "B2", duration: 18, xp: 55, order: 5, culturalHint: "Write about Korean identity: 한 (han — deep sorrow/resilience), 정 (jeong — deep emotional bond), 흥 (heung — joy/excitement). Explore: What does it mean to be Korean in the modern world? How do tradition and 빨리빨리 culture coexist?" },
      ],
    },
    {
      id: "ko_c1_u1", title: "한국어 마스터 — Korean Mastery", level: "C1", order: 8,
      description: "Near-native Korean communication and cultural depth",
      lessons: [
        { id: "ko_c1_u1_l1", title: "Register & Context Switching", description: "Formal, informal, and internet Korean", category: "vocabulary", level: "C1", duration: 15, xp: 50, order: 1, culturalHint: "Korean registers: 격식체 (formal written — news, academic), 비격식체 (informal polite — daily), 인터넷 용어 (internet slang — ㅋㅋ, ㄹㅇ, ㅇㅈ, 갓벽). Code-switching between 존댓말 and 반말 based on age, status, and intimacy. Master: 높임말 (honorifics for others' actions — 드시다, 주무시다, 계시다)." },
        { id: "ko_c1_u1_l2", title: "Rhetorical Korean", description: "Persuasion, emphasis, and literary devices", category: "grammar", level: "C1", duration: 18, xp: 60, order: 2, culturalHint: "Korean rhetoric: 반어법 (irony), 과장법 (hyperbole), 은유 (metaphor). Political speech patterns: '~해야 합니다' (we must), '~하지 않을 수 없습니다' (we cannot not do). Master indirect refusal: '좀 어려울 것 같은데요...' (It might be a bit difficult... = NO)." },
        { id: "ko_c1_u1_l3", title: "Debate & Persuasion", description: "Argue and negotiate in formal Korean", category: "speaking", level: "C1", duration: 15, xp: 55, order: 3, culturalHint: "Korean debate style: indirect disagreement is preferred. '그 의견도 일리가 있지만...' (That opinion has merit, but...). Never directly say someone is wrong. Use: '제 소견으로는...', '다른 관점에서 보면...', '한 가지 고려할 점은...' Korean negotiation values harmony (화합) over winning." },
        { id: "ko_c1_u1_l4", title: "Reading: Academic Korean", description: "Understand academic papers and formal reports", category: "reading", level: "C1", duration: 18, xp: 55, order: 4, culturalHint: "Academic Korean: '~에 관한 연구' (research regarding), '~을 분석한 결과' (as a result of analyzing), '~임을 시사한다' (this suggests that). Read about Korean society: 한국의 교육열 (Korea's education fever), 한류의 경제적 영향 (economic impact of Hallyu)." },
        { id: "ko_c1_u1_l5", title: "Write a Research Summary", description: "Compose an academic summary in Korean", category: "writing", level: "C1", duration: 20, xp: 65, order: 5, culturalHint: "Write a research summary about Korean culture: structure with 서론 (introduction), 본론 (body), 결론 (conclusion). Use academic vocabulary: 분석하다, 고찰하다, 논의하다, 제시하다. Topic: How has 한류 changed Korea's global image?" },
      ],
    },
    {
      id: "ko_c2_u1", title: "완벽한 한국어 — Perfect Korean", level: "C2", order: 9,
      description: "Complete mastery of Korean language and culture",
      lessons: [
        { id: "ko_c2_u1_l1", title: "Cultural Deep Dive", description: "Every layer of Korean communication", category: "vocabulary", level: "C2", duration: 18, xp: 60, order: 1, culturalHint: "Master every layer: 한 (collective sorrow), 정 (deep bonds), 눈치 (social intelligence), 체면 (face/reputation), 빨리빨리 (urgency culture). Understand why Koreans ask your age immediately (to set speech level), why they pour drinks with two hands, and why 4 (사/死) is unlucky." },
        { id: "ko_c2_u1_l2", title: "Stylistic Mastery", description: "Use grammar for literary and rhetorical effect", category: "grammar", level: "C2", duration: 20, xp: 70, order: 2, culturalHint: "Stylistic Korean: master archaic forms (하오체, 하게체), literary endings (-노라, -도다), and poetic Korean. Read 윤동주 (Yun Dong-ju) poetry: '죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를' (Until the day I die, let me look up at heaven without shame)." },
        { id: "ko_c2_u1_l3", title: "Impromptu Speech", description: "Speak fluently on any topic in Korean", category: "speaking", level: "C2", duration: 15, xp: 65, order: 3, culturalHint: "Speak like a native intellectual: use 사자성어 naturally, employ 겸양 (humility) in self-reference, master the art of 돌려말하기 (speaking indirectly). Korean TED talks, 대학 강연 (university lectures), and 토론 (debates) are your models." },
        { id: "ko_c2_u1_l4", title: "Reading: Satire & Social Commentary", description: "Detect irony and social criticism in Korean media", category: "reading", level: "C2", duration: 18, xp: 60, order: 4, culturalHint: "Korean satire: 풍자 (satire in webtoons and variety shows), 블랙코미디 (black comedy in films like 기생충/Parasite by 봉준호). Understand social commentary about 계급 (class), 갑을관계 (power dynamics), and 헬조선 (Hell Joseon — youth frustration with society)." },
        { id: "ko_c2_u1_l5", title: "Creative Writing in Korean", description: "Write a short story with native-level Korean", category: "writing", level: "C2", duration: 25, xp: 75, order: 5, culturalHint: "Write a short story set in Korea: capture the rhythm of Korean speech, use 의성어/의태어 (onomatopoeia — Korean has hundreds!): 반짝반짝 (sparkling), 두근두근 (heart pounding), 살금살금 (sneaking). Weave in cultural themes: 한, 정, 효도, modern vs traditional Korea." },
      ],
    },
  ],
};


// ═══════════════════════════════════════════════════════════════════════════════
// ITALIAN
// ═══════════════════════════════════════════════════════════════════════════════
export const ITALIAN: LanguageCurriculum = {
  code: "it",
  name: "Italian",
  flag: "🇮🇹",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 80,
  units: [
    {
      id: "it_a1_u1", title: "Ciao! — First Steps", level: "A1", order: 1,
      description: "Italian greetings, introductions, and essential phrases",
      lessons: [
        { id: "it_a1_u1_l1", title: "Greetings Italian Style", description: "Ciao, buongiorno, arrivederci — how Italians greet", category: "vocabulary", level: "A1", duration: 5, xp: 20, order: 1, culturalHint: "Italian greetings change by time: buongiorno (morning), buon pomeriggio (afternoon), buonasera (evening). 'Ciao' is informal — use 'buongiorno' with strangers. Italians kiss both cheeks (due baci) when greeting friends. Always start with 'Salve' if unsure of formality." },
        { id: "it_a1_u1_l2", title: "Introducing Yourself", description: "Mi chiamo... — name, origin, and occupation", category: "speaking", level: "A1", duration: 8, xp: 25, order: 2, culturalHint: "Italian introductions: 'Mi chiamo Marco, sono di Roma' (My name is Marco, I'm from Rome). Italians identify strongly with their city — a Neapolitan is Neapolitan first, Italian second. Learn: piacere (pleasure), come si chiama? (formal), come ti chiami? (informal)." },
        { id: "it_a1_u1_l3", title: "Essere vs Avere", description: "The two essential verbs: to be and to have", category: "grammar", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Italian uses 'avere' (to have) where English uses 'to be': 'Ho fame' (I have hunger = I'm hungry), 'Ho freddo' (I have cold = I'm cold), 'Ho 25 anni' (I have 25 years = I'm 25). Practice at a bar: 'Ho sete — un caffè, per favore!'" },
        { id: "it_a1_u1_l4", title: "Numbers & Money", description: "Counting euros and understanding Italian prices", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 4, culturalHint: "Italian money: euros and centesimi. A caffè al banco (standing at the bar) costs €1, but sitting down (al tavolo) can cost €3-5! Learn: 'Quanto costa?' (How much?), 'Il conto, per favore' (The bill, please). Tip: il coperto (cover charge) is normal at restaurants." },
        { id: "it_a1_u1_l5", title: "At the Bar", description: "Understand a conversation at an Italian bar", category: "listening", level: "A1", duration: 6, xp: 25, order: 5, culturalHint: "The Italian bar (not a pub — it's a café!): order un caffè (espresso), un cappuccino (ONLY before 11am — never after lunch!), un cornetto (croissant). Stand at il banco for cheaper prices. The barista says 'Dica!' (Tell me!/What'll it be?). Never order a 'latte' — you'll get plain milk!" },
      ],
    },
    {
      id: "it_a1_u2", title: "La Famiglia — Daily Life", level: "A1", order: 2,
      description: "Italian family, home life, and daily routines",
      lessons: [
        { id: "it_a1_u2_l1", title: "La Mia Famiglia", description: "Family terms including nonna, nonno, zio, cugino", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1, culturalHint: "Italian family (la famiglia) is everything. Sunday pranzo (lunch) at nonna's is sacred — 3-4 courses, 3+ hours. Learn: mamma, papà, fratello, sorella, nonna, nonno, zio, zia, cugino. 'Mammone' (mama's boy) is common — many Italian men live at home until marriage!" },
        { id: "it_a1_u2_l2", title: "Present Tense — Italian Verbs", description: "Regular -are, -ere, -ire verb conjugations", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2, culturalHint: "Italian verb groups: -ARE (parlare → parlo), -ERE (scrivere → scrivo), -IRE (dormire → dormo). Practice with daily life: 'Mangio la pasta ogni giorno' (I eat pasta every day), 'Parlo con la nonna' (I talk to grandma), 'Dormo fino a tardi la domenica' (I sleep late on Sundays)." },
        { id: "it_a1_u2_l3", title: "La Mia Giornata", description: "Describe your daily routine Italian-style", category: "writing", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Write about an Italian daily routine: colazione (light breakfast — cornetto e caffè), pranzo (big lunch 1-2pm — primo, secondo, contorno), merenda (afternoon snack), cena (dinner 8-9pm). La passeggiata (evening stroll) is a daily ritual in every Italian town." },
        { id: "it_a1_u2_l4", title: "La Casa Italiana", description: "Rooms, furniture, and Italian home life", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Italian homes: la cucina (kitchen — heart of the home), il salotto (living room), il balcone (balcony — for drying laundry and growing basilico). Learn: il bidet (yes, every Italian bathroom has one!), la moka (stovetop espresso maker — in every kitchen)." },
        { id: "it_a1_u2_l5", title: "Reading: A WhatsApp Message", description: "Understand informal Italian text messages", category: "reading", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "Italian texting: 'Cmq' (comunque = anyway), 'Nn' (non = not), 'Xché' (perché = why/because), 'Tvb' (ti voglio bene = I love you/care about you). Read a chat about planning an aperitivo (pre-dinner drinks with snacks — a sacred Italian ritual, especially in Milan)." },
      ],
    },
    {
      id: "it_a2_u1", title: "In Giro — Getting Around", level: "A2", order: 3,
      description: "Navigating Italian cities, transportation, and directions",
      lessons: [
        { id: "it_a2_u1_l1", title: "Asking for Directions", description: "Navigate Italian cities with confidence", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Italian directions: 'Sempre dritto' (straight ahead), 'Giri a sinistra/destra' (turn left/right), 'In fondo alla via' (at the end of the street). Italians gesture while giving directions! Landmarks: il duomo, la piazza, la fontana. 'Mi scusi, dov'è la stazione?' (Excuse me, where's the station?)" },
        { id: "it_a2_u1_l2", title: "Past Tense — Passato Prossimo", description: "Talk about what you did yesterday", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2, culturalHint: "Passato prossimo: 'Ieri sono andato/a a Firenze' (Yesterday I went to Florence). Some verbs use essere (movement, state change), others avere. Tell about Italian experiences: 'Ho mangiato una pizza napoletana fantastica!' (I ate an amazing Neapolitan pizza!)" },
        { id: "it_a2_u1_l3", title: "Italian Transportation", description: "Treno, autobus, metro vocabulary", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Italian transport: il treno (Trenitalia, Italo — high-speed to anywhere), l'autobus (often late!), la metro (Rome and Milan), il vaporetto (Venice water bus). Learn: 'Un biglietto per Roma, per favore', 'A che ora parte?' (What time does it leave?). Validate your ticket or face a €50 fine!" },
        { id: "it_a2_u1_l4", title: "Reading: A City Guide", description: "Follow a tourist guide to Italian landmarks", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Italian cities: Roma (il Colosseo, il Vaticano, Trastevere), Firenze (il Duomo, gli Uffizi, Ponte Vecchio), Venezia (Piazza San Marco, il Canal Grande), Napoli (Spaccanapoli, il Vesuvio). Each city has its own dialect, food, and character." },
        { id: "it_a2_u1_l5", title: "Write About Your Trip", description: "Describe a trip to an Italian city", category: "writing", level: "A2", duration: 12, xp: 35, order: 5, culturalHint: "Write about a trip: 'Il weekend scorso sono andato/a a Venezia. Ho visitato Piazza San Marco e ho mangiato i cicchetti (Venetian tapas). La città è magica!' Include: il museo, la chiesa, il ristorante, la gelateria." },
      ],
    },
    {
      id: "it_a2_u2", title: "A Tavola! — Food & Drink", level: "A2", order: 4,
      description: "Italian cuisine, ordering food, and cooking vocabulary",
      lessons: [
        { id: "it_a2_u2_l1", title: "Italian Food Vocabulary", description: "Pasta, pizza, gelato — essential dishes", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1, culturalHint: "Italian food rules: NEVER put cream in carbonara (only egg, pecorino, guanciale). Pizza: margherita (tomato, mozzarella, basil — the Italian flag!). Pasta shapes match sauces: penne = ragù, spaghetti = vongole, orecchiette = cime di rapa. Learn: antipasto, primo, secondo, contorno, dolce." },
        { id: "it_a2_u2_l2", title: "Ordering at a Trattoria", description: "How to order food at an Italian restaurant", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "At a trattoria: 'Per me, gli spaghetti alle vongole come primo e la tagliata come secondo' (For me, clam spaghetti as first course and sliced steak as second). Never ask for parmesan on fish pasta! The cameriere says 'Da bere?' (To drink?). 'Un quartino di rosso' (a quarter liter of red wine)." },
        { id: "it_a2_u2_l3", title: "Imperfect Tense", description: "Talking about what you used to eat growing up", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3, culturalHint: "Imperfetto for memories: 'Quando ero piccolo/a, la nonna faceva la pasta fresca ogni domenica' (When I was little, grandma made fresh pasta every Sunday). Italian nonnas and their recipes are legendary — each family guards their ragù recipe like a state secret." },
        { id: "it_a2_u2_l4", title: "Reading: A Recipe", description: "Follow an Italian recipe for tiramisù", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Tiramisù recipe (means 'pick me up'): mascarpone, uova, zucchero, savoiardi (ladyfingers), caffè espresso, cacao amaro. 'Separare i tuorli dagli albumi, montare...' Every Italian region claims they invented it (Veneto vs Friuli)." },
        { id: "it_a2_u2_l5", title: "Listening: At the Market", description: "Understand vendors at il mercato", category: "listening", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "At the Italian mercato: vendors shout 'Signora, guardi che bella roba!' (Ma'am, look at this beautiful stuff!). Buy: pomodori San Marzano, mozzarella di bufala, prosciutto di Parma, parmigiano reggiano. Learn: 'Me ne dia un etto' (Give me 100 grams)." },
      ],
    },
    {
      id: "it_b1_u1", title: "Cultura e Società", level: "B1", order: 5,
      description: "Italian culture, art, fashion, and social life",
      lessons: [
        { id: "it_b1_u1_l1", title: "Arte, Moda & Design", description: "Cultural vocabulary: art, fashion, and Italian design", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "Italian culture: il Rinascimento (Renaissance — Michelangelo, Leonardo, Raffaello), la moda (Gucci, Prada, Armani, Versace — Milan is the capital), il design (Ferrari, Vespa, Alessi). Learn: il capolavoro (masterpiece), lo stilista (designer), la sfilata (fashion show), il Made in Italy." },
        { id: "it_b1_u1_l2", title: "Subjunctive Mood — Congiuntivo", description: "Expressing opinions, doubts, and emotions", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2, culturalHint: "Il congiuntivo — Italians' favorite grammar topic to complain about! 'Penso che l'Italia sia il paese più bello del mondo' (I think Italy is the most beautiful country). Triggers: penso che, credo che, è possibile che, spero che. Using it correctly impresses every Italian." },
        { id: "it_b1_u1_l3", title: "Discussing Italian Life", description: "Talk about la dolce vita and Italian values", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3, culturalHint: "La dolce vita (the sweet life): Italians value il bel vivere — good food, family, beauty, leisure. Discuss: la passeggiata (evening stroll), l'aperitivo (pre-dinner ritual), il riposo (afternoon rest), la bella figura (making a good impression). 'Chi va piano, va sano e va lontano' (Slow and steady wins the race)." },
        { id: "it_b1_u1_l4", title: "Reading: News Article", description: "Understand an Italian news story", category: "reading", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Italian news: La Repubblica, Corriere della Sera, La Stampa. Topics: la politica italiana (famously chaotic!), il calcio (football is religion — Serie A, la Nazionale), l'immigrazione, il turismo. Read about la Festa della Repubblica (June 2nd — Italy's national day)." },
        { id: "it_b1_u1_l5", title: "Write an Opinion", description: "Express your views on Italian culture", category: "writing", level: "B1", duration: 15, xp: 40, order: 5, culturalHint: "Write about Italian cultural debates: Is il calcio too dominant in Italian life? Should Italy preserve its small towns (borghi) or modernize? Is la bella figura superficial or important? Use: 'Secondo me...', 'Da un lato... dall'altro...', 'In conclusione...'" },
      ],
    },
    {
      id: "it_b1_u2", title: "Il Lavoro — Professional Life", level: "B1", order: 6,
      description: "Italian workplace culture and business communication",
      lessons: [
        { id: "it_b1_u2_l1", title: "Office Vocabulary", description: "Professional terms and workplace culture", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1, culturalHint: "Italian workplace: relationships (le relazioni) matter more than efficiency. La pausa caffè (coffee break) is sacred — 2-3 times daily. Learn: il collega, il capo, la riunione, lo stipendio, le ferie (vacation — Italians get 4+ weeks!). August = ferragosto — the whole country shuts down!" },
        { id: "it_b1_u2_l2", title: "Conditional Tense", description: "Polite requests and hypotheticals", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2, culturalHint: "Il condizionale for politeness: 'Potrebbe aiutarmi?' (Could you help me?), 'Vorrei un'informazione' (I'd like some information), 'Sarebbe possibile...?' (Would it be possible...?). Italian business communication values elegance and formality — never be too direct." },
        { id: "it_b1_u2_l3", title: "Job Interview Practice", description: "Role-play an Italian job interview", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3, culturalHint: "Italian job interviews: use 'Lei' (formal you), dress impeccably (la bella figura!), be warm but professional. 'Mi parli di Lei' (Tell me about yourself). Italians value: laurea (university degree), esperienza all'estero (international experience), and personal connections (le raccomandazioni — controversial but real)." },
        { id: "it_b1_u2_l4", title: "Reading: Job Posting", description: "Understand an Italian job advertisement", category: "reading", level: "B1", duration: 10, xp: 30, order: 4, culturalHint: "Italian job ads on LinkedIn or InfoJobs: 'Si richiede' (Required), 'Requisiti' (Requirements), 'Si offre' (We offer), 'Contratto a tempo indeterminato' (permanent contract — the holy grail!). Italian job market: il precariato (precarious work) is a major issue for giovani (young people)." },
        { id: "it_b1_u2_l5", title: "Write a Cover Letter", description: "Compose a professional lettera di presentazione", category: "writing", level: "B1", duration: 15, xp: 45, order: 5, culturalHint: "Italian cover letter: 'Egregio/a Dott./Dott.ssa' (Dear Dr. — Italians use titles!), formal structure, mention your laurea and competenze. End with 'In attesa di un cortese riscontro, porgo distinti saluti' (Awaiting your kind response, best regards). Very formal!" },
      ],
    },
    {
      id: "it_b2_u1", title: "Espressioni Avanzate", level: "B2", order: 7,
      description: "Advanced Italian idioms, humor, and nuanced communication",
      lessons: [
        { id: "it_b2_u1_l1", title: "Idioms & Proverbs", description: "Italian idioms and their cultural meanings", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1, culturalHint: "Italian idioms: 'In bocca al lupo!' (Good luck! — reply: 'Crepi!' = May it die!), 'Non tutte le ciambelle riescono col buco' (Not all donuts come out with a hole = things don't always work out), 'Chi dorme non piglia pesci' (He who sleeps doesn't catch fish = early bird gets the worm)." },
        { id: "it_b2_u1_l2", title: "Complex Subjunctive", description: "Past subjunctive and hypothetical scenarios", category: "grammar", level: "B2", duration: 15, xp: 50, order: 2, culturalHint: "Periodo ipotetico (hypothetical): 'Se avessi più tempo, viaggerei per tutta l'Italia' (If I had more time, I'd travel all of Italy). Three types: realtà (real), possibilità (possible), irrealtà (impossible). Master this and Italians will say 'Complimenti! Parli benissimo!'" },
        { id: "it_b2_u1_l3", title: "Italian Humor & Gestures", description: "Understand Italian comedy and body language", category: "speaking", level: "B2", duration: 15, xp: 50, order: 3, culturalHint: "Italian gestures (i gesti): the 'pinched fingers' (ma che vuoi? = what do you want?), the chin flick (non me ne frega = I don't care), the hand wave (ma va! = get out of here!). Italian humor: la commedia all'italiana, Roberto Benigni, self-deprecating regional jokes (North vs South)." },
        { id: "it_b2_u1_l4", title: "Reading: Italian Literature", description: "Analyze a passage from an Italian author", category: "reading", level: "B2", duration: 15, xp: 45, order: 4, culturalHint: "Italian literature: Dante Alighieri (La Divina Commedia — foundation of Italian language), Italo Calvino (Se una notte d'inverno un viaggiatore), Elena Ferrante (L'amica geniale — Neapolitan novels), Umberto Eco (Il nome della rosa). Italian is called 'la lingua di Dante'." },
        { id: "it_b2_u1_l5", title: "Write a Personal Essay", description: "Express complex ideas about Italian identity", category: "writing", level: "B2", duration: 18, xp: 55, order: 5, culturalHint: "Write about Italian identity: il campanilismo (extreme local pride — every town thinks it's the best), Nord vs Sud divide, l'emigrazione italiana (Italian diaspora), il Made in Italy as national pride. Explore: What does 'essere italiano' mean in the modern world?" },
      ],
    },
    {
      id: "it_c1_u1", title: "Padronanza Italiana", level: "C1", order: 8,
      description: "Near-native Italian communication and cultural mastery",
      lessons: [
        { id: "it_c1_u1_l1", title: "Register Switching", description: "Formal, informal, and dialectal Italian", category: "vocabulary", level: "C1", duration: 15, xp: 50, order: 1, culturalHint: "Italian registers: formale (Lei, Egregio), standard (tu, ciao), colloquiale (dialetto, slang). Italy has dozens of dialects — napoletano, siciliano, romanesco, milanese — some are almost separate languages! A Roman says 'Daje!' (Come on!), a Neapolitan says 'Uè!' (Hey!)." },
        { id: "it_c1_u1_l2", title: "Rhetorical Italian", description: "Persuasion and emphasis in Italian discourse", category: "grammar", level: "C1", duration: 18, xp: 60, order: 2, culturalHint: "Italian rhetoric: l'iperbole (Italians exaggerate everything — 'Muoio di fame!' = I'm dying of hunger), la litote (understatement — 'Non è male' = It's great), il diminutivo/accrescitivo (un momentino, un problemone). Master these to sound authentically Italian." },
        { id: "it_c1_u1_l3", title: "Persuasive Speaking", description: "Convince and negotiate Italian-style", category: "speaking", level: "C1", duration: 15, xp: 55, order: 3, culturalHint: "Italian negotiation: build relationships first, use charm and eloquence. 'Mi permetta di esporre il mio punto di vista...', 'Capisco la sua posizione, tuttavia...', 'Propongo un compromesso...' Italians value bella figura even in disagreement — never lose your composure." },
        { id: "it_c1_u1_l4", title: "Reading: Academic Italian", description: "Understand academic and journalistic Italian", category: "reading", level: "C1", duration: 18, xp: 55, order: 4, culturalHint: "Academic Italian: 'Per quanto riguarda...' (Regarding...), 'Si evince che...' (It is evident that...), 'In virtù di...' (By virtue of...). Read about Italian art history, political philosophy, or il dibattito sulla lingua (the ongoing debate about Italian language purity vs evolution)." },
        { id: "it_c1_u1_l5", title: "Write a Critical Essay", description: "Compose an analytical essay in Italian", category: "writing", level: "C1", duration: 20, xp: 65, order: 5, culturalHint: "Write a critical essay about Italian society: il fenomeno dell'emigrazione giovanile (brain drain), la questione meridionale (North-South divide), il patrimonio culturale (cultural heritage preservation). Use: 'Si potrebbe argomentare che...', 'È innegabile che...', 'In definitiva...'" },
      ],
    },
    {
      id: "it_c2_u1", title: "Maestria Totale", level: "C2", order: 9,
      description: "Complete mastery of Italian language and culture",
      lessons: [
        { id: "it_c2_u1_l1", title: "Cultural Mastery", description: "Every layer of Italian communication", category: "vocabulary", level: "C2", duration: 18, xp: 60, order: 1, culturalHint: "Master Italian cultural codes: la bella figura (always look good), il dolce far niente (the sweetness of doing nothing), l'arte di arrangiarsi (the art of getting by), il familismo (family above all). Understand why Italians talk with their hands, why lunch is 2 hours, and why il caffè is a philosophy." },
        { id: "it_c2_u1_l2", title: "Stylistic Grammar", description: "Use grammar for literary and rhetorical effect", category: "grammar", level: "C2", duration: 20, xp: 70, order: 2, culturalHint: "Stylistic Italian: master the passato remoto (literary past — 'Dante scrisse la Commedia'), il trapassato remoto, and literary constructions. Read Calvino's crystalline prose, Ferrante's raw Neapolitan voice, and Eco's erudite complexity. Italian prose style = music." },
        { id: "it_c2_u1_l3", title: "Impromptu Eloquence", description: "Speak with native Italian eloquence on any topic", category: "speaking", level: "C2", duration: 15, xp: 65, order: 3, culturalHint: "Speak like an Italian intellectual: use literary references naturally (Dante, Manzoni, Leopardi), employ irony and understatement, master the art of la conversazione (conversation as art form). Italian talk shows, university lectures, and political debates are your models." },
        { id: "it_c2_u1_l4", title: "Reading: Satire & Irony", description: "Detect humor and social commentary in Italian media", category: "reading", level: "C2", duration: 18, xp: 60, order: 4, culturalHint: "Italian satire: la commedia dell'arte tradition lives on in modern comedy (Checco Zalone, Corrado Guzzanti). Political satire: Blob (RAI), Le Iene. Understand: l'ironia, il sarcasmo, la parodia, la critica sociale. Italian humor is often self-deprecating about bureaucracy and politics." },
        { id: "it_c2_u1_l5", title: "Creative Writing", description: "Write a short story with native Italian style", category: "writing", level: "C2", duration: 25, xp: 75, order: 5, culturalHint: "Write a short story set in Italy: capture the musicality of Italian prose, use regional flavor (Roma, Napoli, Sicilia each have distinct voices), weave in cultural themes: la famiglia, il cibo, la bellezza, il passato vs il presente. Make the reader taste, smell, and feel Italy." },
      ],
    },
  ],
};


// ═══════════════════════════════════════════════════════════════════════════════
// GERMAN
// ═══════════════════════════════════════════════════════════════════════════════
export const GERMAN: LanguageCurriculum = {
  code: "de",
  name: "German",
  flag: "🇩🇪",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 90,
  units: [
    {
      id: "de_a1_u1", title: "Hallo! — First Steps", level: "A1", order: 1,
      description: "German greetings, introductions, and essential phrases",
      lessons: [
        { id: "de_a1_u1_l1", title: "Greetings German Style", description: "Hallo, Guten Tag, Tschüss — how Germans greet", category: "vocabulary", level: "A1", duration: 5, xp: 20, order: 1, culturalHint: "German greetings vary by region: 'Guten Tag' (standard), 'Moin' (North), 'Grüß Gott' (Bavaria/Austria), 'Servus' (informal South). Germans shake hands firmly when meeting. Use 'Sie' (formal you) with strangers — switching to 'du' is a big moment in a relationship!" },
        { id: "de_a1_u1_l2", title: "Introducing Yourself", description: "Ich heiße... — name, origin, and occupation", category: "speaking", level: "A1", duration: 8, xp: 25, order: 2, culturalHint: "German introductions are direct: 'Ich heiße Thomas, ich komme aus Berlin, ich bin Ingenieur' (I'm Thomas, from Berlin, I'm an engineer). Germans value Pünktlichkeit (punctuality) — being 5 minutes late is rude. Learn: Freut mich (Pleased to meet you), Woher kommen Sie?" },
        { id: "de_a1_u1_l3", title: "Sein & Haben", description: "The two essential verbs: to be and to have", category: "grammar", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "German has THREE genders: der (masculine), die (feminine), das (neuter) — and you must memorize each noun's gender! 'Der Tisch' (table), 'die Lampe' (lamp), 'das Buch' (book). Tip: learn the article WITH the noun. Practice: 'Ich bin müde' (I'm tired), 'Ich habe Hunger' (I'm hungry)." },
        { id: "de_a1_u1_l4", title: "Numbers & Money", description: "Counting euros and understanding German prices", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 4, culturalHint: "German numbers: 21 = einundzwanzig (one-and-twenty — reversed!). Germany is still a cash society — many restaurants don't accept cards! Learn: 'Was kostet das?' (How much?), 'Die Rechnung, bitte' (The bill, please). Tip: Germans split bills exactly (kein Trinkgeld = no mandatory tip, but 5-10% is nice)." },
        { id: "de_a1_u1_l5", title: "At the Bäckerei", description: "Understand a conversation at a German bakery", category: "listening", level: "A1", duration: 6, xp: 25, order: 5, culturalHint: "Die Bäckerei (bakery) — Germans eat bread (Brot) with EVERY meal. Over 3,000 types! Learn: das Brötchen (roll), das Vollkornbrot (whole grain), die Brezel (pretzel), der Kuchen (cake). The baker says 'Was darf es sein?' (What can I get you?). Sunday Frühstück with fresh Brötchen is sacred." },
      ],
    },
    {
      id: "de_a1_u2", title: "Familie & Alltag — Family & Daily Life", level: "A1", order: 2,
      description: "German family, home life, and daily routines",
      lessons: [
        { id: "de_a1_u2_l1", title: "Meine Familie", description: "Family terms and German family culture", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1, culturalHint: "German family (die Familie): more nuclear than Mediterranean cultures. Children often move out at 18. Learn: die Mutter, der Vater, der Bruder, die Schwester, die Großeltern (grandparents). 'Kindergarten' is a German word the world borrowed! Germans value Selbstständigkeit (independence) from a young age." },
        { id: "de_a1_u2_l2", title: "Present Tense — German Verbs", description: "Regular verb conjugation and word order", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2, culturalHint: "German word order: verb ALWAYS in position 2! 'Ich spiele Fußball' (I play football), but 'Am Montag spiele ich Fußball' (On Monday play I football). Practice with daily life: 'Ich trinke Kaffee' (I drink coffee), 'Wir gehen spazieren' (We go for a walk)." },
        { id: "de_a1_u2_l3", title: "Mein Tag", description: "Describe your daily routine German-style", category: "writing", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Write about a German daily routine: Frühstück (breakfast — Brötchen, Aufschnitt, Müsli), Mittagessen (lunch — warm meal), Kaffee und Kuchen (afternoon coffee and cake at 3pm — a tradition!), Abendessen (dinner — often cold: Brot, Käse, Wurst). Germans eat dinner early (6-7pm)." },
        { id: "de_a1_u2_l4", title: "Die Wohnung", description: "Rooms, furniture, and German home life", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "German homes: die Küche (kitchen), das Wohnzimmer (living room), das Schlafzimmer (bedroom), der Keller (basement — every German house has one, often with a Hobbyraum). Learn: Hausschuhe (house slippers — ALWAYS remove shoes!), lüften (airing out rooms — Germans do this daily, even in winter!)." },
        { id: "de_a1_u2_l5", title: "Reading: An Email", description: "Understand a simple German email", category: "reading", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "German emails: formal = 'Sehr geehrte/r Frau/Herr...' + 'Mit freundlichen Grüßen' (With kind regards). Informal = 'Liebe/r...' + 'Viele Grüße' (Many greetings). Germans write LONG, detailed emails. Read an email about planning a Grillparty (BBQ — Germans love grilling!)." },
      ],
    },
    {
      id: "de_a2_u1", title: "Unterwegs — Getting Around", level: "A2", order: 3,
      description: "Navigating German cities, transportation, and directions",
      lessons: [
        { id: "de_a2_u1_l1", title: "Asking for Directions", description: "Navigate German cities with confidence", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "German directions: 'Gehen Sie geradeaus' (Go straight), 'Biegen Sie links/rechts ab' (Turn left/right), 'An der Ampel' (At the traffic light). Germans follow traffic rules strictly — jaywalking is frowned upon! Landmarks: der Bahnhof, der Marktplatz, das Rathaus (town hall)." },
        { id: "de_a2_u1_l2", title: "Past Tense — Perfekt", description: "Talk about what you did using haben/sein + Partizip", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2, culturalHint: "German Perfekt: 'Ich habe Bier getrunken' (I drank beer), 'Ich bin nach München gefahren' (I went to Munich). Movement verbs use 'sein'! Tell about German experiences: 'Wir haben das Oktoberfest besucht und haben Brezeln gegessen' (We visited Oktoberfest and ate pretzels)." },
        { id: "de_a2_u1_l3", title: "German Transportation", description: "U-Bahn, S-Bahn, ICE vocabulary", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "German transport (famously efficient!): die U-Bahn (subway), die S-Bahn (city rail), der ICE (high-speed train — 300km/h!), die Straßenbahn (tram). Deutsche Bahn motto: 'Pünktlich wie die Deutsche Bahn' (ironic — delays are common!). Learn: der Fahrplan (schedule), die Fahrkarte (ticket), umsteigen (transfer)." },
        { id: "de_a2_u1_l4", title: "Reading: A City Guide", description: "Follow a guide to German landmarks", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "German cities: Berlin (das Brandenburger Tor, die Mauer), München (der Marienplatz, das Hofbräuhaus), Hamburg (der Hafen, die Reeperbahn), Köln (der Dom, der Karneval). Each city has its own Dialekt, Bier, and character. 'Stadtführung' (city tour) is a great way to learn!" },
        { id: "de_a2_u1_l5", title: "Write About Your City", description: "Describe where you live in German", category: "writing", level: "A2", duration: 12, xp: 35, order: 5, culturalHint: "Describe a German neighborhood: 'In meiner Stadt gibt es einen schönen Park, viele Cafés und einen Wochenmarkt' (In my city there's a nice park, many cafés, and a weekly market). Include: die Bibliothek, das Schwimmbad, der Biergarten (beer garden — outdoor seating under chestnut trees!)." },
      ],
    },
    {
      id: "de_a2_u2", title: "Essen & Trinken — Food & Drink", level: "A2", order: 4,
      description: "German cuisine, ordering food, and Biergarten culture",
      lessons: [
        { id: "de_a2_u2_l1", title: "German Food Vocabulary", description: "Bratwurst, Schnitzel, Sauerkraut — essential dishes", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1, culturalHint: "German food: die Bratwurst (grilled sausage), das Schnitzel (breaded cutlet), das Sauerkraut (fermented cabbage), die Kartoffel (potato — in 100 forms!), der Döner Kebab (Germany's #1 fast food, brought by Turkish immigrants). Each region has specialties: Weißwurst (Bavaria), Currywurst (Berlin), Maultaschen (Swabia)." },
        { id: "de_a2_u2_l2", title: "Ordering at a Biergarten", description: "How to order food and beer in Germany", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "At a Biergarten: 'Ein Maß Bier, bitte!' (A liter of beer, please — yes, a LITER!). Germans say 'Prost!' (Cheers!) and make eye contact while clinking glasses — not doing so = 7 years bad luck! Order: 'Ich hätte gerne eine Brezel und ein Weißbier' (I'd like a pretzel and wheat beer)." },
        { id: "de_a2_u2_l3", title: "Modal Verbs", description: "Can, must, want — expressing ability and obligation", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3, culturalHint: "German modal verbs: können (can), müssen (must), wollen (want), sollen (should), dürfen (may/allowed). Practice with food: 'Ich möchte bestellen' (I'd like to order), 'Darf ich die Karte sehen?' (May I see the menu?), 'Man muss das Reinheitsgebot kennen!' (You must know the Beer Purity Law — from 1516!)." },
        { id: "de_a2_u2_l4", title: "Reading: A Recipe", description: "Follow a German recipe for Apfelstrudel", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Apfelstrudel recipe: der Strudelteig (strudel dough — stretched paper-thin!), die Äpfel, der Zucker, der Zimt (cinnamon), die Rosinen, das Paniermehl. 'Den Teig dünn ausrollen und mit Äpfeln füllen...' Serve with Vanillesoße or a Kugel Eis (scoop of ice cream)." },
        { id: "de_a2_u2_l5", title: "Listening: At the Wochenmarkt", description: "Understand vendors at the weekly market", category: "listening", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "At the Wochenmarkt (weekly market): every German town has one, usually Saturday morning. Fresh: Obst (fruit), Gemüse (vegetables), Käse (cheese), Brot, Blumen (flowers). The vendor says 'Darf's noch etwas sein?' (Anything else?). Learn: 'Ein Pfund Tomaten, bitte' (A pound of tomatoes, please)." },
      ],
    },
    {
      id: "de_b1_u1", title: "Kultur & Gesellschaft", level: "B1", order: 5,
      description: "German culture, traditions, and social life",
      lessons: [
        { id: "de_b1_u1_l1", title: "Feste & Traditionen", description: "Oktoberfest, Weihnachten, Karneval — German celebrations", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "German festivals: das Oktoberfest (Munich, 6 million visitors, Lederhosen & Dirndl), der Karneval/Fasching (Cologne, Mainz — costumes, parades, 'Alaaf!' and 'Helau!'), Weihnachten (Christmas — Adventskranz, Weihnachtsmarkt, Glühwein, Lebkuchen, der Christkind). Germans take holidays SERIOUSLY." },
        { id: "de_b1_u1_l2", title: "Konjunktiv II", description: "Expressing wishes, hypotheticals, and polite requests", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2, culturalHint: "Konjunktiv II (subjunctive): 'Wenn ich reich wäre, würde ich ein Schloss kaufen' (If I were rich, I'd buy a castle). 'Ich hätte gerne...' (I would like...) — the polite way to order anything. Germans use Konjunktiv II constantly for politeness. Master: wäre, hätte, könnte, würde." },
        { id: "de_b1_u1_l3", title: "Discussing German Values", description: "Talk about Ordnung, Pünktlichkeit, and Umweltschutz", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3, culturalHint: "German values: Ordnung (order — everything has rules), Pünktlichkeit (punctuality — 5 min early = on time), Umweltschutz (environmental protection — Mülltrennung/recycling is law!), Direktheit (directness — Germans say what they mean). Discuss: 'Finden Sie, dass Deutsche zu direkt sind?'" },
        { id: "de_b1_u1_l4", title: "Reading: News Article", description: "Understand a German news story", category: "reading", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "German news: Der Spiegel, Die Zeit, Süddeutsche Zeitung, Tagesschau (TV). Topics: die Energiewende (energy transition), die Wiedervereinigung (reunification legacy), die EU-Politik. Read about the Weihnachtsmarkt tradition — over 2,500 Christmas markets across Germany!" },
        { id: "de_b1_u1_l5", title: "Write an Opinion", description: "Express your views on German culture", category: "writing", level: "B1", duration: 15, xp: 40, order: 5, culturalHint: "Write about German cultural debates: Is Mülltrennung (waste separation) too complicated? Should shops open on Sundays? (Sonntagsruhe = Sunday rest is law!). Is German Direktheit rude or refreshing? Use: 'Meiner Meinung nach...', 'Einerseits... andererseits...', 'Zusammenfassend...'" },
      ],
    },
    {
      id: "de_b1_u2", title: "Berufsleben — Professional Life", level: "B1", order: 6,
      description: "German workplace culture and business communication",
      lessons: [
        { id: "de_b1_u2_l1", title: "Office Vocabulary", description: "Professional terms and German work culture", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1, culturalHint: "German workplace: strict hierarchy but flat communication. Titles matter — 'Herr Doktor Müller' (if they have a PhD, USE IT!). Learn: der Feierabend (end of workday — sacred!), die Mittagspause, der Betriebsrat (works council), die Gleitzeit (flextime). Germans get 30 days vacation + sick leave. Work-life balance is real." },
        { id: "de_b1_u2_l2", title: "Passive Voice", description: "Formal German with werden + Partizip II", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2, culturalHint: "German passive (Passiv): 'Das Bier wird nach dem Reinheitsgebot gebraut' (The beer is brewed according to the Purity Law). Very common in business/academic German. Practice: 'Die E-Mail wurde gesendet' (The email was sent), 'Es wird gebeten...' (It is requested that...)." },
        { id: "de_b1_u2_l3", title: "Job Interview Practice", description: "Role-play a German Vorstellungsgespräch", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3, culturalHint: "German job interviews: be punctual (arrive 5 min early), bring paper copies of everything, use 'Sie'. 'Erzählen Sie etwas über sich' (Tell me about yourself). Germans value: Qualifikationen (qualifications), Berufserfahrung (work experience), and Zuverlässigkeit (reliability). No small talk — straight to business!" },
        { id: "de_b1_u2_l4", title: "Reading: Job Posting", description: "Understand a German Stellenanzeige", category: "reading", level: "B1", duration: 10, xp: 30, order: 4, culturalHint: "German job ads on StepStone, Indeed, or Xing: 'Wir suchen...' (We're looking for...), 'Ihre Aufgaben' (Your tasks), 'Ihr Profil' (Your profile), 'Wir bieten' (We offer). German CVs include a photo (Bewerbungsfoto) and are extremely detailed — Lebenslauf (CV) is a formal document." },
        { id: "de_b1_u2_l5", title: "Write a Bewerbung", description: "Compose a German job application", category: "writing", level: "B1", duration: 15, xp: 45, order: 5, culturalHint: "German Bewerbung (application): Anschreiben (cover letter) + Lebenslauf (CV) + Zeugnisse (certificates/references). Start: 'Sehr geehrte Damen und Herren' (Dear Ladies and Gentlemen). End: 'Über eine Einladung zu einem persönlichen Gespräch würde ich mich sehr freuen' (I would be very pleased to receive an interview invitation). VERY formal!" },
      ],
    },
    {
      id: "de_b2_u1", title: "Fortgeschrittener Ausdruck", level: "B2", order: 7,
      description: "Advanced German idioms, humor, and nuanced communication",
      lessons: [
        { id: "de_b2_u1_l1", title: "Redewendungen & Sprichwörter", description: "German idioms and their cultural meanings", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1, culturalHint: "German idioms: 'Da steppt der Bär!' (The bear is dancing! = It's a great party), 'Ich verstehe nur Bahnhof' (I only understand train station = I don't understand anything), 'Das ist nicht mein Bier' (That's not my beer = not my problem), 'Schwein haben' (To have pig = to be lucky)." },
        { id: "de_b2_u1_l2", title: "Complex Sentence Structure", description: "Nebensätze, relative clauses, and German word order", category: "grammar", level: "B2", duration: 15, xp: 50, order: 2, culturalHint: "German sentence structure gets complex: Nebensätze (subordinate clauses) push the verb to the END. 'Ich weiß, dass du Deutsch lernst, weil du nach Deutschland reisen willst' (I know that you learn German because you want to travel to Germany). Mark Twain wrote an essay called 'The Awful German Language' about this!" },
        { id: "de_b2_u1_l3", title: "German Humor & Irony", description: "Understand German comedy and dry wit", category: "speaking", level: "B2", duration: 15, xp: 50, order: 3, culturalHint: "German humor exists! (despite the stereotype): trockener Humor (dry humor), Schadenfreude (pleasure from others' misfortune — a German invention!), Wortspiele (wordplay). Comedians: Loriot (legendary), Hape Kerkeling, Jan Böhmermann (political satire). Germans laugh AT rules and bureaucracy." },
        { id: "de_b2_u1_l4", title: "Reading: German Literature", description: "Analyze a passage from a German author", category: "reading", level: "B2", duration: 15, xp: 45, order: 4, culturalHint: "German literature: Goethe (Faust — the German Shakespeare), Kafka (Die Verwandlung — surreal Prague German), Thomas Mann (Buddenbrooks), Hermann Hesse (Siddhartha), Herta Müller (Nobel Prize). German compound words in literature can be 50+ letters long — Donaudampfschifffahrtsgesellschaft!" },
        { id: "de_b2_u1_l5", title: "Write a Personal Essay", description: "Express complex ideas about German identity", category: "writing", level: "B2", duration: 18, xp: 55, order: 5, culturalHint: "Write about German identity: Vergangenheitsbewältigung (coming to terms with the past), die Wiedervereinigung (reunification — Ossi vs Wessi), Willkommenskultur (welcome culture for refugees), and what 'deutsch sein' means today. Germany's relationship with its history is unique and complex." },
      ],
    },
    {
      id: "de_c1_u1", title: "Sprachbeherrschung", level: "C1", order: 8,
      description: "Near-native German communication and cultural depth",
      lessons: [
        { id: "de_c1_u1_l1", title: "Register & Dialekte", description: "Formal, informal, and dialectal German", category: "vocabulary", level: "C1", duration: 15, xp: 50, order: 1, culturalHint: "German registers: Hochdeutsch (standard), Umgangssprache (colloquial), Dialekte (Bayerisch, Schwäbisch, Sächsisch, Plattdeutsch — sometimes unintelligible to each other!). A Bavarian says 'Grüß Gott' and 'Servus', a Berliner says 'Ick' instead of 'Ich'. Code-switching between Hochdeutsch and dialect is a social skill." },
        { id: "de_c1_u1_l2", title: "Rhetorical German", description: "Persuasion and academic argumentation", category: "grammar", level: "C1", duration: 18, xp: 60, order: 2, culturalHint: "German academic style: long, complex sentences with multiple Nebensätze, Nominalisierung (turning verbs into nouns — 'die Durchführung' instead of 'durchführen'), and Passiv everywhere. Master: 'Es lässt sich argumentieren, dass...', 'Daraus ergibt sich...', 'Zusammenfassend lässt sich feststellen...'" },
        { id: "de_c1_u1_l3", title: "Debate & Argumentation", description: "Argue and negotiate in formal German", category: "speaking", level: "C1", duration: 15, xp: 55, order: 3, culturalHint: "German debate culture: logical, structured, evidence-based. 'Meines Erachtens...', 'Dem möchte ich entgegenhalten...', 'Das greift zu kurz, weil...' Germans respect well-constructed arguments over emotional appeals. Master Sachlichkeit (objectivity) — the highest German intellectual virtue." },
        { id: "de_c1_u1_l4", title: "Reading: Academic German", description: "Understand academic papers and Wissenschaftssprache", category: "reading", level: "C1", duration: 18, xp: 55, order: 4, culturalHint: "Academic German (Wissenschaftssprache): 'Im Folgenden wird dargelegt...', 'Unter Berücksichtigung von...', 'Es sei darauf hingewiesen, dass...' Read about German philosophy (Kant, Hegel, Nietzsche, Heidegger) or engineering (Industrie 4.0, die Energiewende). German academic writing is notoriously dense." },
        { id: "de_c1_u1_l5", title: "Write a Research Paper", description: "Compose an academic text in German", category: "writing", level: "C1", duration: 20, xp: 65, order: 5, culturalHint: "Write a Seminararbeit (seminar paper): Einleitung (introduction with Fragestellung/research question), Hauptteil (body with Argumentation), Fazit (conclusion). Use: 'Die vorliegende Arbeit untersucht...', 'Wie bereits erwähnt...', 'Abschließend lässt sich konstatieren...' German academic writing values thoroughness above all." },
      ],
    },
    {
      id: "de_c2_u1", title: "Perfektes Deutsch", level: "C2", order: 9,
      description: "Complete mastery of German language and culture",
      lessons: [
        { id: "de_c2_u1_l1", title: "Cultural Deep Dive", description: "Every layer of German communication", category: "vocabulary", level: "C2", duration: 18, xp: 60, order: 1, culturalHint: "Master German cultural codes: Ordnung muss sein (There must be order), Gemütlichkeit (cozy togetherness), Wanderlust (desire to travel — another German gift to English), Feierabend (sacred end of workday), Vereinsleben (club life — Germans join Vereine for everything). Understand why Germans love rules, forests, and bread." },
        { id: "de_c2_u1_l2", title: "Stylistic Mastery", description: "Use grammar for literary and rhetorical effect", category: "grammar", level: "C2", duration: 20, xp: 70, order: 2, culturalHint: "Stylistic German: master Konjunktiv I (reported speech in journalism), literary Präteritum, and the art of the German compound word (Zusammensetzung). Read Kafka's precise, nightmarish prose, Thomas Mann's endless sentences, and Hesse's philosophical clarity. German prose can be both brutally efficient and endlessly complex." },
        { id: "de_c2_u1_l3", title: "Impromptu Speech", description: "Speak fluently on any topic in German", category: "speaking", level: "C2", duration: 15, xp: 65, order: 3, culturalHint: "Speak like a German intellectual: use Fremdwörter (foreign words adopted into German) naturally, employ irony and understatement, master the art of the Diskussion (discussion). German talk shows (Markus Lanz, Anne Will), university Vorlesungen, and Bundestag debates are your models." },
        { id: "de_c2_u1_l4", title: "Reading: Satire & Kabarett", description: "Detect humor and social criticism in German media", category: "reading", level: "C2", duration: 18, xp: 60, order: 4, culturalHint: "German satire: Kabarett (political cabaret — a German art form), Der Postillon (German Onion), heute-show (German Daily Show). Understand: politische Satire, Gesellschaftskritik, schwarzer Humor. German humor targets bureaucracy (Bürokratie), rules (Vorschriften), and German stereotypes themselves." },
        { id: "de_c2_u1_l5", title: "Creative Writing", description: "Write a short story with native German style", category: "writing", level: "C2", duration: 25, xp: 75, order: 5, culturalHint: "Write a short story set in Germany: capture the precision of German prose, use compound words creatively, weave in cultural themes: Heimat (homeland/belonging), Fernweh (longing for distant places), Zeitgeist (spirit of the times), Vergangenheitsbewältigung (confronting the past). Make the reader feel German Gemütlichkeit." },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// CURRICULUM REGISTRY — Maps language codes to their curricula
// ═══════════════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════
// SPANISH DIALECT CURRICULA (Generated)
// ═══════════════════════════════════════════════════════════════════

export const SPANISH_COLOMBIAN: LanguageCurriculum = {
  code: "es-CO",
  name: "Colombian Spanish",
  flag: "🇨🇴",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 90,
  units: [
    {
      id: "esco_a1_u1", title: "¡¿Quiubo! — First Steps", level: "A1", order: 1,
      description: "undefined greetings, pronunciation, and essential survival phrases",
      lessons: [
        { id: "esco_a1_u1_l1", title: "Sounds & Pronunciation", description: "How undefined sounds different — dropped letters, unique rhythm", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "undefined pronunciation: listen to how people in Bogotá speak vs. textbook Spanish. Local greetings: ¿Quiubo, parce?, ¡Qué más, hermano!, ¿Bien o qué?. The rhythm and melody of undefined is unique — practice mimicking the intonation." },
        { id: "esco_a1_u1_l2", title: "Essential Greetings", description: "Say hello, goodbye, and 'how are you' the undefined way", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in undefined: ¿Quiubo, parce?, ¡Qué más, hermano!, ¿Bien o qué?. These are what REAL people say — not the textbook '¿Cómo está usted?' Learn when to use each one (friends vs. elders vs. strangers)." },
        { id: "esco_a1_u1_l3", title: "Survival Slang", description: "The 10 words you NEED on day one in Bogotá", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Essential slang: parce/parcero (buddy), bacano (cool), chimba (awesome), gonorrea (expression of surprise), marica (dude, informal). These words are used DAILY — you'll hear them in every conversation. Without these, you'll sound like a textbook, not a real speaker." },
        { id: "esco_a1_u1_l4", title: "Numbers & Money", description: "Count, pay, and understand prices at local shops", category: "grammar", level: "A1", duration: 7, xp: 20, order: 4, culturalHint: "Money talk: learn how locals discuss prices. At a Cartagena market, you'll hear slang for money. Practice: '¿Cuánto cuesta?' and local variations. Food prices for bandeja paisa and arepas." },
        { id: "esco_a1_u1_l5", title: "At the Local Spot", description: "Order food and drinks like a local in Bogotá", category: "listening", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "At a local restaurant/food stand: order bandeja paisa, arepas, and sancocho. Listen to how the server speaks — fast, with local slang. Practice: 'Dame un/una...' and 'Quiero probar el/la...'" },
      ],
    },
    {
      id: "esco_a1_u2", title: "La Familia — Family & Home", level: "A1", order: 2,
      description: "Family life, home vocabulary, and daily routines in undefined culture",
      lessons: [
        { id: "esco_a1_u2_l1", title: "Family Terms", description: "How families work in undefined culture — roles, respect, closeness", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1, culturalHint: "Family in undefined culture is EVERYTHING. Extended family lives close together. Learn: abuela/abuelo, tío/tía, primo/prima, compadre/comadre. Family gatherings involve bandeja paisa and cumbia. tinto every morning is a family ritual." },
        { id: "esco_a1_u2_l2", title: "Present Tense — Daily Life", description: "Describe your daily routine using local expressions", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2, culturalHint: "Daily life in Bogotá: 'Me levanto temprano', 'Desayuno arepas', 'Voy al trabajo'. Local twist: people say 'parce/parcero (buddy)' when greeting coworkers. The rhythm of daily life includes tinto every morning." },
        { id: "esco_a1_u2_l3", title: "My Neighborhood", description: "Describe where you live — local landmarks and shops", category: "writing", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Describe a Bogotá neighborhood: la bodega/tienda, la panadería, el parque. Include local spots where people eat empanadas and dance cumbia. Use: 'En mi barrio hay...', 'Cerca de mi casa está...'" },
        { id: "esco_a1_u2_l4", title: "Home & Living", description: "Rooms, furniture, and how homes look in undefined", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Homes in Bogotá vs Medellín: learn local terms for rooms and furniture. Many families have a patio/balcón where they gather. Music (cumbia, salsa caleña) plays from the kitchen while cooking bandeja paisa." },
        { id: "esco_a1_u2_l5", title: "Reading: A Text Message", description: "Understand informal texts with local slang and abbreviations", category: "reading", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "Read a WhatsApp chat between friends planning to meet up. Slang: gonorrea (expression of surprise), marica (dude, informal), tinto (black coffee), rumba (party). Abbreviations and emojis used locally. The conversation is about going to eat lechona and maybe dancing salsa caleña." },
      ],
    },
    {
      id: "esco_a2_u3", title: "Moviéndose — Getting Around", level: "A2", order: 3,
      description: "Transportation, directions, and navigating Bogotá",
      lessons: [
        { id: "esco_a2_u3_l1", title: "Directions & Navigation", description: "Ask for and give directions in Bogotá", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate Bogotá: 'Disculpe, ¿cómo llego a...?', '¿Dónde queda...?' Local landmarks: learn the names of famous streets, plazas, and neighborhoods. Locals give directions using landmarks, not street numbers." },
        { id: "esco_a2_u3_l2", title: "Past Tense — What Happened", description: "Tell stories about what you did using local expressions", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2, culturalHint: "Tell stories the undefined way: 'Ayer fui a Medellín', 'Comí bandeja paisa increíble', 'Bailé cumbia toda la noche'. Use local filler words and expressions. El que madruga, Dios le ayuda — learn this proverb in context." },
        { id: "esco_a2_u3_l3", title: "Local Transportation", description: "Buses, taxis, and getting around like a local", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Transportation in Bogotá: learn local names for bus, taxi, rideshare. How to hail a cab, negotiate fares, and understand route names. In undefined, the bus might be called differently than in textbook Spanish." },
        { id: "esco_a2_u3_l4", title: "Reading: A Travel Blog", description: "Follow a traveler's story through Bogotá, Medellín, Cali, Cartagena, Barranquilla", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Read about a trip through Bogotá, Medellín, and Cali. The blogger tries bandeja paisa, dances cumbia, and learns local slang. Vocabulary: hotel, aeropuerto, maleta, pasaporte, aventura." },
        { id: "esco_a2_u3_l5", title: "Write About Your Trip", description: "Describe a real or imaginary trip to undefined", category: "writing", level: "A2", duration: 12, xp: 35, order: 5, culturalHint: "Write about visiting Bogotá: what you ate (bandeja paisa, arepas, sancocho), what you saw, who you met. Use past tense and local expressions. Mention sobremesa (long after-meal chat) and how it felt to experience undefined culture firsthand." },
      ],
    },
    {
      id: "esco_a2_u4", title: "La Comida — Food & Drink", level: "A2", order: 4,
      description: "undefined cuisine, ordering, cooking vocabulary, and food culture",
      lessons: [
        { id: "esco_a2_u4_l1", title: "Food Vocabulary", description: "Essential dishes: bandeja paisa, arepas, sancocho, empanadas", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1, culturalHint: "undefined food: bandeja paisa, arepas, sancocho, empanadas, lechona, ajiaco. Food is central to undefined culture — every gathering revolves around eating together. Learn the ingredients, how dishes are prepared, and when they're eaten (breakfast vs. lunch vs. dinner)." },
        { id: "esco_a2_u4_l2", title: "Ordering Food", description: "Order at a restaurant, street food stand, or market", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "At a Bogotá restaurant: 'Me da un/una bandeja paisa', '¿Qué me recomienda?', 'La cuenta, por favor'. Street food: point and say '¡Deme uno de esos!' Learn local tipping customs and how to compliment the food." },
        { id: "esco_a2_u4_l3", title: "Comparisons & Opinions", description: "Compare foods and express preferences using local phrases", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3, culturalHint: "Compare: 'bandeja paisa es mejor que...', 'arepas es más rico que...'. Express opinions the local way: '¡Está bacano!' Learn food adjectives: picante, dulce, salado, crujiente." },
        { id: "esco_a2_u4_l4", title: "Reading: A Recipe", description: "Follow a traditional recipe for bandeja paisa", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Recipe for bandeja paisa — the national dish. Ingredients, steps, and cooking tips passed down through generations. Learn kitchen vocabulary: picar, freír, hervir, mezclar, sazonar. Every family has their own secret version." },
        { id: "esco_a2_u4_l5", title: "Listening: At the Market", description: "Understand vendors at a local market in Bogotá", category: "listening", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "At the market in Bogotá: vendors shout prices, offer samples, and negotiate. Listen for: '¡Lleve, lleve!', '¿Qué va a llevar?', '¡Está fresco!' Buy ingredients for bandeja paisa: learn fruit, vegetable, and meat names." },
      ],
    },
    {
      id: "esco_b1_u5", title: "Cultura y Sociedad — Culture & Society", level: "B1", order: 5,
      description: "undefined traditions, holidays, music, and social dynamics",
      lessons: [
        { id: "esco_b1_u5_l1", title: "Music & Dance", description: "cumbia, salsa caleña, vallenato, champeta, mapale — rhythm, history, and vocabulary", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "undefined music: cumbia, salsa caleña, vallenato, champeta, mapale. Artists: Shakira, Carlos Vives, Juanes. Learn the vocabulary of music and dance: ritmo, compás, letra, estribillo, bailar, mover las caderas. cumbia originated in Medellín and represents undefined identity." },
        { id: "esco_b1_u5_l2", title: "Subjunctive Mood", description: "Express wishes, doubts, and emotions the undefined way", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2, culturalHint: "Subjunctive in real life: 'Ojalá que Carnaval de Barranquilla sea increíble este año', 'Quiero que pruebes bandeja paisa', 'Dudo que encuentres mejor arepas fuera de Bogotá'. The subjunctive is used MORE in spoken undefined than textbooks suggest." },
        { id: "esco_b1_u5_l3", title: "Holidays & Traditions", description: "Carnaval de Barranquilla, Feria de las Flores, Día de las Velitas, Festival Vallenato — how they're celebrated", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3, culturalHint: "Carnaval de Barranquilla: tinto every morning. sobremesa (long after-meal chat). novenas navideñas. During Feria de las Flores, families gather to eat ajiaco and dance cumbia. Learn celebration vocabulary: fiesta, desfile, disfraz, fuegos artificiales, tradición." },
        { id: "esco_b1_u5_l4", title: "Reading: Cultural Article", description: "Read about undefined society, values, and modern life", category: "reading", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Read about modern life in Bogotá: the balance between tradition and modernity. Topics: family values, work culture, social gatherings, tinto every morning. Proverb: 'El que madruga, Dios le ayuda' — discuss what it means in undefined culture." },
        { id: "esco_b1_u5_l5", title: "Write an Opinion", description: "Express your views on undefined culture and traditions", category: "writing", level: "B1", duration: 15, xp: 40, order: 5, culturalHint: "Write about what makes undefined culture unique: the food (bandeja paisa), the music (cumbia), the people, the traditions. Use opinion phrases: 'En mi opinión...', 'Creo que...', 'Lo que más me gusta es...'. Reference: 'No hay mal que por bien no venga'." },
      ],
    },
    {
      id: "esco_b1_u6", title: "Vida Profesional — Work & Business", level: "B1", order: 6,
      description: "Professional communication and workplace culture in undefined",
      lessons: [
        { id: "esco_b1_u6_l1", title: "Work Vocabulary", description: "Office terms, job titles, and professional phrases", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1, culturalHint: "Workplace in Bogotá: learn local terms for jobs, offices, and professional interactions. How colleagues greet each other (often with ¿Quiubo, parce? even at work!). Business culture: punctuality, dress code, hierarchy." },
        { id: "esco_b1_u6_l2", title: "Formal vs Informal", description: "When to use tú/usted and formal register in undefined", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2, culturalHint: "In undefined: when do you use 'usted' vs 'tú'? It varies by country! In Bogotá, the rules might surprise you. Learn formal email openings, professional phone calls, and how to address your boss vs. coworkers." },
        { id: "esco_b1_u6_l3", title: "Job Interview", description: "Practice a job interview in undefined style", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3, culturalHint: "Job interview in Bogotá: 'Cuénteme sobre usted', 'Mis fortalezas son...', '¿Cuál es el salario?'. Local customs: how to dress, arrive, greet the interviewer. In undefined culture, personal connections (networking) matter enormously." },
        { id: "esco_b1_u6_l4", title: "Reading: Job Posting", description: "Understand a job ad from a Bogotá company", category: "reading", level: "B1", duration: 10, xp: 30, order: 4, culturalHint: "Read a job posting from Bogotá: requisitos (requirements), experiencia (experience), beneficios (benefits), salario (salary). Local job platforms and how the hiring process works in undefined. Key industries in Bogotá." },
        { id: "esco_b1_u6_l5", title: "Write a Cover Letter", description: "Compose a professional letter for a undefined company", category: "writing", level: "B1", duration: 15, xp: 45, order: 5, culturalHint: "Write a cover letter for a job in Bogotá: formal greeting, why you're interested, your qualifications, closing. Use formal undefined: 'Estimado/a...', 'Me dirijo a usted...', 'Quedo a su disposición...'. Local business etiquette matters." },
      ],
    },
    {
      id: "esco_b2_u7", title: "Expresión Avanzada — Advanced Expression", level: "B2", order: 7,
      description: "Idioms, humor, slang mastery, and nuanced undefined communication",
      lessons: [
        { id: "esco_b2_u7_l1", title: "Idioms & Proverbs", description: "El que madruga, Dios le ayuda | No hay mal que por bien no venga | A caballo regalado no se le mira el colmillo", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1, culturalHint: "undefined proverbs: El que madruga, Dios le ayuda. No hay mal que por bien no venga. A caballo regalado no se le mira el colmillo. These are used in DAILY conversation — knowing them makes you sound fluent. Learn the context: when to use each one, what situation it fits, and how locals react when you use them correctly." },
        { id: "esco_b2_u7_l2", title: "Advanced Slang", description: "Deep slang that only locals know: tinto, rumba, guaro", category: "vocabulary", level: "B2", duration: 12, xp: 40, order: 2, culturalHint: "Advanced undefined slang: tinto (black coffee), rumba (party), guaro (aguardiente), chévere (great), berraco (tough/skilled). These are the words that make locals say 'wow, you really speak undefined!' Use them in context — wrong usage sounds worse than not knowing them." },
        { id: "esco_b2_u7_l3", title: "Conditional & Hypothetical", description: "'If I were in Bogotá...' — complex sentence structures", category: "grammar", level: "B2", duration: 15, xp: 45, order: 3, culturalHint: "Hypotheticals in undefined: 'Si pudiera vivir en Bogotá, comería bandeja paisa todos los días', 'Si hubiera ido a Carnaval de Barranquilla, habría bailado cumbia'. The conditional is used differently in undefined vs. textbook Spanish." },
        { id: "esco_b2_u7_l4", title: "Listening: Stand-Up Comedy", description: "Understand humor, wordplay, and cultural references", category: "listening", level: "B2", duration: 12, xp: 40, order: 4, culturalHint: "undefined humor: wordplay, cultural references, and timing. Comedians from Bogotá use local slang, accents, and cultural stereotypes. Understanding humor = understanding the culture. Listen for: double meanings, irony, and undefined-specific jokes." },
        { id: "esco_b2_u7_l5", title: "Write a Story", description: "Compose a short story set in Bogotá using advanced vocabulary", category: "writing", level: "B2", duration: 18, xp: 50, order: 5, culturalHint: "Write a short story set in Bogotá: a character navigates daily life, eats bandeja paisa, dances cumbia, uses slang (parce/parcero (buddy), bacano (cool)). Include a proverb: 'A caballo regalado no se le mira el colmillo'. Make it feel authentically undefined." },
      ],
    },
    {
      id: "esco_c1_u8", title: "Dominio Cultural — Cultural Mastery", level: "C1", order: 8,
      description: "Deep cultural fluency, literature, history, and sophisticated undefined",
      lessons: [
        { id: "esco_c1_u8_l1", title: "Literature & Arts", description: "undefined writers, poets, and artistic movements", category: "reading", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "undefined literature and arts: famous writers, poets, and artists from Bogotá. How undefined art reflects the culture — themes of identity, family, music (cumbia), and social issues. Read excerpts and discuss their cultural significance." },
        { id: "esco_c1_u8_l2", title: "Complex Grammar Mastery", description: "Subjunctive perfection, passive voice, and literary tenses", category: "grammar", level: "C1", duration: 18, xp: 50, order: 2, culturalHint: "Master the subjunctive in all its forms as used in undefined: 'Hubiera querido que...', 'Ojalá hubiera podido ir a Carnaval de Barranquilla'. Literary tenses used in undefined journalism and literature. The pluscuamperfecto del subjuntivo in real conversation." },
        { id: "esco_c1_u8_l3", title: "Debate & Persuasion", description: "Argue, persuade, and discuss complex topics", category: "speaking", level: "C1", duration: 15, xp: 45, order: 3, culturalHint: "Debate topics relevant to undefined: politics, economy, culture, emigration, tradition vs. modernity. Use sophisticated connectors: 'No obstante...', 'Sin embargo...', 'A pesar de que...'. Persuade someone to visit Bogotá and try bandeja paisa." },
        { id: "esco_c1_u8_l4", title: "Listening: Documentary", description: "Understand a documentary about undefined history and society", category: "listening", level: "C1", duration: 15, xp: 45, order: 4, culturalHint: "Watch/listen to a documentary about undefined: history, social movements, cultural evolution. How cumbia and Shakira shaped national identity. Advanced vocabulary: sociedad, identidad, patrimonio, herencia cultural, diáspora." },
        { id: "esco_c1_u8_l5", title: "Academic Writing", description: "Write an essay analyzing undefined cultural identity", category: "writing", level: "C1", duration: 20, xp: 55, order: 5, culturalHint: "Write an academic essay: 'La identidad cultural en el siglo XXI'. Analyze how cumbia, bandeja paisa, and tinto every morning define the culture. Use academic register with thesis, arguments, and conclusion." },
      ],
    },
    {
      id: "esco_c2_u9", title: "Fluidez Nativa — Native Fluency", level: "C2", order: 9,
      description: "Think, dream, and create in undefined at native level",
      lessons: [
        { id: "esco_c2_u9_l1", title: "Regional Micro-Dialects", description: "How Bogotá vs Medellín vs Cali differ", category: "listening", level: "C2", duration: 15, xp: 50, order: 1, culturalHint: "Micro-dialects within undefined: how people in Bogotá sound different from Medellín and Cali. Vocabulary differences, pronunciation shifts, and attitude changes. A native can tell which city you learned in by your accent." },
        { id: "esco_c2_u9_l2", title: "Creative Writing", description: "Write poetry or prose in authentic undefined voice", category: "writing", level: "C2", duration: 20, xp: 55, order: 2, culturalHint: "Write creatively in undefined: a poem about Bogotá, a short story about tinto every morning, or a song lyric in the style of Shakira. Use all the slang, proverbs, and cultural references you've learned. Make it sound like a native wrote it." },
        { id: "esco_c2_u9_l3", title: "Simultaneous Interpretation", description: "Real-time translation between English and undefined", category: "speaking", level: "C2", duration: 18, xp: 55, order: 3, culturalHint: "Practice simultaneous interpretation: listen to English and produce undefined in real-time, capturing not just meaning but cultural nuance. Translate idioms into equivalent undefined expressions, not literal translations. 'El que madruga, Dios le ayuda' has no direct English equivalent." },
        { id: "esco_c2_u9_l4", title: "Cultural Mediation", description: "Bridge cultural gaps between undefined and other cultures", category: "reading", level: "C2", duration: 15, xp: 50, order: 4, culturalHint: "Cultural mediation: explain undefined customs to outsiders and vice versa. Why is tinto every morning important? What does bandeja paisa represent beyond food? How do Carnaval de Barranquilla celebrations reflect national values? Navigate cross-cultural misunderstandings." },
        { id: "esco_c2_u9_l5", title: "Mastery Assessment", description: "Prove native-level fluency across all skills", category: "grammar", level: "C2", duration: 20, xp: 60, order: 5, culturalHint: "Final assessment: demonstrate mastery of undefined across reading, writing, speaking, and listening. Use advanced grammar, regional slang (parce/parcero, bacano, chimba), cultural references, and proverbs naturally. You should be indistinguishable from a native undefined speaker." },
      ],
    },
  ],
};

export const SPANISH_VENEZUELAN: LanguageCurriculum = {
  code: "es-VE",
  name: "Venezuelan Spanish",
  flag: "🇻🇪",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 90,
  units: [
    {
      id: "esve_a1_u1", title: "¡¿Qué más! — First Steps", level: "A1", order: 1,
      description: "undefined greetings, pronunciation, and essential survival phrases",
      lessons: [
        { id: "esve_a1_u1_l1", title: "Sounds & Pronunciation", description: "How undefined sounds different — dropped letters, unique rhythm", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "undefined pronunciation: listen to how people in Caracas speak vs. textbook Spanish. Local greetings: ¿Qué más, chamo?, ¡Épale!, ¿Cómo estás, pana?. The rhythm and melody of undefined is unique — practice mimicking the intonation." },
        { id: "esve_a1_u1_l2", title: "Essential Greetings", description: "Say hello, goodbye, and 'how are you' the undefined way", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in undefined: ¿Qué más, chamo?, ¡Épale!, ¿Cómo estás, pana?. These are what REAL people say — not the textbook '¿Cómo está usted?' Learn when to use each one (friends vs. elders vs. strangers)." },
        { id: "esve_a1_u1_l3", title: "Survival Slang", description: "The 10 words you NEED on day one in Caracas", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Essential slang: chamo/chama (dude/girl), pana (friend), chévere (cool), burda (a lot), ladilla (annoying). These words are used DAILY — you'll hear them in every conversation. Without these, you'll sound like a textbook, not a real speaker." },
        { id: "esve_a1_u1_l4", title: "Numbers & Money", description: "Count, pay, and understand prices at local shops", category: "grammar", level: "A1", duration: 7, xp: 20, order: 4, culturalHint: "Money talk: learn how locals discuss prices. At a Mérida market, you'll hear slang for money. Practice: '¿Cuánto cuesta?' and local variations. Food prices for arepa and pabellón criollo." },
        { id: "esve_a1_u1_l5", title: "At the Local Spot", description: "Order food and drinks like a local in Caracas", category: "listening", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "At a local restaurant/food stand: order arepa, pabellón criollo, and cachapa. Listen to how the server speaks — fast, with local slang. Practice: 'Dame un/una...' and 'Quiero probar el/la...'" },
      ],
    },
    {
      id: "esve_a1_u2", title: "La Familia — Family & Home", level: "A1", order: 2,
      description: "Family life, home vocabulary, and daily routines in undefined culture",
      lessons: [
        { id: "esve_a1_u2_l1", title: "Family Terms", description: "How families work in undefined culture — roles, respect, closeness", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1, culturalHint: "Family in undefined culture is EVERYTHING. Extended family lives close together. Learn: abuela/abuelo, tío/tía, primo/prima, compadre/comadre. Family gatherings involve arepa and joropo. hallacas at Christmas is a family ritual." },
        { id: "esve_a1_u2_l2", title: "Present Tense — Daily Life", description: "Describe your daily routine using local expressions", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2, culturalHint: "Daily life in Caracas: 'Me levanto temprano', 'Desayuno pabellón criollo', 'Voy al trabajo'. Local twist: people say 'chamo/chama (dude/girl)' when greeting coworkers. The rhythm of daily life includes hallacas at Christmas." },
        { id: "esve_a1_u2_l3", title: "My Neighborhood", description: "Describe where you live — local landmarks and shops", category: "writing", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Describe a Caracas neighborhood: la bodega/tienda, la panadería, el parque. Include local spots where people eat tequeños and dance joropo. Use: 'En mi barrio hay...', 'Cerca de mi casa está...'" },
        { id: "esve_a1_u2_l4", title: "Home & Living", description: "Rooms, furniture, and how homes look in undefined", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Homes in Caracas vs Maracaibo: learn local terms for rooms and furniture. Many families have a patio/balcón where they gather. Music (joropo, salsa) plays from the kitchen while cooking arepa." },
        { id: "esve_a1_u2_l5", title: "Reading: A Text Message", description: "Understand informal texts with local slang and abbreviations", category: "reading", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "Read a WhatsApp chat between friends planning to meet up. Slang: burda (a lot), ladilla (annoying), fino (great), arrecho (angry/awesome). Abbreviations and emojis used locally. The conversation is about going to eat hallacas and maybe dancing salsa." },
      ],
    },
    {
      id: "esve_a2_u3", title: "Moviéndose — Getting Around", level: "A2", order: 3,
      description: "Transportation, directions, and navigating Caracas",
      lessons: [
        { id: "esve_a2_u3_l1", title: "Directions & Navigation", description: "Ask for and give directions in Caracas", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate Caracas: 'Disculpe, ¿cómo llego a...?', '¿Dónde queda...?' Local landmarks: learn the names of famous streets, plazas, and neighborhoods. Locals give directions using landmarks, not street numbers." },
        { id: "esve_a2_u3_l2", title: "Past Tense — What Happened", description: "Tell stories about what you did using local expressions", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2, culturalHint: "Tell stories the undefined way: 'Ayer fui a Maracaibo', 'Comí arepa increíble', 'Bailé joropo toda la noche'. Use local filler words and expressions. El que no llora no mama — learn this proverb in context." },
        { id: "esve_a2_u3_l3", title: "Local Transportation", description: "Buses, taxis, and getting around like a local", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Transportation in Caracas: learn local names for bus, taxi, rideshare. How to hail a cab, negotiate fares, and understand route names. In undefined, the bus might be called differently than in textbook Spanish." },
        { id: "esve_a2_u3_l4", title: "Reading: A Travel Blog", description: "Follow a traveler's story through Caracas, Maracaibo, Valencia, Mérida, Margarita", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Read about a trip through Caracas, Maracaibo, and Valencia. The blogger tries arepa, dances joropo, and learns local slang. Vocabulary: hotel, aeropuerto, maleta, pasaporte, aventura." },
        { id: "esve_a2_u3_l5", title: "Write About Your Trip", description: "Describe a real or imaginary trip to undefined", category: "writing", level: "A2", duration: 12, xp: 35, order: 5, culturalHint: "Write about visiting Caracas: what you ate (arepa, pabellón criollo, cachapa), what you saw, who you met. Use past tense and local expressions. Mention pan de jamón and how it felt to experience undefined culture firsthand." },
      ],
    },
    {
      id: "esve_a2_u4", title: "La Comida — Food & Drink", level: "A2", order: 4,
      description: "undefined cuisine, ordering, cooking vocabulary, and food culture",
      lessons: [
        { id: "esve_a2_u4_l1", title: "Food Vocabulary", description: "Essential dishes: arepa, pabellón criollo, cachapa, tequeños", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1, culturalHint: "undefined food: arepa, pabellón criollo, cachapa, tequeños, hallacas, empanadas. Food is central to undefined culture — every gathering revolves around eating together. Learn the ingredients, how dishes are prepared, and when they're eaten (breakfast vs. lunch vs. dinner)." },
        { id: "esve_a2_u4_l2", title: "Ordering Food", description: "Order at a restaurant, street food stand, or market", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "At a Caracas restaurant: 'Me da un/una arepa', '¿Qué me recomienda?', 'La cuenta, por favor'. Street food: point and say '¡Deme uno de esos!' Learn local tipping customs and how to compliment the food." },
        { id: "esve_a2_u4_l3", title: "Comparisons & Opinions", description: "Compare foods and express preferences using local phrases", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3, culturalHint: "Compare: 'arepa es mejor que...', 'pabellón criollo es más rico que...'. Express opinions the local way: '¡Está chévere!' Learn food adjectives: picante, dulce, salado, crujiente." },
        { id: "esve_a2_u4_l4", title: "Reading: A Recipe", description: "Follow a traditional recipe for arepa", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Recipe for arepa — the national dish. Ingredients, steps, and cooking tips passed down through generations. Learn kitchen vocabulary: picar, freír, hervir, mezclar, sazonar. Every family has their own secret version." },
        { id: "esve_a2_u4_l5", title: "Listening: At the Market", description: "Understand vendors at a local market in Caracas", category: "listening", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "At the market in Caracas: vendors shout prices, offer samples, and negotiate. Listen for: '¡Lleve, lleve!', '¿Qué va a llevar?', '¡Está fresco!' Buy ingredients for arepa: learn fruit, vegetable, and meat names." },
      ],
    },
    {
      id: "esve_b1_u5", title: "Cultura y Sociedad — Culture & Society", level: "B1", order: 5,
      description: "undefined traditions, holidays, music, and social dynamics",
      lessons: [
        { id: "esve_b1_u5_l1", title: "Music & Dance", description: "joropo, salsa, gaita zuliana, tambor, merengue venezolano — rhythm, history, and vocabulary", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "undefined music: joropo, salsa, gaita zuliana, tambor, merengue venezolano. Artists: Oscar D'León, Franco De Vita, Ricardo Montaner. Learn the vocabulary of music and dance: ritmo, compás, letra, estribillo, bailar, mover las caderas. joropo originated in Maracaibo and represents undefined identity." },
        { id: "esve_b1_u5_l2", title: "Subjunctive Mood", description: "Express wishes, doubts, and emotions the undefined way", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2, culturalHint: "Subjunctive in real life: 'Ojalá que Carnaval sea increíble este año', 'Quiero que pruebes arepa', 'Dudo que encuentres mejor pabellón criollo fuera de Caracas'. The subjunctive is used MORE in spoken undefined than textbooks suggest." },
        { id: "esve_b1_u5_l3", title: "Holidays & Traditions", description: "Carnaval, Diablos Danzantes de Yare, Fiestas de San Juan, Cruz de Mayo — how they're celebrated", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3, culturalHint: "Carnaval: hallacas at Christmas. pan de jamón. gaitas in December. During Diablos Danzantes de Yare, families gather to eat empanadas and dance joropo. Learn celebration vocabulary: fiesta, desfile, disfraz, fuegos artificiales, tradición." },
        { id: "esve_b1_u5_l4", title: "Reading: Cultural Article", description: "Read about undefined society, values, and modern life", category: "reading", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Read about modern life in Caracas: the balance between tradition and modernity. Topics: family values, work culture, social gatherings, hallacas at Christmas. Proverb: 'El que no llora no mama' — discuss what it means in undefined culture." },
        { id: "esve_b1_u5_l5", title: "Write an Opinion", description: "Express your views on undefined culture and traditions", category: "writing", level: "B1", duration: 15, xp: 40, order: 5, culturalHint: "Write about what makes undefined culture unique: the food (arepa), the music (joropo), the people, the traditions. Use opinion phrases: 'En mi opinión...', 'Creo que...', 'Lo que más me gusta es...'. Reference: 'Más sabe el diablo por viejo que por diablo'." },
      ],
    },
    {
      id: "esve_b1_u6", title: "Vida Profesional — Work & Business", level: "B1", order: 6,
      description: "Professional communication and workplace culture in undefined",
      lessons: [
        { id: "esve_b1_u6_l1", title: "Work Vocabulary", description: "Office terms, job titles, and professional phrases", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1, culturalHint: "Workplace in Caracas: learn local terms for jobs, offices, and professional interactions. How colleagues greet each other (often with ¿Qué más, chamo? even at work!). Business culture: punctuality, dress code, hierarchy." },
        { id: "esve_b1_u6_l2", title: "Formal vs Informal", description: "When to use tú/usted and formal register in undefined", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2, culturalHint: "In undefined: when do you use 'usted' vs 'tú'? It varies by country! In Caracas, the rules might surprise you. Learn formal email openings, professional phone calls, and how to address your boss vs. coworkers." },
        { id: "esve_b1_u6_l3", title: "Job Interview", description: "Practice a job interview in undefined style", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3, culturalHint: "Job interview in Caracas: 'Cuénteme sobre usted', 'Mis fortalezas son...', '¿Cuál es el salario?'. Local customs: how to dress, arrive, greet the interviewer. In undefined culture, personal connections (networking) matter enormously." },
        { id: "esve_b1_u6_l4", title: "Reading: Job Posting", description: "Understand a job ad from a Caracas company", category: "reading", level: "B1", duration: 10, xp: 30, order: 4, culturalHint: "Read a job posting from Caracas: requisitos (requirements), experiencia (experience), beneficios (benefits), salario (salary). Local job platforms and how the hiring process works in undefined. Key industries in Caracas." },
        { id: "esve_b1_u6_l5", title: "Write a Cover Letter", description: "Compose a professional letter for a undefined company", category: "writing", level: "B1", duration: 15, xp: 45, order: 5, culturalHint: "Write a cover letter for a job in Caracas: formal greeting, why you're interested, your qualifications, closing. Use formal undefined: 'Estimado/a...', 'Me dirijo a usted...', 'Quedo a su disposición...'. Local business etiquette matters." },
      ],
    },
    {
      id: "esve_b2_u7", title: "Expresión Avanzada — Advanced Expression", level: "B2", order: 7,
      description: "Idioms, humor, slang mastery, and nuanced undefined communication",
      lessons: [
        { id: "esve_b2_u7_l1", title: "Idioms & Proverbs", description: "El que no llora no mama | Más sabe el diablo por viejo que por diablo | Camarón que se duerme se lo lleva la corriente", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1, culturalHint: "undefined proverbs: El que no llora no mama. Más sabe el diablo por viejo que por diablo. Camarón que se duerme se lo lleva la corriente. These are used in DAILY conversation — knowing them makes you sound fluent. Learn the context: when to use each one, what situation it fits, and how locals react when you use them correctly." },
        { id: "esve_b2_u7_l2", title: "Advanced Slang", description: "Deep slang that only locals know: fino, arrecho, vaina", category: "vocabulary", level: "B2", duration: 12, xp: 40, order: 2, culturalHint: "Advanced undefined slang: fino (great), arrecho (angry/awesome), vaina (thing), marico (dude), coño (damn). These are the words that make locals say 'wow, you really speak undefined!' Use them in context — wrong usage sounds worse than not knowing them." },
        { id: "esve_b2_u7_l3", title: "Conditional & Hypothetical", description: "'If I were in Caracas...' — complex sentence structures", category: "grammar", level: "B2", duration: 15, xp: 45, order: 3, culturalHint: "Hypotheticals in undefined: 'Si pudiera vivir en Caracas, comería arepa todos los días', 'Si hubiera ido a Carnaval, habría bailado joropo'. The conditional is used differently in undefined vs. textbook Spanish." },
        { id: "esve_b2_u7_l4", title: "Listening: Stand-Up Comedy", description: "Understand humor, wordplay, and cultural references", category: "listening", level: "B2", duration: 12, xp: 40, order: 4, culturalHint: "undefined humor: wordplay, cultural references, and timing. Comedians from Caracas use local slang, accents, and cultural stereotypes. Understanding humor = understanding the culture. Listen for: double meanings, irony, and undefined-specific jokes." },
        { id: "esve_b2_u7_l5", title: "Write a Story", description: "Compose a short story set in Caracas using advanced vocabulary", category: "writing", level: "B2", duration: 18, xp: 50, order: 5, culturalHint: "Write a short story set in Caracas: a character navigates daily life, eats arepa, dances joropo, uses slang (chamo/chama (dude/girl), pana (friend)). Include a proverb: 'Camarón que se duerme se lo lleva la corriente'. Make it feel authentically undefined." },
      ],
    },
    {
      id: "esve_c1_u8", title: "Dominio Cultural — Cultural Mastery", level: "C1", order: 8,
      description: "Deep cultural fluency, literature, history, and sophisticated undefined",
      lessons: [
        { id: "esve_c1_u8_l1", title: "Literature & Arts", description: "undefined writers, poets, and artistic movements", category: "reading", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "undefined literature and arts: famous writers, poets, and artists from Caracas. How undefined art reflects the culture — themes of identity, family, music (joropo), and social issues. Read excerpts and discuss their cultural significance." },
        { id: "esve_c1_u8_l2", title: "Complex Grammar Mastery", description: "Subjunctive perfection, passive voice, and literary tenses", category: "grammar", level: "C1", duration: 18, xp: 50, order: 2, culturalHint: "Master the subjunctive in all its forms as used in undefined: 'Hubiera querido que...', 'Ojalá hubiera podido ir a Carnaval'. Literary tenses used in undefined journalism and literature. The pluscuamperfecto del subjuntivo in real conversation." },
        { id: "esve_c1_u8_l3", title: "Debate & Persuasion", description: "Argue, persuade, and discuss complex topics", category: "speaking", level: "C1", duration: 15, xp: 45, order: 3, culturalHint: "Debate topics relevant to undefined: politics, economy, culture, emigration, tradition vs. modernity. Use sophisticated connectors: 'No obstante...', 'Sin embargo...', 'A pesar de que...'. Persuade someone to visit Caracas and try arepa." },
        { id: "esve_c1_u8_l4", title: "Listening: Documentary", description: "Understand a documentary about undefined history and society", category: "listening", level: "C1", duration: 15, xp: 45, order: 4, culturalHint: "Watch/listen to a documentary about undefined: history, social movements, cultural evolution. How joropo and Oscar D'León shaped national identity. Advanced vocabulary: sociedad, identidad, patrimonio, herencia cultural, diáspora." },
        { id: "esve_c1_u8_l5", title: "Academic Writing", description: "Write an essay analyzing undefined cultural identity", category: "writing", level: "C1", duration: 20, xp: 55, order: 5, culturalHint: "Write an academic essay: 'La identidad cultural en el siglo XXI'. Analyze how joropo, arepa, and hallacas at Christmas define the culture. Use academic register with thesis, arguments, and conclusion." },
      ],
    },
    {
      id: "esve_c2_u9", title: "Fluidez Nativa — Native Fluency", level: "C2", order: 9,
      description: "Think, dream, and create in undefined at native level",
      lessons: [
        { id: "esve_c2_u9_l1", title: "Regional Micro-Dialects", description: "How Caracas vs Maracaibo vs Valencia differ", category: "listening", level: "C2", duration: 15, xp: 50, order: 1, culturalHint: "Micro-dialects within undefined: how people in Caracas sound different from Maracaibo and Valencia. Vocabulary differences, pronunciation shifts, and attitude changes. A native can tell which city you learned in by your accent." },
        { id: "esve_c2_u9_l2", title: "Creative Writing", description: "Write poetry or prose in authentic undefined voice", category: "writing", level: "C2", duration: 20, xp: 55, order: 2, culturalHint: "Write creatively in undefined: a poem about Caracas, a short story about hallacas at Christmas, or a song lyric in the style of Oscar D'León. Use all the slang, proverbs, and cultural references you've learned. Make it sound like a native wrote it." },
        { id: "esve_c2_u9_l3", title: "Simultaneous Interpretation", description: "Real-time translation between English and undefined", category: "speaking", level: "C2", duration: 18, xp: 55, order: 3, culturalHint: "Practice simultaneous interpretation: listen to English and produce undefined in real-time, capturing not just meaning but cultural nuance. Translate idioms into equivalent undefined expressions, not literal translations. 'El que no llora no mama' has no direct English equivalent." },
        { id: "esve_c2_u9_l4", title: "Cultural Mediation", description: "Bridge cultural gaps between undefined and other cultures", category: "reading", level: "C2", duration: 15, xp: 50, order: 4, culturalHint: "Cultural mediation: explain undefined customs to outsiders and vice versa. Why is hallacas at Christmas important? What does arepa represent beyond food? How do Carnaval celebrations reflect national values? Navigate cross-cultural misunderstandings." },
        { id: "esve_c2_u9_l5", title: "Mastery Assessment", description: "Prove native-level fluency across all skills", category: "grammar", level: "C2", duration: 20, xp: 60, order: 5, culturalHint: "Final assessment: demonstrate mastery of undefined across reading, writing, speaking, and listening. Use advanced grammar, regional slang (chamo/chama, pana, chévere), cultural references, and proverbs naturally. You should be indistinguishable from a native undefined speaker." },
      ],
    },
  ],
};

export const SPANISH_CUBAN: LanguageCurriculum = {
  code: "es-CU",
  name: "Cuban Spanish",
  flag: "🇨🇺",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 90,
  units: [
    {
      id: "escu_a1_u1", title: "¡¿Qué bolá! — First Steps", level: "A1", order: 1,
      description: "undefined greetings, pronunciation, and essential survival phrases",
      lessons: [
        { id: "escu_a1_u1_l1", title: "Sounds & Pronunciation", description: "How undefined sounds different — dropped letters, unique rhythm", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "undefined pronunciation: listen to how people in La Habana speak vs. textbook Spanish. Local greetings: ¿Qué bolá, asere?, ¡Oye, compadre!, ¿Cómo andas, socio?. The rhythm and melody of undefined is unique — practice mimicking the intonation." },
        { id: "escu_a1_u1_l2", title: "Essential Greetings", description: "Say hello, goodbye, and 'how are you' the undefined way", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in undefined: ¿Qué bolá, asere?, ¡Oye, compadre!, ¿Cómo andas, socio?. These are what REAL people say — not the textbook '¿Cómo está usted?' Learn when to use each one (friends vs. elders vs. strangers)." },
        { id: "escu_a1_u1_l3", title: "Survival Slang", description: "The 10 words you NEED on day one in La Habana", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Essential slang: asere (buddy), ¿qué bolá? (what's up?), acere (friend), jama (food), guagua (bus). These words are used DAILY — you'll hear them in every conversation. Without these, you'll sound like a textbook, not a real speaker." },
        { id: "escu_a1_u1_l4", title: "Numbers & Money", description: "Count, pay, and understand prices at local shops", category: "grammar", level: "A1", duration: 7, xp: 20, order: 4, culturalHint: "Money talk: learn how locals discuss prices. At a Viñales market, you'll hear slang for money. Practice: '¿Cuánto cuesta?' and local variations. Food prices for ropa vieja and moros y cristianos." },
        { id: "escu_a1_u1_l5", title: "At the Local Spot", description: "Order food and drinks like a local in La Habana", category: "listening", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "At a local restaurant/food stand: order ropa vieja, moros y cristianos, and lechón asado. Listen to how the server speaks — fast, with local slang. Practice: 'Dame un/una...' and 'Quiero probar el/la...'" },
      ],
    },
    {
      id: "escu_a1_u2", title: "La Familia — Family & Home", level: "A1", order: 2,
      description: "Family life, home vocabulary, and daily routines in undefined culture",
      lessons: [
        { id: "escu_a1_u2_l1", title: "Family Terms", description: "How families work in undefined culture — roles, respect, closeness", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1, culturalHint: "Family in undefined culture is EVERYTHING. Extended family lives close together. Learn: abuela/abuelo, tío/tía, primo/prima, compadre/comadre. Family gatherings involve ropa vieja and son cubano. domino games on the porch is a family ritual." },
        { id: "escu_a1_u2_l2", title: "Present Tense — Daily Life", description: "Describe your daily routine using local expressions", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2, culturalHint: "Daily life in La Habana: 'Me levanto temprano', 'Desayuno moros y cristianos', 'Voy al trabajo'. Local twist: people say 'asere (buddy)' when greeting coworkers. The rhythm of daily life includes domino games on the porch." },
        { id: "escu_a1_u2_l3", title: "My Neighborhood", description: "Describe where you live — local landmarks and shops", category: "writing", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Describe a La Habana neighborhood: la bodega/tienda, la panadería, el parque. Include local spots where people eat yuca con mojo and dance son cubano. Use: 'En mi barrio hay...', 'Cerca de mi casa está...'" },
        { id: "escu_a1_u2_l4", title: "Home & Living", description: "Rooms, furniture, and how homes look in undefined", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Homes in La Habana vs Santiago de Cuba: learn local terms for rooms and furniture. Many families have a patio/balcón where they gather. Music (son cubano, salsa) plays from the kitchen while cooking ropa vieja." },
        { id: "escu_a1_u2_l5", title: "Reading: A Text Message", description: "Understand informal texts with local slang and abbreviations", category: "reading", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "Read a WhatsApp chat between friends planning to meet up. Slang: jama (food), guagua (bus), fula (dollar), yuma (foreigner). Abbreviations and emojis used locally. The conversation is about going to eat tostones and maybe dancing salsa." },
      ],
    },
    {
      id: "escu_a2_u3", title: "Moviéndose — Getting Around", level: "A2", order: 3,
      description: "Transportation, directions, and navigating La Habana",
      lessons: [
        { id: "escu_a2_u3_l1", title: "Directions & Navigation", description: "Ask for and give directions in La Habana", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate La Habana: 'Disculpe, ¿cómo llego a...?', '¿Dónde queda...?' Local landmarks: learn the names of famous streets, plazas, and neighborhoods. Locals give directions using landmarks, not street numbers." },
        { id: "escu_a2_u3_l2", title: "Past Tense — What Happened", description: "Tell stories about what you did using local expressions", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2, culturalHint: "Tell stories the undefined way: 'Ayer fui a Santiago de Cuba', 'Comí ropa vieja increíble', 'Bailé son cubano toda la noche'. Use local filler words and expressions. El que tiene tienda que la atienda — learn this proverb in context." },
        { id: "escu_a2_u3_l3", title: "Local Transportation", description: "Buses, taxis, and getting around like a local", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Transportation in La Habana: learn local names for bus, taxi, rideshare. How to hail a cab, negotiate fares, and understand route names. In undefined, the bus might be called differently than in textbook Spanish." },
        { id: "escu_a2_u3_l4", title: "Reading: A Travel Blog", description: "Follow a traveler's story through La Habana, Santiago de Cuba, Trinidad, Viñales, Varadero", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Read about a trip through La Habana, Santiago de Cuba, and Trinidad. The blogger tries ropa vieja, dances son cubano, and learns local slang. Vocabulary: hotel, aeropuerto, maleta, pasaporte, aventura." },
        { id: "escu_a2_u3_l5", title: "Write About Your Trip", description: "Describe a real or imaginary trip to undefined", category: "writing", level: "A2", duration: 12, xp: 35, order: 5, culturalHint: "Write about visiting La Habana: what you ate (ropa vieja, moros y cristianos, lechón asado), what you saw, who you met. Use past tense and local expressions. Mention Santería rituals and how it felt to experience undefined culture firsthand." },
      ],
    },
    {
      id: "escu_a2_u4", title: "La Comida — Food & Drink", level: "A2", order: 4,
      description: "undefined cuisine, ordering, cooking vocabulary, and food culture",
      lessons: [
        { id: "escu_a2_u4_l1", title: "Food Vocabulary", description: "Essential dishes: ropa vieja, moros y cristianos, lechón asado, yuca con mojo", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1, culturalHint: "undefined food: ropa vieja, moros y cristianos, lechón asado, yuca con mojo, tostones, frijoles negros. Food is central to undefined culture — every gathering revolves around eating together. Learn the ingredients, how dishes are prepared, and when they're eaten (breakfast vs. lunch vs. dinner)." },
        { id: "escu_a2_u4_l2", title: "Ordering Food", description: "Order at a restaurant, street food stand, or market", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "At a La Habana restaurant: 'Me da un/una ropa vieja', '¿Qué me recomienda?', 'La cuenta, por favor'. Street food: point and say '¡Deme uno de esos!' Learn local tipping customs and how to compliment the food." },
        { id: "escu_a2_u4_l3", title: "Comparisons & Opinions", description: "Compare foods and express preferences using local phrases", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3, culturalHint: "Compare: 'ropa vieja es mejor que...', 'moros y cristianos es más rico que...'. Express opinions the local way: '¡Está buenísimo!' Learn food adjectives: picante, dulce, salado, crujiente." },
        { id: "escu_a2_u4_l4", title: "Reading: A Recipe", description: "Follow a traditional recipe for ropa vieja", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Recipe for ropa vieja — the national dish. Ingredients, steps, and cooking tips passed down through generations. Learn kitchen vocabulary: picar, freír, hervir, mezclar, sazonar. Every family has their own secret version." },
        { id: "escu_a2_u4_l5", title: "Listening: At the Market", description: "Understand vendors at a local market in La Habana", category: "listening", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "At the market in La Habana: vendors shout prices, offer samples, and negotiate. Listen for: '¡Lleve, lleve!', '¿Qué va a llevar?', '¡Está fresco!' Buy ingredients for ropa vieja: learn fruit, vegetable, and meat names." },
      ],
    },
    {
      id: "escu_b1_u5", title: "Cultura y Sociedad — Culture & Society", level: "B1", order: 5,
      description: "undefined traditions, holidays, music, and social dynamics",
      lessons: [
        { id: "escu_b1_u5_l1", title: "Music & Dance", description: "son cubano, salsa, rumba, mambo, cha-cha-chá, danzón, reggaetón cubano — rhythm, history, and vocabulary", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "undefined music: son cubano, salsa, rumba, mambo, cha-cha-chá, danzón, reggaetón cubano. Artists: Buena Vista Social Club, Celia Cruz, Compay Segundo. Learn the vocabulary of music and dance: ritmo, compás, letra, estribillo, bailar, mover las caderas. son cubano originated in Santiago de Cuba and represents undefined identity." },
        { id: "escu_b1_u5_l2", title: "Subjunctive Mood", description: "Express wishes, doubts, and emotions the undefined way", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2, culturalHint: "Subjunctive in real life: 'Ojalá que Carnaval de Santiago sea increíble este año', 'Quiero que pruebes ropa vieja', 'Dudo que encuentres mejor moros y cristianos fuera de La Habana'. The subjunctive is used MORE in spoken undefined than textbooks suggest." },
        { id: "escu_b1_u5_l3", title: "Holidays & Traditions", description: "Carnaval de Santiago, Día de la Cultura Cubana, Parrandas de Remedios, San Lázaro (Dec 17) — how they're celebrated", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3, culturalHint: "Carnaval de Santiago: domino games on the porch. Santería rituals. classic car culture. During Día de la Cultura Cubana, families gather to eat frijoles negros and dance son cubano. Learn celebration vocabulary: fiesta, desfile, disfraz, fuegos artificiales, tradición." },
        { id: "escu_b1_u5_l4", title: "Reading: Cultural Article", description: "Read about undefined society, values, and modern life", category: "reading", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Read about modern life in La Habana: the balance between tradition and modernity. Topics: family values, work culture, social gatherings, domino games on the porch. Proverb: 'El que tiene tienda que la atienda' — discuss what it means in undefined culture." },
        { id: "escu_b1_u5_l5", title: "Write an Opinion", description: "Express your views on undefined culture and traditions", category: "writing", level: "B1", duration: 15, xp: 40, order: 5, culturalHint: "Write about what makes undefined culture unique: the food (ropa vieja), the music (son cubano), the people, the traditions. Use opinion phrases: 'En mi opinión...', 'Creo que...', 'Lo que más me gusta es...'. Reference: 'No por mucho madrugar amanece más temprano'." },
      ],
    },
    {
      id: "escu_b1_u6", title: "Vida Profesional — Work & Business", level: "B1", order: 6,
      description: "Professional communication and workplace culture in undefined",
      lessons: [
        { id: "escu_b1_u6_l1", title: "Work Vocabulary", description: "Office terms, job titles, and professional phrases", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1, culturalHint: "Workplace in La Habana: learn local terms for jobs, offices, and professional interactions. How colleagues greet each other (often with ¿Qué bolá, asere? even at work!). Business culture: punctuality, dress code, hierarchy." },
        { id: "escu_b1_u6_l2", title: "Formal vs Informal", description: "When to use tú/usted and formal register in undefined", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2, culturalHint: "In undefined: when do you use 'usted' vs 'tú'? It varies by country! In La Habana, the rules might surprise you. Learn formal email openings, professional phone calls, and how to address your boss vs. coworkers." },
        { id: "escu_b1_u6_l3", title: "Job Interview", description: "Practice a job interview in undefined style", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3, culturalHint: "Job interview in La Habana: 'Cuénteme sobre usted', 'Mis fortalezas son...', '¿Cuál es el salario?'. Local customs: how to dress, arrive, greet the interviewer. In undefined culture, personal connections (networking) matter enormously." },
        { id: "escu_b1_u6_l4", title: "Reading: Job Posting", description: "Understand a job ad from a La Habana company", category: "reading", level: "B1", duration: 10, xp: 30, order: 4, culturalHint: "Read a job posting from La Habana: requisitos (requirements), experiencia (experience), beneficios (benefits), salario (salary). Local job platforms and how the hiring process works in undefined. Key industries in La Habana." },
        { id: "escu_b1_u6_l5", title: "Write a Cover Letter", description: "Compose a professional letter for a undefined company", category: "writing", level: "B1", duration: 15, xp: 45, order: 5, culturalHint: "Write a cover letter for a job in La Habana: formal greeting, why you're interested, your qualifications, closing. Use formal undefined: 'Estimado/a...', 'Me dirijo a usted...', 'Quedo a su disposición...'. Local business etiquette matters." },
      ],
    },
    {
      id: "escu_b2_u7", title: "Expresión Avanzada — Advanced Expression", level: "B2", order: 7,
      description: "Idioms, humor, slang mastery, and nuanced undefined communication",
      lessons: [
        { id: "escu_b2_u7_l1", title: "Idioms & Proverbs", description: "El que tiene tienda que la atienda | No por mucho madrugar amanece más temprano | Dime con quién andas y te diré quién eres", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1, culturalHint: "undefined proverbs: El que tiene tienda que la atienda. No por mucho madrugar amanece más temprano. Dime con quién andas y te diré quién eres. These are used in DAILY conversation — knowing them makes you sound fluent. Learn the context: when to use each one, what situation it fits, and how locals react when you use them correctly." },
        { id: "escu_b2_u7_l2", title: "Advanced Slang", description: "Deep slang that only locals know: fula, yuma, pinchar", category: "vocabulary", level: "B2", duration: 12, xp: 40, order: 2, culturalHint: "Advanced undefined slang: fula (dollar), yuma (foreigner), pinchar (to work), tremendo (amazing), dale (go ahead). These are the words that make locals say 'wow, you really speak undefined!' Use them in context — wrong usage sounds worse than not knowing them." },
        { id: "escu_b2_u7_l3", title: "Conditional & Hypothetical", description: "'If I were in La Habana...' — complex sentence structures", category: "grammar", level: "B2", duration: 15, xp: 45, order: 3, culturalHint: "Hypotheticals in undefined: 'Si pudiera vivir en La Habana, comería ropa vieja todos los días', 'Si hubiera ido a Carnaval de Santiago, habría bailado son cubano'. The conditional is used differently in undefined vs. textbook Spanish." },
        { id: "escu_b2_u7_l4", title: "Listening: Stand-Up Comedy", description: "Understand humor, wordplay, and cultural references", category: "listening", level: "B2", duration: 12, xp: 40, order: 4, culturalHint: "undefined humor: wordplay, cultural references, and timing. Comedians from La Habana use local slang, accents, and cultural stereotypes. Understanding humor = understanding the culture. Listen for: double meanings, irony, and undefined-specific jokes." },
        { id: "escu_b2_u7_l5", title: "Write a Story", description: "Compose a short story set in La Habana using advanced vocabulary", category: "writing", level: "B2", duration: 18, xp: 50, order: 5, culturalHint: "Write a short story set in La Habana: a character navigates daily life, eats ropa vieja, dances son cubano, uses slang (asere (buddy), ¿qué bolá? (what's up?)). Include a proverb: 'Dime con quién andas y te diré quién eres'. Make it feel authentically undefined." },
      ],
    },
    {
      id: "escu_c1_u8", title: "Dominio Cultural — Cultural Mastery", level: "C1", order: 8,
      description: "Deep cultural fluency, literature, history, and sophisticated undefined",
      lessons: [
        { id: "escu_c1_u8_l1", title: "Literature & Arts", description: "undefined writers, poets, and artistic movements", category: "reading", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "undefined literature and arts: famous writers, poets, and artists from La Habana. How undefined art reflects the culture — themes of identity, family, music (son cubano), and social issues. Read excerpts and discuss their cultural significance." },
        { id: "escu_c1_u8_l2", title: "Complex Grammar Mastery", description: "Subjunctive perfection, passive voice, and literary tenses", category: "grammar", level: "C1", duration: 18, xp: 50, order: 2, culturalHint: "Master the subjunctive in all its forms as used in undefined: 'Hubiera querido que...', 'Ojalá hubiera podido ir a Carnaval de Santiago'. Literary tenses used in undefined journalism and literature. The pluscuamperfecto del subjuntivo in real conversation." },
        { id: "escu_c1_u8_l3", title: "Debate & Persuasion", description: "Argue, persuade, and discuss complex topics", category: "speaking", level: "C1", duration: 15, xp: 45, order: 3, culturalHint: "Debate topics relevant to undefined: politics, economy, culture, emigration, tradition vs. modernity. Use sophisticated connectors: 'No obstante...', 'Sin embargo...', 'A pesar de que...'. Persuade someone to visit La Habana and try ropa vieja." },
        { id: "escu_c1_u8_l4", title: "Listening: Documentary", description: "Understand a documentary about undefined history and society", category: "listening", level: "C1", duration: 15, xp: 45, order: 4, culturalHint: "Watch/listen to a documentary about undefined: history, social movements, cultural evolution. How son cubano and Buena Vista Social Club shaped national identity. Advanced vocabulary: sociedad, identidad, patrimonio, herencia cultural, diáspora." },
        { id: "escu_c1_u8_l5", title: "Academic Writing", description: "Write an essay analyzing undefined cultural identity", category: "writing", level: "C1", duration: 20, xp: 55, order: 5, culturalHint: "Write an academic essay: 'La identidad cultural en el siglo XXI'. Analyze how son cubano, ropa vieja, and domino games on the porch define the culture. Use academic register with thesis, arguments, and conclusion." },
      ],
    },
    {
      id: "escu_c2_u9", title: "Fluidez Nativa — Native Fluency", level: "C2", order: 9,
      description: "Think, dream, and create in undefined at native level",
      lessons: [
        { id: "escu_c2_u9_l1", title: "Regional Micro-Dialects", description: "How La Habana vs Santiago de Cuba vs Trinidad differ", category: "listening", level: "C2", duration: 15, xp: 50, order: 1, culturalHint: "Micro-dialects within undefined: how people in La Habana sound different from Santiago de Cuba and Trinidad. Vocabulary differences, pronunciation shifts, and attitude changes. A native can tell which city you learned in by your accent." },
        { id: "escu_c2_u9_l2", title: "Creative Writing", description: "Write poetry or prose in authentic undefined voice", category: "writing", level: "C2", duration: 20, xp: 55, order: 2, culturalHint: "Write creatively in undefined: a poem about La Habana, a short story about domino games on the porch, or a song lyric in the style of Buena Vista Social Club. Use all the slang, proverbs, and cultural references you've learned. Make it sound like a native wrote it." },
        { id: "escu_c2_u9_l3", title: "Simultaneous Interpretation", description: "Real-time translation between English and undefined", category: "speaking", level: "C2", duration: 18, xp: 55, order: 3, culturalHint: "Practice simultaneous interpretation: listen to English and produce undefined in real-time, capturing not just meaning but cultural nuance. Translate idioms into equivalent undefined expressions, not literal translations. 'El que tiene tienda que la atienda' has no direct English equivalent." },
        { id: "escu_c2_u9_l4", title: "Cultural Mediation", description: "Bridge cultural gaps between undefined and other cultures", category: "reading", level: "C2", duration: 15, xp: 50, order: 4, culturalHint: "Cultural mediation: explain undefined customs to outsiders and vice versa. Why is domino games on the porch important? What does ropa vieja represent beyond food? How do Carnaval de Santiago celebrations reflect national values? Navigate cross-cultural misunderstandings." },
        { id: "escu_c2_u9_l5", title: "Mastery Assessment", description: "Prove native-level fluency across all skills", category: "grammar", level: "C2", duration: 20, xp: 60, order: 5, culturalHint: "Final assessment: demonstrate mastery of undefined across reading, writing, speaking, and listening. Use advanced grammar, regional slang (asere, ¿qué, acere), cultural references, and proverbs naturally. You should be indistinguishable from a native undefined speaker." },
      ],
    },
  ],
};

export const SPANISH_COSTA_RICAN: LanguageCurriculum = {
  code: "es-CR",
  name: "Costa Rican Spanish",
  flag: "🇨🇷",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 90,
  units: [
    {
      id: "escr_a1_u1", title: "¡Pura vida! — First Steps", level: "A1", order: 1,
      description: "undefined greetings, pronunciation, and essential survival phrases",
      lessons: [
        { id: "escr_a1_u1_l1", title: "Sounds & Pronunciation", description: "How undefined sounds different — dropped letters, unique rhythm", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "undefined pronunciation: listen to how people in San José speak vs. textbook Spanish. Local greetings: ¡Pura vida, mae!, ¿Qué mae, todo bien?, ¡Tuanis!. The rhythm and melody of undefined is unique — practice mimicking the intonation." },
        { id: "escr_a1_u1_l2", title: "Essential Greetings", description: "Say hello, goodbye, and 'how are you' the undefined way", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in undefined: ¡Pura vida, mae!, ¿Qué mae, todo bien?, ¡Tuanis!. These are what REAL people say — not the textbook '¿Cómo está usted?' Learn when to use each one (friends vs. elders vs. strangers)." },
        { id: "escr_a1_u1_l3", title: "Survival Slang", description: "The 10 words you NEED on day one in San José", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Essential slang: mae (dude), pura vida (everything is great/hello/goodbye/thanks), tuanis (cool), diay (well/so), brete (work). These words are used DAILY — you'll hear them in every conversation. Without these, you'll sound like a textbook, not a real speaker." },
        { id: "escr_a1_u1_l4", title: "Numbers & Money", description: "Count, pay, and understand prices at local shops", category: "grammar", level: "A1", duration: 7, xp: 20, order: 4, culturalHint: "Money talk: learn how locals discuss prices. At a La Fortuna market, you'll hear slang for money. Practice: '¿Cuánto cuesta?' and local variations. Food prices for gallo pinto and casado." },
        { id: "escr_a1_u1_l5", title: "At the Local Spot", description: "Order food and drinks like a local in San José", category: "listening", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "At a local restaurant/food stand: order gallo pinto, casado, and chifrijo. Listen to how the server speaks — fast, with local slang. Practice: 'Dame un/una...' and 'Quiero probar el/la...'" },
      ],
    },
    {
      id: "escr_a1_u2", title: "La Familia — Family & Home", level: "A1", order: 2,
      description: "Family life, home vocabulary, and daily routines in undefined culture",
      lessons: [
        { id: "escr_a1_u2_l1", title: "Family Terms", description: "How families work in undefined culture — roles, respect, closeness", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1, culturalHint: "Family in undefined culture is EVERYTHING. Extended family lives close together. Learn: abuela/abuelo, tío/tía, primo/prima, compadre/comadre. Family gatherings involve gallo pinto and punto guanacasteco. pura vida philosophy is a family ritual." },
        { id: "escr_a1_u2_l2", title: "Present Tense — Daily Life", description: "Describe your daily routine using local expressions", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2, culturalHint: "Daily life in San José: 'Me levanto temprano', 'Desayuno casado', 'Voy al trabajo'. Local twist: people say 'mae (dude)' when greeting coworkers. The rhythm of daily life includes pura vida philosophy." },
        { id: "escr_a1_u2_l3", title: "My Neighborhood", description: "Describe where you live — local landmarks and shops", category: "writing", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Describe a San José neighborhood: la bodega/tienda, la panadería, el parque. Include local spots where people eat patacones and dance punto guanacasteco. Use: 'En mi barrio hay...', 'Cerca de mi casa está...'" },
        { id: "escr_a1_u2_l4", title: "Home & Living", description: "Rooms, furniture, and how homes look in undefined", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Homes in San José vs Manuel Antonio: learn local terms for rooms and furniture. Many families have a patio/balcón where they gather. Music (punto guanacasteco, swing criollo) plays from the kitchen while cooking gallo pinto." },
        { id: "escr_a1_u2_l5", title: "Reading: A Text Message", description: "Understand informal texts with local slang and abbreviations", category: "reading", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "Read a WhatsApp chat between friends planning to meet up. Slang: diay (well/so), brete (work), chunche (thing), jupa (head). Abbreviations and emojis used locally. The conversation is about going to eat olla de carne and maybe dancing swing criollo." },
      ],
    },
    {
      id: "escr_a2_u3", title: "Moviéndose — Getting Around", level: "A2", order: 3,
      description: "Transportation, directions, and navigating San José",
      lessons: [
        { id: "escr_a2_u3_l1", title: "Directions & Navigation", description: "Ask for and give directions in San José", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate San José: 'Disculpe, ¿cómo llego a...?', '¿Dónde queda...?' Local landmarks: learn the names of famous streets, plazas, and neighborhoods. Locals give directions using landmarks, not street numbers." },
        { id: "escr_a2_u3_l2", title: "Past Tense — What Happened", description: "Tell stories about what you did using local expressions", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2, culturalHint: "Tell stories the undefined way: 'Ayer fui a Manuel Antonio', 'Comí gallo pinto increíble', 'Bailé punto guanacasteco toda la noche'. Use local filler words and expressions. El que nace para tamal, del cielo le caen las hojas — learn this proverb in context." },
        { id: "escr_a2_u3_l3", title: "Local Transportation", description: "Buses, taxis, and getting around like a local", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Transportation in San José: learn local names for bus, taxi, rideshare. How to hail a cab, negotiate fares, and understand route names. In undefined, the bus might be called differently than in textbook Spanish." },
        { id: "escr_a2_u3_l4", title: "Reading: A Travel Blog", description: "Follow a traveler's story through San José, Manuel Antonio, Monteverde, La Fortuna, Puerto Viejo", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Read about a trip through San José, Manuel Antonio, and Monteverde. The blogger tries gallo pinto, dances punto guanacasteco, and learns local slang. Vocabulary: hotel, aeropuerto, maleta, pasaporte, aventura." },
        { id: "escr_a2_u3_l5", title: "Write About Your Trip", description: "Describe a real or imaginary trip to undefined", category: "writing", level: "A2", duration: 12, xp: 35, order: 5, culturalHint: "Write about visiting San José: what you ate (gallo pinto, casado, chifrijo), what you saw, who you met. Use past tense and local expressions. Mention coffee culture (café chorreado) and how it felt to experience undefined culture firsthand." },
      ],
    },
    {
      id: "escr_a2_u4", title: "La Comida — Food & Drink", level: "A2", order: 4,
      description: "undefined cuisine, ordering, cooking vocabulary, and food culture",
      lessons: [
        { id: "escr_a2_u4_l1", title: "Food Vocabulary", description: "Essential dishes: gallo pinto, casado, chifrijo, patacones", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1, culturalHint: "undefined food: gallo pinto, casado, chifrijo, patacones, olla de carne, arroz con leche. Food is central to undefined culture — every gathering revolves around eating together. Learn the ingredients, how dishes are prepared, and when they're eaten (breakfast vs. lunch vs. dinner)." },
        { id: "escr_a2_u4_l2", title: "Ordering Food", description: "Order at a restaurant, street food stand, or market", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "At a San José restaurant: 'Me da un/una gallo pinto', '¿Qué me recomienda?', 'La cuenta, por favor'. Street food: point and say '¡Deme uno de esos!' Learn local tipping customs and how to compliment the food." },
        { id: "escr_a2_u4_l3", title: "Comparisons & Opinions", description: "Compare foods and express preferences using local phrases", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3, culturalHint: "Compare: 'gallo pinto es mejor que...', 'casado es más rico que...'. Express opinions the local way: '¡Está pura!' Learn food adjectives: picante, dulce, salado, crujiente." },
        { id: "escr_a2_u4_l4", title: "Reading: A Recipe", description: "Follow a traditional recipe for gallo pinto", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Recipe for gallo pinto — the national dish. Ingredients, steps, and cooking tips passed down through generations. Learn kitchen vocabulary: picar, freír, hervir, mezclar, sazonar. Every family has their own secret version." },
        { id: "escr_a2_u4_l5", title: "Listening: At the Market", description: "Understand vendors at a local market in San José", category: "listening", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "At the market in San José: vendors shout prices, offer samples, and negotiate. Listen for: '¡Lleve, lleve!', '¿Qué va a llevar?', '¡Está fresco!' Buy ingredients for gallo pinto: learn fruit, vegetable, and meat names." },
      ],
    },
    {
      id: "escr_b1_u5", title: "Cultura y Sociedad — Culture & Society", level: "B1", order: 5,
      description: "undefined traditions, holidays, music, and social dynamics",
      lessons: [
        { id: "escr_b1_u5_l1", title: "Music & Dance", description: "punto guanacasteco, swing criollo, cumbia tica, calypso limonense — rhythm, history, and vocabulary", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "undefined music: punto guanacasteco, swing criollo, cumbia tica, calypso limonense. Artists: Debi Nova, Malpaís, Sonámbulo. Learn the vocabulary of music and dance: ritmo, compás, letra, estribillo, bailar, mover las caderas. punto guanacasteco originated in Manuel Antonio and represents undefined identity." },
        { id: "escr_b1_u5_l2", title: "Subjunctive Mood", description: "Express wishes, doubts, and emotions the undefined way", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2, culturalHint: "Subjunctive in real life: 'Ojalá que Día de los Boyeros sea increíble este año', 'Quiero que pruebes gallo pinto', 'Dudo que encuentres mejor casado fuera de San José'. The subjunctive is used MORE in spoken undefined than textbooks suggest." },
        { id: "escr_b1_u5_l3", title: "Holidays & Traditions", description: "Día de los Boyeros, Fiesta de los Diablitos, Anexión de Guanacaste, Romería a Cartago — how they're celebrated", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3, culturalHint: "Día de los Boyeros: pura vida philosophy. coffee culture (café chorreado). oxcart painting. During Fiesta de los Diablitos, families gather to eat arroz con leche and dance punto guanacasteco. Learn celebration vocabulary: fiesta, desfile, disfraz, fuegos artificiales, tradición." },
        { id: "escr_b1_u5_l4", title: "Reading: Cultural Article", description: "Read about undefined society, values, and modern life", category: "reading", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Read about modern life in San José: the balance between tradition and modernity. Topics: family values, work culture, social gatherings, pura vida philosophy. Proverb: 'El que nace para tamal, del cielo le caen las hojas' — discuss what it means in undefined culture." },
        { id: "escr_b1_u5_l5", title: "Write an Opinion", description: "Express your views on undefined culture and traditions", category: "writing", level: "B1", duration: 15, xp: 40, order: 5, culturalHint: "Write about what makes undefined culture unique: the food (gallo pinto), the music (punto guanacasteco), the people, the traditions. Use opinion phrases: 'En mi opinión...', 'Creo que...', 'Lo que más me gusta es...'. Reference: 'A caballo regalado no se le mira el colmillo'." },
      ],
    },
    {
      id: "escr_b1_u6", title: "Vida Profesional — Work & Business", level: "B1", order: 6,
      description: "Professional communication and workplace culture in undefined",
      lessons: [
        { id: "escr_b1_u6_l1", title: "Work Vocabulary", description: "Office terms, job titles, and professional phrases", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1, culturalHint: "Workplace in San José: learn local terms for jobs, offices, and professional interactions. How colleagues greet each other (often with ¡Pura vida, mae! even at work!). Business culture: punctuality, dress code, hierarchy." },
        { id: "escr_b1_u6_l2", title: "Formal vs Informal", description: "When to use tú/usted and formal register in undefined", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2, culturalHint: "In undefined: when do you use 'usted' vs 'tú'? It varies by country! In San José, the rules might surprise you. Learn formal email openings, professional phone calls, and how to address your boss vs. coworkers." },
        { id: "escr_b1_u6_l3", title: "Job Interview", description: "Practice a job interview in undefined style", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3, culturalHint: "Job interview in San José: 'Cuénteme sobre usted', 'Mis fortalezas son...', '¿Cuál es el salario?'. Local customs: how to dress, arrive, greet the interviewer. In undefined culture, personal connections (networking) matter enormously." },
        { id: "escr_b1_u6_l4", title: "Reading: Job Posting", description: "Understand a job ad from a San José company", category: "reading", level: "B1", duration: 10, xp: 30, order: 4, culturalHint: "Read a job posting from San José: requisitos (requirements), experiencia (experience), beneficios (benefits), salario (salary). Local job platforms and how the hiring process works in undefined. Key industries in San José." },
        { id: "escr_b1_u6_l5", title: "Write a Cover Letter", description: "Compose a professional letter for a undefined company", category: "writing", level: "B1", duration: 15, xp: 45, order: 5, culturalHint: "Write a cover letter for a job in San José: formal greeting, why you're interested, your qualifications, closing. Use formal undefined: 'Estimado/a...', 'Me dirijo a usted...', 'Quedo a su disposición...'. Local business etiquette matters." },
      ],
    },
    {
      id: "escr_b2_u7", title: "Expresión Avanzada — Advanced Expression", level: "B2", order: 7,
      description: "Idioms, humor, slang mastery, and nuanced undefined communication",
      lessons: [
        { id: "escr_b2_u7_l1", title: "Idioms & Proverbs", description: "El que nace para tamal, del cielo le caen las hojas | A caballo regalado no se le mira el colmillo | Más vale pájaro en mano que cien volando", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1, culturalHint: "undefined proverbs: El que nace para tamal, del cielo le caen las hojas. A caballo regalado no se le mira el colmillo. Más vale pájaro en mano que cien volando. These are used in DAILY conversation — knowing them makes you sound fluent. Learn the context: when to use each one, what situation it fits, and how locals react when you use them correctly." },
        { id: "escr_b2_u7_l2", title: "Advanced Slang", description: "Deep slang that only locals know: chunche, jupa, teja", category: "vocabulary", level: "B2", duration: 12, xp: 40, order: 2, culturalHint: "Advanced undefined slang: chunche (thing), jupa (head), teja (100 colones), birra (beer), vara (stuff/thing). These are the words that make locals say 'wow, you really speak undefined!' Use them in context — wrong usage sounds worse than not knowing them." },
        { id: "escr_b2_u7_l3", title: "Conditional & Hypothetical", description: "'If I were in San José...' — complex sentence structures", category: "grammar", level: "B2", duration: 15, xp: 45, order: 3, culturalHint: "Hypotheticals in undefined: 'Si pudiera vivir en San José, comería gallo pinto todos los días', 'Si hubiera ido a Día de los Boyeros, habría bailado punto guanacasteco'. The conditional is used differently in undefined vs. textbook Spanish." },
        { id: "escr_b2_u7_l4", title: "Listening: Stand-Up Comedy", description: "Understand humor, wordplay, and cultural references", category: "listening", level: "B2", duration: 12, xp: 40, order: 4, culturalHint: "undefined humor: wordplay, cultural references, and timing. Comedians from San José use local slang, accents, and cultural stereotypes. Understanding humor = understanding the culture. Listen for: double meanings, irony, and undefined-specific jokes." },
        { id: "escr_b2_u7_l5", title: "Write a Story", description: "Compose a short story set in San José using advanced vocabulary", category: "writing", level: "B2", duration: 18, xp: 50, order: 5, culturalHint: "Write a short story set in San José: a character navigates daily life, eats gallo pinto, dances punto guanacasteco, uses slang (mae (dude), pura vida (everything is great/hello/goodbye/thanks)). Include a proverb: 'Más vale pájaro en mano que cien volando'. Make it feel authentically undefined." },
      ],
    },
    {
      id: "escr_c1_u8", title: "Dominio Cultural — Cultural Mastery", level: "C1", order: 8,
      description: "Deep cultural fluency, literature, history, and sophisticated undefined",
      lessons: [
        { id: "escr_c1_u8_l1", title: "Literature & Arts", description: "undefined writers, poets, and artistic movements", category: "reading", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "undefined literature and arts: famous writers, poets, and artists from San José. How undefined art reflects the culture — themes of identity, family, music (punto guanacasteco), and social issues. Read excerpts and discuss their cultural significance." },
        { id: "escr_c1_u8_l2", title: "Complex Grammar Mastery", description: "Subjunctive perfection, passive voice, and literary tenses", category: "grammar", level: "C1", duration: 18, xp: 50, order: 2, culturalHint: "Master the subjunctive in all its forms as used in undefined: 'Hubiera querido que...', 'Ojalá hubiera podido ir a Día de los Boyeros'. Literary tenses used in undefined journalism and literature. The pluscuamperfecto del subjuntivo in real conversation." },
        { id: "escr_c1_u8_l3", title: "Debate & Persuasion", description: "Argue, persuade, and discuss complex topics", category: "speaking", level: "C1", duration: 15, xp: 45, order: 3, culturalHint: "Debate topics relevant to undefined: politics, economy, culture, emigration, tradition vs. modernity. Use sophisticated connectors: 'No obstante...', 'Sin embargo...', 'A pesar de que...'. Persuade someone to visit San José and try gallo pinto." },
        { id: "escr_c1_u8_l4", title: "Listening: Documentary", description: "Understand a documentary about undefined history and society", category: "listening", level: "C1", duration: 15, xp: 45, order: 4, culturalHint: "Watch/listen to a documentary about undefined: history, social movements, cultural evolution. How punto guanacasteco and Debi Nova shaped national identity. Advanced vocabulary: sociedad, identidad, patrimonio, herencia cultural, diáspora." },
        { id: "escr_c1_u8_l5", title: "Academic Writing", description: "Write an essay analyzing undefined cultural identity", category: "writing", level: "C1", duration: 20, xp: 55, order: 5, culturalHint: "Write an academic essay: 'La identidad cultural en el siglo XXI'. Analyze how punto guanacasteco, gallo pinto, and pura vida philosophy define the culture. Use academic register with thesis, arguments, and conclusion." },
      ],
    },
    {
      id: "escr_c2_u9", title: "Fluidez Nativa — Native Fluency", level: "C2", order: 9,
      description: "Think, dream, and create in undefined at native level",
      lessons: [
        { id: "escr_c2_u9_l1", title: "Regional Micro-Dialects", description: "How San José vs Manuel Antonio vs Monteverde differ", category: "listening", level: "C2", duration: 15, xp: 50, order: 1, culturalHint: "Micro-dialects within undefined: how people in San José sound different from Manuel Antonio and Monteverde. Vocabulary differences, pronunciation shifts, and attitude changes. A native can tell which city you learned in by your accent." },
        { id: "escr_c2_u9_l2", title: "Creative Writing", description: "Write poetry or prose in authentic undefined voice", category: "writing", level: "C2", duration: 20, xp: 55, order: 2, culturalHint: "Write creatively in undefined: a poem about San José, a short story about pura vida philosophy, or a song lyric in the style of Debi Nova. Use all the slang, proverbs, and cultural references you've learned. Make it sound like a native wrote it." },
        { id: "escr_c2_u9_l3", title: "Simultaneous Interpretation", description: "Real-time translation between English and undefined", category: "speaking", level: "C2", duration: 18, xp: 55, order: 3, culturalHint: "Practice simultaneous interpretation: listen to English and produce undefined in real-time, capturing not just meaning but cultural nuance. Translate idioms into equivalent undefined expressions, not literal translations. 'El que nace para tamal, del cielo le caen las hojas' has no direct English equivalent." },
        { id: "escr_c2_u9_l4", title: "Cultural Mediation", description: "Bridge cultural gaps between undefined and other cultures", category: "reading", level: "C2", duration: 15, xp: 50, order: 4, culturalHint: "Cultural mediation: explain undefined customs to outsiders and vice versa. Why is pura vida philosophy important? What does gallo pinto represent beyond food? How do Día de los Boyeros celebrations reflect national values? Navigate cross-cultural misunderstandings." },
        { id: "escr_c2_u9_l5", title: "Mastery Assessment", description: "Prove native-level fluency across all skills", category: "grammar", level: "C2", duration: 20, xp: 60, order: 5, culturalHint: "Final assessment: demonstrate mastery of undefined across reading, writing, speaking, and listening. Use advanced grammar, regional slang (mae, pura, tuanis), cultural references, and proverbs naturally. You should be indistinguishable from a native undefined speaker." },
      ],
    },
  ],
};

export const SPANISH_ARGENTINE: LanguageCurriculum = {
  code: "es-AR",
  name: "Argentine Spanish",
  flag: "🇦🇷",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 90,
  units: [
    {
      id: "esar_a1_u1", title: "¡Che! — First Steps", level: "A1", order: 1,
      description: "undefined greetings, pronunciation, and essential survival phrases",
      lessons: [
        { id: "esar_a1_u1_l1", title: "Sounds & Pronunciation", description: "How undefined sounds different — dropped letters, unique rhythm", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "undefined pronunciation: listen to how people in Buenos Aires speak vs. textbook Spanish. Local greetings: ¡Che, boludo!, ¿Qué onda?, ¿Todo bien, loco?. The rhythm and melody of undefined is unique — practice mimicking the intonation." },
        { id: "esar_a1_u1_l2", title: "Essential Greetings", description: "Say hello, goodbye, and 'how are you' the undefined way", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in undefined: ¡Che, boludo!, ¿Qué onda?, ¿Todo bien, loco?. These are what REAL people say — not the textbook '¿Cómo está usted?' Learn when to use each one (friends vs. elders vs. strangers)." },
        { id: "esar_a1_u1_l3", title: "Survival Slang", description: "The 10 words you NEED on day one in Buenos Aires", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Essential slang: che (hey/dude), boludo (dude/idiot), re (very/super), posta (for real), morfar (to eat). These words are used DAILY — you'll hear them in every conversation. Without these, you'll sound like a textbook, not a real speaker." },
        { id: "esar_a1_u1_l4", title: "Numbers & Money", description: "Count, pay, and understand prices at local shops", category: "grammar", level: "A1", duration: 7, xp: 20, order: 4, culturalHint: "Money talk: learn how locals discuss prices. At a Bariloche market, you'll hear slang for money. Practice: '¿Cuánto cuesta?' and local variations. Food prices for asado and empanadas." },
        { id: "esar_a1_u1_l5", title: "At the Local Spot", description: "Order food and drinks like a local in Buenos Aires", category: "listening", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "At a local restaurant/food stand: order asado, empanadas, and milanesa. Listen to how the server speaks — fast, with local slang. Practice: 'Dame un/una...' and 'Quiero probar el/la...'" },
      ],
    },
    {
      id: "esar_a1_u2", title: "La Familia — Family & Home", level: "A1", order: 2,
      description: "Family life, home vocabulary, and daily routines in undefined culture",
      lessons: [
        { id: "esar_a1_u2_l1", title: "Family Terms", description: "How families work in undefined culture — roles, respect, closeness", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1, culturalHint: "Family in undefined culture is EVERYTHING. Extended family lives close together. Learn: abuela/abuelo, tío/tía, primo/prima, compadre/comadre. Family gatherings involve asado and tango. mate sharing ritual is a family ritual." },
        { id: "esar_a1_u2_l2", title: "Present Tense — Daily Life", description: "Describe your daily routine using local expressions", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2, culturalHint: "Daily life in Buenos Aires: 'Me levanto temprano', 'Desayuno empanadas', 'Voy al trabajo'. Local twist: people say 'che (hey/dude)' when greeting coworkers. The rhythm of daily life includes mate sharing ritual." },
        { id: "esar_a1_u2_l3", title: "My Neighborhood", description: "Describe where you live — local landmarks and shops", category: "writing", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Describe a Buenos Aires neighborhood: la bodega/tienda, la panadería, el parque. Include local spots where people eat choripán and dance tango. Use: 'En mi barrio hay...', 'Cerca de mi casa está...'" },
        { id: "esar_a1_u2_l4", title: "Home & Living", description: "Rooms, furniture, and how homes look in undefined", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Homes in Buenos Aires vs Mendoza: learn local terms for rooms and furniture. Many families have a patio/balcón where they gather. Music (tango, milonga) plays from the kitchen while cooking asado." },
        { id: "esar_a1_u2_l5", title: "Reading: A Text Message", description: "Understand informal texts with local slang and abbreviations", category: "reading", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "Read a WhatsApp chat between friends planning to meet up. Slang: posta (for real), morfar (to eat), laburar (to work), guita (money). Abbreviations and emojis used locally. The conversation is about going to eat dulce de leche and maybe dancing milonga." },
      ],
    },
    {
      id: "esar_a2_u3", title: "Moviéndose — Getting Around", level: "A2", order: 3,
      description: "Transportation, directions, and navigating Buenos Aires",
      lessons: [
        { id: "esar_a2_u3_l1", title: "Directions & Navigation", description: "Ask for and give directions in Buenos Aires", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate Buenos Aires: 'Disculpe, ¿cómo llego a...?', '¿Dónde queda...?' Local landmarks: learn the names of famous streets, plazas, and neighborhoods. Locals give directions using landmarks, not street numbers." },
        { id: "esar_a2_u3_l2", title: "Past Tense — What Happened", description: "Tell stories about what you did using local expressions", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2, culturalHint: "Tell stories the undefined way: 'Ayer fui a Mendoza', 'Comí asado increíble', 'Bailé tango toda la noche'. Use local filler words and expressions. El que no llora no mama — learn this proverb in context." },
        { id: "esar_a2_u3_l3", title: "Local Transportation", description: "Buses, taxis, and getting around like a local", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Transportation in Buenos Aires: learn local names for bus, taxi, rideshare. How to hail a cab, negotiate fares, and understand route names. In undefined, the bus might be called differently than in textbook Spanish." },
        { id: "esar_a2_u3_l4", title: "Reading: A Travel Blog", description: "Follow a traveler's story through Buenos Aires, Mendoza, Córdoba, Bariloche, Ushuaia", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Read about a trip through Buenos Aires, Mendoza, and Córdoba. The blogger tries asado, dances tango, and learns local slang. Vocabulary: hotel, aeropuerto, maleta, pasaporte, aventura." },
        { id: "esar_a2_u3_l5", title: "Write About Your Trip", description: "Describe a real or imaginary trip to undefined", category: "writing", level: "A2", duration: 12, xp: 35, order: 5, culturalHint: "Write about visiting Buenos Aires: what you ate (asado, empanadas, milanesa), what you saw, who you met. Use past tense and local expressions. Mention asado every Sunday and how it felt to experience undefined culture firsthand." },
      ],
    },
    {
      id: "esar_a2_u4", title: "La Comida — Food & Drink", level: "A2", order: 4,
      description: "undefined cuisine, ordering, cooking vocabulary, and food culture",
      lessons: [
        { id: "esar_a2_u4_l1", title: "Food Vocabulary", description: "Essential dishes: asado, empanadas, milanesa, choripán", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1, culturalHint: "undefined food: asado, empanadas, milanesa, choripán, dulce de leche, alfajores. Food is central to undefined culture — every gathering revolves around eating together. Learn the ingredients, how dishes are prepared, and when they're eaten (breakfast vs. lunch vs. dinner)." },
        { id: "esar_a2_u4_l2", title: "Ordering Food", description: "Order at a restaurant, street food stand, or market", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "At a Buenos Aires restaurant: 'Me da un/una asado', '¿Qué me recomienda?', 'La cuenta, por favor'. Street food: point and say '¡Deme uno de esos!' Learn local tipping customs and how to compliment the food." },
        { id: "esar_a2_u4_l3", title: "Comparisons & Opinions", description: "Compare foods and express preferences using local phrases", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3, culturalHint: "Compare: 'asado es mejor que...', 'empanadas es más rico que...'. Express opinions the local way: '¡Está buenísimo!' Learn food adjectives: picante, dulce, salado, crujiente." },
        { id: "esar_a2_u4_l4", title: "Reading: A Recipe", description: "Follow a traditional recipe for asado", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Recipe for asado — the national dish. Ingredients, steps, and cooking tips passed down through generations. Learn kitchen vocabulary: picar, freír, hervir, mezclar, sazonar. Every family has their own secret version." },
        { id: "esar_a2_u4_l5", title: "Listening: At the Market", description: "Understand vendors at a local market in Buenos Aires", category: "listening", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "At the market in Buenos Aires: vendors shout prices, offer samples, and negotiate. Listen for: '¡Lleve, lleve!', '¿Qué va a llevar?', '¡Está fresco!' Buy ingredients for asado: learn fruit, vegetable, and meat names." },
      ],
    },
    {
      id: "esar_b1_u5", title: "Cultura y Sociedad — Culture & Society", level: "B1", order: 5,
      description: "undefined traditions, holidays, music, and social dynamics",
      lessons: [
        { id: "esar_b1_u5_l1", title: "Music & Dance", description: "tango, milonga, chacarera, zamba, cumbia villera — rhythm, history, and vocabulary", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "undefined music: tango, milonga, chacarera, zamba, cumbia villera. Artists: Carlos Gardel, Astor Piazzolla, Mercedes Sosa. Learn the vocabulary of music and dance: ritmo, compás, letra, estribillo, bailar, mover las caderas. tango originated in Mendoza and represents undefined identity." },
        { id: "esar_b1_u5_l2", title: "Subjunctive Mood", description: "Express wishes, doubts, and emotions the undefined way", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2, culturalHint: "Subjunctive in real life: 'Ojalá que Día del Tango sea increíble este año', 'Quiero que pruebes asado', 'Dudo que encuentres mejor empanadas fuera de Buenos Aires'. The subjunctive is used MORE in spoken undefined than textbooks suggest." },
        { id: "esar_b1_u5_l3", title: "Holidays & Traditions", description: "Día del Tango, Vendimia (Mendoza), Carnaval del País (Gualeguaychú), Día de la Tradición — how they're celebrated", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3, culturalHint: "Día del Tango: mate sharing ritual. asado every Sunday. fútbol passion. During Vendimia (Mendoza), families gather to eat alfajores and dance tango. Learn celebration vocabulary: fiesta, desfile, disfraz, fuegos artificiales, tradición." },
        { id: "esar_b1_u5_l4", title: "Reading: Cultural Article", description: "Read about undefined society, values, and modern life", category: "reading", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Read about modern life in Buenos Aires: the balance between tradition and modernity. Topics: family values, work culture, social gatherings, mate sharing ritual. Proverb: 'El que no llora no mama' — discuss what it means in undefined culture." },
        { id: "esar_b1_u5_l5", title: "Write an Opinion", description: "Express your views on undefined culture and traditions", category: "writing", level: "B1", duration: 15, xp: 40, order: 5, culturalHint: "Write about what makes undefined culture unique: the food (asado), the music (tango), the people, the traditions. Use opinion phrases: 'En mi opinión...', 'Creo que...', 'Lo que más me gusta es...'. Reference: 'A otra cosa, mariposa'." },
      ],
    },
    {
      id: "esar_b1_u6", title: "Vida Profesional — Work & Business", level: "B1", order: 6,
      description: "Professional communication and workplace culture in undefined",
      lessons: [
        { id: "esar_b1_u6_l1", title: "Work Vocabulary", description: "Office terms, job titles, and professional phrases", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1, culturalHint: "Workplace in Buenos Aires: learn local terms for jobs, offices, and professional interactions. How colleagues greet each other (often with ¡Che, boludo! even at work!). Business culture: punctuality, dress code, hierarchy." },
        { id: "esar_b1_u6_l2", title: "Formal vs Informal", description: "When to use tú/usted and formal register in undefined", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2, culturalHint: "In undefined: when do you use 'usted' vs 'tú'? It varies by country! In Buenos Aires, the rules might surprise you. Learn formal email openings, professional phone calls, and how to address your boss vs. coworkers." },
        { id: "esar_b1_u6_l3", title: "Job Interview", description: "Practice a job interview in undefined style", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3, culturalHint: "Job interview in Buenos Aires: 'Cuénteme sobre usted', 'Mis fortalezas son...', '¿Cuál es el salario?'. Local customs: how to dress, arrive, greet the interviewer. In undefined culture, personal connections (networking) matter enormously." },
        { id: "esar_b1_u6_l4", title: "Reading: Job Posting", description: "Understand a job ad from a Buenos Aires company", category: "reading", level: "B1", duration: 10, xp: 30, order: 4, culturalHint: "Read a job posting from Buenos Aires: requisitos (requirements), experiencia (experience), beneficios (benefits), salario (salary). Local job platforms and how the hiring process works in undefined. Key industries in Buenos Aires." },
        { id: "esar_b1_u6_l5", title: "Write a Cover Letter", description: "Compose a professional letter for a undefined company", category: "writing", level: "B1", duration: 15, xp: 45, order: 5, culturalHint: "Write a cover letter for a job in Buenos Aires: formal greeting, why you're interested, your qualifications, closing. Use formal undefined: 'Estimado/a...', 'Me dirijo a usted...', 'Quedo a su disposición...'. Local business etiquette matters." },
      ],
    },
    {
      id: "esar_b2_u7", title: "Expresión Avanzada — Advanced Expression", level: "B2", order: 7,
      description: "Idioms, humor, slang mastery, and nuanced undefined communication",
      lessons: [
        { id: "esar_b2_u7_l1", title: "Idioms & Proverbs", description: "El que no llora no mama | A otra cosa, mariposa | Más vale maña que fuerza", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1, culturalHint: "undefined proverbs: El que no llora no mama. A otra cosa, mariposa. Más vale maña que fuerza. These are used in DAILY conversation — knowing them makes you sound fluent. Learn the context: when to use each one, what situation it fits, and how locals react when you use them correctly." },
        { id: "esar_b2_u7_l2", title: "Advanced Slang", description: "Deep slang that only locals know: laburar, guita, mina", category: "vocabulary", level: "B2", duration: 12, xp: 40, order: 2, culturalHint: "Advanced undefined slang: laburar (to work), guita (money), mina (girl), pibe (guy), afanar (to steal). These are the words that make locals say 'wow, you really speak undefined!' Use them in context — wrong usage sounds worse than not knowing them." },
        { id: "esar_b2_u7_l3", title: "Conditional & Hypothetical", description: "'If I were in Buenos Aires...' — complex sentence structures", category: "grammar", level: "B2", duration: 15, xp: 45, order: 3, culturalHint: "Hypotheticals in undefined: 'Si pudiera vivir en Buenos Aires, comería asado todos los días', 'Si hubiera ido a Día del Tango, habría bailado tango'. The conditional is used differently in undefined vs. textbook Spanish." },
        { id: "esar_b2_u7_l4", title: "Listening: Stand-Up Comedy", description: "Understand humor, wordplay, and cultural references", category: "listening", level: "B2", duration: 12, xp: 40, order: 4, culturalHint: "undefined humor: wordplay, cultural references, and timing. Comedians from Buenos Aires use local slang, accents, and cultural stereotypes. Understanding humor = understanding the culture. Listen for: double meanings, irony, and undefined-specific jokes." },
        { id: "esar_b2_u7_l5", title: "Write a Story", description: "Compose a short story set in Buenos Aires using advanced vocabulary", category: "writing", level: "B2", duration: 18, xp: 50, order: 5, culturalHint: "Write a short story set in Buenos Aires: a character navigates daily life, eats asado, dances tango, uses slang (che (hey/dude), boludo (dude/idiot)). Include a proverb: 'Más vale maña que fuerza'. Make it feel authentically undefined." },
      ],
    },
    {
      id: "esar_c1_u8", title: "Dominio Cultural — Cultural Mastery", level: "C1", order: 8,
      description: "Deep cultural fluency, literature, history, and sophisticated undefined",
      lessons: [
        { id: "esar_c1_u8_l1", title: "Literature & Arts", description: "undefined writers, poets, and artistic movements", category: "reading", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "undefined literature and arts: famous writers, poets, and artists from Buenos Aires. How undefined art reflects the culture — themes of identity, family, music (tango), and social issues. Read excerpts and discuss their cultural significance." },
        { id: "esar_c1_u8_l2", title: "Complex Grammar Mastery", description: "Subjunctive perfection, passive voice, and literary tenses", category: "grammar", level: "C1", duration: 18, xp: 50, order: 2, culturalHint: "Master the subjunctive in all its forms as used in undefined: 'Hubiera querido que...', 'Ojalá hubiera podido ir a Día del Tango'. Literary tenses used in undefined journalism and literature. The pluscuamperfecto del subjuntivo in real conversation." },
        { id: "esar_c1_u8_l3", title: "Debate & Persuasion", description: "Argue, persuade, and discuss complex topics", category: "speaking", level: "C1", duration: 15, xp: 45, order: 3, culturalHint: "Debate topics relevant to undefined: politics, economy, culture, emigration, tradition vs. modernity. Use sophisticated connectors: 'No obstante...', 'Sin embargo...', 'A pesar de que...'. Persuade someone to visit Buenos Aires and try asado." },
        { id: "esar_c1_u8_l4", title: "Listening: Documentary", description: "Understand a documentary about undefined history and society", category: "listening", level: "C1", duration: 15, xp: 45, order: 4, culturalHint: "Watch/listen to a documentary about undefined: history, social movements, cultural evolution. How tango and Carlos Gardel shaped national identity. Advanced vocabulary: sociedad, identidad, patrimonio, herencia cultural, diáspora." },
        { id: "esar_c1_u8_l5", title: "Academic Writing", description: "Write an essay analyzing undefined cultural identity", category: "writing", level: "C1", duration: 20, xp: 55, order: 5, culturalHint: "Write an academic essay: 'La identidad cultural en el siglo XXI'. Analyze how tango, asado, and mate sharing ritual define the culture. Use academic register with thesis, arguments, and conclusion." },
      ],
    },
    {
      id: "esar_c2_u9", title: "Fluidez Nativa — Native Fluency", level: "C2", order: 9,
      description: "Think, dream, and create in undefined at native level",
      lessons: [
        { id: "esar_c2_u9_l1", title: "Regional Micro-Dialects", description: "How Buenos Aires vs Mendoza vs Córdoba differ", category: "listening", level: "C2", duration: 15, xp: 50, order: 1, culturalHint: "Micro-dialects within undefined: how people in Buenos Aires sound different from Mendoza and Córdoba. Vocabulary differences, pronunciation shifts, and attitude changes. A native can tell which city you learned in by your accent." },
        { id: "esar_c2_u9_l2", title: "Creative Writing", description: "Write poetry or prose in authentic undefined voice", category: "writing", level: "C2", duration: 20, xp: 55, order: 2, culturalHint: "Write creatively in undefined: a poem about Buenos Aires, a short story about mate sharing ritual, or a song lyric in the style of Carlos Gardel. Use all the slang, proverbs, and cultural references you've learned. Make it sound like a native wrote it." },
        { id: "esar_c2_u9_l3", title: "Simultaneous Interpretation", description: "Real-time translation between English and undefined", category: "speaking", level: "C2", duration: 18, xp: 55, order: 3, culturalHint: "Practice simultaneous interpretation: listen to English and produce undefined in real-time, capturing not just meaning but cultural nuance. Translate idioms into equivalent undefined expressions, not literal translations. 'El que no llora no mama' has no direct English equivalent." },
        { id: "esar_c2_u9_l4", title: "Cultural Mediation", description: "Bridge cultural gaps between undefined and other cultures", category: "reading", level: "C2", duration: 15, xp: 50, order: 4, culturalHint: "Cultural mediation: explain undefined customs to outsiders and vice versa. Why is mate sharing ritual important? What does asado represent beyond food? How do Día del Tango celebrations reflect national values? Navigate cross-cultural misunderstandings." },
        { id: "esar_c2_u9_l5", title: "Mastery Assessment", description: "Prove native-level fluency across all skills", category: "grammar", level: "C2", duration: 20, xp: 60, order: 5, culturalHint: "Final assessment: demonstrate mastery of undefined across reading, writing, speaking, and listening. Use advanced grammar, regional slang (che, boludo, re), cultural references, and proverbs naturally. You should be indistinguishable from a native undefined speaker." },
      ],
    },
  ],
};

export const SPANISH_PERUVIAN: LanguageCurriculum = {
  code: "es-PE",
  name: "Peruvian Spanish",
  flag: "🇵🇪",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 90,
  units: [
    {
      id: "espe_a1_u1", title: "¡Habla! — First Steps", level: "A1", order: 1,
      description: "undefined greetings, pronunciation, and essential survival phrases",
      lessons: [
        { id: "espe_a1_u1_l1", title: "Sounds & Pronunciation", description: "How undefined sounds different — dropped letters, unique rhythm", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "undefined pronunciation: listen to how people in Lima speak vs. textbook Spanish. Local greetings: ¡Habla, causa!, ¿Qué tal, brother?, ¡Hola, pe!. The rhythm and melody of undefined is unique — practice mimicking the intonation." },
        { id: "espe_a1_u1_l2", title: "Essential Greetings", description: "Say hello, goodbye, and 'how are you' the undefined way", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in undefined: ¡Habla, causa!, ¿Qué tal, brother?, ¡Hola, pe!. These are what REAL people say — not the textbook '¿Cómo está usted?' Learn when to use each one (friends vs. elders vs. strangers)." },
        { id: "espe_a1_u1_l3", title: "Survival Slang", description: "The 10 words you NEED on day one in Lima", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Essential slang: causa (buddy), pe (pues), chévere (cool), jato (house), pata (friend). These words are used DAILY — you'll hear them in every conversation. Without these, you'll sound like a textbook, not a real speaker." },
        { id: "espe_a1_u1_l4", title: "Numbers & Money", description: "Count, pay, and understand prices at local shops", category: "grammar", level: "A1", duration: 7, xp: 20, order: 4, culturalHint: "Money talk: learn how locals discuss prices. At a Trujillo market, you'll hear slang for money. Practice: '¿Cuánto cuesta?' and local variations. Food prices for ceviche and lomo saltado." },
        { id: "espe_a1_u1_l5", title: "At the Local Spot", description: "Order food and drinks like a local in Lima", category: "listening", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "At a local restaurant/food stand: order ceviche, lomo saltado, and ají de gallina. Listen to how the server speaks — fast, with local slang. Practice: 'Dame un/una...' and 'Quiero probar el/la...'" },
      ],
    },
    {
      id: "espe_a1_u2", title: "La Familia — Family & Home", level: "A1", order: 2,
      description: "Family life, home vocabulary, and daily routines in undefined culture",
      lessons: [
        { id: "espe_a1_u2_l1", title: "Family Terms", description: "How families work in undefined culture — roles, respect, closeness", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1, culturalHint: "Family in undefined culture is EVERYTHING. Extended family lives close together. Learn: abuela/abuelo, tío/tía, primo/prima, compadre/comadre. Family gatherings involve ceviche and marinera. ceviche Sundays is a family ritual." },
        { id: "espe_a1_u2_l2", title: "Present Tense — Daily Life", description: "Describe your daily routine using local expressions", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2, culturalHint: "Daily life in Lima: 'Me levanto temprano', 'Desayuno lomo saltado', 'Voy al trabajo'. Local twist: people say 'causa (buddy)' when greeting coworkers. The rhythm of daily life includes ceviche Sundays." },
        { id: "espe_a1_u2_l3", title: "My Neighborhood", description: "Describe where you live — local landmarks and shops", category: "writing", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Describe a Lima neighborhood: la bodega/tienda, la panadería, el parque. Include local spots where people eat causa limeña and dance marinera. Use: 'En mi barrio hay...', 'Cerca de mi casa está...'" },
        { id: "espe_a1_u2_l4", title: "Home & Living", description: "Rooms, furniture, and how homes look in undefined", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Homes in Lima vs Cusco: learn local terms for rooms and furniture. Many families have a patio/balcón where they gather. Music (marinera, festejo) plays from the kitchen while cooking ceviche." },
        { id: "espe_a1_u2_l5", title: "Reading: A Text Message", description: "Understand informal texts with local slang and abbreviations", category: "reading", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "Read a WhatsApp chat between friends planning to meet up. Slang: jato (house), pata (friend), bacán (great), chamba (work). Abbreviations and emojis used locally. The conversation is about going to eat anticuchos and maybe dancing festejo." },
      ],
    },
    {
      id: "espe_a2_u3", title: "Moviéndose — Getting Around", level: "A2", order: 3,
      description: "Transportation, directions, and navigating Lima",
      lessons: [
        { id: "espe_a2_u3_l1", title: "Directions & Navigation", description: "Ask for and give directions in Lima", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate Lima: 'Disculpe, ¿cómo llego a...?', '¿Dónde queda...?' Local landmarks: learn the names of famous streets, plazas, and neighborhoods. Locals give directions using landmarks, not street numbers." },
        { id: "espe_a2_u3_l2", title: "Past Tense — What Happened", description: "Tell stories about what you did using local expressions", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2, culturalHint: "Tell stories the undefined way: 'Ayer fui a Cusco', 'Comí ceviche increíble', 'Bailé marinera toda la noche'. Use local filler words and expressions. El que no arriesga no gana — learn this proverb in context." },
        { id: "espe_a2_u3_l3", title: "Local Transportation", description: "Buses, taxis, and getting around like a local", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Transportation in Lima: learn local names for bus, taxi, rideshare. How to hail a cab, negotiate fares, and understand route names. In undefined, the bus might be called differently than in textbook Spanish." },
        { id: "espe_a2_u3_l4", title: "Reading: A Travel Blog", description: "Follow a traveler's story through Lima, Cusco, Arequipa, Trujillo, Iquitos", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Read about a trip through Lima, Cusco, and Arequipa. The blogger tries ceviche, dances marinera, and learns local slang. Vocabulary: hotel, aeropuerto, maleta, pasaporte, aventura." },
        { id: "espe_a2_u3_l5", title: "Write About Your Trip", description: "Describe a real or imaginary trip to undefined", category: "writing", level: "A2", duration: 12, xp: 35, order: 5, culturalHint: "Write about visiting Lima: what you ate (ceviche, lomo saltado, ají de gallina), what you saw, who you met. Use past tense and local expressions. Mention Pisco Sour toasts and how it felt to experience undefined culture firsthand." },
      ],
    },
    {
      id: "espe_a2_u4", title: "La Comida — Food & Drink", level: "A2", order: 4,
      description: "undefined cuisine, ordering, cooking vocabulary, and food culture",
      lessons: [
        { id: "espe_a2_u4_l1", title: "Food Vocabulary", description: "Essential dishes: ceviche, lomo saltado, ají de gallina, causa limeña", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1, culturalHint: "undefined food: ceviche, lomo saltado, ají de gallina, causa limeña, anticuchos, papa a la huancaína. Food is central to undefined culture — every gathering revolves around eating together. Learn the ingredients, how dishes are prepared, and when they're eaten (breakfast vs. lunch vs. dinner)." },
        { id: "espe_a2_u4_l2", title: "Ordering Food", description: "Order at a restaurant, street food stand, or market", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "At a Lima restaurant: 'Me da un/una ceviche', '¿Qué me recomienda?', 'La cuenta, por favor'. Street food: point and say '¡Deme uno de esos!' Learn local tipping customs and how to compliment the food." },
        { id: "espe_a2_u4_l3", title: "Comparisons & Opinions", description: "Compare foods and express preferences using local phrases", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3, culturalHint: "Compare: 'ceviche es mejor que...', 'lomo saltado es más rico que...'. Express opinions the local way: '¡Está chévere!' Learn food adjectives: picante, dulce, salado, crujiente." },
        { id: "espe_a2_u4_l4", title: "Reading: A Recipe", description: "Follow a traditional recipe for ceviche", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Recipe for ceviche — the national dish. Ingredients, steps, and cooking tips passed down through generations. Learn kitchen vocabulary: picar, freír, hervir, mezclar, sazonar. Every family has their own secret version." },
        { id: "espe_a2_u4_l5", title: "Listening: At the Market", description: "Understand vendors at a local market in Lima", category: "listening", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "At the market in Lima: vendors shout prices, offer samples, and negotiate. Listen for: '¡Lleve, lleve!', '¿Qué va a llevar?', '¡Está fresco!' Buy ingredients for ceviche: learn fruit, vegetable, and meat names." },
      ],
    },
    {
      id: "espe_b1_u5", title: "Cultura y Sociedad — Culture & Society", level: "B1", order: 5,
      description: "undefined traditions, holidays, music, and social dynamics",
      lessons: [
        { id: "espe_b1_u5_l1", title: "Music & Dance", description: "marinera, festejo, huayno, vals criollo, zamacueca — rhythm, history, and vocabulary", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "undefined music: marinera, festejo, huayno, vals criollo, zamacueca. Artists: Susana Baca, Eva Ayllón, Gian Marco. Learn the vocabulary of music and dance: ritmo, compás, letra, estribillo, bailar, mover las caderas. marinera originated in Cusco and represents undefined identity." },
        { id: "espe_b1_u5_l2", title: "Subjunctive Mood", description: "Express wishes, doubts, and emotions the undefined way", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2, culturalHint: "Subjunctive in real life: 'Ojalá que Inti Raymi sea increíble este año', 'Quiero que pruebes ceviche', 'Dudo que encuentres mejor lomo saltado fuera de Lima'. The subjunctive is used MORE in spoken undefined than textbooks suggest." },
        { id: "espe_b1_u5_l3", title: "Holidays & Traditions", description: "Inti Raymi, Señor de los Milagros, Fiesta de la Candelaria, Vendimia de Ica — how they're celebrated", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3, culturalHint: "Inti Raymi: ceviche Sundays. Pisco Sour toasts. Mistura food festival. During Señor de los Milagros, families gather to eat papa a la huancaína and dance marinera. Learn celebration vocabulary: fiesta, desfile, disfraz, fuegos artificiales, tradición." },
        { id: "espe_b1_u5_l4", title: "Reading: Cultural Article", description: "Read about undefined society, values, and modern life", category: "reading", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Read about modern life in Lima: the balance between tradition and modernity. Topics: family values, work culture, social gatherings, ceviche Sundays. Proverb: 'El que no arriesga no gana' — discuss what it means in undefined culture." },
        { id: "espe_b1_u5_l5", title: "Write an Opinion", description: "Express your views on undefined culture and traditions", category: "writing", level: "B1", duration: 15, xp: 40, order: 5, culturalHint: "Write about what makes undefined culture unique: the food (ceviche), the music (marinera), the people, the traditions. Use opinion phrases: 'En mi opinión...', 'Creo que...', 'Lo que más me gusta es...'. Reference: 'Barriga llena, corazón contento'." },
      ],
    },
    {
      id: "espe_b1_u6", title: "Vida Profesional — Work & Business", level: "B1", order: 6,
      description: "Professional communication and workplace culture in undefined",
      lessons: [
        { id: "espe_b1_u6_l1", title: "Work Vocabulary", description: "Office terms, job titles, and professional phrases", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1, culturalHint: "Workplace in Lima: learn local terms for jobs, offices, and professional interactions. How colleagues greet each other (often with ¡Habla, causa! even at work!). Business culture: punctuality, dress code, hierarchy." },
        { id: "espe_b1_u6_l2", title: "Formal vs Informal", description: "When to use tú/usted and formal register in undefined", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2, culturalHint: "In undefined: when do you use 'usted' vs 'tú'? It varies by country! In Lima, the rules might surprise you. Learn formal email openings, professional phone calls, and how to address your boss vs. coworkers." },
        { id: "espe_b1_u6_l3", title: "Job Interview", description: "Practice a job interview in undefined style", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3, culturalHint: "Job interview in Lima: 'Cuénteme sobre usted', 'Mis fortalezas son...', '¿Cuál es el salario?'. Local customs: how to dress, arrive, greet the interviewer. In undefined culture, personal connections (networking) matter enormously." },
        { id: "espe_b1_u6_l4", title: "Reading: Job Posting", description: "Understand a job ad from a Lima company", category: "reading", level: "B1", duration: 10, xp: 30, order: 4, culturalHint: "Read a job posting from Lima: requisitos (requirements), experiencia (experience), beneficios (benefits), salario (salary). Local job platforms and how the hiring process works in undefined. Key industries in Lima." },
        { id: "espe_b1_u6_l5", title: "Write a Cover Letter", description: "Compose a professional letter for a undefined company", category: "writing", level: "B1", duration: 15, xp: 45, order: 5, culturalHint: "Write a cover letter for a job in Lima: formal greeting, why you're interested, your qualifications, closing. Use formal undefined: 'Estimado/a...', 'Me dirijo a usted...', 'Quedo a su disposición...'. Local business etiquette matters." },
      ],
    },
    {
      id: "espe_b2_u7", title: "Expresión Avanzada — Advanced Expression", level: "B2", order: 7,
      description: "Idioms, humor, slang mastery, and nuanced undefined communication",
      lessons: [
        { id: "espe_b2_u7_l1", title: "Idioms & Proverbs", description: "El que no arriesga no gana | Barriga llena, corazón contento | Más vale tarde que nunca", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1, culturalHint: "undefined proverbs: El que no arriesga no gana. Barriga llena, corazón contento. Más vale tarde que nunca. These are used in DAILY conversation — knowing them makes you sound fluent. Learn the context: when to use each one, what situation it fits, and how locals react when you use them correctly." },
        { id: "espe_b2_u7_l2", title: "Advanced Slang", description: "Deep slang that only locals know: bacán, chamba, flaca/flaco", category: "vocabulary", level: "B2", duration: 12, xp: 40, order: 2, culturalHint: "Advanced undefined slang: bacán (great), chamba (work), flaca/flaco (girlfriend/boyfriend), yapa (extra/bonus), al toque (right away). These are the words that make locals say 'wow, you really speak undefined!' Use them in context — wrong usage sounds worse than not knowing them." },
        { id: "espe_b2_u7_l3", title: "Conditional & Hypothetical", description: "'If I were in Lima...' — complex sentence structures", category: "grammar", level: "B2", duration: 15, xp: 45, order: 3, culturalHint: "Hypotheticals in undefined: 'Si pudiera vivir en Lima, comería ceviche todos los días', 'Si hubiera ido a Inti Raymi, habría bailado marinera'. The conditional is used differently in undefined vs. textbook Spanish." },
        { id: "espe_b2_u7_l4", title: "Listening: Stand-Up Comedy", description: "Understand humor, wordplay, and cultural references", category: "listening", level: "B2", duration: 12, xp: 40, order: 4, culturalHint: "undefined humor: wordplay, cultural references, and timing. Comedians from Lima use local slang, accents, and cultural stereotypes. Understanding humor = understanding the culture. Listen for: double meanings, irony, and undefined-specific jokes." },
        { id: "espe_b2_u7_l5", title: "Write a Story", description: "Compose a short story set in Lima using advanced vocabulary", category: "writing", level: "B2", duration: 18, xp: 50, order: 5, culturalHint: "Write a short story set in Lima: a character navigates daily life, eats ceviche, dances marinera, uses slang (causa (buddy), pe (pues)). Include a proverb: 'Más vale tarde que nunca'. Make it feel authentically undefined." },
      ],
    },
    {
      id: "espe_c1_u8", title: "Dominio Cultural — Cultural Mastery", level: "C1", order: 8,
      description: "Deep cultural fluency, literature, history, and sophisticated undefined",
      lessons: [
        { id: "espe_c1_u8_l1", title: "Literature & Arts", description: "undefined writers, poets, and artistic movements", category: "reading", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "undefined literature and arts: famous writers, poets, and artists from Lima. How undefined art reflects the culture — themes of identity, family, music (marinera), and social issues. Read excerpts and discuss their cultural significance." },
        { id: "espe_c1_u8_l2", title: "Complex Grammar Mastery", description: "Subjunctive perfection, passive voice, and literary tenses", category: "grammar", level: "C1", duration: 18, xp: 50, order: 2, culturalHint: "Master the subjunctive in all its forms as used in undefined: 'Hubiera querido que...', 'Ojalá hubiera podido ir a Inti Raymi'. Literary tenses used in undefined journalism and literature. The pluscuamperfecto del subjuntivo in real conversation." },
        { id: "espe_c1_u8_l3", title: "Debate & Persuasion", description: "Argue, persuade, and discuss complex topics", category: "speaking", level: "C1", duration: 15, xp: 45, order: 3, culturalHint: "Debate topics relevant to undefined: politics, economy, culture, emigration, tradition vs. modernity. Use sophisticated connectors: 'No obstante...', 'Sin embargo...', 'A pesar de que...'. Persuade someone to visit Lima and try ceviche." },
        { id: "espe_c1_u8_l4", title: "Listening: Documentary", description: "Understand a documentary about undefined history and society", category: "listening", level: "C1", duration: 15, xp: 45, order: 4, culturalHint: "Watch/listen to a documentary about undefined: history, social movements, cultural evolution. How marinera and Susana Baca shaped national identity. Advanced vocabulary: sociedad, identidad, patrimonio, herencia cultural, diáspora." },
        { id: "espe_c1_u8_l5", title: "Academic Writing", description: "Write an essay analyzing undefined cultural identity", category: "writing", level: "C1", duration: 20, xp: 55, order: 5, culturalHint: "Write an academic essay: 'La identidad cultural en el siglo XXI'. Analyze how marinera, ceviche, and ceviche Sundays define the culture. Use academic register with thesis, arguments, and conclusion." },
      ],
    },
    {
      id: "espe_c2_u9", title: "Fluidez Nativa — Native Fluency", level: "C2", order: 9,
      description: "Think, dream, and create in undefined at native level",
      lessons: [
        { id: "espe_c2_u9_l1", title: "Regional Micro-Dialects", description: "How Lima vs Cusco vs Arequipa differ", category: "listening", level: "C2", duration: 15, xp: 50, order: 1, culturalHint: "Micro-dialects within undefined: how people in Lima sound different from Cusco and Arequipa. Vocabulary differences, pronunciation shifts, and attitude changes. A native can tell which city you learned in by your accent." },
        { id: "espe_c2_u9_l2", title: "Creative Writing", description: "Write poetry or prose in authentic undefined voice", category: "writing", level: "C2", duration: 20, xp: 55, order: 2, culturalHint: "Write creatively in undefined: a poem about Lima, a short story about ceviche Sundays, or a song lyric in the style of Susana Baca. Use all the slang, proverbs, and cultural references you've learned. Make it sound like a native wrote it." },
        { id: "espe_c2_u9_l3", title: "Simultaneous Interpretation", description: "Real-time translation between English and undefined", category: "speaking", level: "C2", duration: 18, xp: 55, order: 3, culturalHint: "Practice simultaneous interpretation: listen to English and produce undefined in real-time, capturing not just meaning but cultural nuance. Translate idioms into equivalent undefined expressions, not literal translations. 'El que no arriesga no gana' has no direct English equivalent." },
        { id: "espe_c2_u9_l4", title: "Cultural Mediation", description: "Bridge cultural gaps between undefined and other cultures", category: "reading", level: "C2", duration: 15, xp: 50, order: 4, culturalHint: "Cultural mediation: explain undefined customs to outsiders and vice versa. Why is ceviche Sundays important? What does ceviche represent beyond food? How do Inti Raymi celebrations reflect national values? Navigate cross-cultural misunderstandings." },
        { id: "espe_c2_u9_l5", title: "Mastery Assessment", description: "Prove native-level fluency across all skills", category: "grammar", level: "C2", duration: 20, xp: 60, order: 5, culturalHint: "Final assessment: demonstrate mastery of undefined across reading, writing, speaking, and listening. Use advanced grammar, regional slang (causa, pe, chévere), cultural references, and proverbs naturally. You should be indistinguishable from a native undefined speaker." },
      ],
    },
  ],
};

export const SPANISH_CHILEAN: LanguageCurriculum = {
  code: "es-CL",
  name: "Chilean Spanish",
  flag: "🇨🇱",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 90,
  units: [
    {
      id: "escl_a1_u1", title: "¡Hola! — First Steps", level: "A1", order: 1,
      description: "undefined greetings, pronunciation, and essential survival phrases",
      lessons: [
        { id: "escl_a1_u1_l1", title: "Sounds & Pronunciation", description: "How undefined sounds different — dropped letters, unique rhythm", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "undefined pronunciation: listen to how people in Santiago speak vs. textbook Spanish. Local greetings: ¡Hola, weón!, ¿Cachai?, ¿Cómo estái?. The rhythm and melody of undefined is unique — practice mimicking the intonation." },
        { id: "escl_a1_u1_l2", title: "Essential Greetings", description: "Say hello, goodbye, and 'how are you' the undefined way", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in undefined: ¡Hola, weón!, ¿Cachai?, ¿Cómo estái?. These are what REAL people say — not the textbook '¿Cómo está usted?' Learn when to use each one (friends vs. elders vs. strangers)." },
        { id: "escl_a1_u1_l3", title: "Survival Slang", description: "The 10 words you NEED on day one in Santiago", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Essential slang: weón/huevón (dude), cachai (you know?), po (pues), fome (boring), bacán (cool). These words are used DAILY — you'll hear them in every conversation. Without these, you'll sound like a textbook, not a real speaker." },
        { id: "escl_a1_u1_l4", title: "Numbers & Money", description: "Count, pay, and understand prices at local shops", category: "grammar", level: "A1", duration: 7, xp: 20, order: 4, culturalHint: "Money talk: learn how locals discuss prices. At a Atacama market, you'll hear slang for money. Practice: '¿Cuánto cuesta?' and local variations. Food prices for empanadas de pino and pastel de choclo." },
        { id: "escl_a1_u1_l5", title: "At the Local Spot", description: "Order food and drinks like a local in Santiago", category: "listening", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "At a local restaurant/food stand: order empanadas de pino, pastel de choclo, and cazuela. Listen to how the server speaks — fast, with local slang. Practice: 'Dame un/una...' and 'Quiero probar el/la...'" },
      ],
    },
    {
      id: "escl_a1_u2", title: "La Familia — Family & Home", level: "A1", order: 2,
      description: "Family life, home vocabulary, and daily routines in undefined culture",
      lessons: [
        { id: "escl_a1_u2_l1", title: "Family Terms", description: "How families work in undefined culture — roles, respect, closeness", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1, culturalHint: "Family in undefined culture is EVERYTHING. Extended family lives close together. Learn: abuela/abuelo, tío/tía, primo/prima, compadre/comadre. Family gatherings involve empanadas de pino and cueca. asado for Fiestas Patrias is a family ritual." },
        { id: "escl_a1_u2_l2", title: "Present Tense — Daily Life", description: "Describe your daily routine using local expressions", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2, culturalHint: "Daily life in Santiago: 'Me levanto temprano', 'Desayuno pastel de choclo', 'Voy al trabajo'. Local twist: people say 'weón/huevón (dude)' when greeting coworkers. The rhythm of daily life includes asado for Fiestas Patrias." },
        { id: "escl_a1_u2_l3", title: "My Neighborhood", description: "Describe where you live — local landmarks and shops", category: "writing", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Describe a Santiago neighborhood: la bodega/tienda, la panadería, el parque. Include local spots where people eat curanto and dance cueca. Use: 'En mi barrio hay...', 'Cerca de mi casa está...'" },
        { id: "escl_a1_u2_l4", title: "Home & Living", description: "Rooms, furniture, and how homes look in undefined", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Homes in Santiago vs Valparaíso: learn local terms for rooms and furniture. Many families have a patio/balcón where they gather. Music (cueca, cumbia chilena) plays from the kitchen while cooking empanadas de pino." },
        { id: "escl_a1_u2_l5", title: "Reading: A Text Message", description: "Understand informal texts with local slang and abbreviations", category: "reading", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "Read a WhatsApp chat between friends planning to meet up. Slang: fome (boring), bacán (cool), carrete (party), pololo/polola (boyfriend/girlfriend). Abbreviations and emojis used locally. The conversation is about going to eat sopaipillas and maybe dancing cumbia chilena." },
      ],
    },
    {
      id: "escl_a2_u3", title: "Moviéndose — Getting Around", level: "A2", order: 3,
      description: "Transportation, directions, and navigating Santiago",
      lessons: [
        { id: "escl_a2_u3_l1", title: "Directions & Navigation", description: "Ask for and give directions in Santiago", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate Santiago: 'Disculpe, ¿cómo llego a...?', '¿Dónde queda...?' Local landmarks: learn the names of famous streets, plazas, and neighborhoods. Locals give directions using landmarks, not street numbers." },
        { id: "escl_a2_u3_l2", title: "Past Tense — What Happened", description: "Tell stories about what you did using local expressions", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2, culturalHint: "Tell stories the undefined way: 'Ayer fui a Valparaíso', 'Comí empanadas de pino increíble', 'Bailé cueca toda la noche'. Use local filler words and expressions. El que se pica, pierde — learn this proverb in context." },
        { id: "escl_a2_u3_l3", title: "Local Transportation", description: "Buses, taxis, and getting around like a local", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Transportation in Santiago: learn local names for bus, taxi, rideshare. How to hail a cab, negotiate fares, and understand route names. In undefined, the bus might be called differently than in textbook Spanish." },
        { id: "escl_a2_u3_l4", title: "Reading: A Travel Blog", description: "Follow a traveler's story through Santiago, Valparaíso, Viña del Mar, Atacama, Patagonia", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Read about a trip through Santiago, Valparaíso, and Viña del Mar. The blogger tries empanadas de pino, dances cueca, and learns local slang. Vocabulary: hotel, aeropuerto, maleta, pasaporte, aventura." },
        { id: "escl_a2_u3_l5", title: "Write About Your Trip", description: "Describe a real or imaginary trip to undefined", category: "writing", level: "A2", duration: 12, xp: 35, order: 5, culturalHint: "Write about visiting Santiago: what you ate (empanadas de pino, pastel de choclo, cazuela), what you saw, who you met. Use past tense and local expressions. Mention pisco sour vs Peru debate and how it felt to experience undefined culture firsthand." },
      ],
    },
    {
      id: "escl_a2_u4", title: "La Comida — Food & Drink", level: "A2", order: 4,
      description: "undefined cuisine, ordering, cooking vocabulary, and food culture",
      lessons: [
        { id: "escl_a2_u4_l1", title: "Food Vocabulary", description: "Essential dishes: empanadas de pino, pastel de choclo, cazuela, curanto", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1, culturalHint: "undefined food: empanadas de pino, pastel de choclo, cazuela, curanto, sopaipillas, completo (hot dog). Food is central to undefined culture — every gathering revolves around eating together. Learn the ingredients, how dishes are prepared, and when they're eaten (breakfast vs. lunch vs. dinner)." },
        { id: "escl_a2_u4_l2", title: "Ordering Food", description: "Order at a restaurant, street food stand, or market", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "At a Santiago restaurant: 'Me da un/una empanadas de pino', '¿Qué me recomienda?', 'La cuenta, por favor'. Street food: point and say '¡Deme uno de esos!' Learn local tipping customs and how to compliment the food." },
        { id: "escl_a2_u4_l3", title: "Comparisons & Opinions", description: "Compare foods and express preferences using local phrases", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3, culturalHint: "Compare: 'empanadas de pino es mejor que...', 'pastel de choclo es más rico que...'. Express opinions the local way: '¡Está bacán!' Learn food adjectives: picante, dulce, salado, crujiente." },
        { id: "escl_a2_u4_l4", title: "Reading: A Recipe", description: "Follow a traditional recipe for empanadas de pino", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Recipe for empanadas de pino — the national dish. Ingredients, steps, and cooking tips passed down through generations. Learn kitchen vocabulary: picar, freír, hervir, mezclar, sazonar. Every family has their own secret version." },
        { id: "escl_a2_u4_l5", title: "Listening: At the Market", description: "Understand vendors at a local market in Santiago", category: "listening", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "At the market in Santiago: vendors shout prices, offer samples, and negotiate. Listen for: '¡Lleve, lleve!', '¿Qué va a llevar?', '¡Está fresco!' Buy ingredients for empanadas de pino: learn fruit, vegetable, and meat names." },
      ],
    },
    {
      id: "escl_b1_u5", title: "Cultura y Sociedad — Culture & Society", level: "B1", order: 5,
      description: "undefined traditions, holidays, music, and social dynamics",
      lessons: [
        { id: "escl_b1_u5_l1", title: "Music & Dance", description: "cueca, cumbia chilena, cachimbo, refalosa — rhythm, history, and vocabulary", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "undefined music: cueca, cumbia chilena, cachimbo, refalosa. Artists: Violeta Parra, Víctor Jara, Los Prisioneros. Learn the vocabulary of music and dance: ritmo, compás, letra, estribillo, bailar, mover las caderas. cueca originated in Valparaíso and represents undefined identity." },
        { id: "escl_b1_u5_l2", title: "Subjunctive Mood", description: "Express wishes, doubts, and emotions the undefined way", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2, culturalHint: "Subjunctive in real life: 'Ojalá que Fiestas Patrias (Sep 18-19) sea increíble este año', 'Quiero que pruebes empanadas de pino', 'Dudo que encuentres mejor pastel de choclo fuera de Santiago'. The subjunctive is used MORE in spoken undefined than textbooks suggest." },
        { id: "escl_b1_u5_l3", title: "Holidays & Traditions", description: "Fiestas Patrias (Sep 18-19), La Tirana, Año Nuevo en Valparaíso, Vendimia — how they're celebrated", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3, culturalHint: "Fiestas Patrias (Sep 18-19): asado for Fiestas Patrias. pisco sour vs Peru debate. terremoto (earthquake cocktail). During La Tirana, families gather to eat completo (hot dog) and dance cueca. Learn celebration vocabulary: fiesta, desfile, disfraz, fuegos artificiales, tradición." },
        { id: "escl_b1_u5_l4", title: "Reading: Cultural Article", description: "Read about undefined society, values, and modern life", category: "reading", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Read about modern life in Santiago: the balance between tradition and modernity. Topics: family values, work culture, social gatherings, asado for Fiestas Patrias. Proverb: 'El que se pica, pierde' — discuss what it means in undefined culture." },
        { id: "escl_b1_u5_l5", title: "Write an Opinion", description: "Express your views on undefined culture and traditions", category: "writing", level: "B1", duration: 15, xp: 40, order: 5, culturalHint: "Write about what makes undefined culture unique: the food (empanadas de pino), the music (cueca), the people, the traditions. Use opinion phrases: 'En mi opinión...', 'Creo que...', 'Lo que más me gusta es...'. Reference: 'A lo hecho, pecho'." },
      ],
    },
    {
      id: "escl_b1_u6", title: "Vida Profesional — Work & Business", level: "B1", order: 6,
      description: "Professional communication and workplace culture in undefined",
      lessons: [
        { id: "escl_b1_u6_l1", title: "Work Vocabulary", description: "Office terms, job titles, and professional phrases", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1, culturalHint: "Workplace in Santiago: learn local terms for jobs, offices, and professional interactions. How colleagues greet each other (often with ¡Hola, weón! even at work!). Business culture: punctuality, dress code, hierarchy." },
        { id: "escl_b1_u6_l2", title: "Formal vs Informal", description: "When to use tú/usted and formal register in undefined", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2, culturalHint: "In undefined: when do you use 'usted' vs 'tú'? It varies by country! In Santiago, the rules might surprise you. Learn formal email openings, professional phone calls, and how to address your boss vs. coworkers." },
        { id: "escl_b1_u6_l3", title: "Job Interview", description: "Practice a job interview in undefined style", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3, culturalHint: "Job interview in Santiago: 'Cuénteme sobre usted', 'Mis fortalezas son...', '¿Cuál es el salario?'. Local customs: how to dress, arrive, greet the interviewer. In undefined culture, personal connections (networking) matter enormously." },
        { id: "escl_b1_u6_l4", title: "Reading: Job Posting", description: "Understand a job ad from a Santiago company", category: "reading", level: "B1", duration: 10, xp: 30, order: 4, culturalHint: "Read a job posting from Santiago: requisitos (requirements), experiencia (experience), beneficios (benefits), salario (salary). Local job platforms and how the hiring process works in undefined. Key industries in Santiago." },
        { id: "escl_b1_u6_l5", title: "Write a Cover Letter", description: "Compose a professional letter for a undefined company", category: "writing", level: "B1", duration: 15, xp: 45, order: 5, culturalHint: "Write a cover letter for a job in Santiago: formal greeting, why you're interested, your qualifications, closing. Use formal undefined: 'Estimado/a...', 'Me dirijo a usted...', 'Quedo a su disposición...'. Local business etiquette matters." },
      ],
    },
    {
      id: "escl_b2_u7", title: "Expresión Avanzada — Advanced Expression", level: "B2", order: 7,
      description: "Idioms, humor, slang mastery, and nuanced undefined communication",
      lessons: [
        { id: "escl_b2_u7_l1", title: "Idioms & Proverbs", description: "El que se pica, pierde | A lo hecho, pecho | Más sabe el diablo por viejo que por diablo", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1, culturalHint: "undefined proverbs: El que se pica, pierde. A lo hecho, pecho. Más sabe el diablo por viejo que por diablo. These are used in DAILY conversation — knowing them makes you sound fluent. Learn the context: when to use each one, what situation it fits, and how locals react when you use them correctly." },
        { id: "escl_b2_u7_l2", title: "Advanced Slang", description: "Deep slang that only locals know: carrete, pololo/polola, al", category: "vocabulary", level: "B2", duration: 12, xp: 40, order: 2, culturalHint: "Advanced undefined slang: carrete (party), pololo/polola (boyfriend/girlfriend), al tiro (right away), cachar (to understand), la raja (awesome). These are the words that make locals say 'wow, you really speak undefined!' Use them in context — wrong usage sounds worse than not knowing them." },
        { id: "escl_b2_u7_l3", title: "Conditional & Hypothetical", description: "'If I were in Santiago...' — complex sentence structures", category: "grammar", level: "B2", duration: 15, xp: 45, order: 3, culturalHint: "Hypotheticals in undefined: 'Si pudiera vivir en Santiago, comería empanadas de pino todos los días', 'Si hubiera ido a Fiestas Patrias (Sep 18-19), habría bailado cueca'. The conditional is used differently in undefined vs. textbook Spanish." },
        { id: "escl_b2_u7_l4", title: "Listening: Stand-Up Comedy", description: "Understand humor, wordplay, and cultural references", category: "listening", level: "B2", duration: 12, xp: 40, order: 4, culturalHint: "undefined humor: wordplay, cultural references, and timing. Comedians from Santiago use local slang, accents, and cultural stereotypes. Understanding humor = understanding the culture. Listen for: double meanings, irony, and undefined-specific jokes." },
        { id: "escl_b2_u7_l5", title: "Write a Story", description: "Compose a short story set in Santiago using advanced vocabulary", category: "writing", level: "B2", duration: 18, xp: 50, order: 5, culturalHint: "Write a short story set in Santiago: a character navigates daily life, eats empanadas de pino, dances cueca, uses slang (weón/huevón (dude), cachai (you know?)). Include a proverb: 'Más sabe el diablo por viejo que por diablo'. Make it feel authentically undefined." },
      ],
    },
    {
      id: "escl_c1_u8", title: "Dominio Cultural — Cultural Mastery", level: "C1", order: 8,
      description: "Deep cultural fluency, literature, history, and sophisticated undefined",
      lessons: [
        { id: "escl_c1_u8_l1", title: "Literature & Arts", description: "undefined writers, poets, and artistic movements", category: "reading", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "undefined literature and arts: famous writers, poets, and artists from Santiago. How undefined art reflects the culture — themes of identity, family, music (cueca), and social issues. Read excerpts and discuss their cultural significance." },
        { id: "escl_c1_u8_l2", title: "Complex Grammar Mastery", description: "Subjunctive perfection, passive voice, and literary tenses", category: "grammar", level: "C1", duration: 18, xp: 50, order: 2, culturalHint: "Master the subjunctive in all its forms as used in undefined: 'Hubiera querido que...', 'Ojalá hubiera podido ir a Fiestas Patrias (Sep 18-19)'. Literary tenses used in undefined journalism and literature. The pluscuamperfecto del subjuntivo in real conversation." },
        { id: "escl_c1_u8_l3", title: "Debate & Persuasion", description: "Argue, persuade, and discuss complex topics", category: "speaking", level: "C1", duration: 15, xp: 45, order: 3, culturalHint: "Debate topics relevant to undefined: politics, economy, culture, emigration, tradition vs. modernity. Use sophisticated connectors: 'No obstante...', 'Sin embargo...', 'A pesar de que...'. Persuade someone to visit Santiago and try empanadas de pino." },
        { id: "escl_c1_u8_l4", title: "Listening: Documentary", description: "Understand a documentary about undefined history and society", category: "listening", level: "C1", duration: 15, xp: 45, order: 4, culturalHint: "Watch/listen to a documentary about undefined: history, social movements, cultural evolution. How cueca and Violeta Parra shaped national identity. Advanced vocabulary: sociedad, identidad, patrimonio, herencia cultural, diáspora." },
        { id: "escl_c1_u8_l5", title: "Academic Writing", description: "Write an essay analyzing undefined cultural identity", category: "writing", level: "C1", duration: 20, xp: 55, order: 5, culturalHint: "Write an academic essay: 'La identidad cultural en el siglo XXI'. Analyze how cueca, empanadas de pino, and asado for Fiestas Patrias define the culture. Use academic register with thesis, arguments, and conclusion." },
      ],
    },
    {
      id: "escl_c2_u9", title: "Fluidez Nativa — Native Fluency", level: "C2", order: 9,
      description: "Think, dream, and create in undefined at native level",
      lessons: [
        { id: "escl_c2_u9_l1", title: "Regional Micro-Dialects", description: "How Santiago vs Valparaíso vs Viña del Mar differ", category: "listening", level: "C2", duration: 15, xp: 50, order: 1, culturalHint: "Micro-dialects within undefined: how people in Santiago sound different from Valparaíso and Viña del Mar. Vocabulary differences, pronunciation shifts, and attitude changes. A native can tell which city you learned in by your accent." },
        { id: "escl_c2_u9_l2", title: "Creative Writing", description: "Write poetry or prose in authentic undefined voice", category: "writing", level: "C2", duration: 20, xp: 55, order: 2, culturalHint: "Write creatively in undefined: a poem about Santiago, a short story about asado for Fiestas Patrias, or a song lyric in the style of Violeta Parra. Use all the slang, proverbs, and cultural references you've learned. Make it sound like a native wrote it." },
        { id: "escl_c2_u9_l3", title: "Simultaneous Interpretation", description: "Real-time translation between English and undefined", category: "speaking", level: "C2", duration: 18, xp: 55, order: 3, culturalHint: "Practice simultaneous interpretation: listen to English and produce undefined in real-time, capturing not just meaning but cultural nuance. Translate idioms into equivalent undefined expressions, not literal translations. 'El que se pica, pierde' has no direct English equivalent." },
        { id: "escl_c2_u9_l4", title: "Cultural Mediation", description: "Bridge cultural gaps between undefined and other cultures", category: "reading", level: "C2", duration: 15, xp: 50, order: 4, culturalHint: "Cultural mediation: explain undefined customs to outsiders and vice versa. Why is asado for Fiestas Patrias important? What does empanadas de pino represent beyond food? How do Fiestas Patrias (Sep 18-19) celebrations reflect national values? Navigate cross-cultural misunderstandings." },
        { id: "escl_c2_u9_l5", title: "Mastery Assessment", description: "Prove native-level fluency across all skills", category: "grammar", level: "C2", duration: 20, xp: 60, order: 5, culturalHint: "Final assessment: demonstrate mastery of undefined across reading, writing, speaking, and listening. Use advanced grammar, regional slang (weón/huevón, cachai, po), cultural references, and proverbs naturally. You should be indistinguishable from a native undefined speaker." },
      ],
    },
  ],
};

export const SPANISH_PUERTO_RICAN: LanguageCurriculum = {
  code: "es-PR",
  name: "Puerto Rican Spanish",
  flag: "🇵🇷",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 90,
  units: [
    {
      id: "espr_a1_u1", title: "¡Wepa!! — First Steps", level: "A1", order: 1,
      description: "undefined greetings, pronunciation, and essential survival phrases",
      lessons: [
        { id: "espr_a1_u1_l1", title: "Sounds & Pronunciation", description: "How undefined sounds different — dropped letters, unique rhythm", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "undefined pronunciation: listen to how people in San Juan speak vs. textbook Spanish. Local greetings: ¡Wepa!, ¿Qué es la que hay?, ¡Dimelo, bro!. The rhythm and melody of undefined is unique — practice mimicking the intonation." },
        { id: "espr_a1_u1_l2", title: "Essential Greetings", description: "Say hello, goodbye, and 'how are you' the undefined way", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in undefined: ¡Wepa!, ¿Qué es la que hay?, ¡Dimelo, bro!. These are what REAL people say — not the textbook '¿Cómo está usted?' Learn when to use each one (friends vs. elders vs. strangers)." },
        { id: "espr_a1_u1_l3", title: "Survival Slang", description: "The 10 words you NEED on day one in San Juan", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Essential slang: wepa (yay/wow), bregar (to deal with), chavos (money), janguear (to hang out), corillo (crew/group). These words are used DAILY — you'll hear them in every conversation. Without these, you'll sound like a textbook, not a real speaker." },
        { id: "espr_a1_u1_l4", title: "Numbers & Money", description: "Count, pay, and understand prices at local shops", category: "grammar", level: "A1", duration: 7, xp: 20, order: 4, culturalHint: "Money talk: learn how locals discuss prices. At a Rincón market, you'll hear slang for money. Practice: '¿Cuánto cuesta?' and local variations. Food prices for mofongo and arroz con gandules." },
        { id: "espr_a1_u1_l5", title: "At the Local Spot", description: "Order food and drinks like a local in San Juan", category: "listening", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "At a local restaurant/food stand: order mofongo, arroz con gandules, and pernil. Listen to how the server speaks — fast, with local slang. Practice: 'Dame un/una...' and 'Quiero probar el/la...'" },
      ],
    },
    {
      id: "espr_a1_u2", title: "La Familia — Family & Home", level: "A1", order: 2,
      description: "Family life, home vocabulary, and daily routines in undefined culture",
      lessons: [
        { id: "espr_a1_u2_l1", title: "Family Terms", description: "How families work in undefined culture — roles, respect, closeness", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1, culturalHint: "Family in undefined culture is EVERYTHING. Extended family lives close together. Learn: abuela/abuelo, tío/tía, primo/prima, compadre/comadre. Family gatherings involve mofongo and salsa. parrandas (Christmas caroling house to house) is a family ritual." },
        { id: "espr_a1_u2_l2", title: "Present Tense — Daily Life", description: "Describe your daily routine using local expressions", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2, culturalHint: "Daily life in San Juan: 'Me levanto temprano', 'Desayuno arroz con gandules', 'Voy al trabajo'. Local twist: people say 'wepa (yay/wow)' when greeting coworkers. The rhythm of daily life includes parrandas (Christmas caroling house to house)." },
        { id: "espr_a1_u2_l3", title: "My Neighborhood", description: "Describe where you live — local landmarks and shops", category: "writing", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Describe a San Juan neighborhood: la bodega/tienda, la panadería, el parque. Include local spots where people eat alcapurrias and dance salsa. Use: 'En mi barrio hay...', 'Cerca de mi casa está...'" },
        { id: "espr_a1_u2_l4", title: "Home & Living", description: "Rooms, furniture, and how homes look in undefined", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Homes in San Juan vs Ponce: learn local terms for rooms and furniture. Many families have a patio/balcón where they gather. Music (salsa, reggaetón) plays from the kitchen while cooking mofongo." },
        { id: "espr_a1_u2_l5", title: "Reading: A Text Message", description: "Understand informal texts with local slang and abbreviations", category: "reading", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "Read a WhatsApp chat between friends planning to meet up. Slang: janguear (to hang out), corillo (crew/group), brutal (awesome), nítido (cool/clean). Abbreviations and emojis used locally. The conversation is about going to eat bacalaítos and maybe dancing reggaetón." },
      ],
    },
    {
      id: "espr_a2_u3", title: "Moviéndose — Getting Around", level: "A2", order: 3,
      description: "Transportation, directions, and navigating San Juan",
      lessons: [
        { id: "espr_a2_u3_l1", title: "Directions & Navigation", description: "Ask for and give directions in San Juan", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate San Juan: 'Disculpe, ¿cómo llego a...?', '¿Dónde queda...?' Local landmarks: learn the names of famous streets, plazas, and neighborhoods. Locals give directions using landmarks, not street numbers." },
        { id: "espr_a2_u3_l2", title: "Past Tense — What Happened", description: "Tell stories about what you did using local expressions", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2, culturalHint: "Tell stories the undefined way: 'Ayer fui a Ponce', 'Comí mofongo increíble', 'Bailé salsa toda la noche'. Use local filler words and expressions. El que no tiene dinga, tiene mandinga — learn this proverb in context." },
        { id: "espr_a2_u3_l3", title: "Local Transportation", description: "Buses, taxis, and getting around like a local", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Transportation in San Juan: learn local names for bus, taxi, rideshare. How to hail a cab, negotiate fares, and understand route names. In undefined, the bus might be called differently than in textbook Spanish." },
        { id: "espr_a2_u3_l4", title: "Reading: A Travel Blog", description: "Follow a traveler's story through San Juan, Ponce, Mayagüez, Rincón, Vieques", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Read about a trip through San Juan, Ponce, and Mayagüez. The blogger tries mofongo, dances salsa, and learns local slang. Vocabulary: hotel, aeropuerto, maleta, pasaporte, aventura." },
        { id: "espr_a2_u3_l5", title: "Write About Your Trip", description: "Describe a real or imaginary trip to undefined", category: "writing", level: "A2", duration: 12, xp: 35, order: 5, culturalHint: "Write about visiting San Juan: what you ate (mofongo, arroz con gandules, pernil), what you saw, who you met. Use past tense and local expressions. Mention coquito at Christmas and how it felt to experience undefined culture firsthand." },
      ],
    },
    {
      id: "espr_a2_u4", title: "La Comida — Food & Drink", level: "A2", order: 4,
      description: "undefined cuisine, ordering, cooking vocabulary, and food culture",
      lessons: [
        { id: "espr_a2_u4_l1", title: "Food Vocabulary", description: "Essential dishes: mofongo, arroz con gandules, pernil, alcapurrias", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1, culturalHint: "undefined food: mofongo, arroz con gandules, pernil, alcapurrias, bacalaítos, tostones. Food is central to undefined culture — every gathering revolves around eating together. Learn the ingredients, how dishes are prepared, and when they're eaten (breakfast vs. lunch vs. dinner)." },
        { id: "espr_a2_u4_l2", title: "Ordering Food", description: "Order at a restaurant, street food stand, or market", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "At a San Juan restaurant: 'Me da un/una mofongo', '¿Qué me recomienda?', 'La cuenta, por favor'. Street food: point and say '¡Deme uno de esos!' Learn local tipping customs and how to compliment the food." },
        { id: "espr_a2_u4_l3", title: "Comparisons & Opinions", description: "Compare foods and express preferences using local phrases", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3, culturalHint: "Compare: 'mofongo es mejor que...', 'arroz con gandules es más rico que...'. Express opinions the local way: '¡Está brutal!' Learn food adjectives: picante, dulce, salado, crujiente." },
        { id: "espr_a2_u4_l4", title: "Reading: A Recipe", description: "Follow a traditional recipe for mofongo", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Recipe for mofongo — the national dish. Ingredients, steps, and cooking tips passed down through generations. Learn kitchen vocabulary: picar, freír, hervir, mezclar, sazonar. Every family has their own secret version." },
        { id: "espr_a2_u4_l5", title: "Listening: At the Market", description: "Understand vendors at a local market in San Juan", category: "listening", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "At the market in San Juan: vendors shout prices, offer samples, and negotiate. Listen for: '¡Lleve, lleve!', '¿Qué va a llevar?', '¡Está fresco!' Buy ingredients for mofongo: learn fruit, vegetable, and meat names." },
      ],
    },
    {
      id: "espr_b1_u5", title: "Cultura y Sociedad — Culture & Society", level: "B1", order: 5,
      description: "undefined traditions, holidays, music, and social dynamics",
      lessons: [
        { id: "espr_b1_u5_l1", title: "Music & Dance", description: "salsa, reggaetón, bomba, plena, dembow — rhythm, history, and vocabulary", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "undefined music: salsa, reggaetón, bomba, plena, dembow. Artists: Bad Bunny, Daddy Yankee, Residente. Learn the vocabulary of music and dance: ritmo, compás, letra, estribillo, bailar, mover las caderas. salsa originated in Ponce and represents undefined identity." },
        { id: "espr_b1_u5_l2", title: "Subjunctive Mood", description: "Express wishes, doubts, and emotions the undefined way", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2, culturalHint: "Subjunctive in real life: 'Ojalá que Fiestas de la Calle San Sebastián sea increíble este año', 'Quiero que pruebes mofongo', 'Dudo que encuentres mejor arroz con gandules fuera de San Juan'. The subjunctive is used MORE in spoken undefined than textbooks suggest." },
        { id: "espr_b1_u5_l3", title: "Holidays & Traditions", description: "Fiestas de la Calle San Sebastián, Noche de San Juan, Festival de las Máscaras de Hatillo, Día de los Reyes — how they're celebrated", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3, culturalHint: "Fiestas de la Calle San Sebastián: parrandas (Christmas caroling house to house). coquito at Christmas. dominoes on the porch. During Noche de San Juan, families gather to eat tostones and dance salsa. Learn celebration vocabulary: fiesta, desfile, disfraz, fuegos artificiales, tradición." },
        { id: "espr_b1_u5_l4", title: "Reading: Cultural Article", description: "Read about undefined society, values, and modern life", category: "reading", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Read about modern life in San Juan: the balance between tradition and modernity. Topics: family values, work culture, social gatherings, parrandas (Christmas caroling house to house). Proverb: 'El que no tiene dinga, tiene mandinga' — discuss what it means in undefined culture." },
        { id: "espr_b1_u5_l5", title: "Write an Opinion", description: "Express your views on undefined culture and traditions", category: "writing", level: "B1", duration: 15, xp: 40, order: 5, culturalHint: "Write about what makes undefined culture unique: the food (mofongo), the music (salsa), the people, the traditions. Use opinion phrases: 'En mi opinión...', 'Creo que...', 'Lo que más me gusta es...'. Reference: 'Más claro no canta un gallo'." },
      ],
    },
    {
      id: "espr_b1_u6", title: "Vida Profesional — Work & Business", level: "B1", order: 6,
      description: "Professional communication and workplace culture in undefined",
      lessons: [
        { id: "espr_b1_u6_l1", title: "Work Vocabulary", description: "Office terms, job titles, and professional phrases", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1, culturalHint: "Workplace in San Juan: learn local terms for jobs, offices, and professional interactions. How colleagues greet each other (often with ¡Wepa! even at work!). Business culture: punctuality, dress code, hierarchy." },
        { id: "espr_b1_u6_l2", title: "Formal vs Informal", description: "When to use tú/usted and formal register in undefined", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2, culturalHint: "In undefined: when do you use 'usted' vs 'tú'? It varies by country! In San Juan, the rules might surprise you. Learn formal email openings, professional phone calls, and how to address your boss vs. coworkers." },
        { id: "espr_b1_u6_l3", title: "Job Interview", description: "Practice a job interview in undefined style", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3, culturalHint: "Job interview in San Juan: 'Cuénteme sobre usted', 'Mis fortalezas son...', '¿Cuál es el salario?'. Local customs: how to dress, arrive, greet the interviewer. In undefined culture, personal connections (networking) matter enormously." },
        { id: "espr_b1_u6_l4", title: "Reading: Job Posting", description: "Understand a job ad from a San Juan company", category: "reading", level: "B1", duration: 10, xp: 30, order: 4, culturalHint: "Read a job posting from San Juan: requisitos (requirements), experiencia (experience), beneficios (benefits), salario (salary). Local job platforms and how the hiring process works in undefined. Key industries in San Juan." },
        { id: "espr_b1_u6_l5", title: "Write a Cover Letter", description: "Compose a professional letter for a undefined company", category: "writing", level: "B1", duration: 15, xp: 45, order: 5, culturalHint: "Write a cover letter for a job in San Juan: formal greeting, why you're interested, your qualifications, closing. Use formal undefined: 'Estimado/a...', 'Me dirijo a usted...', 'Quedo a su disposición...'. Local business etiquette matters." },
      ],
    },
    {
      id: "espr_b2_u7", title: "Expresión Avanzada — Advanced Expression", level: "B2", order: 7,
      description: "Idioms, humor, slang mastery, and nuanced undefined communication",
      lessons: [
        { id: "espr_b2_u7_l1", title: "Idioms & Proverbs", description: "El que no tiene dinga, tiene mandinga | Más claro no canta un gallo | El que mucho abarca poco aprieta", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1, culturalHint: "undefined proverbs: El que no tiene dinga, tiene mandinga. Más claro no canta un gallo. El que mucho abarca poco aprieta. These are used in DAILY conversation — knowing them makes you sound fluent. Learn the context: when to use each one, what situation it fits, and how locals react when you use them correctly." },
        { id: "espr_b2_u7_l2", title: "Advanced Slang", description: "Deep slang that only locals know: brutal, nítido, al", category: "vocabulary", level: "B2", duration: 12, xp: 40, order: 2, culturalHint: "Advanced undefined slang: brutal (awesome), nítido (cool/clean), al garete (out of control), tripear (to trip out), pai (dad/bro). These are the words that make locals say 'wow, you really speak undefined!' Use them in context — wrong usage sounds worse than not knowing them." },
        { id: "espr_b2_u7_l3", title: "Conditional & Hypothetical", description: "'If I were in San Juan...' — complex sentence structures", category: "grammar", level: "B2", duration: 15, xp: 45, order: 3, culturalHint: "Hypotheticals in undefined: 'Si pudiera vivir en San Juan, comería mofongo todos los días', 'Si hubiera ido a Fiestas de la Calle San Sebastián, habría bailado salsa'. The conditional is used differently in undefined vs. textbook Spanish." },
        { id: "espr_b2_u7_l4", title: "Listening: Stand-Up Comedy", description: "Understand humor, wordplay, and cultural references", category: "listening", level: "B2", duration: 12, xp: 40, order: 4, culturalHint: "undefined humor: wordplay, cultural references, and timing. Comedians from San Juan use local slang, accents, and cultural stereotypes. Understanding humor = understanding the culture. Listen for: double meanings, irony, and undefined-specific jokes." },
        { id: "espr_b2_u7_l5", title: "Write a Story", description: "Compose a short story set in San Juan using advanced vocabulary", category: "writing", level: "B2", duration: 18, xp: 50, order: 5, culturalHint: "Write a short story set in San Juan: a character navigates daily life, eats mofongo, dances salsa, uses slang (wepa (yay/wow), bregar (to deal with)). Include a proverb: 'El que mucho abarca poco aprieta'. Make it feel authentically undefined." },
      ],
    },
    {
      id: "espr_c1_u8", title: "Dominio Cultural — Cultural Mastery", level: "C1", order: 8,
      description: "Deep cultural fluency, literature, history, and sophisticated undefined",
      lessons: [
        { id: "espr_c1_u8_l1", title: "Literature & Arts", description: "undefined writers, poets, and artistic movements", category: "reading", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "undefined literature and arts: famous writers, poets, and artists from San Juan. How undefined art reflects the culture — themes of identity, family, music (salsa), and social issues. Read excerpts and discuss their cultural significance." },
        { id: "espr_c1_u8_l2", title: "Complex Grammar Mastery", description: "Subjunctive perfection, passive voice, and literary tenses", category: "grammar", level: "C1", duration: 18, xp: 50, order: 2, culturalHint: "Master the subjunctive in all its forms as used in undefined: 'Hubiera querido que...', 'Ojalá hubiera podido ir a Fiestas de la Calle San Sebastián'. Literary tenses used in undefined journalism and literature. The pluscuamperfecto del subjuntivo in real conversation." },
        { id: "espr_c1_u8_l3", title: "Debate & Persuasion", description: "Argue, persuade, and discuss complex topics", category: "speaking", level: "C1", duration: 15, xp: 45, order: 3, culturalHint: "Debate topics relevant to undefined: politics, economy, culture, emigration, tradition vs. modernity. Use sophisticated connectors: 'No obstante...', 'Sin embargo...', 'A pesar de que...'. Persuade someone to visit San Juan and try mofongo." },
        { id: "espr_c1_u8_l4", title: "Listening: Documentary", description: "Understand a documentary about undefined history and society", category: "listening", level: "C1", duration: 15, xp: 45, order: 4, culturalHint: "Watch/listen to a documentary about undefined: history, social movements, cultural evolution. How salsa and Bad Bunny shaped national identity. Advanced vocabulary: sociedad, identidad, patrimonio, herencia cultural, diáspora." },
        { id: "espr_c1_u8_l5", title: "Academic Writing", description: "Write an essay analyzing undefined cultural identity", category: "writing", level: "C1", duration: 20, xp: 55, order: 5, culturalHint: "Write an academic essay: 'La identidad cultural en el siglo XXI'. Analyze how salsa, mofongo, and parrandas (Christmas caroling house to house) define the culture. Use academic register with thesis, arguments, and conclusion." },
      ],
    },
    {
      id: "espr_c2_u9", title: "Fluidez Nativa — Native Fluency", level: "C2", order: 9,
      description: "Think, dream, and create in undefined at native level",
      lessons: [
        { id: "espr_c2_u9_l1", title: "Regional Micro-Dialects", description: "How San Juan vs Ponce vs Mayagüez differ", category: "listening", level: "C2", duration: 15, xp: 50, order: 1, culturalHint: "Micro-dialects within undefined: how people in San Juan sound different from Ponce and Mayagüez. Vocabulary differences, pronunciation shifts, and attitude changes. A native can tell which city you learned in by your accent." },
        { id: "espr_c2_u9_l2", title: "Creative Writing", description: "Write poetry or prose in authentic undefined voice", category: "writing", level: "C2", duration: 20, xp: 55, order: 2, culturalHint: "Write creatively in undefined: a poem about San Juan, a short story about parrandas (Christmas caroling house to house), or a song lyric in the style of Bad Bunny. Use all the slang, proverbs, and cultural references you've learned. Make it sound like a native wrote it." },
        { id: "espr_c2_u9_l3", title: "Simultaneous Interpretation", description: "Real-time translation between English and undefined", category: "speaking", level: "C2", duration: 18, xp: 55, order: 3, culturalHint: "Practice simultaneous interpretation: listen to English and produce undefined in real-time, capturing not just meaning but cultural nuance. Translate idioms into equivalent undefined expressions, not literal translations. 'El que no tiene dinga, tiene mandinga' has no direct English equivalent." },
        { id: "espr_c2_u9_l4", title: "Cultural Mediation", description: "Bridge cultural gaps between undefined and other cultures", category: "reading", level: "C2", duration: 15, xp: 50, order: 4, culturalHint: "Cultural mediation: explain undefined customs to outsiders and vice versa. Why is parrandas (Christmas caroling house to house) important? What does mofongo represent beyond food? How do Fiestas de la Calle San Sebastián celebrations reflect national values? Navigate cross-cultural misunderstandings." },
        { id: "espr_c2_u9_l5", title: "Mastery Assessment", description: "Prove native-level fluency across all skills", category: "grammar", level: "C2", duration: 20, xp: 60, order: 5, culturalHint: "Final assessment: demonstrate mastery of undefined across reading, writing, speaking, and listening. Use advanced grammar, regional slang (wepa, bregar, chavos), cultural references, and proverbs naturally. You should be indistinguishable from a native undefined speaker." },
      ],
    },
  ],
};


export const FRENCH_HAITIAN_CREOLE: LanguageCurriculum = {
  code: "fr-HT",
  name: "Haitian Creole",
  flag: "🇭🇹",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 95,
  units: [
    {
      id: "frht_a1_u1", title: "First Steps — Greetings & Sounds", level: "A1", order: 1,
      description: "Basic greetings, alphabet/sounds, and survival phrases in Haitian Creole",
      lessons: [
        { id: "frht_a1_u1_l1", title: "The Sound System", description: "Learn the unique sounds and pronunciation of Haitian Creole", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "Haitian Creole has unique sounds that differ from standard forms. Practice with local greetings: Sak pase? (What's up?), N ap boule! (We're burning/doing great!). Listen to Wyclef Jean to hear authentic pronunciation. The rhythm of Haitian Creole reflects the culture of Port-au-Prince." },
        { id: "frht_a1_u1_l2", title: "Essential Greetings", description: "Hello, goodbye, please, thank you in Haitian Creole", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in Haitian Creole: Sak pase? (What's up?), N ap boule! (We're burning/doing great!), Bonjou (Good morning), Bonswa (Good evening). In Port-au-Prince, people greet warmly — it's part of the culture of Vodou ceremonies. Never skip greetings; it's considered rude." },
        { id: "frht_a1_u1_l3", title: "Numbers & Money", description: "Count 1-100 and handle money in Port-au-Prince", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Practice numbers while ordering griot (fried pork) at a local restaurant. In Port-au-Prince, bargaining is common at local markets. Learn to ask 'How much?' like a local." },
        { id: "frht_a1_u1_l4", title: "At the Local Market", description: "Navigate a market in Port-au-Prince — buying food and essentials", category: "listening", level: "A1", duration: 9, xp: 30, order: 4, culturalHint: "You're at a market in Port-au-Prince. Vendors call out selling diri ak djon djon (black mushroom rice) and akra (malanga fritters). Listen for prices, quantities, and the vendor's greeting. Market culture: storytelling (krik? krak!)." },
        { id: "frht_a1_u1_l5", title: "Write Your First Sentences", description: "Introduce yourself and describe your day", category: "writing", level: "A1", duration: 10, xp: 30, order: 5, culturalHint: "Write about yourself as if you just arrived in Port-au-Prince. Describe what you see, what you want to eat (griot (fried pork)? soup joumou (squash soup)?), and how you greet people. Use: Sak pase? (What's up?)." },
      ],
    },
    {
      id: "frht_a1_u2", title: "Daily Life & Food Culture", level: "A1", order: 2,
      description: "Food, family, and daily routines in Haitian Creole culture",
      lessons: [
        { id: "frht_a1_u2_l1", title: "Local Food Vocabulary", description: "Learn the names of iconic dishes and ingredients", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "Essential food vocabulary: griot, diri ak djon djon, akra, soup joumou, pikliz, bannann peze. In Port-au-Prince, griot (fried pork) is a staple — everyone eats it. Learn to order: 'Je veux griot'." },
        { id: "frht_a1_u2_l2", title: "Family & Relationships", description: "Family terms and how families interact in this culture", category: "grammar", level: "A1", duration: 10, xp: 30, order: 2, culturalHint: "Family is central in Haitian Creole culture. Extended families often live together or nearby. Vodou ceremonies reflects the importance of community. Learn family terms and how to describe your family to new friends in Port-au-Prince." },
        { id: "frht_a1_u2_l3", title: "Ordering at a Restaurant", description: "Complete a meal order from greeting to paying", category: "speaking", level: "A1", duration: 9, xp: 30, order: 3, culturalHint: "You're at a restaurant in Port-au-Prince. The waiter greets you with 'Sak pase? (What's up?)'. Order griot (fried pork) and pikliz (spicy coleslaw). Tipping customs vary by region." },
        { id: "frht_a1_u2_l4", title: "Daily Routine", description: "Describe your morning, afternoon, and evening", category: "writing", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Write about a typical day in Port-au-Prince. Morning: wake early, have café with bread. Evening: tap-tap art buses." },
        { id: "frht_a1_u2_l5", title: "Reading Local Signs", description: "Understand menus, street signs, and notices", category: "reading", level: "A1", duration: 7, xp: 20, order: 5, culturalHint: "Read real signs from Port-au-Prince: restaurant menus featuring griot (fried pork), street names, shop signs. In Cap-Haïtien, signs might be different from Port-au-Prince. Practice reading prices, hours, and directions." },
      ],
    },
    {
      id: "frht_a2_u1", title: "Getting Around & Transportation", level: "A2", order: 3,
      description: "Navigate cities, use transport, and ask for directions",
      lessons: [
        { id: "frht_a2_u1_l1", title: "Directions & Navigation", description: "Ask for and give directions in Port-au-Prince", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate Port-au-Prince like a local. Key landmarks, neighborhoods, and how people give directions here. In Port-au-Prince, ask locals — they love helping visitors!" },
        { id: "frht_a2_u1_l2", title: "Public Transportation", description: "Buses, taxis, and local transport systems", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 2, culturalHint: "Transport in Port-au-Prince: tap-taps (colorful shared buses), motos. Learn to ask: 'How do I get to...?'" },
        { id: "frht_a2_u1_l3", title: "At the Hotel/Airbnb", description: "Check in, ask about amenities, handle problems", category: "grammar", level: "A2", duration: 10, xp: 30, order: 3, culturalHint: "Staying in Port-au-Prince? Learn to check in, ask for wifi, request extra towels, and report issues. Accommodation culture in Port-au-Prince reflects local Vodou ceremonies." },
        { id: "frht_a2_u1_l4", title: "Emergency Situations", description: "Health, safety, and asking for help", category: "listening", level: "A2", duration: 9, xp: 30, order: 4, culturalHint: "Essential emergency phrases in Haitian Creole. How to say 'Help!', 'I need a doctor', 'Call the police'. In Port-au-Prince, know the local emergency numbers and nearest hospital." },
        { id: "frht_a2_u1_l5", title: "Travel Journal Entry", description: "Write about your experiences exploring the city", category: "writing", level: "A2", duration: 10, xp: 30, order: 5, culturalHint: "Write a travel journal about Port-au-Prince. Describe the sights (Cap-Haïtien, Jacmel), the food you tried (griot (fried pork), akra (malanga fritters)), and the people you met. Use past tense to describe what happened." },
      ],
    },
    {
      id: "frht_a2_u2", title: "Culture, Music & Entertainment", level: "A2", order: 4,
      description: "Music, dance, celebrations, and entertainment culture",
      lessons: [
        { id: "frht_a2_u2_l1", title: "Music & Dance", description: "Learn about kompa (konpa) and local music culture", category: "vocabulary", level: "A2", duration: 9, xp: 30, order: 1, culturalHint: "Haitian Creole music culture: kompa (konpa), rara (street carnival music), yanvalou (vodou dance), méringue haïtienne. Listen to Wyclef Jean, Tabou Combo, Sweet Micky, Boukman Eksperyans. kompa (konpa) is more than dance — it's identity. Learn the vocabulary of rhythm, instruments, and movement." },
        { id: "frht_a2_u2_l2", title: "Festivals & Celebrations", description: "Major holidays and how they're celebrated", category: "reading", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "Major celebrations: Kanaval (Carnival), Fèt Gede (Day of the Dead), Independence Day (Jan 1), Rara Season (Lent). During Kanaval (Carnival), people fill the streets with rara music and dancing. Learn the vocabulary of celebration!" },
        { id: "frht_a2_u2_l3", title: "Talking About Hobbies", description: "Discuss interests, sports, and leisure activities", category: "speaking", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Popular hobbies in Port-au-Prince: tap-tap art buses, music, and socializing. Talk about what you enjoy!" },
        { id: "frht_a2_u2_l4", title: "Understanding Song Lyrics", description: "Analyze a popular song in Haitian Creole", category: "listening", level: "A2", duration: 10, xp: 35, order: 4, culturalHint: "Listen to Wyclef Jean or Tabou Combo. Break down the lyrics — learn new vocabulary, cultural references, and emotional expressions. Haitian Creole songs often reference love, struggle, and cultural pride." },
        { id: "frht_a2_u2_l5", title: "Writing a Party Invitation", description: "Invite friends to a cultural celebration", category: "writing", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "Write an invitation to a Kanaval (Carnival) party! Include: date, time, location (Port-au-Prince), what to bring, what to wear, and what food will be served (griot (fried pork), soup joumou (squash soup)). Use festive language and cultural expressions." },
      ],
    },
    {
      id: "frht_b1_u1", title: "Society, History & Current Events", level: "B1", order: 5,
      description: "Discuss history, social issues, and current events",
      lessons: [
        { id: "frht_b1_u1_l1", title: "Historical Context", description: "Key historical events that shaped this culture", category: "reading", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "Haiti was the first Black republic (1804) — the only successful slave revolution in history. Toussaint Louverture, Dessalines, and the fight against Napoleon. Discuss in Haitian Creole." },
        { id: "frht_b1_u1_l2", title: "Social Issues & Opinions", description: "Express opinions about current social topics", category: "speaking", level: "B1", duration: 10, xp: 30, order: 2, culturalHint: "Discuss current issues in Port-au-Prince: rebuilding after disasters, diaspora connections, cultural preservation. Learn to express opinions respectfully." },
        { id: "frht_b1_u1_l3", title: "News & Media", description: "Understand news broadcasts and articles", category: "listening", level: "B1", duration: 11, xp: 35, order: 3, culturalHint: "Listen to news from Port-au-Prince. Popular media sources, how news is reported, and key vocabulary for current events. Local radio, TV, and online media. Practice summarizing what you hear." },
        { id: "frht_b1_u1_l4", title: "Formal vs Informal Register", description: "Switch between formal and casual speech appropriately", category: "grammar", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Haitian Creole has distinct formal/informal registers. Knowing when to be formal vs casual in Port-au-Prince shows cultural competence." },
        { id: "frht_b1_u1_l5", title: "Opinion Essay", description: "Write a structured opinion piece on a cultural topic", category: "writing", level: "B1", duration: 12, xp: 35, order: 5, culturalHint: "Write about: 'How has Haitian Creole evolved from French colonialism to become a symbol of independence?' Use connectors, evidence, and conclusion." },
      ],
    },
    {
      id: "frht_b1_u2", title: "Work, Business & Professional Life", level: "B1", order: 6,
      description: "Professional communication, job culture, and business etiquette",
      lessons: [
        { id: "frht_b1_u2_l1", title: "Workplace Culture", description: "How work culture differs in this region", category: "reading", level: "B1", duration: 10, xp: 30, order: 1, culturalHint: "Work culture in Port-au-Prince: Professional norms in Port-au-Prince reflect Vodou ceremonies." },
        { id: "frht_b1_u2_l2", title: "Job Interview Practice", description: "Prepare for and conduct a job interview", category: "speaking", level: "B1", duration: 12, xp: 35, order: 2, culturalHint: "Practice a job interview in Haitian Creole. Key phrases: introduce yourself, describe experience, ask about the role. In Port-au-Prince, be prepared to discuss both skills and cultural fit." },
        { id: "frht_b1_u2_l3", title: "Email & Professional Writing", description: "Write formal emails, reports, and messages", category: "writing", level: "B1", duration: 10, xp: 30, order: 3, culturalHint: "Professional email etiquette in Haitian Creole. Formal writing conventions in Haitian Creole." },
        { id: "frht_b1_u2_l4", title: "Negotiation & Persuasion", description: "Negotiate prices, terms, and agreements", category: "grammar", level: "B1", duration: 11, xp: 35, order: 4, culturalHint: "Negotiation culture: Negotiation in Port-au-Prince requires patience and cultural awareness." },
        { id: "frht_b1_u2_l5", title: "Listening: Business Meeting", description: "Understand a recorded business meeting", category: "listening", level: "B1", duration: 10, xp: 30, order: 5, culturalHint: "Listen to a business meeting in Haitian Creole. Notice how people address each other, how decisions are made, and how disagreements are handled. In Port-au-Prince, meeting dynamics reflect the local communication style." },
      ],
    },
    {
      id: "frht_b2_u1", title: "Deep Culture & Identity", level: "B2", order: 7,
      description: "Literature, philosophy, identity, and cultural depth",
      lessons: [
        { id: "frht_b2_u1_l1", title: "Literature & Poetry", description: "Read and discuss famous works from this culture", category: "reading", level: "B2", duration: 15, xp: 40, order: 1, culturalHint: "Haitian literature: Jacques Roumain's 'Gouverneurs de la Rosée', Edwidge Danticat, Dany Laferrière. The 'krik? krak!' storytelling tradition." },
        { id: "frht_b2_u1_l2", title: "Cultural Identity & Diaspora", description: "Discuss identity, belonging, and cultural preservation", category: "speaking", level: "B2", duration: 12, xp: 35, order: 2, culturalHint: "The Haitian diaspora (NYC, Miami, Montreal) maintains culture through food, music, and Creole. 'Dyaspora' identity — being between two worlds. Discuss in Haitian Creole." },
        { id: "frht_b2_u1_l3", title: "Humor & Wordplay", description: "Understand jokes, puns, and cultural humor", category: "listening", level: "B2", duration: 10, xp: 30, order: 3, culturalHint: "Haitian Creole humor: Local humor in Port-au-Prince — understanding jokes means you truly know the culture." },
        { id: "frht_b2_u1_l4", title: "Film & Cinema Analysis", description: "Analyze a film from this culture", category: "writing", level: "B2", duration: 14, xp: 40, order: 4, culturalHint: "Cinema from Port-au-Prince — analyze themes, dialogue, and cultural references. Write a film review in Haitian Creole." },
        { id: "frht_b2_u1_l5", title: "Idiomatic Expressions", description: "Master local idioms and proverbs", category: "grammar", level: "B2", duration: 11, xp: 35, order: 5, culturalHint: "Haitian Creole idioms: 'Dèyè mòn gen mòn' (Behind mountains there are mountains — life has many challenges). 'Bourik travay, chwal galonnen' (Donkey works, horse gallops — unfair labor)." },
      ],
    },
    {
      id: "frht_c1_u1", title: "Advanced Expression & Nuance", level: "C1", order: 8,
      description: "Subtle nuance, advanced argumentation, and cultural fluency",
      lessons: [
        { id: "frht_c1_u1_l1", title: "Political Discourse", description: "Understand and discuss political topics with nuance", category: "listening", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "Political discourse in Haitian Creole: Haitian politics: post-colonial power dynamics, diaspora influence, grassroots movements." },
        { id: "frht_c1_u1_l2", title: "Academic Writing", description: "Write research-level prose with proper argumentation", category: "writing", level: "C1", duration: 15, xp: 45, order: 2, culturalHint: "Academic writing in Haitian Creole: Academic conventions in Haitian Creole — formal register, citations, argumentation. Write a 500-word essay on Vodou ceremonies." },
        { id: "frht_c1_u1_l3", title: "Dialect Switching", description: "Move between formal and dialectal registers fluidly", category: "speaking", level: "C1", duration: 12, xp: 40, order: 3, culturalHint: "Master code-switching: Switch between Haitian Creole and standard French — know when each is appropriate." },
        { id: "frht_c1_u1_l4", title: "Debate & Persuasion", description: "Construct and defend complex arguments", category: "grammar", level: "C1", duration: 13, xp: 40, order: 4, culturalHint: "Debate culture: Persuasion techniques in Haitian Creole culture — how to argue effectively and respectfully." },
        { id: "frht_c1_u1_l5", title: "Cultural Commentary", description: "Write sophisticated cultural analysis", category: "reading", level: "C1", duration: 14, xp: 40, order: 5, culturalHint: "Read and analyze cultural commentary from Port-au-Prince. How Haitian Creole intellectuals discuss cultural preservation, globalization, and identity. Write your own cultural commentary." },
      ],
    },
    {
      id: "frht_c2_u1", title: "Native-Level Fluency & Cultural Mastery", level: "C2", order: 9,
      description: "Near-native expression, cultural depth, and creative mastery",
      lessons: [
        { id: "frht_c2_u1_l1", title: "Creative Writing", description: "Write poetry, fiction, or creative non-fiction", category: "writing", level: "C2", duration: 18, xp: 50, order: 1, culturalHint: "Write creatively in Haitian Creole: Write a 'krik? krak!' story in Creole. Use proverbs, oral tradition rhythms, and magical realism." },
        { id: "frht_c2_u1_l2", title: "Simultaneous Interpretation", description: "Translate complex speech in real-time between languages", category: "listening", level: "C2", duration: 15, xp: 50, order: 2, culturalHint: "Practice interpreting between Haitian Creole and English. Handle: formal speeches, casual conversations, and technical discussions. Cultural context is key — some concepts don't translate directly." },
        { id: "frht_c2_u1_l3", title: "Teaching Others", description: "Explain grammar and culture to beginners", category: "speaking", level: "C2", duration: 12, xp: 45, order: 3, culturalHint: "The ultimate test: teach Haitian Creole to someone else. Explain: how Creole simplified French grammar, why 'mwen' replaced 'je/moi', and the African substrate." },
        { id: "frht_c2_u1_l4", title: "Cultural Mediation", description: "Bridge cultural misunderstandings between speakers", category: "grammar", level: "C2", duration: 14, xp: 45, order: 4, culturalHint: "Mediate between cultures: Bridge the gap between Haitian and French speakers — explain cultural context behind Creole expressions." },
        { id: "frht_c2_u1_l5", title: "Masterclass: Cultural Fluency", description: "Demonstrate complete cultural and linguistic mastery", category: "reading", level: "C2", duration: 16, xp: 50, order: 5, culturalHint: "Final challenge: Read a complex text about Haiti's contribution to world culture despite economic challenges, the power of Creole as a language of resistance, and the diaspora's role. Discuss with native-level fluency." },
      ],
    },
  ],
};

export const FRENCH_QUEBECOIS: LanguageCurriculum = {
  code: "fr-QC",
  name: "Québécois French",
  flag: "🇨🇦",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 95,
  units: [
    {
      id: "frqc_a1_u1", title: "First Steps — Greetings & Sounds", level: "A1", order: 1,
      description: "Basic greetings, alphabet/sounds, and survival phrases in Québécois French",
      lessons: [
        { id: "frqc_a1_u1_l1", title: "The Sound System", description: "Learn the unique sounds and pronunciation of Québécois French", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "Québécois French has unique sounds that differ from standard forms. Practice with local greetings: Allô! (Hey!), Comment ça va, là? (How's it going?). Listen to Céline Dion to hear authentic pronunciation. The rhythm of Québécois French reflects the culture of Montréal." },
        { id: "frqc_a1_u1_l2", title: "Essential Greetings", description: "Hello, goodbye, please, thank you in Québécois French", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in Québécois French: Allô! (Hey!), Comment ça va, là? (How's it going?), Bienvenue! (You're welcome — NOT 'de rien'), Pantoute! (Not at all!). In Montréal, people greet warmly — it's part of the culture of cabane à sucre (sugar shack). Never skip greetings; it's considered rude." },
        { id: "frqc_a1_u1_l3", title: "Numbers & Money", description: "Count 1-100 and handle money in Montréal", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Practice numbers while ordering poutine (fries, gravy, cheese curds) at a local restaurant. In Montréal, bargaining is common at local markets. Learn to ask 'How much?' like a local." },
        { id: "frqc_a1_u1_l4", title: "At the Local Market", description: "Navigate a market in Montréal — buying food and essentials", category: "listening", level: "A1", duration: 9, xp: 30, order: 4, culturalHint: "You're at a market in Montréal. Vendors call out selling tourtière (meat pie) and tire d'érable (maple taffy on snow). Listen for prices, quantities, and the vendor's greeting. Market culture: hockey culture." },
        { id: "frqc_a1_u1_l5", title: "Write Your First Sentences", description: "Introduce yourself and describe your day", category: "writing", level: "A1", duration: 10, xp: 30, order: 5, culturalHint: "Write about yourself as if you just arrived in Montréal. Describe what you see, what you want to eat (poutine (fries, gravy, cheese curds)? smoked meat sandwich?), and how you greet people. Use: Allô! (Hey!)." },
      ],
    },
    {
      id: "frqc_a1_u2", title: "Daily Life & Food Culture", level: "A1", order: 2,
      description: "Food, family, and daily routines in Québécois French culture",
      lessons: [
        { id: "frqc_a1_u2_l1", title: "Local Food Vocabulary", description: "Learn the names of iconic dishes and ingredients", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "Essential food vocabulary: poutine, tourtière, tire d'érable, smoked meat sandwich, cretons, pouding chômeur. In Montréal, poutine (fries, gravy, cheese curds) is a staple — everyone eats it. Learn to order: 'Je veux poutine'." },
        { id: "frqc_a1_u2_l2", title: "Family & Relationships", description: "Family terms and how families interact in this culture", category: "grammar", level: "A1", duration: 10, xp: 30, order: 2, culturalHint: "Family is central in Québécois French culture. Extended families often live together or nearby. cabane à sucre (sugar shack) reflects the importance of community. Learn family terms and how to describe your family to new friends in Montréal." },
        { id: "frqc_a1_u2_l3", title: "Ordering at a Restaurant", description: "Complete a meal order from greeting to paying", category: "speaking", level: "A1", duration: 9, xp: 30, order: 3, culturalHint: "You're at a restaurant in Montréal. The waiter greets you with 'Allô! (Hey!)'. Order poutine (fries, gravy, cheese curds) and cretons (pork spread). Tipping customs vary by region." },
        { id: "frqc_a1_u2_l4", title: "Daily Routine", description: "Describe your morning, afternoon, and evening", category: "writing", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Write about a typical day in Montréal. Morning: start with coffee and local breakfast. Evening: joual slang." },
        { id: "frqc_a1_u2_l5", title: "Reading Local Signs", description: "Understand menus, street signs, and notices", category: "reading", level: "A1", duration: 7, xp: 20, order: 5, culturalHint: "Read real signs from Montréal: restaurant menus featuring poutine (fries, gravy, cheese curds), street names, shop signs. In Québec City, signs might be different from Montréal. Practice reading prices, hours, and directions." },
      ],
    },
    {
      id: "frqc_a2_u1", title: "Getting Around & Transportation", level: "A2", order: 3,
      description: "Navigate cities, use transport, and ask for directions",
      lessons: [
        { id: "frqc_a2_u1_l1", title: "Directions & Navigation", description: "Ask for and give directions in Montréal", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate Montréal like a local. Key landmarks, neighborhoods, and how people give directions here. In Montréal, ask locals — they love helping visitors!" },
        { id: "frqc_a2_u1_l2", title: "Public Transportation", description: "Buses, taxis, and local transport systems", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 2, culturalHint: "Transport in Montréal: STM bus and métro, bixi bikes. Learn to ask: 'How do I get to...?'" },
        { id: "frqc_a2_u1_l3", title: "At the Hotel/Airbnb", description: "Check in, ask about amenities, handle problems", category: "grammar", level: "A2", duration: 10, xp: 30, order: 3, culturalHint: "Staying in Montréal? Learn to check in, ask for wifi, request extra towels, and report issues. Accommodation culture in Montréal reflects local cabane à sucre (sugar shack)." },
        { id: "frqc_a2_u1_l4", title: "Emergency Situations", description: "Health, safety, and asking for help", category: "listening", level: "A2", duration: 9, xp: 30, order: 4, culturalHint: "Essential emergency phrases in Québécois French. How to say 'Help!', 'I need a doctor', 'Call the police'. In Montréal, know the local emergency numbers and nearest hospital." },
        { id: "frqc_a2_u1_l5", title: "Travel Journal Entry", description: "Write about your experiences exploring the city", category: "writing", level: "A2", duration: 10, xp: 30, order: 5, culturalHint: "Write a travel journal about Montréal. Describe the sights (Québec City, Trois-Rivières), the food you tried (poutine (fries, gravy, cheese curds), tire d'érable (maple taffy on snow)), and the people you met. Use past tense to describe what happened." },
      ],
    },
    {
      id: "frqc_a2_u2", title: "Culture, Music & Entertainment", level: "A2", order: 4,
      description: "Music, dance, celebrations, and entertainment culture",
      lessons: [
        { id: "frqc_a2_u2_l1", title: "Music & Dance", description: "Learn about gigue québécoise (jig) and local music culture", category: "vocabulary", level: "A2", duration: 9, xp: 30, order: 1, culturalHint: "Québécois French music culture: gigue québécoise (jig), set carré (square dance), reel. Listen to Céline Dion, Les Cowboys Fringants, Harmonium, Beau Dommage. gigue québécoise (jig) is more than dance — it's identity. Learn the vocabulary of rhythm, instruments, and movement." },
        { id: "frqc_a2_u2_l2", title: "Festivals & Celebrations", description: "Major holidays and how they're celebrated", category: "reading", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "Major celebrations: Saint-Jean-Baptiste (June 24), Carnaval de Québec (February), Festival d'été de Québec, Cabane à sucre season (March). During Saint-Jean-Baptiste (June 24), people celebrate with food, music, and family. Learn the vocabulary of celebration!" },
        { id: "frqc_a2_u2_l3", title: "Talking About Hobbies", description: "Discuss interests, sports, and leisure activities", category: "speaking", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Popular hobbies in Montréal: hockey, skiing, cabane à sucre visits, festivals. Talk about what you enjoy!" },
        { id: "frqc_a2_u2_l4", title: "Understanding Song Lyrics", description: "Analyze a popular song in Québécois French", category: "listening", level: "A2", duration: 10, xp: 35, order: 4, culturalHint: "Listen to Céline Dion or Les Cowboys Fringants. Break down the lyrics — learn new vocabulary, cultural references, and emotional expressions. Québécois French songs often reference love, struggle, and cultural pride." },
        { id: "frqc_a2_u2_l5", title: "Writing a Party Invitation", description: "Invite friends to a cultural celebration", category: "writing", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "Write an invitation to a Saint-Jean-Baptiste (June 24) party! Include: date, time, location (Montréal), what to bring, what to wear, and what food will be served (poutine (fries, gravy, cheese curds), smoked meat sandwich). Use festive language and cultural expressions." },
      ],
    },
    {
      id: "frqc_b1_u1", title: "Society, History & Current Events", level: "B1", order: 5,
      description: "Discuss history, social issues, and current events",
      lessons: [
        { id: "frqc_b1_u1_l1", title: "Historical Context", description: "Key historical events that shaped this culture", category: "reading", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "The Quiet Revolution (1960s) transformed Quebec from Catholic conservatism to secular modernity. Bill 101 protects French language rights. Discuss in Québécois French." },
        { id: "frqc_b1_u1_l2", title: "Social Issues & Opinions", description: "Express opinions about current social topics", category: "speaking", level: "B1", duration: 10, xp: 30, order: 2, culturalHint: "Discuss current issues in Montréal: social change, cultural preservation, and economic development. Learn to express opinions respectfully." },
        { id: "frqc_b1_u1_l3", title: "News & Media", description: "Understand news broadcasts and articles", category: "listening", level: "B1", duration: 11, xp: 35, order: 3, culturalHint: "Listen to news from Montréal. Popular media sources, how news is reported, and key vocabulary for current events. Local radio, TV, and online media. Practice summarizing what you hear." },
        { id: "frqc_b1_u1_l4", title: "Formal vs Informal Register", description: "Switch between formal and casual speech appropriately", category: "grammar", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Québécois French has distinct formal/informal registers. Québécois 'tu' everyone (even strangers!), unlike France's strict 'vous' rules." },
        { id: "frqc_b1_u1_l5", title: "Opinion Essay", description: "Write a structured opinion piece on a cultural topic", category: "writing", level: "B1", duration: 12, xp: 35, order: 5, culturalHint: "Write about: 'What makes Québécois French culture unique in the modern world?' Use connectors, evidence, and conclusion." },
      ],
    },
    {
      id: "frqc_b1_u2", title: "Work, Business & Professional Life", level: "B1", order: 6,
      description: "Professional communication, job culture, and business etiquette",
      lessons: [
        { id: "frqc_b1_u2_l1", title: "Workplace Culture", description: "How work culture differs in this region", category: "reading", level: "B1", duration: 10, xp: 30, order: 1, culturalHint: "Work culture in Montréal: 5 à 7 (happy hour networking), bilingual workplaces, strong labor protections." },
        { id: "frqc_b1_u2_l2", title: "Job Interview Practice", description: "Prepare for and conduct a job interview", category: "speaking", level: "B1", duration: 12, xp: 35, order: 2, culturalHint: "Practice a job interview in Québécois French. Key phrases: introduce yourself, describe experience, ask about the role. In Montréal, be prepared to discuss both skills and cultural fit." },
        { id: "frqc_b1_u2_l3", title: "Email & Professional Writing", description: "Write formal emails, reports, and messages", category: "writing", level: "B1", duration: 10, xp: 30, order: 3, culturalHint: "Professional email etiquette in Québécois French. Use 'Bonjour' (not 'Cher'), end with 'Cordialement'. Quebec French formal writing differs from France." },
        { id: "frqc_b1_u2_l4", title: "Negotiation & Persuasion", description: "Negotiate prices, terms, and agreements", category: "grammar", level: "B1", duration: 11, xp: 35, order: 4, culturalHint: "Negotiation culture: Negotiation in Montréal requires patience and cultural awareness." },
        { id: "frqc_b1_u2_l5", title: "Listening: Business Meeting", description: "Understand a recorded business meeting", category: "listening", level: "B1", duration: 10, xp: 30, order: 5, culturalHint: "Listen to a business meeting in Québécois French. Notice how people address each other, how decisions are made, and how disagreements are handled. In Montréal, meeting dynamics reflect the local communication style." },
      ],
    },
    {
      id: "frqc_b2_u1", title: "Deep Culture & Identity", level: "B2", order: 7,
      description: "Literature, philosophy, identity, and cultural depth",
      lessons: [
        { id: "frqc_b2_u1_l1", title: "Literature & Poetry", description: "Read and discuss famous works from this culture", category: "reading", level: "B2", duration: 15, xp: 40, order: 1, culturalHint: "Québécois literature: Michel Tremblay's 'Les Belles-Sœurs' (in joual), Gabrielle Roy, Anne Hébert. The quiet revolution in literature." },
        { id: "frqc_b2_u1_l2", title: "Cultural Identity & Diaspora", description: "Discuss identity, belonging, and cultural preservation", category: "speaking", level: "B2", duration: 12, xp: 35, order: 2, culturalHint: "Québécois identity: 'Je me souviens' (I remember). Language as resistance. Bill 101 and protecting French in North America. Discuss in Québécois French." },
        { id: "frqc_b2_u1_l3", title: "Humor & Wordplay", description: "Understand jokes, puns, and cultural humor", category: "listening", level: "B2", duration: 10, xp: 30, order: 3, culturalHint: "Québécois French humor: Québécois humor: Les Têtes à Claques, Sugar Sammy, self-deprecating winter jokes. 'Tabarnac!' as expression." },
        { id: "frqc_b2_u1_l4", title: "Film & Cinema Analysis", description: "Analyze a film from this culture", category: "writing", level: "B2", duration: 14, xp: 40, order: 4, culturalHint: "Québécois cinema: Denis Villeneuve's early work, Xavier Dolan, 'C.R.A.Z.Y.'. Themes: identity, family, language. Write a film review in Québécois French." },
        { id: "frqc_b2_u1_l5", title: "Idiomatic Expressions", description: "Master local idioms and proverbs", category: "grammar", level: "B2", duration: 11, xp: 35, order: 5, culturalHint: "Québécois French idioms: 'Lâche pas la patate!' (Don't give up!). 'Il fait frette en tabarnac' (It's cold as hell). 'Avoir le feu au cul' (to be in a rush)." },
      ],
    },
    {
      id: "frqc_c1_u1", title: "Advanced Expression & Nuance", level: "C1", order: 8,
      description: "Subtle nuance, advanced argumentation, and cultural fluency",
      lessons: [
        { id: "frqc_c1_u1_l1", title: "Political Discourse", description: "Understand and discuss political topics with nuance", category: "listening", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "Political discourse in Québécois French: Political landscape of Montréal and how it's discussed locally." },
        { id: "frqc_c1_u1_l2", title: "Academic Writing", description: "Write research-level prose with proper argumentation", category: "writing", level: "C1", duration: 15, xp: 45, order: 2, culturalHint: "Academic writing in Québécois French: Québécois academic French follows international standards but with local terminology. OQLF (language office) guidelines. Write a 500-word essay on cabane à sucre (sugar shack)." },
        { id: "frqc_c1_u1_l3", title: "Dialect Switching", description: "Move between formal and dialectal registers fluidly", category: "speaking", level: "C1", duration: 12, xp: 40, order: 3, culturalHint: "Master code-switching: Switch between joual (informal Québécois), standard Québécois, and international French." },
        { id: "frqc_c1_u1_l4", title: "Debate & Persuasion", description: "Construct and defend complex arguments", category: "grammar", level: "C1", duration: 13, xp: 40, order: 4, culturalHint: "Debate culture: Québécois debate: direct, passionate about language rights and sovereignty. 'Écoute là...' (Listen here...)." },
        { id: "frqc_c1_u1_l5", title: "Cultural Commentary", description: "Write sophisticated cultural analysis", category: "reading", level: "C1", duration: 14, xp: 40, order: 5, culturalHint: "Read and analyze cultural commentary from Montréal. How Québécois French intellectuals discuss cultural preservation, globalization, and identity. Write your own cultural commentary." },
      ],
    },
    {
      id: "frqc_c2_u1", title: "Native-Level Fluency & Cultural Mastery", level: "C2", order: 9,
      description: "Near-native expression, cultural depth, and creative mastery",
      lessons: [
        { id: "frqc_c2_u1_l1", title: "Creative Writing", description: "Write poetry, fiction, or creative non-fiction", category: "writing", level: "C2", duration: 18, xp: 50, order: 1, culturalHint: "Write creatively in Québécois French: Create original literary work in Québécois French that captures the culture's essence." },
        { id: "frqc_c2_u1_l2", title: "Simultaneous Interpretation", description: "Translate complex speech in real-time between languages", category: "listening", level: "C2", duration: 15, xp: 50, order: 2, culturalHint: "Practice interpreting between Québécois French and English. Handle: formal speeches, casual conversations, and technical discussions. Cultural context is key — some concepts don't translate directly." },
        { id: "frqc_c2_u1_l3", title: "Teaching Others", description: "Explain grammar and culture to beginners", category: "speaking", level: "C2", duration: 12, xp: 45, order: 3, culturalHint: "The ultimate test: teach Québécois French to someone else. Explain: the unique features of Québécois French that make it special." },
        { id: "frqc_c2_u1_l4", title: "Cultural Mediation", description: "Bridge cultural misunderstandings between speakers", category: "grammar", level: "C2", duration: 14, xp: 45, order: 4, culturalHint: "Mediate between cultures: Help people from different cultures understand Québécois French communication styles." },
        { id: "frqc_c2_u1_l5", title: "Masterclass: Cultural Fluency", description: "Demonstrate complete cultural and linguistic mastery", category: "reading", level: "C2", duration: 16, xp: 50, order: 5, culturalHint: "Final challenge: Read a complex text about the future of Québécois French culture in a globalized world. Discuss with native-level fluency." },
      ],
    },
  ],
};

export const FRENCH_AFRICAN: LanguageCurriculum = {
  code: "fr-SN",
  name: "African French (Senegalese)",
  flag: "🇸🇳",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 95,
  units: [
    {
      id: "frsn_a1_u1", title: "First Steps — Greetings & Sounds", level: "A1", order: 1,
      description: "Basic greetings, alphabet/sounds, and survival phrases in African French (Senegalese)",
      lessons: [
        { id: "frsn_a1_u1_l1", title: "The Sound System", description: "Learn the unique sounds and pronunciation of African French (Senegalese)", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "African French (Senegalese) has unique sounds that differ from standard forms. Practice with local greetings: Nanga def? (How are you? — Wolof), Ça va un peu? (How's it going?). Listen to Youssou N'Dour to hear authentic pronunciation. The rhythm of African French (Senegalese) reflects the culture of Dakar." },
        { id: "frsn_a1_u1_l2", title: "Essential Greetings", description: "Hello, goodbye, please, thank you in African French (Senegalese)", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in African French (Senegalese): Nanga def? (How are you? — Wolof), Ça va un peu? (How's it going?), Je suis là (I'm here/I'm fine), On est ensemble (We're together/solidarity). In Dakar, people greet warmly — it's part of the culture of teranga (hospitality). Never skip greetings; it's considered rude." },
        { id: "frsn_a1_u1_l3", title: "Numbers & Money", description: "Count 1-100 and handle money in Dakar", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Practice numbers while ordering thiéboudienne (fish and rice) at a local restaurant. In Dakar, bargaining is part of market culture. Learn to ask 'How much?' like a local." },
        { id: "frsn_a1_u1_l4", title: "At the Local Market", description: "Navigate a market in Dakar — buying food and essentials", category: "listening", level: "A1", duration: 9, xp: 30, order: 4, culturalHint: "You're at a market in Dakar. Vendors call out selling yassa poulet (onion chicken) and mafé (peanut stew). Listen for prices, quantities, and the vendor's greeting. Market culture: ataya (tea ceremony)." },
        { id: "frsn_a1_u1_l5", title: "Write Your First Sentences", description: "Introduce yourself and describe your day", category: "writing", level: "A1", duration: 10, xp: 30, order: 5, culturalHint: "Write about yourself as if you just arrived in Dakar. Describe what you see, what you want to eat (thiéboudienne (fish and rice)? thiéré (couscous)?), and how you greet people. Use: Nanga def? (How are you? — Wolof)." },
      ],
    },
    {
      id: "frsn_a1_u2", title: "Daily Life & Food Culture", level: "A1", order: 2,
      description: "Food, family, and daily routines in African French (Senegalese) culture",
      lessons: [
        { id: "frsn_a1_u2_l1", title: "Local Food Vocabulary", description: "Learn the names of iconic dishes and ingredients", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "Essential food vocabulary: thiéboudienne, yassa poulet, mafé, thiéré, bissap, café Touba. In Dakar, thiéboudienne (fish and rice) is a staple — everyone eats it. Learn to order: 'Je veux thiéboudienne'." },
        { id: "frsn_a1_u2_l2", title: "Family & Relationships", description: "Family terms and how families interact in this culture", category: "grammar", level: "A1", duration: 10, xp: 30, order: 2, culturalHint: "Family is central in African French (Senegalese) culture. Extended families often live together or nearby. teranga (hospitality) reflects the importance of community. Learn family terms and how to describe your family to new friends in Dakar." },
        { id: "frsn_a1_u2_l3", title: "Ordering at a Restaurant", description: "Complete a meal order from greeting to paying", category: "speaking", level: "A1", duration: 9, xp: 30, order: 3, culturalHint: "You're at a restaurant in Dakar. The waiter greets you with 'Nanga def? (How are you? — Wolof)'. Order thiéboudienne (fish and rice) and bissap (hibiscus juice). Tipping customs vary by region." },
        { id: "frsn_a1_u2_l4", title: "Daily Routine", description: "Describe your morning, afternoon, and evening", category: "writing", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Write about a typical day in Dakar. Morning: start with coffee and local breakfast. Evening: griot storytelling." },
        { id: "frsn_a1_u2_l5", title: "Reading Local Signs", description: "Understand menus, street signs, and notices", category: "reading", level: "A1", duration: 7, xp: 20, order: 5, culturalHint: "Read real signs from Dakar: restaurant menus featuring thiéboudienne (fish and rice), street names, shop signs. In Saint-Louis, signs might be different from Dakar. Practice reading prices, hours, and directions." },
      ],
    },
    {
      id: "frsn_a2_u1", title: "Getting Around & Transportation", level: "A2", order: 3,
      description: "Navigate cities, use transport, and ask for directions",
      lessons: [
        { id: "frsn_a2_u1_l1", title: "Directions & Navigation", description: "Ask for and give directions in Dakar", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate Dakar like a local. Key landmarks, neighborhoods, and how people give directions here. In Dakar, ask locals — they love helping visitors!" },
        { id: "frsn_a2_u1_l2", title: "Public Transportation", description: "Buses, taxis, and local transport systems", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 2, culturalHint: "Transport in Dakar: car rapides, Dakar Dem Dikk buses, taxis. Learn to ask: 'How do I get to...?'" },
        { id: "frsn_a2_u1_l3", title: "At the Hotel/Airbnb", description: "Check in, ask about amenities, handle problems", category: "grammar", level: "A2", duration: 10, xp: 30, order: 3, culturalHint: "Staying in Dakar? Learn to check in, ask for wifi, request extra towels, and report issues. Accommodation culture in Dakar reflects local teranga (hospitality)." },
        { id: "frsn_a2_u1_l4", title: "Emergency Situations", description: "Health, safety, and asking for help", category: "listening", level: "A2", duration: 9, xp: 30, order: 4, culturalHint: "Essential emergency phrases in African French (Senegalese). How to say 'Help!', 'I need a doctor', 'Call the police'. In Dakar, know the local emergency numbers and nearest hospital." },
        { id: "frsn_a2_u1_l5", title: "Travel Journal Entry", description: "Write about your experiences exploring the city", category: "writing", level: "A2", duration: 10, xp: 30, order: 5, culturalHint: "Write a travel journal about Dakar. Describe the sights (Saint-Louis, Thiès), the food you tried (thiéboudienne (fish and rice), mafé (peanut stew)), and the people you met. Use past tense to describe what happened." },
      ],
    },
    {
      id: "frsn_a2_u2", title: "Culture, Music & Entertainment", level: "A2", order: 4,
      description: "Music, dance, celebrations, and entertainment culture",
      lessons: [
        { id: "frsn_a2_u2_l1", title: "Music & Dance", description: "Learn about sabar (drum dance) and local music culture", category: "vocabulary", level: "A2", duration: 9, xp: 30, order: 1, culturalHint: "African French (Senegalese) music culture: sabar (drum dance), mbalax (dance), ndaga, ventilateur. Listen to Youssou N'Dour, Baaba Maal, Akon, Wally Seck. sabar (drum dance) is more than dance — it's identity. Learn the vocabulary of rhythm, instruments, and movement." },
        { id: "frsn_a2_u2_l2", title: "Festivals & Celebrations", description: "Major holidays and how they're celebrated", category: "reading", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "Major celebrations: Tabaski (Eid al-Adha), Korité (Eid al-Fitr), Grand Magal de Touba, Independence Day (April 4). During Tabaski (Eid al-Adha), people celebrate with food, music, and family. Learn the vocabulary of celebration!" },
        { id: "frsn_a2_u2_l3", title: "Talking About Hobbies", description: "Discuss interests, sports, and leisure activities", category: "speaking", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Popular hobbies in Dakar: griot storytelling, music, and socializing. Talk about what you enjoy!" },
        { id: "frsn_a2_u2_l4", title: "Understanding Song Lyrics", description: "Analyze a popular song in African French (Senegalese)", category: "listening", level: "A2", duration: 10, xp: 35, order: 4, culturalHint: "Listen to Youssou N'Dour or Baaba Maal. Break down the lyrics — learn new vocabulary, cultural references, and emotional expressions. African French (Senegalese) songs often reference love, struggle, and cultural pride." },
        { id: "frsn_a2_u2_l5", title: "Writing a Party Invitation", description: "Invite friends to a cultural celebration", category: "writing", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "Write an invitation to a Tabaski (Eid al-Adha) party! Include: date, time, location (Dakar), what to bring, what to wear, and what food will be served (thiéboudienne (fish and rice), thiéré (couscous)). Use festive language and cultural expressions." },
      ],
    },
    {
      id: "frsn_b1_u1", title: "Society, History & Current Events", level: "B1", order: 5,
      description: "Discuss history, social issues, and current events",
      lessons: [
        { id: "frsn_b1_u1_l1", title: "Historical Context", description: "Key historical events that shaped this culture", category: "reading", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "Senegal's history: Gorée Island slave trade, Léopold Sédar Senghor (poet-president), négritude movement, independence from France in 1960. Discuss in African French (Senegalese)." },
        { id: "frsn_b1_u1_l2", title: "Social Issues & Opinions", description: "Express opinions about current social topics", category: "speaking", level: "B1", duration: 10, xp: 30, order: 2, culturalHint: "Discuss current issues in Dakar: social change, cultural preservation, and economic development. Learn to express opinions respectfully." },
        { id: "frsn_b1_u1_l3", title: "News & Media", description: "Understand news broadcasts and articles", category: "listening", level: "B1", duration: 11, xp: 35, order: 3, culturalHint: "Listen to news from Dakar. Popular media sources, how news is reported, and key vocabulary for current events. Local radio, TV, and online media. Practice summarizing what you hear." },
        { id: "frsn_b1_u1_l4", title: "Formal vs Informal Register", description: "Switch between formal and casual speech appropriately", category: "grammar", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "African French (Senegalese) has distinct formal/informal registers. Knowing when to be formal vs casual in Dakar shows cultural competence." },
        { id: "frsn_b1_u1_l5", title: "Opinion Essay", description: "Write a structured opinion piece on a cultural topic", category: "writing", level: "B1", duration: 12, xp: 35, order: 5, culturalHint: "Write about: 'What makes African French (Senegalese) culture unique in the modern world?' Use connectors, evidence, and conclusion." },
      ],
    },
    {
      id: "frsn_b1_u2", title: "Work, Business & Professional Life", level: "B1", order: 6,
      description: "Professional communication, job culture, and business etiquette",
      lessons: [
        { id: "frsn_b1_u2_l1", title: "Workplace Culture", description: "How work culture differs in this region", category: "reading", level: "B1", duration: 10, xp: 30, order: 1, culturalHint: "Work culture in Dakar: Professional norms in Dakar reflect teranga (hospitality)." },
        { id: "frsn_b1_u2_l2", title: "Job Interview Practice", description: "Prepare for and conduct a job interview", category: "speaking", level: "B1", duration: 12, xp: 35, order: 2, culturalHint: "Practice a job interview in African French (Senegalese). Key phrases: introduce yourself, describe experience, ask about the role. In Dakar, be prepared to discuss both skills and cultural fit." },
        { id: "frsn_b1_u2_l3", title: "Email & Professional Writing", description: "Write formal emails, reports, and messages", category: "writing", level: "B1", duration: 10, xp: 30, order: 3, culturalHint: "Professional email etiquette in African French (Senegalese). Formal writing conventions in African French (Senegalese)." },
        { id: "frsn_b1_u2_l4", title: "Negotiation & Persuasion", description: "Negotiate prices, terms, and agreements", category: "grammar", level: "B1", duration: 11, xp: 35, order: 4, culturalHint: "Negotiation culture: In Senegal, negotiation is social — rushing is rude. Share ataya (tea) first." },
        { id: "frsn_b1_u2_l5", title: "Listening: Business Meeting", description: "Understand a recorded business meeting", category: "listening", level: "B1", duration: 10, xp: 30, order: 5, culturalHint: "Listen to a business meeting in African French (Senegalese). Notice how people address each other, how decisions are made, and how disagreements are handled. In Dakar, meeting dynamics reflect the local communication style." },
      ],
    },
    {
      id: "frsn_b2_u1", title: "Deep Culture & Identity", level: "B2", order: 7,
      description: "Literature, philosophy, identity, and cultural depth",
      lessons: [
        { id: "frsn_b2_u1_l1", title: "Literature & Poetry", description: "Read and discuss famous works from this culture", category: "reading", level: "B2", duration: 15, xp: 40, order: 1, culturalHint: "Négritude movement: Léopold Sédar Senghor's poetry, Mariama Bâ's 'So Long a Letter', Ousmane Sembène's cinema." },
        { id: "frsn_b2_u1_l2", title: "Cultural Identity & Diaspora", description: "Discuss identity, belonging, and cultural preservation", category: "speaking", level: "B2", duration: 12, xp: 35, order: 2, culturalHint: "African French (Senegalese) identity and how it differs from the 'standard' form of the language. Discuss in African French (Senegalese)." },
        { id: "frsn_b2_u1_l3", title: "Humor & Wordplay", description: "Understand jokes, puns, and cultural humor", category: "listening", level: "B2", duration: 10, xp: 30, order: 3, culturalHint: "African French (Senegalese) humor: Local humor in Dakar — understanding jokes means you truly know the culture." },
        { id: "frsn_b2_u1_l4", title: "Film & Cinema Analysis", description: "Analyze a film from this culture", category: "writing", level: "B2", duration: 14, xp: 40, order: 4, culturalHint: "Senegalese cinema: Ousmane Sembène ('father of African cinema'), Djibril Diop Mambéty. Themes: colonialism, tradition vs modernity. Write a film review in African French (Senegalese)." },
        { id: "frsn_b2_u1_l5", title: "Idiomatic Expressions", description: "Master local idioms and proverbs", category: "grammar", level: "B2", duration: 11, xp: 35, order: 5, culturalHint: "African French (Senegalese) idioms: Local proverbs that reveal the wisdom of African French (Senegalese) culture." },
      ],
    },
    {
      id: "frsn_c1_u1", title: "Advanced Expression & Nuance", level: "C1", order: 8,
      description: "Subtle nuance, advanced argumentation, and cultural fluency",
      lessons: [
        { id: "frsn_c1_u1_l1", title: "Political Discourse", description: "Understand and discuss political topics with nuance", category: "listening", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "Political discourse in African French (Senegalese): Political landscape of Dakar and how it's discussed locally." },
        { id: "frsn_c1_u1_l2", title: "Academic Writing", description: "Write research-level prose with proper argumentation", category: "writing", level: "C1", duration: 15, xp: 45, order: 2, culturalHint: "Academic writing in African French (Senegalese): Academic conventions in African French (Senegalese) — formal register, citations, argumentation. Write a 500-word essay on teranga (hospitality)." },
        { id: "frsn_c1_u1_l3", title: "Dialect Switching", description: "Move between formal and dialectal registers fluidly", category: "speaking", level: "C1", duration: 12, xp: 40, order: 3, culturalHint: "Master code-switching: Navigate between African French (Senegalese) and the standard form of the language." },
        { id: "frsn_c1_u1_l4", title: "Debate & Persuasion", description: "Construct and defend complex arguments", category: "grammar", level: "C1", duration: 13, xp: 40, order: 4, culturalHint: "Debate culture: Persuasion techniques in African French (Senegalese) culture — how to argue effectively and respectfully." },
        { id: "frsn_c1_u1_l5", title: "Cultural Commentary", description: "Write sophisticated cultural analysis", category: "reading", level: "C1", duration: 14, xp: 40, order: 5, culturalHint: "Read and analyze cultural commentary from Dakar. How African French (Senegalese) intellectuals discuss cultural preservation, globalization, and identity. Write your own cultural commentary." },
      ],
    },
    {
      id: "frsn_c2_u1", title: "Native-Level Fluency & Cultural Mastery", level: "C2", order: 9,
      description: "Near-native expression, cultural depth, and creative mastery",
      lessons: [
        { id: "frsn_c2_u1_l1", title: "Creative Writing", description: "Write poetry, fiction, or creative non-fiction", category: "writing", level: "C2", duration: 18, xp: 50, order: 1, culturalHint: "Write creatively in African French (Senegalese): Create original literary work in African French (Senegalese) that captures the culture's essence." },
        { id: "frsn_c2_u1_l2", title: "Simultaneous Interpretation", description: "Translate complex speech in real-time between languages", category: "listening", level: "C2", duration: 15, xp: 50, order: 2, culturalHint: "Practice interpreting between African French (Senegalese) and English. Handle: formal speeches, casual conversations, and technical discussions. Cultural context is key — some concepts don't translate directly." },
        { id: "frsn_c2_u1_l3", title: "Teaching Others", description: "Explain grammar and culture to beginners", category: "speaking", level: "C2", duration: 12, xp: 45, order: 3, culturalHint: "The ultimate test: teach African French (Senegalese) to someone else. Explain: the unique features of African French (Senegalese) that make it special." },
        { id: "frsn_c2_u1_l4", title: "Cultural Mediation", description: "Bridge cultural misunderstandings between speakers", category: "grammar", level: "C2", duration: 14, xp: 45, order: 4, culturalHint: "Mediate between cultures: Help people from different cultures understand African French (Senegalese) communication styles." },
        { id: "frsn_c2_u1_l5", title: "Masterclass: Cultural Fluency", description: "Demonstrate complete cultural and linguistic mastery", category: "reading", level: "C2", duration: 16, xp: 50, order: 5, culturalHint: "Final challenge: Read a complex text about the future of African French (Senegalese) culture in a globalized world. Discuss with native-level fluency." },
      ],
    },
  ],
};

export const PORTUGUESE_BRAZILIAN: LanguageCurriculum = {
  code: "pt-BR",
  name: "Brazilian Portuguese",
  flag: "🇧🇷",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 95,
  units: [
    {
      id: "ptbr_a1_u1", title: "First Steps — Greetings & Sounds", level: "A1", order: 1,
      description: "Basic greetings, alphabet/sounds, and survival phrases in Brazilian Portuguese",
      lessons: [
        { id: "ptbr_a1_u1_l1", title: "The Sound System", description: "Learn the unique sounds and pronunciation of Brazilian Portuguese", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "Brazilian Portuguese has unique sounds that differ from standard forms. Practice with local greetings: E aí? (What's up?), Tudo bem? (All good?). Listen to Tom Jobim to hear authentic pronunciation. The rhythm of Brazilian Portuguese reflects the culture of Rio de Janeiro." },
        { id: "ptbr_a1_u1_l2", title: "Essential Greetings", description: "Hello, goodbye, please, thank you in Brazilian Portuguese", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in Brazilian Portuguese: E aí? (What's up?), Tudo bem? (All good?), Beleza! (Cool!), Valeu! (Thanks!), Falou! (See ya!). In Rio de Janeiro, people greet warmly — it's part of the culture of roda de samba. Never skip greetings; it's considered rude." },
        { id: "ptbr_a1_u1_l3", title: "Numbers & Money", description: "Count 1-100 and handle money in Rio de Janeiro", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Practice numbers while ordering feijoada (black bean stew) at a local restaurant. In Rio de Janeiro, bargaining is common at local markets. Learn to ask 'How much?' like a local." },
        { id: "ptbr_a1_u1_l4", title: "At the Local Market", description: "Navigate a market in Rio de Janeiro — buying food and essentials", category: "listening", level: "A1", duration: 9, xp: 30, order: 4, culturalHint: "You're at a market in Rio de Janeiro. Vendors call out selling pão de queijo (cheese bread) and açaí bowl. Listen for prices, quantities, and the vendor's greeting. Market culture: jeitinho brasileiro." },
        { id: "ptbr_a1_u1_l5", title: "Write Your First Sentences", description: "Introduce yourself and describe your day", category: "writing", level: "A1", duration: 10, xp: 30, order: 5, culturalHint: "Write about yourself as if you just arrived in Rio de Janeiro. Describe what you see, what you want to eat (feijoada (black bean stew)? coxinha (chicken croquette)?), and how you greet people. Use: E aí? (What's up?)." },
      ],
    },
    {
      id: "ptbr_a1_u2", title: "Daily Life & Food Culture", level: "A1", order: 2,
      description: "Food, family, and daily routines in Brazilian Portuguese culture",
      lessons: [
        { id: "ptbr_a1_u2_l1", title: "Local Food Vocabulary", description: "Learn the names of iconic dishes and ingredients", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "Essential food vocabulary: feijoada, pão de queijo, açaí bowl, coxinha, brigadeiro, churrasco. In Rio de Janeiro, feijoada (black bean stew) is a staple — everyone eats it. Learn to order: 'Eu quero feijoada'." },
        { id: "ptbr_a1_u2_l2", title: "Family & Relationships", description: "Family terms and how families interact in this culture", category: "grammar", level: "A1", duration: 10, xp: 30, order: 2, culturalHint: "Family is central in Brazilian Portuguese culture. Extended families often live together or nearby. roda de samba reflects the importance of community. Learn family terms and how to describe your family to new friends in Rio de Janeiro." },
        { id: "ptbr_a1_u2_l3", title: "Ordering at a Restaurant", description: "Complete a meal order from greeting to paying", category: "speaking", level: "A1", duration: 9, xp: 30, order: 3, culturalHint: "You're at a restaurant in Rio de Janeiro. The waiter greets you with 'E aí? (What's up?)'. Order feijoada (black bean stew) and brigadeiro (chocolate truffle). Look for 'serviço incluído' (service included)." },
        { id: "ptbr_a1_u2_l4", title: "Daily Routine", description: "Describe your morning, afternoon, and evening", category: "writing", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Write about a typical day in Rio de Janeiro. Morning: café da manhã with pão de queijo and strong coffee. Evening: futebol culture." },
        { id: "ptbr_a1_u2_l5", title: "Reading Local Signs", description: "Understand menus, street signs, and notices", category: "reading", level: "A1", duration: 7, xp: 20, order: 5, culturalHint: "Read real signs from Rio de Janeiro: restaurant menus featuring feijoada (black bean stew), street names, shop signs. In São Paulo, signs might be different from Rio de Janeiro. Practice reading prices, hours, and directions." },
      ],
    },
    {
      id: "ptbr_a2_u1", title: "Getting Around & Transportation", level: "A2", order: 3,
      description: "Navigate cities, use transport, and ask for directions",
      lessons: [
        { id: "ptbr_a2_u1_l1", title: "Directions & Navigation", description: "Ask for and give directions in Rio de Janeiro", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate Rio de Janeiro like a local. Key landmarks, neighborhoods, and how people give directions here. Brazilians say 'segue reto' (go straight), 'vira à esquerda' (turn left)" },
        { id: "ptbr_a2_u1_l2", title: "Public Transportation", description: "Buses, taxis, and local transport systems", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 2, culturalHint: "Transport in Rio de Janeiro: ônibus, metrô, and Uber. Learn to ask: 'How do I get to...?'" },
        { id: "ptbr_a2_u1_l3", title: "At the Hotel/Airbnb", description: "Check in, ask about amenities, handle problems", category: "grammar", level: "A2", duration: 10, xp: 30, order: 3, culturalHint: "Staying in Rio de Janeiro? Learn to check in, ask for wifi, request extra towels, and report issues. Accommodation culture in Rio de Janeiro reflects local roda de samba." },
        { id: "ptbr_a2_u1_l4", title: "Emergency Situations", description: "Health, safety, and asking for help", category: "listening", level: "A2", duration: 9, xp: 30, order: 4, culturalHint: "Essential emergency phrases in Brazilian Portuguese. How to say 'Help!', 'I need a doctor', 'Call the police'. In Rio de Janeiro, know the local emergency numbers and nearest hospital." },
        { id: "ptbr_a2_u1_l5", title: "Travel Journal Entry", description: "Write about your experiences exploring the city", category: "writing", level: "A2", duration: 10, xp: 30, order: 5, culturalHint: "Write a travel journal about Rio de Janeiro. Describe the sights (São Paulo, Salvador), the food you tried (feijoada (black bean stew), açaí bowl), and the people you met. Use past tense to describe what happened." },
      ],
    },
    {
      id: "ptbr_a2_u2", title: "Culture, Music & Entertainment", level: "A2", order: 4,
      description: "Music, dance, celebrations, and entertainment culture",
      lessons: [
        { id: "ptbr_a2_u2_l1", title: "Music & Dance", description: "Learn about samba and local music culture", category: "vocabulary", level: "A2", duration: 9, xp: 30, order: 1, culturalHint: "Brazilian Portuguese music culture: samba, forró, axé, funk carioca, frevo, bossa nova. Listen to Tom Jobim, Gilberto Gil, Anitta, Jorge Ben Jor, Caetano Veloso. samba is more than dance — it's identity. Learn the vocabulary of rhythm, instruments, and movement." },
        { id: "ptbr_a2_u2_l2", title: "Festivals & Celebrations", description: "Major holidays and how they're celebrated", category: "reading", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "Major celebrations: Carnaval (February/March), Festa Junina (June), Réveillon (New Year's), Dia da Consciência Negra (Nov 20). During Carnaval (February/March), people dance samba in the streets for days. Learn the vocabulary of celebration!" },
        { id: "ptbr_a2_u2_l3", title: "Talking About Hobbies", description: "Discuss interests, sports, and leisure activities", category: "speaking", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Popular hobbies in Rio de Janeiro: futebol, praia (beach), churrasco with friends, novelas. Talk about what you enjoy!" },
        { id: "ptbr_a2_u2_l4", title: "Understanding Song Lyrics", description: "Analyze a popular song in Brazilian Portuguese", category: "listening", level: "A2", duration: 10, xp: 35, order: 4, culturalHint: "Listen to Tom Jobim or Gilberto Gil. Break down the lyrics — learn new vocabulary, cultural references, and emotional expressions. Brazilian Portuguese songs often reference saudade, love, and the beauty of Brazil." },
        { id: "ptbr_a2_u2_l5", title: "Writing a Party Invitation", description: "Invite friends to a cultural celebration", category: "writing", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "Write an invitation to a Carnaval (February/March) party! Include: date, time, location (Rio de Janeiro), what to bring, what to wear, and what food will be served (feijoada (black bean stew), coxinha (chicken croquette)). Use festive language and cultural expressions." },
      ],
    },
    {
      id: "ptbr_b1_u1", title: "Society, History & Current Events", level: "B1", order: 5,
      description: "Discuss history, social issues, and current events",
      lessons: [
        { id: "ptbr_b1_u1_l1", title: "Historical Context", description: "Key historical events that shaped this culture", category: "reading", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "Brazil's complex history: indigenous peoples, Portuguese colonization, slavery, the golden age, independence (1822), and modern democracy. Discuss in Brazilian Portuguese." },
        { id: "ptbr_b1_u1_l2", title: "Social Issues & Opinions", description: "Express opinions about current social topics", category: "speaking", level: "B1", duration: 10, xp: 30, order: 2, culturalHint: "Discuss current issues in Rio de Janeiro: inequality, education access, environmental protection of the Amazon. Learn to express opinions respectfully." },
        { id: "ptbr_b1_u1_l3", title: "News & Media", description: "Understand news broadcasts and articles", category: "listening", level: "B1", duration: 11, xp: 35, order: 3, culturalHint: "Listen to news from Rio de Janeiro. Popular media sources, how news is reported, and key vocabulary for current events. Globo, Folha de São Paulo, and social media news. Practice summarizing what you hear." },
        { id: "ptbr_b1_u1_l4", title: "Formal vs Informal Register", description: "Switch between formal and casual speech appropriately", category: "grammar", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Brazilian Portuguese has distinct formal/informal registers. 'Você' (you-informal) vs 'o senhor/a senhora' (you-formal). Brazilians are generally informal but respect hierarchy." },
        { id: "ptbr_b1_u1_l5", title: "Opinion Essay", description: "Write a structured opinion piece on a cultural topic", category: "writing", level: "B1", duration: 12, xp: 35, order: 5, culturalHint: "Write about: 'Is Carnival just a party or a cultural expression of resistance?' Use connectors, evidence, and conclusion." },
      ],
    },
    {
      id: "ptbr_b1_u2", title: "Work, Business & Professional Life", level: "B1", order: 6,
      description: "Professional communication, job culture, and business etiquette",
      lessons: [
        { id: "ptbr_b1_u2_l1", title: "Workplace Culture", description: "How work culture differs in this region", category: "reading", level: "B1", duration: 10, xp: 30, order: 1, culturalHint: "Work culture in Rio de Janeiro: Relationships matter more than punctuality. 'Jeitinho' (finding creative solutions) is valued. Lunch breaks are long and social." },
        { id: "ptbr_b1_u2_l2", title: "Job Interview Practice", description: "Prepare for and conduct a job interview", category: "speaking", level: "B1", duration: 12, xp: 35, order: 2, culturalHint: "Practice a job interview in Brazilian Portuguese. Key phrases: introduce yourself, describe experience, ask about the role. In Rio de Janeiro, be prepared to discuss both skills and cultural fit." },
        { id: "ptbr_b1_u2_l3", title: "Email & Professional Writing", description: "Write formal emails, reports, and messages", category: "writing", level: "B1", duration: 10, xp: 30, order: 3, culturalHint: "Professional email etiquette in Brazilian Portuguese. Start with 'Prezado/a' (Dear), end with 'Atenciosamente' (Sincerely). Brazilians are warm even in formal writing." },
        { id: "ptbr_b1_u2_l4", title: "Negotiation & Persuasion", description: "Negotiate prices, terms, and agreements", category: "grammar", level: "B1", duration: 11, xp: 35, order: 4, culturalHint: "Negotiation culture: Brazilians negotiate with warmth. 'Dar um jeitinho' means finding a creative solution. Relationships unlock deals." },
        { id: "ptbr_b1_u2_l5", title: "Listening: Business Meeting", description: "Understand a recorded business meeting", category: "listening", level: "B1", duration: 10, xp: 30, order: 5, culturalHint: "Listen to a business meeting in Brazilian Portuguese. Notice how people address each other, how decisions are made, and how disagreements are handled. In Rio de Janeiro, meeting dynamics reflect the local communication style." },
      ],
    },
    {
      id: "ptbr_b2_u1", title: "Deep Culture & Identity", level: "B2", order: 7,
      description: "Literature, philosophy, identity, and cultural depth",
      lessons: [
        { id: "ptbr_b2_u1_l1", title: "Literature & Poetry", description: "Read and discuss famous works from this culture", category: "reading", level: "B2", duration: 15, xp: 40, order: 1, culturalHint: "Brazilian literature: Machado de Assis, Clarice Lispector, Jorge Amado. Tropicália movement, concrete poetry." },
        { id: "ptbr_b2_u1_l2", title: "Cultural Identity & Diaspora", description: "Discuss identity, belonging, and cultural preservation", category: "speaking", level: "B2", duration: 12, xp: 35, order: 2, culturalHint: "Brazilian identity: racial democracy myth vs reality, 'brasilidade', cultural syncretism (African, Indigenous, European). Discuss in Brazilian Portuguese." },
        { id: "ptbr_b2_u1_l3", title: "Humor & Wordplay", description: "Understand jokes, puns, and cultural humor", category: "listening", level: "B2", duration: 10, xp: 30, order: 3, culturalHint: "Brazilian Portuguese humor: Brazilian humor: piadas (jokes), trocadilhos (puns), memes. Self-deprecating humor about 'jeitinho brasileiro'." },
        { id: "ptbr_b2_u1_l4", title: "Film & Cinema Analysis", description: "Analyze a film from this culture", category: "writing", level: "B2", duration: 14, xp: 40, order: 4, culturalHint: "Brazilian cinema: 'Cidade de Deus' (City of God), 'Central do Brasil', 'Bacurau'. Themes: inequality, identity, resilience. Write a film review in Brazilian Portuguese." },
        { id: "ptbr_b2_u1_l5", title: "Idiomatic Expressions", description: "Master local idioms and proverbs", category: "grammar", level: "B2", duration: 11, xp: 35, order: 5, culturalHint: "Brazilian Portuguese idioms: 'Quem não tem cão, caça com gato' (Who has no dog, hunts with cat — make do). 'Água mole em pedra dura, tanto bate até que fura' (Persistence pays)." },
      ],
    },
    {
      id: "ptbr_c1_u1", title: "Advanced Expression & Nuance", level: "C1", order: 8,
      description: "Subtle nuance, advanced argumentation, and cultural fluency",
      lessons: [
        { id: "ptbr_c1_u1_l1", title: "Political Discourse", description: "Understand and discuss political topics with nuance", category: "listening", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "Political discourse in Brazilian Portuguese: Brazilian politics: left vs right, corruption scandals, social movements. Understand 'politiquês' (political jargon)." },
        { id: "ptbr_c1_u1_l2", title: "Academic Writing", description: "Write research-level prose with proper argumentation", category: "writing", level: "C1", duration: 15, xp: 45, order: 2, culturalHint: "Academic writing in Brazilian Portuguese: Brazilian academic style: ABNT formatting, formal register, subjunctive mood mastery. Write a 500-word essay on roda de samba." },
        { id: "ptbr_c1_u1_l3", title: "Dialect Switching", description: "Move between formal and dialectal registers fluidly", category: "speaking", level: "C1", duration: 12, xp: 40, order: 3, culturalHint: "Master code-switching: Switch between informal Brazilian ('tá ligado?', 'mano') and formal Portuguese ('o senhor compreende?')." },
        { id: "ptbr_c1_u1_l4", title: "Debate & Persuasion", description: "Construct and defend complex arguments", category: "grammar", level: "C1", duration: 13, xp: 40, order: 4, culturalHint: "Debate culture: Brazilian argumentation: storytelling approach, emotional appeals, 'mas olha...' (but look...) to redirect." },
        { id: "ptbr_c1_u1_l5", title: "Cultural Commentary", description: "Write sophisticated cultural analysis", category: "reading", level: "C1", duration: 14, xp: 40, order: 5, culturalHint: "Read and analyze cultural commentary from Rio de Janeiro. Brazilian cultural critics: discuss racial identity, class, globalization's impact on local culture. Write your own cultural commentary." },
      ],
    },
    {
      id: "ptbr_c2_u1", title: "Native-Level Fluency & Cultural Mastery", level: "C2", order: 9,
      description: "Near-native expression, cultural depth, and creative mastery",
      lessons: [
        { id: "ptbr_c2_u1_l1", title: "Creative Writing", description: "Write poetry, fiction, or creative non-fiction", category: "writing", level: "C2", duration: 18, xp: 50, order: 1, culturalHint: "Write creatively in Brazilian Portuguese: Write a crônica (Brazilian literary essay) about life in ${culture.cities[0]}. Channel Clarice Lispector's introspection or Jorge Amado's vivid characters." },
        { id: "ptbr_c2_u1_l2", title: "Simultaneous Interpretation", description: "Translate complex speech in real-time between languages", category: "listening", level: "C2", duration: 15, xp: 50, order: 2, culturalHint: "Practice interpreting between Brazilian Portuguese and English. Handle: TED talks, business presentations, casual conversations — each with different slang levels. Cultural context is key — some concepts don't translate directly." },
        { id: "ptbr_c2_u1_l3", title: "Teaching Others", description: "Explain grammar and culture to beginners", category: "speaking", level: "C2", duration: 12, xp: 45, order: 3, culturalHint: "The ultimate test: teach Brazilian Portuguese to someone else. Explain: why Brazilians use 'você' while Portuguese use 'tu', the difference between 'legal' (cool) and 'legal' (legal)." },
        { id: "ptbr_c2_u1_l4", title: "Cultural Mediation", description: "Bridge cultural misunderstandings between speakers", category: "grammar", level: "C2", duration: 14, xp: 45, order: 4, culturalHint: "Mediate between cultures: Explain to a German colleague why the Brazilian team is 30 minutes late (it's not disrespect — time is more fluid in Brazil)." },
        { id: "ptbr_c2_u1_l5", title: "Masterclass: Cultural Fluency", description: "Demonstrate complete cultural and linguistic mastery", category: "reading", level: "C2", duration: 16, xp: 50, order: 5, culturalHint: "Final challenge: Read a complex text about Brazil's role in BRICS, the tension between development and Amazon preservation, and Brazilian cultural exports (music, football, telenovelas). Discuss with native-level fluency." },
      ],
    },
  ],
};

export const PORTUGUESE_EUROPEAN: LanguageCurriculum = {
  code: "pt-PT",
  name: "European Portuguese",
  flag: "🇵🇹",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 95,
  units: [
    {
      id: "ptpt_a1_u1", title: "First Steps — Greetings & Sounds", level: "A1", order: 1,
      description: "Basic greetings, alphabet/sounds, and survival phrases in European Portuguese",
      lessons: [
        { id: "ptpt_a1_u1_l1", title: "The Sound System", description: "Learn the unique sounds and pronunciation of European Portuguese", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "European Portuguese has unique sounds that differ from standard forms. Practice with local greetings: Olá! (Hello), Tudo bem? (All good?). Listen to Amália Rodrigues to hear authentic pronunciation. The rhythm of European Portuguese reflects the culture of Lisboa (Lisbon)." },
        { id: "ptpt_a1_u1_l2", title: "Essential Greetings", description: "Hello, goodbye, please, thank you in European Portuguese", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in European Portuguese: Olá! (Hello), Tudo bem? (All good?), Bom dia! (Good morning), Está bom? (Is it good?/How are you?). In Lisboa (Lisbon), people greet warmly — it's part of the culture of saudade (untranslatable longing). Never skip greetings; it's considered rude." },
        { id: "ptpt_a1_u1_l3", title: "Numbers & Money", description: "Count 1-100 and handle money in Lisboa (Lisbon)", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Practice numbers while ordering bacalhau (salt cod — 365 recipes!) at a local restaurant. In Lisboa (Lisbon), bargaining is common at local markets. Learn to ask 'How much?' like a local." },
        { id: "ptpt_a1_u1_l4", title: "At the Local Market", description: "Navigate a market in Lisboa (Lisbon) — buying food and essentials", category: "listening", level: "A1", duration: 9, xp: 30, order: 4, culturalHint: "You're at a market in Lisboa (Lisbon). Vendors call out selling pastel de nata (custard tart) and caldo verde (kale soup). Listen for prices, quantities, and the vendor's greeting. Market culture: azulejo tiles." },
        { id: "ptpt_a1_u1_l5", title: "Write Your First Sentences", description: "Introduce yourself and describe your day", category: "writing", level: "A1", duration: 10, xp: 30, order: 5, culturalHint: "Write about yourself as if you just arrived in Lisboa (Lisbon). Describe what you see, what you want to eat (bacalhau (salt cod — 365 recipes!)? francesinha (Porto sandwich)?), and how you greet people. Use: Olá! (Hello)." },
      ],
    },
    {
      id: "ptpt_a1_u2", title: "Daily Life & Food Culture", level: "A1", order: 2,
      description: "Food, family, and daily routines in European Portuguese culture",
      lessons: [
        { id: "ptpt_a1_u2_l1", title: "Local Food Vocabulary", description: "Learn the names of iconic dishes and ingredients", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "Essential food vocabulary: bacalhau, pastel de nata, caldo verde, francesinha, sardinhas assadas, arroz de marisco. In Lisboa (Lisbon), bacalhau (salt cod — 365 recipes!) is a staple — everyone eats it. Learn to order: 'Eu quero bacalhau'." },
        { id: "ptpt_a1_u2_l2", title: "Family & Relationships", description: "Family terms and how families interact in this culture", category: "grammar", level: "A1", duration: 10, xp: 30, order: 2, culturalHint: "Family is central in European Portuguese culture. Extended families often live together or nearby. saudade (untranslatable longing) reflects the importance of community. Learn family terms and how to describe your family to new friends in Lisboa (Lisbon)." },
        { id: "ptpt_a1_u2_l3", title: "Ordering at a Restaurant", description: "Complete a meal order from greeting to paying", category: "speaking", level: "A1", duration: 9, xp: 30, order: 3, culturalHint: "You're at a restaurant in Lisboa (Lisbon). The waiter greets you with 'Olá! (Hello)'. Order bacalhau (salt cod — 365 recipes!) and sardinhas assadas (grilled sardines). Tipping customs vary by region." },
        { id: "ptpt_a1_u2_l4", title: "Daily Routine", description: "Describe your morning, afternoon, and evening", category: "writing", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Write about a typical day in Lisboa (Lisbon). Morning: start with coffee and local breakfast. Evening: café culture." },
        { id: "ptpt_a1_u2_l5", title: "Reading Local Signs", description: "Understand menus, street signs, and notices", category: "reading", level: "A1", duration: 7, xp: 20, order: 5, culturalHint: "Read real signs from Lisboa (Lisbon): restaurant menus featuring bacalhau (salt cod — 365 recipes!), street names, shop signs. In Porto, signs might be different from Lisboa (Lisbon). Practice reading prices, hours, and directions." },
      ],
    },
    {
      id: "ptpt_a2_u1", title: "Getting Around & Transportation", level: "A2", order: 3,
      description: "Navigate cities, use transport, and ask for directions",
      lessons: [
        { id: "ptpt_a2_u1_l1", title: "Directions & Navigation", description: "Ask for and give directions in Lisboa (Lisbon)", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate Lisboa (Lisbon) like a local. Key landmarks, neighborhoods, and how people give directions here. In Lisboa (Lisbon), ask locals — they love helping visitors!" },
        { id: "ptpt_a2_u1_l2", title: "Public Transportation", description: "Buses, taxis, and local transport systems", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 2, culturalHint: "Transport in Lisboa (Lisbon): local buses and taxis. Learn to ask: 'How do I get to...?'" },
        { id: "ptpt_a2_u1_l3", title: "At the Hotel/Airbnb", description: "Check in, ask about amenities, handle problems", category: "grammar", level: "A2", duration: 10, xp: 30, order: 3, culturalHint: "Staying in Lisboa (Lisbon)? Learn to check in, ask for wifi, request extra towels, and report issues. Accommodation culture in Lisboa (Lisbon) reflects local saudade (untranslatable longing)." },
        { id: "ptpt_a2_u1_l4", title: "Emergency Situations", description: "Health, safety, and asking for help", category: "listening", level: "A2", duration: 9, xp: 30, order: 4, culturalHint: "Essential emergency phrases in European Portuguese. How to say 'Help!', 'I need a doctor', 'Call the police'. In Lisboa (Lisbon), know the local emergency numbers and nearest hospital." },
        { id: "ptpt_a2_u1_l5", title: "Travel Journal Entry", description: "Write about your experiences exploring the city", category: "writing", level: "A2", duration: 10, xp: 30, order: 5, culturalHint: "Write a travel journal about Lisboa (Lisbon). Describe the sights (Porto, Coimbra), the food you tried (bacalhau (salt cod — 365 recipes!), caldo verde (kale soup)), and the people you met. Use past tense to describe what happened." },
      ],
    },
    {
      id: "ptpt_a2_u2", title: "Culture, Music & Entertainment", level: "A2", order: 4,
      description: "Music, dance, celebrations, and entertainment culture",
      lessons: [
        { id: "ptpt_a2_u2_l1", title: "Music & Dance", description: "Learn about fado (emotional singing) and local music culture", category: "vocabulary", level: "A2", duration: 9, xp: 30, order: 1, culturalHint: "European Portuguese music culture: fado (emotional singing), vira (folk dance), corridinho (Algarve dance). Listen to Amália Rodrigues, Mariza, Madredeus, Ana Moura. fado (emotional singing) is more than dance — it's identity. Learn the vocabulary of rhythm, instruments, and movement." },
        { id: "ptpt_a2_u2_l2", title: "Festivals & Celebrations", description: "Major holidays and how they're celebrated", category: "reading", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "Major celebrations: Santos Populares (June — Lisbon), Dia de Portugal (June 10), Carnaval de Torres Vedras, Festas do Senhor Santo Cristo (Azores). During Santos Populares (June — Lisbon), people celebrate with food, music, and family. Learn the vocabulary of celebration!" },
        { id: "ptpt_a2_u2_l3", title: "Talking About Hobbies", description: "Discuss interests, sports, and leisure activities", category: "speaking", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Popular hobbies in Lisboa (Lisbon): café culture, music, and socializing. Talk about what you enjoy!" },
        { id: "ptpt_a2_u2_l4", title: "Understanding Song Lyrics", description: "Analyze a popular song in European Portuguese", category: "listening", level: "A2", duration: 10, xp: 35, order: 4, culturalHint: "Listen to Amália Rodrigues or Mariza. Break down the lyrics — learn new vocabulary, cultural references, and emotional expressions. European Portuguese songs often reference love, struggle, and cultural pride." },
        { id: "ptpt_a2_u2_l5", title: "Writing a Party Invitation", description: "Invite friends to a cultural celebration", category: "writing", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "Write an invitation to a Santos Populares (June — Lisbon) party! Include: date, time, location (Lisboa (Lisbon)), what to bring, what to wear, and what food will be served (bacalhau (salt cod — 365 recipes!), francesinha (Porto sandwich)). Use festive language and cultural expressions." },
      ],
    },
    {
      id: "ptpt_b1_u1", title: "Society, History & Current Events", level: "B1", order: 5,
      description: "Discuss history, social issues, and current events",
      lessons: [
        { id: "ptpt_b1_u1_l1", title: "Historical Context", description: "Key historical events that shaped this culture", category: "reading", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "Age of Discovery, Vasco da Gama, the Carnation Revolution (1974) that ended dictatorship, EU membership. Discuss in European Portuguese." },
        { id: "ptpt_b1_u1_l2", title: "Social Issues & Opinions", description: "Express opinions about current social topics", category: "speaking", level: "B1", duration: 10, xp: 30, order: 2, culturalHint: "Discuss current issues in Lisboa (Lisbon): social change, cultural preservation, and economic development. Learn to express opinions respectfully." },
        { id: "ptpt_b1_u1_l3", title: "News & Media", description: "Understand news broadcasts and articles", category: "listening", level: "B1", duration: 11, xp: 35, order: 3, culturalHint: "Listen to news from Lisboa (Lisbon). Popular media sources, how news is reported, and key vocabulary for current events. Local radio, TV, and online media. Practice summarizing what you hear." },
        { id: "ptpt_b1_u1_l4", title: "Formal vs Informal Register", description: "Switch between formal and casual speech appropriately", category: "grammar", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "European Portuguese has distinct formal/informal registers. Knowing when to be formal vs casual in Lisboa (Lisbon) shows cultural competence." },
        { id: "ptpt_b1_u1_l5", title: "Opinion Essay", description: "Write a structured opinion piece on a cultural topic", category: "writing", level: "B1", duration: 12, xp: 35, order: 5, culturalHint: "Write about: 'What makes European Portuguese culture unique in the modern world?' Use connectors, evidence, and conclusion." },
      ],
    },
    {
      id: "ptpt_b1_u2", title: "Work, Business & Professional Life", level: "B1", order: 6,
      description: "Professional communication, job culture, and business etiquette",
      lessons: [
        { id: "ptpt_b1_u2_l1", title: "Workplace Culture", description: "How work culture differs in this region", category: "reading", level: "B1", duration: 10, xp: 30, order: 1, culturalHint: "Work culture in Lisboa (Lisbon): Professional norms in Lisboa (Lisbon) reflect saudade (untranslatable longing)." },
        { id: "ptpt_b1_u2_l2", title: "Job Interview Practice", description: "Prepare for and conduct a job interview", category: "speaking", level: "B1", duration: 12, xp: 35, order: 2, culturalHint: "Practice a job interview in European Portuguese. Key phrases: introduce yourself, describe experience, ask about the role. In Lisboa (Lisbon), be prepared to discuss both skills and cultural fit." },
        { id: "ptpt_b1_u2_l3", title: "Email & Professional Writing", description: "Write formal emails, reports, and messages", category: "writing", level: "B1", duration: 10, xp: 30, order: 3, culturalHint: "Professional email etiquette in European Portuguese. Formal writing conventions in European Portuguese." },
        { id: "ptpt_b1_u2_l4", title: "Negotiation & Persuasion", description: "Negotiate prices, terms, and agreements", category: "grammar", level: "B1", duration: 11, xp: 35, order: 4, culturalHint: "Negotiation culture: Negotiation in Lisboa (Lisbon) requires patience and cultural awareness." },
        { id: "ptpt_b1_u2_l5", title: "Listening: Business Meeting", description: "Understand a recorded business meeting", category: "listening", level: "B1", duration: 10, xp: 30, order: 5, culturalHint: "Listen to a business meeting in European Portuguese. Notice how people address each other, how decisions are made, and how disagreements are handled. In Lisboa (Lisbon), meeting dynamics reflect the local communication style." },
      ],
    },
    {
      id: "ptpt_b2_u1", title: "Deep Culture & Identity", level: "B2", order: 7,
      description: "Literature, philosophy, identity, and cultural depth",
      lessons: [
        { id: "ptpt_b2_u1_l1", title: "Literature & Poetry", description: "Read and discuss famous works from this culture", category: "reading", level: "B2", duration: 15, xp: 40, order: 1, culturalHint: "Fernando Pessoa (heteronyms!), José Saramago (Nobel Prize), Luís de Camões' 'Os Lusíadas'." },
        { id: "ptpt_b2_u1_l2", title: "Cultural Identity & Diaspora", description: "Discuss identity, belonging, and cultural preservation", category: "speaking", level: "B2", duration: 12, xp: 35, order: 2, culturalHint: "European Portuguese identity and how it differs from the 'standard' form of the language. Discuss in European Portuguese." },
        { id: "ptpt_b2_u1_l3", title: "Humor & Wordplay", description: "Understand jokes, puns, and cultural humor", category: "listening", level: "B2", duration: 10, xp: 30, order: 3, culturalHint: "European Portuguese humor: Local humor in Lisboa (Lisbon) — understanding jokes means you truly know the culture." },
        { id: "ptpt_b2_u1_l4", title: "Film & Cinema Analysis", description: "Analyze a film from this culture", category: "writing", level: "B2", duration: 14, xp: 40, order: 4, culturalHint: "Cinema from Lisboa (Lisbon) — analyze themes, dialogue, and cultural references. Write a film review in European Portuguese." },
        { id: "ptpt_b2_u1_l5", title: "Idiomatic Expressions", description: "Master local idioms and proverbs", category: "grammar", level: "B2", duration: 11, xp: 35, order: 5, culturalHint: "European Portuguese idioms: Local proverbs that reveal the wisdom of European Portuguese culture." },
      ],
    },
    {
      id: "ptpt_c1_u1", title: "Advanced Expression & Nuance", level: "C1", order: 8,
      description: "Subtle nuance, advanced argumentation, and cultural fluency",
      lessons: [
        { id: "ptpt_c1_u1_l1", title: "Political Discourse", description: "Understand and discuss political topics with nuance", category: "listening", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "Political discourse in European Portuguese: Political landscape of Lisboa (Lisbon) and how it's discussed locally." },
        { id: "ptpt_c1_u1_l2", title: "Academic Writing", description: "Write research-level prose with proper argumentation", category: "writing", level: "C1", duration: 15, xp: 45, order: 2, culturalHint: "Academic writing in European Portuguese: Academic conventions in European Portuguese — formal register, citations, argumentation. Write a 500-word essay on saudade (untranslatable longing)." },
        { id: "ptpt_c1_u1_l3", title: "Dialect Switching", description: "Move between formal and dialectal registers fluidly", category: "speaking", level: "C1", duration: 12, xp: 40, order: 3, culturalHint: "Master code-switching: Navigate between European Portuguese and the standard form of the language." },
        { id: "ptpt_c1_u1_l4", title: "Debate & Persuasion", description: "Construct and defend complex arguments", category: "grammar", level: "C1", duration: 13, xp: 40, order: 4, culturalHint: "Debate culture: Persuasion techniques in European Portuguese culture — how to argue effectively and respectfully." },
        { id: "ptpt_c1_u1_l5", title: "Cultural Commentary", description: "Write sophisticated cultural analysis", category: "reading", level: "C1", duration: 14, xp: 40, order: 5, culturalHint: "Read and analyze cultural commentary from Lisboa (Lisbon). How European Portuguese intellectuals discuss cultural preservation, globalization, and identity. Write your own cultural commentary." },
      ],
    },
    {
      id: "ptpt_c2_u1", title: "Native-Level Fluency & Cultural Mastery", level: "C2", order: 9,
      description: "Near-native expression, cultural depth, and creative mastery",
      lessons: [
        { id: "ptpt_c2_u1_l1", title: "Creative Writing", description: "Write poetry, fiction, or creative non-fiction", category: "writing", level: "C2", duration: 18, xp: 50, order: 1, culturalHint: "Write creatively in European Portuguese: Create original literary work in European Portuguese that captures the culture's essence." },
        { id: "ptpt_c2_u1_l2", title: "Simultaneous Interpretation", description: "Translate complex speech in real-time between languages", category: "listening", level: "C2", duration: 15, xp: 50, order: 2, culturalHint: "Practice interpreting between European Portuguese and English. Handle: formal speeches, casual conversations, and technical discussions. Cultural context is key — some concepts don't translate directly." },
        { id: "ptpt_c2_u1_l3", title: "Teaching Others", description: "Explain grammar and culture to beginners", category: "speaking", level: "C2", duration: 12, xp: 45, order: 3, culturalHint: "The ultimate test: teach European Portuguese to someone else. Explain: the unique features of European Portuguese that make it special." },
        { id: "ptpt_c2_u1_l4", title: "Cultural Mediation", description: "Bridge cultural misunderstandings between speakers", category: "grammar", level: "C2", duration: 14, xp: 45, order: 4, culturalHint: "Mediate between cultures: Help people from different cultures understand European Portuguese communication styles." },
        { id: "ptpt_c2_u1_l5", title: "Masterclass: Cultural Fluency", description: "Demonstrate complete cultural and linguistic mastery", category: "reading", level: "C2", duration: 16, xp: 50, order: 5, culturalHint: "Final challenge: Read a complex text about the future of European Portuguese culture in a globalized world. Discuss with native-level fluency." },
      ],
    },
  ],
};

export const ARABIC_EGYPTIAN: LanguageCurriculum = {
  code: "ar-EG",
  name: "Egyptian Arabic",
  flag: "🇪🇬",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 95,
  units: [
    {
      id: "areg_a1_u1", title: "First Steps — Greetings & Sounds", level: "A1", order: 1,
      description: "Basic greetings, alphabet/sounds, and survival phrases in Egyptian Arabic",
      lessons: [
        { id: "areg_a1_u1_l1", title: "The Sound System", description: "Learn the unique sounds and pronunciation of Egyptian Arabic", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "Egyptian Arabic has unique sounds that differ from standard forms. Practice with local greetings: Ezayak? (How are you? — to male), Ezayik? (How are you? — to female). Listen to Umm Kulthum to hear authentic pronunciation. The rhythm of Egyptian Arabic reflects the culture of Cairo (القاهرة)." },
        { id: "areg_a1_u1_l2", title: "Essential Greetings", description: "Hello, goodbye, please, thank you in Egyptian Arabic", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in Egyptian Arabic: Ezayak? (How are you? — to male), Ezayik? (How are you? — to female), Ahlan wa sahlan! (Welcome!), Yalla! (Let's go!), Inshallah (God willing). In Cairo (القاهرة), people greet warmly — it's part of the culture of ahwa (coffee shop) culture. Never skip greetings; it's considered rude." },
        { id: "areg_a1_u1_l3", title: "Numbers & Money", description: "Count 1-100 and handle money in Cairo (القاهرة)", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Practice numbers while ordering koshari (lentils, rice, pasta, tomato sauce) at a local restaurant. In Cairo (القاهرة), bargaining is expected at the souk. Learn to ask 'How much?' like a local." },
        { id: "areg_a1_u1_l4", title: "At the Local Market", description: "Navigate a market in Cairo (القاهرة) — buying food and essentials", category: "listening", level: "A1", duration: 9, xp: 30, order: 4, culturalHint: "You're at a market in Cairo (القاهرة). Vendors call out selling ful medames (fava beans) and ta'ameya (falafel). Listen for prices, quantities, and the vendor's greeting. Market culture: Khan el-Khalili bazaar." },
        { id: "areg_a1_u1_l5", title: "Write Your First Sentences", description: "Introduce yourself and describe your day", category: "writing", level: "A1", duration: 10, xp: 30, order: 5, culturalHint: "Write about yourself as if you just arrived in Cairo (القاهرة). Describe what you see, what you want to eat (koshari (lentils, rice, pasta, tomato sauce)? molokhia (jute leaf stew)?), and how you greet people. Use: Ezayak? (How are you? — to male)." },
      ],
    },
    {
      id: "areg_a1_u2", title: "Daily Life & Food Culture", level: "A1", order: 2,
      description: "Food, family, and daily routines in Egyptian Arabic culture",
      lessons: [
        { id: "areg_a1_u2_l1", title: "Local Food Vocabulary", description: "Learn the names of iconic dishes and ingredients", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "Essential food vocabulary: koshari, ful medames, ta'ameya, molokhia, shawarma, om ali. In Cairo (القاهرة), koshari (lentils, rice, pasta, tomato sauce) is a staple — everyone eats it. Learn to order: 'Biddi koshari'." },
        { id: "areg_a1_u2_l2", title: "Family & Relationships", description: "Family terms and how families interact in this culture", category: "grammar", level: "A1", duration: 10, xp: 30, order: 2, culturalHint: "Family is central in Egyptian Arabic culture. Extended families often live together or nearby. ahwa (coffee shop) culture reflects the importance of community. Learn family terms and how to describe your family to new friends in Cairo (القاهرة)." },
        { id: "areg_a1_u2_l3", title: "Ordering at a Restaurant", description: "Complete a meal order from greeting to paying", category: "speaking", level: "A1", duration: 9, xp: 30, order: 3, culturalHint: "You're at a restaurant in Cairo (القاهرة). The waiter greets you with 'Ezayak? (How are you? — to male)'. Order koshari (lentils, rice, pasta, tomato sauce) and shawarma. Tipping is expected (10-15%)." },
        { id: "areg_a1_u2_l4", title: "Daily Routine", description: "Describe your morning, afternoon, and evening", category: "writing", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Write about a typical day in Cairo (القاهرة). Morning: wake for Fajr prayer, have ful and tea. Evening: felucca rides on the Nile." },
        { id: "areg_a1_u2_l5", title: "Reading Local Signs", description: "Understand menus, street signs, and notices", category: "reading", level: "A1", duration: 7, xp: 20, order: 5, culturalHint: "Read real signs from Cairo (القاهرة): restaurant menus featuring koshari (lentils, rice, pasta, tomato sauce), street names, shop signs. In Alexandria (الإسكندرية), signs might be different from Cairo (القاهرة). Practice reading prices, hours, and directions." },
      ],
    },
    {
      id: "areg_a2_u1", title: "Getting Around & Transportation", level: "A2", order: 3,
      description: "Navigate cities, use transport, and ask for directions",
      lessons: [
        { id: "areg_a2_u1_l1", title: "Directions & Navigation", description: "Ask for and give directions in Cairo (القاهرة)", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate Cairo (القاهرة) like a local. Key landmarks, neighborhoods, and how people give directions here. Egyptians use landmarks, not street names: 'next to the mosque', 'behind the pharmacy'" },
        { id: "areg_a2_u1_l2", title: "Public Transportation", description: "Buses, taxis, and local transport systems", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 2, culturalHint: "Transport in Cairo (القاهرة): the Cairo Metro, microbuses, and Uber. Learn to ask: 'How do I get to...?'" },
        { id: "areg_a2_u1_l3", title: "At the Hotel/Airbnb", description: "Check in, ask about amenities, handle problems", category: "grammar", level: "A2", duration: 10, xp: 30, order: 3, culturalHint: "Staying in Cairo (القاهرة)? Learn to check in, ask for wifi, request extra towels, and report issues. Hotels in the Arab world offer exceptional hospitality — 'الضيافة' (hospitality) is sacred." },
        { id: "areg_a2_u1_l4", title: "Emergency Situations", description: "Health, safety, and asking for help", category: "listening", level: "A2", duration: 9, xp: 30, order: 4, culturalHint: "Essential emergency phrases in Egyptian Arabic. How to say 'Help!', 'I need a doctor', 'Call the police'. In Cairo (القاهرة), pharmacies are everywhere and pharmacists give medical advice freely." },
        { id: "areg_a2_u1_l5", title: "Travel Journal Entry", description: "Write about your experiences exploring the city", category: "writing", level: "A2", duration: 10, xp: 30, order: 5, culturalHint: "Write a travel journal about Cairo (القاهرة). Describe the sights (Alexandria (الإسكندرية), Luxor (الأقصر)), the food you tried (koshari (lentils, rice, pasta, tomato sauce), ta'ameya (falafel)), and the people you met. Use past tense to describe what happened." },
      ],
    },
    {
      id: "areg_a2_u2", title: "Culture, Music & Entertainment", level: "A2", order: 4,
      description: "Music, dance, celebrations, and entertainment culture",
      lessons: [
        { id: "areg_a2_u2_l1", title: "Music & Dance", description: "Learn about raqs sharqi (belly dance) and local music culture", category: "vocabulary", level: "A2", duration: 9, xp: 30, order: 1, culturalHint: "Egyptian Arabic music culture: raqs sharqi (belly dance), tanoura (Sufi whirling), dabke. Listen to Umm Kulthum, Amr Diab, Mohamed Mounir, Abdel Halim Hafez. raqs sharqi (belly dance) is more than dance — it's identity. Learn the vocabulary of rhythm, instruments, and movement." },
        { id: "areg_a2_u2_l2", title: "Festivals & Celebrations", description: "Major holidays and how they're celebrated", category: "reading", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "Major celebrations: Sham el-Nessim (spring festival), Eid al-Fitr, Eid al-Adha, Moulid el-Nabi (Prophet's birthday). During Sham el-Nessim (spring festival), people gather for family feasts and give money to children. Learn the vocabulary of celebration!" },
        { id: "areg_a2_u2_l3", title: "Talking About Hobbies", description: "Discuss interests, sports, and leisure activities", category: "speaking", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Popular hobbies in Cairo (القاهرة): football (ahli vs zamalek!), shisha, watching movies. Talk about what you enjoy!" },
        { id: "areg_a2_u2_l4", title: "Understanding Song Lyrics", description: "Analyze a popular song in Egyptian Arabic", category: "listening", level: "A2", duration: 10, xp: 35, order: 4, culturalHint: "Listen to Umm Kulthum or Amr Diab. Break down the lyrics — learn new vocabulary, cultural references, and emotional expressions. Egyptian Arabic songs often reference love, homeland, and longing." },
        { id: "areg_a2_u2_l5", title: "Writing a Party Invitation", description: "Invite friends to a cultural celebration", category: "writing", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "Write an invitation to a Sham el-Nessim (spring festival) party! Include: date, time, location (Cairo (القاهرة)), what to bring, what to wear, and what food will be served (koshari (lentils, rice, pasta, tomato sauce), molokhia (jute leaf stew)). Use festive language and cultural expressions." },
      ],
    },
    {
      id: "areg_b1_u1", title: "Society, History & Current Events", level: "B1", order: 5,
      description: "Discuss history, social issues, and current events",
      lessons: [
        { id: "areg_b1_u1_l1", title: "Historical Context", description: "Key historical events that shaped this culture", category: "reading", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "5000 years of civilization: Pharaohs, Arab conquest, Ottoman rule, British colonialism, 1952 revolution, modern Egypt. Discuss in Egyptian Arabic." },
        { id: "areg_b1_u1_l2", title: "Social Issues & Opinions", description: "Express opinions about current social topics", category: "speaking", level: "B1", duration: 10, xp: 30, order: 2, culturalHint: "Discuss current issues in Cairo (القاهرة): youth unemployment, education reform, cultural preservation. Learn to express opinions respectfully." },
        { id: "areg_b1_u1_l3", title: "News & Media", description: "Understand news broadcasts and articles", category: "listening", level: "B1", duration: 11, xp: 35, order: 3, culturalHint: "Listen to news from Cairo (القاهرة). Popular media sources, how news is reported, and key vocabulary for current events. Al Jazeera, BBC Arabic, and local channels. Practice summarizing what you hear." },
        { id: "areg_b1_u1_l4", title: "Formal vs Informal Register", description: "Switch between formal and casual speech appropriately", category: "grammar", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Egyptian Arabic has distinct formal/informal registers. Egyptian Arabic uses 'حضرتك' (hadretak) for formal respect. Know when to use MSA vs dialect." },
        { id: "areg_b1_u1_l5", title: "Opinion Essay", description: "Write a structured opinion piece on a cultural topic", category: "writing", level: "B1", duration: 12, xp: 35, order: 5, culturalHint: "Write about: 'How does ancient Egyptian heritage influence modern Egyptian identity?' Use connectors, evidence, and conclusion." },
      ],
    },
    {
      id: "areg_b1_u2", title: "Work, Business & Professional Life", level: "B1", order: 6,
      description: "Professional communication, job culture, and business etiquette",
      lessons: [
        { id: "areg_b1_u2_l1", title: "Workplace Culture", description: "How work culture differs in this region", category: "reading", level: "B1", duration: 10, xp: 30, order: 1, culturalHint: "Work culture in Cairo (القاهرة): Relationships come first — expect tea/coffee before business. Hierarchy is important. Friday is the weekend." },
        { id: "areg_b1_u2_l2", title: "Job Interview Practice", description: "Prepare for and conduct a job interview", category: "speaking", level: "B1", duration: 12, xp: 35, order: 2, culturalHint: "Practice a job interview in Egyptian Arabic. Key phrases: introduce yourself, describe experience, ask about the role. In Cairo (القاهرة), personal connections (wasta) often matter. Dress formally, bring certificates." },
        { id: "areg_b1_u2_l3", title: "Email & Professional Writing", description: "Write formal emails, reports, and messages", category: "writing", level: "B1", duration: 10, xp: 30, order: 3, culturalHint: "Professional email etiquette in Egyptian Arabic. Start with 'بسم الله الرحمن الرحيم' (In the name of God) for formal letters. Use 'السلام عليكم' (Peace be upon you) as greeting." },
        { id: "areg_b1_u2_l4", title: "Negotiation & Persuasion", description: "Negotiate prices, terms, and agreements", category: "grammar", level: "B1", duration: 11, xp: 35, order: 4, culturalHint: "Negotiation culture: Bargaining is an art in Egypt — start at 50% of asking price, drink tea together, take your time." },
        { id: "areg_b1_u2_l5", title: "Listening: Business Meeting", description: "Understand a recorded business meeting", category: "listening", level: "B1", duration: 10, xp: 30, order: 5, culturalHint: "Listen to a business meeting in Egyptian Arabic. Notice how people address each other, how decisions are made, and how disagreements are handled. In Cairo (القاهرة), consensus and saving face are important — direct confrontation is avoided." },
      ],
    },
    {
      id: "areg_b2_u1", title: "Deep Culture & Identity", level: "B2", order: 7,
      description: "Literature, philosophy, identity, and cultural depth",
      lessons: [
        { id: "areg_b2_u1_l1", title: "Literature & Poetry", description: "Read and discuss famous works from this culture", category: "reading", level: "B2", duration: 15, xp: 40, order: 1, culturalHint: "Naguib Mahfouz (Nobel Prize), Taha Hussein, Nawal El Saadawi. The Cairo Trilogy captures Egyptian society." },
        { id: "areg_b2_u1_l2", title: "Cultural Identity & Diaspora", description: "Discuss identity, belonging, and cultural preservation", category: "speaking", level: "B2", duration: 12, xp: 35, order: 2, culturalHint: "Egyptian identity: Pharaonic, Arab, African, Mediterranean — all at once. The concept of 'ibn el-balad' (son of the country). Discuss in Egyptian Arabic." },
        { id: "areg_b2_u1_l3", title: "Humor & Wordplay", description: "Understand jokes, puns, and cultural humor", category: "listening", level: "B2", duration: 10, xp: 30, order: 3, culturalHint: "Egyptian Arabic humor: Egyptians are famous for their jokes (نكت). Political satire, wordplay, and self-deprecating humor. 'Bassem Youssef' style comedy." },
        { id: "areg_b2_u1_l4", title: "Film & Cinema Analysis", description: "Analyze a film from this culture", category: "writing", level: "B2", duration: 14, xp: 40, order: 4, culturalHint: "Egyptian cinema is 'Hollywood of the Arab world'. Analyze classics by Youssef Chahine or modern films. Themes: class, love, revolution. Write a film review in Egyptian Arabic." },
        { id: "areg_b2_u1_l5", title: "Idiomatic Expressions", description: "Master local idioms and proverbs", category: "grammar", level: "B2", duration: 11, xp: 35, order: 5, culturalHint: "Egyptian Arabic idioms: 'اللي على راسه بطحة يحسس عليها' (He who has a bump touches it — guilty conscience). 'يا بخت من بكى وأبكاه' (Lucky is he who cried and made others cry — shared sorrow)." },
      ],
    },
    {
      id: "areg_c1_u1", title: "Advanced Expression & Nuance", level: "C1", order: 8,
      description: "Subtle nuance, advanced argumentation, and cultural fluency",
      lessons: [
        { id: "areg_c1_u1_l1", title: "Political Discourse", description: "Understand and discuss political topics with nuance", category: "listening", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "Political discourse in Egyptian Arabic: Navigate Egyptian political discussion — revolution, democracy, military, religion. Understand coded language and satire." },
        { id: "areg_c1_u1_l2", title: "Academic Writing", description: "Write research-level prose with proper argumentation", category: "writing", level: "C1", duration: 15, xp: 45, order: 2, culturalHint: "Academic writing in Egyptian Arabic: Modern Standard Arabic (فصحى) is used for academic work. Learn to switch between dialect and MSA seamlessly. Write a 500-word essay on ahwa (coffee shop) culture." },
        { id: "areg_c1_u1_l3", title: "Dialect Switching", description: "Move between formal and dialectal registers fluidly", category: "speaking", level: "C1", duration: 12, xp: 40, order: 3, culturalHint: "Master code-switching: Switch between Egyptian dialect (عامية) and Modern Standard Arabic (فصحى) depending on context — news vs friends vs business." },
        { id: "areg_c1_u1_l4", title: "Debate & Persuasion", description: "Construct and defend complex arguments", category: "grammar", level: "C1", duration: 13, xp: 40, order: 4, culturalHint: "Debate culture: Egyptian debate style — passionate, uses proverbs, appeals to emotion and religion. 'والله' (wallahi — I swear by God) for emphasis." },
        { id: "areg_c1_u1_l5", title: "Cultural Commentary", description: "Write sophisticated cultural analysis", category: "reading", level: "C1", duration: 14, xp: 40, order: 5, culturalHint: "Read and analyze cultural commentary from Cairo (القاهرة). Egyptian columnists, social media intellectuals, and cultural critics discuss identity, modernization, and tradition. Write your own cultural commentary." },
      ],
    },
    {
      id: "areg_c2_u1", title: "Native-Level Fluency & Cultural Mastery", level: "C2", order: 9,
      description: "Near-native expression, cultural depth, and creative mastery",
      lessons: [
        { id: "areg_c2_u1_l1", title: "Creative Writing", description: "Write poetry, fiction, or creative non-fiction", category: "writing", level: "C2", duration: 18, xp: 50, order: 1, culturalHint: "Write creatively in Egyptian Arabic: Write a short story in Egyptian dialect. Use the rhythm of Cairo street life, humor, and social observation like Naguib Mahfouz." },
        { id: "areg_c2_u1_l2", title: "Simultaneous Interpretation", description: "Translate complex speech in real-time between languages", category: "listening", level: "C2", duration: 15, xp: 50, order: 2, culturalHint: "Practice interpreting between Egyptian Arabic and English. Handle: political speeches, religious sermons, business negotiations — each requires different vocabulary and register. Cultural context is key — some concepts don't translate directly." },
        { id: "areg_c2_u1_l3", title: "Teaching Others", description: "Explain grammar and culture to beginners", category: "speaking", level: "C2", duration: 12, xp: 45, order: 3, culturalHint: "The ultimate test: teach Egyptian Arabic to someone else. Explain: why Egyptians say 'إزيك' instead of 'كيف حالك', how to use 'يعني' (ya'ni) in every sentence, and when to switch to MSA." },
        { id: "areg_c2_u1_l4", title: "Cultural Mediation", description: "Bridge cultural misunderstandings between speakers", category: "grammar", level: "C2", duration: 14, xp: 45, order: 4, culturalHint: "Mediate between cultures: Help a Western business person understand why their Egyptian partner keeps saying 'inshallah' (it's not avoidance — it's cultural humility before God)." },
        { id: "areg_c2_u1_l5", title: "Masterclass: Cultural Fluency", description: "Demonstrate complete cultural and linguistic mastery", category: "reading", level: "C2", duration: 16, xp: 50, order: 5, culturalHint: "Final challenge: Read a complex text about the role of Al-Azhar in modern Egyptian society, the tension between secularism and religion, and Egypt's cultural soft power across the Arab world. Discuss with native-level fluency." },
      ],
    },
  ],
};

export const ARABIC_LEVANTINE: LanguageCurriculum = {
  code: "ar-LB",
  name: "Levantine Arabic (Lebanese)",
  flag: "🇱🇧",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 95,
  units: [
    {
      id: "arlb_a1_u1", title: "First Steps — Greetings & Sounds", level: "A1", order: 1,
      description: "Basic greetings, alphabet/sounds, and survival phrases in Levantine Arabic (Lebanese)",
      lessons: [
        { id: "arlb_a1_u1_l1", title: "The Sound System", description: "Learn the unique sounds and pronunciation of Levantine Arabic (Lebanese)", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "Levantine Arabic (Lebanese) has unique sounds that differ from standard forms. Practice with local greetings: Kifak? (How are you? — to male), Kifik? (How are you? — to female). Listen to Fairuz to hear authentic pronunciation. The rhythm of Levantine Arabic (Lebanese) reflects the culture of Beirut (بيروت)." },
        { id: "arlb_a1_u1_l2", title: "Essential Greetings", description: "Hello, goodbye, please, thank you in Levantine Arabic (Lebanese)", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in Levantine Arabic (Lebanese): Kifak? (How are you? — to male), Kifik? (How are you? — to female), Ahla! (Hey!), Habibi/Habibti (My love — used casually), Yalla! (Let's go!). In Beirut (بيروت), people greet warmly — it's part of the culture of mezze culture (sharing many small dishes). Never skip greetings; it's considered rude." },
        { id: "arlb_a1_u1_l3", title: "Numbers & Money", description: "Count 1-100 and handle money in Beirut (بيروت)", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Practice numbers while ordering hummus at a local restaurant. In Beirut (بيروت), bargaining is expected at the souk. Learn to ask 'How much?' like a local." },
        { id: "arlb_a1_u1_l4", title: "At the Local Market", description: "Navigate a market in Beirut (بيروت) — buying food and essentials", category: "listening", level: "A1", duration: 9, xp: 30, order: 4, culturalHint: "You're at a market in Beirut (بيروت). Vendors call out selling tabbouleh and kibbeh (meat croquette). Listen for prices, quantities, and the vendor's greeting. Market culture: arak drinking." },
        { id: "arlb_a1_u1_l5", title: "Write Your First Sentences", description: "Introduce yourself and describe your day", category: "writing", level: "A1", duration: 10, xp: 30, order: 5, culturalHint: "Write about yourself as if you just arrived in Beirut (بيروت). Describe what you see, what you want to eat (hummus? manoushe (flatbread with za'atar)?), and how you greet people. Use: Kifak? (How are you? — to male)." },
      ],
    },
    {
      id: "arlb_a1_u2", title: "Daily Life & Food Culture", level: "A1", order: 2,
      description: "Food, family, and daily routines in Levantine Arabic (Lebanese) culture",
      lessons: [
        { id: "arlb_a1_u2_l1", title: "Local Food Vocabulary", description: "Learn the names of iconic dishes and ingredients", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "Essential food vocabulary: hummus, tabbouleh, kibbeh, manoushe, fattoush, knafeh. In Beirut (بيروت), hummus is a staple — everyone eats it. Learn to order: 'Biddi hummus'." },
        { id: "arlb_a1_u2_l2", title: "Family & Relationships", description: "Family terms and how families interact in this culture", category: "grammar", level: "A1", duration: 10, xp: 30, order: 2, culturalHint: "Family is central in Levantine Arabic (Lebanese) culture. Extended families often live together or nearby. mezze culture (sharing many small dishes) reflects the importance of community. Learn family terms and how to describe your family to new friends in Beirut (بيروت)." },
        { id: "arlb_a1_u2_l3", title: "Ordering at a Restaurant", description: "Complete a meal order from greeting to paying", category: "speaking", level: "A1", duration: 9, xp: 30, order: 3, culturalHint: "You're at a restaurant in Beirut (بيروت). The waiter greets you with 'Kifak? (How are you? — to male)'. Order hummus and fattoush (bread salad). Tipping is expected (10-15%)." },
        { id: "arlb_a1_u2_l4", title: "Daily Routine", description: "Describe your morning, afternoon, and evening", category: "writing", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Write about a typical day in Beirut (بيروت). Morning: wake for Fajr prayer, have ful and tea. Evening: Gemmayzeh nightlife." },
        { id: "arlb_a1_u2_l5", title: "Reading Local Signs", description: "Understand menus, street signs, and notices", category: "reading", level: "A1", duration: 7, xp: 20, order: 5, culturalHint: "Read real signs from Beirut (بيروت): restaurant menus featuring hummus, street names, shop signs. In Byblos (جبيل), signs might be different from Beirut (بيروت). Practice reading prices, hours, and directions." },
      ],
    },
    {
      id: "arlb_a2_u1", title: "Getting Around & Transportation", level: "A2", order: 3,
      description: "Navigate cities, use transport, and ask for directions",
      lessons: [
        { id: "arlb_a2_u1_l1", title: "Directions & Navigation", description: "Ask for and give directions in Beirut (بيروت)", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate Beirut (بيروت) like a local. Key landmarks, neighborhoods, and how people give directions here. In Beirut (بيروت), ask locals — they love helping visitors!" },
        { id: "arlb_a2_u1_l2", title: "Public Transportation", description: "Buses, taxis, and local transport systems", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 2, culturalHint: "Transport in Beirut (بيروت): local buses and taxis. Learn to ask: 'How do I get to...?'" },
        { id: "arlb_a2_u1_l3", title: "At the Hotel/Airbnb", description: "Check in, ask about amenities, handle problems", category: "grammar", level: "A2", duration: 10, xp: 30, order: 3, culturalHint: "Staying in Beirut (بيروت)? Learn to check in, ask for wifi, request extra towels, and report issues. Hotels in the Arab world offer exceptional hospitality — 'الضيافة' (hospitality) is sacred." },
        { id: "arlb_a2_u1_l4", title: "Emergency Situations", description: "Health, safety, and asking for help", category: "listening", level: "A2", duration: 9, xp: 30, order: 4, culturalHint: "Essential emergency phrases in Levantine Arabic (Lebanese). How to say 'Help!', 'I need a doctor', 'Call the police'. In Beirut (بيروت), pharmacies are everywhere and pharmacists give medical advice freely." },
        { id: "arlb_a2_u1_l5", title: "Travel Journal Entry", description: "Write about your experiences exploring the city", category: "writing", level: "A2", duration: 10, xp: 30, order: 5, culturalHint: "Write a travel journal about Beirut (بيروت). Describe the sights (Byblos (جبيل), Baalbek (بعلبك)), the food you tried (hummus, kibbeh (meat croquette)), and the people you met. Use past tense to describe what happened." },
      ],
    },
    {
      id: "arlb_a2_u2", title: "Culture, Music & Entertainment", level: "A2", order: 4,
      description: "Music, dance, celebrations, and entertainment culture",
      lessons: [
        { id: "arlb_a2_u2_l1", title: "Music & Dance", description: "Learn about dabke (line dance) and local music culture", category: "vocabulary", level: "A2", duration: 9, xp: 30, order: 1, culturalHint: "Levantine Arabic (Lebanese) music culture: dabke (line dance), belly dance. Listen to Fairuz, Marcel Khalife, Nancy Ajram, Majida El Roumi. dabke (line dance) is more than dance — it's identity. Learn the vocabulary of rhythm, instruments, and movement." },
        { id: "arlb_a2_u2_l2", title: "Festivals & Celebrations", description: "Major holidays and how they're celebrated", category: "reading", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "Major celebrations: Eid al-Fitr, Eid al-Adha, Christmas (big in Lebanon), Independence Day (Nov 22), Baalbeck Festival. During Eid al-Fitr, people celebrate with food, music, and family. Learn the vocabulary of celebration!" },
        { id: "arlb_a2_u2_l3", title: "Talking About Hobbies", description: "Discuss interests, sports, and leisure activities", category: "speaking", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Popular hobbies in Beirut (بيروت): Gemmayzeh nightlife, music, and socializing. Talk about what you enjoy!" },
        { id: "arlb_a2_u2_l4", title: "Understanding Song Lyrics", description: "Analyze a popular song in Levantine Arabic (Lebanese)", category: "listening", level: "A2", duration: 10, xp: 35, order: 4, culturalHint: "Listen to Fairuz or Marcel Khalife. Break down the lyrics — learn new vocabulary, cultural references, and emotional expressions. Levantine Arabic (Lebanese) songs often reference love, homeland, and longing." },
        { id: "arlb_a2_u2_l5", title: "Writing a Party Invitation", description: "Invite friends to a cultural celebration", category: "writing", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "Write an invitation to a Eid al-Fitr party! Include: date, time, location (Beirut (بيروت)), what to bring, what to wear, and what food will be served (hummus, manoushe (flatbread with za'atar)). Use festive language and cultural expressions." },
      ],
    },
    {
      id: "arlb_b1_u1", title: "Society, History & Current Events", level: "B1", order: 5,
      description: "Discuss history, social issues, and current events",
      lessons: [
        { id: "arlb_b1_u1_l1", title: "Historical Context", description: "Key historical events that shaped this culture", category: "reading", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "Phoenician heritage, Ottoman era, French mandate, independence, civil war (1975-1990), resilience and reconstruction. Discuss in Levantine Arabic (Lebanese)." },
        { id: "arlb_b1_u1_l2", title: "Social Issues & Opinions", description: "Express opinions about current social topics", category: "speaking", level: "B1", duration: 10, xp: 30, order: 2, culturalHint: "Discuss current issues in Beirut (بيروت): social change, cultural preservation, and economic development. Learn to express opinions respectfully." },
        { id: "arlb_b1_u1_l3", title: "News & Media", description: "Understand news broadcasts and articles", category: "listening", level: "B1", duration: 11, xp: 35, order: 3, culturalHint: "Listen to news from Beirut (بيروت). Popular media sources, how news is reported, and key vocabulary for current events. Al Jazeera, BBC Arabic, and local channels. Practice summarizing what you hear." },
        { id: "arlb_b1_u1_l4", title: "Formal vs Informal Register", description: "Switch between formal and casual speech appropriately", category: "grammar", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Levantine Arabic (Lebanese) has distinct formal/informal registers. Knowing when to be formal vs casual in Beirut (بيروت) shows cultural competence." },
        { id: "arlb_b1_u1_l5", title: "Opinion Essay", description: "Write a structured opinion piece on a cultural topic", category: "writing", level: "B1", duration: 12, xp: 35, order: 5, culturalHint: "Write about: 'What makes Levantine Arabic (Lebanese) culture unique in the modern world?' Use connectors, evidence, and conclusion." },
      ],
    },
    {
      id: "arlb_b1_u2", title: "Work, Business & Professional Life", level: "B1", order: 6,
      description: "Professional communication, job culture, and business etiquette",
      lessons: [
        { id: "arlb_b1_u2_l1", title: "Workplace Culture", description: "How work culture differs in this region", category: "reading", level: "B1", duration: 10, xp: 30, order: 1, culturalHint: "Work culture in Beirut (بيروت): Professional norms in Beirut (بيروت) reflect mezze culture (sharing many small dishes)." },
        { id: "arlb_b1_u2_l2", title: "Job Interview Practice", description: "Prepare for and conduct a job interview", category: "speaking", level: "B1", duration: 12, xp: 35, order: 2, culturalHint: "Practice a job interview in Levantine Arabic (Lebanese). Key phrases: introduce yourself, describe experience, ask about the role. In Beirut (بيروت), personal connections (wasta) often matter. Dress formally, bring certificates." },
        { id: "arlb_b1_u2_l3", title: "Email & Professional Writing", description: "Write formal emails, reports, and messages", category: "writing", level: "B1", duration: 10, xp: 30, order: 3, culturalHint: "Professional email etiquette in Levantine Arabic (Lebanese). Start with 'بسم الله الرحمن الرحيم' (In the name of God) for formal letters. Use 'السلام عليكم' (Peace be upon you) as greeting." },
        { id: "arlb_b1_u2_l4", title: "Negotiation & Persuasion", description: "Negotiate prices, terms, and agreements", category: "grammar", level: "B1", duration: 11, xp: 35, order: 4, culturalHint: "Negotiation culture: Negotiation in Beirut (بيروت) requires patience and cultural awareness." },
        { id: "arlb_b1_u2_l5", title: "Listening: Business Meeting", description: "Understand a recorded business meeting", category: "listening", level: "B1", duration: 10, xp: 30, order: 5, culturalHint: "Listen to a business meeting in Levantine Arabic (Lebanese). Notice how people address each other, how decisions are made, and how disagreements are handled. In Beirut (بيروت), consensus and saving face are important — direct confrontation is avoided." },
      ],
    },
    {
      id: "arlb_b2_u1", title: "Deep Culture & Identity", level: "B2", order: 7,
      description: "Literature, philosophy, identity, and cultural depth",
      lessons: [
        { id: "arlb_b2_u1_l1", title: "Literature & Poetry", description: "Read and discuss famous works from this culture", category: "reading", level: "B2", duration: 15, xp: 40, order: 1, culturalHint: "Khalil Gibran's 'The Prophet', Amin Maalouf, Hanan al-Shaykh. Lebanese diaspora literature." },
        { id: "arlb_b2_u1_l2", title: "Cultural Identity & Diaspora", description: "Discuss identity, belonging, and cultural preservation", category: "speaking", level: "B2", duration: 12, xp: 35, order: 2, culturalHint: "Levantine Arabic (Lebanese) identity and how it differs from the 'standard' form of the language. Discuss in Levantine Arabic (Lebanese)." },
        { id: "arlb_b2_u1_l3", title: "Humor & Wordplay", description: "Understand jokes, puns, and cultural humor", category: "listening", level: "B2", duration: 10, xp: 30, order: 3, culturalHint: "Levantine Arabic (Lebanese) humor: Local humor in Beirut (بيروت) — understanding jokes means you truly know the culture." },
        { id: "arlb_b2_u1_l4", title: "Film & Cinema Analysis", description: "Analyze a film from this culture", category: "writing", level: "B2", duration: 14, xp: 40, order: 4, culturalHint: "Cinema from Beirut (بيروت) — analyze themes, dialogue, and cultural references. Write a film review in Levantine Arabic (Lebanese)." },
        { id: "arlb_b2_u1_l5", title: "Idiomatic Expressions", description: "Master local idioms and proverbs", category: "grammar", level: "B2", duration: 11, xp: 35, order: 5, culturalHint: "Levantine Arabic (Lebanese) idioms: Local proverbs that reveal the wisdom of Levantine Arabic (Lebanese) culture." },
      ],
    },
    {
      id: "arlb_c1_u1", title: "Advanced Expression & Nuance", level: "C1", order: 8,
      description: "Subtle nuance, advanced argumentation, and cultural fluency",
      lessons: [
        { id: "arlb_c1_u1_l1", title: "Political Discourse", description: "Understand and discuss political topics with nuance", category: "listening", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "Political discourse in Levantine Arabic (Lebanese): Political landscape of Beirut (بيروت) and how it's discussed locally." },
        { id: "arlb_c1_u1_l2", title: "Academic Writing", description: "Write research-level prose with proper argumentation", category: "writing", level: "C1", duration: 15, xp: 45, order: 2, culturalHint: "Academic writing in Levantine Arabic (Lebanese): Modern Standard Arabic (فصحى) is used for academic work. Learn to switch between dialect and MSA seamlessly. Write a 500-word essay on mezze culture (sharing many small dishes)." },
        { id: "arlb_c1_u1_l3", title: "Dialect Switching", description: "Move between formal and dialectal registers fluidly", category: "speaking", level: "C1", duration: 12, xp: 40, order: 3, culturalHint: "Master code-switching: Navigate between Levantine Arabic (Lebanese) and the standard form of the language." },
        { id: "arlb_c1_u1_l4", title: "Debate & Persuasion", description: "Construct and defend complex arguments", category: "grammar", level: "C1", duration: 13, xp: 40, order: 4, culturalHint: "Debate culture: Persuasion techniques in Levantine Arabic (Lebanese) culture — how to argue effectively and respectfully." },
        { id: "arlb_c1_u1_l5", title: "Cultural Commentary", description: "Write sophisticated cultural analysis", category: "reading", level: "C1", duration: 14, xp: 40, order: 5, culturalHint: "Read and analyze cultural commentary from Beirut (بيروت). How Levantine Arabic (Lebanese) intellectuals discuss cultural preservation, globalization, and identity. Write your own cultural commentary." },
      ],
    },
    {
      id: "arlb_c2_u1", title: "Native-Level Fluency & Cultural Mastery", level: "C2", order: 9,
      description: "Near-native expression, cultural depth, and creative mastery",
      lessons: [
        { id: "arlb_c2_u1_l1", title: "Creative Writing", description: "Write poetry, fiction, or creative non-fiction", category: "writing", level: "C2", duration: 18, xp: 50, order: 1, culturalHint: "Write creatively in Levantine Arabic (Lebanese): Create original literary work in Levantine Arabic (Lebanese) that captures the culture's essence." },
        { id: "arlb_c2_u1_l2", title: "Simultaneous Interpretation", description: "Translate complex speech in real-time between languages", category: "listening", level: "C2", duration: 15, xp: 50, order: 2, culturalHint: "Practice interpreting between Levantine Arabic (Lebanese) and English. Handle: political speeches, religious sermons, business negotiations — each requires different vocabulary and register. Cultural context is key — some concepts don't translate directly." },
        { id: "arlb_c2_u1_l3", title: "Teaching Others", description: "Explain grammar and culture to beginners", category: "speaking", level: "C2", duration: 12, xp: 45, order: 3, culturalHint: "The ultimate test: teach Levantine Arabic (Lebanese) to someone else. Explain: the unique features of Levantine Arabic (Lebanese) that make it special." },
        { id: "arlb_c2_u1_l4", title: "Cultural Mediation", description: "Bridge cultural misunderstandings between speakers", category: "grammar", level: "C2", duration: 14, xp: 45, order: 4, culturalHint: "Mediate between cultures: Help people from different cultures understand Levantine Arabic (Lebanese) communication styles." },
        { id: "arlb_c2_u1_l5", title: "Masterclass: Cultural Fluency", description: "Demonstrate complete cultural and linguistic mastery", category: "reading", level: "C2", duration: 16, xp: 50, order: 5, culturalHint: "Final challenge: Read a complex text about the future of Levantine Arabic (Lebanese) culture in a globalized world. Discuss with native-level fluency." },
      ],
    },
  ],
};

export const ARABIC_GULF: LanguageCurriculum = {
  code: "ar-AE",
  name: "Gulf Arabic (Emirati)",
  flag: "🇦🇪",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 95,
  units: [
    {
      id: "arae_a1_u1", title: "First Steps — Greetings & Sounds", level: "A1", order: 1,
      description: "Basic greetings, alphabet/sounds, and survival phrases in Gulf Arabic (Emirati)",
      lessons: [
        { id: "arae_a1_u1_l1", title: "The Sound System", description: "Learn the unique sounds and pronunciation of Gulf Arabic (Emirati)", category: "speaking", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "Gulf Arabic (Emirati) has unique sounds that differ from standard forms. Practice with local greetings: Shlonak? (How are you? — to male), Shlonich? (How are you? — to female). Listen to Hussein Al Jasmi to hear authentic pronunciation. The rhythm of Gulf Arabic (Emirati) reflects the culture of Dubai (دبي)." },
        { id: "arae_a1_u1_l2", title: "Essential Greetings", description: "Hello, goodbye, please, thank you in Gulf Arabic (Emirati)", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2, culturalHint: "Greetings in Gulf Arabic (Emirati): Shlonak? (How are you? — to male), Shlonich? (How are you? — to female), Hala wallah! (Welcome!), Mashkoor/Mashkoora (Thank you), Inshallah (God willing). In Dubai (دبي), people greet warmly — it's part of the culture of majlis (sitting room gatherings). Never skip greetings; it's considered rude." },
        { id: "arae_a1_u1_l3", title: "Numbers & Money", description: "Count 1-100 and handle money in Dubai (دبي)", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3, culturalHint: "Practice numbers while ordering machboos (spiced rice with meat) at a local restaurant. In Dubai (دبي), bargaining is expected at the souk. Learn to ask 'How much?' like a local." },
        { id: "arae_a1_u1_l4", title: "At the Local Market", description: "Navigate a market in Dubai (دبي) — buying food and essentials", category: "listening", level: "A1", duration: 9, xp: 30, order: 4, culturalHint: "You're at a market in Dubai (دبي). Vendors call out selling luqaimat (sweet dumplings) and harees (wheat porridge). Listen for prices, quantities, and the vendor's greeting. Market culture: falcon hunting." },
        { id: "arae_a1_u1_l5", title: "Write Your First Sentences", description: "Introduce yourself and describe your day", category: "writing", level: "A1", duration: 10, xp: 30, order: 5, culturalHint: "Write about yourself as if you just arrived in Dubai (دبي). Describe what you see, what you want to eat (machboos (spiced rice with meat)? thareed (bread stew)?), and how you greet people. Use: Shlonak? (How are you? — to male)." },
      ],
    },
    {
      id: "arae_a1_u2", title: "Daily Life & Food Culture", level: "A1", order: 2,
      description: "Food, family, and daily routines in Gulf Arabic (Emirati) culture",
      lessons: [
        { id: "arae_a1_u2_l1", title: "Local Food Vocabulary", description: "Learn the names of iconic dishes and ingredients", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "Essential food vocabulary: machboos, luqaimat, harees, thareed, karak chai, dates with Arabic coffee. In Dubai (دبي), machboos (spiced rice with meat) is a staple — everyone eats it. Learn to order: 'Biddi machboos'." },
        { id: "arae_a1_u2_l2", title: "Family & Relationships", description: "Family terms and how families interact in this culture", category: "grammar", level: "A1", duration: 10, xp: 30, order: 2, culturalHint: "Family is central in Gulf Arabic (Emirati) culture. Extended families often live together or nearby. majlis (sitting room gatherings) reflects the importance of community. Learn family terms and how to describe your family to new friends in Dubai (دبي)." },
        { id: "arae_a1_u2_l3", title: "Ordering at a Restaurant", description: "Complete a meal order from greeting to paying", category: "speaking", level: "A1", duration: 9, xp: 30, order: 3, culturalHint: "You're at a restaurant in Dubai (دبي). The waiter greets you with 'Shlonak? (How are you? — to male)'. Order machboos (spiced rice with meat) and karak chai (spiced tea). Tipping is expected (10-15%)." },
        { id: "arae_a1_u2_l4", title: "Daily Routine", description: "Describe your morning, afternoon, and evening", category: "writing", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Write about a typical day in Dubai (دبي). Morning: wake for Fajr prayer, have ful and tea. Evening: pearl diving heritage." },
        { id: "arae_a1_u2_l5", title: "Reading Local Signs", description: "Understand menus, street signs, and notices", category: "reading", level: "A1", duration: 7, xp: 20, order: 5, culturalHint: "Read real signs from Dubai (دبي): restaurant menus featuring machboos (spiced rice with meat), street names, shop signs. In Abu Dhabi (أبو ظبي), signs might be different from Dubai (دبي). Practice reading prices, hours, and directions." },
      ],
    },
    {
      id: "arae_a2_u1", title: "Getting Around & Transportation", level: "A2", order: 3,
      description: "Navigate cities, use transport, and ask for directions",
      lessons: [
        { id: "arae_a2_u1_l1", title: "Directions & Navigation", description: "Ask for and give directions in Dubai (دبي)", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Navigate Dubai (دبي) like a local. Key landmarks, neighborhoods, and how people give directions here. In Dubai (دبي), ask locals — they love helping visitors!" },
        { id: "arae_a2_u1_l2", title: "Public Transportation", description: "Buses, taxis, and local transport systems", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 2, culturalHint: "Transport in Dubai (دبي): Dubai Metro, taxis, and Careem. Learn to ask: 'How do I get to...?'" },
        { id: "arae_a2_u1_l3", title: "At the Hotel/Airbnb", description: "Check in, ask about amenities, handle problems", category: "grammar", level: "A2", duration: 10, xp: 30, order: 3, culturalHint: "Staying in Dubai (دبي)? Learn to check in, ask for wifi, request extra towels, and report issues. Hotels in the Arab world offer exceptional hospitality — 'الضيافة' (hospitality) is sacred." },
        { id: "arae_a2_u1_l4", title: "Emergency Situations", description: "Health, safety, and asking for help", category: "listening", level: "A2", duration: 9, xp: 30, order: 4, culturalHint: "Essential emergency phrases in Gulf Arabic (Emirati). How to say 'Help!', 'I need a doctor', 'Call the police'. In Dubai (دبي), pharmacies are everywhere and pharmacists give medical advice freely." },
        { id: "arae_a2_u1_l5", title: "Travel Journal Entry", description: "Write about your experiences exploring the city", category: "writing", level: "A2", duration: 10, xp: 30, order: 5, culturalHint: "Write a travel journal about Dubai (دبي). Describe the sights (Abu Dhabi (أبو ظبي), Sharjah (الشارقة)), the food you tried (machboos (spiced rice with meat), harees (wheat porridge)), and the people you met. Use past tense to describe what happened." },
      ],
    },
    {
      id: "arae_a2_u2", title: "Culture, Music & Entertainment", level: "A2", order: 4,
      description: "Music, dance, celebrations, and entertainment culture",
      lessons: [
        { id: "arae_a2_u2_l1", title: "Music & Dance", description: "Learn about yowla (stick dance) and local music culture", category: "vocabulary", level: "A2", duration: 9, xp: 30, order: 1, culturalHint: "Gulf Arabic (Emirati) music culture: yowla (stick dance), ayyala (traditional war dance), liwa (African-influenced dance), harbiya. Listen to Hussein Al Jasmi, Ahlam, Balqees, Rashed Al Majed. yowla (stick dance) is more than dance — it's identity. Learn the vocabulary of rhythm, instruments, and movement." },
        { id: "arae_a2_u2_l2", title: "Festivals & Celebrations", description: "Major holidays and how they're celebrated", category: "reading", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "Major celebrations: Eid al-Fitr, Eid al-Adha, UAE National Day (Dec 2), Ramadan (holy month). During Eid al-Fitr, people celebrate with food, music, and family. Learn the vocabulary of celebration!" },
        { id: "arae_a2_u2_l3", title: "Talking About Hobbies", description: "Discuss interests, sports, and leisure activities", category: "speaking", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Popular hobbies in Dubai (دبي): desert camping, falcon hunting, shopping, dune bashing. Talk about what you enjoy!" },
        { id: "arae_a2_u2_l4", title: "Understanding Song Lyrics", description: "Analyze a popular song in Gulf Arabic (Emirati)", category: "listening", level: "A2", duration: 10, xp: 35, order: 4, culturalHint: "Listen to Hussein Al Jasmi or Ahlam. Break down the lyrics — learn new vocabulary, cultural references, and emotional expressions. Gulf Arabic (Emirati) songs often reference love, homeland, and longing." },
        { id: "arae_a2_u2_l5", title: "Writing a Party Invitation", description: "Invite friends to a cultural celebration", category: "writing", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "Write an invitation to a Eid al-Fitr party! Include: date, time, location (Dubai (دبي)), what to bring, what to wear, and what food will be served (machboos (spiced rice with meat), thareed (bread stew)). Use festive language and cultural expressions." },
      ],
    },
    {
      id: "arae_b1_u1", title: "Society, History & Current Events", level: "B1", order: 5,
      description: "Discuss history, social issues, and current events",
      lessons: [
        { id: "arae_b1_u1_l1", title: "Historical Context", description: "Key historical events that shaped this culture", category: "reading", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "Pearl diving heritage, Bedouin traditions, oil discovery (1958), rapid modernization, Vision 2030. Discuss in Gulf Arabic (Emirati)." },
        { id: "arae_b1_u1_l2", title: "Social Issues & Opinions", description: "Express opinions about current social topics", category: "speaking", level: "B1", duration: 10, xp: 30, order: 2, culturalHint: "Discuss current issues in Dubai (دبي): sustainability, cultural identity in modernization, youth empowerment. Learn to express opinions respectfully." },
        { id: "arae_b1_u1_l3", title: "News & Media", description: "Understand news broadcasts and articles", category: "listening", level: "B1", duration: 11, xp: 35, order: 3, culturalHint: "Listen to news from Dubai (دبي). Popular media sources, how news is reported, and key vocabulary for current events. Al Jazeera, BBC Arabic, and local channels. Practice summarizing what you hear." },
        { id: "arae_b1_u1_l4", title: "Formal vs Informal Register", description: "Switch between formal and casual speech appropriately", category: "grammar", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Gulf Arabic (Emirati) has distinct formal/informal registers. Knowing when to be formal vs casual in Dubai (دبي) shows cultural competence." },
        { id: "arae_b1_u1_l5", title: "Opinion Essay", description: "Write a structured opinion piece on a cultural topic", category: "writing", level: "B1", duration: 12, xp: 35, order: 5, culturalHint: "Write about: 'How does the UAE balance modernization with preserving Bedouin traditions?' Use connectors, evidence, and conclusion." },
      ],
    },
    {
      id: "arae_b1_u2", title: "Work, Business & Professional Life", level: "B1", order: 6,
      description: "Professional communication, job culture, and business etiquette",
      lessons: [
        { id: "arae_b1_u2_l1", title: "Workplace Culture", description: "How work culture differs in this region", category: "reading", level: "B1", duration: 10, xp: 30, order: 1, culturalHint: "Work culture in Dubai (دبي): Business is relationship-based. The work week is Mon-Fri. Meetings start with pleasantries. Ramadan affects work hours." },
        { id: "arae_b1_u2_l2", title: "Job Interview Practice", description: "Prepare for and conduct a job interview", category: "speaking", level: "B1", duration: 12, xp: 35, order: 2, culturalHint: "Practice a job interview in Gulf Arabic (Emirati). Key phrases: introduce yourself, describe experience, ask about the role. In Dubai (دبي), personal connections (wasta) often matter. Dress formally, bring certificates." },
        { id: "arae_b1_u2_l3", title: "Email & Professional Writing", description: "Write formal emails, reports, and messages", category: "writing", level: "B1", duration: 10, xp: 30, order: 3, culturalHint: "Professional email etiquette in Gulf Arabic (Emirati). Start with 'بسم الله الرحمن الرحيم' (In the name of God) for formal letters. Use 'السلام عليكم' (Peace be upon you) as greeting." },
        { id: "arae_b1_u2_l4", title: "Negotiation & Persuasion", description: "Negotiate prices, terms, and agreements", category: "grammar", level: "B1", duration: 11, xp: 35, order: 4, culturalHint: "Negotiation culture: Business negotiations are formal but personal. Never rush. Building trust (ثقة) comes first." },
        { id: "arae_b1_u2_l5", title: "Listening: Business Meeting", description: "Understand a recorded business meeting", category: "listening", level: "B1", duration: 10, xp: 30, order: 5, culturalHint: "Listen to a business meeting in Gulf Arabic (Emirati). Notice how people address each other, how decisions are made, and how disagreements are handled. In Dubai (دبي), consensus and saving face are important — direct confrontation is avoided." },
      ],
    },
    {
      id: "arae_b2_u1", title: "Deep Culture & Identity", level: "B2", order: 7,
      description: "Literature, philosophy, identity, and cultural depth",
      lessons: [
        { id: "arae_b2_u1_l1", title: "Literature & Poetry", description: "Read and discuss famous works from this culture", category: "reading", level: "B2", duration: 15, xp: 40, order: 1, culturalHint: "Emirati poetry tradition, nabati poetry, modern Gulf literature. Poetry is deeply valued in Arab culture." },
        { id: "arae_b2_u1_l2", title: "Cultural Identity & Diaspora", description: "Discuss identity, belonging, and cultural preservation", category: "speaking", level: "B2", duration: 12, xp: 35, order: 2, culturalHint: "Gulf Arabic (Emirati) identity and how it differs from the 'standard' form of the language. Discuss in Gulf Arabic (Emirati)." },
        { id: "arae_b2_u1_l3", title: "Humor & Wordplay", description: "Understand jokes, puns, and cultural humor", category: "listening", level: "B2", duration: 10, xp: 30, order: 3, culturalHint: "Gulf Arabic (Emirati) humor: Local humor in Dubai (دبي) — understanding jokes means you truly know the culture." },
        { id: "arae_b2_u1_l4", title: "Film & Cinema Analysis", description: "Analyze a film from this culture", category: "writing", level: "B2", duration: 14, xp: 40, order: 4, culturalHint: "Cinema from Dubai (دبي) — analyze themes, dialogue, and cultural references. Write a film review in Gulf Arabic (Emirati)." },
        { id: "arae_b2_u1_l5", title: "Idiomatic Expressions", description: "Master local idioms and proverbs", category: "grammar", level: "B2", duration: 11, xp: 35, order: 5, culturalHint: "Gulf Arabic (Emirati) idioms: Local proverbs that reveal the wisdom of Gulf Arabic (Emirati) culture." },
      ],
    },
    {
      id: "arae_c1_u1", title: "Advanced Expression & Nuance", level: "C1", order: 8,
      description: "Subtle nuance, advanced argumentation, and cultural fluency",
      lessons: [
        { id: "arae_c1_u1_l1", title: "Political Discourse", description: "Understand and discuss political topics with nuance", category: "listening", level: "C1", duration: 15, xp: 45, order: 1, culturalHint: "Political discourse in Gulf Arabic (Emirati): Gulf politics: monarchy, oil economics, Vision 2030, regional diplomacy. Formal political Arabic." },
        { id: "arae_c1_u1_l2", title: "Academic Writing", description: "Write research-level prose with proper argumentation", category: "writing", level: "C1", duration: 15, xp: 45, order: 2, culturalHint: "Academic writing in Gulf Arabic (Emirati): Modern Standard Arabic (فصحى) is used for academic work. Learn to switch between dialect and MSA seamlessly. Write a 500-word essay on majlis (sitting room gatherings)." },
        { id: "arae_c1_u1_l3", title: "Dialect Switching", description: "Move between formal and dialectal registers fluidly", category: "speaking", level: "C1", duration: 12, xp: 40, order: 3, culturalHint: "Master code-switching: Navigate between Gulf Arabic (Emirati) and the standard form of the language." },
        { id: "arae_c1_u1_l4", title: "Debate & Persuasion", description: "Construct and defend complex arguments", category: "grammar", level: "C1", duration: 13, xp: 40, order: 4, culturalHint: "Debate culture: Persuasion techniques in Gulf Arabic (Emirati) culture — how to argue effectively and respectfully." },
        { id: "arae_c1_u1_l5", title: "Cultural Commentary", description: "Write sophisticated cultural analysis", category: "reading", level: "C1", duration: 14, xp: 40, order: 5, culturalHint: "Read and analyze cultural commentary from Dubai (دبي). How Gulf Arabic (Emirati) intellectuals discuss cultural preservation, globalization, and identity. Write your own cultural commentary." },
      ],
    },
    {
      id: "arae_c2_u1", title: "Native-Level Fluency & Cultural Mastery", level: "C2", order: 9,
      description: "Near-native expression, cultural depth, and creative mastery",
      lessons: [
        { id: "arae_c2_u1_l1", title: "Creative Writing", description: "Write poetry, fiction, or creative non-fiction", category: "writing", level: "C2", duration: 18, xp: 50, order: 1, culturalHint: "Write creatively in Gulf Arabic (Emirati): Write nabati poetry (vernacular Emirati poetry) or a modern short story about tradition meeting modernity." },
        { id: "arae_c2_u1_l2", title: "Simultaneous Interpretation", description: "Translate complex speech in real-time between languages", category: "listening", level: "C2", duration: 15, xp: 50, order: 2, culturalHint: "Practice interpreting between Gulf Arabic (Emirati) and English. Handle: political speeches, religious sermons, business negotiations — each requires different vocabulary and register. Cultural context is key — some concepts don't translate directly." },
        { id: "arae_c2_u1_l3", title: "Teaching Others", description: "Explain grammar and culture to beginners", category: "speaking", level: "C2", duration: 12, xp: 45, order: 3, culturalHint: "The ultimate test: teach Gulf Arabic (Emirati) to someone else. Explain: the unique features of Gulf Arabic (Emirati) that make it special." },
        { id: "arae_c2_u1_l4", title: "Cultural Mediation", description: "Bridge cultural misunderstandings between speakers", category: "grammar", level: "C2", duration: 14, xp: 45, order: 4, culturalHint: "Mediate between cultures: Help people from different cultures understand Gulf Arabic (Emirati) communication styles." },
        { id: "arae_c2_u1_l5", title: "Masterclass: Cultural Fluency", description: "Demonstrate complete cultural and linguistic mastery", category: "reading", level: "C2", duration: 16, xp: 50, order: 5, culturalHint: "Final challenge: Read a complex text about the UAE's transformation from pearl-diving villages to global cities in 50 years, cultural preservation efforts, and the future of Gulf identity. Discuss with native-level fluency." },
      ],
    },
  ],
};

export const ALL_CURRICULA: Record<string, LanguageCurriculum> = {
  "fr-HT": FRENCH_HAITIAN_CREOLE,
  "fr-QC": FRENCH_QUEBECOIS,
  "fr-SN": FRENCH_AFRICAN,
  "pt-BR": PORTUGUESE_BRAZILIAN,
  "pt-PT": PORTUGUESE_EUROPEAN,
  "ar-EG": ARABIC_EGYPTIAN,
  "ar-LB": ARABIC_LEVANTINE,
  "ar-AE": ARABIC_GULF,
  "es-CO": SPANISH_COLOMBIAN,
  "es-VE": SPANISH_VENEZUELAN,
  "es-CU": SPANISH_CUBAN,
  "es-CR": SPANISH_COSTA_RICAN,
  "es-AR": SPANISH_ARGENTINE,
  "es-PE": SPANISH_PERUVIAN,
  "es-CL": SPANISH_CHILEAN,
  "es-PR": SPANISH_PUERTO_RICAN,
  "es": SPANISH_STANDARD,
  "es-DO": SPANISH_DOMINICAN,
  "es-MX": SPANISH_MEXICAN,
  "fr": FRENCH,
  "pt": PORTUGUESE,
  "ja": JAPANESE,
  "zh": MANDARIN,
  "ko": KOREAN,
  "it": ITALIAN,
  "de": GERMAN,
};

/**
 * Get the curriculum for a given language code.
 * Falls back to standard Spanish if not found.
 * Supports dialect codes like "es-DO" or plain codes like "fr".
 */
export function getCurriculum(languageCode: string, dialect?: string): LanguageCurriculum {
  // Try exact match first (e.g., "es-DO")
  if (ALL_CURRICULA[languageCode]) {
    return ALL_CURRICULA[languageCode];
  }

  // Try with dialect suffix
  if (dialect) {
    const dialectCode = `${languageCode}-${dialect}`;
    if (ALL_CURRICULA[dialectCode]) {
      return ALL_CURRICULA[dialectCode];
    }
  }

  // Try base language
  const baseCode = languageCode.split("-")[0];
  if (ALL_CURRICULA[baseCode]) {
    return ALL_CURRICULA[baseCode];
  }

  // Generate a template curriculum for unsupported languages
  return generateTemplateCurriculum(languageCode);
}

/**
 * Get all available curricula as a list for the language picker.
 */
export function getAvailableCurricula(): LanguageCurriculum[] {
  return Object.values(ALL_CURRICULA);
}

/**
 * Generate a template curriculum for languages without custom content.
 * Uses generic lesson titles that work for any language.
 */
function generateTemplateCurriculum(code: string): LanguageCurriculum {
  const LANGUAGE_NAMES: Record<string, { name: string; flag: string }> = {
    de: { name: "German", flag: "🇩🇪" },
    it: { name: "Italian", flag: "🇮🇹" },
    ko: { name: "Korean", flag: "🇰🇷" },
    ar: { name: "Arabic", flag: "🇸🇦" },
    hi: { name: "Hindi", flag: "🇮🇳" },
    ru: { name: "Russian", flag: "🇷🇺" },
    tr: { name: "Turkish", flag: "🇹🇷" },
    nl: { name: "Dutch", flag: "🇳🇱" },
    sv: { name: "Swedish", flag: "🇸🇪" },
    pl: { name: "Polish", flag: "🇵🇱" },
    th: { name: "Thai", flag: "🇹🇭" },
    vi: { name: "Vietnamese", flag: "🇻🇳" },
    id: { name: "Indonesian", flag: "🇮🇩" },
    uk: { name: "Ukrainian", flag: "🇺🇦" },
    el: { name: "Greek", flag: "🇬🇷" },
    he: { name: "Hebrew", flag: "🇮🇱" },
    sw: { name: "Swahili", flag: "🇰🇪" },
    tl: { name: "Tagalog", flag: "🇵🇭" },
    en: { name: "English", flag: "🇺🇸" },
  };

  const info = LANGUAGE_NAMES[code] || { name: code.toUpperCase(), flag: "🌐" };

  const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const unitTemplates = [
    { suffix: "u1", titles: ["First Steps", "Daily Life"] },
    { suffix: "u2", titles: ["Getting Around", "Food & Drink"] },
    { suffix: "u3", titles: ["Culture & Society", "Professional Life"] },
    { suffix: "u4", titles: ["Advanced Expression", "Nuance & Precision"] },
    { suffix: "u5", titles: ["Mastery & Fluency"] },
  ];

  const categories: LessonCategory[] = ["vocabulary", "speaking", "grammar", "reading", "writing"];
  const units: Unit[] = [];
  let order = 1;

  // Generate 2 units for A1, A2, B1 and 1 each for B2, C1, C2
  const unitsPerLevel: Record<CEFRLevel, number> = { A1: 2, A2: 2, B1: 2, B2: 1, C1: 1, C2: 1 };

  for (const level of levels) {
    const count = unitsPerLevel[level];
    for (let u = 1; u <= count; u++) {
      const unitId = `${code}_${level.toLowerCase()}_u${u}`;
      const lessons: Lesson[] = categories.map((cat, i) => ({
        id: `${unitId}_l${i + 1}`,
        title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} ${level}${u > 1 ? " Part " + u : ""}`,
        description: `${cat} practice at ${level} level`,
        category: cat,
        level,
        duration: level <= "A2" ? 8 : level <= "B1" ? 12 : 15,
        xp: level <= "A2" ? 25 : level <= "B1" ? 35 : 50,
        order: i + 1,
      }));

      units.push({
        id: unitId,
        title: `${info.name} ${level} Unit ${u}`,
        level,
        description: `${level} level ${info.name} — Unit ${u}`,
        lessons,
        order: order++,
      });
    }
  }

  return {
    code,
    name: info.name,
    flag: info.flag,
    totalLessons: units.reduce((sum, u) => sum + u.lessons.length, 0),
    totalUnits: units.length,
    estimatedHours: 90,
    units,
  };
}
