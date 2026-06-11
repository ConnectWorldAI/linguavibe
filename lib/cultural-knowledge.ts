/**
 * Cultural Knowledge Base
 * Deep cultural content for each supported language — foods, music, dances,
 * holidays, traditions, famous people, proverbs, and etiquette.
 * Every item includes the term IN the target language with pronunciation.
 */

export interface CulturalFood {
  name: string;
  nativeName: string;
  pronunciation: string;
  description: string;
  region: string;
  whenEaten: string;
  relatedWords: string[];
}

export interface CulturalMusic {
  name: string;
  nativeName: string;
  pronunciation: string;
  description: string;
  famousArtists: string[];
  danceStyle?: string;
  instruments: string[];
}

export interface CulturalTradition {
  name: string;
  nativeName: string;
  pronunciation: string;
  description: string;
  when: string;
  activities: string[];
  foods: string[];
  vocabulary: { word: string; pronunciation: string; meaning: string }[];
}

export interface CulturalFigure {
  name: string;
  field: string;
  description: string;
  famousQuote?: string;
  quoteTranslation?: string;
}

export interface CulturalEtiquette {
  situation: string;
  doThis: string;
  nativePhrase: string;
  pronunciation: string;
  meaning: string;
  culturalNote: string;
}

export interface CulturalContent {
  language: string;
  languageCode: string;
  foods: CulturalFood[];
  music: CulturalMusic[];
  traditions: CulturalTradition[];
  figures: CulturalFigure[];
  etiquette: CulturalEtiquette[];
  proverbs: { text: string; pronunciation: string; meaning: string; lesson: string }[];
  greetings: { formal: string; informal: string; slang: string; pronunciation: string }[];
}

export const SUPPORTED_LANGUAGES = ["esdo", "fr", "ja", "ko", "it", "ptbr", "de", "zh"];

export function getCulturalContent(languageCode: string): CulturalContent {
  return CULTURAL_DATABASE[languageCode] || CULTURAL_DATABASE["esdo"];
}

export function getCulturalFoods(languageCode: string): CulturalFood[] {
  return getCulturalContent(languageCode).foods;
}

export function getCulturalTraditions(languageCode: string): CulturalTradition[] {
  return getCulturalContent(languageCode).traditions;
}

export function getCulturalMusic(languageCode: string): CulturalMusic[] {
  return getCulturalContent(languageCode).music;
}

export function getRandomCulturalFact(languageCode: string): string {
  const content = getCulturalContent(languageCode);
  const allFacts = [
    ...content.foods.map(f => `${f.nativeName} (${f.pronunciation}): ${f.description}`),
    ...content.traditions.map(t => `${t.nativeName} (${t.pronunciation}): ${t.description}`),
    ...content.proverbs.map(p => `"${p.text}" - ${p.meaning}`),
  ];
  return allFacts[Math.floor(Math.random() * allFacts.length)];
}

export function getCulturalVocabularyForLesson(languageCode: string, topic: string): { word: string; pronunciation: string; meaning: string }[] {
  const content = getCulturalContent(languageCode);
  const vocab: { word: string; pronunciation: string; meaning: string }[] = [];
  for (const tradition of content.traditions) {
    if (tradition.name.toLowerCase().includes(topic.toLowerCase()) ||
        tradition.description.toLowerCase().includes(topic.toLowerCase())) {
      vocab.push(...tradition.vocabulary);
    }
  }
  if (topic.toLowerCase().includes("food") || topic.toLowerCase().includes("restaurant") || topic.toLowerCase().includes("kitchen")) {
    for (const food of content.foods) {
      vocab.push({ word: food.nativeName, pronunciation: food.pronunciation, meaning: food.name });
    }
  }
  return vocab.slice(0, 10);
}

// === SPANISH (Dominican) ===
const spanishDominican: CulturalContent = {
  language: "Spanish",
  languageCode: "esdo",
  foods: [
    { name: "Sancocho", nativeName: "El Sancocho", pronunciation: "el san-KO-cho", description: "A hearty stew with 7 meats, root vegetables, and plantains - the national dish served at family gatherings", region: "Nationwide", whenEaten: "Sundays, holidays, family reunions", relatedWords: ["la olla", "el platano", "la yuca", "hervir"] },
    { name: "Mangu", nativeName: "El Mangu", pronunciation: "el man-GOO", description: "Mashed green plantains topped with sauteed onions, fried cheese, salami, and eggs - quintessential Dominican breakfast", region: "Nationwide", whenEaten: "Breakfast daily", relatedWords: ["los tres golpes", "el platano verde", "la cebolla", "el queso frito"] },
    { name: "La Bandera", nativeName: "La Bandera Dominicana", pronunciation: "la ban-DEH-ra", description: "Rice, beans, and meat - named The Flag because eaten daily like a national symbol", region: "Nationwide", whenEaten: "Lunch daily", relatedWords: ["el arroz", "las habichuelas", "la carne", "el almuerzo"] },
    { name: "Mofongo", nativeName: "El Mofongo", pronunciation: "el mo-FON-go", description: "Fried green plantains mashed with garlic and chicharron, often filled with shrimp or chicken", region: "Nationwide", whenEaten: "Dinner, restaurants", relatedWords: ["el pilon", "el ajo", "el chicharron", "los camarones"] },
    { name: "Chimichurri Burger", nativeName: "El Chimi", pronunciation: "el CHEE-mee", description: "Dominican street burger with cabbage slaw, ketchup, and mayo in a soft bun - sold from carts at night", region: "Urban areas", whenEaten: "Late night street food", relatedWords: ["el carrito", "la repollo", "la salsa", "de noche"] },
    { name: "Locrio de Chuleta con Maíz", nativeName: "El Locrio de Chuleta con Maíz", pronunciation: "el lo-KREE-oh deh choo-LEH-ta kon ma-EES", description: "Dominican rice dish cooked with pork chops and corn - a one-pot comfort food where the rice absorbs all the seasoned pork flavor. Similar to a paella but uniquely Caribbean.", region: "Nationwide, especially rural areas", whenEaten: "Lunch, family gatherings", relatedWords: ["el arroz", "la chuleta", "el maíz", "el sofrito", "la olla", "guisar"] },
    { name: "Locrio de Pollo", nativeName: "El Locrio de Pollo", pronunciation: "el lo-KREE-oh deh PO-yo", description: "Chicken rice pilaf Dominican style - seasoned with sofrito, olives, and capers. Every Dominican grandmother has her own secret recipe.", region: "Nationwide", whenEaten: "Everyday lunch", relatedWords: ["el pollo", "el arroz", "las aceitunas", "las alcaparras", "el sofrito"] },
    { name: "Habichuelas con Dulce", nativeName: "Las Habichuelas con Dulce", pronunciation: "las ah-bee-CHWEH-las kon DOOL-seh", description: "Sweet cream of red beans with milk, cinnamon, raisins, and sweet potato - a beloved Lenten dessert that families make in huge batches to share with neighbors", region: "Nationwide", whenEaten: "Lent, Easter season", relatedWords: ["las habichuelas rojas", "la leche", "la canela", "las pasas", "la batata"] },
    { name: "Yaroa", nativeName: "La Yaroa", pronunciation: "la ya-RO-ah", description: "Dominican loaded fries - layers of fries, chicken or beef, cheese sauce, ketchup and mayo. The ultimate late-night street food.", region: "Urban areas", whenEaten: "Late night, parties", relatedWords: ["las papas fritas", "el queso", "la carne", "la salsa"] },
    { name: "Tostones", nativeName: "Los Tostones", pronunciation: "los tos-TOH-nes", description: "Twice-fried green plantain slices - crispy on the outside, soft inside. Served with everything as a side dish.", region: "Nationwide, also Haitian (bannann peze)", whenEaten: "Any meal, snack", relatedWords: ["el platano verde", "freir", "aplastar", "la sal"] },
  ],
  music: [
    { name: "Merengue", nativeName: "El Merengue", pronunciation: "el meh-REN-geh", description: "Fast-paced dance music with accordion, tambora drum, and guira - the national dance", famousArtists: ["Juan Luis Guerra", "Wilfrido Vargas", "Johnny Ventura", "Milly Quezada"], danceStyle: "Partners face each other, hold hands or waist, move hips side-to-side in quick 2-step rhythm", instruments: ["la tambora", "la guira", "el acordeon", "el bajo"] },
    { name: "Bachata", nativeName: "La Bachata", pronunciation: "la ba-CHA-ta", description: "Romantic guitar-driven music born in Dominican barrios. Slow sensual dance with a signature hip pop on the 4th beat.", famousArtists: ["Romeo Santos", "Prince Royce", "Aventura", "Frank Reyes"], danceStyle: "Side-to-side basic step with hip pop on beat 4, close body contact, romantic partner dance", instruments: ["la guitarra", "el bongo", "la guira", "el bajo"] },
    { name: "Dembow", nativeName: "El Dembow", pronunciation: "el dem-BOW", description: "Dominican urban music with heavy bass and rapid-fire lyrics - the sound of the streets and parties", famousArtists: ["El Alfa", "Rochy RD", "Tokischa", "Chimbala"], danceStyle: "Free-form energetic movement, twerking, bouncing", instruments: ["el beat electronico", "el sintetizador"] },
  ],
  traditions: [
    { name: "Carnival", nativeName: "El Carnaval Dominicano", pronunciation: "el kar-na-VAL", description: "February celebration with elaborate devil costumes (diablos cojuelos) who hit bystanders with vejigas (inflated bladders). Each town has unique characters.", when: "Every Sunday in February, culminating February 27 (Independence Day)", activities: ["desfilar", "bailar", "disfrazarse", "correr de los diablos"], foods: ["chenchen", "chaca", "dulce de coco"], vocabulary: [{ word: "el diablo cojuelo", pronunciation: "dee-AH-blo ko-HWEH-lo", meaning: "limping devil (carnival character)" }, { word: "la vejiga", pronunciation: "veh-HEE-ga", meaning: "inflated bladder used to hit people" }, { word: "el disfraz", pronunciation: "dees-FRAS", meaning: "costume" }] },
    { name: "Christmas Season", nativeName: "La Navidad", pronunciation: "la na-vee-DAD", description: "Celebrations from December through January 6. Families gather for midnight dinner on Nochebuena, exchange gifts on Jan 6.", when: "December 1 - January 6", activities: ["cenar en familia", "bailar", "intercambiar regalos", "ir a misa"], foods: ["el puerco asado", "el telera", "el ponche", "los pasteles en hoja"], vocabulary: [{ word: "Nochebuena", pronunciation: "NO-che-BWEH-na", meaning: "Christmas Eve" }, { word: "los Reyes Magos", pronunciation: "REH-yes MA-gos", meaning: "Three Wise Men (gift-givers)" }, { word: "el aguinaldo", pronunciation: "a-gee-NAL-do", meaning: "Christmas bonus/gift" }] },
    { name: "Semana Santa", nativeName: "La Semana Santa", pronunciation: "seh-MA-na SAN-ta", description: "Holy Week - entire country goes to the beach. Families pack coolers, set up at the shore. No meat on Friday.", when: "Week before Easter (March/April)", activities: ["ir a la playa", "comer habichuelas con dulce", "no comer carne", "reunirse en familia"], foods: ["habichuelas con dulce", "pescado", "arroz con leche"], vocabulary: [{ word: "habichuelas con dulce", pronunciation: "a-bee-CHWEH-las kon DUL-seh", meaning: "sweet cream bean dessert" }, { word: "Viernes Santo", pronunciation: "vee-ER-nes SAN-to", meaning: "Good Friday" }] },
  ],
  figures: [
    { name: "Juan Luis Guerra", field: "Music", description: "Grammy-winning merengue and bachata artist known for poetic lyrics", famousQuote: "Ojala que llueva cafe en el campo", quoteTranslation: "I wish it would rain coffee in the countryside" },
    { name: "Oscar de la Renta", field: "Fashion", description: "World-famous Dominican fashion designer who dressed First Ladies and Hollywood stars" },
  ],
  etiquette: [
    { situation: "Greeting someone", doThis: "Kiss on the cheek (one kiss) for women, handshake for men, hug for close friends", nativePhrase: "Que lo que?", pronunciation: "keh lo keh", meaning: "What's up? (Dominican slang greeting)", culturalNote: "This is THE Dominican greeting - more common than hola in casual settings" },
    { situation: "Entering a room", doThis: "Greet everyone individually, even in a large group", nativePhrase: "Buenas", pronunciation: "BWEH-nas", meaning: "Short for buenos dias/buenas tardes - universal greeting", culturalNote: "Not greeting everyone is considered extremely rude" },
    { situation: "Being offered food", doThis: "Always accept at least a small portion - refusing is offensive", nativePhrase: "Si, gracias, un chin", pronunciation: "see GRA-see-as oon cheen", meaning: "Yes thanks, just a little bit", culturalNote: "Un chin means a little in Dominican Spanish - used constantly" },
  ],
  proverbs: [
    { text: "Dime con quien andas y te dire quien eres", pronunciation: "DEE-meh kon kee-EN AN-das ee teh dee-REH kee-EN EH-res", meaning: "Tell me who you walk with and I'll tell you who you are", lesson: "You are judged by the company you keep" },
    { text: "Camaron que se duerme, se lo lleva la corriente", pronunciation: "ka-ma-RON keh seh DWER-meh seh lo YEH-va la ko-ree-EN-teh", meaning: "The shrimp that falls asleep gets carried by the current", lesson: "Stay alert or you'll miss opportunities" },
  ],
  greetings: [
    { formal: "Buenos dias, como esta usted?", informal: "Que lo que, manito?", slang: "Klk, loco!", pronunciation: "keh-lo-keh / ka-ele-ka" },
  ],
};

// === FRENCH ===
const french: CulturalContent = {
  language: "French",
  languageCode: "fr",
  foods: [
    { name: "Croissant", nativeName: "Le Croissant", pronunciation: "luh kwah-SAHN", description: "Flaky buttery crescent pastry - the symbol of French breakfast", region: "Nationwide", whenEaten: "Breakfast, with cafe au lait", relatedWords: ["la boulangerie", "le beurre", "la pate feuilletee", "le petit-dejeuner"] },
    { name: "Coq au Vin", nativeName: "Le Coq au Vin", pronunciation: "luh kok oh VAN", description: "Chicken braised in red wine with mushrooms, lardons, and pearl onions", region: "Burgundy", whenEaten: "Sunday dinner, special occasions", relatedWords: ["le vin rouge", "les champignons", "les lardons", "mijoter"] },
    { name: "Crepes", nativeName: "Les Crepes", pronunciation: "lay KREP", description: "Paper-thin pancakes filled sweet (Nutella, sugar, lemon) or savory (ham, cheese, egg)", region: "Brittany (origin), nationwide", whenEaten: "Snack, dessert, Chandeleur (Feb 2)", relatedWords: ["la creperie", "la galette", "le sarrasin", "la Chandeleur"] },
  ],
  music: [
    { name: "Chanson Francaise", nativeName: "La Chanson Francaise", pronunciation: "la shahn-SOHN frahn-SEZ", description: "French art song tradition emphasizing poetic lyrics and emotional delivery", famousArtists: ["Edith Piaf", "Jacques Brel", "Charles Aznavour"], instruments: ["l'accordeon", "la guitare", "le piano"] },
  ],
  traditions: [
    { name: "Bastille Day", nativeName: "La Fete Nationale / Le 14 Juillet", pronunciation: "luh ka-TORZ zhwee-YEH", description: "National holiday celebrating the French Revolution. Military parade on Champs-Elysees, fireworks at Eiffel Tower.", when: "July 14", activities: ["regarder le defile", "danser au bal", "voir les feux d'artifice"], foods: ["le champagne", "les macarons", "le fromage"], vocabulary: [{ word: "le defile", pronunciation: "deh-fee-LAY", meaning: "parade" }, { word: "les feux d'artifice", pronunciation: "fuh dar-tee-FEES", meaning: "fireworks" }, { word: "la liberte", pronunciation: "lee-behr-TAY", meaning: "freedom" }] },
    { name: "Chandeleur", nativeName: "La Chandeleur", pronunciation: "la shahn-duh-LUHR", description: "Candlemas on Feb 2 - everyone makes crepes! Flip a crepe while holding a coin for prosperity.", when: "February 2", activities: ["faire des crepes", "retourner la crepe", "tenir une piece"], foods: ["les crepes", "le cidre", "la confiture"], vocabulary: [{ word: "retourner", pronunciation: "ruh-toor-NAY", meaning: "to flip" }, { word: "la piece", pronunciation: "pee-ESS", meaning: "coin" }, { word: "la poele", pronunciation: "pwahl", meaning: "frying pan" }] },
  ],
  figures: [
    { name: "Edith Piaf", field: "Music", description: "The Little Sparrow - France's most beloved singer", famousQuote: "Non, je ne regrette rien", quoteTranslation: "No, I regret nothing" },
  ],
  etiquette: [
    { situation: "Greeting someone", doThis: "La bise - kiss on both cheeks. Always greet the shopkeeper when entering.", nativePhrase: "Bonjour, Madame/Monsieur", pronunciation: "bohn-ZHOOR ma-DAM/muh-SYUH", meaning: "Good day, Ma'am/Sir", culturalNote: "NEVER skip bonjour when entering a shop - extremely rude" },
  ],
  proverbs: [
    { text: "Petit a petit, l'oiseau fait son nid", pronunciation: "puh-TEE ah puh-TEE lwah-ZOH feh sohn NEE", meaning: "Little by little, the bird builds its nest", lesson: "Patience and persistence lead to success" },
  ],
  greetings: [
    { formal: "Bonjour, comment allez-vous?", informal: "Salut, ca va?", slang: "Wesh, ca roule?", pronunciation: "sa-LUE sa VA / wesh sa ROOL" },
  ],
};

// === JAPANESE ===
const japanese: CulturalContent = {
  language: "Japanese",
  languageCode: "ja",
  foods: [
    { name: "Ramen", nativeName: "ラーメン", pronunciation: "RAH-men", description: "Soul-warming noodle soup with rich broth, topped with chashu pork, egg, and green onions", region: "Nationwide (regional styles)", whenEaten: "Lunch, dinner, late night", relatedWords: ["麺 (men)", "スープ (suupu)", "チャーシュー (chaashuu)", "替え玉 (kaedama)"] },
    { name: "Onigiri", nativeName: "おにぎり", pronunciation: "oh-NEE-gee-ree", description: "Rice balls shaped by hand, filled with salmon, umeboshi, or tuna mayo, wrapped in nori", region: "Nationwide", whenEaten: "Anytime - breakfast, lunch, snack", relatedWords: ["ご飯 (gohan)", "海苔 (nori)", "梅干し (umeboshi)", "鮭 (sake)"] },
    { name: "Sushi", nativeName: "お寿司", pronunciation: "oh-SOO-shee", description: "Vinegared rice with fresh fish - from conveyor belt casual to omakase fine dining", region: "Nationwide", whenEaten: "Special occasions, celebrations", relatedWords: ["刺身 (sashimi)", "醤油 (shouyu)", "わさび (wasabi)", "板前 (itamae)"] },
  ],
  music: [
    { name: "J-Pop", nativeName: "ジェイポップ", pronunciation: "JAY-pop", description: "Japanese pop music - catchy melodies, idol groups, anime themes", famousArtists: ["YOASOBI", "Ado", "米津玄師 (Kenshi Yonezu)"], instruments: ["ギター", "シンセサイザー", "ドラム"] },
  ],
  traditions: [
    { name: "New Year", nativeName: "お正月", pronunciation: "oh-SHOW-ga-tsu", description: "Most important holiday. Families clean house, eat osechi ryori, visit shrines, and send postcards.", when: "January 1-3", activities: ["初詣に行く", "おせちを食べる", "年賀状を書く", "お年玉をあげる"], foods: ["おせち料理", "お雑煮", "お餅"], vocabulary: [{ word: "お年玉", pronunciation: "oh-toh-shee-DA-ma", meaning: "money gift to children in decorated envelopes" }, { word: "初詣", pronunciation: "ha-tsu-MOH-deh", meaning: "first shrine visit of the year" }, { word: "大掃除", pronunciation: "oh-SOH-jee", meaning: "big year-end cleaning" }] },
    { name: "Obon Festival", nativeName: "お盆", pronunciation: "oh-BON", description: "Buddhist festival honoring ancestors. Spirits return home - families light lanterns, dance bon-odori.", when: "August 13-16", activities: ["盆踊りを踊る", "お墓参りをする", "提灯を灯す"], foods: ["素麺", "精進料理", "お団子"], vocabulary: [{ word: "盆踊り", pronunciation: "bon-OH-doh-ree", meaning: "Obon dance (community circle dance)" }, { word: "お墓参り", pronunciation: "oh-HA-ka-MA-ee-ree", meaning: "visiting family graves" }, { word: "提灯", pronunciation: "CHOH-chin", meaning: "paper lantern" }] },
  ],
  figures: [
    { name: "宮崎駿 (Miyazaki Hayao)", field: "Film/Animation", description: "Creator of Studio Ghibli masterpieces - Spirited Away, My Neighbor Totoro" },
  ],
  etiquette: [
    { situation: "Before eating", doThis: "Put palms together and say itadakimasu", nativePhrase: "いただきます", pronunciation: "ee-ta-da-kee-MASS", meaning: "I humbly receive (this food)", culturalNote: "Expresses gratitude to everyone who made the meal possible" },
  ],
  proverbs: [
    { text: "七転び八起き", pronunciation: "na-na-ko-ro-bee ya-oh-kee", meaning: "Fall seven times, stand up eight", lesson: "Perseverance through failure" },
  ],
  greetings: [
    { formal: "はじめまして、よろしくお願いします", informal: "やあ、元気？", slang: "おっす！", pronunciation: "ha-jee-meh-MASH-teh / yah GEN-kee / OSS" },
  ],
};

// === KOREAN ===
const korean: CulturalContent = {
  language: "Korean",
  languageCode: "ko",
  foods: [
    { name: "Kimchi", nativeName: "김치", pronunciation: "GEEM-chee", description: "Fermented spicy cabbage - Korea's soul food. Every family has their own recipe.", region: "Nationwide", whenEaten: "Every single meal", relatedWords: ["배추 (baechu)", "고춧가루 (gochugaru)", "젓갈 (jeotgal)", "김장 (gimjang)"] },
    { name: "Korean BBQ", nativeName: "삼겹살", pronunciation: "sam-GYUP-sal", description: "Grilled meat at the table - wrap in lettuce with garlic, ssamjang, and kimchi", region: "Nationwide", whenEaten: "Dinner, celebrations", relatedWords: ["상추 (sangchu)", "쌈장 (ssamjang)", "소주 (soju)", "불판 (bulpan)"] },
    { name: "Tteokbokki", nativeName: "떡볶이", pronunciation: "DDUK-bo-kee", description: "Spicy stir-fried rice cakes in gochujang sauce - the king of Korean street food", region: "Nationwide", whenEaten: "Snack, street food", relatedWords: ["떡 (tteok)", "고추장 (gochujang)", "어묵 (eomuk)", "분식 (bunsik)"] },
  ],
  music: [
    { name: "K-Pop", nativeName: "케이팝", pronunciation: "KAY-pop", description: "Global phenomenon - highly produced pop music with synchronized choreography", famousArtists: ["BTS (방탄소년단)", "BLACKPINK", "Stray Kids", "NewJeans"], danceStyle: "Synchronized group choreography with sharp movements", instruments: ["전자음악", "기타", "드럼"] },
  ],
  traditions: [
    { name: "Lunar New Year", nativeName: "설날", pronunciation: "SUHL-nal", description: "Most important holiday. Families gather, perform sebae (deep bow to elders), eat tteokguk, play games, wear hanbok.", when: "1st day of Lunar Calendar (Jan/Feb)", activities: ["세배하다", "떡국 먹다", "윷놀이 하다", "한복 입다"], foods: ["떡국", "잡채", "전", "식혜"], vocabulary: [{ word: "세배", pronunciation: "SEH-beh", meaning: "deep bow to elders (receive money in return)" }, { word: "세뱃돈", pronunciation: "seh-BET-don", meaning: "New Year's money (given after bowing)" }, { word: "한복", pronunciation: "HAN-bok", meaning: "traditional Korean clothing" }] },
    { name: "Chuseok", nativeName: "추석", pronunciation: "CHU-suk", description: "Korean Thanksgiving - harvest festival. Families visit ancestral graves, make songpyeon.", when: "15th day of 8th lunar month (Sep/Oct)", activities: ["성묘하다", "송편 만들다", "강강술래 하다"], foods: ["송편", "전", "잡채", "배"], vocabulary: [{ word: "송편", pronunciation: "SONG-pyun", meaning: "half-moon rice cakes filled with sesame or beans" }, { word: "차례", pronunciation: "CHA-ryeh", meaning: "ancestral memorial rite" }, { word: "보름달", pronunciation: "bo-REUM-dal", meaning: "full moon" }] },
  ],
  figures: [
    { name: "봉준호 (Bong Joon-ho)", field: "Film", description: "Director of Parasite - first non-English film to win Best Picture at the Oscars" },
  ],
  etiquette: [
    { situation: "Drinking with elders", doThis: "Turn away from elders when drinking, hold glass with both hands when receiving", nativePhrase: "건배!", pronunciation: "GUN-beh", meaning: "Cheers!", culturalNote: "NEVER pour your own drink - always pour for others" },
  ],
  proverbs: [
    { text: "고생 끝에 낙이 온다", pronunciation: "go-SENG kkeu-teh NA-gee on-da", meaning: "After hardship comes happiness", lesson: "Persevere through difficulty" },
  ],
  greetings: [
    { formal: "안녕하세요, 만나서 반갑습니다", informal: "안녕! 잘 지냈어?", slang: "야! 뭐해?", pronunciation: "an-nyung-ha-SEH-yo / an-NYUNG / YA mwo-HEH" },
  ],
};

// === ITALIAN ===
const italian: CulturalContent = {
  language: "Italian",
  languageCode: "it",
  foods: [
    { name: "Pasta Carbonara", nativeName: "La Carbonara", pronunciation: "la kar-bo-NA-ra", description: "Rome's iconic pasta - spaghetti with egg yolk, pecorino, guanciale, and black pepper. NO cream.", region: "Rome/Lazio", whenEaten: "Lunch or dinner", relatedWords: ["il guanciale", "il pecorino", "l'uovo", "il pepe nero"] },
    { name: "Pizza Napoletana", nativeName: "La Pizza Napoletana", pronunciation: "la PEET-sa na-po-leh-TA-na", description: "The original pizza - soft charred crust, San Marzano tomatoes, fresh mozzarella, basil", region: "Naples", whenEaten: "Dinner", relatedWords: ["il forno a legna", "la mozzarella", "il pomodoro", "l'impasto"] },
    { name: "Gelato", nativeName: "Il Gelato", pronunciation: "eel jeh-LA-to", description: "Italian ice cream - denser, less air, more intense flavor than regular ice cream", region: "Nationwide", whenEaten: "Afternoon passeggiata, after dinner", relatedWords: ["la gelateria", "il cono", "la coppetta", "il gusto"] },
  ],
  music: [
    { name: "Opera", nativeName: "L'Opera", pronunciation: "LO-peh-ra", description: "Italy invented opera - dramatic vocal art combining music, theater, and emotion", famousArtists: ["Luciano Pavarotti", "Andrea Bocelli", "Giuseppe Verdi"], instruments: ["la voce", "l'orchestra", "il pianoforte"] },
  ],
  traditions: [
    { name: "Ferragosto", nativeName: "Il Ferragosto", pronunciation: "eel feh-ra-GOS-to", description: "August 15 holiday - entire country goes on vacation. Cities empty, beaches packed.", when: "August 15 (but really all of August)", activities: ["andare al mare", "fare il bagno", "mangiare in famiglia"], foods: ["l'anguria", "la grigliata", "l'insalata di riso"], vocabulary: [{ word: "le ferie", pronunciation: "leh FEH-ree-eh", meaning: "vacation/holidays" }, { word: "il mare", pronunciation: "eel MA-reh", meaning: "the sea" }, { word: "la spiaggia", pronunciation: "la SPEE-ah-ja", meaning: "the beach" }] },
  ],
  figures: [
    { name: "Leonardo da Vinci", field: "Art/Science", description: "The ultimate Renaissance man - painter, inventor, scientist, engineer" },
  ],
  etiquette: [
    { situation: "Ordering coffee", doThis: "Stand at the bar, drink espresso quickly, never order cappuccino after 11am", nativePhrase: "Un caffe, per favore", pronunciation: "oon ka-FEH pehr fa-VO-reh", meaning: "An espresso, please", culturalNote: "In Italy caffe means espresso. Ordering a latte gets you a glass of milk." },
  ],
  proverbs: [
    { text: "Chi va piano, va sano e va lontano", pronunciation: "kee va pee-A-no va SA-no eh va lon-TA-no", meaning: "Who goes slowly, goes safely and goes far", lesson: "Patience leads to lasting success" },
  ],
  greetings: [
    { formal: "Buongiorno, come sta?", informal: "Ciao, come stai?", slang: "Bella! Che si dice?", pronunciation: "CHOW ko-meh STAI / BEL-la keh see DEE-cheh" },
  ],
};

// === PORTUGUESE (Brazilian) ===
const portuguese: CulturalContent = {
  language: "Portuguese",
  languageCode: "ptbr",
  foods: [
    { name: "Feijoada", nativeName: "A Feijoada", pronunciation: "ah fay-ZHWA-da", description: "Brazil's national dish - black bean stew with pork cuts, served with rice, collard greens, orange slices", region: "Nationwide", whenEaten: "Saturday lunch (tradition)", relatedWords: ["o feijao preto", "a couve", "a farofa", "a laranja"] },
    { name: "Pao de Queijo", nativeName: "O Pao de Queijo", pronunciation: "oh POWN deh KAY-zho", description: "Chewy cheese bread balls made with tapioca flour - addictively good, served warm", region: "Minas Gerais, nationwide", whenEaten: "Breakfast, snack", relatedWords: ["o polvilho", "o queijo", "a padaria", "o cafe"] },
    { name: "Acai Bowl", nativeName: "O Acai", pronunciation: "oh ah-sa-EE", description: "Frozen acai berry puree topped with granola, banana, and honey - energy food from the Amazon", region: "Para (origin), nationwide", whenEaten: "Post-workout, snack", relatedWords: ["a tigela", "a granola", "a banana", "o mel"] },
  ],
  music: [
    { name: "Samba", nativeName: "O Samba", pronunciation: "oh SAM-ba", description: "The heartbeat of Brazil - rhythmic music born in Rio's favelas. Drives Carnival.", famousArtists: ["Cartola", "Beth Carvalho", "Zeca Pagodinho", "Jorge Ben Jor"], danceStyle: "Quick footwork, hip movement, solo or partner", instruments: ["o surdo", "o pandeiro", "o cavaquinho", "o tamborim"] },
  ],
  traditions: [
    { name: "Carnival", nativeName: "O Carnaval", pronunciation: "oh kar-na-VAL", description: "The world's biggest party - 4 days of samba parades, blocos (street parties), costumes, and non-stop dancing.", when: "February/March (before Lent)", activities: ["desfilar", "sambar", "fantasiar-se", "pular carnaval"], foods: ["a caipirinha", "o acaraje", "a cerveja"], vocabulary: [{ word: "o bloco", pronunciation: "oh BLO-ko", meaning: "street party group with music truck" }, { word: "a fantasia", pronunciation: "ah fan-ta-ZEE-a", meaning: "costume" }, { word: "a escola de samba", pronunciation: "ah es-KO-la deh SAM-ba", meaning: "samba school (competitive parade group)" }] },
  ],
  figures: [
    { name: "Tom Jobim", field: "Music", description: "Father of Bossa Nova - composed The Girl from Ipanema" },
  ],
  etiquette: [
    { situation: "Greeting friends", doThis: "Kiss on both cheeks (Rio=2, SP=1, Minas=3)", nativePhrase: "E ai, tudo bem?", pronunciation: "ee ah-EE TOO-do BENG", meaning: "Hey, everything good?", culturalNote: "Brazilians are very physical - hugs, touches, standing close is normal" },
  ],
  proverbs: [
    { text: "Agua mole em pedra dura, tanto bate ate que fura", pronunciation: "AH-gwa MO-lee eng PEH-dra DOO-ra", meaning: "Soft water on hard stone, keeps hitting until it pierces", lesson: "Persistence overcomes any obstacle" },
  ],
  greetings: [
    { formal: "Bom dia, como vai?", informal: "E ai, beleza?", slang: "Fala, mano! Suave?", pronunciation: "ee-ah-EE beh-LEH-za / FA-la MA-no soo-AH-vee" },
  ],
};

// === GERMAN ===
const german: CulturalContent = {
  language: "German",
  languageCode: "de",
  foods: [
    { name: "Schnitzel", nativeName: "Das Schnitzel", pronunciation: "das SHNIT-sel", description: "Breaded and fried meat cutlet - served with lemon, potato salad, or fries", region: "Austria/Bavaria, nationwide", whenEaten: "Lunch or dinner", relatedWords: ["das Fleisch", "die Panade", "die Zitrone", "der Kartoffelsalat"] },
    { name: "Pretzel", nativeName: "Die Brezel", pronunciation: "dee BRET-sel", description: "Twisted bread with coarse salt - the iconic German bakery item", region: "Bavaria, nationwide", whenEaten: "Breakfast, snack, with beer", relatedWords: ["die Backerei", "das Salz", "die Butter", "der Senf"] },
  ],
  music: [
    { name: "Classical", nativeName: "Die Klassische Musik", pronunciation: "dee KLAS-ish-eh moo-ZEEK", description: "Germany produced Beethoven, Bach, Brahms, Wagner - the foundation of Western classical music", famousArtists: ["Beethoven", "Bach", "Brahms", "Wagner"], instruments: ["das Klavier", "die Geige", "die Orgel"] },
  ],
  traditions: [
    { name: "Christmas Markets", nativeName: "Der Weihnachtsmarkt", pronunciation: "dehr VY-nachts-markt", description: "Magical outdoor markets from late November through Christmas. Wooden stalls selling ornaments, Gluhwein, Lebkuchen.", when: "Late November - December 23", activities: ["Gluhwein trinken", "Geschenke kaufen", "Lebkuchen essen"], foods: ["der Gluhwein", "die Bratwurst", "der Lebkuchen"], vocabulary: [{ word: "der Gluhwein", pronunciation: "dehr GLUE-vine", meaning: "mulled wine (hot spiced wine)" }, { word: "der Adventskranz", pronunciation: "dehr ad-VENTS-krants", meaning: "Advent wreath (4 candles)" }, { word: "der Nikolaus", pronunciation: "dehr NEE-ko-laus", meaning: "St. Nicholas (brings gifts Dec 6)" }] },
  ],
  figures: [
    { name: "Ludwig van Beethoven", field: "Music", description: "Composed some of history's greatest music even after going deaf" },
  ],
  etiquette: [
    { situation: "Being punctual", doThis: "Arrive exactly on time - not early, not late", nativePhrase: "Punktlichkeit ist die Hoflichkeit der Konige", pronunciation: "PUENKT-likh-kite ist dee HUF-likh-kite dehr KUH-nee-geh", meaning: "Punctuality is the politeness of kings", culturalNote: "Being even 5 minutes late without notice is disrespectful" },
  ],
  proverbs: [
    { text: "Ubung macht den Meister", pronunciation: "UE-boong makht den MY-ster", meaning: "Practice makes the master", lesson: "Consistent practice leads to mastery" },
  ],
  greetings: [
    { formal: "Guten Tag, wie geht es Ihnen?", informal: "Hey, wie geht's?", slang: "Na, alles klar?", pronunciation: "GOO-ten TAHG / hey vee GAYTS / na AL-les KLAR" },
  ],
};

// === MANDARIN CHINESE ===
const mandarin: CulturalContent = {
  language: "Mandarin",
  languageCode: "zh",
  foods: [
    { name: "Dumplings", nativeName: "饺子", pronunciation: "jiao-zi", description: "Crescent-shaped dumplings filled with pork and cabbage - THE food of Chinese New Year", region: "Northern China, nationwide", whenEaten: "Chinese New Year, winter, family gatherings", relatedWords: ["包 (bao)", "馅儿 (xianr)", "饺子皮 (jiaozi pi)", "蘸酱 (zhan jiang)"] },
    { name: "Hot Pot", nativeName: "火锅", pronunciation: "huo-guo", description: "Communal bubbling pot of broth where you cook your own meat, vegetables, and noodles", region: "Sichuan (spicy), nationwide", whenEaten: "Dinner, social gatherings", relatedWords: ["锅底 (guo di)", "涮 (shuan)", "麻辣 (ma la)", "蘸料 (zhan liao)"] },
  ],
  music: [
    { name: "C-Pop", nativeName: "华语流行音乐", pronunciation: "hua-yu liu-xing yin-yue", description: "Chinese pop music - emotional ballads, catchy melodies, massive idol industry", famousArtists: ["周杰伦 (Jay Chou)", "邓紫棋 (G.E.M.)", "林俊杰 (JJ Lin)"], instruments: ["吉他", "钢琴", "电子合成器"] },
  ],
  traditions: [
    { name: "Chinese New Year", nativeName: "春节", pronunciation: "chun-jie", description: "The biggest celebration - 15 days of family reunion, red envelopes, fireworks, lion dances, and feasting.", when: "1st-15th of Lunar New Year (Jan/Feb)", activities: ["贴春联", "放鞭炮", "包饺子", "看春晚", "发红包"], foods: ["饺子", "年糕", "鱼", "汤圆"], vocabulary: [{ word: "红包", pronunciation: "hong-bao", meaning: "red envelope with money (lucky gift)" }, { word: "春联", pronunciation: "chun-lian", meaning: "red couplets posted on doors for luck" }, { word: "拜年", pronunciation: "bai-nian", meaning: "New Year's greetings/visits" }] },
  ],
  figures: [
    { name: "周杰伦 (Jay Chou)", field: "Music", description: "King of Mandopop - revolutionized Chinese pop by blending R&B, rap, and classical Chinese elements" },
  ],
  etiquette: [
    { situation: "Receiving a business card", doThis: "Accept with BOTH hands, study it carefully, never write on it", nativePhrase: "请多关照", pronunciation: "qing duo guan-zhao", meaning: "Please take care of me (polite business phrase)", culturalNote: "The business card represents the person - treating it carelessly = disrespecting them" },
  ],
  proverbs: [
    { text: "千里之行，始于足下", pronunciation: "qian li zhi xing, shi yu zu xia", meaning: "A journey of a thousand miles begins with a single step", lesson: "Every great achievement starts with one small action" },
  ],
  greetings: [
    { formal: "您好，很高兴认识您", informal: "嗨，最近怎么样？", slang: "哟，咋样？", pronunciation: "nin hao / hai zui-jin zen-me-yang / yo za-yang" },
  ],
};

// === DATABASE ===
const CULTURAL_DATABASE: Record<string, CulturalContent> = {
  esdo: spanishDominican,
  esmx: spanishDominican,
  es: spanishDominican,
  fr: french,
  ja: japanese,
  ko: korean,
  it: italian,
  ptbr: portuguese,
  pt: portuguese,
  de: german,
  zh: mandarin,
};
