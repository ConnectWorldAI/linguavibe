/**
 * Portuguese Word Bank for Pronunciation Duels
 *
 * Categories: ABCs, Numbers, Adjectives, Verb Tenses (present/past/future)
 * Each word includes phonetic transcription and English translation.
 */
import type { DuelWord } from "@/lib/pronunciation-duel";

export const PORTUGUESE_WORD_BANK: Record<string, DuelWord[]> = {
  abcs: [
    { id: "pt_abc1", text: "Obrigado", phonetic: "/o.bɾi.ˈɡa.du/", translation: "Thank you", language: "Portuguese", category: "abcs", difficulty: "easy" },
    { id: "pt_abc2", text: "Coração", phonetic: "/ko.ɾa.ˈsɐ̃w̃/", translation: "Heart", language: "Portuguese", category: "abcs", difficulty: "medium" },
    { id: "pt_abc3", text: "Desenvolvimento", phonetic: "/de.zẽ.vol.vi.ˈmẽ.tu/", translation: "Development", language: "Portuguese", category: "abcs", difficulty: "hard" },
    { id: "pt_abc4", text: "Saudade", phonetic: "/saw.ˈda.dʒi/", translation: "Longing/Nostalgia", language: "Portuguese", category: "abcs", difficulty: "medium" },
    { id: "pt_abc5", text: "Borboleta", phonetic: "/boɾ.bo.ˈle.tɐ/", translation: "Butterfly", language: "Portuguese", category: "abcs", difficulty: "easy" },
    { id: "pt_abc6", text: "Paralelepípedo", phonetic: "/pa.ɾa.le.le.ˈpi.pe.du/", translation: "Cobblestone", language: "Portuguese", category: "abcs", difficulty: "hard" },
    { id: "pt_abc7", text: "Abacaxi", phonetic: "/a.ba.ka.ˈʃi/", translation: "Pineapple", language: "Portuguese", category: "abcs", difficulty: "easy" },
    { id: "pt_abc8", text: "Caranguejo", phonetic: "/ka.ɾɐ̃.ˈɡe.ʒu/", translation: "Crab", language: "Portuguese", category: "abcs", difficulty: "medium" },
    { id: "pt_abc9", text: "Otorrinolaringologista", phonetic: "/o.to.ʁi.no.la.ɾĩ.ɡo.lo.ˈʒis.tɐ/", translation: "ENT doctor", language: "Portuguese", category: "abcs", difficulty: "hard" },
    { id: "pt_abc10", text: "Cachorro", phonetic: "/ka.ˈʃo.ʁu/", translation: "Dog", language: "Portuguese", category: "abcs", difficulty: "easy" },
  ],
  numbers: [
    { id: "pt_num1", text: "Um", phonetic: "/ũ/", translation: "One", language: "Portuguese", category: "numbers", difficulty: "easy" },
    { id: "pt_num2", text: "Dois", phonetic: "/dojs/", translation: "Two", language: "Portuguese", category: "numbers", difficulty: "easy" },
    { id: "pt_num3", text: "Três", phonetic: "/tɾes/", translation: "Three", language: "Portuguese", category: "numbers", difficulty: "easy" },
    { id: "pt_num4", text: "Vinte e um", phonetic: "/ˈvĩ.tʃi i ˈũ/", translation: "Twenty-one", language: "Portuguese", category: "numbers", difficulty: "medium" },
    { id: "pt_num5", text: "Cinquenta", phonetic: "/sĩ.ˈkwẽ.tɐ/", translation: "Fifty", language: "Portuguese", category: "numbers", difficulty: "medium" },
    { id: "pt_num6", text: "Oitenta e sete", phonetic: "/oj.ˈtẽ.tɐ i ˈsɛ.tʃi/", translation: "Eighty-seven", language: "Portuguese", category: "numbers", difficulty: "medium" },
    { id: "pt_num7", text: "Novecentos e noventa e nove", phonetic: "/no.ve.ˈsẽ.tus i no.ˈvẽ.tɐ i ˈnɔ.vi/", translation: "Nine hundred ninety-nine", language: "Portuguese", category: "numbers", difficulty: "hard" },
    { id: "pt_num8", text: "Mil", phonetic: "/miw/", translation: "One thousand", language: "Portuguese", category: "numbers", difficulty: "easy" },
    { id: "pt_num9", text: "Duzentos e quarenta e cinco", phonetic: "/du.ˈzẽ.tus i kwa.ˈɾẽ.tɐ i ˈsĩ.ku/", translation: "Two hundred forty-five", language: "Portuguese", category: "numbers", difficulty: "hard" },
    { id: "pt_num10", text: "Dezesseis", phonetic: "/de.ze.ˈsejs/", translation: "Sixteen", language: "Portuguese", category: "numbers", difficulty: "medium" },
  ],
  adjectives: [
    { id: "pt_adj1", text: "Maravilhoso", phonetic: "/ma.ɾa.vi.ˈʎo.zu/", translation: "Marvelous", language: "Portuguese", category: "adjectives", difficulty: "medium" },
    { id: "pt_adj2", text: "Incrível", phonetic: "/ĩ.ˈkɾi.vew/", translation: "Incredible", language: "Portuguese", category: "adjectives", difficulty: "easy" },
    { id: "pt_adj3", text: "Deslumbrante", phonetic: "/dez.lũ.ˈbɾɐ̃.tʃi/", translation: "Dazzling", language: "Portuguese", category: "adjectives", difficulty: "hard" },
    { id: "pt_adj4", text: "Corajoso", phonetic: "/ko.ɾa.ˈʒo.zu/", translation: "Courageous", language: "Portuguese", category: "adjectives", difficulty: "medium" },
    { id: "pt_adj5", text: "Impressionante", phonetic: "/ĩ.pɾe.sjo.ˈnɐ̃.tʃi/", translation: "Impressive", language: "Portuguese", category: "adjectives", difficulty: "hard" },
    { id: "pt_adj6", text: "Bonito", phonetic: "/bo.ˈni.tu/", translation: "Beautiful", language: "Portuguese", category: "adjectives", difficulty: "easy" },
    { id: "pt_adj7", text: "Extraordinário", phonetic: "/es.tɾa.oɾ.dʒi.ˈna.ɾju/", translation: "Extraordinary", language: "Portuguese", category: "adjectives", difficulty: "hard" },
    { id: "pt_adj8", text: "Simpático", phonetic: "/sĩ.ˈpa.tʃi.ku/", translation: "Nice/Friendly", language: "Portuguese", category: "adjectives", difficulty: "easy" },
    { id: "pt_adj9", text: "Preguiçoso", phonetic: "/pɾe.ɡi.ˈso.zu/", translation: "Lazy", language: "Portuguese", category: "adjectives", difficulty: "medium" },
    { id: "pt_adj10", text: "Orgulhoso", phonetic: "/oɾ.ɡu.ˈʎo.zu/", translation: "Proud", language: "Portuguese", category: "adjectives", difficulty: "medium" },
  ],
  verbs_present: [
    { id: "pt_vp1", text: "Eu como", phonetic: "/ew ˈko.mu/", translation: "I eat", language: "Portuguese", category: "verbs_present", difficulty: "easy" },
    { id: "pt_vp2", text: "Nós falamos", phonetic: "/nɔs fa.ˈlɐ.mus/", translation: "We speak", language: "Portuguese", category: "verbs_present", difficulty: "easy" },
    { id: "pt_vp3", text: "Eles entendem", phonetic: "/ˈe.lis ẽ.ˈtẽ.dẽj/", translation: "They understand", language: "Portuguese", category: "verbs_present", difficulty: "medium" },
    { id: "pt_vp4", text: "Ela consegue", phonetic: "/ˈɛ.lɐ kõ.ˈse.ɡi/", translation: "She manages", language: "Portuguese", category: "verbs_present", difficulty: "medium" },
    { id: "pt_vp5", text: "Vocês escolhem", phonetic: "/vo.ˈses es.ˈkɔ.ʎẽj/", translation: "You all choose", language: "Portuguese", category: "verbs_present", difficulty: "medium" },
    { id: "pt_vp6", text: "Eu me chamo", phonetic: "/ew mi ˈʃɐ.mu/", translation: "My name is", language: "Portuguese", category: "verbs_present", difficulty: "easy" },
    { id: "pt_vp7", text: "Nós nos lembramos", phonetic: "/nɔs nus lẽ.ˈbɾɐ.mus/", translation: "We remember", language: "Portuguese", category: "verbs_present", difficulty: "hard" },
    { id: "pt_vp8", text: "Eles desenvolvem", phonetic: "/ˈe.lis de.zẽ.ˈvɔw.vẽj/", translation: "They develop", language: "Portuguese", category: "verbs_present", difficulty: "hard" },
  ],
  verbs_past: [
    { id: "pt_vpast1", text: "Eu comi", phonetic: "/ew ko.ˈmi/", translation: "I ate", language: "Portuguese", category: "verbs_past", difficulty: "easy" },
    { id: "pt_vpast2", text: "Nós falamos", phonetic: "/nɔs fa.ˈlɐ.mus/", translation: "We spoke", language: "Portuguese", category: "verbs_past", difficulty: "easy" },
    { id: "pt_vpast3", text: "Ela foi embora", phonetic: "/ˈɛ.lɐ foj ẽ.ˈbɔ.ɾɐ/", translation: "She left", language: "Portuguese", category: "verbs_past", difficulty: "medium" },
    { id: "pt_vpast4", text: "Eles entenderam", phonetic: "/ˈe.lis ẽ.tẽ.ˈde.ɾɐ̃w̃/", translation: "They understood", language: "Portuguese", category: "verbs_past", difficulty: "medium" },
    { id: "pt_vpast5", text: "Eu tinha terminado", phonetic: "/ew ˈtĩ.ɲɐ teɾ.mi.ˈna.du/", translation: "I had finished", language: "Portuguese", category: "verbs_past", difficulty: "hard" },
    { id: "pt_vpast6", text: "Nós tínhamos saído", phonetic: "/nɔs ˈtĩ.ɲɐ.mus sa.ˈi.du/", translation: "We had left", language: "Portuguese", category: "verbs_past", difficulty: "hard" },
    { id: "pt_vpast7", text: "Tu viste", phonetic: "/tu ˈvis.tʃi/", translation: "You saw", language: "Portuguese", category: "verbs_past", difficulty: "easy" },
    { id: "pt_vpast8", text: "Vocês conseguiram", phonetic: "/vo.ˈses kõ.se.ˈɡi.ɾɐ̃w̃/", translation: "You all succeeded", language: "Portuguese", category: "verbs_past", difficulty: "medium" },
  ],
  verbs_future: [
    { id: "pt_vf1", text: "Eu comerei", phonetic: "/ew ko.me.ˈɾej/", translation: "I will eat", language: "Portuguese", category: "verbs_future", difficulty: "easy" },
    { id: "pt_vf2", text: "Nós falaremos", phonetic: "/nɔs fa.la.ˈɾe.mus/", translation: "We will speak", language: "Portuguese", category: "verbs_future", difficulty: "medium" },
    { id: "pt_vf3", text: "Eles entenderão", phonetic: "/ˈe.lis ẽ.tẽ.de.ˈɾɐ̃w̃/", translation: "They will understand", language: "Portuguese", category: "verbs_future", difficulty: "hard" },
    { id: "pt_vf4", text: "Ela conseguirá", phonetic: "/ˈɛ.lɐ kõ.se.ɡi.ˈɾa/", translation: "She will manage", language: "Portuguese", category: "verbs_future", difficulty: "medium" },
    { id: "pt_vf5", text: "Vocês escolherão", phonetic: "/vo.ˈses es.ko.ʎe.ˈɾɐ̃w̃/", translation: "You all will choose", language: "Portuguese", category: "verbs_future", difficulty: "medium" },
    { id: "pt_vf6", text: "Tu serás", phonetic: "/tu se.ˈɾas/", translation: "You will be", language: "Portuguese", category: "verbs_future", difficulty: "easy" },
    { id: "pt_vf7", text: "Eu terei terminado", phonetic: "/ew te.ˈɾej teɾ.mi.ˈna.du/", translation: "I will have finished", language: "Portuguese", category: "verbs_future", difficulty: "hard" },
    { id: "pt_vf8", text: "Nós iremos", phonetic: "/nɔs i.ˈɾe.mus/", translation: "We will go", language: "Portuguese", category: "verbs_future", difficulty: "easy" },
  ],
};

export const PORTUGUESE_TONGUE_TWISTERS: DuelWord[] = [
  { id: "pt_tt1", text: "O rato roeu a roupa do rei de Roma", phonetic: "/u ˈʁa.tu ʁo.ˈew ɐ ˈʁo.pɐ du ʁej dʒi ˈʁo.mɐ/", translation: "The rat gnawed the clothes of the king of Rome", language: "Portuguese", category: "mixed", difficulty: "medium" },
  { id: "pt_tt2", text: "Três pratos de trigo para três tigres tristes", phonetic: "/tɾes ˈpɾa.tus dʒi ˈtɾi.ɡu/", translation: "Three plates of wheat for three sad tigers", language: "Portuguese", category: "mixed", difficulty: "hard" },
  { id: "pt_tt3", text: "Pedro tem o peito preto, o peito de Pedro é preto", phonetic: "/ˈpe.dɾu tẽj u ˈpej.tu ˈpɾe.tu/", translation: "Pedro has a black chest, Pedro's chest is black", language: "Portuguese", category: "mixed", difficulty: "hard" },
  { id: "pt_tt4", text: "A aranha arranha a rã, a rã arranha a aranha", phonetic: "/ɐ a.ˈɾɐ.ɲɐ a.ˈʁɐ.ɲɐ ɐ ˈʁɐ̃/", translation: "The spider scratches the frog, the frog scratches the spider", language: "Portuguese", category: "mixed", difficulty: "medium" },
  { id: "pt_tt5", text: "O sabiá não sabia que o sábio sabia que o sabiá não sabia assobiar", phonetic: "/u sa.bi.ˈa nɐ̃w̃ sa.ˈbi.ɐ/", translation: "The thrush didn't know the sage knew the thrush couldn't whistle", language: "Portuguese", category: "mixed", difficulty: "hard" },
];
