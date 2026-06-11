/**
 * Korean Word Bank for Pronunciation Duels
 *
 * Categories: ABCs (Hangul basics), Numbers, Adjectives, Verb Tenses (present/past/future)
 * Each word includes romanized phonetic transcription and English translation.
 */
import type { DuelWord } from "@/lib/pronunciation-duel";

export const KOREAN_WORD_BANK: Record<string, DuelWord[]> = {
  abcs: [
    { id: "ko_abc1", text: "안녕하세요", phonetic: "/an.njʌŋ.ha.se.jo/", translation: "Hello", language: "Korean", category: "abcs", difficulty: "easy" },
    { id: "ko_abc2", text: "감사합니다", phonetic: "/kam.sa.ham.ni.da/", translation: "Thank you", language: "Korean", category: "abcs", difficulty: "easy" },
    { id: "ko_abc3", text: "사랑해요", phonetic: "/sa.raŋ.hɛ.jo/", translation: "I love you", language: "Korean", category: "abcs", difficulty: "easy" },
    { id: "ko_abc4", text: "도서관", phonetic: "/to.sʌ.ɡwan/", translation: "Library", language: "Korean", category: "abcs", difficulty: "medium" },
    { id: "ko_abc5", text: "냉장고", phonetic: "/nɛŋ.dʑaŋ.ɡo/", translation: "Refrigerator", language: "Korean", category: "abcs", difficulty: "medium" },
    { id: "ko_abc6", text: "경찰서", phonetic: "/kjʌŋ.tɕʰal.sʌ/", translation: "Police station", language: "Korean", category: "abcs", difficulty: "medium" },
    { id: "ko_abc7", text: "비행기", phonetic: "/pi.hɛŋ.ɡi/", translation: "Airplane", language: "Korean", category: "abcs", difficulty: "medium" },
    { id: "ko_abc8", text: "대한민국", phonetic: "/tɛ.han.min.ɡuk/", translation: "Republic of Korea", language: "Korean", category: "abcs", difficulty: "hard" },
    { id: "ko_abc9", text: "축하합니다", phonetic: "/tɕʰuk.ha.ham.ni.da/", translation: "Congratulations", language: "Korean", category: "abcs", difficulty: "hard" },
    { id: "ko_abc10", text: "잠깐만요", phonetic: "/tɕam.k͈an.man.jo/", translation: "Wait a moment", language: "Korean", category: "abcs", difficulty: "medium" },
  ],
  numbers: [
    { id: "ko_num1", text: "하나", phonetic: "/ha.na/", translation: "One (native)", language: "Korean", category: "numbers", difficulty: "easy" },
    { id: "ko_num2", text: "둘", phonetic: "/tul/", translation: "Two (native)", language: "Korean", category: "numbers", difficulty: "easy" },
    { id: "ko_num3", text: "셋", phonetic: "/set/", translation: "Three (native)", language: "Korean", category: "numbers", difficulty: "easy" },
    { id: "ko_num4", text: "일", phonetic: "/il/", translation: "One (Sino-Korean)", language: "Korean", category: "numbers", difficulty: "easy" },
    { id: "ko_num5", text: "이십삼", phonetic: "/i.ɕip.sam/", translation: "Twenty-three", language: "Korean", category: "numbers", difficulty: "medium" },
    { id: "ko_num6", text: "백", phonetic: "/pɛk/", translation: "One hundred", language: "Korean", category: "numbers", difficulty: "easy" },
    { id: "ko_num7", text: "천", phonetic: "/tɕʰʌn/", translation: "One thousand", language: "Korean", category: "numbers", difficulty: "easy" },
    { id: "ko_num8", text: "구백구십구", phonetic: "/ku.bɛk.ku.ɕip.ku/", translation: "Nine hundred ninety-nine", language: "Korean", category: "numbers", difficulty: "hard" },
    { id: "ko_num9", text: "열두", phonetic: "/jʌl.tu/", translation: "Twelve (native)", language: "Korean", category: "numbers", difficulty: "medium" },
    { id: "ko_num10", text: "삼만 오천", phonetic: "/sam.man o.tɕʰʌn/", translation: "Thirty-five thousand", language: "Korean", category: "numbers", difficulty: "hard" },
  ],
  adjectives: [
    { id: "ko_adj1", text: "아름다운", phonetic: "/a.rɯm.da.un/", translation: "Beautiful", language: "Korean", category: "adjectives", difficulty: "medium" },
    { id: "ko_adj2", text: "맛있는", phonetic: "/ma.ɕin.nɯn/", translation: "Delicious", language: "Korean", category: "adjectives", difficulty: "easy" },
    { id: "ko_adj3", text: "빠른", phonetic: "/p͈a.rɯn/", translation: "Fast", language: "Korean", category: "adjectives", difficulty: "easy" },
    { id: "ko_adj4", text: "재미있는", phonetic: "/tɕɛ.mi.in.nɯn/", translation: "Fun/interesting", language: "Korean", category: "adjectives", difficulty: "medium" },
    { id: "ko_adj5", text: "어려운", phonetic: "/ʌ.rjʌ.un/", translation: "Difficult", language: "Korean", category: "adjectives", difficulty: "medium" },
    { id: "ko_adj6", text: "놀라운", phonetic: "/nol.la.un/", translation: "Amazing", language: "Korean", category: "adjectives", difficulty: "medium" },
    { id: "ko_adj7", text: "따뜻한", phonetic: "/t͈a.t͈ɯ.tʰan/", translation: "Warm", language: "Korean", category: "adjectives", difficulty: "medium" },
    { id: "ko_adj8", text: "불가능한", phonetic: "/pul.ɡa.nɯŋ.han/", translation: "Impossible", language: "Korean", category: "adjectives", difficulty: "hard" },
    { id: "ko_adj9", text: "친절한", phonetic: "/tɕʰin.dʑʌl.han/", translation: "Kind/friendly", language: "Korean", category: "adjectives", difficulty: "easy" },
    { id: "ko_adj10", text: "위험한", phonetic: "/wi.hʌm.han/", translation: "Dangerous", language: "Korean", category: "adjectives", difficulty: "hard" },
  ],
  verbs_present: [
    { id: "ko_vp1", text: "저는 한국어를 배워요", phonetic: "/tɕʌ.nɯn han.ɡu.ɡʌ.rɯl pɛ.wʌ.jo/", translation: "I learn Korean", language: "Korean", category: "verbs_present", difficulty: "easy" },
    { id: "ko_vp2", text: "우리는 같이 공부해요", phonetic: "/u.ri.nɯn ka.tɕʰi koŋ.bu.hɛ.jo/", translation: "We study together", language: "Korean", category: "verbs_present", difficulty: "medium" },
    { id: "ko_vp3", text: "그는 매일 운동해요", phonetic: "/kɯ.nɯn mɛ.il un.doŋ.hɛ.jo/", translation: "He exercises every day", language: "Korean", category: "verbs_present", difficulty: "medium" },
    { id: "ko_vp4", text: "저는 음악을 듣고 있어요", phonetic: "/tɕʌ.nɯn ɯ.ma.ɡɯl tɯt.ko i.s͈ʌ.jo/", translation: "I am listening to music", language: "Korean", category: "verbs_present", difficulty: "hard" },
    { id: "ko_vp5", text: "그녀는 요리를 잘해요", phonetic: "/kɯ.njʌ.nɯn jo.ri.rɯl tɕal.hɛ.jo/", translation: "She cooks well", language: "Korean", category: "verbs_present", difficulty: "medium" },
  ],
  verbs_past: [
    { id: "ko_vpast1", text: "저는 밥을 먹었어요", phonetic: "/tɕʌ.nɯn pa.bɯl mʌ.ɡʌ.s͈ʌ.jo/", translation: "I ate rice/food", language: "Korean", category: "verbs_past", difficulty: "easy" },
    { id: "ko_vpast2", text: "우리는 영화를 봤어요", phonetic: "/u.ri.nɯn jʌŋ.hwa.rɯl pwa.s͈ʌ.jo/", translation: "We watched a movie", language: "Korean", category: "verbs_past", difficulty: "medium" },
    { id: "ko_vpast3", text: "그는 한국에 갔었어요", phonetic: "/kɯ.nɯn han.ɡu.ɡe ka.s͈ʌ.s͈ʌ.jo/", translation: "He had gone to Korea", language: "Korean", category: "verbs_past", difficulty: "hard" },
    { id: "ko_vpast4", text: "저는 어제 친구를 만났어요", phonetic: "/tɕʌ.nɯn ʌ.dʑe tɕʰin.ɡu.rɯl man.na.s͈ʌ.jo/", translation: "I met a friend yesterday", language: "Korean", category: "verbs_past", difficulty: "medium" },
    { id: "ko_vpast5", text: "그녀는 대학교를 졸업했어요", phonetic: "/kɯ.njʌ.nɯn tɛ.hak.kjo.rɯl tɕol.ʌp.hɛ.s͈ʌ.jo/", translation: "She graduated from university", language: "Korean", category: "verbs_past", difficulty: "hard" },
  ],
  verbs_future: [
    { id: "ko_vf1", text: "저는 여행할 거예요", phonetic: "/tɕʌ.nɯn jʌ.hɛŋ.hal kʌ.je.jo/", translation: "I will travel", language: "Korean", category: "verbs_future", difficulty: "easy" },
    { id: "ko_vf2", text: "우리는 성공할 거예요", phonetic: "/u.ri.nɯn sʌŋ.ɡoŋ.hal kʌ.je.jo/", translation: "We will succeed", language: "Korean", category: "verbs_future", difficulty: "medium" },
    { id: "ko_vf3", text: "내일 비가 올 거예요", phonetic: "/nɛ.il pi.ɡa ol kʌ.je.jo/", translation: "It will rain tomorrow", language: "Korean", category: "verbs_future", difficulty: "medium" },
    { id: "ko_vf4", text: "저는 한국어를 유창하게 말할 거예요", phonetic: "/tɕʌ.nɯn han.ɡu.ɡʌ.rɯl ju.tɕʰaŋ.ha.ɡe mal.hal kʌ.je.jo/", translation: "I will speak Korean fluently", language: "Korean", category: "verbs_future", difficulty: "hard" },
    { id: "ko_vf5", text: "그는 다음 달에 결혼할 거예요", phonetic: "/kɯ.nɯn ta.ɯm ta.re kjʌl.hon.hal kʌ.je.jo/", translation: "He will get married next month", language: "Korean", category: "verbs_future", difficulty: "hard" },
  ],
};

export const KOREAN_TONGUE_TWISTERS: DuelWord[] = [
  { id: "ko_tt1", text: "간장 공장 공장장은 강 공장장이고 된장 공장 공장장은 장 공장장이다", phonetic: "/kan.dʑaŋ koŋ.dʑaŋ koŋ.dʑaŋ.dʑaŋ.ɯn kaŋ koŋ.dʑaŋ.dʑaŋ.i.ɡo twen.dʑaŋ koŋ.dʑaŋ koŋ.dʑaŋ.dʑaŋ.ɯn dʑaŋ koŋ.dʑaŋ.dʑaŋ.i.da/", translation: "The soy sauce factory manager is Manager Kang and the soybean paste factory manager is Manager Jang", language: "Korean", category: "mixed", difficulty: "hard" },
  { id: "ko_tt2", text: "경찰청 철창살은 외철창살이고 검찰청 철창살은 쌍철창살이다", phonetic: "/kjʌŋ.tɕʰal.tɕʰʌŋ tɕʰʌl.tɕʰaŋ.sal.ɯn we.tɕʰʌl.tɕʰaŋ.sal.i.ɡo kʌm.tɕʰal.tɕʰʌŋ tɕʰʌl.tɕʰaŋ.sal.ɯn s͈aŋ.tɕʰʌl.tɕʰaŋ.sal.i.da/", translation: "Police station bars are single bars and prosecution office bars are double bars", language: "Korean", category: "mixed", difficulty: "hard" },
  { id: "ko_tt3", text: "내가 그린 기린 그림은 긴 기린 그림이고 네가 그린 기린 그림은 안 긴 기린 그림이다", phonetic: "/nɛ.ɡa kɯ.rin ki.rin kɯ.rim.ɯn kin ki.rin kɯ.rim.i.ɡo ne.ɡa kɯ.rin ki.rin kɯ.rim.ɯn an kin ki.rin kɯ.rim.i.da/", translation: "The giraffe picture I drew is a long giraffe picture and the one you drew is a short one", language: "Korean", category: "mixed", difficulty: "hard" },
  { id: "ko_tt4", text: "저기 저 콩깍지가 깐 콩깍지인가 안 깐 콩깍지인가", phonetic: "/tɕʌ.ɡi tɕʌ koŋ.k͈ak.tɕi.ɡa k͈an koŋ.k͈ak.tɕi.in.ɡa an k͈an koŋ.k͈ak.tɕi.in.ɡa/", translation: "Is that bean pod over there a peeled pod or an unpeeled pod?", language: "Korean", category: "mixed", difficulty: "hard" },
  { id: "ko_tt5", text: "고려고 교복은 고급 교복이고 고려고 교복은 고급 원단 교복이다", phonetic: "/ko.rjʌ.ɡo kjo.bok.ɯn ko.ɡɯp kjo.bok.i.ɡo ko.rjʌ.ɡo kjo.bok.ɯn ko.ɡɯp wʌn.dan kjo.bok.i.da/", translation: "Goryeo High School uniform is a premium uniform made of premium fabric", language: "Korean", category: "mixed", difficulty: "hard" },
];
