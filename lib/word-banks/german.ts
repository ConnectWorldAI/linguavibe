/**
 * German Word Bank for Pronunciation Duels
 *
 * Categories: ABCs, Numbers, Adjectives, Verb Tenses (present/past/future)
 * Each word includes phonetic transcription and English translation.
 */
import type { DuelWord } from "@/lib/pronunciation-duel";

export const GERMAN_WORD_BANK: Record<string, DuelWord[]> = {
  abcs: [
    { id: "de_abc1", text: "Guten Morgen", phonetic: "/ˈɡuːtən ˈmɔʁɡn̩/", translation: "Good morning", language: "German", category: "abcs", difficulty: "easy" },
    { id: "de_abc2", text: "Danke", phonetic: "/ˈdaŋkə/", translation: "Thank you", language: "German", category: "abcs", difficulty: "easy" },
    { id: "de_abc3", text: "Schmetterling", phonetic: "/ˈʃmɛtɐlɪŋ/", translation: "Butterfly", language: "German", category: "abcs", difficulty: "medium" },
    { id: "de_abc4", text: "Eichhörnchen", phonetic: "/ˈaɪ̯çhœʁnçən/", translation: "Squirrel", language: "German", category: "abcs", difficulty: "hard" },
    { id: "de_abc5", text: "Streichholzschächtelchen", phonetic: "/ˈʃtʁaɪ̯çhɔlt͡sˌʃɛçtl̩çən/", translation: "Little matchbox", language: "German", category: "abcs", difficulty: "hard" },
    { id: "de_abc6", text: "Kindergarten", phonetic: "/ˈkɪndɐˌɡaʁtn̩/", translation: "Kindergarten", language: "German", category: "abcs", difficulty: "easy" },
    { id: "de_abc7", text: "Brötchen", phonetic: "/ˈbʁøːtçən/", translation: "Bread roll", language: "German", category: "abcs", difficulty: "medium" },
    { id: "de_abc8", text: "Geschwindigkeit", phonetic: "/ɡəˈʃvɪndɪçkaɪ̯t/", translation: "Speed", language: "German", category: "abcs", difficulty: "hard" },
    { id: "de_abc9", text: "Entschuldigung", phonetic: "/ɛntˈʃʊldɪɡʊŋ/", translation: "Excuse me", language: "German", category: "abcs", difficulty: "medium" },
    { id: "de_abc10", text: "Freundschaft", phonetic: "/ˈfʁɔɪ̯ntʃaft/", translation: "Friendship", language: "German", category: "abcs", difficulty: "medium" },
  ],
  numbers: [
    { id: "de_num1", text: "Eins", phonetic: "/aɪ̯ns/", translation: "One", language: "German", category: "numbers", difficulty: "easy" },
    { id: "de_num2", text: "Zwei", phonetic: "/t͡svaɪ̯/", translation: "Two", language: "German", category: "numbers", difficulty: "easy" },
    { id: "de_num3", text: "Drei", phonetic: "/dʁaɪ̯/", translation: "Three", language: "German", category: "numbers", difficulty: "easy" },
    { id: "de_num4", text: "Einundzwanzig", phonetic: "/ˈaɪ̯nʊntˌt͡svant͡sɪç/", translation: "Twenty-one", language: "German", category: "numbers", difficulty: "medium" },
    { id: "de_num5", text: "Fünfundsiebzig", phonetic: "/ˈfʏnfʊntˌziːpt͡sɪç/", translation: "Seventy-five", language: "German", category: "numbers", difficulty: "medium" },
    { id: "de_num6", text: "Neunundneunzig", phonetic: "/ˈnɔɪ̯nʊntˌnɔɪ̯nt͡sɪç/", translation: "Ninety-nine", language: "German", category: "numbers", difficulty: "hard" },
    { id: "de_num7", text: "Tausend", phonetic: "/ˈtaʊ̯zn̩t/", translation: "One thousand", language: "German", category: "numbers", difficulty: "easy" },
    { id: "de_num8", text: "Dreihundertvierundfünfzig", phonetic: "/ˈdʁaɪ̯hʊndɐtˌfiːɐ̯ʊntˌfʏnft͡sɪç/", translation: "Three hundred fifty-four", language: "German", category: "numbers", difficulty: "hard" },
    { id: "de_num9", text: "Zwölf", phonetic: "/t͡svœlf/", translation: "Twelve", language: "German", category: "numbers", difficulty: "easy" },
    { id: "de_num10", text: "Sechsundsechzig", phonetic: "/ˈzɛksʊntˌzɛçt͡sɪç/", translation: "Sixty-six", language: "German", category: "numbers", difficulty: "medium" },
  ],
  adjectives: [
    { id: "de_adj1", text: "Wunderschön", phonetic: "/ˈvʊndɐʃøːn/", translation: "Beautiful", language: "German", category: "adjectives", difficulty: "medium" },
    { id: "de_adj2", text: "Gemütlich", phonetic: "/ɡəˈmyːtlɪç/", translation: "Cozy/comfortable", language: "German", category: "adjectives", difficulty: "medium" },
    { id: "de_adj3", text: "Unglaublich", phonetic: "/ˈʊnɡlaʊ̯plɪç/", translation: "Incredible", language: "German", category: "adjectives", difficulty: "medium" },
    { id: "de_adj4", text: "Schnell", phonetic: "/ʃnɛl/", translation: "Fast", language: "German", category: "adjectives", difficulty: "easy" },
    { id: "de_adj5", text: "Freundlich", phonetic: "/ˈfʁɔɪ̯ntlɪç/", translation: "Friendly", language: "German", category: "adjectives", difficulty: "easy" },
    { id: "de_adj6", text: "Außergewöhnlich", phonetic: "/ˈaʊ̯sɐɡəˌvøːnlɪç/", translation: "Extraordinary", language: "German", category: "adjectives", difficulty: "hard" },
    { id: "de_adj7", text: "Selbstverständlich", phonetic: "/ˈzɛlpstfɛɐ̯ˌʃtɛntlɪç/", translation: "Self-evident", language: "German", category: "adjectives", difficulty: "hard" },
    { id: "de_adj8", text: "Lecker", phonetic: "/ˈlɛkɐ/", translation: "Delicious", language: "German", category: "adjectives", difficulty: "easy" },
    { id: "de_adj9", text: "Gefährlich", phonetic: "/ɡəˈfɛːɐ̯lɪç/", translation: "Dangerous", language: "German", category: "adjectives", difficulty: "medium" },
    { id: "de_adj10", text: "Überwältigend", phonetic: "/yːbɐˈvɛltɪɡn̩t/", translation: "Overwhelming", language: "German", category: "adjectives", difficulty: "hard" },
  ],
  verbs_present: [
    { id: "de_vp1", text: "Ich spreche Deutsch", phonetic: "/ɪç ˈʃpʁɛçə dɔɪ̯tʃ/", translation: "I speak German", language: "German", category: "verbs_present", difficulty: "easy" },
    { id: "de_vp2", text: "Wir lernen zusammen", phonetic: "/viːɐ̯ ˈlɛʁnən t͡suˈzamən/", translation: "We learn together", language: "German", category: "verbs_present", difficulty: "easy" },
    { id: "de_vp3", text: "Sie verstehen mich nicht", phonetic: "/ziː fɛɐ̯ˈʃteːən mɪç nɪçt/", translation: "They don't understand me", language: "German", category: "verbs_present", difficulty: "medium" },
    { id: "de_vp4", text: "Er arbeitet jeden Tag", phonetic: "/eːɐ̯ ˈaʁbaɪ̯tət ˈjeːdn̩ taːk/", translation: "He works every day", language: "German", category: "verbs_present", difficulty: "medium" },
    { id: "de_vp5", text: "Ich empfehle dieses Restaurant", phonetic: "/ɪç ɛmˈpfeːlə ˈdiːzəs ʁɛstoˈʁɑ̃/", translation: "I recommend this restaurant", language: "German", category: "verbs_present", difficulty: "hard" },
  ],
  verbs_past: [
    { id: "de_vpast1", text: "Ich habe gegessen", phonetic: "/ɪç ˈhaːbə ɡəˈɡɛsn̩/", translation: "I have eaten", language: "German", category: "verbs_past", difficulty: "easy" },
    { id: "de_vpast2", text: "Wir sind gegangen", phonetic: "/viːɐ̯ zɪnt ɡəˈɡaŋən/", translation: "We went/walked", language: "German", category: "verbs_past", difficulty: "medium" },
    { id: "de_vpast3", text: "Er hat es verstanden", phonetic: "/eːɐ̯ hat ɛs fɛɐ̯ˈʃtandn̩/", translation: "He understood it", language: "German", category: "verbs_past", difficulty: "medium" },
    { id: "de_vpast4", text: "Sie hatte einen Unfall", phonetic: "/ziː ˈhatə ˈaɪ̯nən ˈʊnfal/", translation: "She had an accident", language: "German", category: "verbs_past", difficulty: "medium" },
    { id: "de_vpast5", text: "Ich bin gestern angekommen", phonetic: "/ɪç bɪn ˈɡɛstɐn ˈanɡəˌkɔmən/", translation: "I arrived yesterday", language: "German", category: "verbs_past", difficulty: "hard" },
  ],
  verbs_future: [
    { id: "de_vf1", text: "Ich werde reisen", phonetic: "/ɪç ˈveːɐ̯də ˈʁaɪ̯zn̩/", translation: "I will travel", language: "German", category: "verbs_future", difficulty: "easy" },
    { id: "de_vf2", text: "Wir werden es schaffen", phonetic: "/viːɐ̯ ˈveːɐ̯dn̩ ɛs ˈʃafn̩/", translation: "We will make it", language: "German", category: "verbs_future", difficulty: "medium" },
    { id: "de_vf3", text: "Sie wird morgen kommen", phonetic: "/ziː vɪʁt ˈmɔʁɡn̩ ˈkɔmən/", translation: "She will come tomorrow", language: "German", category: "verbs_future", difficulty: "medium" },
    { id: "de_vf4", text: "Er wird sich verbessern", phonetic: "/eːɐ̯ vɪʁt zɪç fɛɐ̯ˈbɛsɐn/", translation: "He will improve", language: "German", category: "verbs_future", difficulty: "medium" },
    { id: "de_vf5", text: "Ich werde Deutsch fließend sprechen", phonetic: "/ɪç ˈveːɐ̯də dɔɪ̯tʃ ˈfliːsn̩t ˈʃpʁɛçn̩/", translation: "I will speak German fluently", language: "German", category: "verbs_future", difficulty: "hard" },
  ],
};

export const GERMAN_TONGUE_TWISTERS: DuelWord[] = [
  { id: "de_tt1", text: "Fischers Fritz fischt frische Fische", phonetic: "/ˈfɪʃɐs fʁɪt͡s fɪʃt ˈfʁɪʃə ˈfɪʃə/", translation: "Fischer's Fritz catches fresh fish", language: "German", category: "mixed", difficulty: "hard" },
  { id: "de_tt2", text: "Blaukraut bleibt Blaukraut und Brautkleid bleibt Brautkleid", phonetic: "/ˈblaʊ̯kʁaʊ̯t blaɪ̯pt ˈblaʊ̯kʁaʊ̯t ʊnt ˈbʁaʊ̯tklaɪ̯t blaɪ̯pt ˈbʁaʊ̯tklaɪ̯t/", translation: "Red cabbage stays red cabbage and wedding dress stays wedding dress", language: "German", category: "mixed", difficulty: "hard" },
  { id: "de_tt3", text: "Zwischen zwei Zwetschgenzweigen zwitschern zwei Schwalben", phonetic: "/ˈt͡svɪʃn̩ t͡svaɪ̯ ˈt͡svɛtʃɡn̩ˌt͡svaɪ̯ɡn̩ ˈt͡svɪtʃɐn t͡svaɪ̯ ˈʃvalbn̩/", translation: "Between two plum branches two swallows chirp", language: "German", category: "mixed", difficulty: "hard" },
  { id: "de_tt4", text: "Schnecken erschrecken wenn Schnecken an Schnecken schlecken", phonetic: "/ˈʃnɛkn̩ ɛɐ̯ˈʃʁɛkn̩ vɛn ˈʃnɛkn̩ an ˈʃnɛkn̩ ˈʃlɛkn̩/", translation: "Snails get scared when snails lick snails", language: "German", category: "mixed", difficulty: "hard" },
  { id: "de_tt5", text: "Der Cottbuser Postkutscher putzt den Cottbuser Postkutschkasten", phonetic: "/deːɐ̯ ˈkɔtbʊzɐ ˈpɔstkʊtʃɐ pʊt͡st deːn ˈkɔtbʊzɐ ˈpɔstkʊtʃˌkastn̩/", translation: "The Cottbus mail coach driver cleans the Cottbus mail coach box", language: "German", category: "mixed", difficulty: "hard" },
];
