import fs from 'fs';
import path from 'path';

// 8 Spanish dialect curricula with rich cultural content
const dialects = [
  {
    code: "es-CO",
    name: "Colombian Spanish",
    flag: "🇨🇴",
    varName: "SPANISH_COLOMBIAN",
    culture: {
      greetings: ["¿Quiubo, parce?", "¡Qué más, hermano!", "¿Bien o qué?"],
      foods: ["bandeja paisa", "arepas", "sancocho", "empanadas", "lechona", "ajiaco", "buñuelos", "pandebono", "tamales tolimenses", "cholado"],
      dances: ["cumbia", "salsa caleña", "vallenato", "champeta", "mapale"],
      slang: ["parce/parcero (buddy)", "bacano (cool)", "chimba (awesome)", "gonorrea (expression of surprise)", "marica (dude, informal)", "tinto (black coffee)", "rumba (party)", "guaro (aguardiente)", "chévere (great)", "berraco (tough/skilled)"],
      holidays: ["Carnaval de Barranquilla", "Feria de las Flores", "Día de las Velitas", "Festival Vallenato"],
      cities: ["Bogotá", "Medellín", "Cali", "Cartagena", "Barranquilla"],
      traditions: ["tinto every morning", "sobremesa (long after-meal chat)", "novenas navideñas", "onces (afternoon snack)", "aguardiente toasts"],
      music: ["Shakira", "Carlos Vives", "Juanes", "J Balvin", "Karol G", "Maluma"],
      proverbs: ["El que madruga, Dios le ayuda", "No hay mal que por bien no venga", "A caballo regalado no se le mira el colmillo"],
    }
  },
  {
    code: "es-VE",
    name: "Venezuelan Spanish",
    flag: "🇻🇪",
    varName: "SPANISH_VENEZUELAN",
    culture: {
      greetings: ["¿Qué más, chamo?", "¡Épale!", "¿Cómo estás, pana?"],
      foods: ["arepa", "pabellón criollo", "cachapa", "tequeños", "hallacas", "empanadas", "mandoca", "asado negro", "golfeados", "chicha"],
      dances: ["joropo", "salsa", "gaita zuliana", "tambor", "merengue venezolano"],
      slang: ["chamo/chama (dude/girl)", "pana (friend)", "chévere (cool)", "burda (a lot)", "ladilla (annoying)", "fino (great)", "arrecho (angry/awesome)", "vaina (thing)", "marico (dude)", "coño (damn)"],
      holidays: ["Carnaval", "Diablos Danzantes de Yare", "Fiestas de San Juan", "Cruz de Mayo"],
      cities: ["Caracas", "Maracaibo", "Valencia", "Mérida", "Margarita"],
      traditions: ["hallacas at Christmas", "pan de jamón", "gaitas in December", "parrandas", "pelota (baseball culture)"],
      music: ["Oscar D'León", "Franco De Vita", "Ricardo Montaner", "Guaco", "Los Amigos Invisibles"],
      proverbs: ["El que no llora no mama", "Más sabe el diablo por viejo que por diablo", "Camarón que se duerme se lo lleva la corriente"],
    }
  },
  {
    code: "es-CU",
    name: "Cuban Spanish",
    flag: "🇨🇺",
    varName: "SPANISH_CUBAN",
    culture: {
      greetings: ["¿Qué bolá, asere?", "¡Oye, compadre!", "¿Cómo andas, socio?"],
      foods: ["ropa vieja", "moros y cristianos", "lechón asado", "yuca con mojo", "tostones", "frijoles negros", "vaca frita", "croquetas", "tamales cubanos", "guarapo"],
      dances: ["son cubano", "salsa", "rumba", "mambo", "cha-cha-chá", "danzón", "reggaetón cubano"],
      slang: ["asere (buddy)", "¿qué bolá? (what's up?)", "acere (friend)", "jama (food)", "guagua (bus)", "fula (dollar)", "yuma (foreigner)", "pinchar (to work)", "tremendo (amazing)", "dale (go ahead)"],
      holidays: ["Carnaval de Santiago", "Día de la Cultura Cubana", "Parrandas de Remedios", "San Lázaro (Dec 17)"],
      cities: ["La Habana", "Santiago de Cuba", "Trinidad", "Viñales", "Varadero"],
      traditions: ["domino games on the porch", "Santería rituals", "classic car culture", "mojitos at La Bodeguita", "tobacco rolling"],
      music: ["Buena Vista Social Club", "Celia Cruz", "Compay Segundo", "Ibrahim Ferrer", "Benny Moré"],
      proverbs: ["El que tiene tienda que la atienda", "No por mucho madrugar amanece más temprano", "Dime con quién andas y te diré quién eres"],
    }
  },
  {
    code: "es-CR",
    name: "Costa Rican Spanish",
    flag: "🇨🇷",
    varName: "SPANISH_COSTA_RICAN",
    culture: {
      greetings: ["¡Pura vida, mae!", "¿Qué mae, todo bien?", "¡Tuanis!"],
      foods: ["gallo pinto", "casado", "chifrijo", "patacones", "olla de carne", "arroz con leche", "tamales ticos", "ceviche tico", "chorreadas", "agua de sapo"],
      dances: ["punto guanacasteco", "swing criollo", "cumbia tica", "calypso limonense"],
      slang: ["mae (dude)", "pura vida (everything is great/hello/goodbye/thanks)", "tuanis (cool)", "diay (well/so)", "brete (work)", "chunche (thing)", "jupa (head)", "teja (100 colones)", "birra (beer)", "vara (stuff/thing)"],
      holidays: ["Día de los Boyeros", "Fiesta de los Diablitos", "Anexión de Guanacaste", "Romería a Cartago"],
      cities: ["San José", "Manuel Antonio", "Monteverde", "La Fortuna", "Puerto Viejo"],
      traditions: ["pura vida philosophy", "coffee culture (café chorreado)", "oxcart painting", "eco-tourism", "no army since 1948"],
      music: ["Debi Nova", "Malpaís", "Sonámbulo", "Gandhi", "Los Ajenos"],
      proverbs: ["El que nace para tamal, del cielo le caen las hojas", "A caballo regalado no se le mira el colmillo", "Más vale pájaro en mano que cien volando"],
    }
  },
  {
    code: "es-AR",
    name: "Argentine Spanish",
    flag: "🇦🇷",
    varName: "SPANISH_ARGENTINE",
    culture: {
      greetings: ["¡Che, boludo!", "¿Qué onda?", "¿Todo bien, loco?"],
      foods: ["asado", "empanadas", "milanesa", "choripán", "dulce de leche", "alfajores", "mate", "locro", "provoleta", "fainá"],
      dances: ["tango", "milonga", "chacarera", "zamba", "cumbia villera"],
      slang: ["che (hey/dude)", "boludo (dude/idiot)", "re (very/super)", "posta (for real)", "morfar (to eat)", "laburar (to work)", "guita (money)", "mina (girl)", "pibe (guy)", "afanar (to steal)"],
      holidays: ["Día del Tango", "Vendimia (Mendoza)", "Carnaval del País (Gualeguaychú)", "Día de la Tradición"],
      cities: ["Buenos Aires", "Mendoza", "Córdoba", "Bariloche", "Ushuaia"],
      traditions: ["mate sharing ritual", "asado every Sunday", "fútbol passion", "tango milongas", "sobremesa (2-hour post-meal chat)"],
      music: ["Carlos Gardel", "Astor Piazzolla", "Mercedes Sosa", "Gustavo Cerati", "Fito Páez"],
      proverbs: ["El que no llora no mama", "A otra cosa, mariposa", "Más vale maña que fuerza"],
    }
  },
  {
    code: "es-PE",
    name: "Peruvian Spanish",
    flag: "🇵🇪",
    varName: "SPANISH_PERUVIAN",
    culture: {
      greetings: ["¡Habla, causa!", "¿Qué tal, brother?", "¡Hola, pe!"],
      foods: ["ceviche", "lomo saltado", "ají de gallina", "causa limeña", "anticuchos", "papa a la huancaína", "rocoto relleno", "picarones", "suspiro limeño", "chicha morada"],
      dances: ["marinera", "festejo", "huayno", "vals criollo", "zamacueca"],
      slang: ["causa (buddy)", "pe (pues)", "chévere (cool)", "jato (house)", "pata (friend)", "bacán (great)", "chamba (work)", "flaca/flaco (girlfriend/boyfriend)", "yapa (extra/bonus)", "al toque (right away)"],
      holidays: ["Inti Raymi", "Señor de los Milagros", "Fiesta de la Candelaria", "Vendimia de Ica"],
      cities: ["Lima", "Cusco", "Arequipa", "Trujillo", "Iquitos"],
      traditions: ["ceviche Sundays", "Pisco Sour toasts", "Mistura food festival", "Inca heritage", "pachamanca (earth oven cooking)"],
      music: ["Susana Baca", "Eva Ayllón", "Gian Marco", "Lucha Reyes", "Arturo Zambo Cavero"],
      proverbs: ["El que no arriesga no gana", "Barriga llena, corazón contento", "Más vale tarde que nunca"],
    }
  },
  {
    code: "es-CL",
    name: "Chilean Spanish",
    flag: "🇨🇱",
    varName: "SPANISH_CHILEAN",
    culture: {
      greetings: ["¡Hola, weón!", "¿Cachai?", "¿Cómo estái?"],
      foods: ["empanadas de pino", "pastel de choclo", "cazuela", "curanto", "sopaipillas", "completo (hot dog)", "mote con huesillo", "caldillo de congrio", "pebre", "manjar"],
      dances: ["cueca", "cumbia chilena", "cachimbo", "refalosa"],
      slang: ["weón/huevón (dude)", "cachai (you know?)", "po (pues)", "fome (boring)", "bacán (cool)", "carrete (party)", "pololo/polola (boyfriend/girlfriend)", "al tiro (right away)", "cachar (to understand)", "la raja (awesome)"],
      holidays: ["Fiestas Patrias (Sep 18-19)", "La Tirana", "Año Nuevo en Valparaíso", "Vendimia"],
      cities: ["Santiago", "Valparaíso", "Viña del Mar", "Atacama", "Patagonia"],
      traditions: ["asado for Fiestas Patrias", "pisco sour vs Peru debate", "terremoto (earthquake cocktail)", "cueca dancing Sep 18", "once (afternoon tea)"],
      music: ["Violeta Parra", "Víctor Jara", "Los Prisioneros", "Mon Laferte", "Gepe"],
      proverbs: ["El que se pica, pierde", "A lo hecho, pecho", "Más sabe el diablo por viejo que por diablo"],
    }
  },
  {
    code: "es-PR",
    name: "Puerto Rican Spanish",
    flag: "🇵🇷",
    varName: "SPANISH_PUERTO_RICAN",
    culture: {
      greetings: ["¡Wepa!", "¿Qué es la que hay?", "¡Dimelo, bro!"],
      foods: ["mofongo", "arroz con gandules", "pernil", "alcapurrias", "bacalaítos", "tostones", "tembleque", "coquito", "pasteles", "piraguas"],
      dances: ["salsa", "reggaetón", "bomba", "plena", "dembow"],
      slang: ["wepa (yay/wow)", "bregar (to deal with)", "chavos (money)", "janguear (to hang out)", "corillo (crew/group)", "brutal (awesome)", "nítido (cool/clean)", "al garete (out of control)", "tripear (to trip out)", "pai (dad/bro)"],
      holidays: ["Fiestas de la Calle San Sebastián", "Noche de San Juan", "Festival de las Máscaras de Hatillo", "Día de los Reyes"],
      cities: ["San Juan", "Ponce", "Mayagüez", "Rincón", "Vieques"],
      traditions: ["parrandas (Christmas caroling house to house)", "coquito at Christmas", "dominoes on the porch", "Boricua pride", "piraguas on the beach"],
      music: ["Bad Bunny", "Daddy Yankee", "Residente", "Héctor Lavoe", "Tego Calderón", "Ivy Queen"],
      proverbs: ["El que no tiene dinga, tiene mandinga", "Más claro no canta un gallo", "El que mucho abarca poco aprieta"],
    }
  },
];

// Lesson templates for each unit (same structure across all dialects)
const unitTemplates = [
  {
    level: "A1", order: 1, titleTemplate: (d) => `¡${d.greetings[0].split(',')[0].replace('¡','')}! — First Steps`,
    descTemplate: (d) => `${d.name} greetings, pronunciation, and essential survival phrases`,
    lessons: [
      { titleT: "Sounds & Pronunciation", descT: (d) => `How ${d.name} sounds different — dropped letters, unique rhythm`, cat: "speaking", dur: 8, xp: 25,
        hintT: (d) => `${d.name} pronunciation: listen to how people in ${d.cities[0]} speak vs. textbook Spanish. Local greetings: ${d.greetings.join(', ')}. The rhythm and melody of ${d.name} is unique — practice mimicking the intonation.` },
      { titleT: "Essential Greetings", descT: (d) => `Say hello, goodbye, and 'how are you' the ${d.flag} way`, cat: "vocabulary", dur: 7, xp: 20,
        hintT: (d) => `Greetings in ${d.name}: ${d.greetings.join(', ')}. These are what REAL people say — not the textbook '¿Cómo está usted?' Learn when to use each one (friends vs. elders vs. strangers).` },
      { titleT: "Survival Slang", descT: (d) => `The 10 words you NEED on day one in ${d.cities[0]}`, cat: "vocabulary", dur: 8, xp: 25,
        hintT: (d) => `Essential slang: ${d.slang.slice(0, 5).join(', ')}. These words are used DAILY — you'll hear them in every conversation. Without these, you'll sound like a textbook, not a real speaker.` },
      { titleT: "Numbers & Money", descT: (d) => `Count, pay, and understand prices at local shops`, cat: "grammar", dur: 7, xp: 20,
        hintT: (d) => `Money talk: learn how locals discuss prices. At a ${d.cities.length > 3 ? d.cities[3] : d.cities[0]} market, you'll hear slang for money. Practice: '¿Cuánto cuesta?' and local variations. Food prices for ${d.foods[0]} and ${d.foods[1]}.` },
      { titleT: "At the Local Spot", descT: (d) => `Order food and drinks like a local in ${d.cities[0]}`, cat: "listening", dur: 8, xp: 25,
        hintT: (d) => `At a local restaurant/food stand: order ${d.foods[0]}, ${d.foods[1]}, and ${d.foods[2]}. Listen to how the server speaks — fast, with local slang. Practice: 'Dame un/una...' and 'Quiero probar el/la...'` },
    ]
  },
  {
    level: "A1", order: 2, titleTemplate: (d) => `La Familia — Family & Home`,
    descTemplate: (d) => `Family life, home vocabulary, and daily routines in ${d.flag} culture`,
    lessons: [
      { titleT: "Family Terms", descT: (d) => `How families work in ${d.name} culture — roles, respect, closeness`, cat: "vocabulary", dur: 7, xp: 20,
        hintT: (d) => `Family in ${d.name} culture is EVERYTHING. Extended family lives close together. Learn: abuela/abuelo, tío/tía, primo/prima, compadre/comadre. Family gatherings involve ${d.foods[0]} and ${d.dances[0]}. ${d.traditions[0]} is a family ritual.` },
      { titleT: "Present Tense — Daily Life", descT: (d) => `Describe your daily routine using local expressions`, cat: "grammar", dur: 12, xp: 35,
        hintT: (d) => `Daily life in ${d.cities[0]}: 'Me levanto temprano', 'Desayuno ${d.foods[1]}', 'Voy al trabajo'. Local twist: people say '${d.slang[0]}' when greeting coworkers. The rhythm of daily life includes ${d.traditions[0]}.` },
      { titleT: "My Neighborhood", descT: (d) => `Describe where you live — local landmarks and shops`, cat: "writing", dur: 10, xp: 30,
        hintT: (d) => `Describe a ${d.cities[0]} neighborhood: la bodega/tienda, la panadería, el parque. Include local spots where people eat ${d.foods[3]} and dance ${d.dances[0]}. Use: 'En mi barrio hay...', 'Cerca de mi casa está...'` },
      { titleT: "Home & Living", descT: (d) => `Rooms, furniture, and how homes look in ${d.flag}`, cat: "vocabulary", dur: 8, xp: 25,
        hintT: (d) => `Homes in ${d.cities[0]} vs ${d.cities[1]}: learn local terms for rooms and furniture. Many families have a patio/balcón where they gather. Music (${d.dances[0]}, ${d.dances[1]}) plays from the kitchen while cooking ${d.foods[0]}.` },
      { titleT: "Reading: A Text Message", descT: (d) => `Understand informal texts with local slang and abbreviations`, cat: "reading", dur: 8, xp: 25,
        hintT: (d) => `Read a WhatsApp chat between friends planning to meet up. Slang: ${d.slang.slice(3, 7).join(', ')}. Abbreviations and emojis used locally. The conversation is about going to eat ${d.foods[4]} and maybe dancing ${d.dances[1]}.` },
    ]
  },
  {
    level: "A2", order: 3, titleTemplate: (d) => `Moviéndose — Getting Around`,
    descTemplate: (d) => `Transportation, directions, and navigating ${d.cities[0]}`,
    lessons: [
      { titleT: "Directions & Navigation", descT: (d) => `Ask for and give directions in ${d.cities[0]}`, cat: "speaking", dur: 10, xp: 30,
        hintT: (d) => `Navigate ${d.cities[0]}: 'Disculpe, ¿cómo llego a...?', '¿Dónde queda...?' Local landmarks: learn the names of famous streets, plazas, and neighborhoods. Locals give directions using landmarks, not street numbers.` },
      { titleT: "Past Tense — What Happened", descT: (d) => `Tell stories about what you did using local expressions`, cat: "grammar", dur: 12, xp: 35,
        hintT: (d) => `Tell stories the ${d.name} way: 'Ayer fui a ${d.cities[1]}', 'Comí ${d.foods[0]} increíble', 'Bailé ${d.dances[0]} toda la noche'. Use local filler words and expressions. ${d.proverbs[0]} — learn this proverb in context.` },
      { titleT: "Local Transportation", descT: (d) => `Buses, taxis, and getting around like a local`, cat: "vocabulary", dur: 8, xp: 25,
        hintT: (d) => `Transportation in ${d.cities[0]}: learn local names for bus, taxi, rideshare. How to hail a cab, negotiate fares, and understand route names. In ${d.name}, the bus might be called differently than in textbook Spanish.` },
      { titleT: "Reading: A Travel Blog", descT: (d) => `Follow a traveler's story through ${d.cities.join(', ')}`, cat: "reading", dur: 10, xp: 30,
        hintT: (d) => `Read about a trip through ${d.cities[0]}, ${d.cities[1]}, and ${d.cities[2]}. The blogger tries ${d.foods[0]}, dances ${d.dances[0]}, and learns local slang. Vocabulary: hotel, aeropuerto, maleta, pasaporte, aventura.` },
      { titleT: "Write About Your Trip", descT: (d) => `Describe a real or imaginary trip to ${d.flag}`, cat: "writing", dur: 12, xp: 35,
        hintT: (d) => `Write about visiting ${d.cities[0]}: what you ate (${d.foods.slice(0,3).join(', ')}), what you saw, who you met. Use past tense and local expressions. Mention ${d.traditions[1]} and how it felt to experience ${d.name} culture firsthand.` },
    ]
  },
  {
    level: "A2", order: 4, titleTemplate: (d) => `La Comida — Food & Drink`,
    descTemplate: (d) => `${d.flag} cuisine, ordering, cooking vocabulary, and food culture`,
    lessons: [
      { titleT: "Food Vocabulary", descT: (d) => `Essential dishes: ${d.foods.slice(0,4).join(', ')}`, cat: "vocabulary", dur: 8, xp: 25,
        hintT: (d) => `${d.name} food: ${d.foods.slice(0,6).join(', ')}. Food is central to ${d.flag} culture — every gathering revolves around eating together. Learn the ingredients, how dishes are prepared, and when they're eaten (breakfast vs. lunch vs. dinner).` },
      { titleT: "Ordering Food", descT: (d) => `Order at a restaurant, street food stand, or market`, cat: "speaking", dur: 10, xp: 30,
        hintT: (d) => `At a ${d.cities[0]} restaurant: 'Me da un/una ${d.foods[0]}', '¿Qué me recomienda?', 'La cuenta, por favor'. Street food: point and say '¡Deme uno de esos!' Learn local tipping customs and how to compliment the food.` },
      { titleT: "Comparisons & Opinions", descT: (d) => `Compare foods and express preferences using local phrases`, cat: "grammar", dur: 12, xp: 35,
        hintT: (d) => `Compare: '${d.foods[0]} es mejor que...', '${d.foods[1]} es más rico que...'. Express opinions the local way: '¡Está ${d.slang.find(s => s.includes('cool') || s.includes('great') || s.includes('awesome'))?.split(' ')[0] || 'buenísimo'}!' Learn food adjectives: picante, dulce, salado, crujiente.` },
      { titleT: "Reading: A Recipe", descT: (d) => `Follow a traditional recipe for ${d.foods[0]}`, cat: "reading", dur: 10, xp: 30,
        hintT: (d) => `Recipe for ${d.foods[0]} — the national dish. Ingredients, steps, and cooking tips passed down through generations. Learn kitchen vocabulary: picar, freír, hervir, mezclar, sazonar. Every family has their own secret version.` },
      { titleT: "Listening: At the Market", descT: (d) => `Understand vendors at a local market in ${d.cities[0]}`, cat: "listening", dur: 8, xp: 25,
        hintT: (d) => `At the market in ${d.cities[0]}: vendors shout prices, offer samples, and negotiate. Listen for: '¡Lleve, lleve!', '¿Qué va a llevar?', '¡Está fresco!' Buy ingredients for ${d.foods[0]}: learn fruit, vegetable, and meat names.` },
    ]
  },
  {
    level: "B1", order: 5, titleTemplate: (d) => `Cultura y Sociedad — Culture & Society`,
    descTemplate: (d) => `${d.flag} traditions, holidays, music, and social dynamics`,
    lessons: [
      { titleT: "Music & Dance", descT: (d) => `${d.dances.join(', ')} — rhythm, history, and vocabulary`, cat: "vocabulary", dur: 12, xp: 35,
        hintT: (d) => `${d.name} music: ${d.dances.join(', ')}. Artists: ${d.music.slice(0,3).join(', ')}. Learn the vocabulary of music and dance: ritmo, compás, letra, estribillo, bailar, mover las caderas. ${d.dances[0]} originated in ${d.cities[1] || d.cities[0]} and represents ${d.flag} identity.` },
      { titleT: "Subjunctive Mood", descT: (d) => `Express wishes, doubts, and emotions the ${d.flag} way`, cat: "grammar", dur: 15, xp: 40,
        hintT: (d) => `Subjunctive in real life: 'Ojalá que ${d.holidays[0]} sea increíble este año', 'Quiero que pruebes ${d.foods[0]}', 'Dudo que encuentres mejor ${d.foods[1]} fuera de ${d.cities[0]}'. The subjunctive is used MORE in spoken ${d.name} than textbooks suggest.` },
      { titleT: "Holidays & Traditions", descT: (d) => `${d.holidays.join(', ')} — how they're celebrated`, cat: "speaking", dur: 12, xp: 35,
        hintT: (d) => `${d.holidays[0]}: ${d.traditions.slice(0,3).join('. ')}. During ${d.holidays[1] || d.holidays[0]}, families gather to eat ${d.foods[5] || d.foods[0]} and dance ${d.dances[0]}. Learn celebration vocabulary: fiesta, desfile, disfraz, fuegos artificiales, tradición.` },
      { titleT: "Reading: Cultural Article", descT: (d) => `Read about ${d.flag} society, values, and modern life`, cat: "reading", dur: 12, xp: 35,
        hintT: (d) => `Read about modern life in ${d.cities[0]}: the balance between tradition and modernity. Topics: family values, work culture, social gatherings, ${d.traditions[0]}. Proverb: '${d.proverbs[0]}' — discuss what it means in ${d.name} culture.` },
      { titleT: "Write an Opinion", descT: (d) => `Express your views on ${d.flag} culture and traditions`, cat: "writing", dur: 15, xp: 40,
        hintT: (d) => `Write about what makes ${d.name} culture unique: the food (${d.foods[0]}), the music (${d.dances[0]}), the people, the traditions. Use opinion phrases: 'En mi opinión...', 'Creo que...', 'Lo que más me gusta es...'. Reference: '${d.proverbs[1]}'.` },
    ]
  },
  {
    level: "B1", order: 6, titleTemplate: (d) => `Vida Profesional — Work & Business`,
    descTemplate: (d) => `Professional communication and workplace culture in ${d.flag}`,
    lessons: [
      { titleT: "Work Vocabulary", descT: (d) => `Office terms, job titles, and professional phrases`, cat: "vocabulary", dur: 10, xp: 35,
        hintT: (d) => `Workplace in ${d.cities[0]}: learn local terms for jobs, offices, and professional interactions. How colleagues greet each other (often with ${d.greetings[0]} even at work!). Business culture: punctuality, dress code, hierarchy.` },
      { titleT: "Formal vs Informal", descT: (d) => `When to use tú/usted and formal register in ${d.flag}`, cat: "grammar", dur: 14, xp: 40,
        hintT: (d) => `In ${d.name}: when do you use 'usted' vs 'tú'? It varies by country! In ${d.cities[0]}, the rules might surprise you. Learn formal email openings, professional phone calls, and how to address your boss vs. coworkers.` },
      { titleT: "Job Interview", descT: (d) => `Practice a job interview in ${d.name} style`, cat: "speaking", dur: 12, xp: 40,
        hintT: (d) => `Job interview in ${d.cities[0]}: 'Cuénteme sobre usted', 'Mis fortalezas son...', '¿Cuál es el salario?'. Local customs: how to dress, arrive, greet the interviewer. In ${d.name} culture, personal connections (networking) matter enormously.` },
      { titleT: "Reading: Job Posting", descT: (d) => `Understand a job ad from a ${d.cities[0]} company`, cat: "reading", dur: 10, xp: 30,
        hintT: (d) => `Read a job posting from ${d.cities[0]}: requisitos (requirements), experiencia (experience), beneficios (benefits), salario (salary). Local job platforms and how the hiring process works in ${d.flag}. Key industries in ${d.cities[0]}.` },
      { titleT: "Write a Cover Letter", descT: (d) => `Compose a professional letter for a ${d.flag} company`, cat: "writing", dur: 15, xp: 45,
        hintT: (d) => `Write a cover letter for a job in ${d.cities[0]}: formal greeting, why you're interested, your qualifications, closing. Use formal ${d.name}: 'Estimado/a...', 'Me dirijo a usted...', 'Quedo a su disposición...'. Local business etiquette matters.` },
    ]
  },
  {
    level: "B2", order: 7, titleTemplate: (d) => `Expresión Avanzada — Advanced Expression`,
    descTemplate: (d) => `Idioms, humor, slang mastery, and nuanced ${d.name} communication`,
    lessons: [
      { titleT: "Idioms & Proverbs", descT: (d) => `${d.proverbs.join(' | ')}`, cat: "vocabulary", dur: 15, xp: 45,
        hintT: (d) => `${d.name} proverbs: ${d.proverbs.join('. ')}. These are used in DAILY conversation — knowing them makes you sound fluent. Learn the context: when to use each one, what situation it fits, and how locals react when you use them correctly.` },
      { titleT: "Advanced Slang", descT: (d) => `Deep slang that only locals know: ${d.slang.slice(5,8).map(s => s.split(' ')[0]).join(', ')}`, cat: "vocabulary", dur: 12, xp: 40,
        hintT: (d) => `Advanced ${d.name} slang: ${d.slang.slice(5,10).join(', ')}. These are the words that make locals say 'wow, you really speak ${d.name}!' Use them in context — wrong usage sounds worse than not knowing them.` },
      { titleT: "Conditional & Hypothetical", descT: (d) => `'If I were in ${d.cities[0]}...' — complex sentence structures`, cat: "grammar", dur: 15, xp: 45,
        hintT: (d) => `Hypotheticals in ${d.name}: 'Si pudiera vivir en ${d.cities[0]}, comería ${d.foods[0]} todos los días', 'Si hubiera ido a ${d.holidays[0]}, habría bailado ${d.dances[0]}'. The conditional is used differently in ${d.name} vs. textbook Spanish.` },
      { titleT: "Listening: Stand-Up Comedy", descT: (d) => `Understand humor, wordplay, and cultural references`, cat: "listening", dur: 12, xp: 40,
        hintT: (d) => `${d.name} humor: wordplay, cultural references, and timing. Comedians from ${d.cities[0]} use local slang, accents, and cultural stereotypes. Understanding humor = understanding the culture. Listen for: double meanings, irony, and ${d.name}-specific jokes.` },
      { titleT: "Write a Story", descT: (d) => `Compose a short story set in ${d.cities[0]} using advanced vocabulary`, cat: "writing", dur: 18, xp: 50,
        hintT: (d) => `Write a short story set in ${d.cities[0]}: a character navigates daily life, eats ${d.foods[0]}, dances ${d.dances[0]}, uses slang (${d.slang[0]}, ${d.slang[1]}). Include a proverb: '${d.proverbs[2] || d.proverbs[0]}'. Make it feel authentically ${d.name}.` },
    ]
  },
  {
    level: "C1", order: 8, titleTemplate: (d) => `Dominio Cultural — Cultural Mastery`,
    descTemplate: (d) => `Deep cultural fluency, literature, history, and sophisticated ${d.name}`,
    lessons: [
      { titleT: "Literature & Arts", descT: (d) => `${d.flag} writers, poets, and artistic movements`, cat: "reading", dur: 15, xp: 45,
        hintT: (d) => `${d.name} literature and arts: famous writers, poets, and artists from ${d.cities[0]}. How ${d.flag} art reflects the culture — themes of identity, family, music (${d.dances[0]}), and social issues. Read excerpts and discuss their cultural significance.` },
      { titleT: "Complex Grammar Mastery", descT: (d) => `Subjunctive perfection, passive voice, and literary tenses`, cat: "grammar", dur: 18, xp: 50,
        hintT: (d) => `Master the subjunctive in all its forms as used in ${d.name}: 'Hubiera querido que...', 'Ojalá hubiera podido ir a ${d.holidays[0]}'. Literary tenses used in ${d.flag} journalism and literature. The pluscuamperfecto del subjuntivo in real conversation.` },
      { titleT: "Debate & Persuasion", descT: (d) => `Argue, persuade, and discuss complex topics`, cat: "speaking", dur: 15, xp: 45,
        hintT: (d) => `Debate topics relevant to ${d.flag}: politics, economy, culture, emigration, tradition vs. modernity. Use sophisticated connectors: 'No obstante...', 'Sin embargo...', 'A pesar de que...'. Persuade someone to visit ${d.cities[0]} and try ${d.foods[0]}.` },
      { titleT: "Listening: Documentary", descT: (d) => `Understand a documentary about ${d.flag} history and society`, cat: "listening", dur: 15, xp: 45,
        hintT: (d) => `Watch/listen to a documentary about ${d.flag}: history, social movements, cultural evolution. How ${d.dances[0]} and ${d.music[0]} shaped national identity. Advanced vocabulary: sociedad, identidad, patrimonio, herencia cultural, diáspora.` },
      { titleT: "Academic Writing", descT: (d) => `Write an essay analyzing ${d.flag} cultural identity`, cat: "writing", dur: 20, xp: 55,
        hintT: (d) => `Write an academic essay: 'La identidad cultural en el siglo XXI'. Analyze how ${d.dances[0]}, ${d.foods[0]}, and ${d.traditions[0]} define the culture. Use academic register with thesis, arguments, and conclusion.` },
    ]
  },
  {
    level: "C2", order: 9, titleTemplate: (d) => `Fluidez Nativa — Native Fluency`,
    descTemplate: (d) => `Think, dream, and create in ${d.name} at native level`,
    lessons: [
      { titleT: "Regional Micro-Dialects", descT: (d) => `How ${d.cities[0]} vs ${d.cities[1]} vs ${d.cities[2]} differ`, cat: "listening", dur: 15, xp: 50,
        hintT: (d) => `Micro-dialects within ${d.flag}: how people in ${d.cities[0]} sound different from ${d.cities[1]} and ${d.cities[2]}. Vocabulary differences, pronunciation shifts, and attitude changes. A native can tell which city you learned in by your accent.` },
      { titleT: "Creative Writing", descT: (d) => `Write poetry or prose in authentic ${d.name} voice`, cat: "writing", dur: 20, xp: 55,
        hintT: (d) => `Write creatively in ${d.name}: a poem about ${d.cities[0]}, a short story about ${d.traditions[0]}, or a song lyric in the style of ${d.music[0]}. Use all the slang, proverbs, and cultural references you've learned. Make it sound like a native wrote it.` },
      { titleT: "Simultaneous Interpretation", descT: (d) => `Real-time translation between English and ${d.name}`, cat: "speaking", dur: 18, xp: 55,
        hintT: (d) => `Practice simultaneous interpretation: listen to English and produce ${d.name} in real-time, capturing not just meaning but cultural nuance. Translate idioms into equivalent ${d.name} expressions, not literal translations. '${d.proverbs[0]}' has no direct English equivalent.` },
      { titleT: "Cultural Mediation", descT: (d) => `Bridge cultural gaps between ${d.flag} and other cultures`, cat: "reading", dur: 15, xp: 50,
        hintT: (d) => `Cultural mediation: explain ${d.flag} customs to outsiders and vice versa. Why is ${d.traditions[0]} important? What does ${d.foods[0]} represent beyond food? How do ${d.holidays[0]} celebrations reflect national values? Navigate cross-cultural misunderstandings.` },
      { titleT: "Mastery Assessment", descT: (d) => `Prove native-level fluency across all skills`, cat: "grammar", dur: 20, xp: 60,
        hintT: (d) => `Final assessment: demonstrate mastery of ${d.name} across reading, writing, speaking, and listening. Use advanced grammar, regional slang (${d.slang.slice(0,3).map(s=>s.split(' ')[0]).join(', ')}), cultural references, and proverbs naturally. You should be indistinguishable from a native ${d.flag} speaker.` },
    ]
  },
];

// Generate curriculum for each dialect
function generateDialectCurriculum(dialect) {
  const units = unitTemplates.map((ut, ui) => {
    const lessons = ut.lessons.map((lt, li) => {
      return {
        id: `${dialect.code.replace('-','').toLowerCase()}_${ut.level.toLowerCase()}_u${ut.order}_l${li+1}`,
        title: typeof lt.titleT === 'function' ? lt.titleT(dialect.culture) : lt.titleT,
        description: lt.descT(dialect.culture),
        category: lt.cat,
        level: ut.level,
        duration: lt.dur,
        xp: lt.xp,
        order: li + 1,
        culturalHint: lt.hintT(dialect.culture),
      };
    });
    return {
      id: `${dialect.code.replace('-','').toLowerCase()}_${ut.level.toLowerCase()}_u${ut.order}`,
      title: typeof ut.titleTemplate === 'function' ? ut.titleTemplate(dialect.culture) : ut.titleTemplate,
      level: ut.level,
      order: ut.order,
      description: ut.descTemplate(dialect.culture),
      lessons,
    };
  });

  return { ...dialect, totalLessons: 45, totalUnits: 9, estimatedHours: 90, units };
}

// Generate TypeScript code for all dialects
let output = '\n// ═══════════════════════════════════════════════════════════════════\n';
output += '// SPANISH DIALECT CURRICULA (Generated)\n';
output += '// ═══════════════════════════════════════════════════════════════════\n\n';

for (const dialect of dialects) {
  const curriculum = generateDialectCurriculum(dialect);
  output += `export const ${dialect.varName}: LanguageCurriculum = {\n`;
  output += `  code: "${dialect.code}",\n`;
  output += `  name: "${dialect.name}",\n`;
  output += `  flag: "${dialect.flag}",\n`;
  output += `  totalLessons: ${curriculum.totalLessons},\n`;
  output += `  totalUnits: ${curriculum.totalUnits},\n`;
  output += `  estimatedHours: ${curriculum.estimatedHours},\n`;
  output += `  units: [\n`;

  for (const unit of curriculum.units) {
    output += `    {\n`;
    output += `      id: "${unit.id}", title: ${JSON.stringify(unit.title)}, level: "${unit.level}", order: ${unit.order},\n`;
    output += `      description: ${JSON.stringify(unit.description)},\n`;
    output += `      lessons: [\n`;
    for (const lesson of unit.lessons) {
      output += `        { id: "${lesson.id}", title: ${JSON.stringify(lesson.title)}, description: ${JSON.stringify(lesson.description)}, category: "${lesson.category}", level: "${lesson.level}", duration: ${lesson.duration}, xp: ${lesson.xp}, order: ${lesson.order}, culturalHint: ${JSON.stringify(lesson.culturalHint)} },\n`;
    }
    output += `      ],\n`;
    output += `    },\n`;
  }

  output += `  ],\n`;
  output += `};\n\n`;
}

// Read the existing file and inject before ALL_CURRICULA
const filePath = path.join(process.cwd(), 'lib/curriculum-data.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Insert the new curricula before the ALL_CURRICULA export
const insertPoint = 'export const ALL_CURRICULA: Record<string, LanguageCurriculum> = {';
if (!content.includes(insertPoint)) {
  console.error('Could not find ALL_CURRICULA insertion point');
  process.exit(1);
}

content = content.replace(insertPoint, output + insertPoint);

// Add new entries to ALL_CURRICULA
const allCurriculaEntries = dialects.map(d => `  "${d.code}": ${d.varName},`).join('\n');
content = content.replace(
  'export const ALL_CURRICULA: Record<string, LanguageCurriculum> = {',
  `export const ALL_CURRICULA: Record<string, LanguageCurriculum> = {\n${allCurriculaEntries}`
);

fs.writeFileSync(filePath, content);
console.log(`✅ Generated ${dialects.length} Spanish dialect curricula (${dialects.length * 45} lessons total)`);
console.log(`   Dialects: ${dialects.map(d => d.code).join(', ')}`);
