/**
 * Expand remaining cultural calendar holidays with correct IDs.
 */
import fs from 'fs';

const filePath = '/home/ubuntu/linguavibe/lib/cultural-calendar.ts';
let content = fs.readFileSync(filePath, 'utf-8');

const expansions = {
  diablos_yare: {
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
  carnaval_santiago: {
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
  romeria_cartago: {
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
  dia_tango: {
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
  san_sebastian: {
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
console.log(`\n✅ Done! Expanded ${injected} more holidays.`);
