import { Language, Dialect } from "../types";

// Comprehensive language database with regional dialects and slang
export const LANGUAGES: Language[] = [
  // SPANISH
  {
    id: "es",
    name: "Spanish",
    nativeName: "Español",
    code: "es",
    flag: "🇪🇸",
    dialects: [
      { id: "es-do", name: "Dominican Spanish", region: "Dominican Republic", languageId: "es", hasSlang: true },
      { id: "es-co", name: "Colombian Spanish", region: "Colombia", languageId: "es", hasSlang: true },
      { id: "es-ve", name: "Venezuelan Spanish", region: "Venezuela", languageId: "es", hasSlang: true },
      { id: "es-mx", name: "Mexican Spanish", region: "Mexico", languageId: "es", hasSlang: true },
      { id: "es-pr", name: "Puerto Rican Spanish", region: "Puerto Rico", languageId: "es", hasSlang: true },
      { id: "es-cu", name: "Cuban Spanish", region: "Cuba", languageId: "es", hasSlang: true },
      { id: "es-ar", name: "Argentine Spanish", region: "Argentina", languageId: "es", hasSlang: true },
      { id: "es-cl", name: "Chilean Spanish", region: "Chile", languageId: "es", hasSlang: true },
      { id: "es-pe", name: "Peruvian Spanish", region: "Peru", languageId: "es", hasSlang: true },
      { id: "es-ec", name: "Ecuadorian Spanish", region: "Ecuador", languageId: "es", hasSlang: true },
      { id: "es-pa", name: "Panamanian Spanish", region: "Panama", languageId: "es", hasSlang: true },
      { id: "es-hn", name: "Honduran Spanish", region: "Honduras", languageId: "es", hasSlang: true },
      { id: "es-sv", name: "Salvadoran Spanish", region: "El Salvador", languageId: "es", hasSlang: true },
      { id: "es-gt", name: "Guatemalan Spanish", region: "Guatemala", languageId: "es", hasSlang: true },
      { id: "es-uy", name: "Uruguayan Spanish", region: "Uruguay", languageId: "es", hasSlang: true },
      { id: "es-bo", name: "Bolivian Spanish", region: "Bolivia", languageId: "es", hasSlang: true },
      { id: "es-es", name: "Castilian Spanish", region: "Spain", languageId: "es", hasSlang: true },
      { id: "es-an", name: "Andalusian Spanish", region: "Southern Spain", languageId: "es", hasSlang: true },
      { id: "es-ca", name: "Canarian Spanish", region: "Canary Islands", languageId: "es", hasSlang: true },
    ],
  },
  // ENGLISH
  {
    id: "en",
    name: "English",
    nativeName: "English",
    code: "en",
    flag: "🇺🇸",
    dialects: [
      { id: "en-us", name: "American English", region: "United States", languageId: "en", hasSlang: true },
      { id: "en-us-south", name: "Southern American English", region: "Southern US", languageId: "en", hasSlang: true },
      { id: "en-us-nyc", name: "New York English", region: "New York", languageId: "en", hasSlang: true },
      { id: "en-us-aave", name: "African American English", region: "United States", languageId: "en", hasSlang: true },
      { id: "en-gb", name: "British English", region: "United Kingdom", languageId: "en", hasSlang: true },
      { id: "en-gb-cockney", name: "Cockney English", region: "London", languageId: "en", hasSlang: true },
      { id: "en-gb-scot", name: "Scottish English", region: "Scotland", languageId: "en", hasSlang: true },
      { id: "en-ie", name: "Irish English", region: "Ireland", languageId: "en", hasSlang: true },
      { id: "en-au", name: "Australian English", region: "Australia", languageId: "en", hasSlang: true },
      { id: "en-nz", name: "New Zealand English", region: "New Zealand", languageId: "en", hasSlang: true },
      { id: "en-za", name: "South African English", region: "South Africa", languageId: "en", hasSlang: true },
      { id: "en-ng", name: "Nigerian English", region: "Nigeria", languageId: "en", hasSlang: true },
      { id: "en-gh", name: "Ghanaian English", region: "Ghana", languageId: "en", hasSlang: true },
      { id: "en-jm", name: "Jamaican English", region: "Jamaica", languageId: "en", hasSlang: true },
      { id: "en-tt", name: "Trinidadian English", region: "Trinidad", languageId: "en", hasSlang: true },
      { id: "en-in", name: "Indian English", region: "India", languageId: "en", hasSlang: true },
      { id: "en-sg", name: "Singaporean English", region: "Singapore", languageId: "en", hasSlang: true },
      { id: "en-ph", name: "Filipino English", region: "Philippines", languageId: "en", hasSlang: true },
      { id: "en-ca", name: "Canadian English", region: "Canada", languageId: "en", hasSlang: true },
    ],
  },
  // PORTUGUESE
  {
    id: "pt",
    name: "Portuguese",
    nativeName: "Português",
    code: "pt",
    flag: "🇧🇷",
    dialects: [
      { id: "pt-br", name: "Brazilian Portuguese", region: "Brazil", languageId: "pt", hasSlang: true },
      { id: "pt-br-rio", name: "Carioca Portuguese", region: "Rio de Janeiro", languageId: "pt", hasSlang: true },
      { id: "pt-br-sp", name: "Paulista Portuguese", region: "São Paulo", languageId: "pt", hasSlang: true },
      { id: "pt-br-ba", name: "Baiano Portuguese", region: "Bahia", languageId: "pt", hasSlang: true },
      { id: "pt-br-ne", name: "Nordestino Portuguese", region: "Northeast Brazil", languageId: "pt", hasSlang: true },
      { id: "pt-pt", name: "European Portuguese", region: "Portugal", languageId: "pt", hasSlang: true },
      { id: "pt-ao", name: "Angolan Portuguese", region: "Angola", languageId: "pt", hasSlang: true },
      { id: "pt-mz", name: "Mozambican Portuguese", region: "Mozambique", languageId: "pt", hasSlang: true },
      { id: "pt-cv", name: "Cape Verdean Portuguese", region: "Cape Verde", languageId: "pt", hasSlang: true },
    ],
  },
  // FRENCH
  {
    id: "fr",
    name: "French",
    nativeName: "Français",
    code: "fr",
    flag: "🇫🇷",
    dialects: [
      { id: "fr-fr", name: "Metropolitan French", region: "France", languageId: "fr", hasSlang: true },
      { id: "fr-fr-verlan", name: "Verlan French", region: "Urban France", languageId: "fr", hasSlang: true },
      { id: "fr-ca", name: "Québécois French", region: "Quebec, Canada", languageId: "fr", hasSlang: true },
      { id: "fr-be", name: "Belgian French", region: "Belgium", languageId: "fr", hasSlang: true },
      { id: "fr-ch", name: "Swiss French", region: "Switzerland", languageId: "fr", hasSlang: true },
      { id: "fr-sn", name: "Senegalese French", region: "Senegal", languageId: "fr", hasSlang: true },
      { id: "fr-ci", name: "Ivorian French", region: "Côte d'Ivoire", languageId: "fr", hasSlang: true },
      { id: "fr-cd", name: "Congolese French", region: "DR Congo", languageId: "fr", hasSlang: true },
      { id: "fr-cm", name: "Cameroonian French", region: "Cameroon", languageId: "fr", hasSlang: true },
      { id: "fr-ht", name: "Haitian French", region: "Haiti", languageId: "fr", hasSlang: true },
      { id: "fr-mg", name: "Malagasy French", region: "Madagascar", languageId: "fr", hasSlang: true },
    ],
  },
  // ARABIC
  {
    id: "ar",
    name: "Arabic",
    nativeName: "العربية",
    code: "ar",
    flag: "🇸🇦",
    dialects: [
      { id: "ar-msa", name: "Modern Standard Arabic", region: "Pan-Arab", languageId: "ar", hasSlang: false },
      { id: "ar-eg", name: "Egyptian Arabic", region: "Egypt", languageId: "ar", hasSlang: true },
      { id: "ar-lb", name: "Lebanese Arabic", region: "Lebanon", languageId: "ar", hasSlang: true },
      { id: "ar-sy", name: "Syrian Arabic", region: "Syria", languageId: "ar", hasSlang: true },
      { id: "ar-jo", name: "Jordanian Arabic", region: "Jordan", languageId: "ar", hasSlang: true },
      { id: "ar-ps", name: "Palestinian Arabic", region: "Palestine", languageId: "ar", hasSlang: true },
      { id: "ar-iq", name: "Iraqi Arabic", region: "Iraq", languageId: "ar", hasSlang: true },
      { id: "ar-sa", name: "Saudi Arabic", region: "Saudi Arabia", languageId: "ar", hasSlang: true },
      { id: "ar-ae", name: "Emirati Arabic", region: "UAE", languageId: "ar", hasSlang: true },
      { id: "ar-ma", name: "Moroccan Arabic (Darija)", region: "Morocco", languageId: "ar", hasSlang: true },
      { id: "ar-dz", name: "Algerian Arabic", region: "Algeria", languageId: "ar", hasSlang: true },
      { id: "ar-tn", name: "Tunisian Arabic", region: "Tunisia", languageId: "ar", hasSlang: true },
      { id: "ar-sd", name: "Sudanese Arabic", region: "Sudan", languageId: "ar", hasSlang: true },
    ],
  },
  // CHINESE
  {
    id: "zh",
    name: "Chinese",
    nativeName: "中文",
    code: "zh",
    flag: "🇨🇳",
    dialects: [
      { id: "zh-cn", name: "Mandarin (Simplified)", region: "Mainland China", languageId: "zh", hasSlang: true },
      { id: "zh-tw", name: "Mandarin (Traditional)", region: "Taiwan", languageId: "zh", hasSlang: true },
      { id: "zh-hk", name: "Cantonese", region: "Hong Kong", languageId: "zh", hasSlang: true },
      { id: "zh-sg", name: "Singaporean Mandarin", region: "Singapore", languageId: "zh", hasSlang: true },
      { id: "zh-sh", name: "Shanghainese", region: "Shanghai", languageId: "zh", hasSlang: true },
      { id: "zh-sz", name: "Sichuan Dialect", region: "Sichuan", languageId: "zh", hasSlang: true },
    ],
  },
  // HINDI
  {
    id: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    code: "hi",
    flag: "🇮🇳",
    dialects: [
      { id: "hi-in", name: "Standard Hindi", region: "India", languageId: "hi", hasSlang: true },
      { id: "hi-mum", name: "Mumbai Hindi (Bambaiya)", region: "Mumbai", languageId: "hi", hasSlang: true },
      { id: "hi-del", name: "Delhi Hindi", region: "Delhi", languageId: "hi", hasSlang: true },
      { id: "hi-up", name: "UP Hindi", region: "Uttar Pradesh", languageId: "hi", hasSlang: true },
      { id: "hi-bih", name: "Bihari Hindi", region: "Bihar", languageId: "hi", hasSlang: true },
    ],
  },
  // JAPANESE
  {
    id: "ja",
    name: "Japanese",
    nativeName: "日本語",
    code: "ja",
    flag: "🇯🇵",
    dialects: [
      { id: "ja-std", name: "Standard Japanese", region: "Tokyo", languageId: "ja", hasSlang: true },
      { id: "ja-kansai", name: "Kansai Dialect", region: "Osaka/Kyoto", languageId: "ja", hasSlang: true },
      { id: "ja-tohoku", name: "Tohoku Dialect", region: "Northern Japan", languageId: "ja", hasSlang: true },
      { id: "ja-kyushu", name: "Kyushu Dialect", region: "Southern Japan", languageId: "ja", hasSlang: true },
    ],
  },
  // KOREAN
  {
    id: "ko",
    name: "Korean",
    nativeName: "한국어",
    code: "ko",
    flag: "🇰🇷",
    dialects: [
      { id: "ko-kr", name: "Standard Korean (Seoul)", region: "South Korea", languageId: "ko", hasSlang: true },
      { id: "ko-busan", name: "Busan Dialect", region: "Busan", languageId: "ko", hasSlang: true },
      { id: "ko-jeju", name: "Jeju Dialect", region: "Jeju Island", languageId: "ko", hasSlang: true },
      { id: "ko-kp", name: "North Korean Korean", region: "North Korea", languageId: "ko", hasSlang: true },
    ],
  },
  // GERMAN
  {
    id: "de",
    name: "German",
    nativeName: "Deutsch",
    code: "de",
    flag: "🇩🇪",
    dialects: [
      { id: "de-de", name: "Standard German", region: "Germany", languageId: "de", hasSlang: true },
      { id: "de-at", name: "Austrian German", region: "Austria", languageId: "de", hasSlang: true },
      { id: "de-ch", name: "Swiss German", region: "Switzerland", languageId: "de", hasSlang: true },
      { id: "de-bay", name: "Bavarian German", region: "Bavaria", languageId: "de", hasSlang: true },
      { id: "de-ber", name: "Berlin German", region: "Berlin", languageId: "de", hasSlang: true },
    ],
  },
  // ITALIAN
  {
    id: "it",
    name: "Italian",
    nativeName: "Italiano",
    code: "it",
    flag: "🇮🇹",
    dialects: [
      { id: "it-it", name: "Standard Italian", region: "Italy", languageId: "it", hasSlang: true },
      { id: "it-nap", name: "Neapolitan Italian", region: "Naples", languageId: "it", hasSlang: true },
      { id: "it-sic", name: "Sicilian Italian", region: "Sicily", languageId: "it", hasSlang: true },
      { id: "it-rom", name: "Roman Italian", region: "Rome", languageId: "it", hasSlang: true },
      { id: "it-mil", name: "Milanese Italian", region: "Milan", languageId: "it", hasSlang: true },
    ],
  },
  // RUSSIAN
  {
    id: "ru",
    name: "Russian",
    nativeName: "Русский",
    code: "ru",
    flag: "🇷🇺",
    dialects: [
      { id: "ru-ru", name: "Standard Russian", region: "Russia", languageId: "ru", hasSlang: true },
      { id: "ru-mos", name: "Moscow Russian", region: "Moscow", languageId: "ru", hasSlang: true },
      { id: "ru-spb", name: "St. Petersburg Russian", region: "St. Petersburg", languageId: "ru", hasSlang: true },
      { id: "ru-sib", name: "Siberian Russian", region: "Siberia", languageId: "ru", hasSlang: true },
    ],
  },
  // TURKISH
  {
    id: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    code: "tr",
    flag: "🇹🇷",
    dialects: [
      { id: "tr-ist", name: "Istanbul Turkish", region: "Istanbul", languageId: "tr", hasSlang: true },
      { id: "tr-ank", name: "Ankara Turkish", region: "Central Turkey", languageId: "tr", hasSlang: true },
      { id: "tr-bsea", name: "Black Sea Turkish", region: "Black Sea Region", languageId: "tr", hasSlang: true },
    ],
  },
  // SWAHILI
  {
    id: "sw",
    name: "Swahili",
    nativeName: "Kiswahili",
    code: "sw",
    flag: "🇹🇿",
    dialects: [
      { id: "sw-tz", name: "Tanzanian Swahili", region: "Tanzania", languageId: "sw", hasSlang: true },
      { id: "sw-ke", name: "Kenyan Swahili", region: "Kenya", languageId: "sw", hasSlang: true },
      { id: "sw-cd", name: "Congolese Swahili", region: "DR Congo", languageId: "sw", hasSlang: true },
    ],
  },
  // YORUBA
  {
    id: "yo",
    name: "Yoruba",
    nativeName: "Yorùbá",
    code: "yo",
    flag: "🇳🇬",
    dialects: [
      { id: "yo-ng", name: "Nigerian Yoruba", region: "Nigeria", languageId: "yo", hasSlang: true },
      { id: "yo-bj", name: "Beninese Yoruba", region: "Benin", languageId: "yo", hasSlang: true },
    ],
  },
  // IGBO
  {
    id: "ig",
    name: "Igbo",
    nativeName: "Igbo",
    code: "ig",
    flag: "🇳🇬",
    dialects: [
      { id: "ig-ng", name: "Standard Igbo", region: "Nigeria", languageId: "ig", hasSlang: true },
      { id: "ig-ow", name: "Owerri Igbo", region: "Imo State", languageId: "ig", hasSlang: true },
    ],
  },
  // HAUSA
  {
    id: "ha",
    name: "Hausa",
    nativeName: "Hausa",
    code: "ha",
    flag: "🇳🇬",
    dialects: [
      { id: "ha-ng", name: "Nigerian Hausa", region: "Northern Nigeria", languageId: "ha", hasSlang: true },
      { id: "ha-ne", name: "Niger Hausa", region: "Niger", languageId: "ha", hasSlang: true },
      { id: "ha-gh", name: "Ghanaian Hausa", region: "Ghana", languageId: "ha", hasSlang: true },
    ],
  },
  // AMHARIC
  {
    id: "am",
    name: "Amharic",
    nativeName: "አማርኛ",
    code: "am",
    flag: "🇪🇹",
    dialects: [
      { id: "am-et", name: "Standard Amharic", region: "Ethiopia", languageId: "am", hasSlang: true },
      { id: "am-add", name: "Addis Ababa Amharic", region: "Addis Ababa", languageId: "am", hasSlang: true },
    ],
  },
  // ZULU
  {
    id: "zu",
    name: "Zulu",
    nativeName: "isiZulu",
    code: "zu",
    flag: "🇿🇦",
    dialects: [
      { id: "zu-za", name: "Standard Zulu", region: "South Africa", languageId: "zu", hasSlang: true },
    ],
  },
  // THAI
  {
    id: "th",
    name: "Thai",
    nativeName: "ไทย",
    code: "th",
    flag: "🇹🇭",
    dialects: [
      { id: "th-bkk", name: "Central Thai (Bangkok)", region: "Bangkok", languageId: "th", hasSlang: true },
      { id: "th-ne", name: "Isan Thai", region: "Northeast Thailand", languageId: "th", hasSlang: true },
      { id: "th-n", name: "Northern Thai", region: "Chiang Mai", languageId: "th", hasSlang: true },
      { id: "th-s", name: "Southern Thai", region: "Southern Thailand", languageId: "th", hasSlang: true },
    ],
  },
  // VIETNAMESE
  {
    id: "vi",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    code: "vi",
    flag: "🇻🇳",
    dialects: [
      { id: "vi-n", name: "Northern Vietnamese (Hanoi)", region: "Hanoi", languageId: "vi", hasSlang: true },
      { id: "vi-c", name: "Central Vietnamese (Hue)", region: "Hue", languageId: "vi", hasSlang: true },
      { id: "vi-s", name: "Southern Vietnamese (Saigon)", region: "Ho Chi Minh City", languageId: "vi", hasSlang: true },
    ],
  },
  // TAGALOG / FILIPINO
  {
    id: "tl",
    name: "Tagalog",
    nativeName: "Tagalog",
    code: "tl",
    flag: "🇵🇭",
    dialects: [
      { id: "tl-ph", name: "Manila Tagalog", region: "Metro Manila", languageId: "tl", hasSlang: true },
      { id: "tl-vis", name: "Visayan Tagalog", region: "Visayas", languageId: "tl", hasSlang: true },
    ],
  },
  // INDONESIAN
  {
    id: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    code: "id",
    flag: "🇮🇩",
    dialects: [
      { id: "id-jkt", name: "Jakarta Indonesian", region: "Jakarta", languageId: "id", hasSlang: true },
      { id: "id-std", name: "Standard Indonesian", region: "Indonesia", languageId: "id", hasSlang: true },
    ],
  },
  // POLISH
  {
    id: "pl",
    name: "Polish",
    nativeName: "Polski",
    code: "pl",
    flag: "🇵🇱",
    dialects: [
      { id: "pl-pl", name: "Standard Polish", region: "Poland", languageId: "pl", hasSlang: true },
    ],
  },
  // DUTCH
  {
    id: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    code: "nl",
    flag: "🇳🇱",
    dialects: [
      { id: "nl-nl", name: "Netherlands Dutch", region: "Netherlands", languageId: "nl", hasSlang: true },
      { id: "nl-be", name: "Belgian Dutch (Flemish)", region: "Belgium", languageId: "nl", hasSlang: true },
      { id: "nl-sr", name: "Surinamese Dutch", region: "Suriname", languageId: "nl", hasSlang: true },
    ],
  },
  // GREEK
  {
    id: "el",
    name: "Greek",
    nativeName: "Ελληνικά",
    code: "el",
    flag: "🇬🇷",
    dialects: [
      { id: "el-gr", name: "Standard Greek", region: "Greece", languageId: "el", hasSlang: true },
      { id: "el-cy", name: "Cypriot Greek", region: "Cyprus", languageId: "el", hasSlang: true },
    ],
  },
  // HEBREW
  {
    id: "he",
    name: "Hebrew",
    nativeName: "עברית",
    code: "he",
    flag: "🇮🇱",
    dialects: [
      { id: "he-il", name: "Modern Hebrew", region: "Israel", languageId: "he", hasSlang: true },
    ],
  },
  // PERSIAN / FARSI
  {
    id: "fa",
    name: "Persian",
    nativeName: "فارسی",
    code: "fa",
    flag: "🇮🇷",
    dialects: [
      { id: "fa-ir", name: "Iranian Persian", region: "Iran", languageId: "fa", hasSlang: true },
      { id: "fa-af", name: "Dari (Afghan Persian)", region: "Afghanistan", languageId: "fa", hasSlang: true },
      { id: "fa-tj", name: "Tajik Persian", region: "Tajikistan", languageId: "fa", hasSlang: true },
    ],
  },
  // URDU
  {
    id: "ur",
    name: "Urdu",
    nativeName: "اردو",
    code: "ur",
    flag: "🇵🇰",
    dialects: [
      { id: "ur-pk", name: "Pakistani Urdu", region: "Pakistan", languageId: "ur", hasSlang: true },
      { id: "ur-in", name: "Indian Urdu", region: "India", languageId: "ur", hasSlang: true },
    ],
  },
  // BENGALI
  {
    id: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    code: "bn",
    flag: "🇧🇩",
    dialects: [
      { id: "bn-bd", name: "Bangladeshi Bengali", region: "Bangladesh", languageId: "bn", hasSlang: true },
      { id: "bn-in", name: "Indian Bengali (Kolkata)", region: "West Bengal, India", languageId: "bn", hasSlang: true },
    ],
  },
  // PUNJABI
  {
    id: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    code: "pa",
    flag: "🇮🇳",
    dialects: [
      { id: "pa-in", name: "Indian Punjabi", region: "Punjab, India", languageId: "pa", hasSlang: true },
      { id: "pa-pk", name: "Pakistani Punjabi", region: "Punjab, Pakistan", languageId: "pa", hasSlang: true },
    ],
  },
  // CREOLE LANGUAGES
  {
    id: "ht",
    name: "Haitian Creole",
    nativeName: "Kreyòl Ayisyen",
    code: "ht",
    flag: "🇭🇹",
    dialects: [
      { id: "ht-ht", name: "Standard Haitian Creole", region: "Haiti", languageId: "ht", hasSlang: true },
    ],
  },
  {
    id: "pap",
    name: "Papiamento",
    nativeName: "Papiamentu",
    code: "pap",
    flag: "🇨🇼",
    dialects: [
      { id: "pap-cw", name: "Curaçao Papiamento", region: "Curaçao", languageId: "pap", hasSlang: true },
      { id: "pap-aw", name: "Aruban Papiamento", region: "Aruba", languageId: "pap", hasSlang: true },
    ],
  },
];

// Helper functions
export function getLanguageById(id: string): Language | undefined {
  return LANGUAGES.find((lang) => lang.id === id);
}

export function getDialectById(dialectId: string): Dialect | undefined {
  for (const lang of LANGUAGES) {
    const dialect = lang.dialects.find((d) => d.id === dialectId);
    if (dialect) return dialect;
  }
  return undefined;
}

export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find((lang) => lang.code === code);
}

export function getAllDialectsForLanguage(languageId: string): Dialect[] {
  const lang = LANGUAGES.find((l) => l.id === languageId);
  return lang?.dialects || [];
}

export function searchLanguages(query: string): Language[] {
  const q = query.toLowerCase();
  return LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.dialects.some(
        (d) =>
          d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q)
      )
  );
}

// Total count for display
export const TOTAL_LANGUAGES = LANGUAGES.length;
export const TOTAL_DIALECTS = LANGUAGES.reduce(
  (sum, lang) => sum + lang.dialects.length,
  0
);
