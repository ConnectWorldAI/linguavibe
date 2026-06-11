/**
 * Cultural Music Styles Configuration
 * 
 * Defines music style parameters organized by culture and language.
 * Used to train our music generation API on culturally-appropriate music
 * for each language being learned. Sources include @classicalmusicreel
 * (classical), @zeta93fm (salsa/Latin), and curriculum data.
 * 
 * Each culture has:
 * - Classical/historical music traditions
 * - Modern/popular music styles
 * - Instruments associated with the culture
 * - Mood/emotional characteristics
 * - Key composers/artists for reference
 */

export interface CulturalMusicStyle {
  /** Culture/language identifier */
  id: string;
  /** Display name */
  name: string;
  /** Associated languages */
  languages: string[];
  /** Classical music tradition */
  classical: {
    style: string;
    composers: string[];
    instruments: string[];
    mood: string[];
    era: string;
    /** Musical vocabulary terms in the target language */
    vocabularyTerms: string[];
  };
  /** Modern/popular music tradition */
  modern: {
    genres: string[];
    artists: string[];
    instruments: string[];
    mood: string[];
  };
  /** Study music style (for background during lessons) */
  studyMusic: {
    style: string;
    tempo: "slow" | "moderate" | "varied";
    instruments: string[];
  };
  /** Tags for Suno API music generation */
  generationTags: string[];
}

export const CULTURAL_MUSIC_STYLES: CulturalMusicStyle[] = [
  // ─── European Classical Traditions ────────────────────────────────────────────

  {
    id: "italian_classical",
    name: "Italian Classical & Opera",
    languages: ["Italian"],
    classical: {
      style: "bel_canto_opera",
      composers: ["Verdi", "Puccini", "Rossini", "Vivaldi", "Monteverdi", "Paganini"],
      instruments: ["voice", "orchestra", "violin", "piano"],
      mood: ["dramatic", "passionate", "lyrical", "triumphant"],
      era: "Baroque → Romantic (1600–1900)",
      vocabularyTerms: [
        "forte", "piano", "allegro", "adagio", "crescendo", "diminuendo",
        "soprano", "tenore", "baritono", "aria", "libretto", "opera",
        "concerto", "sonata", "vivace", "andante", "presto", "staccato",
        "legato", "fortissimo", "pianissimo", "mezzo", "sforzando"
      ],
    },
    modern: {
      genres: ["Italian pop", "cantautore", "Italo disco", "Mediterranean"],
      artists: ["Andrea Bocelli", "Laura Pausini", "Eros Ramazzotti", "Zucchero"],
      instruments: ["guitar", "piano", "synthesizer", "mandolin"],
      mood: ["romantic", "warm", "melodic"],
    },
    studyMusic: {
      style: "Vivaldi-inspired baroque, gentle strings",
      tempo: "moderate",
      instruments: ["violin", "harpsichord", "cello"],
    },
    generationTags: ["italian, operatic, orchestral, dramatic, classical"],
  },

  {
    id: "german_romantic",
    name: "German Romantic & Symphonic",
    languages: ["German"],
    classical: {
      style: "symphonic_romantic",
      composers: ["Beethoven", "Bach", "Wagner", "Brahms", "Strauss", "Schumann", "Mendelssohn", "Handel"],
      instruments: ["full_orchestra", "piano", "organ", "brass"],
      mood: ["powerful", "intellectual", "heroic", "contemplative"],
      era: "Baroque → Late Romantic (1685–1910)",
      vocabularyTerms: [
        "Sinfonie", "Konzert", "Lied", "Oper", "Ouvertüre", "Fuge",
        "Takt", "Tonleiter", "Akkord", "Melodie", "Rhythmus", "Harmonie",
        "Dirigent", "Orchester", "Geige", "Klavier", "Cello", "Flöte"
      ],
    },
    modern: {
      genres: ["Krautrock", "electronic", "Neue Deutsche Welle", "techno"],
      artists: ["Kraftwerk", "Rammstein", "Nena", "Scorpions"],
      instruments: ["synthesizer", "electric guitar", "drums", "electronic"],
      mood: ["precise", "powerful", "atmospheric"],
    },
    studyMusic: {
      style: "Bach-inspired counterpoint, structured and focused",
      tempo: "moderate",
      instruments: ["piano", "organ", "strings"],
    },
    generationTags: ["german, symphonic, orchestral, powerful, classical, romantic"],
  },

  {
    id: "french_impressionist",
    name: "French Impressionist & Chanson",
    languages: ["French"],
    classical: {
      style: "impressionist_atmospheric",
      composers: ["Debussy", "Ravel", "Saint-Saëns", "Berlioz", "Fauré", "Satie"],
      instruments: ["piano", "woodwinds", "harp", "strings"],
      mood: ["dreamy", "ethereal", "elegant", "mysterious"],
      era: "Romantic → Impressionist (1830–1930)",
      vocabularyTerms: [
        "chanson", "mélodie", "rythme", "harmonie", "orchestre",
        "compositeur", "partition", "solfège", "gamme", "accord",
        "mesure", "tempo", "nuance", "interprétation", "virtuose"
      ],
    },
    modern: {
      genres: ["chanson française", "French pop", "French house", "yé-yé"],
      artists: ["Édith Piaf", "Stromae", "Daft Punk", "Zaz", "Angèle"],
      instruments: ["accordion", "piano", "synthesizer", "guitar"],
      mood: ["romantic", "sophisticated", "playful"],
    },
    studyMusic: {
      style: "Debussy/Satie-inspired, gentle piano with ambient textures",
      tempo: "slow",
      instruments: ["piano", "harp", "flute"],
    },
    generationTags: ["french, impressionist, piano, dreamy, elegant, atmospheric"],
  },

  {
    id: "russian_romantic",
    name: "Russian Romantic & Epic",
    languages: ["Russian"],
    classical: {
      style: "epic_romantic",
      composers: ["Tchaikovsky", "Rachmaninoff", "Stravinsky", "Prokofiev", "Shostakovich", "Mussorgsky"],
      instruments: ["full_orchestra", "piano", "brass", "percussion"],
      mood: ["emotional", "epic", "melancholic", "triumphant"],
      era: "Romantic → Modern (1840–1970)",
      vocabularyTerms: [
        "симфония (simfoniya)", "концерт (kontsert)", "опера (opera)",
        "балет (balet)", "оркестр (orkestr)", "дирижёр (dirizhyor)",
        "скрипка (skripka)", "фортепиано (fortepiano)", "виолончель (violonchel)"
      ],
    },
    modern: {
      genres: ["Russian pop", "bard music", "Russian rock", "electronic"],
      artists: ["Kino", "DDT", "Zemfira", "t.A.T.u."],
      instruments: ["guitar", "piano", "synthesizer", "balalaika"],
      mood: ["soulful", "intense", "melancholic"],
    },
    studyMusic: {
      style: "Rachmaninoff-inspired piano, deep and contemplative",
      tempo: "slow",
      instruments: ["piano", "cello", "strings"],
    },
    generationTags: ["russian, epic, orchestral, emotional, piano, romantic"],
  },

  {
    id: "spanish_classical",
    name: "Spanish Classical & Flamenco",
    languages: ["Spanish"],
    classical: {
      style: "rhythmic_nationalistic",
      composers: ["De Falla", "Albéniz", "Granados", "Rodrigo", "Turina"],
      instruments: ["guitar", "orchestra", "castanets", "piano"],
      mood: ["passionate", "rhythmic", "fiery", "nostalgic"],
      era: "Romantic → Nationalist (1850–1950)",
      vocabularyTerms: [
        "guitarra", "flamenco", "compás", "palmas", "cante",
        "baile", "toque", "rasgueo", "zapateado", "duende",
        "copla", "seguidilla", "fandango", "bulería", "soleá"
      ],
    },
    modern: {
      genres: ["flamenco", "reggaeton", "Latin pop", "salsa", "bachata"],
      artists: ["Paco de Lucía", "Rosalía", "Bad Bunny", "Shakira"],
      instruments: ["guitar", "cajón", "percussion", "synthesizer"],
      mood: ["passionate", "energetic", "sensual"],
    },
    studyMusic: {
      style: "Classical guitar, Rodrigo-inspired, warm and focused",
      tempo: "moderate",
      instruments: ["classical guitar", "piano", "strings"],
    },
    generationTags: ["spanish, guitar, flamenco, passionate, rhythmic, latin"],
  },

  // ─── Latin American Traditions ────────────────────────────────────────────────

  {
    id: "puerto_rican_latin",
    name: "Puerto Rican Salsa & Reggaeton",
    languages: ["Spanish (Puerto Rican)"],
    classical: {
      style: "caribbean_classical_fusion",
      composers: ["Héctor Campos Parsi", "Jack Delano", "Rafael Hernández"],
      instruments: ["piano", "strings", "percussion", "cuatro"],
      mood: ["tropical", "rhythmic", "joyful"],
      era: "20th Century Caribbean Classical",
      vocabularyTerms: [
        "salsa", "bomba", "plena", "reggaetón", "cuatro",
        "güiro", "congas", "timbal", "clave", "montuno",
        "sonero", "pregón", "coro", "improvisación"
      ],
    },
    modern: {
      genres: ["salsa", "reggaeton", "trap latino", "bomba", "plena"],
      artists: ["Bad Bunny", "Daddy Yankee", "Héctor Lavoe", "Marc Anthony", "Ozuna"],
      instruments: ["congas", "timbales", "piano", "synthesizer", "808"],
      mood: ["energetic", "party", "rhythmic", "urban"],
    },
    studyMusic: {
      style: "Gentle salsa piano montuno, relaxed Caribbean feel",
      tempo: "moderate",
      instruments: ["piano", "light percussion", "bass"],
    },
    generationTags: ["salsa, latin, caribbean, rhythmic, tropical, puerto rican"],
  },

  {
    id: "brazilian_bossa",
    name: "Brazilian Bossa Nova & Samba",
    languages: ["Portuguese (Brazilian)"],
    classical: {
      style: "nationalist_folk_orchestral",
      composers: ["Villa-Lobos", "Carlos Gomes", "Camargo Guarnieri"],
      instruments: ["guitar", "orchestra", "piano", "berimbau"],
      mood: ["vibrant", "tropical", "rhythmic", "lyrical"],
      era: "Nationalist (1920–1960)",
      vocabularyTerms: [
        "samba", "bossa nova", "forró", "axé", "baião",
        "pandeiro", "cavaquinho", "berimbau", "atabaque",
        "ginga", "batucada", "maracatu", "frevo"
      ],
    },
    modern: {
      genres: ["bossa nova", "samba", "MPB", "funk carioca", "sertanejo"],
      artists: ["Tom Jobim", "Gilberto Gil", "Anitta", "Caetano Veloso"],
      instruments: ["nylon guitar", "percussion", "piano", "cavaquinho"],
      mood: ["smooth", "warm", "rhythmic", "sensual"],
    },
    studyMusic: {
      style: "Bossa nova guitar, gentle and flowing",
      tempo: "slow",
      instruments: ["nylon guitar", "soft percussion", "piano"],
    },
    generationTags: ["brazilian, bossa nova, guitar, smooth, tropical, samba"],
  },

  // ─── East Asian Traditions ────────────────────────────────────────────────────

  {
    id: "japanese_contemporary",
    name: "Japanese Traditional & Contemporary",
    languages: ["Japanese"],
    classical: {
      style: "minimalist_traditional_fusion",
      composers: ["Takemitsu", "Sakamoto", "Joe Hisaishi", "Miki Minoru"],
      instruments: ["koto", "shakuhachi", "shamisen", "orchestra", "piano"],
      mood: ["contemplative", "serene", "precise", "atmospheric"],
      era: "Modern (1950–present)",
      vocabularyTerms: [
        "音楽 (ongaku)", "琴 (koto)", "尺八 (shakuhachi)", "三味線 (shamisen)",
        "雅楽 (gagaku)", "能 (noh)", "歌舞伎 (kabuki)", "和太鼓 (wadaiko)",
        "旋律 (senritsu)", "拍子 (hyoushi)", "調 (chou)"
      ],
    },
    modern: {
      genres: ["J-pop", "city pop", "anime OST", "enka", "visual kei"],
      artists: ["YOASOBI", "Kenshi Yonezu", "Utada Hikaru", "Joe Hisaishi"],
      instruments: ["synthesizer", "piano", "guitar", "electronic"],
      mood: ["melodic", "nostalgic", "energetic", "atmospheric"],
    },
    studyMusic: {
      style: "Studio Ghibli-inspired piano, peaceful and focused",
      tempo: "slow",
      instruments: ["piano", "strings", "flute"],
    },
    generationTags: ["japanese, piano, atmospheric, peaceful, minimalist, anime"],
  },

  {
    id: "korean_traditional",
    name: "Korean Traditional & K-Pop",
    languages: ["Korean"],
    classical: {
      style: "court_music_fusion",
      composers: ["Isang Yun", "Unsuk Chin", "traditional court musicians"],
      instruments: ["gayageum", "haegeum", "daegeum", "janggu", "orchestra"],
      mood: ["graceful", "meditative", "flowing", "ceremonial"],
      era: "Traditional → Contemporary (ancient–present)",
      vocabularyTerms: [
        "음악 (eumak)", "가야금 (gayageum)", "해금 (haegeum)", "대금 (daegeum)",
        "장구 (janggu)", "판소리 (pansori)", "국악 (gugak)", "풍물 (pungmul)",
        "노래 (norae)", "리듬 (rideum)", "멜로디 (mellodi)"
      ],
    },
    modern: {
      genres: ["K-pop", "K-R&B", "K-indie", "trot"],
      artists: ["BTS", "BLACKPINK", "IU", "Zico"],
      instruments: ["synthesizer", "drums", "guitar", "electronic"],
      mood: ["energetic", "polished", "emotional", "catchy"],
    },
    studyMusic: {
      style: "Korean traditional gayageum with ambient pads",
      tempo: "slow",
      instruments: ["gayageum", "piano", "ambient pads"],
    },
    generationTags: ["korean, melodic, kpop, emotional, atmospheric"],
  },

  {
    id: "chinese_traditional",
    name: "Chinese Classical & Contemporary",
    languages: ["Chinese (Mandarin)", "Chinese (Cantonese)"],
    classical: {
      style: "pentatonic_orchestral",
      composers: ["Tan Dun", "Xian Xinghai", "He Zhanhao", "Chen Gang"],
      instruments: ["erhu", "pipa", "guzheng", "dizi", "orchestra"],
      mood: ["flowing", "meditative", "majestic", "poetic"],
      era: "Ancient → Contemporary (ancient–present)",
      vocabularyTerms: [
        "音乐 (yīnyuè)", "二胡 (èrhú)", "琵琶 (pípá)", "古筝 (gǔzhēng)",
        "笛子 (dízi)", "京剧 (jīngjù)", "旋律 (xuánlǜ)", "节奏 (jiézòu)",
        "和声 (héshēng)", "乐器 (yuèqì)", "指挥 (zhǐhuī)"
      ],
    },
    modern: {
      genres: ["C-pop", "Cantopop", "Chinese rock", "Chinese R&B"],
      artists: ["Jay Chou", "Eason Chan", "Faye Wong", "Wang Leehom"],
      instruments: ["piano", "guitar", "synthesizer", "traditional fusion"],
      mood: ["melodic", "romantic", "atmospheric"],
    },
    studyMusic: {
      style: "Guzheng and pipa, traditional Chinese ambient",
      tempo: "slow",
      instruments: ["guzheng", "pipa", "bamboo flute"],
    },
    generationTags: ["chinese, traditional, guzheng, peaceful, pentatonic, ambient"],
  },

  // ─── Middle Eastern & African ─────────────────────────────────────────────────

  {
    id: "arabic_modal",
    name: "Arabic Maqam & Oud",
    languages: ["Arabic (Egyptian)", "Arabic (Levantine)", "Arabic (Gulf)"],
    classical: {
      style: "maqam_based_modal",
      composers: ["Umm Kulthum (performer)", "Mohamed Abdel Wahab", "Farid al-Atrash", "Anouar Brahem"],
      instruments: ["oud", "qanun", "ney", "violin", "percussion"],
      mood: ["meditative", "ornamental", "emotional", "spiritual"],
      era: "Classical Arabic (medieval–present)",
      vocabularyTerms: [
        "موسيقى (musiqa)", "عود (oud)", "قانون (qanun)", "ناي (nay)",
        "مقام (maqam)", "إيقاع (iqaa)", "طرب (tarab)", "تقاسيم (taqasim)",
        "موشح (muwashshah)", "دف (daf)", "رق (riq)"
      ],
    },
    modern: {
      genres: ["Arabic pop", "Khaleeji", "Mahraganat", "Raï"],
      artists: ["Amr Diab", "Fairuz", "Nancy Ajram", "Mohamed Hamaki"],
      instruments: ["oud", "synthesizer", "drums", "violin"],
      mood: ["emotional", "celebratory", "romantic"],
    },
    studyMusic: {
      style: "Oud taqasim, meditative maqam improvisation",
      tempo: "slow",
      instruments: ["oud", "ney", "soft percussion"],
    },
    generationTags: ["arabic, oud, maqam, meditative, middle eastern, modal"],
  },

  {
    id: "west_african",
    name: "West African Rhythmic Traditions",
    languages: ["Swahili", "French (Senegalese)", "Yoruba"],
    classical: {
      style: "polyrhythmic_ceremonial",
      composers: ["Traditional griots", "Fela Kuti (Afrobeat pioneer)"],
      instruments: ["djembe", "kora", "balafon", "talking drum", "shekere"],
      mood: ["rhythmic", "communal", "celebratory", "spiritual"],
      era: "Ancient oral tradition → Modern Afrobeat",
      vocabularyTerms: [
        "ngoma (drum)", "kora", "griot/jeli", "djembe", "balafon",
        "highlife", "afrobeat", "jùjú", "mbalax", "soukous"
      ],
    },
    modern: {
      genres: ["Afrobeats", "Afropop", "highlife", "mbalax", "soukous"],
      artists: ["Burna Boy", "Wizkid", "Youssou N'Dour", "Fela Kuti", "Angélique Kidjo"],
      instruments: ["drums", "guitar", "bass", "horns", "synthesizer"],
      mood: ["joyful", "rhythmic", "energetic", "communal"],
    },
    studyMusic: {
      style: "Gentle kora with ambient percussion",
      tempo: "moderate",
      instruments: ["kora", "soft djembe", "shaker"],
    },
    generationTags: ["african, rhythmic, kora, afrobeat, percussion, joyful"],
  },

  // ─── Eastern European ─────────────────────────────────────────────────────────

  {
    id: "polish_romantic",
    name: "Polish Romantic & Folk",
    languages: ["Polish"],
    classical: {
      style: "romantic_nationalistic",
      composers: ["Chopin", "Penderecki", "Szymanowski", "Lutosławski"],
      instruments: ["piano", "orchestra", "strings"],
      mood: ["nostalgic", "heroic", "melancholic", "virtuosic"],
      era: "Romantic → Modern (1810–present)",
      vocabularyTerms: [
        "muzyka", "fortepian", "polonez", "mazurek", "walc",
        "koncert", "sonata", "preludium", "etiuda", "nokturn"
      ],
    },
    modern: {
      genres: ["Polish rock", "disco polo", "hip-hop", "electronic"],
      artists: ["Dawid Podsiadło", "Sanah", "Taco Hemingway"],
      instruments: ["piano", "guitar", "synthesizer", "drums"],
      mood: ["emotional", "energetic", "nostalgic"],
    },
    studyMusic: {
      style: "Chopin nocturnes-inspired, gentle piano",
      tempo: "slow",
      instruments: ["piano"],
    },
    generationTags: ["polish, piano, romantic, chopin, nocturne, classical"],
  },

  {
    id: "hungarian_folk",
    name: "Hungarian Folk-Classical",
    languages: ["Hungarian"],
    classical: {
      style: "folk_classical_fusion",
      composers: ["Liszt", "Bartók", "Kodály"],
      instruments: ["piano", "violin", "cimbalom", "orchestra"],
      mood: ["fiery", "virtuosic", "folk-inspired", "dramatic"],
      era: "Romantic → Ethnomusicological (1840–1945)",
      vocabularyTerms: [
        "zene", "hegedű", "zongora", "cimbalom", "csárdás",
        "verbunkos", "népdal", "dallam", "ritmus", "hangverseny"
      ],
    },
    modern: {
      genres: ["Hungarian folk revival", "electronic", "rock"],
      artists: ["Muzsikás", "Márta Sebestyén"],
      instruments: ["violin", "cimbalom", "guitar", "electronic"],
      mood: ["passionate", "rhythmic", "folk"],
    },
    studyMusic: {
      style: "Liszt-inspired piano with folk undertones",
      tempo: "varied",
      instruments: ["piano", "violin", "cimbalom"],
    },
    generationTags: ["hungarian, folk, violin, piano, passionate, classical"],
  },
];

// ─── Utility Functions ────────────────────────────────────────────────────────

/**
 * Get music style configuration for a given language.
 */
export function getMusicStyleForLanguage(language: string): CulturalMusicStyle | undefined {
  return CULTURAL_MUSIC_STYLES.find((style) =>
    style.languages.some((lang) => 
      lang.toLowerCase().includes(language.toLowerCase()) ||
      language.toLowerCase().includes(lang.toLowerCase())
    )
  );
}

/**
 * Get generation tags for a specific language's cultural music.
 */
export function getGenerationTagsForLanguage(language: string): string {
  const style = getMusicStyleForLanguage(language);
  return style?.generationTags.join(", ") ?? "educational, melodic, catchy";
}

/**
 * Get study music style description for background music during lessons.
 */
export function getStudyMusicStyle(language: string): { style: string; tempo: string; instruments: string[] } {
  const musicStyle = getMusicStyleForLanguage(language);
  if (!musicStyle) {
    return { style: "lo-fi ambient, gentle piano", tempo: "slow", instruments: ["piano", "ambient pads"] };
  }
  return musicStyle.studyMusic;
}

/**
 * Get musical vocabulary terms for a language (useful for music-themed lessons).
 */
export function getMusicalVocabulary(language: string): string[] {
  const style = getMusicStyleForLanguage(language);
  return style?.classical.vocabularyTerms ?? [];
}

/**
 * Get all available cultural music styles (for admin/debug panel).
 */
export function getAllCulturalMusicStyles(): CulturalMusicStyle[] {
  return CULTURAL_MUSIC_STYLES;
}
