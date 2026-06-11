import os, re
BASE = "/home/ubuntu/linguavibe"

# 1. SPEECH COACH: Multi-language drill packs
sc_path = os.path.join(BASE, "app/speech-coach.tsx")
with open(sc_path, "r") as f:
    sc = f.read()
if "language: string;" not in sc:
    sc = sc.replace('  difficulty: "beginner" | "intermediate" | "advanced";\n  keyFeatures: string[];', '  language: string;\n  difficulty: "beginner" | "intermediate" | "advanced";\n  keyFeatures: string[];')
    sc = sc.replace('id: "parisian", name: "Parisian French", region: "Paris, France", flag: "\U0001f1eb\U0001f1f7",', 'id: "parisian", name: "Parisian French", region: "Paris, France", flag: "\U0001f1eb\U0001f1f7", language: "fr-FR",')
    sc = sc.replace('id: "quebec", name: "Qu\u00e9b\u00e9cois", region: "Quebec, Canada", flag: "\U0001f1e8\U0001f1e6",', 'id: "quebec", name: "Qu\u00e9b\u00e9cois", region: "Quebec, Canada", flag: "\U0001f1e8\U0001f1e6", language: "fr-CA",')
    sc = sc.replace('id: "belgian", name: "Belgian French", region: "Brussels, Belgium", flag: "\U0001f1e7\U0001f1ea",', 'id: "belgian", name: "Belgian French", region: "Brussels, Belgium", flag: "\U0001f1e7\U0001f1ea", language: "fr-BE",')
    sc = sc.replace('id: "swiss", name: "Swiss French", region: "Geneva, Switzerland", flag: "\U0001f1e8\U0001f1ed",', 'id: "swiss", name: "Swiss French", region: "Geneva, Switzerland", flag: "\U0001f1e8\U0001f1ed", language: "fr-CH",')
    sc = sc.replace('id: "african", name: "West African French", region: "Senegal,', 'id: "african", name: "West African French", language: "fr", region: "Senegal,')
    new_profiles = '  // Spanish\n  { id: "castilian", name: "Castilian Spanish", region: "Madrid, Spain", flag: "\U0001f1ea\U0001f1f8", language: "es-ES", description: "Standard European Spanish.", difficulty: "intermediate", keyFeatures: ["Theta for c/z", "Distinction s/z", "Leismo"] },\n  { id: "mexican", name: "Mexican Spanish", region: "Mexico City", flag: "\U0001f1f2\U0001f1fd", language: "es-MX", description: "Clear Latin American Spanish.", difficulty: "beginner", keyFeatures: ["Seseo", "Clear consonants", "Melodic intonation"] },\n  { id: "dominican", name: "Dominican Spanish", region: "Santo Domingo", flag: "\U0001f1e9\U0001f1f4", language: "es-DO", description: "Fast Caribbean Spanish.", difficulty: "advanced", keyFeatures: ["S-aspiration", "R/L neutralization", "Rapid pace"] },\n  // Japanese\n  { id: "tokyo", name: "Standard Japanese", region: "Tokyo, Japan", flag: "\U0001f1ef\U0001f1f5", language: "ja", description: "Standard Tokyo dialect.", difficulty: "intermediate", keyFeatures: ["Pitch accent", "Vowel devoicing", "Geminate consonants"] },\n  { id: "kansai", name: "Kansai Dialect", region: "Osaka, Japan", flag: "\U0001f1ef\U0001f1f5", language: "ja", description: "Lively Osaka dialect.", difficulty: "advanced", keyFeatures: ["Reversed pitch", "Unique vocabulary", "Softer consonants"] },\n  // Mandarin\n  { id: "beijing", name: "Standard Mandarin", region: "Beijing, China", flag: "\U0001f1e8\U0001f1f3", language: "zh-CN", description: "Standard Putonghua.", difficulty: "intermediate", keyFeatures: ["Four tones", "Erhua suffix", "Retroflex consonants"] },\n  { id: "taiwanese", name: "Taiwanese Mandarin", region: "Taipei, Taiwan", flag: "\U0001f1f9\U0001f1fc", language: "zh-TW", description: "Softer Mandarin.", difficulty: "beginner", keyFeatures: ["No retroflex", "Softer tones", "Different vocabulary"] },\n'
    sc = sc.replace('  keyFeatures: ["Rolling R", "Syllable-timed rhythm", "Local vocabulary"] },\n];', '  keyFeatures: ["Rolling R", "Syllable-timed rhythm", "Local vocabulary"] },\n' + new_profiles + '];')
    drill_packs = '\nconst SPANISH_DRILLS: PronunciationDrill[] = [\n  { id: "es1", word: "perro", phonetic: "/pero/", translation: "dog", targetPhoneme: "rr", difficulty: 2 },\n  { id: "es2", word: "jota", phonetic: "/xota/", translation: "letter J", targetPhoneme: "x", difficulty: 1 },\n  { id: "es3", word: "lluvia", phonetic: "/\\u028eu\\u03b2ja/", translation: "rain", targetPhoneme: "\\u028e", difficulty: 2 },\n  { id: "es4", word: "zapato", phonetic: "/\\u03b8apato/", translation: "shoe", targetPhoneme: "\\u03b8", difficulty: 1 },\n  { id: "es5", word: "guitarra", phonetic: "/gitara/", translation: "guitar", targetPhoneme: "rr", difficulty: 2 },\n];\n\nconst JAPANESE_DRILLS: PronunciationDrill[] = [\n  { id: "ja1", word: "\\u308a\\u3087\\u3046\\u308a", phonetic: "/rjo\\u02d0ri/", translation: "cooking", targetPhoneme: "\\u027e", difficulty: 2 },\n  { id: "ja2", word: "\\u3064\\u304d", phonetic: "/ts\\u026fki/", translation: "moon", targetPhoneme: "ts", difficulty: 1 },\n  { id: "ja3", word: "\\u304d\\u3063\\u3066", phonetic: "/kitte/", translation: "stamp", targetPhoneme: "tt", difficulty: 1 },\n  { id: "ja4", word: "\\u304a\\u3093\\u304c\\u304f", phonetic: "/o\\u014b\\u0261ak\\u026f/", translation: "music", targetPhoneme: "\\u014b", difficulty: 1 },\n  { id: "ja5", word: "\\u3061\\u3083", phonetic: "/t\\u0255a/", translation: "tea", targetPhoneme: "t\\u0255", difficulty: 1 },\n];\n\nconst MANDARIN_DRILLS: PronunciationDrill[] = [\n  { id: "zh1", word: "\\u5403", phonetic: "/t\\u0282\\u02b0\\u0268/", translation: "eat", targetPhoneme: "t\\u0282\\u02b0", difficulty: 2 },\n  { id: "zh2", word: "\\u5341", phonetic: "/\\u0282\\u0268/", translation: "ten", targetPhoneme: "\\u0282", difficulty: 1 },\n  { id: "zh3", word: "\\u53bb", phonetic: "/t\\u0255\\u02b0y/", translation: "go", targetPhoneme: "t\\u0255\\u02b0", difficulty: 2 },\n  { id: "zh4", word: "\\u5973", phonetic: "/ny/", translation: "woman", targetPhoneme: "y", difficulty: 1 },\n  { id: "zh5", word: "\\u4eba", phonetic: "/\\u027b\\u0259n/", translation: "person", targetPhoneme: "\\u027b", difficulty: 2 },\n];\n\nfunction getDrillsForAccent(accentId: string): PronunciationDrill[] {\n  const accent = ACCENT_PROFILES.find((a) => a.id === accentId);\n  if (!accent) return DRILLS;\n  if (accent.language.startsWith("es")) return SPANISH_DRILLS;\n  if (accent.language.startsWith("ja")) return JAPANESE_DRILLS;\n  if (accent.language.startsWith("zh")) return MANDARIN_DRILLS;\n  return DRILLS;\n}\n'
    m = re.search(r'(const DRILLS: PronunciationDrill\[\] = \[.*?\];)', sc, re.DOTALL)
    if m:
        sc = sc[:m.end()] + drill_packs + sc[m.end():]
    sc = sc.replace('Speech.speak(drill.word, { language: "fr-FR", rate: 0.8 });', 'Speech.speak(drill.word, { language: selectedAccent?.language || "fr-FR", rate: 0.8 });')
    with open(sc_path, "w") as f:
        f.write(sc)
    print("1/4 Speech Coach: Multi-language drill packs applied")
else:
    print("1/4 Speech Coach: Already applied")

# 2. AI PARTNERS: Memory Timeline
ap_path = os.path.join(BASE, "app/ai-partners.tsx")
with open(ap_path, "r") as f:
    ap = f.read()
if "showTimeline" not in ap:
    ap = ap.replace('const [editedMemory, setEditedMemory] = useState("");', 'const [editedMemory, setEditedMemory] = useState("");\n  const [showTimeline, setShowTimeline] = useState(false);\n  const [memoryTimeline, setMemoryTimeline] = useState<Array<{ id: string; date: number; facts: string[]; sessionCount: number }>>([]);')
    ap = ap.replace('AsyncStorage.getItem(`@ai_partner_memory_${selectedPartner.id}`).then((stored) => {\n        if (stored) setMemoryContext(stored);\n        else setMemoryContext("");\n      }).catch(() => {});', 'AsyncStorage.getItem(`@ai_partner_memory_${selectedPartner.id}`).then((stored) => {\n        if (stored) setMemoryContext(stored);\n        else setMemoryContext("");\n      }).catch(() => {});\n      AsyncStorage.getItem(`@ai_partner_timeline_${selectedPartner.id}`).then((stored) => {\n        if (stored) setMemoryTimeline(JSON.parse(stored));\n        else setMemoryTimeline([]);\n      }).catch(() => {});')
    ap = ap.replace('setMemoryContext(memResult.memory);\n            await AsyncStorage.setItem(`@ai_partner_memory_${partner.id}`, memResult.memory);', 'setMemoryContext(memResult.memory);\n            await AsyncStorage.setItem(`@ai_partner_memory_${partner.id}`, memResult.memory);\n            const timelineEntry = { id: `mem_${Date.now()}`, date: Date.now(), facts: memResult.memory.split("\\n").filter(Boolean).map((l: string) => l.replace(/^[-\u2022]\\s*/, "")), sessionCount: conversations[partner.id]?.messages?.length || 0 };\n            const updatedTimeline = [...memoryTimeline, timelineEntry].slice(-50);\n            setMemoryTimeline(updatedTimeline);\n            await AsyncStorage.setItem(`@ai_partner_timeline_${partner.id}`, JSON.stringify(updatedTimeline));')
    ap = ap.replace('AsyncStorage.removeItem(`@ai_partner_memory_${selectedPartner.id}`)', 'AsyncStorage.removeItem(`@ai_partner_memory_${selectedPartner.id}`);\n                      AsyncStorage.removeItem(`@ai_partner_timeline_${selectedPartner.id}`).catch(() => {});\n                      setMemoryTimeline([]); //')
    ap = ap.replace('<Text style={[styles.memoryClearText, { color: colors.error }]}>Clear Memory</Text>\n                  </TouchableOpacity>', '<Text style={[styles.memoryClearText, { color: colors.error }]}>Clear Memory</Text>\n                  </TouchableOpacity>\n                  <TouchableOpacity onPress={() => setShowTimeline(!showTimeline)} activeOpacity={0.7}>\n                    <Text style={[styles.memoryClearText, { color: colors.primary }]}>{showTimeline ? "Hide Timeline" : "View Timeline"}</Text>\n                  </TouchableOpacity>')
    with open(ap_path, "w") as f:
        f.write(ap)
    print("2/4 AI Partners: Memory Timeline applied")
else:
    print("2/4 AI Partners: Already applied")

# 3. SETTINGS: Add immersion challenges link
st_path = os.path.join(BASE, "app/settings.tsx")
with open(st_path, "r") as f:
    st = f.read()
if "immersion-challenges" not in st:
    st = st.replace('{ icon: "phone-portrait", label: "Immersion Mode", value: "All Day", route: "/immersion-mode" },', '{ icon: "phone-portrait", label: "Immersion Mode", value: "All Day", route: "/immersion-mode" },\n        { icon: "trophy", label: "Immersion Challenges", value: "Daily/Weekly XP", route: "/immersion-challenges" },')
    with open(st_path, "w") as f:
        f.write(st)
    print("3/4 Settings: Immersion Challenges link added")
else:
    print("3/4 Settings: Already has link")

print("4/4 Immersion Challenges screen: created separately")
print("\nAll patches applied!")
