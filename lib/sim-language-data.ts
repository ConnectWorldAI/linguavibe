/**
 * Scalable language data for Live Conversation Simulation
 * Supports ALL 62 languages from the language pack.
 * 
 * Architecture:
 * - Core conversation data is provided for the top 12 most-studied languages
 * - All other languages use a template-based generation system that provides
 *   contextually appropriate phrases based on the language family
 * - Pronunciation tips are language-family-aware
 * - User response banks are language-specific where available, with fallback
 */

import { SUPPORTED_LANGUAGES, type AppLanguage } from "./i18n";

// ─── Types ──────────────────────────────────────────────────────────────────────
export type ScenarioId = "restaurant" | "airport" | "shopping" | "doctor" | "job_interview" | "directions" | "hotel" | "debate";

export type ConversationData = {
  prompt: string;
  responses: string[];
};

export type LanguageConversations = Record<ScenarioId, ConversationData>;
export type LanguageUserResponses = Record<ScenarioId, string[]>;
export type LanguagePronunciationTips = Record<ScenarioId, string>;
export type LanguageCorrectionTips = string[];

// ─── Language Family Classification ─────────────────────────────────────────────
type LanguageFamily = "romance" | "germanic" | "slavic" | "cjk" | "semitic" | "indic" | "bantu" | "austronesian" | "turkic" | "other";

const LANGUAGE_FAMILIES: Record<string, LanguageFamily> = {
  es: "romance", fr: "romance", pt: "romance", it: "romance", ro: "romance", ca: "romance", ht: "romance",
  en: "germanic", de: "germanic", nl: "germanic", sv: "germanic", no: "germanic", da: "germanic", af: "germanic",
  ru: "slavic", pl: "slavic", cs: "slavic", sk: "slavic", hr: "slavic", bg: "slavic", uk: "slavic",
  ja: "cjk", ko: "cjk", zh: "cjk",
  ar: "semitic", he: "semitic",
  hi: "indic", bn: "indic", ta: "indic", te: "indic", mr: "indic", gu: "indic", kn: "indic", ml: "indic", ur: "indic", pa: "indic", ne: "indic", si: "indic",
  sw: "bantu", yo: "bantu", ig: "bantu", zu: "bantu", am: "bantu",
  tl: "austronesian", id: "austronesian", ms: "austronesian",
  tr: "turkic", az: "turkic", kk: "turkic",
  th: "other", vi: "other", km: "other", my: "other", mn: "other", lo: "other", ka: "other",
  fi: "other", hu: "other", el: "other", lt: "other", fa: "other", ps: "other",
};

function getFamily(code: string): LanguageFamily {
  return LANGUAGE_FAMILIES[code] || "other";
}

// ─── Core Conversation Data (Top 12 Languages) ─────────────────────────────────
// Spanish, French, Portuguese, Japanese are already in live-simulation.tsx
// Adding: Korean, Chinese, Arabic, Hindi, Italian, German, Russian, Swahili

const CONVERSATIONS_KO: LanguageConversations = {
  restaurant: { prompt: "어서오세요! 주문하시겠어요?", responses: ["좋은 선택이에요. 음료는 뭘로 하시겠어요?", "오늘의 추천 메뉴는 비빔밥이에요.", "매운 거 괜찮으세요?", "디저트는 어떠세요? 팥빙수 있어요.", "주문 확인했습니다. 잠시만 기다려주세요.", "더 필요한 거 있으세요?", "계산은 카드로 하시겠어요?", "감사합니다. 또 오세요!"] },
  airport: { prompt: "여권 보여주시겠어요?", responses: ["수하물은 몇 개인가요?", "창가석과 복도석 중 어디를 원하시나요?", "탑승구는 B12번입니다.", "출발이 30분 지연되었습니다.", "기내 반입 수하물에 액체류가 있나요?", "짐을 트레이에 올려주세요.", "좋은 여행 되세요!", "환승 정보가 필요하신가요?", "직항편이신가요?", "라운지는 오른쪽 끝에 있습니다."] },
  shopping: { prompt: "어서오세요! 뭘 찾으세요?", responses: ["이 사과는 세 개에 5천원이에요.", "맛보시겠어요?", "특별 할인 중이에요.", "다른 거 더 필요하세요?", "그 가격에 드릴게요.", "봉투 필요하세요?", "또 오세요!", "카드도 되고 현금도 돼요."] },
  doctor: { prompt: "안녕하세요. 어디가 불편하세요?", responses: ["언제부터 그러셨어요?", "체온과 혈압을 재볼게요.", "알레르기가 있으신가요?", "약을 처방해드릴게요. 8시간마다 드세요.", "혈액검사가 필요해요.", "열이나 두통이 있으셨나요?", "3일 정도 쉬셔야 해요.", "일주일 후에도 안 나으시면 다시 오세요.", "보험증 가져오셨나요?", "물 많이 드시고 푹 쉬세요."] },
  job_interview: { prompt: "자기소개 부탁드립니다.", responses: ["왜 우리 회사에 지원하셨나요?", "본인의 강점은 뭐라고 생각하세요?", "스트레스 상황에서 어떻게 대처하세요?", "팀워크 경험이 있으신가요?", "5년 후 어떤 모습이길 원하세요?", "가장 큰 성과는 뭐였나요?", "궁금한 점 있으신가요?", "연봉은 4천만원 기본입니다.", "언제부터 출근 가능하세요?", "다음 주에 연락드리겠습니다.", "추가로 하실 말씀 있으세요?", "만나서 반가웠습니다."] },
  directions: { prompt: "안녕하세요! 길을 찾으시나요?", responses: ["미술관은 여기서 세 블록 직진이에요.", "사거리에서 왼쪽으로 도세요.", "큰 파란 간판이 보일 거예요.", "걸어서 10분 정도 걸려요.", "버스를 타시는 게 더 빠를 수도 있어요.", "도움이 되셨길 바랍니다!"] },
  hotel: { prompt: "안녕하세요. 예약하셨나요?", responses: ["바다가 보이는 더블룸이 준비되어 있습니다.", "조식은 7시부터 10시까지입니다.", "짐 도와드릴까요?", "수영장은 밤 10시까지 이용 가능합니다.", "모닝콜 설정해드릴까요?", "와이파이는 무료입니다.", "수건이 더 필요하시면 프론트에 연락주세요.", "즐거운 숙박 되세요!"] },
  debate: { prompt: "길거리 음식과 고급 레스토랑, 어떻게 생각하세요?", responses: ["흥미로운 관점이네요. 진정성이 더 중요하지 않을까요?", "제 경험상 최고의 맛은 시장에 있어요.", "놀라웠던 나라의 음식이 있나요?", "각 문화마다 '좋은 음식'의 정의가 다르죠.", "미식 관광에 대해 어떻게 생각하세요?", "세계화가 음식 문화를 많이 바꿨죠.", "가장 과소평가된 음식은 뭘까요?", "재미있는 대화였어요. 마지막으로 하실 말씀은?", "블로그를 쓰셔도 좋을 것 같아요.", "AI가 요리를 할 수 있을까요?", "좋은 답변이에요.", "대화 즐거웠습니다!"] },
};

const CONVERSATIONS_ZH: LanguageConversations = {
  restaurant: { prompt: "欢迎光临！请问您想点什么？", responses: ["好的选择。您要喝点什么？", "今天的推荐菜是宫保鸡丁。", "您能吃辣吗？", "要不要来个甜点？我们有芒果布丁。", "好的，请稍等。", "还需要别的吗？", "您是刷卡还是现金？", "谢谢光临，欢迎下次再来！"] },
  airport: { prompt: "请出示您的护照。", responses: ["您有几件行李？", "您想要靠窗还是靠走道的座位？", "您的登机口是B12。", "航班延误了25分钟。", "随身行李里有液体吗？", "请把物品放在托盘里。", "祝您旅途愉快！", "需要转机信息吗？", "是直飞航班吗？", "贵宾休息室在右边尽头。"] },
  shopping: { prompt: "您好！看看有什么需要的？", responses: ["这些苹果三个十块。", "要尝尝吗？", "今天特价优惠。", "还要别的吗？", "好，就这个价给您。", "需要袋子吗？", "欢迎再来！", "现金和刷卡都可以。"] },
  doctor: { prompt: "您好，哪里不舒服？", responses: ["什么时候开始的？", "我量一下体温和血压。", "有药物过敏吗？", "我给您开个处方，每8小时吃一次。", "需要验血。", "有发烧或头痛吗？", "至少休息三天。", "一周后如果没好转请再来。", "带医保卡了吗？", "多喝水，好好休息。"] },
  job_interview: { prompt: "请介绍一下自己。", responses: ["为什么想加入我们公司？", "您觉得自己最大的优势是什么？", "压力大的时候您怎么处理？", "有团队合作经验吗？", "五年后您想达到什么目标？", "您最大的成就是什么？", "有什么问题想问的吗？", "基本年薪是40万。", "什么时候能入职？", "下周会通知您结果。", "还有什么要补充的吗？", "很高兴认识您。"] },
  directions: { prompt: "您好！需要帮忙找路吗？", responses: ["美术馆往前走三个路口。", "到十字路口左转。", "会看到一个大蓝色牌子。", "走路大概十分钟。", "坐公交可能更快。", "希望对您有帮助！"] },
  hotel: { prompt: "您好，请问有预订吗？", responses: ["给您准备了海景双人房。", "早餐时间是7点到10点。", "需要帮您拿行李吗？", "游泳池开放到晚上10点。", "需要叫醒服务吗？", "WiFi是免费的。", "需要额外毛巾请打前台电话。", "祝您住得愉快！"] },
  debate: { prompt: "街头小吃和高级餐厅，您怎么看？", responses: ["有趣的观点。但真实性不是更重要吗？", "我觉得最好的味道在市场里。", "有没有哪个国家的食物让您惊喜？", "每种文化对'好吃'的定义不同。", "您怎么看美食旅游？", "全球化确实改变了很多饮食文化。", "最被低估的菜是什么？", "聊得很开心，最后想说什么？", "您应该写个美食博客。", "AI能做饭吗？", "说得好。", "很高兴和您聊天！"] },
};

const CONVERSATIONS_AR: LanguageConversations = {
  restaurant: { prompt: "!أهلاً وسهلاً! ماذا تريد أن تطلب؟", responses: ["اختيار ممتاز. ماذا تريد أن تشرب؟", ".طبق اليوم هو الكبسة", "هل تحب الأكل الحار؟", "تريد حلوى؟ عندنا كنافة.", ".تمام، طلبك جاهز بعد قليل", "تحتاج شيء ثاني؟", "تدفع كاش ولا بالبطاقة؟", "!شكراً لزيارتك"] },
  airport: { prompt: ".من فضلك، أرني جواز سفرك", responses: ["كم حقيبة عندك؟", "تفضل مقعد عند النافذة ولا الممر؟", ".بوابة الصعود رقم B12", ".الرحلة متأخرة 25 دقيقة", "عندك سوائل في حقيبة اليد؟", ".ضع أغراضك في الصينية", "!رحلة سعيدة", "تحتاج معلومات عن الرحلات المتصلة؟", "رحلة مباشرة؟", ".صالة كبار الشخصيات على اليمين"] },
  shopping: { prompt: "!أهلاً! شو تبحث عنه؟", responses: [".ثلاث تفاحات بخمسة", "تبي تجرب؟", ".اليوم عندنا عرض خاص", "تبي شيء ثاني؟", ".خلاص، بهالسعر", "تبي كيس؟", "!تعال مرة ثانية", ".نقبل كاش وبطاقة"] },
  doctor: { prompt: "أهلاً، وين تحس بألم؟", responses: ["من متى وأنت كذا؟", ".خلني أقيس حرارتك وضغطك", "عندك حساسية من أي دواء؟", ".بكتب لك وصفة. خذ الدواء كل 8 ساعات", ".نحتاج تحليل دم", "كان عندك حرارة أو صداع؟", ".لازم ترتاح ثلاث أيام على الأقل", ".إذا ما تحسنت خلال أسبوع، ارجع", "معاك بطاقة التأمين؟", ".اشرب ماء كثير وارتاح"] },
  job_interview: { prompt: ".عرفنا عن نفسك", responses: ["ليش تبي تشتغل عندنا؟", "شو أقوى نقاط قوتك؟", "كيف تتعامل مع الضغط؟", "عندك خبرة في العمل الجماعي؟", "وين تشوف نفسك بعد خمس سنوات؟", "شو أكبر إنجاز حققته؟", "عندك أي أسئلة؟", ".الراتب الأساسي 15 ألف شهرياً", "متى تقدر تبدأ؟", ".بنتواصل معاك الأسبوع الجاي", "تبي تضيف شيء؟", ".تشرفنا فيك"] },
  directions: { prompt: "!أهلاً! تبي مساعدة بالطريق؟", responses: [".المتحف على طول ثلاث شوارع", ".عند التقاطع، لف يسار", ".بتشوف لوحة زرقاء كبيرة", ".مشي تقريباً عشر دقائق", ".الباص ممكن يكون أسرع", "!إن شاء الله تلاقيه بسهولة"] },
  hotel: { prompt: "أهلاً، عندك حجز؟", responses: [".جهزنا لك غرفة مزدوجة بإطلالة على البحر", ".الفطور من 7 إلى 10", "تبي مساعدة بالشنط؟", ".المسبح مفتوح لحد 10 بالليل", "تبي خدمة إيقاظ؟", ".الواي فاي مجاني", ".إذا تبي مناشف زيادة، اتصل بالاستقبال", "!نتمنى لك إقامة سعيدة"] },
  debate: { prompt: "أكل الشارع ولا المطاعم الفاخرة، شو رأيك؟", responses: ["رأي مثير. بس مو الأصالة أهم؟", ".أحسن نكهات بالأسواق الشعبية", "في بلد فاجأك أكله؟", ".كل ثقافة عندها تعريف مختلف للأكل الزين", "شو رأيك بالسياحة الغذائية؟", ".العولمة غيرت كثير بثقافة الأكل", "شو أكثر أكلة ما تاخذ حقها؟", "كلام حلو. شيء أخير؟", ".لازم تفتح مدونة أكل", "تتوقع الذكاء الاصطناعي يطبخ يوم؟", ".كلام سليم", "!سعدت بالحوار"] },
};

const CONVERSATIONS_HI: LanguageConversations = {
  restaurant: { prompt: "नमस्ते! आप क्या ऑर्डर करना चाहेंगे?", responses: ["बढ़िया चुनाव। पीने के लिए क्या लेंगे?", "आज का स्पेशल बिरयानी है।", "तीखा चलेगा?", "मिठाई लेंगे? गुलाब जामुन है।", "ठीक है, थोड़ी देर में आता है।", "और कुछ चाहिए?", "कैश या कार्ड?", "शुक्रिया, फिर आइएगा!"] },
  airport: { prompt: "कृपया अपना पासपोर्ट दिखाइए।", responses: ["कितने बैग हैं?", "विंडो सीट चाहिए या आइल?", "आपका गेट B12 है।", "फ्लाइट 25 मिनट लेट है।", "हैंड बैग में कोई लिक्विड है?", "सामान ट्रे में रखिए।", "शुभ यात्रा!", "कनेक्टिंग फ्लाइट की जानकारी चाहिए?", "डायरेक्ट फ्लाइट है?", "लाउंज दाईं तरफ है।"] },
  shopping: { prompt: "नमस्ते! क्या चाहिए?", responses: ["तीन सेब पचास रुपये।", "चख कर देखिए।", "आज स्पेशल ऑफर है।", "और कुछ?", "ठीक है, इतने में दे दूंगा।", "थैली चाहिए?", "फिर आइएगा!", "कैश और कार्ड दोनों चलता है।"] },
  doctor: { prompt: "नमस्ते, क्या तकलीफ है?", responses: ["कब से है?", "तापमान और BP चेक करता हूं।", "किसी दवाई से एलर्जी?", "दवाई लिख रहा हूं, हर 8 घंटे में लीजिए।", "ब्लड टेस्ट करवाना होगा।", "बुखार या सिरदर्द था?", "कम से कम तीन दिन आराम कीजिए।", "एक हफ्ते में ठीक न हो तो फिर आइए।", "हेल्थ कार्ड लाए हैं?", "पानी खूब पीजिए और आराम कीजिए।"] },
  job_interview: { prompt: "अपने बारे में बताइए।", responses: ["हमारी कंपनी में क्यों आना चाहते हैं?", "आपकी सबसे बड़ी ताकत क्या है?", "प्रेशर में कैसे काम करते हैं?", "टीम वर्क का अनुभव है?", "पांच साल बाद खुद को कहां देखते हैं?", "सबसे बड़ी उपलब्धि क्या रही?", "कोई सवाल?", "बेसिक सैलरी 8 लाख सालाना है।", "कब से जॉइन कर सकते हैं?", "अगले हफ्ते बताएंगे।", "कुछ और कहना चाहते हैं?", "मिलकर अच्छा लगा।"] },
  directions: { prompt: "नमस्ते! रास्ता ढूंढ रहे हैं?", responses: ["म्यूज़ियम सीधे तीन ब्लॉक आगे है।", "चौराहे पर बाएं मुड़िए।", "बड़ा नीला बोर्ड दिखेगा।", "पैदल दस मिनट लगेंगे।", "बस से जल्दी पहुंचेंगे।", "उम्मीद है मदद हुई!"] },
  hotel: { prompt: "नमस्ते, रिज़र्वेशन है?", responses: ["समुद्र के नज़ारे वाला डबल रूम तैयार है।", "नाश्ता 7 से 10 बजे तक है।", "सामान में मदद चाहिए?", "स्विमिंग पूल रात 10 बजे तक खुला है।", "मॉर्निंग कॉल चाहिए?", "वाईफाई फ्री है।", "एक्स्ट्रा तौलिए के लिए रिसेप्शन पर कॉल करें।", "अच्छा रहिए!"] },
  debate: { prompt: "स्ट्रीट फूड बनाम फाइन डाइनिंग, आपकी क्या राय है?", responses: ["दिलचस्प बात है। लेकिन असलियत ज़्यादा मायने नहीं रखती?", "मेरे हिसाब से बेस्ट स्वाद बाज़ारों में मिलता है।", "किसी देश का खाना जो चौंका दे?", "हर संस्कृति की 'अच्छे खाने' की अलग परिभाषा है।", "फूड टूरिज्म के बारे में क्या सोचते हैं?", "ग्लोबलाइज़ेशन ने खाने की दुनिया बदल दी।", "सबसे अंडररेटेड डिश कौन सी है?", "बढ़िया बातचीत रही। आखिरी बात?", "आपको फूड ब्लॉग लिखना चाहिए।", "AI खाना बना पाएगा?", "सही कहा।", "बात करके मज़ा आया!"] },
};

const CONVERSATIONS_IT: LanguageConversations = {
  restaurant: { prompt: "Benvenuto! Cosa desidera ordinare?", responses: ["Ottima scelta. Da bere cosa prende?", "Il piatto del giorno è il risotto ai funghi.", "Preferisce la carne al sangue o ben cotta?", "Un dolce? Abbiamo il tiramisù fatto in casa.", "Perfetto. Sarà pronto in dieci minuti.", "Ha bisogno di altro?", "Paga in contanti o con carta?", "Grazie e arrivederci!"] },
  airport: { prompt: "Il passaporto, per favore.", responses: ["Quanti bagagli ha?", "Preferisce il posto finestrino o corridoio?", "Il suo gate è il B12.", "Il volo ha un ritardo di 25 minuti.", "Ha liquidi nel bagaglio a mano?", "Metta gli oggetti nel vassoio.", "Buon viaggio!", "Ha bisogno di informazioni sui collegamenti?", "È un volo diretto?", "La sala VIP è in fondo a destra."] },
  shopping: { prompt: "Buongiorno! Cosa cerca?", responses: ["Tre mele a due euro.", "Vuole assaggiare?", "Oggi c'è un'offerta speciale.", "Altro?", "Va bene, glieli lascio a quel prezzo.", "Le serve un sacchetto?", "Torni presto!", "Accettiamo contanti e carta."] },
  doctor: { prompt: "Buongiorno. Quali sono i sintomi?", responses: ["Da quanto tempo si sente così?", "Le misuro la temperatura e la pressione.", "È allergico a qualche farmaco?", "Le prescrivo un antibiotico. Lo prenda ogni 8 ore.", "Serve un esame del sangue.", "Ha avuto febbre o mal di testa?", "Deve riposare almeno tre giorni.", "Se non migliora entro una settimana, torni.", "Ha la tessera sanitaria?", "Beva molta acqua e si riposi."] },
  job_interview: { prompt: "Mi parli di lei.", responses: ["Perché vuole lavorare nella nostra azienda?", "Quali sono i suoi punti di forza?", "Come gestisce lo stress?", "Ha esperienza di lavoro in team?", "Dove si vede tra cinque anni?", "Qual è stato il suo più grande successo?", "Ha domande?", "Lo stipendio base è di 35.000 euro annui.", "Quando potrebbe iniziare?", "La contatteremo la prossima settimana.", "Vuole aggiungere qualcosa?", "È stato un piacere conoscerla."] },
  directions: { prompt: "Buongiorno! Ha bisogno di indicazioni?", responses: ["Il museo è a tre isolati dritto.", "All'incrocio giri a sinistra.", "Vedrà un grande cartello blu.", "A piedi sono circa dieci minuti.", "L'autobus potrebbe essere più veloce.", "Spero di esserle stato utile!"] },
  hotel: { prompt: "Buongiorno. Ha una prenotazione?", responses: ["Le abbiamo preparato una camera doppia con vista mare.", "La colazione è dalle 7 alle 10.", "Ha bisogno di aiuto con i bagagli?", "La piscina è aperta fino alle 22.", "Desidera la sveglia?", "Il WiFi è gratuito.", "Per asciugamani extra chiami la reception.", "Le auguriamo un buon soggiorno!"] },
  debate: { prompt: "Cibo di strada o ristoranti eleganti, cosa ne pensa?", responses: ["Punto di vista interessante. Ma l'autenticità non conta di più?", "Secondo me i sapori migliori sono nei mercati.", "C'è un paese il cui cibo l'ha sorpresa?", "Ogni cultura ha la sua definizione di 'buon cibo'.", "Cosa pensa del turismo gastronomico?", "La globalizzazione ha cambiato molto la gastronomia.", "Qual è il piatto più sottovalutato?", "Bella conversazione. Un ultimo pensiero?", "Dovrebbe aprire un blog di cucina.", "Pensa che l'AI potrà cucinare?", "Ben detto.", "È stato un piacere parlare con lei!"] },
};

const CONVERSATIONS_DE: LanguageConversations = {
  restaurant: { prompt: "Willkommen! Was möchten Sie bestellen?", responses: ["Gute Wahl. Was möchten Sie trinken?", "Das Tagesgericht ist Schnitzel mit Kartoffelsalat.", "Mögen Sie es scharf?", "Ein Dessert? Wir haben hausgemachten Apfelstrudel.", "Perfekt. Es dauert etwa zehn Minuten.", "Brauchen Sie noch etwas?", "Zahlen Sie bar oder mit Karte?", "Vielen Dank und auf Wiedersehen!"] },
  airport: { prompt: "Ihren Reisepass bitte.", responses: ["Wie viele Gepäckstücke haben Sie?", "Möchten Sie einen Fenster- oder Gangplatz?", "Ihr Gate ist B12.", "Der Flug hat 25 Minuten Verspätung.", "Haben Sie Flüssigkeiten im Handgepäck?", "Legen Sie Ihre Sachen in die Schale.", "Guten Flug!", "Brauchen Sie Informationen zu Anschlussflügen?", "Ist es ein Direktflug?", "Die Lounge ist rechts am Ende."] },
  shopping: { prompt: "Guten Tag! Was suchen Sie?", responses: ["Drei Äpfel für zwei Euro.", "Möchten Sie probieren?", "Heute gibt es ein Sonderangebot.", "Noch etwas?", "In Ordnung, zu diesem Preis.", "Brauchen Sie eine Tüte?", "Kommen Sie bald wieder!", "Wir nehmen Bar und Karte."] },
  doctor: { prompt: "Guten Tag. Was sind Ihre Beschwerden?", responses: ["Seit wann haben Sie das?", "Ich messe Temperatur und Blutdruck.", "Sind Sie gegen Medikamente allergisch?", "Ich verschreibe Ihnen ein Antibiotikum. Alle 8 Stunden.", "Wir brauchen eine Blutuntersuchung.", "Hatten Sie Fieber oder Kopfschmerzen?", "Sie sollten mindestens drei Tage ruhen.", "Wenn es in einer Woche nicht besser wird, kommen Sie wieder.", "Haben Sie Ihre Versichertenkarte?", "Trinken Sie viel Wasser und ruhen Sie sich aus."] },
  job_interview: { prompt: "Erzählen Sie mir von sich.", responses: ["Warum möchten Sie bei uns arbeiten?", "Was sind Ihre Stärken?", "Wie gehen Sie mit Stress um?", "Haben Sie Erfahrung in Teamarbeit?", "Wo sehen Sie sich in fünf Jahren?", "Was war Ihr größter Erfolg?", "Haben Sie Fragen?", "Das Grundgehalt beträgt 45.000 Euro jährlich.", "Wann könnten Sie anfangen?", "Wir melden uns nächste Woche.", "Möchten Sie noch etwas hinzufügen?", "Es war schön, Sie kennenzulernen."] },
  directions: { prompt: "Hallo! Suchen Sie etwas?", responses: ["Das Museum ist drei Blocks geradeaus.", "An der Kreuzung links abbiegen.", "Sie sehen ein großes blaues Schild.", "Zu Fuß etwa zehn Minuten.", "Der Bus wäre schneller.", "Ich hoffe, das hilft!"] },
  hotel: { prompt: "Guten Tag. Haben Sie eine Reservierung?", responses: ["Wir haben ein Doppelzimmer mit Meerblick.", "Frühstück ist von 7 bis 10 Uhr.", "Brauchen Sie Hilfe mit dem Gepäck?", "Der Pool ist bis 22 Uhr geöffnet.", "Möchten Sie einen Weckruf?", "WLAN ist kostenlos.", "Für extra Handtücher rufen Sie die Rezeption an.", "Wir wünschen einen angenehmen Aufenthalt!"] },
  debate: { prompt: "Straßenessen oder Feinschmecker-Restaurant, was denken Sie?", responses: ["Interessanter Standpunkt. Aber zählt Authentizität nicht mehr?", "Die besten Aromen findet man auf Märkten.", "Gab es ein Land, dessen Essen Sie überrascht hat?", "Jede Kultur definiert 'gutes Essen' anders.", "Was halten Sie von Gastro-Tourismus?", "Die Globalisierung hat die Esskultur verändert.", "Welches Gericht ist am meisten unterschätzt?", "Schönes Gespräch. Ein letzter Gedanke?", "Sie sollten einen Food-Blog schreiben.", "Kann KI kochen?", "Gut gesagt.", "Es war mir ein Vergnügen!"] },
};

const CONVERSATIONS_RU: LanguageConversations = {
  restaurant: { prompt: "Добро пожаловать! Что будете заказывать?", responses: ["Отличный выбор. Что будете пить?", "Блюдо дня — борщ.", "Острое нормально?", "Десерт? У нас есть домашний медовик.", "Хорошо, будет готово через десять минут.", "Ещё что-нибудь?", "Наличными или картой?", "Спасибо, приходите ещё!"] },
  airport: { prompt: "Паспорт, пожалуйста.", responses: ["Сколько у вас багажа?", "Место у окна или у прохода?", "Ваш гейт B12.", "Рейс задерживается на 25 минут.", "Есть жидкости в ручной клади?", "Положите вещи в лоток.", "Хорошего полёта!", "Нужна информация о пересадках?", "Прямой рейс?", "Лаунж справа в конце."] },
  shopping: { prompt: "Здравствуйте! Что ищете?", responses: ["Три яблока за сто рублей.", "Хотите попробовать?", "Сегодня скидка.", "Ещё что-нибудь?", "Ладно, отдам за эту цену.", "Пакет нужен?", "Приходите ещё!", "Принимаем наличные и карту."] },
  doctor: { prompt: "Здравствуйте. На что жалуетесь?", responses: ["Как давно это началось?", "Измерю температуру и давление.", "Есть аллергия на лекарства?", "Выпишу антибиотик. Принимайте каждые 8 часов.", "Нужен анализ крови.", "Была температура или головная боль?", "Нужен покой минимум три дня.", "Если через неделю не пройдёт, приходите снова.", "Полис с собой?", "Пейте больше воды и отдыхайте."] },
  job_interview: { prompt: "Расскажите о себе.", responses: ["Почему хотите работать у нас?", "Какие ваши сильные стороны?", "Как справляетесь со стрессом?", "Есть опыт командной работы?", "Где видите себя через пять лет?", "Какое ваше главное достижение?", "Есть вопросы?", "Базовая зарплата — 150 тысяч в месяц.", "Когда можете начать?", "Свяжемся на следующей неделе.", "Хотите что-то добавить?", "Приятно было познакомиться."] },
  directions: { prompt: "Здравствуйте! Ищете что-то?", responses: ["Музей — три квартала прямо.", "На перекрёстке поверните налево.", "Увидите большую синюю вывеску.", "Пешком минут десять.", "На автобусе быстрее.", "Надеюсь, помог!"] },
  hotel: { prompt: "Здравствуйте. У вас бронь?", responses: ["Для вас двухместный номер с видом на море.", "Завтрак с 7 до 10.", "Помочь с багажом?", "Бассейн работает до 22:00.", "Нужен будильник?", "Wi-Fi бесплатный.", "За дополнительными полотенцами звоните на ресепшн.", "Приятного отдыха!"] },
  debate: { prompt: "Уличная еда или рестораны — что думаете?", responses: ["Интересная точка зрения. Но разве подлинность не важнее?", "Лучшие вкусы — на рынках.", "Еда какой страны вас удивила?", "У каждой культуры своё понятие вкусной еды.", "Что думаете о гастрономическом туризме?", "Глобализация сильно изменила кухню.", "Какое блюдо самое недооценённое?", "Отличный разговор. Последняя мысль?", "Вам стоит вести фуд-блог.", "Сможет ли ИИ готовить?", "Хорошо сказано.", "Было приятно пообщаться!"] },
};

const CONVERSATIONS_SW: LanguageConversations = {
  restaurant: { prompt: "Karibu! Ungependa kuagiza nini?", responses: ["Chaguo zuri. Utakunywa nini?", "Mlo wa leo ni pilau.", "Unapenda chakula cha viungo?", "Kitindamlo? Tuna mandazi ya nyumbani.", "Sawa, itakuwa tayari dakika kumi.", "Unahitaji kitu kingine?", "Utalipa taslimu au kadi?", "Asante, karibu tena!"] },
  airport: { prompt: "Tafadhali onyesha pasipoti yako.", responses: ["Una mizigo mingapi?", "Unataka kiti cha dirisha au njia?", "Lango lako ni B12.", "Ndege imechelewa dakika 25.", "Una vimiminika katika mzigo wa mkono?", "Weka vitu vyako kwenye trei.", "Safari njema!", "Unahitaji habari za uhamisho?", "Ni ndege ya moja kwa moja?", "Sebule ya VIP iko kulia mwishoni."] },
  shopping: { prompt: "Habari! Unatafuta nini?", responses: ["Maembe matatu kwa elfu tano.", "Ungependa kujaribu?", "Leo kuna ofa maalum.", "Kitu kingine?", "Sawa, bei hiyo.", "Unahitaji mfuko?", "Karibu tena!", "Tunakubali taslimu na kadi."] },
  doctor: { prompt: "Habari. Una matatizo gani?", responses: ["Tangu lini?", "Nitapima joto na shinikizo.", "Una mzio wa dawa yoyote?", "Nitakuandikia dawa. Tumia kila masaa 8.", "Tunahitaji kipimo cha damu.", "Ulikuwa na homa au maumivu ya kichwa?", "Pumzika angalau siku tatu.", "Kama haiboreshi ndani ya wiki, rudi.", "Una kadi ya bima?", "Kunywa maji mengi na pumzika."] },
  job_interview: { prompt: "Tuambie kuhusu wewe.", responses: ["Kwa nini unataka kufanya kazi nasi?", "Nguvu zako kuu ni zipi?", "Unashughulikiaje msongo?", "Una uzoefu wa kufanya kazi kwa timu?", "Unajiona wapi baada ya miaka mitano?", "Mafanikio yako makubwa ni yapi?", "Una maswali?", "Mshahara wa msingi ni milioni moja kwa mwezi.", "Unaweza kuanza lini?", "Tutawasiliana wiki ijayo.", "Ungependa kuongeza kitu?", "Imekuwa vizuri kukutana nawe."] },
  directions: { prompt: "Habari! Unahitaji msaada wa njia?", responses: ["Makumbusho ni vitalu vitatu moja kwa moja.", "Kwenye makutano, geuka kushoto.", "Utaona bango kubwa la bluu.", "Kwa miguu ni dakika kumi.", "Basi inaweza kuwa haraka zaidi.", "Natumai nimesaidia!"] },
  hotel: { prompt: "Habari. Una uhifadhi?", responses: ["Tumekuandalia chumba cha wawili chenye mtazamo wa bahari.", "Kifungua kinywa ni saa 1 hadi 4 asubuhi.", "Unahitaji msaada na mizigo?", "Bwawa la kuogelea linafungwa saa 4 usiku.", "Unataka huduma ya kuamsha?", "WiFi ni bure.", "Kwa taulo za ziada piga simu mapokezi.", "Furahia kukaa kwako!"] },
  debate: { prompt: "Chakula cha mtaani au migahawa ya kifahari, unafikiri nini?", responses: ["Maoni ya kuvutia. Lakini uhalisi si muhimu zaidi?", "Ladha bora ziko masokoni.", "Kuna nchi ambayo chakula chake kilikushangaza?", "Kila utamaduni una ufafanuzi wake wa 'chakula kizuri'.", "Unafikiri nini kuhusu utalii wa chakula?", "Utandawazi umebadilisha sana upishi.", "Ni sahani gani isiyothaminiwa zaidi?", "Mazungumzo mazuri. Wazo la mwisho?", "Unapaswa kuandika blogu ya chakula.", "AI inaweza kupika?", "Umesema vizuri.", "Imekuwa vizuri kuzungumza nawe!"] },
};

// ─── All Core Conversations Map ─────────────────────────────────────────────────
export const CORE_CONVERSATIONS: Partial<Record<AppLanguage, LanguageConversations>> = {
  ko: CONVERSATIONS_KO,
  zh: CONVERSATIONS_ZH,
  ar: CONVERSATIONS_AR,
  hi: CONVERSATIONS_HI,
  it: CONVERSATIONS_IT,
  de: CONVERSATIONS_DE,
  ru: CONVERSATIONS_RU,
  sw: CONVERSATIONS_SW,
};

// ─── Universal User Response Banks ──────────────────────────────────────────────
// For languages without full conversation data, we provide generic responses
// that work contextually for any language
export const USER_RESPONSES_BY_LANG: Partial<Record<AppLanguage, Record<ScenarioId, string[]>>> = {
  ko: {
    restaurant: ["파에야 주세요", "미네랄 워터요", "미디엄으로요", "네, 디저트 좋아요", "감사합니다", "괜찮아요", "카드로요", "감사합니다, 좋은 저녁 되세요"],
    airport: ["여기 여권이요", "네, 큰 가방 하나요", "창가석이요", "알겠습니다", "괜찮아요, 기다릴게요", "노트북만요", "준비됐어요", "감사합니다", "직항이에요", "감사합니다"],
    shopping: ["망고 얼마예요?", "맛있네요", "좀 깎아주세요", "아보카도 세 개 주세요", "좋아요", "네, 부탁해요", "감사합니다! 또 올게요", "여기요"],
    doctor: ["목이 아프고 기침이 나요", "3일 전부터요", "알겠습니다", "아니요, 알레르기 없어요", "8시간마다요, 알겠습니다", "네", "미열이 좀 있었어요", "그렇게 할게요", "네, 여기요", "감사합니다"],
    job_interview: ["마케팅 5년 경력이 있습니다", "혁신적인 접근이 인상적이었습니다", "체계적이고 압박에 강합니다", "심호흡하고 우선순위를 정합니다", "네, 항상 팀으로 일했습니다", "크리에이티브 팀을 이끌고 싶습니다", "매출 3배 캠페인을 진행했습니다", "팀 문화는 어떤가요?", "2주 후 시작 가능합니다", "연락 기다리겠습니다", "매우 의욕적입니다", "감사합니다"],
    directions: ["네, 미술관 찾고 있어요", "세 블록 직진이요", "왼쪽이요, 알겠습니다", "감사합니다", "걸어갈게요", "정말 감사합니다!"],
    hotel: ["네, 김 이름으로요", "바다 전망 좋네요!", "괜찮아요, 혼자 할 수 있어요", "오늘 밤 갈게요", "아침 7시에 부탁해요", "감사합니다", "알겠습니다", "감사합니다!"],
    debate: ["둘 다 매력이 있죠", "맞아요, 진정성이 중요해요", "페루 음식이 놀라웠어요", "맞아요, 주관적이죠", "존중하면 긍정적이라고 봐요", "맞아요, 퓨전은 어디에나", "떡볶이요", "재미있었어요", "언젠가요", "기술이 발전하니까요", "감사합니다", "또 만나요!"],
  },
  zh: {
    restaurant: ["我要宫保鸡丁", "矿泉水", "中辣", "好的，来个甜点", "谢谢", "不用了", "刷卡", "谢谢，再见"],
    airport: ["这是我的护照", "一个大箱子", "靠窗", "好的，谢谢", "没关系，我等", "只有笔记本", "准备好了", "谢谢", "直飞", "谢谢"],
    shopping: ["芒果多少钱？", "很好吃", "能便宜点吗？", "要三个牛油果", "好的", "要的", "谢谢！下次再来", "给您"],
    doctor: ["嗓子疼，咳嗽", "三天了", "好的", "没有过敏", "每8小时，知道了", "好", "有点低烧", "会的，谢谢", "在这里", "谢谢医生"],
    job_interview: ["我有五年营销经验", "贵公司的创新理念吸引我", "我很有条理，抗压能力强", "深呼吸，排优先级", "是的，一直是团队合作", "希望带领创意团队", "做过一个三倍销售的项目", "团队氛围怎么样？", "两周后可以入职", "等您消息", "我非常有动力", "谢谢"],
    directions: ["是的，找美术馆", "直走三个路口", "左转，明白了", "谢谢", "我走路去", "非常感谢！"],
    hotel: ["是的，姓王", "海景太好了！", "不用，我自己来", "今晚去", "早上7点叫醒", "好的，谢谢", "记住了", "谢谢！"],
    debate: ["各有各的好", "对，真实性很重要", "秘鲁菜让我惊喜", "对，很主观", "尊重的话是好事", "对，到处都有融合", "我说兰州拉面", "聊得很开心", "也许有一天", "技术在进步", "谢谢", "下次见！"],
  },
  ar: {
    restaurant: ["أبي كبسة لو سمحت", "ماء معدني", "متوسط الحرارة", "أيوا، حلوى", "شكراً", "لا، كويس", "بالبطاقة", "شكراً، مع السلامة"],
    airport: ["تفضل جوازي", "حقيبة وحدة كبيرة", "عند النافذة", "تمام، شكراً", "ما فيه مشكلة، بنتظر", "بس اللابتوب", "جاهز", "شكراً", "مباشر", "شكراً"],
    shopping: ["كم المانجو؟", "لذيذ", "ممكن تنزل شوي؟", "أعطني ثلاث أفوكادو", "تمام", "أيوا", "شكراً! بارجع", "تفضل"],
    doctor: ["حلقي يعورني وعندي كحة", "من ثلاث أيام", "تمام", "لا، ما عندي حساسية", "كل 8 ساعات، فهمت", "أوكي", "شوي حرارة", "إن شاء الله", "تفضل", "شكراً دكتور"],
    job_interview: ["عندي خمس سنوات خبرة بالتسويق", "أعجبني ابتكار الشركة", "منظم وأشتغل تحت الضغط", "أتنفس وأرتب الأولويات", "دايماً أشتغل مع فريق", "أبي أقود فريق إبداعي", "حملة ضاعفت المبيعات ثلاث مرات", "كيف ثقافة الفريق؟", "أقدر أبدأ بعد أسبوعين", "بنتظر اتصالكم", "أنا متحمس جداً", "شكراً لكم"],
    directions: ["أيوا، أدور المتحف", "ثلاث شوارع على طول", "يسار، فهمت", "شكراً", "أفضل أمشي", "شكراً جزيلاً!"],
    hotel: ["أيوا، باسم الغامدي", "حلوة الإطلالة!", "لا شكراً، أقدر", "بروح الليلة", "الساعة 7 الصبح", "تمام، شكراً", "إن شاء الله", "شكراً!"],
    debate: ["كلهم حلوين", "صح، الأصالة مهمة", "الأكل البيروفي فاجأني", "صح، شيء شخصي", "إيجابي لو بإحترام", "صح، في فيوجن بكل مكان", "أقول الكبسة", "كان ممتع", "يمكن يوم", "التقنية تتطور", "شكراً", "إلى اللقاء!"],
  },
  it: {
    restaurant: ["Vorrei il risotto, per favore", "Acqua minerale, grazie", "Media cottura", "Sì, il tiramisù", "Perfetto, grazie", "No, sto bene", "Con carta", "Grazie, buona serata"],
    airport: ["Ecco il passaporto", "Sì, una valigia grande", "Finestrino, per favore", "Capito, grazie", "Nessun problema, aspetto", "Solo il portatile", "Pronto", "Grazie mille", "Diretto", "Grazie"],
    shopping: ["Quanto costano i manghi?", "Buonissimi", "Può fare un po' meno?", "Tre avocado, per favore", "Va bene, affare fatto", "Sì, grazie", "Grazie! Tornerò", "Ecco a lei"],
    doctor: ["Mi fa male la gola e ho la tosse", "Da tre giorni", "D'accordo", "No, nessuna allergia", "Ogni 8 ore, capito", "Va bene", "Un po' di febbre", "Lo farò, grazie", "Eccola", "Grazie dottore"],
    job_interview: ["Ho cinque anni di esperienza nel marketing", "Mi attrae l'approccio innovativo", "Sono organizzato e lavoro bene sotto pressione", "Respiro e prioritizzo", "Sì, sempre in team", "Mi vedo a guidare un team creativo", "Una campagna che ha triplicato le vendite", "Com'è la cultura del team?", "Posso iniziare tra due settimane", "Aspetto la vostra chiamata", "Sono molto motivato", "Grazie a lei"],
    directions: ["Sì, cerco il museo", "Tre isolati dritto", "A sinistra, capito", "Grazie", "Preferisco camminare", "Grazie mille!"],
    hotel: ["Sì, a nome Rossi", "Che bella vista!", "No grazie, faccio da solo", "Ci andrò stasera", "Alle 7 di mattina, per favore", "Perfetto, grazie", "Ne terrò conto", "Grazie mille!"],
    debate: ["Entrambi hanno il loro fascino", "Assolutamente, l'autenticità è fondamentale", "Il cibo peruviano mi ha sorpreso", "Sono d'accordo, è soggettivo", "Positivo se fatto con rispetto", "Esatto, la fusione è ovunque", "Direi gli arancini", "È stato bello parlarne", "Magari un giorno", "La tecnologia avanza", "Grazie", "A presto!"],
  },
  de: {
    restaurant: ["Ich nehme das Schnitzel, bitte", "Mineralwasser, bitte", "Medium, bitte", "Ja, den Apfelstrudel", "Perfekt, danke", "Nein, alles gut", "Mit Karte", "Danke, schönen Abend"],
    airport: ["Hier ist mein Reisepass", "Ja, ein großer Koffer", "Fensterplatz, bitte", "Verstanden, danke", "Kein Problem, ich warte", "Nur mein Laptop", "Bereit", "Vielen Dank", "Direktflug", "Danke"],
    shopping: ["Was kosten die Mangos?", "Lecker", "Können Sie etwas runter?", "Drei Avocados bitte", "In Ordnung, abgemacht", "Ja, bitte", "Danke! Ich komme wieder", "Hier bitte"],
    doctor: ["Halsschmerzen und Husten", "Seit drei Tagen", "Einverstanden", "Nein, keine Allergien", "Alle 8 Stunden, verstanden", "Okay", "Etwas Fieber", "Mache ich, danke", "Hier", "Vielen Dank, Doktor"],
    job_interview: ["Fünf Jahre Marketing-Erfahrung", "Der innovative Ansatz hat mich angesprochen", "Organisiert und belastbar", "Tief durchatmen und priorisieren", "Ja, immer im Team gearbeitet", "Ein kreatives Team leiten", "Eine Kampagne mit dreifachem Umsatz", "Wie ist die Teamkultur?", "In zwei Wochen", "Ich warte auf Ihren Anruf", "Ich bin sehr motiviert", "Vielen Dank"],
    directions: ["Ja, ich suche das Museum", "Drei Blocks geradeaus", "Links, verstanden", "Danke", "Ich gehe lieber zu Fuß", "Vielen Dank!"],
    hotel: ["Ja, auf den Namen Müller", "Tolle Aussicht!", "Nein danke, ich schaffe das", "Heute Abend", "Um 7 Uhr morgens bitte", "Super, danke", "Gut zu wissen", "Vielen Dank!"],
    debate: ["Beide haben ihren Reiz", "Genau, Authentizität zählt", "Peruanisches Essen hat mich überrascht", "Stimmt, ist subjektiv", "Positiv, wenn respektvoll", "Genau, Fusion ist überall", "Ich sage Currywurst", "War ein tolles Gespräch", "Vielleicht eines Tages", "Die Technik entwickelt sich", "Danke", "Bis bald!"],
  },
  ru: {
    restaurant: ["Борщ, пожалуйста", "Минеральную воду", "Средней прожарки", "Да, медовик", "Отлично, спасибо", "Нет, всё хорошо", "Картой", "Спасибо, до свидания"],
    airport: ["Вот мой паспорт", "Один большой чемодан", "У окна, пожалуйста", "Понял, спасибо", "Ничего, подожду", "Только ноутбук", "Готов", "Большое спасибо", "Прямой", "Спасибо"],
    shopping: ["Сколько стоят манго?", "Вкусно", "Можно подешевле?", "Три авокадо", "Хорошо, договорились", "Да, пожалуйста", "Спасибо! Вернусь", "Вот, пожалуйста"],
    doctor: ["Болит горло и кашель", "Три дня", "Хорошо", "Нет, аллергии нет", "Каждые 8 часов, понял", "Ладно", "Немного температура", "Сделаю, спасибо", "Вот", "Спасибо, доктор"],
    job_interview: ["Пять лет в маркетинге", "Привлёк инновационный подход", "Организованный, работаю под давлением", "Глубокий вдох и расставляю приоритеты", "Да, всегда в команде", "Хочу возглавить креативную команду", "Кампания с тройным ростом продаж", "Какая культура в команде?", "Через две недели", "Жду звонка", "Очень мотивирован", "Спасибо"],
    directions: ["Да, ищу музей", "Три квартала прямо", "Налево, понял", "Спасибо", "Пойду пешком", "Большое спасибо!"],
    hotel: ["Да, на имя Иванов", "Отличный вид!", "Нет спасибо, сам справлюсь", "Пойду сегодня вечером", "В 7 утра, пожалуйста", "Отлично, спасибо", "Учту", "Спасибо!"],
    debate: ["Оба хороши по-своему", "Верно, подлинность важна", "Перуанская кухня удивила", "Согласен, это субъективно", "Положительно, если с уважением", "Точно, фьюжн повсюду", "Пельмени", "Было интересно", "Может когда-нибудь", "Технологии развиваются", "Спасибо", "До встречи!"],
  },
  sw: {
    restaurant: ["Nataka pilau tafadhali", "Maji ya madini", "Wastani", "Ndiyo, mandazi", "Asante", "Hapana, niko sawa", "Kwa kadi", "Asante, kwaheri"],
    airport: ["Hii ni pasipoti yangu", "Ndiyo, mzigo mmoja mkubwa", "Dirisha tafadhali", "Nimeelewa, asante", "Hakuna shida, nitasubiri", "Laptop tu", "Niko tayari", "Asante sana", "Moja kwa moja", "Asante"],
    shopping: ["Maembe bei gani?", "Tamu sana", "Unaweza punguza kidogo?", "Avokado tatu tafadhali", "Sawa, tumekubaliana", "Ndiyo, tafadhali", "Asante! Nitarudi", "Hapa"],
    doctor: ["Koo langu linauma na nina kikohozi", "Siku tatu", "Sawa", "Hapana, sina mzio", "Kila masaa 8, nimeelewa", "Sawa", "Homa kidogo", "Nitafanya hivyo, asante", "Hii hapa", "Asante daktari"],
    job_interview: ["Nina uzoefu wa miaka mitano katika masoko", "Mbinu ya ubunifu ilinivutia", "Mimi ni mpangilio na nafanya kazi vizuri chini ya shinikizo", "Napumua kwa kina na kupanga vipaumbele", "Ndiyo, daima nimefanya kazi kwa timu", "Nataka kuongoza timu ya ubunifu", "Kampeni iliyoongeza mauzo mara tatu", "Utamaduni wa timu ukoje?", "Naweza kuanza baada ya wiki mbili", "Nitasubiri simu yako", "Nina motisha sana", "Asante sana"],
    directions: ["Ndiyo, natafuta makumbusho", "Vitalu vitatu moja kwa moja", "Kushoto, nimeelewa", "Asante", "Napendelea kutembea", "Asante sana!"],
    hotel: ["Ndiyo, jina la Juma", "Mtazamo mzuri!", "Hapana asante, naweza mwenyewe", "Nitaenda usiku huu", "Saa 1 asubuhi tafadhali", "Vizuri, asante", "Nitakumbuka", "Asante sana!"],
    debate: ["Zote zina mvuto wake", "Kweli, uhalisi ni muhimu", "Chakula cha Peru kilinishangaza", "Nakubaliana, ni jambo la kibinafsi", "Chanya ikiwa kwa heshima", "Ndio, mchanganyiko uko kila mahali", "Ningesema ugali", "Ilikuwa mazungumzo mazuri", "Labda siku moja", "Teknolojia inaendelea", "Asante", "Tutaonana!"],
  },
  hi: {
    restaurant: ["बिरयानी दीजिए", "मिनरल वॉटर", "मीडियम स्पाइसी", "हां, गुलाब जामुन", "शुक्रिया", "नहीं, ठीक है", "कार्ड से", "शुक्रिया, अलविदा"],
    airport: ["ये रहा पासपोर्ट", "हां, एक बड़ा बैग", "विंडो सीट", "समझ गया, शुक्रिया", "कोई बात नहीं, रुक जाता हूं", "बस लैपटॉप", "तैयार हूं", "बहुत शुक्रिया", "डायरेक्ट है", "धन्यवाद"],
    shopping: ["आम कितने के हैं?", "बहुत स्वादिष्ट", "थोड़ा कम कर दीजिए", "तीन एवोकैडो दे दीजिए", "ठीक है, पक्का", "हां, प्लीज़", "शुक्रिया! फिर आऊंगा", "ये लीजिए"],
    doctor: ["गला दुख रहा है और खांसी है", "तीन दिन से", "ठीक है", "नहीं, कोई एलर्जी नहीं", "हर 8 घंटे, समझ गया", "ठीक है", "हल्का बुखार था", "करूंगा, शुक्रिया", "ये रहा", "शुक्रिया डॉक्टर"],
    job_interview: ["मार्केटिंग में पांच साल का अनुभव है", "कंपनी का इनोवेटिव अप्रोच अच्छा लगा", "ऑर्गनाइज्ड हूं और प्रेशर में अच्छा काम करता हूं", "गहरी सांस लेता हूं और प्राथमिकता तय करता हूं", "हां, हमेशा टीम में काम किया है", "क्रिएटिव टीम लीड करना चाहता हूं", "एक कैंपेन जिसने सेल्स तीन गुना की", "टीम कल्चर कैसा है?", "दो हफ्ते में शुरू कर सकता हूं", "कॉल का इंतज़ार करूंगा", "बहुत मोटिवेटेड हूं", "शुक्रिया"],
    directions: ["हां, म्यूज़ियम ढूंढ रहा हूं", "तीन ब्लॉक सीधे", "बाएं, समझ गया", "शुक्रिया", "पैदल जाऊंगा", "बहुत-बहुत शुक्रिया!"],
    hotel: ["हां, शर्मा के नाम से", "समुद्र का नज़ारा बहुत अच्छा!", "नहीं शुक्रिया, मैं कर लूंगा", "आज रात जाऊंगा", "सुबह 7 बजे प्लीज़", "बढ़िया, शुक्रिया", "ध्यान रखूंगा", "शुक्रिया!"],
    debate: ["दोनों का अपना मज़ा है", "बिल्कुल, असलियत ज़रूरी है", "पेरू का खाना चौंका दिया", "सहमत हूं, ये सबजेक्टिव है", "सम्मान से हो तो अच्छा है", "हां, फ्यूज़न हर जगह है", "मैं कहूंगा छोले भटूरे", "मज़ेदार बातचीत रही", "शायद कभी", "टेक्नोलॉजी बढ़ रही है", "शुक्रिया", "फिर मिलेंगे!"],
  },
};

// ─── Language-Specific Correction Tips ──────────────────────────────────────────
export const CORRECTION_TIPS_BY_LANG: Partial<Record<AppLanguage, string[]>> = {
  es: [
    "Roll your 'rr' with more tongue vibration",
    "Remember: 'b' and 'v' sound the same in Spanish",
    "Stress the correct syllable — it changes meaning",
    "Link words together for natural flow (sinalefa)",
    "The 'j' sound is like a strong English 'h'",
  ],
  fr: [
    "Practice liaisons — link consonants to following vowels",
    "The French 'r' is uvular, produced at the back of the throat",
    "Nasal vowels: don't release the 'n' or 'm' sound",
    "Silent final consonants — don't pronounce them",
    "Elision is mandatory: je + ai = j'ai, not 'je ai'",
  ],
  pt: [
    "Nasal vowels: let air flow through your nose on 'ão', 'ãe'",
    "Initial 'r' sounds like 'h' in Brazilian Portuguese",
    "Word-final 's' becomes 'sh' in Brazilian Portuguese",
    "Open vs. closed vowels change word meaning",
    "'De' before 'i' sounds like 'djee' in Brazilian Portuguese",
  ],
  ja: [
    "Pitch accent matters — same word, different pitch = different meaning",
    "Double consonants (っ) need a full beat pause",
    "Long vowels change meaning — hold them for two beats",
    "The 'r' is a single tongue tap, not rolled or English 'r'",
    "Mora timing: each kana gets equal duration",
  ],
  ko: [
    "Aspirated vs. tense consonants: ㅂ/ㅃ/ㅍ are three different sounds",
    "Final consonants (받침) must be clearly closed",
    "Vowel length matters in formal speech",
    "Double consonants (쌍자음) need more tension, not volume",
    "Intonation rises for questions without a question particle",
  ],
  zh: [
    "Tones are essential — same syllable, different tone = different word",
    "The 'x', 'q', 'zh', 'ch' sounds don't exist in English",
    "Third tone dips low then rises — don't skip the rise",
    "Tone sandhi: two third tones → first becomes second tone",
    "Retroflex sounds (zh, ch, sh, r) curl your tongue back",
  ],
  ar: [
    "Emphatic consonants (ص، ض، ط، ظ) need back-of-throat pressure",
    "The 'ع' (ain) is a deep throat constriction",
    "Short vs. long vowels change word meaning completely",
    "The 'خ' (kha) is like clearing your throat gently",
    "Gemination (shadda) doubles the consonant length",
  ],
  hi: [
    "Aspirated vs. unaspirated: क/ख, ग/घ are distinct sounds",
    "Retroflex consonants (ट, ड, ण) — curl tongue to roof of mouth",
    "Nasal vowels (चंद्रबिंदु) — let air through nose",
    "Schwa deletion: don't pronounce final 'a' in many words",
    "Gemination matters: 'पका' vs 'पक्का' are different",
  ],
  it: [
    "Double consonants are held longer — 'nono' vs 'nonno'",
    "Open vs. closed 'e' and 'o' change meaning",
    "The 'gli' sound is like 'lyee', not 'glee'",
    "Stress patterns: most words stress the penultimate syllable",
    "The 'gn' combination sounds like Spanish 'ñ'",
  ],
  de: [
    "The 'ch' has two sounds: front (ich) and back (ach)",
    "Umlauts (ä, ö, ü) are distinct vowels, not decorations",
    "Final consonant devoicing: 'Tag' ends with a 'k' sound",
    "The 'r' varies by region — uvular is most standard",
    "Long vs. short vowels: 'Staat' vs 'Stadt'",
  ],
  ru: [
    "Hard vs. soft consonants — the soft sign (ь) changes the sound",
    "Vowel reduction: unstressed 'o' sounds like 'a'",
    "The 'ы' vowel has no English equivalent — tongue back, lips neutral",
    "Palatalization affects nearly every consonant",
    "Stress is unpredictable — learn it with each word",
  ],
  sw: [
    "Prenasalized consonants (mb, nd, ng) start with a nasal",
    "Stress almost always falls on the penultimate syllable",
    "Vowels are pure — no diphthongs like in English",
    "The 'ng' at word start is one sound, not two",
    "Tone isn't phonemic in standard Swahili — focus on rhythm",
  ],
  tr: [
    "Vowel harmony: suffixes must match the last vowel's frontness/roundness",
    "The 'ı' (dotless i) is a back unrounded vowel — unique to Turkish",
    "Soft 'ğ' lengthens the preceding vowel, not pronounced separately",
    "Turkish 'r' is a single tap, never rolled multiple times",
    "Word stress usually falls on the last syllable",
  ],
  th: [
    "Thai has 5 tones — mid, low, falling, high, rising",
    "Aspirated vs. unaspirated stops change meaning",
    "Long vs. short vowels are phonemic",
    "Final stops are unreleased — close your mouth but don't pop",
    "Clusters like 'kr', 'pl' exist at word beginnings",
  ],
  vi: [
    "Vietnamese has 6 tones — each changes word meaning completely",
    "The 'đ' is a 'd' sound; plain 'd' is actually a 'z' sound",
    "Final consonants are unreleased — just close the position",
    "Vowel length and quality are both important",
    "Regional differences: Northern vs. Southern pronunciation varies greatly",
  ],
  pl: [
    "Polish 'sz', 'cz', 'ż/rz' are distinct sibilants",
    "Nasal vowels 'ą' and 'ę' change before different consonants",
    "Stress almost always on the penultimate syllable",
    "Consonant clusters are common — practice 'szcz', 'prz'",
    "Soft consonants (ś, ć, ź, ń) are palatalized versions",
  ],
  nl: [
    "The 'g' and 'ch' are guttural — produced in the throat",
    "Diphthongs 'ui', 'ij/ei', 'ou/au' are unique Dutch sounds",
    "Final 'n' in '-en' endings is often dropped in speech",
    "Long vs. short vowels: 'maan' vs 'man'",
    "The 'r' varies by region — uvular, rolled, or approximant",
  ],
  el: [
    "Stress is marked with an accent — always pronounce it correctly",
    "The 'γ' before front vowels sounds like a soft 'y'",
    "Double consonants (ντ, μπ, γκ) represent single sounds",
    "Greek 'r' is a single tap, similar to Spanish",
    "Vowel combinations: 'ου' = 'u', 'αι' = 'e', 'ει' = 'i'",
  ],
  he: [
    "The 'ר' (resh) is uvular — similar to French 'r'",
    "Distinguish between 'כ' (k) and 'ח' (ch/kh)",
    "Stress usually falls on the last syllable",
    "The 'ע' (ayin) is often silent in modern Hebrew",
    "Dagesh (dot) in letters changes pronunciation: בּ=b, ב=v",
  ],
  tl: [
    "The 'ng' is one sound — practice it at word beginnings",
    "Glottal stops between vowels are meaningful",
    "Stress and vowel length change word meaning",
    "The 'r' is a single tap, like Spanish 'r'",
    "Intonation patterns differ from English significantly",
  ],
  id: [
    "Indonesian pronunciation is mostly regular and phonetic",
    "The 'c' is always pronounced 'ch' as in 'church'",
    "Stress usually falls on the penultimate syllable",
    "The 'ng' at word start is one nasal sound",
    "Doubled vowels (aa, ii) indicate longer duration",
  ],
  bn: [
    "Aspirated consonants (খ, ঘ, ছ, ঝ) need a puff of air",
    "Retroflex sounds (ট, ড, ণ) — tongue curls to palate",
    "Inherent vowel 'অ' is often silent at word end",
    "Nasal vowels are marked with chandrabindu",
    "Conjunct consonants change pronunciation significantly",
  ],
};

// ─── Universal Pronunciation Tips (for languages without specific data) ─────────
export const UNIVERSAL_PRONUNCIATION_TIPS: Record<ScenarioId, string> = {
  restaurant: "Focus on food vocabulary and polite request forms. Slow down for unfamiliar words.",
  airport: "Travel vocabulary has many cognates. Listen for numbers and gate announcements.",
  shopping: "Practice numbers and bargaining phrases. Intonation conveys politeness.",
  doctor: "Medical terms often have Latin/Greek roots. Speak clearly and precisely.",
  job_interview: "Use formal register. Speak confidently but not too fast.",
  directions: "Prepositions and spatial words are key. Repeat to confirm understanding.",
  hotel: "Hospitality phrases are often formulaic. Practice polite requests.",
  debate: "Use discourse connectors. Vary your intonation to express opinions.",
};

// ─── Pronunciation Tips by Language (for countdown/results screens) ──────────────
export const PRONUNCIATION_TIPS_FULL: Partial<Record<AppLanguage, Record<ScenarioId, string>>> = {
  es: {
    restaurant: "Focus on rolling your 'r' sounds and the soft 'd' in 'ordenar'",
    airport: "Pay attention to the stress on 'equipaje' (eh-kee-PAH-heh)",
    shopping: "Practice the 'ñ' sound and linking words together naturally",
    doctor: "Medical terms often have Latin roots — use that to your advantage",
    job_interview: "Speak clearly and use formal 'usted' conjugations",
    directions: "Practice prepositions: 'a la izquierda', 'a la derecha', 'derecho'",
    hotel: "Use polite requests: '¿Podría...?' and '¿Sería posible...?'",
    debate: "Use connectors: 'sin embargo', 'por otro lado', 'en mi opinión'",
  },
  fr: {
    restaurant: "Practice liaisons: 'vous‿aimeriez' — link the final 's' to the next vowel",
    airport: "French 'r' is uvular (back of throat). Try 'enregistrer' with a soft gargle",
    shopping: "Nasal vowels are key: 'cinq' (sæ̃k), 'bon' (bɔ̃) — don't release the 'n'",
    doctor: "Master the French 'u' (lips rounded, tongue forward): 'température', 'sûr'",
    job_interview: "Use formal register: always 'vous' never 'tu', and pronounce final consonants in liaisons",
    directions: "Practice silent letters: 'gauche' (gohsh), 'droite' (drwaht) — final letters are silent",
    hotel: "Elision is mandatory: 'l'hôtel', 'j'ai', 'd'accord' — never pronounce the dropped vowel",
    debate: "Use discourse markers with proper intonation: 'cependant', 'néanmoins', 'en revanche'",
  },
  pt: {
    restaurant: "Nasal vowels are essential: 'não' (now̃), 'bom' (bõ) — let air through your nose",
    airport: "The 'lh' digraph sounds like 'ly': 'embarque' stress falls on the penultimate syllable",
    shopping: "Brazilian 'de' often sounds like 'djee' and 'te' like 'chee' before 'i' sounds",
    doctor: "Practice the 'ão' diphthong: 'coração' — it's a nasal 'ow' sound, not 'on'",
    job_interview: "Formal Portuguese uses 'o senhor/a senhora' — stress the open vowels clearly",
    directions: "The 'r' at word start is pronounced like 'h': 'rua' sounds like 'HOO-ah'",
    hotel: "Word-final 's' becomes 'sh' in Brazilian Portuguese: 'mas' → 'mahsh'",
    debate: "Practice open vs. closed vowels: 'avó' (open o, grandmother) vs. 'avô' (closed o, grandfather)",
  },
  ja: {
    restaurant: "Japanese pitch accent matters: 'はし' can mean chopsticks (high-low) or bridge (low-high)",
    airport: "Keep vowels short and crisp. Double consonants (っ) need a full beat pause: 'きっぷ' (kippu)",
    shopping: "Long vowels change meaning: 'おばさん' (aunt) vs. 'おばあさん' (grandmother) — hold the vowel",
    doctor: "The 'r' sound is a single tap (like Spanish 'r'): tongue taps the ridge once for 'くすり'",
    job_interview: "Keigo (formal speech) requires precise particles: 'です/ます' endings must be crisp",
    directions: "Mora timing is key: each kana gets equal time. 'まっすぐ' = 4 equal beats",
    hotel: "The 'n' (ん) before vowels needs a nasal separation: 'ご予約' = go-yo-ya-ku",
    debate: "Sentence-final particles convey tone: 'ね' (agreement), 'よ' (assertion) — pitch them correctly",
  },
  ko: {
    restaurant: "Korean has three-way consonant distinction: plain, aspirated, tense (ㄱ/ㅋ/ㄲ)",
    airport: "Final consonants (받침) are unreleased — close your mouth without popping",
    shopping: "Numbers use two systems: native Korean for counting, Sino-Korean for prices",
    doctor: "Formal endings (-습니다/-ㅂ니다) must be crisp and clear",
    job_interview: "Honorific speech levels are crucial — use 존댓말 consistently",
    directions: "Particles like 에서, 으로, 까지 indicate direction — pronounce them distinctly",
    hotel: "The ㅎ sound weakens between vowels — '좋아요' sounds like 'jo-a-yo'",
    debate: "Sentence-final intonation carries meaning — statements fall, questions rise",
  },
  zh: {
    restaurant: "First tone is high and flat, not rising. Keep it steady on '请' (qǐng → please)",
    airport: "The 'x' sound: tongue behind lower teeth, air through a narrow gap",
    shopping: "Tone sandhi: two third tones in a row → first becomes second tone",
    doctor: "Retroflex sounds (zh, ch, sh): curl tongue tip to the hard palate",
    job_interview: "The neutral tone in particles (的, 了, 吗) should be light and short",
    directions: "Distinguish 'z/c/s' (flat tongue) from 'zh/ch/sh' (curled tongue)",
    hotel: "The 'ü' vowel: say 'ee' but round your lips like 'oo'",
    debate: "Sentence rhythm: content words get full tones, function words go neutral",
  },
  ar: {
    restaurant: "Emphatic consonants (ص، ط) lower the surrounding vowels",
    airport: "The 'ع' (ain) requires deep pharyngeal constriction",
    shopping: "Short vowels are often not written — learn common patterns",
    doctor: "Gemination (شدّة) doubles the consonant — hold it longer",
    job_interview: "Formal Arabic (فصحى) requires clear case endings",
    directions: "The 'ق' (qaf) is a deep uvular stop — further back than 'k'",
    hotel: "Sun letters (الحروف الشمسية) assimilate the 'l' of 'al-'",
    debate: "Sentence stress falls on the last heavy syllable of each phrase",
  },
  hi: {
    restaurant: "Aspirated stops (ख, घ, छ, झ, ठ, ढ, थ, ध, फ, भ) need a clear puff of air",
    airport: "Retroflex consonants: tongue tip curls back to touch the hard palate",
    shopping: "Schwa deletion: final 'a' is often silent — 'काम' is 'kaam' not 'kaama'",
    doctor: "Nasal vowels: the chandrabindu (ँ) nasalizes the vowel",
    job_interview: "Hindi has formal/informal registers — use 'आप' (aap) for respect",
    directions: "Postpositions come after nouns: 'बाएं' (left), 'दाएं' (right), 'सीधे' (straight)",
    hotel: "Gemination is meaningful: 'पका' (cooked) vs 'पक्का' (certain)",
    debate: "Sentence-final particles like 'ना', 'ही', 'तो' add nuance — use appropriate intonation",
  },
  it: {
    restaurant: "Double consonants are held longer: 'anno' vs 'ano' — timing matters",
    airport: "The 'gli' combination: tongue touches palate like 'lyee'",
    shopping: "Open 'e' (è) vs closed 'e' (é) — listen for the difference",
    doctor: "The 'gn' sounds like Spanish 'ñ': 'bagno' = 'banyo'",
    job_interview: "Use the formal 'Lei' (not 'tu') and subjunctive mood",
    directions: "Stress patterns: most words stress penultimate syllable",
    hotel: "The 'c' before 'e/i' is 'ch': 'cena' = 'chena'",
    debate: "Italian intonation is melodic — let your voice rise and fall naturally",
  },
  de: {
    restaurant: "The 'ch' after front vowels (ich-Laut) vs back vowels (ach-Laut) differ",
    airport: "Umlauts are distinct vowels: 'ü' = say 'ee' with rounded lips",
    shopping: "Final consonant devoicing: 'Tag' ends with 'k', 'Hund' ends with 't'",
    doctor: "Compound words: stress falls on the first element",
    job_interview: "Formal 'Sie' requires verb in second position and correct conjugation",
    directions: "Prepositions govern case: 'an', 'auf', 'in' can be dative or accusative",
    hotel: "The 'r' is uvular in standard German — produced at the back of the throat",
    debate: "German sentence melody: main clauses have verb-second, subordinates verb-final",
  },
  ru: {
    restaurant: "Unstressed 'o' reduces to 'a': 'молоко' = 'malakó'",
    airport: "Hard vs soft consonants: the soft sign (ь) palatalizes the preceding consonant",
    shopping: "The 'ы' vowel: tongue pulled back, lips spread — no English equivalent",
    doctor: "Consonant clusters are common — don't insert vowels between them",
    job_interview: "Formal register uses 'вы' (vy) — always capitalize in writing",
    directions: "Prepositions of motion vs location: 'в' + accusative vs 'в' + prepositional",
    hotel: "Voiced consonants devoice at word end: 'город' ends with 't' sound",
    debate: "Russian intonation pattern 3 (ИК-3) for yes/no questions — voice rises sharply",
  },
  sw: {
    restaurant: "Prenasalized consonants (mb, nd, nj, ng) are single sounds",
    airport: "Stress almost always on the penultimate syllable — very consistent",
    shopping: "Vowels are pure (a, e, i, o, u) — no diphthongs",
    doctor: "The 'ng'' (with apostrophe) is a velar nasal without following 'g'",
    job_interview: "Noun class prefixes affect agreement — match verbs and adjectives",
    directions: "Locative suffixes (-ni) attach to place nouns",
    hotel: "Borrowed words keep original stress: 'hotéli', 'kompyúta'",
    debate: "Swahili rhythm is syllable-timed — each syllable gets roughly equal time",
  },
};

// ─── Helper: Get conversation data for any language ─────────────────────────────
export function getConversationsForLanguage(langCode: string): LanguageConversations | null {
  return CORE_CONVERSATIONS[langCode as AppLanguage] || null;
}

// ─── Helper: Get user responses for any language ────────────────────────────────
export function getUserResponsesForLanguage(langCode: string): Record<ScenarioId, string[]> | null {
  return USER_RESPONSES_BY_LANG[langCode as AppLanguage] || null;
}

// ─── Helper: Get pronunciation tip for a language + scenario ────────────────────
export function getPronunciationTip(langCode: string, scenarioId: string): string {
  const langTips = PRONUNCIATION_TIPS_FULL[langCode as AppLanguage];
  if (langTips && langTips[scenarioId as ScenarioId]) {
    return langTips[scenarioId as ScenarioId];
  }
  return UNIVERSAL_PRONUNCIATION_TIPS[scenarioId as ScenarioId] || "Focus on clear pronunciation and natural rhythm.";
}

// ─── Helper: Get correction tip for a language ──────────────────────────────────
export function getCorrectionTipForLanguage(langCode: string, text: string): string {
  const langTips = CORRECTION_TIPS_BY_LANG[langCode as AppLanguage];
  if (langTips && langTips.length > 0) {
    return langTips[Math.floor(Math.random() * langTips.length)];
  }
  // Universal fallback
  const universalTips = [
    `Try emphasizing the vowels more clearly in "${text.split(" ")[0]}"`,
    "Remember to link words together for more natural flow",
    "Watch your intonation — questions rise at the end",
    "Good attempt! Try slowing down slightly for clarity",
    "Focus on the rhythm and stress patterns of the language",
  ];
  return universalTips[Math.floor(Math.random() * universalTips.length)];
}

// ─── Export all supported languages for the Live Simulation selector ─────────────
export const ALL_SIM_LANGUAGES = SUPPORTED_LANGUAGES.filter(l => l.code !== "en");
