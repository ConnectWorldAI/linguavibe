/**
 * Pre-loaded Demo Songs
 * 
 * These are original reggaeton-style lyrics (NOT copyrighted) designed to test
 * the full splitter → lesson pipeline without requiring audio upload.
 * 
 * The lyrics are written in authentic reggaeton style with:
 * - Common Spanish slang and idioms
 * - Reggaeton-specific vocabulary
 * - Grammar patterns typical of the genre
 * - Cultural references
 * 
 * This avoids any copyright issues while providing realistic test content
 * that demonstrates the lesson breakdown capabilities.
 */

export interface DemoSong {
  id: string;
  title: string;
  artist: string;
  genre: string;
  sourceLanguage: string;
  targetLanguage: string;
  dialect: string;
  difficulty: "easy" | "medium" | "hard";
  duration: string;
  coverColor: string;
  lyrics: string;
  syncedLyrics: { id: string; startTime: number; endTime: number; original: string; translated: string }[];
  stemLyrics: { measure: number; text: string; startTime: number }[];
  description: string;
  /** Audio file source - remote URL or bundled asset */
  audioSource?: { uri: string } | number;
  /** Audio attribution */
  audioAttribution?: string;
}

/**
 * "Fuego en la Calle" — Original reggaeton demo
 * Written specifically for ConnectWorld AI as a royalty-free demo
 * Style: Bad Bunny / Daddy Yankee influenced
 */
const FUEGO_EN_LA_CALLE: DemoSong = {
  id: "demo_reggaeton_1",
  title: "Fuego en la Calle",
  artist: "ConnectWorld AI Demo",
  genre: "Reggaeton",
  sourceLanguage: "Spanish",
  targetLanguage: "English",
  dialect: "Puerto Rican",
  difficulty: "medium",
  duration: "1:16",
  coverColor: "#FF6B35",
  audioSource: { uri: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663525338526/KHBHejSZmkSlCSgs.mp3" },
  audioAttribution: "Reggaeton Beat by prettyjohn1 — Pixabay Content License (free for use)",
  description: "A reggaeton demo with Puerto Rican slang, perfect for learning street Spanish and common verb conjugations.",
  lyrics: `Yo no sé qué tiene ella
Que me tiene loco de la cabeza
Cada vez que la veo en la calle
Se me para el corazón, qué belleza

Ella camina con ese flow
Como si el mundo fuera de ella
Las estrellas se ponen celosas
Porque ella brilla más que cualquiera

Dime mami, ¿pa' dónde tú vas?
Yo te llevo donde quieras
Con ese perreo que tú tienes
Rompes todas las caderas

Fuego en la calle, fuego
Cuando ella sale, fuego
Todo el mundo para, fuego
Nadie se le compara

Yo tengo un par de panas
Que siempre están conmigo
Pero cuando ella llega
Se me olvidan los amigos

Dale con to', mami
No te detengas
La noche es joven
Y el beat no para

Ella es de esas que no necesita filtro
Ni maquillaje pa' verse bonita
Con su sonrisa conquista al barrio
Y con su baile prende la discoteca

Tú eres la que manda aquí
No hay nadie que te pare
Con ese tumbao que llevas
Haces temblar el aire

Fuego en la calle, fuego
Cuando ella sale, fuego
Todo el mundo para, fuego
Nadie se le compara

Yo quiero bailar contigo
Hasta que salga el sol
Pegaíto, despacito
Sintiendo el calor

Ella me dijo: "Papi, vamos"
Y yo le dije: "Vamo' allá"
La música nos lleva
A un lugar sin final

Fuego en la calle, fuego
Cuando ella sale, fuego
Todo el mundo para, fuego
Nadie se le compara`,
  syncedLyrics: [
    { id: "1", startTime: 0, endTime: 5, original: "Yo no sé qué tiene ella", translated: "I don't know what she has" },
    { id: "2", startTime: 5, endTime: 10, original: "Que me tiene loco de la cabeza", translated: "That has me crazy in the head" },
    { id: "3", startTime: 10, endTime: 15, original: "Cada vez que la veo en la calle", translated: "Every time I see her on the street" },
    { id: "4", startTime: 15, endTime: 20, original: "Se me para el corazón, qué belleza", translated: "My heart stops, what beauty" },
    { id: "5", startTime: 20, endTime: 25, original: "Ella camina con ese flow", translated: "She walks with that flow" },
    { id: "6", startTime: 25, endTime: 30, original: "Como si el mundo fuera de ella", translated: "As if the world belonged to her" },
    { id: "7", startTime: 30, endTime: 35, original: "Las estrellas se ponen celosas", translated: "The stars get jealous" },
    { id: "8", startTime: 35, endTime: 40, original: "Porque ella brilla más que cualquiera", translated: "Because she shines more than anyone" },
    { id: "9", startTime: 40, endTime: 45, original: "Dime mami, ¿pa' dónde tú vas?", translated: "Tell me baby, where are you going?" },
    { id: "10", startTime: 45, endTime: 50, original: "Yo te llevo donde quieras", translated: "I'll take you wherever you want" },
    { id: "11", startTime: 50, endTime: 55, original: "Con ese perreo que tú tienes", translated: "With that perreo you have" },
    { id: "12", startTime: 55, endTime: 60, original: "Rompes todas las caderas", translated: "You break all the hips" },
    { id: "13", startTime: 60, endTime: 65, original: "Fuego en la calle, fuego", translated: "Fire in the street, fire" },
    { id: "14", startTime: 65, endTime: 70, original: "Cuando ella sale, fuego", translated: "When she comes out, fire" },
    { id: "15", startTime: 70, endTime: 75, original: "Todo el mundo para, fuego", translated: "Everyone stops, fire" },
    { id: "16", startTime: 75, endTime: 80, original: "Nadie se le compara", translated: "No one compares to her" },
    { id: "17", startTime: 80, endTime: 85, original: "Yo tengo un par de panas", translated: "I have a couple of friends" },
    { id: "18", startTime: 85, endTime: 90, original: "Que siempre están conmigo", translated: "Who are always with me" },
    { id: "19", startTime: 90, endTime: 95, original: "Pero cuando ella llega", translated: "But when she arrives" },
    { id: "20", startTime: 95, endTime: 100, original: "Se me olvidan los amigos", translated: "I forget my friends" },
    { id: "21", startTime: 100, endTime: 105, original: "Dale con to', mami", translated: "Give it your all, baby" },
    { id: "22", startTime: 105, endTime: 110, original: "No te detengas", translated: "Don't stop" },
    { id: "23", startTime: 110, endTime: 115, original: "La noche es joven", translated: "The night is young" },
    { id: "24", startTime: 115, endTime: 120, original: "Y el beat no para", translated: "And the beat doesn't stop" },
    { id: "25", startTime: 120, endTime: 125, original: "Ella es de esas que no necesita filtro", translated: "She's one of those who doesn't need a filter" },
    { id: "26", startTime: 125, endTime: 130, original: "Ni maquillaje pa' verse bonita", translated: "Nor makeup to look pretty" },
    { id: "27", startTime: 130, endTime: 135, original: "Con su sonrisa conquista al barrio", translated: "With her smile she conquers the neighborhood" },
    { id: "28", startTime: 135, endTime: 140, original: "Y con su baile prende la discoteca", translated: "And with her dance she lights up the club" },
    { id: "29", startTime: 140, endTime: 145, original: "Tú eres la que manda aquí", translated: "You're the one in charge here" },
    { id: "30", startTime: 145, endTime: 150, original: "No hay nadie que te pare", translated: "There's no one who can stop you" },
    { id: "31", startTime: 150, endTime: 155, original: "Con ese tumbao que llevas", translated: "With that swagger you carry" },
    { id: "32", startTime: 155, endTime: 160, original: "Haces temblar el aire", translated: "You make the air tremble" },
    { id: "33", startTime: 160, endTime: 165, original: "Yo quiero bailar contigo", translated: "I want to dance with you" },
    { id: "34", startTime: 165, endTime: 170, original: "Hasta que salga el sol", translated: "Until the sun comes up" },
    { id: "35", startTime: 170, endTime: 175, original: "Pegaíto, despacito", translated: "Close together, slowly" },
    { id: "36", startTime: 175, endTime: 180, original: "Sintiendo el calor", translated: "Feeling the heat" },
    { id: "37", startTime: 180, endTime: 185, original: "Ella me dijo: 'Papi, vamos'", translated: "She told me: 'Daddy, let's go'" },
    { id: "38", startTime: 185, endTime: 190, original: "Y yo le dije: 'Vamo' allá'", translated: "And I told her: 'Let's go there'" },
    { id: "39", startTime: 190, endTime: 195, original: "La música nos lleva", translated: "The music takes us" },
    { id: "40", startTime: 195, endTime: 204, original: "A un lugar sin final", translated: "To a place without end" },
  ],
  stemLyrics: [
    { measure: 1, text: "", startTime: 0 },
    { measure: 2, text: "Yo no sé qué tiene ella", startTime: 4 },
    { measure: 3, text: "Que me tiene loco de la cabeza", startTime: 8 },
    { measure: 4, text: "Cada vez que la veo en la calle", startTime: 12 },
    { measure: 5, text: "Se me para el corazón, qué belleza", startTime: 16 },
    { measure: 6, text: "Ella camina con ese flow", startTime: 20 },
    { measure: 7, text: "Como si el mundo fuera de ella", startTime: 24 },
    { measure: 8, text: "Las estrellas se ponen celosas", startTime: 28 },
    { measure: 9, text: "Porque ella brilla más que cualquiera", startTime: 32 },
    { measure: 10, text: "Dime mami, ¿pa' dónde tú vas?", startTime: 36 },
    { measure: 11, text: "Yo te llevo donde quieras", startTime: 40 },
    { measure: 12, text: "Con ese perreo que tú tienes", startTime: 44 },
    { measure: 13, text: "Rompes todas las caderas", startTime: 48 },
    { measure: 14, text: "Fuego en la calle, fuego", startTime: 52 },
    { measure: 15, text: "Cuando ella sale, fuego", startTime: 56 },
    { measure: 16, text: "Todo el mundo para, fuego", startTime: 60 },
    { measure: 17, text: "Nadie se le compara", startTime: 64 },
    { measure: 18, text: "Yo tengo un par de panas", startTime: 68 },
    { measure: 19, text: "Que siempre están conmigo", startTime: 72 },
    { measure: 20, text: "Pero cuando ella llega", startTime: 76 },
    { measure: 21, text: "Se me olvidan los amigos", startTime: 80 },
    { measure: 22, text: "Dale con to', mami", startTime: 84 },
    { measure: 23, text: "No te detengas", startTime: 88 },
    { measure: 24, text: "La noche es joven", startTime: 92 },
    { measure: 25, text: "Y el beat no para", startTime: 96 },
    { measure: 26, text: "Ella es de esas que no necesita filtro", startTime: 100 },
    { measure: 27, text: "Ni maquillaje pa' verse bonita", startTime: 104 },
    { measure: 28, text: "Con su sonrisa conquista al barrio", startTime: 108 },
    { measure: 29, text: "Y con su baile prende la discoteca", startTime: 112 },
    { measure: 30, text: "Tú eres la que manda aquí", startTime: 116 },
    { measure: 31, text: "No hay nadie que te pare", startTime: 120 },
    { measure: 32, text: "Con ese tumbao que llevas", startTime: 124 },
    { measure: 33, text: "Haces temblar el aire", startTime: 128 },
    { measure: 34, text: "Fuego en la calle, fuego", startTime: 132 },
    { measure: 35, text: "Cuando ella sale, fuego", startTime: 136 },
    { measure: 36, text: "Todo el mundo para, fuego", startTime: 140 },
    { measure: 37, text: "Nadie se le compara", startTime: 144 },
    { measure: 38, text: "Yo quiero bailar contigo", startTime: 148 },
    { measure: 39, text: "Hasta que salga el sol", startTime: 152 },
    { measure: 40, text: "Pegaíto, despacito", startTime: 156 },
    { measure: 41, text: "Sintiendo el calor", startTime: 160 },
    { measure: 42, text: "Ella me dijo: 'Papi, vamos'", startTime: 164 },
    { measure: 43, text: "Y yo le dije: 'Vamo' allá'", startTime: 168 },
    { measure: 44, text: "La música nos lleva", startTime: 172 },
    { measure: 45, text: "A un lugar sin final", startTime: 176 },
  ],
};

/**
 * "Noche de Rumba" — Original reggaeton/dembow demo
 * Written specifically for ConnectWorld AI as a royalty-free demo
 * Style: Dominican dembow influenced
 */
const NOCHE_DE_RUMBA: DemoSong = {
  id: "demo_reggaeton_2",
  title: "Noche de Rumba",
  artist: "ConnectWorld AI Demo",
  genre: "Dembow / Reggaeton",
  sourceLanguage: "Spanish",
  targetLanguage: "English",
  dialect: "Dominican",
  difficulty: "hard",
  duration: "1:57",
  coverColor: "#9B59B6",
  audioSource: { uri: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663525338526/VErFgmSytixMnexM.mp3" },
  audioAttribution: "Fuego Lento by Ovrsoull — Pixabay Content License (free for use)",
  description: "A Dominican dembow demo packed with Caribbean slang, contractions, and cultural expressions. Great for advanced learners.",
  lyrics: `Eh, eh, llegó la noche de rumba
Vamo' a gozar hasta que el sol alumbre
Que nadie se quede en la casa
Hoy la calle está que arde

Mami, tú ta' durísima
Con ese vestido que te queda brutal
Los tigres del barrio se quedan mirando
Pero tú no le paras a na'

Dímelo, dímelo
¿Quién es la más dura del party?
Tú lo sabe', mami
No hay quien te lo discuta

Prende el blunt, sube el volumen
Que esta noche no hay problema
El dembow está sonando
Y el barrio entero se conecta

Ella tiene un no sé qué
Que cuando camina to' el mundo la ve
Con ese movimiento de cintura
Hace que cualquiera se enloquezca

Tamo' activo, tamo' ready
Pa' romper la disco esta noche
Con los panas, con las mamis
Nadie nos para el derroche

Noche de rumba, dale
Que la vida es una sola
Noche de rumba, dale
Que mañana no importa ahora

Yo tengo mi vaina clara
No me meto con nadie
Pero si me buscan problema
Yo resuelvo en la calle

El DJ puso mi tema
Y la gente se volvió loca
Mano arriba, cintura abajo
Que esta fiesta no se acorta`,
  syncedLyrics: [
    { id: "1", startTime: 0, endTime: 4, original: "Eh, eh, llegó la noche de rumba", translated: "Hey, hey, the party night has arrived" },
    { id: "2", startTime: 4, endTime: 8, original: "Vamo' a gozar hasta que el sol alumbre", translated: "Let's party until the sun shines" },
    { id: "3", startTime: 8, endTime: 12, original: "Que nadie se quede en la casa", translated: "Let no one stay at home" },
    { id: "4", startTime: 12, endTime: 16, original: "Hoy la calle está que arde", translated: "Today the street is on fire" },
    { id: "5", startTime: 16, endTime: 20, original: "Mami, tú ta' durísima", translated: "Baby, you look amazing" },
    { id: "6", startTime: 20, endTime: 24, original: "Con ese vestido que te queda brutal", translated: "With that dress that fits you brutally well" },
    { id: "7", startTime: 24, endTime: 28, original: "Los tigres del barrio se quedan mirando", translated: "The guys in the hood keep staring" },
    { id: "8", startTime: 28, endTime: 32, original: "Pero tú no le paras a na'", translated: "But you don't pay attention to anything" },
    { id: "9", startTime: 32, endTime: 36, original: "Dímelo, dímelo", translated: "Tell me, tell me" },
    { id: "10", startTime: 36, endTime: 40, original: "¿Quién es la más dura del party?", translated: "Who's the baddest at the party?" },
    { id: "11", startTime: 40, endTime: 44, original: "Tú lo sabe', mami", translated: "You know it, baby" },
    { id: "12", startTime: 44, endTime: 48, original: "No hay quien te lo discuta", translated: "No one can argue with that" },
    { id: "13", startTime: 48, endTime: 52, original: "Prende el blunt, sube el volumen", translated: "Light the blunt, turn up the volume" },
    { id: "14", startTime: 52, endTime: 56, original: "Que esta noche no hay problema", translated: "Tonight there are no problems" },
    { id: "15", startTime: 56, endTime: 60, original: "El dembow está sonando", translated: "The dembow is playing" },
    { id: "16", startTime: 60, endTime: 64, original: "Y el barrio entero se conecta", translated: "And the whole hood connects" },
    { id: "17", startTime: 64, endTime: 68, original: "Ella tiene un no sé qué", translated: "She has a certain something" },
    { id: "18", startTime: 68, endTime: 72, original: "Que cuando camina to' el mundo la ve", translated: "That when she walks everyone sees her" },
    { id: "19", startTime: 72, endTime: 76, original: "Con ese movimiento de cintura", translated: "With that hip movement" },
    { id: "20", startTime: 76, endTime: 80, original: "Hace que cualquiera se enloquezca", translated: "She drives anyone crazy" },
    { id: "21", startTime: 80, endTime: 84, original: "Tamo' activo, tamo' ready", translated: "We're active, we're ready" },
    { id: "22", startTime: 84, endTime: 88, original: "Pa' romper la disco esta noche", translated: "To tear up the club tonight" },
    { id: "23", startTime: 88, endTime: 92, original: "Con los panas, con las mamis", translated: "With the homies, with the ladies" },
    { id: "24", startTime: 92, endTime: 96, original: "Nadie nos para el derroche", translated: "No one stops our splurge" },
    { id: "25", startTime: 96, endTime: 100, original: "Noche de rumba, dale", translated: "Party night, let's go" },
    { id: "26", startTime: 100, endTime: 104, original: "Que la vida es una sola", translated: "Life is only one" },
    { id: "27", startTime: 104, endTime: 108, original: "Noche de rumba, dale", translated: "Party night, let's go" },
    { id: "28", startTime: 108, endTime: 112, original: "Que mañana no importa ahora", translated: "Tomorrow doesn't matter now" },
    { id: "29", startTime: 112, endTime: 116, original: "Yo tengo mi vaina clara", translated: "I have my thing clear" },
    { id: "30", startTime: 116, endTime: 120, original: "No me meto con nadie", translated: "I don't mess with anyone" },
    { id: "31", startTime: 120, endTime: 124, original: "Pero si me buscan problema", translated: "But if they come looking for trouble" },
    { id: "32", startTime: 124, endTime: 128, original: "Yo resuelvo en la calle", translated: "I handle it in the street" },
    { id: "33", startTime: 128, endTime: 132, original: "El DJ puso mi tema", translated: "The DJ played my song" },
    { id: "34", startTime: 132, endTime: 136, original: "Y la gente se volvió loca", translated: "And the people went crazy" },
    { id: "35", startTime: 136, endTime: 140, original: "Mano arriba, cintura abajo", translated: "Hands up, hips down" },
    { id: "36", startTime: 140, endTime: 148, original: "Que esta fiesta no se acorta", translated: "This party won't be cut short" },
  ],
  stemLyrics: [
    { measure: 1, text: "Eh, eh, llegó la noche de rumba", startTime: 0 },
    { measure: 2, text: "Vamo' a gozar hasta que el sol alumbre", startTime: 4 },
    { measure: 3, text: "Que nadie se quede en la casa", startTime: 8 },
    { measure: 4, text: "Hoy la calle está que arde", startTime: 12 },
    { measure: 5, text: "Mami, tú ta' durísima", startTime: 16 },
    { measure: 6, text: "Con ese vestido que te queda brutal", startTime: 20 },
    { measure: 7, text: "Los tigres del barrio se quedan mirando", startTime: 24 },
    { measure: 8, text: "Pero tú no le paras a na'", startTime: 28 },
    { measure: 9, text: "Dímelo, dímelo", startTime: 32 },
    { measure: 10, text: "¿Quién es la más dura del party?", startTime: 36 },
    { measure: 11, text: "Tú lo sabe', mami", startTime: 40 },
    { measure: 12, text: "No hay quien te lo discuta", startTime: 44 },
    { measure: 13, text: "Prende el blunt, sube el volumen", startTime: 48 },
    { measure: 14, text: "Que esta noche no hay problema", startTime: 52 },
    { measure: 15, text: "El dembow está sonando", startTime: 56 },
    { measure: 16, text: "Y el barrio entero se conecta", startTime: 60 },
    { measure: 17, text: "Ella tiene un no sé qué", startTime: 64 },
    { measure: 18, text: "Que cuando camina to' el mundo la ve", startTime: 68 },
    { measure: 19, text: "Con ese movimiento de cintura", startTime: 72 },
    { measure: 20, text: "Hace que cualquiera se enloquezca", startTime: 76 },
  ],
};

/**
 * All available demo songs
 */
export const DEMO_SONGS: DemoSong[] = [
  FUEGO_EN_LA_CALLE,
  NOCHE_DE_RUMBA,
];

/**
 * Get a demo song by ID
 */
export function getDemoSong(id: string): DemoSong | undefined {
  return DEMO_SONGS.find(s => s.id === id);
}

/**
 * Get the primary demo song (first one) for quick testing
 */
export function getPrimaryDemoSong(): DemoSong {
  return FUEGO_EN_LA_CALLE;
}
