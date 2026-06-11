import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════
// Generate French, Portuguese, and Arabic dialect curricula
// ═══════════════════════════════════════════════════════════════

const dialects = [
  // FRENCH DIALECTS
  {
    code: "fr-HT",
    varName: "FRENCH_HAITIAN_CREOLE",
    name: "Haitian Creole",
    flag: "🇭🇹",
    culture: {
      foods: ["griot (fried pork)", "diri ak djon djon (black mushroom rice)", "akra (malanga fritters)", "soup joumou (squash soup)", "pikliz (spicy coleslaw)", "bannann peze (fried plantains)"],
      dances: ["kompa (konpa)", "rara (street carnival music)", "yanvalou (vodou dance)", "méringue haïtienne"],
      holidays: ["Kanaval (Carnival)", "Fèt Gede (Day of the Dead)", "Independence Day (Jan 1)", "Rara Season (Lent)"],
      traditions: ["Vodou ceremonies", "storytelling (krik? krak!)", "tap-tap art buses", "iron market shopping"],
      greetings: ["Sak pase? (What's up?)", "N ap boule! (We're burning/doing great!)", "Bonjou (Good morning)", "Bonswa (Good evening)"],
      music: ["Wyclef Jean", "Tabou Combo", "Sweet Micky", "Boukman Eksperyans"],
      cities: ["Port-au-Prince", "Cap-Haïtien", "Jacmel", "Gonaïves"],
    }
  },
  {
    code: "fr-QC",
    varName: "FRENCH_QUEBECOIS",
    name: "Québécois French",
    flag: "🇨🇦",
    culture: {
      foods: ["poutine (fries, gravy, cheese curds)", "tourtière (meat pie)", "tire d'érable (maple taffy on snow)", "smoked meat sandwich", "cretons (pork spread)", "pouding chômeur (poor man's pudding)"],
      dances: ["gigue québécoise (jig)", "set carré (square dance)", "reel"],
      holidays: ["Saint-Jean-Baptiste (June 24)", "Carnaval de Québec (February)", "Festival d'été de Québec", "Cabane à sucre season (March)"],
      traditions: ["cabane à sucre (sugar shack)", "hockey culture", "joual slang", "5 à 7 (happy hour)"],
      greetings: ["Allô! (Hey!)", "Comment ça va, là? (How's it going?)", "Bienvenue! (You're welcome — NOT 'de rien')", "Pantoute! (Not at all!)"],
      music: ["Céline Dion", "Les Cowboys Fringants", "Harmonium", "Beau Dommage"],
      cities: ["Montréal", "Québec City", "Trois-Rivières", "Sherbrooke"],
    }
  },
  {
    code: "fr-SN",
    varName: "FRENCH_AFRICAN",
    name: "African French (Senegalese)",
    flag: "🇸🇳",
    culture: {
      foods: ["thiéboudienne (fish and rice)", "yassa poulet (onion chicken)", "mafé (peanut stew)", "thiéré (couscous)", "bissap (hibiscus juice)", "café Touba (spiced coffee)"],
      dances: ["sabar (drum dance)", "mbalax (dance)", "ndaga", "ventilateur"],
      holidays: ["Tabaski (Eid al-Adha)", "Korité (Eid al-Fitr)", "Grand Magal de Touba", "Independence Day (April 4)"],
      traditions: ["teranga (hospitality)", "ataya (tea ceremony)", "griot storytelling", "wrestling (la lutte)"],
      greetings: ["Nanga def? (How are you? — Wolof)", "Ça va un peu? (How's it going?)", "Je suis là (I'm here/I'm fine)", "On est ensemble (We're together/solidarity)"],
      music: ["Youssou N'Dour", "Baaba Maal", "Akon", "Wally Seck"],
      cities: ["Dakar", "Saint-Louis", "Thiès", "Gorée Island"],
    }
  },
  // PORTUGUESE DIALECTS
  {
    code: "pt-BR",
    varName: "PORTUGUESE_BRAZILIAN",
    name: "Brazilian Portuguese",
    flag: "🇧🇷",
    culture: {
      foods: ["feijoada (black bean stew)", "pão de queijo (cheese bread)", "açaí bowl", "coxinha (chicken croquette)", "brigadeiro (chocolate truffle)", "churrasco (BBQ)"],
      dances: ["samba", "forró", "axé", "funk carioca", "frevo", "bossa nova"],
      holidays: ["Carnaval (February/March)", "Festa Junina (June)", "Réveillon (New Year's)", "Dia da Consciência Negra (Nov 20)"],
      traditions: ["roda de samba", "jeitinho brasileiro", "futebol culture", "novela (soap opera) watching"],
      greetings: ["E aí? (What's up?)", "Tudo bem? (All good?)", "Beleza! (Cool!)", "Valeu! (Thanks!)", "Falou! (See ya!)"],
      music: ["Tom Jobim", "Gilberto Gil", "Anitta", "Jorge Ben Jor", "Caetano Veloso"],
      cities: ["Rio de Janeiro", "São Paulo", "Salvador", "Recife", "Belo Horizonte"],
    }
  },
  {
    code: "pt-PT",
    varName: "PORTUGUESE_EUROPEAN",
    name: "European Portuguese",
    flag: "🇵🇹",
    culture: {
      foods: ["bacalhau (salt cod — 365 recipes!)", "pastel de nata (custard tart)", "caldo verde (kale soup)", "francesinha (Porto sandwich)", "sardinhas assadas (grilled sardines)", "arroz de marisco (seafood rice)"],
      dances: ["fado (emotional singing)", "vira (folk dance)", "corridinho (Algarve dance)"],
      holidays: ["Santos Populares (June — Lisbon)", "Dia de Portugal (June 10)", "Carnaval de Torres Vedras", "Festas do Senhor Santo Cristo (Azores)"],
      traditions: ["saudade (untranslatable longing)", "azulejo tiles", "café culture", "passeio (evening stroll)"],
      greetings: ["Olá! (Hello)", "Tudo bem? (All good?)", "Bom dia! (Good morning)", "Está bom? (Is it good?/How are you?)"],
      music: ["Amália Rodrigues", "Mariza", "Madredeus", "Ana Moura"],
      cities: ["Lisboa (Lisbon)", "Porto", "Coimbra", "Faro", "Sintra"],
    }
  },
  // ARABIC DIALECTS
  {
    code: "ar-EG",
    varName: "ARABIC_EGYPTIAN",
    name: "Egyptian Arabic",
    flag: "🇪🇬",
    culture: {
      foods: ["koshari (lentils, rice, pasta, tomato sauce)", "ful medames (fava beans)", "ta'ameya (falafel)", "molokhia (jute leaf stew)", "shawarma", "om ali (bread pudding)"],
      dances: ["raqs sharqi (belly dance)", "tanoura (Sufi whirling)", "dabke"],
      holidays: ["Sham el-Nessim (spring festival)", "Eid al-Fitr", "Eid al-Adha", "Moulid el-Nabi (Prophet's birthday)"],
      traditions: ["ahwa (coffee shop) culture", "Khan el-Khalili bazaar", "felucca rides on the Nile", "shisha smoking"],
      greetings: ["Ezayak? (How are you? — to male)", "Ezayik? (How are you? — to female)", "Ahlan wa sahlan! (Welcome!)", "Yalla! (Let's go!)", "Inshallah (God willing)"],
      music: ["Umm Kulthum", "Amr Diab", "Mohamed Mounir", "Abdel Halim Hafez"],
      cities: ["Cairo (القاهرة)", "Alexandria (الإسكندرية)", "Luxor (الأقصر)", "Aswan (أسوان)"],
    }
  },
  {
    code: "ar-LB",
    varName: "ARABIC_LEVANTINE",
    name: "Levantine Arabic (Lebanese)",
    flag: "🇱🇧",
    culture: {
      foods: ["hummus", "tabbouleh", "kibbeh (meat croquette)", "manoushe (flatbread with za'atar)", "fattoush (bread salad)", "knafeh (cheese pastry)"],
      dances: ["dabke (line dance)", "belly dance"],
      holidays: ["Eid al-Fitr", "Eid al-Adha", "Christmas (big in Lebanon)", "Independence Day (Nov 22)", "Baalbeck Festival"],
      traditions: ["mezze culture (sharing many small dishes)", "arak drinking", "Gemmayzeh nightlife", "mountain villages"],
      greetings: ["Kifak? (How are you? — to male)", "Kifik? (How are you? — to female)", "Ahla! (Hey!)", "Habibi/Habibti (My love — used casually)", "Yalla! (Let's go!)"],
      music: ["Fairuz", "Marcel Khalife", "Nancy Ajram", "Majida El Roumi"],
      cities: ["Beirut (بيروت)", "Byblos (جبيل)", "Baalbek (بعلبك)", "Tripoli (طرابلس)"],
    }
  },
  {
    code: "ar-AE",
    varName: "ARABIC_GULF",
    name: "Gulf Arabic (Emirati)",
    flag: "🇦🇪",
    culture: {
      foods: ["machboos (spiced rice with meat)", "luqaimat (sweet dumplings)", "harees (wheat porridge)", "thareed (bread stew)", "karak chai (spiced tea)", "dates with Arabic coffee"],
      dances: ["yowla (stick dance)", "ayyala (traditional war dance)", "liwa (African-influenced dance)", "harbiya"],
      holidays: ["Eid al-Fitr", "Eid al-Adha", "UAE National Day (Dec 2)", "Ramadan (holy month)"],
      traditions: ["majlis (sitting room gatherings)", "falcon hunting", "pearl diving heritage", "desert camping", "camel racing"],
      greetings: ["Shlonak? (How are you? — to male)", "Shlonich? (How are you? — to female)", "Hala wallah! (Welcome!)", "Mashkoor/Mashkoora (Thank you)", "Inshallah (God willing)"],
      music: ["Hussein Al Jasmi", "Ahlam", "Balqees", "Rashed Al Majed"],
      cities: ["Dubai (دبي)", "Abu Dhabi (أبو ظبي)", "Sharjah (الشارقة)", "Al Ain (العين)"],
    }
  },
];

// ═══════════════════════════════════════════════════════════════
// Unit templates per level
// ═══════════════════════════════════════════════════════════════

function getUnits(dialect) {
  const { code, culture } = dialect;
  const prefix = code.replace("-", "").toLowerCase();
  
  return [
    // A1 - Unit 1: First Steps
    {
      id: `${prefix}_a1_u1`,
      title: `First Steps — Greetings & Sounds`,
      level: "A1",
      order: 1,
      description: `Basic greetings, alphabet/sounds, and survival phrases in ${dialect.name}`,
      lessons: [
        { id: `${prefix}_a1_u1_l1`, title: "The Sound System", description: `Learn the unique sounds and pronunciation of ${dialect.name}`, category: "speaking", level: "A1", duration: 8, xp: 25, order: 1,
          culturalHint: `${dialect.name} has unique sounds that differ from standard forms. Practice with local greetings: ${culture.greetings.slice(0, 2).join(", ")}. Listen to ${culture.music[0]} to hear authentic pronunciation. The rhythm of ${dialect.name} reflects the culture of ${culture.cities[0]}.` },
        { id: `${prefix}_a1_u1_l2`, title: "Essential Greetings", description: `Hello, goodbye, please, thank you in ${dialect.name}`, category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 2,
          culturalHint: `Greetings in ${dialect.name}: ${culture.greetings.join(", ")}. In ${culture.cities[0]}, people greet warmly — it's part of the culture of ${culture.traditions[0]}. Never skip greetings; it's considered rude.` },
        { id: `${prefix}_a1_u1_l3`, title: "Numbers & Money", description: `Count 1-100 and handle money in ${culture.cities[0]}`, category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 3,
          culturalHint: `Practice numbers while ordering ${culture.foods[0]} at a local restaurant. In ${culture.cities[0]}, bargaining is ${code.startsWith("ar") ? "expected at the souk" : code === "fr-SN" ? "part of market culture" : "common at local markets"}. Learn to ask 'How much?' like a local.` },
        { id: `${prefix}_a1_u1_l4`, title: "At the Local Market", description: `Navigate a market in ${culture.cities[0]} — buying food and essentials`, category: "listening", level: "A1", duration: 9, xp: 30, order: 4,
          culturalHint: `You're at a market in ${culture.cities[0]}. Vendors call out selling ${culture.foods[1]} and ${culture.foods[2]}. Listen for prices, quantities, and the vendor's greeting. Market culture: ${culture.traditions[1] || culture.traditions[0]}.` },
        { id: `${prefix}_a1_u1_l5`, title: "Write Your First Sentences", description: `Introduce yourself and describe your day`, category: "writing", level: "A1", duration: 10, xp: 30, order: 5,
          culturalHint: `Write about yourself as if you just arrived in ${culture.cities[0]}. Describe what you see, what you want to eat (${culture.foods[0]}? ${culture.foods[3]}?), and how you greet people. Use: ${culture.greetings[0]}.` },
      ],
    },
    // A1 - Unit 2: Daily Life
    {
      id: `${prefix}_a1_u2`,
      title: `Daily Life & Food Culture`,
      level: "A1",
      order: 2,
      description: `Food, family, and daily routines in ${dialect.name} culture`,
      lessons: [
        { id: `${prefix}_a1_u2_l1`, title: "Local Food Vocabulary", description: `Learn the names of iconic dishes and ingredients`, category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 1,
          culturalHint: `Essential food vocabulary: ${culture.foods.map(f => f.split(" (")[0]).join(", ")}. In ${culture.cities[0]}, ${culture.foods[0]} is a staple — everyone eats it. Learn to order: '${code.startsWith("ar") ? "Biddi" : code.startsWith("pt") ? "Eu quero" : "Je veux"} ${culture.foods[0].split(" (")[0]}'.` },
        { id: `${prefix}_a1_u2_l2`, title: "Family & Relationships", description: `Family terms and how families interact in this culture`, category: "grammar", level: "A1", duration: 10, xp: 30, order: 2,
          culturalHint: `Family is central in ${dialect.name} culture. Extended families often live together or nearby. ${culture.traditions[0]} reflects the importance of community. Learn family terms and how to describe your family to new friends in ${culture.cities[0]}.` },
        { id: `${prefix}_a1_u2_l3`, title: "Ordering at a Restaurant", description: `Complete a meal order from greeting to paying`, category: "speaking", level: "A1", duration: 9, xp: 30, order: 3,
          culturalHint: `You're at a restaurant in ${culture.cities[0]}. The waiter greets you with '${culture.greetings[0]}'. Order ${culture.foods[0]} and ${culture.foods[4] || culture.foods[1]}. ${code.startsWith("ar") ? "Tipping is expected (10-15%)" : code === "pt-BR" ? "Look for 'serviço incluído' (service included)" : "Tipping customs vary by region"}.` },
        { id: `${prefix}_a1_u2_l4`, title: "Daily Routine", description: `Describe your morning, afternoon, and evening`, category: "writing", level: "A1", duration: 8, xp: 25, order: 4,
          culturalHint: `Write about a typical day in ${culture.cities[0]}. Morning: ${code.startsWith("ar") ? "wake for Fajr prayer, have ful and tea" : code === "pt-BR" ? "café da manhã with pão de queijo and strong coffee" : code === "fr-HT" ? "wake early, have café with bread" : "start with coffee and local breakfast"}. Evening: ${culture.traditions[2] || culture.traditions[1]}.` },
        { id: `${prefix}_a1_u2_l5`, title: "Reading Local Signs", description: `Understand menus, street signs, and notices`, category: "reading", level: "A1", duration: 7, xp: 20, order: 5,
          culturalHint: `Read real signs from ${culture.cities[0]}: restaurant menus featuring ${culture.foods[0]}, street names, shop signs. In ${culture.cities[1]}, signs might be different from ${culture.cities[0]}. Practice reading prices, hours, and directions.` },
      ],
    },
    // A2 - Unit 1: Getting Around
    {
      id: `${prefix}_a2_u1`,
      title: `Getting Around & Transportation`,
      level: "A2",
      order: 3,
      description: `Navigate cities, use transport, and ask for directions`,
      lessons: [
        { id: `${prefix}_a2_u1_l1`, title: "Directions & Navigation", description: `Ask for and give directions in ${culture.cities[0]}`, category: "speaking", level: "A2", duration: 10, xp: 30, order: 1,
          culturalHint: `Navigate ${culture.cities[0]} like a local. Key landmarks, neighborhoods, and how people give directions here. ${code === "ar-EG" ? "Egyptians use landmarks, not street names: 'next to the mosque', 'behind the pharmacy'" : code === "pt-BR" ? "Brazilians say 'segue reto' (go straight), 'vira à esquerda' (turn left)" : `In ${culture.cities[0]}, ask locals — they love helping visitors!`}` },
        { id: `${prefix}_a2_u1_l2`, title: "Public Transportation", description: `Buses, taxis, and local transport systems`, category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 2,
          culturalHint: `Transport in ${culture.cities[0]}: ${code === "ar-EG" ? "the Cairo Metro, microbuses, and Uber" : code === "ar-AE" ? "Dubai Metro, taxis, and Careem" : code === "pt-BR" ? "ônibus, metrô, and Uber" : code === "fr-QC" ? "STM bus and métro, bixi bikes" : code === "fr-HT" ? "tap-taps (colorful shared buses), motos" : code === "fr-SN" ? "car rapides, Dakar Dem Dikk buses, taxis" : "local buses and taxis"}. Learn to ask: 'How do I get to...?'` },
        { id: `${prefix}_a2_u1_l3`, title: "At the Hotel/Airbnb", description: `Check in, ask about amenities, handle problems`, category: "grammar", level: "A2", duration: 10, xp: 30, order: 3,
          culturalHint: `Staying in ${culture.cities[0]}? Learn to check in, ask for wifi, request extra towels, and report issues. ${code.startsWith("ar") ? "Hotels in the Arab world offer exceptional hospitality — 'الضيافة' (hospitality) is sacred" : `Accommodation culture in ${culture.cities[0]} reflects local ${culture.traditions[0]}`}.` },
        { id: `${prefix}_a2_u1_l4`, title: "Emergency Situations", description: `Health, safety, and asking for help`, category: "listening", level: "A2", duration: 9, xp: 30, order: 4,
          culturalHint: `Essential emergency phrases in ${dialect.name}. How to say 'Help!', 'I need a doctor', 'Call the police'. In ${culture.cities[0]}, ${code.startsWith("ar") ? "pharmacies are everywhere and pharmacists give medical advice freely" : "know the local emergency numbers and nearest hospital"}.` },
        { id: `${prefix}_a2_u1_l5`, title: "Travel Journal Entry", description: `Write about your experiences exploring the city`, category: "writing", level: "A2", duration: 10, xp: 30, order: 5,
          culturalHint: `Write a travel journal about ${culture.cities[0]}. Describe the sights (${culture.cities[1]}, ${culture.cities[2]}), the food you tried (${culture.foods[0]}, ${culture.foods[2]}), and the people you met. Use past tense to describe what happened.` },
      ],
    },
    // A2 - Unit 2: Culture & Entertainment
    {
      id: `${prefix}_a2_u2`,
      title: `Culture, Music & Entertainment`,
      level: "A2",
      order: 4,
      description: `Music, dance, celebrations, and entertainment culture`,
      lessons: [
        { id: `${prefix}_a2_u2_l1`, title: "Music & Dance", description: `Learn about ${culture.dances[0]} and local music culture`, category: "vocabulary", level: "A2", duration: 9, xp: 30, order: 1,
          culturalHint: `${dialect.name} music culture: ${culture.dances.join(", ")}. Listen to ${culture.music.join(", ")}. ${culture.dances[0]} is more than dance — it's identity. Learn the vocabulary of rhythm, instruments, and movement.` },
        { id: `${prefix}_a2_u2_l2`, title: "Festivals & Celebrations", description: `Major holidays and how they're celebrated`, category: "reading", level: "A2", duration: 10, xp: 30, order: 2,
          culturalHint: `Major celebrations: ${culture.holidays.join(", ")}. During ${culture.holidays[0]}, people ${code === "pt-BR" ? "dance samba in the streets for days" : code === "fr-HT" ? "fill the streets with rara music and dancing" : code === "ar-EG" ? "gather for family feasts and give money to children" : "celebrate with food, music, and family"}. Learn the vocabulary of celebration!` },
        { id: `${prefix}_a2_u2_l3`, title: "Talking About Hobbies", description: `Discuss interests, sports, and leisure activities`, category: "speaking", level: "A2", duration: 8, xp: 25, order: 3,
          culturalHint: `Popular hobbies in ${culture.cities[0]}: ${code === "pt-BR" ? "futebol, praia (beach), churrasco with friends, novelas" : code === "ar-EG" ? "football (ahli vs zamalek!), shisha, watching movies" : code === "ar-AE" ? "desert camping, falcon hunting, shopping, dune bashing" : code === "fr-QC" ? "hockey, skiing, cabane à sucre visits, festivals" : `${culture.traditions[2] || culture.traditions[1]}, music, and socializing`}. Talk about what you enjoy!` },
        { id: `${prefix}_a2_u2_l4`, title: "Understanding Song Lyrics", description: `Analyze a popular song in ${dialect.name}`, category: "listening", level: "A2", duration: 10, xp: 35, order: 4,
          culturalHint: `Listen to ${culture.music[0]} or ${culture.music[1]}. Break down the lyrics — learn new vocabulary, cultural references, and emotional expressions. ${dialect.name} songs often reference ${code.startsWith("ar") ? "love, homeland, and longing" : code === "pt-BR" ? "saudade, love, and the beauty of Brazil" : "love, struggle, and cultural pride"}.` },
        { id: `${prefix}_a2_u2_l5`, title: "Writing a Party Invitation", description: `Invite friends to a cultural celebration`, category: "writing", level: "A2", duration: 8, xp: 25, order: 5,
          culturalHint: `Write an invitation to a ${culture.holidays[0]} party! Include: date, time, location (${culture.cities[0]}), what to bring, what to wear, and what food will be served (${culture.foods[0]}, ${culture.foods[3]}). Use festive language and cultural expressions.` },
      ],
    },
    // B1 - Unit 1: Society & Current Events
    {
      id: `${prefix}_b1_u1`,
      title: `Society, History & Current Events`,
      level: "B1",
      order: 5,
      description: `Discuss history, social issues, and current events`,
      lessons: [
        { id: `${prefix}_b1_u1_l1`, title: "Historical Context", description: `Key historical events that shaped this culture`, category: "reading", level: "B1", duration: 12, xp: 35, order: 1,
          culturalHint: `${code === "fr-HT" ? "Haiti was the first Black republic (1804) — the only successful slave revolution in history. Toussaint Louverture, Dessalines, and the fight against Napoleon" : code === "fr-QC" ? "The Quiet Revolution (1960s) transformed Quebec from Catholic conservatism to secular modernity. Bill 101 protects French language rights" : code === "fr-SN" ? "Senegal's history: Gorée Island slave trade, Léopold Sédar Senghor (poet-president), négritude movement, independence from France in 1960" : code === "pt-BR" ? "Brazil's complex history: indigenous peoples, Portuguese colonization, slavery, the golden age, independence (1822), and modern democracy" : code === "pt-PT" ? "Age of Discovery, Vasco da Gama, the Carnation Revolution (1974) that ended dictatorship, EU membership" : code === "ar-EG" ? "5000 years of civilization: Pharaohs, Arab conquest, Ottoman rule, British colonialism, 1952 revolution, modern Egypt" : code === "ar-LB" ? "Phoenician heritage, Ottoman era, French mandate, independence, civil war (1975-1990), resilience and reconstruction" : "Pearl diving heritage, Bedouin traditions, oil discovery (1958), rapid modernization, Vision 2030"}. Discuss in ${dialect.name}.` },
        { id: `${prefix}_b1_u1_l2`, title: "Social Issues & Opinions", description: `Express opinions about current social topics`, category: "speaking", level: "B1", duration: 10, xp: 30, order: 2,
          culturalHint: `Discuss current issues in ${culture.cities[0]}: ${code === "pt-BR" ? "inequality, education access, environmental protection of the Amazon" : code === "ar-EG" ? "youth unemployment, education reform, cultural preservation" : code === "fr-HT" ? "rebuilding after disasters, diaspora connections, cultural preservation" : code === "ar-AE" ? "sustainability, cultural identity in modernization, youth empowerment" : "social change, cultural preservation, and economic development"}. Learn to express opinions respectfully.` },
        { id: `${prefix}_b1_u1_l3`, title: "News & Media", description: `Understand news broadcasts and articles`, category: "listening", level: "B1", duration: 11, xp: 35, order: 3,
          culturalHint: `Listen to news from ${culture.cities[0]}. Popular media sources, how news is reported, and key vocabulary for current events. ${code.startsWith("ar") ? "Al Jazeera, BBC Arabic, and local channels" : code === "pt-BR" ? "Globo, Folha de São Paulo, and social media news" : "Local radio, TV, and online media"}. Practice summarizing what you hear.` },
        { id: `${prefix}_b1_u1_l4`, title: "Formal vs Informal Register", description: `Switch between formal and casual speech appropriately`, category: "grammar", level: "B1", duration: 12, xp: 35, order: 4,
          culturalHint: `${dialect.name} has distinct formal/informal registers. ${code === "pt-BR" ? "'Você' (you-informal) vs 'o senhor/a senhora' (you-formal). Brazilians are generally informal but respect hierarchy" : code === "ar-EG" ? "Egyptian Arabic uses 'حضرتك' (hadretak) for formal respect. Know when to use MSA vs dialect" : code === "fr-QC" ? "Québécois 'tu' everyone (even strangers!), unlike France's strict 'vous' rules" : `Knowing when to be formal vs casual in ${culture.cities[0]} shows cultural competence`}.` },
        { id: `${prefix}_b1_u1_l5`, title: "Opinion Essay", description: `Write a structured opinion piece on a cultural topic`, category: "writing", level: "B1", duration: 12, xp: 35, order: 5,
          culturalHint: `Write about: '${code === "pt-BR" ? "Is Carnival just a party or a cultural expression of resistance?" : code === "ar-EG" ? "How does ancient Egyptian heritage influence modern Egyptian identity?" : code === "fr-HT" ? "How has Haitian Creole evolved from French colonialism to become a symbol of independence?" : code === "ar-AE" ? "How does the UAE balance modernization with preserving Bedouin traditions?" : `What makes ${dialect.name} culture unique in the modern world?`}' Use connectors, evidence, and conclusion.` },
      ],
    },
    // B1 - Unit 2: Work & Professional Life
    {
      id: `${prefix}_b1_u2`,
      title: `Work, Business & Professional Life`,
      level: "B1",
      order: 6,
      description: `Professional communication, job culture, and business etiquette`,
      lessons: [
        { id: `${prefix}_b1_u2_l1`, title: "Workplace Culture", description: `How work culture differs in this region`, category: "reading", level: "B1", duration: 10, xp: 30, order: 1,
          culturalHint: `Work culture in ${culture.cities[0]}: ${code === "pt-BR" ? "Relationships matter more than punctuality. 'Jeitinho' (finding creative solutions) is valued. Lunch breaks are long and social" : code === "ar-EG" ? "Relationships come first — expect tea/coffee before business. Hierarchy is important. Friday is the weekend" : code === "ar-AE" ? "Business is relationship-based. The work week is Mon-Fri. Meetings start with pleasantries. Ramadan affects work hours" : code === "fr-QC" ? "5 à 7 (happy hour networking), bilingual workplaces, strong labor protections" : `Professional norms in ${culture.cities[0]} reflect ${culture.traditions[0]}`}.` },
        { id: `${prefix}_b1_u2_l2`, title: "Job Interview Practice", description: `Prepare for and conduct a job interview`, category: "speaking", level: "B1", duration: 12, xp: 35, order: 2,
          culturalHint: `Practice a job interview in ${dialect.name}. Key phrases: introduce yourself, describe experience, ask about the role. In ${culture.cities[0]}, ${code.startsWith("ar") ? "personal connections (wasta) often matter. Dress formally, bring certificates" : "be prepared to discuss both skills and cultural fit"}.` },
        { id: `${prefix}_b1_u2_l3`, title: "Email & Professional Writing", description: `Write formal emails, reports, and messages`, category: "writing", level: "B1", duration: 10, xp: 30, order: 3,
          culturalHint: `Professional email etiquette in ${dialect.name}. ${code.startsWith("ar") ? "Start with 'بسم الله الرحمن الرحيم' (In the name of God) for formal letters. Use 'السلام عليكم' (Peace be upon you) as greeting" : code === "pt-BR" ? "Start with 'Prezado/a' (Dear), end with 'Atenciosamente' (Sincerely). Brazilians are warm even in formal writing" : code === "fr-QC" ? "Use 'Bonjour' (not 'Cher'), end with 'Cordialement'. Quebec French formal writing differs from France" : `Formal writing conventions in ${dialect.name}`}.` },
        { id: `${prefix}_b1_u2_l4`, title: "Negotiation & Persuasion", description: `Negotiate prices, terms, and agreements`, category: "grammar", level: "B1", duration: 11, xp: 35, order: 4,
          culturalHint: `Negotiation culture: ${code === "ar-EG" ? "Bargaining is an art in Egypt — start at 50% of asking price, drink tea together, take your time" : code === "ar-AE" ? "Business negotiations are formal but personal. Never rush. Building trust (ثقة) comes first" : code === "pt-BR" ? "Brazilians negotiate with warmth. 'Dar um jeitinho' means finding a creative solution. Relationships unlock deals" : code === "fr-SN" ? "In Senegal, negotiation is social — rushing is rude. Share ataya (tea) first" : `Negotiation in ${culture.cities[0]} requires patience and cultural awareness`}.` },
        { id: `${prefix}_b1_u2_l5`, title: "Listening: Business Meeting", description: `Understand a recorded business meeting`, category: "listening", level: "B1", duration: 10, xp: 30, order: 5,
          culturalHint: `Listen to a business meeting in ${dialect.name}. Notice how people address each other, how decisions are made, and how disagreements are handled. In ${culture.cities[0]}, ${code.startsWith("ar") ? "consensus and saving face are important — direct confrontation is avoided" : "meeting dynamics reflect the local communication style"}.` },
      ],
    },
    // B2 - Unit 1: Advanced Culture
    {
      id: `${prefix}_b2_u1`,
      title: `Deep Culture & Identity`,
      level: "B2",
      order: 7,
      description: `Literature, philosophy, identity, and cultural depth`,
      lessons: [
        { id: `${prefix}_b2_u1_l1`, title: "Literature & Poetry", description: `Read and discuss famous works from this culture`, category: "reading", level: "B2", duration: 15, xp: 40, order: 1,
          culturalHint: `${code === "fr-HT" ? "Haitian literature: Jacques Roumain's 'Gouverneurs de la Rosée', Edwidge Danticat, Dany Laferrière. The 'krik? krak!' storytelling tradition" : code === "fr-QC" ? "Québécois literature: Michel Tremblay's 'Les Belles-Sœurs' (in joual), Gabrielle Roy, Anne Hébert. The quiet revolution in literature" : code === "fr-SN" ? "Négritude movement: Léopold Sédar Senghor's poetry, Mariama Bâ's 'So Long a Letter', Ousmane Sembène's cinema" : code === "pt-BR" ? "Brazilian literature: Machado de Assis, Clarice Lispector, Jorge Amado. Tropicália movement, concrete poetry" : code === "pt-PT" ? "Fernando Pessoa (heteronyms!), José Saramago (Nobel Prize), Luís de Camões' 'Os Lusíadas'" : code === "ar-EG" ? "Naguib Mahfouz (Nobel Prize), Taha Hussein, Nawal El Saadawi. The Cairo Trilogy captures Egyptian society" : code === "ar-LB" ? "Khalil Gibran's 'The Prophet', Amin Maalouf, Hanan al-Shaykh. Lebanese diaspora literature" : "Emirati poetry tradition, nabati poetry, modern Gulf literature. Poetry is deeply valued in Arab culture"}.` },
        { id: `${prefix}_b2_u1_l2`, title: "Cultural Identity & Diaspora", description: `Discuss identity, belonging, and cultural preservation`, category: "speaking", level: "B2", duration: 12, xp: 35, order: 2,
          culturalHint: `${code === "fr-HT" ? "The Haitian diaspora (NYC, Miami, Montreal) maintains culture through food, music, and Creole. 'Dyaspora' identity — being between two worlds" : code === "fr-QC" ? "Québécois identity: 'Je me souviens' (I remember). Language as resistance. Bill 101 and protecting French in North America" : code === "pt-BR" ? "Brazilian identity: racial democracy myth vs reality, 'brasilidade', cultural syncretism (African, Indigenous, European)" : code === "ar-EG" ? "Egyptian identity: Pharaonic, Arab, African, Mediterranean — all at once. The concept of 'ibn el-balad' (son of the country)" : `${dialect.name} identity and how it differs from the 'standard' form of the language`}. Discuss in ${dialect.name}.` },
        { id: `${prefix}_b2_u1_l3`, title: "Humor & Wordplay", description: `Understand jokes, puns, and cultural humor`, category: "listening", level: "B2", duration: 10, xp: 30, order: 3,
          culturalHint: `${dialect.name} humor: ${code === "ar-EG" ? "Egyptians are famous for their jokes (نكت). Political satire, wordplay, and self-deprecating humor. 'Bassem Youssef' style comedy" : code === "pt-BR" ? "Brazilian humor: piadas (jokes), trocadilhos (puns), memes. Self-deprecating humor about 'jeitinho brasileiro'" : code === "fr-QC" ? "Québécois humor: Les Têtes à Claques, Sugar Sammy, self-deprecating winter jokes. 'Tabarnac!' as expression" : `Local humor in ${culture.cities[0]} — understanding jokes means you truly know the culture`}.` },
        { id: `${prefix}_b2_u1_l4`, title: "Film & Cinema Analysis", description: `Analyze a film from this culture`, category: "writing", level: "B2", duration: 14, xp: 40, order: 4,
          culturalHint: `${code === "ar-EG" ? "Egyptian cinema is 'Hollywood of the Arab world'. Analyze classics by Youssef Chahine or modern films. Themes: class, love, revolution" : code === "pt-BR" ? "Brazilian cinema: 'Cidade de Deus' (City of God), 'Central do Brasil', 'Bacurau'. Themes: inequality, identity, resilience" : code === "fr-SN" ? "Senegalese cinema: Ousmane Sembène ('father of African cinema'), Djibril Diop Mambéty. Themes: colonialism, tradition vs modernity" : code === "fr-QC" ? "Québécois cinema: Denis Villeneuve's early work, Xavier Dolan, 'C.R.A.Z.Y.'. Themes: identity, family, language" : `Cinema from ${culture.cities[0]} — analyze themes, dialogue, and cultural references`}. Write a film review in ${dialect.name}.` },
        { id: `${prefix}_b2_u1_l5`, title: "Idiomatic Expressions", description: `Master local idioms and proverbs`, category: "grammar", level: "B2", duration: 11, xp: 35, order: 5,
          culturalHint: `${dialect.name} idioms: ${code === "ar-EG" ? "'اللي على راسه بطحة يحسس عليها' (He who has a bump touches it — guilty conscience). 'يا بخت من بكى وأبكاه' (Lucky is he who cried and made others cry — shared sorrow)" : code === "pt-BR" ? "'Quem não tem cão, caça com gato' (Who has no dog, hunts with cat — make do). 'Água mole em pedra dura, tanto bate até que fura' (Persistence pays)" : code === "fr-HT" ? "'Dèyè mòn gen mòn' (Behind mountains there are mountains — life has many challenges). 'Bourik travay, chwal galonnen' (Donkey works, horse gallops — unfair labor)" : code === "fr-QC" ? "'Lâche pas la patate!' (Don't give up!). 'Il fait frette en tabarnac' (It's cold as hell). 'Avoir le feu au cul' (to be in a rush)" : `Local proverbs that reveal the wisdom of ${dialect.name} culture`}.` },
      ],
    },
    // C1 - Unit 1: Mastery
    {
      id: `${prefix}_c1_u1`,
      title: `Advanced Expression & Nuance`,
      level: "C1",
      order: 8,
      description: `Subtle nuance, advanced argumentation, and cultural fluency`,
      lessons: [
        { id: `${prefix}_c1_u1_l1`, title: "Political Discourse", description: `Understand and discuss political topics with nuance`, category: "listening", level: "C1", duration: 15, xp: 45, order: 1,
          culturalHint: `Political discourse in ${dialect.name}: ${code === "ar-EG" ? "Navigate Egyptian political discussion — revolution, democracy, military, religion. Understand coded language and satire" : code === "pt-BR" ? "Brazilian politics: left vs right, corruption scandals, social movements. Understand 'politiquês' (political jargon)" : code === "fr-HT" ? "Haitian politics: post-colonial power dynamics, diaspora influence, grassroots movements" : code === "ar-AE" ? "Gulf politics: monarchy, oil economics, Vision 2030, regional diplomacy. Formal political Arabic" : `Political landscape of ${culture.cities[0]} and how it's discussed locally`}.` },
        { id: `${prefix}_c1_u1_l2`, title: "Academic Writing", description: `Write research-level prose with proper argumentation`, category: "writing", level: "C1", duration: 15, xp: 45, order: 2,
          culturalHint: `Academic writing in ${dialect.name}: ${code.startsWith("ar") ? "Modern Standard Arabic (فصحى) is used for academic work. Learn to switch between dialect and MSA seamlessly" : code === "pt-BR" ? "Brazilian academic style: ABNT formatting, formal register, subjunctive mood mastery" : code === "fr-QC" ? "Québécois academic French follows international standards but with local terminology. OQLF (language office) guidelines" : `Academic conventions in ${dialect.name} — formal register, citations, argumentation`}. Write a 500-word essay on ${culture.traditions[0]}.` },
        { id: `${prefix}_c1_u1_l3`, title: "Dialect Switching", description: `Move between formal and dialectal registers fluidly`, category: "speaking", level: "C1", duration: 12, xp: 40, order: 3,
          culturalHint: `Master code-switching: ${code === "ar-EG" ? "Switch between Egyptian dialect (عامية) and Modern Standard Arabic (فصحى) depending on context — news vs friends vs business" : code === "pt-BR" ? "Switch between informal Brazilian ('tá ligado?', 'mano') and formal Portuguese ('o senhor compreende?')" : code === "fr-HT" ? "Switch between Haitian Creole and standard French — know when each is appropriate" : code === "fr-QC" ? "Switch between joual (informal Québécois), standard Québécois, and international French" : `Navigate between ${dialect.name} and the standard form of the language`}.` },
        { id: `${prefix}_c1_u1_l4`, title: "Debate & Persuasion", description: `Construct and defend complex arguments`, category: "grammar", level: "C1", duration: 13, xp: 40, order: 4,
          culturalHint: `Debate culture: ${code === "ar-EG" ? "Egyptian debate style — passionate, uses proverbs, appeals to emotion and religion. 'والله' (wallahi — I swear by God) for emphasis" : code === "pt-BR" ? "Brazilian argumentation: storytelling approach, emotional appeals, 'mas olha...' (but look...) to redirect" : code === "fr-QC" ? "Québécois debate: direct, passionate about language rights and sovereignty. 'Écoute là...' (Listen here...)" : `Persuasion techniques in ${dialect.name} culture — how to argue effectively and respectfully`}.` },
        { id: `${prefix}_c1_u1_l5`, title: "Cultural Commentary", description: `Write sophisticated cultural analysis`, category: "reading", level: "C1", duration: 14, xp: 40, order: 5,
          culturalHint: `Read and analyze cultural commentary from ${culture.cities[0]}. ${code === "ar-EG" ? "Egyptian columnists, social media intellectuals, and cultural critics discuss identity, modernization, and tradition" : code === "pt-BR" ? "Brazilian cultural critics: discuss racial identity, class, globalization's impact on local culture" : `How ${dialect.name} intellectuals discuss cultural preservation, globalization, and identity`}. Write your own cultural commentary.` },
      ],
    },
    // C2 - Unit 1: Native-Level Mastery
    {
      id: `${prefix}_c2_u1`,
      title: `Native-Level Fluency & Cultural Mastery`,
      level: "C2",
      order: 9,
      description: `Near-native expression, cultural depth, and creative mastery`,
      lessons: [
        { id: `${prefix}_c2_u1_l1`, title: "Creative Writing", description: `Write poetry, fiction, or creative non-fiction`, category: "writing", level: "C2", duration: 18, xp: 50, order: 1,
          culturalHint: `Write creatively in ${dialect.name}: ${code === "fr-HT" ? "Write a 'krik? krak!' story in Creole. Use proverbs, oral tradition rhythms, and magical realism" : code === "pt-BR" ? "Write a crônica (Brazilian literary essay) about life in ${culture.cities[0]}. Channel Clarice Lispector's introspection or Jorge Amado's vivid characters" : code === "ar-EG" ? "Write a short story in Egyptian dialect. Use the rhythm of Cairo street life, humor, and social observation like Naguib Mahfouz" : code === "ar-AE" ? "Write nabati poetry (vernacular Emirati poetry) or a modern short story about tradition meeting modernity" : `Create original literary work in ${dialect.name} that captures the culture's essence`}.` },
        { id: `${prefix}_c2_u1_l2`, title: "Simultaneous Interpretation", description: `Translate complex speech in real-time between languages`, category: "listening", level: "C2", duration: 15, xp: 50, order: 2,
          culturalHint: `Practice interpreting between ${dialect.name} and English. Handle: ${code.startsWith("ar") ? "political speeches, religious sermons, business negotiations — each requires different vocabulary and register" : code === "pt-BR" ? "TED talks, business presentations, casual conversations — each with different slang levels" : "formal speeches, casual conversations, and technical discussions"}. Cultural context is key — some concepts don't translate directly.` },
        { id: `${prefix}_c2_u1_l3`, title: "Teaching Others", description: `Explain grammar and culture to beginners`, category: "speaking", level: "C2", duration: 12, xp: 45, order: 3,
          culturalHint: `The ultimate test: teach ${dialect.name} to someone else. Explain: ${code === "ar-EG" ? "why Egyptians say 'إزيك' instead of 'كيف حالك', how to use 'يعني' (ya'ni) in every sentence, and when to switch to MSA" : code === "pt-BR" ? "why Brazilians use 'você' while Portuguese use 'tu', the difference between 'legal' (cool) and 'legal' (legal)" : code === "fr-HT" ? "how Creole simplified French grammar, why 'mwen' replaced 'je/moi', and the African substrate" : `the unique features of ${dialect.name} that make it special`}.` },
        { id: `${prefix}_c2_u1_l4`, title: "Cultural Mediation", description: `Bridge cultural misunderstandings between speakers`, category: "grammar", level: "C2", duration: 14, xp: 45, order: 4,
          culturalHint: `Mediate between cultures: ${code === "ar-EG" ? "Help a Western business person understand why their Egyptian partner keeps saying 'inshallah' (it's not avoidance — it's cultural humility before God)" : code === "pt-BR" ? "Explain to a German colleague why the Brazilian team is 30 minutes late (it's not disrespect — time is more fluid in Brazil)" : code === "fr-HT" ? "Bridge the gap between Haitian and French speakers — explain cultural context behind Creole expressions" : `Help people from different cultures understand ${dialect.name} communication styles`}.` },
        { id: `${prefix}_c2_u1_l5`, title: "Masterclass: Cultural Fluency", description: `Demonstrate complete cultural and linguistic mastery`, category: "reading", level: "C2", duration: 16, xp: 50, order: 5,
          culturalHint: `Final challenge: Read a complex text about ${code === "ar-EG" ? "the role of Al-Azhar in modern Egyptian society, the tension between secularism and religion, and Egypt's cultural soft power across the Arab world" : code === "pt-BR" ? "Brazil's role in BRICS, the tension between development and Amazon preservation, and Brazilian cultural exports (music, football, telenovelas)" : code === "fr-HT" ? "Haiti's contribution to world culture despite economic challenges, the power of Creole as a language of resistance, and the diaspora's role" : code === "ar-AE" ? "the UAE's transformation from pearl-diving villages to global cities in 50 years, cultural preservation efforts, and the future of Gulf identity" : `the future of ${dialect.name} culture in a globalized world`}. Discuss with native-level fluency.` },
      ],
    },
  ];
}

// ═══════════════════════════════════════════════════════════════
// Generate and inject into curriculum-data.ts
// ═══════════════════════════════════════════════════════════════

const filePath = path.join(process.cwd(), 'lib/curriculum-data.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Generate each dialect curriculum
let newCurricula = '';
let registrations = '';

for (const dialect of dialects) {
  const units = getUnits(dialect);
  
  newCurricula += `\nexport const ${dialect.varName}: LanguageCurriculum = {\n`;
  newCurricula += `  code: "${dialect.code}",\n`;
  newCurricula += `  name: "${dialect.name}",\n`;
  newCurricula += `  flag: "${dialect.flag}",\n`;
  newCurricula += `  totalLessons: 45,\n`;
  newCurricula += `  totalUnits: 9,\n`;
  newCurricula += `  estimatedHours: 95,\n`;
  newCurricula += `  units: [\n`;
  
  for (const unit of units) {
    newCurricula += `    {\n`;
    newCurricula += `      id: "${unit.id}", title: ${JSON.stringify(unit.title)}, level: "${unit.level}", order: ${unit.order},\n`;
    newCurricula += `      description: ${JSON.stringify(unit.description)},\n`;
    newCurricula += `      lessons: [\n`;
    
    for (const lesson of unit.lessons) {
      newCurricula += `        { id: "${lesson.id}", title: ${JSON.stringify(lesson.title)}, description: ${JSON.stringify(lesson.description)}, category: "${lesson.category}", level: "${lesson.level}", duration: ${lesson.duration}, xp: ${lesson.xp}, order: ${lesson.order}, culturalHint: ${JSON.stringify(lesson.culturalHint)} },\n`;
    }
    
    newCurricula += `      ],\n`;
    newCurricula += `    },\n`;
  }
  
  newCurricula += `  ],\n`;
  newCurricula += `};\n`;
  
  registrations += `  "${dialect.code}": ${dialect.varName},\n`;
}

// Insert new curricula before ALL_CURRICULA
const allCurriculaMarker = 'export const ALL_CURRICULA: Record<string, LanguageCurriculum> = {';
content = content.replace(allCurriculaMarker, newCurricula + '\n' + allCurriculaMarker);

// Add registrations to ALL_CURRICULA
content = content.replace(
  'export const ALL_CURRICULA: Record<string, LanguageCurriculum> = {\n',
  'export const ALL_CURRICULA: Record<string, LanguageCurriculum> = {\n' + registrations
);

fs.writeFileSync(filePath, content, 'utf-8');

console.log(`✅ Generated ${dialects.length} new dialect curricula:`);
dialects.forEach(d => console.log(`   ${d.flag} ${d.name} (${d.code}) — 45 lessons with culturalHints`));
console.log(`\n📊 Total new lessons: ${dialects.length * 45}`);
