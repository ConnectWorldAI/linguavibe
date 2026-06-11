/**
 * Script to inject culturalHints into all language curricula.
 * Reads curriculum-data.ts, adds culturalHint to every lesson that doesn't have one,
 * using language-specific cultural content.
 */
import fs from 'fs';
import path from 'path';

const filePath = path.resolve('lib/curriculum-data.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Cultural hints by language prefix and lesson pattern
const CULTURAL_HINTS = {
  // ─── SPANISH MEXICAN ───────────────────────────────────────────────
  esmx: {
    A1: {
      u1: [
        "In Mexico, '¿Qué onda?' is the casual 'What's up?' — literally 'What wave?' You'll hear it everywhere from CDMX to Guadalajara",
        "Mexicans often greet with 'Buenas' any time of day. A handshake for men, a kiss on the cheek (un beso) for women — learn: el saludo, el beso, la mano",
        "Ser = permanent (Soy mexicano), Estar = temporary/location (Estoy en la Ciudad de México). Mexican saying: 'Ser o no ser, esa es la bronca'",
        "Mexican currency: el peso mexicano. At tienditas, prices end in '.50' — learn: ¿Cuánto cuesta?, la feria (slang for money), el cambio",
        "La tiendita (corner store) is the heart of every Mexican neighborhood — you buy everything from tortillas to phone credit (tiempo aire). Learn: la tiendita, el mandado, la cuenta"
      ],
      u2: [
        "Mexican families are huge and close — la abuelita rules the kitchen, los primos are your best friends. Learn: la familia, el compadre, la madrina, el padrino",
        "Mexican daily verbs: desayunar (breakfast), comer (lunch at 2-3pm!), cenar (dinner at 8-9pm). The big meal is la comida, not dinner!",
        "Mexican mornings start with café de olla (cinnamon coffee) or atole. Write about: mi rutina — me levanto, me baño, desayuno chilaquiles",
        "La casa mexicana has a patio central, a cocina where abuela reigns, and la sala for telenovelas. Learn: el patio, la azotea, el zaguán",
        "Mexican texting: 'k' = que, 'x' = por, 'ntp' = no te preocupes, 'tkm' = te quiero mucho. Informal but universal among young Mexicans"
      ]
    },
    A2: {
      u1: [
        "In CDMX, directions use landmarks not street names: 'Pasando el Oxxo, antes del puente' — learn: la esquina, la cuadra, derecho, a la vuelta",
        "Mexican preterite is full of irregular gems: fui, hice, dije. Mexicans love storytelling — 'Ayer fui al tianguis y me encontré...'",
        "El Metro de CDMX is one of the world's busiest. Each station has a symbol (not just a name) for literacy. Learn: la línea, el vagón, el pesero, el camión",
        "CDMX landmarks: el Zócalo, el Ángel de la Independencia, Chapultepec, Coyoacán (where Frida lived). Learn: el centro histórico, la plaza, el museo",
        "Describe your colonia (neighborhood) — every Mexican city has colonias with distinct personalities. Learn: la colonia, el barrio, la calle, la avenida"
      ],
      u2: [
        "Mexican food vocabulary: los tacos (al pastor, de suadero, de canasta), los tamales, el pozole, las enchiladas, el mole, los elotes, los esquites",
        "At a taquería: '¿De qué van a ser?' means 'What kind?' Reply: 'Deme tres de pastor con todo' (cilantro, cebolla, salsa). Learn: la orden, para llevar, para aquí",
        "Imperfect for childhood memories: 'Cuando era niño, mi abuela hacía tamales en diciembre' — Mexican Christmas tradition of making tamales together",
        "El mole poblano has 30+ ingredients including chocolate. Follow the recipe: los chiles secos, el ajonjolí, la tablilla de chocolate, el guajolote (turkey)",
        "El mercado (like La Merced or Mercado de Jamaica) — vendors shout '¡Pásele, güerita!' Learn: el puesto, la marchanta, la báscula, el kilo"
      ]
    },
    B1: {
      u1: [
        "Día de Muertos (Nov 1-2): la ofrenda, las calaveritas de azúcar, el pan de muerto, la flor de cempasúchil, los altares. NOT Halloween — it celebrates life!",
        "Subjunctive in Mexican culture: 'Ojalá que llueva café' (Juan Luis Guerra). Mexicans use it constantly: 'Espero que estés bien', 'Que te vaya bien'",
        "Mexican cinema: Alfonso Cuarón (Roma), Guillermo del Toro, Gael García Bernal. Music: mariachi, norteño, banda, corridos tumbados. Learn: la película, el cine, la canción",
        "Mexican news sources: El Universal, Reforma, Proceso. Current issues: la migración, la seguridad, el medio ambiente. Learn: las noticias, el reportaje, la nota",
        "Write about quinceañeras, posadas, or el Grito de Independencia (Sept 15). Cultural opinion: '¿Se están perdiendo las tradiciones mexicanas?'"
      ],
      u2: [
        "Mexican office culture: the jefe, la junta (meeting), el puente (long weekend). 'Hacer la barba' = to brown-nose. Learn: la chamba (work), el jale, la oficina",
        "Conditional for politeness: '¿Podría ayudarme?' is more Mexican than '¿Puede?' — Mexicans value indirect speech: 'Sería posible que...', 'Me gustaría...'",
        "Mexican job interviews: arrive 15 min early, use usted, bring copies of your INE and CURP. Learn: la entrevista, el puesto, las prestaciones, el aguinaldo",
        "Mexican job ads on OCC Mundial or LinkedIn: 'Se solicita', 'Requisitos', 'Ofrecemos'. Learn: el sueldo, las prestaciones de ley, el horario, el contrato",
        "Mexican CV format: include photo, CURP, RFC. Different from US résumés! Learn: la experiencia laboral, la formación académica, las referencias"
      ]
    },
    B2: {
      u1: [
        "Mexican slang deep dive: 'Neta' (truth/really), 'Chido' (cool), 'No mames' (no way!), 'Güey' (dude), 'Pedo' (problem/drunk/fart depending on context)",
        "Past subjunctive in Mexican speech: 'Si tuviera lana, me iba a Cancún' — Mexicans often use imperfect indicative instead: 'Si tenía...' (colloquial)",
        "El albur: Mexican double-meaning wordplay, a cultural art form. Understanding it requires deep vocabulary and quick wit. Learn: el doble sentido, la picardía",
        "Mexican literature: Octavio Paz (El Laberinto de la Soledad), Juan Rulfo (Pedro Páramo), Laura Esquivel (Como Agua para Chocolate). Learn: el autor, la novela, el cuento",
        "Write about Mexican identity: mestizaje, la Malinche, el malinchismo, la mexicanidad. Complex cultural concepts that define modern Mexico"
      ]
    },
    C1: {
      u1: [
        "Mexican registers: formal (usted, licenciado), informal (tú, güey), street (vato, carnal, morro). Code-switching between them is a social skill",
        "Mexican rhetoric: politicians use diminutives to seem humble ('un momentito'), repetition for emphasis, and cultural references (Benito Juárez quotes)",
        "Give a presentation Mexican-style: start with a joke or anecdote, use 'como bien sabemos...', end with 'quedo a sus órdenes'. Learn: la ponencia, la exposición",
        "Mexican academic writing: UNAM style, formal register, extensive citations. Learn: la tesis, el ensayo académico, las fuentes, la bibliografía",
        "Write a research summary on a Mexican topic: la economía informal, el sistema educativo, la migración, las lenguas indígenas (Náhuatl, Maya, Zapoteco)"
      ]
    },
    C2: {
      u1: [
        "Deep Mexican communication: the meaning behind 'ahorita' (could be now or never), 'sí' that means 'no', indirect refusals. Cultural pragmatics mastery",
        "Stylistic mastery: write like Octavio Paz (poetic essays), Carlos Monsiváis (cultural criticism), Elena Poniatowska (testimonial literature)",
        "Debate Mexican-style: passionate but respectful, use of 'con todo respeto...', ability to navigate sensitive topics (politics, religion, football) with grace",
        "Mexican media literacy: detect irony in El Deforma (satire), understand memes (el Pepe, la grasa), political cartoons. Learn: la sátira, el humor negro, la ironía",
        "Write a short story set in Mexico: use regionalismos, capture the rhythm of Mexican speech, weave in cultural references (la Virgen de Guadalupe, el metro, la milpa)"
      ]
    }
  },

  // ─── FRENCH ────────────────────────────────────────────────────────
  fr: {
    A1: {
      u1: [
        "French greetings change by time: Bonjour (morning/afternoon), Bonsoir (evening). ALWAYS say 'Bonjour' when entering a shop — it's rude not to! Learn: la politesse, la bise",
        "La bise (cheek kiss) varies by region: 2 in Paris, 3 in Provence, 4 in some areas! Learn: se présenter, enchanté(e), je m'appelle, je suis de...",
        "Être (to be) & Avoir (to have) are the foundation. French saying: 'Avoir ou être, telle est la question.' Learn: je suis, j'ai, nous sommes, nous avons",
        "French numbers are famously complex: 70 = soixante-dix (60+10), 80 = quatre-vingts (4×20), 90 = quatre-vingt-dix (4×20+10). Belgian French uses septante, nonante!",
        "La boulangerie is sacred in France. Every neighborhood has one. Learn: une baguette, un croissant, un pain au chocolat, une tarte aux fruits. 'Je voudrais une baguette, s'il vous plaît'"
      ],
      u2: [
        "French family: la famille is central. Sunday lunch (le déjeuner du dimanche) gathers everyone. Learn: les parents, les grands-parents, les enfants, le repas de famille",
        "French -ER verbs: parler, manger, danser, chanter. 80% of French verbs are -ER! Practice with: 'Je mange un croissant', 'Nous dansons la valse'",
        "French daily routine: le petit-déjeuner (café + tartine), le déjeuner (2-hour lunch!), le goûter (4pm snack), le dîner. Write about YOUR journée française",
        "La maison française: le salon (living room), la cuisine (kitchen), la chambre (bedroom), la salle de bains. French apartments have un balcon for morning coffee",
        "French postcards (les cartes postales) are still popular! From vacation: 'Chers amis, je suis à Nice. Il fait beau. La mer est magnifique. Bisous!'"
      ]
    },
    A2: {
      u1: [
        "French directions: 'Tournez à gauche au feu rouge, continuez tout droit, c'est sur votre droite.' Parisians walk fast — learn: le carrefour, le rond-point, le passage piéton",
        "Passé composé with être: 16 verbs of motion (DR MRS VANDERTRAMP). 'Je suis allé(e) au marché' — agreement with subject! French grammar loves agreement",
        "French shopping: le marché (market), la pharmacie (green cross sign), le tabac (cigarettes + stamps + lotto). Learn: faire les courses, le caddie, la caisse",
        "French restaurant menu structure: l'entrée (starter, NOT main!), le plat principal, le fromage, le dessert. 'Le menu' = fixed price meal. 'La carte' = à la carte",
        "Write about a trip using passé composé: 'Le week-end dernier, je suis allé(e) à Versailles. J'ai visité le château. C'était magnifique!'"
      ],
      u2: [
        "French cuisine vocabulary: le coq au vin, la ratatouille, le boeuf bourguignon, la quiche lorraine, les escargots, le foie gras, la crème brûlée, le soufflé",
        "Ordering in France: 'Je voudrais le menu à 25 euros' / 'L'addition, s'il vous plaît.' Never rush — dining is an event! Learn: le serveur, la serveuse, le pourboire",
        "L'imparfait for French memories: 'Quand j'étais petit(e), ma grand-mère faisait des crêpes le dimanche.' La Chandeleur (Feb 2) = crêpe day in France!",
        "La quiche lorraine recipe: la pâte brisée, les lardons, la crème fraîche, les oeufs, le gruyère. French cooking = precision + fresh ingredients + patience",
        "Au café parisien: un express (espresso), un crème (latte), un chocolat chaud. Sitting at la terrasse costs more! Learn: le comptoir, la terrasse, l'intérieur"
      ]
    },
    B1: {
      u1: [
        "French art: l'Impressionnisme (Monet, Renoir), le Louvre, le Musée d'Orsay. French cinema: la Nouvelle Vague (Godard, Truffaut). Learn: le réalisateur, le chef-d'oeuvre, l'exposition",
        "Le subjonctif expresses doubt/emotion: 'Il faut que tu viennes', 'Je suis content que tu sois là.' French speakers debate whether it's dying — it's not!",
        "French current events: la laïcité, les gilets jaunes, la francophonie, l'écologie. Discuss: 'Je pense que...', 'À mon avis...', 'Il me semble que...'",
        "French magazines: Paris Match, Le Point, L'Express, Elle. Reading style: longer sentences, more formal than English. Learn: l'article, le reportage, l'éditorial",
        "Write a film review: 'Amélie' (Le Fabuleux Destin d'Amélie Poulain) — discuss le scénario, la mise en scène, les acteurs, la bande originale"
      ],
      u2: [
        "French workplace: les 35 heures (35-hour work week), les RTT (extra days off), la pause déjeuner (sacred!). Learn: le bureau, la réunion, le collègue, les congés",
        "Le conditionnel for politeness: 'Je voudrais...', 'Pourriez-vous...', 'Serait-il possible de...' — French business communication is VERY formal and indirect",
        "French job interview: 'Parlez-moi de vous', 'Quelles sont vos qualités/défauts?' Always use vous, dress formally. Learn: le poste, les compétences, l'expérience",
        "French job ads on Pôle Emploi or Indeed.fr: 'CDI' (permanent), 'CDD' (temporary), 'Stage' (internship). Learn: le salaire, les avantages, le télétravail",
        "La lettre de motivation: formal French letter format with city+date, 'Madame, Monsieur,' opening, 'Veuillez agréer...' closing. Very structured and formulaic"
      ]
    },
    B2: {
      u1: [
        "French idioms: 'Avoir le cafard' (to feel down, literally 'have the cockroach'), 'Poser un lapin' (to stand someone up), 'Avoir la flemme' (to be lazy), 'C'est la galère' (it's a nightmare)",
        "Plus-que-parfait in narration: 'J'avais déjà mangé quand il est arrivé.' French literature uses complex tense sequences — le passé simple, l'imparfait, le plus-que-parfait together",
        "French debate culture: 'Je ne suis pas d'accord', 'Certes... mais...', 'En revanche...'. The French love intellectual debate — at dinner, at cafés, on TV. It's an art form",
        "French literature: Victor Hugo, Albert Camus (L'Étranger), Simone de Beauvoir, Marcel Proust. Analyze: le style, le thème, la métaphore, le personnage",
        "La dissertation française: introduction (amorce + problématique + annonce du plan), thèse, antithèse, synthèse, conclusion. Very rigid structure!"
      ]
    },
    C1: {
      u1: [
        "French registers: soutenu (literary), courant (standard), familier (informal), argot (slang), verlan (reversed syllables: meuf=femme, ouf=fou, relou=lourd)",
        "Le subjonctif passé + literary tenses: le passé simple (il alla, elle vit), l'imparfait du subjonctif (qu'il fût). Used in literature and formal speeches",
        "French persuasion: 'Force est de constater que...', 'Il va sans dire que...', 'Nul ne peut nier que...' — master the art of French rhetorical elegance",
        "French philosophy: Descartes ('Je pense, donc je suis'), Sartre (l'existentialisme), Foucault, Derrida. Read: la pensée, le concept, l'argument, la thèse",
        "Write a critique littéraire: analyze structure, style, themes, and cultural context. Use: 'L'auteur met en lumière...', 'On peut interpréter...', 'Cette oeuvre témoigne de...'"
      ]
    },
    C2: {
      u1: [
        "French cultural mastery: understand la politesse française (indirect communication), l'ironie, le second degré, les non-dits (what's left unsaid is as important as what's said)",
        "Stylistic grammar: use the passé simple for literary effect, the subjonctif imparfait for elegance, inversion for formal register. Write like Proust — long, layered sentences",
        "Impromptu discourse: speak on philosophy, politics, art, gastronomy without preparation. Use: 'Il convient de souligner...', 'À bien y réfléchir...', 'Tout compte fait...'",
        "French satire: Le Canard Enchaîné, Les Guignols, Coluche. Detect: l'ironie, le sarcasme, la parodie, la caricature. French humor = intellectual + irreverent",
        "Write a nouvelle (short story) or poem in French. Use literary devices: la métaphore, l'allégorie, le symbole, l'anaphore. Channel Maupassant, Baudelaire, or Prévert"
      ]
    }
  },

  // ─── PORTUGUESE (Brazilian) ────────────────────────────────────────
  pt: {
    A1: {
      u1: [
        "Brazilian greetings are warm: 'E aí, beleza?' (Hey, all good?), 'Tudo bem?' (Everything well?), 'Oi, sumido!' (Hey, stranger!). Learn: o abraço, o beijo, a saudade",
        "Brazilians are physical greeters: men hug (abraço), women kiss cheeks (beijinho). In Rio it's 2 kisses, São Paulo 1. Learn: cumprimentar, se apresentar, prazer em conhecer",
        "Ser vs Estar in Brazilian life: 'Sou brasileiro' (permanent) vs 'Estou em São Paulo' (location). Brazilian saying: 'A vida é assim' (That's life)",
        "Brazilian currency: o real (plural: reais). At the padaria: 'Quanto custa?' / 'Tá quanto?' (informal). Learn: o troco, o cartão, o Pix (Brazil's instant payment system!)",
        "A padaria (bakery) is Brazil's social hub — open early for café da manhã. Learn: o pão francês, o café com leite, o suco de laranja, a coxinha, o pão de queijo"
      ],
      u2: [
        "Brazilian family is everything: a mãe (mom rules), o pai, os avós, os tios. Sunday = almoço de família (family lunch with feijoada or churrasco)",
        "Brazilian present tense: eu falo, você fala (Brazilians use 'você' not 'tu' in most regions). Practice: 'Eu moro no Brasil', 'A gente vai à praia'",
        "Brazilian routine: acordar, tomar café, ir pro trabalho, almoçar (lunch is BIG — rice + beans + meat + salad), voltar pra casa, jantar, dormir",
        "Brazilian home: a sala (living room with TV for novelas), a cozinha, o quarto, a varanda. Many homes have a churrasqueira (BBQ grill) in the backyard",
        "Brazilian WhatsApp culture: everyone uses it! 'Oi', 'Blz?', 'Tmj' (tamo junto = we're together), 'Flw' (falou = bye), voice messages are VERY common"
      ]
    },
    A2: {
      u1: [
        "Brazilian directions: 'Segue reto, vira à esquerda no semáforo.' In Rio: 'Sobe o morro' / 'Desce pra praia.' Learn: a esquina, o sinal, a rotatória, o retorno",
        "Pretérito perfeito: 'Ontem eu fui à praia e tomei uma água de coco.' Brazilian storytelling is animated — use gestures and expressions! Learn: aconteceu, foi, fiz",
        "Brazilian transport: o ônibus, o metrô, o Uber (everyone uses it!), a van, a bicicleta. In São Paulo: 'Pegar o metrô na Paulista'. Learn: o ponto, a estação, o bilhete",
        "Rio landmarks: o Cristo Redentor, o Pão de Açúcar, Copacabana, Lapa. São Paulo: a Avenida Paulista, o Ibirapuera, a Liberdade. Learn: o ponto turístico, a vista, o mirante",
        "Describe your bairro (neighborhood): 'Moro num bairro tranquilo com padaria na esquina e uma praça bonita.' Learn: a vizinhança, o comércio, a feira"
      ],
      u2: [
        "Brazilian food: a feijoada (black bean stew with pork — Saturday tradition!), o açaí, o pão de queijo, a coxinha, o brigadeiro, a picanha, o pastel",
        "Ordering in Brazil: 'Moço/Moça, por favor!' (waiter/waitress). 'Me vê uma caipirinha' / 'Quero o prato feito (PF)'. Learn: o cardápio, a conta, o garçom, a gorjeta",
        "Imperfeito for Brazilian childhood: 'Quando eu era criança, minha avó fazia brigadeiro e a gente brincava na rua.' Nostalgia is big in Brazilian culture",
        "Brigadeiro recipe: leite condensado, chocolate em pó, manteiga, granulado. Roll into balls — Brazil's most beloved sweet! Every birthday party has it",
        "Na feira (street market): 'Olha a banana! Olha o tomate!' Vendors shout prices. Learn: a barraca, o feirante, a sacola, pesar, o quilo, a dúzia"
      ]
    },
    B1: {
      u1: [
        "Brazilian music: Samba (Rio, Carnaval), MPB (Música Popular Brasileira — Caetano Veloso, Gilberto Gil), Bossa Nova (Tom Jobim, João Gilberto), Funk (MC's), Sertanejo",
        "Subjuntivo in Brazilian Portuguese: 'Espero que você venha', 'Tomara que dê certo!' Brazilians use it less formally than European Portuguese",
        "Brazilian football culture: o Maracanã, a Seleção, Pelé, Neymar. 'Torcer' = to root for. Learn: o time, o gol, o campeonato, a torcida, o clássico",
        "Brazilian news: Folha de São Paulo, O Globo, G1. Topics: a desigualdade, o meio ambiente, a Amazônia, a política. Learn: a manchete, a reportagem, o jornalista",
        "Write an opinion about Brazilian culture: Carnaval (is it just a party or cultural expression?), futebol, novelas, música. Use: 'Na minha opinião...', 'Acredito que...'"
      ],
      u2: [
        "Brazilian workplace: 'O jeitinho brasileiro' (finding creative solutions), networking over cafezinho, less formal than European offices. Learn: a empresa, o chefe, a reunião",
        "Futuro do subjuntivo (unique to Portuguese!): 'Quando eu tiver dinheiro, vou viajar.' / 'Se você quiser, a gente vai.' Used constantly in Brazilian speech",
        "Brazilian job interview: more relaxed than formal, but still use 'o senhor/a senhora' with older interviewers. Learn: a vaga, o salário, os benefícios, o contrato CLT",
        "Brazilian job sites: LinkedIn, Catho, Vagas.com. 'Vaga para...' / 'Requisitos:' / 'Oferecemos:'. Learn: a experiência, a formação, o diferencial, o home office",
        "Brazilian CV (currículo): include photo, CPF number, objective statement. Different format from American résumés. Learn: dados pessoais, objetivo, experiência profissional"
      ]
    },
    B2: {
      u1: [
        "Brazilian slang: 'Mano' (bro), 'Da hora' (awesome), 'Show de bola' (great), 'Tá ligado?' (you know?), 'Mó' (very, from 'maior'), 'Suave' (chill/easy)",
        "Complex tenses: mais-que-perfeito ('Eu já tinha saído quando ele chegou'), futuro do pretérito ('Eu faria se pudesse'). Brazilian narration uses these layers",
        "Brazilian humor: stand-up (Fábio Porchat, Whindersson), memes, zoeira (teasing). 'Zoar' = to joke/tease. Understanding humor = understanding the culture",
        "Brazilian literature: Machado de Assis (Dom Casmurro), Clarice Lispector, Jorge Amado (Gabriela), Guimarães Rosa. Learn: o romance, o conto, a crônica, o poeta",
        "A crônica brasileira: short literary essay about daily life (Rubem Braga, Luis Fernando Verissimo). Write one about: o trânsito, a praia, o domingo, a vizinhança"
      ]
    },
    C1: {
      u1: [
        "Brazilian register switching: formal (o senhor), standard (você), informal (cê, tu in some regions), slang (mano, véi). Regional: carioca vs paulista vs gaúcho vs nordestino",
        "Advanced Portuguese structures: orações subordinadas, voz passiva sintética ('Vendem-se casas'), colocação pronominal. Written Portuguese is much more formal than spoken",
        "Brazilian debate: 'Com todo respeito...', 'Discordo plenamente...', 'Os dados mostram que...' — persuasion in Portuguese requires balancing emotion and logic",
        "Brazilian academic writing: ABNT formatting rules, formal register, extensive use of passive voice. Learn: a dissertação, o artigo científico, as referências bibliográficas",
        "Write a formal text on a Brazilian topic: a desigualdade social, a preservação da Amazônia, a educação pública, a diversidade cultural brasileira"
      ]
    },
    C2: {
      u1: [
        "Brazilian communication mastery: understand the 'jeitinho' in language (indirect requests, softeners), regional identity through speech, the poetry of everyday Brazilian Portuguese",
        "Stylistic writing: channel Clarice Lispector (stream of consciousness), Machado de Assis (irony and psychological depth), Guimarães Rosa (invented words from regional speech)",
        "Impromptu speech in Portuguese: discuss any topic with fluency — politics, philosophy, culture, economics. Use: 'Cabe ressaltar que...', 'É imperativo que...', 'Via de regra...'",
        "Brazilian satire and irony: Porta dos Fundos (YouTube), The Piauí Herald, political cartoons. Detect: a ironia, o sarcasmo, a crítica social, o humor negro",
        "Write a short story set in Brazil: capture the rhythm of Brazilian speech, use regionalismos, weave in cultural references (Carnaval, saudade, malandragem, a praia)"
      ]
    }
  },

  // ─── JAPANESE ──────────────────────────────────────────────────────
  ja: {
    A1: {
      u1: [
        "Japanese greetings change by time: おはようございます (ohayou gozaimasu - morning), こんにちは (konnichiwa - afternoon), こんばんは (konbanwa - evening). Bow depth shows respect level!",
        "Self-introduction ritual: はじめまして (hajimemashite - nice to meet you), 私は___です (watashi wa ___ desu), よろしくお願いします (yoroshiku onegaishimasu). ALWAYS end with this phrase!",
        "です/ます (desu/masu) = polite form. Japanese has 3 politeness levels: casual (友達 tomodachi/friends), polite (普通 futsuu/normal), honorific (敬語 keigo/business). Start with polite!",
        "Japanese counting uses different counters: 一つ、二つ (hitotsu, futatsu) for general things, 一人、二人 (hitori, futari) for people, 一本 (ippon) for long objects. Learn: 数える (kazoeru = to count)",
        "コンビニ (konbini = convenience store): 7-Eleven, Lawson, FamilyMart — open 24/7, you can pay bills, buy concert tickets, get onigiri (おにぎり). Learn: いらっしゃいませ (irasshaimase = welcome!)"
      ],
      u2: [
        "カタカナ (katakana) is for foreign words: コーヒー (koohii = coffee), パン (pan = bread, from Portuguese!), テレビ (terebi = TV). Many daily words are katakana!",
        "Japanese verb groups: る-verbs (食べる taberu = eat), う-verbs (飲む nomu = drink), irregular (する suru = do, 来る kuru = come). Conjugation is regular — no gender/number changes!",
        "Japanese daily schedule: 朝ごはん (asagohan = breakfast), 昼ごはん (hirugohan = lunch), 晩ごはん (bangohan = dinner). Write: 毎朝6時に起きます (maiasa rokuji ni okimasu = I wake at 6 every morning)",
        "Japanese family: お父さん (otousan = father), お母さん (okaasan = mother), おばあちゃん (obaachan = grandma). Note: different words for YOUR family vs SOMEONE ELSE'S family!",
        "Reading a Japanese schedule (時刻表 jikokuhyou): trains run ON TIME to the second. Learn: 出発 (shuppatsu = departure), 到着 (touchaku = arrival), ホーム (hoomu = platform)"
      ]
    },
    A2: {
      u1: [
        "Japanese directions: まっすぐ (massugu = straight), 右 (migi = right), 左 (hidari = left). Ask: すみません、駅はどこですか？ (sumimasen, eki wa doko desu ka? = Excuse me, where is the station?)",
        "て-form (te-form) connects actions: 起きて、シャワーを浴びて、朝ごはんを食べます (I wake up, shower, and eat breakfast). Also for requests: 待ってください (matte kudasai = please wait)",
        "Japanese trains: 電車 (densha), 新幹線 (shinkansen = bullet train), 地下鉄 (chikatetsu = subway). Learn: 切符 (kippu = ticket), IC card (Suica/Pasmo), 乗り換え (norikae = transfer)",
        "Navigate a Japanese train map: 山手線 (Yamanote-sen = Tokyo loop line), stations in kanji. Learn: 次は (tsugi wa = next is), 終点 (shuuten = last stop), 各駅停車 (kakueki teisha = local train)",
        "Write a travel plan: 週末に京都に行きたいです (shuumatsu ni Kyoto ni ikitai desu = I want to go to Kyoto this weekend). Plan: お寺 (otera = temple), 神社 (jinja = shrine), 抹茶 (matcha)"
      ],
      u2: [
        "Japanese food: 寿司 (sushi), ラーメン (raamen), 天ぷら (tempura), うどん (udon), 焼肉 (yakiniku = BBQ), たこ焼き (takoyaki = octopus balls), お好み焼き (okonomiyaki = savory pancake)",
        "Ordering in Japan: すみません！(to get attention) → これをお願いします (kore o onegaishimasu = this please) → お会計お願いします (okaikei onegaishimasu = check please). No tipping!",
        "Past tense (た-form): 食べた (tabeta = ate), 飲んだ (nonda = drank), 行った (itta = went). Tell about yesterday: 昨日、ラーメンを食べました (kinou, raamen o tabemashita)",
        "Japanese menu reading: 定食 (teishoku = set meal), 丼 (donburi = rice bowl), 刺身 (sashimi), 味噌汁 (misoshiru = miso soup). Sizes: 小 (shou = small), 中 (chuu = medium), 大 (dai = large)",
        "居酒屋 (izakaya = Japanese pub): order 飲み放題 (nomihoudai = all-you-can-drink), share 枝豆 (edamame), 唐揚げ (karaage = fried chicken). Say: とりあえずビール！(toriaezu biiru = beer first!)"
      ]
    },
    B1: {
      u1: [
        "敬語 (keigo = honorific language): 尊敬語 (sonkeigo = respect language for others), 謙譲語 (kenjougo = humble language for yourself). Example: 言う→おっしゃる (respect) / 申す (humble)",
        "Passive (受身形 ukemikei): 雨に降られた (ame ni furareta = got rained on — adversity passive, unique to Japanese!). Causative (使役形): 食べさせる (tabesaseru = make/let someone eat)",
        "Japanese pop culture: アニメ (anime), 漫画 (manga), ゲーム (game). Discuss: 好きなアニメは何ですか？ Learn: 声優 (seiyuu = voice actor), 同人 (doujin = fan works), コスプレ (cosplay)",
        "Japanese news: NHK (public), 朝日新聞 (Asahi), 読売新聞 (Yomiuri). Learn: 記事 (kiji = article), ニュース (nyuusu), 事件 (jiken = incident), 政治 (seiji = politics)",
        "Write a blog post: ブログ (burogu). Topic: 日本の文化について (nihon no bunka ni tsuite = about Japanese culture). Use: ～と思います (to omoimasu = I think), ～かもしれません (kamoshiremasen = maybe)"
      ]
    },
    B2: {
      u1: [
        "Japanese youth slang: やばい (yabai = amazing/terrible), マジ (maji = seriously), ウケる (ukeru = hilarious), エモい (emoi = emotional/aesthetic), 推し (oshi = favorite idol/character)",
        "Advanced connectors: ～にもかかわらず (nimokakawarazu = despite), ～ものの (monono = although), ～に伴い (ni tomonai = along with). JLPT N2 grammar patterns",
        "Japanese storytelling: use ～たら (tara = when/if), ～ている途中で (teiru tochuu de = in the middle of), 結局 (kekkyoku = in the end). Narrative structure: 起承転結 (kishoutenketsu)",
        "Japanese literature: 村上春樹 (Murakami Haruki), 夏目漱石 (Natsume Souseki - 'こころ'), 芥川龍之介 (Akutagawa - '羅生門'). Learn: 小説 (shousetsu = novel), 作家 (sakka = author)",
        "Write an opinion essay (意見文 ikenbun): structure = 序論 (joron = intro), 本論 (honron = body), 結論 (ketsuron = conclusion). Use: ～べきだ (beki da = should), ～ではないだろうか (dewa nai darou ka = isn't it?)"
      ]
    },
    C1: {
      u1: [
        "Advanced 敬語 mastery: 二重敬語 (nijuu keigo = double honorific — technically wrong but common), ビジネス敬語 (business keigo), メール敬語 (email keigo). Master: お忙しいところ恐れ入りますが...",
        "Literary grammar: ～であろう (de arou = probably, literary), ～ざるを得ない (zaru o enai = cannot help but), ～たる (taru = classical copula). Used in essays, speeches, formal writing",
        "Japanese presentation style: 本日は～についてお話しさせていただきます (honjitsu wa ~ ni tsuite ohanashi sasete itadakimasu). End: ご清聴ありがとうございました (goseichou arigatou gozaimashita)",
        "Japanese academic writing: 論文 (ronbun = paper), ～と考えられる (to kangaerareru = it is thought that), ～について述べる (ni tsuite noberu = to discuss). Formal, passive, objective",
        "Write a formal report: 報告書 (houkokusho). Structure: 件名 (kenmei = subject), 概要 (gaiyou = summary), 詳細 (shousai = details), 結論 (ketsuron = conclusion), 以上 (ijou = end)"
      ]
    },
    C2: {
      u1: [
        "Japanese communication mastery: 空気を読む (kuuki o yomu = read the air/room), 本音と建前 (honne to tatemae = true feelings vs public facade), 察する (sassuru = to sense/intuit without being told)",
        "Stylistic mastery: write like Murakami (surreal, detached), Kawabata (poetic, visual), Mishima (dramatic, classical). Use: 体言止め (taigendome = ending with noun for effect)",
        "Impromptu speech: 即興スピーチ (sokkyou supiichi). On any topic — politics, philosophy, culture. Use: ～と言っても過言ではない (to ittemo kagon dewa nai = it's no exaggeration to say)",
        "Classical Japanese (古文 kobun): understand texts from 源氏物語 (Genji Monogatari), 枕草子 (Makura no Soushi). Grammar: ～けり (past), ～なり (copula), ～べし (should/must)",
        "Write a short story (短編小説 tanpen shousetsu) in Japanese: use literary techniques, cultural references (四季 shiki = four seasons, 侘び寂び wabi-sabi = beauty in imperfection)"
      ]
    }
  },

  // ─── MANDARIN CHINESE ──────────────────────────────────────────────
  zh: {
    A1: {
      u1: [
        "Chinese tones change meaning completely: mā (妈 mom), má (麻 hemp), mǎ (马 horse), mà (骂 scold). Practice: 四是四，十是十 (sì shì sì, shí shì shí = 4 is 4, 10 is 10) — a tongue twister!",
        "Chinese self-introduction: 你好，我叫___，我是___人 (nǐ hǎo, wǒ jiào ___, wǒ shì ___ rén). Add: 认识你很高兴 (rènshi nǐ hěn gāoxìng = nice to meet you). Exchange 名片 (míngpiàn = business card)",
        "Chinese sentence structure is SVO like English: 我是学生 (wǒ shì xuéshēng = I am a student). No conjugation, no tenses, no gender — but word order and particles matter!",
        "Chinese numbers are logical: 11 = 十一 (shíyī = ten-one), 20 = 二十 (èrshí = two-ten), 99 = 九十九 (jiǔshíjiǔ). Money: 块 (kuài = yuan colloquial), 毛 (máo = 0.1 yuan), 分 (fēn = 0.01)",
        "Chinese shops: 超市 (chāoshì = supermarket), 便利店 (biànlìdiàn = convenience store), 菜市场 (càishìchǎng = wet market). Bargaining at markets: 太贵了！便宜一点！(tài guì le! piányi yīdiǎn! = too expensive! cheaper!)"
      ],
      u2: [
        "Chinese family terms are VERY specific: 爸爸 (bàba = dad), 妈妈 (māma = mom), 哥哥 (gēge = older brother), 弟弟 (dìdi = younger brother), 姐姐 (jiějie = older sister), 妹妹 (mèimei = younger sister)",
        "Chinese time: 现在几点？(xiànzài jǐ diǎn? = what time is it?). Structure: X点Y分 (X diǎn Y fēn). Dates: 年月日 (nián yuè rì = year-month-day). Today: 今天 (jīntiān), tomorrow: 明天 (míngtiān)",
        "Chinese daily routine: 起床 (qǐchuáng = get up), 刷牙 (shuāyá = brush teeth), 吃早饭 (chī zǎofàn = eat breakfast), 上班 (shàngbān = go to work), 下班 (xiàbān = leave work), 睡觉 (shuìjiào = sleep)",
        "Chinese home: 客厅 (kètīng = living room), 卧室 (wòshì = bedroom), 厨房 (chúfáng = kitchen), 卫生间 (wèishēngjiān = bathroom). Many Chinese families live in 公寓 (gōngyù = apartments)",
        "WeChat (微信 Wēixìn) is China's everything app: messaging, payments, social media. Common messages: 在吗？(zài ma? = are you there?), 好的 (hǎo de = ok), 哈哈哈 (hāhāhā = hahaha)"
      ]
    },
    A2: {
      u1: [
        "Chinese directions: 往前走 (wǎng qián zǒu = go forward), 左转 (zuǒ zhuǎn = turn left), 右转 (yòu zhuǎn = turn right). Ask: 请问，地铁站在哪儿？(qǐngwèn, dìtiězhàn zài nǎr? = where's the subway?)",
        "了 (le) marks completed actions: 我吃了 (wǒ chī le = I ate). 过 (guò) marks life experiences: 我去过中国 (wǒ qù guò Zhōngguó = I've been to China). These two particles are fundamental!",
        "Chinese transport: 地铁 (dìtiě = subway), 公交车 (gōngjiāochē = bus), 出租车 (chūzūchē = taxi), 高铁 (gāotiě = high-speed rail), 共享单车 (gòngxiǎng dānchē = bike share). Use 滴滴 (Dīdī = China's Uber)",
        "Navigate Chinese subway: 换乘 (huànchéng = transfer), 出口 (chūkǒu = exit), 站 (zhàn = station). Beijing: 1号线 (yī hào xiàn = Line 1). Learn: 刷卡 (shuākǎ = swipe card), 扫码 (sǎomǎ = scan QR code)",
        "Describe your city: 我的城市很大，有很多高楼 (wǒ de chéngshì hěn dà, yǒu hěn duō gāolóu = my city is big with many tall buildings). Learn: 公园 (gōngyuán = park), 商场 (shāngchǎng = mall)"
      ],
      u2: [
        "Chinese food: 饺子 (jiǎozi = dumplings), 面条 (miàntiáo = noodles), 火锅 (huǒguō = hot pot), 北京烤鸭 (Běijīng kǎoyā = Peking duck), 小笼包 (xiǎolóngbāo = soup dumplings), 麻婆豆腐 (mápó dòufu)",
        "Ordering food: 服务员！(fúwùyuán! = waiter!) → 我要一个... (wǒ yào yī gè... = I want one...) → 买单 (mǎidān = check please). In China, one person usually pays for everyone!",
        "Measure words (量词 liàngcí): 个 (gè = general), 杯 (bēi = cups), 瓶 (píng = bottles), 碗 (wǎn = bowls), 盘 (pán = plates), 双 (shuāng = pairs). Every noun needs its specific measure word!",
        "Read a Chinese menu: 凉菜 (liángcài = cold dishes), 热菜 (rècài = hot dishes), 主食 (zhǔshí = staples), 汤 (tāng = soup), 饮料 (yǐnliào = drinks). Spice levels: 微辣/中辣/特辣 (wēi/zhōng/tè là)",
        "Chinese restaurant culture: 转桌 (zhuǎnzhuō = lazy Susan), 拼桌 (pīnzhuō = sharing tables with strangers), 打包 (dǎbāo = takeaway box). Fighting over the bill is a cultural sport!"
      ]
    },
    B1: {
      u1: [
        "Chinese festivals: 春节 (Chūnjié = Chinese New Year — 15 days!), 中秋节 (Zhōngqiūjié = Mid-Autumn Festival — mooncakes!), 端午节 (Duānwǔjié = Dragon Boat Festival — zongzi rice dumplings!)",
        "把 (bǎ) construction: puts the object before the verb for emphasis on the action's result. 把门关上 (bǎ mén guānshàng = close the door). 把作业做完 (bǎ zuòyè zuòwán = finish the homework)",
        "Discuss Chinese culture: 中国有五千年的历史 (Zhōngguó yǒu wǔqiān nián de lìshǐ = China has 5000 years of history). Topics: 功夫 (gōngfu), 书法 (shūfǎ = calligraphy), 茶道 (chádào = tea ceremony)",
        "Chinese news: 人民日报 (Rénmín Rìbào), 新华社 (Xīnhuáshè), CCTV. Learn: 新闻 (xīnwén = news), 报道 (bàodào = report), 社会 (shèhuì = society), 经济 (jīngjì = economy), 科技 (kējì = technology)",
        "Write an opinion: 我认为... (wǒ rènwéi = I think...), 一方面...另一方面... (yī fāngmiàn... lìng yī fāngmiàn = on one hand... on the other). Topic: 传统文化在现代社会的作用 (role of traditional culture in modern society)"
      ],
      u2: [
        "Chinese business: 公司 (gōngsī = company), 老板 (lǎobǎn = boss), 同事 (tóngshì = colleague), 加班 (jiābān = overtime — very common!). Learn: 996 culture (9am-9pm, 6 days/week)",
        "被 (bèi) passive: 我被老板批评了 (wǒ bèi lǎobǎn pīpíng le = I was criticized by the boss). Formal connectors: 因此 (yīncǐ = therefore), 然而 (rán'ér = however), 此外 (cǐwài = moreover)",
        "Chinese job interview: 请做一下自我介绍 (qǐng zuò yīxià zìwǒ jièshào = please introduce yourself). Key phrases: 我的优点是... (my strength is...), 我的目标是... (my goal is...)",
        "Chinese job ads on 智联招聘 (Zhìlián Zhāopìn), 前程无忧 (Qiánchéng Wúyōu), BOSS直聘. Learn: 岗位 (gǎngwèi = position), 薪资 (xīnzī = salary), 五险一金 (wǔxiǎn yījīn = social insurance + housing fund)",
        "Chinese résumé (简历 jiǎnlì): include photo, 籍贯 (jíguàn = hometown), 政治面貌 (zhèngzhì miànmào = political status). Format: 基本信息, 教育背景, 工作经历, 技能特长"
      ]
    },
    B2: {
      u1: [
        "成语 (chéngyǔ = four-character idioms): 一举两得 (yī jǔ liǎng dé = kill two birds with one stone), 画蛇添足 (huà shé tiān zú = to gild the lily), 对牛弹琴 (duì niú tán qín = casting pearls before swine)",
        "Advanced patterns: 不但...而且 (bùdàn...érqiě = not only...but also), 虽然...但是 (suīrán...dànshì = although...but), 既然...就 (jìrán...jiù = since...then), 无论...都 (wúlùn...dōu = no matter...all)",
        "Chinese debate: 我完全不同意 (wǒ wánquán bù tóngyì = I completely disagree), 恕我直言 (shù wǒ zhíyán = forgive my frankness), 让我换个角度说 (ràng wǒ huàn gè jiǎodù shuō = let me put it differently)",
        "Chinese literature: 鲁迅 (Lǔ Xùn — 'Diary of a Madman'), 莫言 (Mò Yán — Nobel Prize), 余华 (Yú Huá — 'To Live'), 张爱玲 (Zhāng Àilíng). Learn: 作品 (zuòpǐn = work), 主题 (zhǔtí = theme)",
        "Write an argumentative essay (议论文 yìlùnwén): 论点 (lùndiǎn = thesis), 论据 (lùnjù = evidence), 论证 (lùnzhèng = reasoning). Structure: 提出问题 → 分析问题 → 解决问题"
      ]
    },
    C1: {
      u1: [
        "Chinese register: 书面语 (shūmiànyǔ = written/formal) vs 口语 (kǒuyǔ = spoken/casual). Written: 因此、然而、鉴于. Spoken: 所以、但是、看在. Mastering both = true fluency",
        "Classical Chinese (文言文 wényánwén) echoes in modern Chinese: 之 (zhī = 的), 乎 (hū = 吗), 者 (zhě = 的人), 也 (yě = sentence-final particle). Found in: 成语, formal writing, poetry",
        "Chinese formal speech: 尊敬的各位来宾 (zūnjìng de gèwèi láibīn = respected guests), 我很荣幸... (wǒ hěn róngxìng = I'm honored to...), 谢谢大家的聆听 (xièxie dàjiā de língtīng = thank you for listening)",
        "Chinese academic writing: 摘要 (zhāiyào = abstract), 关键词 (guānjiàncí = keywords), 引言 (yǐnyán = introduction), 结论 (jiélùn = conclusion). Style: objective, formal, evidence-based",
        "Write a formal report: 报告 (bàogào). Structure: 标题 (biāotí = title), 正文 (zhèngwén = body), 建议 (jiànyì = recommendations). Use: 据调查... (jù diàochá = according to research...)"
      ]
    },
    C2: {
      u1: [
        "Chinese communication mastery: 面子 (miànzi = face/reputation), 关系 (guānxi = relationships/connections), 含蓄 (hánxù = subtlety/indirectness). Understanding what's NOT said is as important as what IS said",
        "Stylistic writing: use 对仗 (duìzhàng = parallelism), 排比 (páibǐ = rhetorical repetition), 比喻 (bǐyù = metaphor). Write with the elegance of classical Chinese infused into modern prose",
        "Impromptu speech on any topic: 众所周知 (zhòngsuǒzhōuzhī = as everyone knows), 不言而喻 (bùyán'éryù = it goes without saying), 综上所述 (zōngshàngsuǒshù = to sum up)",
        "Classical Chinese texts: 论语 (Lúnyǔ = Analerta of Confucius), 道德经 (Dàodéjīng), 唐诗 (Tángshī = Tang poetry). Understand: 子曰 (zǐ yuē = the Master said), 学而时习之 (xué ér shí xí zhī)",
        "Write a short story in Chinese: use 修辞手法 (xiūcí shǒufǎ = rhetorical devices), cultural references (四大名著 sì dà míngzhù = Four Great Classical Novels), capture the rhythm of Chinese prose"
      ]
    }
  },

  // ─── SPANISH STANDARD ──────────────────────────────────────────────
  es: {
    A1: {
      u1: [
        "Spanish greetings vary by region: ¡Hola! is universal, but in Spain you'll hear '¿Qué tal?' while in Latin America '¿Cómo estás?' is more common. Learn: el saludo, la despedida, el abrazo",
        "In Spain, two kisses (dos besos) on the cheeks is standard greeting between friends. Learn: presentarse, encantado/a, mucho gusto, ¿de dónde eres?",
        "Ser vs Estar: Ser = identity (Soy español), Estar = state/location (Estoy en Madrid). Spanish proverb: 'Ser o no ser, esa es la cuestión' (Shakespeare in Spanish!)",
        "Spanish numbers: learn to count euros and céntimos. At a café: '¿Cuánto es?' / 'Son dos euros con cincuenta.' Learn: la cuenta, el cambio, la propina (tip — not mandatory in Spain!)",
        "Spanish café culture: un café solo (espresso), un cortado (espresso + splash of milk), un café con leche. Order: '¡Perdona! Un café con leche, por favor.' The café is a social institution"
      ],
      u2: [
        "Spanish family: la familia is central to Hispanic culture. Sunday lunch together is sacred. Learn: los padres, los abuelos, los hermanos, los primos, la sobremesa (after-meal conversation)",
        "Spanish present tense: -AR (hablar → hablo), -ER (comer → como), -IR (vivir → vivo). Practice with daily life: 'Hablo español', 'Como paella los domingos', 'Vivo en Barcelona'",
        "Spanish daily routine: desayunar (light breakfast), comer (big lunch 2-3pm), merendar (afternoon snack), cenar (late dinner 9-10pm!). Spain's schedule is unique in Europe!",
        "Spanish home: el piso (apartment — most Spaniards live in flats), el salón, la cocina, el dormitorio. Learn: el balcón, la terraza, el portal, el ascensor",
        "Spanish postcards from vacation: 'Queridos amigos, estoy en Mallorca. Hace sol y la playa es preciosa. ¡Un abrazo!' Learn: las vacaciones, el viaje, el recuerdo"
      ]
    },
    A2: {
      u1: [
        "Spanish directions: 'Sigue todo recto, gira a la izquierda en el semáforo.' In Spain, people give directions using landmarks: 'Pasada la farmacia, al lado del Mercadona.' Learn: la calle, la plaza, la rotonda",
        "Past tense (pretérito indefinido): Ayer fui, comí, salí. Irregular: fui, hice, dije, puse. Tell about yesterday: 'Ayer fui al centro y comí tapas en un bar'",
        "Spanish transportation: el metro, el autobús, el AVE (high-speed train), el taxi, BiciMad (bike share in Madrid). Learn: la parada, el billete, el abono, hacer transbordo",
        "Spanish cities: Madrid (la Gran Vía, el Retiro), Barcelona (la Sagrada Familia, las Ramblas), Sevilla (la Giralda, el Alcázar). Learn: el casco antiguo, la catedral, el museo",
        "Write about a trip: 'El fin de semana pasado fui a Toledo. Visité la catedral y comí mazapán.' Learn: el destino, el alojamiento, la excursión, el recorrido"
      ],
      u2: [
        "Spanish food: la paella (Valencia), las tapas (everywhere!), el jamón ibérico, la tortilla española, el gazpacho, los churros con chocolate, el cocido madrileño",
        "Ordering in Spain: '¡Perdona!' (to get attention) → 'Ponme una caña y una tapa de tortilla' → '¿Me cobras?' (check please). Tapas culture: small dishes shared with friends over drinks",
        "Imperfect tense: 'Cuando era pequeño, mi abuela hacía paella los domingos.' Spanish grandmothers and their recipes are legendary! La receta de la abuela = sacred",
        "Follow a recipe for tortilla española: los huevos, las patatas, la cebolla, el aceite de oliva. 'Pelar y cortar las patatas, freír a fuego lento, batir los huevos...'",
        "Spanish market (el mercado): Mercado de San Miguel (Madrid), La Boquería (Barcelona). Vendors: '¿Qué le pongo?' Learn: el puesto, la fruta, la verdura, el pescado, la carnicería"
      ]
    },
    B1: {
      u1: [
        "Spanish culture: el flamenco (Andalucía — cante, baile, guitarra), las fiestas (San Fermín, Las Fallas, La Tomatina), la siesta, la vida nocturna. Learn: la tradición, la costumbre, la fiesta",
        "Subjunctive in Spanish: 'Quiero que vengas', 'Espero que estés bien', 'No creo que sea verdad.' Triggers: querer que, esperar que, no creer que, es posible que",
        "Discuss Spanish culture: '¿Crees que la siesta es una buena tradición?' / 'En mi opinión, el flamenco es...' Learn: la identidad, el patrimonio cultural, las raíces",
        "Spanish news: El País, El Mundo, La Vanguardia. Topics: la política, la economía, el cambio climático, la inmigración. Learn: el artículo, el titular, la opinión, el editorial",
        "Write an opinion about Spanish traditions: '¿Se están perdiendo las tradiciones españolas?' Use: 'Creo que...', 'Por un lado... por otro...', 'En conclusión...'"
      ],
      u2: [
        "Spanish workplace: el horario partido (split schedule: 9-2, then 5-8), la pausa para el café, el compañero de trabajo. Learn: la empresa, el jefe, la reunión, el contrato, las vacaciones",
        "Conditional for politeness: '¿Podría ayudarme?', 'Me gustaría...', '¿Sería posible...?' Spanish business communication values formality and indirect requests",
        "Spanish job interview: use usted, dress formally, be prepared for personal questions (legal in Spain). Learn: la entrevista, el puesto, las competencias, la experiencia",
        "Spanish job ads on InfoJobs, LinkedIn: 'Se busca', 'Requisitos', 'Se ofrece'. Learn: el sueldo, el convenio, la jornada completa/parcial, el teletrabajo",
        "Spanish cover letter (carta de presentación): formal structure with 'Estimado/a Sr./Sra.', express motivation, end with 'Quedo a su disposición.' Very formulaic!"
      ]
    },
    B2: {
      u1: [
        "Spanish idioms: 'Estar en las nubes' (daydreaming), 'No tener pelos en la lengua' (to be blunt), 'Meter la pata' (to put your foot in it), 'Ir al grano' (get to the point)",
        "Complex subjunctive: 'Si tuviera dinero, viajaría por el mundo.' Past subjunctive + conditional = hypothetical situations. Also: 'Ojalá hubiera ido' (I wish I had gone)",
        "Spanish debate culture: 'Desde mi punto de vista...', 'Discrepo totalmente...', 'Permítame discrepar...' Spaniards are passionate debaters — interrupting is normal!",
        "Spanish literature: Cervantes (Don Quijote), García Lorca (poeta), Pérez-Galdós, Ana María Matute. Learn: la obra, el autor, el estilo, la generación del 98, el Siglo de Oro",
        "Write a personal essay about identity: la identidad cultural, las raíces, la globalización vs tradición. Use: 'Me identifico con...', 'Mi cultura me ha enseñado que...'"
      ]
    },
    C1: {
      u1: [
        "Spanish registers: formal (usted, estimado), standard (tú, normal), colloquial (tío, mola, flipar), vulgar. Regional: castellano vs andaluz vs canario. Code-switching is a social skill",
        "Rhetorical devices in Spanish: la anáfora (repetition), la hipérbole (exaggeration), la ironía, el eufemismo. Politicians and writers use these constantly. Learn to detect and deploy them",
        "Persuasive speaking: 'Permítanme argumentar que...', 'Los datos demuestran que...', 'No cabe duda de que...' Master the art of Spanish formal persuasion",
        "Spanish academic text: el ensayo académico, la tesis doctoral, el artículo de investigación. Style: formal, objective, with extensive citations. Learn: citar, argumentar, contrastar",
        "Write a critique: analyze a cultural phenomenon (el turismo masivo, la gentrificación, la España vaciada). Use: 'Cabe señalar que...', 'Resulta evidente que...', 'A modo de conclusión...'"
      ]
    },
    C2: {
      u1: [
        "Spanish communication mastery: understand regional humor (el humor negro español), double meanings (el doble sentido), cultural references (Don Quijote, la Movida Madrileña), and the art of la sobremesa",
        "Stylistic grammar: use the subjunctive for literary effect, master the pretérito anterior (hubo dicho), employ rhetorical questions and periodic sentences like Cervantes",
        "Impromptu speech on any topic: 'Huelga decir que...', 'No es baladí que...', 'Dicho lo cual...', 'Sin ánimo de ser exhaustivo...' Speak with the elegance of a native intellectual",
        "Spanish satire and irony: El Mundo Today, La Burbuja, political humor. Detect: la sátira, la parodia, el sarcasmo, la crítica social velada. Spanish humor is dark and self-deprecating",
        "Write a short story set in Spain: capture the rhythm of Spanish speech, use regionalismos, weave in cultural references (la Semana Santa, los toros, la tertulia, el pueblo)"
      ]
    }
  }
};

// ─── INJECTION LOGIC ─────────────────────────────────────────────────

function injectHints() {
  let modified = content;
  let totalInjected = 0;

  for (const [langPrefix, levels] of Object.entries(CULTURAL_HINTS)) {
    for (const [level, units] of Object.entries(levels)) {
      for (const [unitKey, hints] of Object.entries(units)) {
        const unitNum = parseInt(unitKey.replace('u', ''));
        for (let lessonIdx = 0; lessonIdx < hints.length; lessonIdx++) {
          const lessonNum = lessonIdx + 1;
          // Find the lesson by its lid pattern
          const lidPattern = `lid("${langPrefix}","${level}",${unitNum},${lessonNum})`;
          const lidIndex = modified.indexOf(lidPattern);
          
          if (lidIndex === -1) continue;
          
          // Find the end of this lesson object (next '}' after the lid)
          // We need to find the closing brace of the lesson object
          let braceCount = 0;
          let searchStart = lidIndex;
          let objectStart = -1;
          
          // Go backwards to find the opening '{'
          for (let i = lidIndex; i >= 0; i--) {
            if (modified[i] === '{') {
              objectStart = i;
              break;
            }
          }
          
          if (objectStart === -1) continue;
          
          // Find the matching closing '}'
          let objectEnd = -1;
          braceCount = 0;
          for (let i = objectStart; i < modified.length; i++) {
            if (modified[i] === '{') braceCount++;
            if (modified[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                objectEnd = i;
                break;
              }
            }
          }
          
          if (objectEnd === -1) continue;
          
          // Check if this lesson already has a culturalHint
          const lessonText = modified.substring(objectStart, objectEnd + 1);
          if (lessonText.includes('culturalHint:')) continue;
          
          // Inject culturalHint before the closing brace
          const hint = hints[lessonIdx].replace(/'/g, "\\'").replace(/"/g, '\\"');
          const injection = `, culturalHint: "${hints[lessonIdx].replace(/"/g, '\\"')}"`;
          
          // Insert before the closing '}'
          modified = modified.substring(0, objectEnd) + injection + modified.substring(objectEnd);
          totalInjected++;
        }
      }
    }
  }

  console.log(`Injected ${totalInjected} culturalHints`);
  fs.writeFileSync(filePath, modified, 'utf8');
  console.log('File saved successfully');
}

injectHints();
