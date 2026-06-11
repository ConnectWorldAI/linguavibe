/**
 * Pronunciation Heat Map
 * Visual breakdown of sound accuracy after speaking exercises or calls.
 * Shows which phonemes/sounds the user nails vs. struggles with,
 * with color-coded heat map, trend tracking, and drill recommendations.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { addStrugglingPhonemesToSRS, type PhonemeCardData } from "@/lib/srs-phoneme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STORAGE_KEY = "@pronunciation_heat_map_data";

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface PhonemeData {
  id: string;
  symbol: string;
  name: string;
  category: "vowel" | "consonant" | "special";
  score: number; // 0-100
  attempts: number;
  trend: "improving" | "stable" | "declining" | "new";
  lastPracticed: string | null;
  examples: string[];
  tip: string;
}

interface LanguagePhonemeSet {
  language: string;
  flag: string;
  phonemes: PhonemeData[];
}

interface SessionResult {
  date: string;
  source: "call" | "practice" | "drill" | "karaoke";
  phonemeScores: { id: string; score: number }[];
}

// ─── DATA ───────────────────────────────────────────────────────────────────
const SPANISH_PHONEMES: PhonemeData[] = [
  // Vowels
  { id: "a", symbol: "a", name: "Open A", category: "vowel", score: 92, attempts: 45, trend: "stable", lastPracticed: "2h ago", examples: ["casa", "hablar"], tip: "Wide open mouth, tongue flat. You've mastered this!" },
  { id: "e", symbol: "e", name: "Mid E", category: "vowel", score: 88, attempts: 42, trend: "stable", lastPracticed: "2h ago", examples: ["mesa", "verde"], tip: "Between English 'eh' and 'ay'. Keep it pure, no diphthong." },
  { id: "i", symbol: "i", name: "High I", category: "vowel", score: 90, attempts: 38, trend: "stable", lastPracticed: "3h ago", examples: ["sí", "vivir"], tip: "Like English 'ee' but shorter and tenser." },
  { id: "o", symbol: "o", name: "Mid O", category: "vowel", score: 85, attempts: 40, trend: "improving", lastPracticed: "2h ago", examples: ["como", "todo"], tip: "Pure 'oh' — don't let it slide into 'ow' like English." },
  { id: "u", symbol: "u", name: "High U", category: "vowel", score: 87, attempts: 35, trend: "stable", lastPracticed: "4h ago", examples: ["tú", "mucho"], tip: "Like English 'oo' in 'food' but shorter." },
  // Consonants - Strong
  { id: "rr", symbol: "rr", name: "Rolled RR", category: "consonant", score: 28, attempts: 62, trend: "improving", lastPracticed: "1h ago", examples: ["perro", "carro", "arroz"], tip: "Tongue tip vibrates against the alveolar ridge. Try saying 'butter' fast — that's the starting position." },
  { id: "r", symbol: "r", name: "Single R (tap)", category: "consonant", score: 52, attempts: 55, trend: "improving", lastPracticed: "1h ago", examples: ["pero", "caro", "tres"], tip: "Quick single tap of tongue tip. Like the 'tt' in American 'butter'." },
  { id: "j", symbol: "j/g", name: "Jota (fricative)", category: "consonant", score: 65, attempts: 30, trend: "stable", lastPracticed: "1d ago", examples: ["rojo", "gente"], tip: "Scraping sound from back of throat. Stronger than English 'h'." },
  { id: "ñ", symbol: "ñ", name: "Eñe (palatal nasal)", category: "consonant", score: 72, attempts: 28, trend: "improving", lastPracticed: "1d ago", examples: ["año", "niño", "España"], tip: "Like 'ny' in 'canyon'. Middle of tongue touches roof of mouth." },
  { id: "ll", symbol: "ll/y", name: "Ll (palatal)", category: "consonant", score: 78, attempts: 32, trend: "stable", lastPracticed: "2d ago", examples: ["calle", "pollo"], tip: "Like English 'y' in 'yes' for most dialects. In Argentina, more like 'sh'." },
  { id: "b-v", symbol: "b/v", name: "B/V (bilabial)", category: "consonant", score: 60, attempts: 25, trend: "declining", lastPracticed: "3d ago", examples: ["vivir", "beber"], tip: "Between vowels, lips barely touch (soft 'b'). NOT like English 'v' with teeth!" },
  { id: "d-soft", symbol: "d", name: "Soft D (between vowels)", category: "consonant", score: 55, attempts: 22, trend: "new", lastPracticed: "5d ago", examples: ["nada", "todo", "ciudad"], tip: "Between vowels, tongue barely touches teeth — like English 'th' in 'the'." },
  { id: "g-soft", symbol: "g", name: "Soft G (between vowels)", category: "consonant", score: 58, attempts: 20, trend: "new", lastPracticed: "5d ago", examples: ["agua", "amigo"], tip: "Between vowels, back of tongue approaches but doesn't touch palate." },
  // Consonants - Good
  { id: "t", symbol: "t", name: "Dental T", category: "consonant", score: 82, attempts: 40, trend: "stable", lastPracticed: "1d ago", examples: ["todo", "tiempo"], tip: "Tongue touches TEETH (not ridge like English). No aspiration." },
  { id: "p", symbol: "p", name: "Unaspirated P", category: "consonant", score: 84, attempts: 38, trend: "stable", lastPracticed: "1d ago", examples: ["papa", "poco"], tip: "No puff of air after it. Hold paper in front — it shouldn't move." },
  { id: "s", symbol: "s", name: "Sibilant S", category: "consonant", score: 88, attempts: 44, trend: "stable", lastPracticed: "2h ago", examples: ["sí", "casa"], tip: "Clean 's' sound. In some dialects, weakened to 'h' at end of syllable." },
  // Special combinations
  { id: "diphthong-ie", symbol: "ie", name: "Diphthong IE", category: "special", score: 70, attempts: 18, trend: "improving", lastPracticed: "2d ago", examples: ["tierra", "siempre"], tip: "Quick glide from 'ee' to 'eh'. Both vowels in one syllable." },
  { id: "diphthong-ue", symbol: "ue", name: "Diphthong UE", category: "special", score: 68, attempts: 15, trend: "stable", lastPracticed: "3d ago", examples: ["fuego", "puerta"], tip: "Quick glide from 'oo' to 'eh'. Keep it smooth and fast." },
  { id: "stress", symbol: "´", name: "Word Stress", category: "special", score: 62, attempts: 50, trend: "improving", lastPracticed: "1h ago", examples: ["teléfono", "médico"], tip: "Spanish stress is predictable. Words ending in vowel/n/s: stress 2nd-to-last. Others: stress last syllable." },
];

const FRENCH_PHONEMES: PhonemeData[] = [
  { id: "r-uvular", symbol: "ʁ", name: "Uvular R", category: "consonant", score: 32, attempts: 40, trend: "improving", lastPracticed: "2h ago", examples: ["rouge", "Paris"], tip: "Gargle position — back of tongue near uvula. NOT English R!" },
  { id: "u-front", symbol: "y", name: "Front U", category: "vowel", score: 45, attempts: 30, trend: "improving", lastPracticed: "3h ago", examples: ["tu", "lune"], tip: "Say 'ee', then round lips without moving tongue. That's French 'u'." },
  { id: "nasal-on", symbol: "ɔ̃", name: "Nasal ON", category: "special", score: 58, attempts: 25, trend: "stable", lastPracticed: "1d ago", examples: ["bon", "maison"], tip: "Say 'oh' with air through nose. No 'n' at the end!" },
  { id: "nasal-an", symbol: "ɑ̃", name: "Nasal AN", category: "special", score: 52, attempts: 22, trend: "new", lastPracticed: "2d ago", examples: ["dans", "enfant"], tip: "Open 'ah' with nasal resonance. Distinct from 'on' — more open." },
  { id: "nasal-in", symbol: "ɛ̃", name: "Nasal IN", category: "special", score: 48, attempts: 20, trend: "declining", lastPracticed: "4d ago", examples: ["vin", "matin"], tip: "Like 'eh' but through the nose. Keep mouth more open than 'an'." },
  { id: "eu-open", symbol: "œ", name: "Open EU", category: "vowel", score: 40, attempts: 18, trend: "new", lastPracticed: "5d ago", examples: ["peur", "heure"], tip: "Like 'eh' with rounded lips. Think of saying 'uh' with lips pushed forward." },
  { id: "liaison", symbol: "‿", name: "Liaison", category: "special", score: 55, attempts: 30, trend: "improving", lastPracticed: "1d ago", examples: ["les amis", "un ami"], tip: "Connect final consonant to next word's vowel. 'les amis' = 'leh-zah-mee'." },
];

const JAPANESE_PHONEMES: PhonemeData[] = [
  // Special - Pitch Accent & Mora
  { id: "jp-pitch-hl", symbol: "HL", name: "High-Low Pitch", category: "special", score: 35, attempts: 28, trend: "improving", lastPracticed: "1d ago", examples: ["箸 (hashi)", "橋 (hashi)"], tip: "Japanese pitch accent distinguishes meaning. 箸 (chopsticks) = HL, 橋 (bridge) = LH. Listen for the drop." },
  { id: "jp-pitch-lh", symbol: "LH", name: "Low-High Pitch", category: "special", score: 32, attempts: 25, trend: "new", lastPracticed: "2d ago", examples: ["雨 (ame)", "飴 (ame)"], tip: "Low start rising to high. 雨 (rain) = LH, 飴 (candy) = HL. Pitch matters more than stress in Japanese." },
  { id: "jp-mora", symbol: "モーラ", name: "Mora Timing", category: "special", score: 40, attempts: 30, trend: "improving", lastPracticed: "1d ago", examples: ["おばあさん", "きって"], tip: "Each mora gets equal time. Long vowels (ā) and っ (geminate) each count as one mora. Don't rush them." },
  { id: "jp-long-vowel", symbol: "ー", name: "Long Vowels", category: "vowel", score: 48, attempts: 22, trend: "improving", lastPracticed: "2d ago", examples: ["おばさん vs おばあさん", "ビル vs ビール"], tip: "Hold the vowel for exactly two beats. おばさん (aunt) vs おばあさん (grandmother) — length changes meaning!" },
  // Consonants
  { id: "jp-tsu", symbol: "つ", name: "Tsu (affricate)", category: "consonant", score: 42, attempts: 35, trend: "improving", lastPracticed: "3h ago", examples: ["つき", "つなみ"], tip: "Start with tongue at 't' position, release into 'su'. NOT 'too' — the 'ts' is one sound." },
  { id: "jp-fu", symbol: "ふ", name: "Fu (bilabial)", category: "consonant", score: 55, attempts: 28, trend: "stable", lastPracticed: "1d ago", examples: ["ふじさん", "ふね"], tip: "NOT English 'f' (teeth on lip). Blow air through both lips gently, like blowing out a candle softly." },
  { id: "jp-r", symbol: "ら", name: "R-tap (flap)", category: "consonant", score: 38, attempts: 40, trend: "improving", lastPracticed: "2h ago", examples: ["さくら", "りんご"], tip: "Single quick tap of tongue tip on ridge — between English 'l', 'd', and 'r'. Like the 'tt' in 'butter'." },
  { id: "jp-n-syllabic", symbol: "ん", name: "Syllabic N", category: "consonant", score: 60, attempts: 20, trend: "stable", lastPracticed: "1d ago", examples: ["さんぽ", "しんぶん"], tip: "Standalone mora — changes pronunciation based on next sound: 'm' before b/p, 'ng' before k/g, 'n' elsewhere." },
  { id: "jp-geminate", symbol: "っ", name: "Geminate (double consonant)", category: "special", score: 44, attempts: 32, trend: "improving", lastPracticed: "4h ago", examples: ["きって", "がっこう"], tip: "Hold the silence for one beat before the consonant. きて (come) vs きって (stamp) — the pause is the difference." },
  { id: "jp-palatal", symbol: "きゃ", name: "Palatalized Sounds", category: "consonant", score: 62, attempts: 18, trend: "stable", lastPracticed: "2d ago", examples: ["きゃく", "しゃしん"], tip: "Combine consonant with 'y' glide: ki+ya=kya, shi+ya=sha. Keep it one syllable, not two." },
  { id: "jp-wo", symbol: "を", name: "Particle Wo", category: "special", score: 72, attempts: 15, trend: "stable", lastPracticed: "3d ago", examples: ["本を読む", "水を飲む"], tip: "Pronounced 'o' in modern Japanese (same as お). Written を only as object particle." },
];

const KOREAN_PHONEMES: PhonemeData[] = [
  // Consonants - Aspirated
  { id: "kr-k-asp", symbol: "ㅋ", name: "Aspirated K", category: "consonant", score: 52, attempts: 30, trend: "improving", lastPracticed: "1d ago", examples: ["코 (nose)", "크다 (big)"], tip: "Strong puff of air with 'k'. Hold paper in front — it should move. Stronger than English 'k'." },
  { id: "kr-t-asp", symbol: "ㅌ", name: "Aspirated T", category: "consonant", score: 50, attempts: 28, trend: "stable", lastPracticed: "1d ago", examples: ["타다 (ride)", "토끼 (rabbit)"], tip: "Explosive 't' with heavy breath. Tongue hits alveolar ridge with maximum air release." },
  { id: "kr-p-asp", symbol: "ㅍ", name: "Aspirated P", category: "consonant", score: 55, attempts: 25, trend: "stable", lastPracticed: "2d ago", examples: ["파 (green onion)", "피 (blood)"], tip: "Strong 'p' with forceful air burst. Lips pop open with noticeable aspiration." },
  { id: "kr-ch-asp", symbol: "ㅊ", name: "Aspirated Ch", category: "consonant", score: 48, attempts: 22, trend: "improving", lastPracticed: "2d ago", examples: ["차 (tea/car)", "치마 (skirt)"], tip: "Breathy 'ch' sound. More air than English 'ch' in 'church'." },
  // Consonants - Tense (doubled)
  { id: "kr-kk", symbol: "ㄲ", name: "Tense KK", category: "consonant", score: 35, attempts: 35, trend: "improving", lastPracticed: "3h ago", examples: ["까치 (magpie)", "꽃 (flower)"], tip: "Tighten throat, NO air puff. Like 'k' in 'sky' but with more tension. Glottis constricts." },
  { id: "kr-tt", symbol: "ㄸ", name: "Tense TT", category: "consonant", score: 33, attempts: 32, trend: "new", lastPracticed: "4h ago", examples: ["따다 (pick)", "뜨다 (float)"], tip: "Tight, stiff 't' with no aspiration. Vocal cords tense up before release. Think 'stiff'." },
  { id: "kr-pp", symbol: "ㅃ", name: "Tense PP", category: "consonant", score: 30, attempts: 30, trend: "declining", lastPracticed: "5h ago", examples: ["빠르다 (fast)", "빵 (bread)"], tip: "Tight 'p' — lips pressed firmly, no air escapes. Glottal tension is key. Not just a hard 'p'." },
  { id: "kr-ss", symbol: "ㅆ", name: "Tense SS", category: "consonant", score: 38, attempts: 28, trend: "improving", lastPracticed: "1d ago", examples: ["쓰다 (write)", "씨 (seed)"], tip: "Tense, sharp 's'. Tongue pressed harder against ridge than regular ㅅ. More hissing intensity." },
  { id: "kr-jj", symbol: "ㅉ", name: "Tense JJ", category: "consonant", score: 36, attempts: 26, trend: "new", lastPracticed: "2d ago", examples: ["짜다 (salty)", "찌개 (stew)"], tip: "Tense 'j/ch' — throat tight, no breath. Like saying 'j' while holding your breath." },
  // Vowels
  { id: "kr-eu", symbol: "ㅡ", name: "Eu (unrounded)", category: "vowel", score: 28, attempts: 38, trend: "improving", lastPracticed: "2h ago", examples: ["으르다", "그"], tip: "Spread lips (like smiling) but tongue is HIGH and BACK. No English equivalent — between 'oo' and 'uh'." },
  { id: "kr-eo", symbol: "ㅓ", name: "Eo (open o)", category: "vowel", score: 42, attempts: 30, trend: "stable", lastPracticed: "1d ago", examples: ["어머니 (mother)", "서울"], tip: "Open 'o' — mouth more open than English 'oh'. Between 'uh' and 'aw'. NOT the same as ㅗ." },
  { id: "kr-ae", symbol: "ㅐ/ㅔ", name: "Ae/E merger", category: "vowel", score: 58, attempts: 20, trend: "stable", lastPracticed: "3d ago", examples: ["개 (dog)", "게 (crab)"], tip: "In modern Korean, ㅐ and ㅔ sound nearly identical (like 'eh'). Context distinguishes them." },
  // Special - Final consonants
  { id: "kr-batchim", symbol: "받침", name: "Final Consonants", category: "special", score: 40, attempts: 35, trend: "improving", lastPracticed: "1d ago", examples: ["밥 (rice)", "국 (soup)", "빛 (light)"], tip: "Korean final consonants are UNRELEASED — lips/tongue move to position but don't release air. 밥 ends with closed lips." },
  { id: "kr-linking", symbol: "연음", name: "Consonant Linking", category: "special", score: 45, attempts: 25, trend: "improving", lastPracticed: "2d ago", examples: ["먹어 → 머거", "읽어 → 일거"], tip: "Final consonant links to next syllable's vowel. 먹어 (eat) sounds like '머거'. This is automatic in natural speech." },
];

const GERMAN_PHONEMES: PhonemeData[] = [
  // Vowels - Umlauts
  { id: "de-ae", symbol: "ä", name: "A-Umlaut", category: "vowel", score: 55, attempts: 30, trend: "stable", lastPracticed: "1d ago", examples: ["Mädchen", "Käse"], tip: "Like English 'e' in 'bed'. Mouth open, tongue forward. Short ä = 'eh', long ä = 'ay' without the glide." },
  { id: "de-oe", symbol: "ö", name: "O-Umlaut", category: "vowel", score: 38, attempts: 35, trend: "improving", lastPracticed: "3h ago", examples: ["schön", "Öl"], tip: "Say 'ay' (as in 'say') but round your lips into an 'o' shape. Tongue stays forward while lips round." },
  { id: "de-ue", symbol: "ü", name: "U-Umlaut", category: "vowel", score: 35, attempts: 38, trend: "improving", lastPracticed: "2h ago", examples: ["über", "Tür"], tip: "Say 'ee' but round your lips tightly. Same as French 'u'. Tongue high-front, lips rounded." },
  // Consonants
  { id: "de-ich", symbol: "ç", name: "Ich-Laut (palatal)", category: "consonant", score: 42, attempts: 32, trend: "improving", lastPracticed: "4h ago", examples: ["ich", "Milch", "Chemie"], tip: "Tongue arches toward hard palate, air hisses through. Like an aggressive 'h' in 'hue'. After front vowels (i,e,ä,ö,ü)." },
  { id: "de-ach", symbol: "x", name: "Ach-Laut (velar)", category: "consonant", score: 48, attempts: 28, trend: "stable", lastPracticed: "1d ago", examples: ["ach", "Buch", "noch"], tip: "Back of tongue near velum — like clearing throat gently. After back vowels (a, o, u). Deeper than ich-laut." },
  { id: "de-r", symbol: "ʁ", name: "Uvular R", category: "consonant", score: 40, attempts: 40, trend: "improving", lastPracticed: "2h ago", examples: ["rot", "Brücke"], tip: "Uvular fricative or trill — back of tongue vibrates near uvula. Like gargling. NOT English 'r'." },
  { id: "de-r-vocal", symbol: "ɐ", name: "Vocalized R", category: "consonant", score: 52, attempts: 25, trend: "stable", lastPracticed: "1d ago", examples: ["Vater", "Uhr", "hier"], tip: "After vowels and in -er endings, R becomes a schwa-like 'ah'. Vater = 'fah-tah'. Don't pronounce the R!" },
  { id: "de-final-devoice", symbol: "b→p", name: "Final Devoicing", category: "special", score: 45, attempts: 30, trend: "improving", lastPracticed: "1d ago", examples: ["Hund→Hunt", "Tag→Tak", "Grab→Grap"], tip: "Voiced consonants (b,d,g) become voiceless (p,t,k) at syllable end. 'Hund' sounds like 'Hunt'. Automatic rule!" },
  { id: "de-pf", symbol: "pf", name: "Pf (affricate)", category: "consonant", score: 50, attempts: 20, trend: "stable", lastPracticed: "2d ago", examples: ["Pferd", "Apfel"], tip: "Both sounds in rapid succession: lips close for 'p' then release into 'f'. One combined sound, not two separate ones." },
  { id: "de-z", symbol: "ts", name: "Z (affricate)", category: "consonant", score: 65, attempts: 22, trend: "stable", lastPracticed: "2d ago", examples: ["Zeit", "Katze"], tip: "German 'z' = English 'ts' as in 'cats'. Always this sound, never English 'z' buzz." },
  { id: "de-ss", symbol: "ß", name: "Eszett (sharp S)", category: "consonant", score: 70, attempts: 18, trend: "stable", lastPracticed: "3d ago", examples: ["Straße", "groß"], tip: "Always voiceless 's' (like 'ss'). Appears after long vowels/diphthongs. Straße = 'shtrah-seh'." },
  { id: "de-st-sp", symbol: "ʃt/ʃp", name: "St/Sp (initial)", category: "special", score: 58, attempts: 24, trend: "stable", lastPracticed: "2d ago", examples: ["Straße", "Sprache", "Stein"], tip: "At word/syllable start, 'st' = 'sht' and 'sp' = 'shp'. Straße = 'SHTrah-seh'. Mid-word stays normal." },
];

const ITALIAN_PHONEMES: PhonemeData[] = [
  // Consonants - Gemination
  { id: "it-geminate", symbol: "CC", name: "Double Consonants", category: "consonant", score: 38, attempts: 40, trend: "improving", lastPracticed: "2h ago", examples: ["fatto vs fato", "notte vs note"], tip: "Hold the consonant longer — it's a real duration difference. 'fatto' (done) vs 'fato' (fate). The pause is meaning!" },
  { id: "it-rolled-r", symbol: "rr", name: "Rolled R (trill)", category: "consonant", score: 30, attempts: 45, trend: "improving", lastPracticed: "1h ago", examples: ["carro", "terra"], tip: "Multiple tongue-tip vibrations against alveolar ridge. Start with 'drrr' to get the trill going. Practice with 'tre'." },
  { id: "it-r-single", symbol: "r", name: "Single R (tap)", category: "consonant", score: 55, attempts: 35, trend: "stable", lastPracticed: "3h ago", examples: ["caro", "sera"], tip: "Single quick tap — like Spanish single R or American 'butter'. Just one flick of the tongue tip." },
  { id: "it-gli", symbol: "ʎ", name: "Gli (palatal lateral)", category: "consonant", score: 42, attempts: 28, trend: "improving", lastPracticed: "1d ago", examples: ["famiglia", "figlio", "aglio"], tip: "Tongue blade against hard palate — like 'lli' in 'million' but more palatal. NOT 'glee'." },
  { id: "it-gn", symbol: "ɲ", name: "Gn (palatal nasal)", category: "consonant", score: 58, attempts: 25, trend: "stable", lastPracticed: "1d ago", examples: ["gnocchi", "bagno", "ognuno"], tip: "Like Spanish ñ or 'ny' in 'canyon'. Middle of tongue presses against palate. One sound, not g+n." },
  { id: "it-sc", symbol: "ʃ", name: "Sc before e/i", category: "consonant", score: 62, attempts: 20, trend: "stable", lastPracticed: "2d ago", examples: ["pesce", "scienza"], tip: "'Sc' before e/i = English 'sh'. 'Pesce' (fish) = 'peh-sheh'. Before a/o/u it stays 'sk'." },
  // Vowels - Open/Closed
  { id: "it-e-open", symbol: "ɛ", name: "Open E (è)", category: "vowel", score: 45, attempts: 30, trend: "improving", lastPracticed: "4h ago", examples: ["bello", "caffè", "perché"], tip: "Wide open 'eh' — like English 'bed'. Mouth opens more. Grave accent (è) marks this in writing." },
  { id: "it-e-closed", symbol: "e", name: "Closed E (é)", category: "vowel", score: 48, attempts: 28, trend: "stable", lastPracticed: "1d ago", examples: ["sera", "perché", "e (and)"], tip: "Tighter 'ay' without the glide — lips slightly spread. Acute accent (é) marks this. More tense than open E." },
  { id: "it-o-open", symbol: "ɔ", name: "Open O (ò)", category: "vowel", score: 43, attempts: 26, trend: "new", lastPracticed: "2d ago", examples: ["buono", "uomo", "cosa"], tip: "Wide open 'aw' — jaw drops, lips round loosely. Like British 'hot'. Distinct from closed O." },
  { id: "it-o-closed", symbol: "o", name: "Closed O (ó)", category: "vowel", score: 50, attempts: 24, trend: "stable", lastPracticed: "2d ago", examples: ["nome", "sole", "come"], tip: "Tight 'oh' — lips round firmly, smaller opening. Like 'oh!' in surprise. No diphthong." },
  { id: "it-z-voiced", symbol: "dz", name: "Z voiced (zanzara)", category: "consonant", score: 52, attempts: 18, trend: "stable", lastPracticed: "3d ago", examples: ["zero", "zanzara"], tip: "Voiced 'dz' — vocal cords vibrate. Like 'ds' in 'beds'. Usually at word start or between vowels." },
  { id: "it-z-voiceless", symbol: "ts", name: "Z voiceless (pizza)", category: "consonant", score: 60, attempts: 20, trend: "stable", lastPracticed: "2d ago", examples: ["pizza", "grazie", "stazione"], tip: "Voiceless 'ts' — like 'ts' in 'cats'. Usually when doubled (zz) or in -zione endings." },
];

const PORTUGUESE_PHONEMES: PhonemeData[] = [
  // Nasal vowels
  { id: "pt-nasal-ao", symbol: "ão", name: "Nasal ÃO", category: "special", score: 30, attempts: 38, trend: "improving", lastPracticed: "2h ago", examples: ["não", "coração", "irmão"], tip: "Start with open 'ah', nasalize, then glide to nasal 'oo'. One diphthong, all through the nose. Most distinctive Portuguese sound!" },
  { id: "pt-nasal-a", symbol: "ã", name: "Nasal A", category: "vowel", score: 35, attempts: 32, trend: "improving", lastPracticed: "3h ago", examples: ["lã", "manhã", "irmã"], tip: "Open 'ah' but air flows through nose. Like French 'an' but more open. Soft palate stays lowered." },
  { id: "pt-nasal-em", symbol: "ẽ", name: "Nasal EM/EN", category: "vowel", score: 40, attempts: 28, trend: "stable", lastPracticed: "1d ago", examples: ["bem", "tempo", "sempre"], tip: "Nasalized 'eh' — like saying 'en' in French 'enfant'. Air through nose, no final 'n' or 'm' sound." },
  { id: "pt-nasal-im", symbol: "ĩ", name: "Nasal IM/IN", category: "vowel", score: 42, attempts: 25, trend: "stable", lastPracticed: "2d ago", examples: ["sim", "fim", "vinho"], tip: "Nasalized 'ee' — say 'ee' with air through nose. Vinho = 'vee-nyoo' with nasal 'ee'." },
  // Digraphs
  { id: "pt-lh", symbol: "lh", name: "Lh (palatal lateral)", category: "consonant", score: 45, attempts: 30, trend: "improving", lastPracticed: "1d ago", examples: ["filho", "trabalho", "olho"], tip: "Like Italian 'gli' or 'lli' in 'million'. Tongue blade against hard palate. NOT 'l' + 'h'." },
  { id: "pt-nh", symbol: "nh", name: "Nh (palatal nasal)", category: "consonant", score: 50, attempts: 28, trend: "stable", lastPracticed: "1d ago", examples: ["vinho", "banho", "senhor"], tip: "Like Spanish ñ or 'ny' in 'canyon'. One sound, tongue middle touches palate. Vinho = 'vee-nyoo'." },
  // Vowels - Open/Closed
  { id: "pt-e-open", symbol: "ɛ", name: "Open E", category: "vowel", score: 48, attempts: 22, trend: "stable", lastPracticed: "2d ago", examples: ["café", "pé", "festa"], tip: "Wide 'eh' like English 'bed'. Marked with acute accent (é) in stressed position. Mouth opens more." },
  { id: "pt-o-open", symbol: "ɔ", name: "Open O", category: "vowel", score: 45, attempts: 24, trend: "improving", lastPracticed: "1d ago", examples: ["avó", "pode", "sol"], tip: "Open 'aw' — jaw drops, lips loosely rounded. Avó (grandmother) vs avô (grandfather) = open vs closed." },
  { id: "pt-o-closed", symbol: "ô", name: "Closed O", category: "vowel", score: 52, attempts: 20, trend: "stable", lastPracticed: "2d ago", examples: ["avô", "bolo", "todo"], tip: "Tight 'oh' with firm lip rounding. Avô (grandfather) has this sound. Smaller mouth opening than open O." },
  // Special - Regional
  { id: "pt-s-final", symbol: "ʃ/s", name: "Final S (EU vs BR)", category: "special", score: 38, attempts: 30, trend: "new", lastPracticed: "3d ago", examples: ["dois (EU: doysh, BR: doys)", "mas"], tip: "European Portuguese: final 's' = 'sh'. Brazilian: stays 's'. 'Dois' = 'doysh' (PT) or 'doys' (BR)." },
  { id: "pt-r-guttural", symbol: "ʁ", name: "R guttural (initial/rr)", category: "consonant", score: 42, attempts: 35, trend: "improving", lastPracticed: "4h ago", examples: ["rato", "carro", "Rio"], tip: "Initial R and 'rr' = French-style uvular or 'h' sound (varies by region). Rio = 'Hee-oo' in many dialects." },
  { id: "pt-r-tap", symbol: "ɾ", name: "R tap (between vowels)", category: "consonant", score: 58, attempts: 22, trend: "stable", lastPracticed: "1d ago", examples: ["caro", "para", "era"], tip: "Single tongue tap between vowels — like Spanish single R or American 'butter'. Quick and light." },
  { id: "pt-di-dji", symbol: "dʒi", name: "D before i (Brazilian)", category: "special", score: 55, attempts: 18, trend: "stable", lastPracticed: "2d ago", examples: ["dia → djia", "cidade → cidadji"], tip: "In Brazilian Portuguese, 'd' before 'i' becomes 'dj' (like 'j' in 'judge'). Dia = 'djee-ah'." },
];

const MANDARIN_PHONEMES: PhonemeData[] = [
  // Tones
  { id: "zh-tone1", symbol: "ˉ", name: "1st Tone (high flat)", category: "special", score: 55, attempts: 40, trend: "stable", lastPracticed: "1d ago", examples: ["妈 mā (mother)", "天 tiān (sky)"], tip: "High, flat, sustained pitch — like singing a steady high note. Keep it level, don't let it drop or rise." },
  { id: "zh-tone2", symbol: "ˊ", name: "2nd Tone (rising)", category: "special", score: 45, attempts: 38, trend: "improving", lastPracticed: "3h ago", examples: ["麻 má (hemp)", "人 rén (person)"], tip: "Rising from mid to high — like asking 'What?!' in English. Start mid-range and sweep up decisively." },
  { id: "zh-tone3", symbol: "ˇ", name: "3rd Tone (dip)", category: "special", score: 32, attempts: 45, trend: "improving", lastPracticed: "1h ago", examples: ["马 mǎ (horse)", "你 nǐ (you)"], tip: "Low dipping tone — falls then rises (or just stays low before another syllable). The hardest tone! Think 'creaky low voice'." },
  { id: "zh-tone4", symbol: "ˋ", name: "4th Tone (falling)", category: "special", score: 60, attempts: 35, trend: "stable", lastPracticed: "2h ago", examples: ["骂 mà (scold)", "大 dà (big)"], tip: "Sharp fall from high to low — like giving a stern command. Short and decisive, like saying 'No!' angrily." },
  { id: "zh-tone5", symbol: "·", name: "Neutral Tone", category: "special", score: 48, attempts: 25, trend: "new", lastPracticed: "1d ago", examples: ["吗 ma", "的 de", "了 le"], tip: "Light, short, unstressed — pitch depends on preceding tone. Like an afterthought. Never emphasized." },
  // Initials - Retroflex
  { id: "zh-zh", symbol: "zh", name: "Zh (retroflex)", category: "consonant", score: 38, attempts: 35, trend: "improving", lastPracticed: "2h ago", examples: ["中 zhōng", "知 zhī"], tip: "Curl tongue tip back to touch palate, then release with voice. Like 'j' in 'judge' but tongue curled back further." },
  { id: "zh-ch", symbol: "ch", name: "Ch (retroflex aspirated)", category: "consonant", score: 40, attempts: 32, trend: "improving", lastPracticed: "3h ago", examples: ["吃 chī", "车 chē"], tip: "Retroflex + aspiration — tongue curled back, strong air puff on release. Like 'ch' in 'church' but tongue further back." },
  { id: "zh-sh", symbol: "sh", name: "Sh (retroflex fricative)", category: "consonant", score: 52, attempts: 28, trend: "stable", lastPracticed: "1d ago", examples: ["是 shì", "书 shū"], tip: "Tongue curled back, air hisses through. Deeper/darker than English 'sh'. Tongue tip points to palate." },
  { id: "zh-r", symbol: "r", name: "R (retroflex approximant)", category: "consonant", score: 35, attempts: 30, trend: "new", lastPracticed: "2d ago", examples: ["人 rén", "日 rì"], tip: "Tongue curled back like 'zh' but with buzzing voice and no full contact. Between English 'r' and 'zh'. Unique sound!" },
  // Initials - Palatal
  { id: "zh-j", symbol: "j", name: "J (palatal unaspirated)", category: "consonant", score: 50, attempts: 25, trend: "stable", lastPracticed: "1d ago", examples: ["鸡 jī", "家 jiā"], tip: "Tongue blade touches hard palate — like 'j' in 'jeep' but NO aspiration and tongue is flatter against palate." },
  { id: "zh-q", symbol: "q", name: "Q (palatal aspirated)", category: "consonant", score: 42, attempts: 28, trend: "improving", lastPracticed: "4h ago", examples: ["七 qī", "去 qù"], tip: "Same position as 'j' but with strong air puff. Like 'ch' in 'cheese' but tongue flatter against palate. NOT English 'kw'!" },
  { id: "zh-x", symbol: "x", name: "X (palatal fricative)", category: "consonant", score: 44, attempts: 26, trend: "improving", lastPracticed: "3h ago", examples: ["西 xī", "学 xué"], tip: "Air hisses between tongue blade and hard palate. Like 'sh' but tongue further forward. Between English 's' and 'sh'." },
  // Finals
  { id: "zh-uan", symbol: "üan", name: "Üan final", category: "vowel", score: 36, attempts: 22, trend: "new", lastPracticed: "3d ago", examples: ["圆 yuán", "全 quán"], tip: "Rounded front vowel + 'an'. Start with lips rounded for 'ü', glide through 'a', end with 'n'. Three elements in one syllable." },
  { id: "zh-ian", symbol: "ian", name: "Ian final", category: "vowel", score: 48, attempts: 20, trend: "stable", lastPracticed: "2d ago", examples: ["天 tiān", "年 nián"], tip: "Actually pronounced 'ien' — the 'a' is really 'e'. Tiān sounds like 'tyen'. Don't say 'tee-an'." },
  { id: "zh-asp-pair", symbol: "b/p", name: "Aspirated pairs", category: "special", score: 50, attempts: 30, trend: "stable", lastPracticed: "1d ago", examples: ["八 bā vs 怕 pà", "大 dà vs 他 tā"], tip: "b/d/g/j/z/zh = unaspirated (no air puff). p/t/k/q/c/ch = aspirated (strong air). Both are voiceless! Not voiced vs voiceless like English." },
];

const LANGUAGE_SETS: LanguagePhonemeSet[] = [
  { language: "Spanish", flag: "🇪🇸", phonemes: SPANISH_PHONEMES },
  { language: "French", flag: "🇫🇷", phonemes: FRENCH_PHONEMES },
  { language: "Japanese", flag: "🇯🇵", phonemes: JAPANESE_PHONEMES },
  { language: "Korean", flag: "🇰🇷", phonemes: KOREAN_PHONEMES },
  { language: "German", flag: "🇩🇪", phonemes: GERMAN_PHONEMES },
  { language: "Italian", flag: "🇮🇹", phonemes: ITALIAN_PHONEMES },
  { language: "Portuguese", flag: "🇵🇹", phonemes: PORTUGUESE_PHONEMES },
  { language: "Mandarin", flag: "🇨🇳", phonemes: MANDARIN_PHONEMES },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────
function getHeatColor(score: number): string {
  if (score >= 85) return "#10B981"; // green - mastered
  if (score >= 70) return "#3B82F6"; // blue - good
  if (score >= 50) return "#F59E0B"; // amber - developing
  if (score >= 30) return "#F97316"; // orange - needs work
  return "#EF4444"; // red - struggling
}

function getHeatLabel(score: number): string {
  if (score >= 85) return "Mastered";
  if (score >= 70) return "Good";
  if (score >= 50) return "Developing";
  if (score >= 30) return "Needs Work";
  return "Struggling";
}

function getTrendIcon(trend: string): string {
  switch (trend) {
    case "improving": return "trending-up";
    case "declining": return "trending-down";
    case "new": return "sparkles";
    default: return "remove";
  }
}

function getTrendColor(trend: string, colors: any): string {
  switch (trend) {
    case "improving": return "#10B981";
    case "declining": return "#EF4444";
    case "new": return "#8B5CF6";
    default: return colors.muted;
  }
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export default function PronunciationHeatMapScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ language?: string; source?: string }>();
  const [selectedLanguage, setSelectedLanguage] = useState(params.language || "Spanish");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "vowel" | "consonant" | "special">("all");
  const [sortBy, setSortBy] = useState<"score" | "attempts" | "trend">("score");
  const [expandedPhoneme, setExpandedPhoneme] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const currentSet = LANGUAGE_SETS.find(s => s.language === selectedLanguage) || LANGUAGE_SETS[0];
  
  const filteredPhonemes = currentSet.phonemes
    .filter(p => selectedCategory === "all" || p.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === "score") return a.score - b.score; // worst first
      if (sortBy === "attempts") return b.attempts - a.attempts;
      // trend: declining > new > improving > stable
      const trendOrder = { declining: 0, new: 1, improving: 2, stable: 3 };
      return (trendOrder[a.trend] || 3) - (trendOrder[b.trend] || 3);
    });

  // Stats
  const avgScore = Math.round(currentSet.phonemes.reduce((sum, p) => sum + p.score, 0) / currentSet.phonemes.length);
  const struggling = currentSet.phonemes.filter(p => p.score < 50).length;
  const mastered = currentSet.phonemes.filter(p => p.score >= 85).length;
  const totalAttempts = currentSet.phonemes.reduce((sum, p) => sum + p.attempts, 0);

  const handlePhonemeTap = (phoneme: PhonemeData) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedPhoneme(expandedPhoneme === phoneme.id ? null : phoneme.id);
  };

  const handleDrillPress = (phoneme: PhonemeData) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/pronunciation-drill" as any,
      params: { word: phoneme.examples.join(","), category: phoneme.name },
    });
  };

  const [srsAdded, setSrsAdded] = useState(false);
  const [srsAddedCount, setSrsAddedCount] = useState(0);

  const handleAddToSRS = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const phonemeCards: PhonemeCardData[] = currentSet.phonemes.map(p => ({
      phonemeId: p.id,
      symbol: p.symbol,
      name: p.name,
      language: currentSet.language,
      score: p.score,
      examples: p.examples,
      tip: p.tip,
      category: p.category,
    }));
    const count = await addStrugglingPhonemesToSRS(phonemeCards, 50);
    setSrsAdded(true);
    setSrsAddedCount(count);
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Pronunciation Heat Map</Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
              {params.source === "call" ? "After your last call" : "Your sound accuracy"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/phoneme-progress-history" as any)}
            style={[styles.viewToggle, { backgroundColor: colors.surface, marginRight: 8 }]}
          >
            <Ionicons name="stats-chart" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            style={[styles.viewToggle, { backgroundColor: colors.surface }]}
          >
            <Ionicons name={viewMode === "grid" ? "list" : "grid"} size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Language Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langRow}>
          {LANGUAGE_SETS.map(set => (
            <TouchableOpacity
              key={set.language}
              onPress={() => setSelectedLanguage(set.language)}
              style={[
                styles.langChip,
                { backgroundColor: selectedLanguage === set.language ? colors.primary : colors.surface },
              ]}
            >
              <Text style={styles.langFlag}>{set.flag}</Text>
              <Text style={[styles.langLabel, { color: selectedLanguage === set.language ? "#fff" : colors.foreground }]}>
                {set.language}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Overview Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: getHeatColor(avgScore) }]}>{avgScore}%</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Avg Score</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: "#EF4444" }]}>{struggling}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Struggling</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: "#10B981" }]}>{mastered}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Mastered</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{totalAttempts}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Attempts</Text>
            </View>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          {[
            { label: "Struggling", color: "#EF4444" },
            { label: "Needs Work", color: "#F97316" },
            { label: "Developing", color: "#F59E0B" },
            { label: "Good", color: "#3B82F6" },
            { label: "Mastered", color: "#10B981" },
          ].map(item => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: colors.muted }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Category Filter */}
        <View style={styles.filterRow}>
          {(["all", "vowel", "consonant", "special"] as const).map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedCategory === cat ? colors.primary + "20" : colors.surface,
                  borderColor: selectedCategory === cat ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.filterLabel, { color: selectedCategory === cat ? colors.primary : colors.muted }]}>
                {cat === "all" ? "All Sounds" : cat === "vowel" ? "Vowels" : cat === "consonant" ? "Consonants" : "Special"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sort */}
        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, { color: colors.muted }]}>Sort by:</Text>
          {(["score", "attempts", "trend"] as const).map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => setSortBy(s)}
              style={[styles.sortChip, { backgroundColor: sortBy === s ? colors.primary + "15" : "transparent" }]}
            >
              <Text style={[styles.sortText, { color: sortBy === s ? colors.primary : colors.muted }]}>
                {s === "score" ? "Weakest First" : s === "attempts" ? "Most Practiced" : "Needs Attention"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Heat Map Grid View */}
        {viewMode === "grid" ? (
          <View style={styles.gridContainer}>
            {filteredPhonemes.map(phoneme => (
              <TouchableOpacity
                key={phoneme.id}
                onPress={() => handlePhonemeTap(phoneme)}
                style={[
                  styles.gridCell,
                  {
                    backgroundColor: getHeatColor(phoneme.score) + "20",
                    borderColor: getHeatColor(phoneme.score),
                    borderWidth: expandedPhoneme === phoneme.id ? 2 : 1,
                  },
                ]}
              >
                <Text style={[styles.gridSymbol, { color: getHeatColor(phoneme.score) }]}>{phoneme.symbol}</Text>
                <Text style={[styles.gridScore, { color: colors.foreground }]}>{phoneme.score}%</Text>
                <Ionicons
                  name={getTrendIcon(phoneme.trend) as any}
                  size={10}
                  color={getTrendColor(phoneme.trend, colors)}
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          /* List View */
          <View style={styles.listContainer}>
            {filteredPhonemes.map(phoneme => (
              <TouchableOpacity
                key={phoneme.id}
                onPress={() => handlePhonemeTap(phoneme)}
                style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.listScoreBadge, { backgroundColor: getHeatColor(phoneme.score) + "20" }]}>
                  <Text style={[styles.listScoreText, { color: getHeatColor(phoneme.score) }]}>{phoneme.score}%</Text>
                </View>
                <View style={styles.listInfo}>
                  <View style={styles.listNameRow}>
                    <Text style={[styles.listSymbol, { color: colors.foreground }]}>{phoneme.symbol}</Text>
                    <Text style={[styles.listName, { color: colors.foreground }]}>{phoneme.name}</Text>
                  </View>
                  <Text style={[styles.listExamples, { color: colors.muted }]}>
                    {phoneme.examples.join(", ")}
                  </Text>
                </View>
                <View style={styles.listRight}>
                  <Ionicons
                    name={getTrendIcon(phoneme.trend) as any}
                    size={16}
                    color={getTrendColor(phoneme.trend, colors)}
                  />
                  <Text style={[styles.listAttempts, { color: colors.muted }]}>{phoneme.attempts}x</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Expanded Phoneme Detail */}
        {expandedPhoneme && (() => {
          const phoneme = currentSet.phonemes.find(p => p.id === expandedPhoneme);
          if (!phoneme) return null;
          return (
            <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: getHeatColor(phoneme.score) }]}>
              <View style={styles.detailHeader}>
                <View>
                  <Text style={[styles.detailSymbol, { color: getHeatColor(phoneme.score) }]}>{phoneme.symbol}</Text>
                  <Text style={[styles.detailName, { color: colors.foreground }]}>{phoneme.name}</Text>
                </View>
                <View style={[styles.detailScoreBadge, { backgroundColor: getHeatColor(phoneme.score) }]}>
                  <Text style={styles.detailScoreText}>{phoneme.score}%</Text>
                  <Text style={styles.detailScoreLabel}>{getHeatLabel(phoneme.score)}</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${phoneme.score}%`, backgroundColor: getHeatColor(phoneme.score) }]} />
              </View>

              {/* Stats row */}
              <View style={styles.detailStatsRow}>
                <View style={styles.detailStat}>
                  <Ionicons name="repeat" size={14} color={colors.muted} />
                  <Text style={[styles.detailStatText, { color: colors.muted }]}>{phoneme.attempts} attempts</Text>
                </View>
                <View style={styles.detailStat}>
                  <Ionicons name={getTrendIcon(phoneme.trend) as any} size={14} color={getTrendColor(phoneme.trend, colors)} />
                  <Text style={[styles.detailStatText, { color: getTrendColor(phoneme.trend, colors) }]}>
                    {phoneme.trend.charAt(0).toUpperCase() + phoneme.trend.slice(1)}
                  </Text>
                </View>
                <View style={styles.detailStat}>
                  <Ionicons name="time" size={14} color={colors.muted} />
                  <Text style={[styles.detailStatText, { color: colors.muted }]}>{phoneme.lastPracticed || "Never"}</Text>
                </View>
              </View>

              {/* Tip */}
              <View style={[styles.tipBox, { backgroundColor: getHeatColor(phoneme.score) + "10" }]}>
                <Ionicons name="bulb" size={16} color={getHeatColor(phoneme.score)} />
                <Text style={[styles.tipText, { color: colors.foreground }]}>{phoneme.tip}</Text>
              </View>

              {/* Examples */}
              <View style={styles.examplesRow}>
                {phoneme.examples.map((ex, i) => (
                  <View key={i} style={[styles.exampleChip, { backgroundColor: colors.background }]}>
                    <Text style={[styles.exampleText, { color: colors.foreground }]}>{ex}</Text>
                  </View>
                ))}
              </View>

              {/* Drill button */}
              <TouchableOpacity
                onPress={() => handleDrillPress(phoneme)}
                style={[styles.drillBtn, { backgroundColor: getHeatColor(phoneme.score) }]}
              >
                <Ionicons name="fitness" size={18} color="#fff" />
                <Text style={styles.drillBtnText}>Practice This Sound</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* Weak Sounds Summary */}
        {struggling > 0 && (
          <View style={[styles.weakSummary, { backgroundColor: "#EF4444" + "10", borderColor: "#EF4444" + "30" }]}>
            <View style={styles.weakHeader}>
              <Ionicons name="warning" size={20} color="#EF4444" />
              <Text style={[styles.weakTitle, { color: colors.foreground }]}>Focus Areas</Text>
            </View>
            <Text style={[styles.weakDesc, { color: colors.muted }]}>
              These sounds need the most attention. Tap any to start a targeted drill.
            </Text>
            <View style={styles.weakList}>
              {currentSet.phonemes
                .filter(p => p.score < 50)
                .sort((a, b) => a.score - b.score)
                .map(p => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => handleDrillPress(p)}
                    style={[styles.weakItem, { backgroundColor: colors.surface }]}
                  >
                    <Text style={[styles.weakSymbol, { color: "#EF4444" }]}>{p.symbol}</Text>
                    <View style={styles.weakInfo}>
                      <Text style={[styles.weakName, { color: colors.foreground }]}>{p.name}</Text>
                      <View style={[styles.weakBar, { backgroundColor: colors.border }]}>
                        <View style={[styles.weakBarFill, { width: `${p.score}%`, backgroundColor: getHeatColor(p.score) }]} />
                      </View>
                    </View>
                    <Text style={[styles.weakScore, { color: getHeatColor(p.score) }]}>{p.score}%</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}

        {/* Add Weak Sounds to SRS */}
        {struggling > 0 && (
          <View style={[styles.srsSection, { backgroundColor: "#8B5CF6" + "10", borderColor: "#8B5CF6" + "30" }]}>
            <View style={styles.srsHeader}>
              <Ionicons name="repeat" size={20} color="#8B5CF6" />
              <Text style={[styles.srsTitle, { color: colors.foreground }]}>Spaced Repetition</Text>
            </View>
            <Text style={[styles.srsDesc, { color: colors.muted }]}>
              {srsAdded
                ? srsAddedCount > 0
                  ? `Added ${srsAddedCount} weak sound${srsAddedCount > 1 ? "s" : ""} to your review queue. They'll resurface at optimal intervals.`
                  : "All weak sounds are already in your review queue."
                : `Add ${struggling} struggling sound${struggling > 1 ? "s" : ""} to your SRS queue for automatic resurfacing at optimal intervals.`}
            </Text>
            {!srsAdded ? (
              <TouchableOpacity
                onPress={handleAddToSRS}
                style={[styles.srsBtn, { backgroundColor: "#8B5CF6" }]}
              >
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={styles.srsBtnText}>Add Weak Sounds to SRS</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.srsDoneBadge, { backgroundColor: "#8B5CF6" + "20" }]}>
                <Ionicons name="checkmark-circle" size={18} color="#8B5CF6" />
                <Text style={[styles.srsDoneText, { color: "#8B5CF6" }]}>Added to Review Queue</Text>
              </View>
            )}
          </View>
        )}

        {/* Recommended Drills */}
        <View style={[styles.drillsSection, { borderColor: colors.border }]}>
          <Text style={[styles.drillsTitle, { color: colors.foreground }]}>Recommended Drills</Text>
          <Text style={[styles.drillsDesc, { color: colors.muted }]}>
            Based on your heat map, here's what to practice next:
          </Text>
          {currentSet.phonemes
            .filter(p => p.score < 60)
            .sort((a, b) => a.score - b.score)
            .slice(0, 3)
            .map((p, i) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => handleDrillPress(p)}
                style={[styles.drillItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.drillNumber, { backgroundColor: getHeatColor(p.score) }]}>
                  <Text style={styles.drillNumberText}>{i + 1}</Text>
                </View>
                <View style={styles.drillItemInfo}>
                  <Text style={[styles.drillItemTitle, { color: colors.foreground }]}>
                    {p.name} ({p.symbol})
                  </Text>
                  <Text style={[styles.drillItemDesc, { color: colors.muted }]}>
                    {p.score}% accuracy • {p.attempts} attempts • {p.examples.slice(0, 2).join(", ")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </TouchableOpacity>
            ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  viewToggle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  langRow: { paddingHorizontal: 16, marginBottom: 12 },
  langChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  langFlag: { fontSize: 16, marginRight: 6 },
  langLabel: { fontSize: 13, fontWeight: "600" },
  statsCard: { marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 30 },
  legendRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10 },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  filterLabel: { fontSize: 12, fontWeight: "500" },
  sortRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 12, gap: 6 },
  sortLabel: { fontSize: 12 },
  sortChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  sortText: { fontSize: 11, fontWeight: "500" },
  // Grid view
  gridContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8, marginBottom: 16 },
  gridCell: { width: (SCREEN_WIDTH - 24 - 32) / 4, aspectRatio: 1, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 2 },
  gridSymbol: { fontSize: 16, fontWeight: "700" },
  gridScore: { fontSize: 10, fontWeight: "600" },
  // List view
  listContainer: { paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, gap: 12 },
  listScoreBadge: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  listScoreText: { fontSize: 13, fontWeight: "700" },
  listInfo: { flex: 1 },
  listNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  listSymbol: { fontSize: 16, fontWeight: "700" },
  listName: { fontSize: 13, fontWeight: "500" },
  listExamples: { fontSize: 11, marginTop: 2 },
  listRight: { alignItems: "center", gap: 2 },
  listAttempts: { fontSize: 10 },
  // Detail card
  detailCard: { marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 2, marginBottom: 16 },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  detailSymbol: { fontSize: 32, fontWeight: "700" },
  detailName: { fontSize: 14, fontWeight: "500", marginTop: 2 },
  detailScoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignItems: "center" },
  detailScoreText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  detailScoreLabel: { fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 1 },
  progressTrack: { height: 6, borderRadius: 3, marginBottom: 12 },
  progressFill: { height: 6, borderRadius: 3 },
  detailStatsRow: { flexDirection: "row", gap: 16, marginBottom: 12 },
  detailStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailStatText: { fontSize: 12 },
  tipBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10, marginBottom: 12 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18 },
  examplesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  exampleChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  exampleText: { fontSize: 13, fontWeight: "500" },
  drillBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12 },
  drillBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  // Weak sounds
  weakSummary: { marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  weakHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  weakTitle: { fontSize: 16, fontWeight: "700" },
  weakDesc: { fontSize: 12, marginBottom: 12 },
  weakList: { gap: 8 },
  weakItem: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 10, gap: 10 },
  weakSymbol: { fontSize: 18, fontWeight: "700", width: 30, textAlign: "center" },
  weakInfo: { flex: 1 },
  weakName: { fontSize: 12, fontWeight: "500", marginBottom: 4 },
  weakBar: { height: 4, borderRadius: 2 },
  weakBarFill: { height: 4, borderRadius: 2 },
  weakScore: { fontSize: 13, fontWeight: "700" },
  // SRS section
  srsSection: { marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  srsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  srsTitle: { fontSize: 16, fontWeight: "700" },
  srsDesc: { fontSize: 12, marginBottom: 12, lineHeight: 18 },
  srsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12 },
  srsBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  srsDoneBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  srsDoneText: { fontSize: 13, fontWeight: "600" },
  // Recommended drills
  drillsSection: { marginHorizontal: 16, borderTopWidth: 1, paddingTop: 16, marginBottom: 16 },
  drillsTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  drillsDesc: { fontSize: 12, marginBottom: 12 },
  drillItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
  drillNumber: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  drillNumberText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  drillItemInfo: { flex: 1 },
  drillItemTitle: { fontSize: 13, fontWeight: "600" },
  drillItemDesc: { fontSize: 11, marginTop: 2 },
});
