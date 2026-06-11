/**
 * Cultural Calendar — Auto-surfaces relevant cultural lessons based on upcoming real-world holidays.
 * 
 * When a holiday is approaching (within 14 days), the system recommends related lessons
 * that teach vocabulary, traditions, and cultural context for that holiday IN the target language.
 */

export interface CulturalHoliday {
  id: string;
  name: string;                    // Name in English
  nativeName: string;              // Name in the target language
  pronunciation?: string;          // Romanization for non-Latin scripts
  month: number;                   // 1-12
  day: number;                     // 1-31 (approximate for lunar holidays)
  isLunar?: boolean;               // True if date varies by lunar calendar
  languages: string[];             // Which language learners this is relevant for
  description: string;             // What happens during this holiday
  vocabulary: string[];            // Key words to learn (in target language)
  traditions: string[];            // What people do
  foods: string[];                 // What people eat (in target language)
  greetings: string[];             // How to wish someone (in target language)
  relatedLessonCategories: string[]; // Which lesson categories to recommend
  culturalSignificance: string;    // Why it matters
  durationDays: number;            // How long it lasts
  // === NEW: Location, History & News fields ===
  location?: {
    city: string;                  // Primary city/town (e.g., "La Vega", "Cusco", "Shibuya")
    region: string;                // State/province/department
    country: string;               // Full country name
    coordinates?: { lat: number; lng: number }; // For map display
    famousVenues?: string[];       // Specific places to go (e.g., "Zócalo", "Sambódromo")
  };
  history?: {
    origin: string;                // How/when it started
    whyTheyCelebrate: string;      // The deep WHY — what it means to the people
    historicalContext: string;     // Colonial, indigenous, religious, political background
    yearEstablished?: number;      // Year it was first celebrated (if known)
    evolution: string;             // How it changed over time to what it is today
  };
  dances?: {
    name: string;                  // Dance name in target language
    description: string;           // What it looks like, how it's danced
    music: string;                 // What music plays
    attire: string;                // What people wear
  }[];
  music?: string[];                // Songs/artists associated with this holiday
  newsStyle?: {
    headline: string;              // News-style headline (e.g., "Carnival of Barranquilla kicks off Saturday!")
    urgency: "happening_now" | "this_week" | "coming_soon" | "upcoming"; // For countdown styling
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPANISH HOLIDAYS
// ═══════════════════════════════════════════════════════════════════════════════

const SPANISH_HOLIDAYS: CulturalHoliday[] = [
  {
    id: "dia_de_muertos",
    name: "Day of the Dead",
    nativeName: "Día de los Muertos",
    month: 11, day: 1,
    languages: ["es", "es-MX", "es-DO"],
    description: "A multi-day celebration honoring deceased loved ones with ofrendas, marigolds, and sugar skulls",
    vocabulary: ["la ofrenda", "la calavera", "el pan de muerto", "la flor de cempasúchil", "las velas", "el altar", "los difuntos", "el cementerio"],
    traditions: ["Build an ofrenda with photos, food, and belongings of the deceased", "Visit cemeteries to clean and decorate graves", "Make sugar skulls (calaveras de azúcar)", "Bake pan de muerto", "Paint faces as calaveras"],
    foods: ["pan de muerto", "calaveras de azúcar", "mole negro", "tamales", "atole", "chocolate caliente"],
    greetings: ["¡Feliz Día de los Muertos!", "Que sus muertos los bendigan"],
    relatedLessonCategories: ["vocabulary", "speaking", "writing"],
    culturalSignificance: "Pre-Hispanic tradition blended with Catholicism. Death is not feared but celebrated — the dead return to visit. UNESCO Intangible Cultural Heritage.",
    durationDays: 3,
    location: {
      city: "Mixquic & Pátzcuaro",
      region: "Mexico City & Michoacán",
      country: "Mexico",
      coordinates: { lat: 19.2295, lng: -99.0078 },
      famousVenues: ["Isla de Janitzio (Pátzcuaro Lake)", "Panteón de San Andrés Mixquic", "Zócalo mega-ofrenda", "Coyoacán neighborhood altars"],
    },
    history: {
      origin: "3,000-year-old Aztec tradition honoring Mictecacíhuatl (Lady of the Dead). The Aztecs believed death was not an end but a continuation — the dead traveled to Mictlán and could return once a year.",
      whyTheyCelebrate: "Mexicans celebrate because they believe death is not something to fear — it's part of life's cycle. The dead are not gone; they return to eat, drink, and be with family. It's a joyful reunion, not mourning.",
      historicalContext: "When Spanish colonizers arrived in the 1500s, they tried to eliminate the 'pagan' festival but couldn't. Instead, it merged with Catholic All Saints' Day (Nov 1) and All Souls' Day (Nov 2). The Aztec month-long celebration was compressed into 3 days.",
      yearEstablished: -1000,
      evolution: "Originally a month-long Aztec ritual in August. Spanish moved it to November to align with Catholic calendar. In the 20th century, José Guadalupe Posada's 'La Catrina' skeleton became the icon. Today it's a UNESCO Intangible Cultural Heritage (2008) and a global phenomenon after the movie 'Coco' (2017).",
    },
    dances: [
      {
        name: "Danza de los Viejitos",
        description: "Dancers wear old-man masks and hunch over canes, then suddenly burst into energetic footwork — symbolizing that the elderly still have life and spirit",
        music: "Son de la Negra and traditional Purépecha melodies played on jaranas and guitars",
        attire: "White cotton pants and shirt, colorful serape, wooden old-man mask with white hair, straw hat, and a carved wooden cane",
      },
    ],
    music: ["La Llorona (traditional)", "La Calaca (popular children's song)", "Cielito Lindo", "Son de la Negra"],
    newsStyle: {
      headline: "Día de los Muertos celebrations begin across Mexico — ofrendas light up cemeteries nationwide!",
      urgency: "happening_now",
    },
  },
  {
    id: "dia_de_reyes",
    name: "Three Kings Day",
    nativeName: "Día de los Reyes Magos",
    month: 1, day: 6,
    languages: ["es", "es-MX", "es-DO"],
    description: "Children receive gifts from the Three Wise Men, eat Rosca de Reyes cake",
    vocabulary: ["los Reyes Magos", "Melchor", "Gaspar", "Baltasar", "la rosca de reyes", "el niño Dios", "los zapatos", "la carta"],
    traditions: ["Leave shoes out with hay and water for the camels", "Write a letter to the Reyes Magos", "Eat Rosca de Reyes — whoever finds the baby Jesus figurine hosts a party on Feb 2"],
    foods: ["rosca de reyes", "chocolate caliente", "tamales", "atole"],
    greetings: ["¡Feliz Día de Reyes!", "¿Qué te trajeron los Reyes?"],
    relatedLessonCategories: ["vocabulary", "listening", "speaking"],
    culturalSignificance: "More important than Christmas for gift-giving in many Latin American countries. Children write letters to the Three Kings, not Santa Claus.",
    durationDays: 1,
    location: {
      city: "Mexico City",
      region: "Ciudad de México",
      country: "Mexico",
      famousVenues: ["Zócalo (giant Rosca de Reyes)", "Alameda Central", "Coyoacán markets"],
    },
    history: {
      origin: "Biblical tradition of the Three Wise Men (Melchior, Gaspar, Balthasar) who brought gifts to baby Jesus. Brought to the Americas by Spanish colonizers in the 1500s.",
      whyTheyCelebrate: "For Latin Americans, this is the REAL gift-giving day — not December 25. Children write letters to the Reyes Magos asking for toys. It's about family, magic, and the joy of childhood.",
      historicalContext: "In Spain and Latin America, the Three Kings were always more important than Santa Claus. The tradition survived colonization because it aligned with Catholic doctrine. Santa Claus is a recent American import.",
      yearEstablished: 1500,
      evolution: "Originally a purely religious observance. Over centuries, it became the primary gift-giving holiday for children. The Rosca de Reyes cake tradition (finding the baby Jesus figurine) was added in medieval Spain. Today, some families celebrate both Dec 25 AND Jan 6.",
    },
    music: ["Los Reyes Magos (villancico)", "Noche de Paz", "Los Peces en el Río"],
    newsStyle: {
      headline: "¡Los Reyes Magos llegan esta noche! Children across Latin America leave shoes out with hay and water",
      urgency: "this_week",
    },
  },
  {
    id: "semana_santa",
    name: "Holy Week",
    nativeName: "Semana Santa",
    month: 4, day: 10, isLunar: true,
    languages: ["es", "es-MX", "es-DO"],
    description: "Week-long religious celebrations with processions, music, and special foods",
    vocabulary: ["la procesión", "el paso", "los nazarenos", "la Virgen", "el Cristo", "la cuaresma", "el Viernes Santo", "la Pascua"],
    traditions: ["Watch processions with floats (pasos) carried through streets", "Attend church services", "Eat special Lenten foods (no meat on Friday)", "Beach vacations in many countries"],
    foods: ["torrijas", "potaje de vigilia", "bacalao", "capirotada", "fanesca (Ecuador)"],
    greetings: ["¡Feliz Semana Santa!", "¡Felices Pascuas!"],
    relatedLessonCategories: ["vocabulary", "reading", "speaking"],
    culturalSignificance: "The most important religious celebration in the Spanish-speaking world. Entire cities shut down. Seville's Semana Santa is world-famous.",
    durationDays: 7,
    location: {
      city: "Seville & Antigua Guatemala",
      region: "Andalucía, Spain & Sacatepéquez, Guatemala",
      country: "Spain & Guatemala",
      coordinates: { lat: 37.3891, lng: -5.9845 },
      famousVenues: ["La Macarena basilica (Seville)", "La Giralda route", "Antigua Guatemala cobblestone streets", "Iglesia de La Merced"],
    },
    history: {
      origin: "Christian commemoration of Jesus Christ's final week — from Palm Sunday entry into Jerusalem through crucifixion (Good Friday) to resurrection (Easter Sunday). Brought to the Americas by Spanish missionaries.",
      whyTheyCelebrate: "For the Spanish-speaking world, Semana Santa is not just religious — it's cultural identity. Entire communities come together. The processions represent centuries of tradition, artistry, and devotion passed down through families.",
      historicalContext: "Spain's Semana Santa traditions date to the 16th century when Catholic brotherhoods (cofradías) began organizing processions. In Latin America, indigenous traditions blended with Catholic rituals — Guatemalan alfombras (sawdust carpets) have Mayan roots.",
      yearEstablished: 1500,
      evolution: "Started as simple church services. By the 1600s, elaborate floats (pasos) were carved. Today, Seville's Semana Santa is a UNESCO event with 60+ brotherhoods, 50,000+ participants, and 1 million+ spectators. Guatemala's alfombras are now world-famous art.",
    },
    dances: [
      {
        name: "Saeta",
        description: "Not a dance but a deeply emotional flamenco song sung from balconies as processions pass below — the singer cries out to the Virgin or Christ on the float",
        music: "A cappella flamenco vocals, sometimes with a single guitar. The crowd falls silent. The procession stops.",
        attire: "The singer wears everyday clothes — it's spontaneous, raw, from the heart. Nazarenos below wear pointed hoods and robes.",
      },
    ],
    music: ["Saetas (flamenco religious songs)", "Marcha Real (processional march)", "Amarguras (most famous Semana Santa march)"],
    newsStyle: {
      headline: "Semana Santa processions fill streets across Spain and Latin America — millions gather for Holy Week",
      urgency: "happening_now",
    },
  },
  {
    id: "carnaval_dominicano",
    name: "Dominican Carnival",
    nativeName: "Carnaval Dominicano",
    month: 2, day: 27,
    languages: ["es-DO"],
    description: "Month-long celebration with colorful costumes, masks, and dancing in the streets",
    vocabulary: ["los diablos cojuelos", "la vejiga", "el disfraz", "la máscara", "el desfile", "la comparsa", "el merengue", "la mangulina"],
    traditions: ["Diablos Cojuelos hit people with vejigas (inflated bladders)", "Elaborate costume competitions", "Street parades every Sunday in February", "Culminates on Independence Day (Feb 27)"],
    foods: ["chivo guisado", "moro de guandules", "empanadas", "dulce de coco", "cerveza Presidente"],
    greetings: ["¡Feliz Carnaval!", "¡Que viva el Carnaval!"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "Blends African, Taíno, and Spanish traditions. Each town has unique characters — La Vega's diablos cojuelos are most famous. Tied to Dominican Independence Day.",
    durationDays: 28,
    location: {
      city: "La Vega & Santo Domingo",
      region: "La Vega Province & Distrito Nacional",
      country: "Dominican Republic",
      coordinates: { lat: 19.2244, lng: -70.5296 },
      famousVenues: ["Calle Real de La Vega (main parade route)", "Malecón de Santo Domingo", "Santiago de los Caballeros parade grounds"],
    },
    history: {
      origin: "Blends three cultures: Spanish colonizers brought Carnival from Europe (pre-Lent celebration), enslaved Africans added drumming and masks, and Taíno indigenous people contributed nature spirits and body paint.",
      whyTheyCelebrate: "Dominicans celebrate because Carnival IS Dominican identity — it's rebellion, freedom, joy, and community. The Diablos Cojuelos represent fighting back against oppression. It culminates on Independence Day (Feb 27) because freedom and celebration are inseparable.",
      historicalContext: "During colonial times, enslaved Africans were given brief freedom during Carnival — they used it to mock their masters with masks and costumes. After independence in 1844, Carnival became a national symbol of Dominican freedom and cultural pride.",
      yearEstablished: 1520,
      evolution: "Started as a Spanish colonial tradition in the 1500s. Enslaved Africans transformed it with masks and drums. After independence (1844), it became patriotic. La Vega's Diablos Cojuelos became iconic in the 1900s. Today it's a month-long national celebration with each town having unique characters.",
    },
    dances: [
      {
        name: "Merengue de Calle",
        description: "Fast-paced street merengue where everyone dances — hips move side to side, feet shuffle in quick 2-step, partners hold close or dance solo in the crowd",
        music: "Live merengue típico bands with tambora, güira, and accordion blasting from trucks (carros de música)",
        attire: "Diablos Cojuelos wear elaborate sequined costumes with horned masks, capes covered in mirrors and bells, and carry vejigas (inflated bladders) to hit bystanders",
      },
      {
        name: "Mangulina",
        description: "Traditional Dominican folk dance — couples spin and twirl with quick footwork, the woman's skirt flares out in circles",
        music: "Mangulina rhythm played on accordion, tambora, and güira — faster than merengue, with a distinctive galloping beat",
        attire: "Women wear long colorful skirts and white blouses; men wear white guayaberas and straw hats",
      },
    ],
    music: ["Vengan a Ver (Carnival anthem)", "El Merengue de Calle (street merengue)", "Compadre Pedro Juan (traditional)", "Wilfrido Vargas - El Africano"],
    newsStyle: {
      headline: "¡Carnaval Dominicano explodes in La Vega! Diablos Cojuelos take over the streets with vejigas and merengue",
      urgency: "happening_now",
    },
  },
  {
    id: "fiestas_patrias_mx",
    name: "Mexican Independence Day",
    nativeName: "Fiestas Patrias",
    month: 9, day: 15,
    languages: ["es-MX"],
    description: "Celebration of Mexican independence with El Grito, fireworks, and patriotic festivities",
    vocabulary: ["El Grito", "¡Viva México!", "la independencia", "el zócalo", "los héroes patrios", "la bandera", "el mariachi", "los fuegos artificiales"],
    traditions: ["El Grito de Independencia at 11pm on Sept 15", "President rings the bell and shouts '¡Viva México!'", "Fireworks, mariachi, and dancing", "Wear green, white, and red"],
    foods: ["pozole", "chiles en nogada", "tostadas", "tamales", "tequila", "pulque"],
    greetings: ["¡Viva México!", "¡Felices Fiestas Patrias!"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "The most patriotic day in Mexico. NOT Cinco de Mayo (which is minor). The whole country celebrates with food, music, and national pride.",
    durationDays: 2,
    location: {
      city: "Mexico City",
      region: "Ciudad de México",
      country: "Mexico",
      coordinates: { lat: 19.4326, lng: -99.1332 },
      famousVenues: ["Zócalo (main square — El Grito happens here)", "Palacio Nacional balcony", "Ángel de la Independencia monument", "Dolores Hidalgo (where the original Grito happened in 1810)"],
    },
    history: {
      origin: "On September 16, 1810, Father Miguel Hidalgo rang the church bell in Dolores, Guanajuato and called the people to revolt against Spanish colonial rule. This 'Grito de Dolores' sparked the Mexican War of Independence.",
      whyTheyCelebrate: "Mexicans celebrate because this is the moment their nation was born — when an ordinary priest dared to say 'enough' to 300 years of Spanish oppression. It represents courage, unity, and Mexican identity.",
      historicalContext: "Spain had ruled Mexico (New Spain) for 300 years. Criollos (Spanish-descended Mexicans) were denied power. Hidalgo's revolt united indigenous, mestizo, and criollo Mexicans against the Spanish crown. Independence was finally won in 1821.",
      yearEstablished: 1810,
      evolution: "Originally just a remembrance of Hidalgo's call. President Porfirio Díaz moved the celebration to Sept 15 (his birthday) in the 1900s. Today, the President re-enacts El Grito from the National Palace balcony at 11pm on Sept 15, ringing Hidalgo's actual bell. The whole country watches on TV.",
    },
    dances: [
      {
        name: "Jarabe Tapatío",
        description: "The 'Mexican Hat Dance' — man courts woman with fancy footwork around a sombrero on the ground, she teases and retreats, finally accepts and they dance together",
        music: "Mariachi orchestra with violins, trumpets, guitarrón, and vihuela playing the iconic Jarabe melody",
        attire: "Man wears full charro suit (tight embroidered pants, short jacket, wide sombrero). Woman wears china poblana dress (sequined skirt, embroidered blouse, rebozo shawl)",
      },
    ],
    music: ["Cielito Lindo", "El Son de la Negra", "México Lindo y Querido", "Huapango de Moncayo", "Las Mañanitas"],
    newsStyle: {
      headline: "¡VIVA MÉXICO! President leads El Grito from the Zócalo — 100,000+ gather for Independence celebrations",
      urgency: "happening_now",
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SPANISH DIALECT HOLIDAYS
// ═══════════════════════════════════════════════════════════════════════════════

const SPANISH_DIALECT_HOLIDAYS: CulturalHoliday[] = [
  // COLOMBIAN
  {
    id: "carnaval_barranquilla",
    name: "Carnival of Barranquilla",
    nativeName: "Carnaval de Barranquilla",
    month: 2, day: 25, isLunar: true,
    languages: ["es-CO"],
    description: "Colombia's biggest carnival — 4 days of cumbia, mapalé, and colorful parades. UNESCO Masterpiece of Oral and Intangible Heritage.",
    vocabulary: ["la cumbia", "el mapalé", "la comparsa", "el disfraz", "la Batalla de Flores", "el Congo Grande", "la pollera colorá", "el garabato"],
    traditions: ["Batalla de Flores (Battle of Flowers) parade", "Gran Parada de Fantasía", "Joselito's funeral (symbolic end of carnival)", "Cumbia dancing in the streets", "Marimonda masks"],
    foods: ["butifarra", "arepa de huevo", "carimañola", "chicha", "ron", "agua de panela con limón"],
    greetings: ["¡Quien lo vive es quien lo goza!", "¡Que viva el Carnaval!"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "Second largest carnival in the world after Rio. Blends Indigenous, African, and European traditions. The cumbia was born here.",
    durationDays: 4,
    location: {
      city: "Barranquilla",
      region: "Atlántico",
      country: "Colombia",
      coordinates: { lat: 10.9685, lng: -74.7813 },
      famousVenues: ["Vía 40 (main parade route)", "Calle 17 (Batalla de Flores)", "Plaza de la Paz", "Estadio Romelio Martínez"],
    },
    history: {
      origin: "Blends Indigenous Mocaná rituals, African drumming brought by enslaved people, and European Carnival traditions from Spanish colonizers. The three cultures merged on the Caribbean coast to create something entirely new.",
      whyTheyCelebrate: "Barranquilleros celebrate because Carnival IS their identity — it's 4 days where social class disappears, everyone dances together, and the city becomes one giant family. 'Quien lo vive es quien lo goza' (You have to live it to enjoy it).",
      historicalContext: "The Caribbean coast of Colombia was where African, Indigenous, and Spanish cultures mixed most freely. Unlike highland Bogotá, the coast was less rigid about racial hierarchies. Carnival became the expression of this cultural freedom.",
      yearEstablished: 1888,
      evolution: "Started as informal street celebrations in the 1800s. Formalized in 1888 with the first Batalla de Flores. UNESCO declared it a Masterpiece of Oral and Intangible Heritage in 2003. Today it's the second-largest carnival in the world (after Rio) with 1.5 million+ participants.",
    },
    dances: [
      {
        name: "Cumbia",
        description: "Couples dance in a circle — woman holds a candle or bundle of candles, man dances around her waving his hat. Feet shuffle in small steps, hips sway gently. The woman is the center, the man orbits her.",
        music: "Gaita flutes, tambor alegre (happy drum), llamador drum, maracas, and guacharaca scraper. The rhythm is hypnotic — boom-cha-boom-cha.",
        attire: "Women wear long white pollera skirts with colorful trim, flower crown, and hold lit candles. Men wear white pants, white shirt, red bandana, and a vueltiao hat (iconic woven Colombian hat).",
      },
      {
        name: "Mapalé",
        description: "Explosive, fast African-rooted dance — dancers shake their entire bodies with incredible speed, hips and shoulders moving independently. It's athletic, sensual, and electrifying.",
        music: "Fast drumming on tambor alegre and llamador, with call-and-response chanting. The tempo is twice as fast as cumbia.",
        attire: "Minimal — women in short skirts and crop tops, men shirtless or in shorts. Bodies are sometimes painted. The focus is on the body's movement, not clothing.",
      },
    ],
    music: ["La Pollera Colorá (Joe Arroyo)", "Se Va el Caimán (traditional)", "Te Olvidé (Carlos Vives)", "La Tierra del Olvido (Carlos Vives)"],
    newsStyle: {
      headline: "¡Quien lo vive es quien lo goza! Carnival of Barranquilla explodes with cumbia, mapalé, and 1.5 million revelers!",
      urgency: "happening_now",
    },
  },
  {
    id: "feria_flores",
    name: "Festival of Flowers",
    nativeName: "Feria de las Flores",
    month: 8, day: 1,
    languages: ["es-CO"],
    description: "Medellín's famous flower festival with silleteros carrying massive flower arrangements on their backs",
    vocabulary: ["el silletero", "la silleta", "las flores", "el desfile", "la orquídea", "el campesino", "la finca", "el arriero"],
    traditions: ["Desfile de Silleteros (flower carriers parade)", "Tablados (outdoor concerts)", "Classic car parade", "Orchid exhibitions", "Trova (improvised singing)"],
    foods: ["bandeja paisa", "mondongo", "empanadas", "aguardiente antioqueño", "buñuelos"],
    greetings: ["¡Feliz Feria de las Flores!", "¡Viva Medellín!"],
    relatedLessonCategories: ["vocabulary", "reading", "speaking"],
    culturalSignificance: "Celebrates paisa culture and the resilience of Medellín. Silleteros are campesinos who carried goods on their backs — now they carry art.",
    durationDays: 10,
  },
  // VENEZUELAN
  {
    id: "diablos_yare",
    name: "Dancing Devils of Yare",
    nativeName: "Diablos Danzantes de Yare",
    month: 6, day: 19, isLunar: true,
    languages: ["es-VE"],
    description: "Corpus Christi celebration where dancers in devil masks perform ritual dances representing good over evil",
    vocabulary: ["los diablos", "la máscara", "el tambor", "la danza", "el Corpus Christi", "la promesa", "el capataz", "la cruz"],
    traditions: ["Dancers wear red costumes and horned masks", "Dance backwards toward the church", "Kneel before the Blessed Sacrament", "Drums and maracas accompany the dance", "Passed down through generations"],
    foods: ["hallaca", "cachapa", "chicha", "papelón con limón"],
    greetings: ["¡Que vivan los Diablos!", "¡Feliz Corpus Christi!"],
    relatedLessonCategories: ["vocabulary", "listening", "speaking"],
    culturalSignificance: "UNESCO Intangible Cultural Heritage. Represents the triumph of good over evil. African-origin tradition blended with Catholicism.",
    durationDays: 1,
    location: {
      city: "San Francisco de Yare",
      region: "Miranda",
      country: "Venezuela",
      coordinates: { lat: 10.2333, lng: -66.7333 },
      famousVenues: ["Iglesia de San Francisco de Yare", "Streets of Yare", "Chuao (cacao town)", "Naiguatá coastal town"],
    },
    history: {
      origin: "Brought by enslaved Africans who merged their spiritual beliefs with Catholic Corpus Christi. The 'devils' represent evil submitting to the Holy Sacrament — they dance and then kneel before the church.",
      whyTheyCelebrate: "Venezuelans celebrate because it represents the triumph of good over evil, community over individualism. The dancers make a sacred promise (promesa) — often for healing a sick child or giving thanks. Breaking the promise brings bad luck.",
      historicalContext: "During colonial times, enslaved Africans were forced to participate in Catholic festivals. They subverted the tradition by wearing devil masks — appearing to submit to the Church while secretly honoring their own spirits. UNESCO Intangible Cultural Heritage since 2012.",
      yearEstablished: 1749,
      evolution: "First documented in 1749 in Yare. Originally just men danced; now women participate too. Each town has unique mask styles — Yare's are red with horns, Naiguatá's are colorful and elaborate. The tradition nearly died in the 1970s but was revived by cultural activists.",
    },
    dances: [
      {
        name: "Danza de los Diablos",
        description: "Dancers in devil masks and red costumes dance aggressively through streets, shaking maracas and cracking whips. They approach the church, dance faster and faster, then suddenly fall to their knees in submission before the Holy Sacrament.",
        music: "Caja drum (single-headed), maracas, and the crack of leather whips. The rhythm accelerates as dancers approach the church.",
        attire: "Red pants and shirt, elaborate papier-mâché devil mask with horns (each unique), a cross worn OVER the costume (showing the devil submits to God), tail, and leather whip.",
      },
    ],
    music: ["Canto de los Diablos (ritual chant)", "Golpe de tambor (drum rhythm)", "Fulía (call-and-response song)"],
    newsStyle: {
      headline: "Dancing Devils of Yare take over the streets! Venezuela's UNESCO-protected Corpus Christi tradition continues",
      urgency: "this_week",
    },
  },
  {
    id: "carnaval_ve",
    name: "Venezuelan Carnival",
    nativeName: "Carnaval Venezolano",
    month: 2, day: 20, isLunar: true,
    languages: ["es-VE"],
    description: "National holiday with water fights, parades, and beach trips across Venezuela",
    vocabulary: ["el carnaval", "la comparsa", "el agua", "la playa", "el disfraz", "la reina", "el desfile", "la parranda"],
    traditions: ["Water fights everywhere", "Beach vacations (everyone goes to the coast)", "Parades with floats", "Burning of Judas (Quema de Judas)", "Calipso in El Callao"],
    foods: ["tequeños", "cachapas", "cerveza Polar", "ron venezolano", "empanadas"],
    greetings: ["¡Feliz Carnaval!", "¡Que viva el Carnaval!"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "Two-day national holiday. El Callao's carnival (Bolívar state) is UNESCO heritage — Afro-Venezuelan calipso music and dance.",
    durationDays: 4,
    location: {
      city: "El Callao",
      region: "Bolívar",
      country: "Venezuela",
      coordinates: { lat: 7.3500, lng: -61.8167 },
      famousVenues: ["Calle Bolívar (main parade)", "Plaza El Callao", "Mining town streets"],
    },
    history: {
      origin: "Founded by Trinidadian, Martinican, and Guadeloupean miners who came for the gold rush in the 1850s. They brought calypso, soca, and Caribbean carnival traditions to the Venezuelan jungle.",
      whyTheyCelebrate: "El Callao celebrates because Carnival is their identity — a unique Afro-Caribbean-Venezuelan fusion found nowhere else. The Madamas (matriarchs) represent the strong women who held communities together during the gold rush.",
      historicalContext: "English and French-speaking Caribbean workers arrived in the 1850s-1900s for gold mining. They maintained their carnival traditions in isolation, creating a unique blend. UNESCO Intangible Cultural Heritage since 2016.",
      yearEstablished: 1853,
      evolution: "Started as Caribbean miners' celebrations in the 1850s. The Madamas tradition (women in colorful dresses and turbans) became iconic. Calypso sung in English/French patois mixed with Spanish. UNESCO recognition in 2016 brought international attention.",
    },
    dances: [
      {
        name: "Calipso de El Callao",
        description: "Dancers follow the comparsas through streets — shuffling feet, swaying hips, arms raised. The Madamas lead with dignified, graceful movements. The Diablos (devils) jump and spin wildly around them.",
        music: "Steel drums (pan), bumbac drums, rallador (scraper), and calypso vocals in a mix of English, French patois, and Spanish",
        attire: "Madamas: elaborate colorful dresses with petticoats, turbans, and gold jewelry. Diablos: black bodysuits with horned masks. Medio Pintos: covered in black grease, chasing people to 'paint' them.",
      },
    ],
    music: ["Calipso de El Callao (traditional)", "Woman del Callao", "Isidora (tribute to famous Madama)"],
    newsStyle: {
      headline: "El Callao's UNESCO Carnival erupts! Madamas lead calypso processions through Venezuela's gold mining town",
      urgency: "happening_now",
    },
  },
  // CUBAN
  {
    id: "carnaval_santiago",
    name: "Carnival of Santiago de Cuba",
    nativeName: "Carnaval de Santiago de Cuba",
    month: 7, day: 20,
    languages: ["es-CU"],
    description: "Cuba's most famous carnival with congas, comparsas, and Afro-Cuban rhythms in the streets",
    vocabulary: ["la conga", "la comparsa", "el son", "la rumba", "el bongó", "la carroza", "el paseo", "la cerveza"],
    traditions: ["Conga lines through the streets", "Comparsa dance troupes compete", "Floats (carrozas) parade", "Live son and rumba music", "Drinking and dancing until dawn"],
    foods: ["lechón asado", "congrí", "yuca con mojo", "cerveza Cristal", "ron Havana Club"],
    greetings: ["¡Arriba el Carnaval!", "¡Que viva Santiago!"],
    relatedLessonCategories: ["vocabulary", "listening", "speaking"],
    culturalSignificance: "Oldest carnival in Cuba (since 17th century). Birthplace of son cubano. African rhythms meet Spanish colonial traditions.",
    durationDays: 10,
    location: {
      city: "Santiago de Cuba",
      region: "Santiago de Cuba Province",
      country: "Cuba",
      coordinates: { lat: 20.0247, lng: -75.8219 },
      famousVenues: ["Calle Heredia", "Paseo de Martí (Trocha)", "Plaza de Marte", "Casa de la Trova"],
    },
    history: {
      origin: "Born from the fusion of Spanish colonial festivals, African Yoruba celebrations, and French-Haitian traditions brought by refugees fleeing the Haitian Revolution (1791-1804). Santiago's unique mix of cultures created Cuba's most African carnival.",
      whyTheyCelebrate: "Santiagueros celebrate because Carnival is resistance — during slavery, it was the only time Africans could publicly drum, dance, and honor their orishas. Today it's about Cuban identity, joy despite hardship, and community.",
      historicalContext: "Santiago received thousands of French-Haitian refugees in the early 1800s, adding tumba francesa traditions. After the Revolution (1959), Castro initially tried to control Carnival but it proved impossible — the people wouldn't give it up.",
      yearEstablished: 1679,
      evolution: "Documented since 1679. Originally tied to patron saint days (Santiago Apóstol, July 25). French-Haitian refugees added comparsas in the 1800s. After 1959, the government formalized it but couldn't tame its African spirit. Today it's Cuba's biggest party — 500,000+ people over 10 days.",
    },
    dances: [
      {
        name: "Conga",
        description: "A massive line of dancers snakes through the streets — everyone joins in. One foot forward, drag the other, hips swing side to side. The line grows as it passes through neighborhoods. You CANNOT resist joining.",
        music: "Massive conga drums (tumbadoras), Chinese cornets (corneta china — a piercing brass instrument), bells, and frying pans beaten with spoons. The rhythm is irresistible.",
        attire: "Colorful matching outfits for each comparsa (dance group). Leaders wear elaborate feathered headdresses. Everyone else wears the group's colors.",
      },
    ],
    music: ["Arrollando (conga anthem)", "Chan Chan (Buena Vista Social Club)", "Guantanamera", "La Conga de Los Hoyos"],
    newsStyle: {
      headline: "Santiago de Cuba erupts! 500,000 dancers join the conga line as Carnival takes over the city for 10 days",
      urgency: "happening_now",
    },
  },
  {
    id: "san_lazaro",
    name: "San Lázaro Pilgrimage",
    nativeName: "Día de San Lázaro",
    month: 12, day: 17,
    languages: ["es-CU"],
    description: "Massive pilgrimage to El Rincón church — devotees crawl, drag themselves, or carry heavy loads to fulfill promises",
    vocabulary: ["San Lázaro", "Babalú Ayé", "la promesa", "el milagro", "la peregrinación", "el santuario", "las muletas", "la oración"],
    traditions: ["Pilgrims crawl on their knees for kilometers", "Drag concrete blocks or carry heavy crosses", "Dress in burlap sacks", "Light candles at the shrine", "Syncretism: San Lázaro = Babalú Ayé in Santería"],
    foods: ["offerings of food and rum", "pan", "agua", "frutas"],
    greetings: ["¡Que San Lázaro te bendiga!", "¡Babalú!"],
    relatedLessonCategories: ["vocabulary", "reading", "speaking"],
    culturalSignificance: "Largest religious gathering in Cuba. Blends Catholicism and Santería (Yoruba religion). San Lázaro/Babalú Ayé is patron of the sick.",
    durationDays: 1,
    location: {
      city: "El Rincón (Santiago de las Vegas)",
      region: "Havana Province",
      country: "Cuba",
      coordinates: { lat: 22.9667, lng: -82.3833 },
      famousVenues: ["Santuario Nacional de San Lázaro (El Rincón)", "Carretera de El Rincón (pilgrimage road)"],
    },
    history: {
      origin: "Syncretic tradition merging Catholic San Lázaro (patron of the sick and poor) with Yoruba orisha Babalú-Ayé (deity of disease and healing). Enslaved Africans identified their gods with Catholic saints to preserve their religion.",
      whyTheyCelebrate: "Cubans celebrate because San Lázaro/Babalú-Ayé represents hope for the sick and suffering. People make promesas (vows) — if healed, they crawl to the sanctuary on their knees, drag themselves with chains, or walk barefoot for kilometers.",
      historicalContext: "Santería (Regla de Ocha) developed when enslaved Yoruba people in Cuba hid their orishas behind Catholic saint images. San Lázaro = Babalú-Ayé became one of the most powerful syncretisms. The tradition survived despite colonial and revolutionary attempts to suppress it.",
      yearEstablished: 1700,
      evolution: "Practiced secretly during slavery. After abolition (1886), it became public. The Castro government initially suppressed religion but couldn't stop the Dec 17 pilgrimage. Today 50,000+ Cubans walk to El Rincón annually — believers and non-believers alike.",
    },
    music: ["Babalú (Miguelito Valdés)", "Canto a Babalú-Ayé (Santería chant)", "Drums for Babalú-Ayé (batá drums)"],
    newsStyle: {
      headline: "Thousands of Cubans begin pilgrimage to El Rincón — crawling on knees to honor San Lázaro/Babalú-Ayé",
      urgency: "this_week",
    },
  },
  // COSTA RICAN
  {
    id: "romeria_cartago",
    name: "Pilgrimage to Cartago",
    nativeName: "Romería a Cartago",
    month: 8, day: 2,
    languages: ["es-CR"],
    description: "Millions walk to the Basílica de Nuestra Señora de los Ángeles to honor La Negrita",
    vocabulary: ["la romería", "La Negrita", "la basílica", "la promesa", "el peregrino", "Cartago", "la fe", "el milagro"],
    traditions: ["Walk from San José to Cartago (22km) overnight", "Some crawl on their knees", "Leave milagritos (tiny metal charms) at the shrine", "Entire country participates"],
    foods: ["agua", "frutas", "gallo pinto", "café", "tamales"],
    greetings: ["¡Que La Negrita te bendiga!", "¡Pura vida!"],
    relatedLessonCategories: ["vocabulary", "speaking", "reading"],
    culturalSignificance: "Costa Rica's most important religious event. 2+ million people walk (half the country's population!). La Negrita is the patron saint.",
    durationDays: 1,
    location: {
      city: "Cartago",
      region: "Cartago Province",
      country: "Costa Rica",
      coordinates: { lat: 9.8644, lng: -83.9194 },
      famousVenues: ["Basílica de Nuestra Señora de los Ángeles", "Route from San José to Cartago (22 km)", "La Negrita shrine"],
    },
    history: {
      origin: "In 1635, a young indigenous girl named Juana Pereira found a small dark stone statue of the Virgin Mary on a rock. She took it home twice, but it miraculously returned to the rock each time. A basilica was built on the spot.",
      whyTheyCelebrate: "Costa Ricans walk to Cartago because La Negrita (the dark Virgin) is their patron saint and protector. The pilgrimage is a promise (promesa) — people walk to ask for miracles, give thanks for healing, or honor a vow made during illness.",
      historicalContext: "The dark-skinned Virgin represented indigenous and mestizo Costa Ricans in a colonial church dominated by European imagery. She became a symbol of Costa Rican identity — humble, miraculous, and accessible to the poor.",
      yearEstablished: 1635,
      evolution: "Started as local devotion in the 1600s. By the 1800s, thousands walked annually. Today 2.5 million+ Costa Ricans (half the country!) make the pilgrimage on August 2. Many walk the full 22km from San José to Cartago through the night. Some crawl on their knees.",
    },
    music: ["Himno a la Virgen de los Ángeles", "Patriótica Costarricense", "Prayers and rosaries chanted while walking"],
    newsStyle: {
      headline: "2.5 million Costa Ricans begin the Romería to Cartago — pilgrims walk through the night to honor La Negrita",
      urgency: "this_week",
    },
  },
  {
    id: "anexion_guanacaste",
    name: "Annexation of Guanacaste",
    nativeName: "Anexión de Guanacaste",
    month: 7, day: 25,
    languages: ["es-CR"],
    description: "Celebrates when Guanacaste province chose to join Costa Rica instead of Nicaragua in 1824",
    vocabulary: ["la anexión", "Guanacaste", "el sabanero", "la marimba", "el punto guanacasteco", "la independencia", "el folclore", "la tradición"],
    traditions: ["Punto guanacasteco dancing", "Marimba music", "Rodeos and topes (horse parades)", "Traditional food festivals", "Bomba poetry (improvised rhymes)"],
    foods: ["arroz de maíz", "rosquillas", "tanelas", "vigorón", "chicha de maíz"],
    greetings: ["¡Feliz Día de Guanacaste!", "¡Pura vida, mae!"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "Celebrates Costa Rican identity and the sabanero (cowboy) culture of Guanacaste. The punto guanacasteco is the national dance.",
    durationDays: 1,
    location: {
      city: "Liberia",
      region: "Guanacaste Province",
      country: "Costa Rica",
      coordinates: { lat: 10.6333, lng: -85.4333 },
      famousVenues: ["Parque Mario Cañas Ruiz (Liberia)", "Plaza de la Anexión", "Haciendas of Guanacaste"],
    },
    history: {
      origin: "On July 25, 1824, the Partido de Nicoya (then part of Nicaragua) voted to annex itself to Costa Rica. The people chose Costa Rica over Nicaragua because of better governance and economic opportunity.",
      whyTheyCelebrate: "Guanacastecos celebrate because they CHOSE to be Costa Rican — it wasn't conquest or colonization. It's a celebration of self-determination and the unique sabanero (cowboy) culture of the Pacific lowlands.",
      historicalContext: "After Central American independence from Spain (1821), the Partido de Nicoya was disputed between Nicaragua and Costa Rica. The local population voted to join Costa Rica. This is the only case in Central American history of a territory choosing its own country.",
      yearEstablished: 1824,
      evolution: "Originally a civic ceremony. Over time, it became a celebration of Guanacasteco identity — the sabanero culture, Chorotega indigenous heritage, and Pacific coast traditions. Today it features rodeos, marimba music, and traditional foods.",
    },
    dances: [
      {
        name: "Punto Guanacasteco",
        description: "Costa Rica's national dance — couples face each other and perform zapateado (foot-stamping) while the woman waves her skirt. It's a courtship dance with playful energy.",
        music: "Marimba (wooden xylophone), guitar, and quijongo (single-string bow instrument unique to Guanacaste)",
        attire: "Women: white blouse with colorful trim, long flowered skirt. Men: white shirt, white pants, leather boots, and a wide-brimmed hat.",
      },
    ],
    music: ["Punto Guanacasteco (national folk song)", "Luna Liberiana", "Pampa (marimba instrumental)", "El Torito"],
    newsStyle: {
      headline: "Guanacaste celebrates 200+ years of choosing Costa Rica! Rodeos, marimba, and sabanero pride fill Liberia",
      urgency: "this_week",
    },
  },
  // ARGENTINE
  {
    id: "dia_tango",
    name: "National Tango Day",
    nativeName: "Día Nacional del Tango",
    month: 12, day: 11,
    languages: ["es-AR"],
    description: "Celebrates tango culture with milongas, concerts, and dancing in the streets of Buenos Aires",
    vocabulary: ["el tango", "la milonga", "el bandoneón", "la pista", "el abrazo", "la caminata", "el compás", "Carlos Gardel"],
    traditions: ["Free milongas (tango dance events) across Buenos Aires", "Concerts in La Boca and San Telmo", "Tango competitions", "Tribute to Carlos Gardel and Julio De Caro (born this day)"],
    foods: ["empanadas", "vino malbec", "choripán", "fernet con coca", "alfajores"],
    greetings: ["¡Feliz Día del Tango!", "¡A bailar, che!"],
    relatedLessonCategories: ["vocabulary", "listening", "speaking"],
    culturalSignificance: "Tango is Argentina's gift to the world — UNESCO Intangible Heritage. Born in Buenos Aires conventillos (tenements) from immigrant cultures mixing.",
    durationDays: 1,
    location: {
      city: "Buenos Aires",
      region: "Ciudad Autónoma de Buenos Aires",
      country: "Argentina",
      coordinates: { lat: -34.6037, lng: -58.3816 },
      famousVenues: ["La Boca neighborhood (Caminito)", "San Telmo milongas", "Café Tortoni", "Esquina Carlos Gardel", "Plaza Dorrego (outdoor milonga)"],
    },
    history: {
      origin: "Tango was born in the 1880s in the conventillos (tenement houses) of Buenos Aires where Italian, Spanish, African, and criollo immigrants lived together. It started in brothels and port neighborhoods — considered vulgar by the upper class.",
      whyTheyCelebrate: "Argentines celebrate because tango IS Buenos Aires — it's the sound of immigration, loneliness, passion, and survival. December 11 is the birthday of both Carlos Gardel (tango's greatest singer) and Julio De Caro (revolutionary tango musician).",
      historicalContext: "Tango was the music of the poor and marginalized. Upper-class Argentines rejected it until Paris embraced it in the 1910s — then suddenly it was 'sophisticated.' This pattern (rejected at home, loved abroad, then reclaimed) defines tango's story.",
      yearEstablished: 1977,
      evolution: "Born in 1880s slums. Rejected by elites. Conquered Paris in 1910s. Golden Age in 1940s (orchestras, dance halls). Nearly died in 1960s-70s (military dictatorship suppressed gatherings). Revived in 1980s. UNESCO Intangible Cultural Heritage since 2009. Today Buenos Aires has 100+ milongas (tango dance halls) every week.",
    },
    dances: [
      {
        name: "Tango de Salón",
        description: "Close embrace, chest to chest. The leader walks, the follower mirrors. Feet interweave in ochos (figure-8s), ganchos (hooks), and boleos (leg flicks). Every movement is improvised — a silent conversation between two bodies.",
        music: "Bandoneón (concertina), violin, piano, and double bass. Orchestras like Di Sarli, Pugliese, D'Arienzo. The music dictates the mood — dramatic pauses, sudden accelerations.",
        attire: "Women: slit skirt or dress, high heels (8-10cm), hair up. Men: suit or dress shirt, polished shoes with leather soles for pivoting. In milongas, the dress code is elegant but not costume-like.",
      },
    ],
    music: ["La Cumparsita (most famous tango)", "Por Una Cabeza (Carlos Gardel)", "Libertango (Astor Piazzolla)", "Volver (Gardel)", "Adiós Nonino (Piazzolla)"],
    newsStyle: {
      headline: "Buenos Aires celebrates Día Nacional del Tango! Milongas open across the city — free outdoor dancing in San Telmo",
      urgency: "happening_now",
    },
  },
  {
    id: "vendimia_mendoza",
    name: "Grape Harvest Festival",
    nativeName: "Fiesta de la Vendimia",
    month: 3, day: 7,
    languages: ["es-AR"],
    description: "Mendoza's famous wine harvest festival with parades, concerts, and the crowning of the Reina de la Vendimia",
    vocabulary: ["la vendimia", "la uva", "el malbec", "la bodega", "la reina", "la cosecha", "el viñedo", "el brindis"],
    traditions: ["Crowning of the Harvest Queen", "Wine tasting at bodegas", "Grape stomping", "Massive outdoor concert", "Fireworks at Teatro Griego Frank Romero Day"],
    foods: ["asado", "empanadas mendocinas", "vino malbec", "dulce de membrillo", "chivito"],
    greetings: ["¡Feliz Vendimia!", "¡Salud!"],
    relatedLessonCategories: ["vocabulary", "reading", "speaking"],
    culturalSignificance: "Argentina is the world's 5th largest wine producer. Mendoza's Malbec is world-famous. The festival celebrates the gaucho and agricultural heritage.",
    durationDays: 5,
    location: {
      city: "Mendoza",
      region: "Mendoza Province",
      country: "Argentina",
      coordinates: { lat: -32.8895, lng: -68.8458 },
      famousVenues: ["Teatro Griego Frank Romero Day (amphitheater)", "Avenida San Martín (parade route)", "Bodega wineries of Maipú and Luján de Cuyo"],
    },
    history: {
      origin: "Started in 1936 to celebrate the grape harvest and Mendoza's wine industry. Italian and Spanish immigrants brought winemaking traditions to the arid Andean foothills, transforming desert into vineyards using Inca-era irrigation channels.",
      whyTheyCelebrate: "Mendocinos celebrate because wine IS their identity — the province produces 70% of Argentina's wine. The Vendimia honors the labor of grape pickers, the ingenuity of irrigation, and the transformation of desert into abundance.",
      historicalContext: "Italian immigrants (especially from Piedmont and Sicily) arrived in the late 1800s and planted Malbec vines that thrived in Mendoza's high-altitude desert climate. They used Huarpe indigenous irrigation systems (acequias) to water the vines.",
      yearEstablished: 1936,
      evolution: "Started as a small harvest festival. By the 1960s, it became Argentina's largest festival with 40,000+ spectators at the amphitheater. The Reina de la Vendimia (Harvest Queen) competition became iconic. Today it's a week-long celebration with concerts, parades, and the Blessing of the Fruits.",
    },
    dances: [
      {
        name: "Zamba",
        description: "Elegant courtship dance — partners circle each other waving white handkerchiefs, never touching. The man kneels, the woman turns away, then finally accepts. Slower and more romantic than cueca.",
        music: "Guitar, bombo legüero (large drum), violin. The rhythm is gentle and flowing — 6/8 time.",
        attire: "Women: long flowing dress (often white or pastel). Men: gaucho outfit — bombachas (baggy pants), leather boots, wide belt with silver coins, and a poncho.",
      },
    ],
    music: ["Zamba de Mi Esperanza", "Luna Tucumana (Atahualpa Yupanqui)", "Cosechero (harvest song)", "Tonada Cuyana (Mendoza folk genre)"],
    newsStyle: {
      headline: "Vendimia explodes in Mendoza! 40,000 gather at the amphitheater as Argentina crowns its Harvest Queen",
      urgency: "happening_now",
    },
  },
  // PERUVIAN
  {
    id: "inti_raymi",
    name: "Festival of the Sun",
    nativeName: "Inti Raymi",
    month: 6, day: 24,
    languages: ["es-PE"],
    description: "Ancient Inca celebration of the sun god at Sacsayhuamán fortress in Cusco",
    vocabulary: ["Inti Raymi", "el sol", "el Inca", "Sacsayhuamán", "la ofrenda", "la chicha", "el cóndor", "Pachamama"],
    traditions: ["Theatrical reenactment of Inca ceremony at Sacsayhuamán", "The Inca (actor) addresses the sun", "Llama sacrifice (symbolic)", "Chicha de jora offerings", "Traditional music and dance"],
    foods: ["chicha de jora", "cuy (guinea pig)", "pachamanca", "tamales", "humitas"],
    greetings: ["¡Feliz Inti Raymi!", "¡Que el Sol te ilumine!"],
    relatedLessonCategories: ["vocabulary", "speaking", "reading"],
    culturalSignificance: "Most important Inca festival, revived in 1944. Celebrates the winter solstice and Inca heritage. Cusco becomes the center of the world for a day.",
    durationDays: 1,
    location: {
      city: "Cusco",
      region: "Cusco Region",
      country: "Peru",
      coordinates: { lat: -13.5170, lng: -71.9785 },
      famousVenues: ["Sacsayhuamán fortress (main ceremony)", "Plaza de Armas (opening)", "Qorikancha (Temple of the Sun)", "Avenida El Sol (procession route)"],
    },
    history: {
      origin: "Ancient Inca ceremony honoring Inti (the Sun God), held on the winter solstice (June 24 in Southern Hemisphere). The Sapa Inca (emperor) led prayers asking the Sun to return and warm the earth for crops.",
      whyTheyCelebrate: "Peruvians celebrate because Inti Raymi connects them to their Inca ancestors — it's a reclaiming of indigenous identity after centuries of colonial suppression. The Sun represents life, harvest, and the continuation of Andean civilization.",
      historicalContext: "The Spanish banned Inti Raymi in 1572 as 'pagan idolatry.' For 400 years it was practiced secretly in remote communities. In 1944, historian Humberto Vidal Unda reconstructed the ceremony based on chronicles by Inca Garcilaso de la Vega. It's been performed annually since.",
      yearEstablished: -1412,
      evolution: "Originally the most important Inca religious ceremony (est. ~1412 AD). Banned by Spanish in 1572. Practiced secretly for 400 years. Revived in 1944 as cultural performance. Today it draws 100,000+ spectators and is Peru's second-largest festival. The ceremony is performed in Quechua.",
    },
    dances: [
      {
        name: "Danza del Inca",
        description: "The actor playing the Sapa Inca performs ritual movements — arms raised to the sun, slow ceremonial steps, offering chicha (corn beer) to the four directions (suyus). Hundreds of dancers in Inca warrior costumes surround him.",
        music: "Pututos (conch shell trumpets), quenas (Andean flutes), tinyas (small drums), and pinkullus (long flutes). The sound echoes off Sacsayhuamán's massive stone walls.",
        attire: "The Inca wears a golden tunic, feathered headdress (mascapaicha), golden earspools, and carries a golden staff. Warriors wear colorful unkus (tunics) representing the four suyus of the empire.",
      },
    ],
    music: ["Himno al Sol (Hymn to the Sun — performed in Quechua)", "El Cóndor Pasa", "Pututo trumpet calls", "Traditional huayno music"],
    newsStyle: {
      headline: "Inti Raymi returns to Sacsayhuamán! 100,000 gather as the Inca honors the Sun God in ancient Quechua ceremony",
      urgency: "happening_now",
    },
  },
  {
    id: "senor_milagros",
    name: "Lord of Miracles",
    nativeName: "Señor de los Milagros",
    month: 10, day: 18,
    languages: ["es-PE"],
    description: "Lima's massive purple-clad procession honoring the Christ of Pachacamilla — largest Catholic procession in the Americas",
    vocabulary: ["el Señor de los Milagros", "el morado", "la procesión", "las andas", "el sahumerio", "la hermandad", "el turrón", "la fe"],
    traditions: ["Wear purple throughout October", "Massive procession through Lima's streets (24+ hours)", "Eat turrón de Doña Pepa", "Pray for miracles", "Bullfighting season at Acho"],
    foods: ["turrón de Doña Pepa", "anticuchos", "picarones", "mazamorra morada", "chicha morada"],
    greetings: ["¡Que el Señor de los Milagros te bendiga!"],
    relatedLessonCategories: ["vocabulary", "reading", "speaking"],
    culturalSignificance: "Largest religious procession in the Americas. The image survived the 1655 earthquake — hence 'Lord of Miracles'. All of Lima wears purple in October.",
    durationDays: 30,
    location: {
      city: "Lima",
      region: "Lima Province",
      country: "Peru",
      coordinates: { lat: -12.0464, lng: -77.0428 },
      famousVenues: ["Iglesia de las Nazarenas (home of the painting)", "Jirón de la Unión (procession route)", "Plaza Mayor de Lima"],
    },
    history: {
      origin: "In 1651, an enslaved Angolan man painted a mural of Christ crucified on an adobe wall in Pachacamilla (Lima's African quarter). In 1655, a massive earthquake destroyed everything — except that wall. The painting survived intact.",
      whyTheyCelebrate: "Limeños celebrate because the Señor de los Milagros (Lord of Miracles) has survived every earthquake since 1655 — Lima is in a major seismic zone. He represents divine protection over a city that lives in constant earthquake threat.",
      historicalContext: "The painting was made by an enslaved African in the poorest quarter of colonial Lima. When it survived the earthquake, the Spanish authorities tried to destroy it (they didn't want Africans having their own devotion). But every attempt failed — workers fell ill or their tools broke. The Church finally accepted it.",
      yearEstablished: 1655,
      evolution: "After the 1655 earthquake, devotion grew. The 1746 earthquake (which destroyed most of Lima) cemented the cult — the wall survived again. The purple habit worn by devotees started in the 1700s. Today the October procession is the largest religious event in the Americas — 1 million+ people over 24 hours.",
    },
    music: ["Himno al Señor de los Milagros", "Canto de las Sahumadoras (incense bearers)", "Peruvian criollo waltzes played during procession"],
    newsStyle: {
      headline: "Lima turns purple! 1 million+ devotees follow the Señor de los Milagros through the streets in the Americas' largest procession",
      urgency: "happening_now",
    },
  },
  // CHILEAN
  {
    id: "fiestas_patrias_cl",
    name: "Chilean Independence Day",
    nativeName: "Fiestas Patrias",
    month: 9, day: 18,
    languages: ["es-CL"],
    description: "Chile's biggest celebration — a week of asados, cueca, empanadas, and chicha in fondas (temporary party venues)",
    vocabulary: ["las Fiestas Patrias", "el dieciocho", "la fonda", "la cueca", "la empanada", "el terremoto", "la chicha", "el huaso"],
    traditions: ["Fondas (outdoor party venues) across the country", "Cueca dancing (national dance)", "Fly kites (volantines)", "Asado with family", "Drink terremotos (earthquake cocktail)"],
    foods: ["empanadas de pino", "asado", "choripán", "mote con huesillo", "terremoto (cocktail)", "chicha"],
    greetings: ["¡Feliz dieciocho!", "¡Viva Chile, mierda!"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "The most important week in Chile. Everyone gets a week off. Fondas are everywhere. The cueca is danced by everyone — even those who can't dance.",
    durationDays: 7,
    location: {
      city: "Santiago & nationwide",
      region: "All regions",
      country: "Chile",
      coordinates: { lat: -33.4489, lng: -70.6693 },
      famousVenues: ["Parque O'Higgins (largest fonda in Santiago)", "Fondas and ramadas (temporary party structures) nationwide", "Plaza de la Constitución"],
    },
    history: {
      origin: "Commemorates September 18, 1810 — the first Junta de Gobierno (governing council) that began Chile's path to independence from Spain. Full independence came in 1818.",
      whyTheyCelebrate: "Chileans celebrate because Fiestas Patrias is THE national party — it's about being Chilean. Cueca dancing, empanadas, red wine, and asados represent the soul of Chile. It's identity, pride, and community all in one week.",
      historicalContext: "Chile's independence movement was led by Bernardo O'Higgins and José de San Martín. The 1810 junta didn't declare independence but began self-governance. The actual independence battle (Maipú) was in 1818. Chileans celebrate the beginning, not the end.",
      yearEstablished: 1810,
      evolution: "Originally a formal civic ceremony. By the 1900s, fondas (temporary party venues) became the tradition. The military government (1973-1990) tried to control celebrations but couldn't stop the cueca. Today it's a full week off work — Chile essentially shuts down for asados, cueca, and chicha.",
    },
    dances: [
      {
        name: "Cueca",
        description: "Chile's national dance — a courtship between rooster and hen. Partners wave white handkerchiefs while circling each other with zapateado (foot-stamping). They never touch. The man pursues, the woman teases and retreats.",
        music: "Guitar, harp, accordion, and tambourine. The singer shouts '¡Aro!' to mark sections. The crowd claps and shouts encouragement.",
        attire: "Women: flowered dress with apron, hair in braids with ribbons. Men: huaso outfit — short bolero jacket, striped poncho (manta), flat-brimmed hat (chupalla), high boots with large spurs.",
      },
    ],
    music: ["La Consentida (most famous cueca)", "Chicha de Curacaví", "Si Vas Para Chile (Chito Faró)", "El Huaso y la Lavandera"],
    newsStyle: {
      headline: "¡Viva Chile! Fiestas Patrias begin — fondas open nationwide with cueca, empanadas, and terremoto cocktails",
      urgency: "happening_now",
    },
  },
  {
    id: "la_tirana",
    name: "Festival of La Tirana",
    nativeName: "Fiesta de La Tirana",
    month: 7, day: 16,
    languages: ["es-CL"],
    description: "Northern Chile's spectacular religious festival with elaborate devil masks and Andean dances",
    vocabulary: ["La Tirana", "la diablada", "la morenada", "el baile religioso", "la Virgen del Carmen", "la máscara", "el traje", "la cofradía"],
    traditions: ["Diablada dance (devil dancers)", "Elaborate costumes costing thousands", "200+ dance groups perform", "Pilgrimage to the tiny town of La Tirana", "3 days of non-stop dancing"],
    foods: ["sopaipillas", "anticuchos", "mote con huesillo", "empanadas", "pisco sour"],
    greetings: ["¡Que la Virgen te acompañe!"],
    relatedLessonCategories: ["vocabulary", "listening", "speaking"],
    culturalSignificance: "Chile's largest religious festival. 200,000+ visitors to a town of 800 people. Blends Andean, Catholic, and Bolivian traditions.",
    durationDays: 3,
    location: {
      city: "La Tirana",
      region: "Tarapacá",
      country: "Chile",
      coordinates: { lat: -20.5500, lng: -69.6500 },
      famousVenues: ["Santuario de La Tirana", "Plaza del pueblo", "Desert streets of La Tirana (population 560, swells to 200,000+)"],
    },
    history: {
      origin: "Legend says an Inca princess ('La Tirana' — the tyrant) fled Spanish conquest and ruled the Atacama Desert. She fell in love with a Portuguese prisoner and converted to Christianity. Her own people killed her for the betrayal. A shrine was built where she died.",
      whyTheyCelebrate: "Northern Chileans celebrate because La Tirana represents the fusion of indigenous Andean spirituality with Catholicism — the Diabladas (devil dances) honor Pachamama while worshipping the Virgin. It's about dual identity — Andean AND Chilean.",
      historicalContext: "The Atacama Desert was Aymara and Quechua territory before becoming Chilean (after the War of the Pacific, 1879-1884). The festival preserves pre-Columbian dance traditions within a Catholic framework — a survival strategy for indigenous culture.",
      yearEstablished: 1540,
      evolution: "Started as a small shrine in the 1500s. Nitrate mining boom (1880s-1930s) brought workers who expanded the festival. After the mines closed, the tradition continued. Today 200,000+ pilgrims descend on a town of 560 people. Over 200 dance groups perform for 7 days.",
    },
    dances: [
      {
        name: "Diablada",
        description: "Dancers in elaborate devil costumes perform acrobatic jumps and spins, representing the battle between good and evil. The Archangel Michael defeats the devils, who submit to the Virgin.",
        music: "Brass bands (bandas de bronces) — tubas, trumpets, trombones — playing morenada and diablada rhythms. The sound echoes across the desert.",
        attire: "Massive devil masks with horns, bulging eyes, and fangs (each hand-carved and painted). Embroidered capes, boots, and breastplates covered in mirrors and sequins. Costumes cost   },,000-5,000 each.",
      },
    ],
    music: ["Diablada (brass band rhythm)", "Morenada", "Caporales", "Tinkus (Andean warrior dance music)"],
    newsStyle: {
      headline: "200,000 pilgrims flood tiny La Tirana! Devil dancers battle angels in Chile's most spectacular Andean festival",
      urgency: "happening_now",
    },
  },
  // PUERTO RICAN
  {
    id: "san_sebastian",
    name: "San Sebastián Street Festival",
    nativeName: "Fiestas de la Calle San Sebastián",
    month: 1, day: 20,
    languages: ["es-PR"],
    description: "Old San Juan's massive street festival with live salsa, bomba, plena, and artisan markets",
    vocabulary: ["la calle", "la bomba", "la plena", "el vejigante", "la máscara", "el artesano", "la salsa", "el coquito"],
    traditions: ["Live music stages throughout Old San Juan", "Bomba and plena dancing in the streets", "Vejigante mask-makers sell their art", "Artisan fair", "Drinking coquito and Medalla beer"],
    foods: ["mofongo", "alcapurrias", "bacalaítos", "piraguas", "coquito", "Medalla Light"],
    greetings: ["¡Wepa!", "¡Que vivan las SanSe!"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "Largest cultural festival in Puerto Rico. Celebrates Boricua identity, Afro-Caribbean heritage, and community. Hundreds of thousands attend.",
    durationDays: 4,
    location: {
      city: "San Juan",
      region: "Old San Juan (Viejo San Juan)",
      country: "Puerto Rico",
      coordinates: { lat: 18.4655, lng: -66.1057 },
      famousVenues: ["Calle San Sebastián", "Plaza del Quinto Centenario", "Calle del Cristo", "Norzagaray Street (overlooking the ocean)"],
    },
    history: {
      origin: "Originally a religious feast day honoring Saint Sebastian (martyred Roman soldier). In the 1970s, residents of San Sebastián Street in Old San Juan turned it into a massive street party to celebrate Puerto Rican culture and resist cultural erasure.",
      whyTheyCelebrate: "Puerto Ricans celebrate because SanSe (as they call it) is about Puerto Rican identity — bomba, plena, artisans, and community. In a colony that's been controlled by Spain and then the US, SanSe is a declaration: 'We are Puerto Rican, and our culture is alive.'",
      historicalContext: "Puerto Rico has been a US territory since 1898. Cultural preservation is political. SanSe emerged during the 1970s Puerto Rican cultural renaissance — artists, musicians, and activists used festivals to assert identity against Americanization.",
      yearEstablished: 1970,
      evolution: "Started as a small neighborhood party on one street in the 1970s. Grew to 200,000+ attendees by the 2000s. Features artisan markets (handmade masks, santos), live bomba and plena, food vendors, and cabezudos (giant papier-mâché heads). Now Puerto Rico's largest street festival.",
    },
    dances: [
      {
        name: "Bomba",
        description: "African-rooted dance where a solo dancer challenges the drummer — the dancer moves, and the primo (lead drum) must follow. It's a conversation between body and drum. Hips, shoulders, and skirt movements dictate the rhythm.",
        music: "Barriles (barrel drums) — the primo follows the dancer, the buleador keeps the base rhythm. Cuá sticks on the side of the barrel. Call-and-response singing.",
        attire: "Women wear wide white skirts with colorful trim and turbans (to honor African ancestors). Men wear white pants and shirts. The skirt is essential — women use it to communicate with the drummer.",
      },
      {
        name: "Plena",
        description: "Group dance — everyone moves together in a line or circle. Simple side-to-side steps with hip movement. It's the 'newspaper of the people' — the lyrics tell stories of current events.",
        music: "Panderetas (hand drums of three sizes: seguidor, segundo, requinto), güiro scraper, and sometimes accordion. The lyrics are the star — they tell stories.",
        attire: "Casual — plena is the people's music. No special costume required. In festivals, matching t-shirts or traditional white.",
      },
    ],
    music: ["Quítate de la Vía Perico (plena classic)", "Bomba para Siempre", "El Bombón de Elena", "Cortaron a Elena (plena)"],
    newsStyle: {
      headline: "¡SanSe explodes in Old San Juan! 200,000+ fill the cobblestone streets for bomba, plena, and Puerto Rican pride",
      urgency: "happening_now",
    },
  },
  {
    id: "noche_san_juan_pr",
    name: "San Juan Night",
    nativeName: "Noche de San Juan",
    month: 6, day: 23,
    languages: ["es-PR"],
    description: "Everyone walks backwards into the ocean at midnight for good luck — Puerto Rico's most unique tradition",
    vocabulary: ["la Noche de San Juan", "el mar", "la playa", "la suerte", "la medianoche", "las olas", "la tradición", "el deseo"],
    traditions: ["Walk backwards into the ocean at midnight", "Fall back into 7 waves for good luck", "Beach bonfires", "Live music on every beach", "Make a wish with each wave"],
    foods: ["piña colada", "mofongo", "empanadillas", "cerveza Medalla", "bacalaítos"],
    greetings: ["¡Feliz Noche de San Juan!", "¡Al agua!"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "Uniquely Puerto Rican tradition. The entire island goes to the beach at midnight. Believed to cleanse bad luck and bring prosperity.",
    durationDays: 1,
    location: {
      city: "San Juan & coastal towns",
      region: "All coastal municipalities",
      country: "Puerto Rico",
      coordinates: { lat: 18.4655, lng: -66.1057 },
      famousVenues: ["Condado Beach", "Isla Verde Beach", "Ocean Park", "All beaches island-wide"],
    },
    history: {
      origin: "European midsummer tradition brought by Spanish colonizers, merged with Taíno water purification rituals. The tradition of falling backward into the ocean at midnight combines Catholic baptism symbolism with indigenous cleansing beliefs.",
      whyTheyCelebrate: "Puerto Ricans celebrate because it's a communal cleansing — at midnight on June 23, everyone walks backward into the ocean to wash away bad luck and start fresh. It's about renewal, community, and the island's relationship with the sea.",
      historicalContext: "The Taíno people already had water purification ceremonies. Spanish colonizers brought the San Juan Bautista (St. John the Baptist) celebration. The two merged naturally on an island where the ocean is never far away.",
      yearEstablished: 1508,
      evolution: "Practiced since Spanish colonization (1508). Originally religious — honoring John the Baptist with water. Over centuries, it became secular and fun — beach parties, bonfires, music. The backward-into-the-ocean tradition is uniquely Puerto Rican. Today it's the island's biggest beach party.",
    },
    music: ["Noche de San Juan (traditional)", "Plena on the beach", "Reggaetón and salsa at beach parties"],
    newsStyle: {
      headline: "Puerto Rico hits the beaches at midnight! Millions walk backward into the ocean for Noche de San Juan cleansing",
      urgency: "happening_now",
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// FRENCH HOLIDAYS
// ═══════════════════════════════════════════════════════════════════════════════

const FRENCH_HOLIDAYS: CulturalHoliday[] = [
  {
    id: "fete_nationale",
    name: "Bastille Day",
    nativeName: "La Fête Nationale",
    month: 7, day: 14,
    languages: ["fr"],
    description: "France's national day celebrating the storming of the Bastille with military parades and fireworks",
    vocabulary: ["la fête nationale", "le 14 juillet", "le défilé militaire", "les feux d'artifice", "la Bastille", "la Révolution", "la liberté", "le bal des pompiers"],
    traditions: ["Military parade on the Champs-Élysées", "Fireworks at the Eiffel Tower", "Bal des pompiers (firefighters' ball)", "Picnics and parties everywhere"],
    foods: ["pique-nique", "fromage", "baguette", "vin rouge", "tarte aux fruits", "champagne"],
    greetings: ["Bonne fête nationale!", "Joyeux 14 juillet!"],
    relatedLessonCategories: ["vocabulary", "speaking", "reading"],
    culturalSignificance: "Celebrates the French Revolution and republican values: Liberté, Égalité, Fraternité. The biggest celebration in France.",
    durationDays: 1,
    location: {
      city: "Paris",
      region: "Île-de-France",
      country: "France",
      coordinates: { lat: 48.8566, lng: 2.3522 },
      famousVenues: ["Champs-Élysées (military parade)", "Eiffel Tower (fireworks)", "Place de la Bastille", "Champ de Mars"],
    },
    history: {
      origin: "Commemorates two events: the Storming of the Bastille (July 14, 1789) — when Parisians attacked the royal prison-fortress, symbolizing the fall of tyranny — and the Fête de la Fédération (July 14, 1790) celebrating national unity.",
      whyTheyCelebrate: "The French celebrate because July 14 represents the birth of modern democracy — ordinary people overthrowing absolute monarchy. It's about liberté, égalité, fraternité — the idea that power belongs to the people, not kings.",
      historicalContext: "In 1789, France was bankrupt, the people starving, and King Louis XVI indifferent. The Bastille was a symbol of royal tyranny (it held political prisoners). When it fell, it proved the people could defeat the monarchy. This inspired revolutions worldwide.",
      yearEstablished: 1880,
      evolution: "The Bastille fell in 1789 but July 14 wasn't an official holiday until 1880 (Third Republic). The military parade on the Champs-Élysées started in 1880. The Eiffel Tower fireworks became tradition in the 20th century. Today it's France's biggest celebration — every town has fireworks and a bal des pompiers (firefighters' ball).",
    },
    dances: [
      {
        name: "Bal des Pompiers",
        description: "Firefighters open their stations as dance halls on July 13-14. Everyone dances — waltz, swing, disco, whatever the DJ plays. It's democratic, chaotic, and joyful. The pompiers (firefighters) are France's most trusted institution.",
        music: "Everything — accordion musette, pop, disco, electronic. Each fire station has its own DJ or band.",
        attire: "Casual — this is a people's party. Some firefighters dance in uniform. Revelers wear red-white-blue.",
      },
    ],
    music: ["La Marseillaise (national anthem)", "Sous le Ciel de Paris (Edith Piaf)", "Aux Champs-Élysées (Joe Dassin)", "Ça Ira (revolutionary song)"],
    newsStyle: {
      headline: "La France fête le 14 Juillet! Military parade on the Champs-Élysées, Eiffel Tower fireworks tonight",
      urgency: "happening_now",
    },
  },
  {
    id: "chandeleur",
    name: "Candlemas / Crêpe Day",
    nativeName: "La Chandeleur",
    month: 2, day: 2,
    languages: ["fr"],
    description: "French tradition of making crêpes — flip one while holding a coin for good luck!",
    vocabulary: ["la crêpe", "la crêpière", "la pâte", "le sucre", "le citron", "le Nutella", "la poêle", "faire sauter"],
    traditions: ["Make crêpes at home with family", "Flip a crêpe while holding a gold coin in the other hand for prosperity", "If you catch it, you'll have good luck all year"],
    foods: ["crêpes au sucre", "crêpes au Nutella", "crêpes au citron", "galettes de sarrasin", "cidre"],
    greetings: ["Bonne Chandeleur!", "À vos crêpes!"],
    relatedLessonCategories: ["vocabulary", "reading", "speaking"],
    culturalSignificance: "Originally a religious holiday, now a beloved food tradition. Every French person knows how to make crêpes — it's a national skill!",
    durationDays: 1,
    location: {
      city: "Nationwide",
      region: "All regions",
      country: "France",
      famousVenues: ["Every French kitchen", "Crêperies of Brittany", "Parisian cafés"],
    },
    history: {
      origin: "Originally a pagan celebration of light returning after winter (Candlemas). The Catholic Church adopted it as the Presentation of Jesus at the Temple (40 days after Christmas). The round, golden crêpe symbolizes the sun and the return of light.",
      whyTheyCelebrate: "The French celebrate because making crêpes together is a ritual of hope — the round golden crêpe represents the sun returning after dark winter. The tradition says: flip a crêpe while holding a coin in your other hand, and you'll have prosperity all year.",
      historicalContext: "Pope Gelasius I (5th century) reportedly gave crêpes to pilgrims arriving in Rome for Candlemas. The tradition spread through France. The superstition about flipping crêpes with a coin dates to medieval times.",
      yearEstablished: 472,
      evolution: "Ancient pagan light festival → Catholic Candlemas → French crêpe tradition. The religious meaning has largely faded; today it's simply 'crêpe day.' Every French family makes crêpes on February 2. Crêperies in Brittany do record business.",
    },
    music: ["Traditional Breton music (bombarde and biniou)", "French café accordion music"],
    newsStyle: {
      headline: "C'est la Chandeleur! All of France makes crêpes tonight — flip yours with a coin for good luck all year",
      urgency: "happening_now",
    },
  },
  {
    id: "fete_musique",
    name: "Music Festival",
    nativeName: "La Fête de la Musique",
    month: 6, day: 21,
    languages: ["fr"],
    description: "Free music everywhere — anyone can perform in the streets on the longest day of the year",
    vocabulary: ["la musique", "le concert", "la scène", "le musicien", "la chanson", "jouer", "chanter", "danser", "la rue"],
    traditions: ["Free concerts on every street corner", "Amateur and professional musicians play everywhere", "Bars and cafés host live music", "People dance in the streets until dawn"],
    foods: ["vin", "bière", "sandwich", "crêpes", "barbe à papa"],
    greetings: ["Bonne Fête de la Musique!", "Faites de la musique!"],
    relatedLessonCategories: ["vocabulary", "listening", "speaking"],
    culturalSignificance: "Created in France in 1982, now celebrated in 120 countries. Embodies the French love of culture, art, and joie de vivre. The summer solstice becomes a giant party.",
    durationDays: 1,
    location: {
      city: "Paris & nationwide",
      region: "All regions + 120 countries worldwide",
      country: "France",
      coordinates: { lat: 48.8566, lng: 2.3522 },
      famousVenues: ["Every street corner in Paris", "Place de la République", "Jardin du Luxembourg", "Montmartre steps"],
    },
    history: {
      origin: "Created in 1982 by French Minister of Culture Jack Lang and composer Maurice Fleuret. The idea: on the summer solstice (longest day), ALL musicians — amateur and professional — play free concerts everywhere. Music belongs to everyone.",
      whyTheyCelebrate: "The French celebrate because la Fête de la Musique democratizes music — you don't need a concert ticket or fancy venue. A teenager with a guitar has the same right to play as a symphony orchestra. Music is a public good, not a commodity.",
      historicalContext: "In 1982, a survey found that 5 million French people played instruments but rarely performed publicly. Jack Lang's vision: 'Faites de la musique!' (Make music!) — a play on words with 'Fête de la Musique' (Music Festival). It worked beyond anyone's expectations.",
      yearEstablished: 1982,
      evolution: "Started in France in 1982 with a few thousand musicians. By 1985, it spread to Europe. Today it's celebrated in 120+ countries on June 21. In Paris alone, 18,000+ concerts happen in one night. Every genre, every corner, every person can participate.",
    },
    music: ["Everything — jazz, classical, rock, hip-hop, electronic, world music", "The point is ALL music, not one genre"],
    newsStyle: {
      headline: "Fête de la Musique tonight! 18,000+ free concerts across Paris — every street corner becomes a stage",
      urgency: "happening_now",
    },
  },
  {
    id: "noel_francais",
    name: "French Christmas",
    nativeName: "Noël",
    month: 12, day: 25,
    languages: ["fr"],
    description: "Le Réveillon — the elaborate Christmas Eve dinner is the centerpiece of French Christmas",
    vocabulary: ["le Réveillon", "le sapin de Noël", "le Père Noël", "la bûche de Noël", "les cadeaux", "le marché de Noël", "la crèche", "les huîtres"],
    traditions: ["Le Réveillon (Christmas Eve dinner — the main event, not Christmas Day)", "13 desserts in Provence", "Midnight Mass", "Marchés de Noël (Christmas markets)"],
    foods: ["foie gras", "huîtres", "saumon fumé", "dinde aux marrons", "bûche de Noël", "champagne", "les 13 desserts provençaux"],
    greetings: ["Joyeux Noël!", "Bonnes fêtes de fin d'année!"],
    relatedLessonCategories: ["vocabulary", "speaking", "writing"],
    culturalSignificance: "French Christmas is about food and family. The Réveillon dinner can last 4-5 hours with multiple courses. The bûche de Noël (Yule log cake) is mandatory.",
    durationDays: 2,
    location: {
      city: "Strasbourg & nationwide",
      region: "Alsace (Christmas capital) & all regions",
      country: "France",
      coordinates: { lat: 48.5734, lng: 7.7521 },
      famousVenues: ["Marché de Noël de Strasbourg (oldest in France, since 1570)", "Cathédrale Notre-Dame de Strasbourg", "Galeries Lafayette (Paris)", "Champs-Élysées Christmas lights"],
    },
    history: {
      origin: "French Christmas blends Germanic traditions (Christmas trees from Alsace, 1521), Catholic midnight mass, and the uniquely French réveillon — an elaborate feast eaten AFTER midnight mass on Christmas Eve.",
      whyTheyCelebrate: "The French celebrate because Noël is about gastronomy, family, and tradition. The réveillon dinner (foie gras, oysters, bûche de Noël) is the centerpiece — not gifts. It's a celebration of French culinary art and togetherness.",
      historicalContext: "France was historically Catholic, so Christmas was primarily religious (midnight mass). The Revolution (1789) briefly banned it. Napoleon restored it. The Christmas tree came from Alsace (Germanic tradition) and spread to all of France in the 1800s. Père Noël (Santa) became popular after WWII (American influence).",
      yearEstablished: 1521,
      evolution: "Medieval religious feast → Alsatian Christmas tree tradition (1521) → Réveillon dinner tradition (18th century) → Père Noël added (post-WWII) → Marchés de Noël (Christmas markets) boom (1990s-present). Today French Christmas is defined by food: foie gras, champagne, oysters, and bûche de Noël.",
    },
    music: ["Petit Papa Noël (Tino Rossi — France's #1 Christmas song)", "Mon Beau Sapin (O Christmas Tree)", "Douce Nuit (Silent Night)", "Il Est Né le Divin Enfant"],
    newsStyle: {
      headline: "Strasbourg's Marché de Noël opens! France's Christmas capital lights up as réveillon preparations begin nationwide",
      urgency: "this_week",
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// JAPANESE HOLIDAYS
// ═══════════════════════════════════════════════════════════════════════════════

const JAPANESE_HOLIDAYS: CulturalHoliday[] = [
  {
    id: "oshogatsu",
    name: "New Year",
    nativeName: "お正月",
    pronunciation: "Oshōgatsu",
    month: 1, day: 1,
    languages: ["ja"],
    description: "Japan's most important holiday — family gatherings, shrine visits, and special foods for 3 days",
    vocabulary: ["お正月", "初詣", "おせち料理", "お年玉", "年賀状", "門松", "しめ縄", "鏡餅"],
    traditions: ["初詣 (hatsumōde) — first shrine visit of the year", "Eat おせち料理 (osechi ryōri) — special New Year foods", "Give お年玉 (otoshidama) — money in envelopes to children", "Send 年賀状 (nengajō) — New Year postcards", "Watch 紅白歌合戦 (Kōhaku) on TV"],
    foods: ["おせち料理", "お雑煮 (ozōni — mochi soup)", "年越しそば (toshikoshi soba — New Year's Eve noodles)", "お餅 (mochi)"],
    greetings: ["明けましておめでとうございます!", "今年もよろしくお願いします"],
    relatedLessonCategories: ["vocabulary", "speaking", "writing"],
    culturalSignificance: "The most important holiday in Japan. Everything shuts down for 3 days. It's about family, gratitude, and fresh starts. Each food in osechi has symbolic meaning.",
    durationDays: 3,
    location: {
      city: "Nationwide (especially Tokyo & Kyoto)",
      region: "All prefectures",
      country: "Japan",
      coordinates: { lat: 35.6762, lng: 139.6503 },
      famousVenues: ["Meiji Shrine (Tokyo — 3 million visitors)", "Sensō-ji (Asakusa)", "Fushimi Inari (Kyoto)", "Ise Grand Shrine"],
    },
    history: {
      origin: "Japan's most important holiday — welcoming the Toshigami (Year God) who brings good fortune for the new year. Originally based on the lunar calendar; switched to January 1 during the Meiji era (1873) to align with the Western calendar.",
      whyTheyCelebrate: "Japanese celebrate because Oshōgatsu is about renewal — cleaning the house (ōsōji), settling debts, and starting fresh. The Toshigami visits homes decorated with kadomatsu (pine/bamboo) and shimenawa (sacred rope). It's spiritual housekeeping for the soul.",
      historicalContext: "Shinto belief holds that gods visit the human world at New Year. The elaborate preparations (cleaning, cooking osechi-ryōri, decorating) are all to welcome the Toshigami properly. Buddhist temples ring their bells 108 times (joya no kane) to cleanse 108 human sins.",
      yearEstablished: -500,
      evolution: "Ancient Shinto harvest festival → Imperial court ceremony → Common people's celebration (Edo period) → Westernized date (1873) → Modern 3-day holiday. Today it's Japan's only true vacation — the entire country shuts down Dec 29-Jan 3. Bullet trains are packed with people going home.",
    },
    music: ["Joya no Kane (108 temple bells at midnight)", "Haru no Umi (koto New Year music)", "Oshōgatsu (children's New Year song)", "NHK Kōhaku Uta Gassen (New Year's Eve music show)"],
    newsStyle: {
      headline: "明けましておめでとう! Japan welcomes the New Year — 3 million visit Meiji Shrine as temple bells ring 108 times",
      urgency: "happening_now",
    },
  },
  {
    id: "obon",
    name: "Obon Festival",
    nativeName: "お盆",
    pronunciation: "Obon",
    month: 8, day: 13,
    languages: ["ja"],
    description: "Buddhist festival honoring ancestors — spirits return home, families reunite",
    vocabulary: ["お盆", "盆踊り", "精霊馬", "迎え火", "送り火", "灯籠流し", "墓参り", "ご先祖様"],
    traditions: ["盆踊り (bon odori) — traditional dance at festivals", "Light 迎え火 (mukaebi) to guide spirits home", "Light 送り火 (okuribi) to send spirits back", "灯籠流し (tōrō nagashi) — floating lanterns on rivers", "Visit family graves (墓参り)"],
    foods: ["そうめん (sōmen — cold noodles)", "おはぎ (ohagi — rice balls with sweet bean paste)", "精進料理 (shōjin ryōri — Buddhist vegetarian food)"],
    greetings: ["お盆休みはいかがお過ごしですか?"],
    relatedLessonCategories: ["vocabulary", "reading", "speaking"],
    culturalSignificance: "One of Japan's three major holiday seasons. Millions travel home (Uターンラッシュ). Combines Buddhist beliefs with ancestor worship. The dead are welcomed back with joy, not fear.",
    durationDays: 4,
    location: {
      city: "Nationwide (especially Kyoto & rural areas)",
      region: "All prefectures",
      country: "Japan",
      coordinates: { lat: 35.0116, lng: 135.7681 },
      famousVenues: ["Gozan no Okuribi (Kyoto — five mountain bonfires)", "Awa Odori (Tokushima)", "Tōrō Nagashi (floating lanterns) at rivers nationwide"],
    },
    history: {
      origin: "Buddhist festival honoring ancestors' spirits who return to the living world for 3 days. Based on the Ullambana Sutra — the story of Buddha's disciple Mokuren who rescued his mother's spirit from the Realm of Hungry Ghosts through offerings and dance.",
      whyTheyCelebrate: "Japanese celebrate because Obon is about gratitude to ancestors — without them, you wouldn't exist. The spirits return home, and families welcome them with food, incense, and dance. It's joyful, not mournful — a reunion with the dead.",
      historicalContext: "Introduced from China in the 7th century. Originally an aristocratic Buddhist ceremony. By the Edo period (1600s), it became a common people's festival with Bon Odori dancing. Today it's Japan's second-largest holiday after New Year — the entire country takes vacation to return to ancestral homes.",
      yearEstablished: 606,
      evolution: "7th century Buddhist import → aristocratic ceremony → common festival with dancing (Edo period) → modern 3-day vacation. The Bon Odori dance was added in the Kamakura period (1185-1333). Tōrō Nagashi (floating lanterns to guide spirits back) became widespread in the Edo period.",
    },
    dances: [
      {
        name: "Bon Odori",
        description: "Community circle dance around a raised platform (yagura). Everyone dances the same simple steps — forward, back, clap, turn. Each region has its own variation. The movements represent welcoming and sending off ancestral spirits.",
        music: "Taiko drums, fue (flute), shamisen, and folk songs specific to each region. The Awa Odori (Tokushima) uses shamisen, kane (bell), and taiko with the chant 'Yatto-sa!'",
        attire: "Yukata (light cotton kimono) in summer patterns — often indigo with white designs. Geta (wooden sandals). Women may wear flowers in their hair. Dancers at Awa Odori wear amigasa (woven hats) that hide their faces.",
      },
    ],
    music: ["Tankō Bushi (Coal Miners' Song — most common Bon Odori)", "Awa Yoshikono (Awa Odori theme)", "Sōran Bushi (Hokkaido folk song)", "Tokyo Ondo"],
    newsStyle: {
      headline: "お盆 begins! Spirits return as Kyoto's mountains burn and floating lanterns light rivers across Japan",
      urgency: "happening_now",
    },
  },
  {
    id: "hanami",
    name: "Cherry Blossom Viewing",
    nativeName: "花見",
    pronunciation: "Hanami",
    month: 3, day: 25,
    languages: ["ja"],
    description: "The beloved tradition of picnicking under cherry blossoms — a celebration of beauty and impermanence",
    vocabulary: ["花見", "桜", "満開", "花吹雪", "お花見弁当", "場所取り", "宴会", "一期一会"],
    traditions: ["Picnic under cherry trees with friends/coworkers", "場所取り (basho-tori) — saving spots early in the morning", "Drink sake and eat bento under the blossoms", "Night viewing (夜桜 yozakura) with lanterns", "Cherry blossom forecast on TV (桜前線)"],
    foods: ["お花見弁当", "桜餅 (sakura mochi)", "団子 (dango)", "日本酒", "ビール"],
    greetings: ["お花見しましょう!", "桜がきれいですね!"],
    relatedLessonCategories: ["vocabulary", "speaking", "writing"],
    culturalSignificance: "Embodies mono no aware (物の哀れ) — the bittersweet beauty of impermanence. Cherry blossoms last only 1-2 weeks, making them more precious. A deeply Japanese aesthetic.",
    durationDays: 14,
    location: {
      city: "Tokyo, Kyoto, Osaka & nationwide",
      region: "All prefectures (cherry blossoms bloom south to north, March-May)",
      country: "Japan",
      coordinates: { lat: 35.6762, lng: 139.6503 },
      famousVenues: ["Ueno Park (Tokyo)", "Shinjuku Gyoen (Tokyo)", "Philosopher's Path (Kyoto)", "Yoshino Mountain (Nara — 30,000 cherry trees)", "Meguro River (Tokyo)"],
    },
    history: {
      origin: "Hanami (flower viewing) began in the Nara period (710-794) when aristocrats admired plum blossoms (ume). By the Heian period (794-1185), cherry blossoms (sakura) became preferred. The practice spread to commoners in the Edo period (1600s).",
      whyTheyCelebrate: "Japanese celebrate because sakura embodies mono no aware (物の哀れ) — the bittersweet awareness that beautiful things are fleeting. The blossoms last only 1-2 weeks, reminding us to appreciate the present moment. It's philosophy through nature.",
      historicalContext: "In samurai culture, the cherry blossom represented the warrior's life — brilliant but brief. Falling petals symbolized dying young in battle. Today the meaning has softened to appreciation of transience and the beauty of impermanence.",
      yearEstablished: 710,
      evolution: "Aristocratic plum viewing (Nara period) → cherry blossom preference (Heian period) → samurai symbolism (Kamakura/Muromachi) → commoner picnics under trees (Edo period) → modern corporate/friend hanami parties. Today the Japan Meteorological Agency issues a 'cherry blossom forecast' (桜前線) tracking the bloom from south to north.",
    },
    music: ["Sakura Sakura (traditional folk song)", "Haru ga Kita (Spring Has Come)", "Hana (Takamura Kōtarō poem set to music)"],
    newsStyle: {
      headline: "桜前線 arrives in Tokyo! Cherry blossoms reach full bloom — millions gather under the trees for hanami",
      urgency: "happening_now",
    },
  },
  {
    id: "tanabata",
    name: "Star Festival",
    nativeName: "七夕",
    pronunciation: "Tanabata",
    month: 7, day: 7,
    languages: ["ja"],
    description: "The Star Festival — write wishes on paper strips and hang them on bamboo",
    vocabulary: ["七夕", "短冊", "笹", "織姫", "彦星", "天の川", "願い事", "飾り"],
    traditions: ["Write wishes on 短冊 (tanzaku) paper strips", "Hang tanzaku on bamboo branches (笹)", "Decorate streets with colorful streamers", "The legend of Orihime and Hikoboshi — star-crossed lovers who meet once a year"],
    foods: ["そうめん (sōmen — representing the Milky Way)", "星形のお菓子 (star-shaped sweets)"],
    greetings: ["七夕おめでとう!", "願い事は何ですか?"],
    relatedLessonCategories: ["vocabulary", "writing", "reading"],
    culturalSignificance: "Based on a Chinese legend. Orihime (Vega) and Hikoboshi (Altair) are lovers separated by the Milky Way, allowed to meet only on July 7th. Children write wishes hoping they'll come true.",
    durationDays: 1,
    location: {
      city: "Sendai (largest) & nationwide",
      region: "Miyagi Prefecture (Sendai) & all prefectures",
      country: "Japan",
      coordinates: { lat: 38.2682, lng: 140.8694 },
      famousVenues: ["Sendai Tanabata Festival (3 million visitors)", "Shōtengai (shopping arcades) decorated with streamers", "Hiratsuka Tanabata (Kanagawa)"],
    },
    history: {
      origin: "Based on the Chinese legend of Qixi — the Weaver Princess (Orihime/Vega star) and the Cowherd (Hikoboshi/Altair star) are lovers separated by the Milky Way, allowed to meet only once a year on the 7th day of the 7th month.",
      whyTheyCelebrate: "Japanese celebrate because Tanabata is about wishes and longing. People write wishes on tanzaku (colored paper strips) and hang them on bamboo. The story of star-crossed lovers meeting once a year resonates with the Japanese appreciation of longing (恋しい).",
      historicalContext: "Imported from China during the Nara period (710-794). Originally an aristocratic poetry festival. In the Edo period, it became a commoner's wish-making festival. Sendai's elaborate celebration was started by feudal lord Date Masamune in the 1600s.",
      yearEstablished: 755,
      evolution: "Chinese Qixi import (Nara period) → aristocratic poetry contest → commoner wish-making (Edo period) → Sendai's elaborate festival (1600s) → modern nationwide celebration. Today children write wishes on tanzaku, and cities compete for the most elaborate bamboo decorations.",
    },
    music: ["Tanabata-sama (children's song — 'Sasa no ha sara-sara')", "Traditional fue (flute) and taiko at festivals"],
    newsStyle: {
      headline: "七夕 tonight! Write your wish on tanzaku — Sendai's 3-million-visitor Tanabata Festival opens with giant streamers",
      urgency: "happening_now",
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// KOREAN HOLIDAYS
// ═══════════════════════════════════════════════════════════════════════════════

const KOREAN_HOLIDAYS: CulturalHoliday[] = [
  {
    id: "seollal",
    name: "Lunar New Year",
    nativeName: "설날",
    pronunciation: "Seollal",
    month: 1, day: 29, isLunar: true,
    languages: ["ko"],
    description: "Korea's biggest holiday — family reunions, 세배 (deep bow), and 떡국 (rice cake soup)",
    vocabulary: ["설날", "세배", "떡국", "한복", "윷놀이", "세뱃돈", "차례", "덕담"],
    traditions: ["세배 (sebae) — deep bow to elders for blessings and money", "Wear 한복 (hanbok) — traditional clothing", "Play 윷놀이 (yutnori) — traditional board game", "차례 (charye) — ancestral rites", "Eat 떡국 — you age one year!"],
    foods: ["떡국 (tteokguk — rice cake soup)", "만두 (mandu — dumplings)", "잡채 (japchae)", "전 (jeon — savory pancakes)", "식혜 (sikhye — sweet rice drink)"],
    greetings: ["새해 복 많이 받으세요!", "건강하세요!"],
    relatedLessonCategories: ["vocabulary", "speaking", "writing"],
    culturalSignificance: "The most important Korean holiday. Everyone travels to their hometown (고향). Massive traffic jams. You officially age one year when you eat 떡국. Elders give 세뱃돈 (money) to children who bow.",
    durationDays: 3,
    location: {
      city: "Nationwide (family homes)",
      region: "All provinces",
      country: "South Korea",
      coordinates: { lat: 37.5665, lng: 126.9780 },
      famousVenues: ["Korean Folk Village (Yongin)", "Gyeongbokgung Palace (Seoul — traditional games)", "Namsangol Hanok Village (Seoul)", "Every Korean family's home"],
    },
    history: {
      origin: "Korean Lunar New Year — one of the oldest continuously celebrated holidays in East Asia. Rooted in ancient Korean shamanism and ancestor worship, later influenced by Chinese Confucian filial piety traditions.",
      whyTheyCelebrate: "Koreans celebrate because Seollal is about family hierarchy and respect — you perform sebae (deep bow) to elders, who give wisdom and money (세뱃돈). It reinforces the Confucian values that structure Korean society: respect for elders, family duty, and gratitude.",
      historicalContext: "During Japanese occupation (1910-1945), Seollal was suppressed — Koreans were forced to celebrate Japanese New Year (Jan 1) instead. After liberation, Seollal was restored but wasn't an official holiday until 1985. Full 3-day holiday since 1989.",
      yearEstablished: -57,
      evolution: "Ancient Korean shamanic new year ritual → Confucian family ceremony (Joseon dynasty) → suppressed under Japanese occupation → restored 1945 → official holiday 1985 → 3-day holiday 1989. Today it causes the world's largest annual migration — 50 million Koreans travel home in 3 days.",
    },
    dances: [
      {
        name: "Ganggangsullae",
        description: "Women hold hands in a large circle under the full moon, singing and dancing in a chain. The pace starts slow and builds to fast spinning. Originally performed to trick Japanese invaders into thinking there were more soldiers.",
        music: "Call-and-response singing — a leader sings a line, the circle responds 'Ganggangsullae!' The only instrument is voices and clapping.",
        attire: "Hanbok (traditional Korean dress) — women wear jeogori (jacket) and chima (skirt) in bright colors. Hair in traditional binyeo (hairpin) style.",
      },
    ],
    music: ["Arirang (Korea's most famous folk song)", "Ganggangsullae (circle dance song)", "Saemaeul Norae (New Village Song)"],
    newsStyle: {
      headline: "새해 복 많이 받으세요! 50 million Koreans head home for Seollal — highways packed as families reunite for sebae",
      urgency: "happening_now",
    },
  },
  {
    id: "chuseok",
    name: "Korean Thanksgiving",
    nativeName: "추석",
    pronunciation: "Chuseok",
    month: 9, day: 17, isLunar: true,
    languages: ["ko"],
    description: "Harvest festival — visit ancestors' graves, make 송편, and celebrate the full moon",
    vocabulary: ["추석", "송편", "성묘", "벌초", "보름달", "강강술래", "차례", "한가위"],
    traditions: ["성묘 (seongmyo) — visit and clean ancestors' graves", "Make 송편 (songpyeon) — half-moon rice cakes", "차례 (charye) — ancestral memorial rites", "Watch the full moon (보름달)", "강강술래 (ganggangsullae) — traditional circle dance"],
    foods: ["송편 (songpyeon)", "토란탕 (taro soup)", "잡채", "전", "배 (Korean pear)", "약과 (yakgwa — honey cookies)"],
    greetings: ["즐거운 추석 보내세요!", "풍성한 한가위 되세요!"],
    relatedLessonCategories: ["vocabulary", "speaking", "reading"],
    culturalSignificance: "Second biggest holiday after 설날. Celebrates the harvest and gives thanks to ancestors. The saying: '더도 말고 덜도 말고 한가위만 같아라' (Don't wish for more or less, just let it be like Chuseok).",
    durationDays: 3,
    location: {
      city: "Nationwide (family homes & ancestral graves)",
      region: "All provinces",
      country: "South Korea",
      coordinates: { lat: 37.5665, lng: 126.9780 },
      famousVenues: ["Ancestral burial mounds (nationwide)", "Korean Folk Village (Yongin)", "Gyeongbokgung Palace (Seoul)", "Namsan Tower (full moon viewing)"],
    },
    history: {
      origin: "Korean harvest moon festival — giving thanks for the autumn harvest. Dates back to the Silla Kingdom (57 BC - 935 AD) when King Yuri held a month-long weaving contest between two teams of women, ending with a feast under the full moon.",
      whyTheyCelebrate: "Koreans celebrate because Chuseok is gratitude — thanking ancestors for the harvest and honoring the dead who made your life possible. You visit ancestral graves (seongmyo), clean them, and offer fresh harvest food. It's about remembering where you came from.",
      historicalContext: "Korea was historically agricultural — the autumn harvest determined survival through winter. Chuseok marked the moment of abundance after months of labor. The Confucian ancestor worship (charye ceremony) was added during the Joseon dynasty (1392-1897).",
      yearEstablished: -57,
      evolution: "Silla kingdom harvest festival → Goryeo dynasty moon-viewing → Joseon dynasty Confucian ancestor rites → modern 3-day holiday. Today it's Korea's Thanksgiving — families make songpyeon (rice cakes) together, visit graves, and watch the full moon. Like Seollal, it causes massive national migration.",
    },
    dances: [
      {
        name: "Ganggangsullae",
        description: "Same circle dance as Seollal but performed under the full harvest moon — women dance in a chain, spinning faster and faster as the moon rises higher. UNESCO Intangible Cultural Heritage.",
        music: "Call-and-response singing under the full moon. The rhythm accelerates as the dance progresses.",
        attire: "Hanbok in autumn colors — deep reds, golds, and greens. The full moon illuminates the white jeogori jackets.",
      },
    ],
    music: ["Arirang", "Ganggangsullae", "Chuseok folk songs", "Traditional gayageum (zither) music"],
    newsStyle: {
      headline: "추석 begins! Families reunite to make songpyeon and honor ancestors under the harvest moon",
      urgency: "happening_now",
    },
  },
  {
    id: "pepero_day",
    name: "Pepero Day",
    nativeName: "빼빼로 데이",
    pronunciation: "Ppeppero Day",
    month: 11, day: 11,
    languages: ["ko"],
    description: "Korean Valentine's-style day where people exchange Pepero (stick snacks) — 11/11 looks like Pepero sticks!",
    vocabulary: ["빼빼로", "초콜릿", "선물", "사랑", "우정", "데이", "과자", "포장"],
    traditions: ["Exchange Pepero sticks with friends, family, and romantic interests", "Make handmade Pepero dipped in chocolate", "Stores display elaborate Pepero gift sets", "Similar to Valentine's Day but for everyone"],
    foods: ["빼빼로 (Pepero sticks)", "초콜릿 빼빼로", "딸기 빼빼로", "아몬드 빼빼로"],
    greetings: ["해피 빼빼로 데이!", "빼빼로 줄까?"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "A uniquely Korean commercial holiday (started by Lotte in 1994). Shows how Korean pop culture creates new traditions. Korea has a 'day' for everything — Black Day (April 14) for singles who eat 짜장면!",
    durationDays: 1,
    location: {
      city: "Seoul & nationwide",
      region: "All provinces",
      country: "South Korea",
      coordinates: { lat: 37.5665, lng: 126.9780 },
      famousVenues: ["Convenience stores (GS25, CU, 7-Eleven)", "Schools and offices nationwide", "Myeongdong shopping district"],
    },
    history: {
      origin: "Started in the 1990s among Korean middle school students who exchanged Pepero sticks (thin chocolate-covered biscuits) on 11/11 because the date looks like four Pepero sticks (1111). Lotte (the manufacturer) commercialized it.",
      whyTheyCelebrate: "Koreans celebrate because Pepero Day is about affection — giving Pepero to friends, crushes, and coworkers. It's lighter than Valentine's Day — you can give to anyone without romantic pressure. It's become Korea's version of a fun, low-stakes affection day.",
      historicalContext: "South Korea has a 'day' for every month (Valentine's, White Day, Black Day, Rose Day, etc.). Pepero Day emerged organically from youth culture in the 1990s. Lotte's marketing amplified it, but it started as a genuine grassroots tradition.",
      yearEstablished: 1994,
      evolution: "1990s student tradition → Lotte marketing campaign (1997) → national phenomenon. Today Pepero sales spike 50% in November. People make DIY Pepero with custom decorations. Some criticize it as corporate-manufactured, but it's genuinely beloved by young Koreans.",
    },
    music: ["K-pop love songs dominate radio on 11/11", "Pepero Day commercial jingles"],
    newsStyle: {
      headline: "빼빼로데이! Convenience stores overflow with Pepero as Koreans exchange chocolate sticks on 11/11",
      urgency: "happening_now",
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ITALIAN HOLIDAYS
// ═══════════════════════════════════════════════════════════════════════════════

const ITALIAN_HOLIDAYS: CulturalHoliday[] = [
  {
    id: "ferragosto",
    name: "Ferragosto",
    nativeName: "Ferragosto",
    month: 8, day: 15,
    languages: ["it"],
    description: "Italy's summer holiday — the entire country goes to the beach and everything closes",
    vocabulary: ["Ferragosto", "le ferie", "il mare", "la spiaggia", "il bagno", "l'ombrellone", "la grigliata", "il Ferragosto"],
    traditions: ["Everyone goes to the beach (al mare)", "Giant barbecues (grigliate) with family", "Cities are completely empty — shops closed", "Fireworks on the beach at night", "The whole country takes 2-3 weeks off"],
    foods: ["grigliata di pesce", "insalata di riso", "anguria (watermelon)", "gelato", "pesche", "vino bianco freddo"],
    greetings: ["Buon Ferragosto!", "Buone vacanze!"],
    relatedLessonCategories: ["vocabulary", "speaking", "writing"],
    culturalSignificance: "Dating back to Emperor Augustus (Feriae Augusti). Italians take vacation SERIOUSLY — it's a constitutional right. August = Italy is closed. Don't try to do business in August!",
    durationDays: 14,
    location: {
      city: "Nationwide (especially beaches and mountains)",
      region: "All regions",
      country: "Italy",
      coordinates: { lat: 41.9028, lng: 12.4964 },
      famousVenues: ["Every beach in Italy", "Sardinia and Sicily coasts", "Dolomites mountain resorts", "Lake Como and Lake Garda"],
    },
    history: {
      origin: "Established by Emperor Augustus in 18 BC as 'Feriae Augusti' (Augustus's Rest) — a day of rest after the harvest. Workers and even animals got a holiday. The Catholic Church later adopted it as the Assumption of Mary (Aug 15).",
      whyTheyCelebrate: "Italians celebrate because Ferragosto is sacred leisure — the entire country stops working and goes to the beach or mountains. It's about dolce far niente (the sweetness of doing nothing). Working on Ferragosto is considered almost immoral.",
      historicalContext: "Augustus created the holiday to celebrate the end of harvest and give workers rest. Mussolini revived it in the 1920s with 'Treni Popolari' (People's Trains) — cheap trains so even poor Italians could reach the sea. This democratized beach culture.",
      yearEstablished: -18,
      evolution: "18 BC Roman harvest rest → Catholic Assumption of Mary → Mussolini's People's Trains (1920s) → modern August exodus. Today Italian cities are EMPTY in August — everyone is at the beach. Restaurants close, offices shut. 'Chiuso per ferie' (Closed for vacation) signs everywhere.",
    },
    music: ["Sapore di Sale (Gino Paoli — taste of salt/summer)", "Volare (Domenico Modugno)", "Estate (Bruno Martino)", "Azzurro (Adriano Celentano)"],
    newsStyle: {
      headline: "Buon Ferragosto! Italy empties as 30 million head to beaches — cities become ghost towns for August exodus",
      urgency: "happening_now",
    },
  },
  {
    id: "carnevale_venezia",
    name: "Venice Carnival",
    nativeName: "Carnevale di Venezia",
    month: 2, day: 15,
    languages: ["it"],
    description: "The world-famous Venice Carnival with elaborate masks, costumes, and masquerade balls",
    vocabulary: ["il Carnevale", "la maschera", "il costume", "il ballo in maschera", "i coriandoli", "le frittelle", "il martedì grasso", "la Commedia dell'Arte"],
    traditions: ["Wear elaborate masks and costumes", "Attend masked balls (balli in maschera)", "Throw coriandoli (confetti)", "The Flight of the Angel from St. Mark's bell tower", "Martedì Grasso (Fat Tuesday) — last day before Lent"],
    foods: ["frittelle veneziane", "galani/chiacchiere", "castagnole", "fritole", "prosecco"],
    greetings: ["Buon Carnevale!", "A Carnevale ogni scherzo vale! (At Carnival, every joke goes!)"],
    relatedLessonCategories: ["vocabulary", "reading", "speaking"],
    culturalSignificance: "Dates back to 1162. The masks allowed social classes to mix freely — a noble could talk to a commoner without knowing. Commedia dell'Arte characters (Arlecchino, Colombina, Pulcinella) originated here.",
    durationDays: 18,
    location: {
      city: "Venice",
      region: "Veneto",
      country: "Italy",
      coordinates: { lat: 45.4408, lng: 12.3155 },
      famousVenues: ["Piazza San Marco", "Grand Canal", "Teatro La Fenice", "Caffè Florian (oldest café in Italy)"],
    },
    history: {
      origin: "Venetian Carnival dates to 1162, celebrating Venice's military victory over Aquileia. Masks became central because they erased social class — a nobleman and a servant were equal behind masks. This anonymity enabled forbidden pleasures.",
      whyTheyCelebrate: "Venetians celebrate because Carnival represents Venice's golden age — when the Republic was the richest, most powerful, and most decadent city in Europe. The masks symbolize freedom from identity, social rules, and consequences.",
      historicalContext: "At its peak (1700s), Venetian Carnival lasted 6 months — masks were worn from October to Lent. Napoleon banned it in 1797 when he conquered Venice. It was revived only in 1979 by the Italian government to boost tourism.",
      yearEstablished: 1162,
      evolution: "1162 victory celebration → 6-month masked festival (1700s) → banned by Napoleon (1797) → revived 1979. Today it's a 2-week event drawing 3 million visitors. The masks are now art objects costing €100-10,000. The 'Flight of the Angel' (zip-line from St. Mark's bell tower) opens the festival.",
    },
    dances: [
      {
        name: "Minuetto",
        description: "Elegant 18th-century court dance performed in full Carnival costume — slow, graceful steps with deep bows and curtsies. Partners barely touch fingertips. It's about poise, not passion.",
        music: "Baroque chamber music — harpsichord, violin, cello. Vivaldi (who was Venetian) is the soundtrack of Carnival.",
        attire: "Full 18th-century Venetian costume: tricorn hat, bauta mask (white with protruding chin), black tabarro (cloak), and elaborate gowns for women. The bauta mask allows eating and drinking without removal.",
      },
    ],
    music: ["Vivaldi - Four Seasons (Spring)", "Baroque chamber music", "Gondolier songs", "O Sole Mio (Neapolitan but associated with Italian celebration)"],
    newsStyle: {
      headline: "Il Carnevale di Venezia begins! Masked revelers fill Piazza San Marco as the Angel flies from the bell tower",
      urgency: "happening_now",
    },
  },
  {
    id: "natale_italiano",
    name: "Italian Christmas",
    nativeName: "Natale",
    month: 12, day: 25,
    languages: ["it"],
    description: "Italian Christmas — La Vigilia (Christmas Eve feast), presepe (nativity scene), and panettone",
    vocabulary: ["Natale", "la Vigilia", "il presepe", "il panettone", "il pandoro", "Babbo Natale", "la tombola", "Santo Stefano"],
    traditions: ["La Vigilia — Christmas Eve dinner (Feast of the Seven Fishes in the South)", "Build a presepe (nativity scene — more important than the tree!)", "Play tombola (Italian bingo) after dinner", "Santo Stefano (Dec 26) — visit extended family", "The great debate: panettone vs pandoro"],
    foods: ["panettone", "pandoro", "capitone (eel)", "tortellini in brodo", "cotechino e lenticchie", "struffoli (Naples)", "spumante"],
    greetings: ["Buon Natale!", "Buone Feste!", "Auguri!"],
    relatedLessonCategories: ["vocabulary", "speaking", "writing"],
    culturalSignificance: "Italian Christmas is about food, family, and tradition. Each region has unique dishes. The panettone vs pandoro debate divides Italy more than politics. Naples is famous for its elaborate presepi.",
    durationDays: 3,
    location: {
      city: "Nationwide (especially Naples, Rome, Milan)",
      region: "All regions",
      country: "Italy",
      coordinates: { lat: 40.8518, lng: 14.2681 },
      famousVenues: ["Via San Gregorio Armeno (Naples — presepe artisan street)", "St. Peter's Square (Vatican nativity)", "Piazza Navona Christmas market (Rome)", "Duomo di Milano Christmas tree"],
    },
    history: {
      origin: "Italian Christmas centers on the presepe (nativity scene) — invented by St. Francis of Assisi in 1223 in Greccio, Italy. He created the first live nativity to make the Christmas story accessible to illiterate people.",
      whyTheyCelebrate: "Italians celebrate because Natale is about family, food, and the presepe tradition. The Feast of the Seven Fishes (Vigilia) on Christmas Eve is sacred — no meat, only seafood, in 7+ courses. It's a marathon of eating that brings families together.",
      historicalContext: "Italy is the heart of Catholicism (the Vatican is in Rome). Christmas traditions here influenced the entire Christian world. The presepe tradition spread from Italy to Spain, Latin America, and beyond. Naples became the world capital of presepe artistry in the 1700s.",
      yearEstablished: 1223,
      evolution: "St. Francis's live nativity (1223) → Neapolitan presepe artistry (1700s) → Feast of Seven Fishes tradition → modern Italian Christmas. Today Via San Gregorio Armeno in Naples sells handmade presepe figures year-round, including satirical figures of politicians and celebrities.",
    },
    music: ["Tu Scendi dalle Stelle (most famous Italian Christmas carol)", "Astro del Ciel (Silent Night in Italian)", "Adeste Fideles", "Zampogna (bagpipe) music from southern Italy"],
    newsStyle: {
      headline: "Buon Natale! Naples lights up Via San Gregorio Armeno as families prepare the Feast of Seven Fishes tonight",
      urgency: "happening_now",
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// GERMAN HOLIDAYS
// ═══════════════════════════════════════════════════════════════════════════════

const GERMAN_HOLIDAYS: CulturalHoliday[] = [
  {
    id: "oktoberfest",
    name: "Oktoberfest",
    nativeName: "Oktoberfest",
    month: 9, day: 21,
    languages: ["de"],
    description: "The world's largest folk festival in Munich — beer, pretzels, Lederhosen, and Bavarian culture",
    vocabulary: ["das Oktoberfest", "das Bier", "die Maß", "die Brezel", "die Lederhosen", "das Dirndl", "das Festzelt", "der Biergarten", "O'zapft is!"],
    traditions: ["'O'zapft is!' (It's tapped!) — Mayor taps the first keg", "Wear Tracht (traditional clothing — Lederhosen/Dirndl)", "Drink from a Maß (1-liter beer mug)", "Ride carnival rides and play games", "Sing along to Bavarian music"],
    foods: ["Schweinshaxe (pork knuckle)", "Brezen (pretzels)", "Weißwurst", "Hendl (roast chicken)", "Obatzda (cheese spread)", "Kaiserschmarrn"],
    greetings: ["Prost!", "Ein Prosit der Gemütlichkeit!", "O'zapft is!"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "Started in 1810 as a royal wedding celebration. Now 6 million visitors annually. Despite the name, it mostly takes place in September! Only Munich's 6 traditional breweries can serve beer.",
    durationDays: 16,
  },
  {
    id: "weihnachten",
    name: "German Christmas",
    nativeName: "Weihnachten",
    month: 12, day: 24,
    languages: ["de"],
    description: "German Christmas — Advent traditions, Weihnachtsmärkte, and Heiligabend (Christmas Eve is the main event)",
    vocabulary: ["Weihnachten", "der Adventskranz", "der Weihnachtsmarkt", "der Glühwein", "der Christkind", "Heiligabend", "der Tannenbaum", "die Bescherung"],
    traditions: ["Adventskranz — light one candle each Sunday for 4 weeks", "Adventskalender — open one door each day in December", "Visit Weihnachtsmärkte (Christmas markets)", "Heiligabend (Dec 24) — main celebration, not Dec 25", "Die Bescherung — gift-giving on Christmas Eve"],
    foods: ["Glühwein (mulled wine)", "Lebkuchen (gingerbread)", "Stollen (fruit bread)", "Kartoffelsalat mit Würstchen", "Gänsebraten (roast goose)", "Plätzchen (cookies)"],
    greetings: ["Frohe Weihnachten!", "Fröhliche Weihnachten!", "Schöne Feiertage!"],
    relatedLessonCategories: ["vocabulary", "speaking", "writing"],
    culturalSignificance: "Germany invented many Christmas traditions: the Christmas tree (Tannenbaum), Advent calendars, and Christmas markets. There are 2,500+ Weihnachtsmärkte across Germany. Nuremberg's is the most famous.",
    durationDays: 4,
    location: {
      city: "Nuremberg, Dresden, Munich & nationwide",
      region: "All Bundesländer",
      country: "Germany",
      coordinates: { lat: 49.4521, lng: 11.0767 },
      famousVenues: ["Christkindlesmarkt Nuremberg (most famous)", "Striezelmarkt Dresden (oldest, since 1434)", "Marienplatz Munich", "Cologne Cathedral Christmas Market"],
    },
    history: {
      origin: "German Christmas traditions shaped the entire Western world: the Christmas tree (Tannenbaum, documented 1419 in Freiburg), Advent calendars (1851), Christmas markets (1434 in Dresden), and even Santa Claus (via German immigrants to America).",
      whyTheyCelebrate: "Germans celebrate because Weihnachten is about Gemütlichkeit (cozy togetherness) — candles on the tree, Glühwein at the market, family gathered around the Adventskranz (Advent wreath). It's warmth against the dark, cold winter.",
      historicalContext: "Martin Luther (1483-1546) is credited with adding candles to Christmas trees (inspired by stars through pine branches). German immigrants brought the tradition to America and Britain (via Prince Albert, who was German). The modern Christmas is essentially a German invention.",
      yearEstablished: 1419,
      evolution: "Pagan winter solstice → Christian Weihnachten → Christmas tree tradition (1419) → Luther adds candles (1500s) → Christmas markets formalize (1600s) → Advent calendar invented (1851) → German traditions exported worldwide via immigration and British royalty.",
    },
    dances: [
      {
        name: "Schuhplattler",
        description: "Bavarian folk dance where men slap their thighs, knees, and shoe soles in complex rhythmic patterns while stamping and leaping. Originally a courtship display — the louder and more athletic, the more impressive to women watching.",
        music: "Ländler music — accordion (Steirische Harmonika), zither, and brass band. 3/4 time, moderate tempo.",
        attire: "Men: Lederhosen (leather shorts), knee socks, suspenders, and felt hat with feather. Women: Dirndl (bodice dress with apron and blouse).",
      },
    ],
    music: ["O Tannenbaum (O Christmas Tree)", "Stille Nacht (Silent Night — composed in Austria)", "Leise Rieselt der Schnee", "Kling Glöckchen (Jingle Bells equivalent)"],
    newsStyle: {
      headline: "Frohe Weihnachten! Germany's 2,500+ Christmas markets open — Nuremberg's Christkindlesmarkt draws millions",
      urgency: "this_week",
    },
  },
  {
    id: "karneval",
    name: "Carnival / Fasching",
    nativeName: "Karneval / Fasching",
    month: 2, day: 20,
    languages: ["de"],
    description: "Germany's crazy carnival season — costumes, parades, and 'organized chaos' especially in Cologne and Mainz",
    vocabulary: ["der Karneval", "der Fasching", "die Fastnacht", "Alaaf!", "Helau!", "der Rosenmontagszug", "die Verkleidung", "der Narr", "die Büttenrede"],
    traditions: ["Weiberfastnacht (Women's Carnival Thursday) — women cut men's ties!", "Rosenmontagszug — massive parade with floats", "Wear costumes (Verkleidung) to work and school", "Political satire floats mock politicians", "Kiss strangers on the cheek (Bützchen)"],
    foods: ["Berliner/Krapfen (jelly donuts)", "Mutzen (fried dough)", "Reibekuchen (potato pancakes)", "Kölsch (Cologne beer)"],
    greetings: ["Alaaf! (Cologne)", "Helau! (Mainz/Düsseldorf)", "Narri Narro! (Black Forest)"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "The 'fifth season' — starts on 11.11 at 11:11am! Different names by region: Karneval (Rhineland), Fasching (Bavaria), Fastnacht (Southwest). Cologne's Karneval is the biggest — 1.5 million people on Rosenmontag.",
    durationDays: 6,
    location: {
      city: "Cologne, Düsseldorf, Mainz",
      region: "Rhineland (Nordrhein-Westfalen, Rheinland-Pfalz)",
      country: "Germany",
      coordinates: { lat: 50.9375, lng: 6.9603 },
      famousVenues: ["Cologne Cathedral square", "Zülpicher Straße (Cologne party street)", "Alter Markt (Cologne)", "Königsallee (Düsseldorf)"],
    },
    history: {
      origin: "Rhineland Carnival (Karneval/Fasching) dates to the Middle Ages as a pre-Lent celebration. The modern organized form started in 1823 when Cologne created the first Carnival committee to structure the chaos into parades and sessions.",
      whyTheyCelebrate: "Rhinelanders celebrate because Karneval is organized rebellion — for 6 days, normal rules don't apply. You kiss strangers (Bützchen), mock politicians, and the 'Dreigestirn' (Prince, Peasant, Maiden — all played by men) rule the city. It's democracy through satire.",
      historicalContext: "Under French occupation (Napoleon), Carnival was banned. When Prussia took over the Rhineland (1815), locals used Carnival to mock their new Prussian rulers. Political satire became central — floats still mock politicians today. During Nazi rule, some Carnival societies resisted through coded humor.",
      yearEstablished: 1823,
      evolution: "Medieval pre-Lent chaos → organized committees (1823) → political satire tradition → Nazi-era resistance → modern 6-day festival. Today Cologne's Rosenmontagszug (Rose Monday parade) is 7km long with 1 million+ spectators. 'Kölle Alaaf!' is the battle cry.",
    },
    dances: [
      {
        name: "Funkenmariechen",
        description: "Athletic solo dance performed by young women in military-style uniforms — high kicks, splits, acrobatics, and precision choreography. Originated as a parody of Prussian military drills.",
        music: "March music played by Carnival brass bands (Spielmannszüge). Fast tempo, military-style drums.",
        attire: "Military-inspired costume: short skirt, jacket with epaulettes, tricorn hat, white boots. The uniform parodies Prussian soldiers — originally a political joke.",
      },
    ],
    music: ["Viva Colonia (most famous Karneval song)", "Kölle Alaaf", "Am Dom zo Kölle (At Cologne Cathedral)", "Kölsche Jung (Cologne Boy)"],
    newsStyle: {
      headline: "Kölle Alaaf! Cologne's Karneval begins — 1 million line the streets for Rosenmontag as political floats mock world leaders",
      urgency: "happening_now",
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PORTUGUESE HOLIDAYS
// ═══════════════════════════════════════════════════════════════════════════════

const PORTUGUESE_HOLIDAYS: CulturalHoliday[] = [
  {
    id: "carnaval_brasil",
    name: "Brazilian Carnival",
    nativeName: "Carnaval",
    month: 2, day: 25, isLunar: true,
    languages: ["pt"],
    description: "The world's biggest party — samba schools, blocos, and 5 days of non-stop celebration",
    vocabulary: ["o Carnaval", "a escola de samba", "o bloco", "o desfile", "a fantasia", "o samba-enredo", "a bateria", "o trio elétrico"],
    traditions: ["Desfile das Escolas de Samba in the Sambódromo (Rio)", "Join a bloco (street party) — hundreds across the city", "Wear a fantasia (costume)", "Dance samba all night", "Trio elétrico trucks with live music (Salvador)"],
    foods: ["feijoada", "acarajé (Salvador)", "caipirinha", "cerveja gelada", "churrasco"],
    greetings: ["Feliz Carnaval!", "Vai ter Carnaval!"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "Brazil's biggest cultural event. Samba schools prepare all year for the competition. Each city celebrates differently — Rio (Sambódromo), Salvador (trio elétrico), Recife (frevo), Olinda (giant puppets).",
    durationDays: 5,
    location: {
      city: "Rio de Janeiro & Salvador",
      region: "Rio de Janeiro & Bahia",
      country: "Brazil",
      coordinates: { lat: -22.9068, lng: -43.1729 },
      famousVenues: ["Sambódromo (Rio — 72,000 capacity)", "Pelourinho (Salvador)", "Copacabana Beach blocos", "Marquês de Sapucaí"],
    },
    history: {
      origin: "Portuguese colonizers brought European Carnival (Entrudo — water-throwing festival). Enslaved Africans added samba rhythms, capoeira movements, and Candomblé spirituality. The modern samba school parade format was created in 1928 by Deixa Falar, the first escola de samba.",
      whyTheyCelebrate: "Brazilians celebrate because Carnival is the great equalizer — for 5 days, the favela and the mansion dance together. Social class dissolves in samba. It's also catharsis — a year of struggle released in pure joy. 'O povo na rua' (the people in the street).",
      historicalContext: "Brazil was the last country in the Americas to abolish slavery (1888). Carnival became the space where Afro-Brazilian culture could be publicly celebrated. Samba was born in the homes of freed slaves in Rio's Praça Onze neighborhood. The government initially tried to suppress it.",
      yearEstablished: 1723,
      evolution: "Portuguese Entrudo (1700s) → African rhythms added → first samba school (1928) → Sambódromo built (1984) → modern mega-spectacle. Today Rio's parade is a billion-dollar industry with 70,000+ performers. Salvador's street Carnival is the world's largest — 2 million people per day.",
    },
    dances: [
      {
        name: "Samba no Pé",
        description: "Fast footwork — weight shifts rapidly between feet while hips swing in figure-8s. The upper body stays relatively still while feet blur. In the Sambódromo, passistas (lead dancers) perform at incredible speed in 4-inch heels.",
        music: "Bateria (percussion section) of 200-400 drummers playing surdos, tamborims, repiniques, agogôs, and cuícas. The rhythm is 2/4 time at 130+ BPM.",
        attire: "Sambódromo: elaborate fantasy costumes with feathers, sequins, and crystals (some weigh 30kg). Street blocos: anything goes — costumes, drag, body paint, or just shorts and a tank top.",
      },
    ],
    music: ["Aquarela do Brasil (Ary Barroso)", "Mas Que Nada (Jorge Ben Jor)", "Garota de Ipanema (Tom Jobim)", "Cidade Maravilhosa (Rio's anthem)"],
    newsStyle: {
      headline: "O Carnaval chegou! Rio's Sambódromo erupts as 70,000 dancers compete — Salvador's streets fill with 2 million revelers",
      urgency: "happening_now",
    },
  },
  {
    id: "festa_junina",
    name: "June Festival",
    nativeName: "Festa Junina",
    month: 6, day: 24,
    languages: ["pt"],
    description: "Brazil's beloved harvest festival — quadrilha dance, forró music, and traditional foods",
    vocabulary: ["a Festa Junina", "a quadrilha", "o forró", "a fogueira", "o arraial", "o casamento caipira", "o balão", "o chapéu de palha"],
    traditions: ["Dance quadrilha (square dance with a story)", "Light fogueiras (bonfires)", "Dress as caipiras (country folk) — straw hats, plaid shirts, painted freckles", "Mock wedding (casamento caipira)", "Play traditional games (pescaria, correio elegante)"],
    foods: ["canjica", "paçoca", "pé de moleque", "quentão", "vinho quente", "milho cozido", "pipoca", "bolo de fubá"],
    greetings: ["Viva São João!", "Feliz Festa Junina!"],
    relatedLessonCategories: ["vocabulary", "speaking", "reading"],
    culturalSignificance: "Celebrates São João (St. John), São Pedro, and Santo Antônio. Originated from Portuguese traditions but became uniquely Brazilian. The Northeast (Nordeste) has the biggest celebrations — Campina Grande and Caruaru compete for the title.",
    durationDays: 30,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MANDARIN HOLIDAYS
// ═══════════════════════════════════════════════════════════════════════════════

const MANDARIN_HOLIDAYS: CulturalHoliday[] = [
  {
    id: "chunjie",
    name: "Chinese New Year / Spring Festival",
    nativeName: "春节",
    pronunciation: "Chūnjié",
    month: 1, day: 29, isLunar: true,
    languages: ["zh"],
    description: "The most important Chinese holiday — family reunions, red envelopes, fireworks, and 15 days of celebration",
    vocabulary: ["春节", "红包", "年夜饭", "春联", "鞭炮", "舞龙", "舞狮", "拜年", "福"],
    traditions: ["年夜饭 (niányèfàn) — reunion dinner on New Year's Eve", "Give 红包 (hóngbāo) — red envelopes with money", "Set off 鞭炮 (biānpào) — firecrackers to scare away evil", "Paste 春联 (chūnlián) — couplets on doors", "Watch 春晚 (Chūnwǎn) — CCTV New Year Gala"],
    foods: ["饺子 (jiǎozi — dumplings, shaped like gold ingots)", "年糕 (niángāo — sticky rice cake = 'higher year')", "鱼 (yú — fish = 'surplus')", "汤圆 (tāngyuán — sweet rice balls)", "春卷 (chūnjuǎn — spring rolls)"],
    greetings: ["新年快乐!", "恭喜发财!", "万事如意!", "身体健康!"],
    relatedLessonCategories: ["vocabulary", "speaking", "writing"],
    culturalSignificance: "The largest annual human migration (春运 chūnyùn) — 3 billion trips as people go home. Each food has symbolic meaning. Red = luck, gold = wealth. The zodiac animal changes each year. 15 days of celebration ending with 元宵节 (Lantern Festival).",
    durationDays: 15,
    location: {
      city: "Beijing, Shanghai & nationwide",
      region: "All provinces",
      country: "China",
      coordinates: { lat: 39.9042, lng: 116.4074 },
      famousVenues: ["Temple of Heaven (Beijing)", "Yu Garden (Shanghai)", "Chinatowns worldwide", "CCTV Spring Festival Gala (800 million viewers)"],
    },
    history: {
      origin: "Legend says a monster called Nián (年) attacked villages every New Year's Eve. People discovered it feared red color, loud noises, and fire — hence red decorations, firecrackers, and lanterns. The word for 'year' (年) comes from the monster's name.",
      whyTheyCelebrate: "Chinese celebrate because Spring Festival is about family reunion (团圆 tuányuán) — the most important value in Chinese culture. No matter how far you've traveled, you go HOME for New Year's Eve dinner. It's the world's largest annual human migration (3 billion trips).",
      historicalContext: "Spring Festival has been celebrated for 4,000+ years. It marks the end of winter and the beginning of spring planting. The lunar calendar means the date shifts each year (Jan 21 - Feb 20). The Communist government briefly tried to replace it with January 1 but failed completely.",
      yearEstablished: -2000,
      evolution: "Ancient agricultural festival → Imperial court ceremony → folk traditions solidified (Tang/Song dynasties) → Communist attempts to suppress (1960s-70s) → fully restored → modern celebration with CCTV Gala (since 1983). Today the Spring Festival travel rush (春运 chūnyùn) moves 3 billion people in 40 days.",
    },
    dances: [
      {
        name: "Lion Dance (舞狮 wǔshī)",
        description: "Two dancers inside a lion costume perform acrobatic movements — leaping onto poles, 'eating' lettuce (cǎi qīng), and blinking the lion's eyes. The lion chases away evil spirits and brings good luck to businesses.",
        music: "Loud drums, cymbals, and gongs. The rhythm guides the lion's movements — fast drumming = energetic jumping, slow = the lion 'sleeps.'",
        attire: "Elaborate lion head (papier-mâché, fur, mirrors) in red/gold. The body is a long cloth covering two dancers. Southern style (Cantonese) is more acrobatic; Northern style is more realistic.",
      },
    ],
    music: ["Gong Xi Gong Xi (恭喜恭喜 — most famous New Year song)", "Xin Nian Hao (新年好 — Happy New Year)", "Chun Jie Xu Qu (Spring Festival Overture — orchestral)", "CCTV Gala theme music"],
    newsStyle: {
      headline: "春节快乐! 3 billion trips begin as China's Spring Festival travel rush launches — fireworks light up Beijing tonight",
      urgency: "happening_now",
    },
  },
  {
    id: "zhongqiujie",
    name: "Mid-Autumn Festival",
    nativeName: "中秋节",
    pronunciation: "Zhōngqiūjié",
    month: 9, day: 17, isLunar: true,
    languages: ["zh"],
    description: "Moon Festival — eat mooncakes, admire the full moon, and celebrate family reunion",
    vocabulary: ["中秋节", "月饼", "月亮", "嫦娥", "团圆", "赏月", "灯笼", "桂花"],
    traditions: ["赏月 (shǎngyuè) — admire the full moon together", "Eat 月饼 (yuèbǐng) — mooncakes", "Tell the legend of 嫦娥 (Cháng'é) — the Moon Goddess", "Light 灯笼 (dēnglóng) — lanterns", "Family reunion dinner"],
    foods: ["月饼 (mooncakes — lotus seed, red bean, egg yolk)", "柚子 (yòuzi — pomelo)", "桂花酒 (guìhuājiǔ — osmanthus wine)", "芋头 (yùtou — taro)"],
    greetings: ["中秋快乐!", "月圆人团圆!", "花好月圆!"],
    relatedLessonCategories: ["vocabulary", "reading", "speaking"],
    culturalSignificance: "Celebrates the harvest moon and family togetherness (团圆 tuányuán). The round moon and round mooncakes symbolize completeness and reunion. Second most important festival after Spring Festival.",
    durationDays: 3,
    location: {
      city: "Nationwide (especially Beijing, Suzhou, Hangzhou)",
      region: "All provinces",
      country: "China",
      coordinates: { lat: 39.9042, lng: 116.4074 },
      famousVenues: ["West Lake (Hangzhou — moon reflection)", "Summer Palace (Beijing)", "Victoria Harbour (Hong Kong — lanterns)", "Suzhou classical gardens"],
    },
    history: {
      origin: "Legend of Chang'e (嫦娥) — a woman who drank an immortality elixir and floated to the moon, where she lives forever with a jade rabbit. Her husband Hou Yi gazes at the moon every Mid-Autumn, and she gazes back. Mooncakes represent their eternal separation.",
      whyTheyCelebrate: "Chinese celebrate because the full moon symbolizes family reunion (团圆). The round mooncake represents completeness — a whole family together. If you can't be with family, you look at the same moon and feel connected across distance.",
      historicalContext: "Mid-Autumn Festival dates to the Tang Dynasty (618-907) when moon worship became popular. Legend says mooncakes were used to hide secret messages during the Yuan Dynasty (1271-1368) to coordinate a rebellion against Mongol rulers — the revolution was planned inside mooncakes.",
      yearEstablished: 618,
      evolution: "Tang Dynasty moon worship → Song Dynasty mooncake tradition → Yuan Dynasty rebellion legend → Ming/Qing family festival → modern celebration. Today mooncakes are a $3 billion industry. Luxury mooncake gift boxes (with gold, truffles, or ice cream) are status symbols.",
    },
    music: ["Dan Yuan Ren Chang Jiu (但愿人长久 — Su Shi poem set to music by Teresa Teng)", "Yue Liang Dai Biao Wo De Xin (月亮代表我的心 — Teresa Teng)", "Ming Yue Ji Shi You (明月几时有)"],
    newsStyle: {
      headline: "中秋节快乐! Full moon rises over China — families gather for mooncakes and lanterns as Chang'e watches from above",
      urgency: "happening_now",
    },
  },
  {
    id: "duanwujie",
    name: "Dragon Boat Festival",
    nativeName: "端午节",
    pronunciation: "Duānwǔjié",
    month: 6, day: 10, isLunar: true,
    languages: ["zh"],
    description: "Dragon boat races, zongzi (rice dumplings), and honoring the poet Qu Yuan",
    vocabulary: ["端午节", "粽子", "龙舟", "屈原", "艾草", "雄黄酒", "香包", "赛龙舟"],
    traditions: ["赛龙舟 (sài lóngzhōu) — dragon boat races", "Wrap and eat 粽子 (zòngzi) — sticky rice in bamboo leaves", "Hang 艾草 (àicǎo) — mugwort on doors to ward off evil", "Wear 香包 (xiāngbāo) — fragrant sachets", "Tell the story of 屈原 (Qū Yuán) — the patriotic poet"],
    foods: ["粽子 (zòngzi — savory or sweet)", "咸鸭蛋 (xiándàndàn — salted duck eggs)", "雄黄酒 (xiónghuángjiǔ — realgar wine)"],
    greetings: ["端午安康!", "端午节快乐!"],
    relatedLessonCategories: ["vocabulary", "reading", "speaking"],
    culturalSignificance: "Honors Qu Yuan (340-278 BC), a poet who drowned himself in protest. People threw rice dumplings into the river so fish wouldn't eat his body, and raced boats to find him. Now a UNESCO Intangible Cultural Heritage.",
    durationDays: 3,
    location: {
      city: "Nationwide (especially Hubei, Hunan, Guangdong)",
      region: "All provinces (strongest in southern China)",
      country: "China",
      coordinates: { lat: 30.5928, lng: 114.3055 },
      famousVenues: ["East Lake (Wuhan — dragon boat races)", "Victoria Harbour (Hong Kong — international races)", "Miluo River (Hunan — where Qu Yuan drowned)", "Pearl River (Guangzhou)"],
    },
    history: {
      origin: "Commemorates the death of Qu Yuan (屈原), a patriotic poet and minister of the Chu Kingdom (340-278 BC). When his kingdom fell to enemies, he drowned himself in the Miluo River in despair. Villagers raced boats to save him and threw rice into the water to keep fish from eating his body.",
      whyTheyCelebrate: "Chinese celebrate because Qu Yuan represents loyalty, patriotism, and integrity — he chose death over serving a corrupt government. Dragon boat racing honors the villagers' desperate attempt to save him. Zongzi (rice dumplings) represent the rice thrown to protect his body.",
      historicalContext: "Qu Yuan was a minister who warned his king about enemy threats but was exiled by corrupt officials. When his predictions came true and the kingdom fell, he drowned himself. His story resonates with Chinese values of loyalty to country and speaking truth to power.",
      yearEstablished: -278,
      evolution: "278 BC memorial for Qu Yuan → regional festival → national holiday → UNESCO Intangible Cultural Heritage (2009). Dragon boat racing spread worldwide — now an international sport with competitions in 85+ countries. Zongzi-making is a family tradition passed through generations.",
    },
    dances: [
      {
        name: "Dragon Boat Racing (赛龙舟)",
        description: "Teams of 20+ paddlers race long, narrow boats decorated as dragons. A drummer at the front sets the rhythm, a steerer at the back controls direction. Paddlers stroke in perfect unison — the boat flies across the water.",
        music: "Massive drum at the bow — BOOM-BOOM-BOOM sets the paddle rhythm. Crowd cheers and gongs from shore. The faster the drum, the faster the paddlers stroke.",
        attire: "Matching team jerseys and life vests. The dragon boat itself is the 'costume' — carved dragon head at bow, tail at stern, painted scales along the hull.",
      },
    ],
    music: ["Dragon boat drumming (ritual rhythm)", "Qu Yuan ci (poems of Qu Yuan chanted)", "Li Sao (Encountering Sorrow — Qu Yuan's masterwork, sometimes sung)"],
    newsStyle: {
      headline: "端午节快乐! Dragon boats race across China as families wrap zongzi to honor poet Qu Yuan's sacrifice",
      urgency: "happening_now",
    },
  },
];


// ═══════════════════════════════════════════════════════════════════════════════
// FRENCH DIALECT HOLIDAYS (Haitian Creole, Québécois, Senegalese)
// ═══════════════════════════════════════════════════════════════════════════════

const FRENCH_DIALECT_HOLIDAYS: CulturalHoliday[] = [
  // HAITIAN CREOLE (fr-HT)
  {
    id: "kanaval_haiti",
    name: "Haitian Carnival",
    nativeName: "Kanaval",
    month: 2, day: 16, isLunar: true,
    languages: ["fr-HT"],
    description: "Haiti's biggest celebration — three days of rara music, elaborate floats, and dancing through the streets of Port-au-Prince, Jacmel, and Les Cayes.",
    vocabulary: ["kanaval", "rara", "bann a pye", "char", "madigra", "lanbi", "vaksin", "tanbou"],
    traditions: ["Bann a pye (walking bands) parade through streets", "Char (elaborate floats) competition", "Madigra (masked characters) roam freely", "Rara bands play vaksin (bamboo trumpets)", "Political commentary through song"],
    foods: ["griot (fried pork)", "bannann peze (fried plantains)", "akra (malanga fritters)", "diri ak pwa (rice and beans)", "kremas (coconut cream liqueur)"],
    greetings: ["Viv Kanaval!", "Sak pase? N ap boule!", "Anmwe Kanaval!"],
    relatedLessonCategories: ["vocabulary", "listening", "speaking"],
    culturalSignificance: "Kanaval is Haiti's ultimate expression of joy, resistance, and creativity. Born from the fusion of African spiritual traditions and French colonial carnival, it's a time when all social barriers dissolve and the streets belong to everyone.",
    durationDays: 3,
    location: {
      city: "Port-au-Prince",
      region: "Ouest",
      country: "Haiti",
      coordinates: { lat: 18.5944, lng: -72.3074 },
      famousVenues: ["Champ de Mars", "Jacmel waterfront (for artisan masks)", "Les Cayes parade route"],
    },
    history: {
      origin: "Rooted in African spiritual celebrations brought by enslaved people, merged with French pre-Lenten carnival traditions. After independence in 1804, Kanaval became a celebration of freedom itself.",
      whyTheyCelebrate: "Haitians celebrate Kanaval as an expression of resilience and joy despite hardship. It's three days where poverty, politics, and problems disappear — only music, dance, and community remain. 'Kanaval se lavi' (Carnival is life).",
      historicalContext: "Haiti was the first Black republic, born from the only successful slave revolution. Kanaval carries this revolutionary spirit — the music often contains political commentary and social critique disguised as celebration.",
      yearEstablished: 1804,
      evolution: "Originally informal post-independence celebrations. Formalized in the 1900s with organized routes and competitions. Jacmel's carnival became famous for papier-mâché masks. Today it attracts diaspora Haitians from NYC, Miami, and Montreal.",
    },
    dances: [
      {
        name: "Rara",
        description: "Procession-style dancing — large groups move through streets following rara bands. Dancers wave flags, spin, and move in synchronized waves. The movement is hypnotic and trance-like, connected to Vodou spiritual rhythms.",
        music: "Vaksin (bamboo trumpets of different lengths creating harmonies), tanbou (drums), kòne (tin horns), and call-and-response singing. The rhythm is infectious and builds in intensity.",
        attire: "Bright sequined flags, colorful scarves, sometimes Vodou-inspired face paint. Band leaders wear elaborate costumes with mirrors and beads. Madigra characters wear papier-mâché masks.",
      },
    ],
    music: ["Boukman Eksperyans", "RAM (Richard A. Morse)", "Tabou Combo", "Sweet Micky (Michel Martelly)"],
    newsStyle: {
      headline: "Viv Kanaval! Port-au-Prince erupts in three days of rara, vaksin, and pure Haitian joy!",
      urgency: "happening_now",
    },
  },
  {
    id: "fet_gede",
    name: "Festival of the Dead",
    nativeName: "Fèt Gede",
    month: 11, day: 1,
    languages: ["fr-HT"],
    description: "Vodou celebration honoring the Gede spirits (spirits of death and fertility). Practitioners dress in black and purple, visit cemeteries, and make offerings.",
    vocabulary: ["Gede", "lwa", "Baron Samdi", "Manman Brijit", "simityè", "ofrand", "kleren", "piman"],
    traditions: ["Visit cemeteries to honor ancestors", "Dress as Baron Samdi (top hat, dark glasses)", "Offerings of kleren (raw rum) with hot peppers", "Singing and dancing at crossroads", "Spiritual possession by Gede spirits"],
    foods: ["piman bouk (hot peppers)", "kleren (raw rum)", "black coffee", "griot", "mayi moulen (cornmeal)"],
    greetings: ["Onè! Respè!", "Gede bon!"],
    relatedLessonCategories: ["vocabulary", "reading", "listening"],
    culturalSignificance: "Fèt Gede bridges the living and the dead. The Gede spirits are irreverent, humorous, and sexual — they remind the living that death is natural and should not be feared. It's uniquely Haitian.",
    durationDays: 2,
    location: {
      city: "Port-au-Prince",
      region: "Ouest",
      country: "Haiti",
      coordinates: { lat: 18.5425, lng: -72.3386 },
      famousVenues: ["Grand Cimetière de Port-au-Prince", "Baron Samdi's cross at cemetery entrance", "Vodou temples (peristil)"],
    },
    history: {
      origin: "Originates from West African ancestor veneration traditions (Dahomey/Fon people), syncretized with Catholic All Saints' Day during colonization. The Gede spirits emerged as distinctly Haitian creations.",
      whyTheyCelebrate: "Haitians honor their ancestors and confront death with humor rather than fear. Baron Samdi (lord of the dead) is depicted as a trickster who loves rum, cigars, and dirty jokes — death is not solemn but celebratory.",
      historicalContext: "Vodou was the spiritual backbone of the Haitian Revolution. The ceremony at Bois Caïman (1791) launched the revolution. Fèt Gede preserves this African spiritual heritage despite centuries of persecution.",
      yearEstablished: 1791,
      evolution: "Once practiced secretly due to persecution by Catholic authorities and dictators. Now openly celebrated. Has gained international recognition as an important cultural tradition. Diaspora communities in Miami and NYC hold their own Fèt Gede.",
    },
    music: ["Vodou drumming (Rada and Petwo rhythms)", "Rara bands", "Boukman Eksperyans"],
    newsStyle: {
      headline: "Fèt Gede awakens! Haitians honor Baron Samdi with rum, peppers, and cemetery celebrations",
      urgency: "happening_now",
    },
  },
  {
    id: "haiti_independence",
    name: "Haitian Independence Day",
    nativeName: "Jou Endepandans",
    month: 1, day: 1,
    languages: ["fr-HT"],
    description: "Celebrates Haiti becoming the first Black republic on January 1, 1804 — the only successful slave revolution in history. Soup joumou is the traditional dish.",
    vocabulary: ["endepandans", "libète", "soup joumou", "Desalin", "revolisyon", "drapo", "patri", "erwo"],
    traditions: ["Eating soup joumou (squash soup — formerly forbidden to slaves)", "Flag ceremonies", "Speeches honoring Dessalines and Toussaint", "Family gatherings", "Church services"],
    foods: ["soup joumou (squash soup — THE independence dish)", "griot", "diri ak djon djon", "pain patate (sweet potato bread)", "kremas"],
    greetings: ["Bòn Fèt Endepandans!", "Viv Ayiti!", "Libète ou lanmò!"],
    relatedLessonCategories: ["reading", "vocabulary", "speaking"],
    culturalSignificance: "January 1st is not just New Year's in Haiti — it's Independence Day. Soup joumou is sacred: enslaved people were forbidden from eating it. On January 1, 1804, they ate it as free people for the first time.",
    durationDays: 1,
    location: {
      city: "Gonaïves",
      region: "Artibonite",
      country: "Haiti",
      coordinates: { lat: 19.4500, lng: -72.6889 },
      famousVenues: ["Place d'Armes (where independence was declared)", "Musée du Panthéon National Haïtien (MUPANAH)", "Citadelle Laferrière"],
    },
    history: {
      origin: "On January 1, 1804, Jean-Jacques Dessalines declared Haiti independent after 13 years of revolution against France. It was the first successful slave revolt in history and the second independent nation in the Americas (after the USA).",
      whyTheyCelebrate: "Haitians celebrate the ultimate triumph: enslaved people defeating Napoleon's army and creating their own nation. Soup joumou symbolizes this — it was the 'master's soup' that slaves couldn't eat. Now it's the people's soup.",
      historicalContext: "The Haitian Revolution (1791-1804) terrified slave-owning nations worldwide. France demanded 150 million francs in 'reparations' (for lost 'property' — the enslaved people themselves). Haiti paid this debt until 1947, crippling its economy.",
      yearEstablished: 1804,
      evolution: "Always celebrated with soup joumou. In 2021, UNESCO inscribed Haitian soup joumou as Intangible Cultural Heritage. The diaspora worldwide cooks soup joumou on January 1st as an act of cultural memory.",
    },
    music: ["Hymne National (La Dessalinienne)", "Boukman Eksperyans - Kalfou Danjere", "RAM - Ibo Lele"],
    newsStyle: {
      headline: "Bòn Fèt Endepandans! Haiti celebrates 220+ years of freedom with soup joumou and pride",
      urgency: "happening_now",
    },
  },
  // QUÉBÉCOIS FRENCH (fr-QC)
  {
    id: "saint_jean_baptiste",
    name: "Saint-Jean-Baptiste Day",
    nativeName: "La Saint-Jean-Baptiste",
    pronunciation: "la san-zhon-ba-teest",
    month: 6, day: 24,
    languages: ["fr-QC"],
    description: "Quebec's national holiday — massive bonfires, outdoor concerts, parades, and fireworks celebrating Québécois culture and French-Canadian identity.",
    vocabulary: ["la fête nationale", "le feu de joie", "le défilé", "la fleur de lys", "le drapeau", "la poutine", "tabarnac", "la fierté"],
    traditions: ["Feux de joie (bonfires) in every neighborhood", "Massive outdoor concert on the Plains of Abraham", "Parades with blue and white fleur-de-lys flags", "Fireworks at midnight", "Singing 'Gens du pays' (unofficial anthem)"],
    foods: ["poutine", "hot dogs steamés", "tire d'érable", "bière de microbrasserie", "guédilles (lobster rolls)"],
    greetings: ["Bonne Saint-Jean!", "Bonne fête nationale!", "Vive le Québec!"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "La Saint-Jean is Quebec's most important cultural celebration — it's about being Québécois, speaking French, and celebrating a distinct identity within North America. It's both a party and a political statement.",
    durationDays: 1,
    location: {
      city: "Montréal",
      region: "Québec",
      country: "Canada",
      coordinates: { lat: 45.5017, lng: -73.5673 },
      famousVenues: ["Plaines d'Abraham (Quebec City)", "Parc Maisonneuve (Montreal)", "Every village square in Quebec"],
    },
    history: {
      origin: "Originally a Catholic feast day (John the Baptist), adopted by French Canadians in 1834 as a national celebration. Ludger Duvernay organized the first official celebration as a statement of French-Canadian identity.",
      whyTheyCelebrate: "Québécois celebrate their survival as a French-speaking nation in English North America. After 400 years, they still speak French, still have their culture, still resist assimilation. La Saint-Jean says: 'We're still here.'",
      historicalContext: "After the British Conquest (1760), French Canadians were a conquered people. The Saint-Jean became a symbol of cultural resistance. During the Quiet Revolution (1960s), it transformed from a religious holiday into a secular national celebration.",
      yearEstablished: 1834,
      evolution: "From Catholic feast → French-Canadian cultural celebration → Quebec's official national holiday (1977). The iconic song 'Gens du pays' by Gilles Vigneault (1975) became the unofficial anthem. Today it's a massive party with concerts, fireworks, and pride.",
    },
    dances: [
      {
        name: "Gigue québécoise",
        description: "Fast footwork dance — the dancer's upper body stays still while feet tap complex rhythms on the floor. Similar to Irish step dancing but with distinct Québécois flair. Often performed on a wooden board for amplification.",
        music: "Fiddle (violon), accordion, harmonica, and spoons (cuillères). The music is fast, joyful, and driving — reels and jigs passed down through generations.",
        attire: "Casual — plaid shirts, jeans, and boots. The focus is on the feet, not the costume. At festivals, some wear traditional ceinture fléchée (arrow sash).",
      },
    ],
    music: ["Gens du pays (Gilles Vigneault)", "Mon pays (Gilles Vigneault)", "Les Cowboys Fringants", "Mes Aïeux - Dégénérations"],
    newsStyle: {
      headline: "Bonne Saint-Jean! Quebec lights up with bonfires, concerts, and 8 million voices singing 'Gens du pays'",
      urgency: "happening_now",
    },
  },
  {
    id: "carnaval_quebec",
    name: "Quebec Winter Carnival",
    nativeName: "Carnaval de Québec",
    pronunciation: "kar-na-val duh keh-bek",
    month: 2, day: 7,
    languages: ["fr-QC"],
    description: "The world's largest winter carnival — ice sculptures, night parades, canoe races on frozen river, and Bonhomme Carnaval (the snowman mascot).",
    vocabulary: ["Bonhomme", "le canot à glace", "la sculpture de glace", "le palais de glace", "le caribou (drink)", "la tuque", "le traîneau", "la tire sur la neige"],
    traditions: ["Ice canoe racing across the St. Lawrence", "Night parades with illuminated floats", "Ice palace (Palais de glace)", "Tire sur la neige (maple taffy on snow)", "Wearing the red Bonhomme effigy"],
    foods: ["tire d'érable sur la neige", "caribou (hot wine drink)", "poutine", "queue de castor (beaver tail pastry)", "tourtière"],
    greetings: ["Bon Carnaval!", "Vive Bonhomme!"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "Carnaval de Québec proves that Québécois don't just survive winter — they celebrate it. It's a defiant joy in the face of -30°C temperatures. Bonhomme is Quebec's most beloved character.",
    durationDays: 17,
    location: {
      city: "Québec City",
      region: "Québec",
      country: "Canada",
      coordinates: { lat: 46.8139, lng: -71.2080 },
      famousVenues: ["Place de l'Assemblée-Nationale (ice palace)", "Vieux-Québec (Old Quebec)", "St. Lawrence River (canoe race)", "Plains of Abraham"],
    },
    history: {
      origin: "First held in 1894 as a way to combat winter depression. Inspired by European pre-Lenten carnivals but uniquely adapted to Quebec's extreme cold. Bonhomme Carnaval was created in 1954.",
      whyTheyCelebrate: "Québécois celebrate because they refuse to let winter defeat them. When it's -30°C, they build ice palaces, race canoes on frozen rivers, and drink caribou outside. It's cultural defiance against the cold.",
      historicalContext: "Quebec City has some of the coldest winters of any major city. Rather than hibernating, the Carnaval tradition says: 'We are a northern people and we are proud of it.' The ice canoe race honors the voyageurs who crossed frozen rivers.",
      yearEstablished: 1894,
      evolution: "Started small in 1894, interrupted by wars and the Depression. Revived permanently in 1954 with Bonhomme as mascot. Now the world's largest winter carnival with 400,000+ visitors. The ice canoe race is the most extreme event — teams paddle through ice floes on the St. Lawrence.",
    },
    music: ["Traditional Québécois fiddle reels", "La Bottine Souriante", "Les Colocs"],
    newsStyle: {
      headline: "Bonhomme is back! Carnaval de Québec transforms the city into a frozen wonderland for 17 days",
      urgency: "happening_now",
    },
  },
  // SENEGALESE FRENCH (fr-SN)
  {
    id: "grand_magal_touba",
    name: "Grand Magal of Touba",
    nativeName: "Grand Magal de Touba",
    month: 10, day: 5, isLunar: true,
    languages: ["fr-SN"],
    description: "Senegal's largest religious pilgrimage — millions travel to the holy city of Touba to honor Cheikh Ahmadou Bamba, founder of the Mouride brotherhood.",
    vocabulary: ["le Magal", "Touba", "Cheikh Ahmadou Bamba", "mouride", "le pèlerinage", "la prière", "le ndogou", "la ziarra"],
    traditions: ["Pilgrimage to the Great Mosque of Touba", "All-night prayers and Quran recitation", "Massive communal meals (ndogou)", "Visiting the tomb of Cheikh Ahmadou Bamba", "Chanting khassaides (religious poems)"],
    foods: ["thiéboudienne (fish and rice)", "mafé (peanut stew)", "café Touba (spiced coffee)", "thiéré (couscous)", "ndogou (breaking fast meal)"],
    greetings: ["Magal Mubarak!", "Jërëjëf (Thank you in Wolof)", "Ndeysan!"],
    relatedLessonCategories: ["vocabulary", "reading", "listening"],
    culturalSignificance: "The Grand Magal is Senegal's most important religious event. 3-5 million people converge on Touba in a single day. It celebrates Cheikh Ahmadou Bamba's peaceful resistance against French colonialism through faith alone.",
    durationDays: 2,
    location: {
      city: "Touba",
      region: "Diourbel",
      country: "Senegal",
      coordinates: { lat: 14.8500, lng: -15.8833 },
      famousVenues: ["Grande Mosquée de Touba (one of Africa's largest)", "Mausoleum of Cheikh Ahmadou Bamba", "Touba city center"],
    },
    history: {
      origin: "Commemorates the day in 1895 when Cheikh Ahmadou Bamba was exiled by French colonial authorities to Gabon. He went peacefully, armed only with prayer. His exile became a symbol of spiritual resistance.",
      whyTheyCelebrate: "Senegalese Mourides celebrate because Bamba proved that faith alone could defeat colonialism. He was exiled, imprisoned, and persecuted but never took up arms. His peaceful resistance through prayer inspired millions.",
      historicalContext: "During French colonization of Senegal, Cheikh Ahmadou Bamba built a massive following through Islamic education and work ethic. The French feared his influence and exiled him. His return made him a legend.",
      yearEstablished: 1928,
      evolution: "Started as a small gathering after Bamba's death (1927). Grew exponentially — now 3-5 million attend annually, making it one of the largest pilgrimages in the world. Touba has grown from a village to Senegal's second-largest city because of the Magal.",
    },
    music: ["Khassaides (religious chanting)", "Youssou N'Dour - Birima", "Cheikh Lô"],
    newsStyle: {
      headline: "Magal Mubarak! Millions converge on Touba for Senegal's greatest pilgrimage honoring Cheikh Ahmadou Bamba",
      urgency: "happening_now",
    },
  },
  {
    id: "tabaski_senegal",
    name: "Tabaski (Eid al-Adha)",
    nativeName: "Tabaski",
    month: 6, day: 17, isLunar: true,
    languages: ["fr-SN"],
    description: "Senegal's most important family holiday — families sacrifice a sheep, wear new clothes, and visit relatives. The entire country stops for Tabaski.",
    vocabulary: ["Tabaski", "le mouton", "la prière", "les habits neufs", "la famille", "le sacrifice", "le ndogou", "la teranga"],
    traditions: ["Morning prayer at the mosque", "Sheep sacrifice (every family)", "Wearing brand new clothes (boubous)", "Visiting all family members", "Sharing meat with neighbors and the poor"],
    foods: ["grilled lamb", "thiéboudienne", "yassa (onion sauce)", "pastels (fried pastries)", "bissap (hibiscus juice)", "ataya (mint tea)"],
    greetings: ["Deweneti! (Happy holiday in Wolof)", "Bonne fête de Tabaski!", "Eid Mubarak!"],
    relatedLessonCategories: ["vocabulary", "speaking", "grammar"],
    culturalSignificance: "Tabaski is when teranga (Senegalese hospitality) reaches its peak. No one is left out — even strangers receive meat. It's the day when the entire nation demonstrates generosity and community.",
    durationDays: 3,
    location: {
      city: "Dakar",
      region: "Dakar",
      country: "Senegal",
      coordinates: { lat: 14.7167, lng: -17.4677 },
      famousVenues: ["Grande Mosquée de Dakar", "Every neighborhood mosque", "Family homes across Senegal"],
    },
    history: {
      origin: "Islamic celebration of Ibrahim's willingness to sacrifice his son. In Senegal, it merged with local traditions of hospitality (teranga) and community sharing to become the country's most important social event.",
      whyTheyCelebrate: "Senegalese celebrate Tabaski as the ultimate expression of teranga — sharing with everyone. Families save all year to buy the best sheep. The meat is divided: 1/3 for family, 1/3 for neighbors, 1/3 for the poor.",
      historicalContext: "Islam arrived in Senegal through peaceful trade routes (11th century). Tabaski became the moment when Islamic values and Senegalese teranga culture merged perfectly — both emphasize generosity and community.",
      yearEstablished: 1100,
      evolution: "The tradition has remained remarkably consistent for centuries. What's changed is scale — Dakar's sheep market now sells 750,000+ sheep before Tabaski. Families who can't afford sheep receive meat from neighbors.",
    },
    music: ["Youssou N'Dour - Tabaski", "Baaba Maal", "Orchestra Baobab"],
    newsStyle: {
      headline: "Deweneti! Senegal celebrates Tabaski with 750,000 sheep, new boubous, and teranga for all",
      urgency: "happening_now",
    },
  },
  {
    id: "korite_senegal",
    name: "Korité (Eid al-Fitr)",
    nativeName: "Korité",
    month: 4, day: 10, isLunar: true,
    languages: ["fr-SN"],
    description: "End of Ramadan celebration — families gather for a massive feast after a month of fasting. New clothes, family visits, and forgiveness.",
    vocabulary: ["Korité", "le jeûne", "le Ramadan", "le ndogou", "le pardon", "la prière", "le boubou", "la fête"],
    traditions: ["Morning prayer at the mosque", "Asking forgiveness from elders", "Wearing new boubous", "Massive family feast", "Children receive money (étrennes)"],
    foods: ["lakh (millet porridge with yogurt)", "thiéboudienne", "pastels", "thiakry (sweet couscous)", "café Touba", "jus de bouye (baobab juice)"],
    greetings: ["Baal ma ak jàmm! (Forgive me in peace — Wolof)", "Bonne fête de Korité!", "Eid Mubarak!"],
    relatedLessonCategories: ["vocabulary", "speaking", "reading"],
    culturalSignificance: "Korité is about renewal and forgiveness. After 30 days of fasting together, the community celebrates with joy. The tradition of asking forgiveness (baal ma) makes it deeply emotional.",
    durationDays: 2,
    location: {
      city: "Dakar",
      region: "Dakar",
      country: "Senegal",
      coordinates: { lat: 14.7167, lng: -17.4677 },
      famousVenues: ["Grande Mosquée de Dakar", "Place de l'Indépendance", "Family homes"],
    },
    history: {
      origin: "Islamic celebration marking the end of Ramadan. In Senegal, it uniquely incorporates the tradition of 'baal ma' (asking forgiveness) from every person you may have wronged during the year.",
      whyTheyCelebrate: "Senegalese celebrate Korité as a spiritual reset. The month of fasting purified the body; now asking forgiveness purifies relationships. It's the day when grudges end and families reunite.",
      historicalContext: "Senegal is 95% Muslim but practices a uniquely tolerant form of Islam. Christians celebrate Korité with their Muslim neighbors, and Muslims celebrate Christmas. This interfaith harmony is a source of national pride.",
      evolution: "The core tradition hasn't changed, but modern additions include WhatsApp forgiveness messages, diaspora video calls, and social media posts of new outfits. The feast has grown more elaborate over generations.",
    },
    music: ["Youssou N'Dour", "Wally Seck", "Viviane Chidid"],
    newsStyle: {
      headline: "Baal ma ak jàmm! Senegal breaks the fast with Korité — forgiveness, feasts, and family reunions",
      urgency: "happening_now",
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PORTUGUESE DIALECT HOLIDAYS (Brazilian, European)
// ═══════════════════════════════════════════════════════════════════════════════

const PORTUGUESE_DIALECT_HOLIDAYS: CulturalHoliday[] = [
  // BRAZILIAN PORTUGUESE (pt-BR)
  {
    id: "carnaval_brasil",
    name: "Brazilian Carnival",
    nativeName: "Carnaval",
    month: 2, day: 21, isLunar: true,
    languages: ["pt-BR"],
    description: "The world's biggest party — 5 days of samba, blocos (street parties), and escola de samba parades in Rio, Salvador, Recife, and across Brazil.",
    vocabulary: ["o carnaval", "o samba", "o bloco", "a escola de samba", "o sambódromo", "a fantasia", "o trio elétrico", "a bateria", "o frevo", "a marchinha"],
    traditions: ["Escola de samba parades at Sambódromo", "Blocos de rua (street parties)", "Trio elétrico (music trucks) in Salvador", "Fantasy costumes (fantasias)", "Rei Momo (King Momo) opens carnival"],
    foods: ["feijoada", "acarajé (Salvador)", "caipirinha", "cerveja gelada", "espetinho (skewers)", "açaí"],
    greetings: ["Feliz Carnaval!", "É Carnaval! Vamo que vamo!", "Tá no bloco?"],
    relatedLessonCategories: ["vocabulary", "listening", "speaking"],
    culturalSignificance: "Carnaval is Brazil's soul made visible. It's where African rhythms, indigenous spirit, and European spectacle merge into the world's greatest celebration. Social class disappears — everyone dances together.",
    durationDays: 5,
    location: {
      city: "Rio de Janeiro",
      region: "Rio de Janeiro",
      country: "Brazil",
      coordinates: { lat: -22.9068, lng: -43.1729 },
      famousVenues: ["Sambódromo da Marquês de Sapucaí (Rio)", "Pelourinho (Salvador)", "Recife Antigo (Recife)", "Galo da Madrugada (world's largest bloco)"],
    },
    history: {
      origin: "Brought by Portuguese colonizers as pre-Lenten celebration, transformed by enslaved Africans who added samba rhythms, capoeira movements, and spiritual elements. The escolas de samba were founded in the 1920s-30s by Black communities in Rio's favelas.",
      whyTheyCelebrate: "Brazilians celebrate because Carnaval is the ultimate expression of alegria (joy). For 5 days, Brazil becomes one giant party where everyone is equal. 'No Carnaval, ninguém é pobre' (In Carnival, no one is poor).",
      historicalContext: "Samba was born in the homes of Afro-Brazilian women (tias baianas) in Rio's port district. It was criminalized, then embraced. The Sambódromo (built 1984 by Oscar Niemeyer) formalized the parade competition.",
      yearEstablished: 1723,
      evolution: "From Portuguese entrudo (water fights) → African-influenced street celebrations → organized escola de samba parades (1930s) → Sambódromo era (1984) → today's $2 billion industry with 6 million+ tourists.",
    },
    dances: [
      {
        name: "Samba no pé",
        description: "Solo samba — fast footwork with tiny bouncing steps, hips swaying side to side. The feet barely leave the ground but move incredibly fast. The body undulates from ankles up through hips to shoulders.",
        music: "Bateria (percussion section of 200-300 drummers): surdo (bass drum), tamborim, repinique, cuíca, agogô, reco-reco. The rhythm is 2/4 time — boom-cha-boom-cha at 120+ BPM.",
        attire: "Passistas wear elaborate bikini-style costumes with massive feathered headdresses, rhinestones, and body glitter. Baianas wear traditional white lace dresses with turbans. Each escola has its own colors.",
      },
      {
        name: "Frevo",
        description: "Acrobatic dance from Recife — dancers carry small colorful umbrellas and perform kicks, jumps, and splits while moving forward. It's athletic, fast, and joyful. Influenced by capoeira.",
        music: "Brass-heavy orchestra (trumpets, trombones, saxophones) playing at breakneck speed. The rhythm is 2/4 march time but played at 150+ BPM. It's the fastest carnival music in Brazil.",
        attire: "Colorful, tight-fitting costumes and the iconic small umbrella (sombrinha). The umbrella is both prop and balance tool during acrobatic moves.",
      },
    ],
    music: ["Cidade Negra - A Sombra da Maldade", "Ivete Sangalo - Festa", "Asa de Águia - Baianidade Nagô", "Marchinhas de Carnaval (classic songs)"],
    newsStyle: {
      headline: "É Carnaval! Rio's Sambódromo ignites as 6 million revelers dance samba across Brazil!",
      urgency: "happening_now",
    },
  },
  {
    id: "festa_junina",
    name: "June Festival",
    nativeName: "Festa Junina",
    month: 6, day: 24,
    languages: ["pt-BR"],
    description: "Brazil's second-biggest celebration — bonfires, quadrilha dancing, forró music, and rural-themed parties celebrating São João (Saint John).",
    vocabulary: ["a fogueira", "o forró", "a quadrilha", "o arraiá", "o milho", "a bandeirinha", "o caipira", "a sanfona", "o quentão", "a paçoca"],
    traditions: ["Quadrilha dancing (choreographed square dance)", "Jumping over bonfires", "Forró dancing all night", "Mock wedding (casamento caipira)", "Balloon releases (balões)"],
    foods: ["paçoca (peanut candy)", "canjica (sweet corn porridge)", "quentão (hot spiced cachaça)", "milho cozido (boiled corn)", "pé-de-moleque (peanut brittle)", "bolo de fubá (cornmeal cake)"],
    greetings: ["Feliz São João!", "Viva São João!", "Boa festa junina!"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "Festa Junina celebrates Brazil's rural roots. In a rapidly urbanizing country, it's a nostalgic connection to the interior (sertão), to simplicity, and to community. The Northeast is the heartland of Festa Junina.",
    durationDays: 30,
    location: {
      city: "Campina Grande",
      region: "Paraíba",
      country: "Brazil",
      coordinates: { lat: -7.2172, lng: -35.8811 },
      famousVenues: ["Parque do Povo (Campina Grande — 'O Maior São João do Mundo')", "Caruaru (Pernambuco)", "Every school and neighborhood in Brazil"],
    },
    history: {
      origin: "Portuguese brought the Catholic feast of São João to Brazil. It merged with indigenous corn harvest celebrations and African traditions. The bonfire tradition comes from the belief that smoke carries prayers to heaven.",
      whyTheyCelebrate: "Brazilians celebrate their rural heritage and community bonds. Festa Junina is democratic — every school, every neighborhood, every small town has its own arraiá (party). It's Brazil's most participatory festival.",
      historicalContext: "The Brazilian Northeast (sertão) is the cultural heartland of Festa Junina. Forró music was born there, quadrilha dancing evolved from French court dances adapted by rural Brazilians, and the 'caipira' (country person) aesthetic is celebrated rather than mocked.",
      yearEstablished: 1583,
      evolution: "From small Catholic bonfires → massive month-long celebrations. Campina Grande's 'Maior São João do Mundo' (World's Biggest São João) now attracts 2 million+ visitors. Forró went from regional to national music genre.",
    },
    dances: [
      {
        name: "Forró",
        description: "Couples dance close together — the man leads with subtle hip movements, the woman follows. Feet do a simple two-step but hips move constantly. It's intimate, sensual, and joyful. Danced all night at arraiás.",
        music: "Sanfona (accordion), zabumba (bass drum), and triângulo (triangle) — the holy trinity of forró. Luiz Gonzaga is the king. Modern forró adds electric guitar and keyboards.",
        attire: "Festa Junina style: women in colorful patchwork dresses with braids and painted freckles. Men in plaid shirts, straw hats, and drawn-on mustaches. Everyone dresses as 'caipiras' (country folk).",
      },
    ],
    music: ["Luiz Gonzaga - Asa Branca", "Alceu Valença - Anunciação", "Dominguinhos - Eu Só Quero um Xodó"],
    newsStyle: {
      headline: "Viva São João! Brazil lights bonfires and dances forró for the world's biggest June festival",
      urgency: "happening_now",
    },
  },
  {
    id: "reveillon_brasil",
    name: "Brazilian New Year's Eve",
    nativeName: "Réveillon",
    month: 12, day: 31,
    languages: ["pt-BR"],
    description: "Millions gather on Copacabana beach wearing white, throwing flowers into the sea for Iemanjá, and watching the world's largest fireworks display.",
    vocabulary: ["o réveillon", "a virada", "Iemanjá", "o branco", "as flores", "os fogos de artifício", "a praia", "o champanhe", "as ondas", "a simpatia"],
    traditions: ["Wear all white for peace", "Jump 7 waves at midnight for luck", "Throw white flowers into the sea for Iemanjá", "Eat lentils for prosperity", "Wear colored underwear (yellow=money, red=love, green=health)"],
    foods: ["lentilhas (lentils for prosperity)", "champanhe", "uvas (grapes — one wish per grape)", "peru (turkey)", "rabanada (French toast)"],
    greetings: ["Feliz Ano Novo!", "Bom Réveillon!", "Que venha um ano de paz!"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "Brazilian Réveillon blends Catholic, African (Candomblé), and indigenous traditions. Wearing white and honoring Iemanjá (goddess of the sea) shows how African spirituality is woven into mainstream Brazilian culture.",
    durationDays: 1,
    location: {
      city: "Rio de Janeiro",
      region: "Rio de Janeiro",
      country: "Brazil",
      coordinates: { lat: -22.9711, lng: -43.1822 },
      famousVenues: ["Copacabana Beach (2 million+ people)", "Praia de Iracema (Fortaleza)", "Avenida Paulista (São Paulo)"],
    },
    history: {
      origin: "Combines Portuguese Catholic New Year traditions with Afro-Brazilian Candomblé rituals honoring Iemanjá (Yoruba goddess of the sea). The white clothing tradition comes from Candomblé, where white represents peace and purity.",
      whyTheyCelebrate: "Brazilians celebrate with hope and spirituality. The sea represents renewal — throwing flowers to Iemanjá asks for blessings in the new year. Jumping waves is a physical act of faith. It's collective optimism.",
      historicalContext: "Candomblé was persecuted for centuries but its traditions became mainstream Brazilian culture. The Réveillon on Copacabana shows how African spirituality survived and thrived despite oppression.",
      yearEstablished: 1950,
      evolution: "Copacabana's Réveillon grew from small gatherings in the 1950s to the world's largest New Year's celebration (2-3 million people). The fireworks display is 16 minutes long, launched from barges in the bay.",
    },
    music: ["Jorge Ben Jor - Mas Que Nada", "Tim Maia - Descobridor dos Sete Mares", "Cidade Negra - Onde Você Mora"],
    newsStyle: {
      headline: "Feliz Ano Novo! 2 million in white gather on Copacabana to honor Iemanjá and welcome the new year",
      urgency: "happening_now",
    },
  },
  // EUROPEAN PORTUGUESE (pt-PT)
  {
    id: "santos_populares",
    name: "Popular Saints Festivals",
    nativeName: "Santos Populares",
    month: 6, day: 13,
    languages: ["pt-PT"],
    description: "Lisbon's biggest party — sardine grilling in every street, marchas populares (neighborhood parades), manjerico (basil plants), and all-night dancing in Alfama.",
    vocabulary: ["os Santos Populares", "a sardinha", "o manjerico", "a marcha", "o arraial", "o Santo António", "a quadra", "o balão"],
    traditions: ["Grilling sardines on every street corner", "Giving manjerico (basil) plants with love poems", "Marchas populares (neighborhood dance competitions)", "All-night arraiais (street parties) in Alfama", "Casamentos de Santo António (mass weddings)"],
    foods: ["sardinhas assadas (grilled sardines on bread)", "caldo verde", "bifanas (pork sandwiches)", "ginjinha (sour cherry liqueur)", "pão com chouriço"],
    greetings: ["Boas Festas!", "Viva Santo António!", "Boa noite de Santos!"],
    relatedLessonCategories: ["vocabulary", "speaking", "listening"],
    culturalSignificance: "Santos Populares is Lisbon's soul — it's when the city belongs to its people, not tourists. Every bairro (neighborhood) competes in marchas, every street grills sardines, and the smell of charcoal fills the June air.",
    durationDays: 30,
    location: {
      city: "Lisboa",
      region: "Lisboa",
      country: "Portugal",
      coordinates: { lat: 38.7223, lng: -9.1393 },
      famousVenues: ["Alfama (oldest neighborhood)", "Avenida da Liberdade (marcha parade)", "Graça", "Mouraria", "Bairro Alto"],
    },
    history: {
      origin: "Celebrates Saint Anthony of Padua (born in Lisbon, 1195). Originally a religious feast, it evolved into Lisbon's biggest popular celebration. The sardine tradition comes from June being peak sardine season.",
      whyTheyCelebrate: "Lisboetas celebrate because Santos Populares is THEIR festival — not for tourists, not for the elite. It's neighbors grilling sardines together, kids running through streets, and the whole city staying up until dawn.",
      historicalContext: "Santo António is Lisbon's patron saint (not São Jorge, the national patron). He's the saint of lost things and matchmaking. The tradition of mass weddings (casamentos de Santo António) provides free ceremonies for couples who can't afford them.",
      yearEstablished: 1264,
      evolution: "From medieval religious processions → popular street celebrations (1800s) → organized marcha competitions (1932) → today's month-long festival. The sardine has become Lisbon's unofficial symbol during June.",
    },
    dances: [
      {
        name: "Marcha Popular",
        description: "Choreographed neighborhood parades — dozens of dancers in matching costumes perform synchronized routines while marching down Avenida da Liberdade. Each bairro competes for the best marcha. It's athletic, precise, and full of pride.",
        music: "Original songs composed for each bairro's marcha — catchy, singable melodies about neighborhood pride. Accordion, guitar, and drums. The crowd sings along.",
        attire: "Elaborate matching costumes representing each neighborhood's identity. Often includes traditional elements: fishermen's vests, flower sellers' baskets, or Alfama's iconic laundry-line motifs.",
      },
    ],
    music: ["Amália Rodrigues - Lisboa Antiga", "Carlos do Carmo - Lisboa Menina e Moça", "Mariza - Chuva"],
    newsStyle: {
      headline: "Viva Santo António! Lisbon fills with the smell of grilled sardines as Santos Populares lights up every bairro",
      urgency: "happening_now",
    },
  },
  {
    id: "dia_portugal",
    name: "Portugal Day",
    nativeName: "Dia de Portugal",
    month: 6, day: 10,
    languages: ["pt-PT"],
    description: "National day celebrating Portuguese identity, language, and Luís de Camões (national poet). Military parades, cultural events, and celebrations worldwide.",
    vocabulary: ["o Dia de Portugal", "Camões", "a pátria", "a língua portuguesa", "os Descobrimentos", "a saudade", "a bandeira", "o hino"],
    traditions: ["Military parade and flag ceremony", "Presidential speech", "Cultural events and concerts", "Celebrations in Portuguese communities worldwide", "Honoring Camões and Portuguese literature"],
    foods: ["bacalhau (salt cod)", "pastel de nata", "vinho do Porto", "caldo verde", "arroz doce (rice pudding)"],
    greetings: ["Feliz Dia de Portugal!", "Viva Portugal!", "Viva Camões!"],
    relatedLessonCategories: ["reading", "vocabulary", "speaking"],
    culturalSignificance: "Dia de Portugal celebrates the Portuguese language and culture worldwide — not just Portugal but Brazil, Angola, Mozambique, Cape Verde, and all lusophone nations. It's about saudade, discovery, and resilience.",
    durationDays: 1,
    location: {
      city: "Lisboa",
      region: "Lisboa",
      country: "Portugal",
      coordinates: { lat: 38.7223, lng: -9.1393 },
      famousVenues: ["Mosteiro dos Jerónimos", "Praça do Comércio", "Torre de Belém", "Padrão dos Descobrimentos"],
    },
    history: {
      origin: "Commemorates the death of Luís de Camões (June 10, 1580), author of 'Os Lusíadas' — the epic poem of Portuguese discovery. Established as a national holiday to celebrate Portuguese identity and language.",
      whyTheyCelebrate: "Portuguese celebrate their language (spoken by 250 million people worldwide), their history of exploration, and their cultural contributions. It's also a day of saudade — longing for the greatness of the past while building the future.",
      historicalContext: "Portugal was once a global empire. Today, the Portuguese language connects 9 countries across 4 continents. Dia de Portugal celebrates this linguistic legacy and the concept of lusofonia (Portuguese-speaking world).",
      yearEstablished: 1580,
      evolution: "Originally focused on Camões and literature. Under Salazar's dictatorship, it became militaristic ('Day of the Race'). After the Carnation Revolution (1974), it was reimagined as a celebration of democracy, language, and culture.",
    },
    music: ["A Portuguesa (national anthem)", "Amália Rodrigues - Estranha Forma de Vida", "Madredeus - O Espírito da Paz"],
    newsStyle: {
      headline: "Viva Portugal! 250 million Portuguese speakers worldwide celebrate Dia de Portugal and the legacy of Camões",
      urgency: "happening_now",
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ARABIC DIALECT HOLIDAYS (Egyptian, Levantine, Gulf)
// ═══════════════════════════════════════════════════════════════════════════════

const ARABIC_DIALECT_HOLIDAYS: CulturalHoliday[] = [
  // EGYPTIAN ARABIC (ar-EG)
  {
    id: "sham_el_nessim",
    name: "Sham el-Nessim (Spring Festival)",
    nativeName: "شم النسيم",
    pronunciation: "sham en-neh-seem",
    month: 4, day: 20, isLunar: true,
    languages: ["ar-EG"],
    description: "Egypt's ancient spring festival — 4,500 years old, celebrated by ALL Egyptians (Muslim and Christian). Families picnic outdoors eating fiseekh (salted fish) and colored eggs.",
    vocabulary: ["شم النسيم (Sham el-Nessim)", "الفسيخ (fiseekh)", "البيض الملون (colored eggs)", "الربيع (spring)", "النزهة (picnic)", "الرنجة (herring)", "البصل الأخضر (green onions)", "الحديقة (garden)"],
    traditions: ["Eating fiseekh (fermented salted fish)", "Coloring eggs", "Family picnics in parks and along the Nile", "Eating green onions and lettuce (symbols of spring)", "Visiting gardens and farms"],
    foods: ["فسيخ (fiseekh — fermented mullet)", "رنجة (renga — smoked herring)", "بيض ملون (colored eggs)", "بصل أخضر (green onions)", "خس (lettuce)"],
    greetings: ["شم نسيم سعيد! (Happy Sham el-Nessim!)", "كل سنة وانتو طيبين! (May you be well every year!)"],
    relatedLessonCategories: ["vocabulary", "reading", "speaking"],
    culturalSignificance: "Sham el-Nessim is older than Islam, Christianity, and Judaism — it dates to ancient Egypt (2700 BC). It's the one holiday ALL Egyptians share regardless of religion. The name means 'smelling the breeze.'",
    durationDays: 1,
    location: {
      city: "Cairo",
      region: "Cairo Governorate",
      country: "Egypt",
      coordinates: { lat: 30.0444, lng: 31.2357 },
      famousVenues: ["Al-Azhar Park", "Nile Corniche", "Giza Pyramids area", "Qanater gardens"],
    },
    history: {
      origin: "Dates to ancient Egypt (c. 2700 BC) as the festival of Shemu (harvest season). The ancient Egyptians offered salted fish and colored eggs to the gods. The tradition survived 4,500 years through Pharaonic, Greek, Roman, Islamic, and modern eras.",
      whyTheyCelebrate: "Egyptians celebrate because Sham el-Nessim connects them to their Pharaonic ancestors. It's proof that Egyptian culture is older than any religion. Muslim and Christian families celebrate side by side — it's Egypt's most unifying day.",
      historicalContext: "Ancient Egyptians believed spring was when the world was created. The colored eggs symbolize new life, the fish represents the Nile's bounty. This 4,500-year-old tradition survived every conquest and religion change.",
      yearEstablished: -2700,
      evolution: "Remarkably unchanged for 4,500 years. The core elements (fish, eggs, outdoor picnics, spring timing) are identical to ancient descriptions. Modern additions: social media posts of fiseekh, health warnings about improperly prepared fish.",
    },
    music: ["Mohamed Mounir - Shams el-Horreya", "Amr Diab - Tamally Maak (spring vibes)"],
    newsStyle: {
      headline: "شم نسيم سعيد! Egypt's 4,500-year-old spring festival fills parks with families, fiseekh, and colored eggs",
      urgency: "happening_now",
    },
  },
  {
    id: "eid_fitr_egypt",
    name: "Eid al-Fitr (Egypt)",
    nativeName: "عيد الفطر",
    pronunciation: "eed el-fitr",
    month: 4, day: 10, isLunar: true,
    languages: ["ar-EG"],
    description: "End of Ramadan — three days of family visits, new clothes, kahk (cookies), and children receiving عيدية (money gifts). Egypt's most joyful religious holiday.",
    vocabulary: ["عيد الفطر (Eid al-Fitr)", "الكحك (kahk cookies)", "العيدية (eidiya — money gift)", "صلاة العيد (Eid prayer)", "الفانوس (lantern)", "الزيارات (visits)", "الملابس الجديدة (new clothes)"],
    traditions: ["Eid prayer at the mosque at dawn", "Giving عيدية (money) to children", "Baking and exchanging kahk (cookies)", "Visiting all family members over 3 days", "New clothes for everyone", "Decorating with Ramadan lanterns"],
    foods: ["كحك (kahk — butter cookies with powdered sugar)", "بسكويت العيد (Eid biscuits)", "فتة (fatta — rice, bread, meat)", "رقاق (thin bread with meat/sugar)"],
    greetings: ["عيد سعيد! (Happy Eid!)", "كل سنة وانتو طيبين!", "عيدكم مبارك! (Blessed Eid!)"],
    relatedLessonCategories: ["vocabulary", "speaking", "grammar"],
    culturalSignificance: "Eid al-Fitr in Egypt is uniquely festive — the kahk tradition, the فانوس (lantern) decorations, and the عيدية (money gifts) make it especially magical for children. It's when Egyptian generosity shines brightest.",
    durationDays: 3,
    location: {
      city: "Cairo",
      region: "Cairo Governorate",
      country: "Egypt",
      coordinates: { lat: 30.0444, lng: 31.2357 },
      famousVenues: ["Al-Azhar Mosque", "Amr Ibn al-As Mosque", "Every mosque in Egypt", "Family homes"],
    },
    history: {
      origin: "Islamic celebration marking the end of Ramadan fasting. In Egypt, it merged with Pharaonic traditions of cookie-making (kahk recipes found in ancient tombs) and the Fatimid-era lantern tradition.",
      whyTheyCelebrate: "Egyptians celebrate the completion of Ramadan's spiritual journey. After 30 days of fasting and prayer, Eid is the reward — joy, family, sweets, and generosity. Children especially love the عيدية (money gifts).",
      historicalContext: "The kahk tradition dates to Pharaonic Egypt (cookie molds found in tombs). The Fatimid dynasty (969-1171 AD) introduced the فانوس (lantern) tradition. Egyptian Eid combines Islamic, Pharaonic, and Fatimid heritage.",
      yearEstablished: 640,
      evolution: "Core traditions unchanged since the Fatimid era. Modern additions: WhatsApp Eid greetings, social media kahk competitions, and increasingly elaborate عيدية amounts. The 3-day holiday structure remains sacred.",
    },
    music: ["Ahmed Saad - Eid songs", "Mohamed Hamaki - Eid celebrations", "Classic Eid songs on radio"],
    newsStyle: {
      headline: "عيد سعيد! Egypt celebrates Eid al-Fitr with kahk, عيدية, and three days of family joy",
      urgency: "happening_now",
    },
  },
  {
    id: "moulid_egypt",
    name: "Prophet's Birthday (Moulid)",
    nativeName: "المولد النبوي",
    pronunciation: "el-mow-led en-na-ba-wee",
    month: 9, day: 27, isLunar: true,
    languages: ["ar-EG"],
    description: "Celebration of Prophet Muhammad's birthday — Egyptian style with arouset el-moulid (sugar dolls), halawet el-moulid (sweets), Sufi dhikr circles, and street festivals.",
    vocabulary: ["المولد (moulid)", "عروسة المولد (sugar doll)", "حلاوة المولد (moulid sweets)", "الذكر (dhikr)", "الحصان (sugar horse)", "الفانوس (lantern)", "المديح (praise songs)"],
    traditions: ["Buying عروسة المولد (sugar dolls) for girls and حصان (sugar horses) for boys", "Sufi dhikr circles with chanting and swaying", "Street festivals with rides and games", "Eating حلاوة المولد (special nut-filled sweets)", "Religious lectures and praise songs"],
    foods: ["حلاوة المولد (sesame/nut candy)", "عروسة المولد (sugar doll — decorative)", "ملبن (Turkish delight)", "سمسمية (sesame bars)", "حمص الشام (chickpea soup)"],
    greetings: ["مولد سعيد!", "كل سنة وانتو طيبين!"],
    relatedLessonCategories: ["vocabulary", "reading", "listening"],
    culturalSignificance: "The Egyptian Moulid is unique — it blends Islamic devotion with Pharaonic-era sweet-making traditions and Sufi mysticism. The sugar dolls are an art form, and the dhikr circles are mesmerizing spiritual experiences.",
    durationDays: 1,
    location: {
      city: "Cairo",
      region: "Cairo Governorate",
      country: "Egypt",
      coordinates: { lat: 30.0459, lng: 31.2625 },
      famousVenues: ["Hussein Mosque area", "Al-Azhar district", "Sayyida Zeinab mosque", "Every neighborhood in Egypt"],
    },
    history: {
      origin: "The Fatimid dynasty (Shia rulers of Egypt, 969-1171) introduced elaborate Moulid celebrations to Cairo. The sugar doll tradition may trace to Pharaonic offering figurines. Sufi orders added the dhikr circles.",
      whyTheyCelebrate: "Egyptians celebrate the Prophet's birthday with joy and sweets because they believe love for the Prophet should be expressed through happiness, not solemnity. The Sufi tradition emphasizes divine love through music and movement.",
      historicalContext: "Egypt's Moulid celebrations are among the most elaborate in the Muslim world. The Fatimids used them to legitimize their rule; the tradition outlasted them by 900 years. Some conservative scholars oppose Moulid celebrations, but in Egypt they're deeply beloved.",
      yearEstablished: 969,
      evolution: "From Fatimid royal celebrations → popular street festivals. The sugar doll industry employs thousands of artisans. Modern debates about religious permissibility haven't diminished the celebration's popularity.",
    },
    music: ["Sufi dhikr chanting", "Religious praise songs (madih)", "Yassin El Tohamy (famous munshid)"],
    newsStyle: {
      headline: "مولد سعيد! Cairo's streets fill with sugar dolls, Sufi chanting, and the sweet smell of حلاوة المولد",
      urgency: "happening_now",
    },
  },
  // LEVANTINE ARABIC / LEBANESE (ar-LB)
  {
    id: "eid_fitr_lebanon",
    name: "Eid al-Fitr (Lebanon)",
    nativeName: "عيد الفطر",
    pronunciation: "eed el-fitr",
    month: 4, day: 10, isLunar: true,
    languages: ["ar-LB"],
    description: "End of Ramadan in Lebanon — family gatherings, maamoul cookies, visiting relatives, and the unique Lebanese tradition of interfaith celebration (Christians congratulate Muslim neighbors).",
    vocabulary: ["عيد الفطر (Eid al-Fitr)", "المعمول (maamoul cookies)", "العيدية (eidiye)", "الزيارات (visits)", "كل عام وأنتم بخير (yearly greeting)", "الكنافة (knafeh)", "القهوة العربية (Arabic coffee)"],
    traditions: ["Baking maamoul (date/nut filled cookies)", "Family visits across 3 days", "Children receive عيدية (money)", "Christians visit Muslim neighbors", "Elaborate mezze feasts", "Arabic coffee served to all visitors"],
    foods: ["معمول (maamoul — date/walnut/pistachio cookies)", "كنافة (knafeh — cheese pastry)", "بقلاوة (baklava)", "قهوة عربية (Arabic coffee)", "مغلي (spiced rice pudding)"],
    greetings: ["عيد مبارك! (Blessed Eid!)", "كل عام وأنتم بخير!", "ينعاد عليكم! (May it return to you!)"],
    relatedLessonCategories: ["vocabulary", "speaking", "grammar"],
    culturalSignificance: "Eid in Lebanon showcases the country's unique interfaith coexistence. Christian neighbors bring sweets to Muslim families, and the celebration crosses sectarian lines. Maamoul is Lebanon's most iconic cookie.",
    durationDays: 3,
    location: {
      city: "Beirut",
      region: "Beirut Governorate",
      country: "Lebanon",
      coordinates: { lat: 33.8938, lng: 35.5018 },
      famousVenues: ["Mohammad Al-Amin Mosque", "Martyrs' Square", "Hamra Street", "Verdun area"],
    },
    history: {
      origin: "Islamic celebration adapted to Lebanon's multi-confessional society. The maamoul tradition dates to ancient Mesopotamia (cookie molds found in archaeological sites). Lebanon's version emphasizes interfaith sharing.",
      whyTheyCelebrate: "Lebanese celebrate Eid as both a religious occasion and a demonstration of national unity. In a country with 18 recognized religious sects, Eid is when coexistence is most visible — everyone participates regardless of faith.",
      historicalContext: "Lebanon's confessional system means religious holidays are shared. Eid al-Fitr is a national holiday for ALL Lebanese. This tradition of interfaith celebration survived even the civil war (1975-1990).",
      evolution: "The core maamoul tradition is ancient. Modern Lebanon adds: WhatsApp greetings, restaurant Eid brunches, and social media posts. The interfaith dimension has become a source of national pride in a divided region.",
    },
    music: ["Fairuz - Ya Ana Ya Ana", "Marcel Khalife", "Ziad Rahbani"],
    newsStyle: {
      headline: "عيد مبارك! Lebanon celebrates Eid with maamoul, interfaith visits, and three days of family joy",
      urgency: "happening_now",
    },
  },
  {
    id: "baalbeck_festival",
    name: "Baalbeck International Festival",
    nativeName: "مهرجانات بعلبك الدولية",
    pronunciation: "maharajanat ba'albak ad-dawliyye",
    month: 7, day: 15,
    languages: ["ar-LB"],
    description: "World-class music and arts festival held in the ancient Roman temples of Baalbeck — Lebanon's most prestigious cultural event featuring international and Arab artists.",
    vocabulary: ["مهرجان (festival)", "بعلبك (Baalbeck)", "المعبد (temple)", "الموسيقى (music)", "الفن (art)", "المسرح (theater)", "الحفلة (concert)", "التراث (heritage)"],
    traditions: ["Concerts in 2000-year-old Roman temples", "Mix of international and Arab artists", "Evening performances under the stars", "Pre-show dinners in Bekaa Valley restaurants", "Cultural pride in hosting world-class events"],
    foods: ["كبة (kibbeh)", "تبولة (tabbouleh)", "عرق (arak)", "مناقيش (manoushe)", "لحم مشوي (grilled meat)"],
    greetings: ["يلا عالمهرجان! (Let's go to the festival!)", "حفلة رائعة! (Amazing concert!)"],
    relatedLessonCategories: ["vocabulary", "listening", "speaking"],
    culturalSignificance: "Baalbeck Festival proves that Lebanon's cultural life persists despite wars and crises. Performing in 2000-year-old Roman temples connects modern Arab culture to ancient civilizations. It's Lebanon's cultural defiance.",
    durationDays: 30,
    location: {
      city: "Baalbeck",
      region: "Bekaa Valley",
      country: "Lebanon",
      coordinates: { lat: 34.0047, lng: 36.2110 },
      famousVenues: ["Temple of Jupiter (main stage)", "Temple of Bacchus", "Hexagonal Court"],
    },
    history: {
      origin: "Founded in 1956 as part of Lebanon's cultural renaissance. The Roman temples of Baalbeck (built 1st century AD) provide the world's most dramatic concert backdrop — massive columns frame the stage.",
      whyTheyCelebrate: "Lebanese attend Baalbeck as an act of cultural resistance. Despite wars, economic collapse, and political chaos, the festival continues. It says: 'We are a civilization, not just a crisis.'",
      historicalContext: "Baalbeck's temples are among the largest Roman structures ever built. The festival was interrupted by the civil war (1975-1996) but returned triumphantly. It has hosted Ella Fitzgerald, Miles Davis, Fairuz, and Umm Kulthum.",
      yearEstablished: 1956,
      evolution: "From elite cultural event (1956) → interrupted by civil war (1975-1996) → triumphant return (1997) → survived 2006 war, 2019 revolution, 2020 explosion. Each return is a statement of Lebanese resilience.",
    },
    music: ["Fairuz (performed here famously)", "Umm Kulthum (legendary 1960s concert)", "Mashrou' Leila", "International artists"],
    newsStyle: {
      headline: "يلا عالمهرجان! Baalbeck Festival returns to its ancient Roman temples with world-class performances",
      urgency: "coming_soon",
    },
  },
  {
    id: "lebanon_independence",
    name: "Lebanese Independence Day",
    nativeName: "عيد الاستقلال",
    pronunciation: "eed el-istiqlal",
    month: 11, day: 22,
    languages: ["ar-LB"],
    description: "Celebrates Lebanon's independence from France (1943). Military parade, flag ceremonies, and reflection on national identity in a complex, multi-confessional nation.",
    vocabulary: ["الاستقلال (independence)", "لبنان (Lebanon)", "العلم (flag)", "الأرزة (cedar)", "الجيش (army)", "الحرية (freedom)", "الوطن (homeland)", "العرض العسكري (military parade)"],
    traditions: ["Military parade in downtown Beirut", "Flag-raising ceremonies at schools", "Presidential speech", "Cedar tree planting", "Patriotic songs and concerts"],
    foods: ["منقوشة (manoushe)", "كنافة (knafeh)", "شاورما (shawarma)", "حمص (hummus)", "تبولة (tabbouleh)"],
    greetings: ["عيد استقلال سعيد! (Happy Independence Day!)", "يعيش لبنان! (Long live Lebanon!)", "كلنا للوطن! (We are all for the homeland!)"],
    relatedLessonCategories: ["reading", "vocabulary", "speaking"],
    culturalSignificance: "Independence Day is bittersweet in Lebanon — celebrating sovereignty while acknowledging ongoing challenges. The cedar tree on the flag symbolizes immortality and resilience, qualities the Lebanese identify with deeply.",
    durationDays: 1,
    location: {
      city: "Beirut",
      region: "Beirut Governorate",
      country: "Lebanon",
      coordinates: { lat: 33.8938, lng: 35.5018 },
      famousVenues: ["Martyrs' Square", "Ministry of Defense", "Beiteddine Palace", "Rachaya Citadel (where independence was declared)"],
    },
    history: {
      origin: "On November 22, 1943, Lebanon's leaders were released from French imprisonment after declaring independence. The French mandate had governed Lebanon since 1920 after the fall of the Ottoman Empire.",
      whyTheyCelebrate: "Lebanese celebrate their hard-won independence and the idea of Lebanon as a unique nation — a place where 18 religious sects coexist. Despite all challenges, the concept of Lebanon as a mosaic nation persists.",
      historicalContext: "Lebanon was carved from Ottoman Syria by France (1920). Independence leaders were imprisoned for demanding sovereignty. Their release on November 22, 1943 marked the birth of modern Lebanon. The country has since survived civil war, invasions, and economic collapse.",
      yearEstablished: 1943,
      evolution: "From triumphant celebration → complicated by civil war (1975-1990) → renewed meaning after 2005 Cedar Revolution → today a mix of patriotism and frustration. The diaspora (15 million) celebrates worldwide.",
    },
    music: ["Lebanese national anthem (Kulluna lil-Watan)", "Fairuz - Li Beirut", "Julia Boutros - Ahibba'i"],
    newsStyle: {
      headline: "يعيش لبنان! Lebanon marks Independence Day with cedar pride and hopes for a better tomorrow",
      urgency: "happening_now",
    },
  },
  // GULF ARABIC / EMIRATI (ar-AE)
  {
    id: "uae_national_day",
    name: "UAE National Day",
    nativeName: "اليوم الوطني",
    pronunciation: "el-yowm el-watani",
    month: 12, day: 2,
    languages: ["ar-AE"],
    description: "Celebrates the unification of seven emirates (1971). Massive celebrations with airshows, fireworks, traditional dances, and the entire country draped in red, white, green, and black.",
    vocabulary: ["اليوم الوطني (National Day)", "الاتحاد (union)", "الإمارات (Emirates)", "الشيخ زايد (Sheikh Zayed)", "العلم (flag)", "الوطن (homeland)", "روح الاتحاد (Spirit of the Union)", "اليولة (yowla dance)"],
    traditions: ["Spirit of the Union parade", "Airshow with colored smoke trails", "Traditional yowla dance performances", "Buildings lit in UAE flag colors", "Car parades with flags", "Fireworks over Burj Khalifa"],
    foods: ["مجبوس (machboos — spiced rice)", "لقيمات (luqaimat — sweet dumplings)", "هريس (harees — wheat porridge)", "قهوة عربية (Arabic coffee)", "تمر (dates)"],
    greetings: ["عيد وطني سعيد! (Happy National Day!)", "روح الاتحاد! (Spirit of the Union!)", "يعيش الاتحاد! (Long live the Union!)"],
    relatedLessonCategories: ["vocabulary", "speaking", "reading"],
    culturalSignificance: "UAE National Day celebrates the vision of Sheikh Zayed who united seven desert sheikhdoms into a modern nation in just 50 years. It's about pride in transformation — from pearl divers to a global hub.",
    durationDays: 2,
    location: {
      city: "Abu Dhabi",
      region: "Abu Dhabi",
      country: "United Arab Emirates",
      coordinates: { lat: 24.4539, lng: 54.3773 },
      famousVenues: ["Burj Khalifa (Dubai)", "Abu Dhabi Corniche", "Sheikh Zayed Grand Mosque", "Louvre Abu Dhabi"],
    },
    history: {
      origin: "On December 2, 1971, six Trucial States (Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain, Fujairah) united to form the UAE. Ras Al Khaimah joined in 1972. Sheikh Zayed bin Sultan Al Nahyan was the founding father.",
      whyTheyCelebrate: "Emiratis celebrate the miracle of unity — seven independent sheikhdoms chose to become one nation. Sheikh Zayed's vision transformed a desert with no infrastructure into a global powerhouse in one generation.",
      historicalContext: "Before 1971, the Trucial States were poor pearl-diving communities under British protection. Oil was discovered in the 1950s-60s. Sheikh Zayed used oil wealth to build a modern nation with world-class infrastructure, education, and healthcare.",
      yearEstablished: 1971,
      evolution: "From modest independence celebrations → increasingly spectacular events. The 50th anniversary (2021) featured the world's largest fireworks display. Today it's a week-long celebration with concerts, parades, and the entire country decorated.",
    },
    dances: [
      {
        name: "اليولة (Al Yowla)",
        description: "Traditional Emirati stick dance — men in white kanduras toss and spin rifles or sticks while moving in formation. The movements are precise and martial, celebrating Bedouin warrior heritage. Performed in lines facing each other.",
        music: "Traditional drums (tabl) and tambourines. Call-and-response chanting. The rhythm builds in intensity as the dance progresses. Poetry is recited between movements.",
        attire: "White kandura (traditional Emirati robe), ghutra (headscarf), and agal (black cord). The simplicity of white clothing makes the stick movements the visual focus.",
      },
      {
        name: "العيالة (Al Ayyala)",
        description: "UNESCO-recognized traditional dance — two rows of men face each other, swaying bamboo sticks and chanting poetry in unison. Between them, young girls in traditional dress swing their hair. It's hypnotic and ancient.",
        music: "Drums, tambourines, and brass cymbals. The men chant nabati poetry in call-and-response. The rhythm is slow and steady, building communal trance.",
        attire: "Men in white kanduras with ceremonial swords. Girls in colorful traditional dresses with gold jewelry, their long hair loose for the signature hair-swinging movement.",
      },
    ],
    music: ["Hussain Al Jasmi - Bushret Kheir", "Eida Al Menhali - national songs", "Ahlam - Emirati pride songs"],
    newsStyle: {
      headline: "روح الاتحاد! UAE celebrates National Day with airshows, yowla dances, and Burj Khalifa fireworks",
      urgency: "happening_now",
    },
  },
  {
    id: "eid_fitr_uae",
    name: "Eid al-Fitr (UAE)",
    nativeName: "عيد الفطر",
    pronunciation: "eed el-fitr",
    month: 4, day: 10, isLunar: true,
    languages: ["ar-AE"],
    description: "End of Ramadan in the UAE — family gatherings in majlis, traditional Emirati sweets, عيدية for children, and the unique Gulf tradition of wearing new kanduras and abayas.",
    vocabulary: ["عيد الفطر (Eid al-Fitr)", "المجلس (majlis)", "العيدية (eidiya)", "القهوة (gahwa — coffee)", "اللقيمات (luqaimat)", "الكندورة (kandura)", "العباية (abaya)", "البخور (incense)"],
    traditions: ["Eid prayer at the mosque", "Family gathering in the majlis", "Burning بخور (oud incense)", "Serving قهوة (Arabic coffee) with dates", "Children receive عيدية (money in envelopes)", "Everyone wears new clothes", "Visiting all relatives over 3 days"],
    foods: ["لقيمات (luqaimat — sweet dumplings)", "بلاليط (balaleet — sweet vermicelli)", "هريس (harees)", "ثريد (thareed — bread stew)", "قهوة عربية مع تمر (coffee with dates)"],
    greetings: ["عيدكم مبارك! (Blessed Eid!)", "كل عام وأنتم بخير!", "مبارك عليكم العيد! (Eid blessings upon you!)"],
    relatedLessonCategories: ["vocabulary", "speaking", "grammar"],
    culturalSignificance: "Eid in the UAE centers on the majlis (gathering room) — the heart of Emirati social life. The smell of بخور (oud incense), the taste of قهوة (cardamom coffee), and the warmth of family define Gulf Eid.",
    durationDays: 3,
    location: {
      city: "Dubai",
      region: "Dubai",
      country: "United Arab Emirates",
      coordinates: { lat: 25.2048, lng: 55.2708 },
      famousVenues: ["Sheikh Zayed Grand Mosque (Abu Dhabi)", "Jumeirah Mosque (Dubai)", "Family majlis rooms", "Dubai Mall (Eid shopping)"],
    },
    history: {
      origin: "Islamic celebration adapted to Gulf Bedouin culture. The majlis tradition (communal gathering room) predates Islam — it was where tribes made decisions. Eid transformed the majlis into a space of celebration and generosity.",
      whyTheyCelebrate: "Emiratis celebrate Eid as the culmination of Ramadan's spiritual journey and as an expression of Bedouin hospitality. The majlis is open to everyone — no one is turned away. Generosity (كرم) is the highest Emirati value.",
      historicalContext: "Before oil wealth, Eid in the Gulf was simple — dates, coffee, and family. Today's celebrations are more elaborate but the core values remain: family, generosity, and faith. The UAE government gives public sector workers extended holidays.",
      evolution: "From simple Bedouin celebrations → elaborate modern festivities. Dubai malls host Eid events, hotels offer Eid brunches, and fireworks light up the skyline. But the majlis gathering remains the heart of Emirati Eid.",
    },
    music: ["Hussain Al Jasmi - Eid songs", "Balqees - Eid celebrations", "Traditional Emirati Eid chanting"],
    newsStyle: {
      headline: "عيدكم مبارك! UAE celebrates Eid al-Fitr with majlis gatherings, luqaimat, and oud-scented joy",
      urgency: "happening_now",
    },
  },
  {
    id: "eid_adha_uae",
    name: "Eid al-Adha (UAE)",
    nativeName: "عيد الأضحى",
    pronunciation: "eed el-adha",
    month: 6, day: 17, isLunar: true,
    languages: ["ar-AE"],
    description: "The 'Greater Eid' — sacrifice, pilgrimage connection, and massive family gatherings. Emiratis who performed Hajj are welcomed home as heroes.",
    vocabulary: ["عيد الأضحى (Eid al-Adha)", "الحج (Hajj)", "الأضحية (sacrifice)", "الحاج (pilgrim)", "مكة (Mecca)", "المجلس (majlis)", "اللحم (meat)", "التوزيع (distribution)"],
    traditions: ["Eid prayer and sermon", "Animal sacrifice (usually sheep or camel)", "Distributing meat (1/3 family, 1/3 relatives, 1/3 poor)", "Welcoming Hajj pilgrims home with celebrations", "4-day family gatherings", "Desert camping trips"],
    foods: ["لحم مشوي (grilled meat)", "مجبوس لحم (lamb machboos)", "هريس (harees)", "ثريد (thareed)", "قهوة وتمر (coffee and dates)", "لقيمات (luqaimat)"],
    greetings: ["عيد أضحى مبارك!", "حج مبرور! (to returning pilgrims)", "كل عام وأنتم بخير!", "تقبل الله! (May God accept!)"],
    relatedLessonCategories: ["vocabulary", "speaking", "reading"],
    culturalSignificance: "Eid al-Adha connects Emiratis to their Bedouin roots — sacrifice, generosity, and community. Families who can afford it sacrifice a camel (not just a sheep), reflecting Gulf wealth and tradition.",
    durationDays: 4,
    location: {
      city: "Abu Dhabi",
      region: "Abu Dhabi",
      country: "United Arab Emirates",
      coordinates: { lat: 24.4539, lng: 54.3773 },
      famousVenues: ["Sheikh Zayed Grand Mosque", "Desert camps", "Family farms", "Airport (welcoming Hajj pilgrims)"],
    },
    history: {
      origin: "Commemorates Ibrahim's willingness to sacrifice his son. In the Gulf, the tradition is deeply connected to Hajj — many Emiratis perform Hajj annually, and their return is celebrated by the entire extended family.",
      whyTheyCelebrate: "Emiratis celebrate sacrifice (تضحية) as a core value. The animal sacrifice represents giving your most precious possession for God. The meat distribution ensures no one in the community goes hungry.",
      historicalContext: "Before oil, Bedouin tribes sacrificed their best camel — their most valuable asset. Today, wealthy Emiratis may sacrifice multiple animals and distribute meat to workers, neighbors, and charities. The spirit of generosity scales with wealth.",
      evolution: "The tradition has grown in scale — organized meat distribution to labor camps, charity organizations handling logistics, and social media documentation. But the family gathering in the majlis remains unchanged.",
    },
    music: ["Traditional Eid takbeer (religious chanting)", "Hussain Al Jasmi", "Emirati folk songs"],
    newsStyle: {
      headline: "عيد أضحى مبارك! UAE welcomes Hajj pilgrims home and celebrates with sacrifice, feasts, and desert gatherings",
      urgency: "happening_now",
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export const ALL_CULTURAL_HOLIDAYS: CulturalHoliday[] = [
  ...SPANISH_HOLIDAYS,
  ...SPANISH_DIALECT_HOLIDAYS,
  ...FRENCH_HOLIDAYS,
  ...JAPANESE_HOLIDAYS,
  ...KOREAN_HOLIDAYS,
  ...ITALIAN_HOLIDAYS,
  ...GERMAN_HOLIDAYS,
  ...PORTUGUESE_HOLIDAYS,
  ...MANDARIN_HOLIDAYS,
  ...FRENCH_DIALECT_HOLIDAYS,
  ...PORTUGUESE_DIALECT_HOLIDAYS,
  ...ARABIC_DIALECT_HOLIDAYS,
];

/**
 * Get upcoming holidays for a specific language within the next N days.
 */
export function getUpcomingHolidays(
  languageCode: string,
  daysAhead: number = 14,
  referenceDate?: Date
): CulturalHoliday[] {
  const now = referenceDate || new Date();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const currentDay = now.getDate();

  return ALL_CULTURAL_HOLIDAYS
    .filter(h => h.languages.includes(languageCode))
    .filter(h => {
      // Calculate days until this holiday
      const daysUntil = getDaysUntilHoliday(h, currentMonth, currentDay);
      return daysUntil >= 0 && daysUntil <= daysAhead;
    })
    .sort((a, b) => {
      const daysA = getDaysUntilHoliday(a, currentMonth, currentDay);
      const daysB = getDaysUntilHoliday(b, currentMonth, currentDay);
      return daysA - daysB;
    });
}

/**
 * Get all holidays for a specific language, sorted by date.
 */
export function getAllHolidaysForLanguage(languageCode: string): CulturalHoliday[] {
  return ALL_CULTURAL_HOLIDAYS
    .filter(h => h.languages.includes(languageCode))
    .sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });
}

/**
 * Get the current or most recent holiday (within its duration).
 */
export function getCurrentHoliday(languageCode: string, referenceDate?: Date): CulturalHoliday | null {
  const now = referenceDate || new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  return ALL_CULTURAL_HOLIDAYS
    .filter(h => h.languages.includes(languageCode))
    .find(h => {
      const daysUntil = getDaysUntilHoliday(h, currentMonth, currentDay);
      // Holiday is happening now (within its duration)
      return daysUntil >= -h.durationDays && daysUntil <= 0;
    }) || null;
}

/**
 * Get recommended lesson focus based on upcoming holidays.
 * Returns vocabulary, greetings, and cultural context to inject into lessons.
 */
export function getHolidayLessonRecommendation(languageCode: string, referenceDate?: Date): {
  holiday: CulturalHoliday;
  daysUntil: number;
  suggestedVocabulary: string[];
  suggestedGreeting: string;
  lessonPrompt: string;
} | null {
  const upcoming = getUpcomingHolidays(languageCode, 14, referenceDate);
  if (upcoming.length === 0) return null;

  const holiday = upcoming[0];
  const now = referenceDate || new Date();
  const daysUntil = getDaysUntilHoliday(holiday, now.getMonth() + 1, now.getDate());

  return {
    holiday,
    daysUntil,
    suggestedVocabulary: holiday.vocabulary.slice(0, 5),
    suggestedGreeting: holiday.greetings[0] || "",
    lessonPrompt: `${holiday.nativeName} is in ${daysUntil} days! Learn the vocabulary, traditions, and greetings for this celebration. ${holiday.description}`,
  };
}

// Helper: Calculate days until a holiday (approximate, ignores year boundaries for simplicity)
function getDaysUntilHoliday(holiday: CulturalHoliday, currentMonth: number, currentDay: number): number {
  let holidayDayOfYear = (holiday.month - 1) * 30 + holiday.day;
  let currentDayOfYear = (currentMonth - 1) * 30 + currentDay;

  let diff = holidayDayOfYear - currentDayOfYear;
  // If the holiday has passed this year, calculate days until next year
  if (diff < -holiday.durationDays) {
    diff += 360;
  }
  return diff;
}

/**
 * Get the month name for display.
 */
export function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
}

/**
 * Public wrapper for getDaysUntilHoliday — used by the Live Cultural Feed.
 */
export function getDaysUntilHolidayPublic(holiday: CulturalHoliday, currentMonth: number, currentDay: number): number {
  return getDaysUntilHoliday(holiday, currentMonth, currentDay);
}
