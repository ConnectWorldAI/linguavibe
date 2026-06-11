/**
 * Expand all cultural calendar holidays with location, history, dances, music, and newsStyle fields.
 * This script reads the cultural-calendar.ts file and injects the new fields into each holiday.
 */
import fs from 'fs';

const filePath = '/home/ubuntu/linguavibe/lib/cultural-calendar.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Map of holiday ID → expanded fields
const expansions = {
  dia_de_reyes: {
    location: `{
      city: "Mexico City",
      region: "Ciudad de México",
      country: "Mexico",
      famousVenues: ["Zócalo (giant Rosca de Reyes)", "Alameda Central", "Coyoacán markets"],
    }`,
    history: `{
      origin: "Biblical tradition of the Three Wise Men (Melchior, Gaspar, Balthasar) who brought gifts to baby Jesus. Brought to the Americas by Spanish colonizers in the 1500s.",
      whyTheyCelebrate: "For Latin Americans, this is the REAL gift-giving day — not December 25. Children write letters to the Reyes Magos asking for toys. It's about family, magic, and the joy of childhood.",
      historicalContext: "In Spain and Latin America, the Three Kings were always more important than Santa Claus. The tradition survived colonization because it aligned with Catholic doctrine. Santa Claus is a recent American import.",
      yearEstablished: 1500,
      evolution: "Originally a purely religious observance. Over centuries, it became the primary gift-giving holiday for children. The Rosca de Reyes cake tradition (finding the baby Jesus figurine) was added in medieval Spain. Today, some families celebrate both Dec 25 AND Jan 6.",
    }`,
    music: `["Los Reyes Magos (villancico)", "Noche de Paz", "Los Peces en el Río"]`,
    newsStyle: `{
      headline: "¡Los Reyes Magos llegan esta noche! Children across Latin America leave shoes out with hay and water",
      urgency: "this_week",
    }`,
  },
  semana_santa: {
    location: `{
      city: "Seville & Antigua Guatemala",
      region: "Andalucía, Spain & Sacatepéquez, Guatemala",
      country: "Spain & Guatemala",
      coordinates: { lat: 37.3891, lng: -5.9845 },
      famousVenues: ["La Macarena basilica (Seville)", "La Giralda route", "Antigua Guatemala cobblestone streets", "Iglesia de La Merced"],
    }`,
    history: `{
      origin: "Christian commemoration of Jesus Christ's final week — from Palm Sunday entry into Jerusalem through crucifixion (Good Friday) to resurrection (Easter Sunday). Brought to the Americas by Spanish missionaries.",
      whyTheyCelebrate: "For the Spanish-speaking world, Semana Santa is not just religious — it's cultural identity. Entire communities come together. The processions represent centuries of tradition, artistry, and devotion passed down through families.",
      historicalContext: "Spain's Semana Santa traditions date to the 16th century when Catholic brotherhoods (cofradías) began organizing processions. In Latin America, indigenous traditions blended with Catholic rituals — Guatemalan alfombras (sawdust carpets) have Mayan roots.",
      yearEstablished: 1500,
      evolution: "Started as simple church services. By the 1600s, elaborate floats (pasos) were carved. Today, Seville's Semana Santa is a UNESCO event with 60+ brotherhoods, 50,000+ participants, and 1 million+ spectators. Guatemala's alfombras are now world-famous art.",
    }`,
    dances: `[
      {
        name: "Saeta",
        description: "Not a dance but a deeply emotional flamenco song sung from balconies as processions pass below — the singer cries out to the Virgin or Christ on the float",
        music: "A cappella flamenco vocals, sometimes with a single guitar. The crowd falls silent. The procession stops.",
        attire: "The singer wears everyday clothes — it's spontaneous, raw, from the heart. Nazarenos below wear pointed hoods and robes.",
      },
    ]`,
    music: `["Saetas (flamenco religious songs)", "Marcha Real (processional march)", "Amarguras (most famous Semana Santa march)"]`,
    newsStyle: `{
      headline: "Semana Santa processions fill streets across Spain and Latin America — millions gather for Holy Week",
      urgency: "happening_now",
    }`,
  },
  carnaval_dominicano: {
    location: `{
      city: "La Vega & Santo Domingo",
      region: "La Vega Province & Distrito Nacional",
      country: "Dominican Republic",
      coordinates: { lat: 19.2244, lng: -70.5296 },
      famousVenues: ["Calle Real de La Vega (main parade route)", "Malecón de Santo Domingo", "Santiago de los Caballeros parade grounds"],
    }`,
    history: `{
      origin: "Blends three cultures: Spanish colonizers brought Carnival from Europe (pre-Lent celebration), enslaved Africans added drumming and masks, and Taíno indigenous people contributed nature spirits and body paint.",
      whyTheyCelebrate: "Dominicans celebrate because Carnival IS Dominican identity — it's rebellion, freedom, joy, and community. The Diablos Cojuelos represent fighting back against oppression. It culminates on Independence Day (Feb 27) because freedom and celebration are inseparable.",
      historicalContext: "During colonial times, enslaved Africans were given brief freedom during Carnival — they used it to mock their masters with masks and costumes. After independence in 1844, Carnival became a national symbol of Dominican freedom and cultural pride.",
      yearEstablished: 1520,
      evolution: "Started as a Spanish colonial tradition in the 1500s. Enslaved Africans transformed it with masks and drums. After independence (1844), it became patriotic. La Vega's Diablos Cojuelos became iconic in the 1900s. Today it's a month-long national celebration with each town having unique characters.",
    }`,
    dances: `[
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
    ]`,
    music: `["Vengan a Ver (Carnival anthem)", "El Merengue de Calle (street merengue)", "Compadre Pedro Juan (traditional)", "Wilfrido Vargas - El Africano"]`,
    newsStyle: `{
      headline: "¡Carnaval Dominicano explodes in La Vega! Diablos Cojuelos take over the streets with vejigas and merengue",
      urgency: "happening_now",
    }`,
  },
  fiestas_patrias_mx: {
    location: `{
      city: "Mexico City",
      region: "Ciudad de México",
      country: "Mexico",
      coordinates: { lat: 19.4326, lng: -99.1332 },
      famousVenues: ["Zócalo (main square — El Grito happens here)", "Palacio Nacional balcony", "Ángel de la Independencia monument", "Dolores Hidalgo (where the original Grito happened in 1810)"],
    }`,
    history: `{
      origin: "On September 16, 1810, Father Miguel Hidalgo rang the church bell in Dolores, Guanajuato and called the people to revolt against Spanish colonial rule. This 'Grito de Dolores' sparked the Mexican War of Independence.",
      whyTheyCelebrate: "Mexicans celebrate because this is the moment their nation was born — when an ordinary priest dared to say 'enough' to 300 years of Spanish oppression. It represents courage, unity, and Mexican identity.",
      historicalContext: "Spain had ruled Mexico (New Spain) for 300 years. Criollos (Spanish-descended Mexicans) were denied power. Hidalgo's revolt united indigenous, mestizo, and criollo Mexicans against the Spanish crown. Independence was finally won in 1821.",
      yearEstablished: 1810,
      evolution: "Originally just a remembrance of Hidalgo's call. President Porfirio Díaz moved the celebration to Sept 15 (his birthday) in the 1900s. Today, the President re-enacts El Grito from the National Palace balcony at 11pm on Sept 15, ringing Hidalgo's actual bell. The whole country watches on TV.",
    }`,
    dances: `[
      {
        name: "Jarabe Tapatío",
        description: "The 'Mexican Hat Dance' — man courts woman with fancy footwork around a sombrero on the ground, she teases and retreats, finally accepts and they dance together",
        music: "Mariachi orchestra with violins, trumpets, guitarrón, and vihuela playing the iconic Jarabe melody",
        attire: "Man wears full charro suit (tight embroidered pants, short jacket, wide sombrero). Woman wears china poblana dress (sequined skirt, embroidered blouse, rebozo shawl)",
      },
    ]`,
    music: `["Cielito Lindo", "El Son de la Negra", "México Lindo y Querido", "Huapango de Moncayo", "Las Mañanitas"]`,
    newsStyle: `{
      headline: "¡VIVA MÉXICO! President leads El Grito from the Zócalo — 100,000+ gather for Independence celebrations",
      urgency: "happening_now",
    }`,
  },
  carnaval_barranquilla: {
    location: `{
      city: "Barranquilla",
      region: "Atlántico",
      country: "Colombia",
      coordinates: { lat: 10.9685, lng: -74.7813 },
      famousVenues: ["Vía 40 (main parade route)", "Calle 17 (Batalla de Flores)", "Plaza de la Paz", "Estadio Romelio Martínez"],
    }`,
    history: `{
      origin: "Blends Indigenous Mocaná rituals, African drumming brought by enslaved people, and European Carnival traditions from Spanish colonizers. The three cultures merged on the Caribbean coast to create something entirely new.",
      whyTheyCelebrate: "Barranquilleros celebrate because Carnival IS their identity — it's 4 days where social class disappears, everyone dances together, and the city becomes one giant family. 'Quien lo vive es quien lo goza' (You have to live it to enjoy it).",
      historicalContext: "The Caribbean coast of Colombia was where African, Indigenous, and Spanish cultures mixed most freely. Unlike highland Bogotá, the coast was less rigid about racial hierarchies. Carnival became the expression of this cultural freedom.",
      yearEstablished: 1888,
      evolution: "Started as informal street celebrations in the 1800s. Formalized in 1888 with the first Batalla de Flores. UNESCO declared it a Masterpiece of Oral and Intangible Heritage in 2003. Today it's the second-largest carnival in the world (after Rio) with 1.5 million+ participants.",
    }`,
    dances: `[
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
    ]`,
    music: `["La Pollera Colorá (Joe Arroyo)", "Se Va el Caimán (traditional)", "Te Olvidé (Carlos Vives)", "La Tierra del Olvido (Carlos Vives)"]`,
    newsStyle: `{
      headline: "¡Quien lo vive es quien lo goza! Carnival of Barranquilla explodes with cumbia, mapalé, and 1.5 million revelers!",
      urgency: "happening_now",
    }`,
  },
  diablos_danzantes: {
    location: `{
      city: "San Francisco de Yare",
      region: "Miranda",
      country: "Venezuela",
      coordinates: { lat: 10.2333, lng: -66.7333 },
      famousVenues: ["Iglesia de San Francisco de Yare", "Streets of Yare", "Chuao (cacao town)", "Naiguatá coastal town"],
    }`,
    history: `{
      origin: "Brought by enslaved Africans who merged their spiritual beliefs with Catholic Corpus Christi. The 'devils' represent evil submitting to the Holy Sacrament — they dance and then kneel before the church.",
      whyTheyCelebrate: "Venezuelans celebrate because it represents the triumph of good over evil, community over individualism. The dancers make a sacred promise (promesa) — often for healing a sick child or giving thanks. Breaking the promise brings bad luck.",
      historicalContext: "During colonial times, enslaved Africans were forced to participate in Catholic festivals. They subverted the tradition by wearing devil masks — appearing to submit to the Church while secretly honoring their own spirits. UNESCO Intangible Cultural Heritage since 2012.",
      yearEstablished: 1749,
      evolution: "First documented in 1749 in Yare. Originally just men danced; now women participate too. Each town has unique mask styles — Yare's are red with horns, Naiguatá's are colorful and elaborate. The tradition nearly died in the 1970s but was revived by cultural activists.",
    }`,
    dances: `[
      {
        name: "Danza de los Diablos",
        description: "Dancers in devil masks and red costumes dance aggressively through streets, shaking maracas and cracking whips. They approach the church, dance faster and faster, then suddenly fall to their knees in submission before the Holy Sacrament.",
        music: "Caja drum (single-headed), maracas, and the crack of leather whips. The rhythm accelerates as dancers approach the church.",
        attire: "Red pants and shirt, elaborate papier-mâché devil mask with horns (each unique), a cross worn OVER the costume (showing the devil submits to God), tail, and leather whip.",
      },
    ]`,
    music: `["Canto de los Diablos (ritual chant)", "Golpe de tambor (drum rhythm)", "Fulía (call-and-response song)"]`,
    newsStyle: `{
      headline: "Dancing Devils of Yare take over the streets! Venezuela's UNESCO-protected Corpus Christi tradition continues",
      urgency: "this_week",
    }`,
  },
  santiago_carnival_cuba: {
    location: `{
      city: "Santiago de Cuba",
      region: "Santiago de Cuba Province",
      country: "Cuba",
      coordinates: { lat: 20.0247, lng: -75.8219 },
      famousVenues: ["Calle Heredia", "Paseo de Martí (Trocha)", "Plaza de Marte", "Casa de la Trova"],
    }`,
    history: `{
      origin: "Born from the fusion of Spanish colonial festivals, African Yoruba celebrations, and French-Haitian traditions brought by refugees fleeing the Haitian Revolution (1791-1804). Santiago's unique mix of cultures created Cuba's most African carnival.",
      whyTheyCelebrate: "Santiagueros celebrate because Carnival is resistance — during slavery, it was the only time Africans could publicly drum, dance, and honor their orishas. Today it's about Cuban identity, joy despite hardship, and community.",
      historicalContext: "Santiago received thousands of French-Haitian refugees in the early 1800s, adding tumba francesa traditions. After the Revolution (1959), Castro initially tried to control Carnival but it proved impossible — the people wouldn't give it up.",
      yearEstablished: 1679,
      evolution: "Documented since 1679. Originally tied to patron saint days (Santiago Apóstol, July 25). French-Haitian refugees added comparsas in the 1800s. After 1959, the government formalized it but couldn't tame its African spirit. Today it's Cuba's biggest party — 500,000+ people over 10 days.",
    }`,
    dances: `[
      {
        name: "Conga",
        description: "A massive line of dancers snakes through the streets — everyone joins in. One foot forward, drag the other, hips swing side to side. The line grows as it passes through neighborhoods. You CANNOT resist joining.",
        music: "Massive conga drums (tumbadoras), Chinese cornets (corneta china — a piercing brass instrument), bells, and frying pans beaten with spoons. The rhythm is irresistible.",
        attire: "Colorful matching outfits for each comparsa (dance group). Leaders wear elaborate feathered headdresses. Everyone else wears the group's colors.",
      },
    ]`,
    music: `["Arrollando (conga anthem)", "Chan Chan (Buena Vista Social Club)", "Guantanamera", "La Conga de Los Hoyos"]`,
    newsStyle: `{
      headline: "Santiago de Cuba erupts! 500,000 dancers join the conga line as Carnival takes over the city for 10 days",
      urgency: "happening_now",
    }`,
  },
  romeria_cr: {
    location: `{
      city: "Cartago",
      region: "Cartago Province",
      country: "Costa Rica",
      coordinates: { lat: 9.8644, lng: -83.9194 },
      famousVenues: ["Basílica de Nuestra Señora de los Ángeles", "Route from San José to Cartago (22 km)", "La Negrita shrine"],
    }`,
    history: `{
      origin: "In 1635, a young indigenous girl named Juana Pereira found a small dark stone statue of the Virgin Mary on a rock. She took it home twice, but it miraculously returned to the rock each time. A basilica was built on the spot.",
      whyTheyCelebrate: "Costa Ricans walk to Cartago because La Negrita (the dark Virgin) is their patron saint and protector. The pilgrimage is a promise (promesa) — people walk to ask for miracles, give thanks for healing, or honor a vow made during illness.",
      historicalContext: "The dark-skinned Virgin represented indigenous and mestizo Costa Ricans in a colonial church dominated by European imagery. She became a symbol of Costa Rican identity — humble, miraculous, and accessible to the poor.",
      yearEstablished: 1635,
      evolution: "Started as local devotion in the 1600s. By the 1800s, thousands walked annually. Today 2.5 million+ Costa Ricans (half the country!) make the pilgrimage on August 2. Many walk the full 22km from San José to Cartago through the night. Some crawl on their knees.",
    }`,
    music: `["Himno a la Virgen de los Ángeles", "Patriótica Costarricense", "Prayers and rosaries chanted while walking"]`,
    newsStyle: `{
      headline: "2.5 million Costa Ricans begin the Romería to Cartago — pilgrims walk through the night to honor La Negrita",
      urgency: "this_week",
    }`,
  },
  tango_day_ar: {
    location: `{
      city: "Buenos Aires",
      region: "Ciudad Autónoma de Buenos Aires",
      country: "Argentina",
      coordinates: { lat: -34.6037, lng: -58.3816 },
      famousVenues: ["La Boca neighborhood (Caminito)", "San Telmo milongas", "Café Tortoni", "Esquina Carlos Gardel", "Plaza Dorrego (outdoor milonga)"],
    }`,
    history: `{
      origin: "Tango was born in the 1880s in the conventillos (tenement houses) of Buenos Aires where Italian, Spanish, African, and criollo immigrants lived together. It started in brothels and port neighborhoods — considered vulgar by the upper class.",
      whyTheyCelebrate: "Argentines celebrate because tango IS Buenos Aires — it's the sound of immigration, loneliness, passion, and survival. December 11 is the birthday of both Carlos Gardel (tango's greatest singer) and Julio De Caro (revolutionary tango musician).",
      historicalContext: "Tango was the music of the poor and marginalized. Upper-class Argentines rejected it until Paris embraced it in the 1910s — then suddenly it was 'sophisticated.' This pattern (rejected at home, loved abroad, then reclaimed) defines tango's story.",
      yearEstablished: 1977,
      evolution: "Born in 1880s slums. Rejected by elites. Conquered Paris in 1910s. Golden Age in 1940s (orchestras, dance halls). Nearly died in 1960s-70s (military dictatorship suppressed gatherings). Revived in 1980s. UNESCO Intangible Cultural Heritage since 2009. Today Buenos Aires has 100+ milongas (tango dance halls) every week.",
    }`,
    dances: `[
      {
        name: "Tango de Salón",
        description: "Close embrace, chest to chest. The leader walks, the follower mirrors. Feet interweave in ochos (figure-8s), ganchos (hooks), and boleos (leg flicks). Every movement is improvised — a silent conversation between two bodies.",
        music: "Bandoneón (concertina), violin, piano, and double bass. Orchestras like Di Sarli, Pugliese, D'Arienzo. The music dictates the mood — dramatic pauses, sudden accelerations.",
        attire: "Women: slit skirt or dress, high heels (8-10cm), hair up. Men: suit or dress shirt, polished shoes with leather soles for pivoting. In milongas, the dress code is elegant but not costume-like.",
      },
    ]`,
    music: `["La Cumparsita (most famous tango)", "Por Una Cabeza (Carlos Gardel)", "Libertango (Astor Piazzolla)", "Volver (Gardel)", "Adiós Nonino (Piazzolla)"]`,
    newsStyle: `{
      headline: "Buenos Aires celebrates Día Nacional del Tango! Milongas open across the city — free outdoor dancing in San Telmo",
      urgency: "happening_now",
    }`,
  },
  inti_raymi: {
    location: `{
      city: "Cusco",
      region: "Cusco Region",
      country: "Peru",
      coordinates: { lat: -13.5170, lng: -71.9785 },
      famousVenues: ["Sacsayhuamán fortress (main ceremony)", "Plaza de Armas (opening)", "Qorikancha (Temple of the Sun)", "Avenida El Sol (procession route)"],
    }`,
    history: `{
      origin: "Ancient Inca ceremony honoring Inti (the Sun God), held on the winter solstice (June 24 in Southern Hemisphere). The Sapa Inca (emperor) led prayers asking the Sun to return and warm the earth for crops.",
      whyTheyCelebrate: "Peruvians celebrate because Inti Raymi connects them to their Inca ancestors — it's a reclaiming of indigenous identity after centuries of colonial suppression. The Sun represents life, harvest, and the continuation of Andean civilization.",
      historicalContext: "The Spanish banned Inti Raymi in 1572 as 'pagan idolatry.' For 400 years it was practiced secretly in remote communities. In 1944, historian Humberto Vidal Unda reconstructed the ceremony based on chronicles by Inca Garcilaso de la Vega. It's been performed annually since.",
      yearEstablished: -1412,
      evolution: "Originally the most important Inca religious ceremony (est. ~1412 AD). Banned by Spanish in 1572. Practiced secretly for 400 years. Revived in 1944 as cultural performance. Today it draws 100,000+ spectators and is Peru's second-largest festival. The ceremony is performed in Quechua.",
    }`,
    dances: `[
      {
        name: "Danza del Inca",
        description: "The actor playing the Sapa Inca performs ritual movements — arms raised to the sun, slow ceremonial steps, offering chicha (corn beer) to the four directions (suyus). Hundreds of dancers in Inca warrior costumes surround him.",
        music: "Pututos (conch shell trumpets), quenas (Andean flutes), tinyas (small drums), and pinkullus (long flutes). The sound echoes off Sacsayhuamán's massive stone walls.",
        attire: "The Inca wears a golden tunic, feathered headdress (mascapaicha), golden earspools, and carries a golden staff. Warriors wear colorful unkus (tunics) representing the four suyus of the empire.",
      },
    ]`,
    music: `["Himno al Sol (Hymn to the Sun — performed in Quechua)", "El Cóndor Pasa", "Pututo trumpet calls", "Traditional huayno music"]`,
    newsStyle: `{
      headline: "Inti Raymi returns to Sacsayhuamán! 100,000 gather as the Inca honors the Sun God in ancient Quechua ceremony",
      urgency: "happening_now",
    }`,
  },
  fiestas_patrias_cl: {
    location: `{
      city: "Santiago & nationwide",
      region: "All regions",
      country: "Chile",
      coordinates: { lat: -33.4489, lng: -70.6693 },
      famousVenues: ["Parque O'Higgins (largest fonda in Santiago)", "Fondas and ramadas (temporary party structures) nationwide", "Plaza de la Constitución"],
    }`,
    history: `{
      origin: "Commemorates September 18, 1810 — the first Junta de Gobierno (governing council) that began Chile's path to independence from Spain. Full independence came in 1818.",
      whyTheyCelebrate: "Chileans celebrate because Fiestas Patrias is THE national party — it's about being Chilean. Cueca dancing, empanadas, red wine, and asados represent the soul of Chile. It's identity, pride, and community all in one week.",
      historicalContext: "Chile's independence movement was led by Bernardo O'Higgins and José de San Martín. The 1810 junta didn't declare independence but began self-governance. The actual independence battle (Maipú) was in 1818. Chileans celebrate the beginning, not the end.",
      yearEstablished: 1810,
      evolution: "Originally a formal civic ceremony. By the 1900s, fondas (temporary party venues) became the tradition. The military government (1973-1990) tried to control celebrations but couldn't stop the cueca. Today it's a full week off work — Chile essentially shuts down for asados, cueca, and chicha.",
    }`,
    dances: `[
      {
        name: "Cueca",
        description: "Chile's national dance — a courtship between rooster and hen. Partners wave white handkerchiefs while circling each other with zapateado (foot-stamping). They never touch. The man pursues, the woman teases and retreats.",
        music: "Guitar, harp, accordion, and tambourine. The singer shouts '¡Aro!' to mark sections. The crowd claps and shouts encouragement.",
        attire: "Women: flowered dress with apron, hair in braids with ribbons. Men: huaso outfit — short bolero jacket, striped poncho (manta), flat-brimmed hat (chupalla), high boots with large spurs.",
      },
    ]`,
    music: `["La Consentida (most famous cueca)", "Chicha de Curacaví", "Si Vas Para Chile (Chito Faró)", "El Huaso y la Lavandera"]`,
    newsStyle: `{
      headline: "¡Viva Chile! Fiestas Patrias begin — fondas open nationwide with cueca, empanadas, and terremoto cocktails",
      urgency: "happening_now",
    }`,
  },
  san_sebastian_pr: {
    location: `{
      city: "San Juan",
      region: "Old San Juan (Viejo San Juan)",
      country: "Puerto Rico",
      coordinates: { lat: 18.4655, lng: -66.1057 },
      famousVenues: ["Calle San Sebastián", "Plaza del Quinto Centenario", "Calle del Cristo", "Norzagaray Street (overlooking the ocean)"],
    }`,
    history: `{
      origin: "Originally a religious feast day honoring Saint Sebastian (martyred Roman soldier). In the 1970s, residents of San Sebastián Street in Old San Juan turned it into a massive street party to celebrate Puerto Rican culture and resist cultural erasure.",
      whyTheyCelebrate: "Puerto Ricans celebrate because SanSe (as they call it) is about Puerto Rican identity — bomba, plena, artisans, and community. In a colony that's been controlled by Spain and then the US, SanSe is a declaration: 'We are Puerto Rican, and our culture is alive.'",
      historicalContext: "Puerto Rico has been a US territory since 1898. Cultural preservation is political. SanSe emerged during the 1970s Puerto Rican cultural renaissance — artists, musicians, and activists used festivals to assert identity against Americanization.",
      yearEstablished: 1970,
      evolution: "Started as a small neighborhood party on one street in the 1970s. Grew to 200,000+ attendees by the 2000s. Features artisan markets (handmade masks, santos), live bomba and plena, food vendors, and cabezudos (giant papier-mâché heads). Now Puerto Rico's largest street festival.",
    }`,
    dances: `[
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
    ]`,
    music: `["Quítate de la Vía Perico (plena classic)", "Bomba para Siempre", "El Bombón de Elena", "Cortaron a Elena (plena)"]`,
    newsStyle: `{
      headline: "¡SanSe explodes in Old San Juan! 200,000+ fill the cobblestone streets for bomba, plena, and Puerto Rican pride",
      urgency: "happening_now",
    }`,
  },
};

// Inject expansions into the file
let injected = 0;
for (const [id, fields] of Object.entries(expansions)) {
  // Find the holiday's closing "durationDays: X," line and inject after it
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
