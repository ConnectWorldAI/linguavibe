// ─── Lesson Content Data Module ─────────────────────────────────────────────
// Real grammar explanations, vocabulary exercises, reading passages, and writing prompts
// organized by lesson ID matching the CURRICULUM in lesson-path.tsx

export interface VocabItem {
  word: string;
  translation: string;
  pronunciation?: string;
  gender?: "masculine" | "feminine" | "neutral";
  example?: string;
}

export interface GrammarRule {
  rule: string;
  explanation: string;
  example: string;
  translation: string;
  tip?: string;
}

export interface ReadingPassage {
  title: string;
  text: string;
  questions: { question: string; options: string[]; correct: number }[];
}

export interface WritingPrompt {
  prompt: string;
  hints: string[];
  wordCount: { min: number; max: number };
  exampleAnswer?: string;
}

export interface SpeakingExercise {
  scenario: string;
  prompts: string[];
  modelResponses: string[];
  tips: string[];
}

export interface ListeningExercise {
  title: string;
  transcript: string;
  questions: { question: string; options: string[]; correct: number }[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export interface LessonContent {
  id: string;
  type: "vocabulary" | "grammar" | "reading" | "writing" | "speaking" | "listening";
  title: string;
  introduction: string;
  vocab?: VocabItem[];
  grammar?: GrammarRule[];
  reading?: ReadingPassage;
  writing?: WritingPrompt;
  speaking?: SpeakingExercise;
  listening?: ListeningExercise;
  quiz: QuizQuestion[];
  culturalNote?: string;
}

// ─── A1 Lessons ─────────────────────────────────────────────────────────────
const A1_LESSONS: LessonContent[] = [
  {
    id: "a1_u1_l1",
    type: "vocabulary",
    title: "Hello & Goodbye",
    introduction: "Learn the most essential greetings and farewells. These are the first words you'll use in any conversation.",
    vocab: [
      { word: "Hola", translation: "Hello", pronunciation: "OH-lah", example: "¡Hola! ¿Cómo estás?" },
      { word: "Buenos días", translation: "Good morning", pronunciation: "BWEH-nohs DEE-ahs", example: "Buenos días, señora." },
      { word: "Buenas tardes", translation: "Good afternoon", pronunciation: "BWEH-nahs TAR-dehs", example: "Buenas tardes, profesor." },
      { word: "Buenas noches", translation: "Good evening/night", pronunciation: "BWEH-nahs NOH-chehs", example: "Buenas noches, familia." },
      { word: "Adiós", translation: "Goodbye", pronunciation: "ah-dee-OHS", example: "Adiós, hasta mañana." },
      { word: "Hasta luego", translation: "See you later", pronunciation: "AHS-tah LWEH-goh", example: "Hasta luego, amigo." },
      { word: "Hasta mañana", translation: "See you tomorrow", pronunciation: "AHS-tah mah-NYAH-nah", example: "Hasta mañana en clase." },
      { word: "¿Cómo estás?", translation: "How are you? (informal)", pronunciation: "KOH-moh ehs-TAHS", example: "Hola, ¿cómo estás?" },
      { word: "Bien, gracias", translation: "Fine, thanks", pronunciation: "bee-EHN GRAH-see-ahs", example: "Estoy bien, gracias." },
      { word: "Mucho gusto", translation: "Nice to meet you", pronunciation: "MOO-choh GOOS-toh", example: "Mucho gusto, soy María." },
    ],
    quiz: [
      { id: "q1", question: "How do you say 'Good morning'?", options: ["Buenas noches", "Buenos días", "Buenas tardes", "Hola"], correct: 1, explanation: "'Buenos días' is used from sunrise until noon." },
      { id: "q2", question: "What does 'Hasta luego' mean?", options: ["Hello", "Goodbye forever", "See you later", "Good night"], correct: 2, explanation: "'Hasta luego' literally means 'until later' — a casual farewell." },
      { id: "q3", question: "'Mucho gusto' is used when:", options: ["Saying goodbye", "Meeting someone new", "Ordering food", "Asking for help"], correct: 1, explanation: "You say 'Mucho gusto' when being introduced to someone." },
    ],
    culturalNote: "In Spanish-speaking countries, greetings are very important. It's considered rude to start a conversation without greeting first. A simple 'Hola' or 'Buenos días' goes a long way!",
  },
  {
    id: "a1_u1_l2",
    type: "speaking",
    title: "I Am...",
    introduction: "Practice introducing yourself with your name and nationality. This is your first real conversation in the target language!",
    speaking: {
      scenario: "You're at a language exchange meetup. Introduce yourself to a new person.",
      prompts: [
        "Say hello and give your name",
        "Say where you're from",
        "Ask the other person's name",
        "Say 'nice to meet you'",
      ],
      modelResponses: [
        "¡Hola! Me llamo [your name].",
        "Soy de [your country].",
        "¿Cómo te llamas?",
        "¡Mucho gusto!",
      ],
      tips: [
        "Start with a greeting before introducing yourself",
        "'Me llamo' literally means 'I call myself'",
        "You can also say 'Soy [name]' (I am [name])",
        "Smile and make eye contact — body language matters!",
      ],
    },
    quiz: [
      { id: "q1", question: "How do you say 'My name is...'?", options: ["Soy de...", "Me llamo...", "Tengo...", "Estoy..."], correct: 1 },
      { id: "q2", question: "'Soy de México' means:", options: ["I am Mexican", "I am from Mexico", "I live in Mexico", "I like Mexico"], correct: 1 },
      { id: "q3", question: "To ask someone's name informally:", options: ["¿Cómo se llama?", "¿Cómo te llamas?", "¿Quién eres?", "¿De dónde eres?"], correct: 1 },
    ],
  },
  {
    id: "a1_u1_l3",
    type: "grammar",
    title: "To Be or Not To Be",
    introduction: "Spanish has TWO verbs for 'to be': SER and ESTAR. This lesson covers the present tense of both — one of the most important distinctions in Spanish.",
    grammar: [
      {
        rule: "SER — permanent characteristics",
        explanation: "Use SER for identity, nationality, profession, physical descriptions, and personality traits. These are things that don't change easily.",
        example: "Yo soy estudiante. Ella es alta.",
        translation: "I am a student. She is tall.",
        tip: "Think of SER as 'what something IS' — its essence.",
      },
      {
        rule: "ESTAR — temporary states & location",
        explanation: "Use ESTAR for emotions, conditions, locations, and temporary situations. These can change.",
        example: "Estoy cansado. El libro está en la mesa.",
        translation: "I am tired. The book is on the table.",
        tip: "Think of ESTAR as 'how something IS right now' or 'where it IS'.",
      },
      {
        rule: "SER conjugation",
        explanation: "yo soy, tú eres, él/ella es, nosotros somos, ellos son",
        example: "Nosotros somos amigos.",
        translation: "We are friends.",
      },
      {
        rule: "ESTAR conjugation",
        explanation: "yo estoy, tú estás, él/ella está, nosotros estamos, ellos están",
        example: "¿Dónde estás?",
        translation: "Where are you?",
      },
    ],
    quiz: [
      { id: "q1", question: "Which verb for 'She is happy (right now)'?", options: ["Ella es feliz", "Ella está feliz", "Ella ser feliz", "Ella estar feliz"], correct: 1, explanation: "Emotions are temporary states → use ESTAR." },
      { id: "q2", question: "'Yo ___ de España' (I am from Spain)", options: ["estoy", "soy", "es", "está"], correct: 1, explanation: "Nationality/origin is permanent → use SER." },
      { id: "q3", question: "'El gato ___ en la cocina' (The cat is in the kitchen)", options: ["es", "está", "soy", "son"], correct: 1, explanation: "Location → use ESTAR." },
      { id: "q4", question: "Which is correct: 'Nosotros ___ profesores'?", options: ["estamos", "somos", "están", "son"], correct: 1, explanation: "Profession is identity → use SER with nosotros = somos." },
    ],
    culturalNote: "The SER vs ESTAR distinction doesn't exist in English, which is why it's one of the trickiest concepts for English speakers. Don't worry — with practice, it becomes intuitive!",
  },
  {
    id: "a1_u1_l4",
    type: "vocabulary",
    title: "Numbers 1-20",
    introduction: "Numbers are essential for shopping, telling time, giving your phone number, and more. Let's master 1-20!",
    vocab: [
      { word: "uno", translation: "1 (one)", pronunciation: "OO-noh" },
      { word: "dos", translation: "2 (two)", pronunciation: "dohs" },
      { word: "tres", translation: "3 (three)", pronunciation: "trehs" },
      { word: "cuatro", translation: "4 (four)", pronunciation: "KWAH-troh" },
      { word: "cinco", translation: "5 (five)", pronunciation: "SEEN-koh" },
      { word: "seis", translation: "6 (six)", pronunciation: "says" },
      { word: "siete", translation: "7 (seven)", pronunciation: "see-EH-teh" },
      { word: "ocho", translation: "8 (eight)", pronunciation: "OH-choh" },
      { word: "nueve", translation: "9 (nine)", pronunciation: "NWEH-beh" },
      { word: "diez", translation: "10 (ten)", pronunciation: "dee-EHS" },
      { word: "once", translation: "11 (eleven)", pronunciation: "OHN-seh" },
      { word: "doce", translation: "12 (twelve)", pronunciation: "DOH-seh" },
      { word: "trece", translation: "13 (thirteen)", pronunciation: "TREH-seh" },
      { word: "catorce", translation: "14 (fourteen)", pronunciation: "kah-TOR-seh" },
      { word: "quince", translation: "15 (fifteen)", pronunciation: "KEEN-seh" },
      { word: "dieciséis", translation: "16 (sixteen)", pronunciation: "dee-eh-see-SAYS" },
      { word: "diecisiete", translation: "17 (seventeen)", pronunciation: "dee-eh-see-see-EH-teh" },
      { word: "dieciocho", translation: "18 (eighteen)", pronunciation: "dee-eh-see-OH-choh" },
      { word: "diecinueve", translation: "19 (nineteen)", pronunciation: "dee-eh-see-NWEH-beh" },
      { word: "veinte", translation: "20 (twenty)", pronunciation: "BAYN-teh" },
    ],
    quiz: [
      { id: "q1", question: "What is 'quince'?", options: ["14", "15", "16", "17"], correct: 1 },
      { id: "q2", question: "How do you say '8'?", options: ["ocho", "once", "nueve", "seis"], correct: 0 },
      { id: "q3", question: "'Diecisiete' is:", options: ["16", "17", "18", "19"], correct: 1 },
      { id: "q4", question: "What comes after 'doce'?", options: ["once", "trece", "catorce", "diez"], correct: 1 },
    ],
  },
  {
    id: "a1_u1_l5",
    type: "listening",
    title: "Listening: At the Café",
    introduction: "Listen to a simple conversation at a café and answer questions about what you hear.",
    listening: {
      title: "Ordering at Café Sol",
      transcript: "Camarero: ¡Buenos días! ¿Qué desea?\nCliente: Buenos días. Quiero un café con leche, por favor.\nCamarero: ¿Grande o pequeño?\nCliente: Grande, por favor. Y un croissant.\nCamarero: Muy bien. Son tres euros cincuenta.\nCliente: Aquí tiene. Gracias.\nCamarero: ¡Gracias a usted! Buen día.",
      questions: [
        { question: "What does the customer order to drink?", options: ["Tea", "Coffee with milk", "Orange juice", "Water"], correct: 1 },
        { question: "What size does the customer want?", options: ["Small", "Medium", "Large", "Extra large"], correct: 2 },
        { question: "How much does it cost?", options: ["€2.50", "€3.00", "€3.50", "€4.00"], correct: 2 },
        { question: "What food does the customer order?", options: ["A sandwich", "A croissant", "A cake", "Nothing"], correct: 1 },
      ],
    },
    quiz: [
      { id: "q1", question: "'¿Qué desea?' means:", options: ["How are you?", "What would you like?", "Where are you?", "What's your name?"], correct: 1 },
      { id: "q2", question: "'Grande' means:", options: ["Small", "Medium", "Large", "Hot"], correct: 2 },
      { id: "q3", question: "'Aquí tiene' is used when:", options: ["Saying hello", "Handing something over", "Asking a question", "Saying goodbye"], correct: 1 },
    ],
  },
  // A1 Unit 2 Lessons
  {
    id: "a1_u2_l1",
    type: "vocabulary",
    title: "My Family",
    introduction: "Family is central to many cultures. Learn how to talk about your family members.",
    vocab: [
      { word: "la madre / mamá", translation: "mother / mom", gender: "feminine" },
      { word: "el padre / papá", translation: "father / dad", gender: "masculine" },
      { word: "la hermana", translation: "sister", gender: "feminine" },
      { word: "el hermano", translation: "brother", gender: "masculine" },
      { word: "la abuela", translation: "grandmother", gender: "feminine" },
      { word: "el abuelo", translation: "grandfather", gender: "masculine" },
      { word: "la hija", translation: "daughter", gender: "feminine" },
      { word: "el hijo", translation: "son", gender: "masculine" },
      { word: "la tía", translation: "aunt", gender: "feminine" },
      { word: "el tío", translation: "uncle", gender: "masculine" },
      { word: "la prima", translation: "female cousin", gender: "feminine" },
      { word: "el primo", translation: "male cousin", gender: "masculine" },
    ],
    quiz: [
      { id: "q1", question: "'La abuela' is:", options: ["Aunt", "Grandmother", "Sister", "Mother"], correct: 1 },
      { id: "q2", question: "How do you say 'brother'?", options: ["el primo", "el hermano", "el hijo", "el tío"], correct: 1 },
      { id: "q3", question: "'El tío' means:", options: ["Cousin", "Father", "Uncle", "Grandfather"], correct: 2 },
    ],
  },
  {
    id: "a1_u2_l2",
    type: "grammar",
    title: "Present Tense Verbs",
    introduction: "Regular verbs in Spanish follow predictable patterns. Learn the three conjugation groups: -AR, -ER, and -IR verbs.",
    grammar: [
      {
        rule: "-AR verbs (hablar = to speak)",
        explanation: "yo hablo, tú hablas, él/ella habla, nosotros hablamos, ellos hablan",
        example: "Yo hablo español.",
        translation: "I speak Spanish.",
        tip: "Most Spanish verbs are -AR verbs. Master this pattern first!",
      },
      {
        rule: "-ER verbs (comer = to eat)",
        explanation: "yo como, tú comes, él/ella come, nosotros comemos, ellos comen",
        example: "Nosotros comemos a las dos.",
        translation: "We eat at two o'clock.",
      },
      {
        rule: "-IR verbs (vivir = to live)",
        explanation: "yo vivo, tú vives, él/ella vive, nosotros vivimos, ellos viven",
        example: "Ella vive en Madrid.",
        translation: "She lives in Madrid.",
        tip: "-IR verbs are almost identical to -ER verbs except in the nosotros form.",
      },
    ],
    quiz: [
      { id: "q1", question: "'Yo hablo' means:", options: ["I eat", "I speak", "I live", "I write"], correct: 1 },
      { id: "q2", question: "Conjugate 'comer' for 'nosotros':", options: ["comemos", "comimos", "comen", "comes"], correct: 0 },
      { id: "q3", question: "'Ella vive en París' means:", options: ["She eats in Paris", "She speaks in Paris", "She lives in Paris", "She works in Paris"], correct: 2 },
      { id: "q4", question: "Which is an -AR verb?", options: ["comer", "vivir", "estudiar", "escribir"], correct: 2 },
    ],
  },
  {
    id: "a1_u2_l3",
    type: "writing",
    title: "My Daily Routine",
    introduction: "Practice writing about what you do every day using present tense verbs and time expressions.",
    writing: {
      prompt: "Write about your typical day. Include at least 5 activities with times. Use present tense verbs you've learned.",
      hints: [
        "Start with when you wake up: 'Me despierto a las...'",
        "Include meals: 'Desayuno a las...' (I have breakfast at...)",
        "Mention work or school: 'Trabajo/Estudio de... a...'",
        "Include evening activities: 'Por la noche...'",
        "End with bedtime: 'Me acuesto a las...'",
      ],
      wordCount: { min: 30, max: 80 },
      exampleAnswer: "Me despierto a las siete. Desayuno a las siete y media. Estudio español de nueve a once. Como a las dos. Por la tarde, camino en el parque. Ceno a las ocho. Me acuesto a las once.",
    },
    quiz: [
      { id: "q1", question: "'Me despierto' means:", options: ["I eat", "I wake up", "I sleep", "I study"], correct: 1 },
      { id: "q2", question: "'Por la noche' means:", options: ["In the morning", "In the afternoon", "At night", "At noon"], correct: 2 },
      { id: "q3", question: "'Desayuno' refers to:", options: ["Lunch", "Dinner", "Breakfast", "Snack"], correct: 2 },
    ],
  },
  {
    id: "a1_u2_l4",
    type: "vocabulary",
    title: "Around the House",
    introduction: "Learn the names of rooms and common furniture to describe your home.",
    vocab: [
      { word: "la cocina", translation: "kitchen", gender: "feminine" },
      { word: "el baño", translation: "bathroom", gender: "masculine" },
      { word: "el dormitorio", translation: "bedroom", gender: "masculine" },
      { word: "la sala", translation: "living room", gender: "feminine" },
      { word: "el comedor", translation: "dining room", gender: "masculine" },
      { word: "la mesa", translation: "table", gender: "feminine" },
      { word: "la silla", translation: "chair", gender: "feminine" },
      { word: "la cama", translation: "bed", gender: "feminine" },
      { word: "el sofá", translation: "sofa/couch", gender: "masculine" },
      { word: "la ventana", translation: "window", gender: "feminine" },
      { word: "la puerta", translation: "door", gender: "feminine" },
      { word: "el jardín", translation: "garden", gender: "masculine" },
    ],
    quiz: [
      { id: "q1", question: "'La cocina' is the:", options: ["Bedroom", "Kitchen", "Bathroom", "Garden"], correct: 1 },
      { id: "q2", question: "Where do you sleep?", options: ["el comedor", "la sala", "el dormitorio", "el baño"], correct: 2 },
      { id: "q3", question: "'La ventana' is a:", options: ["Door", "Window", "Table", "Chair"], correct: 1 },
    ],
  },
  {
    id: "a1_u2_l5",
    type: "reading",
    title: "Reading: A Postcard",
    introduction: "Read a simple postcard from a friend on vacation and answer comprehension questions.",
    reading: {
      title: "Postcard from Barcelona",
      text: "¡Hola María!\n\n¿Cómo estás? Estoy en Barcelona con mi familia. La ciudad es muy bonita. Hoy visitamos la Sagrada Familia — ¡es increíble! El hotel está cerca de la playa. Por la mañana, desayunamos en un café pequeño. La comida aquí es deliciosa. Mañana vamos al Parque Güell.\n\n¡Hasta pronto!\nCarlos",
      questions: [
        { question: "Where is Carlos?", options: ["Madrid", "Barcelona", "Valencia", "Sevilla"], correct: 1 },
        { question: "Who is he traveling with?", options: ["Friends", "Alone", "His family", "His teacher"], correct: 2 },
        { question: "What did they visit today?", options: ["The beach", "Parque Güell", "La Sagrada Familia", "A museum"], correct: 2 },
        { question: "Where is the hotel?", options: ["In the center", "Near the beach", "Near the airport", "In the mountains"], correct: 1 },
      ],
    },
    quiz: [
      { id: "q1", question: "'Bonita' means:", options: ["Big", "Beautiful", "Boring", "Busy"], correct: 1 },
      { id: "q2", question: "'Mañana vamos al...' means:", options: ["Yesterday we went to...", "Tomorrow we go to...", "Today we are at...", "We want to go to..."], correct: 1 },
      { id: "q3", question: "'Hasta pronto' means:", options: ["See you soon", "Goodbye forever", "Thank you", "I miss you"], correct: 0 },
    ],
  },
];

// ─── A2 Lessons ─────────────────────────────────────────────────────────────
const A2_LESSONS: LessonContent[] = [
  {
    id: "a2_u1_l1",
    type: "speaking",
    title: "Asking for Directions",
    introduction: "Navigate a new city by asking for and understanding directions. Essential for any traveler!",
    speaking: {
      scenario: "You're lost in a city and need to find the train station. Ask a passerby for help.",
      prompts: [
        "Get their attention politely",
        "Ask where the train station is",
        "Ask if it's far",
        "Thank them",
      ],
      modelResponses: [
        "Disculpe, ¿puede ayudarme?",
        "¿Dónde está la estación de tren?",
        "¿Está lejos de aquí?",
        "Muchas gracias por su ayuda.",
      ],
      tips: [
        "Use 'Disculpe' (Excuse me) to politely get attention",
        "'¿Dónde está...?' is the key phrase for asking locations",
        "Direction words: derecha (right), izquierda (left), recto (straight)",
        "Always thank people: 'Gracias' or 'Muchas gracias'",
      ],
    },
    quiz: [
      { id: "q1", question: "'Disculpe' is used to:", options: ["Say goodbye", "Get someone's attention politely", "Order food", "Introduce yourself"], correct: 1 },
      { id: "q2", question: "'A la derecha' means:", options: ["To the left", "Straight ahead", "To the right", "Behind"], correct: 2 },
      { id: "q3", question: "'¿Está lejos?' asks:", options: ["Is it open?", "Is it far?", "Is it expensive?", "Is it big?"], correct: 1 },
    ],
  },
  {
    id: "a2_u1_l2",
    type: "grammar",
    title: "Past Tense Basics",
    introduction: "Learn the preterite tense to talk about completed actions in the past. This opens up storytelling!",
    grammar: [
      {
        rule: "Preterite -AR verbs (hablar → hablé)",
        explanation: "yo hablé, tú hablaste, él/ella habló, nosotros hablamos, ellos hablaron",
        example: "Ayer hablé con mi madre.",
        translation: "Yesterday I spoke with my mother.",
        tip: "Notice: nosotros is the same in present and preterite for -AR verbs!",
      },
      {
        rule: "Preterite -ER/-IR verbs (comer → comí)",
        explanation: "yo comí, tú comiste, él/ella comió, nosotros comimos, ellos comieron",
        example: "Comimos en un restaurante italiano.",
        translation: "We ate at an Italian restaurant.",
      },
      {
        rule: "Time markers for preterite",
        explanation: "ayer (yesterday), la semana pasada (last week), el año pasado (last year), anoche (last night)",
        example: "Anoche estudié dos horas.",
        translation: "Last night I studied for two hours.",
        tip: "These time markers signal that you should use the preterite.",
      },
    ],
    quiz: [
      { id: "q1", question: "'Ayer comí pizza' means:", options: ["Yesterday I eat pizza", "Yesterday I ate pizza", "I will eat pizza", "I'm eating pizza"], correct: 1 },
      { id: "q2", question: "Preterite of 'hablar' for 'tú':", options: ["hablaste", "hablé", "habló", "hablaron"], correct: 0 },
      { id: "q3", question: "'La semana pasada' means:", options: ["Next week", "This week", "Last week", "Every week"], correct: 2 },
    ],
  },
  {
    id: "a2_u1_l3",
    type: "vocabulary",
    title: "Transportation",
    introduction: "Learn vocabulary for getting around: buses, trains, taxis, and more.",
    vocab: [
      { word: "el autobús", translation: "bus", gender: "masculine" },
      { word: "el tren", translation: "train", gender: "masculine" },
      { word: "el taxi", translation: "taxi", gender: "masculine" },
      { word: "el metro", translation: "subway/metro", gender: "masculine" },
      { word: "el avión", translation: "airplane", gender: "masculine" },
      { word: "la bicicleta", translation: "bicycle", gender: "feminine" },
      { word: "la estación", translation: "station", gender: "feminine" },
      { word: "la parada", translation: "stop (bus stop)", gender: "feminine" },
      { word: "el billete", translation: "ticket", gender: "masculine" },
      { word: "el andén", translation: "platform", gender: "masculine" },
      { word: "la salida", translation: "exit/departure", gender: "feminine" },
      { word: "la llegada", translation: "arrival", gender: "feminine" },
    ],
    quiz: [
      { id: "q1", question: "'El billete' is:", options: ["The bus", "The ticket", "The station", "The platform"], correct: 1 },
      { id: "q2", question: "Where do you wait for a bus?", options: ["la estación", "la parada", "el andén", "la salida"], correct: 1 },
      { id: "q3", question: "'La llegada' means:", options: ["Departure", "Arrival", "Delay", "Transfer"], correct: 1 },
    ],
  },
  {
    id: "a2_u1_l4",
    type: "reading",
    title: "Reading: City Map",
    introduction: "Read written directions and follow them on a mental map to find your destination.",
    reading: {
      title: "Finding the Museum",
      text: "Para llegar al museo desde el hotel, siga estas instrucciones:\n\nSalga del hotel y gire a la derecha. Camine recto por la Calle Mayor durante dos manzanas. En el semáforo, gire a la izquierda. El museo está al final de la calle, a la derecha. Está entre la biblioteca y el parque. El museo abre a las diez de la mañana y cierra a las seis de la tarde. La entrada cuesta cinco euros para adultos y es gratis para niños.",
      questions: [
        { question: "Which direction do you turn first?", options: ["Left", "Right", "Straight", "Back"], correct: 1 },
        { question: "How many blocks do you walk on Calle Mayor?", options: ["One", "Two", "Three", "Four"], correct: 1 },
        { question: "The museum is between:", options: ["A café and a park", "The library and the park", "Two restaurants", "The hotel and a shop"], correct: 1 },
        { question: "How much is adult admission?", options: ["Free", "€3", "€5", "€10"], correct: 2 },
      ],
    },
    quiz: [
      { id: "q1", question: "'Gire a la derecha' means:", options: ["Turn left", "Turn right", "Go straight", "Stop here"], correct: 1 },
      { id: "q2", question: "'Manzana' in directions means:", options: ["Apple", "Block", "Street", "Corner"], correct: 1 },
      { id: "q3", question: "'Gratis' means:", options: ["Expensive", "Cheap", "Free", "Closed"], correct: 2 },
    ],
  },
  {
    id: "a2_u1_l5",
    type: "writing",
    title: "Write a Travel Plan",
    introduction: "Practice writing about a future trip using the near future tense (ir + a + infinitive).",
    writing: {
      prompt: "Write about a trip you're planning. Include: where you're going, how you'll travel, what you'll do, and who you're going with.",
      hints: [
        "Use 'Voy a...' (I'm going to...) for future plans",
        "Include transportation: 'Voy a viajar en...' (I'm going to travel by...)",
        "Mention activities: 'Voy a visitar...' (I'm going to visit...)",
        "Include companions: 'Voy con...' (I'm going with...)",
        "Add time: 'El próximo mes...' (Next month...)",
      ],
      wordCount: { min: 40, max: 100 },
      exampleAnswer: "El próximo mes voy a viajar a Barcelona con mi amiga. Vamos a ir en tren. Voy a visitar la Sagrada Familia y el Parque Güell. También vamos a comer paella en un restaurante cerca de la playa. Voy a tomar muchas fotos.",
    },
    quiz: [
      { id: "q1", question: "'Voy a viajar' means:", options: ["I traveled", "I'm going to travel", "I travel", "I want to travel"], correct: 1 },
      { id: "q2", question: "'El próximo mes' means:", options: ["Last month", "This month", "Next month", "Every month"], correct: 2 },
      { id: "q3", question: "'También' means:", options: ["But", "Also", "However", "Never"], correct: 1 },
    ],
  },
  // A2 Unit 2
  {
    id: "a2_u2_l1",
    type: "vocabulary",
    title: "At the Market",
    introduction: "Learn food vocabulary and quantity expressions for shopping at markets and grocery stores.",
    vocab: [
      { word: "las frutas", translation: "fruits", gender: "feminine" },
      { word: "las verduras", translation: "vegetables", gender: "feminine" },
      { word: "la carne", translation: "meat", gender: "feminine" },
      { word: "el pescado", translation: "fish", gender: "masculine" },
      { word: "el pan", translation: "bread", gender: "masculine" },
      { word: "el queso", translation: "cheese", gender: "masculine" },
      { word: "un kilo de...", translation: "a kilo of...", example: "Un kilo de manzanas, por favor." },
      { word: "medio kilo", translation: "half a kilo" },
      { word: "una docena", translation: "a dozen" },
      { word: "¿Cuánto cuesta?", translation: "How much does it cost?" },
      { word: "barato", translation: "cheap" },
      { word: "caro", translation: "expensive" },
    ],
    quiz: [
      { id: "q1", question: "'¿Cuánto cuesta?' asks:", options: ["Where is it?", "How much does it cost?", "Do you have it?", "Is it fresh?"], correct: 1 },
      { id: "q2", question: "'Las verduras' are:", options: ["Fruits", "Meats", "Vegetables", "Breads"], correct: 2 },
      { id: "q3", question: "'Caro' means:", options: ["Cheap", "Fresh", "Expensive", "Delicious"], correct: 2 },
    ],
  },
  {
    id: "a2_u2_l2",
    type: "grammar",
    title: "Comparatives",
    introduction: "Learn to compare things: bigger, smaller, better, worse, more, less.",
    grammar: [
      {
        rule: "más + adjective + que (more...than)",
        explanation: "Use 'más...que' to say something has MORE of a quality than something else.",
        example: "Madrid es más grande que Barcelona.",
        translation: "Madrid is bigger than Barcelona.",
      },
      {
        rule: "menos + adjective + que (less...than)",
        explanation: "Use 'menos...que' to say something has LESS of a quality.",
        example: "El tren es menos rápido que el avión.",
        translation: "The train is less fast than the airplane.",
      },
      {
        rule: "Irregular comparatives",
        explanation: "mejor (better), peor (worse), mayor (older/bigger), menor (younger/smaller)",
        example: "Este restaurante es mejor que el otro.",
        translation: "This restaurant is better than the other one.",
        tip: "Don't say 'más bueno' — say 'mejor'. Don't say 'más malo' — say 'peor'.",
      },
    ],
    quiz: [
      { id: "q1", question: "'Más grande que' means:", options: ["Smaller than", "Bigger than", "As big as", "The biggest"], correct: 1 },
      { id: "q2", question: "The correct comparative of 'bueno' is:", options: ["más bueno", "mejor", "buenísimo", "lo bueno"], correct: 1 },
      { id: "q3", question: "'El café es menos caro que el vino' means:", options: ["Coffee is more expensive than wine", "Coffee is less expensive than wine", "Coffee is as expensive as wine", "Coffee and wine cost the same"], correct: 1 },
    ],
  },
  {
    id: "a2_u2_l3",
    type: "speaking",
    title: "Ordering Food",
    introduction: "Practice ordering food at a restaurant — from getting a table to paying the bill.",
    speaking: {
      scenario: "You're at a restaurant with a friend. Order food, ask about dishes, and request the bill.",
      prompts: [
        "Ask for a table for two",
        "Ask what the waiter recommends",
        "Order your main course and drink",
        "Ask for the bill",
      ],
      modelResponses: [
        "Buenas tardes. Una mesa para dos, por favor.",
        "¿Qué nos recomienda?",
        "Para mí, la paella y un vaso de vino tinto, por favor.",
        "La cuenta, por favor.",
      ],
      tips: [
        "'Para mí...' (For me...) is the polite way to order",
        "'¿Qué recomienda?' — asking for recommendations shows cultural awareness",
        "In Spain, you usually have to ask for the bill — they won't bring it automatically",
        "'Propina' (tip) is not always expected but appreciated",
      ],
    },
    quiz: [
      { id: "q1", question: "'La cuenta, por favor' asks for:", options: ["The menu", "The bill", "More water", "A table"], correct: 1 },
      { id: "q2", question: "'¿Qué recomienda?' means:", options: ["What's cheap?", "What do you recommend?", "What's available?", "What's popular?"], correct: 1 },
      { id: "q3", question: "'Para mí' means:", options: ["For you", "For us", "For me", "For them"], correct: 2 },
    ],
  },
  {
    id: "a2_u2_l4",
    type: "listening",
    title: "Listening: Shopping Trip",
    introduction: "Listen to a conversation between a customer and a shopkeeper at a market.",
    listening: {
      title: "At the Fruit Market",
      transcript: "Vendedor: ¡Buenos días! ¿Qué le pongo?\nCliente: Buenos días. Quiero un kilo de manzanas y medio kilo de fresas.\nVendedor: Aquí tiene. ¿Algo más?\nCliente: Sí, ¿tiene plátanos?\nVendedor: Sí, están muy frescos hoy. ¿Cuántos quiere?\nCliente: Seis, por favor. ¿Cuánto es todo?\nVendedor: Son cuatro euros con veinte céntimos.\nCliente: Aquí tiene un billete de cinco.\nVendedor: Su cambio: ochenta céntimos. ¡Gracias y buen día!",
      questions: [
        { question: "What fruits does the customer buy?", options: ["Apples, strawberries, and bananas", "Oranges and grapes", "Only apples", "Bananas and pears"], correct: 0 },
        { question: "How many bananas?", options: ["3", "4", "5", "6"], correct: 3 },
        { question: "How much is the total?", options: ["€3.20", "€4.20", "€5.00", "€4.80"], correct: 1 },
        { question: "How much change does the customer get?", options: ["€0.20", "€0.50", "€0.80", "€1.00"], correct: 2 },
      ],
    },
    quiz: [
      { id: "q1", question: "'¿Qué le pongo?' means:", options: ["How are you?", "What can I get you?", "How much?", "Anything else?"], correct: 1 },
      { id: "q2", question: "'¿Algo más?' means:", options: ["How much?", "That's all", "Anything else?", "Is it fresh?"], correct: 2 },
      { id: "q3", question: "'El cambio' means:", options: ["The bill", "The change", "The receipt", "The bag"], correct: 1 },
    ],
  },
  {
    id: "a2_u2_l5",
    type: "writing",
    title: "Write a Review",
    introduction: "Write a simple restaurant review using comparatives and opinion expressions.",
    writing: {
      prompt: "Write a review of a restaurant you visited. Include: the name, what you ordered, what you liked/didn't like, and whether you'd recommend it.",
      hints: [
        "Start with the restaurant name and type: 'Fui a...' (I went to...)",
        "Describe the food: 'La comida fue...' (The food was...)",
        "Use comparatives: 'mejor que', 'más rico que'",
        "Give your opinion: 'Me gustó...' (I liked...) / 'No me gustó...'",
        "End with a recommendation: 'Recomiendo...' (I recommend...)",
      ],
      wordCount: { min: 40, max: 100 },
      exampleAnswer: "Fui al restaurante 'El Sol' con mi familia. Pedí la paella y mi madre pidió el pescado. La paella fue deliciosa — mejor que en otros restaurantes. El servicio fue un poco lento, pero los camareros fueron muy amables. Los precios son buenos. Recomiendo este restaurante para una cena especial.",
    },
    quiz: [
      { id: "q1", question: "'Me gustó' means:", options: ["I want", "I liked", "I ate", "I recommend"], correct: 1 },
      { id: "q2", question: "'Recomiendo' means:", options: ["I remember", "I recommend", "I return", "I request"], correct: 1 },
      { id: "q3", question: "'El servicio fue lento' means:", options: ["The food was cold", "The service was slow", "The price was high", "The waiter was rude"], correct: 1 },
    ],
  },
];

// ─── B1 Lessons ─────────────────────────────────────────────────────────────
const B1_LESSONS: LessonContent[] = [
  {
    id: "b1_u1_l1",
    type: "vocabulary",
    title: "Opinion Phrases",
    introduction: "Express your views confidently with these essential opinion and debate phrases.",
    vocab: [
      { word: "En mi opinión...", translation: "In my opinion...", example: "En mi opinión, la educación es muy importante." },
      { word: "Creo que...", translation: "I believe that...", example: "Creo que tienes razón." },
      { word: "Me parece que...", translation: "It seems to me that...", example: "Me parece que es una buena idea." },
      { word: "Estoy de acuerdo", translation: "I agree", example: "Estoy de acuerdo contigo." },
      { word: "No estoy de acuerdo", translation: "I disagree", example: "No estoy de acuerdo con esa política." },
      { word: "Por un lado... por otro lado", translation: "On one hand... on the other hand" },
      { word: "Sin embargo", translation: "However/Nevertheless" },
      { word: "Además", translation: "Furthermore/Also" },
      { word: "En conclusión", translation: "In conclusion" },
      { word: "Según...", translation: "According to..." },
    ],
    quiz: [
      { id: "q1", question: "'Sin embargo' means:", options: ["Therefore", "However", "Also", "Finally"], correct: 1 },
      { id: "q2", question: "To agree, you say:", options: ["No estoy de acuerdo", "Estoy de acuerdo", "Me parece mal", "No creo"], correct: 1 },
      { id: "q3", question: "'Además' is used to:", options: ["Contrast", "Add information", "Conclude", "Disagree"], correct: 1 },
    ],
  },
  {
    id: "b1_u1_l2",
    type: "grammar",
    title: "Subjunctive Mood",
    introduction: "The subjunctive is used for wishes, doubts, emotions, and hypothetical situations. It's a hallmark of intermediate Spanish.",
    grammar: [
      {
        rule: "Subjunctive after 'querer que' (to want someone to...)",
        explanation: "When the subject of 'wanting' is different from who does the action, use subjunctive.",
        example: "Quiero que tú vengas a la fiesta.",
        translation: "I want you to come to the party.",
        tip: "If it's the same person wanting AND doing, use infinitive: 'Quiero ir' (I want to go).",
      },
      {
        rule: "Subjunctive after doubt: 'no creo que'",
        explanation: "Expressions of doubt trigger the subjunctive in the subordinate clause.",
        example: "No creo que sea verdad.",
        translation: "I don't think it's true.",
      },
      {
        rule: "Subjunctive after emotions: 'me alegra que'",
        explanation: "Emotional reactions about someone else's actions use subjunctive.",
        example: "Me alegra que estés aquí.",
        translation: "I'm glad you're here.",
      },
      {
        rule: "Present subjunctive formation",
        explanation: "-AR verbs: -e, -es, -e, -emos, -en. -ER/-IR verbs: -a, -as, -a, -amos, -an",
        example: "hablar → hable, comer → coma, vivir → viva",
        translation: "Flip the vowel: -AR gets -e endings, -ER/-IR get -a endings.",
      },
    ],
    quiz: [
      { id: "q1", question: "'Quiero que vengas' uses subjunctive because:", options: ["It's past tense", "Two different subjects", "It's a question", "It's negative"], correct: 1 },
      { id: "q2", question: "Subjunctive of 'hablar' (yo):", options: ["hablo", "hable", "hablé", "hablaré"], correct: 1 },
      { id: "q3", question: "'No creo que ___ verdad' (ser):", options: ["es", "sea", "fue", "será"], correct: 1 },
    ],
    culturalNote: "The subjunctive is used much more in Spanish than in English. Native speakers use it naturally in everyday conversation — mastering it will make you sound significantly more fluent.",
  },
  {
    id: "b1_u1_l3",
    type: "speaking",
    title: "Debate Practice",
    introduction: "Practice arguing for and against a topic using opinion phrases and the subjunctive.",
    speaking: {
      scenario: "Debate topic: 'Should social media be banned for children under 16?' Argue BOTH sides.",
      prompts: [
        "State your position clearly",
        "Give your first argument with evidence",
        "Acknowledge the opposing view",
        "Conclude with your final opinion",
      ],
      modelResponses: [
        "En mi opinión, las redes sociales no deberían estar prohibidas para menores de 16 años.",
        "Creo que las redes sociales pueden ser educativas. Además, los jóvenes necesitan aprender a usarlas responsablemente.",
        "Sin embargo, entiendo que hay riesgos. Es posible que algunos niños sean vulnerables al ciberacoso.",
        "En conclusión, creo que la solución no es prohibir, sino educar y supervisar.",
      ],
      tips: [
        "Use 'En mi opinión' or 'Creo que' to state your view",
        "Use 'Además' to add supporting points",
        "Use 'Sin embargo' to acknowledge the other side",
        "Use 'En conclusión' to wrap up your argument",
      ],
    },
    quiz: [
      { id: "q1", question: "To acknowledge an opposing view:", options: ["Además...", "Sin embargo...", "En conclusión...", "Creo que..."], correct: 1 },
      { id: "q2", question: "'Deberían' expresses:", options: ["Past action", "Should/ought to", "Will definitely", "Always do"], correct: 1 },
      { id: "q3", question: "A good debate structure is:", options: ["Opinion only", "Evidence only", "Opinion → Evidence → Counter → Conclusion", "Question → Answer"], correct: 2 },
    ],
  },
  {
    id: "b1_u1_l4",
    type: "reading",
    title: "Reading: News Article",
    introduction: "Read an opinion piece from a Spanish newspaper and identify the author's arguments.",
    reading: {
      title: "El Futuro del Trabajo Remoto",
      text: "Según un estudio reciente, el 60% de los trabajadores españoles prefiere trabajar desde casa al menos tres días por semana. Las empresas que ofrecen flexibilidad tienen menos rotación de personal.\n\nSin embargo, no todos están de acuerdo. Algunos expertos creen que el trabajo remoto puede afectar la creatividad y la colaboración. 'Es difícil que un equipo innove si nunca se ve en persona', dice la profesora García de la Universidad de Madrid.\n\nEn mi opinión, la solución es un modelo híbrido. Los empleados necesitan flexibilidad, pero también necesitan conexión humana. Las empresas que encuentren este equilibrio serán las más exitosas en el futuro.",
      questions: [
        { question: "What percentage prefer remote work?", options: ["40%", "50%", "60%", "70%"], correct: 2 },
        { question: "What concern do some experts have?", options: ["Cost", "Security", "Creativity and collaboration", "Technology"], correct: 2 },
        { question: "What solution does the author propose?", options: ["Full remote", "Full office", "Hybrid model", "Shorter hours"], correct: 2 },
        { question: "The tone of the article is:", options: ["Angry", "Balanced/moderate", "Humorous", "Pessimistic"], correct: 1 },
      ],
    },
    quiz: [
      { id: "q1", question: "'Según un estudio' means:", options: ["Despite a study", "According to a study", "Without a study", "Before a study"], correct: 1 },
      { id: "q2", question: "'Rotación de personal' refers to:", options: ["Shift work", "Employee turnover", "Job rotation", "Training"], correct: 1 },
      { id: "q3", question: "'Equilibrio' means:", options: ["Equipment", "Balance", "Quality", "Equality"], correct: 1 },
    ],
  },
  {
    id: "b1_u1_l5",
    type: "writing",
    title: "Write an Essay",
    introduction: "Write a structured argumentative essay with introduction, body paragraphs, and conclusion.",
    writing: {
      prompt: "Write a short essay (80-120 words) on: 'Is it better to learn a language through apps or in a classroom?' Include arguments for both sides and your conclusion.",
      hints: [
        "Introduction: State the topic and your position",
        "Paragraph 1: Arguments FOR apps (flexibility, cost, pace)",
        "Paragraph 2: Arguments FOR classroom (interaction, motivation, feedback)",
        "Conclusion: Your final opinion using 'En conclusión...'",
        "Use connectors: además, sin embargo, por otro lado, en conclusión",
      ],
      wordCount: { min: 80, max: 120 },
      exampleAnswer: "Hoy en día, muchas personas aprenden idiomas con aplicaciones. En mi opinión, ambos métodos tienen ventajas.\n\nPor un lado, las aplicaciones son más flexibles y baratas. Puedes estudiar a cualquier hora y a tu propio ritmo. Además, hay muchos recursos interactivos.\n\nPor otro lado, las clases ofrecen interacción humana y corrección inmediata. Un profesor puede adaptar las lecciones a tus necesidades.\n\nEn conclusión, creo que la mejor opción es combinar ambos: usar aplicaciones para práctica diaria y clases para conversación y gramática avanzada.",
    },
    quiz: [
      { id: "q1", question: "A good essay needs:", options: ["Only your opinion", "Only facts", "Introduction, body, conclusion", "A title only"], correct: 2 },
      { id: "q2", question: "'Por un lado... por otro lado' is used to:", options: ["Agree", "Present two sides", "Conclude", "Ask a question"], correct: 1 },
      { id: "q3", question: "'A tu propio ritmo' means:", options: ["Very fast", "At your own pace", "With a teacher", "In a group"], correct: 1 },
    ],
  },
];

// ─── B1 Unit 2 Lessons ──────────────────────────────────────────────────────
const B1_U2_LESSONS: LessonContent[] = [
  {
    id: "b1_u2_l1",
    type: "vocabulary",
    title: "Job Vocabulary",
    introduction: "Master essential vocabulary for discussing professions, skills, and qualifications in professional settings.",
    vocab: [
      { word: "el puesto", translation: "position/job", gender: "masculine", example: "Solicité el puesto de gerente." },
      { word: "la entrevista", translation: "interview", gender: "feminine", example: "Tengo una entrevista mañana." },
      { word: "el currículum", translation: "resume/CV", gender: "masculine", example: "Envié mi currículum por correo." },
      { word: "la experiencia", translation: "experience", gender: "feminine", example: "Tengo cinco años de experiencia." },
      { word: "el sueldo", translation: "salary", gender: "masculine", example: "El sueldo es negociable." },
      { word: "las habilidades", translation: "skills", gender: "feminine", example: "Mis habilidades incluyen programación." },
      { word: "el jefe", translation: "boss", gender: "masculine", example: "Mi jefe es muy exigente." },
      { word: "la empresa", translation: "company", gender: "feminine", example: "Trabajo en una empresa internacional." },
      { word: "el contrato", translation: "contract", gender: "masculine", example: "Firmé el contrato ayer." },
      { word: "la reunión", translation: "meeting", gender: "feminine", example: "La reunión es a las tres." },
    ],
    quiz: [
      { id: "q1", question: "'El sueldo' means:", options: ["The boss", "The salary", "The contract", "The meeting"], correct: 1 },
      { id: "q2", question: "Where would you send your 'currículum'?", options: ["To a restaurant", "To a job application", "To a friend", "To a school"], correct: 1 },
      { id: "q3", question: "'Habilidades' refers to:", options: ["Habits", "Skills", "Hobbies", "Abilities to sleep"], correct: 1 },
    ],
    culturalNote: "In many Spanish-speaking countries, job interviews often include personal questions about family and age that would be considered inappropriate in the US. This is cultural, not invasive.",
  },
  {
    id: "b1_u2_l2",
    type: "grammar",
    title: "Conditional Tenses",
    introduction: "Learn to express hypothetical situations, polite requests, and future-in-the-past using the conditional tense.",
    grammar: [
      {
        rule: "Conditional formation: infinitive + endings",
        explanation: "Add -ía, -ías, -ía, -íamos, -ían to the infinitive. Same endings for -AR, -ER, -IR verbs.",
        example: "Yo hablaría con él, pero no tengo tiempo.",
        translation: "I would speak with him, but I don't have time.",
        tip: "The conditional endings are the same as the imperfect -ER/-IR endings!",
      },
      {
        rule: "Irregular conditional stems",
        explanation: "Some verbs have irregular stems: tener→tendr-, poder→podr-, saber→sabr-, hacer→har-, decir→dir-",
        example: "¿Podrías ayudarme con esto?",
        translation: "Could you help me with this?",
      },
      {
        rule: "Si + imperfect subjunctive + conditional",
        explanation: "For hypothetical situations: Si yo tuviera dinero, viajaría por el mundo.",
        example: "Si pudiera, cambiaría de trabajo.",
        translation: "If I could, I would change jobs.",
      },
    ],
    quiz: [
      { id: "q1", question: "'Yo comería' means:", options: ["I ate", "I would eat", "I will eat", "I eat"], correct: 1 },
      { id: "q2", question: "The conditional of 'tener' (yo) is:", options: ["tenería", "tendría", "teniría", "tenía"], correct: 1 },
      { id: "q3", question: "'Si pudiera, viajaría' means:", options: ["If I can, I travel", "If I could, I would travel", "When I can, I'll travel", "I want to travel"], correct: 1 },
    ],
  },
  {
    id: "b1_u2_l3",
    type: "speaking",
    title: "Mock Interview",
    introduction: "Practice answering common job interview questions with confidence and professional language.",
    speaking: {
      scenario: "You are in a job interview for a marketing position at an international company. The interviewer asks you questions about your experience and skills.",
      prompts: [
        "Tell me about yourself and your experience.",
        "What are your greatest strengths?",
        "Why do you want to work for this company?",
        "Where do you see yourself in five years?",
      ],
      modelResponses: [
        "Soy profesional de marketing con tres años de experiencia en campañas digitales. Estudié comunicación en la universidad.",
        "Mis mayores fortalezas son la creatividad, el trabajo en equipo y la capacidad de adaptarme a situaciones nuevas.",
        "Me interesa esta empresa porque es líder en innovación y ofrece oportunidades de crecimiento profesional.",
        "En cinco años me veo liderando un equipo de marketing y contribuyendo al crecimiento internacional de la empresa.",
      ],
      tips: [
        "Use formal 'usted' form with the interviewer",
        "Structure answers: situation → action → result",
        "Practice speaking slowly and clearly",
        "Use professional vocabulary: experiencia, habilidades, logros",
      ],
    },
    quiz: [
      { id: "q1", question: "In a formal interview, you should use:", options: ["tú", "usted", "vos", "Any form"], correct: 1 },
      { id: "q2", question: "'Fortalezas' means:", options: ["Weaknesses", "Strengths", "Fortresses", "Experiences"], correct: 1 },
      { id: "q3", question: "'Crecimiento profesional' means:", options: ["Professional growth", "Professional crisis", "Job loss", "Salary cut"], correct: 0 },
    ],
  },
  {
    id: "b1_u2_l4",
    type: "listening",
    title: "Listening: Meeting",
    introduction: "Listen to a business meeting discussion and practice understanding professional conversations.",
    listening: {
      title: "Weekly Team Meeting",
      transcript: "Jefe: Buenos días a todos. Gracias por venir. Hoy tenemos tres puntos en la agenda. Primero, los resultados del mes pasado. María, ¿puedes presentar los números?\n\nMaría: Sí, claro. Las ventas aumentaron un quince por ciento comparado con el mes anterior. El equipo de marketing lanzó una campaña nueva que tuvo muy buenos resultados.\n\nJefe: Excelente. Segundo punto: el proyecto nuevo. Carlos, ¿cómo va?\n\nCarlos: Estamos en la fase de planificación. Necesitamos dos semanas más para terminar el presupuesto. Hay algunos desafíos con los proveedores.\n\nJefe: Entendido. ¿Necesitas más recursos?\n\nCarlos: Sería útil tener una persona más en el equipo.\n\nJefe: Lo revisaremos. Último punto: la conferencia del próximo mes. Todos están invitados.",
      questions: [
        { question: "How much did sales increase?", options: ["5%", "10%", "15%", "20%"], correct: 2 },
        { question: "What does Carlos need more time for?", options: ["Marketing", "The budget", "Hiring", "The conference"], correct: 1 },
        { question: "What does Carlos request?", options: ["More money", "More time off", "One more team member", "A new office"], correct: 2 },
      ],
    },
    quiz: [
      { id: "q1", question: "'Las ventas aumentaron' means:", options: ["Sales decreased", "Sales increased", "Sales stopped", "Sales started"], correct: 1 },
      { id: "q2", question: "'Presupuesto' means:", options: ["Presentation", "Budget", "President", "Pressure"], correct: 1 },
      { id: "q3", question: "'Proveedores' means:", options: ["Providers/suppliers", "Problems", "Professors", "Products"], correct: 0 },
    ],
  },
  {
    id: "b1_u2_l5",
    type: "writing",
    title: "Write a Cover Letter",
    introduction: "Compose a professional cover letter in Spanish for a job application.",
    writing: {
      prompt: "Write a cover letter (80-120 words) applying for a customer service position. Include: greeting, why you're interested, your relevant experience, and a closing.",
      hints: [
        "Start with: 'Estimado/a señor/a:' (Dear Sir/Madam:)",
        "Express interest: 'Me dirijo a usted para expresar mi interés en...'",
        "Mention experience: 'Cuento con X años de experiencia en...'",
        "Highlight skills: 'Entre mis habilidades destaco...'",
        "Close with: 'Quedo a su disposición para una entrevista.'",
        "Sign off: 'Atentamente,' (Sincerely,)",
      ],
      wordCount: { min: 80, max: 120 },
      exampleAnswer: "Estimada señora:\n\nMe dirijo a usted para expresar mi interés en el puesto de atención al cliente publicado en su página web.\n\nCuento con dos años de experiencia en servicio al cliente en una empresa de telecomunicaciones. Entre mis habilidades destaco la comunicación efectiva, la resolución de problemas y el dominio del inglés y español.\n\nMe entusiasma la posibilidad de formar parte de su equipo y contribuir al éxito de la empresa.\n\nQuedo a su disposición para una entrevista.\n\nAtentamente,\nAna García",
    },
    quiz: [
      { id: "q1", question: "A formal letter starts with:", options: ["Hola", "Estimado/a", "Querido/a", "Hey"], correct: 1 },
      { id: "q2", question: "'Quedo a su disposición' means:", options: ["I quit", "I remain at your disposal", "I'm leaving", "I'm busy"], correct: 1 },
      { id: "q3", question: "'Atentamente' is equivalent to:", options: ["Attention!", "Sincerely", "Urgently", "Carefully"], correct: 1 },
    ],
  },
];

// ─── B2 Lessons ─────────────────────────────────────────────────────────────
const B2_LESSONS: LessonContent[] = [
  {
    id: "b2_u1_l1",
    type: "vocabulary",
    title: "Abstract Nouns",
    introduction: "Expand your vocabulary with abstract concepts used in academic, philosophical, and professional discussions.",
    vocab: [
      { word: "la libertad", translation: "freedom/liberty", gender: "feminine", example: "La libertad de expresión es un derecho fundamental." },
      { word: "la justicia", translation: "justice", gender: "feminine", example: "Luchamos por la justicia social." },
      { word: "la creatividad", translation: "creativity", gender: "feminine", example: "La creatividad es esencial en el arte." },
      { word: "la identidad", translation: "identity", gender: "feminine", example: "La identidad cultural es compleja." },
      { word: "el conocimiento", translation: "knowledge", gender: "masculine", example: "El conocimiento es poder." },
      { word: "la conciencia", translation: "conscience/awareness", gender: "feminine", example: "Debemos tener conciencia ambiental." },
      { word: "el bienestar", translation: "well-being", gender: "masculine", example: "El bienestar emocional es prioritario." },
      { word: "la igualdad", translation: "equality", gender: "feminine", example: "La igualdad de género es un objetivo global." },
      { word: "el compromiso", translation: "commitment", gender: "masculine", example: "El compromiso con la educación es clave." },
      { word: "la incertidumbre", translation: "uncertainty", gender: "feminine", example: "Vivimos en tiempos de incertidumbre." },
    ],
    quiz: [
      { id: "q1", question: "'La conciencia' can mean:", options: ["Science", "Conscience or awareness", "Conference", "Confidence"], correct: 1 },
      { id: "q2", question: "'El bienestar' refers to:", options: ["Good weather", "Well-being", "Good food", "Wealth"], correct: 1 },
      { id: "q3", question: "'Incertidumbre' means:", options: ["Certainty", "Uncertainty", "Insecurity", "Incompetence"], correct: 1 },
    ],
    culturalNote: "In Spanish intellectual discourse, abstract nouns are frequently used in political speeches, academic papers, and philosophical debates. Mastering them elevates your register significantly.",
  },
  {
    id: "b2_u1_l2",
    type: "grammar",
    title: "Passive Voice Advanced",
    introduction: "Master complex passive constructions including the passive with 'se', the passive with 'ser', and impersonal expressions.",
    grammar: [
      {
        rule: "Passive with 'ser' + past participle",
        explanation: "Subject + ser (conjugated) + past participle (agrees in gender/number). Used in formal/written contexts.",
        example: "El informe fue escrito por el director.",
        translation: "The report was written by the director.",
        tip: "The past participle must agree with the subject: 'La carta fue enviada' (feminine).",
      },
      {
        rule: "Passive 'se' (pasiva refleja)",
        explanation: "Se + verb (3rd person) + subject. More common in everyday Spanish than 'ser' passive.",
        example: "Se venden casas en esta zona.",
        translation: "Houses are sold in this area.",
      },
      {
        rule: "Impersonal 'se'",
        explanation: "Se + verb (3rd person singular). No specific subject. Used for general statements.",
        example: "Se dice que el español es fácil de aprender.",
        translation: "It is said that Spanish is easy to learn.",
      },
    ],
    quiz: [
      { id: "q1", question: "'Se habla español aquí' means:", options: ["He speaks Spanish", "Spanish is spoken here", "They speak Spanish", "I speak Spanish"], correct: 1 },
      { id: "q2", question: "In 'La ley fue aprobada', the passive uses:", options: ["se + verb", "ser + participle", "estar + gerund", "haber + participle"], correct: 1 },
      { id: "q3", question: "'Se necesitan voluntarios' means:", options: ["Volunteers are needed", "They need themselves", "He needs volunteers", "We volunteer"], correct: 0 },
    ],
  },
  {
    id: "b2_u1_l3",
    type: "speaking",
    title: "Philosophical Discussion",
    introduction: "Practice discussing ethics, values, and abstract concepts fluently with sophisticated language.",
    speaking: {
      scenario: "You are participating in a university seminar discussing the ethics of artificial intelligence. Express your views on whether AI should have rights and responsibilities.",
      prompts: [
        "What is your position on AI having rights?",
        "What ethical concerns does AI raise?",
        "How should society regulate AI development?",
        "Can machines ever truly be conscious?",
      ],
      modelResponses: [
        "En mi opinión, los derechos deben reservarse para seres con conciencia. Sin embargo, necesitamos marcos legales para la responsabilidad de las decisiones de la IA.",
        "Me preocupa especialmente el sesgo algorítmico y la falta de transparencia en las decisiones automatizadas que afectan a las personas.",
        "Creo que se necesita una regulación internacional que equilibre la innovación con la protección de los derechos humanos fundamentales.",
        "Desde una perspectiva filosófica, la conciencia requiere experiencia subjetiva, algo que las máquinas actuales no poseen.",
      ],
      tips: [
        "Use hedging language: 'En mi opinión', 'Desde mi punto de vista', 'Cabría argumentar que'",
        "Connect ideas with: 'No obstante', 'Sin embargo', 'Por consiguiente'",
        "Express nuance: 'Por un lado... por otro lado'",
        "Acknowledge opposing views before presenting yours",
      ],
    },
    quiz: [
      { id: "q1", question: "'Cabría argumentar que' means:", options: ["It's obvious that", "One could argue that", "Everyone knows that", "It's impossible that"], correct: 1 },
      { id: "q2", question: "'No obstante' is similar to:", options: ["Therefore", "Nevertheless", "Because", "Finally"], correct: 1 },
      { id: "q3", question: "'Sesgo algorítmico' refers to:", options: ["Algorithm speed", "Algorithmic bias", "Algorithm cost", "Algorithm design"], correct: 1 },
    ],
  },
  {
    id: "b2_u1_l4",
    type: "reading",
    title: "Reading: Academic Paper",
    introduction: "Practice extracting key arguments and understanding academic writing style in Spanish.",
    reading: {
      title: "El Impacto de las Redes Sociales en la Salud Mental",
      text: "Numerosos estudios han demostrado una correlación entre el uso excesivo de redes sociales y el deterioro de la salud mental, particularmente entre adolescentes. Según una investigación publicada en la Revista de Psicología Clínica, los jóvenes que pasan más de tres horas diarias en plataformas digitales presentan un 35% más de probabilidades de desarrollar síntomas de ansiedad.\n\nSin embargo, otros investigadores argumentan que la relación es más compleja. El Dr. Martínez señala que 'las redes sociales también pueden ser una fuente de apoyo social y conexión para personas aisladas.' La clave, según los expertos, reside en el uso consciente y moderado.\n\nLas recomendaciones incluyen: establecer límites de tiempo, priorizar interacciones significativas sobre el consumo pasivo, y mantener actividades fuera de línea.",
      questions: [
        { question: "What percentage increase in anxiety symptoms was found?", options: ["15%", "25%", "35%", "45%"], correct: 2 },
        { question: "What does Dr. Martínez argue?", options: ["Social media is always harmful", "Social media can provide social support", "Teens should avoid all technology", "Research is unreliable"], correct: 1 },
        { question: "What is the key recommendation?", options: ["Delete all accounts", "Use only one platform", "Conscious and moderate use", "Only use for work"], correct: 2 },
      ],
    },
    quiz: [
      { id: "q1", question: "'Deterioro' means:", options: ["Improvement", "Deterioration", "Detection", "Determination"], correct: 1 },
      { id: "q2", question: "'Consumo pasivo' refers to:", options: ["Active posting", "Passive scrolling/consumption", "Buying products", "Watching TV"], correct: 1 },
      { id: "q3", question: "'Reside en' means:", options: ["Lives in", "Lies in/consists of", "Resides at", "Resists"], correct: 1 },
    ],
  },
  {
    id: "b2_u1_l5",
    type: "writing",
    title: "Write a Report",
    introduction: "Practice summarizing findings in a formal, academic style with proper structure and register.",
    writing: {
      prompt: "Write a brief report (100-150 words) summarizing the impact of remote work on employee productivity. Include: an introduction stating the topic, key findings (positive and negative), and a conclusion with recommendations.",
      hints: [
        "Introduction: 'El presente informe analiza...' (This report analyzes...)",
        "Present findings: 'Los datos indican que...' (The data indicates that...)",
        "Contrast: 'No obstante, se han identificado...' (Nevertheless, ... have been identified)",
        "Conclude: 'En conclusión, se recomienda...' (In conclusion, it is recommended...)",
        "Use impersonal constructions: 'Se observa que...', 'Cabe destacar que...'",
        "Maintain formal register throughout",
      ],
      wordCount: { min: 100, max: 150 },
      exampleAnswer: "El presente informe analiza el impacto del trabajo remoto en la productividad laboral.\n\nLos datos indican que el 68% de los empleados reportan mayor productividad trabajando desde casa, principalmente debido a la eliminación del tiempo de desplazamiento y la reducción de interrupciones.\n\nNo obstante, se han identificado desafíos significativos: el aislamiento social, la dificultad para separar vida personal y laboral, y la reducción de la colaboración espontánea entre equipos.\n\nEn conclusión, se recomienda implementar un modelo híbrido que combine las ventajas de ambas modalidades, estableciendo días presenciales para reuniones y trabajo colaborativo.",
    },
    quiz: [
      { id: "q1", question: "'El presente informe' means:", options: ["The gift report", "This report", "The present time", "A current event"], correct: 1 },
      { id: "q2", question: "'Cabe destacar' means:", options: ["It fits", "It is worth highlighting", "It's a cable", "It's obvious"], correct: 1 },
      { id: "q3", question: "'Desplazamiento' in work context means:", options: ["Displacement", "Commute", "Movement", "Transfer"], correct: 1 },
    ],
  },
];

// ─── C1 Lessons ─────────────────────────────────────────────────────────────
const C1_LESSONS: LessonContent[] = [
  {
    id: "c1_u1_l1",
    type: "vocabulary",
    title: "Idioms & Collocations",
    introduction: "Master natural word combinations and idiomatic expressions that native speakers use daily.",
    vocab: [
      { word: "dar en el clavo", translation: "to hit the nail on the head", example: "Con tu análisis, diste en el clavo." },
      { word: "estar en las nubes", translation: "to have one's head in the clouds", example: "No me escuchas, estás en las nubes." },
      { word: "tomar el pelo", translation: "to pull someone's leg", example: "¿Me estás tomando el pelo? No te creo." },
      { word: "meter la pata", translation: "to put one's foot in it", example: "Metí la pata al mencionar su ex." },
      { word: "no tener pelos en la lengua", translation: "to not mince words", example: "Ella no tiene pelos en la lengua, siempre dice la verdad." },
      { word: "ponerse las pilas", translation: "to get one's act together", example: "Tienes que ponerte las pilas con el proyecto." },
      { word: "echar una mano", translation: "to lend a hand", example: "¿Me echas una mano con la mudanza?" },
      { word: "costar un ojo de la cara", translation: "to cost an arm and a leg", example: "Ese coche cuesta un ojo de la cara." },
      { word: "ir al grano", translation: "to get to the point", example: "Deja de rodeos y ve al grano." },
      { word: "quedarse en blanco", translation: "to go blank (mind)", example: "En el examen me quedé en blanco." },
    ],
    quiz: [
      { id: "q1", question: "'Meter la pata' means:", options: ["To put your foot in the door", "To make a mistake/blunder", "To kick someone", "To walk fast"], correct: 1 },
      { id: "q2", question: "If someone 'no tiene pelos en la lengua', they are:", options: ["Shy", "Bald", "Very direct/blunt", "Quiet"], correct: 2 },
      { id: "q3", question: "'Ponerse las pilas' means:", options: ["To buy batteries", "To get energized/focused", "To exercise", "To charge your phone"], correct: 1 },
    ],
    culturalNote: "Spanish idioms vary greatly by region. 'Ponerse las pilas' is universal, but many idioms are specific to countries. Learning regional expressions shows cultural awareness and earns respect from native speakers.",
  },
  {
    id: "c1_u1_l2",
    type: "grammar",
    title: "Inversion & Emphasis",
    introduction: "Learn advanced sentence structures that create emphasis, drama, and rhetorical impact in your writing and speech.",
    grammar: [
      {
        rule: "Fronting for emphasis (topicalization)",
        explanation: "Move the element you want to emphasize to the front of the sentence. The rest follows in inverted order.",
        example: "De esta situación, nadie saldrá beneficiado.",
        translation: "From this situation, nobody will benefit.",
        tip: "This is common in journalism and formal speeches to create dramatic effect.",
      },
      {
        rule: "Cleft sentences with 'lo que' / 'es que'",
        explanation: "Use 'Lo que + verb + es que...' to highlight specific information.",
        example: "Lo que me preocupa es que no hay solución clara.",
        translation: "What worries me is that there is no clear solution.",
      },
      {
        rule: "Negative inversion with 'ni siquiera', 'jamás', 'en ningún momento'",
        explanation: "Starting with a negative element inverts subject-verb order and intensifies the negation.",
        example: "Jamás había visto algo semejante.",
        translation: "Never had I seen anything like it.",
      },
    ],
    quiz: [
      { id: "q1", question: "'Lo que me sorprende es...' is used to:", options: ["Ask a question", "Emphasize what surprises you", "Express doubt", "Make a comparison"], correct: 1 },
      { id: "q2", question: "'Ni siquiera' means:", options: ["Not even", "Not always", "Not yet", "Not anymore"], correct: 0 },
      { id: "q3", question: "Fronting is most common in:", options: ["Casual texting", "Children's speech", "Formal/journalistic writing", "Song lyrics"], correct: 2 },
    ],
  },
  {
    id: "c1_u1_l3",
    type: "speaking",
    title: "Persuasive Speaking",
    introduction: "Develop the ability to convince, negotiate, and present compelling arguments in professional and academic settings.",
    speaking: {
      scenario: "You are presenting a proposal to your company's board to invest in sustainability initiatives. You need to persuade skeptical executives who prioritize short-term profits.",
      prompts: [
        "Open with a compelling hook about why sustainability matters now.",
        "Present the business case with data and projections.",
        "Address the main objection: cost.",
        "Close with a call to action.",
      ],
      modelResponses: [
        "Estimados miembros del consejo, en los próximos cinco años, las empresas que no adopten prácticas sostenibles perderán hasta un 30% de su cuota de mercado.",
        "Según nuestro análisis, la inversión inicial de dos millones se recuperaría en 18 meses gracias a la reducción de costes energéticos y los incentivos fiscales.",
        "Entiendo la preocupación por los costes. Sin embargo, el coste de no actuar es significativamente mayor: multas regulatorias, pérdida de clientes y daño reputacional.",
        "Les propongo aprobar la fase piloto de seis meses. Si los resultados no son satisfactorios, podemos reevaluar. Pero si funcionan, habremos asegurado el futuro de la empresa.",
      ],
      tips: [
        "Use rhetorical questions: '¿Podemos permitirnos no actuar?'",
        "Acknowledge counterarguments before refuting them",
        "Use data and specific numbers for credibility",
        "End with a clear, actionable proposal",
      ],
    },
    quiz: [
      { id: "q1", question: "'Cuota de mercado' means:", options: ["Market quota", "Market share", "Market price", "Market research"], correct: 1 },
      { id: "q2", question: "'Incentivos fiscales' refers to:", options: ["Physical incentives", "Tax incentives", "Fiscal year", "Financial penalties"], correct: 1 },
      { id: "q3", question: "'Reevaluar' means:", options: ["To evaluate again", "To reject", "To accept", "To ignore"], correct: 0 },
    ],
  },
  {
    id: "c1_u1_l4",
    type: "reading",
    title: "Reading: Literary Excerpt",
    introduction: "Analyze style, subtext, and literary devices in a passage from contemporary Spanish-language literature.",
    reading: {
      title: "Excerpt from 'La Sombra del Viento' (adapted)",
      text: "Todavía recuerdo aquel amanecer en que mi padre me llevó por primera vez a visitar el Cementerio de los Libros Olvidados. Desgranaban los primeros días del verano de 1945 y caminábamos por las calles de una Barcelona atrapada bajo cielos de ceniza y un sol de vapor que se derramaba sobre la Rambla de Santa Mónica en una guirnalda de cobre líquido.\n\nAquel lugar era un misterio, un santuario. Cada libro tenía un alma, el alma de quien lo había escrito y el alma de quienes lo habían leído. Cada vez que un libro cambiaba de manos, su espíritu crecía y se hacía más fuerte.\n\nMi padre me dijo: 'Este lugar es un misterio, Daniel. Cuando pases por esa puerta, este lugar también será un poco tuyo.'",
      questions: [
        { question: "What literary device is 'cielos de ceniza'?", options: ["Simile", "Metaphor", "Hyperbole", "Personification"], correct: 1 },
        { question: "What does the narrator compare books to?", options: ["Objects", "Living beings with souls", "Weapons", "Treasures"], correct: 1 },
        { question: "The tone of the passage is:", options: ["Humorous", "Nostalgic and reverent", "Angry", "Scientific"], correct: 1 },
      ],
    },
    quiz: [
      { id: "q1", question: "'Desgranaban' (from desgranar) here means:", options: ["Were destroying", "Were unfolding/passing", "Were counting", "Were planting"], correct: 1 },
      { id: "q2", question: "'Guirnalda de cobre líquido' is:", options: ["A literal copper garland", "A metaphor for golden sunlight", "A type of decoration", "A street name"], correct: 1 },
      { id: "q3", question: "'Santuario' means:", options: ["Cemetery", "Sanctuary", "Library", "Museum"], correct: 1 },
    ],
    culturalNote: "'La Sombra del Viento' by Carlos Ruiz Zafón is one of the most successful Spanish novels of the 21st century. Reading literature in the original language reveals nuances that translations cannot capture.",
  },
  {
    id: "c1_u1_l5",
    type: "writing",
    title: "Write a Critique",
    introduction: "Compose a nuanced critical review that demonstrates sophisticated analytical thinking and advanced vocabulary.",
    writing: {
      prompt: "Write a critical review (120-160 words) of a film, book, or art exhibition you've experienced. Include: a brief summary, analysis of strengths and weaknesses, comparison to similar works, and your overall assessment.",
      hints: [
        "Opening: 'La obra en cuestión...' / 'Se trata de...'",
        "Praise: 'Cabe destacar la magistral...', 'Resulta admirable...'",
        "Criticism: 'No obstante, adolece de...', 'Se echa en falta...'",
        "Comparison: 'A diferencia de obras anteriores...', 'En la línea de...'",
        "Conclusion: 'En definitiva...', 'A modo de conclusión...'",
        "Use subjunctive for opinions: 'Es posible que el autor pretenda...'",
      ],
      wordCount: { min: 120, max: 160 },
      exampleAnswer: "Se trata de una exposición que explora la intersección entre tecnología y naturaleza a través de instalaciones inmersivas. Cabe destacar la magistral utilización de la luz y el sonido, que envuelve al espectador en una experiencia sensorial única.\n\nNo obstante, la obra adolece de cierta superficialidad conceptual. Mientras que artistas como Olafur Eliasson logran provocar reflexión profunda, esta exposición se queda en lo meramente estético.\n\nA diferencia de muestras anteriores del mismo colectivo, se echa en falta una narrativa coherente que conecte las distintas piezas.\n\nEn definitiva, resulta una experiencia visualmente impactante pero intelectualmente insatisfactoria. Recomendable para quien busque entretenimiento, no tanto para quien busque profundidad artística.",
    },
    quiz: [
      { id: "q1", question: "'Adolece de' means:", options: ["Suffers from/lacks", "Adolescent", "Admires", "Adds to"], correct: 0 },
      { id: "q2", question: "'Se echa en falta' means:", options: ["It's thrown away", "It is missed/lacking", "It's a mistake", "It's false"], correct: 1 },
      { id: "q3", question: "'En definitiva' means:", options: ["Definitely not", "In definition", "Ultimately/In short", "In the end times"], correct: 2 },
    ],
  },
];

// ─── C2 Lessons ─────────────────────────────────────────────────────────────
const C2_LESSONS: LessonContent[] = [
  {
    id: "c2_u1_l1",
    type: "vocabulary",
    title: "Register Switching",
    introduction: "Master the art of moving between formal, informal, and slang registers — a hallmark of near-native fluency.",
    vocab: [
      { word: "fallecer / morirse / palmarlo", translation: "to pass away / to die / to kick the bucket", example: "Formal: 'El paciente falleció.' Informal: 'Se murió.' Slang: 'La palmó.'" },
      { word: "ebrio / borracho / pedo", translation: "inebriated / drunk / wasted", example: "Formal: 'Se encontraba ebrio.' Informal: 'Estaba borracho.' Slang: 'Iba pedo.'" },
      { word: "sustraer / robar / mangar", translation: "to misappropriate / to steal / to nick", example: "Formal: 'Sustrajeron documentos.' Informal: 'Le robaron.' Slang: 'Le mangaron la cartera.'" },
      { word: "individuo / tipo / tío", translation: "individual / guy / dude", example: "Formal: 'Un individuo sospechoso.' Informal: 'Un tipo raro.' Slang: 'Un tío raro.'" },
      { word: "residencia / casa / choza", translation: "residence / house / pad/crib", example: "Formal: 'Su residencia habitual.' Informal: 'Mi casa.' Slang: 'Mi choza.'" },
      { word: "retribución / sueldo / pasta", translation: "remuneration / salary / dough/cash", example: "Formal: 'La retribución mensual.' Informal: 'El sueldo.' Slang: 'La pasta.'" },
      { word: "excelente / genial / flipante", translation: "excellent / great / awesome", example: "Formal: 'Resultados excelentes.' Informal: '¡Genial!' Slang: '¡Flipante!'" },
      { word: "agradar / gustar / molar", translation: "to please / to like / to be cool", example: "Formal: 'Me agrada su propuesta.' Informal: 'Me gusta.' Slang: 'Me mola.'" },
    ],
    quiz: [
      { id: "q1", question: "Which register is 'fallecer'?", options: ["Slang", "Informal", "Formal", "Neutral"], correct: 2 },
      { id: "q2", question: "'Molar' in slang means:", options: ["A tooth", "To grind", "To be cool/to like", "To bother"], correct: 2 },
      { id: "q3", question: "When would you use 'sustraer' instead of 'robar'?", options: ["With friends", "In a police report", "In a text message", "At a party"], correct: 1 },
    ],
    culturalNote: "Register switching is one of the hardest skills for language learners. Native speakers unconsciously adjust their register based on context. Using slang in a formal setting (or vice versa) immediately marks you as non-native.",
  },
  {
    id: "c2_u1_l2",
    type: "grammar",
    title: "Stylistic Grammar",
    introduction: "Use grammar not just correctly, but for rhetorical effect — creating rhythm, emphasis, and literary style.",
    grammar: [
      {
        rule: "Asyndeton (omitting conjunctions)",
        explanation: "Removing 'y' between list items creates urgency and rhythm: 'Vine, vi, vencí.'",
        example: "Llegó, miró, comprendió todo sin palabras.",
        translation: "He arrived, looked, understood everything without words.",
        tip: "Use asyndeton for dramatic effect in speeches and narratives.",
      },
      {
        rule: "Polysyndeton (repeating conjunctions)",
        explanation: "Repeating 'y' creates accumulation and emotional weight.",
        example: "Y llovía y llovía y el mundo se deshacía.",
        translation: "And it rained and rained and the world fell apart.",
      },
      {
        rule: "Periodic sentences (delay main clause)",
        explanation: "Build suspense by placing subordinate clauses before the main idea.",
        example: "Después de años de lucha, de sacrificios innumerables, de noches sin dormir, finalmente lo consiguió.",
        translation: "After years of struggle, countless sacrifices, sleepless nights, he finally achieved it.",
      },
    ],
    quiz: [
      { id: "q1", question: "Asyndeton involves:", options: ["Adding extra conjunctions", "Removing conjunctions", "Using metaphors", "Repeating words"], correct: 1 },
      { id: "q2", question: "'Y llovía y llovía y...' is an example of:", options: ["Asyndeton", "Polysyndeton", "Anaphora", "Hyperbole"], correct: 1 },
      { id: "q3", question: "Periodic sentences create:", options: ["Confusion", "Humor", "Suspense", "Simplicity"], correct: 2 },
    ],
  },
  {
    id: "c2_u1_l3",
    type: "speaking",
    title: "Impromptu Speech",
    introduction: "Develop the ability to speak fluently and coherently on any topic without preparation — the ultimate fluency test.",
    speaking: {
      scenario: "You have 30 seconds to prepare, then must speak for 2 minutes on a random topic. Today's topic: 'The role of art in society.'",
      prompts: [
        "Define what art means to you and its purpose.",
        "Give a specific example of art impacting society.",
        "Discuss whether art should be funded by governments.",
        "Conclude with your vision for art's future.",
      ],
      modelResponses: [
        "Para mí, el arte es la expresión más pura de la condición humana. Su propósito trasciende lo estético: nos obliga a cuestionar, a sentir, a conectar con experiencias ajenas.",
        "Pensemos en el Guernica de Picasso. Una sola obra transformó la percepción mundial de la Guerra Civil Española y se convirtió en símbolo universal contra la barbarie bélica.",
        "Considero que la financiación pública del arte es una inversión, no un gasto. Una sociedad sin arte es una sociedad sin espejo donde mirarse, sin voz para expresar su dolor o su alegría.",
        "El futuro del arte será inevitablemente digital e interactivo, pero su esencia permanecerá: dar forma a lo inefable, hacer visible lo invisible.",
      ],
      tips: [
        "Use the PREP framework: Point, Reason, Example, Point (restate)",
        "Buy thinking time with: 'Es una pregunta interesante...', 'Permítanme reflexionar...'",
        "Use abstract vocabulary naturally: trascender, inherente, intrínseco",
        "Vary sentence length for rhythm: short punchy + long flowing",
      ],
    },
    quiz: [
      { id: "q1", question: "'Lo inefable' means:", options: ["The inefficient", "The unspeakable/inexpressible", "The ineffective", "The informal"], correct: 1 },
      { id: "q2", question: "'Barbarie bélica' means:", options: ["Beautiful war", "Wartime barbarity", "Barbaric beauty", "War games"], correct: 1 },
      { id: "q3", question: "'Trasciende lo estético' means:", options: ["Transcends aesthetics", "Is very aesthetic", "Lacks aesthetics", "Defines aesthetics"], correct: 0 },
    ],
  },
  {
    id: "c2_u1_l4",
    type: "reading",
    title: "Reading: Satire & Irony",
    introduction: "Detect and appreciate humor, irony, and satirical intent in Spanish texts — skills that require deep cultural understanding.",
    reading: {
      title: "Columna de Opinión: 'Elogio de la Pereza'",
      text: "Vivimos en una época gloriosa en la que trabajar dieciocho horas al día se considera una virtud y dormir ocho horas un vicio imperdonable. Los gurús de la productividad nos aseguran que madrugar a las cinco de la mañana es el secreto del éxito, como si los grandes genios de la historia no hubieran sido, en su mayoría, noctámbulos empedernidos.\n\nSe nos dice que debemos 'optimizar' cada minuto, que el descanso es 'tiempo muerto' y que si no estamos agotados es que no estamos esforzándonos lo suficiente. Qué maravillosa lógica: el mérito se mide en ojeras.\n\nYo propongo una revolución silenciosa: la reivindicación del no hacer nada. Del paseo sin destino. De la siesta como acto político. Porque en un mundo que nos exige ser máquinas, ser humano es el mayor acto de rebeldía.",
      questions: [
        { question: "The author's tone toward productivity culture is:", options: ["Admiring", "Neutral", "Satirical/critical", "Confused"], correct: 2 },
        { question: "'El mérito se mide en ojeras' is:", options: ["A literal statement", "An ironic critique", "Medical advice", "A compliment"], correct: 1 },
        { question: "The author's 'revolution' is:", options: ["Political uprising", "Embracing rest and being human", "Working harder", "Sleeping all day"], correct: 1 },
      ],
    },
    quiz: [
      { id: "q1", question: "'Noctámbulos empedernidos' means:", options: ["Early risers", "Incorrigible night owls", "Sleepwalkers", "Insomniacs"], correct: 1 },
      { id: "q2", question: "'Reivindicación' means:", options: ["Revenge", "Claim/vindication", "Revolution", "Rejection"], correct: 1 },
      { id: "q3", question: "The phrase 'la siesta como acto político' is:", options: ["A government policy", "A provocative/ironic statement", "A medical recommendation", "A historical fact"], correct: 1 },
    ],
    culturalNote: "Spanish opinion columns (columnas) have a rich tradition of wit and irony. Writers like Arturo Pérez-Reverte and Rosa Montero use humor and satire to critique society. Understanding this register marks true C2 proficiency.",
  },
  {
    id: "c2_u1_l5",
    type: "writing",
    title: "Creative Writing",
    introduction: "Write a short creative piece in Spanish that demonstrates mastery of style, voice, and literary technique.",
    writing: {
      prompt: "Write a micro-story (microrrelato) of exactly 100-140 words. The theme is 'doors.' Your story should have a beginning, middle, and end, and use at least one literary device (metaphor, irony, symbolism, or twist ending).",
      hints: [
        "Microrrelatos value precision — every word must earn its place",
        "Consider symbolism: doors as opportunities, endings, secrets, choices",
        "Use varied sentence rhythm: short for tension, long for description",
        "A twist ending (giro final) is the hallmark of great microrrelatos",
        "Study masters: Monterroso, Cortázar, Ana María Shua",
        "Read aloud — the rhythm should feel musical",
      ],
      wordCount: { min: 100, max: 140 },
      exampleAnswer: "Todas las mañanas, al salir de casa, la puerta le susurraba algo que nunca lograba entender. Un murmullo antiguo, como de madera que recuerda haber sido bosque.\n\nUn día decidió no salir. Se quedó dentro, con la oreja pegada a la puerta, esperando. El susurro se hizo palabra: 'No vuelvas.'\n\nRió nerviosamente. Abrió la puerta de golpe. Al otro lado no había pasillo, ni escaleras, ni ciudad. Solo un bosque infinito y el sonido de un hacha lejana.\n\nComprendió entonces que la puerta no le hablaba a él. Le hablaba a sí misma. Le pedía que no la abrieran más.",
    },
    quiz: [
      { id: "q1", question: "A 'microrrelato' is:", options: ["A long novel", "A very short story", "A poem", "An essay"], correct: 1 },
      { id: "q2", question: "'Giro final' means:", options: ["Final turn/twist", "Final chapter", "Last page", "Ending credits"], correct: 0 },
      { id: "q3", question: "In the example, the door symbolizes:", options: ["A real door", "A boundary between reality and the unknown", "A window", "A wall"], correct: 1 },
    ],
    culturalNote: "The microrrelato is a beloved genre in Spanish-language literature. Augusto Monterroso's 'El Dinosaurio' ('Cuando despertó, el dinosaurio todavía estaba allí.') is considered the shortest story ever written. This genre demands C2-level precision.",
  },
];

// ─── Content Registry ───────────────────────────────────────────────────────
const ALL_LESSONS: LessonContent[] = [
  ...A1_LESSONS,
  ...A2_LESSONS,
  ...B1_LESSONS,
  ...B1_U2_LESSONS,
  ...B2_LESSONS,
  ...C1_LESSONS,
  ...C2_LESSONS,
];

/**
 * Get lesson content by ID.
 * Handles both old format ("a1_u1_l1") and new multi-language format ("esdo_a1_u1_l1").
 * Falls back to base lesson ID if language-specific content doesn't exist yet.
 */
export function getLessonContent(lessonId: string): LessonContent | null {
  // Try exact match first
  const exact = ALL_LESSONS.find(l => l.id === lessonId);
  if (exact) return exact;

  // Try stripping language prefix: "esdo_a1_u1_l1" → "a1_u1_l1"
  const cefrMatch = lessonId.match(/^[a-z]+_(a[12]|b[12]|c[12])_(.+)$/i);
  if (cefrMatch) {
    const baseId = `${cefrMatch[1].toLowerCase()}_${cefrMatch[2]}`;
    const fallback = ALL_LESSONS.find(l => l.id === baseId);
    if (fallback) return fallback;
  }

  // Try matching by unit/lesson pattern only: extract u{n}_l{n}
  const unitLessonMatch = lessonId.match(/(u\d+_l\d+)$/);
  if (unitLessonMatch) {
    // Find any lesson with same unit/lesson suffix
    const suffix = unitLessonMatch[1];
    const byPattern = ALL_LESSONS.find(l => l.id.endsWith(suffix));
    if (byPattern) return byPattern;
  }

  return null;
}

export function hasLessonContent(lessonId: string): boolean {
  return getLessonContent(lessonId) !== null;
}

export function getAllLessonIds(): string[] {
  return ALL_LESSONS.map(l => l.id);
}
