// Script to generate Korean, Italian, and German curricula
// with rich culturalHints for every lesson

import fs from 'fs';
import path from 'path';

const KOREAN = {
  code: "ko",
  name: "Korean",
  flag: "🇰🇷",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 95,
  units: [
    {
      id: "ko_a1_u1", title: "안녕! — First Steps", level: "A1", order: 1,
      description: "Korean greetings, Hangul basics, and essential phrases",
      lessons: [
        { id: 'ko_a1_u1_l1', title: "Hangul Consonants", description: "Learn the 14 basic consonants of the Korean alphabet", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 1, culturalHint: "한글 (Hangul) was invented by King Sejong in 1443 to give common people literacy. It's considered one of the most scientific writing systems. Learn: ㄱ (g), ㄴ (n), ㄷ (d), ㄹ (r/l), ㅁ (m), ㅂ (b), ㅅ (s), ㅇ (ng), ㅈ (j), ㅊ (ch), ㅋ (k), ㅌ (t), ㅍ (p), ㅎ (h)" },
        { id: 'ko_a1_u1_l2', title: "Hangul Vowels", description: "Learn the 10 basic vowels and form syllable blocks", category: "speaking", level: "A1", duration: 8, xp: 25, order: 2, culturalHint: "Korean vowels are based on three elements: heaven (ㆍ), earth (ㅡ), and human (ㅣ). Practice syllable blocks: 가 (ga), 나 (na), 다 (da). Every Korean child learns Hangul by age 5 — you can too!" },
        { id: 'ko_a1_u1_l3', title: "Basic Greetings", description: "안녕하세요, 감사합니다, 죄송합니다 — essential polite phrases", category: "grammar", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Korean politeness levels: 존댓말 (formal) vs 반말 (casual). Always use 존댓말 with strangers and elders. Learn: 안녕하세요 (hello), 감사합니다 (thank you), 죄송합니다 (sorry). Bowing accompanies greetings — deeper bow = more respect." },
        { id: 'ko_a1_u1_l4', title: "Numbers & Counting", description: "Native Korean and Sino-Korean number systems", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 4, culturalHint: "Korea has TWO number systems! 하나, 둘, 셋 (native Korean — for counting things, age) and 일, 이, 삼 (Sino-Korean — for dates, money, phone numbers). At a market: '이거 얼마예요?' (How much is this?)" },
        { id: 'ko_a1_u1_l5', title: "At the Convenience Store", description: "Understand a conversation at a 편의점", category: "listening", level: "A1", duration: 6, xp: 25, order: 5, culturalHint: "편의점 (convenience store) culture — Korea has more convenience stores per capita than anywhere. Open 24/7, they sell 삼각김밥 (triangle kimbap), 라면 (ramen), 떡볶이 (tteokbokki). The cashier says '봉투 필요하세요?' (Need a bag?)" },
      ],
    },
    {
      id: "ko_a1_u2", title: "가족과 일상 — Family & Daily Life", level: "A1", order: 2,
      description: "Korean family terms, home life, and daily routines",
      lessons: [
        { id: 'ko_a1_u2_l1', title: "My Korean Family", description: "Family terms including 할머니, 할아버지, 이모, 삼촌", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1, culturalHint: "Korean family terms are extremely specific — different words for older/younger siblings by gender: 오빠 (older brother, said by female), 형 (older brother, said by male), 언니 (older sister, said by female), 누나 (older sister, said by male). 효도 (filial piety) is central to Korean culture." },
        { id: 'ko_a1_u2_l2', title: "Present Tense — Korean Style", description: "Basic verb conjugation with -아/어요 endings", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2, culturalHint: "Korean verbs go at the END of the sentence (SOV order). Practice with daily activities: '저는 김치를 먹어요' (I eat kimchi), '한국어를 공부해요' (I study Korean), '집에서 드라마를 봐요' (I watch dramas at home)." },
        { id: 'ko_a1_u2_l3', title: "My Daily Routine", description: "Describe your day in Korean", category: "writing", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Write about a Korean daily routine: 아침에 밥을 먹어요 (eat rice for breakfast — yes, Koreans eat rice for breakfast!), 지하철을 타요 (take the subway), 회사에 가요 (go to work). Korean meals always include 반찬 (side dishes) and 김치." },
        { id: 'ko_a1_u2_l4', title: "Korean Home Life", description: "Rooms, furniture, and 온돌 (heated floors)", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Korean homes have 온돌 (ondol) — heated floors! You sit, eat, and sleep on the floor. Learn: 방 (room), 부엌 (kitchen), 거실 (living room), 화장실 (bathroom). Always remove shoes at the door — 실내화 (indoor slippers) are provided." },
        { id: 'ko_a1_u2_l5', title: "Reading: A KakaoTalk Chat", description: "Understand informal Korean text messages", category: "reading", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "카카오톡 (KakaoTalk) is Korea's #1 messaging app — everyone uses it. Text slang: ㅋㅋㅋ (hahaha), ㅠㅠ (crying), ㄱㄱ (let's go), ㅇㅇ (yes), ㄴㄴ (no). Read a chat about meeting for 치맥 (chicken + beer)." },
      ],
    },
    {
      id: "ko_a2_u1", title: "길 찾기 — Getting Around", level: "A2", order: 3,
      description: "Navigating Seoul, transportation, and directions",
      lessons: [
        { id: 'ko_a2_u1_l1', title: "Asking for Directions", description: "Navigate Seoul using Korean direction words", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Seoul navigation: '직진하세요' (go straight), '왼쪽으로 가세요' (go left), '오른쪽으로 가세요' (go right). Landmarks: 강남역 (Gangnam Station), 명동 (Myeongdong), 홍대 (Hongdae). The subway announcements are in Korean, English, Chinese, and Japanese!" },
        { id: 'ko_a2_u1_l2', title: "Past Tense — What Happened", description: "Past tense with -았/었어요 endings", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2, culturalHint: "Tell stories about Korean experiences: '어제 한강에서 치맥을 했어요' (Yesterday I had chicken and beer at the Han River). '설날에 할머니 댁에 갔어요' (I went to grandma's house for Lunar New Year)." },
        { id: 'ko_a2_u1_l3', title: "Seoul Transportation", description: "지하철, 버스, 택시 vocabulary", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Korean transport: 지하철 (subway — Seoul has 23 lines!), 버스 (bus), 택시 (taxi), KTX (bullet train to Busan in 2.5 hours). Use T-money card (교통카드) for everything. Learn: '내려요!' (I'm getting off!)" },
        { id: 'ko_a2_u1_l4', title: "Reading: A Subway Map", description: "Follow directions using Seoul's subway system", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Seoul subway: Line 2 (green, circular — goes through 강남, 홍대, 신촌), Line 1 (dark blue — to 인천). Transfer at 환승역. Each station has a number (e.g., 강남 = 222). Learn: 출구 (exit), 환승 (transfer), 방면 (direction)." },
        { id: 'ko_a2_u1_l5', title: "Write About Your Neighborhood", description: "Describe where you live in Korean", category: "writing", level: "A2", duration: 12, xp: 35, order: 5, culturalHint: "Describe a Korean neighborhood: '우리 동네에 편의점이 세 개 있어요' (There are 3 convenience stores in my neighborhood). Include: 카페 (café), 노래방 (karaoke), PC방 (internet café), 찜질방 (jjimjilbang spa)." },
      ],
    },
    {
      id: "ko_a2_u2", title: "음식 — Food & Drink", level: "A2", order: 4,
      description: "Korean cuisine, ordering food, and cooking vocabulary",
      lessons: [
        { id: 'ko_a2_u2_l1', title: "Korean Food Vocabulary", description: "김치, 비빔밥, 삼겹살 — essential dishes", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1, culturalHint: "Korean food culture: 김치 (kimchi — fermented cabbage, eaten with EVERY meal), 비빔밥 (bibimbap — mixed rice), 삼겹살 (pork belly BBQ), 떡볶이 (spicy rice cakes), 김밥 (Korean sushi roll), 된장찌개 (soybean stew). 밥 먹었어? (Have you eaten?) = 'How are you?'" },
        { id: 'ko_a2_u2_l2', title: "Ordering at a Restaurant", description: "How to order food at a Korean restaurant", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "At a Korean restaurant: press the 벨 (bell button) to call the server. '여기요!' (Excuse me!). '삼겹살 2인분 주세요' (2 servings of pork belly please). Side dishes (반찬) are FREE and unlimited refills! '반찬 더 주세요' (More side dishes please)." },
        { id: 'ko_a2_u2_l3', title: "Connective Endings", description: "Linking sentences with -고, -지만, -아서/어서", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3, culturalHint: "Connect ideas Korean-style: '김치는 맵지만 맛있어요' (Kimchi is spicy but delicious). '배가 고파서 라면을 먹었어요' (I was hungry so I ate ramen). Korean grandmothers say '많이 먹어!' (Eat a lot!) — refusing food is rude." },
        { id: 'ko_a2_u2_l4', title: "Reading: A Recipe", description: "Follow a Korean recipe for 김치찌개", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "김치찌개 (kimchi stew) recipe — Korea's comfort food. Ingredients: 묵은지 (aged kimchi), 돼지고기 (pork), 두부 (tofu), 대파 (green onion), 고춧가루 (chili flakes). Every Korean learns this recipe from their 엄마 (mom)." },
        { id: 'ko_a2_u2_l5', title: "Listening: At the Market", description: "Understand vendors at 시장", category: "listening", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "At 광장시장 (Gwangjang Market) or 남대문시장 (Namdaemun Market): vendors shout '맛보세요!' (Try it!). Street food: 호떡 (sweet pancake), 어묵 (fish cake), 붕어빵 (fish-shaped bread with red bean). Learn: '하나 주세요' (One please)." },
      ],
    },
    {
      id: "ko_b1_u1", title: "문화와 사회 — Culture & Society", level: "B1", order: 5,
      description: "Korean culture, K-pop, K-drama, and social dynamics",
      lessons: [
        { id: 'ko_b1_u1_l1', title: "K-Pop & K-Drama", description: "Entertainment vocabulary and cultural significance", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "한류 (Hallyu/Korean Wave): K-pop groups like BTS (방탄소년단), BLACKPINK, K-dramas on Netflix. Learn: 아이돌 (idol), 팬미팅 (fan meeting), 컴백 (comeback), 음원 (music release), 대박 (jackpot/amazing). Fan culture: 응원봉 (light stick), 덕질 (fangirling)." },
        { id: 'ko_b1_u1_l2', title: "Honorific System", description: "존댓말 levels and when to use each", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2, culturalHint: "Korean has 7 speech levels! Most important: 합쇼체 (most formal — news, business), 해요체 (polite — daily life), 해체/반말 (casual — close friends, younger people). Using wrong level = social disaster. Age determines everything: '몇 살이에요?' is asked immediately." },
        { id: 'ko_b1_u1_l3', title: "Discussing Korean Traditions", description: "Talk about 설날, 추석, and seasonal customs", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3, culturalHint: "Korean holidays: 설날 (Lunar New Year) — wear 한복, do 세배 (deep bow to elders), eat 떡국 (rice cake soup, you age 1 year!), play 윷놀이. 추석 (Harvest Moon) — visit ancestors' graves, eat 송편 (half-moon rice cakes). Both cause massive traffic jams as everyone goes to their 고향 (hometown)." },
        { id: 'ko_b1_u1_l4', title: "Reading: News Article", description: "Understand a Korean news story about society", category: "reading", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Korean social issues: 취업난 (job crisis), 주거 문제 (housing crisis in Seoul), 저출산 (low birth rate), 학벌 (educational background obsession). Read about 수능 (CSAT — the college entrance exam that stops the entire country, even planes are grounded!)." },
        { id: 'ko_b1_u1_l5', title: "Write an Opinion", description: "Express your views on Korean culture", category: "writing", level: "B1", duration: 15, xp: 40, order: 5, culturalHint: "Write about Korean cultural debates: Is 빨리빨리 (hurry hurry) culture good or bad? Should 성형수술 (plastic surgery) be so normalized? Is the 재벌 (chaebol/conglomerate) system fair? Use: '제 생각에는...', '한편으로는...', '결론적으로...'" },
      ],
    },
    {
      id: "ko_b1_u2", title: "직장 생활 — Professional Life", level: "B1", order: 6,
      description: "Korean workplace culture, hierarchy, and business communication",
      lessons: [
        { id: 'ko_b1_u2_l1', title: "Office Vocabulary", description: "Professional terms and workplace hierarchy", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1, culturalHint: "Korean workplace hierarchy: 사장님 (CEO), 부장님 (department head), 과장님 (section chief), 대리 (assistant manager), 사원 (employee). 회식 (team dinner with drinking) is mandatory. Learn: '수고하셨습니다' (good work today — said when leaving office)." },
        { id: 'ko_b1_u2_l2', title: "Formal Speech Patterns", description: "Business Korean with -습니다/ㅂ니다 endings", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2, culturalHint: "Business Korean uses 합쇼체 (highest formality): '보고드리겠습니다' (I will report to you), '확인하겠습니다' (I will confirm), '죄송합니다만...' (I'm sorry but...). Email: '안녕하십니까' (formal hello), '감사드립니다' (formal thank you)." },
        { id: 'ko_b1_u2_l3', title: "Job Interview Practice", description: "Role-play a Korean job interview", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3, culturalHint: "Korean job interviews: arrive 10 minutes early, bow 90 degrees, use 존댓말 throughout. '자기소개 해주세요' (Please introduce yourself). Mention your university (서울대, 연세대, 고려대 = SKY schools are most prestigious). Dress conservatively — appearance matters enormously." },
        { id: 'ko_b1_u2_l4', title: "Reading: Job Posting", description: "Understand a Korean job advertisement on 잡코리아", category: "reading", level: "B1", duration: 10, xp: 30, order: 4, culturalHint: "Korean job ads on 잡코리아 or 사람인: '자격요건' (requirements), '우대사항' (preferred qualifications), '복리후생' (benefits). Many require 토익 (TOEIC) scores. '신입' (new graduate) vs '경력직' (experienced). The 스펙 (spec = qualifications) culture is intense." },
        { id: 'ko_b1_u2_l5', title: "Write a Self-Introduction", description: "Compose a 자기소개서 for job applications", category: "writing", level: "B1", duration: 15, xp: 45, order: 5, culturalHint: "자기소개서 (self-introduction letter) is unique to Korean job applications — a long essay about your life, values, and why you fit the company. Sections: 성장과정 (upbringing), 지원동기 (motivation), 입사 후 포부 (future goals). Very personal and detailed." },
      ],
    },
    {
      id: "ko_b2_u1", title: "고급 표현 — Advanced Expression", level: "B2", order: 7,
      description: "Advanced Korean idioms, humor, and nuanced communication",
      lessons: [
        { id: 'ko_b2_u1_l1', title: "사자성어 & Idioms", description: "Four-character idioms and Korean proverbs", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1, culturalHint: "사자성어 (4-character Chinese idioms used in Korean): 일석이조 (一石二鳥, kill two birds with one stone), 자업자득 (自業自得, reap what you sow). Korean proverbs: '원숭이도 나무에서 떨어진다' (Even monkeys fall from trees = everyone makes mistakes)." },
        { id: 'ko_b2_u1_l2', title: "Complex Grammar Patterns", description: "Advanced connectors and nuanced expressions", category: "grammar", level: "B2", duration: 15, xp: 50, order: 2, culturalHint: "Advanced patterns: '-는 바람에' (because of/due to), '-기는커녕' (far from/let alone), '-는 셈이다' (it amounts to). These appear in TOPIK II (한국어능력시험) — the official Korean proficiency test. Master these to sound truly fluent." },
        { id: 'ko_b2_u1_l3', title: "Korean Humor & 눈치", description: "Understand Korean social intelligence and humor", category: "speaking", level: "B2", duration: 15, xp: 50, order: 3, culturalHint: "눈치 (nunchi) — Korea's social superpower: reading the room, understanding unspoken feelings, knowing when to speak/stay silent. Korean humor: 아재개그 (dad jokes), 드립 (witty remarks), 셀프디스 (self-deprecation). Variety shows (예능) are the best way to learn Korean humor." },
        { id: 'ko_b2_u1_l4', title: "Reading: Korean Literature", description: "Analyze a passage from a Korean author", category: "reading", level: "B2", duration: 15, xp: 45, order: 4, culturalHint: "Korean literature: 한강 (Han Kang — Nobel Prize winner, '채식주의자' The Vegetarian), 신경숙 ('엄마를 부탁해' Please Look After Mom), 조남주 ('82년생 김지영' Kim Ji-young, Born 1982 — about gender inequality). Korean literature often explores 한 (han) — collective grief and resilience." },
        { id: 'ko_b2_u1_l5', title: "Write a Personal Essay", description: "Express complex ideas about identity and culture", category: "writing", level: "B2", duration: 18, xp: 55, order: 5, culturalHint: "Write about Korean identity: 한 (han — deep sorrow/resilience), 정 (jeong — deep emotional bond), 흥 (heung — joy/excitement). Explore: What does it mean to be Korean in the modern world? How do tradition and 빨리빨리 culture coexist?" },
      ],
    },
    {
      id: "ko_c1_u1", title: "한국어 마스터 — Korean Mastery", level: "C1", order: 8,
      description: "Near-native Korean communication and cultural depth",
      lessons: [
        { id: 'ko_c1_u1_l1', title: "Register & Context Switching", description: "Formal, informal, and internet Korean", category: "vocabulary", level: "C1", duration: 15, xp: 50, order: 1, culturalHint: "Korean registers: 격식체 (formal written — news, academic), 비격식체 (informal polite — daily), 인터넷 용어 (internet slang — ㅋㅋ, ㄹㅇ, ㅇㅈ, 갓벽). Code-switching between 존댓말 and 반말 based on age, status, and intimacy. Master: 높임말 (honorifics for others' actions — 드시다, 주무시다, 계시다)." },
        { id: 'ko_c1_u1_l2', title: "Rhetorical Korean", description: "Persuasion, emphasis, and literary devices", category: "grammar", level: "C1", duration: 18, xp: 60, order: 2, culturalHint: "Korean rhetoric: 반어법 (irony), 과장법 (hyperbole), 은유 (metaphor). Political speech patterns: '~해야 합니다' (we must), '~하지 않을 수 없습니다' (we cannot not do). Master indirect refusal: '좀 어려울 것 같은데요...' (It might be a bit difficult... = NO)." },
        { id: 'ko_c1_u1_l3', title: "Debate & Persuasion", description: "Argue and negotiate in formal Korean", category: "speaking", level: "C1", duration: 15, xp: 55, order: 3, culturalHint: "Korean debate style: indirect disagreement is preferred. '그 의견도 일리가 있지만...' (That opinion has merit, but...). Never directly say someone is wrong. Use: '제 소견으로는...', '다른 관점에서 보면...', '한 가지 고려할 점은...' Korean negotiation values harmony (화합) over winning." },
        { id: 'ko_c1_u1_l4', title: "Reading: Academic Korean", description: "Understand academic papers and formal reports", category: "reading", level: "C1", duration: 18, xp: 55, order: 4, culturalHint: "Academic Korean: '~에 관한 연구' (research regarding), '~을 분석한 결과' (as a result of analyzing), '~임을 시사한다' (this suggests that). Read about Korean society: 한국의 교육열 (Korea's education fever), 한류의 경제적 영향 (economic impact of Hallyu)." },
        { id: 'ko_c1_u1_l5', title: "Write a Research Summary", description: "Compose an academic summary in Korean", category: "writing", level: "C1", duration: 20, xp: 65, order: 5, culturalHint: "Write a research summary about Korean culture: structure with 서론 (introduction), 본론 (body), 결론 (conclusion). Use academic vocabulary: 분석하다, 고찰하다, 논의하다, 제시하다. Topic: How has 한류 changed Korea's global image?" },
      ],
    },
    {
      id: "ko_c2_u1", title: "완벽한 한국어 — Perfect Korean", level: "C2", order: 9,
      description: "Complete mastery of Korean language and culture",
      lessons: [
        { id: 'ko_c2_u1_l1', title: "Cultural Deep Dive", description: "Every layer of Korean communication", category: "vocabulary", level: "C2", duration: 18, xp: 60, order: 1, culturalHint: "Master every layer: 한 (collective sorrow), 정 (deep bonds), 눈치 (social intelligence), 체면 (face/reputation), 빨리빨리 (urgency culture). Understand why Koreans ask your age immediately (to set speech level), why they pour drinks with two hands, and why 4 (사/死) is unlucky." },
        { id: 'ko_c2_u1_l2', title: "Stylistic Mastery", description: "Use grammar for literary and rhetorical effect", category: "grammar", level: "C2", duration: 20, xp: 70, order: 2, culturalHint: "Stylistic Korean: master archaic forms (하오체, 하게체), literary endings (-노라, -도다), and poetic Korean. Read 윤동주 (Yun Dong-ju) poetry: '죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를' (Until the day I die, let me look up at heaven without shame)." },
        { id: 'ko_c2_u1_l3', title: "Impromptu Speech", description: "Speak fluently on any topic in Korean", category: "speaking", level: "C2", duration: 15, xp: 65, order: 3, culturalHint: "Speak like a native intellectual: use 사자성어 naturally, employ 겸양 (humility) in self-reference, master the art of 돌려말하기 (speaking indirectly). Korean TED talks, 대학 강연 (university lectures), and 토론 (debates) are your models." },
        { id: 'ko_c2_u1_l4', title: "Reading: Satire & Social Commentary", description: "Detect irony and social criticism in Korean media", category: "reading", level: "C2", duration: 18, xp: 60, order: 4, culturalHint: "Korean satire: 풍자 (satire in webtoons and variety shows), 블랙코미디 (black comedy in films like 기생충/Parasite by 봉준호). Understand social commentary about 계급 (class), 갑을관계 (power dynamics), and 헬조선 (Hell Joseon — youth frustration with society)." },
        { id: 'ko_c2_u1_l5', title: "Creative Writing in Korean", description: "Write a short story with native-level Korean", category: "writing", level: "C2", duration: 25, xp: 75, order: 5, culturalHint: "Write a short story set in Korea: capture the rhythm of Korean speech, use 의성어/의태어 (onomatopoeia — Korean has hundreds!): 반짝반짝 (sparkling), 두근두근 (heart pounding), 살금살금 (sneaking). Weave in cultural themes: 한, 정, 효도, modern vs traditional Korea." },
      ],
    },
  ],
};

const ITALIAN = {
  code: "it",
  name: "Italian",
  flag: "🇮🇹",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 80,
  units: [
    {
      id: "it_a1_u1", title: "Ciao! — First Steps", level: "A1", order: 1,
      description: "Italian greetings, introductions, and essential phrases",
      lessons: [
        { id: 'it_a1_u1_l1', title: "Greetings Italian Style", description: "Ciao, buongiorno, arrivederci — how Italians greet", category: "vocabulary", level: "A1", duration: 5, xp: 20, order: 1, culturalHint: "Italian greetings change by time: buongiorno (morning), buon pomeriggio (afternoon), buonasera (evening). 'Ciao' is informal — use 'buongiorno' with strangers. Italians kiss both cheeks (due baci) when greeting friends. Always start with 'Salve' if unsure of formality." },
        { id: 'it_a1_u1_l2', title: "Introducing Yourself", description: "Mi chiamo... — name, origin, and occupation", category: "speaking", level: "A1", duration: 8, xp: 25, order: 2, culturalHint: "Italian introductions: 'Mi chiamo Marco, sono di Roma' (My name is Marco, I'm from Rome). Italians identify strongly with their city — a Neapolitan is Neapolitan first, Italian second. Learn: piacere (pleasure), come si chiama? (formal), come ti chiami? (informal)." },
        { id: 'it_a1_u1_l3', title: "Essere vs Avere", description: "The two essential verbs: to be and to have", category: "grammar", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Italian uses 'avere' (to have) where English uses 'to be': 'Ho fame' (I have hunger = I'm hungry), 'Ho freddo' (I have cold = I'm cold), 'Ho 25 anni' (I have 25 years = I'm 25). Practice at a bar: 'Ho sete — un caffè, per favore!'" },
        { id: 'it_a1_u1_l4', title: "Numbers & Money", description: "Counting euros and understanding Italian prices", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 4, culturalHint: "Italian money: euros and centesimi. A caffè al banco (standing at the bar) costs €1, but sitting down (al tavolo) can cost €3-5! Learn: 'Quanto costa?' (How much?), 'Il conto, per favore' (The bill, please). Tip: il coperto (cover charge) is normal at restaurants." },
        { id: 'it_a1_u1_l5', title: "At the Bar", description: "Understand a conversation at an Italian bar", category: "listening", level: "A1", duration: 6, xp: 25, order: 5, culturalHint: "The Italian bar (not a pub — it's a café!): order un caffè (espresso), un cappuccino (ONLY before 11am — never after lunch!), un cornetto (croissant). Stand at il banco for cheaper prices. The barista says 'Dica!' (Tell me!/What'll it be?). Never order a 'latte' — you'll get plain milk!" },
      ],
    },
    {
      id: "it_a1_u2", title: "La Famiglia — Daily Life", level: "A1", order: 2,
      description: "Italian family, home life, and daily routines",
      lessons: [
        { id: 'it_a1_u2_l1', title: "La Mia Famiglia", description: "Family terms including nonna, nonno, zio, cugino", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1, culturalHint: "Italian family (la famiglia) is everything. Sunday pranzo (lunch) at nonna's is sacred — 3-4 courses, 3+ hours. Learn: mamma, papà, fratello, sorella, nonna, nonno, zio, zia, cugino. 'Mammone' (mama's boy) is common — many Italian men live at home until marriage!" },
        { id: 'it_a1_u2_l2', title: "Present Tense — Italian Verbs", description: "Regular -are, -ere, -ire verb conjugations", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2, culturalHint: "Italian verb groups: -ARE (parlare → parlo), -ERE (scrivere → scrivo), -IRE (dormire → dormo). Practice with daily life: 'Mangio la pasta ogni giorno' (I eat pasta every day), 'Parlo con la nonna' (I talk to grandma), 'Dormo fino a tardi la domenica' (I sleep late on Sundays)." },
        { id: 'it_a1_u2_l3', title: "La Mia Giornata", description: "Describe your daily routine Italian-style", category: "writing", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Write about an Italian daily routine: colazione (light breakfast — cornetto e caffè), pranzo (big lunch 1-2pm — primo, secondo, contorno), merenda (afternoon snack), cena (dinner 8-9pm). La passeggiata (evening stroll) is a daily ritual in every Italian town." },
        { id: 'it_a1_u2_l4', title: "La Casa Italiana", description: "Rooms, furniture, and Italian home life", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "Italian homes: la cucina (kitchen — heart of the home), il salotto (living room), il balcone (balcony — for drying laundry and growing basilico). Learn: il bidet (yes, every Italian bathroom has one!), la moka (stovetop espresso maker — in every kitchen)." },
        { id: 'it_a1_u2_l5', title: "Reading: A WhatsApp Message", description: "Understand informal Italian text messages", category: "reading", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "Italian texting: 'Cmq' (comunque = anyway), 'Nn' (non = not), 'Xché' (perché = why/because), 'Tvb' (ti voglio bene = I love you/care about you). Read a chat about planning an aperitivo (pre-dinner drinks with snacks — a sacred Italian ritual, especially in Milan)." },
      ],
    },
    {
      id: "it_a2_u1", title: "In Giro — Getting Around", level: "A2", order: 3,
      description: "Navigating Italian cities, transportation, and directions",
      lessons: [
        { id: 'it_a2_u1_l1', title: "Asking for Directions", description: "Navigate Italian cities with confidence", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "Italian directions: 'Sempre dritto' (straight ahead), 'Giri a sinistra/destra' (turn left/right), 'In fondo alla via' (at the end of the street). Italians gesture while giving directions! Landmarks: il duomo, la piazza, la fontana. 'Mi scusi, dov'è la stazione?' (Excuse me, where's the station?)" },
        { id: 'it_a2_u1_l2', title: "Past Tense — Passato Prossimo", description: "Talk about what you did yesterday", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2, culturalHint: "Passato prossimo: 'Ieri sono andato/a a Firenze' (Yesterday I went to Florence). Some verbs use essere (movement, state change), others avere. Tell about Italian experiences: 'Ho mangiato una pizza napoletana fantastica!' (I ate an amazing Neapolitan pizza!)" },
        { id: 'it_a2_u1_l3', title: "Italian Transportation", description: "Treno, autobus, metro vocabulary", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "Italian transport: il treno (Trenitalia, Italo — high-speed to anywhere), l'autobus (often late!), la metro (Rome and Milan), il vaporetto (Venice water bus). Learn: 'Un biglietto per Roma, per favore', 'A che ora parte?' (What time does it leave?). Validate your ticket or face a €50 fine!" },
        { id: 'it_a2_u1_l4', title: "Reading: A City Guide", description: "Follow a tourist guide to Italian landmarks", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Italian cities: Roma (il Colosseo, il Vaticano, Trastevere), Firenze (il Duomo, gli Uffizi, Ponte Vecchio), Venezia (Piazza San Marco, il Canal Grande), Napoli (Spaccanapoli, il Vesuvio). Each city has its own dialect, food, and character." },
        { id: 'it_a2_u1_l5', title: "Write About Your Trip", description: "Describe a trip to an Italian city", category: "writing", level: "A2", duration: 12, xp: 35, order: 5, culturalHint: "Write about a trip: 'Il weekend scorso sono andato/a a Venezia. Ho visitato Piazza San Marco e ho mangiato i cicchetti (Venetian tapas). La città è magica!' Include: il museo, la chiesa, il ristorante, la gelateria." },
      ],
    },
    {
      id: "it_a2_u2", title: "A Tavola! — Food & Drink", level: "A2", order: 4,
      description: "Italian cuisine, ordering food, and cooking vocabulary",
      lessons: [
        { id: 'it_a2_u2_l1', title: "Italian Food Vocabulary", description: "Pasta, pizza, gelato — essential dishes", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1, culturalHint: "Italian food rules: NEVER put cream in carbonara (only egg, pecorino, guanciale). Pizza: margherita (tomato, mozzarella, basil — the Italian flag!). Pasta shapes match sauces: penne = ragù, spaghetti = vongole, orecchiette = cime di rapa. Learn: antipasto, primo, secondo, contorno, dolce." },
        { id: 'it_a2_u2_l2', title: "Ordering at a Trattoria", description: "How to order food at an Italian restaurant", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "At a trattoria: 'Per me, gli spaghetti alle vongole come primo e la tagliata come secondo' (For me, clam spaghetti as first course and sliced steak as second). Never ask for parmesan on fish pasta! The cameriere says 'Da bere?' (To drink?). 'Un quartino di rosso' (a quarter liter of red wine)." },
        { id: 'it_a2_u2_l3', title: "Imperfect Tense", description: "Talking about what you used to eat growing up", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3, culturalHint: "Imperfetto for memories: 'Quando ero piccolo/a, la nonna faceva la pasta fresca ogni domenica' (When I was little, grandma made fresh pasta every Sunday). Italian nonnas and their recipes are legendary — each family guards their ragù recipe like a state secret." },
        { id: 'it_a2_u2_l4', title: "Reading: A Recipe", description: "Follow an Italian recipe for tiramisù", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Tiramisù recipe (means 'pick me up'): mascarpone, uova, zucchero, savoiardi (ladyfingers), caffè espresso, cacao amaro. 'Separare i tuorli dagli albumi, montare...' Every Italian region claims they invented it (Veneto vs Friuli)." },
        { id: 'it_a2_u2_l5', title: "Listening: At the Market", description: "Understand vendors at il mercato", category: "listening", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "At the Italian mercato: vendors shout 'Signora, guardi che bella roba!' (Ma'am, look at this beautiful stuff!). Buy: pomodori San Marzano, mozzarella di bufala, prosciutto di Parma, parmigiano reggiano. Learn: 'Me ne dia un etto' (Give me 100 grams)." },
      ],
    },
    {
      id: "it_b1_u1", title: "Cultura e Società", level: "B1", order: 5,
      description: "Italian culture, art, fashion, and social life",
      lessons: [
        { id: 'it_b1_u1_l1', title: "Arte, Moda & Design", description: "Cultural vocabulary: art, fashion, and Italian design", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "Italian culture: il Rinascimento (Renaissance — Michelangelo, Leonardo, Raffaello), la moda (Gucci, Prada, Armani, Versace — Milan is the capital), il design (Ferrari, Vespa, Alessi). Learn: il capolavoro (masterpiece), lo stilista (designer), la sfilata (fashion show), il Made in Italy." },
        { id: 'it_b1_u1_l2', title: "Subjunctive Mood — Congiuntivo", description: "Expressing opinions, doubts, and emotions", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2, culturalHint: "Il congiuntivo — Italians' favorite grammar topic to complain about! 'Penso che l'Italia sia il paese più bello del mondo' (I think Italy is the most beautiful country). Triggers: penso che, credo che, è possibile che, spero che. Using it correctly impresses every Italian." },
        { id: 'it_b1_u1_l3', title: "Discussing Italian Life", description: "Talk about la dolce vita and Italian values", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3, culturalHint: "La dolce vita (the sweet life): Italians value il bel vivere — good food, family, beauty, leisure. Discuss: la passeggiata (evening stroll), l'aperitivo (pre-dinner ritual), il riposo (afternoon rest), la bella figura (making a good impression). 'Chi va piano, va sano e va lontano' (Slow and steady wins the race)." },
        { id: 'it_b1_u1_l4', title: "Reading: News Article", description: "Understand an Italian news story", category: "reading", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "Italian news: La Repubblica, Corriere della Sera, La Stampa. Topics: la politica italiana (famously chaotic!), il calcio (football is religion — Serie A, la Nazionale), l'immigrazione, il turismo. Read about la Festa della Repubblica (June 2nd — Italy's national day)." },
        { id: 'it_b1_u1_l5', title: "Write an Opinion", description: "Express your views on Italian culture", category: "writing", level: "B1", duration: 15, xp: 40, order: 5, culturalHint: "Write about Italian cultural debates: Is il calcio too dominant in Italian life? Should Italy preserve its small towns (borghi) or modernize? Is la bella figura superficial or important? Use: 'Secondo me...', 'Da un lato... dall'altro...', 'In conclusione...'" },
      ],
    },
    {
      id: "it_b1_u2", title: "Il Lavoro — Professional Life", level: "B1", order: 6,
      description: "Italian workplace culture and business communication",
      lessons: [
        { id: 'it_b1_u2_l1', title: "Office Vocabulary", description: "Professional terms and workplace culture", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1, culturalHint: "Italian workplace: relationships (le relazioni) matter more than efficiency. La pausa caffè (coffee break) is sacred — 2-3 times daily. Learn: il collega, il capo, la riunione, lo stipendio, le ferie (vacation — Italians get 4+ weeks!). August = ferragosto — the whole country shuts down!" },
        { id: 'it_b1_u2_l2', title: "Conditional Tense", description: "Polite requests and hypotheticals", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2, culturalHint: "Il condizionale for politeness: 'Potrebbe aiutarmi?' (Could you help me?), 'Vorrei un'informazione' (I'd like some information), 'Sarebbe possibile...?' (Would it be possible...?). Italian business communication values elegance and formality — never be too direct." },
        { id: 'it_b1_u2_l3', title: "Job Interview Practice", description: "Role-play an Italian job interview", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3, culturalHint: "Italian job interviews: use 'Lei' (formal you), dress impeccably (la bella figura!), be warm but professional. 'Mi parli di Lei' (Tell me about yourself). Italians value: laurea (university degree), esperienza all'estero (international experience), and personal connections (le raccomandazioni — controversial but real)." },
        { id: 'it_b1_u2_l4', title: "Reading: Job Posting", description: "Understand an Italian job advertisement", category: "reading", level: "B1", duration: 10, xp: 30, order: 4, culturalHint: "Italian job ads on LinkedIn or InfoJobs: 'Si richiede' (Required), 'Requisiti' (Requirements), 'Si offre' (We offer), 'Contratto a tempo indeterminato' (permanent contract — the holy grail!). Italian job market: il precariato (precarious work) is a major issue for giovani (young people)." },
        { id: 'it_b1_u2_l5', title: "Write a Cover Letter", description: "Compose a professional lettera di presentazione", category: "writing", level: "B1", duration: 15, xp: 45, order: 5, culturalHint: "Italian cover letter: 'Egregio/a Dott./Dott.ssa' (Dear Dr. — Italians use titles!), formal structure, mention your laurea and competenze. End with 'In attesa di un cortese riscontro, porgo distinti saluti' (Awaiting your kind response, best regards). Very formal!" },
      ],
    },
    {
      id: "it_b2_u1", title: "Espressioni Avanzate", level: "B2", order: 7,
      description: "Advanced Italian idioms, humor, and nuanced communication",
      lessons: [
        { id: 'it_b2_u1_l1', title: "Idioms & Proverbs", description: "Italian idioms and their cultural meanings", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1, culturalHint: "Italian idioms: 'In bocca al lupo!' (Good luck! — reply: 'Crepi!' = May it die!), 'Non tutte le ciambelle riescono col buco' (Not all donuts come out with a hole = things don't always work out), 'Chi dorme non piglia pesci' (He who sleeps doesn't catch fish = early bird gets the worm)." },
        { id: 'it_b2_u1_l2', title: "Complex Subjunctive", description: "Past subjunctive and hypothetical scenarios", category: "grammar", level: "B2", duration: 15, xp: 50, order: 2, culturalHint: "Periodo ipotetico (hypothetical): 'Se avessi più tempo, viaggerei per tutta l'Italia' (If I had more time, I'd travel all of Italy). Three types: realtà (real), possibilità (possible), irrealtà (impossible). Master this and Italians will say 'Complimenti! Parli benissimo!'" },
        { id: 'it_b2_u1_l3', title: "Italian Humor & Gestures", description: "Understand Italian comedy and body language", category: "speaking", level: "B2", duration: 15, xp: 50, order: 3, culturalHint: "Italian gestures (i gesti): the 'pinched fingers' (ma che vuoi? = what do you want?), the chin flick (non me ne frega = I don't care), the hand wave (ma va! = get out of here!). Italian humor: la commedia all'italiana, Roberto Benigni, self-deprecating regional jokes (North vs South)." },
        { id: 'it_b2_u1_l4', title: "Reading: Italian Literature", description: "Analyze a passage from an Italian author", category: "reading", level: "B2", duration: 15, xp: 45, order: 4, culturalHint: "Italian literature: Dante Alighieri (La Divina Commedia — foundation of Italian language), Italo Calvino (Se una notte d'inverno un viaggiatore), Elena Ferrante (L'amica geniale — Neapolitan novels), Umberto Eco (Il nome della rosa). Italian is called 'la lingua di Dante'." },
        { id: 'it_b2_u1_l5', title: "Write a Personal Essay", description: "Express complex ideas about Italian identity", category: "writing", level: "B2", duration: 18, xp: 55, order: 5, culturalHint: "Write about Italian identity: il campanilismo (extreme local pride — every town thinks it's the best), Nord vs Sud divide, l'emigrazione italiana (Italian diaspora), il Made in Italy as national pride. Explore: What does 'essere italiano' mean in the modern world?" },
      ],
    },
    {
      id: "it_c1_u1", title: "Padronanza Italiana", level: "C1", order: 8,
      description: "Near-native Italian communication and cultural mastery",
      lessons: [
        { id: 'it_c1_u1_l1', title: "Register Switching", description: "Formal, informal, and dialectal Italian", category: "vocabulary", level: "C1", duration: 15, xp: 50, order: 1, culturalHint: "Italian registers: formale (Lei, Egregio), standard (tu, ciao), colloquiale (dialetto, slang). Italy has dozens of dialects — napoletano, siciliano, romanesco, milanese — some are almost separate languages! A Roman says 'Daje!' (Come on!), a Neapolitan says 'Uè!' (Hey!)." },
        { id: 'it_c1_u1_l2', title: "Rhetorical Italian", description: "Persuasion and emphasis in Italian discourse", category: "grammar", level: "C1", duration: 18, xp: 60, order: 2, culturalHint: "Italian rhetoric: l'iperbole (Italians exaggerate everything — 'Muoio di fame!' = I'm dying of hunger), la litote (understatement — 'Non è male' = It's great), il diminutivo/accrescitivo (un momentino, un problemone). Master these to sound authentically Italian." },
        { id: 'it_c1_u1_l3', title: "Persuasive Speaking", description: "Convince and negotiate Italian-style", category: "speaking", level: "C1", duration: 15, xp: 55, order: 3, culturalHint: "Italian negotiation: build relationships first, use charm and eloquence. 'Mi permetta di esporre il mio punto di vista...', 'Capisco la sua posizione, tuttavia...', 'Propongo un compromesso...' Italians value bella figura even in disagreement — never lose your composure." },
        { id: 'it_c1_u1_l4', title: "Reading: Academic Italian", description: "Understand academic and journalistic Italian", category: "reading", level: "C1", duration: 18, xp: 55, order: 4, culturalHint: "Academic Italian: 'Per quanto riguarda...' (Regarding...), 'Si evince che...' (It is evident that...), 'In virtù di...' (By virtue of...). Read about Italian art history, political philosophy, or il dibattito sulla lingua (the ongoing debate about Italian language purity vs evolution)." },
        { id: 'it_c1_u1_l5', title: "Write a Critical Essay", description: "Compose an analytical essay in Italian", category: "writing", level: "C1", duration: 20, xp: 65, order: 5, culturalHint: "Write a critical essay about Italian society: il fenomeno dell'emigrazione giovanile (brain drain), la questione meridionale (North-South divide), il patrimonio culturale (cultural heritage preservation). Use: 'Si potrebbe argomentare che...', 'È innegabile che...', 'In definitiva...'" },
      ],
    },
    {
      id: "it_c2_u1", title: "Maestria Totale", level: "C2", order: 9,
      description: "Complete mastery of Italian language and culture",
      lessons: [
        { id: 'it_c2_u1_l1', title: "Cultural Mastery", description: "Every layer of Italian communication", category: "vocabulary", level: "C2", duration: 18, xp: 60, order: 1, culturalHint: "Master Italian cultural codes: la bella figura (always look good), il dolce far niente (the sweetness of doing nothing), l'arte di arrangiarsi (the art of getting by), il familismo (family above all). Understand why Italians talk with their hands, why lunch is 2 hours, and why il caffè is a philosophy." },
        { id: 'it_c2_u1_l2', title: "Stylistic Grammar", description: "Use grammar for literary and rhetorical effect", category: "grammar", level: "C2", duration: 20, xp: 70, order: 2, culturalHint: "Stylistic Italian: master the passato remoto (literary past — 'Dante scrisse la Commedia'), il trapassato remoto, and literary constructions. Read Calvino's crystalline prose, Ferrante's raw Neapolitan voice, and Eco's erudite complexity. Italian prose style = music." },
        { id: 'it_c2_u1_l3', title: "Impromptu Eloquence", description: "Speak with native Italian eloquence on any topic", category: "speaking", level: "C2", duration: 15, xp: 65, order: 3, culturalHint: "Speak like an Italian intellectual: use literary references naturally (Dante, Manzoni, Leopardi), employ irony and understatement, master the art of la conversazione (conversation as art form). Italian talk shows, university lectures, and political debates are your models." },
        { id: 'it_c2_u1_l4', title: "Reading: Satire & Irony", description: "Detect humor and social commentary in Italian media", category: "reading", level: "C2", duration: 18, xp: 60, order: 4, culturalHint: "Italian satire: la commedia dell'arte tradition lives on in modern comedy (Checco Zalone, Corrado Guzzanti). Political satire: Blob (RAI), Le Iene. Understand: l'ironia, il sarcasmo, la parodia, la critica sociale. Italian humor is often self-deprecating about bureaucracy and politics." },
        { id: 'it_c2_u1_l5', title: "Creative Writing", description: "Write a short story with native Italian style", category: "writing", level: "C2", duration: 25, xp: 75, order: 5, culturalHint: "Write a short story set in Italy: capture the musicality of Italian prose, use regional flavor (Roma, Napoli, Sicilia each have distinct voices), weave in cultural themes: la famiglia, il cibo, la bellezza, il passato vs il presente. Make the reader taste, smell, and feel Italy." },
      ],
    },
  ],
};

const GERMAN = {
  code: "de",
  name: "German",
  flag: "🇩🇪",
  totalLessons: 45,
  totalUnits: 9,
  estimatedHours: 90,
  units: [
    {
      id: "de_a1_u1", title: "Hallo! — First Steps", level: "A1", order: 1,
      description: "German greetings, introductions, and essential phrases",
      lessons: [
        { id: 'de_a1_u1_l1', title: "Greetings German Style", description: "Hallo, Guten Tag, Tschüss — how Germans greet", category: "vocabulary", level: "A1", duration: 5, xp: 20, order: 1, culturalHint: "German greetings vary by region: 'Guten Tag' (standard), 'Moin' (North), 'Grüß Gott' (Bavaria/Austria), 'Servus' (informal South). Germans shake hands firmly when meeting. Use 'Sie' (formal you) with strangers — switching to 'du' is a big moment in a relationship!" },
        { id: 'de_a1_u1_l2', title: "Introducing Yourself", description: "Ich heiße... — name, origin, and occupation", category: "speaking", level: "A1", duration: 8, xp: 25, order: 2, culturalHint: "German introductions are direct: 'Ich heiße Thomas, ich komme aus Berlin, ich bin Ingenieur' (I'm Thomas, from Berlin, I'm an engineer). Germans value Pünktlichkeit (punctuality) — being 5 minutes late is rude. Learn: Freut mich (Pleased to meet you), Woher kommen Sie?" },
        { id: 'de_a1_u1_l3', title: "Sein & Haben", description: "The two essential verbs: to be and to have", category: "grammar", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "German has THREE genders: der (masculine), die (feminine), das (neuter) — and you must memorize each noun's gender! 'Der Tisch' (table), 'die Lampe' (lamp), 'das Buch' (book). Tip: learn the article WITH the noun. Practice: 'Ich bin müde' (I'm tired), 'Ich habe Hunger' (I'm hungry)." },
        { id: 'de_a1_u1_l4', title: "Numbers & Money", description: "Counting euros and understanding German prices", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 4, culturalHint: "German numbers: 21 = einundzwanzig (one-and-twenty — reversed!). Germany is still a cash society — many restaurants don't accept cards! Learn: 'Was kostet das?' (How much?), 'Die Rechnung, bitte' (The bill, please). Tip: Germans split bills exactly (kein Trinkgeld = no mandatory tip, but 5-10% is nice)." },
        { id: 'de_a1_u1_l5', title: "At the Bäckerei", description: "Understand a conversation at a German bakery", category: "listening", level: "A1", duration: 6, xp: 25, order: 5, culturalHint: "Die Bäckerei (bakery) — Germans eat bread (Brot) with EVERY meal. Over 3,000 types! Learn: das Brötchen (roll), das Vollkornbrot (whole grain), die Brezel (pretzel), der Kuchen (cake). The baker says 'Was darf es sein?' (What can I get you?). Sunday Frühstück with fresh Brötchen is sacred." },
      ],
    },
    {
      id: "de_a1_u2", title: "Familie & Alltag — Family & Daily Life", level: "A1", order: 2,
      description: "German family, home life, and daily routines",
      lessons: [
        { id: 'de_a1_u2_l1', title: "Meine Familie", description: "Family terms and German family culture", category: "vocabulary", level: "A1", duration: 7, xp: 20, order: 1, culturalHint: "German family (die Familie): more nuclear than Mediterranean cultures. Children often move out at 18. Learn: die Mutter, der Vater, der Bruder, die Schwester, die Großeltern (grandparents). 'Kindergarten' is a German word the world borrowed! Germans value Selbstständigkeit (independence) from a young age." },
        { id: 'de_a1_u2_l2', title: "Present Tense — German Verbs", description: "Regular verb conjugation and word order", category: "grammar", level: "A1", duration: 12, xp: 35, order: 2, culturalHint: "German word order: verb ALWAYS in position 2! 'Ich spiele Fußball' (I play football), but 'Am Montag spiele ich Fußball' (On Monday play I football). Practice with daily life: 'Ich trinke Kaffee' (I drink coffee), 'Wir gehen spazieren' (We go for a walk)." },
        { id: 'de_a1_u2_l3', title: "Mein Tag", description: "Describe your daily routine German-style", category: "writing", level: "A1", duration: 10, xp: 30, order: 3, culturalHint: "Write about a German daily routine: Frühstück (breakfast — Brötchen, Aufschnitt, Müsli), Mittagessen (lunch — warm meal), Kaffee und Kuchen (afternoon coffee and cake at 3pm — a tradition!), Abendessen (dinner — often cold: Brot, Käse, Wurst). Germans eat dinner early (6-7pm)." },
        { id: 'de_a1_u2_l4', title: "Die Wohnung", description: "Rooms, furniture, and German home life", category: "vocabulary", level: "A1", duration: 8, xp: 25, order: 4, culturalHint: "German homes: die Küche (kitchen), das Wohnzimmer (living room), das Schlafzimmer (bedroom), der Keller (basement — every German house has one, often with a Hobbyraum). Learn: Hausschuhe (house slippers — ALWAYS remove shoes!), lüften (airing out rooms — Germans do this daily, even in winter!)." },
        { id: 'de_a1_u2_l5', title: "Reading: An Email", description: "Understand a simple German email", category: "reading", level: "A1", duration: 8, xp: 25, order: 5, culturalHint: "German emails: formal = 'Sehr geehrte/r Frau/Herr...' + 'Mit freundlichen Grüßen' (With kind regards). Informal = 'Liebe/r...' + 'Viele Grüße' (Many greetings). Germans write LONG, detailed emails. Read an email about planning a Grillparty (BBQ — Germans love grilling!)." },
      ],
    },
    {
      id: "de_a2_u1", title: "Unterwegs — Getting Around", level: "A2", order: 3,
      description: "Navigating German cities, transportation, and directions",
      lessons: [
        { id: 'de_a2_u1_l1', title: "Asking for Directions", description: "Navigate German cities with confidence", category: "speaking", level: "A2", duration: 10, xp: 30, order: 1, culturalHint: "German directions: 'Gehen Sie geradeaus' (Go straight), 'Biegen Sie links/rechts ab' (Turn left/right), 'An der Ampel' (At the traffic light). Germans follow traffic rules strictly — jaywalking is frowned upon! Landmarks: der Bahnhof, der Marktplatz, das Rathaus (town hall)." },
        { id: 'de_a2_u1_l2', title: "Past Tense — Perfekt", description: "Talk about what you did using haben/sein + Partizip", category: "grammar", level: "A2", duration: 12, xp: 35, order: 2, culturalHint: "German Perfekt: 'Ich habe Bier getrunken' (I drank beer), 'Ich bin nach München gefahren' (I went to Munich). Movement verbs use 'sein'! Tell about German experiences: 'Wir haben das Oktoberfest besucht und haben Brezeln gegessen' (We visited Oktoberfest and ate pretzels)." },
        { id: 'de_a2_u1_l3', title: "German Transportation", description: "U-Bahn, S-Bahn, ICE vocabulary", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 3, culturalHint: "German transport (famously efficient!): die U-Bahn (subway), die S-Bahn (city rail), der ICE (high-speed train — 300km/h!), die Straßenbahn (tram). Deutsche Bahn motto: 'Pünktlich wie die Deutsche Bahn' (ironic — delays are common!). Learn: der Fahrplan (schedule), die Fahrkarte (ticket), umsteigen (transfer)." },
        { id: 'de_a2_u1_l4', title: "Reading: A City Guide", description: "Follow a guide to German landmarks", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "German cities: Berlin (das Brandenburger Tor, die Mauer), München (der Marienplatz, das Hofbräuhaus), Hamburg (der Hafen, die Reeperbahn), Köln (der Dom, der Karneval). Each city has its own Dialekt, Bier, and character. 'Stadtführung' (city tour) is a great way to learn!" },
        { id: 'de_a2_u1_l5', title: "Write About Your City", description: "Describe where you live in German", category: "writing", level: "A2", duration: 12, xp: 35, order: 5, culturalHint: "Describe a German neighborhood: 'In meiner Stadt gibt es einen schönen Park, viele Cafés und einen Wochenmarkt' (In my city there's a nice park, many cafés, and a weekly market). Include: die Bibliothek, das Schwimmbad, der Biergarten (beer garden — outdoor seating under chestnut trees!)." },
      ],
    },
    {
      id: "de_a2_u2", title: "Essen & Trinken — Food & Drink", level: "A2", order: 4,
      description: "German cuisine, ordering food, and Biergarten culture",
      lessons: [
        { id: 'de_a2_u2_l1', title: "German Food Vocabulary", description: "Bratwurst, Schnitzel, Sauerkraut — essential dishes", category: "vocabulary", level: "A2", duration: 8, xp: 25, order: 1, culturalHint: "German food: die Bratwurst (grilled sausage), das Schnitzel (breaded cutlet), das Sauerkraut (fermented cabbage), die Kartoffel (potato — in 100 forms!), der Döner Kebab (Germany's #1 fast food, brought by Turkish immigrants). Each region has specialties: Weißwurst (Bavaria), Currywurst (Berlin), Maultaschen (Swabia)." },
        { id: 'de_a2_u2_l2', title: "Ordering at a Biergarten", description: "How to order food and beer in Germany", category: "speaking", level: "A2", duration: 10, xp: 30, order: 2, culturalHint: "At a Biergarten: 'Ein Maß Bier, bitte!' (A liter of beer, please — yes, a LITER!). Germans say 'Prost!' (Cheers!) and make eye contact while clinking glasses — not doing so = 7 years bad luck! Order: 'Ich hätte gerne eine Brezel und ein Weißbier' (I'd like a pretzel and wheat beer)." },
        { id: 'de_a2_u2_l3', title: "Modal Verbs", description: "Can, must, want — expressing ability and obligation", category: "grammar", level: "A2", duration: 12, xp: 35, order: 3, culturalHint: "German modal verbs: können (can), müssen (must), wollen (want), sollen (should), dürfen (may/allowed). Practice with food: 'Ich möchte bestellen' (I'd like to order), 'Darf ich die Karte sehen?' (May I see the menu?), 'Man muss das Reinheitsgebot kennen!' (You must know the Beer Purity Law — from 1516!)." },
        { id: 'de_a2_u2_l4', title: "Reading: A Recipe", description: "Follow a German recipe for Apfelstrudel", category: "reading", level: "A2", duration: 10, xp: 30, order: 4, culturalHint: "Apfelstrudel recipe: der Strudelteig (strudel dough — stretched paper-thin!), die Äpfel, der Zucker, der Zimt (cinnamon), die Rosinen, das Paniermehl. 'Den Teig dünn ausrollen und mit Äpfeln füllen...' Serve with Vanillesoße or a Kugel Eis (scoop of ice cream)." },
        { id: 'de_a2_u2_l5', title: "Listening: At the Wochenmarkt", description: "Understand vendors at the weekly market", category: "listening", level: "A2", duration: 8, xp: 25, order: 5, culturalHint: "At the Wochenmarkt (weekly market): every German town has one, usually Saturday morning. Fresh: Obst (fruit), Gemüse (vegetables), Käse (cheese), Brot, Blumen (flowers). The vendor says 'Darf's noch etwas sein?' (Anything else?). Learn: 'Ein Pfund Tomaten, bitte' (A pound of tomatoes, please)." },
      ],
    },
    {
      id: "de_b1_u1", title: "Kultur & Gesellschaft", level: "B1", order: 5,
      description: "German culture, traditions, and social life",
      lessons: [
        { id: 'de_b1_u1_l1', title: "Feste & Traditionen", description: "Oktoberfest, Weihnachten, Karneval — German celebrations", category: "vocabulary", level: "B1", duration: 12, xp: 35, order: 1, culturalHint: "German festivals: das Oktoberfest (Munich, 6 million visitors, Lederhosen & Dirndl), der Karneval/Fasching (Cologne, Mainz — costumes, parades, 'Alaaf!' and 'Helau!'), Weihnachten (Christmas — Adventskranz, Weihnachtsmarkt, Glühwein, Lebkuchen, der Christkind). Germans take holidays SERIOUSLY." },
        { id: 'de_b1_u1_l2', title: "Konjunktiv II", description: "Expressing wishes, hypotheticals, and polite requests", category: "grammar", level: "B1", duration: 15, xp: 40, order: 2, culturalHint: "Konjunktiv II (subjunctive): 'Wenn ich reich wäre, würde ich ein Schloss kaufen' (If I were rich, I'd buy a castle). 'Ich hätte gerne...' (I would like...) — the polite way to order anything. Germans use Konjunktiv II constantly for politeness. Master: wäre, hätte, könnte, würde." },
        { id: 'de_b1_u1_l3', title: "Discussing German Values", description: "Talk about Ordnung, Pünktlichkeit, and Umweltschutz", category: "speaking", level: "B1", duration: 12, xp: 35, order: 3, culturalHint: "German values: Ordnung (order — everything has rules), Pünktlichkeit (punctuality — 5 min early = on time), Umweltschutz (environmental protection — Mülltrennung/recycling is law!), Direktheit (directness — Germans say what they mean). Discuss: 'Finden Sie, dass Deutsche zu direkt sind?'" },
        { id: 'de_b1_u1_l4', title: "Reading: News Article", description: "Understand a German news story", category: "reading", level: "B1", duration: 12, xp: 35, order: 4, culturalHint: "German news: Der Spiegel, Die Zeit, Süddeutsche Zeitung, Tagesschau (TV). Topics: die Energiewende (energy transition), die Wiedervereinigung (reunification legacy), die EU-Politik. Read about the Weihnachtsmarkt tradition — over 2,500 Christmas markets across Germany!" },
        { id: 'de_b1_u1_l5', title: "Write an Opinion", description: "Express your views on German culture", category: "writing", level: "B1", duration: 15, xp: 40, order: 5, culturalHint: "Write about German cultural debates: Is Mülltrennung (waste separation) too complicated? Should shops open on Sundays? (Sonntagsruhe = Sunday rest is law!). Is German Direktheit rude or refreshing? Use: 'Meiner Meinung nach...', 'Einerseits... andererseits...', 'Zusammenfassend...'" },
      ],
    },
    {
      id: "de_b1_u2", title: "Berufsleben — Professional Life", level: "B1", order: 6,
      description: "German workplace culture and business communication",
      lessons: [
        { id: 'de_b1_u2_l1', title: "Office Vocabulary", description: "Professional terms and German work culture", category: "vocabulary", level: "B1", duration: 10, xp: 35, order: 1, culturalHint: "German workplace: strict hierarchy but flat communication. Titles matter — 'Herr Doktor Müller' (if they have a PhD, USE IT!). Learn: der Feierabend (end of workday — sacred!), die Mittagspause, der Betriebsrat (works council), die Gleitzeit (flextime). Germans get 30 days vacation + sick leave. Work-life balance is real." },
        { id: 'de_b1_u2_l2', title: "Passive Voice", description: "Formal German with werden + Partizip II", category: "grammar", level: "B1", duration: 14, xp: 40, order: 2, culturalHint: "German passive (Passiv): 'Das Bier wird nach dem Reinheitsgebot gebraut' (The beer is brewed according to the Purity Law). Very common in business/academic German. Practice: 'Die E-Mail wurde gesendet' (The email was sent), 'Es wird gebeten...' (It is requested that...)." },
        { id: 'de_b1_u2_l3', title: "Job Interview Practice", description: "Role-play a German Vorstellungsgespräch", category: "speaking", level: "B1", duration: 12, xp: 40, order: 3, culturalHint: "German job interviews: be punctual (arrive 5 min early), bring paper copies of everything, use 'Sie'. 'Erzählen Sie etwas über sich' (Tell me about yourself). Germans value: Qualifikationen (qualifications), Berufserfahrung (work experience), and Zuverlässigkeit (reliability). No small talk — straight to business!" },
        { id: 'de_b1_u2_l4', title: "Reading: Job Posting", description: "Understand a German Stellenanzeige", category: "reading", level: "B1", duration: 10, xp: 30, order: 4, culturalHint: "German job ads on StepStone, Indeed, or Xing: 'Wir suchen...' (We're looking for...), 'Ihre Aufgaben' (Your tasks), 'Ihr Profil' (Your profile), 'Wir bieten' (We offer). German CVs include a photo (Bewerbungsfoto) and are extremely detailed — Lebenslauf (CV) is a formal document." },
        { id: 'de_b1_u2_l5', title: "Write a Bewerbung", description: "Compose a German job application", category: "writing", level: "B1", duration: 15, xp: 45, order: 5, culturalHint: "German Bewerbung (application): Anschreiben (cover letter) + Lebenslauf (CV) + Zeugnisse (certificates/references). Start: 'Sehr geehrte Damen und Herren' (Dear Ladies and Gentlemen). End: 'Über eine Einladung zu einem persönlichen Gespräch würde ich mich sehr freuen' (I would be very pleased to receive an interview invitation). VERY formal!" },
      ],
    },
    {
      id: "de_b2_u1", title: "Fortgeschrittener Ausdruck", level: "B2", order: 7,
      description: "Advanced German idioms, humor, and nuanced communication",
      lessons: [
        { id: 'de_b2_u1_l1', title: "Redewendungen & Sprichwörter", description: "German idioms and their cultural meanings", category: "vocabulary", level: "B2", duration: 15, xp: 45, order: 1, culturalHint: "German idioms: 'Da steppt der Bär!' (The bear is dancing! = It's a great party), 'Ich verstehe nur Bahnhof' (I only understand train station = I don't understand anything), 'Das ist nicht mein Bier' (That's not my beer = not my problem), 'Schwein haben' (To have pig = to be lucky)." },
        { id: 'de_b2_u1_l2', title: "Complex Sentence Structure", description: "Nebensätze, relative clauses, and German word order", category: "grammar", level: "B2", duration: 15, xp: 50, order: 2, culturalHint: "German sentence structure gets complex: Nebensätze (subordinate clauses) push the verb to the END. 'Ich weiß, dass du Deutsch lernst, weil du nach Deutschland reisen willst' (I know that you learn German because you want to travel to Germany). Mark Twain wrote an essay called 'The Awful German Language' about this!" },
        { id: 'de_b2_u1_l3', title: "German Humor & Irony", description: "Understand German comedy and dry wit", category: "speaking", level: "B2", duration: 15, xp: 50, order: 3, culturalHint: "German humor exists! (despite the stereotype): trockener Humor (dry humor), Schadenfreude (pleasure from others' misfortune — a German invention!), Wortspiele (wordplay). Comedians: Loriot (legendary), Hape Kerkeling, Jan Böhmermann (political satire). Germans laugh AT rules and bureaucracy." },
        { id: 'de_b2_u1_l4', title: "Reading: German Literature", description: "Analyze a passage from a German author", category: "reading", level: "B2", duration: 15, xp: 45, order: 4, culturalHint: "German literature: Goethe (Faust — the German Shakespeare), Kafka (Die Verwandlung — surreal Prague German), Thomas Mann (Buddenbrooks), Hermann Hesse (Siddhartha), Herta Müller (Nobel Prize). German compound words in literature can be 50+ letters long — Donaudampfschifffahrtsgesellschaft!" },
        { id: 'de_b2_u1_l5', title: "Write a Personal Essay", description: "Express complex ideas about German identity", category: "writing", level: "B2", duration: 18, xp: 55, order: 5, culturalHint: "Write about German identity: Vergangenheitsbewältigung (coming to terms with the past), die Wiedervereinigung (reunification — Ossi vs Wessi), Willkommenskultur (welcome culture for refugees), and what 'deutsch sein' means today. Germany's relationship with its history is unique and complex." },
      ],
    },
    {
      id: "de_c1_u1", title: "Sprachbeherrschung", level: "C1", order: 8,
      description: "Near-native German communication and cultural depth",
      lessons: [
        { id: 'de_c1_u1_l1', title: "Register & Dialekte", description: "Formal, informal, and dialectal German", category: "vocabulary", level: "C1", duration: 15, xp: 50, order: 1, culturalHint: "German registers: Hochdeutsch (standard), Umgangssprache (colloquial), Dialekte (Bayerisch, Schwäbisch, Sächsisch, Plattdeutsch — sometimes unintelligible to each other!). A Bavarian says 'Grüß Gott' and 'Servus', a Berliner says 'Ick' instead of 'Ich'. Code-switching between Hochdeutsch and dialect is a social skill." },
        { id: 'de_c1_u1_l2', title: "Rhetorical German", description: "Persuasion and academic argumentation", category: "grammar", level: "C1", duration: 18, xp: 60, order: 2, culturalHint: "German academic style: long, complex sentences with multiple Nebensätze, Nominalisierung (turning verbs into nouns — 'die Durchführung' instead of 'durchführen'), and Passiv everywhere. Master: 'Es lässt sich argumentieren, dass...', 'Daraus ergibt sich...', 'Zusammenfassend lässt sich feststellen...'" },
        { id: 'de_c1_u1_l3', title: "Debate & Argumentation", description: "Argue and negotiate in formal German", category: "speaking", level: "C1", duration: 15, xp: 55, order: 3, culturalHint: "German debate culture: logical, structured, evidence-based. 'Meines Erachtens...', 'Dem möchte ich entgegenhalten...', 'Das greift zu kurz, weil...' Germans respect well-constructed arguments over emotional appeals. Master Sachlichkeit (objectivity) — the highest German intellectual virtue." },
        { id: 'de_c1_u1_l4', title: "Reading: Academic German", description: "Understand academic papers and Wissenschaftssprache", category: "reading", level: "C1", duration: 18, xp: 55, order: 4, culturalHint: "Academic German (Wissenschaftssprache): 'Im Folgenden wird dargelegt...', 'Unter Berücksichtigung von...', 'Es sei darauf hingewiesen, dass...' Read about German philosophy (Kant, Hegel, Nietzsche, Heidegger) or engineering (Industrie 4.0, die Energiewende). German academic writing is notoriously dense." },
        { id: 'de_c1_u1_l5', title: "Write a Research Paper", description: "Compose an academic text in German", category: "writing", level: "C1", duration: 20, xp: 65, order: 5, culturalHint: "Write a Seminararbeit (seminar paper): Einleitung (introduction with Fragestellung/research question), Hauptteil (body with Argumentation), Fazit (conclusion). Use: 'Die vorliegende Arbeit untersucht...', 'Wie bereits erwähnt...', 'Abschließend lässt sich konstatieren...' German academic writing values thoroughness above all." },
      ],
    },
    {
      id: "de_c2_u1", title: "Perfektes Deutsch", level: "C2", order: 9,
      description: "Complete mastery of German language and culture",
      lessons: [
        { id: 'de_c2_u1_l1', title: "Cultural Deep Dive", description: "Every layer of German communication", category: "vocabulary", level: "C2", duration: 18, xp: 60, order: 1, culturalHint: "Master German cultural codes: Ordnung muss sein (There must be order), Gemütlichkeit (cozy togetherness), Wanderlust (desire to travel — another German gift to English), Feierabend (sacred end of workday), Vereinsleben (club life — Germans join Vereine for everything). Understand why Germans love rules, forests, and bread." },
        { id: 'de_c2_u1_l2', title: "Stylistic Mastery", description: "Use grammar for literary and rhetorical effect", category: "grammar", level: "C2", duration: 20, xp: 70, order: 2, culturalHint: "Stylistic German: master Konjunktiv I (reported speech in journalism), literary Präteritum, and the art of the German compound word (Zusammensetzung). Read Kafka's precise, nightmarish prose, Thomas Mann's endless sentences, and Hesse's philosophical clarity. German prose can be both brutally efficient and endlessly complex." },
        { id: 'de_c2_u1_l3', title: "Impromptu Speech", description: "Speak fluently on any topic in German", category: "speaking", level: "C2", duration: 15, xp: 65, order: 3, culturalHint: "Speak like a German intellectual: use Fremdwörter (foreign words adopted into German) naturally, employ irony and understatement, master the art of the Diskussion (discussion). German talk shows (Markus Lanz, Anne Will), university Vorlesungen, and Bundestag debates are your models." },
        { id: 'de_c2_u1_l4', title: "Reading: Satire & Kabarett", description: "Detect humor and social criticism in German media", category: "reading", level: "C2", duration: 18, xp: 60, order: 4, culturalHint: "German satire: Kabarett (political cabaret — a German art form), Der Postillon (German Onion), heute-show (German Daily Show). Understand: politische Satire, Gesellschaftskritik, schwarzer Humor. German humor targets bureaucracy (Bürokratie), rules (Vorschriften), and German stereotypes themselves." },
        { id: 'de_c2_u1_l5', title: "Creative Writing", description: "Write a short story with native German style", category: "writing", level: "C2", duration: 25, xp: 75, order: 5, culturalHint: "Write a short story set in Germany: capture the precision of German prose, use compound words creatively, weave in cultural themes: Heimat (homeland/belonging), Fernweh (longing for distant places), Zeitgeist (spirit of the times), Vergangenheitsbewältigung (confronting the past). Make the reader feel German Gemütlichkeit." },
      ],
    },
  ],
};

// Read the current file
const filePath = path.join(process.cwd(), 'lib/curriculum-data.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Generate the TypeScript code for each curriculum
function generateCurriculumTS(curriculum, varName) {
  let ts = `\n// ═══════════════════════════════════════════════════════════════════════════════\n`;
  ts += `// ${curriculum.name.toUpperCase()}\n`;
  ts += `// ═══════════════════════════════════════════════════════════════════════════════\n`;
  ts += `export const ${varName}: LanguageCurriculum = {\n`;
  ts += `  code: "${curriculum.code}",\n`;
  ts += `  name: "${curriculum.name}",\n`;
  ts += `  flag: "${curriculum.flag}",\n`;
  ts += `  totalLessons: ${curriculum.totalLessons},\n`;
  ts += `  totalUnits: ${curriculum.totalUnits},\n`;
  ts += `  estimatedHours: ${curriculum.estimatedHours},\n`;
  ts += `  units: [\n`;
  
  for (const unit of curriculum.units) {
    ts += `    {\n`;
    ts += `      id: "${unit.id}", title: "${unit.title}", level: "${unit.level}", order: ${unit.order},\n`;
    ts += `      description: "${unit.description}",\n`;
    ts += `      lessons: [\n`;
    for (const lesson of unit.lessons) {
      const hint = lesson.culturalHint ? `, culturalHint: ${JSON.stringify(lesson.culturalHint)}` : '';
      ts += `        { id: "${lesson.id}", title: ${JSON.stringify(lesson.title)}, description: ${JSON.stringify(lesson.description)}, category: "${lesson.category}", level: "${lesson.level}", duration: ${lesson.duration}, xp: ${lesson.xp}, order: ${lesson.order}${hint} },\n`;
    }
    ts += `      ],\n`;
    ts += `    },\n`;
  }
  
  ts += `  ],\n`;
  ts += `};\n`;
  return ts;
}

// Insert before the CURRICULUM REGISTRY section
const registryMarker = '// ═══════════════════════════════════════════════════════════════════════════════\n// CURRICULUM REGISTRY';
const koreanTS = generateCurriculumTS(KOREAN, 'KOREAN');
const italianTS = generateCurriculumTS(ITALIAN, 'ITALIAN');
const germanTS = generateCurriculumTS(GERMAN, 'GERMAN');

const insertionPoint = content.indexOf(registryMarker);
if (insertionPoint === -1) {
  console.error('Could not find CURRICULUM REGISTRY marker');
  process.exit(1);
}

content = content.slice(0, insertionPoint) + koreanTS + '\n' + italianTS + '\n' + germanTS + '\n' + content.slice(insertionPoint);

// Update ALL_CURRICULA to include the new languages
content = content.replace(
  `export const ALL_CURRICULA: Record<string, LanguageCurriculum> = {\n  "es": SPANISH_STANDARD,\n  "es-DO": SPANISH_DOMINICAN,\n  "es-MX": SPANISH_MEXICAN,\n  "fr": FRENCH,\n  "pt": PORTUGUESE,\n  "ja": JAPANESE,\n  "zh": MANDARIN,\n};`,
  `export const ALL_CURRICULA: Record<string, LanguageCurriculum> = {\n  "es": SPANISH_STANDARD,\n  "es-DO": SPANISH_DOMINICAN,\n  "es-MX": SPANISH_MEXICAN,\n  "fr": FRENCH,\n  "pt": PORTUGUESE,\n  "ja": JAPANESE,\n  "zh": MANDARIN,\n  "ko": KOREAN,\n  "it": ITALIAN,\n  "de": GERMAN,\n};`
);

fs.writeFileSync(filePath, content, 'utf8');

// Count results
const newHints = (content.match(/culturalHint:/g) || []).length;
console.log(`✅ Successfully added Korean, Italian, and German curricula!`);
console.log(`   Total culturalHints in file: ${newHints}`);
console.log(`   Korean: 45 lessons with culturalHints`);
console.log(`   Italian: 45 lessons with culturalHints`);
console.log(`   German: 45 lessons with culturalHints`);
