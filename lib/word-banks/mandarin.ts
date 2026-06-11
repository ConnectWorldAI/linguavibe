/**
 * Mandarin Chinese Word Bank for Pronunciation Duels
 *
 * Categories: ABCs (Pinyin basics), Numbers, Adjectives, Verb Tenses (present/past/future)
 * Each word includes pinyin phonetic transcription and English translation.
 */
import type { DuelWord } from "@/lib/pronunciation-duel";

export const MANDARIN_WORD_BANK: Record<string, DuelWord[]> = {
  abcs: [
    { id: "zh_abc1", text: "你好", phonetic: "nǐ hǎo", translation: "Hello", language: "Mandarin", category: "abcs", difficulty: "easy" },
    { id: "zh_abc2", text: "谢谢", phonetic: "xiè xie", translation: "Thank you", language: "Mandarin", category: "abcs", difficulty: "easy" },
    { id: "zh_abc3", text: "再见", phonetic: "zài jiàn", translation: "Goodbye", language: "Mandarin", category: "abcs", difficulty: "easy" },
    { id: "zh_abc4", text: "图书馆", phonetic: "tú shū guǎn", translation: "Library", language: "Mandarin", category: "abcs", difficulty: "medium" },
    { id: "zh_abc5", text: "冰箱", phonetic: "bīng xiāng", translation: "Refrigerator", language: "Mandarin", category: "abcs", difficulty: "medium" },
    { id: "zh_abc6", text: "飞机场", phonetic: "fēi jī chǎng", translation: "Airport", language: "Mandarin", category: "abcs", difficulty: "medium" },
    { id: "zh_abc7", text: "不客气", phonetic: "bú kè qi", translation: "You're welcome", language: "Mandarin", category: "abcs", difficulty: "medium" },
    { id: "zh_abc8", text: "恭喜发财", phonetic: "gōng xǐ fā cái", translation: "Wishing you prosperity", language: "Mandarin", category: "abcs", difficulty: "hard" },
    { id: "zh_abc9", text: "对不起", phonetic: "duì bu qǐ", translation: "I'm sorry", language: "Mandarin", category: "abcs", difficulty: "easy" },
    { id: "zh_abc10", text: "中华人民共和国", phonetic: "zhōng huá rén mín gòng hé guó", translation: "People's Republic of China", language: "Mandarin", category: "abcs", difficulty: "hard" },
  ],
  numbers: [
    { id: "zh_num1", text: "一", phonetic: "yī", translation: "One", language: "Mandarin", category: "numbers", difficulty: "easy" },
    { id: "zh_num2", text: "二", phonetic: "èr", translation: "Two", language: "Mandarin", category: "numbers", difficulty: "easy" },
    { id: "zh_num3", text: "三", phonetic: "sān", translation: "Three", language: "Mandarin", category: "numbers", difficulty: "easy" },
    { id: "zh_num4", text: "十四", phonetic: "shí sì", translation: "Fourteen", language: "Mandarin", category: "numbers", difficulty: "medium" },
    { id: "zh_num5", text: "四十四", phonetic: "sì shí sì", translation: "Forty-four", language: "Mandarin", category: "numbers", difficulty: "hard" },
    { id: "zh_num6", text: "一百", phonetic: "yī bǎi", translation: "One hundred", language: "Mandarin", category: "numbers", difficulty: "easy" },
    { id: "zh_num7", text: "一千", phonetic: "yī qiān", translation: "One thousand", language: "Mandarin", category: "numbers", difficulty: "easy" },
    { id: "zh_num8", text: "九百九十九", phonetic: "jiǔ bǎi jiǔ shí jiǔ", translation: "Nine hundred ninety-nine", language: "Mandarin", category: "numbers", difficulty: "hard" },
    { id: "zh_num9", text: "两万五千", phonetic: "liǎng wàn wǔ qiān", translation: "Twenty-five thousand", language: "Mandarin", category: "numbers", difficulty: "hard" },
    { id: "zh_num10", text: "七十八", phonetic: "qī shí bā", translation: "Seventy-eight", language: "Mandarin", category: "numbers", difficulty: "medium" },
  ],
  adjectives: [
    { id: "zh_adj1", text: "漂亮", phonetic: "piào liang", translation: "Beautiful", language: "Mandarin", category: "adjectives", difficulty: "easy" },
    { id: "zh_adj2", text: "好吃", phonetic: "hǎo chī", translation: "Delicious", language: "Mandarin", category: "adjectives", difficulty: "easy" },
    { id: "zh_adj3", text: "快", phonetic: "kuài", translation: "Fast", language: "Mandarin", category: "adjectives", difficulty: "easy" },
    { id: "zh_adj4", text: "有趣", phonetic: "yǒu qù", translation: "Interesting", language: "Mandarin", category: "adjectives", difficulty: "medium" },
    { id: "zh_adj5", text: "困难", phonetic: "kùn nan", translation: "Difficult", language: "Mandarin", category: "adjectives", difficulty: "medium" },
    { id: "zh_adj6", text: "了不起", phonetic: "liǎo bu qǐ", translation: "Amazing/remarkable", language: "Mandarin", category: "adjectives", difficulty: "medium" },
    { id: "zh_adj7", text: "舒服", phonetic: "shū fu", translation: "Comfortable", language: "Mandarin", category: "adjectives", difficulty: "medium" },
    { id: "zh_adj8", text: "不可思议", phonetic: "bù kě sī yì", translation: "Unbelievable", language: "Mandarin", category: "adjectives", difficulty: "hard" },
    { id: "zh_adj9", text: "危险", phonetic: "wēi xiǎn", translation: "Dangerous", language: "Mandarin", category: "adjectives", difficulty: "medium" },
    { id: "zh_adj10", text: "五颜六色", phonetic: "wǔ yán liù sè", translation: "Colorful", language: "Mandarin", category: "adjectives", difficulty: "hard" },
  ],
  verbs_present: [
    { id: "zh_vp1", text: "我在学中文", phonetic: "wǒ zài xué zhōng wén", translation: "I am learning Chinese", language: "Mandarin", category: "verbs_present", difficulty: "easy" },
    { id: "zh_vp2", text: "我们一起吃饭", phonetic: "wǒ men yī qǐ chī fàn", translation: "We eat together", language: "Mandarin", category: "verbs_present", difficulty: "easy" },
    { id: "zh_vp3", text: "他每天跑步", phonetic: "tā měi tiān pǎo bù", translation: "He runs every day", language: "Mandarin", category: "verbs_present", difficulty: "medium" },
    { id: "zh_vp4", text: "她正在看书", phonetic: "tā zhèng zài kàn shū", translation: "She is reading a book", language: "Mandarin", category: "verbs_present", difficulty: "medium" },
    { id: "zh_vp5", text: "我们正在讨论这个问题", phonetic: "wǒ men zhèng zài tǎo lùn zhè ge wèn tí", translation: "We are discussing this problem", language: "Mandarin", category: "verbs_present", difficulty: "hard" },
  ],
  verbs_past: [
    { id: "zh_vpast1", text: "我吃了饭", phonetic: "wǒ chī le fàn", translation: "I ate", language: "Mandarin", category: "verbs_past", difficulty: "easy" },
    { id: "zh_vpast2", text: "我们去了中国", phonetic: "wǒ men qù le zhōng guó", translation: "We went to China", language: "Mandarin", category: "verbs_past", difficulty: "medium" },
    { id: "zh_vpast3", text: "他已经毕业了", phonetic: "tā yǐ jīng bì yè le", translation: "He has already graduated", language: "Mandarin", category: "verbs_past", difficulty: "medium" },
    { id: "zh_vpast4", text: "她昨天买了很多东西", phonetic: "tā zuó tiān mǎi le hěn duō dōng xi", translation: "She bought many things yesterday", language: "Mandarin", category: "verbs_past", difficulty: "hard" },
    { id: "zh_vpast5", text: "我们上个月搬家了", phonetic: "wǒ men shàng ge yuè bān jiā le", translation: "We moved last month", language: "Mandarin", category: "verbs_past", difficulty: "hard" },
  ],
  verbs_future: [
    { id: "zh_vf1", text: "我会去旅行", phonetic: "wǒ huì qù lǚ xíng", translation: "I will travel", language: "Mandarin", category: "verbs_future", difficulty: "easy" },
    { id: "zh_vf2", text: "明天会下雨", phonetic: "míng tiān huì xià yǔ", translation: "It will rain tomorrow", language: "Mandarin", category: "verbs_future", difficulty: "medium" },
    { id: "zh_vf3", text: "我们要成功", phonetic: "wǒ men yào chéng gōng", translation: "We will succeed", language: "Mandarin", category: "verbs_future", difficulty: "medium" },
    { id: "zh_vf4", text: "她打算明年结婚", phonetic: "tā dǎ suàn míng nián jié hūn", translation: "She plans to get married next year", language: "Mandarin", category: "verbs_future", difficulty: "hard" },
    { id: "zh_vf5", text: "我会说流利的中文", phonetic: "wǒ huì shuō liú lì de zhōng wén", translation: "I will speak fluent Chinese", language: "Mandarin", category: "verbs_future", difficulty: "hard" },
  ],
};

export const MANDARIN_TONGUE_TWISTERS: DuelWord[] = [
  { id: "zh_tt1", text: "四是四 十是十 十四是十四 四十是四十", phonetic: "sì shì sì, shí shì shí, shí sì shì shí sì, sì shí shì sì shí", translation: "Four is four, ten is ten, fourteen is fourteen, forty is forty", language: "Mandarin", category: "mixed", difficulty: "hard" },
  { id: "zh_tt2", text: "吃葡萄不吐葡萄皮 不吃葡萄倒吐葡萄皮", phonetic: "chī pú tao bù tǔ pú tao pí, bù chī pú tao dào tǔ pú tao pí", translation: "Eating grapes without spitting skins, not eating grapes but spitting skins", language: "Mandarin", category: "mixed", difficulty: "hard" },
  { id: "zh_tt3", text: "黑化肥发灰会挥发 灰化肥挥发会发黑", phonetic: "hēi huà féi fā huī huì huī fā, huī huà féi huī fā huì fā hēi", translation: "Black fertilizer turns gray and evaporates, gray fertilizer evaporates and turns black", language: "Mandarin", category: "mixed", difficulty: "hard" },
  { id: "zh_tt4", text: "八百标兵奔北坡 北坡炮兵并排跑", phonetic: "bā bǎi biāo bīng bēn běi pō, běi pō pào bīng bìng pái pǎo", translation: "Eight hundred soldiers rush north slope, north slope artillery run side by side", language: "Mandarin", category: "mixed", difficulty: "hard" },
  { id: "zh_tt5", text: "红鲤鱼与绿鲤鱼与驴", phonetic: "hóng lǐ yú yǔ lǜ lǐ yú yǔ lǘ", translation: "Red carp and green carp and donkey", language: "Mandarin", category: "mixed", difficulty: "hard" },
];
