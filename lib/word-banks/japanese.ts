/**
 * Japanese Word Bank for Pronunciation Duels
 *
 * Categories: ABCs (Hiragana/Katakana), Numbers, Adjectives, Verb Tenses (present/past/future)
 * Each word includes romaji phonetic and English translation.
 */
import type { DuelWord } from "@/lib/pronunciation-duel";

export const JAPANESE_WORD_BANK: Record<string, DuelWord[]> = {
  abcs: [
    { id: "jp_abc1", text: "こんにちは", phonetic: "/kon.ni.chi.wa/", translation: "Hello", language: "Japanese", category: "abcs", difficulty: "easy" },
    { id: "jp_abc2", text: "ありがとう", phonetic: "/a.ri.ga.tō/", translation: "Thank you", language: "Japanese", category: "abcs", difficulty: "easy" },
    { id: "jp_abc3", text: "図書館", phonetic: "/to.sho.kan/", translation: "Library", language: "Japanese", category: "abcs", difficulty: "medium" },
    { id: "jp_abc4", text: "蝶々", phonetic: "/chō.chō/", translation: "Butterfly", language: "Japanese", category: "abcs", difficulty: "medium" },
    { id: "jp_abc5", text: "冷蔵庫", phonetic: "/rei.zō.ko/", translation: "Refrigerator", language: "Japanese", category: "abcs", difficulty: "hard" },
    { id: "jp_abc6", text: "新幹線", phonetic: "/shin.kan.sen/", translation: "Bullet train", language: "Japanese", category: "abcs", difficulty: "medium" },
    { id: "jp_abc7", text: "お疲れ様です", phonetic: "/o.tsu.ka.re.sa.ma.de.su/", translation: "Good work (greeting)", language: "Japanese", category: "abcs", difficulty: "hard" },
    { id: "jp_abc8", text: "桜", phonetic: "/sa.ku.ra/", translation: "Cherry blossom", language: "Japanese", category: "abcs", difficulty: "easy" },
    { id: "jp_abc9", text: "地下鉄", phonetic: "/chi.ka.te.tsu/", translation: "Subway", language: "Japanese", category: "abcs", difficulty: "medium" },
    { id: "jp_abc10", text: "おはようございます", phonetic: "/o.ha.yō.go.za.i.ma.su/", translation: "Good morning (polite)", language: "Japanese", category: "abcs", difficulty: "hard" },
  ],
  numbers: [
    { id: "jp_num1", text: "一", phonetic: "/i.chi/", translation: "One", language: "Japanese", category: "numbers", difficulty: "easy" },
    { id: "jp_num2", text: "二", phonetic: "/ni/", translation: "Two", language: "Japanese", category: "numbers", difficulty: "easy" },
    { id: "jp_num3", text: "三", phonetic: "/san/", translation: "Three", language: "Japanese", category: "numbers", difficulty: "easy" },
    { id: "jp_num4", text: "二十一", phonetic: "/ni.jū.i.chi/", translation: "Twenty-one", language: "Japanese", category: "numbers", difficulty: "medium" },
    { id: "jp_num5", text: "五十", phonetic: "/go.jū/", translation: "Fifty", language: "Japanese", category: "numbers", difficulty: "easy" },
    { id: "jp_num6", text: "百", phonetic: "/hya.ku/", translation: "One hundred", language: "Japanese", category: "numbers", difficulty: "easy" },
    { id: "jp_num7", text: "三百六十五", phonetic: "/san.bya.ku.ro.ku.jū.go/", translation: "Three hundred sixty-five", language: "Japanese", category: "numbers", difficulty: "hard" },
    { id: "jp_num8", text: "千", phonetic: "/sen/", translation: "One thousand", language: "Japanese", category: "numbers", difficulty: "easy" },
    { id: "jp_num9", text: "八百八十八", phonetic: "/ha.ppya.ku.ha.chi.jū.ha.chi/", translation: "Eight hundred eighty-eight", language: "Japanese", category: "numbers", difficulty: "hard" },
    { id: "jp_num10", text: "四十四", phonetic: "/yon.jū.yon/", translation: "Forty-four", language: "Japanese", category: "numbers", difficulty: "medium" },
  ],
  adjectives: [
    { id: "jp_adj1", text: "美しい", phonetic: "/u.tsu.ku.shī/", translation: "Beautiful", language: "Japanese", category: "adjectives", difficulty: "easy" },
    { id: "jp_adj2", text: "素晴らしい", phonetic: "/su.ba.ra.shī/", translation: "Wonderful", language: "Japanese", category: "adjectives", difficulty: "medium" },
    { id: "jp_adj3", text: "暖かい", phonetic: "/a.ta.ta.kā/", translation: "Warm", language: "Japanese", category: "adjectives", difficulty: "medium" },
    { id: "jp_adj4", text: "信じられない", phonetic: "/shin.ji.ra.re.nā/", translation: "Unbelievable", language: "Japanese", category: "adjectives", difficulty: "hard" },
    { id: "jp_adj5", text: "楽しい", phonetic: "/ta.no.shī/", translation: "Fun/Enjoyable", language: "Japanese", category: "adjectives", difficulty: "easy" },
    { id: "jp_adj6", text: "恥ずかしい", phonetic: "/ha.zu.ka.shī/", translation: "Embarrassing", language: "Japanese", category: "adjectives", difficulty: "hard" },
    { id: "jp_adj7", text: "おいしい", phonetic: "/o.i.shī/", translation: "Delicious", language: "Japanese", category: "adjectives", difficulty: "easy" },
    { id: "jp_adj8", text: "勇ましい", phonetic: "/i.sa.ma.shī/", translation: "Brave/Gallant", language: "Japanese", category: "adjectives", difficulty: "medium" },
    { id: "jp_adj9", text: "分かりにくい", phonetic: "/wa.ka.ri.ni.kū/", translation: "Hard to understand", language: "Japanese", category: "adjectives", difficulty: "hard" },
    { id: "jp_adj10", text: "優しい", phonetic: "/ya.sa.shī/", translation: "Kind/Gentle", language: "Japanese", category: "adjectives", difficulty: "easy" },
  ],
  verbs_present: [
    { id: "jp_vp1", text: "食べます", phonetic: "/ta.be.ma.su/", translation: "I eat (polite)", language: "Japanese", category: "verbs_present", difficulty: "easy" },
    { id: "jp_vp2", text: "話します", phonetic: "/ha.na.shi.ma.su/", translation: "I speak (polite)", language: "Japanese", category: "verbs_present", difficulty: "easy" },
    { id: "jp_vp3", text: "分かります", phonetic: "/wa.ka.ri.ma.su/", translation: "I understand (polite)", language: "Japanese", category: "verbs_present", difficulty: "medium" },
    { id: "jp_vp4", text: "考えています", phonetic: "/kan.ga.e.te.i.ma.su/", translation: "I am thinking", language: "Japanese", category: "verbs_present", difficulty: "medium" },
    { id: "jp_vp5", text: "選びます", phonetic: "/e.ra.bi.ma.su/", translation: "I choose (polite)", language: "Japanese", category: "verbs_present", difficulty: "medium" },
    { id: "jp_vp6", text: "勉強しています", phonetic: "/ben.kyō.shi.te.i.ma.su/", translation: "I am studying", language: "Japanese", category: "verbs_present", difficulty: "hard" },
    { id: "jp_vp7", text: "覚えています", phonetic: "/o.bo.e.te.i.ma.su/", translation: "I remember", language: "Japanese", category: "verbs_present", difficulty: "hard" },
    { id: "jp_vp8", text: "読みます", phonetic: "/yo.mi.ma.su/", translation: "I read (polite)", language: "Japanese", category: "verbs_present", difficulty: "easy" },
  ],
  verbs_past: [
    { id: "jp_vpast1", text: "食べました", phonetic: "/ta.be.ma.shi.ta/", translation: "I ate (polite)", language: "Japanese", category: "verbs_past", difficulty: "easy" },
    { id: "jp_vpast2", text: "話しました", phonetic: "/ha.na.shi.ma.shi.ta/", translation: "I spoke (polite)", language: "Japanese", category: "verbs_past", difficulty: "easy" },
    { id: "jp_vpast3", text: "行きました", phonetic: "/i.ki.ma.shi.ta/", translation: "I went (polite)", language: "Japanese", category: "verbs_past", difficulty: "medium" },
    { id: "jp_vpast4", text: "分かりました", phonetic: "/wa.ka.ri.ma.shi.ta/", translation: "I understood (polite)", language: "Japanese", category: "verbs_past", difficulty: "medium" },
    { id: "jp_vpast5", text: "終わっていました", phonetic: "/o.wa.tte.i.ma.shi.ta/", translation: "It had ended", language: "Japanese", category: "verbs_past", difficulty: "hard" },
    { id: "jp_vpast6", text: "出発していました", phonetic: "/shu.ppa.tsu.shi.te.i.ma.shi.ta/", translation: "Had departed", language: "Japanese", category: "verbs_past", difficulty: "hard" },
    { id: "jp_vpast7", text: "見ました", phonetic: "/mi.ma.shi.ta/", translation: "I saw (polite)", language: "Japanese", category: "verbs_past", difficulty: "easy" },
    { id: "jp_vpast8", text: "成功しました", phonetic: "/sei.kō.shi.ma.shi.ta/", translation: "I succeeded (polite)", language: "Japanese", category: "verbs_past", difficulty: "medium" },
  ],
  verbs_future: [
    { id: "jp_vf1", text: "食べるでしょう", phonetic: "/ta.be.ru.de.shō/", translation: "Will probably eat", language: "Japanese", category: "verbs_future", difficulty: "medium" },
    { id: "jp_vf2", text: "話すつもりです", phonetic: "/ha.na.su.tsu.mo.ri.de.su/", translation: "I intend to speak", language: "Japanese", category: "verbs_future", difficulty: "medium" },
    { id: "jp_vf3", text: "分かるようになります", phonetic: "/wa.ka.ru.yō.ni.na.ri.ma.su/", translation: "Will come to understand", language: "Japanese", category: "verbs_future", difficulty: "hard" },
    { id: "jp_vf4", text: "成功するでしょう", phonetic: "/sei.kō.su.ru.de.shō/", translation: "Will probably succeed", language: "Japanese", category: "verbs_future", difficulty: "medium" },
    { id: "jp_vf5", text: "選ぶつもりです", phonetic: "/e.ra.bu.tsu.mo.ri.de.su/", translation: "I intend to choose", language: "Japanese", category: "verbs_future", difficulty: "medium" },
    { id: "jp_vf6", text: "行きます", phonetic: "/i.ki.ma.su/", translation: "I will go", language: "Japanese", category: "verbs_future", difficulty: "easy" },
    { id: "jp_vf7", text: "終わっているでしょう", phonetic: "/o.wa.tte.i.ru.de.shō/", translation: "Will have finished", language: "Japanese", category: "verbs_future", difficulty: "hard" },
    { id: "jp_vf8", text: "帰ります", phonetic: "/ka.e.ri.ma.su/", translation: "I will return", language: "Japanese", category: "verbs_future", difficulty: "easy" },
  ],
};

export const JAPANESE_TONGUE_TWISTERS: DuelWord[] = [
  { id: "jp_tt1", text: "生麦生米生卵", phonetic: "/na.ma.mu.gi na.ma.go.me na.ma.ta.ma.go/", translation: "Raw wheat, raw rice, raw egg", language: "Japanese", category: "mixed", difficulty: "hard" },
  { id: "jp_tt2", text: "赤巻紙青巻紙黄巻紙", phonetic: "/a.ka.ma.ki.ga.mi ao.ma.ki.ga.mi ki.ma.ki.ga.mi/", translation: "Red scroll, blue scroll, yellow scroll", language: "Japanese", category: "mixed", difficulty: "hard" },
  { id: "jp_tt3", text: "隣の客はよく柿食う客だ", phonetic: "/to.na.ri.no kya.ku wa yo.ku ka.ki ku.u kya.ku da/", translation: "The guest next door often eats persimmons", language: "Japanese", category: "mixed", difficulty: "hard" },
  { id: "jp_tt4", text: "東京特許許可局", phonetic: "/tō.kyō to.kkyo kyo.ka kyo.ku/", translation: "Tokyo Patent Licensing Bureau", language: "Japanese", category: "mixed", difficulty: "medium" },
  { id: "jp_tt5", text: "バスガス爆発", phonetic: "/ba.su.ga.su ba.ku.ha.tsu/", translation: "Bus gas explosion", language: "Japanese", category: "mixed", difficulty: "medium" },
];
