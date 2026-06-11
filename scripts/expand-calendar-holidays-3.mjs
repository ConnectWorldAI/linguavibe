/**
 * Expand French, Japanese, Korean, Italian, German, Portuguese, and Mandarin holidays
 * with location, history, dances, music, and newsStyle fields.
 */
import fs from 'fs';

const filePath = '/home/ubuntu/linguavibe/lib/cultural-calendar.ts';
let content = fs.readFileSync(filePath, 'utf-8');

const expansions = {
  // === VENEZUELAN EXTRAS ===
  carnaval_ve: {
    location: `{
      city: "El Callao",
      region: "Bolívar",
      country: "Venezuela",
      coordinates: { lat: 7.3500, lng: -61.8167 },
      famousVenues: ["Calle Bolívar (main parade)", "Plaza El Callao", "Mining town streets"],
    }`,
    history: `{
      origin: "Founded by Trinidadian, Martinican, and Guadeloupean miners who came for the gold rush in the 1850s. They brought calypso, soca, and Caribbean carnival traditions to the Venezuelan jungle.",
      whyTheyCelebrate: "El Callao celebrates because Carnival is their identity — a unique Afro-Caribbean-Venezuelan fusion found nowhere else. The Madamas (matriarchs) represent the strong women who held communities together during the gold rush.",
      historicalContext: "English and French-speaking Caribbean workers arrived in the 1850s-1900s for gold mining. They maintained their carnival traditions in isolation, creating a unique blend. UNESCO Intangible Cultural Heritage since 2016.",
      yearEstablished: 1853,
      evolution: "Started as Caribbean miners' celebrations in the 1850s. The Madamas tradition (women in colorful dresses and turbans) became iconic. Calypso sung in English/French patois mixed with Spanish. UNESCO recognition in 2016 brought international attention.",
    }`,
    dances: `[
      {
        name: "Calipso de El Callao",
        description: "Dancers follow the comparsas through streets — shuffling feet, swaying hips, arms raised. The Madamas lead with dignified, graceful movements. The Diablos (devils) jump and spin wildly around them.",
        music: "Steel drums (pan), bumbac drums, rallador (scraper), and calypso vocals in a mix of English, French patois, and Spanish",
        attire: "Madamas: elaborate colorful dresses with petticoats, turbans, and gold jewelry. Diablos: black bodysuits with horned masks. Medio Pintos: covered in black grease, chasing people to 'paint' them.",
      },
    ]`,
    music: `["Calipso de El Callao (traditional)", "Woman del Callao", "Isidora (tribute to famous Madama)"]`,
    newsStyle: `{
      headline: "El Callao's UNESCO Carnival erupts! Madamas lead calypso processions through Venezuela's gold mining town",
      urgency: "happening_now",
    }`,
  },
  san_lazaro: {
    location: `{
      city: "El Rincón (Santiago de las Vegas)",
      region: "Havana Province",
      country: "Cuba",
      coordinates: { lat: 22.9667, lng: -82.3833 },
      famousVenues: ["Santuario Nacional de San Lázaro (El Rincón)", "Carretera de El Rincón (pilgrimage road)"],
    }`,
    history: `{
      origin: "Syncretic tradition merging Catholic San Lázaro (patron of the sick and poor) with Yoruba orisha Babalú-Ayé (deity of disease and healing). Enslaved Africans identified their gods with Catholic saints to preserve their religion.",
      whyTheyCelebrate: "Cubans celebrate because San Lázaro/Babalú-Ayé represents hope for the sick and suffering. People make promesas (vows) — if healed, they crawl to the sanctuary on their knees, drag themselves with chains, or walk barefoot for kilometers.",
      historicalContext: "Santería (Regla de Ocha) developed when enslaved Yoruba people in Cuba hid their orishas behind Catholic saint images. San Lázaro = Babalú-Ayé became one of the most powerful syncretisms. The tradition survived despite colonial and revolutionary attempts to suppress it.",
      yearEstablished: 1700,
      evolution: "Practiced secretly during slavery. After abolition (1886), it became public. The Castro government initially suppressed religion but couldn't stop the Dec 17 pilgrimage. Today 50,000+ Cubans walk to El Rincón annually — believers and non-believers alike.",
    }`,
    music: `["Babalú (Miguelito Valdés)", "Canto a Babalú-Ayé (Santería chant)", "Drums for Babalú-Ayé (batá drums)"]`,
    newsStyle: `{
      headline: "Thousands of Cubans begin pilgrimage to El Rincón — crawling on knees to honor San Lázaro/Babalú-Ayé",
      urgency: "this_week",
    }`,
  },
  anexion_guanacaste: {
    location: `{
      city: "Liberia",
      region: "Guanacaste Province",
      country: "Costa Rica",
      coordinates: { lat: 10.6333, lng: -85.4333 },
      famousVenues: ["Parque Mario Cañas Ruiz (Liberia)", "Plaza de la Anexión", "Haciendas of Guanacaste"],
    }`,
    history: `{
      origin: "On July 25, 1824, the Partido de Nicoya (then part of Nicaragua) voted to annex itself to Costa Rica. The people chose Costa Rica over Nicaragua because of better governance and economic opportunity.",
      whyTheyCelebrate: "Guanacastecos celebrate because they CHOSE to be Costa Rican — it wasn't conquest or colonization. It's a celebration of self-determination and the unique sabanero (cowboy) culture of the Pacific lowlands.",
      historicalContext: "After Central American independence from Spain (1821), the Partido de Nicoya was disputed between Nicaragua and Costa Rica. The local population voted to join Costa Rica. This is the only case in Central American history of a territory choosing its own country.",
      yearEstablished: 1824,
      evolution: "Originally a civic ceremony. Over time, it became a celebration of Guanacasteco identity — the sabanero culture, Chorotega indigenous heritage, and Pacific coast traditions. Today it features rodeos, marimba music, and traditional foods.",
    }`,
    dances: `[
      {
        name: "Punto Guanacasteco",
        description: "Costa Rica's national dance — couples face each other and perform zapateado (foot-stamping) while the woman waves her skirt. It's a courtship dance with playful energy.",
        music: "Marimba (wooden xylophone), guitar, and quijongo (single-string bow instrument unique to Guanacaste)",
        attire: "Women: white blouse with colorful trim, long flowered skirt. Men: white shirt, white pants, leather boots, and a wide-brimmed hat.",
      },
    ]`,
    music: `["Punto Guanacasteco (national folk song)", "Luna Liberiana", "Pampa (marimba instrumental)", "El Torito"]`,
    newsStyle: `{
      headline: "Guanacaste celebrates 200+ years of choosing Costa Rica! Rodeos, marimba, and sabanero pride fill Liberia",
      urgency: "this_week",
    }`,
  },
  vendimia_mendoza: {
    location: `{
      city: "Mendoza",
      region: "Mendoza Province",
      country: "Argentina",
      coordinates: { lat: -32.8895, lng: -68.8458 },
      famousVenues: ["Teatro Griego Frank Romero Day (amphitheater)", "Avenida San Martín (parade route)", "Bodega wineries of Maipú and Luján de Cuyo"],
    }`,
    history: `{
      origin: "Started in 1936 to celebrate the grape harvest and Mendoza's wine industry. Italian and Spanish immigrants brought winemaking traditions to the arid Andean foothills, transforming desert into vineyards using Inca-era irrigation channels.",
      whyTheyCelebrate: "Mendocinos celebrate because wine IS their identity — the province produces 70% of Argentina's wine. The Vendimia honors the labor of grape pickers, the ingenuity of irrigation, and the transformation of desert into abundance.",
      historicalContext: "Italian immigrants (especially from Piedmont and Sicily) arrived in the late 1800s and planted Malbec vines that thrived in Mendoza's high-altitude desert climate. They used Huarpe indigenous irrigation systems (acequias) to water the vines.",
      yearEstablished: 1936,
      evolution: "Started as a small harvest festival. By the 1960s, it became Argentina's largest festival with 40,000+ spectators at the amphitheater. The Reina de la Vendimia (Harvest Queen) competition became iconic. Today it's a week-long celebration with concerts, parades, and the Blessing of the Fruits.",
    }`,
    dances: `[
      {
        name: "Zamba",
        description: "Elegant courtship dance — partners circle each other waving white handkerchiefs, never touching. The man kneels, the woman turns away, then finally accepts. Slower and more romantic than cueca.",
        music: "Guitar, bombo legüero (large drum), violin. The rhythm is gentle and flowing — 6/8 time.",
        attire: "Women: long flowing dress (often white or pastel). Men: gaucho outfit — bombachas (baggy pants), leather boots, wide belt with silver coins, and a poncho.",
      },
    ]`,
    music: `["Zamba de Mi Esperanza", "Luna Tucumana (Atahualpa Yupanqui)", "Cosechero (harvest song)", "Tonada Cuyana (Mendoza folk genre)"]`,
    newsStyle: `{
      headline: "Vendimia explodes in Mendoza! 40,000 gather at the amphitheater as Argentina crowns its Harvest Queen",
      urgency: "happening_now",
    }`,
  },
  senor_milagros: {
    location: `{
      city: "Lima",
      region: "Lima Province",
      country: "Peru",
      coordinates: { lat: -12.0464, lng: -77.0428 },
      famousVenues: ["Iglesia de las Nazarenas (home of the painting)", "Jirón de la Unión (procession route)", "Plaza Mayor de Lima"],
    }`,
    history: `{
      origin: "In 1651, an enslaved Angolan man painted a mural of Christ crucified on an adobe wall in Pachacamilla (Lima's African quarter). In 1655, a massive earthquake destroyed everything — except that wall. The painting survived intact.",
      whyTheyCelebrate: "Limeños celebrate because the Señor de los Milagros (Lord of Miracles) has survived every earthquake since 1655 — Lima is in a major seismic zone. He represents divine protection over a city that lives in constant earthquake threat.",
      historicalContext: "The painting was made by an enslaved African in the poorest quarter of colonial Lima. When it survived the earthquake, the Spanish authorities tried to destroy it (they didn't want Africans having their own devotion). But every attempt failed — workers fell ill or their tools broke. The Church finally accepted it.",
      yearEstablished: 1655,
      evolution: "After the 1655 earthquake, devotion grew. The 1746 earthquake (which destroyed most of Lima) cemented the cult — the wall survived again. The purple habit worn by devotees started in the 1700s. Today the October procession is the largest religious event in the Americas — 1 million+ people over 24 hours.",
    }`,
    music: `["Himno al Señor de los Milagros", "Canto de las Sahumadoras (incense bearers)", "Peruvian criollo waltzes played during procession"]`,
    newsStyle: `{
      headline: "Lima turns purple! 1 million+ devotees follow the Señor de los Milagros through the streets in the Americas' largest procession",
      urgency: "happening_now",
    }`,
  },
  la_tirana: {
    location: `{
      city: "La Tirana",
      region: "Tarapacá",
      country: "Chile",
      coordinates: { lat: -20.5500, lng: -69.6500 },
      famousVenues: ["Santuario de La Tirana", "Plaza del pueblo", "Desert streets of La Tirana (population 560, swells to 200,000+)"],
    }`,
    history: `{
      origin: "Legend says an Inca princess ('La Tirana' — the tyrant) fled Spanish conquest and ruled the Atacama Desert. She fell in love with a Portuguese prisoner and converted to Christianity. Her own people killed her for the betrayal. A shrine was built where she died.",
      whyTheyCelebrate: "Northern Chileans celebrate because La Tirana represents the fusion of indigenous Andean spirituality with Catholicism — the Diabladas (devil dances) honor Pachamama while worshipping the Virgin. It's about dual identity — Andean AND Chilean.",
      historicalContext: "The Atacama Desert was Aymara and Quechua territory before becoming Chilean (after the War of the Pacific, 1879-1884). The festival preserves pre-Columbian dance traditions within a Catholic framework — a survival strategy for indigenous culture.",
      yearEstablished: 1540,
      evolution: "Started as a small shrine in the 1500s. Nitrate mining boom (1880s-1930s) brought workers who expanded the festival. After the mines closed, the tradition continued. Today 200,000+ pilgrims descend on a town of 560 people. Over 200 dance groups perform for 7 days.",
    }`,
    dances: `[
      {
        name: "Diablada",
        description: "Dancers in elaborate devil costumes perform acrobatic jumps and spins, representing the battle between good and evil. The Archangel Michael defeats the devils, who submit to the Virgin.",
        music: "Brass bands (bandas de bronces) — tubas, trumpets, trombones — playing morenada and diablada rhythms. The sound echoes across the desert.",
        attire: "Massive devil masks with horns, bulging eyes, and fangs (each hand-carved and painted). Embroidered capes, boots, and breastplates covered in mirrors and sequins. Costumes cost $2,000-5,000 each.",
      },
    ]`,
    music: `["Diablada (brass band rhythm)", "Morenada", "Caporales", "Tinkus (Andean warrior dance music)"]`,
    newsStyle: `{
      headline: "200,000 pilgrims flood tiny La Tirana! Devil dancers battle angels in Chile's most spectacular Andean festival",
      urgency: "happening_now",
    }`,
  },
  noche_san_juan_pr: {
    location: `{
      city: "San Juan & coastal towns",
      region: "All coastal municipalities",
      country: "Puerto Rico",
      coordinates: { lat: 18.4655, lng: -66.1057 },
      famousVenues: ["Condado Beach", "Isla Verde Beach", "Ocean Park", "All beaches island-wide"],
    }`,
    history: `{
      origin: "European midsummer tradition brought by Spanish colonizers, merged with Taíno water purification rituals. The tradition of falling backward into the ocean at midnight combines Catholic baptism symbolism with indigenous cleansing beliefs.",
      whyTheyCelebrate: "Puerto Ricans celebrate because it's a communal cleansing — at midnight on June 23, everyone walks backward into the ocean to wash away bad luck and start fresh. It's about renewal, community, and the island's relationship with the sea.",
      historicalContext: "The Taíno people already had water purification ceremonies. Spanish colonizers brought the San Juan Bautista (St. John the Baptist) celebration. The two merged naturally on an island where the ocean is never far away.",
      yearEstablished: 1508,
      evolution: "Practiced since Spanish colonization (1508). Originally religious — honoring John the Baptist with water. Over centuries, it became secular and fun — beach parties, bonfires, music. The backward-into-the-ocean tradition is uniquely Puerto Rican. Today it's the island's biggest beach party.",
    }`,
    music: `["Noche de San Juan (traditional)", "Plena on the beach", "Reggaetón and salsa at beach parties"]`,
    newsStyle: `{
      headline: "Puerto Rico hits the beaches at midnight! Millions walk backward into the ocean for Noche de San Juan cleansing",
      urgency: "happening_now",
    }`,
  },
  // === FRENCH ===
  fete_nationale: {
    location: `{
      city: "Paris",
      region: "Île-de-France",
      country: "France",
      coordinates: { lat: 48.8566, lng: 2.3522 },
      famousVenues: ["Champs-Élysées (military parade)", "Eiffel Tower (fireworks)", "Place de la Bastille", "Champ de Mars"],
    }`,
    history: `{
      origin: "Commemorates two events: the Storming of the Bastille (July 14, 1789) — when Parisians attacked the royal prison-fortress, symbolizing the fall of tyranny — and the Fête de la Fédération (July 14, 1790) celebrating national unity.",
      whyTheyCelebrate: "The French celebrate because July 14 represents the birth of modern democracy — ordinary people overthrowing absolute monarchy. It's about liberté, égalité, fraternité — the idea that power belongs to the people, not kings.",
      historicalContext: "In 1789, France was bankrupt, the people starving, and King Louis XVI indifferent. The Bastille was a symbol of royal tyranny (it held political prisoners). When it fell, it proved the people could defeat the monarchy. This inspired revolutions worldwide.",
      yearEstablished: 1880,
      evolution: "The Bastille fell in 1789 but July 14 wasn't an official holiday until 1880 (Third Republic). The military parade on the Champs-Élysées started in 1880. The Eiffel Tower fireworks became tradition in the 20th century. Today it's France's biggest celebration — every town has fireworks and a bal des pompiers (firefighters' ball).",
    }`,
    dances: `[
      {
        name: "Bal des Pompiers",
        description: "Firefighters open their stations as dance halls on July 13-14. Everyone dances — waltz, swing, disco, whatever the DJ plays. It's democratic, chaotic, and joyful. The pompiers (firefighters) are France's most trusted institution.",
        music: "Everything — accordion musette, pop, disco, electronic. Each fire station has its own DJ or band.",
        attire: "Casual — this is a people's party. Some firefighters dance in uniform. Revelers wear red-white-blue.",
      },
    ]`,
    music: `["La Marseillaise (national anthem)", "Sous le Ciel de Paris (Edith Piaf)", "Aux Champs-Élysées (Joe Dassin)", "Ça Ira (revolutionary song)"]`,
    newsStyle: `{
      headline: "La France fête le 14 Juillet! Military parade on the Champs-Élysées, Eiffel Tower fireworks tonight",
      urgency: "happening_now",
    }`,
  },
  chandeleur: {
    location: `{
      city: "Nationwide",
      region: "All regions",
      country: "France",
      famousVenues: ["Every French kitchen", "Crêperies of Brittany", "Parisian cafés"],
    }`,
    history: `{
      origin: "Originally a pagan celebration of light returning after winter (Candlemas). The Catholic Church adopted it as the Presentation of Jesus at the Temple (40 days after Christmas). The round, golden crêpe symbolizes the sun and the return of light.",
      whyTheyCelebrate: "The French celebrate because making crêpes together is a ritual of hope — the round golden crêpe represents the sun returning after dark winter. The tradition says: flip a crêpe while holding a coin in your other hand, and you'll have prosperity all year.",
      historicalContext: "Pope Gelasius I (5th century) reportedly gave crêpes to pilgrims arriving in Rome for Candlemas. The tradition spread through France. The superstition about flipping crêpes with a coin dates to medieval times.",
      yearEstablished: 472,
      evolution: "Ancient pagan light festival → Catholic Candlemas → French crêpe tradition. The religious meaning has largely faded; today it's simply 'crêpe day.' Every French family makes crêpes on February 2. Crêperies in Brittany do record business.",
    }`,
    music: `["Traditional Breton music (bombarde and biniou)", "French café accordion music"]`,
    newsStyle: `{
      headline: "C'est la Chandeleur! All of France makes crêpes tonight — flip yours with a coin for good luck all year",
      urgency: "happening_now",
    }`,
  },
  fete_musique: {
    location: `{
      city: "Paris & nationwide",
      region: "All regions + 120 countries worldwide",
      country: "France",
      coordinates: { lat: 48.8566, lng: 2.3522 },
      famousVenues: ["Every street corner in Paris", "Place de la République", "Jardin du Luxembourg", "Montmartre steps"],
    }`,
    history: `{
      origin: "Created in 1982 by French Minister of Culture Jack Lang and composer Maurice Fleuret. The idea: on the summer solstice (longest day), ALL musicians — amateur and professional — play free concerts everywhere. Music belongs to everyone.",
      whyTheyCelebrate: "The French celebrate because la Fête de la Musique democratizes music — you don't need a concert ticket or fancy venue. A teenager with a guitar has the same right to play as a symphony orchestra. Music is a public good, not a commodity.",
      historicalContext: "In 1982, a survey found that 5 million French people played instruments but rarely performed publicly. Jack Lang's vision: 'Faites de la musique!' (Make music!) — a play on words with 'Fête de la Musique' (Music Festival). It worked beyond anyone's expectations.",
      yearEstablished: 1982,
      evolution: "Started in France in 1982 with a few thousand musicians. By 1985, it spread to Europe. Today it's celebrated in 120+ countries on June 21. In Paris alone, 18,000+ concerts happen in one night. Every genre, every corner, every person can participate.",
    }`,
    music: `["Everything — jazz, classical, rock, hip-hop, electronic, world music", "The point is ALL music, not one genre"]`,
    newsStyle: `{
      headline: "Fête de la Musique tonight! 18,000+ free concerts across Paris — every street corner becomes a stage",
      urgency: "happening_now",
    }`,
  },
  noel_francais: {
    location: `{
      city: "Strasbourg & nationwide",
      region: "Alsace (Christmas capital) & all regions",
      country: "France",
      coordinates: { lat: 48.5734, lng: 7.7521 },
      famousVenues: ["Marché de Noël de Strasbourg (oldest in France, since 1570)", "Cathédrale Notre-Dame de Strasbourg", "Galeries Lafayette (Paris)", "Champs-Élysées Christmas lights"],
    }`,
    history: `{
      origin: "French Christmas blends Germanic traditions (Christmas trees from Alsace, 1521), Catholic midnight mass, and the uniquely French réveillon — an elaborate feast eaten AFTER midnight mass on Christmas Eve.",
      whyTheyCelebrate: "The French celebrate because Noël is about gastronomy, family, and tradition. The réveillon dinner (foie gras, oysters, bûche de Noël) is the centerpiece — not gifts. It's a celebration of French culinary art and togetherness.",
      historicalContext: "France was historically Catholic, so Christmas was primarily religious (midnight mass). The Revolution (1789) briefly banned it. Napoleon restored it. The Christmas tree came from Alsace (Germanic tradition) and spread to all of France in the 1800s. Père Noël (Santa) became popular after WWII (American influence).",
      yearEstablished: 1521,
      evolution: "Medieval religious feast → Alsatian Christmas tree tradition (1521) → Réveillon dinner tradition (18th century) → Père Noël added (post-WWII) → Marchés de Noël (Christmas markets) boom (1990s-present). Today French Christmas is defined by food: foie gras, champagne, oysters, and bûche de Noël.",
    }`,
    music: `["Petit Papa Noël (Tino Rossi — France's #1 Christmas song)", "Mon Beau Sapin (O Christmas Tree)", "Douce Nuit (Silent Night)", "Il Est Né le Divin Enfant"]`,
    newsStyle: `{
      headline: "Strasbourg's Marché de Noël opens! France's Christmas capital lights up as réveillon preparations begin nationwide",
      urgency: "this_week",
    }`,
  },
  // === JAPANESE ===
  oshogatsu: {
    location: `{
      city: "Nationwide (especially Tokyo & Kyoto)",
      region: "All prefectures",
      country: "Japan",
      coordinates: { lat: 35.6762, lng: 139.6503 },
      famousVenues: ["Meiji Shrine (Tokyo — 3 million visitors)", "Sensō-ji (Asakusa)", "Fushimi Inari (Kyoto)", "Ise Grand Shrine"],
    }`,
    history: `{
      origin: "Japan's most important holiday — welcoming the Toshigami (Year God) who brings good fortune for the new year. Originally based on the lunar calendar; switched to January 1 during the Meiji era (1873) to align with the Western calendar.",
      whyTheyCelebrate: "Japanese celebrate because Oshōgatsu is about renewal — cleaning the house (ōsōji), settling debts, and starting fresh. The Toshigami visits homes decorated with kadomatsu (pine/bamboo) and shimenawa (sacred rope). It's spiritual housekeeping for the soul.",
      historicalContext: "Shinto belief holds that gods visit the human world at New Year. The elaborate preparations (cleaning, cooking osechi-ryōri, decorating) are all to welcome the Toshigami properly. Buddhist temples ring their bells 108 times (joya no kane) to cleanse 108 human sins.",
      yearEstablished: -500,
      evolution: "Ancient Shinto harvest festival → Imperial court ceremony → Common people's celebration (Edo period) → Westernized date (1873) → Modern 3-day holiday. Today it's Japan's only true vacation — the entire country shuts down Dec 29-Jan 3. Bullet trains are packed with people going home.",
    }`,
    music: `["Joya no Kane (108 temple bells at midnight)", "Haru no Umi (koto New Year music)", "Oshōgatsu (children's New Year song)", "NHK Kōhaku Uta Gassen (New Year's Eve music show)"]`,
    newsStyle: `{
      headline: "明けましておめでとう! Japan welcomes the New Year — 3 million visit Meiji Shrine as temple bells ring 108 times",
      urgency: "happening_now",
    }`,
  },
  obon: {
    location: `{
      city: "Nationwide (especially Kyoto & rural areas)",
      region: "All prefectures",
      country: "Japan",
      coordinates: { lat: 35.0116, lng: 135.7681 },
      famousVenues: ["Gozan no Okuribi (Kyoto — five mountain bonfires)", "Awa Odori (Tokushima)", "Tōrō Nagashi (floating lanterns) at rivers nationwide"],
    }`,
    history: `{
      origin: "Buddhist festival honoring ancestors' spirits who return to the living world for 3 days. Based on the Ullambana Sutra — the story of Buddha's disciple Mokuren who rescued his mother's spirit from the Realm of Hungry Ghosts through offerings and dance.",
      whyTheyCelebrate: "Japanese celebrate because Obon is about gratitude to ancestors — without them, you wouldn't exist. The spirits return home, and families welcome them with food, incense, and dance. It's joyful, not mournful — a reunion with the dead.",
      historicalContext: "Introduced from China in the 7th century. Originally an aristocratic Buddhist ceremony. By the Edo period (1600s), it became a common people's festival with Bon Odori dancing. Today it's Japan's second-largest holiday after New Year — the entire country takes vacation to return to ancestral homes.",
      yearEstablished: 606,
      evolution: "7th century Buddhist import → aristocratic ceremony → common festival with dancing (Edo period) → modern 3-day vacation. The Bon Odori dance was added in the Kamakura period (1185-1333). Tōrō Nagashi (floating lanterns to guide spirits back) became widespread in the Edo period.",
    }`,
    dances: `[
      {
        name: "Bon Odori",
        description: "Community circle dance around a raised platform (yagura). Everyone dances the same simple steps — forward, back, clap, turn. Each region has its own variation. The movements represent welcoming and sending off ancestral spirits.",
        music: "Taiko drums, fue (flute), shamisen, and folk songs specific to each region. The Awa Odori (Tokushima) uses shamisen, kane (bell), and taiko with the chant 'Yatto-sa!'",
        attire: "Yukata (light cotton kimono) in summer patterns — often indigo with white designs. Geta (wooden sandals). Women may wear flowers in their hair. Dancers at Awa Odori wear amigasa (woven hats) that hide their faces.",
      },
    ]`,
    music: `["Tankō Bushi (Coal Miners' Song — most common Bon Odori)", "Awa Yoshikono (Awa Odori theme)", "Sōran Bushi (Hokkaido folk song)", "Tokyo Ondo"]`,
    newsStyle: `{
      headline: "お盆 begins! Spirits return as Kyoto's mountains burn and floating lanterns light rivers across Japan",
      urgency: "happening_now",
    }`,
  },
  hanami: {
    location: `{
      city: "Tokyo, Kyoto, Osaka & nationwide",
      region: "All prefectures (cherry blossoms bloom south to north, March-May)",
      country: "Japan",
      coordinates: { lat: 35.6762, lng: 139.6503 },
      famousVenues: ["Ueno Park (Tokyo)", "Shinjuku Gyoen (Tokyo)", "Philosopher's Path (Kyoto)", "Yoshino Mountain (Nara — 30,000 cherry trees)", "Meguro River (Tokyo)"],
    }`,
    history: `{
      origin: "Hanami (flower viewing) began in the Nara period (710-794) when aristocrats admired plum blossoms (ume). By the Heian period (794-1185), cherry blossoms (sakura) became preferred. The practice spread to commoners in the Edo period (1600s).",
      whyTheyCelebrate: "Japanese celebrate because sakura embodies mono no aware (物の哀れ) — the bittersweet awareness that beautiful things are fleeting. The blossoms last only 1-2 weeks, reminding us to appreciate the present moment. It's philosophy through nature.",
      historicalContext: "In samurai culture, the cherry blossom represented the warrior's life — brilliant but brief. Falling petals symbolized dying young in battle. Today the meaning has softened to appreciation of transience and the beauty of impermanence.",
      yearEstablished: 710,
      evolution: "Aristocratic plum viewing (Nara period) → cherry blossom preference (Heian period) → samurai symbolism (Kamakura/Muromachi) → commoner picnics under trees (Edo period) → modern corporate/friend hanami parties. Today the Japan Meteorological Agency issues a 'cherry blossom forecast' (桜前線) tracking the bloom from south to north.",
    }`,
    music: `["Sakura Sakura (traditional folk song)", "Haru ga Kita (Spring Has Come)", "Hana (Takamura Kōtarō poem set to music)"]`,
    newsStyle: `{
      headline: "桜前線 arrives in Tokyo! Cherry blossoms reach full bloom — millions gather under the trees for hanami",
      urgency: "happening_now",
    }`,
  },
  tanabata: {
    location: `{
      city: "Sendai (largest) & nationwide",
      region: "Miyagi Prefecture (Sendai) & all prefectures",
      country: "Japan",
      coordinates: { lat: 38.2682, lng: 140.8694 },
      famousVenues: ["Sendai Tanabata Festival (3 million visitors)", "Shōtengai (shopping arcades) decorated with streamers", "Hiratsuka Tanabata (Kanagawa)"],
    }`,
    history: `{
      origin: "Based on the Chinese legend of Qixi — the Weaver Princess (Orihime/Vega star) and the Cowherd (Hikoboshi/Altair star) are lovers separated by the Milky Way, allowed to meet only once a year on the 7th day of the 7th month.",
      whyTheyCelebrate: "Japanese celebrate because Tanabata is about wishes and longing. People write wishes on tanzaku (colored paper strips) and hang them on bamboo. The story of star-crossed lovers meeting once a year resonates with the Japanese appreciation of longing (恋しい).",
      historicalContext: "Imported from China during the Nara period (710-794). Originally an aristocratic poetry festival. In the Edo period, it became a commoner's wish-making festival. Sendai's elaborate celebration was started by feudal lord Date Masamune in the 1600s.",
      yearEstablished: 755,
      evolution: "Chinese Qixi import (Nara period) → aristocratic poetry contest → commoner wish-making (Edo period) → Sendai's elaborate festival (1600s) → modern nationwide celebration. Today children write wishes on tanzaku, and cities compete for the most elaborate bamboo decorations.",
    }`,
    music: `["Tanabata-sama (children's song — 'Sasa no ha sara-sara')", "Traditional fue (flute) and taiko at festivals"]`,
    newsStyle: `{
      headline: "七夕 tonight! Write your wish on tanzaku — Sendai's 3-million-visitor Tanabata Festival opens with giant streamers",
      urgency: "happening_now",
    }`,
  },
  // === KOREAN ===
  seollal: {
    location: `{
      city: "Nationwide (family homes)",
      region: "All provinces",
      country: "South Korea",
      coordinates: { lat: 37.5665, lng: 126.9780 },
      famousVenues: ["Korean Folk Village (Yongin)", "Gyeongbokgung Palace (Seoul — traditional games)", "Namsangol Hanok Village (Seoul)", "Every Korean family's home"],
    }`,
    history: `{
      origin: "Korean Lunar New Year — one of the oldest continuously celebrated holidays in East Asia. Rooted in ancient Korean shamanism and ancestor worship, later influenced by Chinese Confucian filial piety traditions.",
      whyTheyCelebrate: "Koreans celebrate because Seollal is about family hierarchy and respect — you perform sebae (deep bow) to elders, who give wisdom and money (세뱃돈). It reinforces the Confucian values that structure Korean society: respect for elders, family duty, and gratitude.",
      historicalContext: "During Japanese occupation (1910-1945), Seollal was suppressed — Koreans were forced to celebrate Japanese New Year (Jan 1) instead. After liberation, Seollal was restored but wasn't an official holiday until 1985. Full 3-day holiday since 1989.",
      yearEstablished: -57,
      evolution: "Ancient Korean shamanic new year ritual → Confucian family ceremony (Joseon dynasty) → suppressed under Japanese occupation → restored 1945 → official holiday 1985 → 3-day holiday 1989. Today it causes the world's largest annual migration — 50 million Koreans travel home in 3 days.",
    }`,
    dances: `[
      {
        name: "Ganggangsullae",
        description: "Women hold hands in a large circle under the full moon, singing and dancing in a chain. The pace starts slow and builds to fast spinning. Originally performed to trick Japanese invaders into thinking there were more soldiers.",
        music: "Call-and-response singing — a leader sings a line, the circle responds 'Ganggangsullae!' The only instrument is voices and clapping.",
        attire: "Hanbok (traditional Korean dress) — women wear jeogori (jacket) and chima (skirt) in bright colors. Hair in traditional binyeo (hairpin) style.",
      },
    ]`,
    music: `["Arirang (Korea's most famous folk song)", "Ganggangsullae (circle dance song)", "Saemaeul Norae (New Village Song)"]`,
    newsStyle: `{
      headline: "새해 복 많이 받으세요! 50 million Koreans head home for Seollal — highways packed as families reunite for sebae",
      urgency: "happening_now",
    }`,
  },
  chuseok: {
    location: `{
      city: "Nationwide (family homes & ancestral graves)",
      region: "All provinces",
      country: "South Korea",
      coordinates: { lat: 37.5665, lng: 126.9780 },
      famousVenues: ["Ancestral burial mounds (nationwide)", "Korean Folk Village (Yongin)", "Gyeongbokgung Palace (Seoul)", "Namsan Tower (full moon viewing)"],
    }`,
    history: `{
      origin: "Korean harvest moon festival — giving thanks for the autumn harvest. Dates back to the Silla Kingdom (57 BC - 935 AD) when King Yuri held a month-long weaving contest between two teams of women, ending with a feast under the full moon.",
      whyTheyCelebrate: "Koreans celebrate because Chuseok is gratitude — thanking ancestors for the harvest and honoring the dead who made your life possible. You visit ancestral graves (seongmyo), clean them, and offer fresh harvest food. It's about remembering where you came from.",
      historicalContext: "Korea was historically agricultural — the autumn harvest determined survival through winter. Chuseok marked the moment of abundance after months of labor. The Confucian ancestor worship (charye ceremony) was added during the Joseon dynasty (1392-1897).",
      yearEstablished: -57,
      evolution: "Silla kingdom harvest festival → Goryeo dynasty moon-viewing → Joseon dynasty Confucian ancestor rites → modern 3-day holiday. Today it's Korea's Thanksgiving — families make songpyeon (rice cakes) together, visit graves, and watch the full moon. Like Seollal, it causes massive national migration.",
    }`,
    dances: `[
      {
        name: "Ganggangsullae",
        description: "Same circle dance as Seollal but performed under the full harvest moon — women dance in a chain, spinning faster and faster as the moon rises higher. UNESCO Intangible Cultural Heritage.",
        music: "Call-and-response singing under the full moon. The rhythm accelerates as the dance progresses.",
        attire: "Hanbok in autumn colors — deep reds, golds, and greens. The full moon illuminates the white jeogori jackets.",
      },
    ]`,
    music: `["Arirang", "Ganggangsullae", "Chuseok folk songs", "Traditional gayageum (zither) music"]`,
    newsStyle: `{
      headline: "추석 begins! Families reunite to make songpyeon and honor ancestors under the harvest moon",
      urgency: "happening_now",
    }`,
  },
  pepero_day: {
    location: `{
      city: "Seoul & nationwide",
      region: "All provinces",
      country: "South Korea",
      coordinates: { lat: 37.5665, lng: 126.9780 },
      famousVenues: ["Convenience stores (GS25, CU, 7-Eleven)", "Schools and offices nationwide", "Myeongdong shopping district"],
    }`,
    history: `{
      origin: "Started in the 1990s among Korean middle school students who exchanged Pepero sticks (thin chocolate-covered biscuits) on 11/11 because the date looks like four Pepero sticks (1111). Lotte (the manufacturer) commercialized it.",
      whyTheyCelebrate: "Koreans celebrate because Pepero Day is about affection — giving Pepero to friends, crushes, and coworkers. It's lighter than Valentine's Day — you can give to anyone without romantic pressure. It's become Korea's version of a fun, low-stakes affection day.",
      historicalContext: "South Korea has a 'day' for every month (Valentine's, White Day, Black Day, Rose Day, etc.). Pepero Day emerged organically from youth culture in the 1990s. Lotte's marketing amplified it, but it started as a genuine grassroots tradition.",
      yearEstablished: 1994,
      evolution: "1990s student tradition → Lotte marketing campaign (1997) → national phenomenon. Today Pepero sales spike 50% in November. People make DIY Pepero with custom decorations. Some criticize it as corporate-manufactured, but it's genuinely beloved by young Koreans.",
    }`,
    music: `["K-pop love songs dominate radio on 11/11", "Pepero Day commercial jingles"]`,
    newsStyle: `{
      headline: "빼빼로데이! Convenience stores overflow with Pepero as Koreans exchange chocolate sticks on 11/11",
      urgency: "happening_now",
    }`,
  },
  // === ITALIAN ===
  ferragosto: {
    location: `{
      city: "Nationwide (especially beaches and mountains)",
      region: "All regions",
      country: "Italy",
      coordinates: { lat: 41.9028, lng: 12.4964 },
      famousVenues: ["Every beach in Italy", "Sardinia and Sicily coasts", "Dolomites mountain resorts", "Lake Como and Lake Garda"],
    }`,
    history: `{
      origin: "Established by Emperor Augustus in 18 BC as 'Feriae Augusti' (Augustus's Rest) — a day of rest after the harvest. Workers and even animals got a holiday. The Catholic Church later adopted it as the Assumption of Mary (Aug 15).",
      whyTheyCelebrate: "Italians celebrate because Ferragosto is sacred leisure — the entire country stops working and goes to the beach or mountains. It's about dolce far niente (the sweetness of doing nothing). Working on Ferragosto is considered almost immoral.",
      historicalContext: "Augustus created the holiday to celebrate the end of harvest and give workers rest. Mussolini revived it in the 1920s with 'Treni Popolari' (People's Trains) — cheap trains so even poor Italians could reach the sea. This democratized beach culture.",
      yearEstablished: -18,
      evolution: "18 BC Roman harvest rest → Catholic Assumption of Mary → Mussolini's People's Trains (1920s) → modern August exodus. Today Italian cities are EMPTY in August — everyone is at the beach. Restaurants close, offices shut. 'Chiuso per ferie' (Closed for vacation) signs everywhere.",
    }`,
    music: `["Sapore di Sale (Gino Paoli — taste of salt/summer)", "Volare (Domenico Modugno)", "Estate (Bruno Martino)", "Azzurro (Adriano Celentano)"]`,
    newsStyle: `{
      headline: "Buon Ferragosto! Italy empties as 30 million head to beaches — cities become ghost towns for August exodus",
      urgency: "happening_now",
    }`,
  },
  carnevale_venezia: {
    location: `{
      city: "Venice",
      region: "Veneto",
      country: "Italy",
      coordinates: { lat: 45.4408, lng: 12.3155 },
      famousVenues: ["Piazza San Marco", "Grand Canal", "Teatro La Fenice", "Caffè Florian (oldest café in Italy)"],
    }`,
    history: `{
      origin: "Venetian Carnival dates to 1162, celebrating Venice's military victory over Aquileia. Masks became central because they erased social class — a nobleman and a servant were equal behind masks. This anonymity enabled forbidden pleasures.",
      whyTheyCelebrate: "Venetians celebrate because Carnival represents Venice's golden age — when the Republic was the richest, most powerful, and most decadent city in Europe. The masks symbolize freedom from identity, social rules, and consequences.",
      historicalContext: "At its peak (1700s), Venetian Carnival lasted 6 months — masks were worn from October to Lent. Napoleon banned it in 1797 when he conquered Venice. It was revived only in 1979 by the Italian government to boost tourism.",
      yearEstablished: 1162,
      evolution: "1162 victory celebration → 6-month masked festival (1700s) → banned by Napoleon (1797) → revived 1979. Today it's a 2-week event drawing 3 million visitors. The masks are now art objects costing €100-10,000. The 'Flight of the Angel' (zip-line from St. Mark's bell tower) opens the festival.",
    }`,
    dances: `[
      {
        name: "Minuetto",
        description: "Elegant 18th-century court dance performed in full Carnival costume — slow, graceful steps with deep bows and curtsies. Partners barely touch fingertips. It's about poise, not passion.",
        music: "Baroque chamber music — harpsichord, violin, cello. Vivaldi (who was Venetian) is the soundtrack of Carnival.",
        attire: "Full 18th-century Venetian costume: tricorn hat, bauta mask (white with protruding chin), black tabarro (cloak), and elaborate gowns for women. The bauta mask allows eating and drinking without removal.",
      },
    ]`,
    music: `["Vivaldi - Four Seasons (Spring)", "Baroque chamber music", "Gondolier songs", "O Sole Mio (Neapolitan but associated with Italian celebration)"]`,
    newsStyle: `{
      headline: "Il Carnevale di Venezia begins! Masked revelers fill Piazza San Marco as the Angel flies from the bell tower",
      urgency: "happening_now",
    }`,
  },
  natale_italiano: {
    location: `{
      city: "Nationwide (especially Naples, Rome, Milan)",
      region: "All regions",
      country: "Italy",
      coordinates: { lat: 40.8518, lng: 14.2681 },
      famousVenues: ["Via San Gregorio Armeno (Naples — presepe artisan street)", "St. Peter's Square (Vatican nativity)", "Piazza Navona Christmas market (Rome)", "Duomo di Milano Christmas tree"],
    }`,
    history: `{
      origin: "Italian Christmas centers on the presepe (nativity scene) — invented by St. Francis of Assisi in 1223 in Greccio, Italy. He created the first live nativity to make the Christmas story accessible to illiterate people.",
      whyTheyCelebrate: "Italians celebrate because Natale is about family, food, and the presepe tradition. The Feast of the Seven Fishes (Vigilia) on Christmas Eve is sacred — no meat, only seafood, in 7+ courses. It's a marathon of eating that brings families together.",
      historicalContext: "Italy is the heart of Catholicism (the Vatican is in Rome). Christmas traditions here influenced the entire Christian world. The presepe tradition spread from Italy to Spain, Latin America, and beyond. Naples became the world capital of presepe artistry in the 1700s.",
      yearEstablished: 1223,
      evolution: "St. Francis's live nativity (1223) → Neapolitan presepe artistry (1700s) → Feast of Seven Fishes tradition → modern Italian Christmas. Today Via San Gregorio Armeno in Naples sells handmade presepe figures year-round, including satirical figures of politicians and celebrities.",
    }`,
    music: `["Tu Scendi dalle Stelle (most famous Italian Christmas carol)", "Astro del Ciel (Silent Night in Italian)", "Adeste Fideles", "Zampogna (bagpipe) music from southern Italy"]`,
    newsStyle: `{
      headline: "Buon Natale! Naples lights up Via San Gregorio Armeno as families prepare the Feast of Seven Fishes tonight",
      urgency: "happening_now",
    }`,
  },
  // === GERMAN ===
  weihnachten: {
    location: `{
      city: "Nuremberg, Dresden, Munich & nationwide",
      region: "All Bundesländer",
      country: "Germany",
      coordinates: { lat: 49.4521, lng: 11.0767 },
      famousVenues: ["Christkindlesmarkt Nuremberg (most famous)", "Striezelmarkt Dresden (oldest, since 1434)", "Marienplatz Munich", "Cologne Cathedral Christmas Market"],
    }`,
    history: `{
      origin: "German Christmas traditions shaped the entire Western world: the Christmas tree (Tannenbaum, documented 1419 in Freiburg), Advent calendars (1851), Christmas markets (1434 in Dresden), and even Santa Claus (via German immigrants to America).",
      whyTheyCelebrate: "Germans celebrate because Weihnachten is about Gemütlichkeit (cozy togetherness) — candles on the tree, Glühwein at the market, family gathered around the Adventskranz (Advent wreath). It's warmth against the dark, cold winter.",
      historicalContext: "Martin Luther (1483-1546) is credited with adding candles to Christmas trees (inspired by stars through pine branches). German immigrants brought the tradition to America and Britain (via Prince Albert, who was German). The modern Christmas is essentially a German invention.",
      yearEstablished: 1419,
      evolution: "Pagan winter solstice → Christian Weihnachten → Christmas tree tradition (1419) → Luther adds candles (1500s) → Christmas markets formalize (1600s) → Advent calendar invented (1851) → German traditions exported worldwide via immigration and British royalty.",
    }`,
    dances: `[
      {
        name: "Schuhplattler",
        description: "Bavarian folk dance where men slap their thighs, knees, and shoe soles in complex rhythmic patterns while stamping and leaping. Originally a courtship display — the louder and more athletic, the more impressive to women watching.",
        music: "Ländler music — accordion (Steirische Harmonika), zither, and brass band. 3/4 time, moderate tempo.",
        attire: "Men: Lederhosen (leather shorts), knee socks, suspenders, and felt hat with feather. Women: Dirndl (bodice dress with apron and blouse).",
      },
    ]`,
    music: `["O Tannenbaum (O Christmas Tree)", "Stille Nacht (Silent Night — composed in Austria)", "Leise Rieselt der Schnee", "Kling Glöckchen (Jingle Bells equivalent)"]`,
    newsStyle: `{
      headline: "Frohe Weihnachten! Germany's 2,500+ Christmas markets open — Nuremberg's Christkindlesmarkt draws millions",
      urgency: "this_week",
    }`,
  },
  karneval: {
    location: `{
      city: "Cologne, Düsseldorf, Mainz",
      region: "Rhineland (Nordrhein-Westfalen, Rheinland-Pfalz)",
      country: "Germany",
      coordinates: { lat: 50.9375, lng: 6.9603 },
      famousVenues: ["Cologne Cathedral square", "Zülpicher Straße (Cologne party street)", "Alter Markt (Cologne)", "Königsallee (Düsseldorf)"],
    }`,
    history: `{
      origin: "Rhineland Carnival (Karneval/Fasching) dates to the Middle Ages as a pre-Lent celebration. The modern organized form started in 1823 when Cologne created the first Carnival committee to structure the chaos into parades and sessions.",
      whyTheyCelebrate: "Rhinelanders celebrate because Karneval is organized rebellion — for 6 days, normal rules don't apply. You kiss strangers (Bützchen), mock politicians, and the 'Dreigestirn' (Prince, Peasant, Maiden — all played by men) rule the city. It's democracy through satire.",
      historicalContext: "Under French occupation (Napoleon), Carnival was banned. When Prussia took over the Rhineland (1815), locals used Carnival to mock their new Prussian rulers. Political satire became central — floats still mock politicians today. During Nazi rule, some Carnival societies resisted through coded humor.",
      yearEstablished: 1823,
      evolution: "Medieval pre-Lent chaos → organized committees (1823) → political satire tradition → Nazi-era resistance → modern 6-day festival. Today Cologne's Rosenmontagszug (Rose Monday parade) is 7km long with 1 million+ spectators. 'Kölle Alaaf!' is the battle cry.",
    }`,
    dances: `[
      {
        name: "Funkenmariechen",
        description: "Athletic solo dance performed by young women in military-style uniforms — high kicks, splits, acrobatics, and precision choreography. Originated as a parody of Prussian military drills.",
        music: "March music played by Carnival brass bands (Spielmannszüge). Fast tempo, military-style drums.",
        attire: "Military-inspired costume: short skirt, jacket with epaulettes, tricorn hat, white boots. The uniform parodies Prussian soldiers — originally a political joke.",
      },
    ]`,
    music: `["Viva Colonia (most famous Karneval song)", "Kölle Alaaf", "Am Dom zo Kölle (At Cologne Cathedral)", "Kölsche Jung (Cologne Boy)"]`,
    newsStyle: `{
      headline: "Kölle Alaaf! Cologne's Karneval begins — 1 million line the streets for Rosenmontag as political floats mock world leaders",
      urgency: "happening_now",
    }`,
  },
  // === PORTUGUESE/BRAZILIAN ===
  carnaval_brasil: {
    location: `{
      city: "Rio de Janeiro & Salvador",
      region: "Rio de Janeiro & Bahia",
      country: "Brazil",
      coordinates: { lat: -22.9068, lng: -43.1729 },
      famousVenues: ["Sambódromo (Rio — 72,000 capacity)", "Pelourinho (Salvador)", "Copacabana Beach blocos", "Marquês de Sapucaí"],
    }`,
    history: `{
      origin: "Portuguese colonizers brought European Carnival (Entrudo — water-throwing festival). Enslaved Africans added samba rhythms, capoeira movements, and Candomblé spirituality. The modern samba school parade format was created in 1928 by Deixa Falar, the first escola de samba.",
      whyTheyCelebrate: "Brazilians celebrate because Carnival is the great equalizer — for 5 days, the favela and the mansion dance together. Social class dissolves in samba. It's also catharsis — a year of struggle released in pure joy. 'O povo na rua' (the people in the street).",
      historicalContext: "Brazil was the last country in the Americas to abolish slavery (1888). Carnival became the space where Afro-Brazilian culture could be publicly celebrated. Samba was born in the homes of freed slaves in Rio's Praça Onze neighborhood. The government initially tried to suppress it.",
      yearEstablished: 1723,
      evolution: "Portuguese Entrudo (1700s) → African rhythms added → first samba school (1928) → Sambódromo built (1984) → modern mega-spectacle. Today Rio's parade is a $1 billion industry with 70,000+ performers. Salvador's street Carnival is the world's largest — 2 million people per day.",
    }`,
    dances: `[
      {
        name: "Samba no Pé",
        description: "Fast footwork — weight shifts rapidly between feet while hips swing in figure-8s. The upper body stays relatively still while feet blur. In the Sambódromo, passistas (lead dancers) perform at incredible speed in 4-inch heels.",
        music: "Bateria (percussion section) of 200-400 drummers playing surdos, tamborims, repiniques, agogôs, and cuícas. The rhythm is 2/4 time at 130+ BPM.",
        attire: "Sambódromo: elaborate fantasy costumes with feathers, sequins, and crystals (some weigh 30kg). Street blocos: anything goes — costumes, drag, body paint, or just shorts and a tank top.",
      },
    ]`,
    music: `["Aquarela do Brasil (Ary Barroso)", "Mas Que Nada (Jorge Ben Jor)", "Garota de Ipanema (Tom Jobim)", "Cidade Maravilhosa (Rio's anthem)"]`,
    newsStyle: `{
      headline: "O Carnaval chegou! Rio's Sambódromo erupts as 70,000 dancers compete — Salvador's streets fill with 2 million revelers",
      urgency: "happening_now",
    }`,
  },
  // === MANDARIN/CHINESE ===
  chunjie: {
    location: `{
      city: "Beijing, Shanghai & nationwide",
      region: "All provinces",
      country: "China",
      coordinates: { lat: 39.9042, lng: 116.4074 },
      famousVenues: ["Temple of Heaven (Beijing)", "Yu Garden (Shanghai)", "Chinatowns worldwide", "CCTV Spring Festival Gala (800 million viewers)"],
    }`,
    history: `{
      origin: "Legend says a monster called Nián (年) attacked villages every New Year's Eve. People discovered it feared red color, loud noises, and fire — hence red decorations, firecrackers, and lanterns. The word for 'year' (年) comes from the monster's name.",
      whyTheyCelebrate: "Chinese celebrate because Spring Festival is about family reunion (团圆 tuányuán) — the most important value in Chinese culture. No matter how far you've traveled, you go HOME for New Year's Eve dinner. It's the world's largest annual human migration (3 billion trips).",
      historicalContext: "Spring Festival has been celebrated for 4,000+ years. It marks the end of winter and the beginning of spring planting. The lunar calendar means the date shifts each year (Jan 21 - Feb 20). The Communist government briefly tried to replace it with January 1 but failed completely.",
      yearEstablished: -2000,
      evolution: "Ancient agricultural festival → Imperial court ceremony → folk traditions solidified (Tang/Song dynasties) → Communist attempts to suppress (1960s-70s) → fully restored → modern celebration with CCTV Gala (since 1983). Today the Spring Festival travel rush (春运 chūnyùn) moves 3 billion people in 40 days.",
    }`,
    dances: `[
      {
        name: "Lion Dance (舞狮 wǔshī)",
        description: "Two dancers inside a lion costume perform acrobatic movements — leaping onto poles, 'eating' lettuce (cǎi qīng), and blinking the lion's eyes. The lion chases away evil spirits and brings good luck to businesses.",
        music: "Loud drums, cymbals, and gongs. The rhythm guides the lion's movements — fast drumming = energetic jumping, slow = the lion 'sleeps.'",
        attire: "Elaborate lion head (papier-mâché, fur, mirrors) in red/gold. The body is a long cloth covering two dancers. Southern style (Cantonese) is more acrobatic; Northern style is more realistic.",
      },
    ]`,
    music: `["Gong Xi Gong Xi (恭喜恭喜 — most famous New Year song)", "Xin Nian Hao (新年好 — Happy New Year)", "Chun Jie Xu Qu (Spring Festival Overture — orchestral)", "CCTV Gala theme music"]`,
    newsStyle: `{
      headline: "春节快乐! 3 billion trips begin as China's Spring Festival travel rush launches — fireworks light up Beijing tonight",
      urgency: "happening_now",
    }`,
  },
  zhongqiujie: {
    location: `{
      city: "Nationwide (especially Beijing, Suzhou, Hangzhou)",
      region: "All provinces",
      country: "China",
      coordinates: { lat: 39.9042, lng: 116.4074 },
      famousVenues: ["West Lake (Hangzhou — moon reflection)", "Summer Palace (Beijing)", "Victoria Harbour (Hong Kong — lanterns)", "Suzhou classical gardens"],
    }`,
    history: `{
      origin: "Legend of Chang'e (嫦娥) — a woman who drank an immortality elixir and floated to the moon, where she lives forever with a jade rabbit. Her husband Hou Yi gazes at the moon every Mid-Autumn, and she gazes back. Mooncakes represent their eternal separation.",
      whyTheyCelebrate: "Chinese celebrate because the full moon symbolizes family reunion (团圆). The round mooncake represents completeness — a whole family together. If you can't be with family, you look at the same moon and feel connected across distance.",
      historicalContext: "Mid-Autumn Festival dates to the Tang Dynasty (618-907) when moon worship became popular. Legend says mooncakes were used to hide secret messages during the Yuan Dynasty (1271-1368) to coordinate a rebellion against Mongol rulers — the revolution was planned inside mooncakes.",
      yearEstablished: 618,
      evolution: "Tang Dynasty moon worship → Song Dynasty mooncake tradition → Yuan Dynasty rebellion legend → Ming/Qing family festival → modern celebration. Today mooncakes are a $3 billion industry. Luxury mooncake gift boxes (with gold, truffles, or ice cream) are status symbols.",
    }`,
    music: `["Dan Yuan Ren Chang Jiu (但愿人长久 — Su Shi poem set to music by Teresa Teng)", "Yue Liang Dai Biao Wo De Xin (月亮代表我的心 — Teresa Teng)", "Ming Yue Ji Shi You (明月几时有)"]`,
    newsStyle: `{
      headline: "中秋节快乐! Full moon rises over China — families gather for mooncakes and lanterns as Chang'e watches from above",
      urgency: "happening_now",
    }`,
  },
  duanwujie: {
    location: `{
      city: "Nationwide (especially Hubei, Hunan, Guangdong)",
      region: "All provinces (strongest in southern China)",
      country: "China",
      coordinates: { lat: 30.5928, lng: 114.3055 },
      famousVenues: ["East Lake (Wuhan — dragon boat races)", "Victoria Harbour (Hong Kong — international races)", "Miluo River (Hunan — where Qu Yuan drowned)", "Pearl River (Guangzhou)"],
    }`,
    history: `{
      origin: "Commemorates the death of Qu Yuan (屈原), a patriotic poet and minister of the Chu Kingdom (340-278 BC). When his kingdom fell to enemies, he drowned himself in the Miluo River in despair. Villagers raced boats to save him and threw rice into the water to keep fish from eating his body.",
      whyTheyCelebrate: "Chinese celebrate because Qu Yuan represents loyalty, patriotism, and integrity — he chose death over serving a corrupt government. Dragon boat racing honors the villagers' desperate attempt to save him. Zongzi (rice dumplings) represent the rice thrown to protect his body.",
      historicalContext: "Qu Yuan was a minister who warned his king about enemy threats but was exiled by corrupt officials. When his predictions came true and the kingdom fell, he drowned himself. His story resonates with Chinese values of loyalty to country and speaking truth to power.",
      yearEstablished: -278,
      evolution: "278 BC memorial for Qu Yuan → regional festival → national holiday → UNESCO Intangible Cultural Heritage (2009). Dragon boat racing spread worldwide — now an international sport with competitions in 85+ countries. Zongzi-making is a family tradition passed through generations.",
    }`,
    dances: `[
      {
        name: "Dragon Boat Racing (赛龙舟)",
        description: "Teams of 20+ paddlers race long, narrow boats decorated as dragons. A drummer at the front sets the rhythm, a steerer at the back controls direction. Paddlers stroke in perfect unison — the boat flies across the water.",
        music: "Massive drum at the bow — BOOM-BOOM-BOOM sets the paddle rhythm. Crowd cheers and gongs from shore. The faster the drum, the faster the paddlers stroke.",
        attire: "Matching team jerseys and life vests. The dragon boat itself is the 'costume' — carved dragon head at bow, tail at stern, painted scales along the hull.",
      },
    ]`,
    music: `["Dragon boat drumming (ritual rhythm)", "Qu Yuan ci (poems of Qu Yuan chanted)", "Li Sao (Encountering Sorrow — Qu Yuan's masterwork, sometimes sung)"]`,
    newsStyle: `{
      headline: "端午节快乐! Dragon boats race across China as families wrap zongzi to honor poet Qu Yuan's sacrifice",
      urgency: "happening_now",
    }`,
  },
};

// Inject expansions into the file
let injected = 0;
for (const [id, fields] of Object.entries(expansions)) {
  const regex = new RegExp(`(id: "${id}"[\\s\\S]*?durationDays: \\d+,)\\n(\\s*\\},)`, 'm');
  const match = content.match(regex);
  if (match) {
    let injection = '';
    if (fields.location) injection += `\n    location: ${fields.location},`;
    if (fields.history) injection += `\n    history: ${fields.history},`;
    if (fields.dances) injection += `\n    dances: ${fields.dances},`;
    if (fields.music) injection += `\n    music: ${fields.music},`;
    if (fields.newsStyle) injection += `\n    newsStyle: ${fields.newsStyle},`;
    
    content = content.replace(regex, `$1${injection}\n$2`);
    injected++;
    console.log(`✅ Expanded: ${id}`);
  } else {
    console.log(`⚠️  Not found: ${id}`);
  }
}

fs.writeFileSync(filePath, content);
console.log(`\n✅ Done! Expanded ${injected} holidays with location, history, dances, music, and newsStyle.`);
