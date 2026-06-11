// Additional city scenarios for Virtual City Exploration
// These map to the cities in city-exploration.tsx

type DialogueOption = {
  id: string;
  text: string;
  translation: string;
  quality: "perfect" | "good" | "okay" | "wrong";
  points: number;
};

type DialogueTurn = {
  id: string;
  speaker: "character" | "user" | "system";
  text: string;
  translation?: string;
  culturalNote?: string;
  slangNote?: string;
  options?: DialogueOption[];
};

type ScenarioData = {
  id: string;
  title: string;
  character: string;
  characterEmoji: string;
  characterBio: string;
  dialect: string;
  setting: string;
  dialogue: DialogueTurn[];
};

export const CITY_SCENARIOS: Record<string, ScenarioData> = {
  "korean-bbq": {
    id: "korean-bbq",
    title: "Korean BBQ in Gangnam",
    character: "Minjun",
    characterEmoji: "🥩",
    characterBio: "28-year-old BBQ restaurant owner in Gangnam. Speaks casual Seoul Korean with trendy slang. Loves K-drama references.",
    dialect: "Seoul Korean (casual/trendy)",
    setting: "A bustling Korean BBQ restaurant in Gangnam at 8pm. Smoke rises from grills, K-pop plays softly. Minjun approaches your table with tongs.",
    dialogue: [
      { id: "1", speaker: "system", text: "You enter a lively Korean BBQ restaurant. The smell of grilling meat fills the air. A young man with an apron approaches your table with a smile." },
      { id: "2", speaker: "character", text: "어서오세요! 몇 분이세요? 여기 앉으세요~", translation: "Welcome! How many people? Sit here~", slangNote: "'~' at the end makes it sound friendly and casual. Very common in Korean service industry." },
      { id: "3", speaker: "user", text: "", options: [
        { id: "a", text: "안녕하세요! 두 명이요. 삼겹살 추천해주세요!", translation: "Hello! Two people. Please recommend samgyeopsal!", quality: "perfect", points: 10 },
        { id: "b", text: "두 명이요. 메뉴 주세요.", translation: "Two people. Menu please.", quality: "good", points: 7 },
        { id: "c", text: "Hello, two people please.", translation: "(English)", quality: "okay", points: 3 },
        { id: "d", text: "*holds up two fingers*", translation: "(Gesture only)", quality: "wrong", points: 1 },
      ]},
      { id: "4", speaker: "character", text: "오늘 특선은 한우 등심이에요! 진짜 대박이에요. 소주 한 병 같이 하실래요?", translation: "Today's special is Korean beef sirloin! It's seriously amazing. Want a bottle of soju with it?", slangNote: "'대박' (daebak) — means 'amazing/jackpot'. One of the most common Korean slang words.", culturalNote: "In Korea, BBQ without soju is considered incomplete. It's always offered together." },
      { id: "5", speaker: "user", text: "", options: [
        { id: "a", text: "대박! 한우 등심이랑 소주 한 병 주세요. 참이슬로요!", translation: "Amazing! Korean beef sirloin and one bottle of soju please. Chamisul!", quality: "perfect", points: 10 },
        { id: "b", text: "네, 소주 주세요. 그리고 삼겹살도요.", translation: "Yes, soju please. And samgyeopsal too.", quality: "good", points: 7 },
        { id: "c", text: "소주... 뭐가 좋아요?", translation: "Soju... which is good?", quality: "good", points: 6 },
        { id: "d", text: "Just water please.", translation: "(English, no soju)", quality: "okay", points: 3 },
      ]},
      { id: "6", speaker: "character", text: "참이슬 좋은 선택! 제가 고기 구워드릴게요. 한국에서는 선배가 구워주는 거 알죠? ㅋㅋ", translation: "Chamisul, good choice! I'll grill the meat for you. In Korea, the senior person grills, you know? haha", slangNote: "'ㅋㅋ' (kk) — Korean text laughter, like 'haha'. Used in speech to indicate a joke.", culturalNote: "In Korean dining culture, the most senior person at the table traditionally grills the meat for everyone. It's a sign of respect and care." },
      { id: "7", speaker: "user", text: "", options: [
        { id: "a", text: "ㅋㅋㅋ 감사합니다! 한국 문화 너무 좋아요. 건배!", translation: "Hahaha thank you! I love Korean culture. Cheers!", quality: "perfect", points: 10 },
        { id: "b", text: "감사합니다! 건배!", translation: "Thank you! Cheers!", quality: "good", points: 7 },
        { id: "c", text: "고마워요.", translation: "Thanks.", quality: "okay", points: 5 },
        { id: "d", text: "Thank you!", translation: "(English)", quality: "wrong", points: 2 },
      ]},
      { id: "8", speaker: "system", text: "Minjun expertly grills the marbled beef, wrapping it in lettuce with garlic and ssamjang. The soju flows. You've experienced authentic Korean BBQ culture." },
    ],
  },
  "moroccan-souk": {
    id: "moroccan-souk",
    title: "Haggling in the Marrakech Souk",
    character: "Hassan",
    characterEmoji: "🧕",
    characterBio: "55-year-old rug merchant in the Marrakech medina. Speaks Moroccan Darija Arabic with some French mixed in. Master negotiator.",
    dialect: "Moroccan Darija Arabic",
    setting: "A colorful rug shop in the Marrakech souk. Carpets hang from every wall and ceiling. Mint tea is brewing. Hassan sits on cushions surrounded by his finest rugs.",
    dialogue: [
      { id: "1", speaker: "system", text: "You wander through the narrow alleys of the Marrakech souk. A friendly merchant waves you into his carpet shop. The smell of mint tea drifts from inside." },
      { id: "2", speaker: "character", text: "!أهلاً وسهلاً! تفضل، اجلس. أتاي؟", translation: "Welcome! Come in, sit down. Tea?", slangNote: "'أتاي' (atay) — Moroccan word for mint tea. Offering tea is the start of every transaction in Morocco.", culturalNote: "In Morocco, accepting tea is expected. Refusing is considered rude. The tea ceremony is part of the negotiation ritual." },
      { id: "3", speaker: "user", text: "", options: [
        { id: "a", text: "!شكراً! نعم، أتاي من فضلك. الزرابي ديالك زوينين بزاف", translation: "Thanks! Yes, tea please. Your rugs are very beautiful!", quality: "perfect", points: 10 },
        { id: "b", text: "!نعم، شكراً. أتاي", translation: "Yes, thank you. Tea!", quality: "good", points: 7 },
        { id: "c", text: "Oui, merci. Thé à la menthe.", translation: "Yes, thank you. Mint tea. (French)", quality: "good", points: 6 },
        { id: "d", text: "No thanks, just looking.", translation: "(English, refusing tea)", quality: "wrong", points: 2 },
      ]},
      { id: "4", speaker: "character", text: "هاد الزربية من الأطلس. صوف طبيعي، مصبوغ بالحناء والزعفران. بشحال؟ ألف وخمسمية درهم. سعر الصداقة!", translation: "This rug is from the Atlas Mountains. Natural wool, dyed with henna and saffron. How much? 1500 dirhams. Friendship price!", slangNote: "'بشحال' (bshhal) — 'how much' in Darija. 'سعر الصداقة' (friendship price) — classic merchant phrase, always means the starting price is high!", culturalNote: "In Moroccan souks, the first price is ALWAYS 3-4x the actual price. Haggling is expected and enjoyed. Never accept the first offer." },
      { id: "5", speaker: "user", text: "", options: [
        { id: "a", text: "!ألف وخمسمية؟ لا لا! أنا غادي نعطيك أربعمية. هادي زربية صغيرة", translation: "1500? No no! I'll give you 400. This is a small rug!", quality: "perfect", points: 10 },
        { id: "b", text: "بزاف! شحال آخر سعر؟", translation: "Too much! What's the last price?", quality: "good", points: 7 },
        { id: "c", text: "C'est trop cher. 500?", translation: "It's too expensive. 500? (French)", quality: "good", points: 6 },
        { id: "d", text: "OK, 1500.", translation: "(Accepting first price — tourist mistake!)", quality: "wrong", points: 1 },
      ]},
      { id: "6", speaker: "character", text: "أربعمية؟! حرام عليك! أنا خسران. ألف درهم، وغادي نزيد ليك هاد الوسادة هدية!", translation: "400?! That's a sin! I'm losing money. 1000 dirhams, and I'll throw in this cushion as a gift!", slangNote: "'حرام عليك' (haram alik) — 'shame on you' but used playfully in haggling. It's part of the game." },
      { id: "7", speaker: "user", text: "", options: [
        { id: "a", text: "ستمية مع الوسادة. هذا آخر كلامي! أنا صاحبك", translation: "600 with the cushion. That's my final word! I'm your friend.", quality: "perfect", points: 10 },
        { id: "b", text: "سبعمية؟ مع الوسادة؟", translation: "700? With the cushion?", quality: "good", points: 7 },
        { id: "c", text: "خمسمية. C'est mon dernier prix.", translation: "500. That's my last price. (mixing Arabic/French)", quality: "good", points: 6 },
        { id: "d", text: "OK fine, 1000.", translation: "(Giving in too easily)", quality: "okay", points: 4 },
      ]},
      { id: "8", speaker: "system", text: "Hassan laughs heartily, shakes your hand firmly, and wraps the rug in brown paper. He pours more tea. You've earned his respect as a negotiator — and a beautiful Atlas Mountain rug." },
    ],
  },
  "brazilian-beach": {
    id: "brazilian-beach",
    title: "Beach Vendor Chat in Copacabana",
    character: "Rodrigo",
    characterEmoji: "🏖️",
    characterBio: "22-year-old beach vendor selling açaí and caipirinhas on Copacabana. Speaks fast carioca Portuguese with lots of gíria (slang).",
    dialect: "Brazilian Portuguese (Carioca/Rio)",
    setting: "Copacabana Beach at sunset. Rodrigo walks by with a cooler full of açaí bowls and fresh caipirinhas. Samba music plays from a nearby speaker.",
    dialogue: [
      { id: "1", speaker: "system", text: "You're lounging on Copacabana Beach as the sun sets over Rio. A young vendor approaches with a colorful cooler, calling out to beachgoers." },
      { id: "2", speaker: "character", text: "E aí, parceiro! Tá afim de um açaí? Caipirinha gelada? Tá um calor do caramba hoje!", translation: "Hey there, buddy! Want some açaí? Cold caipirinha? It's crazy hot today!", slangNote: "'E aí' — casual 'hey/what's up'. 'Parceiro' — buddy/partner. 'Tá afim' — 'do you want'. 'Do caramba' — 'crazy/intense' (mild expletive)." },
      { id: "3", speaker: "user", text: "", options: [
        { id: "a", text: "E aí! Bora um açaí com granola e banana! E uma caipirinha de limão, por favor!", translation: "Hey! Let's do an açaí with granola and banana! And a lime caipirinha, please!", quality: "perfect", points: 10 },
        { id: "b", text: "Oi! Quero um açaí, por favor.", translation: "Hi! I want an açaí, please.", quality: "good", points: 7 },
        { id: "c", text: "Açaí? Quanto custa?", translation: "Açaí? How much?", quality: "good", points: 6 },
        { id: "d", text: "No thanks.", translation: "(English)", quality: "wrong", points: 2 },
      ]},
      { id: "4", speaker: "character", text: "Boa escolha, mano! O açaí tá fresquinho, peguei hoje de manhã. Cê é gringo? Teu português tá show de bola!", translation: "Good choice, bro! The açaí is super fresh, got it this morning. You're a foreigner? Your Portuguese is awesome!", slangNote: "'Mano' — bro/dude (from 'irmão'). 'Cê' — casual contraction of 'você'. 'Show de bola' — literally 'ball show' = awesome (soccer reference).", culturalNote: "Brazilians are incredibly warm to foreigners who try to speak Portuguese. Even basic attempts get enthusiastic praise." },
      { id: "5", speaker: "user", text: "", options: [
        { id: "a", text: "Valeu, mano! Tô aprendendo com um app. O Rio é demais! Qual praia é a melhor?", translation: "Thanks, bro! I'm learning with an app. Rio is amazing! Which beach is the best?", quality: "perfect", points: 10 },
        { id: "b", text: "Obrigado! Sim, sou americano. Estou aprendendo.", translation: "Thank you! Yes, I'm American. I'm learning.", quality: "good", points: 7 },
        { id: "c", text: "Obrigado. Quanto é?", translation: "Thank you. How much?", quality: "okay", points: 5 },
        { id: "d", text: "Thanks! How much do I owe you?", translation: "(English)", quality: "wrong", points: 2 },
      ]},
      { id: "6", speaker: "character", text: "Cara, se tu quer uma praia mais tranquila, vai pra Prainha. Mas aqui em Copa, o rolê é outro — é pra ver e ser visto, sabe? Tipo, o agito tá aqui!", translation: "Dude, if you want a chill beach, go to Prainha. But here in Copa, the vibe is different — it's to see and be seen, you know? Like, the action is here!", slangNote: "'Rolê' — vibe/scene/hangout. 'Agito' — action/excitement. 'Tipo' — like (filler word). These are essential carioca slang words." },
      { id: "7", speaker: "user", text: "", options: [
        { id: "a", text: "Massa! Eu curto o agito. Bora ficar aqui mesmo. Tem algum barzinho bom pra depois?", translation: "Cool! I like the action. Let's stay here. Any good bar for later?", quality: "perfect", points: 10 },
        { id: "b", text: "Legal! Eu gosto daqui. O pôr do sol é lindo.", translation: "Cool! I like it here. The sunset is beautiful.", quality: "good", points: 7 },
        { id: "c", text: "Ah, legal. Obrigado pela dica.", translation: "Ah, cool. Thanks for the tip.", quality: "okay", points: 5 },
        { id: "d", text: "OK thanks!", translation: "(English)", quality: "wrong", points: 2 },
      ]},
      { id: "8", speaker: "system", text: "Rodrigo hands you a perfectly topped açaí bowl and a frosty caipirinha. He gives you a fist bump and heads down the beach. The sun paints the sky orange over Sugarloaf Mountain. This is Rio." },
    ],
  },
  "german-biergarten": {
    id: "german-biergarten",
    title: "Ordering at a Munich Biergarten",
    character: "Franz",
    characterEmoji: "🍺",
    characterBio: "62-year-old Biergarten server who's worked at Augustiner for 35 years. Speaks Bavarian German dialect. Gruff but warm.",
    dialect: "Bavarian German (München)",
    setting: "A massive outdoor Biergarten under chestnut trees in Munich. It's Oktoberfest season. Franz carries 6 Maß (liter mugs) in each hand.",
    dialogue: [
      { id: "1", speaker: "system", text: "You find a spot at a long wooden table in a bustling Munich Biergarten. Chestnut trees provide shade. A massive server approaches, somehow carrying 12 beer steins." },
      { id: "2", speaker: "character", text: "Grüß Gott! Was darf's sein? A Maß? Oder lieber a Radler für'n Anfang?", translation: "Hello! What'll it be? A liter beer? Or maybe a Radler (beer+lemonade) to start?", slangNote: "'Grüß Gott' — Bavarian greeting (literally 'greet God'). 'A Maß' — one liter of beer (Bavarian). 'Für'n' — contraction of 'für den'.", culturalNote: "In Bavaria, beer comes in 1-liter mugs (Maß). Ordering a small beer is unusual. A 'Radler' (half beer, half lemonade) is acceptable for beginners." },
      { id: "3", speaker: "user", text: "", options: [
        { id: "a", text: "Grüß Gott! Eine Maß Augustiner bitte! Und haben Sie noch Schweinshaxe?", translation: "Hello! One liter of Augustiner please! And do you still have pork knuckle?", quality: "perfect", points: 10 },
        { id: "b", text: "Ein Bier bitte. Das große.", translation: "A beer please. The big one.", quality: "good", points: 7 },
        { id: "c", text: "Hallo. Bier bitte.", translation: "Hello. Beer please.", quality: "okay", points: 5 },
        { id: "d", text: "Can I get a beer?", translation: "(English)", quality: "wrong", points: 2 },
      ]},
      { id: "4", speaker: "character", text: "Ah, a Schweinshaxn! Gute Wahl! Die is heut besonders knusprig. Dazu a Brezn und an Obatzda? Des ghört dazu!", translation: "Ah, pork knuckle! Good choice! It's especially crispy today. With that a pretzel and Obatzda (cheese spread)? That's part of it!", slangNote: "'Schweinshaxn' — Bavarian pronunciation of Schweinshaxe. 'Des ghört dazu' — 'that belongs to it' = it's essential/mandatory.", culturalNote: "Obatzda is a Bavarian cheese spread made with Camembert, butter, and paprika. It's the classic Biergarten snack with pretzels." },
      { id: "5", speaker: "user", text: "", options: [
        { id: "a", text: "Ja, alles bitte! Schweinshaxn, Brezn und Obatzda. Prost!", translation: "Yes, everything please! Pork knuckle, pretzel and Obatzda. Cheers!", quality: "perfect", points: 10 },
        { id: "b", text: "Ja, bitte. Und eine Brezel dazu.", translation: "Yes, please. And a pretzel with it.", quality: "good", points: 7 },
        { id: "c", text: "Was ist Obatzda?", translation: "What is Obatzda?", quality: "good", points: 6 },
        { id: "d", text: "Just the beer is fine.", translation: "(English, missing the food)", quality: "okay", points: 3 },
      ]},
      { id: "6", speaker: "character", text: "Prost! Sag amoi, woher kommst du? Dei Deutsch is gar ned schlecht! Warst scho amoi auf'm Oktoberfest?", translation: "Cheers! Say, where are you from? Your German isn't bad at all! Have you been to Oktoberfest before?", slangNote: "'Sag amoi' — Bavarian for 'sag mal' (say/tell me). 'Dei' — your (Bavarian). 'Gar ned schlecht' — not bad at all. 'Scho amoi' — already once." },
      { id: "7", speaker: "user", text: "", options: [
        { id: "a", text: "Prost! Ich komme aus Amerika. Das ist mein erstes Mal hier. Es ist wunderbar! Ein Prosit der Gemütlichkeit!", translation: "Cheers! I'm from America. This is my first time here. It's wonderful! A toast to coziness!", quality: "perfect", points: 10 },
        { id: "b", text: "Aus den USA. Erstes Mal in München. Sehr schön hier!", translation: "From the USA. First time in Munich. Very nice here!", quality: "good", points: 7 },
        { id: "c", text: "Amerika. Danke!", translation: "America. Thanks!", quality: "okay", points: 5 },
        { id: "d", text: "I'm from the US. First time!", translation: "(English)", quality: "wrong", points: 2 },
      ]},
      { id: "8", speaker: "system", text: "Franz returns with a massive liter of golden Augustiner, a glistening pork knuckle, and a pretzel the size of your head. He clinks his own hidden beer against yours. 'Oans, zwoa, g'suffa!' The Biergarten erupts in song." },
    ],
  },
  "delhi-street-food": {
    id: "delhi-street-food",
    title: "Street Food Adventure in Old Delhi",
    character: "Ravi bhai",
    characterEmoji: "🍛",
    characterBio: "45-year-old chaat vendor in Chandni Chowk. Third generation. Speaks Hindi with Delhi slang. Incredibly fast hands making chaat.",
    dialect: "Hindi (Delhi colloquial)",
    setting: "A narrow lane in Chandni Chowk, Old Delhi. Ravi's chaat stall is packed with locals. The smell of spices and fried dough fills the air.",
    dialogue: [
      { id: "1", speaker: "system", text: "You navigate the chaotic lanes of Chandni Chowk. A crowd gathers around a small stall where a man assembles chaat with lightning speed. He notices you and waves." },
      { id: "2", speaker: "character", text: "आइए आइए! क्या खाएंगे? गोलगप्पे? पापड़ी चाट? सब फ्रेश है, अभी बनाया!", translation: "Come come! What will you eat? Golgappe? Papdi chaat? Everything is fresh, just made!", slangNote: "'आइए आइए' (aaiye aaiye) — 'come come' doubled for emphasis, very Delhi vendor style. Golgappe = pani puri in Delhi dialect." },
      { id: "3", speaker: "user", text: "", options: [
        { id: "a", text: "भैया, गोलगप्पे दो प्लेट! तीखा पानी वाला. और एक पापड़ी चाट भी!", translation: "Brother, two plates of golgappe! With spicy water. And one papdi chaat too!", quality: "perfect", points: 10 },
        { id: "b", text: "गोलगप्पे दीजिए. कितने का है?", translation: "Give me golgappe. How much is it?", quality: "good", points: 7 },
        { id: "c", text: "एक प्लेट... गोलगप्पे?", translation: "One plate... golgappe?", quality: "okay", points: 5 },
        { id: "d", text: "What's good here?", translation: "(English)", quality: "wrong", points: 2 },
      ]},
      { id: "4", speaker: "character", text: "अरे वाह! तीखा पानी? पक्का? बहुत तीखा है हमारा! विदेशी लोग तो रो देते हैं! 😄", translation: "Oh wow! Spicy water? Sure? Ours is very spicy! Foreigners cry! 😄", slangNote: "'अरे वाह' (are wah) — exclamation of surprise/delight. 'पक्का' (pakka) — sure/confirmed. Very common Delhi filler.", culturalNote: "Delhi street food vendors take pride in their spice levels. Asking for 'teekhaa' (spicy) earns respect. They'll often warn foreigners but love when they handle it." },
      { id: "5", speaker: "user", text: "", options: [
        { id: "a", text: "हां भैया, पक्का! मुझे तीखा बहुत पसंद है. मैं हिंदी सीख रहा हूं!", translation: "Yes brother, for sure! I love spicy. I'm learning Hindi!", quality: "perfect", points: 10 },
        { id: "b", text: "हां, तीखा चलेगा!", translation: "Yes, spicy is fine!", quality: "good", points: 7 },
        { id: "c", text: "थोड़ा कम तीखा?", translation: "A little less spicy?", quality: "good", points: 6 },
        { id: "d", text: "Medium spice please.", translation: "(English)", quality: "okay", points: 3 },
      ]},
      { id: "6", speaker: "character", text: "बस बस, ये लो! देखो कैसे बनाते हैं — फूलकी तोड़ो, आलू डालो, चटनी, पानी... एक ही बार में मुंह में! ये है असली दिल्ली स्टाइल!", translation: "Here here, take this! Watch how it's made — break the puri, add potato, chutney, water... all at once in your mouth! This is real Delhi style!", slangNote: "'बस बस' (bas bas) — 'here here/enough enough'. 'असली' (asli) — real/authentic. Delhi people are very proud of their food being 'asli'." },
      { id: "7", speaker: "user", text: "", options: [
        { id: "a", text: "वाह! बहुत मज़ेदार! ये तो कमाल है भैया! एक और प्लेट दो!", translation: "Wow! So delicious! This is amazing brother! Give me one more plate!", quality: "perfect", points: 10 },
        { id: "b", text: "बहुत अच्छा! मज़ा आ गया!", translation: "Very good! I enjoyed it!", quality: "good", points: 7 },
        { id: "c", text: "अच्छा है!", translation: "It's good!", quality: "okay", points: 5 },
        { id: "d", text: "Wow, delicious!", translation: "(English)", quality: "wrong", points: 2 },
      ]},
      { id: "8", speaker: "system", text: "Ravi bhai beams with pride and gives you an extra golgappa 'on the house'. He insists you try his special meethi chutney. The flavors explode — sweet, sour, spicy, crunchy. This is Delhi." },
    ],
  },
};
